import pandas as pd

REASON_ATTACK_INFO = {
    "XSS attempt": (
        "Medium",
        "Tentative de Cross-Site Scripting détectée."
    ),
    "Suspicious SQL payload": (
        "High",
        "Charge utile SQL suspecte — possible injection SQL."
    ),
    "SQL Injection": (
        "High",
        "Tentative d'injection SQL — attaque applicative critique."
    ),
    "Port scan": (
        "Medium",
        "Scan de ports détecté sur l’hôte de destination."
    ),
    "Port scan detected": (
        "Medium",
        "Scan de ports détecté sur l’hôte de destination."
    ),
    "Potential DDoS - high rate": (
        "High",
        "Potentiel DDoS détecté — schéma de volume ou de fréquence malveillant."
    ),
    "DDoS pattern": (
        "High",
        "Potentiel DDoS détecté — schéma de volume ou de fréquence malveillant."
    ),
    "Known malicious domain contacted": (
        "High",
        "Contact avec un domaine connu comme malveillant."
    ),
    "Multiple auth failures": (
        "High",
        "Multiples échecs d’authentification consécutifs."
    ),
    "SSH brute force": (
        "High",
        "Brute-force SSH — tentative de compromission de comptes."
    ),
    "Malware download": (
        "High",
        "Téléchargement malveillant — risque d'infection."
    )
}


def detect_attack_from_reason(row: dict):
    # Uniformiser Series / dict
    if isinstance(row, pd.Series):
        row = row.to_dict()

    reason = row.get("reason")
    if pd.isna(reason) or reason in ("", None):
        return None

    info = REASON_ATTACK_INFO.get(str(reason))
    if info is None:
        return None

    severity, explanation = info

    return {
        "firewall_id": row.get("firewall_id"),
        "timestamp": row.get("timestamp"),
        "bug_type": "",
        "reason": reason,
        "severity": severity,
        "type": "Attack",
        "explanation": explanation,
    }