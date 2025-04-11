const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000'; // Can be overridden with environment variable
const EMAIL = process.env.EMAIL || 'test@example.com'; // Replace with the email you want to test

// Determine if we're testing against Azure
const isAzure = API_URL.includes('azure');

async function testForgotPassword() {
  console.log('Testing password reset functionality...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Environment: ${isAzure ? 'Azure (Production)' : 'Local Development'}`);
  console.log(`Sending forgot password request for email: ${EMAIL}`);
  
  try {
    const response = await fetch(`${API_URL}/api/Auth/forgot-password`, {
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
      console.log('\nPassword reset email should have been sent via SparkPost.');
      console.log('Check the API logs for details about the email delivery.');
      console.log('\nImportant: If running in Development mode, the password reset link will be printed in the console.');
    } else {
      console.error('Error calling forgot password endpoint');
    }
  } catch (error) {
    console.error('Error during API call:', error.message);
    
    if (isAzure) {
      console.log('\nTroubleshooting tips for Azure:');
      console.log('1. Verify your Azure URL is correct');
      console.log('2. Check that your Azure app is running');
      console.log('3. Ensure your Azure app has the correct SparkPost configuration');
      console.log('4. Check Azure logs for any errors');
      console.log('5. Ensure SparkPost can send emails from your domain (Domain verification)');
    }
  }
}

// Execute the test
testForgotPassword();
