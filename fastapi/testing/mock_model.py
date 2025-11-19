"""
Mock ML model for testing the workflow
"""

import pandas as pd
import random


def mock_predict(df: pd.DataFrame) -> pd.DataFrame:
    """
    Mock ML model prediction function

    Takes a DataFrame of log lines and returns predictions with:
    - timestamp: from input
    - severity: Low, Medium, or High
    - type: Bug or Attack
    - precise_type: snake_case event type

    Args:
        df: Input DataFrame with log lines

    Returns:
        DataFrame with columns: timestamp, severity, type, precise_type
    """
    # Known event types for realistic mock data
    known_bugs = [
        "corrupt_line",
        "malformed_timestamp",
        "invalid_ip",
        "nonnumeric_port",
        "missing_field",
        "negative_bytes",
        "duplicate_fields",
        "checksum_error",
        "state_mismatch",
        "connection_issue",
    ]

    known_attacks = [
        "port_scan",
        "xss",
        "sql_injection",
        "ddos",
        "brute_force_ssh",
        "malware_download",
        "malicious_payload",
        "data_exfiltration",
    ]

    # Unknown types for testing LLM agent
    unknown_types = [
        "zero_day_exploit",
        "advanced_persistent_threat",
        "insider_threat",
    ]

    # Severity mapping for different types
    severity_map = {
        "corrupt_line": "High",
        "malformed_timestamp": "High",
        "invalid_ip": "High",
        "nonnumeric_port": "Medium",
        "missing_field": "Low",
        "negative_bytes": "Medium",
        "duplicate_fields": "Low",
        "checksum_error": "Low",
        "state_mismatch": "Low",
        "connection_issue": "Low",
        "port_scan": "Medium",
        "xss": "Medium",
        "sql_injection": "High",
        "ddos": "High",
        "brute_force_ssh": "High",
        "malware_download": "High",
        "malicious_payload": "High",
        "data_exfiltration": "High",
    }

    results = []

    for idx, row in df.iterrows():
        # Get timestamp from input
        timestamp = row.get("timestamp", "")
        if pd.isna(timestamp) or timestamp == "":
            day = random.randint(1, 28)
            hour = random.randint(0, 23)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            timestamp = (
                f"2025-01-{day:02d}T{hour:02d}:{minute:02d}:{second:02d}Z"
            )

        # Randomly choose event type
        # (70% known bugs, 20% known attacks, 10% unknown)
        rand = random.random()
        if rand < 0.7:
            # Known bug
            precise_type = random.choice(known_bugs)
            event_type = "Bug"
        elif rand < 0.9:
            # Known attack
            precise_type = random.choice(known_attacks)
            event_type = "Attack"
        else:
            # Unknown type (for testing LLM agent)
            precise_type = random.choice(unknown_types)
            event_type = "Attack"  # Unknown types are usually attacks

        # Get severity
        severity = severity_map.get(precise_type, "Medium")

        results.append(
            {
                "timestamp": str(timestamp),
                "severity": severity,
                "type": event_type,
                "precise_type": precise_type,
            }
        )

    return pd.DataFrame(results)
