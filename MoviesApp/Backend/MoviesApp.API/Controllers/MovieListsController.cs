using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System.Security.Claims;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]  // Require authentication
    public class MovieListsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MovieListsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/MovieLists
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MovieList>>> GetMyLists()
        {
            int userId = GetCurrentUserId();
            var lists = await _context.MovieLists
                .Where(l => l.UserId == userId)
                .Include(l => l.Items)
                .ThenInclude(i => i.Movie)
                .ToListAsync();
                
            return Ok(lists);
        }

        // GET: api/MovieLists/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MovieList>> GetList(int id)
        {
            int userId = GetCurrentUserId();
            
            var list = await _context.MovieLists
                .Include(l => l.Items)
                .ThenInclude(i => i.Movie)
                .FirstOrDefaultAsync(l => l.ListId == id && l.UserId == userId);
                
            if (list == null)
                return NotFound();
                
            return Ok(list);
        }

        // POST: api/MovieLists
        [HttpPost]
        public async Task<ActionResult<MovieList>> CreateList(MovieList list)
        {
            list.UserId = GetCurrentUserId();
            list.CreatedDate = DateTime.Now;
            
            _context.MovieLists.Add(list);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetList), new { id = list.ListId }, list);
        }

        // PUT: api/MovieLists/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateList(int id, MovieList list)
        {
            int userId = GetCurrentUserId();
            
            if (id != list.ListId)
                return BadRequest();
                
            var existingList = await _context.MovieLists
                .FirstOrDefaultAsync(l => l.ListId == id && l.UserId == userId);
                
            if (existingList == null)
                return NotFound();
                
            // Update only allowed properties
            existingList.Name = list.Name;
            existingList.Description = list.Description;
            existingList.IsPublic = list.IsPublic;
            
            await _context.SaveChangesAsync();
            
            return NoContent();
        }

        // DELETE: api/MovieLists/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteList(int id)
        {
            int userId = GetCurrentUserId();
            
            var list = await _context.MovieLists
                .FirstOrDefaultAsync(l => l.ListId == id && l.UserId == userId);
                
            if (list == null)
                return NotFound();
                
            _context.MovieLists.Remove(list);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }

        // POST: api/MovieLists/5/movies
        [HttpPost("{listId}/movies")]
        public async Task<IActionResult> AddMovieToList(int listId, [FromBody] string showId)
        {
            int userId = GetCurrentUserId();
            
            var list = await _context.MovieLists
                .FirstOrDefaultAsync(l => l.ListId == listId && l.UserId == userId);
                
            if (list == null)
                return NotFound("List not found");
                
            var movie = await _context.Movies.FindAsync(showId);
            if (movie == null)
                return NotFound("Movie not found");
                
            var existingItem = await _context.MovieListItems
                .FirstOrDefaultAsync(i => i.ListId == listId && i.ShowId == showId);
                
            if (existingItem != null)
                return BadRequest("Movie already in list");
                
            var item = new MovieListItem
            {
                ListId = listId,
                ShowId = showId,
                DateAdded = DateTime.Now
            };
            
            _context.MovieListItems.Add(item);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Movie added to list successfully" });
        }

        // DELETE: api/MovieLists/5/movies/abc123
        [HttpDelete("{listId}/movies/{showId}")]
        public async Task<IActionResult> RemoveMovieFromList(int listId, string showId)
        {
            int userId = GetCurrentUserId();
            
            var list = await _context.MovieLists
                .FirstOrDefaultAsync(l => l.ListId == listId && l.UserId == userId);
                
            if (list == null)
                return NotFound("List not found");
                
            var item = await _context.MovieListItems
                .FirstOrDefaultAsync(i => i.ListId == listId && i.ShowId == showId);
                
            if (item == null)
                return NotFound("Movie not in list");
                
            _context.MovieListItems.Remove(item);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Movie removed from list successfully" });
        }

        private int GetCurrentUserId()
        {
            // Get the user ID from the claims
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdString != null && int.TryParse(userIdString, out int userId))
            {
                return userId;
            }
            
            // If we can't get the ID from claims, try to get it from the username
            var userNameClaim = User.FindFirstValue(ClaimTypes.Name);
            if (!string.IsNullOrEmpty(userNameClaim))
            {
                var user = _context.Users.FirstOrDefault(u => u.Email == userNameClaim);
                if (user != null)
                {
                    return user.UserId;
                }
            }
            
            throw new UnauthorizedAccessException("Unable to determine current user");
        }
    }
}
