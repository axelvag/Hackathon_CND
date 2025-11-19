"""
Detect bugs in firewall log entries
"""

import pandas as pd
from dataset_labeling.constants import (
    BUG_INFO,
    ESSENTIAL_FIELDS,
    CORRUPTED_LINE_PREFIX,
    UNKNOWN_TIMESTAMP,
    DEFAULT_BUG_SEVERITY,
    EVENT_TYPE_BUG,
)
from dataset_labeling.utils import (
    is_valid_timestamp,
    is_valid_ip,
    is_valid_port,
    plus_one_second,
    normalize_to_dict,
)


def detect_bug(
    row: dict | str,
    fallback_timestamp: str | None = None,
    fallback_firewall_id: str | None = None,
) -> dict | None:
    """
    Detect bugs in a firewall log entry.

    Args:
        row: Log entry as dict, pandas Series, or corrupted line string
        fallback_timestamp: Timestamp to use if current entry's timestamp
            is invalid
        fallback_firewall_id: Firewall ID to use if current entry's ID
            is invalid

    Returns:
        Bug event dictionary with details, or None if no bug detected
    """
    if isinstance(row, str):
        if row.startswith(CORRUPTED_LINE_PREFIX):
            precise_type = "corrupt_line"
            sev = BUG_INFO[precise_type]
            return {
                "firewall_id": fallback_firewall_id,
                "timestamp": fallback_timestamp,
                "precise_type": precise_type,
                "severity": sev,
                "type": EVENT_TYPE_BUG,
            }
        return None

    row = normalize_to_dict(row)

    precise_type = _identify_bug_type(row)

    if precise_type is None:
        return None

    return _build_bug_event(
        row,
        precise_type,
        fallback_timestamp,
        fallback_firewall_id,
    )


def _identify_bug_type(row: dict) -> str | None:
    """
    Identify the precise type of bug in a log entry.

    Args:
        row: Log entry dictionary

    Returns:
        Precise bug type string or None if no bug detected
    """
    if any(
        isinstance(v, str) and v.startswith(CORRUPTED_LINE_PREFIX)
        for v in row.values()
    ):
        return "corrupt_line"

    if any(
        f not in row or row[f] in ("", None) or pd.isna(row[f])
        for f in ESSENTIAL_FIELDS
    ):
        return "missing_field"

    if not is_valid_timestamp(str(row.get("timestamp", ""))):
        return "malformed_timestamp"

    if not (
        is_valid_ip(str(row.get("src_ip", "")))
        and is_valid_ip(str(row.get("dst_ip", "")))
    ):
        return "invalid_ip"

    if not (
        is_valid_port(row.get("src_port"))
        and is_valid_port(row.get("dst_port"))
    ):
        return "nonnumeric_port"

    try:
        b = int(row.get("bytes"))
        if b < 0:
            return "negative_bytes"
    except Exception:
        return "negative_bytes"

    return None


def _build_bug_event(
    row: dict,
    precise_type: str,
    fallback_timestamp: str | None,
    fallback_firewall_id: str | None,
) -> dict:
    """
    Build bug event dictionary from precise type and row data.

    Args:
        row: Log entry dictionary
        precise_type: Precise type of bug detected
        fallback_timestamp: Fallback timestamp if current is invalid
        fallback_firewall_id: Fallback firewall ID if current is invalid

    Returns:
        Bug event dictionary
    """
    sev = BUG_INFO.get(precise_type, DEFAULT_BUG_SEVERITY)

    raw_ts = row.get("timestamp")
    ts_str = str(raw_ts) if raw_ts else None

    if not is_valid_timestamp(ts_str):
        if (
            fallback_timestamp is not None
            and is_valid_timestamp(str(fallback_timestamp))
        ):
            new_ts = plus_one_second(str(fallback_timestamp))
            ts_str = new_ts if new_ts is not None else None
        else:
            ts_str = UNKNOWN_TIMESTAMP

    fw_id = row.get("firewall_id") or fallback_firewall_id

    return {
        "firewall_id": fw_id,
        "timestamp": ts_str,
        "precise_type": precise_type,
        "severity": sev,
        "type": EVENT_TYPE_BUG,
    }
