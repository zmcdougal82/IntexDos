# PowerShell script to deploy schema and data to Azure SQL Database
param (
    [Parameter(Mandatory=$false)]
    [string]$ServerName = "moviesapp-sql-79427.database.windows.net",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "MoviesDB",
    
    [Parameter(Mandatory=$false)]
    [string]$Username = "sqladmin",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "P@ssw0rd123!",
    
    [Parameter(Mandatory=$false)]
    [string]$ScriptPath = "./sql_migration/complete_migration.sql"
)

Write-Host "===== Azure SQL Database Deployment ====="
Write-Host "This script will deploy your schema and data to Azure SQL Database"
Write-Host "Server: $ServerName"
Write-Host "Database: $DatabaseName"
Write-Host "Script: $ScriptPath"

# Create a connection string
$connectionString = "Server=$ServerName;Database=$DatabaseName;User ID=$Username;Password=$Password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Check if the SQL file exists
if (-Not (Test-Path $ScriptPath)) {
    Write-Host "Error: SQL script file not found at $ScriptPath" -ForegroundColor Red
    exit 1
}

# Make sure the SqlServer module is installed
if (-Not (Get-Module -ListAvailable -Name SqlServer)) {
    Write-Host "Installing SqlServer module..." -ForegroundColor Yellow
    Install-Module -Name SqlServer -Force -AllowClobber -Scope CurrentUser
}

# Import the module
Import-Module SqlServer

try {
    Write-Host "Connecting to Azure SQL Database..." -ForegroundColor Yellow
    
    # Execute the SQL script
    Write-Host "Executing SQL migration script..." -ForegroundColor Yellow
    Invoke-Sqlcmd -ConnectionString $connectionString -InputFile $ScriptPath -QueryTimeout 300
    
    Write-Host "Database schema and data deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error executing SQL script: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===== DATABASE MIGRATION COMPLETE ====="
Write-Host "The database schema and data have been successfully deployed to Azure SQL."
Write-Host ""
Write-Host "Your application is now ready to use with the imported data."
