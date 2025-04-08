# Simple Azure SQL Database Setup Guide

We've created a simplified SQL script to directly set up your database in Azure without using your local SQLite data. This script contains a basic schema and some sample data to get your app working.

## Steps to Execute the Script

### Option 1: Azure Portal Query Editor (Browser-based)

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
   - Open the file `MoviesApp/create-azure-db-schema.sql` in a text editor
   - Copy the entire contents of the file
   - Paste the script into the Azure Query Editor
   - Click "Run" to execute the script

### Option 2: Azure Data Studio (macOS Client)

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
   - Open the file `MoviesApp/create-azure-db-schema.sql` in a text editor
   - Copy the entire contents
   - Paste into the query window in Azure Data Studio
   - Click "Run" or press F5 to execute

## Verifying the Setup

After running the script, verify that it was successful by:

1. **Check the Frontend**: Visit https://moviesappsa79595.z22.web.core.windows.net/ and confirm data is loading without 500 errors

2. **Check via API**: Visit https://moviesapp-api-fixed.azurewebsites.net/api/movies to see if the API returns the sample movie data

3. **Check in Database Query Tool**: Run this SQL query to confirm the tables were created:
   ```sql
   SELECT COUNT(*) FROM movies_titles;
   ```
   
   You should see the result: `5`

## What's in the Script?

The script creates:

1. The three required tables:
   - `movies_titles` - Contains movie information
   - `movies_users` - Contains user accounts
   - `movies_ratings` - Contains movie ratings

2. Sample data:
   - 5 popular movies
   - 2 user accounts (an admin and a regular user)
   - 4 movie ratings

This should be enough to make your application functional and demonstrate its features.
