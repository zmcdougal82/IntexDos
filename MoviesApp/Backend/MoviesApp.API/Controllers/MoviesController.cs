// Controller for movie-related endpoints
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MoviesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MoviesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Movies
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Movie>>> GetMovies([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            return await _context.Movies
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        // GET: api/Movies/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Movie>> GetMovie(string id)
        {
            var movie = await _context.Movies.FindAsync(id);

            if (movie == null)
            {
                return NotFound();
            }

            return movie;
        }

        // GET: api/Movies/search?query=...
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Movie>>> SearchMovies([FromQuery] string query)
        {
            if (string.IsNullOrEmpty(query))
            {
                return await _context.Movies.Take(20).ToListAsync();
            }

            return await _context.Movies
                .Where(m => m.Title.Contains(query) || 
                       (m.Description != null && m.Description.Contains(query)))
                .Take(50)
                .ToListAsync();
        }

        // GET: api/Movies/genre/action
        // GET: api/Movies/count
        [HttpGet("count")]
        public async Task<ActionResult<int>> GetMoviesCount()
        {
            return await _context.Movies.CountAsync();
        }

        [HttpGet("genre/{genre}")]
        public async Task<ActionResult<IEnumerable<Movie>>> GetMoviesByGenre(string genre, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var normalizedGenre = genre.Trim().ToLower();
            
            // This is a simplistic implementation - in a real app, you'd have a more sophisticated mapping
            // between URL parameters and your database columns
            var query = _context.Movies.AsQueryable();
            
            switch (normalizedGenre)
            {
                case "action":
                    query = query.Where(m => m.Action == 1);
                    break;
                case "adventure":
                    query = query.Where(m => m.Adventure == 1);
                    break;
                case "comedy":
                    query = query.Where(m => m.Comedies == 1);
                    break;
                case "drama":
                    query = query.Where(m => m.Dramas == 1);
                    break;
                case "horror":
                    query = query.Where(m => m.HorrorMovies == 1);
                    break;
                case "thriller":
                    query = query.Where(m => m.Thrillers == 1);
                    break;
                default:
                    return BadRequest("Unknown genre");
            }
            
            return await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}
