"""
OVH AI Endpoints client with structured output and web search
"""

import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

base_url = "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"

# Initialize LLM with structured output support
llm = ChatOpenAI(
    base_url=base_url,
    api_key=os.getenv("OVH_AI_ENDPOINTS_ACCESS_TOKEN"),
    model="DeepSeek-R1-Distill-Llama-70B",
    temperature=0,
)

input = input("Enter your input: ")

print(llm.invoke([HumanMessage(content=input)]))
