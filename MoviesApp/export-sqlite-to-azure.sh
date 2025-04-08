#!/bin/bash
# Script to export data from local SQLite database to Azure SQL

# Configuration
RESOURCE_GROUP="MoviesAppRG"
SQL_SERVER_NAME="moviesapp-sql-79427"
SQL_DB_NAME="MoviesDB"
SQL_ADMIN_USER="sqladmin"
SQL_ADMIN_PASSWORD="P@ssw0rd123!"
SQLITE_DB_PATH="NewMovies.db"  # Path to local SQLite database

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_DIR="$SCRIPT_DIR/sql_migration"
mkdir -p "$OUTPUT_DIR"

echo "===== SQLite to Azure SQL Data Migration ====="
echo "This script will export data from your local SQLite database and import it to Azure SQL"
echo "SQLite database: $SQLITE_DB_PATH"
echo "Output directory: $OUTPUT_DIR"

# Login to Azure
echo "===== Logging into Azure ====="
az login

# Step 1: Create schema script for Azure SQL
echo "===== Creating schema script for Azure SQL ====="
cat > "$OUTPUT_DIR/create_schema.sql" << EOL
-- Create Movies table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'movies_titles')
BEGIN
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
END

-- Create Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'movies_users')
BEGIN
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
END

-- Create Ratings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'movies_ratings')
BEGIN
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
END
EOL

# Step 2: Export actual data from SQLite
echo "===== Exporting data from SQLite database ====="

# Check if the SQLite database exists
if [ ! -f "$SQLITE_DB_PATH" ]; then
    echo "Error: SQLite database not found at $SQLITE_DB_PATH"
    exit 1
fi

# Export movies_titles table - This creates INSERT statements for actual data
echo "Exporting movies_titles data..."
sqlite3 "$SQLITE_DB_PATH" <<EOF > "$OUTPUT_DIR/movies_titles_data.sql"
.mode insert movies_titles
SELECT * FROM movies_titles;
EOF

# Export movies_users table
echo "Exporting movies_users data..."
sqlite3 "$SQLITE_DB_PATH" <<EOF > "$OUTPUT_DIR/movies_users_data.sql"
.mode insert movies_users
SELECT * FROM movies_users;
EOF

# Export movies_ratings table
echo "Exporting movies_ratings data..."
sqlite3 "$SQLITE_DB_PATH" <<EOF > "$OUTPUT_DIR/movies_ratings_data.sql"
.mode insert movies_ratings
SELECT * FROM movies_ratings;
EOF

# Step 3: Create a complete migration script
echo "===== Creating complete migration script ====="
cat "$OUTPUT_DIR/create_schema.sql" > "$OUTPUT_DIR/complete_migration.sql"
echo "" >> "$OUTPUT_DIR/complete_migration.sql"
echo "-- Data from local SQLite database" >> "$OUTPUT_DIR/complete_migration.sql"
echo "SET IDENTITY_INSERT movies_users ON;" >> "$OUTPUT_DIR/complete_migration.sql"
cat "$OUTPUT_DIR/movies_users_data.sql" >> "$OUTPUT_DIR/complete_migration.sql"
echo "SET IDENTITY_INSERT movies_users OFF;" >> "$OUTPUT_DIR/complete_migration.sql"
echo "" >> "$OUTPUT_DIR/complete_migration.sql"
cat "$OUTPUT_DIR/movies_titles_data.sql" >> "$OUTPUT_DIR/complete_migration.sql"
echo "" >> "$OUTPUT_DIR/complete_migration.sql"
cat "$OUTPUT_DIR/movies_ratings_data.sql" >> "$OUTPUT_DIR/complete_migration.sql"

# Step 4: Create a PowerShell script for executing the migration
echo "===== Creating PowerShell script for migration ====="
cat > "$OUTPUT_DIR/execute_migration.ps1" << EOL
# PowerShell script to execute SQL migration
\$server = "$SQL_SERVER_NAME.database.windows.net"
\$database = "$SQL_DB_NAME"
\$username = "$SQL_ADMIN_USER"
\$password = "$SQL_ADMIN_PASSWORD"

# Create connection string
\$connectionString = "Server=\$server;Database=\$database;User ID=\$username;Password=\$password;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

# Path to the SQL script
\$scriptPath = "./complete_migration.sql"

# Execute the SQL script
Write-Host "Executing SQL migration script..."
try {
    # Install SqlServer module if not present
    if (-not (Get-Module -ListAvailable -Name SqlServer)) {
        Write-Host "Installing SqlServer module..."
        Install-Module -Name SqlServer -Force -AllowClobber
    }
    
    # Execute the script
    Invoke-Sqlcmd -ConnectionString \$connectionString -InputFile \$scriptPath
    Write-Host "Migration completed successfully!"
} catch {
    Write-Host "Error executing SQL script: \$_"
}
EOL

echo ""
echo "===== DATA EXPORT COMPLETE ====="
echo "All data has been exported to $OUTPUT_DIR/"
echo ""
echo "To complete the migration to Azure SQL Database:"
echo "1. Connect to your Azure SQL Database"
echo "2. Execute the SQL script: $OUTPUT_DIR/complete_migration.sql"
echo ""
echo "To execute from a Windows machine with PowerShell:"
echo "1. Copy the $OUTPUT_DIR folder to a Windows machine"
echo "2. Run PowerShell as Administrator"
echo "3. Navigate to the folder and run: ./execute_migration.ps1"
