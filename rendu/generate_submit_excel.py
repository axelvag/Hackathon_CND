import pandas as pd

from route_log import route_log
from detect_bugs import is_valid_timestamp


def process_csv(csv_path: str, excel_out: str):
    df = pd.read_csv(csv_path)

    rows_out = []
    last_ts = None
    last_fw = None

    for _, row in df.iterrows():
        row_dict = row.to_dict()

        type_pred, sev_pred, payload = route_log(row_dict, last_ts, last_fw)

        # Ligne clean -> rien dans le fichier de rendu,
        # mais on met à jour le last_ts si le timestamp est valide
        if type_pred == "None":
            raw_ts = row_dict.get("timestamp")
            if isinstance(raw_ts, str) and is_valid_timestamp(raw_ts):
                last_ts = raw_ts
                last_fw = row_dict.get("firewall_id")
            continue

        # Bug ou Attack : on prend le timestamp calculé par detect_bug/detect_attack
        out_ts = None
        if payload is not None:
            out_ts = payload.get("timestamp")

        rows_out.append(
            {
                "timestamp": out_ts,
                "severity": sev_pred,
                "type": type_pred,
            }
        )

        # Met à jour le fallback uniquement si le timestamp est propre
        if isinstance(out_ts, str) and is_valid_timestamp(out_ts):
            last_ts = out_ts
            last_fw = payload.get("firewall_id") or row_dict.get("firewall_id")

    out_df = pd.DataFrame(rows_out, columns=["timestamp", "severity", "type"])
    out_df.to_excel(excel_out, index=False)

    print(f"✔️ Fichier généré")


if __name__ == "__main__":
    process_csv("../datasets/firewall_logs_100mb_apr2025.csv", "april_submission.xlsx")
