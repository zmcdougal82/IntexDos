import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoginRequest, authApi } from '../services/api';
import { hasCookieConsent } from '../components/CookieConsentBanner';

const LoginPage = () => {
  const [credentials, setCredentials] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

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
    
    // Check if user has consented to cookies
    const hasConsent = hasCookieConsent();
    if (!hasConsent) {
      setError('Please accept cookies in the banner at the bottom of the page to enable secure login functionality.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login(credentials);
      
      // Store the JWT token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userId', response.data.user.id);
      
      // Refresh page to ensure navbar updates with the user profile
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.Message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setForgotPasswordLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await authApi.forgotPassword({ email: forgotPasswordEmail });
      const data = response.data as { message: string; status?: string };
      
      // Check if there was a warning status returned
      if (data.status === 'warning') {
        // Show a more detailed message about potential email delivery issues
        setSuccess(
          'Reset email sent. If you don\'t receive it within a few minutes, please check your spam folder or contact support. ' +
          'Make sure your email address is correct and try again.'
        );
      } else {
        // Standard success message
        setSuccess('If your email exists in our system, you will receive a password reset link shortly.');
      }
      
      // Don't hide the form if there's a warning
      if (data.status !== 'warning') {
        setShowForgotPassword(false);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // Show a more user-friendly error message
      setError('There was a problem sending the password reset email. Please try again later or contact support.');
    } finally {
      setForgotPasswordLoading(false);
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
            {showForgotPassword ? 'Reset Password' : 'Welcome Back'}
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
              {!hasCookieConsent() && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                  Cookie consent is required for authentication and keeping you logged in securely.
                </div>
              )}
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
            </div>
          )}
          
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword}>
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label 
                  htmlFor="forgotPasswordEmail"
                  className="mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="forgotPasswordEmail"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={forgotPasswordLoading}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-primary)',
                  marginTop: 'var(--spacing-md)',
                  fontSize: '1rem',
                  fontWeight: 500
                }}
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              
              <div style={{ 
                marginTop: 'var(--spacing-xl)',
                textAlign: 'center',
                color: 'var(--color-text-light)'
              }}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPassword(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    color: 'var(--color-primary)',
                    fontWeight: 500
                  }}
                >
                  Back to Login
                </a>
              </div>
            </form>
          ) : (
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
                      setShowForgotPassword(true);
                      setError(null);
                      setSuccess(null);
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
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
