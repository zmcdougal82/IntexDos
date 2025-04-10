using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _clientFactory;
        private readonly IConfiguration _configuration;
        private readonly string _recommendationServiceUrl;

        public RatingsController(
            ApplicationDbContext context,
            IHttpClientFactory clientFactory,
            IConfiguration configuration)
        {
            _context = context;
            _clientFactory = clientFactory;
            _configuration = configuration;

            // Get recommendation service URL from config or use default
            _recommendationServiceUrl = configuration["RecommendationService:Url"] ?? 
                (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                    ? "http://localhost:8001" 
                    : "https://moviesapp-recommendations.azurewebsites.net");
        }

        // GET: api/Ratings/movie/{showId}
        [HttpGet("movie/{showId}")]
        public async Task<ActionResult<IEnumerable<Rating>>> GetRatingsForMovie(string showId)
        {
            var ratings = await _context.Ratings
                .Where(r => r.ShowId == showId)
                .Include(r => r.User)
                .ToListAsync();

            return ratings;
        }

        // GET: api/Ratings/user/{userId}
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<Rating>>> GetUserRatings(int userId)
        {
            var ratings = await _context.Ratings
                .Where(r => r.UserId == userId)
                .Include(r => r.Movie)
                .OrderByDescending(r => r.Timestamp)  // Show newest ratings first
                .ToListAsync();

            // Ensure all movie data is loaded
            foreach (var rating in ratings)
            {
                if (rating.Movie != null)
                {
                    // Force load of the movie entity
                    await _context.Entry(rating.Movie).ReloadAsync();
                }
            }

            return ratings;
        }


        // POST: api/Ratings
        [HttpPost]
        [Authorize] // Require authentication
        public async Task<ActionResult<Rating>> PostRating(Rating rating)
        {
            // Check if movie exists
            var movie = await _context.Movies.FindAsync(rating.ShowId);
            if (movie == null)
            {
                return BadRequest("Movie does not exist");
            }

            // Check if user exists
            var user = await _context.Users.FindAsync(rating.UserId);
            if (user == null)
            {
                return BadRequest("User does not exist");
            }

            // Check if rating already exists
            var existingRating = await _context.Ratings
                .FirstOrDefaultAsync(r => r.UserId == rating.UserId && r.ShowId == rating.ShowId);

            bool isNewRating = existingRating == null;

            if (existingRating != null)
            {
                // Update existing rating
                existingRating.RatingValue = rating.RatingValue;
                existingRating.ReviewText = rating.ReviewText; // Update the review text
                existingRating.Timestamp = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                
                // Trigger recommendation update in the background
                _ = UpdateRecommendationsAsync(rating.UserId.ToString(), rating.ShowId, rating.RatingValue);
                
                return Ok(existingRating);
            }

            // Create new rating
            rating.Timestamp = DateTime.UtcNow;
            _context.Ratings.Add(rating);
            
            try
            {
                await _context.SaveChangesAsync();
                
                // Trigger recommendation update in the background
                _ = UpdateRecommendationsAsync(rating.UserId.ToString(), rating.ShowId, rating.RatingValue);
            }
            catch (DbUpdateException)
            {
                return Conflict("Could not save the rating");
            }

            return CreatedAtAction("GetUserRatings", new { userId = rating.UserId }, rating);
        }
        
        // Helper method to update recommendations asynchronously
        private async Task UpdateRecommendationsAsync(string userId, string showId, int ratingValue)
        {
            try
            {
                // Don't wait for the response, just fire the request
                var client = _clientFactory.CreateClient();
                var content = new StringContent(
                    JsonSerializer.Serialize(new { 
                        user_id = userId, 
                        show_id = showId, 
                        rating_value = ratingValue 
                    }),
                    Encoding.UTF8,
                    "application/json");

                await client.PostAsync(
                    $"{_recommendationServiceUrl}/recommendations/update-after-rating", 
                    content);
            }
            catch (Exception ex)
            {
                // Log but don't fail the main operation
                Console.WriteLine($"Failed to update recommendations: {ex.Message}");
            }
        }

        // DELETE: api/Ratings/5/movie/tt123456
        [HttpDelete("user/{userId}/movie/{showId}")]
        [Authorize] // Require authentication
        public async Task<IActionResult> DeleteRating(int userId, string showId)
        {
            var rating = await _context.Ratings
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ShowId == showId);

            if (rating == null)
            {
                return NotFound();
            }

            _context.Ratings.Remove(rating);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
