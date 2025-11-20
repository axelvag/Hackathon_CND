#!/usr/bin/env python3
import pandas as pd
import numpy as np
import ipaddress
import joblib
from lightgbm import LGBMClassifier
from sklearn.preprocessing import LabelEncoder
from tqdm.auto import tqdm

tqdm.pandas()

CAT_COLS = ["protocol", "action", "status", "flags"]
NUM_COLS = ["src_port", "dst_port", "bytes", "duration_ms"]

# Reasons "attaque / sécu" qu'on conserve telles quelles
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
    Regroupe les reasons génériques sous un label 'Other technical',
    en gardant :
      - toutes les reasons d'attaque telles quelles
      - (et maintenant 'Suspicious payload' est aussi regroupé)
    """
    r = str(r)
    if r in ATTACK_REASONS:
        return r
    # Tout le reste, y compris 'Suspicious payload' -> Other technical
    return "Other technical"


def ip_to_int(x):
    """Convertit une IP en entier, ou NaN si invalide."""
    try:
        return int(ipaddress.ip_address(x))
    except Exception:
        return np.nan


def preprocess_train(df: pd.DataFrame):
    """
    Preprocess pour l'entraînement :
      - IP -> int
      - rule_id -> int (sans le 'R')
      - colonnes numériques -> float
      - colonnes catégorielles -> LabelEncoder par colonne
      - reason -> normalisée puis encodée
    Retourne X, y, encoders_cat, encoder_reason
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

    # Encodage des colonnes catégorielles
    encoders_cat: dict[str, LabelEncoder] = {}
    for col in CAT_COLS:
        if col in df.columns:
            print(f"Encodage catégoriel de {col} ...")
            le = LabelEncoder()
            values = df[col].astype(str)
            df[col] = le.fit_transform(values)
            encoders_cat[col] = le
        else:
            df[col] = np.nan

    # Normalisation des labels reason
    print("Normalisation des labels 'reason' (regroupement des génériques)...")
    df["reason"] = df["reason"].apply(normalize_reason)

    # Encodage du label reason
    print("Encodage du label 'reason'...")
    le_reason = LabelEncoder()
    df["reason"] = le_reason.fit_transform(df["reason"])

    # Features finales
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

    X = df[feature_cols]
    y = df["reason"]

    return X, y, encoders_cat, le_reason


def main():
    print("Chargement des données d'entraînement (logs_train.csv)...")
    df = pd.read_csv("logs_train.csv")

    X, y, encoders_cat, le_reason = preprocess_train(df)

    # Sauvegarde des encoders
    joblib.dump(encoders_cat, "cat_encoders.pkl")
    joblib.dump(le_reason, "label_encoder_reason.pkl")
    print("✓ Encoders sauvegardés (cat_encoders.pkl, label_encoder_reason.pkl)")

    print("Entraînement du modèle LightGBM...")
    n_estimators = 800
    model = LGBMClassifier(
        n_estimators=n_estimators,
        learning_rate=0.05,
        num_leaves=60,
        max_depth=-1,
        objective="multiclass",
        num_class=len(le_reason.classes_),
        random_state=42,
        # pas de class_weight, c'est ce qui marchait bien chez toi
    )

    pbar = tqdm(total=n_estimators, desc="Boosting iterations")

    def tqdm_callback(env):
        pbar.update(1)

    model.fit(X, y, callbacks=[tqdm_callback])
    pbar.close()

    print("✓ Modèle entraîné !")

    joblib.dump(model, "model_reason.lgb")
    print("✓ Modèle sauvegardé dans model_reason.lgb")


if __name__ == "__main__":
    main()
