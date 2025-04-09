// TMDB API service for fetching movie and TV show data

// Get base URL for the API (using our backend proxy in production)
export const getTmdbBaseUrl = () => {
  // For reference, keep the actual TMDB URL
  return 'https://api.themoviedb.org/3';
};

// Get the actual URL to use for requests
export const getTmdbRequestUrl = (endpoint: string) => {
  // For development environment
  if (window.location.hostname === 'localhost') {
    // Use the local CORS proxy in development
    const targetUrl = encodeURIComponent(`${getTmdbBaseUrl()}${endpoint}`);
    return `http://localhost:3001/proxy?url=${targetUrl}`;
  }
  
  // For production environments, use our backend proxy
  // This ensures the request works in Azure by letting the backend handle the API key
  // and avoiding CORS issues
  const apiBaseUrl = getApiUrl(); // Import this function from api.ts
  return `${apiBaseUrl}/proxy/tmdb/${endpoint.replace(/^\/?/, '')}`;
};

// Get the API base URL from api.ts
const getApiUrl = () => {
  // If we're running in local development, use the local proxy
  if (window.location.hostname === 'localhost') {
    return "http://localhost:3001/api";
  }
  
  // For production, use the environment variable if it exists
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Dynamically determine API URL for Azure
  const currentDomain = window.location.hostname;
  if (currentDomain.includes('azurewebsites.net')) {
    const apiDomain = currentDomain.replace('client', 'api').replace('-web', '-api');
    return `https://${apiDomain}/api`;
  }
  
  // Fallback
  return "https://moviesapp-api-fixed.azurewebsites.net/api";
};

const TMDB_API_BASE_URL = getTmdbBaseUrl();

// TMDB API key - not needed for most requests as the backend will handle this
// but keep for reference
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// For debugging
console.log("Using TMDB proxy through: ", getApiUrl());

// Base URL for poster images
export const getTmdbImageBaseUrl = () => {
  // For development, use proxy
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3001/proxy?url=' + encodeURIComponent('https://image.tmdb.org/t/p/w500');
  }
  
  // For production environments, images can be accessed directly
  // TMDB doesn't have CORS restrictions on their image server
  return 'https://image.tmdb.org/t/p/w500';
};

const TMDB_POSTER_BASE_URL = getTmdbImageBaseUrl();

console.log('Using TMDB Image URL:', TMDB_POSTER_BASE_URL);

console.log('Using TMDB API URL:', TMDB_API_BASE_URL);

// Types
interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  overview: string;
  genre_ids?: number[];
}

interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  overview: string;
  genre_ids?: number[];
}

interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

interface TMDBVideosResponse {
  id: number;
  results: TMDBVideo[];
}

interface TMDBMovieDetails extends TMDBMovie {
  genres: { id: number; name: string }[];
  runtime?: number; // Movie duration in minutes
  production_countries?: { iso_3166_1: string; name: string }[];
  release_dates?: {
    results: {
      iso_3166_1: string;
      release_dates: {
        certification: string;
        type: number;
      }[];
    }[];
  };
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
  videos?: TMDBVideosResponse;
}

interface TMDBTVShowDetails extends TMDBTVShow {
  genres: { id: number; name: string }[];
  created_by: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
  origin_country?: string[];
  production_countries?: { iso_3166_1: string; name: string }[];
  episode_run_time?: number[];
  content_ratings?: {
    results: {
      iso_3166_1: string;
      rating: string;
    }[];
  };
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
}

interface TMDBSearchResult {
  results: (TMDBMovie | TMDBTVShow)[];
  total_results: number;
  total_pages: number;
  page: number;
}

