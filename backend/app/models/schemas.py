from pydantic import BaseModel


class TripRequest(BaseModel):
    pickup_datetime: str
    pickup_longitude: float
    pickup_latitude: float
    dropoff_longitude: float
    dropoff_latitude: float
    passenger_count: int


class PredictionResponse(BaseModel):
    predicted_fare: float
    recommendation: str
    explanation: str
