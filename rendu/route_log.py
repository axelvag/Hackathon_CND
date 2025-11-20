import pandas as pd

from detect_bugs import detect_bug
from detect_attacks import detect_attack_from_reason
from reason_model import predict_reason_for_row


REASON_OK = {
    "Protocol violation",
    "No policy",
    "State mismatch",
    "Connection reset",
    "Large packet",
    "Matched rule",
    "Invalid checksum",
    "Expired session",
    "Other technical",
}


def route_log(row: dict, last_ts=None, last_fw=None):
    """
    Retourne un tuple (type_pred, severity_pred, payload) où:
      - type_pred    ∈ {"Bug", "Attack", "None"}
      - severity_pred ∈ {"Low", "Medium", "High"} ou None
      - payload      : dict détaillé (bug_event / attack_event) ou None
    """

    # 1) Vérifie si c'est un bug de log
    bug_event = detect_bug(
        row,
        fallback_timestamp=last_ts,
        fallback_firewall_id=last_fw,
    )
    if bug_event is not None:
        # detect_bug met déjà "severity" et "type": "Bug"
        return "Bug", bug_event.get("severity"), bug_event

    # 2) Normalisation de reason
    if isinstance(row, pd.Series):
        row = row.to_dict()

    reason = row.get("reason")
    if pd.isna(reason) or reason in ("", None):
        predicted = predict_reason_for_row(row)
        if predicted is not None:
            row["reason"] = predicted
    else:
        reason_str = str(reason)

    reason = row.get("reason")
    if pd.isna(reason):
        reason_str = None
    else:
        reason_str = str(reason)

    # 3) Reason explicitement OK -> aucun incident
    if reason_str in REASON_OK:
        return "None", None, None

    # 4) Reason clairement malveillante -> Attack hard-codé
    attack_event = detect_attack_from_reason(row)
    if attack_event is not None:
        # detect_attack_from_reason met "severity" et "type": "Attack"
        return "Attack", attack_event.get("severity"), attack_event

    # 5) Tout le reste -> ni Bug ni Attack (ce sera le job du modèle)
    return "None", None, None



# def build_test_logs():
#     """
#     Construit 4 lignes de tests :
#       - log 1 : reason remplie, normale (State mismatch)
#       - log 2 : même que 1 mais reason vide -> le modèle doit remplir
#       - log 3 : reason remplie, attaque (SQL Injection)
#       - log 4 : même que 3 mais reason vide -> le modèle doit prédire quelque chose
#     """

#     logs = []

#     # 1) Ligne normale : State mismatch (reason présente)
#     logs.append({
#         "timestamp": "2025-04-01T00:00:00Z",
#         "firewall_id": "FW-B",
#         "src_ip": "192.168.10.85",
#         "dst_ip": "153.8.235.94",
#         "src_port": 31108,
#         "dst_port": 32151,
#         "protocol": "TCP",
#         "action": "ALLOW",
#         "bytes": 39,
#         "duration_ms": 114,
#         "rule_id": "R72",
#         "session_id": "9EMWALVDNYQJ",
#         "user": "",
#         "reason": "State mismatch",  # dans REASON_OK
#         "status": "OK",
#         "flags": "RST",
#     })

#     # 2) Même ligne mais reason vide -> le modèle doit remplir (probablement Other technical)
#     logs.append({
#         "timestamp": "2025-04-01T00:00:01Z",
#         "firewall_id": "FW-B",
#         "src_ip": "192.168.10.85",
#         "dst_ip": "153.8.235.94",
#         "src_port": 31108,
#         "dst_port": 32151,
#         "protocol": "TCP",
#         "action": "ALLOW",
#         "bytes": 39,
#         "duration_ms": 114,
#         "rule_id": "R72",
#         "session_id": "9EMWALVDNYQJ",
#         "user": "",
#         "reason": "",  # <--- raison manquante
#         "status": "OK",
#         "flags": "RST",
#     })

#     # 3) Ligne d'attaque explicite : SQL Injection (reason présente)
#     logs.append({
#         "timestamp": "2025-04-01T00:00:02Z",
#         "firewall_id": "FW-A",
#         "src_ip": "172.23.169.29",
#         "dst_ip": "24.173.114.10",
#         "src_port": 59917,
#         "dst_port": 40798,
#         "protocol": "UDP",
#         "action": "DENY",
#         "bytes": 1408,
#         "duration_ms": 228,
#         "rule_id": "R143",
#         "session_id": "FJ7GB8Y0PGXU",
#         "user": "",
#         "reason": "SQL Injection",   # dans REASON_ATTACK_INFO
#         "status": "OK",
#         "flags": "SQLI",
#     })

#     # 4) Même que 3 mais sans reason -> le modèle doit prédire quelque chose
#     logs.append({
#         "timestamp": "2025-04-01T00:00:03Z",
#         "firewall_id": "FW-A",
#         "src_ip": "172.23.169.29",
#         "dst_ip": "24.173.114.10",
#         "src_port": 59917,
#         "dst_port": 40798,
#         "protocol": "UDP",
#         "action": "DENY",
#         "bytes": 1408,
#         "duration_ms": 228,
#         "rule_id": "R143",
#         "session_id": "FJ7GB8Y0PGXU",
#         "user": "",
#         "reason": "",               # <--- raison manquante
#         "status": "OK",
#         "flags": "SQLI",
#     })

#     return logs


# def main():
#     logs = build_test_logs()

#     last_ts = None
#     last_fw = None

#     for i, row in enumerate(logs, start=1):
#         # On travaille avec une copie dict pour voir les mutations sur 'reason'
#         if isinstance(row, pd.Series):
#             row_dict = row.to_dict()
#         else:
#             row_dict = dict(row)

#         original_reason = row_dict.get("reason")

#         type_pred, severity_pred, payload = route_log(row_dict, last_ts, last_fw)

#         # Mise à jour des fallback (comme dans un vrai flux)
#         if payload and payload.get("timestamp"):
#             last_ts = payload["timestamp"]
#         else:
#             last_ts = row_dict.get("timestamp", last_ts)

#         if payload and payload.get("firewall_id"):
#             last_fw = payload["firewall_id"]
#         else:
#             last_fw = row_dict.get("firewall_id", last_fw)

#         print(f"\n=== Log {i} ===")
#         print(f"Ligne brute         : {row}")
#         print(f"Reason d'origine    : {original_reason!r}")
#         print(f"Reason après route  : {row_dict.get('reason')!r}")
#         print(f"type_pred           : {type_pred}")
#         print(f"severity_pred       : {severity_pred}")
#         print(f"payload             : {payload}")

#     print("\nTest terminé.")


# if __name__ == "__main__":
#     main()
