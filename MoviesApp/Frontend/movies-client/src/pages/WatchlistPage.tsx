import { useEffect, useState } from 'react';
import { Movie } from '../services/api';
import MovieCard from '../components/MovieCard';
import { Link, useNavigate } from 'react-router-dom';

const WatchlistPage = () => {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load watchlist from localStorage
    const loadWatchlist = () => {
      try {
        const savedWatchlist = localStorage.getItem('watchlist');
        if (savedWatchlist) {
          setWatchlist(JSON.parse(savedWatchlist));
        }
      } catch (err) {
        console.error('Error loading watchlist:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  const removeFromWatchlist = (movieId: string) => {
    const updatedWatchlist = watchlist.filter(movie => movie.showId !== movieId);
    setWatchlist(updatedWatchlist);
    localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
  };

  const viewMovieDetails = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <h1 style={{ 
          textAlign: 'center', 
          color: 'var(--color-primary)',
          fontSize: '2.5rem',
          marginBottom: 'var(--spacing-lg)'
        }}>
          My Watchlist
        </h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            Loading watchlist...
          </div>
        ) : watchlist.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--spacing-xl)', 
            marginTop: '3rem',
            color: 'var(--color-text-light)'
          }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
              Your watchlist is empty
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
              {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} in your watchlist
            </p>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--spacing-lg)',
              padding: '0 var(--spacing-md)'
            }}>
              {watchlist.map((movie) => (
                <div key={movie.showId} style={{ position: 'relative' }}>
                  <MovieCard 
                    movie={movie} 
                    onClick={() => viewMovieDetails(movie.showId)} 
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: 'var(--spacing-sm)'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(movie.showId);
                      }}
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
                      Remove
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewMovieDetails(movie.showId);
                      }}
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
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
