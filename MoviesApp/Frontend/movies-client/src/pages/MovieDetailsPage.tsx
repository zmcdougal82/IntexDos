import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Movie, Rating, User, movieApi, ratingApi } from "../services/api";
import { tmdbApi } from "../services/tmdbApi";
import RecommendedMovies from "../components/RecommendedMovies";

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

            // Format according to the correct pattern with unencoded spaces and the new SAS token
            setPosterUrl(
              `https://moviesappsa79595.blob.core.windows.net/movie-posters/Movie Posters/${properFileName}?${sasToken}`
            );
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

  const handleReviewChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Only allow review changes if in editing mode or not yet submitted
    if (!ratingSubmitted || isEditing) {
      setUserReview(e.target.value);
    }
  };

  const handleToggleEdit = async () => {
    // If currently editing, submit the changes
    if (isEditing) {
      await handleSubmitReview();
    } else {
      // Otherwise, just enable editing mode
      setIsEditing(true);
    }
  };

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

  // Calculate average rating
  const averageRating = ratings.length
    ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length
    : 0;

  return (
    <div className="container">
      {/* Thank You Modal */}
      {showThankYouModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xl)',
            width: '90%',
            maxWidth: '500px',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              color: 'var(--color-primary)',
              marginTop: 0
            }}>Thanks for your review!</h2>
            <p style={{ 
              fontSize: '1.1rem', 
              margin: 'var(--spacing-lg) 0' 
            }}>
              Your feedback helps our community discover great content.
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-xl)',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowThankYouModal(false)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Back to Movie
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 500,
                  cursor: 'pointer'
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
              display: "flex",
              flexDirection: "row",
              gap: "var(--spacing-xl)",
              flexWrap: "wrap",
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
                        border:
                          userRating === rating
                            ? `2px solid var(--color-secondary)`
                            : `1px solid var(--color-border)`,
                        borderRadius: "50%",
                        background:
                          userRating >= rating
                            ? "var(--color-secondary)"
                            : "white",
                        color:
                          userRating >= rating ? "white" : "var(--color-text)",
                        cursor: (!user || (ratingSubmitted && !isEditing)) ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "bold",
                        opacity: (!user || (ratingSubmitted && !isEditing)) ? 0.6 : 1,
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

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "var(--spacing-md) 0",
                }}
              >
                <div
                  style={{
                    backgroundColor: "var(--color-secondary)",
                    color: "white",
                    fontWeight: "bold",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    marginRight: "var(--spacing-md)",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>★</span>{" "}
                  {averageRating.toFixed(1)}
                </div>
                <span style={{ color: "var(--color-text-light)" }}>
                  {ratings.length} {ratings.length === 1 ? "rating" : "ratings"}
                </span>
              </div>

              <div
                className="card"
                style={{
                  margin: "var(--spacing-lg) 0",
                  backgroundColor: "var(--color-background)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--spacing-md)",
                }}
              >
                <div style={{ minWidth: "120px", flex: 1 }}>
                  <p style={{ margin: 0 }}>
                    <strong>Year:</strong> {movie.releaseYear || "Unknown"}
                  </p>
                </div>
                {movie.duration && (
                  <div style={{ minWidth: "120px", flex: 1 }}>
                    <p style={{ margin: 0 }}>
                      <strong>Duration:</strong> {movie.duration}
                    </p>
                  </div>
                )}
                {movie.rating && (
                  <div style={{ minWidth: "120px", flex: 1 }}>
                    <p style={{ margin: 0 }}>
                      <strong>Content Rating:</strong> {movie.rating}
                    </p>
                  </div>
                )}
              </div>

              {movie.description && (
                <div style={{ margin: "var(--spacing-lg) 0" }}>
                  <h3 style={{ color: "var(--color-text)", fontWeight: 600 }}>
                    Description
                  </h3>
                  <p
                    style={{
                      lineHeight: 1.6,
                      color: "var(--color-text)",
                      fontSize: "1.05rem",
                    }}
                  >
                    {movie.description}
                  </p>
                </div>
              )}

              {movie.director && (
                <div style={{ margin: "var(--spacing-lg) 0" }}>
                  <h3 style={{ color: "var(--color-text)", fontWeight: 600 }}>
                    Director
                  </h3>
                  <p>{movie.director}</p>
                </div>
              )}

              {movie.cast && (
                <div style={{ margin: "var(--spacing-lg) 0" }}>
                  <h3 style={{ color: "var(--color-text)", fontWeight: 600 }}>
                    Cast
                  </h3>
                  <p>{movie.cast}</p>
                </div>
              )}

              {/* Rating functionality for desktop */}
              <div
                className="desktop-rating"
                style={{
                  margin: "var(--spacing-xl) 0",
                }}
              >
                <h3 style={{ color: "var(--color-text)", fontWeight: 600 }}>
                  Rate this {movie.type || "title"}
                </h3>

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
                        border:
                          userRating === rating
                            ? `2px solid var(--color-secondary)`
                            : `1px solid var(--color-border)`,
                        borderRadius: "50%",
                        background:
                          userRating >= rating
                            ? "var(--color-secondary)"
                            : "white",
                        color:
                          userRating >= rating ? "white" : "var(--color-text)",
                        cursor: user ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontWeight: "bold",
                        opacity: user ? 1 : 0.6,
                        transition: "all var(--transition-normal)",
                      }}
                      disabled={!user}
                      aria-label={`Rate ${rating} out of 5 stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {user && (
                  <div style={{ marginTop: "var(--spacing-md)" }}>
                    <h4
                      style={{
                        color: "var(--color-text)",
                        fontWeight: 600,
                        marginBottom: "var(--spacing-sm)",
                      }}
                    >
                      Write a review
                    </h4>
                    <textarea
                      value={userReview}
                      onChange={handleReviewChange}
                      placeholder="Share your thoughts about this title..."
                      style={{
                        width: "100%",
                        minHeight: "120px",
                        padding: "var(--spacing-md)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        marginBottom: "var(--spacing-md)",
                        fontFamily: "inherit",
                        fontSize: "1rem",
                        backgroundColor: (ratingSubmitted && !isEditing) ? "var(--color-background)" : "white"
                      }}
                      disabled={!user || (ratingSubmitted && !isEditing)}
                      readOnly={ratingSubmitted && !isEditing}
                    />
                    {ratingSubmitted ? (
                      <button
                        onClick={handleToggleEdit}
                        style={{
                          padding: "var(--spacing-sm) var(--spacing-lg)",
                          backgroundColor: isEditing ? "var(--color-primary)" : "var(--color-secondary)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                      >
                        {isEditing ? "Submit Changes" : "Edit Review"}
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitReview}
                        style={{
                          padding: "var(--spacing-sm) var(--spacing-lg)",
                          backgroundColor: "var(--color-primary)",
                          color: "white", 
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          fontWeight: 500,
                          cursor: userRating > 0 ? "pointer" : "not-allowed",
                          opacity: userRating > 0 ? 1 : 0.6
                        }}
                        disabled={userRating === 0}
                      >
                        Submit Review
                      </button>
                    )}
                  </div>
                )}

              </div>

              {/* Reviews section */}
              <div style={{ margin: "var(--spacing-xl) 0" }}>
                <h3 style={{ color: "var(--color-text)", fontWeight: 600 }}>
                  User Reviews
                </h3>

                {ratings.filter(
                  (r) => r.reviewText && r.reviewText.trim() !== ""
                ).length === 0 ? (
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
                      .map((rating, index) => (
                        <div
                          key={`${rating.userId}-${index}`}
                          style={{
                            padding: "var(--spacing-lg)",
                            backgroundColor: "var(--color-background)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "var(--spacing-md)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--spacing-sm)",
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
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "0.85rem",
                                    color: "var(--color-text-light)",
                                  }}
                                >
                                  {new Date(
                                    rating.timestamp
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div
                              style={{
                                backgroundColor: "var(--color-secondary)",
                                color: "white",
                                fontWeight: "bold",
                                padding: "4px 10px",
                                borderRadius: "var(--radius-md)",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.9rem",
                              }}
                            >
                              <span style={{ fontWeight: "bold" }}>★</span>{" "}
                              {rating.ratingValue}
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
          </div>
        </div>
      </div>

      <div
        className="recommended-movies-section card"
        style={{
          paddingTop: "var(--spacing-l)",
          paddingBottom: "var(--spacing-xl)",
          marginBottom: "1.0rem",
        }}
      >
        {/* Recommended Movies section */}
        <RecommendedMovies showId={currentShowId} />
      </div>
    </div>
  );
};

export default MovieDetailsPage;
