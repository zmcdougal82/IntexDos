#!/usr/bin/env python3
"""
Generate Default Recommendations

This script is used to generate a recommendations file for all users, which
can be used as a fallback if the recommendation API is not available.

Usage:
  python generate_default_recommendations.py [output_path]

By default, it saves the file to the frontend's public directory.
"""

import os
import sys
import json
import logging
from pathlib import Path
from recommendation_service import RecommendationService

def main():
    # Configure logging
    logging.basicConfig(level=logging.INFO, 
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger = logging.getLogger('generate_default_recommendations')
    
    # Default output path is the frontend public directory
    output_path = (sys.argv[1] if len(sys.argv) > 1 
                  else "../../Frontend/movies-client/public/homeRecommendations.json")
    
    # Make sure the output directory exists
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Generating recommendations file at {output_path}")
    
    try:
        # Initialize the recommendation service
        service = RecommendationService()
        
        # Generate recommendations file
        success = service.generate_recommendations_file(str(output_path))
        
        if success:
            logger.info("Successfully generated recommendations file")
        else:
            logger.error("Failed to generate recommendations file")
            return 1
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return 1
        
    return 0

if __name__ == "__main__":
    sys.exit(main())
