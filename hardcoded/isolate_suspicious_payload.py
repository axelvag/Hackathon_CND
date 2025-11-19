#!/usr/bin/env python3
import pandas as pd
import argparse
from pathlib import Path


def extract_reason(csv_path: str, reason_value: str, output_csv: str):
    """
    Extrait uniquement les lignes dont la colonne 'reason' correspond
    à reason_value et les écrit dans un nouveau CSV.
    """

    df = pd.read_csv(csv_path)

    if "reason" not in df.columns:
        raise ValueError("La colonne 'reason' est absente du CSV fourni.")

    # Filtrage
    filtered = df[df["reason"] == reason_value]

    print(f"[INFO] CSV chargé : {csv_path}")
    print(f"       Lignes totales : {len(df)}")
    print(f"       Lignes correspondant à reason = {reason_value!r} : {len(filtered)}")

    # Sauvegarde
    output_path = Path(output_csv)
    filtered.to_csv(output_path, index=False)

    print(f"[OK] Nouveau CSV écrit : {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Extraire une reason spécifique d’un CSV labellisé.")
    parser.add_argument("--csv_path", default="firewall_logs_labellises_apr.csv", help="Chemin du CSV labellisé")
    parser.add_argument("--reason", default="Suspicious payload", help="Reason à extraire")
    parser.add_argument("--output", default="reason_suspicious_payload.csv", help="Chemin du CSV filtré")

    args = parser.parse_args()

    extract_reason(args.csv_path, args.reason, args.output)


if __name__ == "__main__":
    main()
