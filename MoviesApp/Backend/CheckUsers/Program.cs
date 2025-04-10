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

                    // Log that the check is complete
                    Console.WriteLine("User check complete.");
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
    }
}
