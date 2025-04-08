import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { User } from '../services/api';

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
    setUser(null);
    navigate('/');
  };
  
  return (
    <nav style={{
      backgroundColor: '#0078d4',
      color: 'white',
      padding: '0 20px',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '22px' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
        dfasdfasfads
          </Link>
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link 
            to="/" 
            style={{ color: 'white', textDecoration: 'none' }}
          >
            Home
          </Link>
          
          {user ? (
            <>
              <span style={{ color: 'white' }}>
                Welcome, {user.name}
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '16px'
                }}
              >
                Logout
              </button>
            </>
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
