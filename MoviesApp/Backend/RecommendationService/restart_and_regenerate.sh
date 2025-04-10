#!/bin/bash
# Script to restart the recommendation service and regenerate recommendations

echo "Stopping any running recommendation service instances..."
pkill -f "python.*app.py" || echo "No running instances found"

echo "Starting recommendation service..."
cd "$(dirname "$0")"
python app.py --port 8001 &
echo "Recommendation service started in the background"

echo "Waiting for service to initialize (5 seconds)..."
sleep 5

echo "Triggering recommendation file generation..."
curl -X POST "http://localhost:8001/recommendations/generate-file"

echo "Done! The recommendations have been updated with the new quality filtering."
echo "Movies with average ratings below 3.5 will no longer appear in recommendations."
