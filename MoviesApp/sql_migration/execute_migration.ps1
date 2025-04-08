# PowerShell script to execute SQL migration
$server = "moviesapp-sql-79427.database.windows.net"
$database = "MoviesDB"
$username = "sqladmin"
$password = "P@ssw0rd123!"

# Create connection string
$connectionString = "Server=$server;Database=$database;User ID=$username;Password=$password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Path to the SQL script
$scriptPath = "./complete_migration.sql"

# Execute the SQL script
Write-Host "Executing SQL migration script..."
try {
    # Install SqlServer module if not present
    if (-not (Get-Module -ListAvailable -Name SqlServer)) {
        Write-Host "Installing SqlServer module..."
        Install-Module -Name SqlServer -Force -AllowClobber
    }
    
    # Execute the script
    Invoke-Sqlcmd -ConnectionString $connectionString -InputFile $scriptPath
    Write-Host "Migration completed successfully!"
} catch {
    Write-Host "Error executing SQL script: $_"
}
