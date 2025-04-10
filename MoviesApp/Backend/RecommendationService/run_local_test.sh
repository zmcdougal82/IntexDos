#!/bin/bash
# Script to test the database connection and run the recommendation service locally

echo "=== Testing Recommendation Service with SQL Database Connection ==="
echo ""

# Check if pyodbc is installed
if ! pip list | grep -q pyodbc; then
    echo "Installing pyodbc..."
    pip install pyodbc
fi

# Check if requirements are installed
echo "Ensuring all dependencies are installed..."
pip install -r requirements.txt

# Make test script executable
chmod +x test_db_connection.py

echo ""
echo "=== Running database connection test ==="
python test_db_connection.py

echo ""
echo "=== Starting Flask application locally ==="
echo "Press Ctrl+C to stop the server"
echo ""

# Start Flask app on port 8000
export FLASK_APP=app.py
export FLASK_ENV=development
python app.py

# Note: The server will continue running until manually stopped
