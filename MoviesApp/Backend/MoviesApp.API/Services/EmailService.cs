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
                // Always log email details for debugging
                Console.WriteLine();
                Console.WriteLine("==== EMAIL DETAILS ====");
                Console.WriteLine($"To: {user.Email}");
                Console.WriteLine($"From: {senderEmail}");
                Console.WriteLine($"Subject: CineNiche Password Reset");
                Console.WriteLine($"Reset Link: {resetLink}");
                Console.WriteLine("========================");
                
                // Always use SparkPost to send the actual email, regardless of environment
                // Create the SparkPost client
                var client = new Client(apiKey);
                
                // Set API host if provided in config
                if (!string.IsNullOrEmpty(apiUrl))
                {
                    client.ApiHost = apiUrl;
                }

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
                var response = client.Transmissions.Send(transmission);
                
                // Log the transmission ID for tracking
                Console.WriteLine($"Email sent via SparkPost with ID: {response?.Id}");
                
                // In development mode, also log the reset link for easy testing
                if (isDevelopment)
                {
                    Console.WriteLine();
                    Console.WriteLine("████████████████████████████████████████████████");
                    Console.WriteLine("█  DEVELOPMENT MODE - PASSWORD RESET LINK:     █");
                    Console.WriteLine($"█  {resetLink}");
                    Console.WriteLine("████████████████████████████████████████████████");
                    Console.WriteLine();
                }
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
            }
            
            // We always return a completed task, whether the email was sent or not
            await Task.CompletedTask;
        }
    }
}
