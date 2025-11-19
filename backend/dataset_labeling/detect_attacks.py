"""
Detect attacks in firewall log entries based on reason field
"""

from dataset_labeling.constants import REASON_ATTACK_INFO, EVENT_TYPE_ATTACK
from dataset_labeling.utils import normalize_to_dict, get_reason_string


def detect_attack_from_reason(row: dict) -> dict | None:
    """
    Detect attack from reason field in log entry.
    Only detects known attacks (those in REASON_ATTACK_INFO).

    Args:
        row: Log entry as dict or pandas Series

    Returns:
        Attack event dictionary with details, or None if no known attack
        detected
    """
    row = normalize_to_dict(row)

    reason = get_reason_string(row)
    if reason is None:
        return None

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
