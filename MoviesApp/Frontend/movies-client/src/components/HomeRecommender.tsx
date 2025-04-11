import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import { movieApi, Movie } from "../services/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface HomeRecommender {
  userId: string | null; // Accept userId as string or null
}

// Get recommendation API URL based on environment
const getRecommendationApiUrl = () => {
  // If running in production (like Azure static website)
  if (window.location.hostname !== "localhost") {
    return "https://moviesapp-recommendation-service.azurewebsites.net";
  }
  // If running locally
  return "http://localhost:8001";
};

const RECOMMENDATION_API_URL = getRecommendationApiUrl();

interface RecommendationData {
  collaborative: string[];
  contentBased: string[];
  genres: Record<string, string[]>;
}

// Arrow Button Component for navigation
const NavigationArrow = ({ 
  direction, 
  onClick, 
  disabled 
}: { 
  direction: 'left' | 'right'; 
  onClick: () => void; 
  disabled: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        width: '40px',
        height: '40px',
        backgroundColor: disabled ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: 'none',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        ...(direction === 'left' ? { left: '0' } : { right: '0' })
      }}
    >
      {direction === 'left' ? '←' : '→'}
    </button>
  );
};

interface RecommendationSectionProps { 
  title: string; 
  movies: Movie[]; 
  sectionType: string;
  userId: string | null;
  onMovieClick: (id: string) => void;
  onLoadMore?: (sectionType: string, page: number) => Promise<Movie[]>;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({ 
  title, 
  movies, 
  sectionType,
  userId,
  onMovieClick,
  onLoadMore
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadedPages, setLoadedPages] = useState<number[]>([0]);
  const [allMovies, setAllMovies] = useState<Movie[]>(movies);
  const [isLoading, setIsLoading] = useState(false);
  const [transitionActive, setTransitionActive] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [allImagesLoaded, setAllImagesLoaded] = useState<boolean>(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Transition duration in ms
  const TRANSITION_DURATION = 300;
  const moviesPerPage = 5;
  
  // Track image loading for each movie
  const preloadImage = (movie: Movie) => {
    if (movie.posterUrl && !imagesLoaded[movie.showId]) {
      const img = new Image();
      img.onload = () => {
        setImagesLoaded(prev => ({...prev, [movie.showId]: true}));
      };
      img.onerror = () => {
        // Even on error, mark as loaded to avoid retrying indefinitely
        setImagesLoaded(prev => ({...prev, [movie.showId]: true}));
      };
      img.src = movie.posterUrl;
      return false;
    }
    return true;
  };
  
  // Update allMovies when movies prop changes
  useEffect(() => {
    setAllMovies(movies);
    
    // Preload the initial images and mark loading state
    if (movies.length > 0) {
      setAllImagesLoaded(false);
      const preloadPromises = movies.map(movie => preloadImage(movie));
      
      // Check if all images are already loaded
      if (preloadPromises.every(loaded => loaded)) {
        setAllImagesLoaded(true);
      }
    }
  }, [movies]);
  
  // Check if all currently visible movies' images are loaded
  useEffect(() => {
    const currentMovies = getCurrentPageMovies(currentPage);
    const allLoaded = currentMovies.every(movie => 
      !movie.posterUrl || imagesLoaded[movie.showId]
    );
    
    if (allLoaded && !allImagesLoaded) {
      setAllImagesLoaded(true);
    }
  }, [imagesLoaded, currentPage]);
  
  // Calculate the total number of pages
  const totalPages = Math.max(Math.ceil(allMovies.length / moviesPerPage), loadedPages.length + 1);
  
  // Preload the adjacent pages
  useEffect(() => {
    const preloadAdjacentPages = async () => {
      // Try to preload both next and previous pages
      const pagesToPreload = [currentPage + 1, currentPage - 1].filter(
        page => page >= 0 && page < totalPages + 1 && !loadedPages.includes(page)
      );
      
      for (const pageToPreload of pagesToPreload) {
        if (onLoadMore && userId && !isLoading) {
          try {
            // Preload page data
            const newMovies = await onLoadMore(sectionType, pageToPreload);
            
            // Add the new movies to our collection
            if (newMovies && newMovies.length > 0) {
              setAllMovies(prevMovies => {
                // Filter out any duplicates
                const existingIds = new Set(prevMovies.map(m => m.showId));
                const uniqueNewMovies = newMovies.filter(m => !existingIds.has(m.showId));
                return [...prevMovies, ...uniqueNewMovies];
              });
              
              // Preload the images immediately
              newMovies.forEach(movie => preloadImage(movie));
            }
            
            // Mark this page as loaded
            setLoadedPages(prev => [...prev, pageToPreload]);
          } catch (err) {
            console.error(`Error preloading page ${pageToPreload} for ${sectionType}:`, err);
          }
        }
      }
    };
    
    preloadAdjacentPages();
  }, [currentPage, loadedPages, totalPages, onLoadMore, userId, sectionType, isLoading, imagesLoaded]);
  
  // Get the current and next visible movies
  const getCurrentPageMovies = (page: number) => {
    return allMovies.slice(
      page * moviesPerPage, 
      (page + 1) * moviesPerPage
    );
  };
  
  const visibleMovies = getCurrentPageMovies(currentPage);
  
  if (allMovies.length === 0) return null;
  
  const scrollPrev = () => {
    if (currentPage > 0 && !transitionActive) {
      setTransitionActive(true);
      setTransitionDirection('left');
      
      // Set the target page
      const targetPage = currentPage - 1;
      setNextPage(targetPage);
      
      // Using setTimeout to allow the animation to play
      setTimeout(() => {
        setCurrentPage(targetPage);
        setNextPage(null);
        setTransitionActive(false);
        setTransitionDirection(null);
      }, TRANSITION_DURATION);
    }
  };
  
  const scrollNext = async () => {
    if (currentPage < totalPages - 1 && !transitionActive && !isLoading) {
      setTransitionActive(true);
      setTransitionDirection('right');
      
      // Check if we need to load more data
      const targetPage = currentPage + 1;
      setNextPage(targetPage);
      
      if (!loadedPages.includes(targetPage) && onLoadMore && userId) {
        setIsLoading(true);
        try {
          const newMovies = await onLoadMore(sectionType, targetPage);
          
          // Add the new movies to our collection
          if (newMovies && newMovies.length > 0) {
            setAllMovies(prevMovies => {
              // Filter out any duplicates
              const existingIds = new Set(prevMovies.map(m => m.showId));
              const uniqueNewMovies = newMovies.filter(m => !existingIds.has(m.showId));
              return [...prevMovies, ...uniqueNewMovies];
            });
            
            // Preload images with the enhanced preloader
            newMovies.forEach(movie => preloadImage(movie));
          }
          
          // Mark this page as loaded
          setLoadedPages(prev => [...prev, targetPage]);
        } catch (err) {
          console.error(`Error loading more ${sectionType} recommendations:`, err);
        } finally {
          setIsLoading(false);
        }
      }
      
      // Using setTimeout to allow the animation to complete
      setTimeout(() => {
        setCurrentPage(targetPage);
        setNextPage(null);
        setTransitionActive(false);
        setTransitionDirection(null);
      }, TRANSITION_DURATION);
    }
  };

  const containerStyles = {
    position: "relative" as const,
    paddingBottom: "1rem",
    paddingLeft: "40px",
    paddingRight: "40px",
    overflow: "hidden",
    height: "395px", // Fixed height to prevent layout shifts
    backgroundColor: "transparent" // Ensure no background color
  };

  // This styling approach provides a cleaner and more consistent transition
  const pageStyles = (isVisible: boolean, direction: number) => ({
    display: "flex",
    gap: "1.5rem",
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    justifyContent: "center",
    visibility: isVisible ? "visible" as const : "hidden" as const,
    opacity: isVisible ? 1 : 0,
    transform: `translateX(${direction}%)`,
    transition: transitionActive 
      ? `opacity ${TRANSITION_DURATION}ms ease-out, transform ${TRANSITION_DURATION}ms ease-out` 
      : "none",
    willChange: "opacity, transform", // Performance optimization
    zIndex: isVisible ? 2 : 1
  });

  // Calculate direction and offset for each page
  const getCurrentPageTransform = () => {
    if (!transitionActive) return 0;
    return transitionDirection === 'right' ? -100 : 100;
  };

  const getNextPageTransform = () => {
    if (!transitionActive) return transitionDirection === 'right' ? 100 : -100;
    return 0;
  };

  // This approach ensures we always preload the next possible page direction
  const prevPageMovies = currentPage > 0 ? getCurrentPageMovies(currentPage - 1) : [];
  const nextForwardMovies = currentPage < totalPages - 1 ? getCurrentPageMovies(currentPage + 1) : [];
  
  // Determine which page to show as the "next" page during transition
  const targetPageMovies = nextPage !== null 
    ? getCurrentPageMovies(nextPage) 
    : (transitionDirection === 'right' ? nextForwardMovies : prevPageMovies);

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <h3 style={{ 
        marginBottom: "1rem", 
        fontSize: "1.5rem",
        fontWeight: 600,
        color: "var(--color-primary)"
      }}>
        {title}
      </h3>
      <div style={{ position: 'relative' }}>
        <NavigationArrow 
          direction="left" 
          onClick={scrollPrev} 
          disabled={currentPage === 0 || transitionActive} 
        />
        
        <div
          ref={containerRef}
          style={containerStyles}
        >
          {/* Loading overlay that shows until all images are loaded */}
          {!allImagesLoaded && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 10
            }}>
              <div>Loading movies...</div>
            </div>
          )}
          
          {/* Current page content - always rendered */}
          <div style={pageStyles(!transitionActive, getCurrentPageTransform())}>
            {visibleMovies.map((movie) => (
              <div key={movie.showId} style={{ 
                flexShrink: 0, 
                width: "200px",
                opacity: imagesLoaded[movie.showId] ? 1 : 0,
                transition: 'opacity 0.3s ease-in'
              }}>
                <MovieCard
                  movie={movie}
                  onClick={() => onMovieClick(movie.showId)}
                />
              </div>
            ))}
          </div>
          
          {/* Target page content - shown during transition */}
          <div style={pageStyles(transitionActive, getNextPageTransform())}>
            {targetPageMovies.map((movie) => (
              <div key={movie.showId} style={{ 
                flexShrink: 0, 
                width: "200px",
                opacity: imagesLoaded[movie.showId] ? 1 : 0,
                transition: 'opacity 0.3s ease-in'
              }}>
                <MovieCard
                  movie={movie}
                  onClick={() => onMovieClick(movie.showId)}
                />
              </div>
            ))}
          </div>
        </div>
        
        <NavigationArrow 
          direction="right" 
          onClick={scrollNext} 
          disabled={currentPage >= totalPages - 1 || transitionActive || isLoading} 
        />
      </div>
    </div>
  );
};

