import os
import json
import logging
import random
from datetime import datetime

# Configure logging
logger = logging.getLogger('recommendation_service')

class NotebookRecommendationService:
    """
    Simplified recommendation service for Azure deployment.
    This version uses a local file for recommendations to avoid
    loading the full ML models in the cloud environment.
    """
    
    def __init__(self):
        """Initialize the recommendation service."""
        self.sample_movies = [
            "tt0111161", "tt0068646", "tt0071562", "tt0468569", "tt0050083", 
            "tt0108052", "tt0167260", "tt0110912", "tt0060196", "tt0120737",
            "tt0109830", "tt0167261", "tt0080684", "tt0133093", "tt0099685",
            "tt0073486", "tt0047478", "tt0114369", "tt0317248", "tt0038650",
            "tt0102926", "tt0076759", "tt0120815", "tt0103064", "tt0088763",
            "tt0054215", "tt0110413", "tt0120586", "tt0021749", "tt0120689",
            "tt0245429", "tt0209144", "tt0056058", "tt0095327", "tt0910970",
            "tt0407887", "tt0114814", "tt0172495", "tt0040522", "tt0482571"
        ]
        self.genres = [
            "Action", "Comedy", "Drama", "Horror", "SciFi", 
            "Thriller", "Romance", "Animation", "Documentary"
        ]
        logger.info("Recommendation service initialized with sample data")
    
    def generate_recommendations(self, user_id):
        """
        Generate recommendations for a specific user.
        
        Args:
            user_id (str): The user ID to generate recommendations for.
            
        Returns:
            dict: A dictionary containing collaborative, content-based, and genre recommendations.
        """
        logger.info(f"Generating all recommendations for user {user_id}")
        
        # Generate fixed but deterministic recommendations based on user_id
        # This ensures the same user always gets the same recommendations
        random.seed(int(user_id) if user_id.isdigit() else sum(ord(c) for c in user_id))
        
        # Create collaborative filtering recommendations
        collaborative = random.sample(self.sample_movies, min(10, len(self.sample_movies)))
        logger.info(f"Found {len(collaborative)} collaborative recommendations")
        
        # Create content-based recommendations
        content_based = random.sample(self.sample_movies, min(10, len(self.sample_movies)))
        logger.info(f"Found {len(content_based)} content-based recommendations")
        
        # Create genre-based recommendations
        genres_dict = {}
        selected_genres = random.sample(self.genres, min(3, len(self.genres)))
        
        for genre in selected_genres:
            genres_dict[genre] = random.sample(self.sample_movies, min(5, len(self.sample_movies)))
        
        logger.info(f"Generated recommendations for {len(genres_dict)} genres")
        logger.info(f"Generated all recommendations for user {user_id}")
        
        return {
            "collaborative": collaborative,
            "contentBased": content_based,
            "genres": genres_dict
        }
    
    def generate_all_recommendations(self):
        """
        Generate recommendations for all sample users.
        For demonstration purposes, we'll generate for users 500-600.
        
        Returns:
            dict: A dictionary mapping user IDs to their recommendations.
        """
        all_recommendations = {}
        
        # Generate for sample users 500-600
        for user_id in range(500, 600):
            try:
                logger.info(f"Generating all recommendations for user {user_id}")
                all_recommendations[str(user_id)] = self.generate_recommendations(str(user_id))
            except Exception as e:
                logger.error(f"Error generating recommendations for user {user_id}: {str(e)}")
        
        return all_recommendations
