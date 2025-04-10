# Recommendation Service Guide

## Overview
Your recommendation service has been successfully deployed to Azure and is now operational. The system is integrated with your frontend and backend applications, with some adaptations to handle the mismatch between the movie IDs returned from the recommendation service and what's available in your database.

## Current Setup
- **Recommendation Service URL:** https://moviesapp-recommendation-service.azurewebsites.net
- **App Service Plan:** Premium V2 (P1V2)
- **Runtime:** Python 3.10
- **Startup Command:** `python app.py`

## How It Works
1. **Recommendation Service:** Generates movie recommendations based on user IDs
   - Returns IMDB/TMDB movie IDs (e.g., tt0120689)
   - Uses a simplified algorithm that doesn't require expensive computation
   - Provides collaborative, content-based, and genre recommendations

2. **Backend Integration:** The ASP.NET Core API acts as a proxy
   - Forwards requests to the recommendation service
   - Returns the raw recommendations data to the frontend

3. **Frontend Integration:** The React application processes recommendations
   - Fetches recommendations from your .NET backend
   - For each recommended movie ID, tries to get details from your database
   - For movie IDs not in your database, creates placeholder entries

## Identified Issues and Solutions

### Issue: Movie ID Mismatch
The recommendation service returns valid IMDB/TMDB movie IDs, but many of these IDs don't exist in your database.

**Solution implemented:**
- Modified the frontend to handle missing movie data gracefully
- Created placeholder movie objects when the main API returns a 404 error
- Ensured recommendations still display even with incomplete movie data

### Testing the Service
We've created a test script at `/Users/zackmcdougal/Desktop/IntexDos/test-recommendation-api.js` that directly calls the recommendation service. Use it to test the service:

```bash
cd /Users/zackmcdougal/Desktop/IntexDos
node test-recommendation-api.js [user_id]
```

## Future Improvements

1. **Database Synchronization**
   - Consider importing the recommended movies into your database
   - Use TMDB API to fetch details for missing movies

2. **Enhanced Fallback Mechanism**
   - Modify your .NET API to query TMDB directly when a movie ID isn't found locally
   - Cache these results for future requests

3. **Recommendation Quality**
   - If needed, update the recommendation algorithm for better personalization
   - Consider adding more data sources for improved recommendations

## Maintenance

1. **Monitoring**
   - Monitor the Azure App Service for any issues
   - Check logs if recommendations stop working

2. **Updates**
   - Use the GitHub Actions workflow to deploy updates
   - Changes to `/MoviesApp/Backend/RecommendationService/` will trigger automatic deployments

3. **Scaling**
   - If user base grows, you may need to scale up the App Service plan
   - The current P1V2 plan should handle moderate usage

## Conclusion
Your recommendation system is now successfully deployed and integrated with your application. The adaptations made ensure it works even with the current data limitations. As you add more movies to your database or implement one of the future improvements, the recommendations will become more detailed and useful.
