using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MoviesApp.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecommendationsController : ControllerBase
    {
        private readonly IHttpClientFactory _clientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RecommendationsController> _logger;
        private readonly string _recommendationServiceUrl;

        public RecommendationsController(
            IHttpClientFactory clientFactory,
            IConfiguration configuration,
            ILogger<RecommendationsController> logger)
        {
            _clientFactory = clientFactory;
            _configuration = configuration;
            _logger = logger;

            // Get recommendation service URL from config or use default
            _recommendationServiceUrl = _configuration["RecommendationService:Url"] ?? 
                (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" 
                    ? "http://localhost:8001" 
                    : "https://moviesapp-recommendations.azurewebsites.net");
        }

        // GET api/recommendations/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetRecommendations(string userId)
        {
            try
            {
                var client = _clientFactory.CreateClient();
                var response = await client.GetAsync($"{_recommendationServiceUrl}/recommendations/{userId}");

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    return Content(content, "application/json");
                }
                else
                {
                    _logger.LogWarning($"Failed to get recommendations for user {userId}. " +
                        $"Status: {response.StatusCode}");
                    return StatusCode((int)response.StatusCode, 
                        $"Recommendation service returned {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting recommendations for user {userId}");
                return StatusCode(500, "Failed to retrieve recommendations due to an internal error.");
            }
        }

        // POST api/recommendations/update-after-rating
        [HttpPost("update-after-rating")]
        [Authorize]
        public async Task<IActionResult> UpdateAfterRating([FromBody] RatingUpdateModel model)
        {
            try
            {
                var client = _clientFactory.CreateClient();
                var content = new StringContent(
                    JsonSerializer.Serialize(model),
                    Encoding.UTF8,
                    "application/json");

                var response = await client.PostAsync(
                    $"{_recommendationServiceUrl}/recommendations/update-after-rating", 
                    content);

                if (response.IsSuccessStatusCode)
                {
                    return Ok(new { message = "Recommendations update triggered successfully" });
                }
                else
                {
                    _logger.LogWarning($"Failed to update recommendations after rating. " +
                        $"Status: {response.StatusCode}");
                    return StatusCode((int)response.StatusCode, 
                        $"Recommendation service returned {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating recommendations after rating");
                return StatusCode(500, "Failed to update recommendations due to an internal error.");
            }
        }

        // POST api/recommendations/generate-file
        [HttpPost("generate-file")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateRecommendationsFile([FromBody] FileGenerationModel model)
        {
            try
            {
                var client = _clientFactory.CreateClient();
                var requestUri = $"{_recommendationServiceUrl}/recommendations/generate-file";
                
                if (!string.IsNullOrEmpty(model.OutputPath))
                {
                    requestUri += $"?output_path={Uri.EscapeDataString(model.OutputPath)}";
                }

                var response = await client.PostAsync(requestUri, null);

                if (response.IsSuccessStatusCode)
                {
                    return Ok(new { message = "Recommendation file generation triggered successfully" });
                }
                else
                {
                    _logger.LogWarning($"Failed to generate recommendations file. " +
                        $"Status: {response.StatusCode}");
                    return StatusCode((int)response.StatusCode, 
                        $"Recommendation service returned {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating recommendations file");
                return StatusCode(500, "Failed to generate recommendations file due to an internal error.");
            }
        }
    }

    public class RatingUpdateModel
    {
        public string UserId { get; set; }
        public string ShowId { get; set; }
        public int RatingValue { get; set; }
    }

    public class FileGenerationModel
    {
        public string OutputPath { get; set; }
    }
}
