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
        margin: '15px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.3s ease',
      }}
    >
      <div 
        style={{ 
          height: '330px', 
          backgroundImage: `url(${movie.posterUrl || defaultImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} 
      />
      <div style={{ padding: '12px' }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '18px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {movie.title}
        </h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>{movie.releaseYear}</span>
          <span>{movie.type}</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
