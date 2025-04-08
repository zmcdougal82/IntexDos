import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import MovieCard from './MovieCard';
import { movieApi, Movie } from '../services/api';

interface RecommendedMoviesProps {
  showId: string | undefined;
}

interface CSVRow {
  show_id: string;
  Recommendation1: string;
  Recommendation2: string;
  Recommendation3: string;
  Recommendation4: string;
  Recommendation5: string;
}

const RecommendedMovies: React.FC<RecommendedMoviesProps> = ({ showId }) => {
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [recommendedShowIds, setRecommendedShowIds] = useState<string[]>([]); // To store recommended show IDs
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndParseCSV = async () => {
      setLoading(true);
      setError(null); // Reset error state before fetching

      try {
        // Fetch the CSV file
        const response = await fetch('/contentRecommendations.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch the recommendations CSV.');
        }

        const csvText = await response.text();

        // Parse the CSV
        Papa.parse<CSVRow>(csvText, {
          header: true,
          complete: async (results) => {
            // Ensure TypeScript knows the type of results.data is CSVRow[]
            const filtered = (results.data as CSVRow[]).filter(
              (row) => row.show_id === showId
            );

            if (filtered.length === 0) {
              setError('No recommendations found for this show.');
              setLoading(false);
              return;
            }

            // Get the list of recommended showIds (Recommendation1 to Recommendation5)
            const recommendedShowIds = [
              filtered[0].Recommendation1,
              filtered[0].Recommendation2,
              filtered[0].Recommendation3,
              filtered[0].Recommendation4,
              filtered[0].Recommendation5,
            ].filter((id) => id); // Filter out any empty/null/undefined values

            // Store the recommended showIds to display them
            setRecommendedShowIds(recommendedShowIds);

            // Fetch the recommended movies based on these showIds
            const movieResponses = await Promise.all(
              recommendedShowIds.map(async (id: string) => {
                // Use movieApi.getById to fetch movie details by showId
                const movieResponse = await movieApi.getById(id);
                return movieResponse.data; // Return the movie data
              })
            );

            // Flatten the movie data array (in case each response returns multiple movies)
            const allRecommendedMovies = movieResponses.flat();

            // Set the state with the fetched movie data
            setRecommendedMovies(allRecommendedMovies);
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
    return <div>No recommendations available for show {showId}.</div>;
  }

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>
        Based on this movie/show, we recommend:
      </h2>

      {/* Display the recommended showIds above the movie cards */}
      <div style={{ marginBottom: '1.5rem' }}>
        <strong>Recommended Show IDs:</strong>
        <div>
          <p>Current showId: {showId}</p>
          {recommendedShowIds.join(', ')} {/* Print all the IDs */}
        </div>
      </div>

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
