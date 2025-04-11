/**
 * SparkPost Diagnostic Tool
 * 
 * This script tests your SparkPost configuration directly and provides
 * detailed logs to troubleshoot email delivery issues.
 */

const https = require('https');
const fs = require('fs');

// Configuration - Update these values with your actual information
const config = {
  apiKey: "aecf07103eecf75d6ee809bb0e19a2f7de099dba",
  senderEmail: "noreply@mail.cineniche.co",
  senderName: "CineNiche",
  recipientEmail: "", // Will be filled in from command-line argument
  apiUrl: "api.sparkpost.com",
  verbose: false
};

// Parse command line arguments
process.argv.forEach((arg, index) => {
  if (arg === '--email' && process.argv[index + 1]) {
    config.recipientEmail = process.argv[index + 1];
  }
  if (arg === '--verbose' || arg === '-v') {
    config.verbose = true;
  }
  if (arg === '--api-key' && process.argv[index + 1]) {
    config.apiKey = process.argv[index + 1];
  }
});

if (!config.recipientEmail) {
  console.error('\x1b[31mERROR: Recipient email is required. Use --email <your-email> parameter.\x1b[0m');
  console.log('\nExample usage:');
  console.log('  node sparkpost-diagnostic.js --email user@example.com [--verbose] [--api-key your-api-key]');
  process.exit(1);
}

console.log('\x1b[36m=== SparkPost Diagnostic Tool ===\x1b[0m');
console.log(`\nTesting configuration:`);
console.log(`- API Key: ${config.apiKey.substring(0, 4)}...${config.apiKey.substring(config.apiKey.length - 4)}`);
console.log(`- Sender: ${config.senderEmail} (${config.senderName})`);
console.log(`- Recipient: ${config.recipientEmail}`);
console.log(`- API URL: ${config.apiUrl}`);
console.log(`- Verbose Mode: ${config.verbose ? 'Enabled' : 'Disabled'}`);

// Step 1: Check API key validity by getting account information
function checkApiKey() {
  console.log('\n\x1b[36m[1/4] Checking API Key validity...\x1b[0m');
  
  const options = {
    hostname: config.apiUrl,
    path: '/api/v1/account',
    method: 'GET',
    headers: {
      'Authorization': config.apiKey,
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const accountInfo = JSON.parse(data);
            console.log('\x1b[32m✓ API Key is valid. Account status: ' + 
              (accountInfo.results?.status || 'Unknown') + '\x1b[0m');
            
            if (config.verbose) {
              console.log('\nAccount Details:');
              console.log(JSON.stringify(accountInfo, null, 2));
            }
            
            resolve(accountInfo);
          } catch (error) {
            console.log('\x1b[31m✗ Error parsing account info: ' + error.message + '\x1b[0m');
            resolve(null);
          }
        } else {
          console.log('\x1b[31m✗ Invalid API Key or API request. Status: ' + res.statusCode + '\x1b[0m');
          if (config.verbose) {
            try {
              console.log('Response:', JSON.parse(data));
            } catch (e) {
              console.log('Response:', data);
            }
          }
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('\x1b[31m✗ Network error checking API Key: ' + error.message + '\x1b[0m');
      resolve(null);
    });
    
    req.end();
  });
}

