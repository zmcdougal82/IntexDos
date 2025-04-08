import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, movieApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const HomePage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const pageSize = 20;
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMovies();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await movieApi.getAll(1, pageSize);
        setMovies(response.data);
        setHasMore(response.data.length === pageSize);
        setCurrentPage(1);
        setError(null);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);
  
  const loadMoreMovies = async () => {
    if (!hasMore || loading) return;
    
    try {
      setLoading(true);
      const nextPage = currentPage + 1;
      
      let response;
      if (searchTerm) {
        // When searching, we don't use pagination in this simple implementation
        return;
      } else if (activeGenre) {
        response = await movieApi.getByGenre(activeGenre, nextPage, pageSize);
      } else {
        response = await movieApi.getAll(nextPage, pageSize);
      }
      
      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        setMovies(prev => [...prev, ...response.data]);
        setCurrentPage(nextPage);
        setHasMore(response.data.length === pageSize);
      }
    } catch (err) {
      console.error('Error loading more movies:', err);
      // Don't show error for pagination issues
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Reset to initial state if search is cleared
      setActiveGenre(null);
      fetchInitialMovies();
      return;
    }
    
    try {
      setLoading(true);
      setActiveGenre(null); // Clear any active genre filter
      const response = await movieApi.searchMovies(searchTerm);
      setMovies(response.data);
      setHasMore(false); // With search, we don't implement pagination in this simple app
      setError(null);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Failed to search movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInitialMovies = async () => {
    try {
      setLoading(true);
      const response = await movieApi.getAll(1, pageSize);
      setMovies(response.data);
      setHasMore(response.data.length === pageSize);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenreFilter = async (genre: string) => {
    if (activeGenre === genre) {
      // If clicking the same genre, remove filter
      setActiveGenre(null);
      fetchInitialMovies();
      return;
    }
    
    try {
      setLoading(true);
      setSearchTerm(''); // Clear any search
      setActiveGenre(genre);
      const response = await movieApi.getByGenre(genre, 1, pageSize);
      setMovies(response.data);
      setHasMore(response.data.length === pageSize);
      setCurrentPage(1);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${genre} movies:`, err);
      setError(`Failed to load ${genre} movies. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleMovieClick = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Movies Collection</h1>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        margin: '20px 0',
        maxWidth: '100%'
      }}>
        <div style={{ 
          display: 'flex',
          margin: '0 0 20px 0',
          maxWidth: '600px'
        }}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '16px',
              borderRadius: '4px 0 0 4px',
              border: '1px solid #ccc',
              borderRight: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0078d4',
              color: 'white',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>
        
        {/* Genre filter buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {['action', 'adventure', 'comedy', 'drama', 'horror', 'thriller'].map(genre => (
            <button
              key={genre}
              onClick={() => handleGenreFilter(genre)}
              style={{
                padding: '8px 16px',
                backgroundColor: activeGenre === genre ? '#0078d4' : '#f0f0f0',
                color: activeGenre === genre ? 'white' : '#333',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Loading movies...</p>}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!loading && !error && movies.length === 0 && (
        <p>No movies found. Try a different search term.</p>
      )}
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start'
      }}>
        {movies.map((movie, index) => {
          if (movies.length === index + 1) {
            return (
              <div key={movie.showId} ref={lastMovieElementRef}>
                <MovieCard 
                  movie={movie} 
                  onClick={() => handleMovieClick(movie.showId)}
                />
              </div>
            );
          } else {
            return (
              <MovieCard 
                key={movie.showId} 
                movie={movie} 
                onClick={() => handleMovieClick(movie.showId)}
              />
            );
          }
        })}
      </div>
      
      {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading more movies...</p>}
      {!hasMore && movies.length > 0 && !loading && (
        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          You've reached the end of the list
        </p>
      )}
    </div>
  );
};

export default HomePage;
