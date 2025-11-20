#!/usr/bin/env python3
import pandas as pd
import numpy as np
import ipaddress
import joblib
from tqdm.auto import tqdm
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder

tqdm.pandas()

CAT_COLS = ["protocol", "action", "status", "flags"]
NUM_COLS = ["src_port", "dst_port", "bytes", "duration_ms"]

ATTACK_REASONS = {
    "XSS attempt",
    "Suspicious SQL payload",
    "Port scan detected",
    "Multiple auth failures",
    "Potential DDoS - high rate",
    "Known malicious domain contacted",
    "DDoS pattern",
    "Port scan",
    "SQL Injection",
    "Malware download",
    "SSH brute force",
}


def normalize_reason(r: str) -> str:
    """
    Même logique que dans train_model.py :
    - garde les reasons d'attaque
    - tout le reste (y compris 'Suspicious payload') -> 'Other technical'
    """
    r = str(r)
    if r in ATTACK_REASONS:
        return r
    return "Other technical"


def ip_to_int(x):
    try:
        return int(ipaddress.ip_address(x))
    except Exception:
        return np.nan


def preprocess_eval(df: pd.DataFrame, encoders_cat: dict[str, LabelEncoder]):
    """
    Preprocess pour validation :
      - IP -> int
      - rule_id -> int
      - colonnes numériques -> float
      - colonnes catégorielles -> transform avec les encoders entraînés
    Ne touche pas au label reason (géré après).
    """
    print("Conversion des IP en entiers...")
    df["src_ip_int"] = df["src_ip"].progress_apply(ip_to_int)
    df["dst_ip_int"] = df["dst_ip"].progress_apply(ip_to_int)

    print("Conversion des colonnes numériques...")
    for col in NUM_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        else:
            df[col] = np.nan

    print("Nettoyage de rule_id...")
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

    # Colonnes catégorielles : réutilisation des encoders
    for col in CAT_COLS:
        if col in encoders_cat:
            le = encoders_cat[col]
            print(f"Encodage catégoriel de {col} (eval)...")
            values = df[col].astype(str)
            mapping = {cls: idx for idx, cls in enumerate(le.classes_)}
            df[col] = values.map(mapping).astype(float)
        else:
            df[col] = np.nan

    feature_cols = [
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

    # On garde aussi reason pour la vérité terrain
    return df[feature_cols + ["reason"]]


def main():
    print("Chargement des données de validation (logs_val.csv)...")
    df_val = pd.read_csv("logs_val.csv")

    print("Chargement des encoders et du modèle...")
    encoders_cat = joblib.load("cat_encoders.pkl")
    label_encoder_reason = joblib.load("label_encoder_reason.pkl")
    model = joblib.load("model_reason.lgb")

    df_val = preprocess_eval(df_val, encoders_cat)

    print("Normalisation des labels 'reason' (regroupement des génériques)...")
    df_val["reason"] = df_val["reason"].apply(normalize_reason)

    print("Encodage du label 'reason' (vérité terrain)...")
    y_true = label_encoder_reason.transform(df_val["reason"])

    X_val = df_val.drop(columns=["reason"])

    print("Prédictions sur le set de validation...")
    y_pred = model.predict(X_val)

    print("\n====== Résultats validation ======")
    acc = accuracy_score(y_true, y_pred)
    print(f"Accuracy globale : {acc:.4f}\n")

    target_names = label_encoder_reason.classes_
    print("Classification report :\n")
    print(classification_report(y_true, y_pred, target_names=target_names))

    cm = confusion_matrix(y_true, y_pred)
    print("\nMatrice de confusion :")
    print(cm)


if __name__ == "__main__":
    main()
