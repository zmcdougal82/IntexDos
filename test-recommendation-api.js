const axios = require('axios');

// Command line argument for user ID
const userId = process.argv[2] || '500';

// Function to test recommendation service
async function testRecommendationService() {
  console.log(`Testing recommendation service with userId: ${userId}`);
  
  try {
    // Direct API call to recommendation service
    const response = await axios.get(`https://moviesapp-recommendation-service.azurewebsites.net/recommendations/${userId}`);
    console.log('Recommendation API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Count number of recommendations
    const collaborative = response.data.collaborative || [];
    const contentBased = response.data.contentBased || [];
    let genreCount = 0;
    
    if (response.data.genres) {
      Object.keys(response.data.genres).forEach(genre => {
        genreCount += response.data.genres[genre].length;
      });
    }
    
    console.log('\nRecommendation Counts:');
    console.log(`- Collaborative: ${collaborative.length}`);
    console.log(`- Content-based: ${contentBased.length}`);
    console.log(`- Genre-based: ${genreCount} (across ${Object.keys(response.data.genres || {}).length} genres)`);
    console.log(`- Total: ${collaborative.length + contentBased.length + genreCount}`);
  } catch (error) {
    console.error('Error testing recommendation service:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testRecommendationService();
