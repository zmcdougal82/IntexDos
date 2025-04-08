import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, movieApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const HomePage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await movieApi.getAll();
        setMovies(response.data);
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

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const response = await movieApi.searchMovies(searchTerm);
      setMovies(response.data);
      setError(null);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Failed to search movies. Please try again later.');
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
        margin: '20px 0',
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
        {movies.map(movie => (
          <MovieCard 
            key={movie.showId} 
            movie={movie} 
            onClick={() => handleMovieClick(movie.showId)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePage;
