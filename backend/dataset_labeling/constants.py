"""
Constants used across the firewall log analysis modules
"""

# Timestamp format
TIMESTAMP_FORMAT = "%Y-%m-%dT%H:%M:%SZ"

# Fallback timestamp for invalid timestamps
UNKNOWN_TIMESTAMP = "UNKNOWN_TS"

# Corrupted line prefix
CORRUPTED_LINE_PREFIX = "CORRUPTED_LINE"

# Essential fields that must be present in log entries
ESSENTIAL_FIELDS = [
    "timestamp",
    "firewall_id",
    "src_ip",
    "dst_ip",
    "protocol",
    "action",
    "bytes",
    "duration_ms",
    "rule_id",
    "session_id",
]

# Valid reasons that indicate no security issue
REASON_OK = {
    "Protocol violation",
    "No policy",
    "State mismatch",
    "Connection reset",
    "Large packet",
    "Matched rule",
    "Invalid checksum",
    "Expired session",
}

# Bug type information: mapping bug_type -> severity
BUG_INFO = {
    "corrupt_line": "High",
    "malformed_timestamp": "High",
    "nonnumeric_port": "Medium",
    "missing_field": "Low",
    "invalid_ip": "High",
    "negative_bytes": "Medium",
}

# Attack reason information: mapping reason -> severity
REASON_ATTACK_INFO = {
    "XSS attempt": "Medium",
    "Suspicious SQL payload": "High",
    "SQL Injection": "High",
    "Port scan": "Medium",
    "Port scan detected": "Medium",
    "Potential DDoS - high rate": "High",
    "DDoS pattern": "High",
    "Known malicious domain contacted": "High",
    "Multiple auth failures": "High",
    "SSH brute force": "High",
    "Malware download": "High",
}

# Event types
EVENT_TYPE_BUG = "Bug"
EVENT_TYPE_ATTACK = "Attack"
EVENT_TYPE_NONE = "None"

# Severity levels
SEVERITY_LOW = "Low"
SEVERITY_MEDIUM = "Medium"
SEVERITY_HIGH = "High"

# Default bug severity fallback
DEFAULT_BUG_SEVERITY = "Medium"

# Port validation constants
MIN_PORT = 0
MAX_PORT = 65535

# Invalid port values
INVALID_PORT_VALUES = ("", "N/A")
