import { useEffect, useState, useCallback } from 'react';
import { Movie, Rating, User, ratingApi } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { tmdbApi } from '../services/tmdbApi';

// Movie poster component to handle image loading
const MoviePoster: React.FC<{ movie: Movie }> = ({ movie }) => {
  // Fallback image URL 
  const defaultImage = "https://placehold.co/320x480/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat";
  const [posterUrl, setPosterUrl] = useState<string>(defaultImage);
  
  // Function to fetch a poster from TMDB
  const fetchTMDBPoster = useCallback(async () => {
    try {
      // Extract year from releaseYear if available
      let year: number | undefined = undefined;
      if (movie.releaseYear) {
        const parsedYear = parseInt(movie.releaseYear.toString());
        if (!isNaN(parsedYear)) {
          year = parsedYear;
        }
      }
      
      // Use the TMDB API to get a poster
      const tmdbPosterUrl = await tmdbApi.getPosterUrl(
        movie.title,
        year,
        movie.type === 'TV Show' // isTV parameter
      );
      
      if (tmdbPosterUrl) {
        console.log(`TMDB poster found for ${movie.title}`);
        setPosterUrl(tmdbPosterUrl);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching TMDB poster:', error);
      return false;
    }
  }, [movie.title, movie.releaseYear, movie.type]);

  // Handle image loading errors
  const handleImageError = useCallback(async () => {
    console.log(`Azure poster failed to load for ${movie.title}, trying TMDB...`);
    const tmdbSuccess = await fetchTMDBPoster();
    
    if (!tmdbSuccess) {
      console.log(`No TMDB poster found for ${movie.title}, using default`);
      setPosterUrl(defaultImage);
    }
  }, [fetchTMDBPoster, movie.title]);

  useEffect(() => {
    if (movie.posterUrl) {
      // Check if this is an Azure URL
      if (movie.posterUrl.includes('moviesappsa79595.blob.core.windows.net')) {
        // Use the new SAS token provided for the storage account
        const sasToken = "sp=r&st=2025-04-08T10:57:41Z&se=2026-04-08T18:57:41Z&sv=2024-11-04&sr=c&sig=pAoCi15RVSDceDfeusN0dAmD8KqKAKC4Gkjh0qaOI5I%3D";
        
        // Use the movie title to create the proper filename
        // This matches the format: "Movie Title.jpg"
        const properFileName = movie.title + '.jpg';
        
        // Format according to the correct pattern with unencoded spaces and the new SAS token
        setPosterUrl(`https://moviesappsa79595.blob.core.windows.net/movie-posters/Movie Posters/${properFileName}?${sasToken}`);
      } else {
        // If not from expected source, use as is
        setPosterUrl(movie.posterUrl);
      }
    } else {
      // No poster URL provided, try TMDB
      fetchTMDBPoster().then(success => {
        if (!success) {
          setPosterUrl(defaultImage);
        }
      });
    }
  }, [movie.posterUrl, fetchTMDBPoster]);
  
  return (
    <div style={{ 
      width: '160px', 
      height: '240px',
      marginRight: 'var(--spacing-xl)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      <img 
        src={posterUrl}
        alt={movie.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center'
        }}
        onError={async () => {
          await handleImageError();
        }}
      />
    </div>
  );
};

const RatingsPage = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [editingRating, setEditingRating] = useState<string | null>(null);
  const [newRatingValue, setNewRatingValue] = useState<number>(5);
  const [newReviewText, setNewReviewText] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Fetch user's ratings with movie details
        const fetchRatings = async () => {
          try {
            // The userId from auth response is a string, but the API expects a number
            console.log('User from localStorage:', parsedUser);
            // In the AuthController, the ID is returned as a string. Convert it to number if needed.
            const userId = parsedUser.id ? parseInt(parsedUser.id) : parsedUser.userId;
            console.log('Fetching ratings for user ID:', userId);
            
            const response = await ratingApi.getByUser(userId);
            console.log('Ratings API response:', response.data);
            setRatings(response.data);
          } catch (err) {
            console.error('Error fetching ratings:', err);
          } finally {
            setLoading(false);
          }
        };
        
        fetchRatings();
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        setLoading(false);
      }
    } else {
      // No logged in user
      setLoading(false);
    }
  }, []);

  const viewMovieDetails = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

  const deleteRating = async (rating: Rating) => {
    try {
      // Convert the userId to the same type used when fetching ratings
      const userId = user?.id ? parseInt(user.id) : rating.userId;
      await ratingApi.deleteRating(userId, rating.showId);
      setRatings(prev => prev.filter(r => 
        !(r.userId === rating.userId && r.showId === rating.showId)
      ));
    } catch (err) {
      console.error('Error deleting rating:', err);
    }
  };

  const updateRating = async (rating: Rating) => {
    try {
      // Convert the userId to the same type used when fetching ratings
      const userId = user?.id ? parseInt(user.id) : rating.userId;
      await ratingApi.addRating({
        userId: userId,
        showId: rating.showId,
        ratingValue: newRatingValue,
        reviewText: newReviewText // Use the updated review text
      });
      
      // Update local state
      setRatings(prev => prev.map(r => {
        if (r.userId === rating.userId && r.showId === rating.showId) {
          return { 
            ...r, 
            ratingValue: newRatingValue,
            reviewText: newReviewText 
          };
        }
        return r;
      }));
      
      setEditingRating(null);
    } catch (err) {
      console.error('Error updating rating:', err);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="mt-4 mb-5" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
          <h1 style={{ 
            color: 'var(--color-primary)',
            fontSize: '2.5rem',
            marginBottom: 'var(--spacing-lg)'
          }}>
            My Ratings
          </h1>
          <p style={{ marginBottom: 'var(--spacing-lg)' }}>
            Please log in to view your ratings history.
          </p>
          <Link 
            to="/login" 
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <h1 style={{ 
          textAlign: 'center', 
          color: 'var(--color-primary)',
          fontSize: '2.5rem',
          marginBottom: 'var(--spacing-lg)'
        }}>
          My Ratings
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            Loading ratings...
          </div>
        ) : ratings.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-xl)', 
            marginTop: '3rem',
            color: 'var(--color-text-light)'
          }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
              You haven't rated any movies yet
            </p>
            <Link 
              to="/movies" 
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <>
            <p style={{ 
              textAlign: 'center', 
              marginBottom: 'var(--spacing-xl)',
              color: 'var(--color-text-light)' 
            }}>
              You've rated {ratings.length} {ratings.length === 1 ? 'movie' : 'movies'}
            </p>
            <div style={{ 
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto',
              padding: '0 var(--spacing-md)'
            }}>
              {ratings.map((rating) => {
                // The API includes the movie data in each rating
                const movie = rating.movie || {
                  showId: rating.showId,
                  title: `Movie ID: ${rating.showId}`,
                  releaseYear: undefined,
                  posterUrl: undefined
                };
                return (
                  <div key={rating.showId} style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-card)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    marginBottom: 'var(--spacing-xl)',
                    width: '100%',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    cursor: 'pointer',
                    transform: 'translateZ(0)'
                    // Note: hover effects would need to be added via CSS classes
                    // since inline styles don't support pseudo-selectors
                  }}
                  onClick={(e) => {
                    // Only navigate to details if not in editing mode
                    if (editingRating !== rating.showId) {
                      viewMovieDetails(rating.showId);
                    }
                  }}>
                    <div style={{ 
                      display: 'flex',
                      padding: 'var(--spacing-xl)',
                      backgroundColor: 'var(--color-background)',
                      position: 'relative'
                    }}>
                      <MoviePoster movie={movie} />
                      
                      {/* Movie Information */}
                      <div style={{ 
                        flex: '0 1 220px',
                        marginRight: 'var(--spacing-xl)'
                      }}>
                        <h3 style={{ 
                          margin: '0 0 var(--spacing-xs) 0',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'var(--color-text)'
                        }}>
                          {movie ? movie.title : `Movie ID: ${rating.showId}`}
                        </h3>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'var(--color-text-light)',
                          fontSize: '0.9rem',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          {movie?.releaseYear && <span>{movie.releaseYear}</span>}
                        </div>
                        
                        {/* Movie description if available */}
                        {movie?.description && (
                          <div style={{
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            color: 'var(--color-text)',
                            marginBottom: 'var(--spacing-md)',
                            maxHeight: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {movie.description}
                          </div>
                        )}
                      </div>
                      
                      {/* Review Section on the right with rating info moved up */}
                      <div style={{ 
                        flex: 1,
                        minWidth: '200px',
                        borderLeft: '1px solid var(--color-border)',
                        paddingLeft: 'var(--spacing-lg)'
                      }}>
                        {/* Star Rating moved to review section */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: 'var(--color-secondary)',
                          fontWeight: 'bold',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          {/* Display clickable 5 stars with filled/empty based on rating */}
                          <div>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (editingRating === rating.showId) {
                                    setNewRatingValue(star);
                                  }
                                }}
                                style={{ 
                                  color: editingRating === rating.showId
                                    ? star <= newRatingValue
                                      ? 'var(--color-secondary)'
                                      : 'var(--color-text-light)'
                                    : star <= rating.ratingValue
                                      ? 'var(--color-secondary)'
                                      : 'var(--color-text-light)',
                                  marginRight: '6px',
                                  fontSize: '1.5rem',
                                  cursor: editingRating === rating.showId ? 'pointer' : 'default'
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Date information moved to review section */}
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--color-text-light)', 
                          marginBottom: 'var(--spacing-sm)'
                        }}>
                          Rated on: {new Date(rating.timestamp).toLocaleDateString()}
                        </div>
                        
                        {/* Review Section - Always show the heading, conditionally show edit or display */}
                        <h4 style={{ 
                          color: 'var(--color-text)', 
                          fontSize: '0.9rem',
                          fontWeight: 600, 
                          marginBottom: 'var(--spacing-xs)',
                          marginTop: 'var(--spacing-sm)'
                        }}>
                          Your Review
                        </h4>
                        
                        {editingRating === rating.showId ? (
                          <textarea
                            value={newReviewText}
                            onChange={(e) => setNewReviewText(e.target.value)}
                            style={{
                              width: '100%',
                              minHeight: '120px',
                              padding: 'var(--spacing-md)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--color-border)',
                              marginBottom: 'var(--spacing-xs)',
                              fontFamily: 'inherit',
                              fontSize: '0.95rem',
                              backgroundColor: 'var(--color-background)',
                              color: 'var(--color-text)',
                              lineHeight: '1.5',
                              resize: 'vertical'
                            }}
                            placeholder="Write your review here..."
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            marginBottom: 'var(--spacing-xs)',
                            fontFamily: 'inherit',
                            fontSize: '0.95rem',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-text)',
                            lineHeight: '1.5'
                          }}>
                            {rating.reviewText || <em style={{ color: 'var(--color-text-light)' }}>No review yet</em>}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-md) var(--spacing-lg)',
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }}>
                      {editingRating === rating.showId ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event propagation
                              setEditingRating(null);
                            }}
                            style={{
                              backgroundColor: 'var(--color-text-light)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              flex: 1,
                              marginRight: '8px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event propagation
                              updateRating(rating);
                            }}
                            style={{
                              backgroundColor: 'var(--color-success)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              flex: 1,
                              marginLeft: '8px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event propagation
                              deleteRating(rating);
                            }}
                            style={{
                              backgroundColor: 'var(--color-error)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              flex: 1,
                              marginRight: '8px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event propagation
                              setEditingRating(rating.showId);
                              setNewRatingValue(rating.ratingValue);
                              setNewReviewText(rating.reviewText || '');
                            }}
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              flex: 1,
                              margin: '0 8px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Stop event propagation
                              viewMovieDetails(rating.showId);
                            }}
                            style={{
                              backgroundColor: 'var(--color-secondary)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-sm) var(--spacing-md)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              flex: 1,
                              marginLeft: '8px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            Details
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RatingsPage;
