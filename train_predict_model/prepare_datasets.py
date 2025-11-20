#!/usr/bin/env python3
import argparse
import os
from pathlib import Path

import pandas as pd


def parse_args():
    parser = argparse.ArgumentParser(
        description="Combine plusieurs CSV de logs, retire CORRUPTED_LINE, sépare ceux sans 'reason' et split le reste."
    )
    parser.add_argument("inputs", nargs="+", help="Chemins vers les CSV")
    parser.add_argument("-o", "--output-dir", default="out_split", help="Dossier de sortie")
    parser.add_argument("--reason-col", default="reason", help="Nom de la colonne reason")
    parser.add_argument("--train-ratio", type=float, default=0.8, help="Ratio train (default 0.8)")
    parser.add_argument("--seed", type=int, default=42, help="Seed shuffle")
    return parser.parse_args()


def load_and_concat(csv_paths):
    dfs = []
    for path in csv_paths:
        print(f"Chargement de {path}...")
        df = pd.read_csv(path)
        dfs.append(df)

    combined = pd.concat(dfs, ignore_index=True)
    print(f"Total lignes combinées: {len(combined)}")
    return combined


def remove_corrupted(df):
    # On regarde la première colonne
    first_col = df.columns[0]

    mask = df[first_col].astype(str).str.startswith("CORRUPTED_LINE")
    n_removed = mask.sum()

    if n_removed > 0:
        print(f"Suppression de {n_removed} lignes CORRUPTED_LINE")

    return df[~mask].copy()


def split_on_reason(df, reason_col, train_ratio, seed):
    if reason_col not in df.columns:
        raise ValueError(f"Colonne {reason_col} manquante")

    mask_no_reason = df[reason_col].isna() | (df[reason_col].astype(str).str.strip() == "")

    df_no_reason = df[mask_no_reason].copy()
    df_with_reason = df[~mask_no_reason].copy()

    print(f"Lignes sans reason: {len(df_no_reason)}")
    print(f"Lignes avec reason: {len(df_with_reason)}")

    df_with_reason = df_with_reason.sample(frac=1.0, random_state=seed).reset_index(drop=True)

    n_train = int(len(df_with_reason) * train_ratio)

    df_train = df_with_reason.iloc[:n_train].copy()
    df_val = df_with_reason.iloc[n_train:].copy()

    print(f"Train: {len(df_train)}")
    print(f"Validation: {len(df_val)}")

    return df_no_reason, df_train, df_val


def main():
    args = parse_args()
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df_all = load_and_concat(args.inputs)
    df_clean = remove_corrupted(df_all)

    df_no_reason, df_train, df_val = split_on_reason(
        df_clean, args.reason_col, args.train_ratio, args.seed
    )

    (out_dir / "logs_no_reason.csv").write_text(df_no_reason.to_csv(index=False))
    (out_dir / "logs_train.csv").write_text(df_train.to_csv(index=False))
    (out_dir / "logs_val.csv").write_text(df_val.to_csv(index=False))

    print("\nFichiers générés :")
    print(f"- logs_no_reason.csv ({len(df_no_reason)} lignes)")
    print(f"- logs_train.csv ({len(df_train)} lignes)")
    print(f"- logs_val.csv   ({len(df_val)} lignes)")


if __name__ == "__main__":
    main()
