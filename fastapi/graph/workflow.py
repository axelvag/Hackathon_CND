"""
LangGraph workflow definition
"""

from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END, START
from graph.nodes import (
    ml_model_node,
    decision_node,
    known_lookup_node,
    llm_agent_node,
    merge_results_node,
)
from constants.schemas import MLModelOutput, EventInfo


class WorkflowState(TypedDict):
    """Workflow state definition"""

    log_lines: List[Dict[str, Any]]
    ml_outputs: List[MLModelOutput]
    known_outputs: List[MLModelOutput]
    unknown_outputs: List[MLModelOutput]
    known_results: List[EventInfo]
    unknown_results: List[EventInfo]
    results: List[EventInfo]


def route_decision(state: WorkflowState) -> List[str]:
    """
    Route decision function: routes to both known and unknown paths in parallel
    Returns list of node names to execute in parallel
    """
    known_outputs = state.get("known_outputs", [])
    unknown_outputs = state.get("unknown_outputs", [])

    routes = []
    if known_outputs:
        routes.append("known_lookup")
    if unknown_outputs:
        routes.append("llm_agent")

    # If no routes, go directly to merge (which will just return empty results)
    return routes if routes else ["merge_results"]


def create_workflow() -> StateGraph:
    """
    Create and compile the LangGraph workflow
    """
    workflow = StateGraph(WorkflowState)

    # Add nodes
    workflow.add_edge(START, "ml_model")
    workflow.add_node("ml_model", ml_model_node)
    workflow.add_node("decision", decision_node)
    workflow.add_node("known_lookup", known_lookup_node)
    workflow.add_node("llm_agent", llm_agent_node)
    workflow.add_node("merge_results", merge_results_node)

    # Add edges
    workflow.add_edge("ml_model", "decision")

    # Conditional edge from decision - routes to parallel execution
    # LangGraph will execute all returned nodes in parallel
    workflow.add_conditional_edges("decision", route_decision)

    # Both known_lookup and llm_agent converge to merge_results
    workflow.add_edge("known_lookup", "merge_results")
    workflow.add_edge("llm_agent", "merge_results")

    # After merge, we're done
    workflow.add_edge("merge_results", END)

    graph = workflow.compile()
    with open("workflow_graph.png", "wb") as f:
        f.write(graph.get_graph().draw_mermaid_png())
    return graph


# Create workflow instance
workflow = create_workflow()