const HomeRecommender: React.FC<HomeRecommender> = ({ userId }) => {
  const [collaborativeMovies, setCollaborativeMovies] = useState<Movie[]>([]);
  const [contentBasedMovies, setContentBasedMovies] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate(); // Get the navigate function

  // Format genre name for display
  const formatGenreName = (genreKey: string): string => {
    // Replace camelCase with spaces and capitalize
    const formatted = genreKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    
    // Special case handling
    if (formatted === "Comedies") return "Comedy";
    if (formatted === "Dramas") return "Drama";
    if (formatted === "Horror Movies") return "Horror";
    if (formatted === "Family Movies") return "Family";
    
    return formatted;
  };

  // The backend now provides at least 20 recommendations per section

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setError("User ID is required.");
        return;
      }

      setLoading(true);
      setError(null); // Reset error state before fetching

      try {
        // Try to fetch from recommendation API first
        let recommendationsData: RecommendationData | null = null;
        
        try {
          // Fetch from our new recommendation API
          const apiResponse = await axios.get(`${RECOMMENDATION_API_URL}/recommendations/${userId}`);
          recommendationsData = apiResponse.data;
          console.log("Recommendation API response:", recommendationsData);
          
        } catch (apiErr) {
          console.warn("Could not fetch from recommendation API, falling back to static file:", apiErr);
          
          // Fallback to the static file if API is not available
          const fallbackResponse = await fetch("/homeRecommendations.json");
          if (!fallbackResponse.ok) {
            throw new Error("Failed to fetch recommendations JSON.");
          }
          
          const staticData = await fallbackResponse.json();
          if (!staticData[userId]) {
            throw new Error("No recommendations found for this user.");
          }
          
          // Convert the old format to the new format
          recommendationsData = {
            collaborative: staticData[userId],
            contentBased: [],
            genres: {}
          };
        }
        
        if (!recommendationsData) {
          throw new Error("No recommendations data available.");
        }

// Process collaborative filtering recommendations
if (recommendationsData.collaborative && recommendationsData.collaborative.length > 0) {
  const movieResponses = await Promise.all(
    recommendationsData.collaborative.map(async (id) => {
      try {
        // Ensure we're using database-style IDs (s1, s2, etc.)
        // If the ID is already in the correct format, use it directly
        const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
        
        // Try to get from main API using database-style ID
        const movieResponse = await movieApi.getById(dbStyleId);
        
        // Verify the movie data is valid and has essential properties
        if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
          return movieResponse.data;
        } else {
          console.warn(`Movie ${id} data is incomplete - skipping this recommendation`);
          return null;
        }
      } catch (err) {
        console.warn(`Failed to fetch movie ${id} from main API - skipping this recommendation`);
        return null; // Return null to filter it out later
      }
    })
  );

  // Filter out any null or invalid movies
  const validMovies = movieResponses.filter(movie => 
    movie !== null && 
    movie !== undefined && 
    movie.showId && 
    movie.title
  ) as Movie[];
  
  setCollaborativeMovies(validMovies);
  console.log(`Filtered collaborative recommendations: ${validMovies.length} valid out of ${movieResponses.length} total`);
}

