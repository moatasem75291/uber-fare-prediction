import joblib
import os
from app.services.utils import preprocess_features

model_path = os.path.join("app/models/best_gradient_boosting_regressor.pkl")
scaler_path = os.path.join("app/models/scaler.pkl")

model = joblib.load(model_path)
scaler = joblib.load(scaler_path)


def predict_with_model(features: dict) -> float:
    """
    Predict using the actual Gradient Boosting model, respecting the trained feature order.
    """
    feature_vector = preprocess_features(features, scaler)
    prediction = model.predict([feature_vector])[0]
    return round(float(prediction), 2)
