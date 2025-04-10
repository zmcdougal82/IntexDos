import { useEffect, useState } from "react";
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
    return "https://moviesapp-recommendations.azurewebsites.net";
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

const RecommendationSection = ({ 
  title, 
  movies, 
  onMovieClick 
}: { 
  title: string; 
  movies: Movie[]; 
  onMovieClick: (id: string) => void;
}) => {
  if (movies.length === 0) return null;

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
      <div style={{
        display: "flex",
        overflowX: "auto",
        gap: "1.5rem",
        paddingBottom: "1rem",
      }}>
        {movies.map((movie) => (
          <div key={movie.showId} style={{ flexShrink: 0, width: "200px" }}>
            <MovieCard
              movie={movie}
              onClick={() => onMovieClick(movie.showId)}
            />
          </div>
        ))}
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
                const movieResponse = await movieApi.getById(id);
                return movieResponse.data;
              } catch (err) {
                console.warn(`Failed to fetch movie ${id}:`, err);
                return null;
              }
            })
          );

          setCollaborativeMovies(movieResponses.filter(movie => movie !== null) as Movie[]);
        }
        
        // Process content-based recommendations
        if (recommendationsData.contentBased && recommendationsData.contentBased.length > 0) {
          const movieResponses = await Promise.all(
            recommendationsData.contentBased.map(async (id) => {
              try {
                const movieResponse = await movieApi.getById(id);
                return movieResponse.data;
              } catch (err) {
                console.warn(`Failed to fetch movie ${id}:`, err);
                return null;
              }
            })
          );

          setContentBasedMovies(movieResponses.filter(movie => movie !== null) as Movie[]);
        }
        
        // Process genre-based recommendations
        if (recommendationsData.genres) {
          const genreResults: Record<string, Movie[]> = {};
          
          for (const [genre, movieIds] of Object.entries(recommendationsData.genres)) {
            if (movieIds.length > 0) {
              const movieResponses = await Promise.all(
                movieIds.map(async (id) => {
                  try {
                    const movieResponse = await movieApi.getById(id);
                    return movieResponse.data;
                  } catch (err) {
                    console.warn(`Failed to fetch movie ${id}:`, err);
                    return null;
                  }
                })
              );
              
              genreResults[genre] = movieResponses.filter(movie => movie !== null) as Movie[];
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
          onMovieClick={handleMovieClick}
        />
      )}
      
      {/* Content-based recommendations */}
      {contentBasedMovies.length > 0 && (
        <RecommendationSection 
          title="Based on Your Taste"
          movies={contentBasedMovies}
          onMovieClick={handleMovieClick}
        />
      )}
      
      {/* Genre-based recommendations */}
      {Object.entries(genreMovies).map(([genre, movies]) => (
        movies.length > 0 && (
          <RecommendationSection 
            key={genre}
            title={`Recommended in ${formatGenreName(genre)}`}
            movies={movies}
            onMovieClick={handleMovieClick}
          />
        )
      ))}
    </div>
  );
};

export default HomeRecommender;
