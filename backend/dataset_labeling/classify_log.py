"""
Classify firewall log entries to appropriate detection handlers
"""

from dataset_labeling.constants import REASON_OK
from dataset_labeling.detect_bugs import detect_bug
from dataset_labeling.detect_attacks import detect_attack_from_reason
from dataset_labeling.utils import normalize_to_dict, get_reason_string


def classify_log(
    row: dict,
    last_ts: str | None = None,
    last_fw: str | None = None,
) -> dict | None:
    """
    Classify a log entry to appropriate detection handler.

    Args:
        row: Log entry dictionary
        last_ts: Last valid timestamp for fallback
        last_fw: Last valid firewall ID for fallback

    Returns:
        Event dictionary from detect_bug or detect_attack_from_reason,
        or None if no bug or attack detected
    """
    bug_event = detect_bug(
        row, fallback_timestamp=last_ts, fallback_firewall_id=last_fw
    )
    if bug_event is not None:
        return bug_event

    row = normalize_to_dict(row)

    reason_str = get_reason_string(row)
    if reason_str in REASON_OK:
        return None

    attack_event = detect_attack_from_reason(row)
    if attack_event is not None:
        return attack_event

    return None
