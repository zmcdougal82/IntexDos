using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace MoviesApp.API.Utilities
{
    public static class DatabaseSetup
    {
        public static async Task EnsurePasswordResetTableExistsAsync(IConfiguration configuration)
        {
            try
            {
                var connectionString = configuration.GetConnectionString("DefaultConnection");
                if (string.IsNullOrEmpty(connectionString))
                {
                    Console.WriteLine("Connection string is empty");
                    return;
                }

                Console.WriteLine("Reading SQL script file");
                string scriptPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "create-password-reset-table.sql");
                
                // If the file doesn't exist at the base directory, try to find it at the project directory
                if (!File.Exists(scriptPath))
                {
                    scriptPath = Path.Combine(AppContext.BaseDirectory, "../../../create-password-reset-table.sql");
                }

                if (!File.Exists(scriptPath))
                {
                    Console.WriteLine($"SQL script file not found: {scriptPath}");
                    return;
                }

                string sqlScript = await File.ReadAllTextAsync(scriptPath);
                
                Console.WriteLine("Executing SQL script to create password_reset_tokens table");
                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(sqlScript, connection))
                    {
                        await command.ExecuteNonQueryAsync();
                    }
                }
                
                Console.WriteLine("SQL script executed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error ensuring password reset table exists: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
            }
        }
    }
}
