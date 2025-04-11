using Microsoft.Extensions.Configuration;
using MoviesApp.API.Models;
using RestSharp;
using RestSharp.Authenticators;
using System;
using System.Text;
using System.Threading.Tasks;

namespace MoviesApp.API.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(User user, string token);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _baseUrl;

        public EmailService(IConfiguration configuration, string baseUrl)
        {
            _configuration = configuration;
            _baseUrl = baseUrl;
        }

        public async Task SendPasswordResetEmailAsync(User user, string token)
        {
            var apiKey = _configuration["Mailgun:ApiKey"];
            var domain = _configuration["Mailgun:Domain"];
            var senderEmail = _configuration["Mailgun:SenderEmail"];
            var senderName = _configuration["Mailgun:SenderName"];
            var region = _configuration["Mailgun:Region"] ?? "US"; // Default to US region

            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(domain) || string.IsNullOrEmpty(senderEmail))
            {
                throw new InvalidOperationException("Mailgun API key, domain or sender email is not configured.");
            }

            // Print some debug information
            Console.WriteLine("========= EMAIL SERVICE DEBUG =========");
            Console.WriteLine($"Base URL: {_baseUrl}");
            Console.WriteLine($"Mailgun Domain: {domain}");
            Console.WriteLine($"Sender Email: {senderEmail}");
            Console.WriteLine($"Sender Name: {senderName}");
            Console.WriteLine($"Recipient: {user.Email}");
            Console.WriteLine("======================================");
            
            // Email content variables
            var resetLink = $"{_baseUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";
            
            var isDevelopment = string.Equals(
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), 
                "Development", 
                StringComparison.OrdinalIgnoreCase);
            
            // HTML template for the email
            var htmlContent = $@"
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #007bff; color: white; padding: 10px 20px; }}
                    .content {{ padding: 20px; }}
                    .button {{ display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; margin: 20px 0; border-radius: 4px; }}
                    .footer {{ font-size: 12px; color: #666; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Reset Your Password</h1>
                    </div>
                    <div class='content'>
                        <p>Hello {user.Name},</p>
                        <p>We received a request to reset the password for your CineNiche account. To reset your password, click the button below:</p>
                        <p><a href='{resetLink}' class='button'>Reset Password</a></p>
                        <p>If you didn't request a password reset, you can ignore this email. The link will expire in 1 hour.</p>
                        <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
                        <p>{resetLink}</p>
                        <div class='footer'>
                            <p>CineNiche - Your personal movie recommendation platform</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>";

            try
            {
                // In development mode, just log the email with the password reset link
                if (isDevelopment)
                {
                    // Log a visible box with the reset link for local testing
                    Console.WriteLine();
                    Console.WriteLine("██████████████████████████████████████████████████████████████");
                    Console.WriteLine("█                                                            █");
                    Console.WriteLine("█  MOCK EMAIL SERVICE - FOR TESTING PASSWORD RESET           █");
                    Console.WriteLine("█                                                            █");
                    Console.WriteLine("█  Since we're in development mode, the password reset       █");
                    Console.WriteLine("█  link is provided directly here instead of sending email.  █");
                    Console.WriteLine("█                                                            █");
                    Console.WriteLine("█  COPY THIS LINK TO RESET YOUR PASSWORD:                    █");
                    Console.WriteLine($"█  {resetLink}");
                    Console.WriteLine("█                                                            █");
                    Console.WriteLine("█  You can use this link to test the password reset flow.    █");
                    Console.WriteLine("█                                                            █");
                    Console.WriteLine("██████████████████████████████████████████████████████████████");
                    Console.WriteLine();
                    
                    // Log email details for debugging
                    Console.WriteLine("==== EMAIL DETAILS ====");
                    Console.WriteLine($"To: {user.Email}");
                    Console.WriteLine($"From: {senderEmail}");
                    Console.WriteLine($"Subject: CineNiche Password Reset");
                    Console.WriteLine("========================");
                    
                    // Return a completed task since we're not actually sending an email
                    await Task.CompletedTask;
                    return;
                } 
                
                // In production (Azure), use Mailgun to actually send the email
                Console.WriteLine($"Sending password reset email to {user.Email} via Mailgun...");
                
                // Determine the correct base URL for the Mailgun API based on region
                string mailgunBaseUrl = region.Equals("EU", StringComparison.OrdinalIgnoreCase) 
                    ? "https://api.eu.mailgun.net/v3"
                    : "https://api.mailgun.net/v3";
                
                var client = new RestClient(new RestClientOptions
                {
                    BaseUrl = new Uri($"{mailgunBaseUrl}/{domain}"),
                    Authenticator = new HttpBasicAuthenticator("api", apiKey)
                });
                
                var request = new RestRequest("messages", Method.Post);
                request.AddParameter("from", $"{senderName} <{senderEmail}>");
                request.AddParameter("to", $"{user.Name} <{user.Email}>");
                request.AddParameter("subject", "CineNiche Password Reset");
                request.AddParameter("html", htmlContent);
                
                var response = await client.ExecuteAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine("Password reset email sent successfully via Mailgun.");
                }
                else
                {
                    // Log the error response from Mailgun
                    Console.WriteLine($"Mailgun error: {response.StatusCode}, Response: {response.Content}");
                    throw new Exception($"Failed to send email: {response.ErrorMessage ?? response.StatusCode.ToString()}");
                }
            }
            catch (Exception ex)
            {
                // Enhanced logging for debugging
                Console.WriteLine("==== EMAIL SERVICE ERROR ====");
                Console.WriteLine($"Error sending password reset email: {ex.Message}");
                
                // Mask the API key in logs for security
                var maskedApiKey = apiKey.Length > 8 
                    ? $"{apiKey.Substring(0, 4)}...{apiKey.Substring(apiKey.Length - 4)}"
                    : "****";
                    
                Console.WriteLine($"API Key: {maskedApiKey}");
                Console.WriteLine($"Domain: {domain}");
                Console.WriteLine($"From: {senderEmail}");
                Console.WriteLine($"To: {user.Email}");
                Console.WriteLine($"Reset Link: {resetLink}");
                
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                Console.WriteLine("=============================");
                
                // Re-throw the exception to be handled by the caller
                throw;
            }
        }
    }
}
