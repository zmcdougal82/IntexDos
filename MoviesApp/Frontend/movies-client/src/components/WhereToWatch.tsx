import React, { useState, useEffect } from 'react';
import { streamingApi, StreamingServiceInfo } from '../services/streamingApi';

// Props for the WhereToWatch component
interface WhereToWatchProps {
  title: string;
  year?: string | number;
  isTV?: boolean;
  compact?: boolean; // Whether to display in a compact layout
}

const WhereToWatch: React.FC<WhereToWatchProps> = ({ 
  title, year, isTV = false, compact = false 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [streamingServices, setStreamingServices] = useState<StreamingServiceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamingServices = async () => {
      try {
        setIsLoading(true);
        
        console.log(`Fetching streaming availability for: "${title}" (${year}) - ${isTV ? 'TV Show' : 'Movie'}`);
        
        const services = await streamingApi.getStreamingProvidersByTitle(title, year, isTV);
        setStreamingServices(services);
        setError(null);
      } catch (err) {
        console.error('Error fetching streaming services:', err);
        setError('Unable to load streaming availability');
      } finally {
        setIsLoading(false);
      }
    };

    if (title) {
      fetchStreamingServices();
    } else {
      console.warn('No title provided for streaming availability lookup');
    }
  }, [title, year, isTV]);

  // Categorize streaming services by type
  const subscriptionServices = streamingServices.filter(service => service.streamingType === 'flatrate');
  const rentalServices = streamingServices.filter(service => service.streamingType === 'rent');
  const purchaseServices = streamingServices.filter(service => service.streamingType === 'buy');

  // Check if no streaming services are available
  const noServices = !isLoading && streamingServices.length === 0;

  // Return null if there are no services to display and there's no error
  if (noServices && !error) {
    return null;
  }

  // Content to render for both compact and full views
  const renderStreamingServices = () => {
    if (isLoading) {
      return <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Loading streaming availability...</div>;
    }
    
    if (error) {
      return <div style={{ color: 'var(--color-danger, red)', fontSize: '0.9rem' }}>{error}</div>;
    }
    
    if (noServices) {
      return <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>No streaming services available</div>;
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {/* Subscription Services */}
        {subscriptionServices.length > 0 && (
          <div>
            <h4 style={{ 
              margin: 0, 
              marginBottom: 'var(--spacing-xs)', 
              fontSize: '0.9rem', 
              color: 'var(--color-text-light)', 
              fontWeight: 500 
            }}>
              Stream
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
              {subscriptionServices.map((service) => (
                <a 
                  key={`${service.providerId}-${service.streamingType}`}
                  href={service.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                  title={`Watch on ${service.providerName}`}
                >
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    backgroundColor: 'var(--color-background-light, #f8f8f8)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}>
                    <img 
                      src={service.logoUrl} 
                      alt={service.providerName} 
                      style={{ 
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        objectFit: 'contain'
                      }} 
                    />
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500, 
                      color: 'var(--color-text)'
                    }}>
                      {service.providerName}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Rental Services */}
        {rentalServices.length > 0 && (
          <div>
            <h4 style={{ 
              margin: 0, 
              marginBottom: 'var(--spacing-xs)', 
              fontSize: '0.9rem', 
              color: 'var(--color-text-light)', 
              fontWeight: 500 
            }}>
              Rent
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
              {rentalServices.map((service) => (
                <a 
                  key={`${service.providerId}-${service.streamingType}`}
                  href={service.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                  title={`Rent on ${service.providerName}`}
                >
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    backgroundColor: 'var(--color-background-light, #f8f8f8)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}>
                    <img 
                      src={service.logoUrl} 
                      alt={service.providerName} 
                      style={{ 
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        objectFit: 'contain'
                      }} 
                    />
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500, 
                      color: 'var(--color-text)'
                    }}>
                      {service.providerName}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Purchase Services */}
        {purchaseServices.length > 0 && (
          <div>
            <h4 style={{ 
              margin: 0, 
              marginBottom: 'var(--spacing-xs)', 
              fontSize: '0.9rem', 
              color: 'var(--color-text-light)', 
              fontWeight: 500 
            }}>
              Buy
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
              {purchaseServices.map((service) => (
                <a 
                  key={`${service.providerId}-${service.streamingType}`}
                  href={service.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                  title={`Buy on ${service.providerName}`}
                >
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    backgroundColor: 'var(--color-background-light, #f8f8f8)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}>
                    <img 
                      src={service.logoUrl} 
                      alt={service.providerName} 
                      style={{ 
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        objectFit: 'contain'
                      }} 
                    />
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500, 
                      color: 'var(--color-text)'
                    }}>
                      {service.providerName}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Data attribution */}
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textAlign: 'right', marginTop: '4px' }}>
          Streaming data via TMDB
        </div>
      </div>
    );
  };

  // For compact mode, just render the streaming services directly
  if (compact) {
    return renderStreamingServices();
  }

  // For full mode, render with a container and header
  return (
    <div style={{ 
      backgroundColor: 'var(--color-background)',
      padding: 'var(--spacing-md)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      marginBottom: 'var(--spacing-md)'
    }}>
      <h3 style={{ 
        color: 'var(--color-text)', 
        fontWeight: 600, 
        fontSize: '1.1rem',
        marginTop: 0,
        marginBottom: 'var(--spacing-md)'
      }}>
        Where to Watch
      </h3>
      
      {renderStreamingServices()}
    </div>
  );
};

export default WhereToWatch;
