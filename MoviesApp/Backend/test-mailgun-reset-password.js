/**
 * Test script for the "reset password" functionality using Mailgun
 * 
 * This script sends a POST request to the API's reset-password endpoint
 * to complete the password reset process using the token received by email.
 * 
 * Usage:
 * node test-mailgun-reset-password.js [email] [token] [newPassword]
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

// Configuration
const config = {
  // Default to localhost for testing
  host: 'localhost',
  port: 5237, 
  protocol: 'http',
  endpoint: '/api/auth/reset-password',
  email: null,      // Will be set from command line or prompted
  token: null,      // Will be set from command line or prompted
  password: null,   // Will be set from command line or prompted
};

// Parse command line arguments
if (process.argv.length > 4) {
  config.email = process.argv[2];
  config.token = process.argv[3];
  config.password = process.argv[4];
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function runTest() {
  console.log('\n=== Testing Reset Password with Mailgun ===\n');
  
  // If parameters were not provided in command line, prompt for them
  if (!config.email) {
    config.email = await promptForInput('Enter email address: ');
  }
  
  if (!config.token) {
    config.token = await promptForInput('Enter reset token (from email/console): ');
  }
  
  if (!config.password) {
    config.password = await promptForInput('Enter new password (minimum 8 characters): ');
  }
  
  console.log(`\nResetting password for: ${config.email}`);
  
  // Prepare the request data
  const postData = JSON.stringify({
    email: config.email,
    token: config.token,
    newPassword: config.password,
    confirmPassword: config.password
  });
  
  // Set up the request options
  const options = {
    hostname: config.host,
    port: config.port,
    path: config.endpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };
  
  // Choose the appropriate protocol (http or https)
  const requestModule = config.protocol === 'https' ? https : http;
  
  // Send the request
  const req = requestModule.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`\nResponse Status: ${res.statusCode}`);
      
      try {
        const response = JSON.parse(data);
        console.log('Response Body:');
        console.log(JSON.stringify(response, null, 2));
        
        if (res.statusCode === 200) {
          console.log('\n✅ Password reset successful!');
          console.log('\nYou can now log in with your new password.');
        } else {
          console.log('\n❌ Password reset failed.');
          console.log('\nPossible reasons:');
          console.log('- The token may be expired (tokens expire after 1 hour)');
          console.log('- The token may have already been used');
          console.log('- The email address may be incorrect');
          console.log('- The password may not meet requirements (e.g., too short)');
        }
      } catch (error) {
        console.log('Response Body (not JSON):');
        console.log(data);
      }
      
      rl.close();
    });
  });
  
  req.on('error', (error) => {
    console.error(`\n❌ Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nTips:');
      console.log('- Make sure your API is running');
      console.log(`- Check if the API is available at ${config.protocol}://${config.host}:${config.port}`);
      console.log('- Verify that your firewall is not blocking the connection');
    }
    
    rl.close();
  });
  
  // Send the request data
  req.write(postData);
  req.end();
}

// Helper function to prompt for input
function promptForInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      resolve(input);
    });
  });
}

// Run the test
runTest();
