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
        # Use database-style IDs (s1, s2, etc.) that match your database
        self.sample_movies = [
            "s1", "s2", "s3", "s4", "s5", 
            "s6", "s7", "s8", "s9", "s10",
            "s11", "s12", "s13", "s14", "s15",
            "s16", "s17", "s18", "s19", "s20",
            "s21", "s22", "s23", "s24", "s25",
            "s26", "s27", "s28", "s29", "s30",
            "s31", "s32", "s33", "s34", "s35",
            "s36", "s37", "s38", "s39", "s40"
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
