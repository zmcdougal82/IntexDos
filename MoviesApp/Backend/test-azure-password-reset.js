const fetch = require('node-fetch');

// Configuration - CHANGE THESE VALUES FOR YOUR AZURE ENVIRONMENT
const AZURE_API_URL = 'https://cineniche.azurewebsites.net'; // Update with your actual Azure URL
const EMAIL = 'your-email@example.com'; // Replace with the email to test

async function testAzurePasswordReset() {
  console.log('Testing password reset functionality on Azure...');
  console.log(`API URL: ${AZURE_API_URL}`);
  console.log(`Sending forgot password request for email: ${EMAIL}`);
  
  try {
    console.log('\n1. Sending forgot password request...');
    const response = await fetch(`${AZURE_API_URL}/api/Auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: EMAIL
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('\n✅ Password reset email should have been sent via SparkPost.');
      console.log('Check your email inbox (including spam folder) for the reset link.');
      console.log('\nInstructions for resetting password:');
      console.log('1. Open the email and click the reset link OR copy it to your browser');
      console.log('2. You will be redirected to the password reset page');
      console.log('3. Enter your new password and submit the form');
      
      console.log('\nAlternatively, if you received the token, you can test the reset using this script:');
      console.log('1. Edit the test-reset-password.js script with:');
      console.log('   - Your email address');
      console.log('   - The token from the reset link');
      console.log('   - The Azure API URL');
      console.log('   - Your new password');
      console.log('2. Run: node MoviesApp/Backend/test-reset-password.js');
    } else {
      console.error('❌ Error calling forgot password endpoint');
    }
  } catch (error) {
    console.error('❌ Error during API call:', error.message);
      console.log('\nTroubleshooting tips:');
      console.log('1. Verify your Azure URL is correct');
      console.log('2. Check that your Azure app is running');
      console.log('3. Ensure your Azure app has the correct SparkPost configuration');
      console.log('4. Check Azure logs for any errors');
      console.log('5. Check your spam/junk folder as emails from new domains may be filtered');
  }
}

// Execute the test
testAzurePasswordReset();
