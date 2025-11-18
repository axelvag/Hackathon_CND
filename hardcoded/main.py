import pandas as pd
from route_log import route_log


def main():
    data = [
        {
            "timestamp": "2025-04-01T00:00:00Z",
            "firewall_id": "FW-B",
            "src_ip": "192.168.10.85",
            "dst_ip": "153.8.235.94",
            "src_port": 31108,
            "dst_port": 32151,
            "protocol": "TCP",
            "action": "ALLOW",
            "bytes": 39,
            "duration_ms": 114,
            "reason": "State mismatch",  # -> REASON_OK => pass
        },
        {
            "timestamp": "2025-04-01T00:00:01Z",
            "firewall_id": "FW-A",
            "src_ip": "BAD_IP",          # IP invalide -> bug invalid_ip
            "dst_ip": "10.0.0.1",
            "src_port": 1234,
            "dst_port": 80,
            "protocol": "UDP",
            "action": "ALLOW",
            "bytes": 100,
            "duration_ms": 42,
            "reason": "Invalid checksum",
        },
        {
            "timestamp": "2025-04-01T00:00:02Z",
            "firewall_id": "FW-B",
            "src_ip": "192.168.1.5",
            "dst_ip": "8.8.8.8",
            "src_port": 443,
            "dst_port": 54321,
            "protocol": "TCP",
            "action": "ALLOW",
            "bytes": 200,
            "duration_ms": 90,
            "reason": "XSS attempt",     # -> attaque hard-coded
        },
        {
            "timestamp": "2025-04-01T00:00:03Z",
            "firewall_id": "FW-B",
            "src_ip": "10.0.0.5",
            "dst_ip": "52.97.37.6",
            "src_port": 5555,
            "dst_port": 80,
            "protocol": "TCP",
            "action": "ALLOW",
            "bytes": 321,
            "duration_ms": 15,
            "reason": None,              # -> ira au modèle
        },
    ]

    df = pd.DataFrame(data)

    last_ts = None
    last_fw = None

    print("=== TEST PIPELINE ===\n")

    for i, row in df.iterrows():
        action, payload = route_log(row, last_ts=last_ts, last_fw=last_fw)

        print(f"Ligne {i} → Action = {action}")

        if action == "bug":
            print("  -> BUG DÉTECTÉ :", payload)
        elif action == "attack":
            print("  -> ATTAQUE :", payload)
        elif action == "pass":
            print("  -> PASS (log normal)")
        elif action == "model":
            print("  -> Envoi au MODÈLE plus tard (raison inconnue)")

        # Mise à jour last_ts / last_fw sauf si bug
        if action != "bug":
            last_ts = row.get("timestamp", last_ts)
            last_fw = row.get("firewall_id", last_fw)

        print()

    print("=== FIN DES TESTS ===")


if __name__ == "__main__":
    main()
