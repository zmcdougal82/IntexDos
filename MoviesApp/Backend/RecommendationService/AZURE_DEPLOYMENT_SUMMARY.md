# Azure Deployment Summary for Recommendation Service

## Overview
This document provides instructions for deploying the movie recommendation system to Azure App Service. The system consists of a simplified Python Flask service that provides recommendations without expensive machine learning operations at runtime.

## Architecture
- **Recommendation Service**: Python-based Flask service deployed as an Azure Web App
- **Main Backend**: .NET-based API deployed as a separate Azure Web App
- **Frontend**: React application deployed as an Azure Static Web App

## Deployment Details

### Recommendation Service
- **URL**: https://moviesapp-recommendation-service.azurewebsites.net
- **Service Plan**: Premium V2 (P1V2) - Provides enough memory for operations
- **Runtime**: Python 3.10
- **Entry Point**: `app.py` - Simplified Flask application
- **Always On**: Enabled to prevent cold starts

### Key Configuration
1. **Web App Configuration**:
   - Startup command: `python app.py`
   - Always On: Enabled
   - CORS: Enabled for all origins

2. **Requirements**:
   - Simplified requirements.txt with only necessary packages:
     - Flask for the web framework
     - Basic data processing libraries
     - No heavy ML dependencies at runtime

3. **Deployment Package Structure**:
   - **Important**: Files must be at the root level of the zip file
   - Must include:
     - app.py
     - notebook_recommendation_service.py
     - requirements.txt

## Integration Points

### Backend (.NET) Integration
- The .NET backend communicates with the recommendation service via HTTP
- Configured in `RecommendationsController.cs`
- Uses the URL from configuration: `RecommendationService:Url`

### Frontend Integration
- The React frontend can communicate directly with the recommendation service
- URL is determined dynamically based on environment in `HomeRecommender.tsx`
- Falls back to static recommendations if the service is unavailable

## Deployment Method
The service is deployed using Azure CLI with zip deployment:
```bash
# Create deployment package (important: files at root level)
cd /path/to/recommendation/service
zip -r deployment.zip app.py notebook_recommendation_service.py requirements.txt

# Deploy to Azure
az webapp deploy --name moviesapp-recommendation-service --resource-group MoviesAppRG --src-path deployment.zip

# Set startup command
az webapp config set --name moviesapp-recommendation-service --resource-group MoviesAppRG --startup-file "python app.py"
```

## Continuous Deployment
A GitHub Actions workflow has been set up for continuous deployment:
- Triggers on changes to the RecommendationService directory
- Creates a properly structured deployment package
- Deploys directly to Azure Web App

## Troubleshooting
If you encounter issues with the recommendation service:

1. **Missing files errors**: Ensure your zip package has files at the root level
2. **Dependency issues**: Check if requirements.txt is being properly installed
3. **Runtime errors**: Check logs using `az webapp log tail` command
4. **Deployment failures**: Try deploying just the essential files (app.py, requirements.txt, notebook_recommendation_service.py)

## Monitoring
The service can be monitored using:
1. Azure App Service logs: `az webapp log tail --name moviesapp-recommendation-service --resource-group MoviesAppRG`
2. Azure Portal Application Insights
3. Health check endpoint: https://moviesapp-recommendation-service.azurewebsites.net/health
