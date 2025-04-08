#!/bin/bash
# Script to complete the deployment process with all fixes

# Configuration - Use the existing resource group and SQL server
RESOURCE_GROUP="MoviesAppRG"
LOCATION="westus"
SQL_SERVER_NAME="moviesapp-sql-79427"  # From previous deployment
SQL_DB_NAME="MoviesDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"
BACKEND_APP_NAME="moviesapp-api-fixed"
APP_SERVICE_PLAN="${BACKEND_APP_NAME}-plan"
STORAGE_ACCOUNT="moviesappsa79595"  # From previous deployment

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/Backend/MoviesApp.API"
FRONTEND_DIR="$SCRIPT_DIR/Frontend/movies-client"

echo "===== COMPLETE DEPLOYMENT SCRIPT ====="
echo "Script directory: $SCRIPT_DIR"
echo "Backend directory: $BACKEND_DIR"
echo "Frontend directory: $FRONTEND_DIR"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Fix the Program.cs file for Swagger
echo "===== Updating Program.cs for Swagger compatibility ====="
cat > $BACKEND_DIR/Program.cs << 'EOL'
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using MoviesApp.API.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add Entity Framework Core and DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins("https://moviesappsa79595.z22.web.core.windows.net") // Storage Account URL
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Add Swagger/OpenAPI support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Movies API", Version = "v1" });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Movies API v1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();
app.UseRouting();

// Use CORS
app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.Run();
EOL

# Build and publish backend
echo "===== Building and publishing backend ====="
cd "$BACKEND_DIR"
dotnet restore
dotnet publish -c Release -o ./publish

# Deploy backend using zip deployment
echo "===== Deploying backend to Azure ====="
cd "$BACKEND_DIR/publish"
zip -r "$SCRIPT_DIR/backend-deploy.zip" .
cd "$SCRIPT_DIR"

az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP_NAME \
    --src backend-deploy.zip

# Get backend URL
BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
echo "===== Backend deployed to: $BACKEND_URL ====="

# Update the API URL in the frontend code
echo "===== Updating API URL in frontend code ====="
sed -i.bak "s|const API_URL = '.*';|const API_URL = '$BACKEND_URL/api';|g" "$FRONTEND_DIR/src/services/api.ts"

# Build the frontend
echo "===== Building frontend ====="
cd "$FRONTEND_DIR"
npm install
npm run build

# Deploy the frontend to Azure Storage
echo "===== Deploying frontend to Azure Storage ====="
az storage blob upload-batch \
    --account-name $STORAGE_ACCOUNT \
    --source "$FRONTEND_DIR/dist" \
    --destination '$web' \
    --overwrite

# Display the frontend URL
FRONTEND_URL=$(az storage account show \
    --name $STORAGE_ACCOUNT \
    --resource-group $RESOURCE_GROUP \
    --query "primaryEndpoints.web" \
    --output tsv)

echo ""
echo "===== DEPLOYMENT SUMMARY ====="
echo "Resource Group: $RESOURCE_GROUP"
echo "Backend API URL: $BACKEND_URL"
echo "    API Documentation: $BACKEND_URL/swagger"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "SQL Server: $SQL_SERVER_NAME.database.windows.net"
echo "SQL Database: $SQL_DB_NAME"
echo "SQL Username: $SQL_ADMIN_USER"
echo ""
echo "Deployment complete! Your application is now available at:"
echo $FRONTEND_URL
