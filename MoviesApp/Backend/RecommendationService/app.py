#!/usr/bin/env python3
"""
Flask application for Azure App Service that serves the recommendation API
with SQL database connectivity
"""

import os
import sys
import logging
import json
from flask import Flask, jsonify, request
from notebook_recommendation_service import NotebookRecommendationService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('recommendation_service')

# Initialize Flask app
app = Flask(__name__)

# Load environment variables
# Note: Database connection parameters are handled in the recommendation service
RECOMMENDATION_DATA_PATH = os.getenv('RECOMMENDATION_DATA_PATH', 'recommendations.json')
DEFAULT_OUTPUT_PATH = os.getenv('DEFAULT_OUTPUT_PATH', '../Frontend/movies-client/public/homeRecommendations.json')

# Initialize recommendation service
# The service will automatically try to connect to the database or fall back to sample data
recommendation_service = NotebookRecommendationService()

# Log connection status
if hasattr(recommendation_service, 'conn') and recommendation_service.conn:
    logger.info("Recommendation service initialized with database connection")
else:
    logger.warning("Recommendation service initialized with fallback sample data (no database connection)")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    db_status = "connected" if hasattr(recommendation_service, 'conn') and recommendation_service.conn else "disconnected"
    return jsonify({
        "status": "healthy", 
        "service": "recommendation-service",
        "database": db_status
    })

