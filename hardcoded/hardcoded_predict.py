import pandas as pd

REASON_ATTACK_INFO = {
    "XSS attempt": (
        "Medium",
        "XSS",
        "Tentative de Cross-Site Scripting détectée."
    ),
    "Suspicious SQL payload": (
        "High",
        "SQL Injection",
        "Charge utile SQL suspecte — possible injection SQL."
    ),
    "Port scan detected": (
        "Medium",
        "Port Scan",
        "Scan de ports détecté sur l’hôte de destination."
    ),
    "Potential DDoS - high rate": (
        "High",
        "DDoS",
        "Débit de trafic anormalement élevé — possible attaque DDoS."
    ),
    "Known malicious domain contacted": (
        "High",
        "Malware / C2",
        "Contact avec un domaine connu comme malveillant."
    ),
    "Multiple auth failures": (
        "High",
        "Brute Force",
        "Multiples échecs d’authentification consécutifs."
    ),
}


def detect_attack_from_reason(row: dict):
    reason = row.get("reason")
    if pd.isna(reason) or reason in ("", None):
        return None

    info = REASON_ATTACK_INFO.get(str(reason))
    if info is None:
        return None

    severity, attack_type, explanation = info

    return {
        "firewall_id": row.get("firewall_id"),
        "timestamp": row.get("timestamp"),
        "reason": reason,
        "severity": severity,
        "type": "Attack",
        "attack_type": attack_type,
        "explanation": explanation,
    }
