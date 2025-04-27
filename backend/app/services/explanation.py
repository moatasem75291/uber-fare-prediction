from typing import Dict, Any
import os
import json
import logging
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get API configuration from environment variables
HF_API_KEY = os.getenv("HF_API_KEY", "")
HF_URL = os.getenv("HF_URL")
HF_MODEL = os.getenv("HF_MODEL")


def generate_explanation(
    features: Dict[str, Any], predicted_fare: float
) -> Dict[str, str]:
    """Generate a natural language explanation and recommendation based on the prediction and features using an LLM."""

    # Format the input data for the LLM prompt
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

    # Create a comprehensive prompt for the LLM
    prompt = f"""
    You are a helpful taxi fare explanation system. Based on the following trip details, provide:
    1. A natural language explanation of why the fare costs what it does
    2. Two or three practical recommendations for how the rider could save money

    TRIP DETAILS:
    - Predicted fare: ${predicted_fare:.2f}
    - Trip distance: {distance:.2f} km
    - Number of passengers: {passenger_count}
    - Pickup time: {pickup_hour}:00 hours
    - Is rush hour: {"Yes" if is_rush_hour else "No"}
    - Day of week: {weekday}

    ADDITIONAL CONTEXT:
    - Rush hours are typically 7-9 AM and 4-7 PM
    - Thursday and Sunday often have higher fares historically
    - Early morning (5-6 AM) and afternoon (3-4 PM) typically have higher fares
    - Longer trips may have alternate routes available
    - Solo trips have higher per-passenger costs than shared rides

    FORMAT YOUR RESPONSE AS JSON:
    {{
        "explanation": "A clear, conversational explanation of the fare pricing factors",
        "recommendation": "A practical, specific recommendations to save money and some tips for the rider"
    }}
    
    Keep explanations concise but detailed enough to be helpful, and ensure recommendations are actionable.
    """

    try:
        # Call the LLM service
        response = call_llm_service(prompt)
        parsed_response = parse_json_response(response)
        return parsed_response
    except Exception as e:
        # Log the error
        logger.error(f"LLM service error: {str(e)}")
        # Return a default response in case of failure
        return {
            "explanation": "Unable to generate explanation at this time.",
            "recommendation": "Please check back later.",
        }


def query(payload: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    """Send a request to the HuggingFace API."""
    response = requests.post(
        HF_URL,
        headers=headers,
        json=payload,
    )
    return response.json()


def call_llm_service(prompt: str) -> str:
    """Call the LLM API using HuggingFace client with Together AI provider."""
    try:

        headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
        }
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 512,
            "model": HF_MODEL,
            "temperature": 0.7,
        }

        # Send request to the model
        response = query(payload, headers)
        completion = response["choices"][0]["message"]["content"]

        # Extract and return the response content
        return completion

    except Exception as e:
        raise Exception(f"Error calling LLM service: {str(e)}")


def parse_json_response(response_text: str) -> Dict[str, str]:
    """Parse JSON from the LLM response."""
    try:
        # Try direct JSON parsing first
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            # If direct parsing fails, try to extract JSON from the text
            import re

            json_match = re.search(r"({.*})", response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            else:
                raise Exception("No JSON found in LLM response")

    except Exception as e:
        logger.warning(f"Failed to parse LLM response: {str(e)}")
        logger.warning(f"Raw response: {response_text}")

        # If all parsing attempts fail, raise the exception
        raise
