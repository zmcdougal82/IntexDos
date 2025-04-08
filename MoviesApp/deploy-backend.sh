#!/bin/bash
# Script to deploy the backend with fixed code

# Configuration - Use the existing resource group and SQL server
RESOURCE_GROUP="MoviesAppRG"
LOCATION="westus"
SQL_SERVER_NAME="moviesapp-sql-79427"  # From previous deployment
SQL_DB_NAME="MoviesDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"  # Make sure this matches the original deployment
BACKEND_APP_NAME="moviesapp-api-fixed"
APP_SERVICE_PLAN="${BACKEND_APP_NAME}-plan"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/Backend/MoviesApp.API"

echo "===== BACKEND DEPLOYMENT SCRIPT ====="
echo "Script directory: $SCRIPT_DIR"
echo "Backend directory: $BACKEND_DIR"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Create App Service Plan (Windows-based for .NET 8 support)
echo "===== Creating App Service Plan ====="
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku FREE

# Create Web App for Backend
echo "===== Creating Azure Web App for Backend ====="
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $BACKEND_APP_NAME \
    --runtime "dotnet:8"

# Get SQL Connection String
echo "===== Setting Connection String for Web App ====="
SQL_CONNECTION_STRING=$(az sql db show-connection-string \
    --client ado.net \
    --server $SQL_SERVER_NAME \
    --name $SQL_DB_NAME \
    | sed "s/<username>/$SQL_ADMIN_USER/g" \
    | sed "s/<password>/$SQL_ADMIN_PASSWORD/g")

# Configure app settings for the backend
az webapp config connection-string set \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --connection-string-type SQLAzure \
    --settings DefaultConnection="$SQL_CONNECTION_STRING"

# Configure CORS to allow the storage account frontend
FRONTEND_URL="https://moviesappsa79595.z22.web.core.windows.net"
az webapp cors add \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --allowed-origins $FRONTEND_URL

# Build and publish backend
echo "===== Building and publishing backend ====="
cd "$BACKEND_DIR"
dotnet publish -c Release -o ./publish

# Deploy backend using zip deployment
echo "===== Deploying backend to Azure ====="
cd "$BACKEND_DIR/publish"
zip -r "$SCRIPT_DIR/backend-deploy.zip" .
cd "$SCRIPT_DIR"

az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --src backend-deploy.zip

# Get backend URL
BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
echo "===== Backend deployed to: $BACKEND_URL ====="

echo ""
echo "===== DEPLOYMENT SUMMARY ====="
echo "Resource Group: $RESOURCE_GROUP"
echo "Backend API URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "SQL Server: $SQL_SERVER_NAME.database.windows.net"
echo "SQL Database: $SQL_DB_NAME"
echo ""
echo "IMPORTANT: You'll need to update the frontend API URL in your code and redeploy"
echo "           to connect the frontend to the new backend URL."
