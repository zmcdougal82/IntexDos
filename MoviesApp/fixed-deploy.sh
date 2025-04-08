#!/bin/bash
# Fixed Azure deployment script for MoviesApp

# Configuration - Update these with your own values
RESOURCE_GROUP="MoviesAppRG"
LOCATION="westus"  # Changed region to try avoiding quota issues
SQL_SERVER_NAME="moviesapp-sql-$(date +%s | tail -c 6)"  # Random suffix to ensure uniqueness
SQL_DB_NAME="MoviesDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"  # Change this to a secure password
BACKEND_APP_NAME="moviesapp-api-$(date +%s | tail -c 6)"  # Random suffix
FRONTEND_APP_NAME="moviesapp-frontend-$(date +%s | tail -c 6)"  # Random suffix

# Fix path issues - script should work from any directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/Backend/MoviesApp.API"
FRONTEND_DIR="$SCRIPT_DIR/Frontend/movies-client"

echo "===== FIXED DEPLOYMENT SCRIPT ====="
echo "Script directory: $SCRIPT_DIR"
echo "Backend directory: $BACKEND_DIR"
echo "Frontend directory: $FRONTEND_DIR"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Create Resource Group
echo "===== Creating Resource Group: $RESOURCE_GROUP ====="
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create SQL Server
echo "===== Creating SQL Server: $SQL_SERVER_NAME ====="
az sql server create \
    --name $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --admin-user $SQL_ADMIN_USER \
    --admin-password $SQL_ADMIN_PASSWORD \
    --enable-public-network true

if [ $? -ne 0 ]; then
    echo "Error creating SQL Server. Continuing with deployment..."
else
    # Configure firewall to allow Azure services
    echo "===== Configuring SQL Server firewall ====="
    az sql server firewall-rule create \
        --resource-group $RESOURCE_GROUP \
        --server $SQL_SERVER_NAME \
        --name AllowAzureServices \
        --start-ip-address 0.0.0.0 \
        --end-ip-address 0.0.0.0

    # Create SQL Database
    echo "===== Creating SQL Database: $SQL_DB_NAME ====="
    az sql db create \
        --resource-group $RESOURCE_GROUP \
        --server $SQL_SERVER_NAME \
        --name $SQL_DB_NAME \
        --service-objective Basic
fi

# Create App Service Plan
echo "===== Creating App Service Plan ====="
az appservice plan create \
    --name "${BACKEND_APP_NAME}-plan" \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku FREE \
    --is-linux

if [ $? -ne 0 ]; then
    echo "Error creating App Service Plan. Trying Windows plan..."
    az appservice plan create \
        --name "${BACKEND_APP_NAME}-plan" \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku FREE
fi

# Create Web App for Backend
echo "===== Creating Azure Web App for Backend ====="
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan "${BACKEND_APP_NAME}-plan" \
    --name $BACKEND_APP_NAME \
    --runtime "dotnet:8"

# Get SQL Connection String if SQL Server was created
if az sql server show --name $SQL_SERVER_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
    SQL_CONNECTION_STRING=$(az sql db show-connection-string \
        --client ado.net \
        --server $SQL_SERVER_NAME \
        --name $SQL_DB_NAME \
        | sed "s/<username>/$SQL_ADMIN_USER/g" \
        | sed "s/<password>/$SQL_ADMIN_PASSWORD/g")
    
    echo "===== Setting Connection String for Web App ====="
    az webapp config connection-string set \
        --resource-group $RESOURCE_GROUP \
        --name $BACKEND_APP_NAME \
        --connection-string-type SQLAzure \
        --settings DefaultConnection="$SQL_CONNECTION_STRING"
else
    echo "Skipping SQL connection string setup as SQL Server wasn't created."
fi

# Build and publish .NET 8 backend
echo "===== Building and publishing backend ====="
cd "$BACKEND_DIR"
dotnet publish -c Release -o ./publish

# Deploy backend
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

# Update frontend API URL
echo "===== Updating frontend configuration ====="
sed -i.bak "s|const API_URL = '.*';|const API_URL = '$BACKEND_URL/api';|g" "$FRONTEND_DIR/src/services/api.ts"

# Build frontend
echo "===== Building frontend ====="
cd "$FRONTEND_DIR"
npm install
npm run build

# Create Static Web App
echo "===== Creating Static Web App ====="
az staticwebapp create \
    --name $FRONTEND_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Free

if [ $? -ne 0 ]; then
    echo "Error creating Static Web App. Trying alternative deployment method..."
    # Create a storage account for static website hosting as an alternative
    STORAGE_ACCOUNT="moviesappsa$(date +%s | tail -c 6)"
    az storage account create \
        --name $STORAGE_ACCOUNT \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION \
        --sku Standard_LRS \
        --kind StorageV2 \
        --https-only true
    
    az storage blob service-properties update \
        --account-name $STORAGE_ACCOUNT \
        --static-website \
        --index-document index.html \
        --404-document index.html
    
    # Upload frontend build to storage account
    az storage blob upload-batch \
        --account-name $STORAGE_ACCOUNT \
        --source "$FRONTEND_DIR/dist" \
        --destination '$web'
    
    # Get frontend URL
    FRONTEND_URL=$(az storage account show \
        --name $STORAGE_ACCOUNT \
        --resource-group $RESOURCE_GROUP \
        --query "primaryEndpoints.web" \
        --output tsv)
    
    echo "===== Frontend deployed to: $FRONTEND_URL ====="
else
    echo "Static Web App created successfully."
    FRONTEND_URL="https://$(az staticwebapp show --name $FRONTEND_APP_NAME --resource-group $RESOURCE_GROUP --query 'defaultHostname' -o tsv)"
    echo "===== Frontend will be available at: $FRONTEND_URL ====="
    
    echo "Deploying frontend files to Static Web App..."
    # For Static Web Apps, typically you'd connect to GitHub for CI/CD
    echo "To complete frontend deployment, please connect this Static Web App to your GitHub repository."
    echo "Visit Azure Portal > Resource Group > $RESOURCE_GROUP > $FRONTEND_APP_NAME > Deployment > GitHub Actions"
fi

echo ""
echo "===== DEPLOYMENT SUMMARY ====="
echo "Resource Group: $RESOURCE_GROUP"
echo "Backend API URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "SQL Server (if created): $SQL_SERVER_NAME.database.windows.net"
echo "SQL Database: $SQL_DB_NAME"
echo "SQL Admin: $SQL_ADMIN_USER"
echo ""
echo "NOTE: The frontend deployment may require additional steps to connect to GitHub."
echo "See the Azure portal for more details."
