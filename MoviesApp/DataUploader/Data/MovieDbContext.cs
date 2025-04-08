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
            
            // Map entity names to database table names
            modelBuilder.Entity<User>().ToTable("movies_users");
            modelBuilder.Entity<Movie>().ToTable("movies_titles");
            modelBuilder.Entity<Rating>().ToTable("movies_ratings");

            // Configure composite primary key for Rating
            modelBuilder.Entity<Rating>()
                .HasKey(r => new { r.UserId, r.ShowId });

            // Configure one-to-many relationship: User to Ratings
            modelBuilder.Entity<Rating>()
                .HasOne(r => r.User)
                .WithMany(u => u.Ratings)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure one-to-many relationship: Movie to Ratings
            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Movie)
                .WithMany(m => m.Ratings)
                .HasForeignKey(r => r.ShowId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
