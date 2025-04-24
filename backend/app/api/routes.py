from fastapi import APIRouter, HTTPException
from app.models.schemas import TripRequest, PredictionResponse
from app.services.utils import extract_features
from app.services.predictor import predict_with_model
from app.services.explanation import generate_explanation

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict_fare(trip: TripRequest):
    try:
        features = extract_features(trip)
        predicted_fare = predict_with_model(features)
        insight = generate_explanation(features, predicted_fare)
        return {
            "predicted_fare": predicted_fare,
            "recommendation": insight["recommendation"],
            "explanation": insight["explanation"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/health")
async def health_check():
    return {"status": "healthy"}
