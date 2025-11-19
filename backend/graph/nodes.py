"""
LangGraph workflow nodes
"""

import pandas as pd
from typing import Dict, Any
from langchain_core.messages import HumanMessage
from langchain_community.tools import DuckDuckGoSearchRun
from constants.schemas import (
    MLModelOutput,
    EventInfo,
    RemediationStep,
    EventAnalysis,
)
from constants.known_events import get_known_event
from constants.config import llm
from constants.prompts import (
    ANALYZE_UNKNOWN_EVENT_PROMPT,
    ENHANCED_ANALYZE_PROMPT,
    FALLBACK_EXPLANATION_TEMPLATE,
    DEFAULT_REMEDIATION_STEPS,
)
from testing.mock_model import mock_predict


def ml_model_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    ML Model node: processes log lines through ML model

    Input: state with 'log_lines' (List[Dict])
    Output: state with 'ml_outputs' (List[MLModelOutput])
    """
    log_lines = state.get("log_lines", [])

    if not log_lines:
        return {"ml_outputs": []}

    # Convert JSON array to DataFrame
    df = pd.DataFrame(log_lines)

    try:
        from model_predictor import predict

        # Call real ML model
        ml_output_df = predict(df)
    except (ImportError, AttributeError):
        # Fallback: if model not available, use mock model
        print("Warning: ML model not available, using mock model")
        ml_output_df = mock_predict(df)

    # Convert DataFrame to list of MLModelOutput objects
    ml_outputs = []
    for _, row in ml_output_df.iterrows():
        ml_output = MLModelOutput(
            timestamp=str(row["timestamp"]),
            severity=row["severity"],
            type=row["type"],
            precise_type=row["precise_type"],
        )
        ml_outputs.append(ml_output)

    return {"ml_outputs": ml_outputs}


def decision_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Decision node: routes each ML output to known or unknown handler

    Input: state with 'ml_outputs' (List[MLModelOutput])
    Output: state with routing information
    """
    ml_outputs = state.get("ml_outputs", [])

    # Separate into known and unknown
    known_outputs = []
    unknown_outputs = []

    for ml_output in ml_outputs:
        known_event = get_known_event(ml_output.precise_type)
        if known_event:
            known_outputs.append(ml_output)
        else:
            unknown_outputs.append(ml_output)

    return {"known_outputs": known_outputs, "unknown_outputs": unknown_outputs}


def known_lookup_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Known lookup node: returns hardcoded EventInfo for known events

    Input: state with 'known_outputs' (List[MLModelOutput])
    Output: state with 'known_results' (List[EventInfo])
    """
    known_outputs = state.get("known_outputs", [])

    known_results = []
    for ml_output in known_outputs:
        known_event = get_known_event(ml_output.precise_type)
        if known_event:
            event_info = EventInfo(
                precise_type=ml_output.precise_type,
                title=known_event["title"],
                explanation=known_event["explanation"],
                remediation=[
                    RemediationStep(**step)
                    for step in known_event["remediation"]
                ],
                known_type=True,
            )
            known_results.append(event_info)

    return {"known_results": known_results}


def llm_agent_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LLM Agent node: uses LLM with web search to analyze unknown events

    Input: state with 'unknown_outputs' (List[MLModelOutput]) and 'log_lines'
    Output: state with 'unknown_results' (List[EventInfo])
    """
    unknown_outputs = state.get("unknown_outputs", [])
    log_lines = state.get("log_lines", [])

    if not unknown_outputs:
        return {"unknown_results": []}

    # Initialize LLM and search tool once for efficiency
    structured_llm = llm.with_structured_output(EventAnalysis)
    search_tool = DuckDuckGoSearchRun()

    # Create lookup dict for log context by timestamp
    log_context_by_timestamp = {
        log_line.get("timestamp", ""): log_line for log_line in log_lines
    }

    unknown_results = []
    for ml_output in unknown_outputs:
        # Get log context if available
        log_context = log_context_by_timestamp.get(ml_output.timestamp, {})
        context_str = f"\n\nLog context:\n{log_context}" if log_context else ""

        # Build prompt
        prompt = ANALYZE_UNKNOWN_EVENT_PROMPT.format(
            precise_type=ml_output.precise_type, context_str=context_str
        )

        # Get search results for up-to-date information
        search_query = (
            f"firewall security {ml_output.precise_type} attack remediation"
        )
        search_results = search_tool.run(search_query)

        # Create enhanced prompt with search results
        enhanced_prompt = ENHANCED_ANALYZE_PROMPT.format(
            base_prompt=prompt, search_results=search_results[:2000]
        )

        # Analyze with LLM
        try:
            result = structured_llm.invoke(
                [HumanMessage(content=enhanced_prompt)]
            )
            default_title = f"Security event: {ml_output.precise_type}"
            event_analysis = EventAnalysis(
                precise_type=ml_output.precise_type,
                title=getattr(result, "title", default_title),
                explanation=getattr(result, "explanation", ""),
                remediation=getattr(result, "remediation", []),
            )
        except Exception as e:
            print(
                f"Warning: LLM API call failed ({e}), "
                f"returning safe fallback response"
            )
            event_analysis = EventAnalysis(
                precise_type=ml_output.precise_type,
                title=f"Security event: {ml_output.precise_type}",
                explanation=FALLBACK_EXPLANATION_TEMPLATE.format(
                    precise_type=ml_output.precise_type
                ),
                remediation=[
                    RemediationStep(**step)
                    for step in DEFAULT_REMEDIATION_STEPS
                ],
            )

        # Convert to EventInfo
        unknown_results.append(
            EventInfo(
                precise_type=event_analysis.precise_type,
                title=event_analysis.title,
                explanation=event_analysis.explanation,
                remediation=event_analysis.remediation,
                known_type=False,
            )
        )

    return {"unknown_results": unknown_results}


def merge_results_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Merge node: combines known_results and unknown_results into results

    Input: state with 'known_results' and/or 'unknown_results'
    Output: state with 'results' containing all events
    """
    known_results = state.get("known_results", [])
    unknown_results = state.get("unknown_results", [])

    # Combine all results
    results = list(known_results) + list(unknown_results)

    return {"results": results}
