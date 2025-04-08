import { useEffect, useState } from 'react';
import { Movie, movieApi } from '../services/api';
import MovieCard from '../components/MovieCard';

const TVShowsPage = () => {
  const [tvShows, setTVShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchTVShows = async () => {
      try {
        setLoading(true);
        let response;
        
        // Determine which API to call based on user's selection
        if (searchQuery) {
          response = await movieApi.searchMovies(searchQuery);
        } else if (selectedGenre) {
          response = await movieApi.getByGenre(selectedGenre, page);
        } else {
          response = await movieApi.getAll(page);
        }
        
        // Filter results to only include TV shows
        const tvShowsOnly = response.data.filter(item => item.type === 'TV Show');
        
        // Update state based on whether this is the first page or a subsequent page
        if (page === 1) {
          setTVShows(tvShowsOnly);
        } else {
          setTVShows(prev => [...prev, ...tvShowsOnly]);
        }
        
        // Determine if there are more results to load
        setHasMore(tvShowsOnly.length > 0);
      } catch (err) {
        console.error('Error fetching TV shows:', err);
        setError('Failed to load TV shows. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTVShows();
  }, [page, selectedGenre, searchQuery]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Handle scroll events for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 100 &&
        !loading &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(prev => prev === genre ? null : genre);
    setPage(1);
    setSearchQuery('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedGenre(null);
    setPage(1);
  };

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <h1 style={{ 
          textAlign: 'center', 
          color: 'var(--color-primary)',
          fontSize: '2.5rem',
          marginBottom: 'var(--spacing-lg)'
        }}>
          TV Shows
        </h1>
        
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto var(--spacing-xl)',
        }}>
          <form onSubmit={handleSearch} style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <input
                type="text"
                placeholder="Search titles, directors, or actors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                type="submit"
                style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: 'white',
                  border: 'none',
                  padding: '0 var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>
          </form>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            {[
              { id: 'tvaction', label: 'TV Action' },
              { id: 'tvcomedies', label: 'TV Comedies' },
              { id: 'tvdramas', label: 'TV Dramas' },
              { id: 'docuseries', label: 'Docuseries' },
              { id: 'kidstv', label: 'Kids\' TV' },
              { id: 'realitytv', label: 'Reality TV' },
              { id: 'internationaltvshows', label: 'International TV Shows' },
              { id: 'crimetvshows', label: 'Crime TV Shows' },
              { id: 'talkshows', label: 'Talk Shows' },
              { id: 'animeseries', label: 'Anime Series' },
              { id: 'britishtvshows', label: 'British TV Shows' },
              { id: 'romantictvshows', label: 'Romantic TV Shows' },
              { id: 'languagetvshows', label: 'Language Shows' },
              { id: 'naturetv', label: 'Nature TV' },
              { id: 'spirituality', label: 'Spirituality' }
            ].map(genre => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                style={{
                  border: '1px solid var(--color-border)',
                  backgroundColor: selectedGenre === genre.id ? 'var(--color-primary)' : 'white',
                  color: selectedGenre === genre.id ? 'white' : 'var(--color-text)',
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)'
                }}
              >
                {genre.label}
              </button>
            ))}
          </div>
        </div>
        
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : loading && tvShows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            Loading TV shows...
          </div>
        ) : tvShows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            No TV shows found. Try a different search or filter.
          </div>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--spacing-lg)',
            padding: '0 var(--spacing-md)'
          }}>
            {tvShows.map((show) => (
              <MovieCard key={show.showId} movie={show} />
            ))}
          </div>
        )}
        
        {loading && tvShows.length > 0 && (
          <div style={{ 
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-text-light)'
          }}>
            Loading more TV shows...
          </div>
        )}
      </div>
    </div>
  );
};

export default TVShowsPage;
