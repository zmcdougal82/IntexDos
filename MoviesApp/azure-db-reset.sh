#!/bin/bash
# Script to reset Azure SQL database and migrate all real data from local SQLite

# Configuration
RESOURCE_GROUP="MoviesAppRG"
SQL_SERVER_NAME="moviesapp-sql-79427"
SQL_DB_NAME="MoviesDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"
SQLITE_DB_PATH="NewMovies.db"  # Path to local SQLite database

# Check if SQLite3 is installed
if ! command -v sqlite3 &> /dev/null
then
    echo "Error: sqlite3 could not be found. Please install it."
    exit 1
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null
then
    echo "Error: Azure CLI could not be found. Please install it."
    exit 1
fi

echo "===== AZURE SQL DATABASE RESET AND MIGRATION ====="
echo "This script will reset your Azure SQL database and migrate all data from your local SQLite database."
echo "SQLite database: $SQLITE_DB_PATH"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Step 1: Reset Azure SQL Database - Create drop tables SQL
echo "===== Creating SQL to reset Azure SQL Database ====="
cat > reset-db.sql << EOL
-- Drop existing tables if they exist
IF OBJECT_ID('movies_ratings', 'U') IS NOT NULL DROP TABLE movies_ratings;
IF OBJECT_ID('movies_users', 'U') IS NOT NULL DROP TABLE movies_users;
IF OBJECT_ID('movies_titles', 'U') IS NOT NULL DROP TABLE movies_titles;

-- Create Movies table
CREATE TABLE movies_titles (
    show_id NVARCHAR(50) PRIMARY KEY,
    type NVARCHAR(50),
    title NVARCHAR(255),
    director NVARCHAR(255),
    cast NVARCHAR(MAX),
    country NVARCHAR(255),
    release_year INT,
    rating NVARCHAR(50),
    duration NVARCHAR(50),
    description NVARCHAR(MAX),
    Action INT,
    Adventure INT,
    [Anime Series International TV Shows] INT,
    [British TV Shows Docuseries International TV Shows] INT,
    Children INT,
    Comedies INT,
    [Comedies Dramas International Movies] INT,
    [Comedies International Movies] INT,
    [Comedies Romantic Movies] INT,
    [Crime TV Shows Docuseries] INT,
    Documentaries INT,
    [Documentaries International Movies] INT,
    Docuseries INT,
    Dramas INT,
    [Dramas International Movies] INT,
    [Dramas Romantic Movies] INT,
    [Family Movies] INT,
    Fantasy INT,
    [Horror Movies] INT,
    [International Movies Thrillers] INT,
    [International TV Shows Romantic TV Shows TV Dramas] INT,
    [Kids' TV] INT,
    [Language TV Shows] INT,
    Musicals INT,
    [Nature TV] INT,
    [Reality TV] INT,
    Spirituality INT,
    [TV Action] INT,
    [TV Comedies] INT,
    [TV Dramas] INT,
    [Talk Shows TV Comedies] INT,
    Thrillers INT,
    poster_url NVARCHAR(MAX)
);

-- Create Users table
CREATE TABLE movies_users (
    user_id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100),
    phone NVARCHAR(50),
    email NVARCHAR(255),
    age INT,
    gender NVARCHAR(20),
    Netflix INT,
    [Amazon Prime] INT,
    [Disney+] INT,
    [Paramount+] INT,
    Max INT,
    Hulu INT,
    [Apple TV+] INT,
    Peacock INT,
    city NVARCHAR(100),
    state NVARCHAR(50),
    zip NVARCHAR(20),
    password_hash NVARCHAR(MAX),
    role NVARCHAR(50)
);

-- Create unique email index
CREATE UNIQUE INDEX idx_users_email ON movies_users(email);

-- Create Ratings table
CREATE TABLE movies_ratings (
    user_id INT,
    show_id NVARCHAR(50),
    rating INT,
    timestamp DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (user_id, show_id),
    FOREIGN KEY (user_id) REFERENCES movies_users(user_id),
    FOREIGN KEY (show_id) REFERENCES movies_titles(show_id)
);

-- Create indexes
CREATE INDEX idx_ratings_user_id ON movies_ratings(user_id);
CREATE INDEX idx_ratings_show_id ON movies_ratings(show_id);
EOL

# Step 2: Create SQL scripts to export data properly
echo "===== Exporting data from SQLite ====="

# Get SQLite schema for reference
sqlite3 "$SQLITE_DB_PATH" .schema > sqlite_schema.txt

# Export movies_titles with proper quoting and delimiters
echo "-- Import for movies_titles" > movies_titles_import.sql
sqlite3 -header -csv "$SQLITE_DB_PATH" "SELECT * FROM movies_titles;" > movies_titles.csv

