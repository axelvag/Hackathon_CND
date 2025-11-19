import pandas as pd
from collections import Counter

from labelize_csv import load_partial_labels
from route_log import route_log


def norm_type(v):
    if pd.isna(v) or v in ("", None):
        return "None"
    s = str(v).strip().lower()
    if s in ("bug", "attack", "none"):
        return s.capitalize()
    return s.capitalize()


def norm_severity(v):
    if pd.isna(v) or v in ("", None):
        return None
    s = str(v).strip().lower()
    if s in ("low", "medium", "high"):
        return s.capitalize()
    return s


def print_confusion(counter: Counter, title: str):
    if not counter:
        print(f"\n[Confusion] {title} : aucun exemple")
        return

    # On récupère les labels vrais / prédits
    true_raw = {t for (t, p) in counter.keys()}
    pred_raw = {p for (t, p) in counter.keys()}

    # Tri robuste qui supporte None + str
    def sort_key(x):
        return (x is None, str(x))

    true_labels = sorted(true_raw, key=sort_key)
    pred_labels = sorted(pred_raw, key=sort_key)

    # Fonction d'affichage lisible pour None
    def fmt(x):
        return "None" if x is None else str(x)

    print(f"\n[Confusion] {title}")
    header = "true\\pred".ljust(12) + "".join(fmt(lbl).ljust(12) for lbl in pred_labels)
    print(header)
    print("-" * len(header))

    for t in true_labels:
        row = fmt(t).ljust(12)
        for p in pred_labels:
            c = counter.get((t, p), 0)
            row += str(c).ljust(12)
        print(row)


def print_report(prefix: str,
                 labels_processed: int,
                 total_with_log: int,
                 missing_logs: int,
                 total_type_compared: int,
                 correct_type: int,
                 total_sev_compared: int,
                 correct_sev: int,
                 type_conf_matrix: Counter,
                 sev_conf_matrix: Counter):
    print(f"\n=== {prefix} ===\n")
    print(f"Labels traités                : {labels_processed}")
    print(f"Lignes avec log trouvé        : {total_with_log}")
    print(f"Lignes sans log correspondant : {missing_logs}\n")

    if total_type_compared > 0:
        acc_type = correct_type / total_type_compared * 100
        print(f"Accuracy type_ref (Bug/Attack/None) : "
              f"{correct_type}/{total_type_compared} = {acc_type:.2f}%")
    else:
        print("Aucun type_ref exploitable.")

    if total_sev_compared > 0:
        acc_sev = correct_sev / total_sev_compared * 100
        print(f"Accuracy severity_ref (Low/Medium/High) : "
              f"{correct_sev}/{total_sev_compared} = {acc_sev:.2f}%")
    else:
        print("Aucune severity_ref exploitable.")

    # Matrices de confusion
    print_confusion(type_conf_matrix, "type_ref (Bug/Attack/None)")
    print_confusion(sev_conf_matrix, "severity_ref (Low/Medium/High)")
    print("\n" + "=" * 60 + "\n")


