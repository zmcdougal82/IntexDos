# Password Reset Functionality in Azure

When the application is deployed to Azure, the password reset functionality will work properly, but there are a few specific configurations to note:

## Base URL Configuration

The password reset links generated in emails need to have the correct base URL for your Azure-hosted application. This is configured in the `Program.cs` file:

```csharp
// In production (Azure), use a configured base URL or fallback to a production URL
if (!env.IsDevelopment())
{
    // Try to get the base URL from configuration first
    baseUrl = configuration["AppSettings:BaseUrl"] ?? "https://cineniche.azurewebsites.net";
}
```

Currently, the system will:
1. First try to use the `AppSettings:BaseUrl` value from your Azure configuration
2. Fall back to "https://cineniche.azurewebsites.net" if not configured

## Ensuring Correct Configuration

To ensure the password reset works correctly in Azure:

1. **Verify the Base URL**: Make sure the `AppSettings:BaseUrl` in your Azure configuration is set to your actual application URL (e.g., "https://cineniche.azurewebsites.net" or your custom domain if you have one).

2. **Configure in Azure Portal**:
   - Go to Azure Portal → App Services → Your App → Configuration → Application settings
   - Add or update the following application setting:
     - Name: `AppSettings:BaseUrl`
     - Value: Your actual application URL (e.g., "https://cineniche.azurewebsites.net")

3. **SparkPost Configuration in Azure**:
   The SparkPost settings are already in the `appsettings.json` file, but you can override them in Azure if needed:
   - API Key: `aecf07103eecf75d6ee809bb0e19a2f7de099dba`
   - Sender Email: `noreply@mail.cineniche.co`

## Testing in Azure

After deployment:

1. The email sending will work automatically with the SparkPost configuration
2. Password reset links will point to your Azure-hosted application
3. Users clicking these links will be correctly directed to the reset password page

## Troubleshooting

If password reset emails are not working in Azure:

1. **Check Application Logs**: Look at the Azure application logs for any errors related to email sending
2. **Verify SparkPost Settings**: Confirm the API key and sending domain are valid
3. **Test SparkPost API Access**: Azure might have network limitations - verify outbound connections to the SparkPost API are allowed
4. **Check Base URL**: If links in emails are incorrect, verify the AppSettings:BaseUrl configuration
