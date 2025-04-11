const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000'; // Can be overridden with environment variable
const EMAIL = process.env.EMAIL || 'test@example.com'; // Replace with the email you used in forgot password
const TOKEN = process.env.TOKEN || 'your-token-here'; // Replace this with the token you received in the email
const NEW_PASSWORD = process.env.NEW_PASSWORD || 'NewPassword123!'; // The new password to set

// Determine if we're testing against Azure
const isAzure = API_URL.includes('azure');

async function testResetPassword() {
  console.log('Testing password reset functionality...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Environment: ${isAzure ? 'Azure (Production)' : 'Local Development'}`);
  console.log(`Resetting password for email: ${EMAIL} with token: ${TOKEN.substring(0, 8)}...`);
  
  try {
    const response = await fetch(`${API_URL}/api/Auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: EMAIL,
        token: TOKEN,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('\nPassword has been reset successfully.');
      console.log(`You can now log in with email ${EMAIL} and your new password.`);
    } else {
      console.error('Error resetting password:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error during API call:', error.message);
    
    if (isAzure) {
      console.log('\nTroubleshooting tips for Azure:');
      console.log('1. Verify your Azure URL is correct');
      console.log('2. Check that your Azure app is running');
      console.log('3. Ensure the token is valid and not expired (tokens expire after 1 hour)');
      console.log('4. Check Azure logs for any errors');
    }
  }
}

// Execute the test
testResetPassword();
