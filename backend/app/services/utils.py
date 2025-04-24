from datetime import datetime
import math

import pandas as pd

# Define the feature order for model input
FEATURE_ORDER = [
    "pickup_longitude",
    "pickup_latitude",
    "dropoff_longitude",
    "dropoff_latitude",
    "passenger_count",
    "pickup_hour",
    "pickup_day",
    "pickup_month",
    "pickup_year",
    "pickup_weekday",
    "pickup_is_weekend",
    "trip_distance",
    "is_rush_hour",
]

# Define which of these are numerical and should be scaled
NUMERICAL_FEATURES = [
    "pickup_longitude",
    "pickup_latitude",
    "dropoff_longitude",
    "dropoff_latitude",
    "passenger_count",
    "pickup_hour",
    "pickup_day",
    "pickup_month",
    "pickup_year",
    "pickup_weekday",
    "trip_distance",
]


def haversine_distance(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return 6371 * c  # km


def extract_features(trip) -> dict:

    pickup_dt = datetime.strptime(trip.pickup_datetime, "%Y-%m-%d %H:%M:%S")

    pickup_hour = pickup_dt.hour
    pickup_day = pickup_dt.day
    pickup_month = pickup_dt.month
    pickup_year = pickup_dt.year
    pickup_weekday = pickup_dt.weekday()
    pickup_is_weekend = 1 if pickup_weekday >= 5 else 0

    trip_distance = haversine_distance(
        trip.pickup_longitude,
        trip.pickup_latitude,
        trip.dropoff_longitude,
        trip.dropoff_latitude,
    )

    is_rush_hour = int(
        not pickup_is_weekend and (7 <= pickup_hour <= 9 or 16 <= pickup_hour <= 19)
    )

    return {
        "pickup_longitude": trip.pickup_longitude,
        "pickup_latitude": trip.pickup_latitude,
        "dropoff_longitude": trip.dropoff_longitude,
        "dropoff_latitude": trip.dropoff_latitude,
        "passenger_count": trip.passenger_count,
        "pickup_hour": pickup_hour,
        "pickup_day": pickup_day,
        "pickup_month": pickup_month,
        "pickup_year": pickup_year,
        "pickup_weekday": pickup_weekday,
        "pickup_is_weekend": pickup_is_weekend,
        "trip_distance": trip_distance,
        "is_rush_hour": is_rush_hour,
    }


def preprocess_features(features: dict, scaler) -> list:
    """
    Preprocess features:
    - Scale numerical features
    - Ensure boolean-like fields are ints
    - Return a list in the correct order for prediction
    """
    # Convert features to DataFrame for easier manipulation
    features_df = pd.DataFrame([features])

    # Scale numerical features
    features_df[NUMERICAL_FEATURES] = scaler.transform(features_df[NUMERICAL_FEATURES])

    # Ensure boolean-like fields are ints
    features_df["pickup_is_weekend"] = features_df["pickup_is_weekend"].astype(int)
    features_df["is_rush_hour"] = features_df["is_rush_hour"].astype(int)

    return features_df[FEATURE_ORDER].values.flatten().tolist()
