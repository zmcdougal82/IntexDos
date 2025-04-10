"""
Recommendation API

FastAPI service that exposes movie recommendations via RESTful API endpoints.
This allows the frontend to fetch dynamically generated recommendations.
"""

import os
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
from recommendation_service import RecommendationService

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('recommendation_api')

# Initialize FastAPI app
app = FastAPI(title="Movie Recommendation API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get recommendation service
def get_recommendation_service():
    try:
        service = RecommendationService()
        return service
    except Exception as e:
        logger.error(f"Failed to initialize recommendation service: {str(e)}")
        raise HTTPException(status_code=500, detail="Recommendation service unavailable")

# Models for request/response
class UserIdRequest(BaseModel):
    user_id: str

class RatingRequest(BaseModel):
    user_id: str
    show_id: str
    rating_value: int

class GenreRequest(BaseModel):
    user_id: str
    genre: Optional[str] = None

class RecommendationResponse(BaseModel):
    collaborative: List[str]
    contentBased: List[str]
    genres: Dict[str, List[str]]

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "recommendation-api"}

# Get all recommendations for a user
@app.get("/recommendations/{user_id}", response_model=RecommendationResponse)
async def get_user_recommendations(
    user_id: str, 
    rec_service: RecommendationService = Depends(get_recommendation_service)
):
    try:
        recommendations = rec_service.get_all_recommendations(user_id)
        return recommendations
    except Exception as e:
        logger.error(f"Error getting recommendations for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

# Get collaborative filtering recommendations
@app.get("/recommendations/{user_id}/collaborative", response_model=List[str])
async def get_collaborative_recommendations(
    user_id: str, 
    rec_service: RecommendationService = Depends(get_recommendation_service)
):
    try:
        recommendations = rec_service.get_collaborative_recommendations(user_id)
        return recommendations
    except Exception as e:
        logger.error(f"Error getting collaborative recommendations for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

# Get content-based recommendations
@app.get("/recommendations/{user_id}/content-based", response_model=List[str])
async def get_content_based_recommendations(
    user_id: str, 
    rec_service: RecommendationService = Depends(get_recommendation_service)
):
    try:
        recommendations = rec_service.get_content_based_recommendations(user_id)
        return recommendations
    except Exception as e:
        logger.error(f"Error getting content-based recommendations for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

# Get genre-specific recommendations
@app.get("/recommendations/{user_id}/genres", response_model=Dict[str, List[str]])
async def get_genre_recommendations(
    user_id: str,
    genre: Optional[str] = None,
    rec_service: RecommendationService = Depends(get_recommendation_service)
):
    try:
        recommendations = rec_service.get_genre_recommendations(user_id, genre=genre)
        return recommendations
    except Exception as e:
        logger.error(f"Error getting genre recommendations for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

# Update recommendations after rating
@app.post("/recommendations/update-after-rating")
async def update_after_rating(
    rating: RatingRequest,
    background_tasks: BackgroundTasks,
    rec_service: RecommendationService = Depends(get_recommendation_service)
):
    try:
        # Update recommendations in the background
        background_tasks.add_task(rec_service.refresh_data)
        return {"status": "ok", "message": "Recommendation update scheduled"}
    except Exception as e:
        logger.error(f"Error updating recommendations after rating: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update recommendations: {str(e)}")

# Generate recommendations file
@app.post("/recommendations/generate-file")
async def generate_recommendations_file(
    background_tasks: BackgroundTasks,
    output_path: str = "recommendations.json",
    rec_service: RecommendationService = Depends(get_recommendation_service)
):
    try:
        # Generate file in the background
        background_tasks.add_task(rec_service.generate_recommendations_file, output_path)
        return {"status": "ok", "message": f"Recommendation file generation scheduled to {output_path}"}
    except Exception as e:
        logger.error(f"Error generating recommendations file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations file: {str(e)}")

# Main execution for testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
