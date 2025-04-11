import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import { movieApi, Movie } from "../services/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface HomeRecommenderProps {
  userId: string | null;
}

// ----------------------------------------------------
// 1) Global cache + updated preloadImage function
// ----------------------------------------------------
const imageCache = new Set<string>();

const preloadImage = (url?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(true);
      return;
    }
    // If already cached, skip
    if (imageCache.has(url)) {
      resolve(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.add(url);
      resolve(true);
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${url}`);
      resolve(false);
    };
    img.src = url;
  });
};

// ----------------------------------------------------
// Environment-based API URL
// ----------------------------------------------------
const getRecommendationApiUrl = () => {
  return window.location.hostname !== "localhost"
    ? "https://moviesapp-recommendation-service.azurewebsites.net"
    : "http://localhost:8001";
};

const RECOMMENDATION_API_URL = getRecommendationApiUrl();

interface RecommendationData {
  collaborative: string[];
  contentBased: string[];
  genres: Record<string, string[]>;
}

// ----------------------------------------------------
// Navigation Arrow for left/right scroll
// ----------------------------------------------------
const NavigationArrow = ({
  direction,
  onClick,
  disabled,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 10,
        width: "40px",
        height: "40px",
        backgroundColor: disabled ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.6)",
        color: "white",
        borderRadius: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        ...(direction === "left" ? { left: "0" } : { right: "0" }),
      }}
    >
      {direction === "left" ? "←" : "→"}
    </button>
  );
};

// ----------------------------------------------------
// SingleMovieCard (REMOVED internal preloading)
// ----------------------------------------------------
interface SingleMovieCardProps {
  movie: Movie;
  onClick: (id: string) => void;
}

const SingleMovieCard: React.FC<SingleMovieCardProps> = ({ movie, onClick }) => {
  return (
    <div
      style={{
        width: "200px",
        height: "300px",
        position: "relative",
        margin: "0 auto",
      }}
    >
      {/* Directly render the actual card. 
          Image flash is prevented by preloading in MoviePage. */}
      <div style={{ width: "100%", height: "100%" }}>
        <MovieCard movie={movie} onClick={() => onClick(movie.showId)} />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// MoviePage that preloads all images in parallel
// ----------------------------------------------------
interface MoviePageProps {
  movies: Movie[];
  onMovieClick: (id: string) => void;
  pageKey: string; // Unique key for this page of movies
}

const MoviePage: React.FC<MoviePageProps> = ({ movies, onMovieClick, pageKey }) => {
  const [allLoaded, setAllLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadAllImages = async () => {
      setAllLoaded(false);

      // Preload all images before showing
      const loadPromises = movies.map((movie) => preloadImage(movie.posterUrl));
      await Promise.all(loadPromises);

      setAllLoaded(true);
    };

    loadAllImages();
  }, [movies]);

  // Show skeleton placeholders if not fully loaded
  if (!allLoaded) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "1.5rem",
          width: "100%",
        }}
      >
        {movies.map((_, index) => (
          <div
            key={`loading-${index}`}
            style={{
              width: "200px",
              height: "300px",
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative", // needed for the shimmer
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "200%",
                height: "100%",
                background:
                  "linear-gradient(to right, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)",
                animation: "shimmer 2s infinite linear",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // Once fully loaded, show actual movies
  return (
    <div
      key={pageKey}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "1.5rem",
        width: "100%",
      }}
    >
      {movies.map((movie) => (
        <SingleMovieCard
          key={movie.showId}
          movie={movie}
          onClick={onMovieClick}
        />
      ))}
    </div>
  );
};

// ----------------------------------------------------
// RecommendationSection with scroll logic
// ----------------------------------------------------
interface RecommendationSectionProps {
  title: string;
  movies: Movie[];
  sectionType: string;
  userId: string | null;
  onMovieClick: (id: string) => void;
  onLoadMore?: (sectionType: string, page: number) => Promise<Movie[]>;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  movies,
  sectionType,
  userId,
  onMovieClick,
  onLoadMore,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [loadedPages, setLoadedPages] = useState<number[]>([0]);
  const [allMovies, setAllMovies] = useState<Movie[]>(movies);
  const [isLoading, setIsLoading] = useState(false);

  const moviesPerPage = 5;

  // The total number of pages we can scroll through
  const totalPages = Math.max(
    Math.ceil(allMovies.length / moviesPerPage),
    loadedPages.length + 1
  );

  // Current slice of movies
  const getCurrentPageMovies = (page: number) => {
    return allMovies.slice(page * moviesPerPage, (page + 1) * moviesPerPage);
  };

  useEffect(() => {
    setAllMovies(movies);
  }, [movies]);

  const scrollPrev = () => {
    if (currentPage > 0 && !isLoading) {
      setCurrentPage(currentPage - 1);
    }
  };

  const scrollNext = async () => {
    if (currentPage < totalPages - 1 && !isLoading) {
      const targetPage = currentPage + 1;

      // Check if we need to load more from the API
      if (!loadedPages.includes(targetPage) && onLoadMore && userId) {
        setIsLoading(true);
        try {
          const newMovies = await onLoadMore(sectionType, targetPage);

          if (newMovies && newMovies.length > 0) {
            setAllMovies((prevMovies) => {
              const existingIds = new Set(prevMovies.map((m) => m.showId));
              const uniqueNewMovies = newMovies.filter(
                (m) => !existingIds.has(m.showId)
              );
              return [...prevMovies, ...uniqueNewMovies];
            });
          }

          // Mark the page as loaded
          setLoadedPages((prev) => [...prev, targetPage]);
        } catch (err) {
          console.error(`Error loading more ${sectionType} recommendations:`, err);
          setLoadedPages((prev) => [...prev, targetPage]);
        } finally {
          setIsLoading(false);
        }
      }

      setCurrentPage(targetPage);
    }
  };

  if (allMovies.length === 0) return null;

  const pageKey = `${sectionType}-page-${currentPage}`;
  const visibleMovies = getCurrentPageMovies(currentPage);

  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <h3
        style={{
          marginBottom: "1rem",
          fontSize: "1.5rem",
          fontWeight: 600,
          color: "var(--color-primary)",
        }}
      >
        {title}
      </h3>
      <div style={{ position: "relative" }}>
        <NavigationArrow
          direction="left"
          onClick={scrollPrev}
          disabled={currentPage === 0 || isLoading}
        />
        <div
          style={{
            position: "relative",
            paddingBottom: "1rem",
            paddingLeft: "40px",
            paddingRight: "40px",
            overflow: "hidden",
            height: "395px",
            backgroundColor: "transparent",
          }}
        >
          <MoviePage
            movies={visibleMovies}
            onMovieClick={onMovieClick}
            pageKey={pageKey}
          />
        </div>
        <NavigationArrow
          direction="right"
          onClick={scrollNext}
          disabled={currentPage >= totalPages - 1 || isLoading}
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Main HomeRecommender component
// ----------------------------------------------------
const HomeRecommender: React.FC<HomeRecommenderProps> = ({ userId }) => {
  const [collaborativeMovies, setCollaborativeMovies] = useState<Movie[]>([]);
  const [contentBasedMovies, setContentBasedMovies] = useState<Movie[]>([]);
  const [genreMovies, setGenreMovies] = useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Format genre name for display
  const formatGenreName = (genreKey: string): string => {
    const formatted = genreKey
      .replace(/([A-Z])/g, " $1")
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
      setError(null);

      try {
        let recommendationsData: RecommendationData | null = null;

        // Try the recommendation API
        try {
          const apiResponse = await axios.get(
            `${RECOMMENDATION_API_URL}/recommendations/${userId}`
          );
          recommendationsData = apiResponse.data;
          console.log("Recommendation API response:", recommendationsData);
        } catch (apiErr) {
          console.warn(
            "Could not fetch from recommendation API, falling back to static file:",
            apiErr
          );

          // Fallback to the static file
          const fallbackResponse = await fetch("/homeRecommendations.json");
          if (!fallbackResponse.ok) {
            throw new Error("Failed to fetch recommendations JSON.");
          }

          const staticData = await fallbackResponse.json();
          if (!staticData[userId]) {
            throw new Error("No recommendations found for this user.");
          }

          // Convert old format to new
          recommendationsData = {
            collaborative: staticData[userId],
            contentBased: [],
            genres: {},
          };
        }

        if (!recommendationsData) {
          throw new Error("No recommendations data available.");
        }

        // Collab-based
        if (
          recommendationsData.collaborative &&
          recommendationsData.collaborative.length > 0
        ) {
          const movieResponses = await Promise.all(
            recommendationsData.collaborative.map(async (id) => {
              try {
                const dbStyleId = id.startsWith("s")
                  ? id
                  : `s${id.replace(/\D/g, "")}`;
                const movieResponse = await movieApi.getById(dbStyleId);

                if (movieResponse.data?.showId && movieResponse.data?.title) {
                  return movieResponse.data;
                } else {
                  console.warn(`Movie ${id} data is incomplete - skipping`);
                  return null;
                }
              } catch (err) {
                console.warn(`Failed to fetch movie ${id}:`, err);
                return null;
              }
            })
          );

          const validMovies = movieResponses.filter(
            (m) => m && m.showId && m.title
          ) as Movie[];
          setCollaborativeMovies(validMovies);
        }

        // Content-based
        if (
          recommendationsData.contentBased &&
          recommendationsData.contentBased.length > 0
        ) {
          const movieResponses = await Promise.all(
            recommendationsData.contentBased.map(async (id) => {
              try {
                const dbStyleId = id.startsWith("s")
                  ? id
                  : `s${id.replace(/\D/g, "")}`;
                const movieResponse = await movieApi.getById(dbStyleId);

                if (movieResponse.data?.showId && movieResponse.data?.title) {
                  return movieResponse.data;
                } else {
                  console.warn(`Movie ${id} data is incomplete - skipping`);
                  return null;
                }
              } catch (err) {
                console.warn(`Failed to fetch movie ${id}:`, err);
                return null;
              }
            })
          );

          const validMovies = movieResponses.filter(
            (m) => m && m.showId && m.title
          ) as Movie[];
          setContentBasedMovies(validMovies);
        }

        // Genre-based
        if (recommendationsData.genres) {
          const genreResults: Record<string, Movie[]> = {};

          for (const [genre, movieIds] of Object.entries(
            recommendationsData.genres
          )) {
            if (movieIds.length > 0) {
              const movieResponses = await Promise.all(
                movieIds.map(async (id) => {
                  try {
                    const dbStyleId = id.startsWith("s")
                      ? id
                      : `s${id.replace(/\D/g, "")}`;
                    const movieResponse = await movieApi.getById(dbStyleId);

                    if (
                      movieResponse.data?.showId &&
                      movieResponse.data?.title
                    ) {
                      return movieResponse.data;
                    } else {
                      console.warn(`Movie ${id} data is incomplete - skipping`);
                      return null;
                    }
                  } catch (err) {
                    console.warn(`Failed to fetch movie ${id}:`, err);
                    return null;
                  }
                })
              );

              const validMovies = movieResponses.filter(
                (m) => m && m.showId && m.title
              ) as Movie[];

              if (validMovies.length > 0) {
                genreResults[genre] = validMovies;
              }
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

  // Additional function to load more from the backend
  const loadMoreRecommendations = async (
    section: string,
    page: number
  ): Promise<Movie[]> => {
    if (!userId) return [];
    try {
      const limit = 10;
      const response = await axios.get(
        `${RECOMMENDATION_API_URL}/recommendations/${userId}/more`,
        { params: { section, page, limit } }
      );

      let movieIds: string[] = [];
      if (section === "collaborative" && response.data.collaborative) {
        movieIds = response.data.collaborative;
      } else if (section === "contentBased" && response.data.contentBased) {
        movieIds = response.data.contentBased;
      } else if (response.data.genres && response.data.genres[section]) {
        movieIds = response.data.genres[section];
      }

      if (!movieIds.length) return [];

      const movies = await Promise.all(
        movieIds.map(async (id) => {
          try {
            const dbStyleId = id.startsWith("s")
              ? id
              : `s${id.replace(/\D/g, "")}`;
            const movieResponse = await movieApi.getById(dbStyleId);

            if (movieResponse.data?.showId && movieResponse.data?.title) {
              return movieResponse.data;
            }
            return null;
          } catch (err) {
            console.warn(`Failed to fetch movie ${id}:`, err);
            return null;
          }
        })
      );

      const validMovies = movies.filter(
        (m) => m && m.showId && m.title
      ) as Movie[];
      return validMovies;
    } catch (err) {
      console.error(`Error loading more recommendations for ${section}:`, err);
      return [];
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        Loading your personalized recommendations...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem 0", color: "var(--color-error)" }}>
        {error}
      </div>
    );
  }

  const hasRecommendations =
    collaborativeMovies.length > 0 ||
    contentBasedMovies.length > 0 ||
    Object.values(genreMovies).some((movies) => movies.length > 0);

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
          color: "var(--color-primary)",
        }}
      >
        Your Personalized Recommendations
      </h2>

      {collaborativeMovies.length > 0 && (
        <RecommendationSection
          title="Movies Similar Users Enjoyed"
          movies={collaborativeMovies}
          sectionType="collaborative"
          userId={userId}
          onMovieClick={handleMovieClick}
          onLoadMore={loadMoreRecommendations}
        />
      )}

      {contentBasedMovies.length > 0 && (
        <RecommendationSection
          title="Based on Your Taste"
          movies={contentBasedMovies}
          sectionType="contentBased"
          userId={userId}
          onMovieClick={handleMovieClick}
          onLoadMore={loadMoreRecommendations}
        />
      )}

      {Object.entries(genreMovies).map(([genre, movies]) =>
        movies.length > 0 ? (
          <RecommendationSection
            key={genre}
            title={`Recommended in ${formatGenreName(genre)}`}
            movies={movies}
            sectionType={genre}
            userId={userId}
            onMovieClick={handleMovieClick}
            onLoadMore={loadMoreRecommendations}
          />
        ) : null
      )}
    </div>
  );
};

export default HomeRecommender;
