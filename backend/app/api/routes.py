from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import TripRequest, PredictionResponse
from app.services.utils import extract_features
from app.services.predictor import predict_with_model
from app.services.explanation import generate_explanation
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict_fare(trip: TripRequest, request: Request):
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"

    logger.info(f"Received prediction request from {client_ip}")

    try:
        # Extract features from the request
        features = extract_features(trip)
        logger.debug(f"Extracted features: {features}")

        # Get model prediction
        predicted_fare = predict_with_model(features)
        logger.info(f"Predicted fare: ${predicted_fare:.2f}")

        # Generate explanation using LLM
        insight = generate_explanation(features, predicted_fare)

        # Log response time
        processing_time = time.time() - start_time
        logger.info(f"Request processed in {processing_time:.2f} seconds")

        return {
            "predicted_fare": predicted_fare,
            "recommendation": insight["recommendation"],
            "explanation": insight["explanation"],
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/health")
async def health_check():
    return {"status": "healthy"}
