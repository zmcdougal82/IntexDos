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
  const [loadedPages, setLoadedPages] = useState<number[]>([0]);
  const [allMovies, setAllMovies] = useState<Movie[]>(movies);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPagePreloaded, setNextPagePreloaded] = useState(false);
  const [transitionActive, setTransitionActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update allMovies when movies prop changes
  useEffect(() => {
    setAllMovies(movies);
  }, [movies]);
  
  // Calculate the total number of pages
  const moviesPerPage = 5;
  const totalPages = Math.max(Math.ceil(allMovies.length / moviesPerPage), loadedPages.length + 1);
  
  // Preload the next page of movies
  useEffect(() => {
    const preloadNextPage = async () => {
      const nextPage = currentPage + 1;
      // If we haven't loaded the next page yet and it's within bounds
      if (
        !loadedPages.includes(nextPage) && 
        nextPage < totalPages + 1 && 
        onLoadMore && 
        userId && 
        !nextPagePreloaded &&
        !isLoading
      ) {
        setNextPagePreloaded(true);
        try {
          // Preload next page data
          const newMovies = await onLoadMore(sectionType, nextPage);
          
          // Add the new movies to our collection
          if (newMovies && newMovies.length > 0) {
            setAllMovies(prevMovies => [...prevMovies, ...newMovies]);
            
            // Preload the images
            newMovies.forEach(movie => {
              if (movie.posterUrl) {
                const img = new Image();
                img.src = movie.posterUrl;
              }
            });
          }
          
          // Mark this page as loaded
          setLoadedPages(prev => [...prev, nextPage]);
        } catch (err) {
          console.error(`Error preloading next page for ${sectionType}:`, err);
        }
      }
    };
    
    preloadNextPage();
  }, [currentPage, loadedPages, totalPages, onLoadMore, userId, sectionType, nextPagePreloaded, isLoading]);
  
  // Get the current visible movies
  const visibleMovies = allMovies.slice(
    currentPage * moviesPerPage, 
    (currentPage + 1) * moviesPerPage
  );
  
  if (allMovies.length === 0) return null;
  
  const scrollPrev = () => {
    if (currentPage > 0 && !transitionActive) {
      setTransitionActive(true);
      // Using setTimeout to allow the fade-out to complete
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setTransitionActive(false);
      }, 150); // Match this with CSS transition time
    }
  };
  
  const scrollNext = async () => {
    if (currentPage < totalPages - 1 && !transitionActive) {
      setTransitionActive(true);
      
      // Check if we need to load more data
      const nextPage = currentPage + 1;
      if (!loadedPages.includes(nextPage) && onLoadMore && userId) {
        setIsLoading(true);
        try {
          const newMovies = await onLoadMore(sectionType, nextPage);
          
          // Add the new movies to our collection
          if (newMovies && newMovies.length > 0) {
            setAllMovies(prevMovies => [...prevMovies, ...newMovies]);
          }
          
          // Mark this page as loaded
          setLoadedPages(prev => [...prev, nextPage]);
        } catch (err) {
          console.error(`Error loading more ${sectionType} recommendations:`, err);
        } finally {
          setIsLoading(false);
        }
      }
      
      // Using setTimeout to allow the fade-out to complete
      setTimeout(() => {
        setCurrentPage(nextPage);
        setTransitionActive(false);
        setNextPagePreloaded(false); // Reset so we can preload the next page
      }, 150); // Match this with CSS transition time
    }
  };

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
          style={{
            display: "flex",
            gap: "1.5rem",
            paddingBottom: "1rem",
            paddingLeft: "40px",
            paddingRight: "40px",
            overflow: "hidden",
            justifyContent: "center",
            minHeight: "370px", // Set minimum height to prevent layout shifts
            position: "relative"
          }}
        >
          <div 
            style={{
              display: "flex",
              gap: "1.5rem",
              opacity: transitionActive ? 0 : 1,
              transition: "opacity 150ms ease-in-out",
              position: "absolute",
              top: 0,
              left: "40px",
              right: "40px",
              width: "calc(100% - 80px)"
            }}
          >
            {visibleMovies.map((movie) => (
              <div key={movie.showId} style={{ flexShrink: 0, width: "200px" }}>
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
                return movieResponse.data;
              } catch (err) {
                console.warn(`Failed to fetch movie ${id} from main API - creating placeholder:`, err);
                
                // Create a placeholder movie object with the ID
                // This ensures we at least display something for recommendations
                return {
                  showId: id,
                  title: `Movie ${id}`,
                  description: "Details for this recommendation aren't available in the database.",
                  posterUrl: `https://image.tmdb.org/t/p/w500/placeholder.jpg`
                };
              }
            })
          );

          setCollaborativeMovies(movieResponses.filter(movie => movie !== null) as Movie[]);
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
                return movieResponse.data;
              } catch (err) {
                console.warn(`Failed to fetch movie ${id} from main API - creating placeholder:`, err);
                
                // Create a placeholder movie object with the ID
                return {
                  showId: id,
                  title: `Movie ${id}`,
                  description: "Details for this recommendation aren't available in the database.",
                  posterUrl: `https://image.tmdb.org/t/p/w500/placeholder.jpg`
                };
              }
            })
          );

          setContentBasedMovies(movieResponses.filter(movie => movie !== null) as Movie[]);
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
                    return movieResponse.data;
                  } catch (err) {
                    console.warn(`Failed to fetch movie ${id} from main API - creating placeholder:`, err);
                    
                    // Create a placeholder movie object with the ID
                    return {
                      showId: id,
                      title: `Movie ${id}`,
                      description: "Details for this recommendation aren't available in the database.",
                      posterUrl: `https://image.tmdb.org/t/p/w500/placeholder.jpg`
                    };
                  }
                })
              );

              genreResults[genre] = movieResponses.filter(movie => movie !== null) as Movie[];
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
            return movieResponse.data;
          } catch (err) {
            console.warn(`Failed to fetch movie ${id} from main API:`, err);
            return {
              showId: id,
              title: `Movie ${id}`,
              description: "Details for this recommendation aren't available in the database.",
              posterUrl: `https://image.tmdb.org/t/p/w500/placeholder.jpg`
            };
          }
        })
      );
      
      return movies.filter(movie => movie !== null) as Movie[];
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