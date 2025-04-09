import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';
import { User, isAdmin } from '../services/api'; // make sure interfaces are imported correctly

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const storedUserId = localStorage.getItem('userId'); // or 'user' if you're storing full object

      if (!storedUserId) {
        navigate('/login', { state: { from: '/profile' } });
        return;
      }

      try {
        const response = await userApi.getById(storedUserId);
        setUser(response.data); // assuming you're using Axios (which returns `.data`)
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigate('/login', { state: { from: '/profile' } });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="container mt-4">Loading profile...</div>;
  }

  if (!user) {
    return <div className="container mt-4">User not found.</div>;
  }

  return (
    <div className="container">
      <div className="mt-4 mb-5">
        <h1 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-lg)' }}>
          My Profile
        </h1>
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              display: 'flex',
              gap: 'var(--spacing-xl)',
              flexWrap: 'wrap'
            }}>
              {/* Profile picture/avatar */}
              <div style={{ 
                flexBasis: '200px', 
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-md)'
              }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '1.25rem',
                    color: 'var(--color-text)'
                  }}>
                    {user.name}
                  </div>
                  
                  {user.role && (
                    <div style={{ 
                      display: 'inline-block',
                      backgroundColor: isAdmin(user) ? '#1d4ed8' : 'var(--color-secondary)',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      marginTop: 'var(--spacing-xs)'
                    }}>
                      {user.role}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile details */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h2 style={{ 
                  color: 'var(--color-text)',
                  fontSize: '1.5rem',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  Account Information
                </h2>
                
                <div className="card" style={{ 
                  backgroundColor: 'var(--color-background)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                        Email
                      </div>
                      <div>{user.email}</div>
                    </div>
                    
                    {user.age && (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                          Age
                        </div>
                        <div>{user.age}</div>
                      </div>
                    )}
                    
                    {user.gender && (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                          Gender
                        </div>
                        <div>{user.gender}</div>
                      </div>
                    )}
                    
                    {(user.city || user.state || user.zip) && (
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
                          Location
                        </div>
                        <div>
                          {[
                            user.city,
                            user.state,
                            user.zip
                          ].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <h2 style={{ 
                  color: 'var(--color-text)',
                  fontSize: '1.5rem',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  Streaming Services
                </h2>
                
                <div className="card" style={{ 
                  backgroundColor: 'var(--color-background)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-md)'
                  }}>
                    {[
                      { key: 'netflix', name: 'Netflix' },
                      { key: 'amazonPrime', name: 'Amazon Prime' },
                      { key: 'disneyPlus', name: 'Disney+' },
                      { key: 'paramountPlus', name: 'Paramount+' },
                      { key: 'max', name: 'Max' },
                      { key: 'hulu', name: 'Hulu' },
                      { key: 'appleTVPlus', name: 'Apple TV+' },
                      { key: 'peacock', name: 'Peacock' }
                    ].map(service => (
                      <div 
                        key={service.key} 
                        style={{
                          padding: 'var(--spacing-xs) var(--spacing-md)',
                          backgroundColor: user[service.key as keyof User] === 1 ? 'var(--color-primary)' : 'var(--color-border)',
                          color: user[service.key as keyof User] === 1 ? 'white' : 'var(--color-text-light)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.9rem'
                        }}
                      >
                        {service.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProfilePage;