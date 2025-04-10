# Deploying the Movie Recommendation Service to Azure

This guide provides step-by-step instructions for deploying the Python-based movie recommendation service to Azure App Service.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed locally, or use Azure Cloud Shell
- Git (if deploying via GitHub)

## Step 1: Create an Azure App Service

1. **Login to Azure Portal**
   - Visit [https://portal.azure.com](https://portal.azure.com) and sign in

2. **Create a Resource Group** (if you don't already have one)
   - Click "Create a resource"
   - Search for "Resource Group"
   - Click "Create"
   - Fill in the subscription, resource group name, and region
   - Click "Review + create", then "Create"

3. **Create an App Service**
   - Click "Create a resource"
   - Search for "Web App"
   - Click "Create"
   - Fill in the following details:
     - Subscription: Your subscription
     - Resource Group: Use the one you created earlier
     - Name: `moviesapp-recommendations` (or your preferred name)
     - Publish: Code
     - Runtime stack: Python 3.10
     - Operating System: Linux
     - Region: Choose a region close to your Azure SQL database
     - App Service Plan: Create a new plan (at least B1 for production)
   - Click "Review + create", then "Create"

## Step 2: Configure the Azure SQL Database Connection

1. **Set up Managed Identity** (recommended for secure database access)
   - In your App Service, go to "Identity" under Settings
   - Set the "Status" to "On" for System assigned identity
   - Click "Save"
   - Take note of the Object ID

2. **Configure SQL Database Permissions**
   - Go to your Azure SQL Server in the portal
   - Click on "SQL databases" and select your database
   - Click on "Query editor" and log in
   - Run the following SQL command (replace `<OBJECT_ID>` with your App's Object ID):
   
   ```sql
   CREATE USER [moviesapp-recommendations] FROM EXTERNAL PROVIDER;
   ALTER ROLE db_datareader ADD MEMBER [moviesapp-recommendations];
   ALTER ROLE db_datawriter ADD MEMBER [moviesapp-recommendations];
   ```

## Step 3: Configure Application Settings

1. **Set Environment Variables**
   - In your App Service, go to "Configuration" under Settings
   - Add the following application settings:
   
   ```
   DB_SERVER=your-azure-sql-server.database.windows.net
   DB_NAME=your-database-name
   DB_USERNAME=your-username  # Only needed if not using managed identity
   DB_PASSWORD=your-password  # Only needed if not using managed identity
   ALLOWED_ORIGINS=https://your-frontend-domain.azurewebsites.net
   RECOMMENDATIONS_OUTPUT_PATH=/home/site/wwwroot/static/homeRecommendations.json
   ```
   
   - If using Application Insights (recommended):
   ```
   APPINSIGHTS_INSTRUMENTATIONKEY=your-app-insights-key
   ```
   
   - Click "Save"

2. **Configure Deployment Settings**
   - Go to "Deployment Center" under Deployment
   - Choose your source (Azure DevOps, GitHub, Bitbucket, etc.)
   - Follow the wizard to set up continuous deployment from your repository

## Step 4: Deploy the Application

### Option 1: Deploy using Azure CLI

1. **Prepare your code**
   - Navigate to your recommendation service directory
   - Make sure all necessary files are in place (app.py, requirements.txt, etc.)

2. **Deploy to Azure**
   - Open a terminal and run:
   
   ```bash
   # Login to Azure
   az login
   
   # Set the deployment source (local directory)
   az webapp deployment source config-local-git --name moviesapp-recommendations --resource-group your-resource-group
   
   # Get the deployment URL
   az webapp deployment list-publishing-profiles --name moviesapp-recommendations --resource-group your-resource-group --query "[?publishMethod=='MSDeploy'].publishUrl" -o tsv
   
   # Add the Azure remote to your Git repository
   git remote add azure <publishing-url>
   
   # Push your code to Azure
   git push azure master
   ```

### Option 2: Deploy using GitHub Actions

1. **Set up GitHub Actions workflow**
   - Create a `.github/workflows` directory in your repository
   - Create a file named `azure-deploy.yml` with the following content:
   
   ```yaml
   name: Deploy to Azure
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       
       steps:
       - uses: actions/checkout@v2
       
       - name: Set up Python
         uses: actions/setup-python@v2
         with:
           python-version: '3.10'
           
       - name: Install dependencies
         run: |
           python -m pip install --upgrade pip
           pip install -r MoviesApp/Backend/RecommendationService/requirements.txt
           
       - name: Deploy to Azure
         uses: azure/webapps-deploy@v2
         with:
           app-name: 'moviesapp-recommendations'
           publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
           package: MoviesApp/Backend/RecommendationService
   ```
   
2. **Add the publish profile to GitHub secrets**
   - In Azure portal, go to your App Service
   - Click "Get publish profile" and download the file
   - In your GitHub repository, go to Settings > Secrets
   - Create a new secret named `AZURE_WEBAPP_PUBLISH_PROFILE` with the content from the downloaded file

## Step 5: Verify Deployment

1. **Check Deployment Status**
   - In Azure portal, go to your App Service
   - Check the "Deployment Center" for deployment status
   - View "Log stream" to see runtime logs

2. **Test the API Endpoints**
   - Open a browser and navigate to:
     - `https://moviesapp-recommendations.azurewebsites.net/health`
   - You should see a successful response indicating the service is running

## Step 6: Update C# Backend to Use Azure App Service

1. **Update AppSettings.json**

In your C# backend's `appsettings.json` file, add or update the following:

```json
{
  "RecommendationService": {
    "Url": "https://moviesapp-recommendations.azurewebsites.net"
  }
}
```

2. **Deploy the Updated C# Backend**
   - Deploy your updated C# backend to Azure

## Troubleshooting

1. **Check App Service Logs**
   - In Azure portal, go to your App Service
   - Click on "Log stream" to see real-time logs
   - Check "Diagnose and solve problems" for more detailed troubleshooting

2. **Common Issues**
   - **CORS Errors**: Make sure your ALLOWED_ORIGINS includes your frontend domain
   - **Database Connection Issues**: Verify the connection string and permissions
   - **Missing Modules**: Check if all dependencies are listed in requirements.txt
   - **Application Insights Not Working**: Verify the instrumentation key is correct

3. **Restart the App Service**
   - Sometimes a simple restart can resolve issues
   - Click "Restart" in the Overview page of your App Service

## Monitoring

1. **Set Up Application Insights** (if not already done)
   - In Azure portal, go to your App Service
   - Click on "Application Insights" under Settings
   - Enable Application Insights and create a new resource or use an existing one
   - Click "Apply"

2. **View Application Insights Dashboard**
   - Go to the created Application Insights resource
   - Explore metrics, failures, performance, and logs

## Scaling

If your recommendation service needs more resources:

1. **Scale Up** (more powerful hardware)
   - Go to your App Service Plan
   - Click on "Scale up (App Service plan)"
   - Select a higher tier like P1v2 or P2v2
   - Click "Apply"

2. **Scale Out** (more instances)
   - Go to your App Service Plan
   - Click on "Scale out (App Service plan)"
   - Set the instance count (e.g., 2-3 instances)
   - Click "Save"
