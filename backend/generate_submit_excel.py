"""
Generate Excel submission file from CSV firewall logs
"""

import argparse
import pandas as pd
from dataset_labeling.classify_log import classify_log
from dataset_labeling.utils import is_valid_timestamp


def process_csv(csv_path: str, excel_out: str) -> None:
    """
    Process CSV file and generate Excel submission file.

    Args:
        csv_path: Path to input CSV file
        excel_out: Path to output Excel file
    """
    df = pd.read_csv(csv_path)

    rows_out = []
    last_ts = None
    last_fw = None

    for _, row in df.iterrows():
        row_dict = row.to_dict()

        event = classify_log(row_dict, last_ts, last_fw)

        if event is None:
            raw_ts = row_dict.get("timestamp")
            if isinstance(raw_ts, str) and is_valid_timestamp(raw_ts):
                last_ts = raw_ts
                last_fw = row_dict.get("firewall_id")
            continue

        out_ts = event.get("timestamp")

        rows_out.append(
            {
                "timestamp": out_ts,
                "severity": event.get("severity"),
                "type": event.get("type"),
            }
        )

        if isinstance(out_ts, str) and is_valid_timestamp(out_ts):
            last_ts = out_ts
            last_fw = event.get("firewall_id") or row_dict.get("firewall_id")

    out_df = pd.DataFrame(rows_out, columns=["timestamp", "severity", "type"])
    out_df.to_excel(excel_out, index=False)

    print(f"✔️ Fichier généré: {excel_out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate Excel submission file from CSV firewall logs"
    )
    parser.add_argument(
        "--csv",
        type=str,
        default="../datasets/firewall_logs_100mb_apr2025.csv",
        help="Path to input CSV file",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="april_submission.xlsx",
        help="Path to output Excel file",
    )

    args = parser.parse_args()
    process_csv(args.csv, args.output)
