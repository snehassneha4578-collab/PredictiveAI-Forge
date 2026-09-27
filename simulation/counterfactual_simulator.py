import pandas as pd
from pathlib import Path

risk = pd.read_csv("data/machine_risk_summary.csv")
cascade = pd.read_csv("data/failure_cascade_risk.csv")

results = []

for _, machine in risk.iterrows():
    machine_id = machine["machine_id"]
    base_risk = machine["failure_risk_pct"]

    downstream = cascade[
        cascade["source_machine"] == machine_id
    ]

    cascade_exposure = downstream["cascade_risk_pct"].sum()

    scenarios = [
        ("No Intervention", 1.00, 1.00),
        ("Preventive Maintenance", 0.35, 0.55),
        ("Optimized Intervention", 0.18, 0.35)
    ]

    for scenario, risk_factor, cascade_factor in scenarios:
        projected_risk = min(base_risk * risk_factor, 100)
        projected_cascade = min(cascade_exposure * cascade_factor, 100)

        estimated_downtime = (
            projected_risk * 0.12
            + projected_cascade * 0.05
        )

        estimated_oee = max(
            60,
            92 - estimated_downtime * 0.8
        )

        results.append({
            "machine_id": machine_id,
            "scenario": scenario,
            "current_risk_pct": round(base_risk, 1),
            "projected_risk_pct": round(projected_risk, 1),
            "cascade_exposure_pct": round(projected_cascade, 1),
            "estimated_downtime_hours": round(estimated_downtime, 2),
            "estimated_oee_pct": round(estimated_oee, 2)
        })

simulation = pd.DataFrame(results)

Path("data").mkdir(exist_ok=True)
simulation.to_csv(
    "data/counterfactual_simulations.csv",
    index=False
)

print("=== Counterfactual Future Simulator ===")
print(f"Machines simulated: {risk['machine_id'].nunique()}")
print(f"Scenarios per machine: 3")
print()
print(
    simulation[
        simulation["machine_id"] == "M-101"
    ].to_string(index=False)
)
print()
print("Saved to: data/counterfactual_simulations.csv")
