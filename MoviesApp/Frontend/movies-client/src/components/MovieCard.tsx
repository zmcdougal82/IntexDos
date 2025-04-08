import { Movie } from '../services/api';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick }) => {
  const defaultImage = "https://via.placeholder.com/150x225?text=No+Image";
  
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
          backgroundImage: `url(${movie.posterUrl || defaultImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid var(--color-border)'
        }} 
      />
      
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
