import React, { useState, useEffect } from 'react';
import { openaiApi } from '../services/openaiApi';

interface ReviewSummaryProps {
  reviews: string[];
  title: string;
  isLoading?: boolean;
}

// Summary customization options
interface SummaryOptions {
  maxLength: number;
  minLength: number;
  style: 'concise' | 'balanced' | 'detailed';
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ reviews, title, isLoading = false }) => {
  const [summary, setSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fixed summary options
  const summaryOptions: SummaryOptions = {
    maxLength: 120,
    minLength: 40,
    style: 'concise'
  };

  // Automatically generate summary when reviews change or component mounts
  useEffect(() => {
    // Reset states when reviews change
    setSummary('');
    setError(null);
    
    // Automatically generate summary if there are reviews
    if (reviews.length > 0 && !isLoading) {
      generateSummary(summaryOptions);
    }
  }, [reviews, isLoading]);

  // Get actual max/min length based on style
  const getSummaryParams = (options: SummaryOptions) => {
    // Adjust length based on style
    let maxLength = options.maxLength;
    let minLength = options.minLength;
    
    switch (options.style) {
      case 'concise':
        maxLength = Math.min(100, options.maxLength);
        minLength = Math.min(30, options.minLength);
        break;
      case 'detailed':
        maxLength = Math.max(200, options.maxLength);
        minLength = Math.max(80, options.minLength);
        break;
      case 'balanced':
      default:
        // Keep original values
        break;
    }
    
    return { maxLength, minLength };
  };

  const generateSummary = async (options: SummaryOptions = summaryOptions) => {
    if (reviews.length === 0 || isGeneratingSummary) {
      return;
    }

    try {
      setIsGeneratingSummary(true);
      setError(null);
      setSummary('');

      // Check if OpenAI API key is available
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        console.error('OpenAI API key is not available');
        setError('OpenAI API key is not configured. Summary generation is disabled.');
        setIsGeneratingSummary(false);
        return;
      }

      // Log for debugging
      console.log(`Attempting to generate summary for ${reviews.length} reviews for "${title}"`);

      // Filter out empty reviews and get only the actual review text
      const validReviews = reviews.filter(review => review && review.trim().length > 0);

      if (validReviews.length === 0) {
        console.log('No valid reviews found to summarize');
        setSummary('No reviews available to summarize.');
        setIsGeneratingSummary(false);
        return;
      }

      console.log(`Found ${validReviews.length} valid reviews to summarize`);
      
      // Log the first review for debugging
      if (validReviews.length > 0) {
        console.log('First review sample:', validReviews[0].substring(0, 100) + '...');
      }

      // Get actual parameters based on the style
      const { maxLength, minLength } = getSummaryParams(options);
      
      const result = await openaiApi.summarizeReviews(validReviews, {
        maxLength,
        minLength
      });
      
      // If the result starts with "Failed" or "Error", it's an error message
      if (result.startsWith('Failed') || result.startsWith('Error')) {
        console.error('Error from summarizeReviews:', result);
        setError(result);
      } else {
        console.log('Summarization successful, length:', result.length);
        setSummary(result);
      }
    } catch (err) {
      console.error('Exception in generateSummary:', err);
      let errorMessage = 'Failed to generate summary. Please try again later.';
      
      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-background-light, #f8f8f8)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-lg)',
        border: '1px solid var(--color-border)',
      }}
    >
      {isGeneratingSummary && (
        <div
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--color-primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            position: 'absolute',
            top: 'var(--spacing-md)',
            right: 'var(--spacing-md)'
          }}
        />
      )}

      {isLoading ? (
        <div style={{ color: 'var(--color-text-light)' }}>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ color: 'var(--color-text-light)' }}>
          No reviews available for "{title}". Be the first to write a review!
        </div>
      ) : summary ? (
        <div
          style={{
            backgroundColor: 'white',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            lineHeight: '1.6',
          }}
        >
          {summary}
        </div>
      ) : error ? (
        <div>
          <div style={{ color: 'var(--color-danger, red)', marginBottom: 'var(--spacing-md)' }}>
            {error}
          </div>
          <button
            onClick={() => generateSummary(summaryOptions)}
            disabled={isGeneratingSummary}
            style={{
              backgroundColor: 'var(--color-secondary, #e65100)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              cursor: isGeneratingSummary ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              opacity: isGeneratingSummary ? 0.7 : 1,
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--spacing-md)',
          minHeight: '100px',
          backgroundColor: 'var(--color-background-light)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-light)'
        }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              border: '3px solid var(--color-primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: 'var(--spacing-md)'
            }}
          />
          Analyzing user reviews...
        </div>
      )}


      {/* Add CSS for the spinner animation */}
      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
};

export default ReviewSummary;