// Common genre IDs mapping to our application genres
// TMDB genre IDs: https://developers.themoviedb.org/3/genres/get-movie-list
// Movie genres
const TMDB_GENRE_MAPPING: {[key: number]: string} = {
  28: "Action",           // Action
  12: "Adventure",        // Adventure
  16: "FamilyMovies",     // Animation
  35: "Comedies",         // Comedy
  80: "CrimeTVShowsDocuseries", // Crime
  99: "Documentaries",    // Documentary
  18: "Dramas",           // Drama
  10751: "FamilyMovies",  // Family
  14: "Fantasy",          // Fantasy
  36: "Dramas",           // History
  27: "HorrorMovies",     // Horror
  10402: "Musicals",      // Music
  9648: "Thrillers",      // Mystery
  10749: "DramasRomanticMovies", // Romance
  878: "Fantasy",         // Science Fiction
  10770: "Dramas",        // TV Movie
  53: "Thrillers",        // Thriller
  10752: "Action",        // War
  37: "Action",           // Western
  
  // TV genres
  10759: "TVAction",      // Action & Adventure
  10762: "KidsTV",        // Kids
  10763: "NatureTV",      // News
  10764: "RealityTV",     // Reality
  10765: "Fantasy",       // Sci-Fi & Fantasy
  10766: "TVDramas",      // Soap
  10767: "TalkShowsTVComedies", // Talk
  10768: "TVDramas"       // War & Politics
};

/**
 * Search for a movie or TV show by title
 * @param query The search query (title)
 * @param type Optional type filter ('movie' or 'tv')
 * @param page Optional page number for pagination (default: 1)
 */
