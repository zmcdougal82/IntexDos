// Simple script to test direct API access
import fetch from 'node-fetch';

const API_URL = 'https://moviesapp-api-fixed.azurewebsites.net/api';

// Test basic API endpoints
async function testAPI() {
  console.log('Testing direct API access...');
  
  try {
    // Test /movies endpoint
    console.log(`Testing GET ${API_URL}/movies?page=1&pageSize=20`);
    const moviesResponse = await fetch(`${API_URL}/movies?page=1&pageSize=20`);
    
    console.log('Status:', moviesResponse.status);
    console.log('Status Text:', moviesResponse.statusText);
    console.log('Headers:', JSON.stringify([...moviesResponse.headers.entries()], null, 2));
    
    if (moviesResponse.ok) {
      const data = await moviesResponse.json();
      console.log('Response Data (first item):', data.length > 0 ? JSON.stringify(data[0], null, 2) : 'No data');
    } else {
      console.log('Response Text:', await moviesResponse.text());
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI();
