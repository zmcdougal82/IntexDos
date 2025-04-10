# Movie Recommendation System

This directory contains a multi-tiered movie recommendation system that provides personalized movie recommendations based on user ratings data stored in an Azure SQL database. The system has been refactored to run directly from a Jupyter notebook implementation.

## Features

The recommendation system offers three distinct recommendation approaches:

1. **Collaborative Filtering** - Recommends movies that similar users have rated highly. This approach finds users with similar taste profiles and recommends highly-rated movies from their collections.

2. **Content-Based Filtering** - Recommends movies similar to ones the user has already rated highly, using metadata like genre, director, etc.

3. **Genre-Based Recommendations** - Provides specialized recommendations by genre, focusing on the user's most preferred genres based on their rating history.

## Dynamic Recommendation Updates

The system updates recommendations under two conditions:
- When a user logs in
- When a user leaves a new rating for a movie

## Components

- **recommendation_system_final.ipynb** - Jupyter notebook that contains the complete implementation
- **run_notebook_implementation.py** - Script to extract and run code from the notebook
- **start.py** - Simplified script to start the recommendation service
- **test_notebook_implementation.py** - Script to test the notebook implementation works correctly
- **HOW_IT_WORKS.md** - Detailed documentation on the recommendation algorithms
- **obsolete/** - Directory containing the old implementation (for reference only)

## Setup Instructions

1. Install required packages:
   ```
   pip install -r requirements.txt
   ```

2. Configure environment variables in `.env` file:
   ```
   DB_SERVER=your-azure-sql-server.database.windows.net
   DB_NAME=your-database-name
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   ```

3. Run the recommendation service:
   ```
   python start.py
   ```

   Or use these options:
   ```
   python start.py --generate-only  # Only generate recommendations file
   python start.py --verify         # Verify the notebook implementation
   ```

## API Endpoints

The recommendation service provides the following endpoints:

- `GET /health` - Health check endpoint
- `GET /recommendations/{user_id}` - Get all recommendations for a user
- `POST /recommendations/update-after-rating` - Update recommendations after a new rating
- `POST /recommendations/generate-file` - Generate a recommendations file

## Using the Jupyter Notebook

The `recommendation_system_final.ipynb` notebook provides an interactive way to work with the recommendation system. It includes:

1. The complete recommendation engine implementation
2. FastAPI service setup
3. Interactive testing capabilities 
4. Utility functions to generate recommendation files

To use the notebook:

1. Open it in Jupyter or JupyterLab:
   ```
   jupyter notebook recommendation_system_final.ipynb
   ```

2. Run all cells to load the recommendation engine
3. Use the interactive testing section to test recommendations for specific users
4. Optionally set `RUN_SERVER = True` to start the FastAPI server from the notebook

## Frontend Integration

The recommendation system integrates with the React frontend through the API endpoints. The frontend can:

1. Fetch personalized recommendations when a user logs in
2. Update recommendations when a user submits a new rating
3. Display different recommendation types (collaborative, content-based, and genre-specific)

## Example Usage (Python)

```python
import requests

# Get recommendations for a user
response = requests.get("http://localhost:8001/recommendations/405")
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
    "http://localhost:8001/recommendations/update-after-rating",
    json={"user_id": "405", "show_id": "s123", "rating_value": 5}
)
