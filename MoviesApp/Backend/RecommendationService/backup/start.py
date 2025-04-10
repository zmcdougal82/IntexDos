#!/usr/bin/env python3
"""
Movie Recommendation Service Starter

This is the main entry point for starting the recommendation service.
It automatically uses the notebook implementation rather than the deprecated service.

Usage:
  python start.py                  # Start the recommendation API server
  python start.py --generate-only  # Only generate recommendations file, don't start API
  python start.py --verify         # Verify the notebook implementation
  python start.py --help           # Show all available options
"""

import sys
import logging
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('recommendation_service')

def main():
    # Get the script directory
    script_dir = Path(__file__).parent.absolute()
    
    # Path to run_notebook_implementation.py
    notebook_runner = script_dir / "run_notebook_implementation.py"
    
    if not notebook_runner.exists():
        logger.error(f"Could not find notebook runner at {notebook_runner}")
        return 1
    
    # Forward all arguments to the notebook runner
    cmd = [str(notebook_runner)] + sys.argv[1:]
    
    logger.info("Starting recommendation service using notebook implementation...")
    logger.info(f"Command: {' '.join(cmd)}")
    
    # Execute the notebook runner with the same arguments
    try:
        result = subprocess.run(cmd)
        return result.returncode
    except Exception as e:
        logger.error(f"Error starting recommendation service: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
