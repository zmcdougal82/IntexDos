import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RegisterRequest, userApi } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await userApi.register(formData);
      
      // In a real application, you would store the user in context or local storage
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Refresh page to ensure navbar updates with the user profile
      window.location.href = '/';
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data || 'Registration failed. Please try again.');
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
            Create Your Account
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
              <label htmlFor="name" className="mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="email" className="mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="password" className="mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
              <p style={{ 
                fontSize: '0.8rem', 
                color: 'var(--color-text-light)',
                marginTop: 'var(--spacing-xs)'
              }}>
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="confirmPassword" className="mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-secondary)',
                marginTop: 'var(--spacing-md)',
                fontSize: '1rem',
                fontWeight: 500
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            
            <div style={{ 
              marginTop: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--color-text-light)'
            }}>
              Already have an account?{' '}
              <Link 
                to="/login"
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 500
                }}
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
