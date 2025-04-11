using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using MoviesApp.API.Services;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration,
            IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            Console.WriteLine($"Registration attempt for: {model.Email}");
            
            if (!ModelState.IsValid)
            {
                Console.WriteLine("Model validation failed:");
                foreach (var error in ModelState.Values.SelectMany(v => v.Errors))
                {
                    Console.WriteLine($"- {error.ErrorMessage}");
                }
                return BadRequest(ModelState);
            }

            // Check if email already exists
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (existingUser != null)
            {
                Console.WriteLine($"Email already in use: {model.Email}");
                return BadRequest(new { Message = "Email already in use" });
            }

            try
            {
                // Create password hash
                string passwordHash = HashPassword(model.Password);

                // Create new user
                var user = new User
                {
                    Name = model.Name,
                    Email = model.Email,
                    PasswordHash = passwordHash,
                    Phone = model.Phone,
                    Age = model.Age,
                    Gender = model.Gender,
                    City = model.City,
                    State = model.State,
                    Zip = model.Zip,
                    Netflix = model.Netflix,
                    AmazonPrime = model.AmazonPrime,
                    DisneyPlus = model.DisneyPlus,
                    ParamountPlus = model.ParamountPlus,
                    Max = model.Max,
                    Hulu = model.Hulu,
                    AppleTVPlus = model.AppleTVPlus,
                    Peacock = model.Peacock,
                    Role = "User" // Default role
                };

                Console.WriteLine($"Adding user to database: {user.Name} ({user.Email})");
                _context.Users.Add(user);
                
                Console.WriteLine("Calling SaveChangesAsync...");
                var rowsAffected = await _context.SaveChangesAsync();
                Console.WriteLine($"SaveChangesAsync completed. Rows affected: {rowsAffected}");

                if (rowsAffected > 0)
                {
                    Console.WriteLine($"User registered successfully with ID: {user.UserId}");
                    return Ok(new { Message = "User registered successfully", UserId = user.UserId });
                }
                else
                {
                    Console.WriteLine("Registration failed: No rows affected by SaveChangesAsync");
                    return StatusCode(500, new { Message = "Registration failed: Database did not save changes" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Registration error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { Message = "Registration failed due to an error", Error = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthLoginModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
            {
                return Unauthorized(new { Message = "Invalid email or password" });
            }

            // Verify password
            if (!VerifyPassword(model.Password, user.PasswordHash))
            {
                return Unauthorized(new { Message = "Invalid email or password" });
            }

            var token = GenerateJwtToken(user);
            
            // Set the JWT token as a cookie
            Response.Cookies.Append("authToken", token, new CookieOptions
            {
                HttpOnly = true,    // Prevent client-side access to the cookie (security)
                Secure = true,      // Send cookie only over HTTPS
                MaxAge = TimeSpan.FromDays(7), // Cookie expiration time (7 days in this case)
                SameSite = SameSiteMode.Lax  // SameSite policy to control cross-site requests
            });

            return Ok(new
            {
                Token = token,
                User = new
                {
                    Id = user.UserId.ToString(),
                    Email = user.Email,
                    Name = user.Name,
                    Role = user.Role ?? "User"
                }
            });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyHereThatIsAtLeast32CharactersLong";
            var issuer = jwtSettings["Issuer"] ?? "MoviesApp";
            var audience = jwtSettings["Audience"] ?? "MoviesAppUsers";
            var expiryInMinutes = int.Parse(jwtSettings["ExpiryInMinutes"] ?? "60");

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, user.Name)
            };

            // Add role as claim
            if (!string.IsNullOrEmpty(user.Role))
            {
                claims.Add(new Claim(ClaimTypes.Role, user.Role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(expiryInMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Password hashing methods
        private string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash the password with the salt
            byte[] hash = GetHash(password, salt);

            // Combine the salt and hash into a single string
            byte[] hashBytes = new byte[36];
            Array.Copy(salt, 0, hashBytes, 0, 16);
            Array.Copy(hash, 0, hashBytes, 16, 20);

            return Convert.ToBase64String(hashBytes);
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            if (string.IsNullOrEmpty(storedHash))
            {
                return false;
            }

            // Convert the stored hash from base64 string to byte array
            byte[] hashBytes = Convert.FromBase64String(storedHash);

            // Extract the salt from the stored hash
            byte[] salt = new byte[16];
            Array.Copy(hashBytes, 0, salt, 0, 16);

            // Hash the input password with the extracted salt
            byte[] computedHash = GetHash(password, salt);

            // Compare the computed hash with the stored hash
            for (int i = 0; i < 20; i++)
            {
                if (hashBytes[i + 16] != computedHash[i])
                {
                    return false;
                }
            }

            return true;
        }

        private byte[] GetHash(string password, byte[] salt)
        {
            using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256))
            {
                return pbkdf2.GetBytes(20);
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            Console.WriteLine($"Forgot password request received for email: {model.Email}");

            // Find user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
            {
                // For security reasons, we don't want to reveal whether a user exists or not
                Console.WriteLine($"User not found for email: {model.Email}");
                return Ok(new { 
                    Message = "If your email exists in our system, you will receive a password reset link shortly.",
                    Status = "success" 
                });
            }

            try
            {
                // Generate a unique token
                string token = GeneratePasswordResetToken();
                Console.WriteLine($"Generated reset token for user {user.UserId}: {token.Substring(0, 8)}...");
                
                // Save token to database
                var passwordResetToken = new PasswordResetToken
                {
                    UserId = user.UserId,
                    Token = token,
                    ExpiryDate = DateTime.UtcNow.AddHours(1), // Token valid for 1 hour
                    IsUsed = false
                };
                
                // Remove any existing tokens for this user that are not used
                var existingTokens = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.UserId && !t.IsUsed)
                    .ToListAsync();
                
                if (existingTokens.Any())
                {
                    Console.WriteLine($"Removing {existingTokens.Count} existing unused tokens for user {user.UserId}");
                    _context.PasswordResetTokens.RemoveRange(existingTokens);
                }
                
                _context.PasswordResetTokens.Add(passwordResetToken);
                await _context.SaveChangesAsync();
                Console.WriteLine("Token saved to database successfully");
                
                // Send email with password reset link
                Console.WriteLine($"Attempting to send password reset email to {user.Email}");
                await _emailService.SendPasswordResetEmailAsync(user, token);
                Console.WriteLine("Email sent successfully");
                
                return Ok(new { 
                    Message = "If your email exists in our system, you will receive a password reset link shortly.",
                    Status = "success" 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Forgot password error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                // We'll return a specific status code for email sending issues
                // The frontend can detect this and show a more helpful message
                // while still not revealing if the account exists
                return Ok(new { 
                    Message = "If your email exists in our system, you will receive a password reset link shortly. If you don't receive an email, please check your spam folder or contact support.",
                    Status = "warning" 
                });
            }
        }
        
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            try
            {
                // Find user by email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
                if (user == null)
                {
                    return BadRequest(new { Message = "Invalid token or email" });
                }
                
                // Find the token in the database
                var resetToken = await _context.PasswordResetTokens
                    .FirstOrDefaultAsync(t => 
                        t.Token == model.Token && 
                        t.UserId == user.UserId && 
                        !t.IsUsed && 
                        t.ExpiryDate > DateTime.UtcNow);
                    
                if (resetToken == null)
                {
                    return BadRequest(new { Message = "Invalid or expired token" });
                }
                
                // Update user password
                string newPasswordHash = HashPassword(model.NewPassword);
                user.PasswordHash = newPasswordHash;
                
                // Mark token as used
                resetToken.IsUsed = true;
                
                // Save changes
                await _context.SaveChangesAsync();
                
                return Ok(new { Message = "Password has been reset successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Reset password error: {ex.Message}");
                return StatusCode(500, new { Message = "An error occurred while resetting your password" });
            }
        }
        
        private string GeneratePasswordResetToken()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }
    }
}
