import React, { useState } from 'react';
import { ratingApi } from '../services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieId: string;
  movieTitle: string;
  userId?: number;
  existingRating?: number;
  existingReview?: string;
  onReviewSubmitted: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  movieId, 
  movieTitle,
  userId,
  existingRating = 0,
  existingReview = '',
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState<number>(existingRating);
  const [review, setReview] = useState<string>(existingReview);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async () => {
    if (!userId) {
      setError('You must be logged in to submit a review');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to be logged in. Please log in and try again.');
        return;
      }

      // Ensure userId is a number
      const numericUserId = Number(userId);
      if (isNaN(numericUserId)) {
        setError('Invalid user ID. Please try logging in again.');
        return;
      }

      const ratingData = {
        userId: numericUserId,
        showId: movieId,
        ratingValue: rating,
        reviewText: review.trim() || undefined // Use undefined instead of null for empty strings
      };

      console.log('Submitting review data:', ratingData);
      
      // Add authentication headers directly in the request
      const response = await ratingApi.addRating(ratingData);
      console.log('Review submission successful:', response);
      
      // Call the callback to notify parent component
      onReviewSubmitted();
      
      // Close the modal
      onClose();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (error.response.status === 400) {
          setError(`Bad request: ${error.response.data?.message || 'Please check your review and try again'}`);
        } else {
          setError(`Server error (${error.response.status}). Please try again later.`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        setError('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Error: ' + (error.message || 'Failed to submit your review. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        width: '90%',
        maxWidth: '600px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h2 style={{ 
            color: 'var(--color-primary)',
            margin: 0
          }}>Rate & Review: {movieTitle}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
            aria-label="Close review modal"
          >
            ×
          </button>
        </div>
        
        {/* Rating stars */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            Your Rating
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                style={{
                  width: '50px',
                  height: '50px',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'transparent',
                  color: rating >= star ? 'gold' : '#d1d1d1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: 'bold',
                  transition: 'all var(--transition-normal)'
                }}
                aria-label={`Rate ${star} out of 5 stars`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        
        {/* Review text */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ color: 'var(--color-text)', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
            Your Review
          </h3>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={`What did you think of ${movieTitle}?`}
            style={{
              width: '100%',
              minHeight: '150px',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border)',
              fontFamily: 'inherit',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>
        
        {/* Error message */}
        {error && (
          <div style={{ 
            color: 'var(--color-danger, red)', 
            marginBottom: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
            borderRadius: 'var(--radius-sm)'
          }}>
            {error}
          </div>
        )}
        
        {/* Submit button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
          <button
            onClick={onClose}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: 'var(--color-background-light)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
