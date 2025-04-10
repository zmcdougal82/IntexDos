#!/usr/bin/env python3
"""
Simplified Recommendation Service Runner

This script runs the recommendation service using pre-extracted files
rather than extracting code from the notebook at runtime.
"""

import os
import sys
import argparse
import logging
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('recommendation_service')

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the recommendation service')
    parser.add_argument('--generate-only', action='store_true',
                        help='Only generate recommendations file, don\'t start API server')
    parser.add_argument('--port', type=int, default=8001,
                        help='Port to run the API server on (default: 8001)')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging')
    args = parser.parse_args()
    
    # Set logging level based on debug flag
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")
    
    # Add current directory to path for imports
    sys.path.insert(0, '.')
    
    # Try to import the RecommendationService class
    try:
        from notebook_recommendation_service import RecommendationService
        logger.info("Successfully imported RecommendationService")
        
        # Generate recommendations file if requested
        if args.generate_only:
            try:
                # Create RecommendationService instance
                service = RecommendationService()
                
                # Generate recommendations file
                output_path = "../../Frontend/movies-client/public/homeRecommendations.json"
                logger.info(f"Generating recommendations file at {output_path}")
                
                success = service.generate_recommendations_file(output_path)
                if success:
                    logger.info("Successfully generated recommendations file")
                    return 0
                else:
                    logger.error("Failed to generate recommendations file")
                    return 1
            except Exception as e:
                logger.error(f"Error generating recommendations: {e}")
                return 1
        
        # Start the API server
        logger.info(f"Starting recommendation API server on port {args.port}")
        uvicorn.run("notebook_api:app", host="0.0.0.0", port=args.port, reload=True)
        
        return 0
    except ImportError as e:
        logger.error(f"Error importing modules: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
