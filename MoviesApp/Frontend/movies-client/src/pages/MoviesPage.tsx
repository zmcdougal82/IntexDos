import { useEffect, useState } from "react";
import { Movie, movieApi } from "../services/api";
import MovieCard from "../components/MovieCard";
import { useNavigate } from "react-router-dom";

const MoviesPage = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<string>("title");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const minItemsToDisplay = 12;
  const navigate = useNavigate();

  const fetchMovies = async (pageNum: number, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      let response;

      // Handle case when both search query and genres are selected
      if (searchQuery && selectedGenres.length > 0) {
        // First search by query and field
        const searchResponse = await movieApi.searchMovies(searchQuery, searchField, pageNum);
        // Then filter those results by selected genres (client-side filtering)
        response = {
          ...searchResponse,
          data: searchResponse.data.filter(item => {
            // Check if the item has any of the selected genres
            return selectedGenres.some(genre => (item as any)[genre] === 1);
          })
        };
      } else if (searchQuery) {
        response = await movieApi.searchMovies(searchQuery, searchField, pageNum);
      } else if (selectedGenres.length > 0) {
        // Use the multi-genre endpoint when multiple genres are selected
        response = await movieApi.getByMultipleGenres(selectedGenres, pageNum);
      } else {
        response = await movieApi.getAll(pageNum);
      }

      // Filter to only include movies (exclude TV shows)
      const moviesOnly = response.data.filter((item) => item.type === "Movie");

      if (pageNum === 1) {
        setMovies(moviesOnly);
      } else {
        setMovies((prev) => [...prev, ...moviesOnly]);
      }

      // Determine if there are more results to load
      setHasMore(response.data.length > 0);

      return moviesOnly;
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Failed to load movies. Please try again later.");
      return [];
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  // Initial load of movies
  useEffect(() => {
    const loadInitialMovies = async () => {
      const initialMovies = await fetchMovies(1, true);

      // If we don't have enough movies after filtering, load more automatically
      let currentPage = 1;
      let currentMovies = [...initialMovies];

      while (currentMovies.length < minItemsToDisplay && hasMore) {
        currentPage++;
        const moreMovies = await fetchMovies(currentPage, false);
        if (moreMovies.length === 0) break; // No more movies available
        currentMovies = [...currentMovies, ...moreMovies];
        setPage(currentPage);
      }
    };

    loadInitialMovies();
  }, [selectedGenres]);

  const loadMore = async () => {
    if (!loading && !isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchMovies(nextPage, false);
    }
  };

  // Handle scroll events for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
        !loading &&
        !isLoadingMore &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, isLoadingMore, hasMore]);

  const handleGenreClick = (genre: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genre)) {
        return prev.filter((g) => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
    setPage(1);
    // Don't clear searchQuery so users can filter search results by genre
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedGenres([]);
    setPage(1);
    await fetchMovies(1, true); // trigger fetch only on button click
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <h1
          style={{
            textAlign: "center",
            color: "var(--color-primary)",
            fontSize: "2.5rem",
            marginBottom: "var(--spacing-lg)",
          }}
        >
          Movies
        </h1>

        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto var(--spacing-xl)",
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{ marginBottom: "var(--spacing-lg)" }}
          >
            <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
              <input
                type="text"
                placeholder={`Search by ${searchField}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                style={{
                  width: "120px",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-text)"
                }}
              >
                <option value="title">Title</option>
                <option value="director">Director</option>
                <option value="cast">Cast</option>
                <option value="year">Year</option>
              </select>
              <button
                type="submit"
                style={{
                  backgroundColor: "var(--color-secondary)",
                  color: "white",
                  border: "none",
                  padding: "0 var(--spacing-lg)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                Search
              </button>
            </div>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--spacing-md)",
            }}
          >
            <h4 style={{ margin: 0 }}>Filter by genre:</h4>
            {(selectedGenres.length > 0 || searchQuery) && (
              <button
                onClick={handleClearFilters}
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

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--spacing-sm)",
              marginBottom: "var(--spacing-lg)",
            }}
          >
            {[
              { id: "action", label: "Action" },
              { id: "adventure", label: "Adventure" },
              { id: "comedy", label: "Comedy" },
              { id: "drama", label: "Drama" },
              { id: "horrormovies", label: "Horror Movies" },
              { id: "thrillers", label: "Thrillers" },
              { id: "documentaries", label: "Documentaries" },
              { id: "familymovies", label: "Family Movies" },
              { id: "fantasy", label: "Fantasy" },
              { id: "internationalmovies", label: "International Movies" },
              { id: "romanticmovies", label: "Romantic Movies" },
              { id: "musicals", label: "Musicals" },
              { id: "spirituality", label: "Spirituality" },
            ].map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: selectedGenres.includes(genre.id)
                    ? "var(--color-primary)"
                    : "white",
                  color: selectedGenres.includes(genre.id)
                    ? "white"
                    : "var(--color-text)",
                  padding: "var(--spacing-xs) var(--spacing-md)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all var(--transition-normal)",
                }}
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : loading && movies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
            Loading movies...
          </div>
        ) : movies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--spacing-xl)" }}>
            No movies found. Try a different search or filter.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "var(--spacing-lg)",
              padding: "0 var(--spacing-md)",
            }}
          >
            {movies.map((movie) => (
              <MovieCard
                key={movie.showId}
                movie={movie}
                onClick={() => navigate(`/movie/${movie.showId}`)}
              />
            ))}
          </div>
        )}

        {(loading || isLoadingMore) && movies.length > 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "var(--spacing-xl)",
              color: "var(--color-text-light)",
            }}
          >
            Loading more movies...
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
