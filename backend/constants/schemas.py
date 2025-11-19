"""
Pydantic schemas for request/response models
"""

from pydantic import BaseModel
from typing import List, Literal


class LogLine(BaseModel):
    """Input log line structure from JSON array"""

    # Accept any fields that might be in a firewall log
    model_config = {"extra": "allow"}


class RemediationStep(BaseModel):
    """A single remediation step"""

    title: str
    description: str


class MLModelOutput(BaseModel):
    """Output from ML model - DataFrame row"""

    timestamp: str  # Primary key
    severity: Literal["Low", "Medium", "High"]
    type: Literal["Bug", "Attack"]
    precise_type: str  # snake_case string


class EventInfo(BaseModel):
    """Final event information with explanation and remediation"""

    precise_type: str
    title: str
    explanation: str
    remediation: List[RemediationStep]
    known_type: bool


class WorkflowResponse(BaseModel):
    """Final workflow response"""

    results: List[EventInfo]


class EventAnalysis(BaseModel):
    """Structured output from LLM for unknown events"""

    precise_type: str
    title: str
    explanation: str
    remediation: List[RemediationStep]
