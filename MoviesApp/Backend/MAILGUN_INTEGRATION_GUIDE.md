# Mailgun Integration Guide for Password Reset

This guide summarizes the implementation of Mailgun for password reset emails in the MoviesApp API.

## Implementation Summary

We've replaced the SparkPost email service with Mailgun for all password reset functionality. This implementation:

1. Uses RestSharp to make API calls to Mailgun
2. Works in both development and production environments
3. Provides detailed error logging for troubleshooting
4. Maintains the same user experience for password reset

## Configuration Settings

The Mailgun integration is configured with the following settings in all environment configurations (`appsettings.json`, `appsettings.Development.json`, and `appsettings.Production.json`):

```json
"Mailgun": {
  "ApiKey": "7366e6734f1c23f0db1fee6d258575cd-2b77fbb2-d23dd854",
  "Domain": "send.cineniche.co",
  "SenderEmail": "noreply@send.cineniche.co",
  "SenderName": "CineNiche",
  "Region": "US"
}
```

## Testing in Development

In development mode, the password reset functionality doesn't actually send emails. Instead, it prints the reset link directly to the console, making it easy to test the flow locally.

### Test Scripts

We've created several scripts to streamline testing:

1. **`test-mailgun-forgot-password.js`**: Tests initiating a password reset
   ```
   node MoviesApp/Backend/test-mailgun-forgot-password.js [email]
   ```

2. **`test-mailgun-reset-password.js`**: Tests completing a password reset
   ```
   node MoviesApp/Backend/test-mailgun-reset-password.js [email] [token] [newPassword]
   ```

3. **`test-mailgun-reset-flow.sh`**: One-command script to test the full flow
   ```
   ./MoviesApp/Backend/test-mailgun-reset-flow.sh
   ```

## Azure Deployment Considerations

For Azure deployment, remember that:

1. **API Key Security**: The Mailgun API key is included in the configuration files. For production systems, consider using Azure Key Vault or environment variables.

2. **Domain Verification**: The domain `send.cineniche.co` must be properly verified in your Mailgun account with proper DNS records (SPF, DKIM).

3. **Troubleshooting**: Check Azure App Service logs if emails are not being delivered in production. The implementation includes detailed error logging.

## Error Handling

The implementation includes robust error handling:

- If Mailgun's API is unreachable, the error is logged with details
- If the API returns an error, the response content is logged
- Configuration errors (missing API key, domain, etc.) are detected and reported

## Local Testing Quick Start

To quickly test the password reset functionality locally:

1. Start the API in development mode:
   ```
   cd MoviesApp/Backend/MoviesApp.API
   dotnet run
   ```

2. In another terminal, run the test script:
   ```
   node MoviesApp/Backend/test-mailgun-forgot-password.js your-email@example.com
   ```

3. Check the API terminal for the password reset link

4. Use the token from the link to test completing the reset:
   ```
   node MoviesApp/Backend/test-mailgun-reset-password.js your-email@example.com the-token-from-link your-new-password
   ```

## Real Email Testing in Production

To test with real emails in production:

1. Ensure the API is running in a non-development environment
2. The environment must have internet access to reach Mailgun's API
3. The recipient email must be valid and able to receive emails

The system is configured to automatically determine which mode to use based on the environment variables.
