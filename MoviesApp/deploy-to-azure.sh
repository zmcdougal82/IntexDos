#!/bin/bash
# Azure deployment script for MoviesApp

# Configuration - Update these variables
RESOURCE_GROUP="MoviesApp-RG"
LOCATION="eastus"
SQL_SERVER_NAME="moviesapp-sql-server"
SQL_DB_NAME="MovieDb"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"  # Change this to a secure password
BACKEND_APP_NAME="moviesapp-api"
FRONTEND_APP_NAME="moviesapp-frontend"
FRONTEND_APP_LOCATION="MoviesApp/Frontend/movies-client"
FRONTEND_OUTPUT_LOCATION="dist"

# Login to Azure
echo "Logging into Azure..."
az login

# Create Resource Group
echo "Creating Resource Group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create SQL Server and Database
echo "Creating SQL Server: $SQL_SERVER_NAME"
az sql server create \
    --name $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --admin-user $SQL_ADMIN_USER \
    --admin-password $SQL_ADMIN_PASSWORD

# Configure firewall to allow Azure services
echo "Configuring SQL Server firewall..."
az sql server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER_NAME \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Create SQL Database
echo "Creating SQL Database: $SQL_DB_NAME"
az sql db create \
    --resource-group $RESOURCE_GROUP \
    --server $SQL_SERVER_NAME \
    --name $SQL_DB_NAME \
    --edition Basic \
    --capacity 5

# Get SQL Connection String
SQL_CONNECTION_STRING=$(az sql db show-connection-string \
    --client ado.net \
    --server $SQL_SERVER_NAME \
    --name $SQL_DB_NAME \
    | sed "s/<username>/$SQL_ADMIN_USER/g" \
    | sed "s/<password>/$SQL_ADMIN_PASSWORD/g")

echo "SQL Connection String: $SQL_CONNECTION_STRING"

# Update appsettings.json with connection string
echo "Updating connection string in backend settings..."
sed -i "s|\"AzureSqlConnection\": \".*\"|\"AzureSqlConnection\": \"$SQL_CONNECTION_STRING\"|g" MoviesApp/Backend/MoviesApp.API/appsettings.json

# Create App Service Plan for backend
echo "Creating App Service Plan for backend..."
az appservice plan create \
    --name ${BACKEND_APP_NAME}-plan \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku B1 \
    --is-linux

# Create App Service for backend
echo "Creating App Service for backend..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan ${BACKEND_APP_NAME}-plan \
    --name $BACKEND_APP_NAME \
    --runtime "dotnet:8"

# Configure app settings for the backend
echo "Configuring backend app settings..."
az webapp config connection-string set \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --connection-string-type SQLAzure \
    --settings DefaultConnection="$SQL_CONNECTION_STRING"

# Build and publish the backend
echo "Building and publishing backend..."
cd MoviesApp/Backend/MoviesApp.API
dotnet publish -c Release
cd ../../..

# Deploy the backend
echo "Deploying backend to Azure App Service..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --src MoviesApp/Backend/MoviesApp.API/bin/Release/net8.0/publish.zip

# Get backend URL for frontend configuration
BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
echo "Backend deployed to: $BACKEND_URL"

# Update frontend API URL
echo "Updating frontend API configuration..."
sed -i "s|const API_URL = '.*';|const API_URL = '$BACKEND_URL/api';|g" MoviesApp/Frontend/movies-client/src/services/api.ts

# Build the frontend
echo "Building frontend..."
cd MoviesApp/Frontend/movies-client
npm install
npm run build
cd ../../..

# Create Static Web App for frontend
echo "Creating and deploying Static Web App for frontend..."
az staticwebapp create \
    --name $FRONTEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --source $FRONTEND_APP_LOCATION \
    --output-location $FRONTEND_OUTPUT_LOCATION \
    --branch main \
    --app-artifact-location "dist" \
    --login-with-github

echo "Deployment complete!"
echo "Backend API URL: $BACKEND_URL"
echo "Frontend will be available at the URL shown above."
echo "Note: You might need to configure CORS on the backend to allow requests from the frontend domain."
