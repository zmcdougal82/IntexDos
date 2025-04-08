# Movies Application Deployment to Azure - Final Instructions

## Deployed Resources

Your application is now deployed to Azure with the following resources:

- **Resource Group**: MoviesAppRG
- **SQL Server**: moviesapp-sql-79427.database.windows.net
- **SQL Database**: MoviesDB
- **Backend API**: https://moviesapp-api-fixed.azurewebsites.net
- **Frontend**: https://moviesappsa79595.z22.web.core.windows.net/

## Deployment Scripts

We've created several scripts to manage your deployment:

### 1. Complete Deployment Script

The `complete-deployment.sh` script handles the entire deployment process:
- Updates Program.cs with proper Swagger and CORS configuration
- Builds and deploys the backend to Azure App Service
- Updates frontend API URL to point to the deployed backend
- Builds and deploys the frontend to Azure Storage

```bash
cd MoviesApp
./complete-deployment.sh
```

### 2. Database Migration Script

The `migrate-database.sh` script migrates your schema and data from SQLite to Azure SQL:
- Creates EF Core migrations from your model classes
- Applies migrations to create the SQL schema in Azure
- Exports data from SQLite and creates SQL import scripts

```bash
cd MoviesApp
./migrate-database.sh
```

## Accessing Your Application

- **Frontend Website**: https://moviesappsa79595.z22.web.core.windows.net/
- **Backend API**: https://moviesapp-api-fixed.azurewebsites.net/api
- **API Documentation**: https://moviesapp-api-fixed.azurewebsites.net/swagger

## Database Connection Information

- **Server**: moviesapp-sql-79427.database.windows.net
- **Database**: MoviesDB
- **Username**: sqladmin
- **Password**: P@ssw0rd123! (change this for production)

## GitHub Integration

The `.github/workflows` directory contains CI/CD workflows for both the frontend and backend. To use these:

1. Create a GitHub repository
2. Push your code:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. Set up GitHub secrets in your repository:
   - AZURE_WEBAPP_PUBLISH_PROFILE
   - AZURE_STATIC_WEB_APPS_API_TOKEN

## Running Each Component Locally

### Backend API

```bash
cd MoviesApp/Backend/MoviesApp.API
dotnet run
```

The API will be available at http://localhost:5000

### Frontend

```bash
cd MoviesApp/Frontend/movies-client
npm run dev
```

The frontend will be available at http://localhost:5173

## Next Steps

1. **Update Security**: Change database passwords and configure proper authentication
2. **Complete Data Migration**: Follow instructions from migrate-database.sh output
3. **Set Up Monitoring**: Configure Azure Application Insights
4. **Add Custom Domain**: Configure a custom domain for your frontend and backend

## Troubleshooting

If you encounter issues:

1. **Backend Errors**: Check Azure App Service logs in Azure Portal
2. **Database Connection**: Verify the connection string in appsettings.json
3. **CORS Issues**: Ensure the CORS policy allows your frontend domain
4. **Frontend API URL**: Check that the frontend is using the correct API URL
5. **Missing Features**: Run the complete-deployment.sh script to ensure all components are properly configured

## Support

If you need additional assistance, you can:
1. Check Azure documentation
2. Use the provided scripts to redeploy or update components
3. Examine logs and error messages in Azure Portal
