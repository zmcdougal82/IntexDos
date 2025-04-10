#!/bin/bash
# Script to deploy the Movie Recommendation Service to Azure using Azure CLI
# Usage: ./deploy_to_azure.sh

# Stop on errors
set -e

echo "=========================================================="
echo "== Azure CLI Deployment for Movie Recommendation Service =="
echo "=========================================================="

# Configuration Variables - Edit these values
SUBSCRIPTION_NAME="Your Azure Subscription Name"
RESOURCE_GROUP="moviesapp-rg"
LOCATION="eastus"
APP_SERVICE_PLAN="moviesapp-plan"
APP_SERVICE_NAME="moviesapp-recommendations"
SQL_SERVER="your-sql-server-name"
SQL_DB="your-db-name"
SQL_USERNAME="your-sql-username"
SQL_PASSWORD="your-sql-password"
FRONTEND_URL="https://your-frontend-app.azurewebsites.net"
APP_INSIGHTS_NAME="moviesapp-insights"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo "Logging in to Azure..."
az login

echo "Setting active subscription..."
az account set --subscription "$SUBSCRIPTION_NAME"

echo "Creating resource group if it doesn't exist..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku B1 \
    --is-linux

echo "Creating Python App Service..."
az webapp create \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime "PYTHON:3.10"

echo "Creating Application Insights..."
INSTRUMENTATION_KEY=$(az monitor app-insights component create \
    --app $APP_INSIGHTS_NAME \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP \
    --query instrumentationKey \
    --output tsv)

echo "Enabling system-assigned managed identity for App Service..."
PRINCIPAL_ID=$(az webapp identity assign \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --query principalId \
    --output tsv)

echo "Setting App Service configuration..."
az webapp config set \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "python app.py"

echo "Configuring environment variables..."
az webapp config appsettings set \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        DB_SERVER="$SQL_SERVER.database.windows.net" \
        DB_NAME=$SQL_DB \
        ALLOWED_ORIGINS=$FRONTEND_URL \
        RECOMMENDATIONS_OUTPUT_PATH="/home/site/wwwroot/static/homeRecommendations.json" \
        APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true

# If you're using SQL username/password instead of managed identity
# Uncomment these lines:
#az webapp config appsettings set \
#    --name $APP_SERVICE_NAME \
#    --resource-group $RESOURCE_GROUP \
#    --settings \
#        DB_USERNAME=$SQL_USERNAME \
#        DB_PASSWORD=$SQL_PASSWORD

echo "Configuring CORS for the App Service..."
az webapp cors add \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --allowed-origins $FRONTEND_URL

echo "Deploying recommendation service code to App Service..."
# Deploy from local directory
cd "$(dirname "$0")"  # Navigate to the script directory
zip -r deployment.zip . -x "*.git*" "*.ipynb_checkpoints*" "*__pycache__*" "*.pytest_cache*"
az webapp deployment source config-zip \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --src deployment.zip
rm deployment.zip

echo "Granting SQL Database access to the managed identity..."
# Note: You'll need to connect to your SQL Database and run this SQL command:
echo "Run the following SQL commands in your database:"
echo "CREATE USER [$APP_SERVICE_NAME] FROM EXTERNAL PROVIDER;"
echo "ALTER ROLE db_datareader ADD MEMBER [$APP_SERVICE_NAME];"
echo "ALTER ROLE db_datawriter ADD MEMBER [$APP_SERVICE_NAME];"

echo "Getting the App Service URL..."
APP_URL=$(az webapp show \
    --name $APP_SERVICE_NAME \
    --resource-group $RESOURCE_GROUP \
    --query defaultHostName \
    --output tsv)

echo "Updating C# backend to use new recommendation service URL..."
# Update the settings in the appsettings.json file of the C# backend
cat > appsettings_update.json << EOF
{
  "RecommendationService": {
    "Url": "https://$APP_URL"
  }
}
EOF

echo "Deploy the C# backend appsettings update using:"
echo "az webapp config appsettings set --name your-backend-app --resource-group $RESOURCE_GROUP --settings RecommendationService__Url=https://$APP_URL"

echo "Testing the deployed API..."
echo "Health check: curl https://$APP_URL/health"

echo "==========================================="
echo "Deployment complete!"
echo "Recommendation Service URL: https://$APP_URL"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Update the C# backend to use the new URL"
echo "2. Verify recommendations are working correctly"
echo "3. Configure CI/CD using the GitHub workflow"
