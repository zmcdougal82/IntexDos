
import os
import json
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
from notebook_recommendation_service import RecommendationService

# Define the output path for recommendations file
OUTPUT_PATH = "../../Frontend/movies-client/public/homeRecommendations.json"

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('recommendation_api')
# API Models for requests and responses
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

# Create FastAPI application
def create_app():
    app = FastAPI(title="Movie Recommendation API")
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*", "http://localhost:5176", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    recommendation_service = None
    
    # Dependency to get recommendation service
    def get_recommendation_service():
        nonlocal recommendation_service
        if recommendation_service is None:
            recommendation_service = RecommendationService()
        return recommendation_service
    
    # API Endpoints
    @app.get("/health")
    async def health_check():
        return {"status": "ok", "service": "recommendation-api"}
    
    @app.get("/recommendations/{user_id}", response_model=RecommendationResponse)
    async def get_user_recommendations(
        user_id: str, 
        rec_service: RecommendationService = Depends(get_recommendation_service)
    ):
        try:
            recommendations = rec_service.get_all_recommendations(user_id)
            return recommendations
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")
    
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
            raise HTTPException(status_code=500, detail=f"Failed to update recommendations: {str(e)}")
    
    @app.post("/recommendations/generate-file")
    async def generate_recommendations_file(
        background_tasks: BackgroundTasks,
        output_path: str = OUTPUT_PATH,
        rec_service: RecommendationService = Depends(get_recommendation_service)
    ):
        try:
            # Generate file in the background
            background_tasks.add_task(rec_service.generate_recommendations_file, output_path)
            return {"status": "ok", "message": f"Recommendation file generation scheduled to {output_path}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate recommendations file: {str(e)}")
    
    return app


# Create app instance
app = create_app()
