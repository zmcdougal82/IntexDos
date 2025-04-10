using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;
using System;
using System.Text.Json;
using System.Text;
using System.Collections.Generic;

namespace MoviesApp.API.Controllers
{
    [ApiController]
    [Route("api/proxy")]
    public class ProxyController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private static readonly Dictionary<string, string> ApiEndpoints = new()
        {
            // External APIs
            { "omdb", "https://www.omdbapi.com" },
            { "tmdb", "https://api.themoviedb.org/3" },
            { "tmdb-image", "https://image.tmdb.org/t/p" },
            { "streaming", "https://streaming-availability.p.rapidapi.com" }
            // Add other APIs as needed
        };

        public ProxyController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // Generic proxy that can handle any URL with proper API key injection
        [HttpGet("direct")]
        [HttpPost("direct")]
        [HttpPut("direct")]
        [HttpDelete("direct")]
        public async Task<IActionResult> DirectProxy()
        {
            try
            {
                // Extract the URL from the query parameter
                if (!Request.Query.TryGetValue("url", out var urlValues) || string.IsNullOrEmpty(urlValues))
                {
                    return BadRequest("Missing url parameter");
                }

                string targetUrl = urlValues.ToString();
                
                // Validate the URL
                if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out var uriResult))
                {
                    return BadRequest("Invalid URL format");
                }

                // Add API keys as needed
                if (targetUrl.Contains("api.themoviedb.org/3"))
                {
                    var tmdbApiKey = _configuration["ExternalApis:TmdbApiKey"];
                    if (!string.IsNullOrEmpty(tmdbApiKey))
                    {
                        targetUrl += (targetUrl.Contains("?") ? "&" : "?") + $"api_key={tmdbApiKey}";
                        Console.WriteLine("Added TMDB API key to direct proxy request");
                    }
                }
                else if (targetUrl.Contains("omdbapi.com"))
                {
                    var omdbApiKey = _configuration["ExternalApis:OmdbApiKey"];
                    if (!string.IsNullOrEmpty(omdbApiKey))
                    {
                        targetUrl += (targetUrl.Contains("?") ? "&" : "?") + $"apikey={omdbApiKey}";
                        Console.WriteLine("Added OMDB API key to direct proxy request");
                    }
                }

                Console.WriteLine($"Direct proxy: {Request.Method} -> {targetUrl.Replace("api_key=", "api_key=HIDDEN").Replace("apikey=", "apikey=HIDDEN")}");

                // Forward the request with appropriate HTTP method
                var httpClient = _httpClientFactory.CreateClient();
                
                // Copy headers, excluding those that would cause problems
                foreach (var header in Request.Headers)
                {
                    if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) && 
                        !header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
                    {
                        httpClient.DefaultRequestHeaders.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                    }
                }

                HttpResponseMessage response;
                
                if (Request.Method == "POST" || Request.Method == "PUT")
                {
                    // Read the request body
                    using var reader = new StreamReader(Request.Body);
                    var requestBody = await reader.ReadToEndAsync();
                    var content = new StringContent(requestBody, Encoding.UTF8, Request.ContentType ?? "application/json");
                    
                    // Send the request
                    response = Request.Method == "POST" 
                        ? await httpClient.PostAsync(targetUrl, content)
                        : await httpClient.PutAsync(targetUrl, content);
                }
                else if (Request.Method == "DELETE")
                {
                    response = await httpClient.DeleteAsync(targetUrl);
                }
                else
                {
                    response = await httpClient.GetAsync(targetUrl);
                }

                // Set response status code
                Response.StatusCode = (int)response.StatusCode;

                // Copy relevant response headers
                foreach (var header in response.Headers)
                {
                    if (!header.Key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
                    {
                        Response.Headers[header.Key] = header.Value.ToArray();
                    }
                }

                // Copy content headers
                foreach (var header in response.Content.Headers)
                {
                    Response.Headers[header.Key] = header.Value.ToArray();
                }

                // Read and return the response content
                var responseContent = await response.Content.ReadAsStringAsync();
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";
                
                return Content(responseContent, contentType);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Direct proxy error: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
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
        [HttpPost("tmdb/{**endpoint}")]
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

        // Add a streaming availability API endpoint
        [HttpGet("streaming/{**path}")]
        public async Task<IActionResult> ProxyStreaming(string path)
        {
            try
            {
                var rapidApiKey = _configuration["ExternalApis:RapidApiKey"];
                if (string.IsNullOrEmpty(rapidApiKey))
                {
                    return BadRequest("RapidAPI key is not configured");
                }

                var httpClient = _httpClientFactory.CreateClient();
                var apiUrl = $"https://streaming-availability.p.rapidapi.com/{path?.TrimStart('/')}";

                // Forward any query parameters that were sent with the original request
                bool hasQueryParam = apiUrl.Contains("?");
                foreach (var query in Request.Query)
                {
                    apiUrl += hasQueryParam ? "&" : "?";
                    apiUrl += $"{query.Key}={Uri.EscapeDataString(query.Value)}";
                    hasQueryParam = true;
                }

                // Add RapidAPI headers
                httpClient.DefaultRequestHeaders.Add("x-rapidapi-key", rapidApiKey);
                httpClient.DefaultRequestHeaders.Add("x-rapidapi-host", "streaming-availability.p.rapidapi.com");

                Console.WriteLine($"Streaming API Request: {apiUrl}");

                var response = await httpClient.GetAsync(apiUrl);
                var content = await response.Content.ReadAsStringAsync();

                Response.StatusCode = (int)response.StatusCode;
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";
                return Content(content, contentType);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Streaming API Exception: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Add a test endpoint that lists all supported proxy endpoints
        [HttpGet("test")]
        public IActionResult Test()
        {
            var endpoints = new List<string>
            {
                "direct?url=...", // Generic URL proxy
                "openai/...",     // OpenAI proxy
                "tmdb/...",       // TMDB proxy
                "omdb",           // OMDB proxy
                "streaming/..."   // Streaming availability API
            };

            return Ok(new
            {
                message = "ASP.NET proxy controller is working",
                endpoints = endpoints,
                registeredApiEndpoints = ApiEndpoints.Keys
            });
        }
    }
}
