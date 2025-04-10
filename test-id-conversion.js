const axios = require('axios');

// Get command line args or use defaults
const userId = process.argv[2] || '405';
const apiType = process.argv[3] || 'both';

// Test URLs
const API_URL = 'https://moviesapp-api-fixed.azurewebsites.net/api';
const RECOMMENDATION_URL = 'https://moviesapp-recommendation-service.azurewebsites.net';

/**
 * Function to properly format IDs to database style
 */
function formatToDbId(id) {
  return id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
}

/**
 * Test recommendations API and database access
 */
async function testRecommendationsAndDb() {
  console.log('='.repeat(50));
  console.log(`Testing recommendations for user ${userId}`);
  console.log('='.repeat(50));
  
  try {
    // Step 1: Get recommendations
    let recommendationsData;
    
    if (apiType === 'api' || apiType === 'both') {
      console.log('\n[1] Fetching recommendations from API...');
      try {
        const response = await axios.get(`${RECOMMENDATION_URL}/recommendations/${userId}`);
        recommendationsData = response.data;
        console.log('✅ Successfully retrieved recommendations from API');
      } catch (err) {
        console.error('❌ Failed to get recommendations from API:', err.message);
        
        if (apiType !== 'both') {
          process.exit(1);
        }
      }
    }
    
    if ((apiType === 'file' || apiType === 'both') && !recommendationsData) {
      console.log('\n[1] Fetching recommendations from static file...');
      try {
        const response = await axios.get(`${API_URL}/recommendations/${userId}`);
        recommendationsData = {
          collaborative: response.data,
          contentBased: [],
          genres: {}
        };
        console.log('✅ Successfully retrieved recommendations from file');
      } catch (err) {
        console.error('❌ Failed to get recommendations from file:', err.message);
        process.exit(1);
      }
    }
    
    if (!recommendationsData) {
      console.error('❌ No recommendations data available');
      process.exit(1);
    }
    
    // Step 2: Test a sample of movie IDs from recommendations
    const allIds = [
      ...(recommendationsData.collaborative || []),
      ...(recommendationsData.contentBased || [])
    ];
    
    // Add genre-based recommendations if any
    if (recommendationsData.genres) {
      Object.values(recommendationsData.genres).forEach(ids => {
        allIds.push(...ids);
      });
    }
    
    // Remove duplicates
    const uniqueIds = [...new Set(allIds)];
    
    console.log(`\n[2] Testing ${uniqueIds.length} unique movie IDs from recommendations`);
    console.log('Original IDs:', uniqueIds.slice(0, 5), '...');
    
    // Test with and without ID conversion
    const results = {
      withoutConversion: { success: 0, failure: 0 },
      withConversion: { success: 0, failure: 0 }
    };
    
    // Test a sample of the IDs (first 5)
    const testIds = uniqueIds.slice(0, 5);
    
    // Test without conversion
    console.log('\n[3] Testing WITHOUT ID conversion:');
    for (const id of testIds) {
      try {
        const response = await axios.get(`${API_URL}/movies/${id}`);
        console.log(`✅ ID ${id}: Found movie "${response.data.title}"`);
        results.withoutConversion.success++;
      } catch (err) {
        console.error(`❌ ID ${id}: Not found (${err.response?.status || err.message})`);
        results.withoutConversion.failure++;
      }
    }
    
    // Test with conversion
    console.log('\n[4] Testing WITH ID conversion:');
    for (const id of testIds) {
      const dbId = formatToDbId(id);
      try {
        const response = await axios.get(`${API_URL}/movies/${dbId}`);
        console.log(`✅ ID ${id} → ${dbId}: Found movie "${response.data.title}"`);
        results.withConversion.success++;
      } catch (err) {
        console.error(`❌ ID ${id} → ${dbId}: Not found (${err.response?.status || err.message})`);
        results.withConversion.failure++;
      }
    }
    
    // Summary
    console.log('\n[5] Results Summary:');
    console.log(`Without conversion: ${results.withoutConversion.success} successes, ${results.withoutConversion.failure} failures`);
    console.log(`With conversion: ${results.withConversion.success} successes, ${results.withConversion.failure} failures`);
    console.log('\nConclusion:', results.withConversion.success > results.withoutConversion.success ? 
      '✅ ID conversion IMPROVES success rate' : 
      '❌ ID conversion does NOT improve success rate');
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testRecommendationsAndDb();
