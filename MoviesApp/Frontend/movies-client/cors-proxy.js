// Simple CORS proxy server for development
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for all requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`[CORS Proxy] ${req.method} ${req.url}`);
  next();
});

// Set up proxy to the actual API
const apiProxy = createProxyMiddleware({
  target: 'https://moviesapp-api-fixed.azurewebsites.net',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // Keep the /api path
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
  }
});

// Proxy all requests starting with /api
app.use('/api', apiProxy);

// Start the proxy server
app.listen(PORT, () => {
  console.log(`CORS Proxy server running at http://localhost:${PORT}`);
  console.log(`Proxying requests from http://localhost:${PORT}/api to https://moviesapp-api-fixed.azurewebsites.net/api`);
});
