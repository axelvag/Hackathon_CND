"""
Test script for the workflow with mock data

Run this script from the fastapi directory:
    python testing/test_workflow.py
    or
    python -m testing.test_workflow
"""

from graph.workflow import workflow
import json

# Sample firewall log lines for testing
sample_logs = [
    {
        "timestamp": "2025-01-15T10:30:45Z",
        "firewall_id": "FW-A",
        "src_ip": "192.168.1.100",
        "dst_ip": "10.0.0.50",
        "src_port": 54321,
        "dst_port": 80,
        "protocol": "TCP",
        "action": "ALLOW",
        "bytes": 1024,
        "duration_ms": 150,
        "reason": "Port scan detected",
        "status": "OK",
        "flags": "SYN",
    },
    {
        "timestamp": "2025-01-15T10:31:12Z",
        "firewall_id": "FW-B",
        "src_ip": "203.0.113.45",
        "dst_ip": "10.0.0.100",
        "src_port": 12345,
        "dst_port": 22,
        "protocol": "TCP",
        "action": "REJECT",
        "bytes": 256,
        "duration_ms": 50,
        "reason": "Multiple auth failures",
        "status": "TIMEOUT",
        "flags": "RST",
    },
    {
        "timestamp": "2025-01-15T10:32:00Z",
        "firewall_id": "FW-A",
        "src_ip": "198.51.100.10",
        "dst_ip": "10.0.0.200",
        "src_port": 443,
        "dst_port": 443,
        "protocol": "TCP",
        "action": "ALLOW",
        "bytes": -100,  # Invalid: negative bytes
        "duration_ms": 200,
        "reason": "Normal connection",
        "status": "OK",
        "flags": "ACK",
    },
    {
        "timestamp": "2025-01-15T10:33:15Z",
        "firewall_id": "FW-B",
        "src_ip": "192.0.2.50",
        "dst_ip": "10.0.0.150",
        "src_port": 8080,
        "dst_port": "invalid",  # Invalid: non-numeric port
        "protocol": "HTTP",
        "action": "ALLOW",
        "bytes": 2048,
        "duration_ms": 300,
        "reason": "Web request",
        "status": "OK",
        "flags": "FIN",
    },
    {
        "timestamp": "invalid_timestamp",  # Invalid timestamp
        "firewall_id": "FW-A",
        "src_ip": "10.0.0.1",
        "dst_ip": "10.0.0.2",
        "src_port": 22,
        "dst_port": 22,
        "protocol": "TCP",
        "action": "ALLOW",
        "bytes": 512,
        "duration_ms": 100,
        "reason": "SSH connection",
        "status": "OK",
        "flags": "SYN",
    },
    {
        "timestamp": "2025-01-15T10:35:00Z",
        "firewall_id": "FW-A",
        "src_ip": "203.0.113.100",
        "dst_ip": "10.0.0.50",
        "src_port": 80,
        "dst_port": 80,
        "protocol": "TCP",
        "action": "REJECT",
        "bytes": 5000,
        "duration_ms": 500,
        "reason": "Suspicious SQL payload",
        "status": "OK",
        "flags": "PSH",
    },
]


def test_workflow():
    """Test the workflow with sample data"""
    print("=" * 70)
    print("TESTING WORKFLOW WITH MOCK DATA")
    print("=" * 70)
    print()

    # Initialize workflow state
    initial_state = {
        "log_lines": sample_logs,
        "ml_outputs": [],
        "known_outputs": [],
        "unknown_outputs": [],
        "results": [],
    }

    print(f"Input: {len(sample_logs)} log lines")
    print()

    # Invoke workflow
    try:
        final_state = workflow.invoke(initial_state)

        # Display results
        results = final_state.get("results", [])
        print(f"Results: {len(results)} events analyzed")
        print()

        for i, result in enumerate(results, 1):
            print(f"{'=' * 70}")
            print(f"Event {i}:")
            print(f"{'=' * 70}")
            print(f"Precise Type: {result.precise_type}")
            print(f"Title: {result.title}")
            print(f"Known Type: {result.known_type}")
            print(f"Explanation: {result.explanation[:200]}...")
            print(f"Remediation Steps: {len(result.remediation)}")
            for j, step in enumerate(result.remediation, 1):
                print(f"  {j}. {step.title}")
            print()

        print("=" * 70)
        print("WORKFLOW TEST COMPLETED SUCCESSFULLY")
        print("=" * 70)

        # Return results as JSON for inspection
        return {
            "total_events": len(results),
            "known_events": sum(1 for r in results if r.known_type),
            "unknown_events": sum(1 for r in results if not r.known_type),
            "results": [
                {
                    "precise_type": r.precise_type,
                    "title": r.title,
                    "known_type": r.known_type,
                    "explanation": r.explanation[:200] + "...",
                    "remediation_count": len(r.remediation),
                }
                for r in results
            ],
        }

    except Exception as e:
        print(f"ERROR: Workflow execution failed: {e}")
        import traceback

        traceback.print_exc()
        return None


if __name__ == "__main__":
    result = test_workflow()
    if result:
        print("\nSummary:")
        print(json.dumps(result, indent=2))