async function searchByTitle(query: string, type: 'movie' | 'tv' | 'multi' = 'multi', page: number = 1): Promise<TMDBSearchResult> {
  try {
    // Remove the API key from the endpoint - our backend will add it
    const endpoint = `/search/${type}?query=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(getTmdbRequestUrl(endpoint));
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching TMDB:', error);
    return { results: [], total_results: 0, total_pages: 0, page: 1 };
  }
}

/**
 * Get detailed information about a specific movie
 * @param movieId The TMDB movie ID
 */
async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  try {
    // Remove the API key as the backend will add it
    const endpoint = `/movie/${movieId}?append_to_response=credits,videos`;
    const response = await fetch(getTmdbRequestUrl(endpoint));
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting movie details from TMDB:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific TV show
 * @param tvId The TMDB TV show ID
 */
async function getTVShowDetails(tvId: number): Promise<TMDBTVShowDetails> {
  try {
    // Remove the API key
    const endpoint = `/tv/${tvId}?append_to_response=credits,videos`;
    const response = await fetch(getTmdbRequestUrl(endpoint));
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting TV show details from TMDB:', error);
    throw error;
  }
}

/**
 * Map TMDB genres to our application genres
 * @param genreIds Array of TMDB genre IDs
 */
function mapGenreIdsToGenres(genreIds: number[]): {[key: string]: number} {
  const genres: {[key: string]: number} = {};
  
  genreIds.forEach(id => {
    const mappedGenre = TMDB_GENRE_MAPPING[id];
    if (mappedGenre) {
      genres[mappedGenre] = 1;
    }
  });
  
  // Default to Drama if no genres are mapped
  if (Object.keys(genres).length === 0) {
    genres["Dramas"] = 1;
  }
  
  return genres;
}

/**
 * Get a poster URL for a movie or TV show
 * @param title The title to search for
 * @param year Optional release year to refine the search
 * @param isTV Whether this is a TV show (true) or movie (false)
 */
async function getPosterUrl(title: string, year?: number, isTV: boolean = false): Promise<string | null> {
  try {
    // Search for the movie or TV show
    const type = isTV ? 'tv' : 'movie';
    const searchResults = await searchByTitle(title, type);
    
    // If no results found, return null
    if (!searchResults.results || searchResults.results.length === 0) {
      return null;
    }
    
    // Find the best match based on title and year if provided
    let bestMatch = searchResults.results[0];
    
    if (year && searchResults.results.length > 1) {
      // Try to find a better match using the year
      const matchByYear = searchResults.results.find((result: any) => {
        const resultYear = isTV
          ? new Date((result as TMDBTVShow).first_air_date).getFullYear()
          : new Date((result as TMDBMovie).release_date).getFullYear();
        
        return resultYear === year;
      });
      
      if (matchByYear) {
        bestMatch = matchByYear;
      }
    }
    
    // If no poster found, return null
    if (!bestMatch.poster_path) {
      return null;
    }
    
    // Return the poster URL
    return `${TMDB_POSTER_BASE_URL}${bestMatch.poster_path}`;
  } catch (error) {
    console.error('Error getting poster from TMDB:', error);
    return null;
  }
}

/**
 * Utility function to get a poster URL or fallback image
 * @param title The title to search for
 * @param year Optional release year
 * @param isTV Whether this is a TV show
 * @param fallbackUrl A fallback URL if no poster is found
 */
async function getPosterUrlWithFallback(
  title: string,
  year?: number,
  isTV: boolean = false,
  fallbackUrl: string = "https://via.placeholder.com/300x450?text=No+Image"
): Promise<string> {
  const posterUrl = await getPosterUrl(title, year, isTV);
  return posterUrl || fallbackUrl;
}

// Export the API functions
/**
 * Search for a movie in TMDB by title and year
 * @param title The movie title to search for
 * @param year Optional release year to refine the search
 * @param isTV Whether this is a TV show or movie
 * @returns A TMDB movie or TV ID if found, null otherwise
 */
async function findTMDBId(title: string, year?: number | string, isTV: boolean = false): Promise<number | null> {
  try {
    // Search for the movie or TV show
    const type = isTV ? 'tv' : 'movie';
    const searchResults = await searchByTitle(title, type);
    
    // If no results found, return null
    if (!searchResults.results || searchResults.results.length === 0) {
      console.log(`No TMDB results found for ${title}`);
      return null;
    }
    
    // Find the best match based on title and year if provided
    let bestMatch = searchResults.results[0];
    
    if (year && searchResults.results.length > 1) {
      // Parse year if it's a string
      const yearNum = typeof year === 'string' ? parseInt(year) : year;
      
      // Try to find a better match using the year
      const matchByYear = searchResults.results.find((result: any) => {
        const resultYear = isTV
          ? new Date((result as TMDBTVShow).first_air_date).getFullYear()
          : new Date((result as TMDBMovie).release_date).getFullYear();
        
        return resultYear === yearNum;
      });
      
      if (matchByYear) {
        bestMatch = matchByYear;
      }
    }
    
    // Return the TMDB ID of the best match
    return bestMatch.id;
  } catch (error) {
    console.error('Error finding TMDB ID:', error);
    return null;
  }
}

/**
 * Get full cast and crew information for a movie or TV show
 * @param title The title to search for
 * @param year Optional release year to refine the search
 * @param isTV Whether this is a TV show or movie
 * @returns Credits information or null if not found
 */
async function getCredits(title: string, year?: number | string, isTV: boolean = false): Promise<{
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }[];
} | null> {
  try {
    // First, find the TMDB ID for this title
    const tmdbId = await findTMDBId(title, year, isTV);
    
    if (!tmdbId) {
      console.log(`Could not find TMDB ID for ${title}`);
      return null;
    }
    
    // Fetch the details with credits
    const details = isTV 
      ? await getTVShowDetails(tmdbId)
      : await getMovieDetails(tmdbId);
    
    if (!details?.credits) {
      console.log(`No credits found for ${title}`);
      return null;
    }
    
    return details.credits;
  } catch (error) {
    console.error('Error getting credits from TMDB:', error);
    return null;
  }
}

/**
 * Get the profile image URL for a person
 * @param profilePath The profile path from TMDB
 * @returns Full URL to the profile image or null if not available
 */
function getProfileImageUrl(profilePath: string | null): string | null {
  if (!profilePath) return null;
  return `${TMDB_POSTER_BASE_URL}${profilePath}`;
}

/**
 * Get the directors for a movie or TV show
 * @param title The title to search for
 * @param year Optional release year to refine the search
 * @param isTV Whether this is a TV show or movie
 * @returns Array of directors with name and profile image URL
 */
async function getDirectors(title: string, year?: number | string, isTV: boolean = false): Promise<{
  name: string;
  profileUrl: string | null;
  job: string;
}[]> {
  try {
    const credits = await getCredits(title, year, isTV);
    
    if (!credits) return [];
    
    // For movies, directors have the job title "Director"
    // For TV shows, look for "Creator" or "Executive Producer"
    const directors = credits.crew.filter(person => {
      if (isTV) {
        return person.job === "Creator" || 
               person.job === "Executive Producer" || 
               person.job === "Series Director";
      } else {
        return person.job === "Director";
      }
    });
    
    return directors.map(director => ({
      name: director.name,
      profileUrl: getProfileImageUrl(director.profile_path),
      job: director.job
    }));
  } catch (error) {
    console.error('Error getting directors from TMDB:', error);
    return [];
  }
}

/**
 * Get the main cast for a movie or TV show
 * @param title The title to search for
 * @param year Optional release year to refine the search
 * @param isTV Whether this is a TV show or movie
 * @param limit Optional limit on the number of cast members to return (default: 10)
 * @returns Array of cast members with name, character and profile image URL
 */
async function getCast(title: string, year?: number | string, isTV: boolean = false, limit: number = 10): Promise<{
  name: string;
  character: string;
  profileUrl: string | null;
}[]> {
  try {
    const credits = await getCredits(title, year, isTV);
    
    if (!credits) return [];
    
    // Get cast members sorted by their order (main cast first)
    const sortedCast = [...credits.cast]
      .sort((a, b) => a.order - b.order)
      .slice(0, limit);
    
    return sortedCast.map(actor => ({
      name: actor.name,
      character: actor.character,
      profileUrl: getProfileImageUrl(actor.profile_path)
    }));
  } catch (error) {
    console.error('Error getting cast from TMDB:', error);
    return [];
  }
}

/**
 * Get trailer videos for a movie or TV show
 * @param title The title to search for
 * @param year Optional release year to refine the search
 * @param isTV Whether this is a TV show or movie
 * @returns Object with trailer info or null if not found
 */
async function getTrailer(title: string, year?: number | string, isTV: boolean = false): Promise<{
  key: string;
  name: string;
  site: string;
} | null> {
  try {
    // First, find the TMDB ID for this title
    const tmdbId = await findTMDBId(title, year, isTV);
    
    if (!tmdbId) {
      console.log(`Could not find TMDB ID for ${title}`);
      return null;
    }
    
    // Fetch videos directly
    // Remove the API key
    const endpoint = `/${isTV ? 'tv' : 'movie'}/${tmdbId}/videos`;
    const response = await fetch(getTmdbRequestUrl(endpoint));
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data: TMDBVideosResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`No videos found for ${title}`);
      return null;
    }
    
    // Try to find an official trailer
    let trailer = data.results.find(
      video => video.type === 'Trailer' && video.official && video.site === 'YouTube'
    );
    
    // If no official trailer, try any trailer
    if (!trailer) {
      trailer = data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    }
    
    // If still no trailer, just use the first video
    if (!trailer) {
      trailer = data.results.find(video => video.site === 'YouTube');
    }
    
    if (!trailer) {
      console.log(`No suitable videos found for ${title}`);
      return null;
    }
    
    return {
      key: trailer.key,
      name: trailer.name,
      site: trailer.site
    };
  } catch (error) {
    console.error('Error getting trailer from TMDB:', error);
    return null;
  }
}

export const tmdbApi = {
  searchByTitle,
  getPosterUrl,
  getPosterUrlWithFallback,
  getMovieDetails,
  getTVShowDetails,
  mapGenreIdsToGenres,
  findTMDBId,
  getCredits,
  getDirectors,
  getCast,
  getProfileImageUrl,
  getTrailer,
  POSTER_BASE_URL: TMDB_POSTER_BASE_URL
};

export default tmdbApi;
