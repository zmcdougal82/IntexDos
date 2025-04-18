// Controller for movie-related endpoints
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoviesApp.API.Data;
using MoviesApp.API.Models;
using MoviesApp.API.Utilities;
using System;
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
                .OrderBy(m => m.ShowId) // Add ordering for consistent results
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
        public async Task<ActionResult<IEnumerable<Movie>>> SearchMovies(
            [FromQuery] string query, 
            [FromQuery] string searchField = "title", // New parameter with default value
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20)
        {
            if (string.IsNullOrEmpty(query))
            {
                return await _context.Movies
                    .OrderBy(m => m.ShowId) // Add ordering for consistent results
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }

            // Updated query logic based on searchField
            var moviesQuery = _context.Movies.AsQueryable();
            
            switch (searchField.ToLower())
            {
                case "director":
                    moviesQuery = moviesQuery.Where(m => m.Director != null && m.Director.Contains(query));
                    break;
                case "cast":
                    moviesQuery = moviesQuery.Where(m => m.Cast != null && m.Cast.Contains(query));
                    break;
                case "year":
                    // Try to parse the year
                    if (int.TryParse(query, out int year))
                    {
                        moviesQuery = moviesQuery.Where(m => m.ReleaseYear == year);
                    }
                    else
                    {
                        // If not a valid year, search in title as fallback
                        moviesQuery = moviesQuery.Where(m => m.Title.Contains(query));
                    }
                    break;
                case "title":
                default:
                    moviesQuery = moviesQuery.Where(m => m.Title.Contains(query));
                    break;
            }

            return await moviesQuery
                .OrderBy(m => m.ShowId) // Add ordering for consistent results
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        // GET: api/Movies/genre/action
        // POST: api/Movies/genres - For multiple genre filtering
        [HttpPost("genres")]
        [Consumes("application/json")]
        public async Task<ActionResult<IEnumerable<Movie>>> GetMoviesByMultipleGenres([FromBody] List<string> genres, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            if (genres == null || !genres.Any())
            {
                return await GetMovies(page, pageSize);
            }
            
            try 
            {
                // Start with an empty predicate
                var query = _context.Movies.AsQueryable();
                
                // Build a predicate for OR conditions (movies that match ANY of the selected genres)
                var predicate = PredicateBuilder.False<Movie>();
                
                foreach (var genre in genres)
                {
                    var normalizedGenre = genre.Trim().ToLower();
                    
                    switch (normalizedGenre)
                    {
                        // Movie genres
                        case "action":
                            predicate = predicate.Or(m => m.Action == 1);
                            break;
                        case "adventure":
                            predicate = predicate.Or(m => m.Adventure == 1);
                            break;
                        case "comedy":
                            predicate = predicate.Or(m => m.Comedies == 1);
                            break;
                        case "drama":
                            predicate = predicate.Or(m => m.Dramas == 1);
                            break;
                        case "horrormovies":
                            predicate = predicate.Or(m => m.HorrorMovies == 1);
                            break;
                        case "thrillers":
                            predicate = predicate.Or(m => m.Thrillers == 1);
                            break;
                        case "documentaries":
                            predicate = predicate.Or(m => m.Documentaries == 1);
                            break;
                        case "familymovies":
                            predicate = predicate.Or(m => m.FamilyMovies == 1);
                            break;
                        case "fantasy":
                            predicate = predicate.Or(m => m.Fantasy == 1);
                            break;
                        case "musicals":
                            predicate = predicate.Or(m => m.Musicals == 1);
                            break;
                        case "romanticmovies":
                            predicate = predicate.Or(m => m.DramasRomanticMovies == 1 || m.ComediesRomanticMovies == 1);
                            break;
                        case "internationalmovies":
                            predicate = predicate.Or(m => m.DramasInternationalMovies == 1 || m.ComediesInternationalMovies == 1 || 
                                                      m.DocumentariesInternationalMovies == 1 || m.InternationalMoviesThrillers == 1);
                            break;
                        
                        // TV Show genres
                        case "tvaction":
                            predicate = predicate.Or(m => m.TVAction == 1);
                            break;
                        case "tvcomedies":
                            predicate = predicate.Or(m => m.TVComedies == 1);
                            break;
                        case "tvdramas":
                            predicate = predicate.Or(m => m.TVDramas == 1);
                            break;
                        case "docuseries":
                            predicate = predicate.Or(m => m.Docuseries == 1);
                            break;
                        case "kidstv":
                            predicate = predicate.Or(m => m.KidsTV == 1);
                            break;
                        case "realitytv":
                            predicate = predicate.Or(m => m.RealityTV == 1);
                            break;
                        case "talkshows":
                            predicate = predicate.Or(m => m.TalkShowsTVComedies == 1);
                            break;
                        case "animeseries":
                            predicate = predicate.Or(m => m.AnimeSeriesInternationalTVShows == 1);
                            break;
                        case "britishtvshows":
                            predicate = predicate.Or(m => m.BritishTVShowsDocuseriesInternationalTVShows == 1);
                            break;
                        case "internationaltvshows":
                            predicate = predicate.Or(m => m.InternationalTVShowsRomanticTVShowsTVDramas == 1 || 
                                                     m.AnimeSeriesInternationalTVShows == 1 || 
                                                     m.BritishTVShowsDocuseriesInternationalTVShows == 1);
                            break;
                        case "romantictvshows":
                            predicate = predicate.Or(m => m.InternationalTVShowsRomanticTVShowsTVDramas == 1);
                            break;
                        case "crimetvshows":
                            predicate = predicate.Or(m => m.CrimeTVShowsDocuseries == 1);
                            break;
                        case "languagetvshows":
                            predicate = predicate.Or(m => m.LanguageTVShows == 1);
                            break;
                        case "naturetv":
                            predicate = predicate.Or(m => m.NatureTV == 1);
                            break;
                        case "spirituality":
                            predicate = predicate.Or(m => m.Spirituality == 1);
                            break;
                        case "children":
                            predicate = predicate.Or(m => m.Children == 1);
                            break;
                    }
                }
                
                // Apply the OR predicate to the query
                query = query.Where(predicate);
                
                return await query
                    .OrderBy(m => m.ShowId) // Add ordering for consistent results
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error in multi-genre filter: {ex.Message}");
                return new List<Movie>();
            }
        }
        
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
            
            // Enhanced implementation that supports all genre columns in the database
            var query = _context.Movies.AsQueryable();
            
            try 
            {
                switch (normalizedGenre)
                {
                    // Movie genres
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
                    case "horrormovies":
                        query = query.Where(m => m.HorrorMovies == 1);
                        break;
                    case "thriller":
                    case "thrillers":
                        query = query.Where(m => m.Thrillers == 1);
                        break;
                    case "documentary":
                    case "documentaries":
                        query = query.Where(m => m.Documentaries == 1);
                        break;
                    case "family":
                    case "familymovies":
                        query = query.Where(m => m.FamilyMovies == 1);
                        break;
                    case "fantasy":
                        query = query.Where(m => m.Fantasy == 1);
                        break;
                    case "musical":
                    case "musicals":
                        query = query.Where(m => m.Musicals == 1);
                        break;
                    case "romance":
                    case "romantic":
                    case "romanticmovies":
                        query = query.Where(m => m.DramasRomanticMovies == 1 || m.ComediesRomanticMovies == 1);
                        break;
                    case "international":
                    case "internationalmovies":
                        query = query.Where(m => m.DramasInternationalMovies == 1 || m.ComediesInternationalMovies == 1 || 
                                                m.DocumentariesInternationalMovies == 1 || m.InternationalMoviesThrillers == 1);
                        break;
                    
                    // TV Show genres
                    case "tvaction":
                        query = query.Where(m => m.TVAction == 1);
                        break;
                    case "tvcomedy":
                    case "tvcomedies":
                        query = query.Where(m => m.TVComedies == 1);
                        break;
                    case "tvdrama":
                    case "tvdramas":
                        query = query.Where(m => m.TVDramas == 1);
                        break;
                    case "docuseries":
                        query = query.Where(m => m.Docuseries == 1);
                        break;
                    case "kidstv":
                    case "kids":
                    case "kidtv":
                        query = query.Where(m => m.KidsTV == 1);
                        break;
                    case "reality":
                    case "realitytv":
                        query = query.Where(m => m.RealityTV == 1);
                        break;
                    case "talk":
                    case "talkshows":
                        query = query.Where(m => m.TalkShowsTVComedies == 1);
                        break;
                    case "anime":
                    case "animeseries":
                        query = query.Where(m => m.AnimeSeriesInternationalTVShows == 1);
                        break;
                    case "british":
                    case "britishtvshows":
                        query = query.Where(m => m.BritishTVShowsDocuseriesInternationalTVShows == 1);
                        break;
                    case "tvinter":
                    case "internationaltvshows":
                        query = query.Where(m => m.InternationalTVShowsRomanticTVShowsTVDramas == 1 || 
                                               m.AnimeSeriesInternationalTVShows == 1 || 
                                               m.BritishTVShowsDocuseriesInternationalTVShows == 1);
                        break;
                    case "romantictvshows":
                        query = query.Where(m => m.InternationalTVShowsRomanticTVShowsTVDramas == 1);
                        break;
                    case "crime":
                    case "crimetvshows":
                        query = query.Where(m => m.CrimeTVShowsDocuseries == 1);
                        break;
                    case "language":
                    case "languagetvshows":
                        query = query.Where(m => m.LanguageTVShows == 1);
                        break;
                    case "nature":
                    case "naturetv":
                        query = query.Where(m => m.NatureTV == 1);
                        break;
                    case "spiritual":
                    case "spirituality":
                        query = query.Where(m => m.Spirituality == 1);
                        break;
                    case "children":
                        query = query.Where(m => m.Children == 1);
                        break;
                    default:
                        // Try search in title instead of returning a 400 error
                        query = query.Where(m => m.Title.Contains(normalizedGenre));
                        break;
                }
                
                return await query
                    .OrderBy(m => m.ShowId) // Add ordering for consistent results
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error in genre filter: {ex.Message}");
                return new List<Movie>();
            }
        }

        // POST: api/Movies
        [HttpPost]
        public async Task<ActionResult<Movie>> CreateMovie([FromBody] Movie movie)
        {
            try
            {
                // Auto-generate ShowId if not provided
                if (string.IsNullOrEmpty(movie.ShowId))
                {
                    // Generate a unique ID using current timestamp to avoid collisions
                    string timestampId = DateTime.Now.Ticks.ToString();
                    movie.ShowId = $"s{timestampId.Substring(Math.Max(0, timestampId.Length - 10))}";
                    
                    // Make sure this ID doesn't already exist
                    while (await _context.Movies.AnyAsync(m => m.ShowId == movie.ShowId))
                    {
                        // If it exists, generate a new one with a small delay
                        await Task.Delay(10); // Small delay to get a different timestamp
                        timestampId = DateTime.Now.Ticks.ToString();
                        movie.ShowId = $"s{timestampId.Substring(Math.Max(0, timestampId.Length - 10))}";
                    }
                }
                
                // Initialize all genre fields to 0 if not set
                movie.Action ??= 0;
                movie.Adventure ??= 0;
                movie.AnimeSeriesInternationalTVShows ??= 0;
                movie.BritishTVShowsDocuseriesInternationalTVShows ??= 0;
                movie.Children ??= 0;
                movie.Comedies ??= 0;
                movie.ComediesDramasInternationalMovies ??= 0;
                movie.ComediesInternationalMovies ??= 0;
                movie.ComediesRomanticMovies ??= 0;
                movie.CrimeTVShowsDocuseries ??= 0;
                movie.Documentaries ??= 0;
                movie.DocumentariesInternationalMovies ??= 0;
                movie.Docuseries ??= 0;
                movie.Dramas ??= 0;
                movie.DramasInternationalMovies ??= 0;
                movie.DramasRomanticMovies ??= 0;
                movie.FamilyMovies ??= 0;
                movie.Fantasy ??= 0;
                movie.HorrorMovies ??= 0;
                movie.InternationalMoviesThrillers ??= 0;
                movie.InternationalTVShowsRomanticTVShowsTVDramas ??= 0;
                movie.KidsTV ??= 0;
                movie.LanguageTVShows ??= 0;
                movie.Musicals ??= 0;
                movie.NatureTV ??= 0;
                movie.RealityTV ??= 0;
                movie.Spirituality ??= 0;
                movie.TVAction ??= 0;
                movie.TVComedies ??= 0;
                movie.TVDramas ??= 0;
                movie.TalkShowsTVComedies ??= 0;
                movie.Thrillers ??= 0;
                
                _context.Movies.Add(movie);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMovie), new { id = movie.ShowId }, movie);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // PUT: api/Movies/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMovie(string id, [FromBody] Movie movie)
        {
            if (id != movie.ShowId)
            {
                return BadRequest("Movie ID mismatch");
            }

            try
            {
                var existingMovie = await _context.Movies.FindAsync(id);
                if (existingMovie == null)
                {
                    return NotFound($"Movie with ID {id} not found");
                }

                // Update properties
                existingMovie.Title = movie.Title;
                existingMovie.Type = movie.Type;
                existingMovie.Director = movie.Director;
                existingMovie.Cast = movie.Cast;
                existingMovie.Country = movie.Country;
                existingMovie.ReleaseYear = movie.ReleaseYear;
                existingMovie.Rating = movie.Rating;
                existingMovie.Duration = movie.Duration;
                existingMovie.Description = movie.Description;
                existingMovie.PosterUrl = movie.PosterUrl;
                
                // Update genre fields
                existingMovie.Action = movie.Action;
                existingMovie.Adventure = movie.Adventure;
                existingMovie.AnimeSeriesInternationalTVShows = movie.AnimeSeriesInternationalTVShows;
                existingMovie.BritishTVShowsDocuseriesInternationalTVShows = movie.BritishTVShowsDocuseriesInternationalTVShows;
                existingMovie.Children = movie.Children;
                existingMovie.Comedies = movie.Comedies;
                existingMovie.ComediesDramasInternationalMovies = movie.ComediesDramasInternationalMovies;
                existingMovie.ComediesInternationalMovies = movie.ComediesInternationalMovies;
                existingMovie.ComediesRomanticMovies = movie.ComediesRomanticMovies;
                existingMovie.CrimeTVShowsDocuseries = movie.CrimeTVShowsDocuseries;
                existingMovie.Documentaries = movie.Documentaries;
                existingMovie.DocumentariesInternationalMovies = movie.DocumentariesInternationalMovies;
                existingMovie.Docuseries = movie.Docuseries;
                existingMovie.Dramas = movie.Dramas;
                existingMovie.DramasInternationalMovies = movie.DramasInternationalMovies;
                existingMovie.DramasRomanticMovies = movie.DramasRomanticMovies;
                existingMovie.FamilyMovies = movie.FamilyMovies;
                existingMovie.Fantasy = movie.Fantasy;
                existingMovie.HorrorMovies = movie.HorrorMovies;
                existingMovie.InternationalMoviesThrillers = movie.InternationalMoviesThrillers;
                existingMovie.InternationalTVShowsRomanticTVShowsTVDramas = movie.InternationalTVShowsRomanticTVShowsTVDramas;
                existingMovie.KidsTV = movie.KidsTV;
                existingMovie.LanguageTVShows = movie.LanguageTVShows;
                existingMovie.Musicals = movie.Musicals;
                existingMovie.NatureTV = movie.NatureTV;
                existingMovie.RealityTV = movie.RealityTV;
                existingMovie.Spirituality = movie.Spirituality;
                existingMovie.TVAction = movie.TVAction;
                existingMovie.TVComedies = movie.TVComedies;
                existingMovie.TVDramas = movie.TVDramas;
                existingMovie.TalkShowsTVComedies = movie.TalkShowsTVComedies;
                existingMovie.Thrillers = movie.Thrillers;

                // Mark as modified
                _context.Entry(existingMovie).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MovieExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // DELETE: api/Movies/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMovie(string id)
        {
            try
            {
                var movie = await _context.Movies.FindAsync(id);
                if (movie == null)
                {
                    return NotFound($"Movie with ID {id} not found");
                }

                _context.Movies.Remove(movie);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private bool MovieExists(string id)
        {
            return _context.Movies.Any(e => e.ShowId == id);
        }
    }
}
