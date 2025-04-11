using Microsoft.Extensions.Configuration;
using MoviesApp.API.Models;
using SparkPost;
using System;
using System.Collections.Generic;
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
            var apiKey = _configuration["SparkPost:ApiKey"];
            var apiUrl = _configuration["SparkPost:ApiUrl"];
            var senderEmail = _configuration["SparkPost:SenderEmail"];
            var senderName = _configuration["SparkPost:SenderName"];

            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(senderEmail))
            {
                throw new InvalidOperationException("SparkPost API key or sender email is not configured.");
            }

            // Print some debug information
            Console.WriteLine("========= EMAIL SERVICE DEBUG =========");
            Console.WriteLine($"Base URL: {_baseUrl}");
            Console.WriteLine($"API URL: {apiUrl}");
            Console.WriteLine($"Sender Email: {senderEmail}");
            Console.WriteLine($"Sender Name: {senderName}");
            Console.WriteLine($"Recipient: {user.Email}");
            Console.WriteLine("======================================");
            
            // Email content variables
            var resetLink = $"{_baseUrl}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(user.Email)}";
            
            try
            {
                // Create the SparkPost client
                Console.WriteLine($"Creating SparkPost client with API key: {apiKey.Substring(0, 4)}...{apiKey.Substring(apiKey.Length - 4)}");
                var client = new Client(apiKey);
                
                // Make sure we use the correct API host
                if (!string.IsNullOrEmpty(apiUrl))
                {
                    var apiHost = apiUrl.Replace("https://", "").Replace("/api/v1", "");
                    Console.WriteLine($"Setting API host to: {apiHost}");
                    client.ApiHost = apiHost;
                }
                
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

                // Create and send the transmission
                var transmission = new Transmission();
                transmission.Content.From.Email = senderEmail;
                if (!string.IsNullOrEmpty(senderName))
                {
                    transmission.Content.From.Name = senderName;
                }
                transmission.Content.Subject = "CineNiche Password Reset";
                transmission.Content.Html = htmlContent;

                var recipient = new Recipient
                {
                    Address = new Address { Email = user.Email, Name = user.Name }
                };
                transmission.Recipients.Add(recipient);

                // Send the email
                client.Transmissions.Send(transmission);
                
                // Output detailed information about the transmission
                Console.WriteLine("==== EMAIL TRANSMISSION DETAILS ====");
                Console.WriteLine($"Email sent via SparkPost");
                Console.WriteLine("==================================");
                
                // Even if SparkPost accepted the email, it might not be delivered
                // So provide the reset link in the console as a fallback
                Console.WriteLine();
                Console.WriteLine("==== EMAIL PREVIEW (FOR TESTING) ====");
                Console.WriteLine($"To: {user.Email}");
                Console.WriteLine($"From: {senderEmail}");
                Console.WriteLine($"Subject: CineNiche Password Reset");
                Console.WriteLine();
                Console.WriteLine("Password Reset Link (copy to browser if email not received):");
                Console.WriteLine($"{resetLink}");
                Console.WriteLine("====================================");
            }
            catch (Exception ex)
            {
                // Enhanced logging for debugging
                Console.WriteLine("==== EMAIL SERVICE ERROR ====");
                Console.WriteLine($"Error sending password reset email: {ex.Message}");
                Console.WriteLine($"API Key: {apiKey.Substring(0, 4)}...{apiKey.Substring(apiKey.Length - 4)}");
                Console.WriteLine($"From: {senderEmail}");
                Console.WriteLine($"To: {user.Email}");
                Console.WriteLine($"Reset Link: {resetLink}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                Console.WriteLine("=============================");
                
                // Don't throw - let's handle the error gracefully
                // Just log it and let the user know through the UI that they should contact support
                return;
            }
        }
    }
}
