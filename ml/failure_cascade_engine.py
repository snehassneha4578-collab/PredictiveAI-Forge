import pandas as pd
from pathlib import Path

risk = pd.read_csv("data/machine_risk_summary.csv")
graph = pd.read_csv("data/machine_dependencies.csv")

risk_map = dict(
    zip(risk["machine_id"], risk["failure_risk_pct"] / 100)
)

rows = []

for _, edge in graph.iterrows():
    source = edge["source_machine"]
    target = edge["target_machine"]
    weight = edge["impact_weight"]

    source_risk = risk_map.get(source, 0)
    propagated_risk = min(source_risk * weight, 1.0)

    rows.append({
        "source_machine": source,
        "target_machine": target,
        "dependency_type": edge["dependency_type"],
        "source_risk": round(source_risk, 4),
        "impact_weight": weight,
        "propagated_risk": round(propagated_risk, 4),
        "cascade_risk_pct": round(propagated_risk * 100, 1)
    })

cascade = pd.DataFrame(rows)

cascade = cascade.sort_values(
    "cascade_risk_pct",
    ascending=False
)

Path("data").mkdir(exist_ok=True)
cascade.to_csv("data/failure_cascade_risk.csv", index=False)

print("=== Failure Cascade Intelligence ===")
print(f"Dependency paths analyzed: {len(cascade)}")
print()
print(cascade.head(10).to_string(index=False))
print()
print("Saved to: data/failure_cascade_risk.csv")
