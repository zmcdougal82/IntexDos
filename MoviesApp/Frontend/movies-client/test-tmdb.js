// Test script to verify TMDB API functionality
import fetch from 'node-fetch';

// TMDB API key from .env file
const TMDB_API_KEY = '56cfecfb2042af273b7c51099340b62e';

// Direct TMDB API URLs for testing
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

async function testTmdbApi() {
  console.log('Testing TMDB API connectivity...');
  console.log(`Using API key: ${TMDB_API_KEY.substring(0, 4)}...${TMDB_API_KEY.substring(TMDB_API_KEY.length - 4)}`);
  
  try {
    // Test basic movie search endpoint
    const searchUrl = `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&query=Inception`;
    console.log(`Testing endpoint: ${searchUrl.replace(TMDB_API_KEY, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(searchUrl);
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response contains results:', data.results && data.results.length > 0);
      if (data.results && data.results.length > 0) {
        console.log('First movie found:', data.results[0].title);
        console.log('Poster path:', data.results[0].poster_path);
        
        // Test image URL accessibility
        if (data.results[0].poster_path) {
          const imageUrl = `${TMDB_IMAGE_URL}${data.results[0].poster_path}`;
          console.log(`Testing image URL: ${imageUrl}`);
          
          const imageResponse = await fetch(imageUrl);
          console.log('Image URL status:', imageResponse.status);
          console.log('Image accessible:', imageResponse.ok);
        }
      }
    } else {
      const errorText = await response.text();
      console.error('API Error:', errorText);
    }
  } catch (error) {
    console.error('Error making request to TMDB API:', error.message);
  }
}

// Test CORS proxy for TMDB
async function testTmdbViaProxy() {
  console.log('\nTesting TMDB API via local CORS proxy...');
  
  try {
    const proxyUrl = 'http://localhost:3001/tmdb/search/movie?api_key=' + TMDB_API_KEY + '&query=Inception';
    console.log(`Testing proxy endpoint: ${proxyUrl.replace(TMDB_API_KEY, 'API_KEY_HIDDEN')}`);
    
    const response = await fetch(proxyUrl);
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Proxy response contains results:', data.results && data.results.length > 0);
    } else {
      console.error('Proxy Error Status:', response.status);
      try {
        const errorText = await response.text();
        console.error('Proxy Error:', errorText);
      } catch (e) {
        console.error('Could not parse proxy error response');
      }
    }
  } catch (error) {
    console.error('Error making request via proxy:', error.message);
    console.log('This usually indicates the CORS proxy is not running at http://localhost:3001');
    console.log('Make sure to start the proxy using: node cors-proxy.js');
  }
}

console.log('=============== TMDB API TEST ===============');
// Run tests
testTmdbApi()
  .then(() => testTmdbViaProxy())
  .then(() => console.log('=============== TEST COMPLETE ==============='))
  .catch(err => console.error('Test failed:', err));