// Process content-based recommendations
if (recommendationsData.contentBased && recommendationsData.contentBased.length > 0) {
  const movieResponses = await Promise.all(
    recommendationsData.contentBased.map(async (id) => {
      try {
        // Ensure we're using database-style IDs (s1, s2, etc.)
        // If the ID is already in the correct format, use it directly
        const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
        
        // Try to get from main API using database-style ID
        const movieResponse = await movieApi.getById(dbStyleId);
        
        // Verify the movie data is valid and has essential properties
        if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
          return movieResponse.data;
        } else {
          console.warn(`Movie ${id} data is incomplete - skipping this recommendation`);
          return null;
        }
      } catch (err) {
        console.warn(`Failed to fetch movie ${id} from main API - skipping this recommendation`);
        return null; // Return null to filter it out later
      }
    })
  );

  // Filter out any null or invalid movies
  const validMovies = movieResponses.filter(movie => 
    movie !== null && 
    movie !== undefined && 
    movie.showId && 
    movie.title
  ) as Movie[];
  
  setContentBasedMovies(validMovies);
  console.log(`Filtered content-based recommendations: ${validMovies.length} valid out of ${movieResponses.length} total`);
}
        
// Process genre-based recommendations
if (recommendationsData.genres) {
  const genreResults: Record<string, Movie[]> = {};

  for (const [genre, movieIds] of Object.entries(recommendationsData.genres)) {
    if (movieIds.length > 0) {
      const movieResponses = await Promise.all(
        movieIds.map(async (id) => {
          try {
            // Ensure we're using database-style IDs (s1, s2, etc.)
            // If the ID is already in the correct format, use it directly
            const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
            
            // Try to get from main API using database-style ID
            const movieResponse = await movieApi.getById(dbStyleId);
            
            // Verify the movie data is valid and has essential properties
            if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
              return movieResponse.data;
            } else {
              console.warn(`Movie ${id} data is incomplete - skipping this recommendation`);
              return null;
            }
          } catch (err) {
            console.warn(`Failed to fetch movie ${id} from main API - skipping this recommendation`);
            // Skip this movie if it's not in the database
            return null;
          }
        })
      );

      // Filter out any null or invalid movies
      const validMovies = movieResponses.filter(movie => 
        movie !== null && 
        movie !== undefined && 
        movie.showId && 
        movie.title
      ) as Movie[];
      
      // Only add genres that have valid movies after filtering
      if (validMovies.length > 0) {
        genreResults[genre] = validMovies;
        console.log(`Filtered ${genre} recommendations: ${validMovies.length} valid out of ${movieResponses.length} total`);
      } else {
        console.log(`Skipping ${genre} recommendations as no valid movies were found`);
      }
    }
  }

  setGenreMovies(genreResults);
}

        setLoading(false);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to fetch recommendations.");
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  const handleMovieClick = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

  if (loading) {
    return <div style={{ padding: "2rem 0", textAlign: "center" }}>Loading your personalized recommendations...</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem 0", color: "var(--color-error)" }}>{error}</div>;
  }

  // Check if we have any recommendations to display
  const hasRecommendations = 
    collaborativeMovies.length > 0 || 
    contentBasedMovies.length > 0 || 
    Object.values(genreMovies).some(movies => movies.length > 0);

  if (!hasRecommendations) {
    return (
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        <p>No personalized recommendations available yet. Try rating more movies!</p>
      </div>
    );
  }

