# Movie Recommendation System with SQL Database Connectivity

This directory contains a multi-tiered movie recommendation system that provides personalized movie recommendations based on user ratings data stored in an Azure SQL database. The system now features direct SQL database connectivity for real-time recommendations based on actual user ratings and movie data.

## Features

The recommendation system offers three distinct recommendation approaches:

1. **Collaborative Filtering** - Recommends movies that similar users have rated highly. This approach finds users with similar taste profiles and recommends highly-rated movies from their collections. The implementation now uses actual rating data from the SQL database.

2. **Content-Based Filtering** - Recommends movies similar to ones the user has already rated highly, using metadata like genre, director, etc. Now enhanced with real movie metadata from the database.

3. **Genre-Based Recommendations** - Provides specialized recommendations by genre, focusing on the user's most preferred genres based on their rating history and the genre classifications from the database.

### SQL Database Connectivity

- Direct connection to Azure SQL Server using pyodbc
- Real-time querying of movie and user rating data
- Intelligent fallback to sample data if database connection fails
- Robust error handling throughout the recommendation pipeline

## Dynamic Recommendation Updates

The system updates recommendations under two conditions:
- When a user logs in (pulls fresh data from the database)
- When a user leaves a new rating for a movie (updates recommendations accordingly)

## Components

- **app.py** - Flask application that serves the recommendation API
- **notebook_recommendation_service.py** - Core implementation of the recommendation service with SQL database connectivity
- **test_db_connection.py** - Script to test the database connection and recommendation functionality
- **run_local_test.sh** - Bash script to run the database connection test and start the service locally (for Unix/macOS)
- **Run-LocalTest.ps1** - PowerShell script to run the database connection test and start the service locally (for Windows)
- **requirements.txt** - List of required Python packages, including pyodbc for database connectivity
- **backup/** - Directory containing previous implementation files (for reference only)

## Setup Instructions

1. Install required packages:
   ```
   pip install -r requirements.txt
   ```

2. The system is preconfigured to connect to the Azure SQL database with the following default parameters:
   ```
   SQL_SERVER=moviesapp-sql-79427.database.windows.net
   SQL_DATABASE=MoviesDB
   SQL_USERNAME=sqladmin
   SQL_PASSWORD=P@ssw0rd123!
   SQL_DRIVER={ODBC Driver 18 for SQL Server}
   ```

   You can override these with environment variables if needed.

3. Test the database connection:
   ```
   # On macOS/Linux
   ./run_local_test.sh
   
   # On Windows
   .\Run-LocalTest.ps1
   ```

4. Run the recommendation service:
   ```
   python app.py
   ```

## API Endpoints

The recommendation service provides the following endpoints:

- `GET /health` - Health check endpoint (now includes database connection status)
- `GET /recommendations/{user_id}` - Get all recommendations for a user (now pulls from SQL database)
- `POST /recommendations/update-after-rating` - Update recommendations after a new rating
- `POST /recommendations/generate-file` - Generate a recommendations file

## Testing Database Connectivity

The included `test_db_connection.py` script provides a way to verify the database connection and recommendation functionality:

```bash
python test_db_connection.py
```

This script performs the following checks:
1. Tests direct database connection
2. Verifies basic queries work
3. Tests the recommendation service's database integration
4. Tests recommendation generation for a sample user
5. Verifies fallback functionality when database is unavailable

If the database connection fails, the service will automatically fall back to using sample data, ensuring the API remains functional even if the database is temporarily unavailable.

## Frontend Integration

The recommendation system integrates with the React frontend through the API endpoints. The frontend can:

1. Fetch personalized recommendations when a user logs in
2. Update recommendations when a user submits a new rating
3. Display different recommendation types (collaborative, content-based, and genre-specific)

With the new SQL database connectivity, recommendations are based on actual user data rather than simulated data, providing more accurate and personalized recommendations.

## Example Usage (Python)

```python
import requests

# Get recommendations for a user
response = requests.get("http://localhost:8000/recommendations/405")
recommendations = response.json()

# Display collaborative recommendations
print("Collaborative Recommendations:")
print(recommendations["collaborative"])

# Display content-based recommendations
print("Content-Based Recommendations:")
print(recommendations["contentBased"])

# Display genre recommendations
print("Genre Recommendations:")
for genre, movies in recommendations["genres"].items():
    print(f"{genre}: {movies}")

# Update recommendations after rating
requests.post(
    "http://localhost:8000/recommendations/update-after-rating",
    json={"userId": "405", "showId": "s123", "ratingValue": 5}
)
```

## Troubleshooting Database Connectivity

If you encounter database connection issues:

1. Verify the ODBC drivers are installed:
   - On macOS: `brew install unixodbc freetds`
   - On Linux: `sudo apt-get install unixodbc unixodbc-dev freetds-dev tdsodbc`
   - On Windows: Install the official Microsoft ODBC Driver for SQL Server

2. Check your firewall settings to ensure your IP is allowed to access the Azure SQL server

3. Verify the connection string parameters in `notebook_recommendation_service.py`

4. Run the test script to get detailed error information:
   ```
   python test_db_connection.py
   ```
