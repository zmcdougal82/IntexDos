// Multi-target CORS proxy server - handles both our API and external APIs
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { URL } from 'url';

const app = express();
const PORT = 3001;

// API endpoints map
const API_ENDPOINTS = {
  // Main API
  'api': 'https://moviesapp-api-fixed.azurewebsites.net/api',
  // External APIs
  'omdb': 'https://www.omdbapi.com',
  'tmdb': 'https://api.themoviedb.org/3',
  'tmdb-image': 'https://image.tmdb.org/t/p',
  'streaming': 'https://streaming-availability.p.rapidapi.com',
  // Add other APIs as needed
};

// Enable CORS for all requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-rapidapi-key', 'x-rapidapi-host']
}));

// Generic proxy handler for any API
async function proxyRequest(req, res, targetBaseUrl, pathPrefix) {
  try {
    // Extract the path after the prefix
    const apiPath = req.url.replace(new RegExp(`^${pathPrefix}/?`), '');
    const targetUrl = `${targetBaseUrl}${apiPath ? `/${apiPath}` : ''}`;
    
    console.log(`[Proxy] ${req.method} ${req.url} -> ${targetUrl}`);
    
    // Handle OPTIONS requests directly for CORS preflight
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-rapidapi-key, x-rapidapi-host');
      return res.status(200).end();
    }
    
    // Copy all original headers
    const headers = { ...req.headers };
    
    // Remove host header as it would be incorrect for the target
    delete headers.host;
    
    // Build the fetch options based on the original request
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };
    
    // Add the request body for POST/PUT requests
    if (['POST', 'PUT'].includes(req.method)) {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      
      await new Promise(resolve => req.on('end', resolve));
      
      if (body) {
        fetchOptions.body = body;
      }
    }
    
    // Forward the request to the target API
    const response = await fetch(targetUrl, fetchOptions);
    
    // Copy all response headers to our response, but skip problematic headers
    for (const [key, value] of response.headers.entries()) {
      // Skip headers that Express will set and content-encoding to avoid compression issues
      if (!['content-length', 'connection', 'keep-alive', 'transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Always set the content type to ensure proper handling
    if (response.headers.get('content-type')) {
      res.setHeader('Content-Type', response.headers.get('content-type'));
    }
    
    // Set status code
    res.status(response.status);
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-rapidapi-key, x-rapidapi-host');
    
    console.log(`[Proxy] Response: ${response.status} for ${req.url}`);
    
    // Get content type to determine how to handle the response
    const contentType = response.headers.get('content-type') || '';
    
    // Stream the response body to the client
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (error) {
    console.error(`[Proxy] Error: ${error.message} for ${req.url}`);
    res.status(500).json({ error: error.message });
  }
}

// Set up routes for each API endpoint
Object.entries(API_ENDPOINTS).forEach(([prefix, targetUrl]) => {
  app.use(`/${prefix}`, (req, res) => proxyRequest(req, res, targetUrl, `/${prefix}`));
});

// Catch-all for direct proxy of external URLs
app.use('/proxy', async (req, res) => {
  try {
    // Extract the URL from the query parameter
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }
    
    console.log(`[Direct URL Proxy] ${req.method} -> ${targetUrl}`);
    
    // Validate the URL
    try {
      new URL(targetUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Forward the request
    const response = await fetch(targetUrl);
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Send the response back
    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.header('Content-Type', contentType);
    }
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const buffer = await response.buffer();
      return res.send(buffer);
    }
  } catch (error) {
    console.error(`[Direct URL Proxy] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Add a test endpoint to verify the proxy is working
app.get('/test', (req, res) => {
  res.json({ 
    message: 'CORS proxy server is working',
    endpoints: Object.keys(API_ENDPOINTS)
  });
});

// Start the proxy server
app.listen(PORT, () => {
  console.log(`Multi-target CORS proxy server running at http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  Object.entries(API_ENDPOINTS).forEach(([prefix, url]) => {
    console.log(` - /${prefix} -> ${url}`);
  });
  console.log(` - /proxy?url=[encoded-url] -> Direct proxy for any URL`);
});
