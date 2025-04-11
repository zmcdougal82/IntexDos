// Script to test pagination for different recommendation sections
const axios = require('axios');

// Configuration
const BASE_URL = 'https://moviesapp-recommendation-service.azurewebsites.net';
const USER_ID = '500'; // Use a test user ID
const SECTIONS = ['collaborative', 'contentBased', 'Action']; // Test collaborative, content-based, and a genre

// Test pagination function
async function testPagination(section) {
  console.log(`\n----- Testing pagination for ${section} section -----`);
  
  try {
    // Get first page
    console.log(`Fetching ${section} page 0:`);
    const page0Response = await axios.get(`${BASE_URL}/recommendations/${USER_ID}/more`, {
      params: { section, page: 0, limit: 5 }
    });
    
    // Log results
    if (section === 'collaborative') {
      console.log(`Found ${page0Response.data.collaborative?.length || 0} collaborative items`);
      console.log(page0Response.data.collaborative);
    } else if (section === 'contentBased') {
      console.log(`Found ${page0Response.data.contentBased?.length || 0} contentBased items`);
      console.log(page0Response.data.contentBased);
    } else {
      console.log(`Found ${page0Response.data.genres?.[section]?.length || 0} genre items for ${section}`);
      console.log(page0Response.data.genres?.[section]);
    }
    
    // Get second page
    console.log(`\nFetching ${section} page 1:`);
    const page1Response = await axios.get(`${BASE_URL}/recommendations/${USER_ID}/more`, {
      params: { section, page: 1, limit: 5 }
    });
    
    // Log results
    if (section === 'collaborative') {
      console.log(`Found ${page1Response.data.collaborative?.length || 0} collaborative items`);
      console.log(page1Response.data.collaborative);
    } else if (section === 'contentBased') {
      console.log(`Found ${page1Response.data.contentBased?.length || 0} contentBased items`);
      console.log(page1Response.data.contentBased);
    } else {
      console.log(`Found ${page1Response.data.genres?.[section]?.length || 0} genre items for ${section}`);
      console.log(page1Response.data.genres?.[section]);
    }
    
    // Compare pages to ensure they're different
    if (section === 'collaborative') {
      const page0Items = page0Response.data.collaborative || [];
      const page1Items = page1Response.data.collaborative || [];
      const overlap = page0Items.filter(item => page1Items.includes(item));
      console.log(`\nOverlap between pages: ${overlap.length} items`);
      console.log(`Pages are ${overlap.length === 0 ? 'DIFFERENT' : 'OVERLAPPING'}`);
    } else if (section === 'contentBased') {
      const page0Items = page0Response.data.contentBased || [];
      const page1Items = page1Response.data.contentBased || [];
      const overlap = page0Items.filter(item => page1Items.includes(item));
      console.log(`\nOverlap between pages: ${overlap.length} items`);
      console.log(`Pages are ${overlap.length === 0 ? 'DIFFERENT' : 'OVERLAPPING'}`);
    } else {
      const page0Items = page0Response.data.genres?.[section] || [];
      const page1Items = page1Response.data.genres?.[section] || [];
      const overlap = page0Items.filter(item => page1Items.includes(item));
      console.log(`\nOverlap between pages: ${overlap.length} items`);
      console.log(`Pages are ${overlap.length === 0 ? 'DIFFERENT' : 'OVERLAPPING'}`);
    }
    
  } catch (error) {
    console.error(`Error testing ${section}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Main function to test all sections
async function testAllSections() {
  console.log('Testing recommendation API pagination...');
  
  // First, test the health endpoint
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('Health check:', healthResponse.data);
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
  
  // Test each section
  for (const section of SECTIONS) {
    await testPagination(section);
  }
}

// Run the tests
testAllSections()
  .then(() => console.log('\nTests completed'))
  .catch(err => console.error('Error running tests:', err));
