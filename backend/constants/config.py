"""
Configuration constants for OVH AI Endpoints client
"""

import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# OVH AI Endpoints configuration
OVH_BASE_URL = "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"
OVH_MODEL = "DeepSeek-R1-Distill-Llama-70B"
OVH_API_KEY_ENV_VAR = "OVH_AI_ENDPOINTS_ACCESS_TOKEN"

# LLM configuration
LLM_TEMPERATURE = 0

# OVH LLM service
llm = ChatOpenAI(
    base_url=OVH_BASE_URL,
    api_key=os.getenv(OVH_API_KEY_ENV_VAR),
    model=OVH_MODEL,
    temperature=LLM_TEMPERATURE,
)
