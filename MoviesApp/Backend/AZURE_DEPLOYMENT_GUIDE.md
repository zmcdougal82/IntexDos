# Azure API Deployment Guide

This guide explains how to deploy your API changes to Azure, specifically focusing on fixing the password reset functionality.

## The Issue

Based on our investigation, we've identified that password reset emails are being sent successfully (as shown in the SparkPost dashboard), but they aren't working properly due to configuration issues in the deployed API.

Specifically:

1. The production API is using a different base URL for password reset links than your actual frontend app URL
2. Production may be using different SparkPost settings than we've configured locally

## Deployment Steps

### 1. Update Configuration Files

We've already updated the local configuration files with the correct settings. The key changes were:

1. In `appsettings.Production.json`:
   - Added `AppSettings:BaseUrl` pointing to your actual frontend URL
   - Updated SparkPost configuration with the correct API key and sender email

```json
{
  "AppSettings": {
    "BaseUrl": "https://moviesappsa79595.z22.web.core.windows.net"
  },
  "SparkPost": {
    "ApiKey": "aecf07103eecf75d6ee809bb0e19a2f7de099dba",
    "ApiUrl": "api.sparkpost.com",
    "SenderEmail": "noreply@mail.cineniche.co",
    "SenderName": "CineNiche"
  }
}
```

### 2. Build the API for Production

```bash
cd MoviesApp/Backend/MoviesApp.API
dotnet publish -c Release
```

This will create a production build in the `publish` directory.

### 3. Deploy to Azure

You have two options for deployment:

#### Option A: Deploy using Azure CLI

If you have the Azure CLI installed and are logged in:

```bash
cd MoviesApp/Backend/MoviesApp.API
az webapp deploy --resource-group YOUR_RESOURCE_GROUP --name moviesapp-api-fixed --src-path ./publish
```

Replace `YOUR_RESOURCE_GROUP` with your actual Azure resource group name.

#### Option B: Deploy via Azure Portal

1. Zip the contents of the `publish` directory:
   ```bash
   cd MoviesApp/Backend/MoviesApp.API/publish
   zip -r ../api-deploy.zip .
   ```

2. Go to the Azure Portal
3. Navigate to your App Service (moviesapp-api-fixed)
4. Go to "Deployment Center"
5. Choose "Manual Deployment" -> "ZIP Deploy"
6. Upload the `api-deploy.zip` file

### 4. Update Azure App Settings (alternative method)

If you don't want to redeploy the entire API, you can just update the configuration settings in Azure:

1. Go to the Azure Portal
2. Navigate to your App Service (moviesapp-api-fixed)
3. Go to "Configuration" -> "Application Settings"
4. Add or update the following settings:
   - `AppSettings:BaseUrl` = `https://moviesappsa79595.z22.web.core.windows.net`
   - `SparkPost:ApiKey` = `aecf07103eecf75d6ee809bb0e19a2f7de099dba`
   - `SparkPost:SenderEmail` = `noreply@mail.cineniche.co`
   - `SparkPost:SenderName` = `CineNiche`
5. Click "Save" and wait for the app to restart

## Testing After Deployment

After deploying your changes:

1. Use the `test-azure-password-reset.js` script to check if reset emails are working
2. Check your inbox (including spam folder) for the reset email
3. Try the "Forgot Password" functionality directly in your web application

If issues persist, run the diagnostic tools we've created:

```bash
node MoviesApp/Backend/check-api-config.js your@email.com
```

## Additional Configuration: SPF Record

For optimal email deliverability, add an SPF record to your DNS settings for `mail.cineniche.co`:

```
Type: TXT
Host: @
Value: v=spf1 include:sparkpostmail.com ~all
TTL: 3600
```

Refer to `SPF_SETUP_INSTRUCTIONS.md` for detailed instructions.

## Troubleshooting

If emails still don't arrive after deployment:

1. Check Azure logs for any errors
2. Verify all configuration settings are correct
3. Make sure the SparkPost API key has sending permissions
4. Check if there are sending limits on your SparkPost account
5. Try sending to a different email provider (sometimes specific providers filter emails differently)

You can use the diagnostic scripts we've created to help identify specific issues.
