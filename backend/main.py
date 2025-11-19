"""
FastAPI application with LangGraph workflow endpoint
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from constants.schemas import WorkflowResponse, LogAnalysisRequest
from constants.config import API_HOST, API_PORT
from graph.workflow import workflow

app = FastAPI(title="Firewall Log Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze-logs", response_model=WorkflowResponse)
async def analyze_logs(request: LogAnalysisRequest) -> WorkflowResponse:
    """
    Analyze firewall logs through ML model and LLM agent workflow

    Args:
        request: LogAnalysisRequest containing list of firewall log entries

    Returns:
        WorkflowResponse with list of EventInfo objects
    """
    try:
        log_lines = [log_line.model_dump() for log_line in request.log_lines]

        initial_state = {
            "log_lines": log_lines,
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

    uvicorn.run(app, host=API_HOST, port=API_PORT)
