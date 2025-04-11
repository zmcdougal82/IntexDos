/**
 * Test script for the "forgot password" functionality using Mailgun
 * 
 * This script sends a POST request to the API's forgot-password endpoint
 * to initiate the password reset process.
 * 
 * Usage:
 * node test-mailgun-forgot-password.js [email]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const readline = require('readline');

// Configuration
const config = {
  // Default to localhost for testing
  host: 'localhost',
  port: 5237,
  protocol: 'http',
  endpoint: '/api/auth/forgot-password',
  email: null // Will be set from command line or prompted
};

// Parse command line arguments
if (process.argv.length > 2) {
  config.email = process.argv[2];
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function runTest() {
  console.log('\n=== Testing Password Reset with Mailgun ===\n');
  
  // If no email was provided in command line, prompt for it
  if (!config.email) {
    config.email = await promptForEmail();
  }
  
  console.log(`\nSending forgot password request for: ${config.email}`);
  
  // Prepare the request data
  const postData = JSON.stringify({
    email: config.email
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
          console.log('\n✅ Request successful!');
          console.log('\nNext steps:');
          console.log('1. Check your API terminal output for the password reset link (in development mode)');
          console.log('2. Check your email inbox (in production mode)');
          console.log('3. Use the link to reset your password');
        } else {
          console.log('\n❌ Request failed.');
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

// Helper function to prompt for email
function promptForEmail() {
  return new Promise((resolve) => {
    rl.question('Enter email address to test password reset: ', (email) => {
      resolve(email);
    });
  });
}

// Run the test
runTest();
