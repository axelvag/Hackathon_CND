import pandas as pd

from parse_log_line import detect_bug
from hardcoded_predict import detect_attack_from_reason


REASON_OK = {
	"Protocol violation",
	"No policy",
	"State mismatch",
	"Connection reset",
	"Large packet",
	"Matched rule",
	# "Suspicious payload",
	"Invalid checksum",
	"Expired session",
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
        return "Bug", bug_event.get("severity")

    # 2) Normalisation de reason
    if isinstance(row, pd.Series):
        row = row.to_dict()

    reason = row.get("reason")
    if pd.isna(reason):
        reason_str = None
    else:
        reason_str = str(reason)

    # 3) Reason explicitement OK -> aucun incident
    if reason_str in REASON_OK:
        # c'est un log normal, pas Bug, pas Attack
        return "None", None

    # 4) Reason clairement malveillante -> Attack hard-codé
    attack_event = detect_attack_from_reason(row)
    if attack_event is not None:
        # detect_attack_from_reason met "severity" et "type": "Attack"
        return "Attack", attack_event.get("severity")

    # 5) Tout le reste -> pour l’instant, on considère que ce n’est
    #    ni Bug ni Attack détecté par nos règles (ce sera le job du modèle plus tard)
    return "None", None