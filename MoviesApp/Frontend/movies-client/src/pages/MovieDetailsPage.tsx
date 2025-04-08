import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Movie, Rating, movieApi, ratingApi } from '../services/api';

const MovieDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  
  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch movie details
        const movieResponse = await movieApi.getById(id);
        setMovie(movieResponse.data);
        
        // Fetch ratings for this movie
        const ratingsResponse = await ratingApi.getByMovie(id);
        setRatings(ratingsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovieDetails();
  }, [id]);
  
  const handleRatingChange = (newRating: number) => {
    setUserRating(newRating);
    // In a real app, you would send this rating to the backend
    // after checking if the user is logged in
    alert('In a complete app, this would save your rating of ' + newRating);
  };
  
  if (loading) return <div>Loading movie details...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!movie) return <div>Movie not found</div>;
  
  // Calculate average rating
  const averageRating = ratings.length 
    ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length
    : 0;
    
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          padding: '8px 16px',
          background: 'transparent',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        &larr; Back
      </button>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row',
        gap: '30px',
        flexWrap: 'wrap'
      }}>
        {/* Movie poster */}
        <div style={{ flexBasis: '300px', flexShrink: 0 }}>
          <img 
            src={movie.posterUrl || "https://via.placeholder.com/300x450?text=No+Image"} 
            alt={movie.title}
            style={{ 
              width: '100%',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
        </div>
        
        {/* Movie details */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ marginTop: 0 }}>{movie.title}</h1>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            margin: '15px 0'
          }}>
            <div style={{
              backgroundColor: '#f3ce13',
              color: 'black',
              fontWeight: 'bold',
              padding: '4px 8px',
              borderRadius: '4px',
              marginRight: '10px'
            }}>
              ⭐ {averageRating.toFixed(1)}
            </div>
            <span>{ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}</span>
          </div>
          
          <div style={{ margin: '20px 0' }}>
            <p><strong>Type:</strong> {movie.type}</p>
            <p><strong>Year:</strong> {movie.releaseYear}</p>
            {movie.director && <p><strong>Director:</strong> {movie.director}</p>}
            {movie.duration && <p><strong>Duration:</strong> {movie.duration}</p>}
            {movie.rating && <p><strong>Content Rating:</strong> {movie.rating}</p>}
          </div>
          
          {movie.description && (
            <div style={{ margin: '20px 0' }}>
              <h3>Description</h3>
              <p>{movie.description}</p>
            </div>
          )}
          
          {movie.cast && (
            <div style={{ margin: '20px 0' }}>
              <h3>Cast</h3>
              <p>{movie.cast}</p>
            </div>
          )}
          
          {/* Rating functionality */}
          <div style={{ margin: '30px 0' }}>
            <h3>Rate this {movie.type}</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: userRating === rating ? '2px solid #f3ce13' : '1px solid #ccc',
                    borderRadius: '50%',
                    background: userRating >= rating ? '#f3ce13' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;
