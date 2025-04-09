import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie, movieApi, User } from '../services/api';
import MovieCard from '../components/MovieCard';
import { recommendationApi } from '../services/api';

const HomePage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user from localStorage:", e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user || !user.id) return;

      try {
        setLoading(true);

        const showIds = ["s8381", "s3466", "s3181"];
        const results = await recommendationApi.getRecommendations(user.id, showIds);

        const recommendedIds = results.map((rec: any) => rec.show_id);

        const movieResponses = await Promise.all(
          recommendedIds.map((id: string) => movieApi.getById(id))
        );

        const recommendedMovies = movieResponses.map((res) => res.data);

        setMovies(recommendedMovies);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        setError("Could not load personalized recommendations.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecommendations();
    }
  }, [user]);

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

  const handleGenreFilter = async (genre: string) => {
    const newGenres = activeGenres.includes(genre)
      ? activeGenres.filter((g) => g !== genre)
      : [...activeGenres, genre];

    setActiveGenres(newGenres);

    try {
      setLoading(true);
      const response = newGenres.length > 1
        ? await movieApi.getByMultipleGenres(newGenres)
        : await movieApi.getByGenre(newGenres[0]);
      setMovies(response.data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching genre movies:`, err);
      setError(`Failed to load ${genre} movies.`);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="container">
      <div className="header">
        <input
          type="text"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-error">{error}</p>}
      {!loading && movies.length === 0 && <p>No movies found.</p>}

      <div className="movie-grid">
        {movies.map((movie) => (
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
