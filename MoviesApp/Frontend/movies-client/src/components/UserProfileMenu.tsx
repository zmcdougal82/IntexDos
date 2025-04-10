import { useState, useRef, useEffect } from 'react';
import { User, isAdmin } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface UserProfileMenuProps {
  user: User;
  onLogout: () => void;
}

const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-secondary)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.875rem',
          transition: 'all var(--transition-normal)',
          position: 'relative'
        }}
        aria-label="User profile menu"
      >
        {getInitials(user.name)}
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            backgroundColor: 'var(--color-card)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            zIndex: 10
          }}
        >
          <div
            style={{
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'white'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{user.email}</div>
            {user.role && (
              <div 
                style={{ 
                  fontSize: '0.75rem', 
                  backgroundColor: 'var(--color-secondary)',
                  display: 'inline-block',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}
              >
                {user.role}
              </div>
            )}
          </div>
          
          <div style={{ padding: 'var(--spacing-sm) 0' }}>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text)',
                transition: 'background-color var(--transition-normal)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ marginRight: 'var(--spacing-md)' }}>👤</span>
              My Profile
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/ratings');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text)',
                transition: 'background-color var(--transition-normal)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ marginRight: 'var(--spacing-md)' }}>⭐</span>
              My Ratings
            </button>
            
            {isAdmin(user) && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin/movies');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--color-text)',
                  transition: 'background-color var(--transition-normal)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-background)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ marginRight: 'var(--spacing-md)' }}>⚙️</span>
                Admin Dashboard
              </button>
            )}
            
            <hr style={{ 
              margin: 'var(--spacing-xs) 0', 
              border: 'none', 
              borderTop: '1px solid var(--color-border)' 
            }} />
            
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-error)',
                transition: 'background-color var(--transition-normal)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ marginRight: 'var(--spacing-md)' }}>🚪</span>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
