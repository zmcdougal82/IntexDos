// TMDB API service for fetching movie and TV show data

// TMDB API base URL
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB API key - this should ideally be stored in an environment variable
// For now, we'll hardcode it for demonstration purposes
const TMDB_API_KEY = '56cfecfb2042af273b7c51099340b62e'; // TMDB API key

// Base URL for poster images
const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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

interface TMDBMovieDetails extends TMDBMovie {
  genres: { id: number; name: string }[];
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

interface TMDBTVShowDetails extends TMDBTVShow {
  genres: { id: number; name: string }[];
  created_by: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
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
 */
async function searchByTitle(query: string, type: 'movie' | 'tv' | 'multi' = 'multi'): Promise<TMDBSearchResult> {
  try {
    const response = await fetch(
      `${TMDB_API_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    
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
    const response = await fetch(
      `${TMDB_API_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    
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
    const response = await fetch(
      `${TMDB_API_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    
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
export const tmdbApi = {
  searchByTitle,
  getPosterUrl,
  getPosterUrlWithFallback,
  getMovieDetails,
  getTVShowDetails,
  mapGenreIdsToGenres,
  POSTER_BASE_URL: TMDB_POSTER_BASE_URL
};

export default tmdbApi;
