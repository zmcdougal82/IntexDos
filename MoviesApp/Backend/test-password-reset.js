// Simple script to test password reset functionality
const axios = require('axios');

const API_URL = 'http://localhost:5237/api';
const EMAIL_TO_TEST = 'zacktmcdougal@gmail.com';

async function testForgotPassword() {
  try {
    console.log(`Testing password reset for email: ${EMAIL_TO_TEST}`);
    
    const response = await axios.post(`${API_URL}/auth/forgot-password`, {
      email: EMAIL_TO_TEST
    });
    
    console.log('Response:', response.data);
    console.log('Check the server console for detailed logs about the email sending process.');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Run the test
testForgotPassword();
