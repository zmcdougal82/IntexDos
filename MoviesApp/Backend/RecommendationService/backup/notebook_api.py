
import os
import json
import sys
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging
from notebook_recommendation_service import RecommendationService

# Try to import Application Insights for Azure monitoring
try:
    from applicationinsights import TelemetryClient
    from applicationinsights.logging import LoggingHandler
    has_appinsights = True
except ImportError:
    has_appinsights = False

# Define the output path for recommendations file
# In Azure, we'll use an environment variable to specify the path
OUTPUT_PATH = os.environ.get(
    "RECOMMENDATIONS_OUTPUT_PATH", 
    "../../Frontend/movies-client/public/homeRecommendations.json"
)

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]  # Azure captures stdout
)
logger = logging.getLogger('recommendation_api')

# Initialize Application Insights if available
telemetry_client = None
if has_appinsights and os.environ.get("APPINSIGHTS_INSTRUMENTATIONKEY"):
    telemetry_client = TelemetryClient(os.environ.get("APPINSIGHTS_INSTRUMENTATIONKEY"))
    # Add Application Insights logging handler
    logging_handler = LoggingHandler(os.environ.get("APPINSIGHTS_INSTRUMENTATIONKEY"))
    logging_handler.setLevel(logging.INFO)
    logger.addHandler(logging_handler)
    logger.info("Application Insights initialized")
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
    app = FastAPI(
        title="Movie Recommendation API",
        description="API for movie recommendations using collaborative and content-based filtering",
        version="1.0.0"
    )
    
    # Add CORS middleware with proper Azure configuration
    # Get allowed origins from environment or use defaults
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
    if allowed_origins != "*":
        # Split comma-separated origins into a list
        allowed_origins = [origin.strip() for origin in allowed_origins.split(",")]
    else:
        # Default origins including local development and Azure domains
        allowed_origins = [
            "*",
            "http://localhost:5176", 
            "http://localhost:3000",
            "https://*.azurewebsites.net",
            "https://*.msappproxy.net"
        ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    
    recommendation_service = None
    
    # Dependency to get recommendation service
    def get_recommendation_service():
        nonlocal recommendation_service
        if recommendation_service is None:
            recommendation_service = RecommendationService()
        return recommendation_service
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        error_message = f"Unhandled error: {str(exc)}"
        logger.error(error_message, exc_info=True)
        
        # Log to Application Insights if available
        if telemetry_client:
            telemetry_client.track_exception()
            telemetry_client.flush()
            
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred. The error has been logged."}
        )
    
    # API Endpoints
    @app.get("/health")
    async def health_check():
        # Track this request in Application Insights if available
        if telemetry_client:
            telemetry_client.track_request("Health Check", "GET /health", True, 200)
            telemetry_client.flush()
            
        # Get environment info for the health check
        environment = os.environ.get("ASPNETCORE_ENVIRONMENT", 
                                    os.environ.get("ENVIRONMENT", "Unknown"))
        
        return {
            "status": "ok", 
            "service": "recommendation-api",
            "environment": environment,
            "version": "1.0.0",
            "monitoring": "enabled" if telemetry_client else "disabled"
        }
    
    @app.get("/recommendations/{user_id}", response_model=RecommendationResponse)
    async def get_user_recommendations(
        user_id: str, 
        rec_service: RecommendationService = Depends(get_recommendation_service)
    ):
        logger.info(f"Getting recommendations for user {user_id}")
        
        # Track this request in Application Insights if available
        if telemetry_client:
            telemetry_client.track_request(f"Get Recommendations for {user_id}", 
                                         f"GET /recommendations/{user_id}", 
                                         True, 200)
            
        try:
            recommendations = rec_service.get_all_recommendations(user_id)
            
            # Track custom event in Application Insights
            if telemetry_client:
                telemetry_client.track_event(
                    "RecommendationsRetrieved", 
                    {"user_id": user_id, "collab_count": len(recommendations.get("collaborative", [])),
                     "content_count": len(recommendations.get("contentBased", [])),
                     "genre_count": sum(len(v) for v in recommendations.get("genres", {}).values())}
                )
                telemetry_client.flush()
                
            return recommendations
        except Exception as e:
            logger.error(f"Failed to get recommendations for user {user_id}: {str(e)}", exc_info=True)
            
            # Track exception in Application Insights
            if telemetry_client:
                telemetry_client.track_exception()
                telemetry_client.flush()
                
            raise HTTPException(status_code=500, 
                               detail=f"Failed to get recommendations: {str(e)}")
    
    @app.post("/recommendations/update-after-rating")
    async def update_after_rating(
        rating: RatingRequest,
        background_tasks: BackgroundTasks,
        rec_service: RecommendationService = Depends(get_recommendation_service)
    ):
        logger.info(f"Updating recommendations after rating from user {rating.user_id}")
        
        # Track this request in Application Insights if available
        if telemetry_client:
            telemetry_client.track_request("Update After Rating", 
                                         "POST /recommendations/update-after-rating", 
                                         True, 200)
            telemetry_client.track_event(
                "RatingSubmitted", 
                {"user_id": rating.user_id, "show_id": rating.show_id, "rating": rating.rating_value}
            )
            
        try:
            # Update recommendations in the background
            background_tasks.add_task(rec_service.refresh_data)
            return {"status": "ok", "message": "Recommendation update scheduled"}
        except Exception as e:
            logger.error(f"Failed to update recommendations after rating: {str(e)}", exc_info=True)
            
            # Track exception in Application Insights
            if telemetry_client:
                telemetry_client.track_exception()
                telemetry_client.flush()
                
            raise HTTPException(status_code=500, 
                               detail=f"Failed to update recommendations: {str(e)}")
    
    @app.post("/recommendations/generate-file")
    async def generate_recommendations_file(
        background_tasks: BackgroundTasks,
        output_path: str = OUTPUT_PATH,
        rec_service: RecommendationService = Depends(get_recommendation_service)
    ):
        logger.info(f"Generating recommendations file at {output_path}")
        
        # Track this request in Application Insights if available
        if telemetry_client:
            telemetry_client.track_request("Generate File", 
                                         "POST /recommendations/generate-file", 
                                         True, 200)
            
        try:
            # Generate file in the background
            background_tasks.add_task(rec_service.generate_recommendations_file, output_path)
            return {"status": "ok", "message": f"Recommendation file generation scheduled to {output_path}"}
        except Exception as e:
            logger.error(f"Failed to generate recommendations file: {str(e)}", exc_info=True)
            
            # Track exception in Application Insights
            if telemetry_client:
                telemetry_client.track_exception()
                telemetry_client.flush()
                
            raise HTTPException(status_code=500, 
                               detail=f"Failed to generate recommendations file: {str(e)}")
    
    return app


# Create app instance
app = create_app()
