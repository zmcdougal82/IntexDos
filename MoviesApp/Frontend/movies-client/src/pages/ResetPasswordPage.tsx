import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ResetPasswordRequest, authApi } from '../services/api';

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState<ResetPasswordRequest>({
    token: '',
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Parse token and email from URL query parameters
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const email = params.get('email');
    
    if (token && email) {
      setFormData(prev => ({
        ...prev,
        token,
        email
      }));
    } else {
      setError('Invalid or missing reset link parameters');
    }
  }, [location]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please enter both password fields');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await authApi.resetPassword(formData);
      
      setSuccess('Your password has been reset successfully');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Invalid or expired reset token');
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
            Reset Your Password
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
          
          {success && (
            <div style={{
              padding: 'var(--spacing-md)',
              backgroundColor: '#f0fff4',
              color: 'var(--color-success)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)',
              borderLeft: '4px solid var(--color-success)'
            }}>
              {success}
              <p>Redirecting you to login page...</p>
            </div>
          )}
          
          {!success && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email address"
                  readOnly // Email is pre-filled from URL
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
              
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
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
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
              
              <div style={{ 
                marginTop: 'var(--spacing-xl)',
                textAlign: 'center',
                color: 'var(--color-text-light)'
              }}>
                Remember your password? {' '}
                <Link 
                  to="/login"
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 500
                  }}
                >
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
