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
	"Suspicious payload",
	"Invalid checksum",
	"Expired session",
}


def route_log(row: dict, last_ts=None, last_fw=None):
    """
    Retourne un tuple (action, payload) où:
      - action ∈ {"bug", "pass", "attack", "model"}
      - payload dépend de l'action :
          * "bug"    -> dict de bug_event (format pour l'onglet Bug)
          * "pass"   -> None (ou la ligne brute, selon ton pipeline)
          * "attack" -> dict d'attack_event (format pour l'onglet Attack)
          * "model"  -> None (tu prépareras X et appelleras le modèle ensuite)
    """

    # Vérifie si c'est un bug de log
    bug_event = detect_bug(
        row,
        fallback_timestamp=last_ts,
        fallback_firewall_id=last_fw,
    )
    if bug_event is not None:
        return "bug", bug_event

    reason = row.get("reason")
    if pd.isna(reason):
        reason_str = None
    else:
        reason_str = str(reason)

    # Reason explicitement OK -> on laisse passer, pas de modèle
    if reason_str in REASON_OK:
        return "pass", None

    # Reason clairement malveillante -> Attack hard-codé
    attack_event = detect_attack_from_reason(row)
    if attack_event is not None:
        return "attack", attack_event

    # 4) Tout le reste (reason vide, inconnue, exotique…) -> modèle
    return "model", None