// Function to load more recommendations
const loadMoreRecommendations = async (section: string, page: number): Promise<Movie[]> => {
  if (!userId) return [];
  
  try {
    // Calculate the correct API parameters
    const limit = 10; // Number of new recommendations to fetch
    
    // Call the API to get more recommendations
    console.log(`Loading more for section: ${section}, page: ${page}, limit: ${limit}`);
    const response = await axios.get(
      `${RECOMMENDATION_API_URL}/recommendations/${userId}/more`, 
      { params: { section, page, limit } }
    );
    
    // Log the full response for debugging
    console.log(`API Response for ${section}:`, response.data);
    
    // Extract the relevant section from the response
    let movieIds: string[] = [];
    if (section === 'collaborative' && response.data.collaborative) {
      console.log('Found collaborative data:', response.data.collaborative);
      movieIds = response.data.collaborative;
    } else if (section === 'contentBased' && response.data.contentBased) {
      console.log('Found contentBased data:', response.data.contentBased);
      movieIds = response.data.contentBased;
    } else if (response.data.genres && response.data.genres[section]) {
      console.log(`Found genre data for ${section}:`, response.data.genres[section]);
      movieIds = response.data.genres[section];
    } else {
      console.warn(`No matching data found for section: ${section} in response:`, response.data);
    }
    
    if (!movieIds.length) return [];
    
    // Fetch the movie details for each ID
    const movies = await Promise.all(
      movieIds.map(async (id) => {
        try {
          const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
          const movieResponse = await movieApi.getById(dbStyleId);
          
          // Verify the movie data is valid and has essential properties
          if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
            return movieResponse.data;
          } else {
            console.warn(`Movie ${id} data is incomplete when loading more - skipping`);
            return null;
          }
        } catch (err) {
          console.warn(`Failed to fetch movie ${id} from main API:`, err);
          // Skip this movie since it's not in the database
          return null;
        }
      })
    );
    
    // Apply more rigorous filtering to ensure only valid movies are included
    const validMovies = movies.filter(movie => 
      movie !== null && 
      movie !== undefined && 
      movie.showId && 
      movie.title
    ) as Movie[];
    
    console.log(`Loaded more ${section} recommendations: ${validMovies.length} valid out of ${movies.length} total`);
    return validMovies;
    } catch (err) {
      console.error(`Error loading more recommendations for section ${section}:`, err);
      return [];
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2
        style={{
          marginBottom: "2rem",
          paddingTop: "1.0rem",
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--color-primary)"
        }}
      >
        Your Personalized Recommendations
      </h2>
      
      {/* Collaborative filtering recommendations */}
      {collaborativeMovies.length > 0 && (
        <RecommendationSection 
          title="Movies Similar Users Enjoyed"
          movies={collaborativeMovies}
          sectionType="collaborative"
          userId={userId}
          onMovieClick={handleMovieClick}
          onLoadMore={loadMoreRecommendations}
        />
      )}
      
      {/* Content-based recommendations */}
      {contentBasedMovies.length > 0 && (
        <RecommendationSection 
          title="Based on Your Taste"
          movies={contentBasedMovies}
          sectionType="contentBased"
          userId={userId}
          onMovieClick={handleMovieClick}
          onLoadMore={loadMoreRecommendations}
        />
      )}
      
      {/* Genre-based recommendations */}
      {Object.entries(genreMovies).map(([genre, movies]) => (
        movies.length > 0 && (
          <RecommendationSection 
            key={genre}
            title={`Recommended in ${formatGenreName(genre)}`}
            movies={movies}
            sectionType={genre}
            userId={userId}
            onMovieClick={handleMovieClick}
            onLoadMore={loadMoreRecommendations}
          />
        )
      ))}
    </div>
  );
};

export default HomeRecommender;
