import { useEffect, useState } from "react";
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

// Preload an image and return a promise
const preloadImage = (url?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(true);
      return;
    }

    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => {
      console.warn(`Failed to load image: ${url}`);
      resolve(false);
    };
    img.src = url;
  });
};

// Individual movie card with preloading
interface SingleMovieCardProps {
  movie: Movie;
  onClick: (id: string) => void;
}

const SingleMovieCard: React.FC<SingleMovieCardProps> = ({ movie, onClick }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  useEffect(() => {
    // Reset loaded state when movie changes
    setIsLoaded(false);
    
    // Preload the image
    if (movie.posterUrl) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => {
        console.warn(`Failed to load image for movie: ${movie.showId}`);
        setIsLoaded(true); // Mark as loaded anyway to avoid blocking
      };
      img.src = movie.posterUrl;
    } else {
      setIsLoaded(true); // No image to load
    }
  }, [movie]);
  
  return (
    <div
      style={{
        width: "200px",
        height: "300px",
        position: "relative",
        margin: "0 auto",
      }}
    >
      {/* Placeholder while loading */}
      {!isLoaded && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#f0f0f0",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "200%",
              height: "100%",
              background:
                "linear-gradient(to right, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)",
              animation: "shimmer 2s infinite linear",
            }}
          />
        </div>
      )}

      {/* Only render the actual card when image is loaded */}
      {isLoaded && (
        <div style={{ width: "100%", height: "100%" }}>
          <MovieCard movie={movie} onClick={() => onClick(movie.showId)} />
        </div>
      )}
    </div>
  );
};

