import pandas as pd
from pathlib import Path

machines = pd.read_csv("data/machine_risk_summary.csv")

dependencies = []

for i, machine in enumerate(machines["machine_id"]):
    downstream = machines["machine_id"].iloc[(i + 1) % len(machines)]

    dependencies.append({
        "source_machine": machine,
        "target_machine": downstream,
        "dependency_type": "PRODUCTION_FLOW",
        "impact_weight": 0.75
    })

# Add several stronger cross-line dependencies.
extra = [
    ("M-101", "M-105", "CRITICAL_PROCESS", 0.95),
    ("M-105", "M-111", "CRITICAL_PROCESS", 0.90),
    ("M-111", "M-114", "QUALITY_DEPENDENCY", 0.85),
    ("M-108", "M-112", "ENERGY_DEPENDENCY", 0.70),
    ("M-102", "M-113", "PRODUCTION_FLOW", 0.80),
]

dependencies.extend([
    {
        "source_machine": source,
        "target_machine": target,
        "dependency_type": dependency_type,
        "impact_weight": weight
    }
    for source, target, dependency_type, weight in extra
])

graph = pd.DataFrame(dependencies).drop_duplicates(
    subset=["source_machine", "target_machine"]
)

Path("data").mkdir(exist_ok=True)
graph.to_csv("data/machine_dependencies.csv", index=False)

print("=== PredictiveAI Forge Industrial Risk Graph ===")
print(f"Machines: {len(machines)}")
print(f"Dependencies: {len(graph)}")
print()
print(graph.to_string(index=False))
print()
print("Saved to: data/machine_dependencies.csv")
