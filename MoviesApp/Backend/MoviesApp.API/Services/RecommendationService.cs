using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MoviesApp.API.Services
{
    public class RecommendationService : IRecommendationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<RecommendationService> _logger;
        private readonly string _recommendationServiceUrl;

        public RecommendationService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            ILogger<RecommendationService> logger)
        {
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
            
            // Get recommendation service URL from config or use default
            _recommendationServiceUrl = configuration["RecommendationService:Url"] ?? 
                (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                    ? "http://localhost:8001" 
                    : "https://moviesapp-recommendation-service.azurewebsites.net");
        }

        public async Task<List<string>> GetTopRatedMovies(int limit = 20)
        {
            try
            {
                // This is a direct call to the recommendation service endpoints
                // We're using a special endpoint that doesn't require a user ID
                var response = await _httpClient.GetAsync($"{_recommendationServiceUrl}/recommendations/top-rated?limit={limit}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to get top rated movies: {response.StatusCode}");
                    return new List<string>();
                }
                
                // Parse the JSON response
                var content = await response.Content.ReadAsStringAsync();
                var movies = JsonSerializer.Deserialize<List<string>>(content);
                
                return movies ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top rated movies");
                return new List<string>();
            }
        }

        public async Task<List<string>> GetPopularMovies(int limit = 20)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_recommendationServiceUrl}/recommendations/popular?limit={limit}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to get popular movies: {response.StatusCode}");
                    return new List<string>();
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var movies = JsonSerializer.Deserialize<List<string>>(content);
                
                return movies ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting popular movies");
                return new List<string>();
            }
        }

        public async Task<List<string>> GetMoviesByGenre(string genre, int limit = 20)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_recommendationServiceUrl}/recommendations/genre/{genre}?limit={limit}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to get movies by genre {genre}: {response.StatusCode}");
                    return new List<string>();
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var movies = JsonSerializer.Deserialize<List<string>>(content);
                
                return movies ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting movies by genre {genre}");
                return new List<string>();
            }
        }

        public async Task<List<string>> GetHiddenGems(int limit = 20)
        {
            try
            {
                // For hidden gems, we'll use a special endpoint that returns well-rated but less known films
                var response = await _httpClient.GetAsync($"{_recommendationServiceUrl}/recommendations/hidden-gems?limit={limit}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to get hidden gems: {response.StatusCode}");
                    return new List<string>();
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var movies = JsonSerializer.Deserialize<List<string>>(content);
                
                return movies ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hidden gems");
                return new List<string>();
            }
        }

        public async Task<List<string>> GetContentBasedRecommendations(string basedOnMovieId, int limit = 20)
        {
            try
            {
                var response = await _httpClient.GetAsync(
                    $"{_recommendationServiceUrl}/recommendations/similar-to/{basedOnMovieId}?limit={limit}");
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError($"Failed to get content-based recommendations for {basedOnMovieId}: {response.StatusCode}");
                    return new List<string>();
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var movies = JsonSerializer.Deserialize<List<string>>(content);
                
                return movies ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting content-based recommendations for {basedOnMovieId}");
                return new List<string>();
            }
        }
    }
}
