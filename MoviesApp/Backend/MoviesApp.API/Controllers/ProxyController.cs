using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using System;
using System.Text.Json;

namespace MoviesApp.API.Controllers
{
    [ApiController]
    [Route("api/proxy")]
    public class ProxyController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public ProxyController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet("tmdb/{**endpoint}")]
        public async Task<IActionResult> ProxyTmdb(string endpoint)
        {
            try
            {
                var tmdbApiKey = _configuration["ExternalApis:TmdbApiKey"];
                if (string.IsNullOrEmpty(tmdbApiKey))
                {
                    return BadRequest("TMDB API key is not configured");
                }

                var httpClient = _httpClientFactory.CreateClient();
                var apiUrl = $"https://api.themoviedb.org/3/{endpoint}";
                
                // Append the API key to the endpoint
                apiUrl += apiUrl.Contains("?") ? "&" : "?";
                apiUrl += $"api_key={tmdbApiKey}";

                // Forward any query parameters that were sent with the original request
                foreach (var query in Request.Query)
                {
                    if (query.Key != "api_key") // Skip if api_key was already provided
                    {
                        apiUrl += $"&{query.Key}={Uri.EscapeDataString(query.Value)}";
                    }
                }

                var response = await httpClient.GetAsync(apiUrl);
                
                // Read the content as string
                var content = await response.Content.ReadAsStringAsync();
                
                // Set the response status code to match the proxied response
                Response.StatusCode = (int)response.StatusCode;
                
                // Set content type
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";
                return Content(content, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("omdb")]
        public async Task<IActionResult> ProxyOmdb()
        {
            try
            {
                var omdbApiKey = _configuration["ExternalApis:OmdbApiKey"];
                if (string.IsNullOrEmpty(omdbApiKey))
                {
                    return BadRequest("OMDB API key is not configured");
                }

                var httpClient = _httpClientFactory.CreateClient();
                var apiUrl = "https://www.omdbapi.com/?apikey=" + omdbApiKey;
                
                // Forward any query parameters that were sent with the original request
                foreach (var query in Request.Query)
                {
                    if (query.Key != "apikey") // Skip if apikey was already provided
                    {
                        apiUrl += $"&{query.Key}={Uri.EscapeDataString(query.Value)}";
                    }
                }

                var response = await httpClient.GetAsync(apiUrl);
                var content = await response.Content.ReadAsStringAsync();
                
                Response.StatusCode = (int)response.StatusCode;
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";
                return Content(content, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
