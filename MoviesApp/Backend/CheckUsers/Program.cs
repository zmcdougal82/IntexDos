using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System.IO;

namespace CheckUsers
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("Checking users in the database...");

            // Find the appsettings.json file
            string apiDirectory = Path.Combine(Directory.GetCurrentDirectory(), "..", "MoviesApp.API");
            string appsettingsPath = Path.Combine(apiDirectory, "appsettings.json");
            
            Console.WriteLine($"Looking for appsettings.json at: {appsettingsPath}");
            
            if (!File.Exists(appsettingsPath))
            {
                Console.WriteLine("appsettings.json not found. Trying absolute path...");
                appsettingsPath = Path.Combine("/Users/zackmcdougal/IntexDos/MoviesApp/Backend/MoviesApp.API", "appsettings.json");
                Console.WriteLine($"Trying absolute path: {appsettingsPath}");
            }
            
            // Setup configuration
            var configuration = new ConfigurationBuilder()
                .AddJsonFile(appsettingsPath)
                .Build();

            // Create DbContext options
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));

            try
            {
                // Create DbContext
                using (var context = new ApplicationDbContext(optionsBuilder.Options))
                {
                    // Query users
                    var users = await context.Users.ToListAsync();
                    
                    Console.WriteLine($"Total users: {users.Count}");
                    
                    foreach (var user in users)
                    {
                        Console.WriteLine($"User ID: {user.UserId}, Name: {user.Name}, Email: {user.Email}, Role: {user.Role}");
                    }

                    // Find the usser with email testie@test.com
                    var testUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "testie@test.com");
                    if (testUser != null)
                    {
                        Console.WriteLine($"Found test user: {testUser.Name} (ID: {testUser.UserId})");
                        
                        // Update the password
                        string newPasswordHash = HashPassword("Password123!");
                        testUser.PasswordHash = newPasswordHash;
                        
                        await context.SaveChangesAsync();
                        
                        Console.WriteLine("Password updated for test user");
                    }
                    else
                    {
                        Console.WriteLine("Test user not found. Creating a new test user...");
                        
                        // Create password hash
                        string passwordHash = HashPassword("Password123!");

                        // Create new user
                        var user = new User
                        {
                            Name = "Test User",
                            Email = "testie@test.com",
                            PasswordHash = passwordHash,
                            Role = "User"
                        };

                        context.Users.Add(user);
                        await context.SaveChangesAsync();
                        
                        Console.WriteLine($"Test user created with ID: {user.UserId}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner error: {ex.InnerException.Message}");
                }
            }
        }

        // Password hashing method from AuthController
        private static string HashPassword(string password)
        {
            // Generate a random salt
            byte[] salt = new byte[16];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
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

        private static byte[] GetHash(string password, byte[] salt)
        {
            using (var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(
                password, salt, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256))
            {
                return pbkdf2.GetBytes(20);
            }
        }
    }
}
