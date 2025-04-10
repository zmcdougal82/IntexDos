# Movie Recommendation Service

This service provides personalized movie recommendations for users based on their rating history. It implements multiple recommendation strategies to provide a rich, personalized experience.

## Features

1. **Multi-Strategy Recommendations**
   - **Collaborative Filtering**: Recommends movies that similar users have enjoyed
   - **Content-Based Filtering**: Recommends movies similar to what the user has liked based on movie attributes
   - **Genre-Based Recommendations**: Provides genre-specific recommendations based on user preferences

2. **Dynamic Updates**
   - Recommendations update when users log in
   - Recommendations update when users submit new ratings
   - Admin ability to regenerate all recommendations

3. **Fallback Mechanism**
   - Static recommendation file generation for high availability
   - Frontend gracefully falls back to static recommendations if service is unavailable

## Technical Details

### Components

- **Python Backend**
  - `recommendation_service.py`: Core recommendation algorithms and data processing
  - `api.py`: FastAPI service exposing recommendation endpoints
  - `generate_default_recommendations.py`: Script to generate fallback recommendation file

- **.NET Integration**
  - `RecommendationsController.cs`: Controller in the main API for proxying recommendation requests
  - `RatingsController.cs`: Sends update events to recommendation service when ratings change

### Prerequisites

- Python 3.8+
- ODBC Driver 17 for SQL Server
- Access to the Azure SQL database

### Installation

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Configure the `.env` file with database credentials and other settings:
   ```
   DB_SERVER=your-server-name.database.windows.net
   DB_NAME=your-database-name
   DB_USERNAME=your-username
   DB_PASSWORD=your-password
   API_PORT=8001
   ```

### Running the Service

### Without Docker (Recommended)

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the start script to both generate recommendations and start the API:
   ```
   python start_service.py
   ```

   Or to only generate the recommendations file without starting the API:
   ```
   python start_service.py --generate-only
   ```

### Using Docker (Optional)

If you prefer to use Docker:

1. Build and start the service using docker-compose:
   ```
   docker-compose up -d
   ```

2. Generate recommendations file:
   ```
   docker exec -it movie-recommendation-service python generate_default_recommendations.py
   ```

### API Endpoints

- `GET /recommendations/{user_id}`: Get all recommendation types for a user
- `GET /recommendations/{user_id}/collaborative`: Get collaborative filtering recommendations
- `GET /recommendations/{user_id}/content-based`: Get content-based recommendations 
- `GET /recommendations/{user_id}/genres`: Get genre-specific recommendations
- `POST /recommendations/update-after-rating`: Trigger recommendation update after a new rating
- `POST /recommendations/generate-file`: Generate a static recommendations file

## Integration

### Frontend Integration

The frontend HomeRecommender component calls the recommendation API through the .NET backend, displaying recommendations in categories:

1. "Movies Similar Users Enjoyed" (collaborative filtering)
2. "Based on Your Taste" (content-based filtering)
3. Genre-specific sections like "Recommended in Action" or "Recommended in Comedy"

### Backend Integration

The .NET backend proxies requests to the recommendation service and triggers updates when:

1. A user submits a new rating
2. A user updates an existing rating

## Deployment

For production deployment:

1. Option 1 (Without Docker):
   - Set up a Python environment on your hosting platform
   - Install dependencies with `pip install -r requirements.txt`
   - Use a process manager like Supervisor or PM2 to keep the service running
   - Run the service with `python start_service.py`

2. Option 2 (With Docker):
   - Build a Docker container with the recommendation service
   - Deploy to Azure App Service or Azure Container Instances
   - Update the frontend and backend to point to the deployed recommendation service URL
   - Set up continuous generation of the fallback recommendation file

## Future Improvements

- Add user clustering for improved collaborative filtering
- Implement popularity-based recommendations for new users (cold start)
- Add temporal dynamics to consider recent viewing trends
- Implement A/B testing of different recommendation algorithms
