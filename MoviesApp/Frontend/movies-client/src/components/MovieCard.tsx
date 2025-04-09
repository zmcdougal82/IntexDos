import { Movie } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { tmdbApi } from '../services/tmdbApi';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  // Fallback image URL - a nice movie-themed placeholder with the correct poster ratio (2:3)
  const defaultImage = "https://placehold.co/320x480/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat";
  const [posterUrl, setPosterUrl] = useState<string>(defaultImage);
  
  // Function to fetch a poster from TMDB
  const fetchTMDBPoster = useCallback(async () => {
    try {
      // Extract year from releaseYear if available
      let year: number | undefined = undefined;
      if (movie.releaseYear) {
        const parsedYear = parseInt(movie.releaseYear.toString());
        if (!isNaN(parsedYear)) {
          year = parsedYear;
        }
      }
      
      // Use the TMDB API to get a poster
      const tmdbPosterUrl = await tmdbApi.getPosterUrl(
        movie.title,
        year,
        movie.type === 'TV Show' // isTV parameter
      );
      
      if (tmdbPosterUrl) {
        console.log(`TMDB poster found for ${movie.title}`);
        setPosterUrl(tmdbPosterUrl);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching TMDB poster:', error);
      return false;
    }
  }, [movie.title, movie.releaseYear, movie.type]);

  // Handle image loading errors
  const handleImageError = useCallback(async () => {
    console.log(`Azure poster failed to load for ${movie.title}, trying TMDB...`);
    const tmdbSuccess = await fetchTMDBPoster();
    
    if (!tmdbSuccess) {
      console.log(`No TMDB poster found for ${movie.title}, using default`);
      setPosterUrl(defaultImage);
    }
  }, [fetchTMDBPoster, movie.title]);

  useEffect(() => {
    if (movie.posterUrl) {
      // Check if this is an Azure URL
      if (movie.posterUrl.includes('moviesappsa79595.blob.core.windows.net')) {
        // Use the new SAS token provided for the storage account
        const sasToken = "sp=r&st=2025-04-08T10:57:41Z&se=2026-04-08T18:57:41Z&sv=2024-11-04&sr=c&sig=pAoCi15RVSDceDfeusN0dAmD8KqKAKC4Gkjh0qaOI5I%3D";
        
        // Use the movie title to create the proper filename
        // This matches the format: "Movie Title.jpg"
        const properFileName = movie.title + '.jpg';
        
        try {
          // Properly encode the path components for compatibility with Azure
          const encodedPosterPath = encodeURIComponent("Movie Posters");
          const encodedFileName = encodeURIComponent(properFileName);
          
          // Format with properly encoded URL components for Azure
          setPosterUrl(`https://moviesappsa79595.blob.core.windows.net/movie-posters/${encodedPosterPath}/${encodedFileName}?${sasToken}`);
        } catch (error) {
          console.error(`Error constructing Azure URL for ${movie.title}:`, error);
          // Try TMDB immediately as a backup
          fetchTMDBPoster().catch(() => setPosterUrl(defaultImage));
        }
      } else {
        // If not from expected source, use as is
        setPosterUrl(movie.posterUrl);
      }
    } else {
      // No poster URL provided, try TMDB
      fetchTMDBPoster().then(success => {
        if (!success) {
          setPosterUrl(defaultImage);
        }
      });
    }
  }, [movie.posterUrl, fetchTMDBPoster]);
  
  return (
    <div 
      className="movie-card" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default',
        width: '220px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        transition: 'all var(--transition-normal)',
        backgroundColor: 'var(--color-card)',
        transform: 'translateY(0)',
        position: 'relative'
      }}
      onMouseOver={(e) => {
        const target = e.currentTarget;
        target.style.transform = 'translateY(-5px)';
        target.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseOut={(e) => {
        const target = e.currentTarget;
        target.style.transform = 'translateY(0)';
        target.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <div 
        style={{ 
          height: '330px',
          overflow: 'hidden',
          position: 'relative',
          borderBottom: '1px solid var(--color-border)'
        }}
      >
        <img 
          src={posterUrl}
          alt={movie.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onError={async () => {
            await handleImageError();
          }}
        />
      </div>
      
      {/* Genre indicator */}
      {movie.type && (
        <div style={{
          position: 'absolute',
          top: 'var(--spacing-sm)',
          right: 'var(--spacing-sm)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {movie.type}
        </div>
      )}
      
      <div style={{ padding: 'var(--spacing-md)' }}>
        <h3 style={{ 
          margin: '0 0 var(--spacing-xs) 0', 
          fontSize: '1rem',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: 'var(--color-text)'
        }}>
          {movie.title}
        </h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: 'var(--color-text-light)'
        }}>
          {movie.releaseYear && (
            <span>{movie.releaseYear}</span>
          )}
          
          {movie.rating && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ 
                fontSize: '10px', 
                color: 'var(--color-secondary)' 
              }}>★</span>
              {movie.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
