# GitHub CI/CD Setup Guide for Movies App

This guide explains how to set up Continuous Integration/Continuous Deployment (CI/CD) for the Movies App using GitHub Actions.

## Prerequisites

- A GitHub account
- A GitHub repository for your project
- Azure subscription
- Azure CLI installed locally

## Step 1: Initialize Git Repository

```bash
cd MoviesApp
git init
git add .
git commit -m "Initial commit"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Follow GitHub's instructions to push your existing repository:

```bash
git remote add origin https://github.com/yourusername/movies-app.git
git branch -M main
git push -u origin main
```

## Step 3: Set Up GitHub Secrets

To allow GitHub Actions to deploy to Azure, you need to set up repository secrets:

1. Navigate to your GitHub repository
2. Go to Settings > Secrets and variables > Actions
3. Add the following secrets:

### For Backend Deployment

1. Create Azure publish profile:
```bash
az webapp deployment list-publishing-profiles --name moviesapp-api-fixed --resource-group MoviesAppRG --xml > publish_profile.xml
```

2. Add the contents of `publish_profile.xml` as a GitHub secret named `AZURE_WEBAPP_PUBLISH_PROFILE`

### For Frontend Deployment

1. Create a Static Web App deployment token:
```bash
az staticwebapp secrets list --name moviesappsa79595 --query properties.apiKey --output tsv
```

2. Add this token as a GitHub secret named `AZURE_STATIC_WEB_APPS_API_TOKEN`

## Step 4: Existing Workflow Files

Your project already has two workflow files:

1. `.github/workflows/backend-ci-cd.yml` for backend deployment
2. `.github/workflows/frontend-ci-cd.yml` for frontend deployment

Review these files to ensure they reference the correct secrets, branch names, and deployment targets.

## Step 5: Trigger Deployments

With everything set up, deployments will be triggered based on the workflow settings:

- **Backend**: Typically triggered on pushes to `main` branch in the `/Backend` directory
- **Frontend**: Typically triggered on pushes to `main` branch in the `/Frontend` directory

These settings can be customized in the workflow files.

## Step 6: Monitor Deployments

After pushing changes to GitHub:

1. Go to your repository's "Actions" tab
2. Watch the workflows execute
3. Check for successful completion
4. Verify the changes are live on your Azure websites

## Troubleshooting

If deployments fail, check:

1. GitHub Actions logs for specific error messages
2. Azure portal for resource status
3. Ensure all secrets are correctly configured
4. Verify Azure resources have the necessary permissions

## Development Best Practices

1. Use feature branches for development
2. Create pull requests for code review
3. Only merge to main when code is ready for production
4. Add automated tests to your CI pipeline

This CI/CD setup ensures that every time you push changes to GitHub, your application will be automatically deployed to Azure, maintaining consistency between your codebase and production environment.
