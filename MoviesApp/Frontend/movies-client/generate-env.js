// generate-env.js
// This script generates a .env file with the necessary environment variables
// It can be run as part of the deployment process in Azure

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment variables from process.env or use defaults
const openaiApiKey = process.env.VITE_OPENAI_API_KEY || '';
const omdbApiKey = process.env.VITE_OMDB_API_KEY || '';
const tmdbApiKey = process.env.VITE_TMDB_API_KEY || '';

// Create .env file content
const envContent = `VITE_OPENAI_API_KEY=${openaiApiKey}
VITE_OMDB_API_KEY=${omdbApiKey}
VITE_TMDB_API_KEY=${tmdbApiKey}`;

// Write to .env file
fs.writeFileSync(path.join(__dirname, '.env'), envContent);

console.log('Generated .env file with environment variables');
