// services/openaiApi.ts
const API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Check if API key is available and log a warning if it's not
if (!API_KEY) {
  console.warn('OpenAI API key is not available. Summary generation will be disabled.');
}

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
      // Check if API key is available
      if (!API_KEY) {
        return "Error: OpenAI API key is not configured. Summary generation is disabled.";
      }
      
      // Create request using OpenAI's chat completion API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
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
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData.error?.message || 'Error in summarization');
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
