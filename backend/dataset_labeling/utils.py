"""
Utility functions for firewall log analysis
"""

import pandas as pd
import ipaddress
from datetime import datetime, timedelta
from reason_model import predict_reason_for_row
from dataset_labeling.constants import (
    TIMESTAMP_FORMAT,
    MIN_PORT,
    MAX_PORT,
    INVALID_PORT_VALUES,
)


def is_valid_timestamp(ts: str) -> bool:
    """
    Check if a timestamp string is valid (ISO-8601 format).

    Args:
        ts: Timestamp string to validate

    Returns:
        True if timestamp is valid, False otherwise
    """
    try:
        datetime.strptime(ts, TIMESTAMP_FORMAT)
        return True
    except Exception:
        return False


def is_valid_ip(ip: str) -> bool:
    """
    Check if an IP address string is valid (IPv4 or IPv6).

    Args:
        ip: IP address string to validate

    Returns:
        True if IP is valid, False otherwise
    """
    try:
        ipaddress.ip_address(ip)
        return True
    except Exception:
        return False


def is_valid_port(val) -> bool:
    """
    Check if a port value is valid (integer between 0 and 65535).

    Args:
        val: Port value to validate (can be int, str, or NaN)

    Returns:
        True if port is valid, False otherwise
    """
    if pd.isna(val):
        return False
    if isinstance(val, str) and val in INVALID_PORT_VALUES:
        return False
    try:
        p = int(val)
        return MIN_PORT <= p <= MAX_PORT
    except Exception:
        return False


def plus_one_second(ts_str: str) -> str | None:
    """
    Add one second to a timestamp string.

    Args:
        ts_str: Timestamp string in ISO-8601 format

    Returns:
        Timestamp string with one second added, or None if invalid
    """
    try:
        ts = datetime.strptime(ts_str, TIMESTAMP_FORMAT)
        ts_plus = ts + timedelta(seconds=1)
        return ts_plus.strftime(TIMESTAMP_FORMAT)
    except Exception:
        return None


def normalize_to_dict(row) -> dict:
    """
    Normalize input to dictionary format.

    Args:
        row: Can be a dict, pandas Series, or other type

    Returns:
        Dictionary representation of the input
    """
    if isinstance(row, pd.Series):
        return row.to_dict()
    if isinstance(row, dict):
        return row
    return {}


def get_reason_string(row: dict) -> str | None:
    """
    Extract and normalize reason string from row.
    Call the predict model if the reason is empty.

    Args:
        row: Dictionary containing log entry data

    Returns:
        Reason string or None if not available/invalid
    """
    reason = row.get("reason")
    if pd.isna(reason) or reason in ("", None):
        predicted = predict_reason_for_row(row)
        if predicted is not None:
            row["reason"] = predicted
        else:
            reason_str = str(reason)

    reason = row.get("reason")
    if pd.isna(reason) or reason in ("", None):
        reason_str = None
    else:
        reason_str = str(reason)
    return reason_str
