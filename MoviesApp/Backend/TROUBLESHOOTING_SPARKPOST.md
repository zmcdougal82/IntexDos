# SparkPost Email Troubleshooting Guide

If you're experiencing issues with SparkPost email delivery for password reset functionality, this guide will help you diagnose and fix the problems.

## Diagnostic Tools

We've created two diagnostic tools to help troubleshoot SparkPost email delivery:

### 1. SparkPost Diagnostic Tool

This tool checks your SparkPost configuration and provides detailed information about any issues:

```bash
# Run the diagnostic tool
node MoviesApp/Backend/sparkpost-diagnostic.js --email your-email@example.com

# For more detailed output
node MoviesApp/Backend/sparkpost-diagnostic.js --email your-email@example.com --verbose
```

This tool will:
- Verify your API key is valid
- Check if your domain is properly verified
- Verify SPF and DKIM DNS records are correct
- Check your sending limits
- Attempt to send a test email and report any errors

### 2. Alternative Domain Test Tool

If your domain verification is causing issues, this tool allows you to temporarily switch to a different sending domain for testing:

```bash
# Modify the email service to use a different domain
node MoviesApp/Backend/try-alternative-domain.js

# Restore the original configuration
node MoviesApp/Backend/try-alternative-domain.js --restore
```

## Common SparkPost Issues

### 1. Domain Verification Issues

Even if a domain shows as "verified" in SparkPost, proper email delivery requires:
- Valid SPF records (email authentication)
- Valid DKIM records (email authentication)
- Proper compliance status

**Solution:** Run the diagnostic tool to check the status of these records. You may need to add or update DNS records.

### 2. API Key Permissions

The API key needs "Transmissions: Read/Write" permissions to send emails.

**Solution:** Verify in SparkPost dashboard that your API key has the correct permissions.

### 3. Sending Limits

SparkPost may have sending limits, especially for free/trial accounts.

**Solution:** Check your sending limits in SparkPost dashboard or using the diagnostic tool.

### 4. Email Filtering

Even with proper configuration, some email providers may filter your messages.

**Solution:**
- Check spam/junk folders
- Use an email provider with less aggressive filtering for testing
- Try the alternative domain tool with a known good domain

### 5. API Endpoint Connectivity

In some environments, outbound connections to the SparkPost API might be blocked.

**Solution:** Ensure your server/environment can connect to api.sparkpost.com.

## Default Credentials Being Used

Current SparkPost configuration:
- API Key: `aecf07103eecf75d6ee809bb0e19a2f7de099dba`
- Sender Domain: `mail.cineniche.co`
- Sender Email: `noreply@mail.cineniche.co`

## Next Steps

1. Run the diagnostic tool to identify specific issues
2. Address any issues found (DNS records, API key permissions, etc.)
3. If needed, try using an alternative sending domain for testing
4. If you're still having trouble, check Azure logs for detailed error messages

## SparkPost Documentation

For more detailed information, refer to the official SparkPost documentation:
- [SparkPost API Documentation](https://developers.sparkpost.com/api/)
- [Domain Verification Guide](https://support.sparkpost.com/docs/getting-started/getting-started-sparkpost)
- [Email Deliverability Guide](https://www.sparkpost.com/docs/deliverability/)
