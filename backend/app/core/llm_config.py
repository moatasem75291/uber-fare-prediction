"""
Configuration helpers for various LLM providers.
"""

# OpenAI-compatible API configuration
OPENAI_CONFIG = {
    "api_structure": {
        "model_param": "model",
        "prompt_param": "prompt",
        "response_path": ["choices", 0, "text"],
    }
}

# Hugging Face API configuration
HUGGINGFACE_CONFIG = {
    "api_structure": {
        "model_param": "model",
        "prompt_param": "inputs",
        "response_path": ["generated_text"],
    }
}

# Anthropic-compatible API configuration
ANTHROPIC_CONFIG = {
    "api_structure": {
        "model_param": "model",
        "prompt_param": "prompt",
        "response_path": ["completion"],
    }
}


# Get provider configuration by name
def get_provider_config(provider_name):
    providers = {
        "openai": OPENAI_CONFIG,
        "huggingface": HUGGINGFACE_CONFIG,
        "anthropic": ANTHROPIC_CONFIG,
    }

    provider_name = provider_name.lower()

    return providers.get(
        provider_name, HUGGINGFACE_CONFIG
    )  # Default to Hugging Face if not found
