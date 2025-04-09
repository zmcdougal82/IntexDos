# IntexDos

## Movie Rating Application

A web application for browsing, rating, and reviewing movies and TV shows.

## Azure Deployment URLs

- **Frontend**: https://moviesappsa79595.azureedge.net/ (CDN) or https://moviesappsa79595.z13.web.core.windows.net/ (Direct)
- **Backend API**: https://moviesapp-api-fixed.azurewebsites.net/api

## Project Structure

- **Frontend**: React application with TypeScript and Vite
- **Backend**: .NET Web API
- **Data Uploader**: Tools for importing movie data

## Getting Started

### Running Locally

1. Start the backend:
   ```
   cd MoviesApp/Backend/MoviesApp.API && dotnet run
   ```

2. Start the frontend:
   ```
   cd MoviesApp/Frontend/movies-client && npm install && npm run dev
