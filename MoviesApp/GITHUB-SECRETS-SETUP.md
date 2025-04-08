# Setting Up GitHub Secrets for CI/CD

For your GitHub Actions workflows to automatically deploy to Azure when you push changes, you need to set up a few secrets in your GitHub repository. This guide will walk you through the process.

## Required Secrets

1. **AZURE_WEBAPP_PUBLISH_PROFILE** - For backend deployment to Azure App Service
2. **AZURE_STORAGE_KEY** - For frontend deployment to Azure Storage

## Step 1: Generate Azure App Service Publish Profile

1. Open Azure Portal (https://portal.azure.com)
2. Navigate to your App Service (moviesapp-api-fixed)
3. In the left menu, select **Deployment Center**
4. Click on **Manage publish profile**
5. This will download a file with a `.publishsettings` extension

Alternatively, you can use the Azure CLI:

```bash
az webapp deployment list-publishing-profiles \
  --name moviesapp-api-fixed \
  --resource-group MoviesAppRG \
  --xml > publish_profile.xml
```

## Step 2: Get Azure Storage Account Key

1. Open Azure Portal (https://portal.azure.com)
2. Navigate to your Storage Account (moviesappsa79595)
3. In the left menu, select **Access keys**
4. Copy the key1 value

Alternatively, you can use the Azure CLI:

```bash
az storage account keys list \
  --account-name moviesappsa79595 \
  --resource-group MoviesAppRG \
  --query [0].value -o tsv
```

## Step 3: Add Secrets to GitHub Repository

1. Go to your GitHub repository (https://github.com/zmcdougal82/IntexDos)
2. Click on **Settings** tab
3. In the left sidebar, click on **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add the following secrets:

### For Backend Deployment:
- Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
- Value: *Paste the entire content of the publish profile XML file*

### For Frontend Deployment:
- Name: `AZURE_STORAGE_KEY`
- Value: *Paste the storage account key*

## Step 4: Test CI/CD Setup

After setting up the secrets, you can test your CI/CD pipeline:

1. Make a change to a backend file (e.g., a controller)
2. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Test backend CI/CD"
   git push origin main
   ```
3. Go to the "Actions" tab in your GitHub repository to see the workflow running
4. After completion, verify that your changes are deployed to Azure

## Troubleshooting

If your workflows fail, check the following:

1. **Secret Values**: Ensure your secrets are correctly copied without extra spaces or line breaks
2. **Permissions**: Check that your App Service and Storage Account allow deployment from external sources
3. **Azure Resources**: Confirm that the resource names in the workflow files match your actual Azure resources
4. **Resource Group**: Make sure the resource group name is correct in all commands

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure App Service Deployment](https://docs.microsoft.com/en-us/azure/app-service/deploy-github-actions)
- [Azure Storage Deployment](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website)
