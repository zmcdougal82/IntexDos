// Get the API base URL from api.ts to use our backend proxy
const getApiUrl = () => {
  // If we're running in local development, use the ASP.NET backend directly
  if (window.location.hostname === 'localhost') {
    return "http://localhost:5237/api";
  }
  
  // For production, use the environment variable if it exists
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Dynamically determine API URL for Azure
  const currentDomain = window.location.hostname;
  if (currentDomain.includes('azurewebsites.net')) {
    const apiDomain = currentDomain.replace('client', 'api').replace('-web', '-api');
    return `https://${apiDomain}/api`;
  }
  
  // Fallback
  return "https://moviesapp-api-fixed.azurewebsites.net/api";
};

// Always use the ASP.NET backend proxy controller
const getOpenAiUrl = () => {
  return `${getApiUrl()}/proxy/openai/v1/chat/completions`;
};

// Always use the backend proxy URL for OpenAI
const API_URL = getOpenAiUrl();

// For debugging
console.log("Using OpenAI API URL:", API_URL);

interface SummarizationOptions {
  maxLength?: number;
  minLength?: number;
  model?: string;
}

export const openaiApi = {
  summarizeReviews: async (reviews: string[], options: SummarizationOptions = {}): Promise<string> => {
    console.log(`Attempting to summarize ${reviews.length} reviews using OpenAI`);

    // Filter out empty reviews
    const validReviews = reviews.filter(review => review && review.trim().length > 0);
    
    if (validReviews.length === 0) {
      console.log('No valid reviews to summarize');
      return "No reviews available to summarize.";
    }
    
    // Format reviews into a string
    const reviewsText = validReviews.map((review, index) => 
      `Review ${index + 1}: ${review.trim()}`
    ).join('\n\n');
    
    // Maximum tokens to generate - convert from characters to approximate tokens
    const maxTokens = Math.ceil((options.maxLength || 120) / 4);
    
    try {
      // Create request using OpenAI's chat completion API
      // The backend proxy will handle the API key
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      console.log("Sending OpenAI request to:", API_URL);
      
      // Our ASP.NET backend will handle the API key in all environments
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes movie reviews. Create a concise summary that captures the overall sentiment and key points from the reviews. Focus on common opinions and critical aspects mentioned. Your summary should be clear, objective, and well-structured.'
            },
            {
              role: 'user',
              content: `Please summarize the following movie reviews into a single paragraph that captures the overall sentiment and common themes:\n\n${reviewsText}`
            }
          ],
          max_tokens: maxTokens,
          temperature: 0.5, // More deterministic responses
          top_p: 0.9,
          frequency_penalty: 0.5, // Reduce repetition
          presence_penalty: 0.5  // Encourage varied content
        })
      });
      
      if (!response.ok) {
        console.error('OpenAI API error status:', response.status, response.statusText);
        
        // Try to parse error response as JSON, but handle HTML or text responses too
        let errorMessage = 'Error in summarization';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('OpenAI API error details:', errorData);
            errorMessage = errorData.error?.message || errorMessage;
          } else {
            // Handle HTML or text responses
            const errorText = await response.text();
            console.error('OpenAI API error text:', errorText.substring(0, 200));
            errorMessage = `API returned ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('OpenAI summarization result:', result);
      
      // Extract the content from the response
      const summary = result.choices[0].message.content.trim();
      
      return summary;
    } catch (error) {
      console.error('Error while summarizing reviews with OpenAI:', error);
      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }
      return "Failed to summarize reviews. Please try again later.";
    }
  }
};

export default openaiApi;