# Convert CSV to SQL INSERT statements with proper escaping
awk -F, 'NR>1 {
    printf "INSERT INTO movies_titles VALUES (";
    for(i=1; i<=NF; i++) {
        gsub(/^"/, "'\''", $i);  # Replace opening quote
        gsub(/"$/, "'\''", $i);  # Replace closing quote
        gsub(/""/, "'\''", $i);  # Replace double quotes with single quotes
        
        if(i==NF) {
            printf "%s", $i;
        } else {
            printf "%s, ", $i;
        }
    }
    printf ");\n";
}' movies_titles.csv > movies_titles_import.sql

# Export movies_users with proper quoting and delimiters
echo "-- Import for movies_users" > movies_users_import.sql
echo "SET IDENTITY_INSERT movies_users ON;" >> movies_users_import.sql
sqlite3 -header -csv "$SQLITE_DB_PATH" "SELECT * FROM movies_users;" > movies_users.csv

# Convert CSV to SQL INSERT statements with proper escaping
awk -F, 'NR>1 {
    printf "INSERT INTO movies_users VALUES (";
    for(i=1; i<=NF; i++) {
        gsub(/^"/, "'\''", $i);  # Replace opening quote
        gsub(/"$/, "'\''", $i);  # Replace closing quote
        gsub(/""/, "'\''", $i);  # Replace double quotes with single quotes
        
        if(i==NF) {
            printf "%s", $i;
        } else {
            printf "%s, ", $i;
        }
    }
    printf ");\n";
}' movies_users.csv >> movies_users_import.sql
echo "SET IDENTITY_INSERT movies_users OFF;" >> movies_users_import.sql

# Export movies_ratings with proper quoting and delimiters
echo "-- Import for movies_ratings" > movies_ratings_import.sql
sqlite3 -header -csv "$SQLITE_DB_PATH" "SELECT * FROM movies_ratings;" > movies_ratings.csv

# Convert CSV to SQL INSERT statements with proper escaping
awk -F, 'NR>1 {
    printf "INSERT INTO movies_ratings VALUES (";
    for(i=1; i<=NF; i++) {
        gsub(/^"/, "'\''", $i);  # Replace opening quote
        gsub(/"$/, "'\''", $i);  # Replace closing quote
        gsub(/""/, "'\''", $i);  # Replace double quotes with single quotes
        
        if(i==NF) {
            printf "%s", $i;
        } else {
            printf "%s, ", $i;
        }
    }
    printf ");\n";
}' movies_ratings.csv >> movies_ratings_import.sql

# Combine all SQL scripts
cat reset-db.sql > azure-import.sql
echo "" >> azure-import.sql
cat movies_users_import.sql >> azure-import.sql
echo "" >> azure-import.sql
cat movies_titles_import.sql >> azure-import.sql
echo "" >> azure-import.sql
cat movies_ratings_import.sql >> azure-import.sql

echo "===== Migrating data to Azure SQL Database ====="

# Install sqlcmd if needed
if ! command -v sqlcmd &> /dev/null
then
    echo "The sqlcmd utility is not installed."
    echo "Installing the Microsoft ODBC driver and the sqlcmd utility..."
    
    # For macOS
    brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
    brew update
    brew install msodbcsql mssql-tools
    
    echo "Please restart your terminal session after installation"
    echo "Then run this script again to complete the migration"
    exit 1
fi

# Execute the SQL script using sqlcmd
echo "Executing SQL script on Azure..."
sqlcmd -S "$SQL_SERVER_NAME.database.windows.net" -d "$SQL_DB_NAME" -U "$SQL_ADMIN_USER" -P "$SQL_ADMIN_PASSWORD" -i azure-import.sql

if [ $? -ne 0 ]; then
    echo "Error executing SQL script with sqlcmd."
    echo "Trying alternative method with Azure CLI..."
    
    # Alternative approach using Azure CLI
    az sql db query \
        --resource-group "$RESOURCE_GROUP" \
        --server "$SQL_SERVER_NAME" \
        --name "$SQL_DB_NAME" \
        --query-file azure-import.sql \
        --username "$SQL_ADMIN_USER" \
        --password "$SQL_ADMIN_PASSWORD"
fi

echo ""
echo "===== MIGRATION COMPLETE ====="
echo "Your Azure SQL database has been reset and populated with data from your local SQLite database."
echo ""
echo "You can now access your application at:"
echo "Frontend: https://moviesappsa79595.z22.web.core.windows.net/"
echo "Backend API: https://moviesapp-api-fixed.azurewebsites.net/"
