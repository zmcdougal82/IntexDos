# Final Deployment Guide for .NET 8 + React Movies Application

This guide will help you complete the deployment of your Movies application to Azure with the actual data from your local SQLite database.

## Components Already Deployed

- **Backend API**: https://moviesapp-api-fixed.azurewebsites.net
- **Frontend Website**: https://moviesappsa79595.z22.web.core.windows.net
- **Azure SQL Database**: moviesapp-sql-79427.database.windows.net

## Current Status

The application infrastructure is deployed to Azure, but the 500 error on the frontend is due to missing database tables/data. We need to properly migrate your local SQLite data to Azure SQL.

## Steps to Complete the Deployment

### 1. Export & Fix SQLite Data (Already Done)

✅ We've already exported your SQLite data and fixed the SQL syntax for Azure compatibility using these scripts:
- `export-sqlite-to-azure.sh` - Extracted data from local SQLite
- `fix-sql-scripts.sh` - Fixed syntax issues in the SQL scripts

### 2. Deploy Your Data to Azure SQL Database

#### Option A: Using a Windows Machine with PowerShell

1. Copy the `MoviesApp/sql_migration` folder to a Windows machine
2. Open PowerShell as Administrator
3. Navigate to the folder containing the `deploy-schema-azure.ps1` script
4. Run the script:
   ```powershell
   .\deploy-schema-azure.ps1
   ```

#### Option B: Using Azure Data Studio or SQL Server Management Studio

1. Connect to your Azure SQL Database with these credentials:
   - Server: moviesapp-sql-79427.database.windows.net
   - Database: MoviesDB
   - Username: sqladmin
   - Password: P@ssw0rd123!
2. Open the SQL file: `MoviesApp/sql_migration/complete_migration.sql`
3. Execute the SQL script to create the tables and import the data

### 3. Verify the Deployment

1. Access the frontend: https://moviesappsa79595.z22.web.core.windows.net
2. The frontend should now be able to fetch and display movies from the database
3. Check the API endpoints using Swagger: https://moviesapp-api-fixed.azurewebsites.net/swagger

## Troubleshooting

If you encounter errors after database migration:

1. **Backend API Errors**: Check Azure App Service logs in Azure Portal
   - Navigate to your App Service in Azure Portal
   - Go to "Diagnose and solve problems" > "Diagnostic Tools" > "Log stream"

2. **Database Connection Issues**:
   - Verify the connection string in `appsettings.json` is correct
   - Make sure your Azure SQL server's firewall rules allow connections

3. **CORS Issues**:
   - Verify the CORS policy in the backend allows your frontend domain
   - Run the command:
     ```bash
     az webapp cors show --resource-group MoviesAppRG --name moviesapp-api-fixed
     ```

## GitHub CI/CD Integration

The application includes GitHub Actions workflows (.github/workflows) that automatically deploy your app when you push to GitHub:

1. Create a new GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. Set up GitHub repository secrets:
   - AZURE_WEBAPP_PUBLISH_PROFILE
   - AZURE_STATIC_WEB_APPS_API_TOKEN

## Security Notes

For production use, consider changing the database password stored in `appsettings.json` to use a more secure method like Azure Key Vault.

## Next Steps

After completing the data migration, you might want to:

1. Add a custom domain for your frontend and backend
2. Set up monitoring and alerts with Azure Application Insights
3. Implement user authentication with Azure AD or another identity provider
4. Configure backup and disaster recovery for your database
