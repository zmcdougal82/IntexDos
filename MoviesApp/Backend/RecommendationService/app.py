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
        
        # Generate recommendations
        recommendations = recommendation_service.generate_recommendations(user_id)
        
        return jsonify(recommendations)
    except Exception as e:
        logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
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
