import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import MovieCard from './MovieCard';
import { movieApi, Movie } from '../services/api';

interface RecommendedMoviesProps {
  showId: string;
}

const RecommendedMovies: React.FC<RecommendedMoviesProps> = ({ showId }) => {
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndParseCSV = async () => {
      setLoading(true);
      setError(null); // Reset error state before fetching

      try {
        // Fetch the CSV file
        const response = await fetch('/showRecommendations.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch the recommendations CSV.');
        }

        const csvText = await response.text();

        // Parse the CSV
        Papa.parse(csvText, {
          header: true,
          complete: async (results) => {
            // Filter the rows by the current showId
            const filtered = results.data.filter(
              (row: any) => row.show_id === showId
            );

            if (filtered.length === 0) {
              setError('No recommendations found for this show.');
              setLoading(false);
              return;
            }

            // Get the list of recommended movie IDs (up to 5)
            const recommendedIds = filtered
              .map((row: any) => row.recommended_movie_id)
              .slice(0, 5);

            // Fetch all movies from the API
            const movieResponse = await movieApi.getAll();
            const allMovies = movieResponse.data;

            // Filter the recommended movies based on the IDs
            const recommendedMoviesData = allMovies.filter((movie) =>
              recommendedIds.includes(movie.showId)
            );

            setRecommendedMovies(recommendedMoviesData);
            setLoading(false);
          },
          error: (parseError: any) => {
            console.error('CSV parsing error:', parseError);
            setError('Error parsing CSV file.');
            setLoading(false);
          },
        });
      } catch (err) {
        console.error('Error fetching recommendations CSV:', err);
        setError('Failed to fetch recommendations.');
        setLoading(false);
      }
    };

    if (showId) {
      fetchAndParseCSV();
    }
  }, [showId]);

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (recommendedMovies.length === 0) {
    return <div>No recommendations available.</div>;
  }

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>
        Based on this movie/show, we recommend:
      </h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          justifyContent: 'center',
        }}
      >
        {recommendedMovies.map((movie, idx) => (
          <MovieCard key={idx} movie={movie} />
        ))}
      </div>
    </div>
  );
};

export default RecommendedMovies;
