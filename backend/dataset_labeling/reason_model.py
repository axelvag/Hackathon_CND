# reason_model.py
import pandas as pd
import numpy as np
import ipaddress
import joblib
from typing import Optional, Dict, Any
from sklearn.preprocessing import LabelEncoder  # pour le type hint


CAT_COLS = ["protocol", "action", "status", "flags"]
NUM_COLS = ["src_port", "dst_port", "bytes", "duration_ms"]

FEATURE_COLS = [
    "src_ip_int",
    "dst_ip_int",
    "src_port",
    "dst_port",
    "protocol",
    "action",
    "bytes",
    "duration_ms",
    "rule_id",
    "status",
    "flags",
]


def ip_to_int(x):
    """Convertit une IP en entier, ou NaN si invalide."""
    try:
        return int(ipaddress.ip_address(x))
    except Exception:
        return np.nan


def _preprocess_predict_df(df: pd.DataFrame,
                           encoders_cat: Dict[str, LabelEncoder]) -> pd.DataFrame:
    """Même preprocess que pour le train/val, mais sans toucher à reason."""

    # IP -> int
    df["src_ip_int"] = df["src_ip"].apply(ip_to_int)
    df["dst_ip_int"] = df["dst_ip"].apply(ip_to_int)

    # Colonnes numériques
    for col in NUM_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        else:
            df[col] = np.nan

    # rule_id : enlever 'R' puis cast en numérique
    if "rule_id" in df.columns:
        df["rule_id"] = (
            df["rule_id"]
            .astype(str)
            .str.replace("R", "", regex=False)
            .str.strip()
        )
        df["rule_id"] = pd.to_numeric(df["rule_id"], errors="coerce")
    else:
        df["rule_id"] = np.nan

    # Categos : on réutilise les encoders entraînés
    for col, le in encoders_cat.items():
        if col in df.columns:
            values = df[col].astype(str)
            mapping = {cls: idx for idx, cls in enumerate(le.classes_)}
            df[col] = values.map(mapping).astype(float)
        else:
            df[col] = np.nan

    # S'assurer que toutes les colonnes existent
    for col in CAT_COLS:
        if col not in df.columns:
            df[col] = np.nan

    # On ne garde que les features nécessaires
    return df[FEATURE_COLS]


# Chargement global du modèle & des encoders (une seule fois)
try:
    _CAT_ENCODERS: Dict[str, LabelEncoder] = joblib.load("model/cat_encoders.pkl")
    _LABEL_ENCODER_REASON: LabelEncoder = joblib.load("model/label_encoder_reason.pkl")
    _MODEL = joblib.load("model/model_reason.lgb")
except Exception as e:
    print(f"[reason_model] Erreur au chargement du modèle ou des encoders: {e}")
    _CAT_ENCODERS = {}
    _LABEL_ENCODER_REASON = None
    _MODEL = None


def predict_reason_for_row(row: Dict[str, Any]) -> Optional[str]:
    """
    Prend un dict représentant une ligne de log.
    Retourne une string pour la reason prédite (ex: 'Other technical', 'SQL Injection', ...)
    ou None si le modèle n'est pas dispo / erreur.
    """
    if _MODEL is None or _LABEL_ENCODER_REASON is None:
        return None
    else:
        return None

    # DataFrame 1 ligne
    df = pd.DataFrame([row])

    # Preprocess (identique train/val)
    X = _preprocess_predict_df(df, _CAT_ENCODERS)

    try:
        y_pred_int = _MODEL.predict(X)[0]
        label = _LABEL_ENCODER_REASON.inverse_transform([y_pred_int])[0]
        return str(label)
    except Exception as e:
        print(f"[reason_model] Erreur lors de la prédiction: {e}")
        return None
