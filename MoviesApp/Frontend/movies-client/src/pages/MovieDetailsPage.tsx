import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Movie, Rating, User, movieApi, ratingApi } from "../services/api";
import { tmdbApi } from "../services/tmdbApi";
import RecommendedMovies from "../components/RecommendedMovies";
import CastCrewScroller from "../components/CastCrewScroller";
import ReviewSummary from "../components/ReviewSummary";
import MovieTrailer from "../components/MovieTrailer";
import ReviewModal from "../components/ReviewModal";
import ExternalRatings from "../components/ExternalRatings";

const MovieDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  var currentShowId = id;
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasTrailer, setHasTrailer] = useState(false);
  // Larger, better looking fallback image for the details page
  const [posterUrl, setPosterUrl] = useState<string>(
    "https://placehold.co/480x720/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat"
  );

  useEffect(() => {
    // Check if user is logged in - only do this once on component mount
    const checkUserLogin = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);

          // If userData has id but not userId, add userId as a number
          if (userData.id && !userData.userId) {
            const numericId = parseInt(userData.id);
            if (!isNaN(numericId)) {
              userData.userId = numericId;
            }
          }

          setUser(userData);
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
    };

    checkUserLogin();

    const fetchMovieDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch movie details
        const movieResponse = await movieApi.getById(id);
        setMovie(movieResponse.data);

        // Function to fetch a poster from TMDB
        const fetchTMDBPoster = async (
          movieTitle: string,
          releaseYear?: string | number,
          isTV: boolean = false
        ) => {
          try {
            // Parse the year if available
            let year: number | undefined = undefined;
            if (releaseYear) {
              const parsedYear = parseInt(releaseYear.toString());
              if (!isNaN(parsedYear)) {
                year = parsedYear;
              }
            }

            // Get the poster URL from TMDB
            const tmdbPosterUrl = await tmdbApi.getPosterUrl(
              movieTitle,
              year,
              isTV
            );

            if (tmdbPosterUrl) {
              console.log(`TMDB poster found for ${movieTitle}`);
              setPosterUrl(tmdbPosterUrl);
              return true;
            }
            return false;
          } catch (error) {
            console.error("Error fetching TMDB poster:", error);
            return false;
          }
        };

        // Process the poster URL
        if (movieResponse.data.posterUrl) {
          const url = movieResponse.data.posterUrl;

          // Check if this is an Azure URL
          if (url.includes("moviesappsa79595.blob.core.windows.net")) {
            // Use the new SAS token provided for the storage account
            const sasToken =
              "sp=r&st=2025-04-08T10:57:41Z&se=2026-04-08T18:57:41Z&sv=2024-11-04&sr=c&sig=pAoCi15RVSDceDfeusN0dAmD8KqKAKC4Gkjh0qaOI5I%3D";

            // Create properly formatted URL with the movie title
            const properFileName = movieResponse.data.title + ".jpg";

            try {
              // Properly encode the path components for compatibility with Azure
              const encodedPosterPath = encodeURIComponent("Movie Posters");
              const encodedFileName = encodeURIComponent(properFileName);

              // Format with properly encoded URL components for Azure
              setPosterUrl(
                `https://moviesappsa79595.blob.core.windows.net/movie-posters/${encodedPosterPath}/${encodedFileName}?${sasToken}`
              );
            } catch (error) {
              console.error(
                `Error constructing Azure URL for ${movieResponse.data.title}:`,
                error
              );
              // Fall back to TMDB if there's an error constructing the URL
              const tmdbSuccess = await fetchTMDBPoster(
                movieResponse.data.title,
                movieResponse.data.releaseYear,
                movieResponse.data.type === "TV Show"
              );

              if (!tmdbSuccess) {
                setPosterUrl(
                  "https://placehold.co/480x720/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat"
                );
              }
            }
          } else {
            // If not from expected source, use as is
            setPosterUrl(url);
          }
        } else {
          // No poster URL, try TMDB
          const tmdbSuccess = await fetchTMDBPoster(
            movieResponse.data.title,
            movieResponse.data.releaseYear,
            movieResponse.data.type === "TV Show"
          );

          if (!tmdbSuccess) {
            setPosterUrl(
              "https://placehold.co/480x720/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat"
            );
          }
        }

        // Fetch ratings for this movie
        const ratingsResponse = await ratingApi.getByMovie(id);
        setRatings(ratingsResponse.data);

        // Check if logged-in user has already rated this movie
        if (user) {
          // Try to find the user's rating using userId or id
          let userRatingObj = null;

          if (user.userId) {
            userRatingObj = ratingsResponse.data.find(
              (r) => r.userId === user.userId
            );
          }

          // If not found and user has id, try to convert id to number and find rating
          if (!userRatingObj && user.id) {
            const numericId = parseInt(user.id);
            if (!isNaN(numericId)) {
              userRatingObj = ratingsResponse.data.find(
                (r) => r.userId === numericId
              );
            }
          }

          if (userRatingObj) {
            setUserRating(userRatingObj.ratingValue);
            setUserReview(userRatingObj.reviewText || "");
            setRatingSubmitted(true);
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError("Failed to load movie details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]); // Remove user from the dependency array to prevent infinite loop

  // Separate effect to check user rating when user state changes
  useEffect(() => {
    // Only run if we have both a user and ratings data
    if (user && ratings.length > 0) {
      // Try to find the user's rating using userId or id
      let userRatingObj = null;

      if (user.userId) {
        userRatingObj = ratings.find((r) => r.userId === user.userId);
      }

      // If not found and user has id, try to convert id to number and find rating
      if (!userRatingObj && user.id) {
        const numericId = parseInt(user.id);
        if (!isNaN(numericId)) {
          userRatingObj = ratings.find((r) => r.userId === numericId);
        }
      }

      if (userRatingObj) {
        setUserRating(userRatingObj.ratingValue);
        setUserReview(userRatingObj.reviewText || "");
        setRatingSubmitted(true);
      }
    }
  }, [user, ratings]);

  const handleRatingChange = (newRating: number) => {
    if (!user) {
      // Redirect to login if not logged in
      navigate("/login", { state: { from: `/movie/${id}` } });
      return;
    }

    if (!id) return;

    // Only allow rating changes if in editing mode or not yet submitted
    if (!ratingSubmitted || isEditing) {
      setUserRating(newRating);
    }
  };

  // This function is kept for potential indirect references and side effects
  // @ts-ignore: Marking as used to prevent TS6133
  const handleSubmitReview = async () => {
    if (!user || !id || userRating === 0) {
      if (!userRating) {
        alert("Please select a rating before submitting your review.");
      }
      return;
    }

    try {
      // Get a fresh token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { state: { from: `/movie/${id}` } });
        return;
      }

      // Refresh user data from localStorage to ensure we have the latest
      const storedUser = localStorage.getItem("user");
      let currentUser = user;

      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }

      // Ensure userId is available
      if (!currentUser) {
        console.error("User is undefined or user is not properly logged in");
        alert("Unable to submit rating. Please try logging in again.");
        navigate("/login", { state: { from: `/movie/${id}` } });
        return;
      }

      // Try to get userId from the user object
      // First check if userId exists, if not, try to convert id to a number
      let userId: number | undefined = currentUser.userId;

      if (!userId && currentUser.id) {
        // Try to convert the string id to a number
        const numericId = parseInt(currentUser.id);
        if (!isNaN(numericId)) {
          userId = numericId;
        }
      }

      if (!userId) {
        console.error("Could not determine a valid user ID");
        alert("Unable to submit rating. Please try logging in again.");
        navigate("/login", { state: { from: `/movie/${id}` } });
        return;
      }

      const ratingData = {
        userId: userId,
        showId: id,
        ratingValue: userRating,
        reviewText: userReview,
      };

      await ratingApi.addRating(ratingData);

      // Update the UI to show this rating is now submitted
      setRatingSubmitted(true);
      setIsEditing(false);

      // Refresh ratings for this movie
      const ratingsResponse = await ratingApi.getByMovie(id);
      setRatings(ratingsResponse.data);

      // Show a thank you modal instead of an alert
      setShowThankYouModal(true);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit your review. Please try logging in again.");
    }
  };

  if (loading) return <div>Loading movie details...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!movie) return <div>Movie not found</div>;

  // Helper function to extract and display genres from movie object
  const renderGenres = (movie: Movie) => {
    // Genre mapping - property names to display names
    const genreMapping: { [key: string]: string } = {
      Action: "Action",
      Adventure: "Adventure",
      Comedies: "Comedy",
      Dramas: "Drama",
      HorrorMovies: "Horror",
      Thrillers: "Thriller",
      Documentaries: "Documentary",
      FamilyMovies: "Family",
      Fantasy: "Fantasy",
      Musicals: "Musical",
      TVAction: "TV Action",
      TVComedies: "TV Comedy",
      TVDramas: "TV Drama",
      Docuseries: "Docuseries",
      KidsTV: "Kids TV",
      RealityTV: "Reality TV",
      Children: "Children",
      DocumentariesInternationalMovies: "Documentary International",
      DramasInternationalMovies: "Drama International",
      DramasRomanticMovies: "Romantic Drama",
      ComediesRomanticMovies: "Romantic Comedy",
      AnimeSeriesInternationalTVShows: "Anime Series",
      BritishTVShowsDocuseriesInternationalTVShows: "British TV",
      InternationalTVShowsRomanticTVShowsTVDramas: "International TV Drama",
      TalkShowsTVComedies: "Talk Shows",
      CrimeTVShowsDocuseries: "Crime TV",
      LanguageTVShows: "Language Shows",
      NatureTV: "Nature TV",
      Spirituality: "Spirituality",
      ComediesDramasInternationalMovies: "Comedy Drama International",
      ComediesInternationalMovies: "Comedy International",
      InternationalMoviesThrillers: "International Thriller",
    };

    // Get active genres
    const activeGenres: React.ReactNode[] = [];

    // Debug logging for genres
    console.log("Checking genres for movie:", movie.title);

    // Check all possible genre fields with more robust value checking
    Object.keys(genreMapping).forEach((key) => {
      // Try different ways of accessing the property (handle case differences)
      const value =
        movie[key as keyof Movie] ||
        movie[key.toLowerCase() as keyof Movie] ||
        movie[key.toUpperCase() as keyof Movie];

      // Check for values that indicate genre is active:
      // - number 1
      // - string "1"
      // - boolean true
      // - any truthy value that's not undefined or null
      if (
        value === 1 ||
        value === "1" ||
        (typeof value === "boolean" && value === true) ||
        (value && typeof value !== "undefined")
      ) {
        console.log(`Found active genre: ${key} = ${value}`);
        activeGenres.push(
          <div
            key={key}
            style={{
              padding: "4px 12px",
              backgroundColor: "var(--color-secondary-dark, #e65100)",
              color: "white",
              borderRadius: "16px",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            {genreMapping[key]}
          </div>
        );
      }
    });

    // Not adding movie type as a genre as requested

    // If no genres found, show placeholder
    if (activeGenres.length === 0) {
      // Debug log what's available on the movie object
      console.log("No genres found. Movie object keys:", Object.keys(movie));

      return (
        <div style={{ color: "var(--color-text-light)" }}>
          No genres available
        </div>
      );
    }

    return activeGenres;
  };

  // Utility function to format minutes to readable format (e.g., 155 → "2h 35m")
  const formatDuration = (
    rawDuration: string | undefined,
    type: string | undefined
  ): string => {
    if (!rawDuration || !type) return "Unknown";

    if (type === "TV Show") {
      // Example: "2 Seasons" or "1 Season"
      const match = rawDuration.match(/(\d+)/);
      if (match) {
        const seasons = parseInt(match[1]);
        return seasons === 1 ? "1 Season" : `${seasons} Seasons`;
      }
      return "Unknown";
    }

    // Assume type is Movie
    const match = rawDuration.match(/(\d+)/);
    if (match) {
      const mins = parseInt(match[1]);
      if (isNaN(mins)) return "Unknown";
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
    }

    return "Unknown";
  };

  const handleTrailerAvailability = (key: string | null) => {
    console.log("Trailer key received:", key);
    if (key) {
      setHasTrailer(true); // Trailer is available
    } else {
      setHasTrailer(false); // No trailer available
    }
  };

  // Calculate average rating
  const averageRating = ratings.length
    ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length
    : 0;

  return (
    <div className="container">
      {/* Reviews Modal */}
      {showReviewsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "var(--radius-lg)",
              padding: "var(--spacing-xl)",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              <h2
                style={{
                  color: "var(--color-primary)",
                  margin: 0,
                }}
              >
                User Reviews
              </h2>
              <button
                onClick={() => setShowReviewsModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  padding: "4px",
                  lineHeight: 1,
                  color: "black",
                }}
                aria-label="Close reviews modal"
              >
                ×
              </button>
            </div>

            {ratings.filter((r) => r.reviewText && r.reviewText.trim() !== "")
              .length === 0 ? (
              <p style={{ color: "var(--color-text-light)" }}>
                No reviews yet. Be the first to review this{" "}
                {movie.type || "title"}!
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-lg)",
                }}
              >
                {ratings
                  .filter((r) => r.reviewText && r.reviewText.trim() !== "")
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .map((rating, index) => (
                    <div
                      key={`${rating.userId}-${index}`}
                      style={{
                        padding: "var(--spacing-lg)",
                        backgroundColor:
                          "var(--color-background-light, #f8f8f8)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "var(--spacing-md)",
                          gap: "var(--spacing-md)",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "transparent",
                            marginRight: "var(--spacing-sm)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{
                                color:
                                  rating.ratingValue >= star
                                    ? "gold"
                                    : "#d1d1d1",
                                fontSize: "1.4rem",
                                fontWeight: "bold",
                                lineHeight: 1,
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <div style={{ flex: 1 }}></div>
                        <div
                          style={{
                            color: "var(--color-text-light)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {new Date(rating.timestamp).toLocaleDateString()}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--spacing-sm)",
                          marginBottom: "var(--spacing-md)",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-secondary)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "1.2rem",
                          }}
                        >
                          {rating.user?.name
                            ? rating.user.name.charAt(0).toUpperCase()
                            : "U"}
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 600,
                              color: "var(--color-text)",
                            }}
                          >
                            {rating.user?.name || "Anonymous User"}
                          </p>
                        </div>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          lineHeight: 1.6,
                          color: "var(--color-text)",
                        }}
                      >
                        {rating.reviewText}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Thank You Modal */}
      {showThankYouModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "var(--radius-lg)",
              padding: "var(--spacing-xl)",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                color: "var(--color-primary)",
                marginTop: 0,
              }}
            >
              Thanks for your review!
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                margin: "var(--spacing-lg) 0",
              }}
            >
              Your feedback helps our community discover great content.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "var(--spacing-md)",
                marginTop: "var(--spacing-xl)",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setShowThankYouModal(false)}
                style={{
                  padding: "var(--spacing-sm) var(--spacing-lg)",
                  backgroundColor: "var(--color-secondary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Back to Movie
              </button>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "var(--spacing-sm) var(--spacing-lg)",
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Go to Home Page
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4">
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "var(--spacing-sm) var(--spacing-md)",
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            marginBottom: "var(--spacing-md)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--spacing-xs)",
            transition: "all var(--transition-normal)",
            color: "var(--color-text)",
            fontWeight: 500,
          }}
          onMouseOver={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = "var(--color-background)";
            target.style.borderColor = "var(--color-primary)";
          }}
          onMouseOut={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = "transparent";
            target.style.borderColor = "var(--color-border)";
          }}
        >
          <span aria-hidden="true" style={{ fontSize: "1.2rem" }}>
            &larr;
          </span>{" "}
          Back
        </button>

        <div
          className="card"
          style={{
            padding: "var(--spacing-xl)",
            paddingBottom: "var(--spacing-m)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "320px 1fr",
              gap: "var(--spacing-xl)",
              alignItems: "start",
            }}
          >
            {/* Movie poster */}
            <div style={{ flexBasis: "320px", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <img
                  src={posterUrl}
                  alt={movie.title}
                  style={{
                    width: "100%",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md)",
                  }}
                  onError={async () => {
                    console.log(
                      `Azure poster failed for ${movie.title} on details page, trying TMDB...`
                    );
                    const tmdbSuccess = await tmdbApi.getPosterUrl(
                      movie.title,
                      movie.releaseYear
                        ? parseInt(movie.releaseYear.toString())
                        : undefined,
                      movie.type === "TV Show"
                    );

                    if (tmdbSuccess) {
                      setPosterUrl(tmdbSuccess);
                    } else {
                      setPosterUrl(
                        "https://placehold.co/480x720/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat"
                      );
                    }
                  }}
                />
                {movie.type && (
                  <div
                    style={{
                      position: "absolute",
                      top: "var(--spacing-md)",
                      right: "var(--spacing-md)",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {movie.type}
                  </div>
                )}
              </div>

              {/* Rating functionality for mobile devices */}
              <div className="mt-4 mobile-rating" style={{ display: "none" }}>
                <h3>Rate this {movie.type || "title"}</h3>

                {!user && (
                  <p style={{ marginBottom: "var(--spacing-md)" }}>
                    <a
                      href="/login"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/login", { state: { from: `/movie/${id}` } });
                      }}
                      style={{
                        color: "var(--color-primary)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Log in
                    </a>{" "}
                    to rate this {movie.type || "title"}
                  </p>
                )}

                <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      style={{
                        width: "45px",
                        height: "45px",
                        border: "none",
                        borderRadius: "50%",
                        background: "transparent",
                        color: userRating >= rating ? "gold" : "#d1d1d1",
                        cursor:
                          !user || (ratingSubmitted && !isEditing)
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "36px",
                        fontWeight: "bold",
                        opacity:
                          !user || (ratingSubmitted && !isEditing) ? 0.6 : 1,
                        transition: "all var(--transition-normal)",
                      }}
                      disabled={!user || (ratingSubmitted && !isEditing)}
                      aria-label={`Rate ${rating} out of 5 stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {ratingSubmitted && (
                  <p className="text-success mt-2" style={{ fontWeight: 500 }}>
                    ✓ Your rating has been submitted!
                  </p>
                )}
              </div>

              {/* Write a review button */}
              <div style={{ margin: "var(--spacing-lg) 0" }}>
                <button
                  onClick={() => {
                    if (!user) {
                      navigate("/login", { state: { from: `/movie/${id}` } });
                    } else {
                      setShowReviewModal(true);
                    }
                  }}
                  style={{
                    padding: "var(--spacing-md) var(--spacing-lg)",
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    width: "100%",
                    fontWeight: 600,
                    fontSize: "1rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>✏️</span>
                  {ratingSubmitted ? "Edit your review" : "Write a review"}
                </button>

                {ratingSubmitted && (
                  <div
                    style={{
                      marginTop: "var(--spacing-sm)",
                      textAlign: "center",
                      color: "var(--color-success, green)",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    <span>✓</span> You've reviewed this {movie.type || "title"}
                  </div>
                )}
              </div>

              {/* User Reviews section with header and compact layout */}
              <div style={{ margin: "var(--spacing-lg) 0" }}>
                <div
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--spacing-sm)",
                    backgroundColor: "var(--color-background)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    padding: "var(--spacing-lg)",
                    marginBottom: "var(--spacing-md)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid var(--color-border)",
                      paddingBottom: "var(--spacing-sm)",
                      marginBottom: "var(--spacing-sm)",
                    }}
                  >
                    <h3
                      style={{
                        color: "var(--color-primary)",
                        fontWeight: 600,
                        margin: 0,
                        fontSize: "1.2rem",
                      }}
                    >
                      User Reviews
                    </h3>
                    {ratings.filter(
                      (r) => r.reviewText && r.reviewText.trim() !== ""
                    ).length > 0 && (
                      <button
                        onClick={() => setShowReviewsModal(true)}
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: "0.9rem",
                        }}
                      >
                        View All
                      </button>
                    )}
                  </div>

                  {ratings.filter(
                    (r) => r.reviewText && r.reviewText.trim() !== ""
                  ).length === 0 ? (
                    <div style={{ color: "var(--color-text-light)" }}>
                      No reviews yet. Be the first to review!
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-md)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            style={{
                              color: averageRating >= star ? "gold" : "#d1d1d1",
                              fontSize: "1.1rem",
                              lineHeight: 1,
                            }}
                          >
                            ★
                          </span>
                        ))}
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--color-text)",
                            marginLeft: "2px",
                          }}
                        >
                          ({averageRating.toFixed(1)})
                        </span>
                      </div>
                      <span style={{ fontSize: "0.9rem" }}>
                        <span style={{ fontWeight: 600 }}>
                          {
                            ratings.filter(
                              (r) => r.reviewText && r.reviewText.trim() !== ""
                            ).length
                          }
                        </span>{" "}
                        {ratings.filter(
                          (r) => r.reviewText && r.reviewText.trim() !== ""
                        ).length === 1
                          ? "review"
                          : "reviews"}
                      </span>
                    </div>
                  )}
                </div>

                {ratings.filter(
                  (r) => r.reviewText && r.reviewText.trim() !== ""
                ).length > 0 && (
                  <div style={{ marginBottom: "var(--spacing-md)" }}>
                    <ReviewSummary
                      reviews={ratings
                        .filter(
                          (r) => r.reviewText && r.reviewText.trim() !== ""
                        )
                        .map((r) => r.reviewText || "")}
                      title={movie.title}
                      isLoading={loading}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Movie details */}
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h1
                style={{
                  marginTop: 0,
                  fontSize: "2.5rem",
                  color: "var(--color-primary)",
                  marginBottom: "var(--spacing-md)",
                }}
              >
                {movie.title}
              </h1>

              <div style={{ margin: "var(--spacing-md) 0" }}>
                {/* All ratings grouped together */}
                <div
                  className="card"
                  style={{
                    backgroundColor: "var(--color-background)",
                    padding: "var(--spacing-lg)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    marginBottom: "var(--spacing-lg)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <h3
                    style={{
                      color: "var(--color-primary)",
                      fontWeight: 600,
                      fontSize: "1.2rem",
                      marginTop: 0,
                      marginBottom: "var(--spacing-md)",
                      borderBottom: "1px solid var(--color-border)",
                      paddingBottom: "var(--spacing-sm)",
                    }}
                  >
                    Ratings
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "var(--spacing-lg)",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Our site ratings */}
                    <div
                      style={{
                        backgroundColor: "transparent",
                        color: "var(--color-text)",
                        fontWeight: "bold",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-md)",
                        fontSize: "1.1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {/* Show average rating as stars */}
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={{
                            color: averageRating >= star ? "gold" : "#d1d1d1",
                            fontSize: "1.6rem",
                            fontWeight: "bold",
                            lineHeight: 1,
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <span
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--color-text)",
                        }}
                      >
                        ({averageRating.toFixed(1)})
                      </span>
                    </div>
                    <span style={{ color: "var(--color-text-light)" }}>
                      {ratings.length}{" "}
                      {ratings.length === 1 ? "rating" : "ratings"}
                    </span>

                    {/* External ratings */}
                    <ExternalRatings
                      title={movie.title}
                      year={movie.releaseYear}
                      isTV={movie.type === "TV Show"}
                      compact={true}
                    />
                  </div>
                </div>
              </div>

              {/* Movie Info Box */}
              <div
                className="card"
                style={{
                  margin: "var(--spacing-lg) 0",
                  backgroundColor: "var(--color-background)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-md)",
                  padding: "var(--spacing-lg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: "var(--spacing-sm)",
                    color: "var(--color-primary)",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--color-border)",
                    paddingBottom: "var(--spacing-sm)",
                  }}
                >
                  Movie Details
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "var(--spacing-md)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        color: "var(--color-text-light)",
                      }}
                    >
                      Year
                    </p>
                    <p style={{ margin: 0, fontSize: "1.1rem" }}>
                      {movie.releaseYear || "Unknown"}
                    </p>
                  </div>

                  {movie.duration && (
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          color: "var(--color-text-light)",
                        }}
                      >
                        Duration
                      </p>
                      <p style={{ margin: 0, fontSize: "1.1rem" }}>
                        {formatDuration(movie.duration, movie.type)}
                      </p>
                    </div>
                  )}

                  {movie.rating && (
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          color: "var(--color-text-light)",
                        }}
                      >
                        Content Rating
                      </p>
                      <p style={{ margin: 0, fontSize: "1.1rem" }}>
                        {movie.rating}
                      </p>
                    </div>
                  )}

                  {movie.country && (
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          color: "var(--color-text-light)",
                        }}
                      >
                        Country
                      </p>
                      <p style={{ margin: 0, fontSize: "1.1rem" }}>
                        {movie.country}
                      </p>
                    </div>
                  )}

                  {/* Show ID removed as requested */}
                </div>

                {/* Display genres as tags */}
                <div style={{ marginTop: "var(--spacing-md)" }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "var(--color-text-light)",
                      marginBottom: "var(--spacing-sm)",
                    }}
                  >
                    Genres
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "var(--spacing-sm)",
                    }}
                  >
                    {renderGenres(movie)}
                  </div>
                </div>
              </div>

              {movie.description && (
                <div
                  className="card"
                  style={{
                    margin: "var(--spacing-lg) 0",
                    padding: "var(--spacing-lg)",
                    backgroundColor: "var(--color-background)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <h3
                    style={{
                      color: "var(--color-primary)",
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: "var(--spacing-md)",
                      fontSize: "1.2rem",
                      borderBottom: "1px solid var(--color-border)",
                      paddingBottom: "var(--spacing-sm)",
                    }}
                  >
                    Description
                  </h3>
                  <p
                    style={{
                      lineHeight: 1.6,
                      color: "var(--color-text)",
                      fontSize: "1.05rem",
                      margin: 0,
                    }}
                  >
                    {movie.description}
                  </p>
                </div>
              )}

              {/* Cast and Crew from TMDB with images */}
              <div
                className="card"
                style={{
                  margin: "var(--spacing-lg) 0",
                  padding:
                    "var(--spacing-lg) var(--spacing-lg) var(--spacing-sm)",
                  backgroundColor: "var(--color-background)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3
                  style={{
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    margin: 0,
                    marginBottom: "var(--spacing-md)",
                    fontSize: "1.2rem",
                    borderBottom: "1px solid var(--color-border)",
                    paddingBottom: "var(--spacing-sm)",
                  }}
                >
                  Cast &amp; Crew
                </h3>
                <CastCrewScroller
                  title={movie.title}
                  year={movie.releaseYear}
                  isTV={movie.type === "TV Show"}
                  maxCastMembers={15}
                />
              </div>

              {/* Rating functionality removed from here (now shown in the left column) */}
            </div>
          </div>
        </div>
      </div>
      {/* ReviewModal for adding/editing ratings */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        movieId={id || ""}
        movieTitle={movie?.title || ""}
        userId={user?.userId || parseInt(user?.id || "0")}
        existingRating={userRating}
        existingReview={userReview}
        onReviewSubmitted={async () => {
          // Refresh ratings for this movie
          if (id) {
            const ratingsResponse = await ratingApi.getByMovie(id);
            setRatings(ratingsResponse.data);

            // Find user's updated rating
            if (user) {
              let userRatingObj = null;
              if (user.userId) {
                userRatingObj = ratingsResponse.data.find(
                  (r) => r.userId === user.userId
                );
              }
              if (!userRatingObj && user.id) {
                const numericId = parseInt(user.id);
                if (!isNaN(numericId)) {
                  userRatingObj = ratingsResponse.data.find(
                    (r) => r.userId === numericId
                  );
                }
              }
              if (userRatingObj) {
                setUserRating(userRatingObj.ratingValue);
                setUserReview(userRatingObj.reviewText || "");
                setRatingSubmitted(true);
              }
            }

            // Show thank you message
            setShowThankYouModal(true);
          }
        }}
      />
      {/* Movie Trailer */}
      {hasTrailer && ( // Render only if there is a trailer
        <div
          className="card"
          style={{
            margin: "var(--spacing-lg) 0",
            padding: "var(--spacing-lg)",
            backgroundColor: "var(--color-background)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3
            style={{
              color: "var(--color-primary)",
              fontWeight: 600,
              margin: 0,
              marginBottom: "var(--spacing-md)",
              fontSize: "1.2rem",
              borderBottom: "1px solid var(--color-border)",
              paddingBottom: "var(--spacing-sm)",
            }}
          >
            Trailer
          </h3>
          <MovieTrailer
            title={movie.title}
            year={movie.releaseYear}
            isTV={movie.type === "TV Show"}
            onTrailerLoaded={handleTrailerAvailability} // Pass the callback here
          />
        </div>
      )}
      {!hasTrailer && <br />}
      {/* Top Suggestions / Recommended Movies section */}
      <div
        className="card"
        style={{
          marginBottom: "var(--spacing-lg)",
          padding: "var(--spacing-lg)",
          backgroundColor: "var(--color-background)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div>
          <RecommendedMovies showId={currentShowId} />
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;
