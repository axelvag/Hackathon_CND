"""
FastAPI application with LangGraph workflow endpoint
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from constants.schemas import WorkflowResponse
from graph.workflow import workflow

app = FastAPI(title="Firewall Log Analysis API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze-logs", response_model=WorkflowResponse)
async def analyze_logs(log_lines: List[Dict[str, Any]]) -> WorkflowResponse:
    """
    Analyze firewall logs through ML model and LLM agent workflow

    Args:
        log_lines: JSON array of firewall log lines

    Returns:
        WorkflowResponse with list of EventInfo objects
    """
    if not log_lines:
        raise HTTPException(
            status_code=400, detail="log_lines cannot be empty"
        )

    try:
        initial_state = {
            "log_lines": log_lines,
            "ml_outputs": [],
            "known_outputs": [],
            "unknown_outputs": [],
            "results": [],
        }

        final_state = workflow.invoke(initial_state)

        results = final_state.get("results", [])

        return WorkflowResponse(results=results)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Workflow execution failed: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}



if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
