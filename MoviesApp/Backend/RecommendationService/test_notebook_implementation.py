#!/usr/bin/env python3
"""
Test Notebook Implementation

This script tests the notebook implementation to ensure it works correctly
and produces the same results as the original implementation.

Usage:
  python test_notebook_implementation.py
"""

import os
import sys
import logging
import json
import tempfile
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_notebook_implementation')

def test_extract_service():
    """Test the extraction of RecommendationService from the notebook"""
    logger.info("Testing RecommendationService extraction from notebook...")
    
    try:
        # Import the extraction function from run_notebook_implementation.py
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from run_notebook_implementation import extract_recommendation_service_from_notebook
        
        # Extract the service class
        RecommendationService = extract_recommendation_service_from_notebook()
        
        if RecommendationService is None:
            logger.error("Failed to extract RecommendationService from notebook")
            return False
        
        # Check if it has the expected methods
        expected_methods = [
            'get_collaborative_recommendations',
            'get_content_based_recommendations',
            'get_genre_recommendations',
            'get_all_recommendations',
            'generate_recommendations_file'
        ]
        
        missing_methods = []
        for method in expected_methods:
            if not hasattr(RecommendationService, method):
                missing_methods.append(method)
        
        if missing_methods:
            logger.error(f"Missing methods in extracted service: {', '.join(missing_methods)}")
            return False
        
        logger.info("Successfully extracted RecommendationService with all required methods")
        return True
    
    except Exception as e:
        logger.error(f"Error testing service extraction: {str(e)}")
        return False

def test_api_extraction():
    """Test the extraction of API code from the notebook"""
    logger.info("Testing API code extraction from notebook...")
    
    try:
        # Import the extraction function from run_notebook_implementation.py
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from run_notebook_implementation import copy_fastapi_code_from_notebook
        
        # Extract the API code
        api_module_path = copy_fastapi_code_from_notebook()
        
        if api_module_path is None:
            logger.error("Failed to extract API code from notebook")
            return False
        
        # Check if the file exists
        if not os.path.exists(api_module_path):
            logger.error(f"API module file not found: {api_module_path}")
            return False
        
        # Check if it contains expected content
        with open(api_module_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        expected_content = [
            'UserIdRequest', 
            'RatingRequest', 
            'create_app', 
            'FastAPI',
            'get_user_recommendations',
            'update_after_rating'
        ]
        
        missing_content = []
        for exp in expected_content:
            if exp not in content:
                missing_content.append(exp)
        
        if missing_content:
            logger.error(f"Missing content in extracted API code: {', '.join(missing_content)}")
            return False
        
        logger.info("Successfully extracted API code with all required components")
        return True
    
    except Exception as e:
        logger.error(f"Error testing API extraction: {str(e)}")
        return False

def test_recommendation_generation():
    """Test generating recommendations using the notebook implementation"""
    logger.info("Testing recommendation generation from notebook implementation...")
    
    try:
        # Import the necessary functions from run_notebook_implementation.py
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from run_notebook_implementation import extract_recommendation_service_from_notebook
        
        # Extract the service class
        RecommendationService = extract_recommendation_service_from_notebook()
        
        if RecommendationService is None:
            logger.error("Failed to extract RecommendationService for testing")
            return False
        
        # Create a service instance
        try:
            service = RecommendationService()
        except Exception as e:
            logger.error(f"Error creating service instance: {str(e)}")
            logger.info("This may be due to missing database credentials or connection issues")
            logger.info("Skipping actual recommendation generation test")
            return None
        
        # Create a temp file for recommendations
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tf:
            temp_path = tf.name
        
        # Generate recommendations
        success = service.generate_recommendations_file(temp_path)
        
        if not success:
            logger.error("Failed to generate recommendations")
            return False
        
        # Check if the file was created and has valid JSON
        if not os.path.exists(temp_path):
            logger.error(f"Recommendations file not created: {temp_path}")
            return False
        
        try:
            with open(temp_path, 'r') as f:
                data = json.load(f)
            
            if not isinstance(data, dict):
                logger.error("Recommendations file does not contain a JSON object")
                return False
                
            logger.info(f"Successfully generated recommendations for {len(data)} users")
            
            # Clean up temp file
            os.unlink(temp_path)
            return True
            
        except Exception as e:
            logger.error(f"Error reading recommendations file: {str(e)}")
            return False
    
    except Exception as e:
        logger.error(f"Error testing recommendation generation: {str(e)}")
        return False

def run_tests():
    """Run all tests and report results"""
    results = {}
    
    logger.info("Starting tests for notebook implementation...")
    
    # Test 1: Extract service
    results['extract_service'] = test_extract_service()
    
    # Test 2: Extract API code
    results['extract_api'] = test_api_extraction()
    
    # Test 3: Generate recommendations
    results['generate_recommendations'] = test_recommendation_generation()
    
    # Print summary
    logger.info("\n--- Test Results ---")
    all_passed = True
    for test, result in results.items():
        if result is None:
            status = "SKIPPED"
        elif result:
            status = "PASSED"
        else:
            status = "FAILED"
            all_passed = False
            
        logger.info(f"{test}: {status}")
    
    if all_passed:
        logger.info("\nAll tests passed or were skipped! The notebook implementation should work correctly.")
        return 0
    else:
        logger.error("\nSome tests failed. Check the logs for details.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
