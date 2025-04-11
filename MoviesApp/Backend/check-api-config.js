/**
 * API Configuration Inspector
 * 
 * This script makes API calls to inspect the actual deployed API configuration
 * by examining the behavior and response patterns of the production API.
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
console.log(`${colors.cyan}║            API CONFIGURATION INSPECTOR               ║${colors.reset}`);
console.log(`${colors.cyan}║                                                      ║${colors.reset}`);
console.log(`${colors.cyan}╚══════════════════════════════════════════════════════╝${colors.reset}`);
console.log(`${colors.yellow}This script analyzes the deployed API configuration by${colors.reset}`);
console.log(`${colors.yellow}examining the response patterns from API requests.${colors.reset}`);
console.log('');
console.log(`${colors.blue}API URL:${colors.reset} ${API_URL}`);
console.log(`${colors.blue}Email:${colors.reset} ${EMAIL}`);
console.log('');

/**
 * Makes a test API call with debug headers to extract configuration info
 */
async function inspectApiConfiguration() {
  console.log(`${colors.green}Making API call with debug headers...${colors.reset}`);
  
  const debugHeaders = {
    'X-Request-Debug': 'true',
    'X-Expose-Config': 'true',
    'X-Debug-Mode': 'config',
    'Content-Type': 'application/json',
    'Origin': 'https://moviesappsa79595.z22.web.core.windows.net'
  };

  try {
    // First let's try an OPTIONS request - this sometimes returns CORS configuration
    console.log(`${colors.blue}Sending OPTIONS request...${colors.reset}`);
    const optionsResponse = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'OPTIONS',
      headers: debugHeaders
    });
    
    console.log(`${colors.blue}OPTIONS Status:${colors.reset} ${optionsResponse.status}`);
    console.log(`${colors.blue}OPTIONS Headers:${colors.reset}`);
    for (const [key, value] of optionsResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Now make the actual API call
    console.log('\n');
    console.log(`${colors.green}Sending GET request to API root...${colors.reset}`);
    const rootResponse = await fetch(API_URL, {
      method: 'GET',
      headers: debugHeaders
    });
    
    console.log(`${colors.blue}Root Status:${colors.reset} ${rootResponse.status}`);
    console.log(`${colors.blue}Root Headers:${colors.reset}`);
    for (const [key, value] of rootResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    try {
      const rootData = await rootResponse.text();
      console.log(`${colors.blue}Root Data:${colors.reset} ${rootData.substring(0, 1000)}${rootData.length > 1000 ? '...' : ''}`);
    } catch (e) {
      console.log(`${colors.yellow}Could not parse root response body${colors.reset}`);
    }
    
    // Now try an auth call to see if it exposes any info
    console.log('\n');
    console.log(`${colors.green}Testing forgot-password endpoint...${colors.reset}`);
    const authResponse = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://moviesappsa79595.z22.web.core.windows.net',
        'X-Request-Debug': 'true'
      },
      body: JSON.stringify({
        email: EMAIL
      })
    });
    
    console.log(`${colors.blue}Auth Status:${colors.reset} ${authResponse.status}`);
    console.log(`${colors.blue}Auth Headers:${colors.reset}`);
    for (const [key, value] of authResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const authData = await authResponse.json();
    console.log(`${colors.blue}Auth Response:${colors.reset}`, authData);
    
    // Server info
    console.log('\n');
    console.log(`${colors.magenta}Server Information${colors.reset}`);
    const serverInfo = optionsResponse.headers.get('server') || rootResponse.headers.get('server') || 'Unknown';
    console.log(`${colors.blue}Server:${colors.reset} ${serverInfo}`);
    
    // Analysis
    console.log('\n');
    console.log(`${colors.cyan}╔══════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║                     ANALYSIS                         ║${colors.reset}`);
    console.log(`${colors.cyan}╚══════════════════════════════════════════════════════╝${colors.reset}`);
    
    // Analysis based on the responses
    console.log(`${colors.yellow}Based on the API responses, here's what we know:${colors.reset}`);
    
    // Check if CORS is configured properly
    const corsHeader = optionsResponse.headers.get('access-control-allow-origin');
    if (corsHeader && corsHeader.includes('moviesappsa79595.z22.web.core.windows.net')) {
      console.log(`${colors.green}✓ CORS is properly configured for the frontend URL${colors.reset}`);
    } else {
      console.log(`${colors.yellow}? CORS configuration could not be determined${colors.reset}`);
    }
    
    // Check if forgot password endpoint behaves as expected
    if (authResponse.status === 200 && authData && authData.message && authData.message.includes('receive a password reset link')) {
      console.log(`${colors.green}✓ The forgot-password endpoint is responding as expected${colors.reset}`);
      console.log(`${colors.yellow}  However, this doesn't guarantee emails are being sent correctly${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ The forgot-password endpoint is not behaving as expected${colors.reset}`);
    }
    
    console.log('\n');
    console.log(`${colors.magenta}Most Likely Configuration Issue:${colors.reset}`);
    console.log(`The API is correctly processing the password reset request but one of the following is likely true:`);
    console.log(`1. The AppSettings:BaseUrl in the API is incorrect, causing the reset links to point to the wrong URL`);
    console.log(`2. The email sending configuration (SparkPost) is not properly set up`);
    console.log(`3. The emails are being sent but are getting caught in spam filters`);
    
    console.log('\n');
    console.log(`${colors.magenta}Recommended Action:${colors.reset}`);
    console.log(`1. Contact the administrator of the Azure-hosted API and ask them to update the following settings:`);
    console.log(`   - AppSettings:BaseUrl to "https://moviesappsa79595.z22.web.core.windows.net"`);
    console.log(`   - SparkPost:ApiKey to "aecf07103eecf75d6ee809bb0e19a2f7de099dba"`);
    console.log(`   - SparkPost:SenderEmail to "noreply@mail.cineniche.co"`);
    console.log(`2. Add an SPF record to mail.cineniche.co as described in the SPF_SETUP_INSTRUCTIONS.md file`);
    console.log(`3. Check your spam folder for password reset emails`);
  } catch (error) {
    console.error(`${colors.red}Error analyzing API configuration:${colors.reset}`, error.message);
  }
}

inspectApiConfiguration();
