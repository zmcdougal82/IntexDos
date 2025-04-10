#!/usr/bin/env python3
"""
Azure Deployment Test Script

This script tests all the components and configuration needed for Azure deployment.
Run this before deploying to Azure to verify that everything is working correctly.
"""

import os
import sys
import json
import logging
import requests
import importlib.util
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('deployment_test')

def check_file_exists(file_path, required=True):
    """Check if a file exists and log the result."""
    exists = os.path.exists(file_path)
    if exists:
        logger.info(f"✅ Found {file_path}")
    else:
        level = logging.ERROR if required else logging.WARNING
        logger.log(level, f"❌ Missing {'required' if required else 'recommended'} file: {file_path}")
    return exists

def check_module_installed(module_name):
    """Check if a Python module is installed."""
    try:
        importlib.import_module(module_name)
        logger.info(f"✅ Module {module_name} is installed")
        return True
    except ImportError:
        logger.error(f"❌ Module {module_name} is NOT installed")
        return False

def check_api_endpoint(url, endpoint):
    """Test an API endpoint and log the result."""
    try:
        response = requests.get(f"{url}{endpoint}", timeout=5)
        if response.status_code == 200:
            logger.info(f"✅ API endpoint {endpoint} is working")
            return True
        else:
            logger.error(f"❌ API endpoint {endpoint} returned status code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Failed to connect to API endpoint {endpoint}: {str(e)}")
        return False

def main():
    """Run all deployment tests."""
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    logger.info("Starting Azure deployment test")
    logger.info("==============================")
    
    # 1. Check required files
    logger.info("\n--- Checking required files ---")
    required_files = [
        "app.py",
        "web.config",
        "requirements.txt",
        "runtime.txt",
        "notebook_api.py",
        "notebook_recommendation_service.py"
    ]
    
    recommended_files = [
        ".deployment",
        "AZURE_DEPLOYMENT.md"
    ]
    
    all_required_files_exist = all(check_file_exists(f) for f in required_files)
    all(check_file_exists(f, required=False) for f in recommended_files)
    
    # 2. Check environment configuration
    logger.info("\n--- Checking environment configuration ---")
    env_vars = {
        "DB_SERVER": os.environ.get("DB_SERVER"),
        "DB_NAME": os.environ.get("DB_NAME"),
        "DB_USERNAME": os.environ.get("DB_USERNAME"),
        "DB_PASSWORD": "********" if os.environ.get("DB_PASSWORD") else None
    }
    
    # Print current environment variables (masking password)
    for var, value in env_vars.items():
        if value:
            logger.info(f"✅ Environment variable {var} is set")
        else:
            logger.warning(f"⚠️ Environment variable {var} is not set")
    
    # 3. Check requirements
    logger.info("\n--- Checking required packages ---")
    required_packages = [
        "fastapi",
        "uvicorn",
        "pandas",
        "numpy",
        "scikit-learn",
        "pyodbc"
    ]
    
    if os.environ.get("APPINSIGHTS_INSTRUMENTATIONKEY"):
        required_packages.append("applicationinsights")
    
    all_packages_installed = all(check_module_installed(pkg) for pkg in required_packages)
    
    # 4. Test API locally (if requested)
    logger.info("\n--- Testing local API ---")
    
    try:
        from notebook_api import app, OUTPUT_PATH
        logger.info(f"✅ Successfully imported FastAPI application")
        logger.info(f"ℹ️ Output path is set to: {OUTPUT_PATH}")
    except Exception as e:
        logger.error(f"❌ Failed to import FastAPI application: {str(e)}")
        all_packages_installed = False
    
    # 5. Test database connection
    logger.info("\n--- Testing database connection ---")
    try:
        # Only attempt if credentials are available
        if env_vars["DB_SERVER"] and env_vars["DB_NAME"]:
            import pyodbc
            
            connection_string = (
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={env_vars['DB_SERVER']};"
                f"DATABASE={env_vars['DB_NAME']};"
            )
            
            if env_vars["DB_USERNAME"] and os.environ.get("DB_PASSWORD"):
                connection_string += f"UID={env_vars['DB_USERNAME']};PWD={os.environ.get('DB_PASSWORD')}"
                
            connection = pyodbc.connect(connection_string)
            cursor = connection.cursor()
            cursor.execute("SELECT @@VERSION")
            row = cursor.fetchone()
            logger.info(f"✅ Successfully connected to database: {row[0][:50]}...")
            connection.close()
        else:
            logger.warning("⚠️ Skipping database connection test due to missing credentials")
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {str(e)}")
    
    # 6. Summary
    logger.info("\n--- Deployment Test Summary ---")
    if all_required_files_exist and all_packages_installed:
        logger.info("✅ All required files and packages are available. Deployment should succeed.")
    else:
        logger.error("❌ Some requirements are missing. Fix the issues above before deploying.")
    
    logger.info("\n--- Suggestion ---")
    logger.info("To test the full application locally:")
    logger.info("1. Run 'python app.py' to start the server")
    logger.info("2. Access http://localhost:8001/health to verify it's running")
    logger.info("3. Test API endpoints with a tool like curl or Postman")
    
    return 0 if all_required_files_exist and all_packages_installed else 1

if __name__ == "__main__":
    sys.exit(main())
