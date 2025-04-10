# macOS Deployment Guide for Movie Recommendation Service

This guide provides specific steps for deploying the Python recommendation service to Azure from a Mac.

## Prerequisites

1. **Install Azure CLI on macOS**:
   ```bash
   brew update && brew install azure-cli
   ```
   If you don't have Homebrew installed, install it first:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Python 3.10** (if not already installed):
   ```bash
   brew install python@3.10
   ```

## Deployment Steps

1. **Login to Azure CLI**:
   ```bash
   az login
   ```
   This will open a browser window for authentication.

2. **List your subscriptions**:
   ```bash
   az account list --output table
   ```

3. **Set the active subscription**:
   ```bash
   az account set --subscription "Your Subscription Name"
   ```

4. **Edit the deployment script**:
   Open the `deploy_to_azure.sh` script and update the configuration variables at the top:
   ```bash
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
   ```

5. **Run the deployment script**:
   ```bash
   cd /Users/zackmcdougal/Desktop/IntexDos/MoviesApp/Backend/RecommendationService
   ./deploy_to_azure.sh
   ```

6. **Test the deployment**:
   After deployment completes, the script will output the URL of your deployed service. 
   Test it by accessing the health endpoint:
   ```bash
   curl https://moviesapp-recommendations.azurewebsites.net/health
   ```

7. **Update your C# backend settings**:
   After successful deployment, update the `appsettings.json` file in your C# backend:
   ```json
   {
     "RecommendationService": {
       "Url": "https://moviesapp-recommendations.azurewebsites.net"
     }
   }
   ```
   
   Then deploy the updated C# backend to Azure:
   ```bash
   az webapp config appsettings set --name your-backend-app --resource-group moviesapp-rg --settings RecommendationService__Url=https://moviesapp-recommendations.azurewebsites.net
   ```

## Troubleshooting

### CORS Issues
If you experience CORS errors after deployment, ensure the `ALLOWED_ORIGINS` environment variable is correctly set to include your frontend URL:

```bash
az webapp config appsettings set \
  --name moviesapp-recommendations \
  --resource-group moviesapp-rg \
  --settings ALLOWED_ORIGINS=https://your-frontend-app.azurewebsites.net
```

### Database Connection Issues
Ensure the managed identity has been properly set up with the right permissions on your Azure SQL database.

To check managed identity settings:
```bash
az webapp identity show --name moviesapp-recommendations --resource-group moviesapp-rg
```

### Viewing Logs
To stream logs from your App Service:
```bash
az webapp log tail --name moviesapp-recommendations --resource-group moviesapp-rg
```

### Testing Locally before Deployment
Run the test script to verify your local environment:
```bash
python test_azure_deployment.py
```

## Azure CLI Cheat Sheet for macOS

| Command | Description |
|---------|-------------|
| `az login` | Log in to Azure |
| `az group list` | List all resource groups |
| `az webapp list` | List all App Services |
| `az webapp restart` | Restart an App Service |
| `az webapp deployment list` | List deployments |
| `az monitor app-insights component show` | Show Application Insights details |
