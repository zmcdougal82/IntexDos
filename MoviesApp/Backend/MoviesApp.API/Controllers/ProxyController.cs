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

        [HttpPost("openai/{**endpoint}")]
        public async Task<IActionResult> ProxyOpenAi(string endpoint)
        {
            try
            {
                var openAiApiKey = _configuration["ExternalApis:OpenAiApiKey"];
                if (string.IsNullOrEmpty(openAiApiKey))
                {
                    return BadRequest("OpenAI API key is not configured");
                }

                var httpClient = _httpClientFactory.CreateClient();
                var apiUrl = $"https://api.openai.com/{endpoint}";
                
                // Read the request body
                using var reader = new StreamReader(Request.Body);
                var requestBody = await reader.ReadToEndAsync();
                
                // Create a new request to OpenAI
                var content = new StringContent(requestBody, System.Text.Encoding.UTF8, "application/json");
                
                // Add OpenAI API key to the headers
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", openAiApiKey);
                
                // Forward the request to OpenAI
                var response = await httpClient.PostAsync(apiUrl, content);
                
                // Read the content as string
                var responseContent = await response.Content.ReadAsStringAsync();
                
                // Set the response status code to match the proxied response
                Response.StatusCode = (int)response.StatusCode;
                
                // Set content type
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";
                return Content(responseContent, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
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

        // Clean up and normalize the endpoint - replace any % encoded characters
        if (endpoint != null)
        {
            endpoint = Uri.UnescapeDataString(endpoint);
            endpoint = endpoint.TrimStart('/');
        }
        else
        {
            endpoint = "";
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

        Console.WriteLine($"TMDB API Request: {apiUrl.Replace(tmdbApiKey, "[API_KEY_HIDDEN]")}");

        var response = await httpClient.GetAsync(apiUrl);
        
        // Read the content as string
        var content = await response.Content.ReadAsStringAsync();
        
        // Log error responses to help with debugging
        if (!response.IsSuccessStatusCode)
        {
            Console.WriteLine($"TMDB API Error: {response.StatusCode} - {content}");
        }
        
        // Set the response status code to match the proxied response
        Response.StatusCode = (int)response.StatusCode;
        
        // Set content type
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";
        return Content(content, contentType);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"TMDB Proxy Exception: {ex.Message}");
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
