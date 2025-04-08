#!/bin/bash
# Script to update frontend API URL and redeploy

# Configuration
RESOURCE_GROUP="MoviesAppRG"
BACKEND_URL="https://moviesapp-api-fixed.azurewebsites.net"
STORAGE_ACCOUNT="moviesappsa79595"  # From previous deployment

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/Frontend/movies-client"

echo "===== FRONTEND UPDATE SCRIPT ====="
echo "Updating API URL to: $BACKEND_URL"
echo "Script directory: $SCRIPT_DIR"
echo "Frontend directory: $FRONTEND_DIR"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Update the API URL in the frontend code
echo "===== Updating API URL in frontend code ====="
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

# Display the frontend URL
FRONTEND_URL=$(az storage account show \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query "primaryEndpoints.web" \
    --output tsv)

echo ""
echo "===== FRONTEND UPDATE COMPLETE ====="
echo "Frontend URL: $FRONTEND_URL"
echo "Backend API URL: $BACKEND_URL"
echo ""
echo "Your application should now be fully connected."
