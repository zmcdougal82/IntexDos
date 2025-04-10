using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MoviesApp.API.Data;
using MoviesApp.API.Models;

namespace MoviesApp.API
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            // Setup configuration
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();

            // Create DbContext options
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseSqlServer(configuration.GetConnectionString("DefaultConnection"));

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
                
                Console.WriteLine("User check complete.");
            }
        }
    }
}
