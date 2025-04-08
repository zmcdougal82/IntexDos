# CI/CD Implementation for Movies App

This document explains how the Continuous Integration/Continuous Deployment (CI/CD) pipeline is set up for your Movies App. With this configuration, any changes you push to your GitHub repository will automatically be deployed to Azure.

## How It Works

Your CI/CD implementation uses GitHub Actions to automatically build and deploy your code when changes are pushed to the `main` branch. The workflows are configured to only run when changes are made to specific folders:

1. **Backend workflow**: Triggers when changes are made to files in `MoviesApp/Backend/**`
2. **Frontend workflow**: Triggers when changes are made to files in `MoviesApp/Frontend/**`

## Backend Deployment Process

The backend workflow (`backend-ci-cd.yml`) performs the following steps:

1. Checks out your code from the repository
2. Sets up the .NET 9.0 development environment
3. Restores NuGet packages
4. Builds the .NET API in Release mode
5. Publishes the API to a publish folder
6. Deploys the published files to Azure App Service using the publish profile stored in GitHub Secrets

The backend is deployed to: `https://moviesapp-api-fixed.azurewebsites.net`

## Frontend Deployment Process

The frontend workflow (`frontend-ci-cd.yml`) performs the following steps:

1. Checks out your code from the repository
2. Sets up Node.js environment
3. Installs dependencies using `npm ci`
4. Builds the React application using `npm run build`
5. Uploads the built files to Azure Storage using the storage key stored in GitHub Secrets
6. Attempts to purge the CDN cache (if configured)

The frontend is deployed to: `https://moviesappsa79595.z22.web.core.windows.net/`

## Required Secrets

The CI/CD pipelines are configured to use the following secrets that you've already added to your GitHub repository:

1. `AZURE_WEBAPP_PUBLISH_PROFILE`: Contains the deployment credentials for the Azure App Service
2. `AZURE_STORAGE_KEY`: Contains the access key for your Azure Storage account

## How to Test the CI/CD Pipeline

1. Make a small change to a file in the backend or frontend
2. Commit and push the change to the `main` branch:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```
3. Visit the "Actions" tab in your GitHub repository to see the workflow running
4. Once the workflow completes successfully, visit your application to verify the changes

## Troubleshooting

If deployments fail, check the following:

1. Verify that the GitHub Secrets are correctly configured
2. Look at the workflow logs in GitHub Actions to identify specific errors
3. Ensure that your code builds successfully locally
4. Check that the paths in the workflow files match your repository structure

## Additional Notes

- Pull Requests to the `main` branch will run the build steps but won't deploy to Azure
- Only pushes to the `main` branch will trigger deployments
- The workflows are configured to only run when relevant files are changed

With this configuration, your development process becomes more efficient as deployments are fully automated, allowing you to focus on developing features rather than manual deployment tasks.
