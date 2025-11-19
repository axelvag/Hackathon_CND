"""
Configuration constants for OVH AI Endpoints client and API server
"""

import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_URL = os.getenv("API_URL", f"http://localhost:{API_PORT}")

OVH_BASE_URL = "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"
OVH_MODEL = "DeepSeek-R1-Distill-Llama-70B"
OVH_API_KEY_ENV_VAR = "OVH_AI_ENDPOINTS_ACCESS_TOKEN"

LLM_TEMPERATURE = 0

llm = ChatOpenAI(
    base_url=OVH_BASE_URL,
    api_key=os.getenv(OVH_API_KEY_ENV_VAR),
    model=OVH_MODEL,
    temperature=LLM_TEMPERATURE,
)
