// Script to update missing movie information from TMDB API
// This script will:
// 1. Create a backup of your database first (for safety)
// 2. Fetch all movies from your database
// 3. Check for missing fields (country, rating, duration, etc.)
// 4. Update those fields with data from TMDB API

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import backup functionality (if available)
let backupUtils;
try {
  backupUtils = await import('./backup-and-restore.js');
  console.log('Backup utility loaded successfully.');
} catch (error) {
  console.log('Backup utility not available. Continuing without backup capabilities.');
  console.log('Error:', error.message);
  backupUtils = null;
}

// Configuration
const API_URL = 'https://moviesapp-api-fixed.azurewebsites.net/api'; // Replace with your API URL if needed
const TMDB_API_KEY = '56cfecfb2042af273b7c51099340b62e'; // Your TMDB API key
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const LOG_FILE = path.join(__dirname, 'update-records-log.txt');
const THROTTLE_MS = 1000; // Time to wait between API calls to avoid rate limiting (1 second)

// Optional JWT token for authenticated API calls (if your API requires it)
const JWT_TOKEN = process.env.JWT_TOKEN || ''; // Set this as an environment variable or replace with a valid token

// Initialize log file
fs.writeFileSync(LOG_FILE, `Movie Record Update Log - ${new Date().toISOString()}\n\n`);

