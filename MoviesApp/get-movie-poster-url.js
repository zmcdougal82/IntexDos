// Simple script to demonstrate getting a movie poster URL from the API
const axios = require('axios');

// API base URL - Replace with your actual API base URL if different
const API_URL = 'https://moviesapp-api-fixed.azurewebsites.net/api';

// Function to get movie details including poster URL
async function getMoviePosterUrl(movieId) {
  try {
    console.log(`Fetching poster URL for movie ID: ${movieId}`);
    
    // Make the API call to get movie details
    const response = await axios.get(`${API_URL}/movies/${movieId}`);
    
    // Extract the poster URL from the response
    const movie = response.data;
    const posterUrl = movie.posterUrl;
    
    console.log('\nMovie details:');
    console.log(`Title: ${movie.title}`);
    console.log(`Type: ${movie.type || 'Unknown'}`);
    console.log(`Year: ${movie.releaseYear || 'Unknown'}`);
    
    if (posterUrl) {
      console.log(`\nOriginal Poster URL: ${posterUrl}`);
      
      // Check if this is already a correctly formatted URL
      if (posterUrl.includes('Movie%20Posters/')) {
        console.log('URL is already in the correct format.');
        return posterUrl;
      }
      
      // Extract the filename from the URL
      const fileName = posterUrl.split('/').pop()?.split('?')[0];
      
      // Reconstruct the URL with the proper pattern
      const formattedUrl = `https://moviesappsa79595.blob.core.windows.net/movie-posters/Movie%20Posters/${fileName}`;
      console.log(`\nFormatted Poster URL: ${formattedUrl}`);
      
      return formattedUrl;
    } else {
      console.log('No poster URL found for this movie.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching movie details:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }
    return null;
  }
}

// Example usage
// You can run this script with a movie ID argument: node get-movie-poster-url.js s1234
const movieId = process.argv[2] || 's1';

getMoviePosterUrl(movieId)
  .then(url => {
    if (url) {
      console.log('\nYou can use this URL in your application:');
      console.log(url);
    } else {
      console.log('\nCould not retrieve a valid poster URL.');
    }
  })
  .catch(err => console.error('Unexpected error:', err));
