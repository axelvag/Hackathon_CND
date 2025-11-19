import pandas as pd
import openpyxl


def load_partial_labels(
    excel_path: str,
    sheet_name: str = "Partiels",
) -> pd.DataFrame:
    """
    Lit l'onglet 'Partiels' de l'Excel de labels et retourne
    un DataFrame avec les colonnes :
        - 'timestamp'
        - 'severity_ref'
        - 'type_ref'

    Le timestamp est normalisé au format : YYYY-MM-DDTHH:MM:SSZ
    pour matcher le CSV des logs.
    """

    df = pd.read_excel(excel_path, sheet_name=sheet_name)

    expected_cols = ["timestamp", "severity_ref", "type_ref"]
    missing = [c for c in expected_cols if c not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes dans la feuille '{sheet_name}': {missing}")

    # On ne garde que les colonnes utiles
    df = df[expected_cols]

    # On enlève les lignes sans timestamp
    df = df.dropna(subset=["timestamp"])

    # 1) Convertir en datetime si possible
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")

    # On vire ce qui n'a pas pu être converti
    df = df.dropna(subset=["timestamp"])

    # 2) Normaliser au format du CSV : "2025-04-01T00:00:00Z"
    df["timestamp"] = df["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    return df


def build_labeled_csv(
    excel_path: str,
    logs_csv_path: str,
    output_csv_path: str,
    sheet_name: str = "Partiels",
):
    """
    Crée un nouveau CSV contenant uniquement les lignes du dataset de logs
    pour lesquelles on a des labels dans l'Excel.

    Le CSV de sortie contient :
      - toutes les colonnes du CSV de logs
      - + 'severity_ref' et 'type_ref' provenant de l'Excel.
    """
    # 1) Charger les labels depuis l'Excel
    labels_df = load_partial_labels(excel_path, sheet_name=sheet_name)

    print(f"[INFO] Labels chargés depuis {excel_path}")
    print(f"       Lignes dans l'onglet '{sheet_name}': {len(labels_df)}")

    # 2) Charger le CSV de logs
    logs_df = pd.read_csv(logs_csv_path)
    print(f"[INFO] Logs chargés depuis {logs_csv_path}")
    print(f"       Lignes dans le CSV de logs : {len(logs_df)}")

    if "timestamp" not in logs_df.columns:
        raise ValueError("La colonne 'timestamp' est absente du CSV de logs.")

    # 3) Normaliser le timestamp des logs au même format
    logs_df["timestamp"] = pd.to_datetime(logs_df["timestamp"], errors="coerce")
    logs_df = logs_df.dropna(subset=["timestamp"])
    logs_df["timestamp"] = logs_df["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    # 4) Merge sur la colonne timestamp
    #    - inner => on garde uniquement les lignes où on a un label
    merged_df = pd.merge(
        logs_df,
        labels_df,
        on="timestamp",
        how="inner",
        # si tu es sûr qu'il n'y a qu'une ligne par timestamp dans les deux,
        # tu peux mettre validate="1:1" pour vérifier. Sinon "m:m" par défaut.
        # validate="m:m",
    )

    print(f"[INFO] Lignes labellisées obtenues après merge : {len(merged_df)}")

    # 5) Sauvegarde
    merged_df.to_csv(output_csv_path, index=False)
    print(f"[OK] CSV labellisé écrit dans : {output_csv_path}")

    # Optionnel : un petit récap pratique
    nb_labels_excel = len(labels_df)
    nb_lignes_logs = len(logs_df)
    nb_labellisees = len(merged_df)

    print("\nRésumé :")
    print(f"  - Lignes dans l'Excel de labels : {nb_labels_excel}")
    print(f"  - Lignes dans le CSV de logs     : {nb_lignes_logs}")
    print(f"  - Lignes labellisées (intersection) : {nb_labellisees}")
    if nb_labels_excel > 0:
        print(f"  - % de labels Excel trouvés dans les logs : "
              f"{nb_labellisees / nb_labels_excel * 100:5.1f}%")


if __name__ == "__main__":
    build_labeled_csv(
        excel_path="rapport_labeled_data.xlsx",
        logs_csv_path="datasets/firewall_logs_100mb_apr2025.csv",
        output_csv_path="firewall_logs_labellises_apr.csv",
        sheet_name="Partiels",
    )