// Step 2: Check sending domain verification status
function checkSendingDomain() {
  console.log('\n\x1b[36m[2/4] Checking sending domain verification status...\x1b[0m');
  
  const domain = config.senderEmail.split('@')[1];
  
  const options = {
    hostname: config.apiUrl,
    path: `/api/v1/sending-domains/${domain}`,
    method: 'GET',
    headers: {
      'Authorization': config.apiKey,
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const domainInfo = JSON.parse(data);
            const domainResults = domainInfo.results || {};
            
            console.log(`Domain: ${domain}`);
            
            if (domainResults.status && domainResults.status.ownership_verified) {
              console.log('\x1b[32m✓ Domain ownership is verified\x1b[0m');
            } else {
              console.log('\x1b[31m✗ Domain ownership is NOT verified\x1b[0m');
            }
            
            if (domainResults.status && domainResults.status.spf_status === 'valid') {
              console.log('\x1b[32m✓ SPF record is valid\x1b[0m');
            } else {
              console.log('\x1b[31m✗ SPF record is NOT valid\x1b[0m');
            }
            
            if (domainResults.status && domainResults.status.dkim_status === 'valid') {
              console.log('\x1b[32m✓ DKIM is valid\x1b[0m');
            } else {
              console.log('\x1b[31m✗ DKIM is NOT valid\x1b[0m');
            }
            
            if (domainResults.status && domainResults.status.cname_status === 'valid') {
              console.log('\x1b[32m✓ CNAME is valid\x1b[0m');
            } else {
              console.log('\x1b[31m✗ CNAME is NOT valid (this is not always required)\x1b[0m');
            }
            
            if (domainResults.status && domainResults.status.compliance_status === 'valid') {
              console.log('\x1b[32m✓ Compliance status is valid\x1b[0m');
            } else {
              console.log('\x1b[31m✗ Compliance status is NOT valid\x1b[0m');
            }
            
            if (config.verbose) {
              console.log('\nFull Domain Info:');
              console.log(JSON.stringify(domainInfo, null, 2));
            }
            
            resolve(domainInfo);
          } catch (error) {
            console.log('\x1b[31m✗ Error parsing domain info: ' + error.message + '\x1b[0m');
            resolve(null);
          }
        } else if (res.statusCode === 404) {
          console.log(`\x1b[31m✗ Domain '${domain}' not found in your SparkPost account\x1b[0m`);
          console.log(`\x1b[33mYou need to add and verify this domain in SparkPost dashboard\x1b[0m`);
          if (config.verbose) {
            try {
              console.log('Response:', JSON.parse(data));
            } catch (e) {
              console.log('Response:', data);
            }
          }
          resolve(null);
        } else {
          console.log('\x1b[31m✗ Error checking domain. Status: ' + res.statusCode + '\x1b[0m');
          if (config.verbose) {
            try {
              console.log('Response:', JSON.parse(data));
            } catch (e) {
              console.log('Response:', data);
            }
          }
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('\x1b[31m✗ Network error checking domain: ' + error.message + '\x1b[0m');
      resolve(null);
    });
    
    req.end();
  });
}

// Step 3: Check sending limits
function checkSendingLimits() {
  console.log('\n\x1b[36m[3/4] Checking sending limits...\x1b[0m');
  
  const options = {
    hostname: config.apiUrl,
    path: '/api/v1/metrics/deliverability/sending-limit',
    method: 'GET',
    headers: {
      'Authorization': config.apiKey,
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const limitInfo = JSON.parse(data);
            const limitResults = limitInfo.results || {};
            
            if (limitResults.sending_limit && limitResults.used) {
              const percentUsed = (limitResults.used / limitResults.sending_limit * 100).toFixed(2);
              console.log(`Sending limit: ${limitResults.used} of ${limitResults.sending_limit} emails used (${percentUsed}%)`);
              
              if (limitResults.used >= limitResults.sending_limit) {
                console.log('\x1b[31m✗ You have reached your sending limit!\x1b[0m');
              } else {
                console.log('\x1b[32m✓ You have capacity to send more emails\x1b[0m');
              }
            } else {
              console.log('\x1b[33m? Unable to determine sending limits. You may be on a custom plan.\x1b[0m');
            }
            
            if (config.verbose) {
              console.log('\nLimit Details:');
              console.log(JSON.stringify(limitInfo, null, 2));
            }
            
            resolve(limitInfo);
          } catch (error) {
            console.log('\x1b[31m✗ Error parsing limit info: ' + error.message + '\x1b[0m');
            resolve(null);
          }
        } else {
          console.log('\x1b[33m? Unable to check sending limits. Status: ' + res.statusCode + '\x1b[0m');
          if (config.verbose) {
            try {
              console.log('Response:', JSON.parse(data));
            } catch (e) {
              console.log('Response:', data);
            }
          }
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('\x1b[31m✗ Network error checking limits: ' + error.message + '\x1b[0m');
      resolve(null);
    });
    
    req.end();
  });
}

