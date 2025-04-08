#!/bin/bash
# Comprehensive deployment script that fixes all issues

# Configuration
RESOURCE_GROUP="MoviesAppRG"
SQL_SERVER_NAME="moviesapp-sql-79427"
SQL_DB_NAME="MoviesDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"
BACKEND_APP_NAME="moviesapp-api-fixed"
STORAGE_ACCOUNT="moviesappsa79595"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/Backend/MoviesApp.API"
FRONTEND_DIR="$SCRIPT_DIR/Frontend/movies-client"

echo "===== FIXED DEPLOYMENT SCRIPT ====="
echo "This script addresses all issues with the previous deployment"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Build and publish the backend
echo "===== Building and publishing backend ====="
cd "$BACKEND_DIR"
dotnet restore
dotnet publish -c Release -o ./publish

# Create a ZIP file for deployment
echo "===== Creating deployment package ====="
cd ./publish
zip -r "$SCRIPT_DIR/backend-deploy.zip" .
cd "$SCRIPT_DIR"

# Deploy to Azure Web App
echo "===== Deploying to Azure Web App ====="
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --src backend-deploy.zip

# Configure CORS for the Web App
echo "===== Configuring CORS ====="
FRONTEND_URL="https://${STORAGE_ACCOUNT}.z22.web.core.windows.net"
az webapp cors add \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --allowed-origins $FRONTEND_URL

# Update the frontend API URL
echo "===== Updating frontend API URL ====="
BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
sed -i.bak "s|const API_URL = '.*';|const API_URL = '$BACKEND_URL/api';|g" "$FRONTEND_DIR/src/services/api.ts"

# Build the frontend
echo "===== Building frontend ====="
cd "$FRONTEND_DIR"
npm install
npm run build

# Deploy the frontend to Azure Storage
echo "===== Deploying frontend to Azure Storage ====="
az storage blob upload-batch \
    --account-name $STORAGE_ACCOUNT \
    --source "$FRONTEND_DIR/dist" \
    --destination '$web' \
    --overwrite

echo ""
echo "===== DEPLOYMENT COMPLETE ====="
echo "Resource Group: $RESOURCE_GROUP"
echo "Backend API: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""
echo "SWAGGER API DOCUMENTATION: $BACKEND_URL/swagger"
echo ""
echo "To access database information:"
echo "Server: $SQL_SERVER_NAME.database.windows.net"
echo "Database: $SQL_DB_NAME"
echo "Username: $SQL_ADMIN_USER"
echo ""
echo "Your application is now ready to use!"
