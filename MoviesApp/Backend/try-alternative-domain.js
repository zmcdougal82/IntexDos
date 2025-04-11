/**
 * SparkPost Alternative Domain Test
 * 
 * This script creates a modified version of the EmailService that uses an 
 * alternative sending domain for testing purposes.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths
const emailServicePath = path.join(__dirname, 'MoviesApp.API', 'Services', 'EmailService.cs');
const backupPath = path.join(__dirname, 'EmailService.cs.backup');

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Check if the original file exists
if (!fs.existsSync(emailServicePath)) {
  console.error(`Error: Could not find EmailService.cs at ${emailServicePath}`);
  rl.close();
  process.exit(1);
}

// Create a backup of the original file if it doesn't exist
if (!fs.existsSync(backupPath)) {
  console.log(`Creating backup of original EmailService.cs at ${backupPath}`);
  fs.copyFileSync(emailServicePath, backupPath);
}

// Main function to prompt for a new domain and update the service
function promptForAlternativeDomain() {
  console.log('\n=== SparkPost Alternative Domain Test ===\n');
  console.log('This tool will modify your EmailService to use a different sending domain.');
  console.log('You can use this to test if the issue is related to domain verification.\n');
  
  rl.question('Enter an alternative sending domain (e.g., sparkpostmail.com): ', (domain) => {
    if (!domain || !domain.includes('.')) {
      console.error('Error: Please enter a valid domain name.');
      return promptForAlternativeDomain();
    }
    
    rl.question(`Enter a sender email for ${domain} (e.g., test@${domain}): `, (email) => {
      if (!email || !email.includes('@') || !email.endsWith(domain)) {
        console.error(`Error: Please enter a valid email address that ends with @${domain}`);
        return promptForAlternativeDomain();
      }
      
      updateEmailService(domain, email);
    });
  });
}

// Function to update the EmailService.cs file
function updateEmailService(domain, email) {
  try {
    let content = fs.readFileSync(emailServicePath, 'utf8');
    
    // Store the original sender email and domain
    const originalDomainMatch = content.match(/var senderEmail = _configuration\["SparkPost:SenderEmail"\];/);
    const originalDomain = originalDomainMatch ? originalDomainMatch[0] : null;
    
    if (!originalDomain) {
      console.error('Error: Could not find the sender email configuration in EmailService.cs');
      restoreOriginal();
      return;
    }
    
    // Replace the sender email with the new one
    const modifiedContent = content.replace(
      /var senderEmail = _configuration\["SparkPost:SenderEmail"\];/,
      `var senderEmail = "${email}"; // Modified for testing - original: _configuration["SparkPost:SenderEmail"];`
    );
    
    if (content === modifiedContent) {
      console.error('Error: Failed to modify EmailService.cs');
      restoreOriginal();
      return;
    }
    
    // Write the modified file
    fs.writeFileSync(emailServicePath, modifiedContent);
    
    console.log('\n✅ EmailService.cs has been modified successfully.');
    console.log(`Now using sender email: ${email}`);
    console.log(`Original configuration is backed up at: ${backupPath}`);
    console.log('\nNext steps:');
    console.log('1. Rebuild and deploy your application');
    console.log('2. Test the password reset functionality again');
    console.log('3. When done testing, restore the original EmailService using:');
    console.log('   node try-alternative-domain.js --restore');
    
    rl.close();
  } catch (error) {
    console.error(`Error updating EmailService: ${error.message}`);
    restoreOriginal();
  }
}

// Function to restore the original EmailService.cs
function restoreOriginal() {
  if (fs.existsSync(backupPath)) {
    try {
      fs.copyFileSync(backupPath, emailServicePath);
      console.log('Restored original EmailService.cs from backup.');
    } catch (error) {
      console.error(`Error restoring backup: ${error.message}`);
    }
  } else {
    console.error('Error: Backup file not found.');
  }
  rl.close();
}

// Check for restore flag
if (process.argv.includes('--restore')) {
  restoreOriginal();
} else {
  promptForAlternativeDomain();
}
