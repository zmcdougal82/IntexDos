using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MoviesApp.API.Data;
using MoviesApp.API.Models;

namespace MoviesApp.API.Services
{
    public class CuratedListsGeneratorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CuratedListsGeneratorService> _logger;
        private readonly IConfiguration _configuration;
        
        // This constant will be used to identify which user ID "owns" the curated lists
        private const int SYSTEM_USER_ID = 1;  // We'll use admin user as the owner
        
        public CuratedListsGeneratorService(
            IServiceProvider serviceProvider,
            IConfiguration configuration,
            ILogger<CuratedListsGeneratorService> logger)
        {
            _serviceProvider = serviceProvider;
            _configuration = configuration;
            _logger = logger;
        }
        
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Curated Lists Generator Service started at: {time}", DateTimeOffset.Now);
            
            // Get refresh interval from configuration (default to 7 days)
            var intervalDays = _configuration.GetValue<double>("CuratedLists:RefreshIntervalDays", 7);
            _logger.LogInformation("List refresh interval set to {days} days", intervalDays);
            
            using PeriodicTimer timer = new(TimeSpan.FromDays(intervalDays));
            
            // Generate lists immediately on startup
            await GenerateCuratedListsAsync(stoppingToken);
            
            // Then run on the timer schedule
            while (await timer.WaitForNextTickAsync(stoppingToken) && !stoppingToken.IsCancellationRequested)
            {
                await GenerateCuratedListsAsync(stoppingToken);
            }
        }
        
        private async Task GenerateCuratedListsAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Generating curated lists at: {time}", DateTimeOffset.Now);
            
            try
            {
                // Create a scope to resolve scoped services
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var recommendationService = scope.ServiceProvider.GetRequiredService<IRecommendationService>();
                
                // Make sure the system user exists
                await EnsureSystemUserExistsAsync(dbContext);
                
                // Generate different types of curated lists
                await GenerateCriticPicksListAsync(dbContext, recommendationService, stoppingToken);
                await GenerateGenreListsAsync(dbContext, recommendationService, stoppingToken);
                await GenerateHiddenGemsListAsync(dbContext, recommendationService, stoppingToken);
                await GeneratePopularMoviesListAsync(dbContext, recommendationService, stoppingToken);
                
                _logger.LogInformation("Curated lists generation completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating curated lists");
            }
        }
        
        private async Task EnsureSystemUserExistsAsync(ApplicationDbContext dbContext)
        {
            // Check if our system user for curated lists exists
            var systemUser = await dbContext.Users.FindAsync(SYSTEM_USER_ID);
            
            if (systemUser == null)
            {
                _logger.LogWarning("System user for curated lists not found. Using or creating an Admin user.");
                
                // Try to find any admin user
                systemUser = await dbContext.Users
                    .FirstOrDefaultAsync(u => u.Role == "Admin");
                
                if (systemUser == null)
                {
                    _logger.LogWarning("No admin user found. Curated lists may not be generated properly.");
                }
            }
        }
        
        private async Task GenerateCriticPicksListAsync(
            ApplicationDbContext dbContext, 
            IRecommendationService recommendationService,
            CancellationToken stoppingToken)
        {
            const string listName = "Critics' Picks";
            
            try
            {
                // Get top rated movies from the recommendation service
                var movieIds = await recommendationService.GetTopRatedMovies(20);
                
                if (movieIds.Count == 0)
                {
                    _logger.LogWarning("No movies returned for Critics' Picks list");
                    return;
                }
                
                await CreateOrUpdateCuratedListAsync(
                    dbContext,
                    listName, 
                    "The highest-rated films curated by our recommendation system",
                    movieIds,
                    stoppingToken);
                
                _logger.LogInformation("Critics' Picks list generated with {count} movies", movieIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Critics' Picks list");
            }
        }
        
        private async Task GenerateHiddenGemsListAsync(
            ApplicationDbContext dbContext, 
            IRecommendationService recommendationService,
            CancellationToken stoppingToken)
        {
            const string listName = "Hidden Gems";
            
            try
            {
                // Get hidden gems from the recommendation service
                var movieIds = await recommendationService.GetHiddenGems(20);
                
                if (movieIds.Count == 0)
                {
                    _logger.LogWarning("No movies returned for Hidden Gems list");
                    return;
                }
                
                await CreateOrUpdateCuratedListAsync(
                    dbContext,
                    listName, 
                    "Highly-rated films that deserve more attention",
                    movieIds,
                    stoppingToken);
                
                _logger.LogInformation("Hidden Gems list generated with {count} movies", movieIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Hidden Gems list");
            }
        }
        
        private async Task GeneratePopularMoviesListAsync(
            ApplicationDbContext dbContext, 
            IRecommendationService recommendationService,
            CancellationToken stoppingToken)
        {
            const string listName = "Fan Favorites";
            
            try
            {
                // Get popular movies from the recommendation service
                var movieIds = await recommendationService.GetPopularMovies(20);
                
                if (movieIds.Count == 0)
                {
                    _logger.LogWarning("No movies returned for Fan Favorites list");
                    return;
                }
                
                await CreateOrUpdateCuratedListAsync(
                    dbContext,
                    listName, 
                    "The most popular films that everyone is watching",
                    movieIds,
                    stoppingToken);
                
                _logger.LogInformation("Fan Favorites list generated with {count} movies", movieIds.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating Fan Favorites list");
            }
        }
        
        private async Task GenerateGenreListsAsync(
            ApplicationDbContext dbContext, 
            IRecommendationService recommendationService,
            CancellationToken stoppingToken)
        {
            // Define genres to create lists for
            var genres = new string[] 
            { 
                "Action", "Comedies", "Dramas", "Thrillers", "Documentaries"
            };
            
            foreach (var genre in genres)
            {
                string listName = $"Best of {genre}";
                
                try
                {
                    // Get movies for this genre from the recommendation service
                    var movieIds = await recommendationService.GetMoviesByGenre(genre, 20);
                    
                    if (movieIds.Count == 0)
                    {
                        _logger.LogWarning("No movies returned for {genre} list", genre);
                        continue;
                    }
                    
                    await CreateOrUpdateCuratedListAsync(
                        dbContext,
                        listName, 
                        $"A collection of the finest {genre.ToLower()} for your viewing pleasure",
                        movieIds,
                        stoppingToken);
                    
                    _logger.LogInformation("{genre} list generated with {count} movies", genre, movieIds.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error generating {genre} list", genre);
                }
            }
        }
        
        private async Task CreateOrUpdateCuratedListAsync(
            ApplicationDbContext dbContext,
            string listName,
            string description,
            List<string> movieIds,
            CancellationToken stoppingToken)
        {
            // Check if list already exists
            var existingList = await dbContext.MovieLists
                .Include(l => l.Items)
                .FirstOrDefaultAsync(l => l.UserId == SYSTEM_USER_ID && l.Name == listName, stoppingToken);
            
            if (existingList != null)
            {
                // Update existing list
                existingList.Description = description;
                
                // Remove existing items
                dbContext.MovieListItems.RemoveRange(existingList.Items);
                
                // Add new items
                existingList.Items = movieIds.Select((movieId, index) => new MovieListItem
                {
                    ListId = existingList.ListId,
                    ShowId = movieId,
                    DateAdded = DateTime.UtcNow
                }).ToList();
                
                _logger.LogInformation("Updated existing curated list: {listName}", listName);
            }
            else
            {
                // Create new list
                var newList = new MovieList
                {
                    UserId = SYSTEM_USER_ID,
                    Name = listName,
                    Description = description,
                    CreatedDate = DateTime.UtcNow,
                    IsPublic = true,
                    Items = movieIds.Select(movieId => new MovieListItem
                    {
                        ShowId = movieId,
                        DateAdded = DateTime.UtcNow
                    }).ToList()
                };
                
                dbContext.MovieLists.Add(newList);
                _logger.LogInformation("Created new curated list: {listName}", listName);
            }
            
            await dbContext.SaveChangesAsync(stoppingToken);
        }
    }
}
