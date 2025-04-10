import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose }) => {
  const handleOkClick = () => {
    // If the user clicks "OK", immediately close the modal and redirect
    onClose();
    window.location.href = '/login'; // Redirect to login page
  };

  if (!isOpen) return null;

  return (
    <div style={modalBackgroundStyle}>
      <div style={modalStyle}>
        <h2>Your account was successfully created!</h2>
        <p>Click "OK" to be redirected to the login page.</p>
        <div>
          <button onClick={handleOkClick} style={buttonStyle}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const modalBackgroundStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#4CAF50', // Green color
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
  marginTop: '20px',
};

export default ConfirmationModal;
