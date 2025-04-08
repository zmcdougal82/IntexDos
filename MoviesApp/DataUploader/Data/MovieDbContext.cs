using Microsoft.EntityFrameworkCore;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MoviesApp.API.Models;

namespace MoviesApp.DataUploader.Data
{
    public class MovieDbContext : DbContext
    {
        public MovieDbContext()
        {
        }
        
        public MovieDbContext(DbContextOptions<MovieDbContext> options)
            : base(options)
        {
        }
        
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                // Connect to Azure SQL Database
                string connectionString = "Server=tcp:moviesapp-sql-79427.database.windows.net,1433;Initial Catalog=MoviesDB;Persist Security Info=False;User ID=sqladmin;Password=P@ssw0rd123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;";
                optionsBuilder.UseSqlServer(connectionString);
            }
        }

        // Define DbSets
        public DbSet<Movie> Movies { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Rating> Ratings { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
