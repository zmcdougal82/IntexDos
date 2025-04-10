# PowerShell script to test the database connection and run the recommendation service locally

Write-Host "=== Testing Recommendation Service with SQL Database Connection ===" -ForegroundColor Cyan
Write-Host ""

# Check if pyodbc is installed
$pyodbcInstalled = python -c "import pkgutil; print(1 if pkgutil.find_loader('pyodbc') else 0)" 2>$null
if ($pyodbcInstalled -ne "1") {
    Write-Host "Installing pyodbc..." -ForegroundColor Yellow
    pip install pyodbc
}

# Check if requirements are installed
Write-Host "Ensuring all dependencies are installed..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host ""
Write-Host "=== Running database connection test ===" -ForegroundColor Cyan
python test_db_connection.py

Write-Host ""
Write-Host "=== Starting Flask application locally ===" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Set environment variables for Flask
$env:FLASK_APP = "app.py"
$env:FLASK_ENV = "development"

# Start Flask app on port 8000
python app.py

# Note: The server will continue running until manually stopped
