# Azure Deployment Guide for MoviesApp

This guide explains how to deploy the MoviesApp (.NET 8 backend and React frontend) to Azure.

## Understanding the Previous Deployment Errors

When trying to deploy with the original script, we encountered several issues:

1. **Path Resolution**: The script used relative paths that didn't work when executed from a different directory
2. **Framework Version**: The deployment targeted .NET 9, but you wanted .NET 8
3. **SQL Server Creation**: The SQL server creation was interrupted
4. **Static Web App Deployment**: The command had incorrect parameters

## Improvements in the Fixed Deployment Script

The `fixed-deploy.sh` script makes several improvements:

1. **Path Resolution**: Uses absolute paths based on script location
2. **Framework Version**: Targets .NET 8 explicitly (updated in the csproj file)
3. **Error Handling**: Continues deployment even if some Azure resources fail to create
4. **Resource Names**: Adds timestamp-based suffixes to ensure unique resource names
5. **Alternative Deployment**: Falls back to Storage Account if Static Web App fails

## Steps to Deploy

1. **Make sure the script is executable**:
   ```bash
   chmod +x MoviesApp/fixed-deploy.sh
   ```

2. **Run the fixed deployment script**:
   ```bash
   cd MoviesApp
   ./fixed-deploy.sh
   ```

3. **Follow the authentication process in your browser when prompted**

4. **Review the deployed resources in the Azure Portal**:
   - Navigate to the Azure Portal: https://portal.azure.com
   - Go to Resource Groups
   - Find the "MoviesAppRG" resource group

## Azure Resources Created

The script will create these resources:

1. **Resource Group**: MoviesAppRG (container for all resources)
2. **SQL Server & Database**: For persistent data storage
3. **App Service Plan**: Hosting plan for the backend
4. **Web App**: Hosts the .NET 8 API backend
5. **Static Web App or Storage Account**: Hosts the React frontend

## Deployment Options and Configuration

The script uses these default settings:

- **Region**: westus (changed from eastus to avoid quota issues)
- **SQL Server Admin**: sqladmin / P@ssw0rd123! (Change this in production!)
- **App Service Plan**: FREE tier (sufficient for testing)

## Troubleshooting

If you encounter any issues during deployment:

1. **Check Azure Subscription Limits**: Your account may have quota limits
2. **Check Resource Names**: Ensure no naming conflicts
3. **Region Availability**: Try a different Azure region
4. **Runtime Support**: Verify the App Service supports .NET 8 (we've updated the csproj file)

## Verifying Deployment

Once deployed, you'll receive URLs for:

- **Backend API**: https://{app-name}.azurewebsites.net
- **Frontend**: Either a Static Web App URL or Storage Account URL

## Accessing Your Application

Your deployed MoviesApp will have:

- **Frontend URL**: Where users can access the application
- **Backend API URL**: Used by the frontend (automatically configured in the deployment)
- **Database**: Azure SQL Database (accessed by the backend through connection string)

## Important Security Note

For a production deployment, make sure to:

1. **Change the SQL Server password** in the script
2. **Configure proper authentication** for both frontend and backend
3. **Enable HTTPS** and secure all endpoints
4. **Apply proper CORS settings** in your backend application
