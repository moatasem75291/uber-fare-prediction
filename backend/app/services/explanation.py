from typing import Dict, Any


def generate_explanation(
    features: Dict[str, Any], predicted_fare: float
) -> Dict[str, str]:
    """Generate a natural language explanation and recommendation based on the prediction and features."""
    distance = features["trip_distance"]
    passenger_count = features["passenger_count"]
    pickup_hour = features["pickup_hour"]
    is_rush_hour = features["is_rush_hour"]
    weekday = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ][features["pickup_weekday"]]

    # Determine the main fare factors
    factors = []

    # Distance is always a factor
    distance_description = (
        "very short"
        if distance < 1
        else (
            "short"
            if distance < 2
            else "medium" if distance < 5 else "long" if distance < 10 else "very long"
        )
    )
    factors.append(f"a {distance_description} trip distance of {distance:.2f} km")

    # Time of day factors
    if pickup_hour in [5, 6]:
        factors.append("early morning travel (typically higher fares)")
    elif pickup_hour in [15, 16]:
        factors.append("afternoon peak travel time")

    # Rush hour
    if is_rush_hour:
        factors.append("rush hour pricing")

    # Day of week
    if weekday in ["Thursday", "Sunday"]:
        factors.append(f"{weekday} travel (historically higher fares)")

    # Passenger count
    if passenger_count == 1:
        factors.append("solo trip (higher per-passenger fare)")
    else:
        factors.append(f"shared trip with {passenger_count} passengers")

    # Build the explanation
    explanation = (
        f"Your estimated fare of ${predicted_fare:.2f} is based on {factors[0]}"
    )

    if len(factors) > 1:
        for i, factor in enumerate(factors[1:], 1):
            if i == len(factors) - 1:
                explanation += f", and {factor}."
            else:
                explanation += f", {factor}"
    else:
        explanation += "."

    # Generate recommendations based on the features
    recommendations = []

    # Time-based recommendations
    if is_rush_hour:
        recommendations.append(
            "Consider traveling outside rush hours (7-9 AM, 4-7 PM) for potentially lower fares"
        )

    if pickup_hour in [5, 6, 15, 16]:
        non_peak_morning = "7-8 AM" if pickup_hour in [5, 6] else "1-2 PM"
        recommendations.append(
            f"Shifting your trip to {non_peak_morning} could reduce the fare"
        )

    # Day-based recommendations
    if weekday in ["Thursday", "Sunday"]:
        recommendations.append(
            f"If flexible, consider traveling on days other than {weekday} for potentially lower fares"
        )

    # Passenger count recommendations
    if passenger_count == 1 and predicted_fare > 10:
        recommendations.append(
            "Sharing your ride with others could make this trip more cost-effective per person"
        )

    # Distance recommendations
    if distance > 5:
        recommendations.append(
            "For this longer trip, exploring alternate routes might offer savings"
        )

    # Choose the top 2 most relevant recommendations
    if recommendations:
        recommendation = recommendations[0]
        if len(recommendations) > 1:
            recommendation += f". Additionally, {recommendations[1].lower()}"
    else:
        recommendation = "This fare is optimal based on current conditions"

    return {"explanation": explanation, "recommendation": recommendation}
