"""
Detect attacks in firewall log entries based on reason field
"""

from constants import REASON_ATTACK_INFO, EVENT_TYPE_ATTACK
from utils import normalize_to_dict, get_reason_string


def detect_attack_from_reason(row: dict) -> dict | None:
    """
    Detect attack from reason field in log entry.

    Args:
        row: Log entry as dict or pandas Series

    Returns:
        Attack event dictionary with details, or None if no attack detected
    """
    # Normalize input to dictionary
    row = normalize_to_dict(row)

    # Get and validate reason
    reason = get_reason_string(row)
    if reason is None:
        return None

    # Check if reason matches known attack patterns
    severity = REASON_ATTACK_INFO.get(reason)
    if severity is None:
        return None

    return {
        "timestamp": row.get("timestamp"),
        "firewall_id": row.get("firewall_id"),
        "type": EVENT_TYPE_ATTACK,
        "precise_type": reason,
        "severity": severity,
    }