// Step 4: Send test email
function sendTestEmail() {
  console.log('\n\x1b[36m[4/4] Sending test email...\x1b[0m');
  
  const transmission = {
    options: {
      sandbox: false
    },
    content: {
      from: {
        email: config.senderEmail,
        name: config.senderName
      },
      subject: "SparkPost Test Email",
      html: `
        <html>
        <body>
          <h1>SparkPost Test Email</h1>
          <p>This is a test email from the SparkPost Diagnostic Tool.</p>
          <p>If you received this email, it means your SparkPost configuration is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </body>
        </html>
      `
    },
    recipients: [
      {
        address: {
          email: config.recipientEmail
        }
      }
    ]
  };
  
  const postData = JSON.stringify(transmission);
  
  const options = {
    hostname: config.apiUrl,
    path: '/api/v1/transmissions',
    method: 'POST',
    headers: {
      'Authorization': config.apiKey,
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('\x1b[32m✓ Test email sent successfully!\x1b[0m');
            console.log(`Transmission ID: ${response.results?.id || 'Unknown'}`);
            console.log(`Total accepted recipients: ${response.results?.total_accepted_recipients || 0}`);
            console.log(`Total rejected recipients: ${response.results?.total_rejected_recipients || 0}`);
            
            if (response.results?.total_rejected_recipients > 0) {
              console.log('\x1b[31m! Some recipients were rejected\x1b[0m');
            }
          } else {
            console.log(`\x1b[31m✗ Failed to send test email. Status: ${res.statusCode}\x1b[0m`);
            
            if (response.errors) {
              console.log('\nErrors:');
              response.errors.forEach(error => {
                console.log(`- ${error.message} (Code: ${error.code}, Description: ${error.description || 'N/A'})`);
                
                // Add specific troubleshooting advice for common errors
                if (error.code === '7001') {
                  console.log('  \x1b[33m→ This usually means your sending domain is not verified\x1b[0m');
                } else if (error.code === '1902') {
                  console.log('  \x1b[33m→ This usually means your API key does not have sending permissions\x1b[0m');
                } else if (error.code === '1900') {
                  console.log('  \x1b[33m→ This usually means your account is suspended or has sending restrictions\x1b[0m');
                }
              });
            }
          }
          
          if (config.verbose) {
            console.log('\nFull API Response:');
            console.log(JSON.stringify(response, null, 2));
          }
          
          resolve(response);
        } catch (error) {
          console.log('\x1b[31m✗ Error parsing API response: ' + error.message + '\x1b[0m');
          console.log('Raw response:', data);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('\x1b[31m✗ Network error sending email: ' + error.message + '\x1b[0m');
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the diagnostic checks
async function runDiagnostics() {
  try {
    await checkApiKey();
    await checkSendingDomain();
    await checkSendingLimits();
    const result = await sendTestEmail();
    
    console.log('\n\x1b[36m=== Diagnostic Summary ===\x1b[0m');
    
    if (result && result.results && result.results.total_accepted_recipients > 0) {
      console.log('\x1b[32m√ The test was successful. An email should be delivered to your inbox shortly.\x1b[0m');
      console.log('  Check your inbox and spam folder for the test email.');
    } else {
      console.log('\x1b[31m× The test encountered issues. Review the details above for troubleshooting.\x1b[0m');
      
      console.log('\n\x1b[36mCommon Issues and Solutions:\x1b[0m');
      console.log('1. Domain not verified: Verify domain ownership in SparkPost dashboard');
      console.log('2. SPF/DKIM records missing: Add the required DNS records');
      console.log('3. API key permissions: Ensure your API key has "Transmissions: Read/Write" permissions');
      console.log('4. Sending limits: Check if you have reached your sending limits');
      console.log('5. Account status: Ensure your SparkPost account is in good standing');
    }
    
  } catch (error) {
    console.log('\x1b[31mUnexpected error during diagnostics: ' + error.message + '\x1b[0m');
  }
}

// Start the diagnostics
runDiagnostics();
