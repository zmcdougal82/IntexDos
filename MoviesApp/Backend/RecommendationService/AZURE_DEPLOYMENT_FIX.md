# Fixing Azure Deployment Issues

## Current Issue

The GitHub Actions workflow is failing with the error:

```
Deployment Failed, Error: Publish profile is invalid for app-name and slot-name provided. Provide correct publish profile credentials for app.
```

This indicates that the publish profile credentials used in the GitHub workflow are either expired or invalid.

## How to Fix

### 1. Generate a new Publish Profile

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service "moviesapp-recommendation-service"
3. In the left menu, click on "Overview"
4. Click on "Get publish profile" button (this will download a .PublishSettings file)

### 2. Update the GitHub Secret

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Find the secret named `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Click "Update"
5. Open the downloaded .PublishSettings file in a text editor
6. Copy the entire contents of this file
7. Paste the content into the GitHub secret value field
8. Click "Save"

### 3. Re-run the GitHub Action

1. Go to the "Actions" tab in your repository
2. Find the failed workflow run
3. Click "Re-run all jobs" or manually trigger a new workflow run using the "workflow_dispatch" event

## Additional Notes

- Publish profiles typically contain credentials that expire periodically
- If you've recently regenerated your App Service deployment credentials, you'll need to update the publish profile
- The App Service name ("moviesapp-recommendation-service") and slot name ("production") in the workflow file must match what's defined in Azure

## Verifying the Deployment

After the workflow runs successfully:

1. Wait a few minutes for the deployment to complete
2. Test the service at: https://moviesapp-recommendation-service.azurewebsites.net/health
3. Try to access a recommendation to verify functionality, e.g.:
   - https://moviesapp-recommendation-service.azurewebsites.net/recommendations/123
