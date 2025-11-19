"""
LangGraph workflow nodes
"""

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

from dataset_labeling.classify_log import classify_log
from dataset_labeling.constants import (
    REASON_OK,
    REASON_ATTACK_INFO,
    EVENT_TYPE_ATTACK,
    SEVERITY_MEDIUM,
)
from dataset_labeling.utils import normalize_to_dict, get_reason_string


def ml_model_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    ML Model node: processes log lines and categorizes into known/unknown

    Input: state with 'log_lines' (List[Dict])
    Output: state with 'known_outputs' and 'unknown_outputs'
    (List[MLModelOutput])
    """
    log_lines = state.get("log_lines", [])

    if not log_lines:
        return {"known_outputs": [], "unknown_outputs": []}

    known_outputs = []
    unknown_outputs = []
    last_ts = None
    last_fw = None

    for log_line in log_lines:
        event = classify_log(log_line, last_ts, last_fw)

        if event is not None:
            ml_output = MLModelOutput(
                timestamp=event.get("timestamp", ""),
                severity=event.get("severity"),
                type=event.get("type"),
                precise_type=event.get("precise_type", ""),
                firewall_id=event.get("firewall_id", ""),
            )

            known_event = get_known_event(ml_output.precise_type)
            if known_event:
                known_outputs.append(ml_output)
            else:
                unknown_outputs.append(ml_output)

            out_ts = event.get("timestamp")
            if isinstance(out_ts, str):
                try:
                    from datetime import datetime

                    datetime.strptime(out_ts, "%Y-%m-%dT%H:%M:%SZ")
                    last_ts = out_ts
                    last_fw = event.get("firewall_id", "")
                except Exception:
                    pass
        else:
            normalized_line = normalize_to_dict(log_line)
            reason = get_reason_string(normalized_line)

            if (
                reason
                and reason not in REASON_OK
                and reason not in REASON_ATTACK_INFO
            ):
                timestamp = normalized_line.get("timestamp", "")
                if not timestamp or not isinstance(timestamp, str):
                    if last_ts:
                        timestamp = last_ts
                    else:
                        timestamp = ""

                ml_output = MLModelOutput(
                    timestamp=timestamp,
                    severity=SEVERITY_MEDIUM,
                    type=EVENT_TYPE_ATTACK,
                    precise_type=reason,
                    firewall_id=normalized_line.get("firewall_id", "")
                    or last_fw
                    or "",
                )
                unknown_outputs.append(ml_output)

            raw_ts = log_line.get("timestamp")
            if isinstance(raw_ts, str):
                try:
                    from datetime import datetime

                    datetime.strptime(raw_ts, "%Y-%m-%dT%H:%M:%SZ")
                    last_ts = raw_ts
                    last_fw = log_line.get("firewall_id")
                except Exception:
                    pass

    return {"known_outputs": known_outputs, "unknown_outputs": unknown_outputs}


def known_lookup_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Known lookup node: returns hardcoded EventInfo for known events

    Input: state with 'known_outputs' (List[MLModelOutput])
    Output: state with 'known_results' (List[EventInfo])

    Note: All inputs are pre-filtered by ml_model_node to be known events
    """
    known_outputs = state.get("known_outputs", [])

    known_results = []
    for ml_output in known_outputs:
        known_event = get_known_event(ml_output.precise_type)

        event_info = EventInfo(
            timestamp=ml_output.timestamp,
            severity=ml_output.severity,
            type=ml_output.type,
            precise_type=ml_output.precise_type,
            firewall_id=ml_output.firewall_id,
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

    structured_llm = llm.with_structured_output(EventAnalysis)
    search_tool = DuckDuckGoSearchRun()

    log_context_by_timestamp = {
        log_line.get("timestamp", ""): log_line for log_line in log_lines
    }

    unknown_results = []
    for ml_output in unknown_outputs:
        log_context = log_context_by_timestamp.get(ml_output.timestamp, {})
        context_str = f"\n\nLog context:\n{log_context}" if log_context else ""

        prompt = ANALYZE_UNKNOWN_EVENT_PROMPT.format(
            precise_type=ml_output.precise_type, context_str=context_str
        )

        search_query = (
            f"firewall security {ml_output.precise_type} attack remediation"
        )
        search_results = search_tool.run(search_query)

        enhanced_prompt = ENHANCED_ANALYZE_PROMPT.format(
            base_prompt=prompt, search_results=search_results[:2000]
        )

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

        unknown_results.append(
            EventInfo(
                timestamp=ml_output.timestamp,
                severity=ml_output.severity,
                type=ml_output.type,
                precise_type=ml_output.precise_type,
                firewall_id=ml_output.firewall_id,
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

    results = list(known_results) + list(unknown_results)

    return {"results": results}
