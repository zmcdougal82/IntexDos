import React, { useState, useEffect } from "react";
import { tmdbApi } from "../services/tmdbApi";

interface MovieTrailerProps {
  title: string;
  year?: string | number;
  isTV?: boolean;
  className?: string;
  onTrailerLoaded?: (key: string | null) => void;
}

const MovieTrailer: React.FC<MovieTrailerProps> = ({
  title,
  year,
  isTV = false,
  className,
  onTrailerLoaded,
}) => {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerName, setTrailerName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrailer = async () => {
      setLoading(true);
      setError(null);

      try {
        const trailerInfo = await tmdbApi.getTrailer(title, year, isTV);

        if (trailerInfo) {
          setTrailerKey(trailerInfo.key);
          setTrailerName(trailerInfo.name);
          onTrailerLoaded?.(trailerInfo.key); // Notify parent about trailer availability
        } else {
          setError("No trailer available");
          onTrailerLoaded?.(null); // Notify parent that no trailer is available
        }
      } catch (err) {
        console.error("Error fetching trailer:", err);
        setError("Failed to load trailer");
        onTrailerLoaded?.(null); // Notify parent that no trailer is available
      } finally {
        setLoading(false);
      }
    };

    fetchTrailer();
  }, [title, year, isTV]);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          borderRadius: "var(--radius-md)",
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem",
          color: "var(--color-text-light)",
          width: "100%",
          ...(className ? {} : {}),
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--color-primary)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          Loading trailer...
        </div>
      </div>
    );
  }

  if (error || !trailerKey) {
    return (
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          borderRadius: "var(--radius-md)",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.9rem",
          color: "var(--color-text-light)",
          width: "100%",
          ...(className ? {} : {}),
        }}
      >
        No trailer available
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: 0,
        paddingBottom: "56.25%",
        overflow: "hidden",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-md)",
        backgroundColor: "black",
        marginBottom: "var(--spacing-md)",
      }}
    >
      <iframe
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${trailerKey}`}
        title={trailerName || `${title} Trailer`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>

      {/* Add CSS for the spinner animation */}
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
};

export default MovieTrailer;
