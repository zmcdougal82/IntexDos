// Streaming API service for fetching streaming availability data using TMDB

// TMDB API base URL from existing tmdbApi service
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

// TMDB API key from environment variable
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Interface for Watch Provider
interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

// Interface for Watch Providers Response
interface WatchProvidersResponse {
  id: number;
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: WatchProvider[];
      rent?: WatchProvider[];
      buy?: WatchProvider[];
    };
  };
}

// Direct streaming service URL mappings
// Maps provider IDs to their direct URLs
const STREAMING_SERVICE_URLS: { [key: number]: string } = {
  // Subscription Services
  8: 'https://www.netflix.com/search?q=', // Netflix
  9: 'https://www.amazon.com/s?k=', // Amazon Prime
  337: 'https://www.disneyplus.com/search?q=', // Disney+
  350: 'https://www.appletv.com/search?q=', // Apple TV+
  1899: 'https://www.maxstreaming.com/search?q=', // Max
  15: 'https://hulu.com/search?q=', // Hulu
  531: 'https://www.peacocktv.com/search?q=', // Peacock
  283: 'https://www.crunchyroll.com/search?q=', // Crunchyroll
  386: 'https://www.paramountplus.com/search?q=', // Paramount+
  
  // Rental/Purchase Services
  10: 'https://www.amazon.com/s?k=', // Amazon
  2: 'https://store.apple.com/us/search?q=', // Apple iTunes
  3: 'https://play.google.com/store/search?q=', // Google Play
  7: 'https://www.vudu.com/content/movies/search?searchString=', // Vudu
  192: 'https://www.youtube.com/results?search_query=', // YouTube
  68: 'https://www.microsoft.com/en-us/search?q=' // Microsoft Store
};

// Interface for Streaming Service Info
export interface StreamingServiceInfo {
  providerId: number;
  providerName: string;
  logoUrl: string;
  streamingType: 'flatrate' | 'rent' | 'buy';
  link: string;
}

/**
 * Get the streaming availability for a movie or TV show from TMDB
 * @param tmdbId The TMDB ID of the movie or TV show
 * @param isTV Whether this is a TV show or movie
 * @param regionCode The region code to get providers for (default: 'US')
 * @returns Array of streaming services where the title is available
 */
async function getStreamingProviders(
  tmdbId: number,
  isTV: boolean = false,
  regionCode: string = 'US'
): Promise<StreamingServiceInfo[]> {
  try {
    const contentType = isTV ? 'tv' : 'movie';
    const url = `${TMDB_API_BASE_URL}/${contentType}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;
    
    console.log(`Fetching streaming providers for ${contentType} ID: ${tmdbId}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data: WatchProvidersResponse = await response.json();
    
    // Return empty array if no results for the specified region
    if (!data.results || !data.results[regionCode]) {
      console.log(`No streaming providers found for region ${regionCode}`);
      return [];
    }
    
    const providers: StreamingServiceInfo[] = [];
    const regionData = data.results[regionCode];
    const justWatchLink = regionData.link;
    
    // Get the movie or TV show title from the TMDB API
    let title = '';
    try {
      const { tmdbApi } = await import('./tmdbApi');
      if (isTV) {
        const tvDetails = await tmdbApi.getTVShowDetails(tmdbId);
        title = tvDetails.name;
      } else {
        const movieDetails = await tmdbApi.getMovieDetails(tmdbId);
        title = movieDetails.title;
      }
    } catch (error) {
      console.error('Error getting title for direct links:', error);
      // Continue with empty title if we can't get it
    }
    
    // Helper function to get the direct link for a provider
    const getDirectLink = (provider: WatchProvider): string => {
      if (STREAMING_SERVICE_URLS[provider.provider_id] && title) {
        // If we have a direct URL for this provider, use it with the title
        return `${STREAMING_SERVICE_URLS[provider.provider_id]}${encodeURIComponent(title)}`;
      }
      // Fallback to JustWatch link if no direct URL is available
      return justWatchLink;
    };
    
    // Process flatrate/subscription providers
    if (regionData.flatrate && regionData.flatrate.length > 0) {
      providers.push(
        ...regionData.flatrate.map(provider => ({
          providerId: provider.provider_id,
          providerName: provider.provider_name,
          logoUrl: `https://image.tmdb.org/t/p/original${provider.logo_path}`,
          streamingType: 'flatrate' as const,
          link: getDirectLink(provider)
        }))
      );
    }
    
    // Process rental providers
    if (regionData.rent && regionData.rent.length > 0) {
      providers.push(
        ...regionData.rent.map(provider => ({
          providerId: provider.provider_id,
          providerName: provider.provider_name,
          logoUrl: `https://image.tmdb.org/t/p/original${provider.logo_path}`,
          streamingType: 'rent' as const,
          link: getDirectLink(provider)
        }))
      );
    }
    
    // Process purchase providers
    if (regionData.buy && regionData.buy.length > 0) {
      providers.push(
        ...regionData.buy.map(provider => ({
          providerId: provider.provider_id,
          providerName: provider.provider_name,
          logoUrl: `https://image.tmdb.org/t/p/original${provider.logo_path}`,
          streamingType: 'buy' as const,
          link: getDirectLink(provider)
        }))
      );
    }
    
    // Sort by streaming type priority (subscription > rent > buy)
    // and then by display priority within each type
    return providers.sort((a, b) => {
      const typeOrder = { flatrate: 0, rent: 1, buy: 2 };
      if (a.streamingType !== b.streamingType) {
        return typeOrder[a.streamingType] - typeOrder[b.streamingType];
      }
      return 0; // Maintain original order within same type (already sorted by display_priority from TMDB)
    });
  } catch (error) {
    console.error('Error getting streaming providers:', error);
    return [];
  }
}

/**
 * Get streaming providers for a movie or TV show by title
 * @param title The title to search for
 * @param year Optional release year to refine the search
 * @param isTV Whether this is a TV show or movie
 * @param regionCode The region code to get providers for (default: 'US')
 * @returns Array of streaming services where the title is available
 */
async function getStreamingProvidersByTitle(
  title: string,
  year?: number | string,
  isTV: boolean = false,
  regionCode: string = 'US'
): Promise<StreamingServiceInfo[]> {
  try {
    // Import tmdbApi dynamically to avoid circular dependency
    const { tmdbApi } = await import('./tmdbApi');
    
    // First, find the TMDB ID for this title
    const tmdbId = await tmdbApi.findTMDBId(title, year, isTV);
    
    if (!tmdbId) {
      console.log(`Could not find TMDB ID for ${title}`);
      return [];
    }
    
    // Get streaming providers for this ID
    return await getStreamingProviders(tmdbId, isTV, regionCode);
  } catch (error) {
    console.error('Error getting streaming providers by title:', error);
    return [];
  }
}

export const streamingApi = {
  getStreamingProviders,
  getStreamingProvidersByTitle
};

export default streamingApi;
