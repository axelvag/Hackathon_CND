#!/usr/bin/env python3
import pandas as pd
import math
from pathlib import Path
import argparse


def entropy(counts):
    total = sum(counts)
    if total == 0:
        return 0.0
    ent = 0.0
    for c in counts:
        if c > 0:
            p = c / total
            ent -= p * math.log2(p)
    return ent


def purity(counts):
    total = sum(counts)
    if total == 0:
        return 0.0
    return max(counts) / total


def analyze_reason_to_label(df, label_col, lines, max_rows=20):
    """
    Analyse reason → label_col (severity_ref ou type_ref)
    """
    reason_col = "reason"
    if reason_col not in df.columns or label_col not in df.columns:
        lines.append(f"\nImpossible d'analyser reason ↔ {label_col}, colonnes manquantes.")
        return

    sub = df[[reason_col, label_col]].dropna()
    total_pairs = len(sub)

    if total_pairs == 0:
        lines.append(f"\nAucune donnée reason ↔ {label_col}.")
        return

    lines.append(f"\n========== Analyse reason → {label_col} ==========")
    lines.append(f"Lignes valides : {total_pairs}")

    # Distribution globale
    lines.append("\nTop couples reason / label :")
    couples = (
        sub.groupby([reason_col, label_col])
        .size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
    )

    for i, row in couples.head(max_rows).iterrows():
        reason = str(row[reason_col])
        lbl = str(row[label_col])
        count = row["count"]
        pct = (count / total_pairs) * 100
        lines.append(f"  - {reason:25s} → {lbl:20s} : {count:6d} ({pct:5.1f}%)")

    if len(couples) > max_rows:
        lines.append("  [...]")

    # Analyse par reason
    lines.append("\n--- Analyse détaillée par reason ---")
    group = (
        sub.groupby(reason_col)[label_col]
        .value_counts()
        .rename("count")
        .reset_index()
    )

    purities = []
    entropies = []
    label_counts_per_reason = []

    for r, g in group.groupby(reason_col):
        total = g["count"].sum()
        n_labels = g[label_col].nunique()
        label_counts = list(g["count"])

        pur = purity(label_counts)
        ent = entropy(label_counts)

        purities.append(pur)
        entropies.append(ent)
        label_counts_per_reason.append(n_labels)

        lines.append(f"\nReason = {r!r}")
        lines.append(f"  - Nombre de labels distincts ({label_col}) : {n_labels}")
        lines.append(f"  - Pureté : {pur*100:4.1f}%")
        lines.append(f"  - Entropie : {ent:4.3f}")

        # Distribution détaillée
        lines.append("  - Distribution :")
        g2 = g.sort_values("count", ascending=False)
        for i, row in g2.head(15).iterrows():
            lbl = str(row[label_col])
            c = row["count"]
            pct = (c / total) * 100
            lines.append(f"      · {lbl:20s} : {c:6d} ({pct:5.1f}%)")

        if len(g2) > 15:
            lines.append("      [...]")

    # Stats globales
    lines.append("\n--- Metrics globales reason → label ---")
    if purities:
        lines.append(f"Pureté moyenne : {sum(purities)/len(purities)*100:5.1f}%")
        lines.append(f"Entropie moyenne : {sum(entropies)/len(entropies):5.3f}")
        lines.append(f"Nombre moyen de labels par reason : {sum(label_counts_per_reason)/len(label_counts_per_reason):4.2f}")


def analyze_csv(csv_path: str, output_path: str):
    df = pd.read_csv(csv_path)

    lines = []
    lines.append(f"Analyse reason ↔ labels pour : {csv_path}")
    lines.append(f"Total lignes : {len(df)}")

    if "reason" not in df.columns:
        lines.append("\nLa colonne reason est absente, analyse impossible.")
    else:
        # Analyse reason → severity
        if "severity_ref" in df.columns:
            analyze_reason_to_label(df, "severity_ref", lines)
        else:
            lines.append("\nPas de colonne severity_ref")

        # Analyse reason → type
        if "type_ref" in df.columns:
            analyze_reason_to_label(df, "type_ref", lines)
        else:
            lines.append("\nPas de colonne type_ref")

        # Corrélation severity ↔ type (si dispo)
        if "severity_ref" in df.columns and "type_ref" in df.columns:
            lines.append("\n========== Corrélation severity_ref ↔ type_ref ==========")
            sub = df[["severity_ref", "type_ref"]].dropna()
            total = len(sub)

            couples = (
                sub.groupby(["severity_ref", "type_ref"])
                .size()
                .reset_index(name="count")
                .sort_values("count", ascending=False)
            )

            for i, row in couples.head(20).iterrows():
                sev = str(row["severity_ref"])
                typ = str(row["type_ref"])
                c = row["count"]
                pct = (c / total) * 100
                lines.append(f"  - {sev:15s} ↔ {typ:20s} : {c:6d} ({pct:5.1f}%)")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"[OK] Rapport écrit → {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Analyse corrélations reason ↔ labels")
    parser.add_argument("--csv_path", default="firewall_logs_labellises_apr.csv", help="CSV labellisé")
    parser.add_argument("--output", default="reason_label_correlations.txt")

    args = parser.parse_args()

    analyze_csv(args.csv_path, args.output)


if __name__ == "__main__":
    main()
