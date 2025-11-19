"""
Pydantic schemas for request/response models
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional, Union


class LogLine(BaseModel):
    """A single firewall log entry"""

    timestamp: str = Field(
        ..., description="Timestamp in ISO-8601 format (YYYY-MM-DDTHH:MM:SSZ)"
    )
    firewall_id: str = Field(..., description="Firewall identifier")
    src_ip: str = Field(..., description="Source IP address")
    dst_ip: str = Field(..., description="Destination IP address")
    protocol: str = Field(
        ..., description="Network protocol (e.g., TCP, UDP, HTTP)"
    )
    action: str = Field(
        ..., description="Firewall action (e.g., ALLOW, REJECT, DENY)"
    )
    bytes: int = Field(..., description="Number of bytes transferred")
    duration_ms: int = Field(
        ..., description="Connection duration in milliseconds"
    )
    src_port: Optional[Union[int, str]] = Field(
        None, description="Source port number"
    )
    dst_port: Optional[Union[int, str]] = Field(
        None, description="Destination port number"
    )
    reason: Optional[str] = Field(
        None, description="Reason for the firewall action"
    )
    status: Optional[str] = Field(None, description="Connection status")
    flags: Optional[str] = Field(
        None, description="TCP flags or other protocol flags"
    )
    rule_id: Optional[str] = Field(
        None, description="Firewall rule identifier"
    )
    session_id: Optional[str] = Field(
        None, description="Session identifier"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2025-01-15T10:30:45Z",
                "firewall_id": "FW-A",
                "src_ip": "192.168.1.100",
                "dst_ip": "10.0.0.50",
                "src_port": 54321,
                "dst_port": 80,
                "protocol": "TCP",
                "action": "ALLOW",
                "bytes": 1024,
                "duration_ms": 150,
                "reason": "Port scan detected",
                "status": "OK",
                "flags": "SYN",
                "rule_id": "rule-123",
                "session_id": "session-456",
            }
        }
    )


class LogAnalysisRequest(BaseModel):
    """Request body for log analysis endpoint"""

    log_lines: List[LogLine] = Field(
        ...,
        min_length=1,
        description="List of firewall log entries to analyze",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "log_lines": [
                    {
                        "timestamp": "2025-01-15T10:30:45Z",
                        "firewall_id": "FW-A",
                        "src_ip": "192.168.1.100",
                        "dst_ip": "10.0.0.50",
                        "src_port": 54321,
                        "dst_port": 80,
                        "protocol": "TCP",
                        "action": "ALLOW",
                        "bytes": 1024,
                        "duration_ms": 150,
                        "reason": "Port scan detected",
                    }
                ]
            }
        }
    )


class RemediationStep(BaseModel):
    """A single remediation step"""

    title: str
    description: str


class MLModelOutput(BaseModel):
    """Output from ML model - DataFrame row"""

    timestamp: str  # Primary key
    severity: Literal["Low", "Medium", "High"]
    type: Literal["Bug", "Attack"]
    precise_type: str
    firewall_id: str


class EventInfo(MLModelOutput):
    """Final event information with explanation and remediation"""

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


class CallRequest(BaseModel):
    """Request model for phone call endpoint"""

    to: str
    text: str
