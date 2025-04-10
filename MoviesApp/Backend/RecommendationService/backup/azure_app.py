#!/usr/bin/env python3
"""
Movie Recommendation Service - Simplified Azure App Service Entry Point

This version is optimized for Azure App Service deployment.
"""

import os
import sys
import logging
from notebook_api import app

# Configure logging for Azure App Service
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Azure App Service captures stdout for logs
    ]
)
logger = logging.getLogger('recommendation_service')

# Use the app directly rather than launching uvicorn
# Azure App Service will handle this differently
application = app
