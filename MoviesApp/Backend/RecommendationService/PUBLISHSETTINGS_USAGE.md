# Using PublishSettings File for Azure Deployment

## Overview

This guide explains how to use one of your downloaded `PublishSettings` files to update the GitHub Secret needed for deployment.

## What is a PublishSettings File?

A PublishSettings file contains deployment credentials for your Azure App Service. As seen in the file we examined, it includes:

- Deployment endpoints (both Web Deploy and FTP)
- Authentication details (username and password)
- Connection information for the Azure environment
- Multiple deployment method options (MSDeploy, FTP, ZipDeploy)

## How to Use the PublishSettings File

1. Take one of the existing PublishSettings files from your Downloads folder:
   - `moviesapp-recommendation-service.PublishSettings`
   - `moviesapp-recommendation-service (1).PublishSettings`
   - `moviesapp-recommendation-service (3).PublishSettings`

2. Open the file in a text editor (VS Code, Notepad, etc.)

3. Copy the **entire content** of the file exactly as is - this XML content contains all the necessary credentials

4. Go to your GitHub repository:
   - Navigate to "Settings" > "Secrets and variables" > "Actions"
   - Find the secret named `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Click "Update" and paste the entire XML content into the value field
   - Save the changes

5. Trigger the deployment:
   - Go to the "Actions" tab in your repository
   - Select the "Deploy to Azure" workflow
   - Click "Run workflow" and select the main branch

## Important Notes

- The workflow has been updated to use the correct secret name (`AZURE_WEBAPP_PUBLISH_PROFILE`)
- We've also updated the backend CI/CD workflow to exclude the RecommendationService directory, so it won't trigger when you edit recommendation code
- After updating the secret and running the workflow, confirm deployment by checking:
  - https://moviesapp-recommendation-service.azurewebsites.net/health

## Credentials Security

The PublishSettings file contains sensitive credentials. Always:
- Be careful where you store these files
- Don't commit them to source control
- Delete downloaded copies after use
- Treat GitHub secrets securely
