"""
Prompt templates for LLM interactions
"""

# Base prompt template for analyzing unknown firewall events
ANALYZE_UNKNOWN_EVENT_PROMPT = """You are a cybersecurity expert analyzing firewall log events.

A firewall log has been classified as having a precise type: {precise_type}

Your task is to:
1. Set precise_type to: {precise_type}
2. Provide a short title (one sentence) describing the issue
3. Provide a thorough explanation of what this event type means, including:
   - What the problem is
   - What context it typically appears in
   - What it could be accompanied with
   - What could be the bigger picture or impacts
4. Provide actionable remediation steps to address this issue

Use web search to get up-to-date information about this type of security event if needed.

{context_str}

Provide your analysis in the structured format requested. IMPORTANT: Include precise_type='{precise_type}' in your response."""

# Enhanced prompt with search results
ENHANCED_ANALYZE_PROMPT = """{base_prompt}

Recent search results:
{search_results}

Provide your analysis focusing on:
- Clear explanation of the security issue
- Practical remediation steps with titles and descriptions"""

# Fallback explanation template
FALLBACK_EXPLANATION_TEMPLATE = (
    "Security event of type {precise_type} detected. "
    "This requires investigation to understand the context, "
    "potential impacts, and appropriate remediation steps."
)

# Default remediation steps for fallback
DEFAULT_REMEDIATION_STEPS = [
    {
        "title": "Investigate the issue",
        "description": (
            "Review the firewall logs and network traffic "
            "to understand the nature of this event."
        ),
    },
    {
        "title": "Take preventive measures",
        "description": (
            "Implement appropriate security measures based "
            "on the investigation findings."
        ),
    },
]
