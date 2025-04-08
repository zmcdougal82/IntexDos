#!/bin/bash
# Script to migrate database schema and data to Azure SQL

# Configuration
RESOURCE_GROUP="MoviesAppRG"
SQL_SERVER_NAME="moviesapp-sql-79427"  # From previous deployment
SQL_DB_NAME="MoviesDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"
SQLITE_DB_PATH="../NewMovies.db"

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/Backend/MoviesApp.API"
MIGRATIONS_DIR="$BACKEND_DIR/Migrations"

echo "===== DATABASE MIGRATION SCRIPT ====="
echo "This script will migrate the schema and data from SQLite to Azure SQL Database"
echo "Script directory: $SCRIPT_DIR"
echo "Backend directory: $BACKEND_DIR"
echo "SQLite database: $SQLITE_DB_PATH"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Create migrations directory if it doesn't exist
mkdir -p $MIGRATIONS_DIR

# Update appsettings.json with Azure SQL connection string
echo "===== Updating connection string in appsettings.json ====="
SQL_CONNECTION_STRING=$(az sql db show-connection-string \
    --client ado.net \
    --server $SQL_SERVER_NAME \
    --name $SQL_DB_NAME \
    | sed "s/<username>/$SQL_ADMIN_USER/g" \
    | sed "s/<password>/$SQL_ADMIN_PASSWORD/g")

# Update the appsettings.json file
cat > $BACKEND_DIR/appsettings.json << EOL
{
  "ConnectionStrings": {
    "DefaultConnection": ${SQL_CONNECTION_STRING}
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
EOL

# Create EF Core migrations
echo "===== Creating EF Core migrations ====="
cd $BACKEND_DIR
dotnet ef migrations add InitialCreate

# Apply migrations to the database
echo "===== Applying migrations to Azure SQL Database ====="
dotnet ef database update

# Export data from SQLite
echo "===== Exporting data from SQLite ====="
TEMP_DIR=$(mktemp -d)
echo "Working in temporary directory: $TEMP_DIR"

# Export users table
echo "Exporting users data..."
sqlite3 $SQLITE_DB_PATH <<EOF > $TEMP_DIR/users.sql
.mode insert movies_users
SELECT * FROM movies_users;
EOF

# Export movies table
echo "Exporting movies data..."
sqlite3 $SQLITE_DB_PATH <<EOF > $TEMP_DIR/movies.sql
.mode insert movies_titles
SELECT * FROM movies_titles;
EOF

# Export ratings table
echo "Exporting ratings data..."
sqlite3 $SQLITE_DB_PATH <<EOF > $TEMP_DIR/ratings.sql
.mode insert movies_ratings
SELECT * FROM movies_ratings;
EOF

echo "SQLite data exported to $TEMP_DIR"

# Create a script to import data to SQL Server
echo "===== Creating import script for Azure SQL ====="
cat > $TEMP_DIR/import.sql << EOL
-- Import script for Azure SQL Database

-- Import users data
$(cat $TEMP_DIR/users.sql)

-- Import movies data
$(cat $TEMP_DIR/movies.sql)

-- Import ratings data
$(cat $TEMP_DIR/ratings.sql)
EOL

echo "Data import script created: $TEMP_DIR/import.sql"
echo ""
echo "To complete the data migration:"
echo "1. Access SQL Server Management Studio or Azure Data Studio"
echo "2. Connect to server: $SQL_SERVER_NAME.database.windows.net"
echo "3. Open and execute the script: $TEMP_DIR/import.sql"
echo ""
echo "Alternatively, you can use sqlcmd if available:"
echo "sqlcmd -S $SQL_SERVER_NAME.database.windows.net -d $SQL_DB_NAME -U $SQL_ADMIN_USER -P $SQL_ADMIN_PASSWORD -i $TEMP_DIR/import.sql"
echo ""
echo "===== DATABASE MIGRATION PREPARATION COMPLETE ====="
