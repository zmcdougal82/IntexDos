import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Movie, Rating, User, movieApi, ratingApi } from '../services/api';
import { tmdbApi } from '../services/tmdbApi';

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
  // Larger, better looking fallback image for the details page
  const [posterUrl, setPosterUrl] = useState<string>("https://placehold.co/480x720/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat");
  
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
        
        // Function to fetch a poster from TMDB
        const fetchTMDBPoster = async (movieTitle: string, releaseYear?: string | number, isTV: boolean = false) => {
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
            const tmdbPosterUrl = await tmdbApi.getPosterUrl(movieTitle, year, isTV);
            
            if (tmdbPosterUrl) {
              console.log(`TMDB poster found for ${movieTitle}`);
              setPosterUrl(tmdbPosterUrl);
              return true;
            }
            return false;
          } catch (error) {
            console.error('Error fetching TMDB poster:', error);
            return false;
          }
        };

        // Process the poster URL
        if (movieResponse.data.posterUrl) {
          const url = movieResponse.data.posterUrl;
          
          // Check if this is an Azure URL
          if (url.includes('moviesappsa79595.blob.core.windows.net')) {
            // Use the new SAS token provided for the storage account
            const sasToken = "sp=r&st=2025-04-08T10:57:41Z&se=2026-04-08T18:57:41Z&sv=2024-11-04&sr=c&sig=pAoCi15RVSDceDfeusN0dAmD8KqKAKC4Gkjh0qaOI5I%3D";
            
            // Create properly formatted URL with the movie title
            const properFileName = movieResponse.data.title + '.jpg';
            
            // Format according to the correct pattern with unencoded spaces and the new SAS token
            setPosterUrl(`https://moviesappsa79595.blob.core.windows.net/movie-posters/Movie Posters/${properFileName}?${sasToken}`);
          } else {
            // If not from expected source, use as is
            setPosterUrl(url);
          }
        } else {
          // No poster URL, try TMDB
          const tmdbSuccess = await fetchTMDBPoster(
            movieResponse.data.title, 
            movieResponse.data.releaseYear, 
            movieResponse.data.type === 'TV Show'
          );
          
          if (!tmdbSuccess) {
            setPosterUrl("https://placehold.co/480x720/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat");
          }
        }
        
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
      // Ensure userId is a number
      if (!user.userId) {
        console.error('User ID is undefined');
        alert('Unable to submit rating. Please try logging in again.');
        return;
      }
      
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
    <div className="container">
      <div className="mt-4">
        <button 
          onClick={() => navigate(-1)}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            marginBottom: 'var(--spacing-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            transition: 'all var(--transition-normal)',
            color: 'var(--color-text)',
            fontWeight: 500
          }}
          onMouseOver={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = 'var(--color-background)';
            target.style.borderColor = 'var(--color-primary)';
          }}
          onMouseOut={(e) => {
            const target = e.currentTarget;
            target.style.backgroundColor = 'transparent';
            target.style.borderColor = 'var(--color-border)';
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>&larr;</span> Back
        </button>
        
        <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            gap: 'var(--spacing-xl)',
            flexWrap: 'wrap'
          }}>
            {/* Movie poster */}
            <div style={{ flexBasis: '320px', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
              <img 
                src={posterUrl} 
                alt={movie.title}
                style={{ 
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)'
                }}
                onError={async () => {
                  console.log(`Azure poster failed for ${movie.title} on details page, trying TMDB...`);
                  const tmdbSuccess = await tmdbApi.getPosterUrl(
                    movie.title, 
                    movie.releaseYear ? parseInt(movie.releaseYear.toString()) : undefined, 
                    movie.type === 'TV Show'
                  );
                  
                  if (tmdbSuccess) {
                    setPosterUrl(tmdbSuccess);
                  } else {
                    setPosterUrl("https://placehold.co/480x720/2c3e50/FFFFFF?text=Poster+Coming+Soon&font=montserrat");
                  }
                }}
              />
                {movie.type && (
                  <div style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    right: 'var(--spacing-md)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {movie.type}
                  </div>
                )}
              </div>
              
              {/* Rating functionality for mobile devices */}
              <div className="mt-4 mobile-rating" style={{ display: 'none' }}>
                <h3>Rate this {movie.type || 'title'}</h3>
                
                {!user && (
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    <a 
                      href="/login" 
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/login', { state: { from: `/movie/${id}` } });
                      }}
                      style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                    >
                      Log in
                    </a> to rate this {movie.type || 'title'}
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      style={{
                        width: '45px',
                        height: '45px',
                        border: userRating === rating ? `2px solid var(--color-secondary)` : `1px solid var(--color-border)`,
                        borderRadius: '50%',
                        background: userRating >= rating ? 'var(--color-secondary)' : 'white',
                        color: userRating >= rating ? 'white' : 'var(--color-text)',
                        cursor: user ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        opacity: user ? 1 : 0.6,
                        transition: 'all var(--transition-normal)'
                      }}
                      disabled={!user}
                    >
                      {rating}
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
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ 
                marginTop: 0, 
                fontSize: '2.5rem',
                color: 'var(--color-primary)',
                marginBottom: 'var(--spacing-md)'
              }}>
                {movie.title}
              </h1>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                margin: 'var(--spacing-md) 0'
              }}>
                <div style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  marginRight: 'var(--spacing-md)',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontWeight: 'bold' }}>★</span> {averageRating.toFixed(1)}
                </div>
                <span style={{ color: 'var(--color-text-light)' }}>
                  {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
                </span>
              </div>
              
              <div className="card" style={{ 
                margin: 'var(--spacing-lg) 0',
                backgroundColor: 'var(--color-background)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)'
              }}>
                <div style={{ minWidth: '120px', flex: 1 }}>
                  <p style={{ margin: 0 }}><strong>Year:</strong> {movie.releaseYear || 'Unknown'}</p>
                </div>
                {movie.duration && (
                  <div style={{ minWidth: '120px', flex: 1 }}>
                    <p style={{ margin: 0 }}><strong>Duration:</strong> {movie.duration}</p>
                  </div>
                )}
                {movie.rating && (
                  <div style={{ minWidth: '120px', flex: 1 }}>
                    <p style={{ margin: 0 }}><strong>Content Rating:</strong> {movie.rating}</p>
                  </div>
                )}
              </div>
              
              {movie.description && (
                <div style={{ margin: 'var(--spacing-lg) 0' }}>
                  <h3 style={{ color: 'var(--color-text)', fontWeight: 600 }}>Description</h3>
                  <p style={{ 
                    lineHeight: 1.6,
                    color: 'var(--color-text)',
                    fontSize: '1.05rem'
                  }}>{movie.description}</p>
                </div>
              )}
              
              {movie.director && (
                <div style={{ margin: 'var(--spacing-lg) 0' }}>
                  <h3 style={{ color: 'var(--color-text)', fontWeight: 600 }}>Director</h3>
                  <p>{movie.director}</p>
                </div>
              )}
              
              {movie.cast && (
                <div style={{ margin: 'var(--spacing-lg) 0' }}>
                  <h3 style={{ color: 'var(--color-text)', fontWeight: 600 }}>Cast</h3>
                  <p>{movie.cast}</p>
                </div>
              )}
              
              {/* Rating functionality for desktop */}
              <div className="desktop-rating" style={{ 
                margin: 'var(--spacing-xl) 0'
              }}>
                <h3 style={{ color: 'var(--color-text)', fontWeight: 600 }}>
                  Rate this {movie.type || 'title'}
                </h3>
                
                {!user && (
                  <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    <a 
                      href="/login" 
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/login', { state: { from: `/movie/${id}` } });
                      }}
                      style={{ 
                        color: 'var(--color-primary)', 
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      Log in
                    </a> to rate this {movie.type || 'title'}
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      style={{
                        width: '45px',
                        height: '45px',
                        border: userRating === rating ? `2px solid var(--color-secondary)` : `1px solid var(--color-border)`,
                        borderRadius: '50%',
                        background: userRating >= rating ? 'var(--color-secondary)' : 'white',
                        color: userRating >= rating ? 'white' : 'var(--color-text)',
                        cursor: user ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        opacity: user ? 1 : 0.6,
                        transition: 'all var(--transition-normal)'
                      }}
                      disabled={!user}
                    >
                      {rating}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;
