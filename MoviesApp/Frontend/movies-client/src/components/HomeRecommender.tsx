import { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import { movieApi, Movie } from "../services/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface HomeRecommenderProps {
  userId: string | null;
}

// Get recommendation API URL based on environment
const getRecommendationApiUrl = () => {
  return window.location.hostname !== "localhost"
    ? "https://moviesapp-recommendation-service.azurewebsites.net"
    : "http://localhost:8001";
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
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  const moviesPerPage = 5;
  
  // Image preload state
  const [imageLoadPromises, setImageLoadPromises] = useState<Record<string, Promise<boolean>>>({});
  
  // Improved robust image preloading function
  const preloadImage = (movie: Movie): Promise<boolean> => {
    if (!movie || !movie.posterUrl) {
      // If no movie or no poster URL, mark as loaded
      return Promise.resolve(true);
    }
    
    // Skip if already loaded
    if (imagesLoaded[movie.showId]) {
      return Promise.resolve(true);
    }
    
    // If we already have a promise for this image, return it
    if (movie.showId in imageLoadPromises) {
      return imageLoadPromises[movie.showId];
    }
    
    // Create a new promise for this image
    const loadPromise = new Promise<boolean>((resolve) => {
      // Create a new image object to preload
      const img = new Image();
      
      // Set up handlers
      img.onload = () => {
        // Mark as loaded in the state
        setImagesLoaded(prev => ({...prev, [movie.showId]: true}));
        resolve(true);
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image for movie: ${movie.showId}`);
        // Even on error, we'll mark it as "loaded" to avoid blocking navigation
        setImagesLoaded(prev => ({...prev, [movie.showId]: true}));
        resolve(false);
      };
      
      // Start loading (after handlers are set up)
      if (movie.posterUrl) {
        img.src = movie.posterUrl;
      }
    });
    
    // Save this promise
    setImageLoadPromises(prev => ({
      ...prev,
      [movie.showId]: loadPromise
    }));
    
    return loadPromise;
  };
  
  // Update allMovies when movies prop changes
  useEffect(() => {
    setAllMovies(movies);
    
    // Start preloading all visible movies
    if (movies.length > 0) {
      movies.forEach(movie => preloadImage(movie));
    }
  }, [movies]);
  
  // Calculate the total number of pages
  const totalPages = Math.max(
    Math.ceil(allMovies.length / moviesPerPage), 
    loadedPages.length + 1
  );
  
  // Get the current visible movies
  const getCurrentPageMovies = (page: number) => {
    return allMovies.slice(
      page * moviesPerPage, 
      (page + 1) * moviesPerPage
    );
  };
  
  const visibleMovies = getCurrentPageMovies(currentPage);
  
  if (allMovies.length === 0) return null;
  
  // Enhanced scrollPrev function - ensures all images are loaded before page change
  const scrollPrev = () => {
    if (currentPage > 0 && !isLoading) {
      const targetPage = currentPage - 1;
      
      // Check if the previous page's images are all loaded
      const prevPageMovies = getCurrentPageMovies(targetPage);
      const allPrevPageImagesLoaded = prevPageMovies.every(
        movie => !movie.posterUrl || imagesLoaded[movie.showId]
      );
      
      // If not all images are loaded yet, start preloading them but don't change page
      if (!allPrevPageImagesLoaded) {
        console.log("Waiting for all images to load before changing page...");
        
        // Aggressively preload the images needed
        prevPageMovies.forEach(movie => {
          if (!imagesLoaded[movie.showId]) {
            preloadImage(movie);
          }
        });
        
        // Don't proceed with the page change until all images are loaded
        return;
      }
      
      // Only go to the previous page when all images are loaded
      setCurrentPage(targetPage);
    }
  };
  
  // Check if all images for a given page are loaded
  const areAllImagesLoadedForPage = (page: number): boolean => {
    const pageMovies = getCurrentPageMovies(page);
    return pageMovies.every(movie => !movie.posterUrl || imagesLoaded[movie.showId]);
  };

  // Enhanced scrollNext function - ensures all images are loaded before page change
  const scrollNext = async () => {
    if (currentPage < totalPages - 1 && !isLoading) {
      const targetPage = currentPage + 1;
      
      // Check if we need to load more data
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
              
              // Preload these images
              uniqueNewMovies.forEach(movie => preloadImage(movie));
              
              return [...prevMovies, ...uniqueNewMovies];
            });
          }
          
          // Mark this page as loaded
          setLoadedPages(prev => [...prev, targetPage]);
        } catch (err) {
          console.error(`Error loading more ${sectionType} recommendations:`, err);
          setLoadedPages(prev => [...prev, targetPage]);
        } finally {
          setIsLoading(false);
        }
      }
      
      // Check if the next page's images are all loaded
      const nextPageMovies = getCurrentPageMovies(targetPage);
      const allNextPageImagesLoaded = nextPageMovies.every(
        movie => !movie.posterUrl || imagesLoaded[movie.showId]
      );
      
      // If not all images are loaded yet, start preloading them but don't change page
      if (!allNextPageImagesLoaded) {
        console.log("Waiting for all images to load before changing page...");
        
        // Aggressively preload the images needed
        nextPageMovies.forEach(movie => {
          if (!imagesLoaded[movie.showId]) {
            preloadImage(movie);
          }
        });
        
        // Don't proceed with the page change until all images are loaded
        return;
      }
      
      // Only go to the next page when all images are loaded
      setCurrentPage(targetPage);
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
          disabled={
            currentPage === 0 || 
            isLoading || 
            (currentPage > 0 && !areAllImagesLoadedForPage(currentPage - 1))
          } 
        />
        
        <div
          ref={containerRef}
          style={{
            position: "relative",
            paddingBottom: "1rem",
            paddingLeft: "40px",
            paddingRight: "40px",
            overflow: "hidden",
            height: "395px",
            backgroundColor: "transparent",
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          {/* Simple content display without transitions */}
          <div style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            width: "100%"
          }}>
            {visibleMovies.map((movie) => (
              <div 
                key={movie.showId} 
                style={{ 
                  flexShrink: 0, 
                  width: "200px",
                  position: 'relative',
                  height: '300px',
                  transform: 'translateZ(0)'
                }}
              >
                {/* Placeholder for unloaded images */}
                {!imagesLoaded[movie.showId] && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    zIndex: 2
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '200%',
                      height: '100%',
                      background: 'linear-gradient(to right, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
                      animation: 'shimmer 2s infinite linear'
                    }} />
                  </div>
                )}
                
                {/* Only render MovieCard when image is loaded */}
                {imagesLoaded[movie.showId] && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1
                  }}>
                    <MovieCard
                      movie={movie}
                      onClick={() => onMovieClick(movie.showId)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <NavigationArrow 
          direction="right" 
          onClick={scrollNext} 
          disabled={
            currentPage >= totalPages - 1 || 
            isLoading || 
            (currentPage < totalPages - 1 && !areAllImagesLoadedForPage(currentPage + 1))
          } 
        />
      </div>
    </div>
  );
};

const HomeRecommender: React.FC<HomeRecommenderProps> = ({ userId }) => {
  const [collaborativeMovies, setCollaborativeMovies] = useState<Movie[]>([]);
  const [contentBasedMovies, setContentBasedMovies] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setError("User ID is required.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch from recommendation API only - no fallback
        let recommendationsData: RecommendationData | null = null;
        
        try {
          // Fetch from our recommendation API
          const apiResponse = await axios.get(`${RECOMMENDATION_API_URL}/recommendations/${userId}`);
          recommendationsData = apiResponse.data;
          console.log("Recommendation API response:", recommendationsData);
        } catch (apiErr) {
          console.error("Could not fetch from recommendation API:", apiErr);
          throw new Error("Failed to fetch recommendations. Please try again later.");
        }
        
        if (!recommendationsData) {
          throw new Error("No recommendations data available.");
        }

        // Create a set to track all movie IDs to prevent duplicates
        const processedMovieIds = new Set<string>();
        
        // Process collaborative recommendations
        if (recommendationsData.collaborative && recommendationsData.collaborative.length > 0) {
          const movieResponses = await Promise.all(
            recommendationsData.collaborative.map(async (id) => {
              try {
                const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
                
                const movieResponse = await movieApi.getById(dbStyleId);
                
                if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
                  return movieResponse.data;
                } else {
                  console.warn(`Movie ${id} data is incomplete - skipping`);
                  return null;
                }
              } catch (err) {
                console.warn(`Failed to fetch movie ${id}:`, err);
                return null;
              }
            })
          );

          // Filter out invalid movies and add to processed set
          const validMovies = movieResponses.filter(movie => 
            movie !== null && 
            movie !== undefined && 
            movie.showId && 
            movie.title
          ) as Movie[];
          
          // Add all collaborative movies to the processed set
          validMovies.forEach(movie => processedMovieIds.add(movie.showId));
          setCollaborativeMovies(validMovies);
        }

        // Process content-based recommendations (excluding duplicates)
        if (recommendationsData.contentBased && recommendationsData.contentBased.length > 0) {
          const movieResponses = await Promise.all(
            recommendationsData.contentBased.map(async (id) => {
              try {
                const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
                
                // Skip if we've already processed this movie ID
                if (processedMovieIds.has(dbStyleId)) {
                  return null;
                }
                
                const movieResponse = await movieApi.getById(dbStyleId);
                
                if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
                  return movieResponse.data;
                } else {
                  console.warn(`Movie ${id} data is incomplete - skipping`);
                  return null;
                }
              } catch (err) {
                console.warn(`Failed to fetch movie ${id}:`, err);
                return null;
              }
            })
          );

          // Filter out invalid movies
          const validMovies = movieResponses.filter(movie => 
            movie !== null && 
            movie !== undefined && 
            movie.showId && 
            movie.title
          ) as Movie[];
          
          // Add all content-based movies to the processed set
          validMovies.forEach(movie => processedMovieIds.add(movie.showId));
          setContentBasedMovies(validMovies);
        }
        
        // Process genre-based recommendations (excluding duplicates)
        if (recommendationsData.genres) {
          const genreResults: Record<string, Movie[]> = {};

          for (const [genre, movieIds] of Object.entries(recommendationsData.genres)) {
            if (movieIds.length > 0) {
              const movieResponses = await Promise.all(
                movieIds.map(async (id) => {
                  try {
                    const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
                    
                    // Skip if we've already processed this movie ID
                    if (processedMovieIds.has(dbStyleId)) {
                      return null;
                    }
                    
                    const movieResponse = await movieApi.getById(dbStyleId);
                    
                    if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
                      return movieResponse.data;
                    } else {
                      console.warn(`Movie ${id} data is incomplete - skipping`);
                      return null;
                    }
                  } catch (err) {
                    console.warn(`Failed to fetch movie ${id}:`, err);
                    return null;
                  }
                })
              );

              // Filter out invalid movies
              const validMovies = movieResponses.filter(movie => 
                movie !== null && 
                movie !== undefined && 
                movie.showId && 
                movie.title
              ) as Movie[];
              
              if (validMovies.length > 0) {
                // Add all genre movies to the processed set
                validMovies.forEach(movie => processedMovieIds.add(movie.showId));
                genreResults[genre] = validMovies;
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

  // Function to load more recommendations, preventing duplicates across all sections
  const loadMoreRecommendations = async (section: string, page: number): Promise<Movie[]> => {
    if (!userId) return [];
    
    try {
      console.log(`Loading more for section "${section}", page ${page}`);
      const limit = 10; // Number of new recommendations to fetch
      
      // Construct the API endpoint for more recommendations
      const endpoint = `${RECOMMENDATION_API_URL}/recommendations/${userId}/more`;
      
      // Handle different section types (collaborative, contentBased, or genre)
      const params = { section, page, limit };
      
      const response = await axios.get(endpoint, { params });
      
      // Extract the relevant section from the response
      let movieIds: string[] = [];
      if (section === 'collaborative' && response.data.collaborative) {
        movieIds = response.data.collaborative;
      } else if (section === 'contentBased' && response.data.contentBased) {
        movieIds = response.data.contentBased;
      } else if (response.data.genres && response.data.genres[section]) {
        movieIds = response.data.genres[section];
      }
      
      if (!movieIds.length) return [];
      
      // Create a set of all already displayed movie IDs to prevent duplicates
      const allDisplayedMovieIds = new Set<string>();
      
      // Add collaborative movies
      collaborativeMovies.forEach(movie => allDisplayedMovieIds.add(movie.showId));
      
      // Add content-based movies
      contentBasedMovies.forEach(movie => allDisplayedMovieIds.add(movie.showId));
      
      // Add genre-based movies
      Object.values(genreMovies).forEach(movies => 
        movies.forEach(movie => allDisplayedMovieIds.add(movie.showId))
      );
      
      // Fetch the movie details, excluding duplicates
      const movies = await Promise.all(
        movieIds.map(async (id) => {
          try {
            const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
            
            // Skip if this movie ID is already displayed in any section
            if (allDisplayedMovieIds.has(dbStyleId)) {
              return null;
            }
            
            const movieResponse = await movieApi.getById(dbStyleId);
            
            if (movieResponse.data && movieResponse.data.showId && movieResponse.data.title) {
              return movieResponse.data;
            } else {
              return null;
            }
          } catch (err) {
            console.warn(`Failed to fetch movie ${id}:`, err);
            return null;
          }
        })
      );
      
      // Filter for valid movies
      const validMovies = movies.filter(movie => 
        movie !== null && 
        movie !== undefined && 
        movie.showId && 
        movie.title
      ) as Movie[];
      
      return validMovies;
    } catch (err) {
      console.error(`Error loading more recommendations for ${section}:`, err);
      return [];
    }
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
