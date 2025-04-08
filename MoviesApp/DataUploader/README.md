# MoviesApp Data Uploader

This component provides tools to upload CSV data to the Azure SQL Database used by the Movies App.

## Overview

The Data Uploader module reads from CSV files and uploads them to the appropriate tables in the Azure SQL Database. It handles data validation, type conversion, foreign key relationships, and batched inserts for optimal performance.

## Files

- **Program.cs**: Main C# application that connects to Azure SQL Database and uploads data from CSV files
- **Models/**: Contains CSV model classes that define the structure of the input data
  - **MovieCsv.cs**: Defines the movie CSV data structure
  - **UserCsv.cs**: Defines the user CSV data structure
  - **RatingCsv.cs**: Defines the rating CSV data structure
- **Data/**: Contains database context and configuration
  - **MovieDbContext.cs**: EF Core database context for Azure SQL connection
- **Alternative Tools**:
  - **upload_data.py**: Python alternative for uploading data
  - **upload_data.sh**: Shell script alternative for uploading data
  - **upload-data.sql**: SQL script for direct database import
  - **Upload-Data.ps1**: PowerShell script for Windows environments

## How to Use

### Running the C# Uploader

1. Ensure CSV files are properly formatted:
   - `updated_movies.csv`: Contains movie data
   - `movies_users.csv`: Contains user data
   - `movies_ratings.csv`: Contains rating data

2. Build and run the application:
   ```bash
   cd MoviesApp/DataUploader
   dotnet build
   dotnet run
   ```

3. The application will:
   - Connect to the database
   - Clear existing data (if necessary)
   - Upload movies, users, and ratings
   - Handle relationships between entities

### Connection Configuration

Database connection settings are stored in `appsettings.json` in the API project that this references. The uploader uses this configuration to connect to Azure SQL Database.

## Development Notes

- CSV files are not included in the repo (added to .gitignore)
- The uploader handles quoted CSV values and proper data type conversion
- The uploader batches inserts for better performance
- Errors are logged to the console
