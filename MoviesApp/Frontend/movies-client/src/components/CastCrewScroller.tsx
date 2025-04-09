import React, { useState, useEffect } from 'react';
import { tmdbApi } from '../services/tmdbApi';

// Types for component props
interface CastCrewScrollerProps {
  title: string;
  year?: string | number;
  isTV?: boolean;
  maxCastMembers?: number;
}

// Types for the cast and crew data
interface PersonCard {
  name: string;
  role: string; // Character name for actors, job title for crew
  profileUrl: string | null;
  department?: string; // Only for crew members
}

const DEFAULT_PROFILE_IMAGE = "https://placehold.co/200x300/2c3e50/FFFFFF?text=No+Photo&font=montserrat";

const CastCrewScroller: React.FC<CastCrewScrollerProps> = ({ 
  title, 
  year, 
  isTV = false,
  maxCastMembers = 10
}) => {
  const [directors, setDirectors] = useState<PersonCard[]>([]);
  const [cast, setCast] = useState<PersonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCastAndCrew = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch directors (or creators for TV shows)
        const directorsData = await tmdbApi.getDirectors(title, year, isTV);
        setDirectors(directorsData.map(director => ({
          name: director.name,
          role: director.job,
          profileUrl: director.profileUrl
        })));
        
        // Fetch main cast
        const castData = await tmdbApi.getCast(title, year, isTV, maxCastMembers);
        setCast(castData.map(actor => ({
          name: actor.name,
          role: actor.character,
          profileUrl: actor.profileUrl
        })));
        
      } catch (err) {
        console.error('Error fetching cast and crew:', err);
        setError('Failed to load cast and crew data');
      } finally {
        setLoading(false);
      }
    };
    
    if (title) {
      fetchCastAndCrew();
    }
  }, [title, year, isTV, maxCastMembers]);

  // Render a person card (director or cast member)
  const renderPersonCard = (person: PersonCard, index: number) => (
    <div 
      key={`${person.name}-${index}`} 
      className="person-card"
      style={{
        minWidth: '140px',
        maxWidth: '160px',
        margin: '0 8px',
        textAlign: 'center',
        marginBottom: '16px',
      }}
    >
      <div 
        style={{
          width: '140px',
          height: '210px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '8px',
          background: '#f0f0f0',
        }}
      >
        <img 
          src={person.profileUrl || DEFAULT_PROFILE_IMAGE} 
          alt={person.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            // Set fallback image on error
            (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE;
          }}
        />
      </div>
      <h4 
        style={{
          margin: '0',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {person.name}
      </h4>
      <p 
        style={{
          margin: '4px 0 0',
          fontSize: '0.85rem',
          color: 'var(--color-text-light)',
          fontStyle: 'italic',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {person.role}
      </p>
    </div>
  );

  // Render a horizontal scroll section
  const renderScrollSection = (title: string, people: PersonCard[]) => (
    <div style={{ marginBottom: '24px' }}>
      <h3 
        style={{ 
          color: 'var(--color-text)',
          fontWeight: 600,
          marginBottom: '16px',
        }}
      >
        {title}
      </h3>
      
      {people.length === 0 ? (
        <p style={{ color: 'var(--color-text-light)' }}>
          No information available
        </p>
      ) : (
        <div 
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-border) transparent',
            padding: '8px 0',
            margin: '0 -16px',
          }}
        >
          <div 
            style={{
              display: 'flex',
              padding: '0 16px',
            }}
          >
            {people.map(renderPersonCard)}
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '20px 0' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
          Loading cast and crew information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px 0' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
          {error}
        </div>
      </div>
    );
  }

  // Don't render anything if no cast or crew is found
  if (directors.length === 0 && cast.length === 0) {
    return null;
  }

  // Combine directors and cast into one array for a single row
  // Directors/creators are always listed first, followed by cast
  const combinedCastCrew = [
    // Include all directors/creators with a slightly more prominent styling
    ...directors.map(director => ({
      ...director,
      // Make director/creator names appear in a more distinct way
      name: director.name,
      role: director.role, // This will be Director, Creator, etc.
      isDirector: true // Flag to identify directors/creators
    })),
    ...cast
  ];
  
  // Override the renderPersonCard function to highlight directors
  const renderCombinedPersonCard = (person: PersonCard & { isDirector?: boolean }, index: number) => (
    <div 
      key={`${person.name}-${index}`} 
      className="person-card"
      style={{
        minWidth: '140px',
        maxWidth: '160px',
        margin: '0 8px',
        textAlign: 'center',
        marginBottom: '16px',
      }}
    >
      <div 
        style={{
          width: '140px',
          height: '210px',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: person.isDirector ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          marginBottom: '8px',
          background: '#f0f0f0',
          // Directors get a subtle gold highlight
          border: person.isDirector ? '2px solid gold' : 'none'
        }}
      >
        <img 
          src={person.profileUrl || DEFAULT_PROFILE_IMAGE} 
          alt={person.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            // Set fallback image on error
            (e.target as HTMLImageElement).src = DEFAULT_PROFILE_IMAGE;
          }}
        />
      </div>
      <h4 
        style={{
          margin: '0',
          fontSize: person.isDirector ? '1.1rem' : '1rem', // Slightly larger text for directors
          fontWeight: 600,
          color: person.isDirector ? 'var(--color-primary)' : 'var(--color-text)', // Different color for directors
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {person.name}
      </h4>
      <p 
        style={{
          margin: '4px 0 0',
          fontSize: '0.85rem',
          color: person.isDirector ? 'var(--color-secondary)' : 'var(--color-text-light)', // Different color for directors
          fontWeight: person.isDirector ? 500 : 400, // Bolder for directors
          fontStyle: 'italic',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {person.role}
      </p>
    </div>
  );

  return (
    <div className="cast-crew-scroller">
      {combinedCastCrew.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 
            style={{ 
              color: 'var(--color-text)',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            Cast & Crew
          </h3>
          
          <div 
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--color-border) transparent',
              padding: '8px 0',
              margin: '0 -16px',
            }}
          >
            <div 
              style={{
                display: 'flex',
                padding: '0 16px',
              }}
            >
              {combinedCastCrew.map(renderCombinedPersonCard)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CastCrewScroller;
