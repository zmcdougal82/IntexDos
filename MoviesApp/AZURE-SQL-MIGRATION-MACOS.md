# Azure SQL Database Migration Guide for macOS

Since you don't have a Windows machine, here's how to execute the database migration script using tools available on macOS or through a web browser.

## Option 1: Azure Portal Query Editor (Browser-based)

1. **Log in to Azure Portal**:
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Azure credentials

2. **Navigate to your SQL Database**:
   - Search for "SQL databases" in the top search bar
   - Select "MoviesDB" from the list

3. **Open Query Editor**:
   - In the left menu of your database, scroll down and click on "Query editor"
   - Log in with:
     - Username: sqladmin
     - Password: P@ssw0rd123!

4. **Execute the SQL Script**:
   - Open the file `/Users/zackmcdougal/IntexDos/MoviesApp/sql_migration/complete_migration.sql` in a text editor
   - Copy the entire contents of the file
   - Paste the script into the Azure Query Editor
   - Click "Run" to execute the script

## Option 2: Azure Data Studio (macOS Client)

1. **Install Azure Data Studio**:
   - Download from [Microsoft's official site](https://docs.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio)
   - Install the .dmg file

2. **Connect to Your Azure SQL Database**:
   - Open Azure Data Studio
   - Click "New Connection"
   - Enter connection details:
     - Connection type: Microsoft SQL Server
     - Server: moviesapp-sql-79427.database.windows.net
     - Authentication type: SQL Login
     - Username: sqladmin
     - Password: P@ssw0rd123!
     - Database: MoviesDB
   - Click "Connect"

3. **Execute the SQL Script**:
   - Click "New Query"
   - Open the file `/Users/zackmcdougal/IntexDos/MoviesApp/sql_migration/complete_migration.sql` in a text editor
   - Copy the entire contents
   - Paste into the query window in Azure Data Studio
   - Click "Run" or press F5 to execute

## Option 3: Using the Azure CLI (Command-line)

1. **Install Azure CLI Extensions**:
   ```bash
   az extension add --name db-up
   ```

2. **Execute the SQL Script**:
   ```bash
   # Log in to Azure
   az login

   # Execute SQL script using the az sql db command
   az sql db run-query -g MoviesAppRG -s moviesapp-sql-79427 -n MoviesDB -u sqladmin -p P@ssw0rd123! -f MoviesApp/sql_migration/complete_migration.sql
   ```

## Option 4: Using the sqlcmd Utility (Command-line)

1. **Install sqlcmd on macOS**:
   ```bash
   brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
   brew update
   brew install msodbcsql mssql-tools
   ```

2. **Execute the SQL Script**:
   ```bash
   sqlcmd -S moviesapp-sql-79427.database.windows.net -d MoviesDB -U sqladmin -P 'P@ssw0rd123!' -i MoviesApp/sql_migration/complete_migration.sql
   ```

## Verifying the Migration

After running the script through any of these methods, verify the migration was successful by:

1. **Check the Frontend**: Visit https://moviesappsa79595.z22.web.core.windows.net/ and confirm data is loading without 500 errors

2. **Check via API**: Visit https://moviesapp-api-fixed.azurewebsites.net/api/movies to see if the API returns movie data

3. **Check Database Tables**: Using your chosen tool (Azure Portal, Azure Data Studio), run:
   ```sql
   SELECT COUNT(*) FROM movies_titles;
   ```
   This should return the number of movies in your database.

If you encounter any issues during the migration, check the error messages for specific SQL syntax issues. The script has been fixed to be compatible with Azure SQL, but there might still be minor adjustments needed depending on your specific data.
