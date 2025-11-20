#!/usr/bin/env python3
import pandas as pd
import numpy as np
import ipaddress
import joblib
from tqdm.auto import tqdm
from sklearn.preprocessing import LabelEncoder

tqdm.pandas()

CAT_COLS = ["protocol", "action", "status", "flags"]
NUM_COLS = ["src_port", "dst_port", "bytes", "duration_ms"]


def ip_to_int(x):
    try:
        return int(ipaddress.ip_address(x))
    except Exception:
        return np.nan


def add_flag_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ajoute les mêmes features binaires que dans train_model.py
    à partir de la colonne 'flags'.

    Flags possibles :
      <NA>, RST, PSH, FIN, SYN, ACK, SCAN, SQLI, AUTH_FAIL, XSS, DDOS, MALWARE
    """
    print("Création des features dérivées des flags (predict)...")
    flags_str = df["flags"].astype(str)

    all_flags = [
        "RST",
        "PSH",
        "FIN",
        "SYN",
        "ACK",
        "SCAN",
        "SQLI",
        "AUTH_FAIL",
        "XSS",
        "DDOS",
        "MALWARE",
    ]

    for f in all_flags:
        col_name = f"flag_{f}"
        df[col_name] = (flags_str == f).astype(int)

    return df


def preprocess_predict(df: pd.DataFrame, encoders_cat: dict[str, LabelEncoder]):
    """
    Preprocess pour la prédiction :
      - IP -> int
      - rule_id -> int
      - colonnes numériques -> float
      - features binaires dérivées des flags
      - colonnes catégorielles -> transform avec les encoders entraînés

    Ne gère PAS 'reason' (colonne label).
    Retourne (df_complet_avec_features, X_features).
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

    # Features dérivées des flags AVANT encodage catégoriel
    df = add_flag_features(df)

    # Colonnes catégorielles : réutilisation des encoders
    for col in CAT_COLS:
        if col in encoders_cat:
            le = encoders_cat[col]
            print(f"Encodage catégoriel de {col} (predict)...")
            values = df[col].astype(str)
            mapping = {cls: idx for idx, cls in enumerate(le.classes_)}
            df[col] = values.map(mapping).astype(float)
        else:
            df[col] = np.nan

    flag_feature_cols = [
        "flag_RST",
        "flag_PSH",
        "flag_FIN",
        "flag_SYN",
        "flag_ACK",
        "flag_SCAN",
        "flag_SQLI",
        "flag_AUTH_FAIL",
        "flag_XSS",
        "flag_DDOS",
        "flag_MALWARE",
    ]

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
    ] + flag_feature_cols

    X = df[feature_cols]

    return df, X


def main():
    print("Chargement des logs sans reason (logs_no_reason.csv)...")
    df = pd.read_csv("logs_no_reason.csv")

    print("Chargement des encoders et du modèle...")
    encoders_cat = joblib.load("cat_encoders.pkl")
    label_encoder_reason = joblib.load("label_encoder_reason.pkl")
    model = joblib.load("model_reason.lgb")

    df_proc, X = preprocess_predict(df, encoders_cat)

    print("Prédiction des reasons...")
    # prédiction des classes encodées
    y_pred_int = model.predict(X)
    # proba associée à la classe choisie
    proba = model.predict_proba(X)
    max_proba = proba.max(axis=1)

    # conversion en labels texte
    y_pred_labels = label_encoder_reason.inverse_transform(y_pred_int)

    # ajout des colonnes au DataFrame original
    df_proc["reason_predicted"] = y_pred_labels
    df_proc["reason_predicted_proba"] = max_proba

    # Option : remplir la colonne 'reason' si elle existe et est vide
    if "reason" in df_proc.columns:
        mask_empty = df_proc["reason"].isna() | (df_proc["reason"].astype(str).str.strip() == "")
        df_proc.loc[mask_empty, "reason"] = df_proc.loc[mask_empty, "reason_predicted"]

    out_path = "logs_no_reason_with_preds.csv"
    df_proc.to_csv(out_path, index=False)
    print(f"✓ Fichier sauvegardé : {out_path}")


if __name__ == "__main__":
    main()
