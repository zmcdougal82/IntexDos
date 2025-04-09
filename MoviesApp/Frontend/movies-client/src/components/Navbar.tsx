import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { User, isAdmin } from '../services/api';
import UserProfileMenu from './UserProfileMenu';

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
    // Use window.location.href instead of navigate to refresh the page
    window.location.href = '/';
  };
  
  return (
    <nav style={{
      backgroundColor: '#1e3a8a',
      color: 'white',
      padding: '0 20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '70px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '24px',
          fontFamily: 'Montserrat, sans-serif',
          letterSpacing: '-0.5px'
        }}>
          <Link to="/" style={{ 
            color: 'white', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#f97316',
              color: 'white',
              fontSize: '18px'
            }}>C</span>
            CineNiche
          </Link>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '24px',
          fontFamily: 'Roboto, sans-serif',
          fontSize: '15px',
          fontWeight: 500,
          alignItems: 'center'
        }}>
          <Link 
            to="/" 
            style={{ color: 'white', textDecoration: 'none' }}
          >
            Home
          </Link>
          <Link 
            to="/movies" 
            style={{ color: 'white', textDecoration: 'none' }}
          >
            Movies
          </Link>
          <Link 
            to="/tvshows" 
            style={{ color: 'white', textDecoration: 'none' }}
          >
            TV Shows
          </Link>
          
          {user && (
            <>
              <Link 
                to="/watchlist" 
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Watchlist
              </Link>
              <Link 
                to="/ratings" 
                style={{ color: 'white', textDecoration: 'none' }}
              >
                My Ratings
              </Link>
              {isAdmin(user) && (
                <Link 
                  to="/admin/movies" 
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    backgroundColor: '#f97316', 
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  Admin Dashboard
                </Link>
              )}
            </>
          )}
          
          {user ? (
            <UserProfileMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link 
                to="/login" 
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                style={{ color: 'white', textDecoration: 'none' }}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
