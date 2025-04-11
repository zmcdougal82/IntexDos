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
  const [targetPageLoaded, setTargetPageLoaded] = useState<boolean>(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preloadQueue, setPreloadQueue] = useState<string[]>([]);
  const [loadingTimers, setLoadingTimers] = useState<Record<string, NodeJS.Timeout>>({});
  
  // Transition duration in ms - extended for smoother transitions
  const TRANSITION_DURATION = 700;
  const IMAGE_LOAD_TIMEOUT = 15000; // Extended from 10s to 15s for better loading experience
  const moviesPerPage = 5;
  
  // Enhanced image preloading with cache
  const imageCache = useRef<Set<string>>(new Set());
  
  // Track image loading for each movie with enhanced priority queuing and timeout handling
  const preloadImage = (movie: Movie, priority: 'high' | 'medium' | 'low' = 'medium') => {
    if (!movie || !movie.posterUrl) return true;
    
    // Skip if already loaded or being loaded
    if (imagesLoaded[movie.showId] || imageCache.current.has(movie.showId)) {
      return true;
    }
    
    // Mark that we've started loading this image
    imageCache.current.add(movie.showId);
    
    // Create a new image object
    const img = new Image();
    
    // Set up load handlers
    img.onload = () => {
      // Clear any timeout that might be running
      if (loadingTimers[movie.showId]) {
        clearTimeout(loadingTimers[movie.showId]);
        setLoadingTimers(prev => {
          const newTimers = {...prev};
          delete newTimers[movie.showId];
          return newTimers;
        });
      }
      
      // Mark as successfully loaded
      setImagesLoaded(prev => ({...prev, [movie.showId]: true}));
      
      // Continue with next image in queue if any
      setPreloadQueue(prevQueue => {
        const newQueue = [...prevQueue];
        newQueue.shift(); // Remove the first item
        return newQueue;
      });
    };
    
    img.onerror = () => {
      // Clear any timeout
      if (loadingTimers[movie.showId]) {
        clearTimeout(loadingTimers[movie.showId]);
        setLoadingTimers(prev => {
          const newTimers = {...prev};
          delete newTimers[movie.showId];
          return newTimers;
        });
      }
      
      // Even on error, mark as loaded to avoid retrying indefinitely
      console.warn(`Failed to load image for movie: ${movie.showId}`);
      setImagesLoaded(prev => ({...prev, [movie.showId]: true}));
      
      // Continue with next image in queue
      setPreloadQueue(prevQueue => {
        const newQueue = [...prevQueue];
        newQueue.shift();
        return newQueue;
      });
    };
    
    // Set a timeout to prevent waiting indefinitely for an image
    const timer = setTimeout(() => {
      console.warn(`Image load timeout for movie: ${movie.showId}`);
      // Mark as loaded even though it timed out
      setImagesLoaded(prev => ({...prev, [movie.showId]: true}));
      
      // Continue with the queue
      setPreloadQueue(prevQueue => {
        const newQueue = [...prevQueue];
        if (newQueue[0] === movie.showId) {
          newQueue.shift();
        }
        return newQueue;
      });
      
      // Remove this timer from the timers object
      setLoadingTimers(prev => {
        const newTimers = {...prev};
        delete newTimers[movie.showId];
        return newTimers;
      });
    }, IMAGE_LOAD_TIMEOUT);
    
    // Save the timer reference
    setLoadingTimers(prev => ({
      ...prev,
      [movie.showId]: timer
    }));
    
    // Add to preload queue with appropriate priority
    setPreloadQueue(prevQueue => {
      // If high priority, add to front of queue
      if (priority === 'high') {
        return [movie.showId, ...prevQueue];
      } 
      // If already in queue, don't add again
      else if (prevQueue.includes(movie.showId)) {
        return prevQueue;
      }
      // Otherwise add to end of queue
      return [...prevQueue, movie.showId];
    });
    
    // Start loading if first item or if high priority
    if (priority === 'high' || preloadQueue.length === 0) {
      img.src = movie.posterUrl;
    }
    
    return false;
  };
  
  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      // Clear all timers
      Object.values(loadingTimers).forEach(timer => clearTimeout(timer));
    };
  }, [loadingTimers]);
  
  // Process the preload queue with improved error handling
  useEffect(() => {
    if (preloadQueue.length > 0) {
      const currentMovieId = preloadQueue[0];
      const currentMovie = allMovies.find(m => m.showId === currentMovieId);
      
      if (currentMovie && currentMovie.posterUrl && !imagesLoaded[currentMovieId]) {
        const img = new Image();
        img.onload = () => {
          setImagesLoaded(prev => ({...prev, [currentMovieId]: true}));
          setPreloadQueue(prevQueue => {
            const newQueue = [...prevQueue];
            newQueue.shift();
            return newQueue;
          });
          
          // Clear any timeout
          if (loadingTimers[currentMovieId]) {
            clearTimeout(loadingTimers[currentMovieId]);
            setLoadingTimers(prev => {
              const newTimers = {...prev};
              delete newTimers[currentMovieId];
              return newTimers;
            });
          }
        };
        img.onerror = () => {
          setImagesLoaded(prev => ({...prev, [currentMovieId]: true}));
          setPreloadQueue(prevQueue => {
            const newQueue = [...prevQueue];
            newQueue.shift();
            return newQueue;
          });
          
          // Clear any timeout
          if (loadingTimers[currentMovieId]) {
            clearTimeout(loadingTimers[currentMovieId]);
            setLoadingTimers(prev => {
              const newTimers = {...prev};
              delete newTimers[currentMovieId];
              return newTimers;
            });
          }
        };
        
        // Set a timeout to prevent waiting indefinitely
        const timer = setTimeout(() => {
          console.warn(`Queue image load timeout for movie: ${currentMovieId}`);
          // Mark as loaded after timeout
          setImagesLoaded(prev => ({...prev, [currentMovieId]: true}));
          setPreloadQueue(prevQueue => {
            const newQueue = [...prevQueue];
            if (newQueue[0] === currentMovieId) {
              newQueue.shift();
            }
            return newQueue;
          });
        }, IMAGE_LOAD_TIMEOUT);
        
        // Save the timer reference
        setLoadingTimers(prev => ({
          ...prev,
          [currentMovieId]: timer
        }));
        
        img.src = currentMovie.posterUrl;
      } else {
        // Skip this item if movie not found or already loaded
        setPreloadQueue(prevQueue => {
          const newQueue = [...prevQueue];
          newQueue.shift();
          return newQueue;
        });
      }
    }
  }, [preloadQueue, allMovies, imagesLoaded, loadingTimers, IMAGE_LOAD_TIMEOUT]);
  
  // Update allMovies when movies prop changes
  useEffect(() => {
    setAllMovies(movies);
    
    // Reset loading states
    setAllImagesLoaded(false);
    
    // Immediately start preloading current page with high priority
    if (movies.length > 0) {
      const currentPageMovies = movies.slice(0, moviesPerPage);
      
      // High priority for visible movies
      currentPageMovies.forEach(movie => preloadImage(movie, 'high'));
      
      // Medium priority for next page
      const nextPageMovies = movies.slice(moviesPerPage, moviesPerPage * 2);
      nextPageMovies.forEach(movie => preloadImage(movie, 'medium'));
      
      // Low priority for all remaining
      const remainingMovies = movies.slice(moviesPerPage * 2);
      remainingMovies.forEach(movie => preloadImage(movie, 'low'));
    }
  }, [movies]);
  
  // Calculate the total number of pages
  // Set a reasonably high limit to prevent running out prematurely, especially for genres
  const initialMaxPages = 10;
  const totalPages = Math.max(
    Math.ceil(allMovies.length / moviesPerPage), 
    loadedPages.length + 1,
    // Make sure we have at least 10 pages available initially
    initialMaxPages 
  );
  
  // Check if all currently visible movies' images are loaded and also track target page loading status
  useEffect(() => {
    // Check current page loading status
    const currentMovies = getCurrentPageMovies(currentPage);
    const allCurrentLoaded = currentMovies.every(movie => 
      !movie.posterUrl || imagesLoaded[movie.showId]
    );
    
    // Update the allImagesLoaded state for current page
    setAllImagesLoaded(allCurrentLoaded);
    
    // Check target page loading status if we have one set
    if (nextPage !== null) {
      const targetPageMovies = getCurrentPageMovies(nextPage);
      const targetLoaded = targetPageMovies.every(
        movie => !movie.posterUrl || imagesLoaded[movie.showId]
      );
      
      setTargetPageLoaded(targetLoaded);
      
      // If target page isn't loaded, ensure we're aggressively preloading
      if (!targetLoaded) {
        targetPageMovies.forEach(movie => {
          if (!imagesLoaded[movie.showId]) {
            preloadImage(movie, 'high');
          }
        });
      }
    }
    
    // Also check and preload the next potential pages
    const nextPageIndex = currentPage + 1;
    const prevPageIndex = currentPage - 1;
    
    // Next page
    if (nextPageIndex < totalPages) {
      const nextPageMovies = getCurrentPageMovies(nextPageIndex);
      
      // Preload regardless of current status to ensure we're ready
      nextPageMovies.forEach(movie => {
        if (!imagesLoaded[movie.showId]) {
          preloadImage(movie, nextPage === nextPageIndex ? 'high' : 'medium');
        }
      });
    }
    
    // Previous page
    if (prevPageIndex >= 0) {
      const prevPageMovies = getCurrentPageMovies(prevPageIndex);
      
      // Preload with appropriate priority
      prevPageMovies.forEach(movie => {
        if (!imagesLoaded[movie.showId]) {
          preloadImage(movie, nextPage === prevPageIndex ? 'high' : 'medium');
        }
      });
    }
  }, [imagesLoaded, currentPage, nextPage, totalPages]);
  
  // Enhanced preloading of adjacent pages
  useEffect(() => {
    const preloadAdjacentPages = async () => {
      // Always prioritize loading the next page
      const priorityPages = [currentPage + 1];
      
      // Then add the previous page
      if (currentPage > 0) {
        priorityPages.push(currentPage - 1);
      }
      
      // Also look two pages ahead
      if (currentPage + 2 < totalPages) {
        priorityPages.push(currentPage + 2);
      }
      
      // Filter out pages we've already loaded
      const pagesToPreload = priorityPages.filter(
        page => page >= 0 && page < totalPages + 1 && !loadedPages.includes(page)
      );
      
      for (const pageToPreload of pagesToPreload) {
        if (onLoadMore && userId && !isLoading) {
          try {
            // Fetch data for this page
            console.log(`Preloading data for ${sectionType}, page ${pageToPreload}`);
            setIsLoading(true);
            const newMovies = await onLoadMore(sectionType, pageToPreload);
            setIsLoading(false);
            
            // Add the new movies to our collection
            if (newMovies && newMovies.length > 0) {
              setAllMovies(prevMovies => {
                // Filter out any duplicates
                const existingIds = new Set(prevMovies.map(m => m.showId));
                const uniqueNewMovies = newMovies.filter(m => !existingIds.has(m.showId));
                
                if (uniqueNewMovies.length > 0) {
                  // Determine priority based on page proximity to current
                  const priority = pageToPreload === currentPage + 1 ? 'high' : 'medium';
                  
                  // Start preloading these images
                  uniqueNewMovies.forEach(movie => preloadImage(movie, priority));
                  
                  return [...prevMovies, ...uniqueNewMovies];
                }
                return prevMovies;
              });
            }
            
      // Mark this page as loaded even if we get no results
      // to avoid repeated attempts that will also fail
      setLoadedPages(prev => [...prev, pageToPreload]);
      
      // If we got no results and we're at the end, let's handle this gracefully
      if (!newMovies || newMovies.length === 0) {
        // Only display warning to console, not to user
        console.warn(`No more recommendations available for ${sectionType} at page ${pageToPreload}`);
      }
    } catch (err) {
      console.error(`Error preloading page ${pageToPreload} for ${sectionType}:`, err);
      setIsLoading(false);
      
      // Still mark the page as loaded to prevent repeated failing calls
      setLoadedPages(prev => [...prev, pageToPreload]);
    }
        }
      }
    };
    
    preloadAdjacentPages();
  }, [currentPage, loadedPages, totalPages, onLoadMore, userId, sectionType, isLoading]);
  
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
    // Only allow scrolling if we're not already in transition or loading
    if (currentPage > 0 && !transitionActive && !isLoading) {
      // Check if previous page images are loaded
      const prevPageMovies = getCurrentPageMovies(currentPage - 1);
      const prevPageReady = prevPageMovies.every(
        movie => !movie.posterUrl || imagesLoaded[movie.showId]
      );
      
      // If previous page images aren't ready, start preloading them but don't transition yet
      if (!prevPageReady) {
        // Show loading state
        setAllImagesLoaded(false);
        
        // Set the target page so we can track loading progress
        const targetPage = currentPage - 1;
        setNextPage(targetPage);
        
        // Aggressively preload the images we need with high priority
        prevPageMovies.forEach(movie => {
          if (!imagesLoaded[movie.showId]) {
            preloadImage(movie, 'high');
          }
        });
        
        // Wait for the images to load via the targetPageLoaded effect
        return;
      }
      
      // Start transition animation once images are ready
      setTransitionActive(true);
      setTransitionDirection('left');
      
      // Set the target page
      const targetPage = currentPage - 1;
      setNextPage(targetPage);
      setTargetPageLoaded(true); // Images are already confirmed loaded
      
      // Using setTimeout to allow the animation to complete
      setTimeout(() => {
        setCurrentPage(targetPage);
        setNextPage(null);
        setTransitionActive(false);
        setTransitionDirection(null);
        
        // Check again if all images are loaded for the new page
        const newCurrentMovies = getCurrentPageMovies(targetPage);
        const allLoaded = newCurrentMovies.every(
          movie => !movie.posterUrl || imagesLoaded[movie.showId]
        );
        setAllImagesLoaded(allLoaded);
      }, TRANSITION_DURATION);
    }
  };
  
  const scrollNext = async () => {
    // Only scroll if not at the end, not in transition, not loading
    if (currentPage < totalPages - 1 && !transitionActive && !isLoading) {
      const targetPage = currentPage + 1;
      setNextPage(targetPage); // Set this early to trigger target page loading checks
      
      // Check if we need to load more data
      if (!loadedPages.includes(targetPage) && onLoadMore && userId) {
        setIsLoading(true);
        setAllImagesLoaded(false); // Show loading state
        
        try {
          console.log(`Loading more ${sectionType} recommendations for page ${targetPage}`);
          const newMovies = await onLoadMore(sectionType, targetPage);
          
          // Add the new movies to our collection if we got any
          if (newMovies && newMovies.length > 0) {
            setAllMovies(prevMovies => {
              // Filter out any duplicates
              const existingIds = new Set(prevMovies.map(m => m.showId));
              const uniqueNewMovies = newMovies.filter(m => !existingIds.has(m.showId));
              
              // Start preloading these images with high priority
              uniqueNewMovies.forEach(movie => preloadImage(movie, 'high'));
              
              // If we actually got new movies, increase the totalPages
              if (uniqueNewMovies.length > 0) {
                // This will be handled by the totalPages calculation on next render
                return [...prevMovies, ...uniqueNewMovies];
              }
              
              return prevMovies;
            });
          }
          
          // Mark this page as loaded regardless of results
          setLoadedPages(prev => [...prev, targetPage]);
        } catch (err) {
          console.error(`Error loading more ${sectionType} recommendations:`, err);
          // Mark the page as loaded anyway to prevent repeated failing requests
          setLoadedPages(prev => [...prev, targetPage]);
        } finally {
          setIsLoading(false);
        }
      }
      
      // Check if next page images are loaded
      const nextPageMovies = getCurrentPageMovies(targetPage);
      const nextPageReady = nextPageMovies.length > 0 && nextPageMovies.every(
        movie => !movie.posterUrl || imagesLoaded[movie.showId]
      );
      
      // If next page images aren't ready, start preloading without transitioning yet
      if (!nextPageReady) {
        setAllImagesLoaded(false);
        
        // Aggressively preload the images we need
        nextPageMovies.forEach(movie => {
          if (!imagesLoaded[movie.showId]) {
            preloadImage(movie, 'high');
          }
        });
        
        // Wait for targetPageLoaded to become true via the useEffect hook
        return;
      }
      
      // Only proceed with transition animation once images are loaded
      setTransitionActive(true);
      setTransitionDirection('right');
      setTargetPageLoaded(true); // We've confirmed images are loaded
      
      // Using setTimeout to allow the animation to complete
      setTimeout(() => {
        setCurrentPage(targetPage);
        setNextPage(null);
        setTransitionActive(false);
        setTransitionDirection(null);
        
        // Check if all images are loaded for new current page
        const newCurrentMovies = getCurrentPageMovies(targetPage);
        const allLoaded = newCurrentMovies.every(
          movie => !movie.posterUrl || imagesLoaded[movie.showId]
        );
        setAllImagesLoaded(allLoaded);
        
        // Additionally, try to preload the next two pages proactively
        if (targetPage + 1 < totalPages) {
          getCurrentPageMovies(targetPage + 1).forEach(movie => 
            preloadImage(movie, 'medium')
          );
        }
        if (targetPage + 2 < totalPages) {
          getCurrentPageMovies(targetPage + 2).forEach(movie => 
            preloadImage(movie, 'low')
          );
        }
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

  // Peek preview style to show a glimpse of next/previous pages
  const peekPreviewStyle = {
    position: "absolute" as const,
    top: "50%",
    transform: "translateY(-50%)",
    width: "60px",
    height: "300px",
    pointerEvents: "none" as const,
    zIndex: 5
  };

  // Enhanced styling approach with better placeholder support
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
      ? `opacity ${TRANSITION_DURATION}ms cubic-bezier(0.33, 1, 0.68, 1), transform ${TRANSITION_DURATION}ms cubic-bezier(0.33, 1, 0.68, 1)` 
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

  // Create a movie card with enhanced placeholder handling  
  const renderMovieCard = (movie: Movie, isLoaded: boolean) => {
    return (
      <div 
        key={movie.showId} 
        style={{ 
          flexShrink: 0, 
          width: "200px",
          position: 'relative',
          // No opacity transition on the container to prevent flashing
          height: '300px', // Fixed height to prevent layout shifts
        }}
      >
        {/* Always show the shimmer placeholder, but control its opacity */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          overflow: 'hidden',
          // Keep placeholder visible until image is loaded
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 0.5s ease-in',
          // Higher z-index to ensure it covers any white flashes
          zIndex: 2
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '200%',
            height: '100%',
            background: 'linear-gradient(to right, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
            animation: 'shimmer 2s infinite',
          }} />
        </div>
        
        {/* The actual movie card with a wrapper to control visibility */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // Fade in the actual content once loaded
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
          zIndex: 1
        }}>
          <MovieCard
            movie={movie}
            onClick={() => onMovieClick(movie.showId)}
          />
        </div>
      </div>
    );
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
          disabled={currentPage === 0 || transitionActive || isLoading || (nextPage !== null && !targetPageLoaded)} 
        />
        
        <div
          ref={containerRef}
          style={containerStyles}
        >
          {/* Enhanced loading overlay with clearer status messages */}
          {(!allImagesLoaded || isLoading || (nextPage !== null && !targetPageLoaded)) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid var(--color-primary)',
                  borderRadius: '50%',
                  marginBottom: '10px',
                  animation: 'spin 1s linear infinite',
                }}>
                </div>
                <div style={{fontWeight: 500}}>
                  {isLoading ? 'Loading more recommendations...' : 
                   nextPage !== null && !targetPageLoaded ? 'Loading posters...' : 
                   'Preparing content...'}
                </div>
              </div>
            </div>
          )}
          
          {/* Peek preview for previous page */}
          {currentPage > 0 && prevPageMovies.length > 0 && !transitionActive && (
            <div style={{
              ...peekPreviewStyle,
              left: 0,
              background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.9) 100%)',
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
            }}>
              {prevPageMovies.length > 0 && prevPageMovies.every(movie => imagesLoaded[movie.showId]) && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  opacity: 0.7,
                  transform: 'translateX(-70%)',
                  transition: 'transform 0.3s ease',
                }}>
                  {renderMovieCard(prevPageMovies[prevPageMovies.length - 1], true)}
                </div>
              )}
            </div>
          )}
          
          {/* Current page content - always rendered */}
          <div style={pageStyles(!transitionActive, getCurrentPageTransform())}>
            {visibleMovies.map((movie) => 
              renderMovieCard(movie, Boolean(imagesLoaded[movie.showId]))
            )}
          </div>
          
          {/* Target page content - shown during transition */}
          <div style={pageStyles(transitionActive, getNextPageTransform())}>
            {targetPageMovies.map((movie) => 
              renderMovieCard(movie, Boolean(imagesLoaded[movie.showId]))
            )}
          </div>
          
          {/* Peek preview for next page */}
          {currentPage < totalPages - 1 && nextForwardMovies.length > 0 && !transitionActive && (
            <div style={{
              ...peekPreviewStyle,
              right: 0,
              background: 'linear-gradient(to left, transparent 0%, rgba(255,255,255,0.9) 100%)',
              borderTopLeftRadius: '8px',
              borderBottomLeftRadius: '8px',
            }}>
              {nextForwardMovies.length > 0 && nextForwardMovies.every(movie => imagesLoaded[movie.showId]) && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  opacity: 0.7,
                  transform: 'translateX(70%)',
                  transition: 'transform 0.3s ease',
                }}>
                  {renderMovieCard(nextForwardMovies[0], true)}
                </div>
              )}
            </div>
          )}
        </div>
        
        <NavigationArrow 
          direction="right" 
          onClick={scrollNext} 
          disabled={currentPage >= totalPages - 1 || transitionActive || isLoading || (nextPage !== null && !targetPageLoaded)} 
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
