import { useEffect, useState } from 'react';
import { Movie, Rating, User, ratingApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import { Link, useNavigate } from 'react-router-dom';

const RatingsPage = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratedMovies, setRatedMovies] = useState<Map<string, Movie>>(new Map());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [editingRating, setEditingRating] = useState<string | null>(null);
  const [newRatingValue, setNewRatingValue] = useState<number>(5);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Fetch user's ratings
        const fetchRatings = async () => {
          try {
            const response = await ratingApi.getByUser(parsedUser.userId);
            setRatings(response.data);
            
            // We need to fetch the movie details for each rated movie
            // This would typically come from the backend, but for this demo
            // we'll use the movies stored in localStorage
            const moviesJson = localStorage.getItem('cachedMovies');
            if (moviesJson) {
              const movies: Movie[] = JSON.parse(moviesJson);
              const moviesMap = new Map<string, Movie>();
              
              for (const movie of movies) {
                moviesMap.set(movie.showId, movie);
              }
              
              setRatedMovies(moviesMap);
            }
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
      await ratingApi.deleteRating(rating.userId, rating.showId);
      setRatings(prev => prev.filter(r => 
        !(r.userId === rating.userId && r.showId === rating.showId)
      ));
    } catch (err) {
      console.error('Error deleting rating:', err);
    }
  };

  const updateRating = async (rating: Rating) => {
    try {
      await ratingApi.addRating({
        userId: rating.userId,
        showId: rating.showId,
        ratingValue: newRatingValue
      });
      
      // Update local state
      setRatings(prev => prev.map(r => {
        if (r.userId === rating.userId && r.showId === rating.showId) {
          return { ...r, ratingValue: newRatingValue };
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
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 'var(--spacing-xl)',
              padding: '0 var(--spacing-md)'
            }}>
              {ratings.map((rating) => {
                const movie = ratedMovies.get(rating.showId);
                return (
                  <div key={rating.showId} style={{ 
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-card)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ 
                      display: 'flex',
                      padding: 'var(--spacing-md)',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)'
                    }}>
                      <div style={{ 
                        width: '80px', 
                        height: '120px',
                        backgroundImage: movie ? `url(${movie.posterUrl || "https://via.placeholder.com/80x120?text=No+Image"})` : "url(https://via.placeholder.com/80x120?text=No+Image)",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        marginRight: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0
                      }} />
                      <div>
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
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: 'var(--color-secondary)',
                          fontWeight: 'bold'
                        }}>
                          <span style={{ marginRight: '4px' }}>★</span>
                          {editingRating === rating.showId ? (
                            <select 
                              value={newRatingValue}
                              onChange={(e) => setNewRatingValue(Number(e.target.value))}
                              style={{
                                padding: '2px 4px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)'
                              }}
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                                <option key={value} value={value}>{value}</option>
                              ))}
                            </select>
                          ) : (
                            <span>{rating.ratingValue}/10</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                          Rated on: {new Date(rating.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: 'var(--spacing-sm)'
                    }}>
                      {editingRating === rating.showId ? (
                        <>
                          <button
                            onClick={() => setEditingRating(null)}
                            style={{
                              backgroundColor: 'var(--color-text-light)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              flex: 1,
                              marginRight: '4px'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updateRating(rating)}
                            style={{
                              backgroundColor: 'var(--color-success)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              flex: 1,
                              marginLeft: '4px'
                            }}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => deleteRating(rating)}
                            style={{
                              backgroundColor: 'var(--color-error)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              flex: 1,
                              marginRight: '4px'
                            }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              setEditingRating(rating.showId);
                              setNewRatingValue(rating.ratingValue);
                            }}
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              flex: 1,
                              marginLeft: '4px',
                              marginRight: '4px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => viewMovieDetails(rating.showId)}
                            style={{
                              backgroundColor: 'var(--color-secondary)',
                              color: 'white',
                              border: 'none',
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              flex: 1,
                              marginLeft: '4px'
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
