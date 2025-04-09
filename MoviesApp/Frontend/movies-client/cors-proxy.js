// Ultra-simple CORS proxy server - implements direct forwarding with fetch
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 3001;
const TARGET_API = 'https://moviesapp-api-fixed.azurewebsites.net/api';

// Enable CORS for all requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Specialized proxy for /api requests - use a simpler pattern matching approach
app.use('/api', async (req, res) => {
  try {
    // Extract the path after /api
    const apiPath = req.url.replace(/^\/api\//, '');
    const targetUrl = `${TARGET_API}/${apiPath}`;
    
    console.log(`[Direct Proxy] ${req.method} ${req.url} -> ${targetUrl}`);
    
    // Handle OPTIONS requests directly for CORS preflight
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.status(200).end();
    }
    
    // Build the fetch options based on the original request
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
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
    const contentType = response.headers.get('content-type') || '';
    
    console.log(`[Direct Proxy] Response: ${response.status} ${response.statusText}`);
    
    // Set status code and headers
    res.status(response.status);
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle different response types
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      return res.send(text);
    }
  } catch (error) {
    console.error('[Direct Proxy] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Add a test endpoint to verify the proxy is working
app.get('/test', (req, res) => {
  res.json({ message: 'CORS proxy server is working' });
});

// Start the proxy server
app.listen(PORT, () => {
  console.log(`CORS Proxy server running at http://localhost:${PORT}`);
  console.log(`Proxying requests from http://localhost:${PORT}/api to ${TARGET_API}`);
});
