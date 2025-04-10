#!/usr/bin/env python3
"""
Recommendation Service Notebook Runner

This script executes the recommendation implementation from the Jupyter notebook,
making it compatible with the existing application architecture.

Usage:
  python run_notebook_implementation.py [--generate-only] [--port PORT]

Options:
  --generate-only    Only generate the recommendations file, don't start the API server
  --port PORT        Specify a custom port (default: 8001)
"""

import os
import sys
import argparse
import importlib.util
import logging
import nbformat
from pathlib import Path
import tempfile
import subprocess

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('notebook_runner')

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
        import nbformat
        import nbconvert
        from dotenv import load_dotenv
        logger.info("All required packages are installed")
        return True
    except ImportError as e:
        logger.error(f"Missing required package: {e}")
        logger.info("Please install requirements with: pip install -r requirements.txt")
        logger.info("For notebook execution, also run: pip install nbformat nbconvert")
        return False

def extract_recommendation_service_from_notebook():
    """Extract RecommendationService class from the notebook"""
    try:
        notebook_path = Path("recommendation_system_final.ipynb")
        if not notebook_path.exists():
            logger.error(f"Notebook file not found: {notebook_path}")
            return None

        # Read the notebook
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = nbformat.read(f, as_version=4)

        # Find the cell containing the RecommendationService class definition
        service_cell = None
        for cell in notebook.cells:
            if cell.cell_type == 'code' and 'class RecommendationService' in cell.source:
                service_cell = cell
                break

        if not service_cell:
            logger.error("Could not find RecommendationService class in notebook")
            return None

        # Extract the code
        service_code = service_cell.source

        # Create a Python module in the current directory (not temp dir)
        # This ensures it's importable by the API
        module_path = "notebook_recommendation_service.py"
        
        # Write the required imports and service class
        with open(module_path, 'w', encoding='utf-8') as f:
            f.write("""
import os
import json
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import pyodbc
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()
""")
            # Add the service class code
            f.write(service_code)

        # Import the module
        spec = importlib.util.spec_from_file_location("notebook_recommendation_service", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        logger.info("Successfully extracted RecommendationService from notebook")
        return module.RecommendationService
    except Exception as e:
        logger.error(f"Error extracting from notebook: {str(e)}")
        return None

def generate_recommendations(RecommendationService):
    """Generate the default recommendations file using the notebook implementation"""
    logger.info("Generating default recommendations file using notebook implementation...")
    try:
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

def copy_fastapi_code_from_notebook():
    """Extract FastAPI setup code from the notebook and create a temporary api module"""
    try:
        notebook_path = Path("recommendation_system_final.ipynb")
        if not notebook_path.exists():
            logger.error(f"Notebook file not found: {notebook_path}")
            return None

        # Read the notebook
        with open(notebook_path, 'r', encoding='utf-8') as f:
            notebook = nbformat.read(f, as_version=4)

        # Find the cells containing the FastAPI code
        api_cells = []
        found_fastapi = False
        for cell in notebook.cells:
            if cell.cell_type == 'code':
                if 'class UserIdRequest(BaseModel)' in cell.source:
                    api_cells.append(cell)
                    found_fastapi = True
                elif found_fastapi and 'def create_app()' in cell.source:
                    api_cells.append(cell)
                    break

        if not api_cells:
            logger.error("Could not find FastAPI code in notebook")
            return None

        # Create a Python module in the current directory (not temp dir)
        # This ensures it's importable by other modules
        module_path = "notebook_api.py"
        
        # Write the API code
        with open(module_path, 'w', encoding='utf-8') as f:
            f.write("""
import os
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
from notebook_recommendation_service import RecommendationService

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('recommendation_api')
""")
            
            # Add the API model definitions and app creation function
            for cell in api_cells:
                f.write(cell.source + "\n\n")
                
            # Add code to create the app instance
            f.write("""
# Create app instance
app = create_app()
""")

        logger.info(f"Created API module at {module_path}")
        return module_path
    except Exception as e:
        logger.error(f"Error extracting API code from notebook: {str(e)}")
        return None

def start_api_server(port, api_module_path):
    """Start the FastAPI server using the notebook implementation"""
    logger.info(f"Starting notebook-based recommendation API server on port {port}...")
    try:
        # Get the module name without the .py extension
        api_module = os.path.basename(api_module_path).replace('.py', '')
        
        # Make sure current directory is in sys.path
        if not '.' in sys.path:
            sys.path.insert(0, '.')
        
        # Start the server
        import uvicorn
        uvicorn.run(f"{api_module}:app", host="0.0.0.0", port=port, reload=True)
    except Exception as e:
        logger.error(f"Error starting API server: {e}")
        return False

def verify_notebook_implementation():
    """Verify that the notebook implementation can be extracted and used"""
    logger.info("Verifying notebook implementation...")
    
    # Check if notebook file exists
    notebook_path = Path("recommendation_system_final.ipynb")
    if not notebook_path.exists():
        logger.error(f"Notebook file not found: {notebook_path}")
        return False
        
    # Extract RecommendationService from notebook
    service_class = extract_recommendation_service_from_notebook()
    if not service_class:
        logger.error("Failed to extract RecommendationService from notebook")
        return False
        
    # Check for required methods
    required_methods = [
        'get_collaborative_recommendations',
        'get_content_based_recommendations', 
        'get_genre_recommendations',
        'get_all_recommendations',
        'generate_recommendations_file'
    ]
    
    missing_methods = []
    for method in required_methods:
        if not hasattr(service_class, method):
            missing_methods.append(method)
    
    if missing_methods:
        logger.error(f"Missing methods in notebook implementation: {', '.join(missing_methods)}")
        return False
    
    # Extract API code
    api_module_path = copy_fastapi_code_from_notebook()
    if not api_module_path:
        logger.error("Failed to extract API code from notebook")
        return False
        
    logger.info("✅ Notebook implementation verification successful!")
    return True

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the recommendation service from notebook implementation')
    parser.add_argument('--generate-only', action='store_true',
                        help='Only generate recommendations file, don\'t start API server')
    parser.add_argument('--port', type=int, default=8001,
                        help='Port to run the API server on (default: 8001)')
    parser.add_argument('--verify', action='store_true',
                        help='Verify notebook implementation without running anything')
    parser.add_argument('--debug', action='store_true',
                        help='Enable debug logging')
    args = parser.parse_args()
    
    # Set logging level based on debug flag
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")
    
    # Check if required packages are installed
    if not check_requirements():
        return 1
    
    # If verify flag is set, just verify the implementation and exit
    if args.verify:
        if verify_notebook_implementation():
            logger.info("Notebook implementation verification passed!")
            return 0
        else:
            logger.error("Notebook implementation verification failed!")
            return 1
    
    # Extract RecommendationService from notebook
    logger.info("Extracting RecommendationService from notebook...")
    RecommendationService = extract_recommendation_service_from_notebook()
    if not RecommendationService:
        logger.error("Failed to extract recommendation service from notebook")
        return 1
    
    logger.info("RecommendationService extracted successfully")
    
    # Generate recommendations file first (for fallback)
    gen_success = generate_recommendations(RecommendationService)
    if not gen_success:
        logger.warning("Continuing with API server despite recommendation generation failure")
    
    # If generate-only flag is set, exit after generating recommendations
    if args.generate_only:
        return 0 if gen_success else 1
    
    # Use the local notebook_api.py file we manually created instead of extracting
    api_module_path = "notebook_api.py"
    logger.info(f"Using local API module: {api_module_path}")
    
    # Start the API server
    logger.info("Starting recommendation API server using notebook implementation...")
    start_api_server(args.port, api_module_path)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
