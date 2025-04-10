# Movie Recommendation System - Quick Start Guide

This guide provides the essential steps to get the recommendation system up and running quickly.

## Setup

1. Install Python dependencies:
   ```bash
   cd MoviesApp/Backend/RecommendationService
   pip install -r requirements.txt
   ```

2. Make sure the `.env` file is properly configured with the database credentials:
   ```
   DB_SERVER=moviesapp-sql-79427.database.windows.net
   DB_NAME=MoviesDB
   DB_USERNAME=sqladmin
   DB_PASSWORD=P@ssw0rd123!
   API_PORT=8001
   ```

## Starting the Service

Run the service with a single command:
```bash
python start_service.py
```

This will:
1. Generate the default recommendations file (for fallback)
2. Start the recommendation API server

## Testing

Once the service is running, you can access:
- API documentation: http://localhost:8001/docs
- Health check: http://localhost:8001/health

Example API call to get a user's recommendations:
```bash
curl http://localhost:8001/recommendations/1
```

## Integration with the Frontend

The frontend will automatically use the recommendation service when:
1. A user logs in
2. The HomeRecommender component renders
3. A user submits a new rating

If the recommendation service is unavailable, the system will fall back to using the static recommendations file.

## Development Workflow

1. Make changes to the recommendation algorithms in `recommendation_service.py`
2. The server will automatically reload when you save changes
3. Test the changes by viewing recommendations in the frontend
4. For significant changes, regenerate the static recommendations file:
   ```bash
   python start_service.py --generate-only
   ```

## Troubleshooting

1. If you see "No recommendations available" in the UI:
   - Check if the recommendation service is running
   - Verify the user has at least a few ratings in the system
   - Check browser console for API errors

2. Database connection issues:
   - Verify the connection string in `.env` file
   - Make sure ODBC Driver 17 for SQL Server is installed
   - Check firewall settings allow connections to the database

3. Viewing logs:
   - The recommendation service logs to the console
   - More detailed logs are in the API response for debugging
