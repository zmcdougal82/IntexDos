import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Movie, Rating, User, movieApi, ratingApi } from '../services/api';

const MovieDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    
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
        
        // Check if logged-in user has already rated this movie
        if (user) {
          const userRating = ratingsResponse.data.find(r => r.userId === user.userId);
          if (userRating) {
            setUserRating(userRating.ratingValue);
            setRatingSubmitted(true);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to load movie details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovieDetails();
  }, [id, user]);
  
  const handleRatingChange = async (newRating: number) => {
    if (!user) {
      // Redirect to login if not logged in
      navigate('/login', { state: { from: `/movie/${id}` } });
      return;
    }
    
    if (!id) return;
    
    setUserRating(newRating);
    
    try {
      const ratingData = {
        userId: user.userId,
        showId: id,
        ratingValue: newRating
      };
      
      await ratingApi.addRating(ratingData);
      
      // Update the UI to show this rating is now submitted
      setRatingSubmitted(true);
      
      // Refresh ratings for this movie
      const ratingsResponse = await ratingApi.getByMovie(id);
      setRatings(ratingsResponse.data);
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit your rating. Please try again.');
    }
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
            
            {!user && (
              <p style={{ marginBottom: '15px' }}>
                <a 
                  href="/login" 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/login', { state: { from: `/movie/${id}` } });
                  }}
                  style={{ color: '#0078d4', textDecoration: 'none' }}
                >
                  Log in
                </a> to rate this {movie.type}
              </p>
            )}
            
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
                    cursor: user ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    opacity: user ? 1 : 0.6
                  }}
                  disabled={!user}
                >
                  {rating}
                </button>
              ))}
            </div>
            
            {ratingSubmitted && (
              <p style={{ color: 'green', marginTop: '10px' }}>
                Your rating has been submitted!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;
