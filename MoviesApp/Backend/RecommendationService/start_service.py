#!/usr/bin/env python3
"""
Recommendation Service Starter

This script starts the recommendation service and generates the fallback recommendations file.
No Docker required - just run with Python directly.

Usage:
  python start_service.py [--generate-only] [--port PORT]

Options:
  --generate-only    Only generate the recommendations file, don't start the API server
  --port PORT        Specify a custom port (default: 8001)
"""

import os
import sys
import argparse
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('recommendation_starter')

def check_requirements():
    """Check if all required Python packages are installed"""
    logger.info("Checking required packages...")
    try:
        import fastapi
        import uvicorn
        import pandas
        import numpy
        import sklearn
        import pyodbc
        from dotenv import load_dotenv
        logger.info("All required packages are installed")
        return True
    except ImportError as e:
        logger.error(f"Missing required package: {e}")
        logger.info("Please install requirements with: pip install -r requirements.txt")
        return False

def generate_recommendations():
    """Generate the default recommendations file"""
    logger.info("Generating default recommendations file...")
    try:
        from recommendation_service import RecommendationService
        
        # Default output path is the frontend public directory
        output_path = Path("../../Frontend/movies-client/public/homeRecommendations.json")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize service and generate recommendations
        service = RecommendationService()
        success = service.generate_recommendations_file(str(output_path))
        
        if success:
            logger.info(f"Successfully generated recommendations file at {output_path}")
            return True
        else:
            logger.error("Failed to generate recommendations file")
            return False
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return False

def start_api_server(port):
    """Start the FastAPI server using uvicorn"""
    logger.info(f"Starting recommendation API server on port {port}...")
    try:
        import uvicorn
        # Use uvicorn.run to block and keep the server running
        uvicorn.run("api:app", host="0.0.0.0", port=port, reload=True)
    except Exception as e:
        logger.error(f"Error starting API server: {e}")
        return False

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Start the recommendation service')
    parser.add_argument('--generate-only', action='store_true',
                        help='Only generate recommendations file, don\'t start API server')
    parser.add_argument('--port', type=int, default=8001,
                        help='Port to run the API server on (default: 8001)')
    args = parser.parse_args()
    
    # Check if required packages are installed
    if not check_requirements():
        return 1
    
    # Generate recommendations file first (for fallback)
    gen_success = generate_recommendations()
    if not gen_success:
        logger.warning("Continuing with API server despite recommendation generation failure")
    
    # If generate-only flag is set, exit after generating recommendations
    if args.generate_only:
        return 0 if gen_success else 1
    
    # Start the API server
    logger.info("Starting recommendation API server...")
    start_api_server(args.port)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
