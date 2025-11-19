import pandas as pd
import ipaddress
from datetime import datetime, timedelta


BUG_INFO = {
    "corrupt_line": (
        "High",
        "Ligne corrompue — impossible à parser correctement."
    ),
    "malformed_timestamp": (
        "High",
        "Timestamp invalide — tri temporel impossible."
    ),
    "nonnumeric_port": (
        "Medium",
        "Port non numérique — empêche mapping service/port."
    ),
    "missing_field": (
        "Low",
        "Champ manquant — perte d'information contextuelle."
    ),
    "invalid_ip": (
        "High",
        "IP invalide — données corrompues ou erronées."
    ),
    "negative_bytes": (
        "Medium",
        "Octets négatifs — incohérence de comptage."
    ),
}

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


def plus_one_second(ts_str: str):
    """Retourne ts_str + 1 seconde (format ISO-8601), ou None si ts_str est invalide."""
    try:
        ts = datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%SZ")
        ts_plus = ts + timedelta(seconds=1)
        return ts_plus.strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        return None


def is_valid_ip(ip: str) -> bool:
    try:
        ipaddress.ip_address(ip)
        return True
    except Exception:
        return False


def is_valid_timestamp(ts: str) -> bool:
    try:
        datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
        return True
    except Exception:
        return False


def is_valid_port(val) -> bool:
    if pd.isna(val):
        return False
    if isinstance(val, str) and val in ("", "N/A"):
        return False
    try:
        p = int(val)
        return 0 <= p <= 65535
    except Exception:
        return False


def detect_bug(row: dict,
               fallback_timestamp: str | None = None,
               fallback_firewall_id: str | None = None):

    # --- Cas où tu passes directement une string "CORRUPTED_LINE_..." ---
    if isinstance(row, str):
        if row.startswith("CORRUPTED_LINE"):
            bug_type = "corrupt_line"
            sev, expl = BUG_INFO[bug_type]
            return {
                "firewall_id": fallback_firewall_id,
                "timestamp": fallback_timestamp,
                "bug_type": bug_type,
                "severity": sev,
                "explanation": expl,
                "type": "Bug",
                "attack_type": "",
            }
        else:
            return None

    # --- Normalisation en dict ---
    if isinstance(row, pd.Series):
        row = row.to_dict()

    bug_type = None

    # 0) LIGNE CORROMPUE : si n'importe quel champ contient "CORRUPTED_LINE..."
    if any(isinstance(v, str) and v.startswith("CORRUPTED_LINE")
           for v in row.values()):
        bug_type = "corrupt_line"

    # 1) champs essentiels manquants
    elif any(f not in row or row[f] in ("", None) or pd.isna(row[f])
             for f in ESSENTIAL_FIELDS):
        bug_type = "missing_field"

    # 2) timestamp invalide
    elif not is_valid_timestamp(str(row.get("timestamp", ""))):
        bug_type = "malformed_timestamp"

    # 3) IP invalides
    elif not (is_valid_ip(str(row.get("src_ip", "")))
              and is_valid_ip(str(row.get("dst_ip", "")))):
        bug_type = "invalid_ip"

    # 4) ports invalides
    elif not (is_valid_port(row.get("src_port")) and
              is_valid_port(row.get("dst_port"))):
        bug_type = "nonnumeric_port"

    # 5) bytes négatifs ou non num
    else:
        try:
            b = int(row.get("bytes"))
            if b < 0:
                bug_type = "negative_bytes"
            else:
                bug_type = None
        except Exception:
            bug_type = "negative_bytes"

    if bug_type is None:
        return None

    # ---------------- Construction de la réponse Bug ----------------

    sev, expl = BUG_INFO.get(
        bug_type,
        ("Medium", "Problème de log détecté.")
    )

    raw_ts = row.get("timestamp")
    ts_str = str(raw_ts) if raw_ts else None

    if not is_valid_timestamp(ts_str):
        if fallback_timestamp is not None and is_valid_timestamp(str(fallback_timestamp)):
            new_ts = plus_one_second(str(fallback_timestamp))
            ts_str = new_ts if new_ts is not None else None
        else:
            ts_str = "UNKNOWN_TS"

    fw_id = row.get("firewall_id") or fallback_firewall_id

    return {
        "firewall_id": fw_id,
        "timestamp": ts_str,
        "bug_type": bug_type,
        "severity": sev,
        "explanation": expl,
        "type": "Bug",
    }
