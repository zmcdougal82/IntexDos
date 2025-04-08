#!/bin/bash
# Script to migrate data from SQLite to Azure SQL Database

# Configuration variables - update these
SQLITE_DB_PATH="../NewMovies.db"
AZURE_RESOURCE_GROUP="MoviesApp-RG"
AZURE_SQL_SERVER="moviesapp-sql-server"
AZURE_SQL_DB="MovieDb"
AZURE_SQL_USER="sqladmin"
AZURE_SQL_PASSWORD="P@ssw0rd123!"  # Update with your actual password

# Check if SQLite3 is installed
if ! command -v sqlite3 &> /dev/null; then
    echo "Error: sqlite3 is not installed. Please install it first."
    exit 1
fi

# Check if the SQLite database exists
if [ ! -f "$SQLITE_DB_PATH" ]; then
    echo "Error: SQLite database not found at $SQLITE_DB_PATH"
    exit 1
fi

echo "Starting migration from SQLite to Azure SQL Database..."

# Get the Azure SQL Connection String
echo "Getting Azure SQL connection string..."
SQL_CONNECTION_STRING=$(az sql db show-connection-string \
    --client ado.net \
    --server $AZURE_SQL_SERVER \
    --name $AZURE_SQL_DB \
    | sed "s/<username>/$AZURE_SQL_USER/g" \
    | sed "s/<password>/$AZURE_SQL_PASSWORD/g")

echo "Preparing migration steps..."

# Create a temporary directory for migration scripts
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

echo "Modifying SQL scripts for SQL Server compatibility..."

# Adjust the SQL files for SQL Server compatibility
# This is a simplified version and might need adjustments based on specific data
sed -i 's/INSERT INTO movies_users/INSERT INTO dbo.movies_users/g' $TEMP_DIR/users.sql
sed -i 's/INSERT INTO movies_titles/INSERT INTO dbo.movies_titles/g' $TEMP_DIR/movies.sql
sed -i 's/INSERT INTO movies_ratings/INSERT INTO dbo.movies_ratings/g' $TEMP_DIR/ratings.sql

echo "Creating a migration script..."

# Create the master migration script
cat > $TEMP_DIR/migrate.sql <<EOF
-- Migration script from SQLite to Azure SQL

-- Delete existing data (if any)
DELETE FROM dbo.movies_ratings;
DELETE FROM dbo.movies_users;
DELETE FROM dbo.movies_titles;

-- Import data
$(cat $TEMP_DIR/users.sql)
$(cat $TEMP_DIR/movies.sql)
$(cat $TEMP_DIR/ratings.sql)
EOF

echo "Migration script prepared."
echo "You can now import this data into Azure SQL Database."
echo "Migration script created at: $TEMP_DIR/migrate.sql"

echo "To import to Azure SQL Database, you have a few options:"
echo "1. Use Azure Data Studio to connect and run the script"
echo "2. Use sqlcmd utility if installed"
echo "3. Use the Entity Framework Core Migrations approach"

echo "For a complete migration with Entity Framework Core:"
echo "1. Update connection string in appsettings.json to use Azure SQL"
echo "2. Run: cd MoviesApp/Backend/MoviesApp.API"
echo "3. Run: dotnet ef migrations add InitialCreate"
echo "4. Run: dotnet ef database update"
echo "5. Then import data from the migration script"

echo "Migration preparation complete!"
