using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Models;

namespace MoviesApp.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<MovieList> MovieLists { get; set; }
        public DbSet<MovieListItem> MovieListItems { get; set; }

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

            // Configure unique index for User.Email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();
                
            // Configure composite primary key for MovieListItem
            modelBuilder.Entity<MovieListItem>()
                .HasKey(mli => new { mli.ListId, mli.ShowId });
                
            // Configure one-to-many relationship: User to MovieLists
            modelBuilder.Entity<MovieList>()
                .HasOne(ml => ml.User)
                .WithMany()
                .HasForeignKey(ml => ml.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Configure one-to-many relationship: MovieList to MovieListItems
            modelBuilder.Entity<MovieListItem>()
                .HasOne(mli => mli.MovieList)
                .WithMany(ml => ml.Items)
                .HasForeignKey(mli => mli.ListId)
                .OnDelete(DeleteBehavior.Cascade);
                
            // Configure one-to-many relationship: Movie to MovieListItems
            modelBuilder.Entity<MovieListItem>()
                .HasOne(mli => mli.Movie)
                .WithMany()
                .HasForeignKey(mli => mli.ShowId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
