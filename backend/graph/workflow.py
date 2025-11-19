"""
LangGraph workflow definition
"""

from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END, START
from graph.nodes import (
    ml_model_node,
    known_lookup_node,
    llm_agent_node,
    merge_results_node,
)
from constants.schemas import MLModelOutput, EventInfo


class WorkflowState(TypedDict):
    """Workflow state definition"""

    log_lines: List[Dict[str, Any]]
    known_outputs: List[MLModelOutput]
    unknown_outputs: List[MLModelOutput]
    known_results: List[EventInfo]
    unknown_results: List[EventInfo]
    results: List[EventInfo]


def create_workflow() -> StateGraph:
    """
    Create and compile the LangGraph workflow
    """
    workflow = StateGraph(WorkflowState)

    workflow.add_node("ml_model", ml_model_node)
    workflow.add_node("known_lookup", known_lookup_node)
    workflow.add_node("llm_agent", llm_agent_node)
    workflow.add_node("merge_results", merge_results_node)

    workflow.add_edge(START, "ml_model")
    workflow.add_edge("ml_model", "known_lookup")
    workflow.add_edge("ml_model", "llm_agent")
    workflow.add_edge("known_lookup", "merge_results")
    workflow.add_edge("llm_agent", "merge_results")
    workflow.add_edge("merge_results", END)

    graph = workflow.compile()
    with open("workflow_graph.png", "wb") as f:
        f.write(graph.get_graph().draw_mermaid_png())
    return graph


workflow = create_workflow()
