import pandas as pd
import ipaddress
from datetime import datetime

ESSENTIAL_FIELDS = [
    "timestamp",
    "firewall_id",
    "src_ip",
    "dst_ip",
    "protocol",
    "action",
    "bytes",
    "duration_ms",
]

def is_valid_ip(ip: str) -> bool:
    try:
        ipaddress.ip_address(ip)
        return True
    except Exception:
        return False

def is_valid_timestamp(ts: str) -> bool:
    try:
        datetime.strptime(ts, "%Y-%m-%dT%H:%M:%SZ")
        return True
    except Exception:
        return False

def is_valid_port(val) -> bool:
    """Retourne True si le port est un entier entre 0 et 65535."""
    if pd.isna(val):
        return False
    if isinstance(val, str) and val in ("", "N/A"):
        return False
    try:
        port = int(val)
        return 0 <= port <= 65535
    except Exception:
        return False

def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    clean_rows = []

    for idx, row in df.iterrows():
        # 1) lignes totalement corrompues (CORRUPTED_LINE_...)
        first_col = str(row.iloc[0])
        if first_col.startswith("CORRUPTED_LINE"):
            continue

        # 2) champs essentiels présents
        if any(pd.isna(row.get(f)) or row.get(f) == "" for f in ESSENTIAL_FIELDS):
            continue

        # 3) timestamp valide
        if not is_valid_timestamp(row["timestamp"]):
            continue

        # 4) IP valides
        if not (is_valid_ip(row["src_ip"]) and is_valid_ip(row["dst_ip"])):
            continue

        # 5) ports valides
        if not (is_valid_port(row["src_port"]) and is_valid_port(row["dst_port"])):
            continue

        # 6) bytes valides (entier >= 0)
        try:
            b = int(row["bytes"])
            if b < 0:
                continue
        except Exception:
            continue

        # Si tout est bon → on garde la ligne
        clean_rows.append(row)

    clean_df = pd.DataFrame(clean_rows).reset_index(drop=True)
    return clean_df


# if __name__ == "__main__":
#     df = pd.read_csv("firewall_logs_100mb_apr2025.csv")
#     clean_df = clean_dataset(df)

#     print(f"Lignes avant clean : {len(df)}")
#     print(f"Lignes après clean : {len(clean_df)}")

#     clean_df.to_csv("firewall_logs_100mb_apr2025_clean.csv", index=False)
#     print("Dataset nettoyé écrit dans firewall_logs_100mb_apr2025_clean.csv")