def main():
    logs_csv_path = "../datasets/firewall_logs_100mb_apr2025.csv"
    labels_xlsx_path = "../rapport_labeled_data.xlsx"

    PRINT_EVERY = 500  # print léger
    FULL_REPORT_AT = 1000  # rapport complet

    print("Chargement du dataset de logs…")
    logs_df = pd.read_csv(logs_csv_path)
    logs_df["timestamp"] = logs_df["timestamp"].astype(str)
    logs_indexed = logs_df.set_index("timestamp", drop=False)
    print(f"✓ Logs chargés : {len(logs_df)} lignes\n")

    print("Chargement des labels Excel…")
    labels_df = load_partial_labels(labels_xlsx_path)

    if isinstance(labels_df, list):
        labels = sorted(labels_df, key=lambda d: d["timestamp"])
    else:
        labels_df = labels_df.sort_values("timestamp")
        labels = labels_df.to_dict(orient="records")

    print(f"✓ Labels chargés : {len(labels)} entrées\n")

    print("Début de l'évaluation…\n")

    total_with_log = 0
    missing_logs = 0

    total_type_compared = 0
    correct_type = 0

    total_sev_compared = 0
    correct_sev = 0

    missed_rows = []

    # matrices de confusion (true, pred)
    type_conf_matrix = Counter()
    sev_conf_matrix = Counter()

    last_ts = None
    last_fw = None

    for idx, lab in enumerate(labels):
        ts = str(lab["timestamp"])
        type_ref = norm_type(lab.get("type_ref"))
        sev_ref = norm_severity(lab.get("severity_ref"))

        if ts not in logs_indexed.index:
            missing_logs += 1
            continue

        total_with_log += 1
        log_row = logs_indexed.loc[ts]

        if isinstance(log_row, pd.DataFrame):
            log_row = log_row.iloc[0]

        # print("\n=== LOG ROW ===")
        # print(log_row.to_dict())

        type_pred, sev_pred = route_log(
            log_row, last_ts=last_ts, last_fw=last_fw
        )

        if type_pred != "Bug":
            last_ts = log_row.get("timestamp", last_ts)
            last_fw = log_row.get("firewall_id", last_fw)

        type_pred_norm = norm_type(type_pred)
        sev_pred_norm = norm_severity(sev_pred)


                # 🔍 Sauvegarde des incidents "ratés" :
        # label = Bug/Attack, mais prédiction = None
        if type_ref != "None" and type_pred_norm == "None":
            row_dict = log_row.to_dict() if isinstance(log_row, pd.Series) else dict(log_row)
            row_dict.update({
                "type_ref": type_ref,
                "severity_ref": sev_ref,
                "type_pred": type_pred_norm,
                "severity_pred": sev_pred_norm,
            })
            missed_rows.append(row_dict)


        # Comparaison type
        if type_ref is not None:
            total_type_compared += 1
            type_conf_matrix[(type_ref, type_pred_norm)] += 1
            if type_pred_norm == type_ref:
                correct_type += 1

        # Comparaison severity
        if type_ref != "None" and sev_ref is not None:
            total_sev_compared += 1
            sev_conf_matrix[(sev_ref, sev_pred_norm)] += 1
            if sev_pred_norm == sev_ref:
                correct_sev += 1

        # petit suivi régulier
        if idx % PRINT_EVERY == 0 and idx > 0:
            print(f"[{idx}/{len(labels)}] "
                  f"logs trouvés={total_with_log}, manquants={missing_logs}")

        # RAPPORT COMPLET après 1000 labels
        if idx + 1 == FULL_REPORT_AT:
            print_report(
                prefix=f"RAPPORT INTERMÉDIAIRE après {FULL_REPORT_AT} labels",
                labels_processed=idx + 1,
                total_with_log=total_with_log,
                missing_logs=missing_logs,
                total_type_compared=total_type_compared,
                correct_type=correct_type,
                total_sev_compared=total_sev_compared,
                correct_sev=correct_sev,
                type_conf_matrix=type_conf_matrix,
                sev_conf_matrix=sev_conf_matrix,
            )

    # Rapport final
    print_report(
        prefix="RAPPORT FINAL",
        labels_processed=len(labels),
        total_with_log=total_with_log,
        missing_logs=missing_logs,
        total_type_compared=total_type_compared,
        correct_type=correct_type,
        total_sev_compared=total_sev_compared,
        correct_sev=correct_sev,
        type_conf_matrix=type_conf_matrix,
        sev_conf_matrix=sev_conf_matrix,
    )

    # 💾 Sauvegarde des incidents ratés dans un CSV
    if missed_rows:
        missed_df = pd.DataFrame(missed_rows)
        missed_df.to_csv("missed_incidents.csv", index=False)
        print(f"\n[INFO] {len(missed_rows)} incidents ratés enregistrés dans missed_incidents.csv")
    else:
        print("\n[INFO] Aucun incident raté (type_ref != None & type_pred == None).")



if __name__ == "__main__":
    main()
