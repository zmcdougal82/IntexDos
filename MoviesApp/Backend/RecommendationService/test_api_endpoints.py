#!/usr/bin/env python3
"""
Script to test the recommendation service API endpoints
"""

import requests
import json
import sys

def test_health_endpoint(base_url):
    """Test the health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    try:
        response = requests.get(f"{base_url}/health")
        response.raise_for_status()
        
        data = response.json()
        print(f"Status: {data.get('status')}")
        print(f"Service: {data.get('service')}")
        print(f"Database: {data.get('database')}")
        
        if data.get('database') == "connected":
            print("✅ Database is connected!")
        else:
            print("⚠️ Database is disconnected, using fallback data")
            
        return True
    except Exception as e:
        print(f"❌ Health endpoint test failed: {e}")
        return False

def test_recommendations_endpoint(base_url, user_id="505"):
    """Test the recommendations endpoint for a specific user"""
    print(f"\n=== Testing Recommendations Endpoint for User {user_id} ===")
    try:
        response = requests.get(f"{base_url}/recommendations/{user_id}")
        response.raise_for_status()
        
        data = response.json()
        
        # Check collaborative recommendations
        collab_count = len(data.get('collaborative', []))
        print(f"Collaborative recommendations: {collab_count} items")
        
        # Check content-based recommendations
        content_count = len(data.get('contentBased', []))
        print(f"Content-based recommendations: {content_count} items")
        
        # Check genre recommendations
        genres = data.get('genres', {})
        genre_count = len(genres)
        print(f"Genre recommendations: {genre_count} genres")
        
        for genre, movies in genres.items():
            print(f"  - {genre}: {len(movies)} movies")
        
        if collab_count > 0 and content_count > 0 and genre_count > 0:
            print("✅ Recommendations endpoint working correctly")
            return True
        else:
            print("⚠️ Recommendations endpoint returned incomplete data")
            return False
    except Exception as e:
        print(f"❌ Recommendations endpoint test failed: {e}")
        return False

def test_update_after_rating_endpoint(base_url):
    """Test the update-after-rating endpoint"""
    print("\n=== Testing Update After Rating Endpoint ===")
    try:
        payload = {
            "userId": "505",
            "showId": "s25",
            "ratingValue": 5
        }
        
        response = requests.post(
            f"{base_url}/recommendations/update-after-rating",
            json=payload
        )
        response.raise_for_status()
        
        data = response.json()
        if data.get('success'):
            print("✅ Update after rating endpoint working correctly")
            print(f"Message: {data.get('message')}")
            return True
        else:
            print("⚠️ Update after rating endpoint returned unsuccessful response")
            return False
    except Exception as e:
        print(f"❌ Update after rating endpoint test failed: {e}")
        return False

def main():
    """Main function"""
    # Set the base URL for the API
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:8080"
    
    print(f"Testing API at {base_url}")
    
    # Test the health endpoint
    health_success = test_health_endpoint(base_url)
    
    # Test the recommendations endpoint
    recommendations_success = test_recommendations_endpoint(base_url)
    
    # Test the update-after-rating endpoint
    update_success = test_update_after_rating_endpoint(base_url)
    
    # Print summary
    print("\n=== Test Summary ===")
    print(f"Health endpoint: {'✅ Success' if health_success else '❌ Failed'}")
    print(f"Recommendations endpoint: {'✅ Success' if recommendations_success else '❌ Failed'}")
    print(f"Update after rating endpoint: {'✅ Success' if update_success else '❌ Failed'}")
    
    if health_success and recommendations_success and update_success:
        print("\n✅ All tests passed! The recommendation service is working correctly.")
        if "disconnected" in requests.get(f"{base_url}/health").json().get('database', ''):
            print("\nNOTE: The service is running with fallback sample data because the database connection is not available.")
            print("To use the actual database, you need to install the ODBC driver and configure the database connection.")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the recommendation service.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
