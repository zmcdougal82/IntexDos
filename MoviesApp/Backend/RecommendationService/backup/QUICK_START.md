# Movie Recommendation System - Quick Start Guide

This guide will help you quickly set up and run the movie recommendation system.

## Prerequisites

- Python 3.8 or higher
- Access to an Azure SQL database with movie ratings data
- Database connection details (server, name, username, password)

## 1. Installation

```bash
# Clone the repository (if you haven't already)
# Navigate to the RecommendationService directory
cd /path/to/MoviesApp/Backend/RecommendationService

# Install required packages
pip install -r requirements.txt
```

## 2. Configuration

Create a `.env` file in the RecommendationService directory with your database credentials:

```
DB_SERVER=your-azure-sql-server.database.windows.net
DB_NAME=your-database-name
DB_USERNAME=your-username
DB_PASSWORD=your-password
```

## 3. Running the Recommendation System

You have two options for running the recommendation system:

### Option A: Using the Traditional Python Implementation

#### Generate Recommendations File

To pre-generate recommendations for all users (this will save time during app usage):

```bash
python generate_default_recommendations.py
```

This creates a JSON file at `../../Frontend/movies-client/public/homeRecommendations.json` that the front-end can use as a fallback.

#### Start the API Service

To start the recommendation API server:

```bash
python start_service.py
```

### Option B: Using the Jupyter Notebook Implementation

The system can also run using the Jupyter notebook implementation, which provides the same functionality but allows for interactive exploration and visualization:

```bash
# Only generate the recommendations file
python run_notebook_implementation.py --generate-only

# Or start the full API service using the notebook implementation
python run_notebook_implementation.py
```

This extracts the code from the notebook and runs it as a normal Python service.

## 4. Interactive Exploration with Jupyter Notebook

For interactive exploration and development:

```bash
jupyter notebook recommendation_system_final.ipynb
```

This notebook contains the complete implementation and allows you to:
- Test and visualize recommendation algorithms
- Modify parameters and see immediate results
- Generate recommendation files
- Optionally start the API server directly from the notebook

## 5. Testing the API

Test that the API is working:

```bash
# Check health endpoint
curl http://localhost:8001/health

# Get recommendations for a user (replace 405 with a valid user ID)
curl http://localhost:8001/recommendations/405
```

## 6. Integration with Frontend

The recommendation system is already integrated with the React frontend. The recommendations will appear on the home page when a user logs in.

## Common Issues

- **Database Connection Errors**: Verify your `.env` file contains the correct database credentials
- **No Recommendations**: Make sure the user has ratings in the database
- **API Not Responding**: Check that the API service is running on port 8001
- **Notebook Execution Errors**: Make sure you have all the required packages installed
