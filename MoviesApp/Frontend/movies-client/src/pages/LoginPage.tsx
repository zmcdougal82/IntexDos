import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginRequest, userApi } from '../services/api';

const LoginPage = () => {
  const [credentials, setCredentials] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.login(credentials);
      
      // In a real application, you would store the user in context or local storage
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Refresh page to ensure navbar updates with the user profile
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 180px)', 
        padding: 'var(--spacing-lg)'
      }}>
        <div className="card" style={{
          width: '100%',
          maxWidth: '450px',
          padding: 'var(--spacing-xl)',
          border: '1px solid var(--color-border)'
        }}>
          <h1 style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--spacing-xl)',
            color: 'var(--color-primary)'
          }}>
            Welcome Back
          </h1>
          
          {error && (
            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: '#fff5f5',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)',
              borderLeft: '4px solid var(--color-error)'
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label 
                htmlFor="email"
                className="mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-sm)'
              }}>
                <label htmlFor="password">Password</label>
                <a 
                  href="#" 
                  style={{ 
                    fontSize: '0.875rem',
                    color: 'var(--color-text-light)'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset functionality would be implemented here');
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-primary)',
                marginTop: 'var(--spacing-md)',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div style={{ 
              marginTop: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--color-text-light)'
            }}>
              Don't have an account?{' '}
              <Link 
                to="/register"
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 500
                }}
              >
                Create account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