// Helper function to log messages
function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Helper function to throttle API calls
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Format duration from minutes to readable format (e.g., 155 → "2h 35m")
function formatDuration(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Map TMDB TV ratings to our application's rating options
function mapTVRatingToOptions(tmdbRating) {
  if (!tmdbRating) return '';
  
  // Map TMDB TV content ratings to our dropdown options
  const ratingMap = {
    // US TV Ratings
    'TV-Y': 'TV-Y',
    'TV-Y7': 'TV-Y7',
    'TV-G': 'TV-G',
    'TV-PG': 'TV-PG',
    'TV-14': 'TV-14',
    'TV-MA': 'TV-MA',
    // Common alternate codes
    'NR': 'Not Rated',
    'G': 'TV-G',
    'PG': 'TV-PG',
    '14': 'TV-14',
    'MA': 'TV-MA'
  };
  
  return ratingMap[tmdbRating] || '';
}

// Function to check if a movie needs updating
function needsUpdate(movie) {
  // Define which fields we want to check
  const fieldsToCheck = ['country', 'rating', 'duration', 'posterUrl', 'cast', 'director'];
  
  // Check if any of these fields are missing or empty
  for (const field of fieldsToCheck) {
    if (!movie[field] || movie[field] === '') {
      return true;
    }
  }
  
  return false;
}

// Function to fetch all movies from our API
async function fetchAllMovies() {
  try {
    // Create headers with token if available
    const headers = {};
    if (JWT_TOKEN) {
      headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }
    
    let page = 1;
    const pageSize = 100; // Fetch in larger batches
    let allMovies = [];
    let hasMorePages = true;
    
    while (hasMorePages) {
      log(`Fetching movies page ${page}...`);
      const response = await axios.get(`${API_URL}/movies?page=${page}&pageSize=${pageSize}`, { headers });
      
      if (response.data && response.data.length > 0) {
        allMovies = [...allMovies, ...response.data];
        if (response.data.length < pageSize) {
          hasMorePages = false;
        } else {
          page++;
        }
      } else {
        hasMorePages = false;
      }
    }
    
    log(`Successfully fetched ${allMovies.length} movies in total.`);
    return allMovies;
  } catch (error) {
    log(`Error fetching movies: ${error.message}`);
    throw error;
  }
}

// Function to search TMDB for a movie
async function searchTMDB(title, type = 'movie') {
  try {
    const url = `${TMDB_API_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    log(`TMDB search error for "${title}": ${error.message}`);
    return { results: [] };
  }
}

// Function to get detailed movie information from TMDB
async function getMovieDetails(movieId) {
  try {
    const url = `${TMDB_API_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,release_dates`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    log(`Error getting movie details (ID: ${movieId}): ${error.message}`);
    throw error;
  }
}

// Function to get detailed TV show information from TMDB
async function getTVShowDetails(tvId) {
  try {
    const url = `${TMDB_API_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&append_to_response=credits,content_ratings`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    log(`Error getting TV show details (ID: ${tvId}): ${error.message}`);
    throw error;
  }
}

// Function to update a movie in our database
async function updateMovie(movie) {
  try {
    const headers = {};
    if (JWT_TOKEN) {
      headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }
    
    await axios.put(`${API_URL}/movies/${movie.showId}`, movie, { headers });
    log(`Successfully updated movie: ${movie.title} (ID: ${movie.showId})`);
    return true;
  } catch (error) {
    log(`Error updating movie "${movie.title}" (ID: ${movie.showId}): ${error.message}`);
    return false;
  }
}

// Main function to update all movies
async function updateAllMovieRecords() {
  try {
    log('Starting movie record update process...');
    
    // Create a backup first if the backup utility is available
    if (backupUtils) {
      try {
        log('Creating database backup before making any updates...');
        const backupPath = await backupUtils.createBackup();
        log(`✓ Backup created successfully at: ${backupPath}`);
        log('If anything goes wrong, you can restore from this backup using:');
        log(`node backup-and-restore.js restore ${path.basename(backupPath)}`);
        log('');
      } catch (backupError) {
        log(`WARNING: Failed to create backup: ${backupError.message}`);
        log('Continuing without backup. Press Ctrl+C now if you want to cancel the operation.');
        // Wait 5 seconds to give the user a chance to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } else {
      log('WARNING: Backup utility not available. Proceeding without backup.');
      log('If you want to create a backup first, run:');
      log('node backup-and-restore.js backup');
      log('');
      // Wait 5 seconds to give the user a chance to cancel
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Fetch all movies from our database
    const movies = await fetchAllMovies();
    log(`Found ${movies.length} total movies to check.`);
    
    // Count variables for tracking
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each movie
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      log(`[${i+1}/${movies.length}] Processing: ${movie.title} (ID: ${movie.showId})`);
      
      // Check if movie needs updating
      if (!needsUpdate(movie)) {
        log(`Skipping ${movie.title} - all fields are already populated.`);
        skippedCount++;
        continue;
      }
      
      try {
        // Determine the correct search type (movie or tv)
        const searchType = movie.type === 'TV Show' ? 'tv' : 'movie';
        
        // Search TMDB for the movie/TV show
        const searchResults = await searchTMDB(movie.title, searchType);
        
        // Wait to avoid rate limiting
        await sleep(THROTTLE_MS);
        
        if (!searchResults.results || searchResults.results.length === 0) {
          log(`No TMDB results found for "${movie.title}". Skipping.`);
          errorCount++;
          continue;
        }
        
        // Get the first result (most relevant)
        const result = searchResults.results[0];
        
        // Get detailed information based on type
        let updatedData = {};
        
        if ((searchType === 'tv' && 'name' in result) || 
            (searchType === 'movie' && 'title' in result)) {
          
          if (searchType === 'tv') {
            // It's a TV show - get detailed information
            const tvDetails = await getTVShowDetails(result.id);
            
            // Extract creator(s) as director(s)
            let directors = '';
            if (tvDetails.created_by && tvDetails.created_by.length > 0) {
              directors = tvDetails.created_by.map(creator => creator.name).join(', ');
            } else if (tvDetails.credits?.crew) {
              const directorsList = tvDetails.credits.crew
                .filter(person => person.job === 'Director' || person.job === 'Writer' || person.department === 'Writing')
                .map(person => person.name)
                .slice(0, 3);
              
              if (directorsList.length > 0) {
                directors = directorsList.join(', ');
              }
            }
            
            // Extract cast (take top 5)
            let cast = '';
            if (tvDetails.credits?.cast && tvDetails.credits.cast.length > 0) {
              cast = tvDetails.credits.cast
                .slice(0, 5)
                .map(actor => actor.name)
                .join(', ');
            }
            
            // Extract country information
            let country = '';
            if (tvDetails.origin_country && tvDetails.origin_country.length > 0) {
              country = tvDetails.origin_country.join(', ');
            } else if (tvDetails.production_countries && tvDetails.production_countries.length > 0) {
              country = tvDetails.production_countries.map(c => c.name).join(', ');
            }
            
            // Determine appropriate TV rating
            let rating = '';
            if (tvDetails.content_ratings && tvDetails.content_ratings.results) {
              const usRating = tvDetails.content_ratings.results.find(r => r.iso_3166_1 === 'US');
              if (usRating) {
                rating = usRating.rating;
              } else if (tvDetails.content_ratings.results.length > 0) {
                rating = tvDetails.content_ratings.results[0].rating;
              }
            }
            
            // Extract duration from episode runtimes
            let duration = '';
            if (tvDetails.episode_run_time && tvDetails.episode_run_time.length > 0) {
              duration = tvDetails.episode_run_time[0].toString();
            }
            
            // Prepare the updated data
            updatedData = {
              description: !movie.description ? tvDetails.overview : movie.description,
              director: !movie.director ? directors : movie.director,
              cast: !movie.cast ? cast : movie.cast,
              country: !movie.country ? country : movie.country,
              rating: !movie.rating ? mapTVRatingToOptions(rating) : movie.rating,
              duration: !movie.duration ? duration : movie.duration,
              posterUrl: !movie.posterUrl && tvDetails.poster_path ? 
                `${TMDB_POSTER_BASE_URL}${tvDetails.poster_path}` : movie.posterUrl
            };
            
          } else {
            // It's a movie - get detailed information
            const movieDetails = await getMovieDetails(result.id);
            
            // Extract director(s)
            let directors = '';
            if (movieDetails.credits?.crew) {
              const directorCrew = movieDetails.credits.crew
                .filter(person => person.job === 'Director')
                .map(person => person.name);
              
              if (directorCrew.length > 0) {
                directors = directorCrew.join(', ');
              }
            }
            
            // Extract cast (take top 5)
            let cast = '';
            if (movieDetails.credits?.cast && movieDetails.credits.cast.length > 0) {
              cast = movieDetails.credits.cast
                .slice(0, 5)
                .map(actor => actor.name)
                .join(', ');
            }
            
            // Extract country information
            let country = '';
            if (movieDetails.production_countries && movieDetails.production_countries.length > 0) {
              country = movieDetails.production_countries.map(c => c.name).join(', ');
            }
            
            // Extract rating information (certification)
            let rating = '';
            if (movieDetails.release_dates && movieDetails.release_dates.results) {
              const usRelease = movieDetails.release_dates.results.find(r => r.iso_3166_1 === 'US');
              if (usRelease && usRelease.release_dates && usRelease.release_dates.length > 0) {
                const certification = usRelease.release_dates.find(d => d.certification)?.certification;
                if (certification) {
                  rating = certification;
                }
              }
            }
            
            // Get duration in minutes
            let duration = '';
            if (movieDetails.runtime) {
              duration = movieDetails.runtime.toString();
            }
            
            // Prepare the updated data
            updatedData = {
              description: !movie.description ? movieDetails.overview : movie.description,
              director: !movie.director ? directors : movie.director,
              cast: !movie.cast ? cast : movie.cast,
              country: !movie.country ? country : movie.country,
              rating: !movie.rating ? rating : movie.rating,
              duration: !movie.duration ? duration : movie.duration,
              posterUrl: !movie.posterUrl && movieDetails.poster_path ? 
                `${TMDB_POSTER_BASE_URL}${movieDetails.poster_path}` : movie.posterUrl
            };
          }
          
          // Wait to avoid rate limiting
          await sleep(THROTTLE_MS);
          
          // Create the updated movie object with only the fields that need updating
          const updatedMovie = { ...movie };
          
          // Only update fields that were previously empty
          Object.keys(updatedData).forEach(key => {
            if (!movie[key] && updatedData[key]) {
              updatedMovie[key] = updatedData[key];
            }
          });
          
          // Log which fields were updated
          const updatedFields = Object.keys(updatedData).filter(key => updatedMovie[key] !== movie[key]);
          if (updatedFields.length > 0) {
            log(`Updating ${movie.title} with fields: ${updatedFields.join(', ')}`);
            
            // Update the movie in the database
            const success = await updateMovie(updatedMovie);
            if (success) {
              updatedCount++;
            } else {
              errorCount++;
            }
          } else {
            log(`No fields were updated for ${movie.title}`);
            skippedCount++;
          }
        } else {
          log(`Search result type mismatch for "${movie.title}". Skipping.`);
          errorCount++;
        }
      } catch (error) {
        log(`Error processing movie "${movie.title}": ${error.message}`);
        errorCount++;
      }
    }
    
    // Final summary
    log('\n====== SUMMARY ======');
    log(`Total movies processed: ${movies.length}`);
    log(`Movies updated: ${updatedCount}`);
    log(`Movies skipped (no updates needed): ${skippedCount}`);
    log(`Errors/failures: ${errorCount}`);
    log('=====================');
    
  } catch (error) {
    log(`Fatal error in update process: ${error.message}`);
  }
}

// Run the update process
updateAllMovieRecords().then(() => {
  log('Update process complete!');
}).catch((error) => {
  log(`Update process failed: ${error.message}`);
});
