#!/usr/bin/env python3
"""
Script to test the database connection in the recommendation service
"""

import logging
import sys
from notebook_recommendation_service import NotebookRecommendationService, get_connection

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('test_script')

def test_direct_connection():
    """Test direct database connection"""
    logger.info("Testing direct database connection...")
    conn = get_connection()
    
    if conn:
        logger.info("✅ Database connection successful!")
        
        # Test basic query
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) AS movie_count FROM movies_titles")
            row = cursor.fetchone()
            if row:
                logger.info(f"✅ Query successful: Found {row.movie_count} movies in the database")
            else:
                logger.warning("⚠️ Query returned no results")
            cursor.close()
        except Exception as e:
            logger.error(f"❌ Error executing query: {e}")
        
        # Close connection
        conn.close()
        logger.info("Database connection closed")
    else:
        logger.error("❌ Failed to connect to the database")

def test_recommendation_service():
    """Test recommendation service with database connection"""
    logger.info("Testing recommendation service with database connection...")
    
    # Initialize service
    service = NotebookRecommendationService()
    
    if service.conn:
        logger.info("✅ Recommendation service successfully connected to database")
        
        # Test movie retrieval
        try:
            movies = service.get_movie_ids(limit=5)
            if movies:
                logger.info(f"✅ Retrieved movie IDs: {movies}")
            else:
                logger.warning("⚠️ No movie IDs retrieved")
        except Exception as e:
            logger.error(f"❌ Error retrieving movie IDs: {e}")
            
        # Test user retrieval
        try:
            # Just testing a sample query to get user IDs
            if service.conn:
                cursor = service.conn.cursor()
                cursor.execute("SELECT TOP 5 user_id FROM movies_users")
                user_ids = [str(row.user_id) for row in cursor.fetchall()]
                cursor.close()
                
                if user_ids:
                    logger.info(f"✅ Retrieved user IDs: {user_ids}")
                    
                    # Test recommendations for the first user
                    if user_ids:
                        test_user = user_ids[0]
                        logger.info(f"Testing recommendations for user {test_user}")
                        recommendations = service.generate_recommendations(test_user)
                        
                        if recommendations:
                            logger.info("✅ Successfully generated recommendations:")
                            logger.info(f"  - Collaborative: {len(recommendations['collaborative'])} items")
                            logger.info(f"  - Content-based: {len(recommendations['contentBased'])} items")
                            logger.info(f"  - Genres: {len(recommendations['genres'])} genres")
                        else:
                            logger.warning("⚠️ No recommendations generated")
                else:
                    logger.warning("⚠️ No user IDs retrieved")
        except Exception as e:
            logger.error(f"❌ Error in user or recommendation test: {e}")
    else:
        logger.error("❌ Recommendation service could not connect to database")
        logger.info("Testing fallback functionality...")
        
        # Test fallback recommendations
        try:
            recommendations = service.generate_recommendations("500")
            if recommendations:
                logger.info("✅ Successfully generated fallback recommendations:")
                logger.info(f"  - Collaborative: {len(recommendations['collaborative'])} items")
                logger.info(f"  - Content-based: {len(recommendations['contentBased'])} items")
                logger.info(f"  - Genres: {len(recommendations['genres'])} genres")
            else:
                logger.warning("⚠️ No fallback recommendations generated")
        except Exception as e:
            logger.error(f"❌ Error generating fallback recommendations: {e}")

if __name__ == "__main__":
    logger.info("Starting database connection tests")
    
    # Test direct connection
    test_direct_connection()
    
    # Test recommendation service
    test_recommendation_service()
    
    logger.info("All tests completed")
