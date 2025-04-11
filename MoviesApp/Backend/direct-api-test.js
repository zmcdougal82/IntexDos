/**
 * Direct API Test Script
 * 
 * This script makes a direct call to the production API instance
 * to test the password reset functionality.
 */
const fetch = require('node-fetch');

// Configuration
const API_URL = 'https://moviesapp-api-fixed.azurewebsites.net/api';
let EMAIL = process.env.TEST_EMAIL || 'test@example.com';

// Colorized console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  EMAIL = args[0];
}

console.log(`${colors.cyan}╔══════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║                                                      ║${colors.reset}`);
console.log(`${colors.cyan}║            DIRECT API PRODUCTION TEST                ║${colors.reset}`);
console.log(`${colors.cyan}║                                                      ║${colors.reset}`);
console.log(`${colors.cyan}╚══════════════════════════════════════════════════════╝${colors.reset}`);
console.log(`${colors.yellow}This script calls the production API directly to test the${colors.reset}`);
console.log(`${colors.yellow}password reset functionality.${colors.reset}`);
console.log('');
console.log(`${colors.blue}API URL:${colors.reset} ${API_URL}`);
console.log(`${colors.blue}Email:${colors.reset} ${EMAIL}`);
console.log('');

async function testForgotPassword() {
  console.log(`${colors.green}Calling forgot-password endpoint...${colors.reset}`);
  
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://moviesappsa79595.z22.web.core.windows.net'
      },
      body: JSON.stringify({
        email: EMAIL
      })
    });
    
    const data = await response.json();
    console.log(`${colors.blue}Response Status:${colors.reset} ${response.status}`);
    console.log(`${colors.blue}Response Data:${colors.reset}`, data);
    
    if (response.ok) {
      console.log('');
      console.log(`${colors.green}✓ API call was successful${colors.reset}`);
      console.log(`${colors.yellow}NOTE: This just means the API accepted the request, not that${colors.reset}`);
      console.log(`${colors.yellow}the email was actually delivered. The email might still fail${colors.reset}`);
      console.log(`${colors.yellow}due to configuration issues on the API server itself.${colors.reset}`);
      
      console.log('');
      console.log(`${colors.magenta}Next Steps:${colors.reset}`);
      console.log(`1. Check your email inbox (including spam folder) for the reset link`);
      console.log(`2. If no email arrives, there's a configuration issue on the server`);
      console.log(`3. You may need to update the AppSettings:BaseUrl in the production API`);
      console.log(`   to: https://moviesappsa79595.z22.web.core.windows.net`);
    } else {
      console.log(`${colors.red}✗ API call failed${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error calling API:${colors.reset}`, error.message);
  }
}

testForgotPassword();
