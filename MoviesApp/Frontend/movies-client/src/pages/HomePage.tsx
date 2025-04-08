import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Movie, movieApi } from "../services/api";
import MovieCard from "../components/MovieCard";

const HomePage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeGenres, setActiveGenres] = useState<string[]>([]);
  const pageSize = 20;
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreMovies();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

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
        console.error("Error fetching movies:", err);
        setError("Failed to load movies. Please try again later.");
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
      } else if (activeGenres.length > 0) {
        response = await movieApi.getByMultipleGenres(
          activeGenres,
          nextPage,
          pageSize
        );
      } else {
        response = await movieApi.getAll(nextPage, pageSize);
      }

      if (response.data.length === 0) {
        setHasMore(false);
      } else {
        setMovies((prev) => [...prev, ...response.data]);
        setCurrentPage(nextPage);
        setHasMore(response.data.length === pageSize);
      }
    } catch (err) {
      console.error("Error loading more movies:", err);
      // Don't show error for pagination issues
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Reset to initial state if search is cleared
      setActiveGenres([]);
      fetchInitialMovies();
      return;
    }

    try {
      setLoading(true);
      setActiveGenres([]); // Clear any active genre filter
      const response = await movieApi.searchMovies(searchTerm);
      setMovies(response.data);
      setHasMore(false); // With search, we don't implement pagination in this simple app
      setError(null);
    } catch (err) {
      console.error("Error searching movies:", err);
      setError("Failed to search movies. Please try again later.");
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
      console.error("Error fetching movies:", err);
      setError("Failed to load movies. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenreFilter = async (genre: string) => {
    // Calculate the new genres state
    const newGenres = activeGenres.includes(genre)
      ? activeGenres.filter((g) => g !== genre)
      : [...activeGenres, genre];

    // Update the state
    setActiveGenres(newGenres);

    try {
      setLoading(true);
      setSearchTerm(""); // Clear any search

      let response;
      if (newGenres.length > 0) {
        if (newGenres.length > 1) {
          response = await movieApi.getByMultipleGenres(newGenres, 1, pageSize);
        } else {
          response = await movieApi.getByGenre(newGenres[0], 1, pageSize);
        }
      } else {
        response = await movieApi.getAll(1, pageSize);
      }

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
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleMovieClick = (movieId: string) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div className="container">
      <div className="mt-4">
        {/* Register / Login CTA */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              textAlign: "center",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            Welcome to CineNiche!
          </h1>
          <p>
            Sign up or log in to start discovering personalized movie and TV
            show recommendations tailored just for you!
          </p>
          <div style={{ textAlign: "center" }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1rem",
                marginTop: "1rem",
              }}
            >
              Log In
            </button>
            <br />
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007BFF",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "1rem",
                marginTop: "1rem",
              }}
            >
              Register
            </button>
          </div>
        </div>
        {/* Company Introduction */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h3
            style={{
              fontSize: "2.8rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              textAlign: "center",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            About CineNiche
          </h3>
          <p>
            At CineNiche, we believe in bringing you the best movie and TV show
            experiences. Explore thousands of options, discover hidden gems, and
            enjoy recommendations based on your preferences. Let us help you
            find your next favorite!
          </p>
        </div>
        <div
          className="card"
          style={{
            padding: "var(--spacing-xl)",
            marginBottom: "var(--spacing-xl)",
          }}
        >
          {/* Movie Discovery Section */}
          <h2
            style={{
              fontSize: "2.8rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              textAlign: "center",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            Discover Your Next Favorite
          </h2>
          <p
            style={{
              fontSize: "1.2rem",
              color: "var(--color-text-light)",
              textAlign: "center",
              maxWidth: "800px",
              margin: "0 auto var(--spacing-xl) auto",
            }}
          >
            Explore our collection of movies and TV shows, personalize your
            recommendations, and find your perfect watch.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "700px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                margin: "0 0 var(--spacing-lg) 0",
                width: "100%",
              }}
            >
              <input
                type="text"
                placeholder="Search titles, directors, or actors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{
                  flex: 1,
                  padding: "var(--spacing-md)",
                  fontSize: "1rem",
                  borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  borderRight: "none",
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  padding: "var(--spacing-md) var(--spacing-lg)",
                  backgroundColor: "var(--color-secondary)",
                  color: "white",
                  border: "none",
                  borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Search
              </button>
            </div>

            {/* Genre filter header and clear button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-md)",
              }}
            >
              <h4 style={{ margin: 0 }}>Filter by genre:</h4>
              {(activeGenres.length > 0 || searchTerm) && (
                <button
                  onClick={() => {
                    setActiveGenres([]);
                    setSearchTerm("");
                    fetchInitialMovies();
                  }}
                  style={{
                    backgroundColor: "var(--color-error)",
                    color: "white",
                    border: "none",
                    padding: "var(--spacing-xs) var(--spacing-md)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Genre filter buttons */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--spacing-sm)",
                justifyContent: "center",
                marginBottom: "var(--spacing-md)",
              }}
            >
              {[
                // Movie genres with exact IDs matching backend controller
                { id: "action", label: "Action" },
                { id: "adventure", label: "Adventure" },
                { id: "comedy", label: "Comedy" },
                { id: "drama", label: "Drama" },
                { id: "horrormovies", label: "Horror Movies" },
                { id: "thrillers", label: "Thrillers" },
                { id: "documentaries", label: "Documentaries" },
                { id: "familymovies", label: "Family Movies" },
                { id: "fantasy", label: "Fantasy" },
                { id: "romanticmovies", label: "Romantic Movies" },
                { id: "internationalmovies", label: "International Movies" },
                { id: "musicals", label: "Musicals" },

                // TV Show genres with exact IDs matching backend controller
                { id: "tvaction", label: "TV Action" },
                { id: "tvcomedies", label: "TV Comedies" },
                { id: "tvdramas", label: "TV Dramas" },
                { id: "docuseries", label: "Docuseries" },
                { id: "kidstv", label: "Kids' TV" },
                { id: "realitytv", label: "Reality TV" },
                { id: "internationaltvshows", label: "International TV Shows" },
                { id: "crimetvshows", label: "Crime TV Shows" },
                { id: "talkshows", label: "Talk Shows" },
                { id: "animeseries", label: "Anime Series" },
                { id: "britishtvshows", label: "British TV Shows" },
                { id: "romantictvshows", label: "Romantic TV Shows" },
                { id: "languagetvshows", label: "Language TV Shows" },
                { id: "naturetv", label: "Nature TV" },
                { id: "spirituality", label: "Spirituality" },
                { id: "children", label: "Children" },
              ].map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreFilter(genre.id)}
                  style={{
                    padding: "var(--spacing-xs) var(--spacing-md)",
                    backgroundColor: activeGenres.includes(genre.id)
                      ? "var(--color-primary)"
                      : "var(--color-background)",
                    color: activeGenres.includes(genre.id)
                      ? "white"
                      : "var(--color-text)",
                    border: `1px solid ${
                      activeGenres.includes(genre.id)
                        ? "var(--color-primary)"
                        : "var(--color-border)"
                    }`,
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "all var(--transition-normal)",
                  }}
                >
                  {genre.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && !movies.length && (
        <div className="text-center mt-4">
          <p style={{ fontSize: "1.1rem" }}>Loading movies...</p>
        </div>
      )}

      {error && (
        <div
          className="card mt-4"
          style={{
            backgroundColor: "#feecec",
            borderLeft: "4px solid var(--color-error)",
          }}
        >
          <p className="text-error">{error}</p>
        </div>
      )}

      {!loading && !error && movies.length === 0 && (
        <div className="card mt-4 text-center">
          <p>No movies found. Try a different search term.</p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "var(--spacing-md)",
          marginTop: "var(--spacing-lg)",
        }}
      >
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

      {loading && movies.length > 0 && (
        <div className="text-center mt-4 mb-4">
          <p style={{ color: "var(--color-text-light)" }}>
            Loading more movies...
          </p>
        </div>
      )}

      {!hasMore && movies.length > 0 && !loading && (
        <div className="text-center mt-4 mb-4">
          <p style={{ color: "var(--color-text-light)" }}>
            You've reached the end of the list
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
