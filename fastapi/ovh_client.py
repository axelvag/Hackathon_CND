import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

base_url = "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"

llm = ChatOpenAI(
    base_url=base_url,
    api_key=os.getenv('OVH_AI_ENDPOINTS_ACCESS_TOKEN'),
    model="gpt-oss-120b",
    temperature=0,
    max_tokens=512,
)

user_input = input("Enter your prompt: ")
messages = [HumanMessage(content=user_input)]

# Invoke the LLM
try:
    response = llm.invoke(messages)

    print(response.content)

except Exception as e:
    print(f"Error: {e}")
