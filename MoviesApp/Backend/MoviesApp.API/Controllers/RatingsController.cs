using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RatingsController(ApplicationDbContext context)
        {
            _context = context;
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
                .ToListAsync();

            return ratings;
        }

        // POST: api/Ratings
        [HttpPost]
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

            if (existingRating != null)
            {
                // Update existing rating
                existingRating.RatingValue = rating.RatingValue;
                existingRating.Timestamp = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return Ok(existingRating);
            }

            // Create new rating
            rating.Timestamp = DateTime.UtcNow;
            _context.Ratings.Add(rating);
            
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict("Could not save the rating");
            }

            return CreatedAtAction("GetUserRatings", new { userId = rating.UserId }, rating);
        }

        // DELETE: api/Ratings/5/movie/tt123456
        [HttpDelete("user/{userId}/movie/{showId}")]
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