// Simple Card Grid component
const MovieGrid: React.FC<{
  movies: Movie[];
  onMovieClick: (id: string) => void;
  pageKey: string;
}> = ({ movies, onMovieClick, pageKey }) => {
  // Preload all images before rendering
  useEffect(() => {
    // Start preloading all images
    movies.forEach(movie => {
      if (movie.posterUrl) {
        const img = new Image();
        img.src = movie.posterUrl;
      }
    });
  }, [movies]);

  return (
    <div 
      key={pageKey}
      style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "1.5rem", 
        width: "100%"
      }}
    >
      {movies.map(movie => (
        <SingleMovieCard
          key={movie.showId}
          movie={movie}
          onClick={onMovieClick}
        />
      ))}
    </div>
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
  
  const moviesPerPage = 5;
  
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
  
  // Update allMovies when movies prop changes
  useEffect(() => {
    setAllMovies(movies);
  }, [movies]);
  
  // Simplified scrollPrev function
  const scrollPrev = () => {
    if (currentPage > 0 && !isLoading) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Enhanced scrollNext function
  const scrollNext = async () => {
    if (currentPage < totalPages - 1 && !isLoading) {
      const targetPage = currentPage + 1;
      
      // Check if we need to load more data
      if (!loadedPages.includes(targetPage) && onLoadMore && userId) {
        setIsLoading(true);
        try {
          const newMovies = await onLoadMore(sectionType, targetPage);
          
          // Add the new movies to our collection if we got any
          if (newMovies && newMovies.length > 0) {
            setAllMovies(prevMovies => {
              // Filter out any duplicates
              const existingIds = new Set(prevMovies.map(m => m.showId));
              const uniqueNewMovies = newMovies.filter(m => !existingIds.has(m.showId));
              
              return [...prevMovies, ...uniqueNewMovies];
            });
          }
          
          // Mark this page as loaded regardless of results
          setLoadedPages(prev => [...prev, targetPage]);
        } catch (err) {
          console.error(`Error loading more ${sectionType} recommendations:`, err);
          setLoadedPages(prev => [...prev, targetPage]);
        } finally {
          setIsLoading(false);
        }
      }
      
      // Go to next page
      setCurrentPage(targetPage);
    }
  };

  // Generate a unique key for the current page to force re-render
  const pageKey = `${sectionType}-page-${currentPage}`;
  const visibleMovies = getCurrentPageMovies(currentPage);

  if (allMovies.length === 0) return null;

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
          disabled={currentPage === 0 || isLoading} 
        />
        
        <div
          style={{
            position: "relative",
            paddingBottom: "1rem",
            paddingLeft: "40px",
            paddingRight: "40px",
            overflow: "hidden",
            height: "395px",
            backgroundColor: "transparent",
          }}
        >
          <MovieGrid 
            movies={visibleMovies}
            onMovieClick={onMovieClick}
            pageKey={pageKey}
          />
        </div>
        
        <NavigationArrow 
          direction="right" 
          onClick={scrollNext} 
          disabled={currentPage >= totalPages - 1 || isLoading} 
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
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
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

  // Loading overlay component
  const LoadingOverlay = ({ progress }: { progress: number }) => {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Preloading Movie Recommendations</h2>
        <div style={{ 
          width: '300px', 
          height: '20px', 
          backgroundColor: '#f0f0f0',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'var(--color-primary)',
            transition: 'width 0.3s ease-in-out'
          }} />
        </div>
        <p>{progress}% complete</p>
      </div>
    );
  };

  // Function to preload a batch of movies for a section
  const preloadMoviesForSection = async (section: string, startPage: number, batchSize: number) => {
    const totalToLoad = 100;
    const batchCount = Math.ceil(totalToLoad / batchSize);
    const loadedMovies: Movie[] = [];
    
    for (let i = 0; i < batchCount; i++) {
      const page = startPage + i;
      try {
        const newMovies = await loadMoreRecommendations(section, page, batchSize);
        if (newMovies.length === 0) break; // No more movies available
        
        loadedMovies.push(...newMovies);
        if (loadedMovies.length >= totalToLoad) break; // We have enough movies
      } catch (err) {
        console.error(`Error batch loading movies for ${section}:`, err);
        break;
      }
    }
    
    return loadedMovies;
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setError("User ID is required.");
        return;
      }

      setLoading(true);
      setInitialLoading(true);
      setError(null);

      try {
        // Try to fetch from recommendation API first
        let recommendationsData: RecommendationData | null = null;
        
        try {
          // Fetch from our recommendation API
          const apiResponse = await axios.get(`${RECOMMENDATION_API_URL}/recommendations/${userId}`);
          recommendationsData = apiResponse.data;
          console.log("Recommendation API response:", recommendationsData);
        } catch (apiErr) {
          console.warn("Could not fetch from recommendation API, falling back to static file:", apiErr);
          
          // Fallback to the static file
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

          // Filter out invalid movies
          const validMovies = movieResponses.filter(movie => 
            movie !== null && 
            movie !== undefined && 
            movie.showId && 
            movie.title
          ) as Movie[];
          
          setCollaborativeMovies(validMovies);
        }

        // Process content-based recommendations
        if (recommendationsData.contentBased && recommendationsData.contentBased.length > 0) {
          const movieResponses = await Promise.all(
            recommendationsData.contentBased.map(async (id) => {
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

          // Filter out invalid movies
          const validMovies = movieResponses.filter(movie => 
            movie !== null && 
            movie !== undefined && 
            movie.showId && 
            movie.title
          ) as Movie[];
          
          setContentBasedMovies(validMovies);
        }
        
        // Process genre-based recommendations
        if (recommendationsData.genres) {
          const genreResults: Record<string, Movie[]> = {};

          for (const [genre, movieIds] of Object.entries(recommendationsData.genres)) {
            if (movieIds.length > 0) {
              const movieResponses = await Promise.all(
                movieIds.map(async (id) => {
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

              // Filter out invalid movies
              const validMovies = movieResponses.filter(movie => 
                movie !== null && 
                movie !== undefined && 
                movie.showId && 
                movie.title
              ) as Movie[];
              
              if (validMovies.length > 0) {
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

  // Function to load more recommendations (up to 100 per section)
  const loadMoreRecommendations = async (section: string, page: number, limit: number = 20): Promise<Movie[]> => {
    if (!userId) return [];
    
    try {
      const response = await axios.get(
        `${RECOMMENDATION_API_URL}/recommendations/${userId}/more`, 
        { params: { section, page, limit } }
      );
      
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
      
      // Fetch the movie details
      const movies = await Promise.all(
        movieIds.map(async (id) => {
          try {
            const dbStyleId = id.startsWith('s') ? id : `s${id.replace(/\D/g, '')}`;
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

  // Check if we have any recommendations to display
  const hasRecommendations = 
    collaborativeMovies.length > 0 || 
    contentBasedMovies.length > 0 || 
    Object.values(genreMovies).some(movies => movies.length > 0);

  // Effect to preload additional movies for all sections
  useEffect(() => {
    const preloadAdditionalMovies = async () => {
      if (!userId || loading || error || !hasRecommendations) return;
      
      try {
        // Start preloading process
        setInitialLoading(true);
        setLoadingProgress(0);
        
        // Determine sections to preload
        const sectionsToPreload: string[] = [];
        
        // Add collaborative section if present
        if (collaborativeMovies.length > 0) {
          sectionsToPreload.push('collaborative');
        }
        
        // Add content-based section if present
        if (contentBasedMovies.length > 0) {
          sectionsToPreload.push('contentBased');
        }
        
        // Add genre sections if present
        const genreSections = Object.keys(genreMovies).filter(genre => genreMovies[genre].length > 0);
        sectionsToPreload.push(...genreSections);
        
        // Calculate progress increment per section
        const progressPerSection = 100 / sectionsToPreload.length;
        let currentProgress = 0;
        
        // Additional movies map to store results
        const additionalMovies: Record<string, Movie[]> = {};
        
        // Load movies for each section
        for (let i = 0; i < sectionsToPreload.length; i++) {
          const section = sectionsToPreload[i];
          console.log(`Preloading additional movies for section: ${section}`);
          
          try {
            // Preload a batch of movies (starting from the second page as the first is already loaded)
            const newMovies = await preloadMoviesForSection(section, 1, 20);
            additionalMovies[section] = newMovies;
            
            // Also preload the images for these movies
            await Promise.all(
              newMovies.map(movie => preloadImage(movie.posterUrl))
            );
            
            // Update progress
            currentProgress += progressPerSection;
            setLoadingProgress(Math.min(Math.round(currentProgress), 99));
          } catch (err) {
            console.error(`Error preloading movies for section ${section}:`, err);
          }
        }
        
        // Update movie collections with preloaded content
        if (additionalMovies.collaborative && additionalMovies.collaborative.length > 0) {
          setCollaborativeMovies(prev => {
            const existingIds = new Set(prev.map(m => m.showId));
            return [...prev, ...additionalMovies.collaborative.filter(m => !existingIds.has(m.showId))];
          });
        }
        
        if (additionalMovies.contentBased && additionalMovies.contentBased.length > 0) {
          setContentBasedMovies(prev => {
            const existingIds = new Set(prev.map(m => m.showId));
            return [...prev, ...additionalMovies.contentBased.filter(m => !existingIds.has(m.showId))];
          });
        }
        
        // Update genre collections
        for (const genre of Object.keys(genreMovies)) {
          if (additionalMovies[genre] && additionalMovies[genre].length > 0) {
            setGenreMovies(prev => {
              const updatedGenres = { ...prev };
              const existingIds = new Set(prev[genre]?.map(m => m.showId) || []);
              updatedGenres[genre] = [
                ...(prev[genre] || []), 
                ...additionalMovies[genre].filter(m => !existingIds.has(m.showId))
              ];
              return updatedGenres;
            });
          }
        }
        
        // Complete loading
        setLoadingProgress(100);
        setTimeout(() => {
          setInitialLoading(false);
        }, 500); // Give a small delay to show 100%
      } catch (err) {
        console.error("Error preloading additional movies:", err);
        setInitialLoading(false);
      }
    };
    
    // Start preloading after initial data is loaded
    if (hasRecommendations && !loading && !initialLoading) {
      preloadAdditionalMovies();
    }
  }, [
    userId, 
    loading, 
    hasRecommendations, 
    collaborativeMovies.length, 
    contentBasedMovies.length, 
    Object.keys(genreMovies).length
  ]);

  // Show loading overlay during initial loading
  if (initialLoading) {
    return <LoadingOverlay progress={loadingProgress} />;
  }
  
  // Show regular loading message during initial API fetch
  if (loading) {
    return <div style={{ padding: "2rem 0", textAlign: "center" }}>Loading your personalized recommendations...</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem 0", color: "var(--color-error)" }}>{error}</div>;
  }

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
