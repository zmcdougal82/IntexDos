# Movies Application Deployment Instructions

## Deployment Status

We've successfully completed the initial deployment with the following resources created:

- **Resource Group**: MoviesAppRG
- **SQL Server**: moviesapp-sql-79427.database.windows.net
- **SQL Database**: MoviesDB
- **Frontend**: Deployed to Azure Storage at https://moviesappsa79595.z22.web.core.windows.net/

However, the backend deployment encountered several issues:

1. The .NET 9 templates used `AddOpenAPI()` methods not compatible with .NET 8
2. The Linux App Service doesn't support .NET 8 with the specified runtime
3. The Static Web App service isn't available in the westus region

## Fix and Complete Deployment

We've created two scripts to fix these issues:

### 1. Deploy Backend with Fixed Code (deploy-backend.sh)

This script:
- Creates a new App Service Plan (Windows-based to support .NET 8)
- Creates a new Web App for the backend
- Configures the connection string to use the existing SQL Database
- Builds and deploys the backend with the fixed Program.cs file
- Sets up CORS to allow the frontend to connect

### 2. Update Frontend Code (update-frontend.sh)

This script:
- Updates the API URL in the frontend code to point to the new backend
- Rebuilds the frontend
- Redeploys to the existing Azure Storage static website

## How to Complete the Deployment

Run the following commands in order:

```bash
# 1. Deploy the backend with fixed code
cd MoviesApp
./deploy-backend.sh

# 2. Update the frontend to connect to the new backend
./update-frontend.sh
```

## Deployed URLs

After running both scripts, your application will be available at:

- **Frontend**: https://moviesappsa79595.z22.web.core.windows.net/
- **Backend API**: https://moviesapp-api-fixed.azurewebsites.net/
- **Swagger/API Docs**: https://moviesapp-api-fixed.azurewebsites.net/swagger

## GitHub Actions Setup

The GitHub Actions workflows in `.github/workflows/` are configured for CI/CD but will need to be updated with:

1. The correct Azure credentials
2. The updated resource names

## Database Information

- **Server**: moviesapp-sql-79427.database.windows.net
- **Database**: MoviesDB
- **Username**: sqladmin
- **Password**: P@ssw0rd123! (change this for production use)

## Lessons Learned

1. .NET 8 compatibility is better with Windows-based App Services on Azure
2. Static Web Apps have limited regional availability
3. Using Storage Account static websites is a reliable alternative for hosting React apps
4. The App Service runtime parameter needs to match the exact version format required by Azure

## Next Steps

After deployment is complete, you might want to:

1. Set up proper authentication for both frontend and backend
2. Configure the database migration to load your existing data
3. Test the application thoroughly
4. Set up monitoring and alerts

## Troubleshooting

If you encounter issues:

1. Check the App Service logs in the Azure Portal
2. Verify CORS settings are properly configured
3. Ensure the connection string is correctly set up
4. Check that the frontend is built with the correct API URL
