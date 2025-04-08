import { Movie } from '../services/api';
import { useState, useEffect } from 'react';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const defaultImage = "https://via.placeholder.com/150x225?text=No+Image";
  const [posterUrl, setPosterUrl] = useState<string>(defaultImage);
  
  useEffect(() => {
    if (movie.posterUrl) {
      // Check if this is an Azure URL
      if (movie.posterUrl.includes('moviesappsa79595.blob.core.windows.net')) {
        // Use the new SAS token provided for the storage account
        const sasToken = "sp=r&st=2025-04-08T10:57:41Z&se=2026-04-08T18:57:41Z&sv=2024-11-04&sr=c&sig=pAoCi15RVSDceDfeusN0dAmD8KqKAKC4Gkjh0qaOI5I%3D";
        
        // Use the movie title to create the proper filename
        // This matches the format: "Movie Title.jpg"
        const properFileName = movie.title + '.jpg';
        
        // Format according to the correct pattern with unencoded spaces and the new SAS token
        setPosterUrl(`https://moviesappsa79595.blob.core.windows.net/movie-posters/Movie Posters/${properFileName}?${sasToken}`);
      } else {
        // If not from expected source, use as is
        setPosterUrl(movie.posterUrl);
      }
    } else {
      setPosterUrl(defaultImage);
    }
  }, [movie.posterUrl]);
  
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
          onError={(e) => {
            // Fallback to default image on error
            e.currentTarget.src = defaultImage;
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