@app.route('/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    """Get recommendations for a specific user."""
    try:
        logger.info(f"Generating all recommendations for user {user_id}")
        
        # Get page and limit from query parameters, with defaults
        page = request.args.get('page', default=0, type=int)
        limit = request.args.get('limit', default=10, type=int)
        
        # Generate recommendations with pagination
        recommendations = recommendation_service.generate_recommendations(user_id, page=page, limit=limit)
        
        return jsonify(recommendations)
    except Exception as e:
        logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/<user_id>/more', methods=['GET'])
def get_more_recommendations(user_id):
    """Get more recommendations for a specific user and section."""
    try:
        section = request.args.get('section', default='collaborative', type=str)
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        
        logger.info(f"Generating more {section} recommendations for user {user_id}, page {page}")
        
        # Generate more recommendations for the specified section
        recommendations = recommendation_service.generate_more_recommendations(user_id, section, page, limit)
        
        return jsonify(recommendations)
    except Exception as e:
        logger.error(f"Error generating more recommendations for user {user_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/top-rated', methods=['GET'])
def get_top_rated_movies():
    """Get top rated movies."""
    try:
        limit = request.args.get('limit', default=20, type=int)
        logger.info(f"Getting top-rated movies with limit {limit}")
        
        movies = recommendation_service.get_top_rated_movies(limit)
        
        return jsonify(movies)
    except Exception as e:
        logger.error(f"Error getting top rated movies: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/popular', methods=['GET'])
def get_popular_movies():
    """Get popular movies."""
    try:
        limit = request.args.get('limit', default=20, type=int)
        logger.info(f"Getting popular movies with limit {limit}")
        
        movies = recommendation_service.get_popular_movies(limit)
        
        return jsonify(movies)
    except Exception as e:
        logger.error(f"Error getting popular movies: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/genre/<genre>', methods=['GET'])
def get_movies_by_genre(genre):
    """Get movies by genre."""
    try:
        limit = request.args.get('limit', default=20, type=int)
        logger.info(f"Getting movies for genre {genre} with limit {limit}")
        
        movies = recommendation_service.get_genre_movies(genre, limit)
        
        return jsonify(movies)
    except Exception as e:
        logger.error(f"Error getting movies for genre {genre}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/hidden-gems', methods=['GET'])
def get_hidden_gems():
    """Get hidden gems (well-rated but less known films)."""
    try:
        limit = request.args.get('limit', default=20, type=int)
        logger.info(f"Getting hidden gem movies with limit {limit}")
        
        # We'll implement a simple version by getting top rated movies with few ratings
        # A more sophisticated implementation would be added to the NotebookRecommendationService class
        
        # For now, we'll use the sample data as a fallback
        movies = recommendation_service.get_top_rated_movies(limit*2)  # Get more to allow for filtering
        
        # Take a random sample - in a real implementation this would be more sophisticated
        import random
        random.seed(42)  # For reproducibility
        if len(movies) > limit:
            movies = random.sample(movies, limit)
        
        return jsonify(movies)
    except Exception as e:
        logger.error(f"Error getting hidden gems: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/similar-to/<show_id>', methods=['GET'])
def get_similar_movies(show_id):
    """Get movies similar to a specific movie."""
    try:
        limit = request.args.get('limit', default=20, type=int)
        logger.info(f"Getting similar movies to {show_id} with limit {limit}")
        
        # This would ideally call a content-based filtering method
        # For now, we'll use genre similarity as a simple approach
        
        # Get the movie's genres
        if hasattr(recommendation_service, 'conn') and recommendation_service.conn:
            cursor = recommendation_service.conn.cursor()
            cursor.execute("SELECT * FROM movies_titles WHERE show_id = ?", (show_id,))
            movie = cursor.fetchone()
            
            if movie:
                # For simplicity, just get some movies from the same genre
                # In a real implementation, this would be more sophisticated
                genre_columns = [
                    "Action", "Adventure", "Comedies", "Dramas", 
                    "HorrorMovies", "Thrillers", "Documentaries"
                ]
                
                # Find which genres this movie belongs to
                movie_genres = []
                for genre in genre_columns:
                    if hasattr(movie, genre) and getattr(movie, genre) > 0:
                        movie_genres.append(genre)
                
                if movie_genres:
                    # Get a random genre from the movie's genres
                    genre = random.choice(movie_genres)
                    movies = recommendation_service.get_genre_movies(genre, limit)
                    
                    # Remove the original movie if it's in the results
                    movies = [m for m in movies if m != show_id]
                    
                    # Limit to the requested number
                    movies = movies[:limit]
                    
                    return jsonify(movies)
            
        # Fallback to random movie selection if we couldn't find similar movies
        movies = recommendation_service.get_movie_ids(limit*2)
        # Remove the original movie if it's in the results
        movies = [m for m in movies if m != show_id]
        # Select a subset
        if len(movies) > limit:
            movies = random.sample(movies, limit)
            
        return jsonify(movies)
    except Exception as e:
        logger.error(f"Error getting similar movies to {show_id}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/update-after-rating', methods=['POST'])
def update_after_rating():
    """Update recommendations after a user rates a movie."""
    try:
        data = request.json
        user_id = data.get('userId')
        show_id = data.get('showId')
        rating = data.get('ratingValue')
        
        logger.info(f"Updating recommendations after user {user_id} rated show {show_id} with {rating}")
        
        # Update model with new rating (in a real system)
        # This would update the recommendation model, but for now we'll just log it
        
        return jsonify({"success": True, "message": "Rating recorded for future recommendations"})
    except Exception as e:
        logger.error(f"Error updating recommendations after rating: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommendations/generate-file', methods=['POST'])
def generate_recommendations_file():
    """Generate recommendations file for all users."""
    try:
        output_path = request.args.get('output_path', DEFAULT_OUTPUT_PATH)
        logger.info(f"Generating recommendations file at {output_path}")
        
        # Generate recommendations for all users (sample implementation)
        all_recommendations = recommendation_service.generate_all_recommendations()
        
        # Save to file
        directory = os.path.dirname(output_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
            
        with open(output_path, 'w') as f:
            json.dump(all_recommendations, f)
            
        logger.info(f"Saved recommendations for {len(all_recommendations)} users to {output_path}")
        
        return jsonify({"success": True, "message": "Successfully generated recommendations file"})
    except Exception as e:
        logger.error(f"Error generating recommendations file: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the recommendation service Flask app')
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', 8000)),
                        help='Port to run the server on (default: 8000)')
    args = parser.parse_args()
    
    # Run the Flask app
    logger.info(f"Starting Flask app on port {args.port}")
    app.run(host='0.0.0.0', port=args.port)
