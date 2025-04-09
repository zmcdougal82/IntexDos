// OMDB API service for fetching movie and TV show data, including IMDB and Rotten Tomatoes ratings

// OMDB API base URL
const OMDB_API_BASE_URL = 'https://www.omdbapi.com/';

// OMDB API key - ideally should be stored in an environment variable
// Using the API key provided by the user
const OMDB_API_KEY = '41c50967'; // User's personal API key

interface OMDBRatings {
  Source: string;
  Value: string;
}

export interface OMDBMovieResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OMDBRatings[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
  Error?: string;
}

interface ExternalRatings {
  imdb: {
    rating: string;
    votes: string;
    id: string;
  } | null;
  rottenTomatoes: {
    rating: string;
  } | null;
  metacritic: {
    rating: string;
  } | null;
}

/**
 * Search for a movie by title and year to get detailed information including ratings
 * @param title The movie title
 * @param year Optional year to refine the search
 * @param isTV Whether this is a TV show or movie
 * @returns Movie information including external ratings
 */
async function getMovieByTitle(title: string, year?: number | string, isTV: boolean = false): Promise<OMDBMovieResponse | null> {
  try {
    // Create query parameters
    const type = isTV ? 'series' : 'movie';
    let params = `?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&type=${type}&plot=full`;
    
    if (year) {
      params += `&y=${year}`;
    }
    
    console.log(`Fetching movie data from: ${OMDB_API_BASE_URL}${params}`);
    
    // Make API request with CORS mode and additional options
    const response = await fetch(`${OMDB_API_BASE_URL}${params}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OMDB API error (${response.status}):`, errorText);
      throw new Error(`OMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the API returned an error or no results
    if (data.Response === "False" || data.Error) {
      console.warn(`OMDB API returned error for ${title}: ${data.Error}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching data from OMDB:', error);
    return null;
  }
}

/**
 * Extract external ratings from OMDB response
 * @param omdbData OMDB API response
 * @returns Object with IMDB, Rotten Tomatoes and Metacritic ratings
 */
function extractExternalRatings(omdbData: OMDBMovieResponse | null): ExternalRatings {
  const result: ExternalRatings = {
    imdb: null,
    rottenTomatoes: null,
    metacritic: null
  };
  
  if (!omdbData) return result;
  
  // Extract IMDB rating
  if (omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
    result.imdb = {
      rating: omdbData.imdbRating,
      votes: omdbData.imdbVotes || "N/A",
      id: omdbData.imdbID || "N/A"
    };
  }
  
  // Extract Rotten Tomatoes and Metacritic from Ratings array
  if (omdbData.Ratings && omdbData.Ratings.length > 0) {
    omdbData.Ratings.forEach(rating => {
      if (rating.Source === "Rotten Tomatoes" && rating.Value !== "N/A") {
        result.rottenTomatoes = {
          rating: rating.Value
        };
      }
      if (rating.Source === "Metacritic" && rating.Value !== "N/A") {
        result.metacritic = {
          rating: rating.Value
        };
      }
    });
  }
  
  // If Metacritic rating wasn't in Ratings array, try Metascore field
  if (!result.metacritic && omdbData.Metascore && omdbData.Metascore !== "N/A") {
    result.metacritic = {
      rating: `${omdbData.Metascore}/100`
    };
  }
  
  return result;
}

/**
 * Get external ratings for a movie or TV show
 * @param title Movie or TV show title
 * @param year Optional year to refine search
 * @param isTV Whether this is a TV show
 * @returns Object with IMDB, Rotten Tomatoes and Metacritic ratings
 */
async function getExternalRatings(title: string, year?: number | string, isTV: boolean = false): Promise<ExternalRatings> {
  try {
    // Clean up the title to improve search results
    // Remove any year in parentheses from the title
    const cleanTitle = title.replace(/\(\d{4}\)$/, '').trim();
    
    const omdbData = await getMovieByTitle(cleanTitle, year, isTV);
    return extractExternalRatings(omdbData);
  } catch (error) {
    console.error('Error getting external ratings:', error);
    return {
      imdb: null,
      rottenTomatoes: null,
      metacritic: null
    };
  }
}

export const omdbApi = {
  getMovieByTitle,
  getExternalRatings
};

export default omdbApi;
