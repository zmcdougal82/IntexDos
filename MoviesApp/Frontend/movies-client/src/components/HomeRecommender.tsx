import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import { movieApi, Movie } from "../services/api";
import { useNavigate } from "react-router-dom";

interface HomeRecommender {
  userId: string | null; // Accept userId as string or null
}

const RecommendedMovies: React.FC<HomeRecommender> = ({ userId }) => {
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate(); // Get the navigate function

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setError("User ID is required.");
        return;
      }

      setLoading(true);
      setError(null); // Reset error state before fetching

      try {
        // Fetch the recommendations JSON file
        const response = await fetch("/recommendations.json");
        if (!response.ok) {
          throw new Error("Failed to fetch recommendations JSON.");
        }

        const recommendationsData = await response.json();

        // Check if the userId exists in the recommendations data
        if (!recommendationsData[userId]) {
          setError("No recommendations found for this user.");
          setLoading(false);
          return;
        }

        const recommendedShowIds = recommendationsData[userId]; // This should be an array of show IDs

        // Fetch the recommended movies based on these showIds
        const movieResponses = await Promise.all(
          recommendedShowIds.map(async (id: string) => {
            const movieResponse = await movieApi.getById(id);
            return movieResponse.data; // Return the movie data
          })
        );

        const allRecommendedMovies = movieResponses.flat(); // Flatten if needed

        setRecommendedMovies(allRecommendedMovies);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError("Failed to fetch recommendations.");
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <h2
        style={{
          marginBottom: "1.5rem",
          paddingTop: "1.0rem",
          textAlign: "center",
        }}
      >
        Top Recommendations for You
      </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        {recommendedMovies.length > 0 ? (
          recommendedMovies.map((movie) => (
            <MovieCard
              key={movie.showId} // Ensure this corresponds to the correct field in the movie API response
              movie={movie}
              onClick={() => navigate(`/movie/${movie.showId}`)} // Use movie.user_id if showId is incorrect
            />
          ))
        ) : (
          <div>No recommendations available.</div>
        )}
      </div>
    </div>
  );
};

export default RecommendedMovies;
