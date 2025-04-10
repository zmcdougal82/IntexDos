import React, { useState, useEffect } from "react";
import { omdbApi } from "../services/omdbApi";

// Props for the ExternalRatings component
interface ExternalRatingsProps {
  title: string;
  year?: string | number;
  isTV?: boolean;
  compact?: boolean; // Whether to display in a compact layout without container/header
}

const ExternalRatings: React.FC<ExternalRatingsProps> = ({
  title,
  year,
  isTV = false,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imdbRating, setImdbRating] = useState<string | null>(null);
  // Removing unused imdbId state
  const [rottenTomatoesRating, setRottenTomatoesRating] = useState<
    string | null
  >(null);
  const [metacriticRating, setMetacriticRating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setIsLoading(true);

        console.log(
          `Fetching external ratings for: "${title}" (${year}) - ${
            isTV ? "TV Show" : "Movie"
          }`
        );

        // Try to search with exact title first
        let externalRatings = await omdbApi.getExternalRatings(
          title,
          year,
          isTV
        );

        // Log the API response for debugging
        console.log("OMDB API response:", externalRatings);

        // If no ratings found, try a simplified title (strip special characters)
        if (
          !externalRatings.imdb &&
          !externalRatings.rottenTomatoes &&
          !externalRatings.metacritic
        ) {
          const simplifiedTitle = title
            .replace(/[^\w\s]/gi, "") // Remove special characters
            .replace(/\s+/g, " ") // Remove extra spaces
            .trim();

          console.log(
            `No ratings found, trying simplified title: "${simplifiedTitle}"`
          );

          if (simplifiedTitle !== title) {
            externalRatings = await omdbApi.getExternalRatings(
              simplifiedTitle,
              year,
              isTV
            );
            console.log(
              "OMDB API response with simplified title:",
              externalRatings
            );
          }
        }

        // Set IMDB data
        if (externalRatings.imdb) {
          console.log("Setting IMDB rating:", externalRatings.imdb.rating);
          setImdbRating(externalRatings.imdb.rating);
          // No longer setting imdbId since it's not used
        }

        // Set Rotten Tomatoes data
        if (externalRatings.rottenTomatoes) {
          console.log(
            "Setting Rotten Tomatoes rating:",
            externalRatings.rottenTomatoes.rating
          );
          setRottenTomatoesRating(externalRatings.rottenTomatoes.rating);
        }

        // Set Metacritic data
        if (externalRatings.metacritic) {
          console.log(
            "Setting Metacritic rating:",
            externalRatings.metacritic.rating
          );
          setMetacriticRating(externalRatings.metacritic.rating);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching external ratings:", err);
        setError("Unable to load external ratings");
      } finally {
        setIsLoading(false);
      }
    };

    if (title) {
      fetchRatings();
    } else {
      console.warn("No title provided for external ratings lookup");
    }
  }, [title, year, isTV]);

  // Format the Rotten Tomatoes rating by extracting just the number
  const formatRottenTomatoesRating = (rating: string) => {
    // Rating format is typically "XX%" - we just want the number
    return rating.replace("%", "");
  };

  // Return null if there are no ratings to display
  if (!isLoading && !imdbRating && !rottenTomatoesRating && !metacriticRating) {
    return null;
  }

  // Content to render for both compact and full views
  const renderRatings = () => {
    if (isLoading) {
      return (
        <div style={{ color: "var(--color-text-light)", fontSize: "0.9rem" }}>
          Loading ratings...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ color: "var(--color-danger, red)", fontSize: "0.9rem" }}>
          {error}
        </div>
      );
    }

    return (
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-md)" }}
      >
        {/* IMDB Rating */}
        {imdbRating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xs)",
            }}
          >
            <div
              style={{
                backgroundColor: "#F5C518",
                color: "black",
                fontWeight: "bold",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>IMDb</span>
              <span>{imdbRating}</span>
            </div>
          </div>
        )}

        {/* Rotten Tomatoes Rating */}
        {rottenTomatoesRating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xs)",
            }}
          >
            <div
              style={{
                backgroundColor:
                  parseInt(formatRottenTomatoesRating(rottenTomatoesRating)) >=
                  60
                    ? "#66C37A"
                    : "#E57373",
                color: "white",
                fontWeight: "bold",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
              }}
            >
              RT {rottenTomatoesRating}
            </div>
          </div>
        )}

        {/* Metacritic Rating */}
        {metacriticRating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xs)",
            }}
          >
            <div
              style={{
                backgroundColor: "#000000",
                color: "white",
                fontWeight: "bold",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.9rem",
              }}
            >
              Metacritic {metacriticRating}
            </div>
          </div>
        )}
      </div>
    );
  };

  // For compact mode, just render the ratings directly
  if (compact) {
    return renderRatings();
  }

  // For full mode, render with a container and header
  return (
    <div
      style={{
        backgroundColor: "var(--color-background)",
        padding: "var(--spacing-md)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        marginBottom: "var(--spacing-md)",
      }}
    >
      <h3
        style={{
          color: "var(--color-text)",
          fontWeight: 600,
          fontSize: "1.1rem",
          marginTop: 0,
          marginBottom: "var(--spacing-md)",
        }}
      >
        External Ratings
      </h3>

      {renderRatings()}
    </div>
  );
};

export default ExternalRatings;
