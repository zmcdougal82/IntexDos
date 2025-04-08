import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RegisterRequest, authApi } from '../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: undefined,
    gender: '',
    city: '',
    state: '',
    zip: '',
    netflix: 0,
    amazonPrime: 0,
    disneyPlus: 0,
    paramountPlus: 0,
    max: 0,
    hulu: 0,
    appleTVPlus: 0,
    peacock: 0
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Additional info, 3: Streaming preferences

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Stronger password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    
    // Check for at least one digit
    if (!/\d/.test(formData.password)) {
      setError('Password must contain at least one number');
      return;
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError('Password must contain at least one special character');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.register(formData);
      
      // Show success message and redirect to login
      alert('Registration successful! Please log in with your new account.');
      window.location.href = '/login';
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate required fields for step 1
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (formData.password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      // Password validation
      if (formData.password.length < 8 || 
          !/[A-Z]/.test(formData.password) || 
          !/[a-z]/.test(formData.password) || 
          !/\d/.test(formData.password) || 
          !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        setError('Password must meet all requirements');
        return;
      }
    }
    
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const renderStepIndicator = () => {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: 'var(--spacing-lg)'
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ 
            width: '30px', 
            height: '30px', 
            borderRadius: '50%', 
            backgroundColor: s === step ? 'var(--color-primary)' : 'var(--color-border)',
            color: s === step ? 'white' : 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 5px',
            cursor: 'pointer'
          }} onClick={() => {
            if (s < step) setStep(s);
          }}>
            {s}
          </div>
        ))}
      </div>
    );
  };

  const renderStep1 = () => {
    return (
      <>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="name" className="mb-2">
            Full Name <span style={{ color: 'red' }}>*</span>
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
            Email Address <span style={{ color: 'red' }}>*</span>
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
            Password <span style={{ color: 'red' }}>*</span>
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
            Password must be at least 8 characters long and include uppercase, lowercase, 
            number, and special character
          </p>
        </div>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="confirmPassword" className="mb-2">
            Confirm Password <span style={{ color: 'red' }}>*</span>
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
          type="button"
          onClick={nextStep}
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-secondary)',
            marginTop: 'var(--spacing-md)',
            fontSize: '1rem',
            fontWeight: 500
          }}
        >
          Next
        </button>
      </>
    );
  };

  const renderStep2 = () => {
    return (
      <>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="phone" className="mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="Your phone number"
          />
        </div>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="age" className="mb-2">
            Age
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age || ''}
            onChange={handleChange}
            placeholder="Your age"
            min="13"
            max="120"
          />
        </div>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="gender" className="mb-2">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender || ''}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="city" className="mb-2">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            placeholder="Your city"
          />
        </div>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="state" className="mb-2">
            State
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state || ''}
            onChange={handleChange}
            placeholder="Your state"
          />
        </div>
        
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label htmlFor="zip" className="mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            id="zip"
            name="zip"
            value={formData.zip || ''}
            onChange={handleChange}
            placeholder="Your ZIP code"
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={prevStep}
            style={{
              width: '48%',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-border)',
              marginTop: 'var(--spacing-md)',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            Back
          </button>
          
          <button
            type="button"
            onClick={nextStep}
            style={{
              width: '48%',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-secondary)',
              marginTop: 'var(--spacing-md)',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            Next
          </button>
        </div>
      </>
    );
  };

  const renderStep3 = () => {
    const streamingServices = [
      { id: 'netflix', name: 'Netflix', value: formData.netflix },
      { id: 'amazonPrime', name: 'Amazon Prime', value: formData.amazonPrime },
      { id: 'disneyPlus', name: 'Disney+', value: formData.disneyPlus },
      { id: 'paramountPlus', name: 'Paramount+', value: formData.paramountPlus },
      { id: 'max', name: 'Max', value: formData.max },
      { id: 'hulu', name: 'Hulu', value: formData.hulu },
      { id: 'appleTVPlus', name: 'Apple TV+', value: formData.appleTVPlus },
      { id: 'peacock', name: 'Peacock', value: formData.peacock }
    ];
    
    return (
      <>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Streaming Services</h3>
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'var(--color-text-light)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          Select the streaming services you currently subscribe to:
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          {streamingServices.map(service => (
            <div key={service.id} style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: 'var(--spacing-sm)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)'
            }}>
              <input
                type="checkbox"
                id={service.id}
                name={service.id}
                checked={service.value === 1}
                onChange={handleChange}
                style={{ marginRight: 'var(--spacing-sm)' }}
              />
              <label htmlFor={service.id}>{service.name}</label>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={prevStep}
            style={{
              width: '48%',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-border)',
              marginTop: 'var(--spacing-md)',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            Back
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '48%',
              padding: 'var(--spacing-md)',
              backgroundColor: 'var(--color-secondary)',
              marginTop: 'var(--spacing-md)',
              fontSize: '1rem',
              fontWeight: 500
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>
      </>
    );
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
          maxWidth: '500px',
          padding: 'var(--spacing-xl)',
          border: '1px solid var(--color-border)'
        }}>
          <h1 style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--spacing-md)',
            color: 'var(--color-primary)'
          }}>
            Create Your Account
          </h1>
          
          {renderStepIndicator()}
          
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
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            
            {step === 1 && (
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
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
