import { useEffect, useState } from 'react';
import { Movie, movieApi } from '../services/api';
import MovieCard from '../components/MovieCard';
import { useNavigate } from 'react-router-dom';

const TVShowsPage = () => {
  const [tvShows, setTVShows] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<string>('title');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const minItemsToDisplay = 12;
  const navigate = useNavigate();

  const fetchTVShows = async (pageNum: number, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      let response;
      
      // Determine which API to call based on user's selection
      if (searchQuery) {
        response = await movieApi.searchMovies(searchQuery, searchField, pageNum);
      } else if (selectedGenres.length > 0) {
        // Use the multi-genre endpoint when multiple genres are selected
        response = await movieApi.getByMultipleGenres(selectedGenres, pageNum);
      } else {
        response = await movieApi.getAll(pageNum);
      }
      
      // Filter results to only include TV shows
      const tvShowsOnly = response.data.filter(item => item.type === 'TV Show');
      
      // Update state based on whether this is the first page or a subsequent page
      if (pageNum === 1) {
        setTVShows(tvShowsOnly);
      } else {
        setTVShows(prev => [...prev, ...tvShowsOnly]);
      }
      
      // Determine if there are more results to load
      setHasMore(response.data.length > 0);
      
      return tvShowsOnly;
    } catch (err) {
      console.error('Error fetching TV shows:', err);
      setError('Failed to load TV shows. Please try again later.');
      return [];
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  // Initial load of TV shows
  useEffect(() => {
    const loadInitialTVShows = async () => {
      const initialShows = await fetchTVShows(1, true);
      
      // If we don't have enough shows after filtering, load more automatically
      let currentPage = 1;
      let currentShows = [...initialShows];
      
      while (currentShows.length < minItemsToDisplay && hasMore) {
        currentPage++;
        const moreShows = await fetchTVShows(currentPage, false);
        if (moreShows.length === 0) break; // No more shows available
        currentShows = [...currentShows, ...moreShows];
        setPage(currentPage);
      }
    };

    loadInitialTVShows();
  }, [selectedGenres, searchQuery]);

  const loadMore = async () => {
    if (!loading && !isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      await fetchTVShows(nextPage, false);
    }
  };

  // Handle scroll events for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 100 &&
        !loading &&
        !isLoadingMore &&
        hasMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, isLoadingMore, hasMore]);

  const handleGenreClick = (genre: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
    setPage(1);
    setSearchQuery('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedGenres([]);
    setPage(1);
    await fetchTVShows(1, true); // trigger fetch only on button click
  };
  
  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSearchQuery('');
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
                placeholder={`Search by ${searchField}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                style={{
                  width: '120px',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text)'
                }}
              >
                <option value="title">Title</option>
                <option value="director">Director</option>
                <option value="cast">Cast</option>
                <option value="year">Year</option>
              </select>
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
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-md)'
          }}>
            <h4 style={{ margin: 0 }}>Filter by genre:</h4>
            {(selectedGenres.length > 0 || searchQuery) && (
              <button
                onClick={handleClearFilters}
                style={{
                  backgroundColor: 'var(--color-error)',
                  color: 'white',
                  border: 'none',
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
          
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
              { id: 'naturetv', label: 'Nature TV' }
            ].map(genre => (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre.id)}
                style={{
                  border: '1px solid var(--color-border)',
                  backgroundColor: selectedGenres.includes(genre.id) ? 'var(--color-primary)' : 'white',
                  color: selectedGenres.includes(genre.id) ? 'white' : 'var(--color-text)',
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
              <MovieCard 
                key={show.showId} 
                movie={show} 
                onClick={() => navigate(`/movie/${show.showId}`)}
              />
            ))}
          </div>
        )}
        
        {(loading || isLoadingMore) && tvShows.length > 0 && (
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
