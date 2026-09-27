import pandas as pd
import numpy as np
from pathlib import Path

telemetry = pd.read_csv("data/industrial_telemetry.csv")
risk = pd.read_csv("data/machine_risk_summary.csv")

machine_stats = (
    telemetry
    .groupby("machine_id")
    .agg(
        avg_temperature_c=("temperature_c", "mean"),
        avg_vibration_mm_s=("vibration_mm_s", "mean"),
        avg_power_kw=("power_kw", "mean"),
        failure_events=("failure", "sum"),
        operating_hours=("operating_hours", "max")
    )
    .reset_index()
)

machine_stats = machine_stats.merge(
    risk[["machine_id", "failure_risk_pct"]],
    on="machine_id",
    how="left"
)

machine_stats["availability_pct"] = (
    100 - machine_stats["failure_events"] * 0.35
).clip(70, 100)

machine_stats["performance_pct"] = (
    100
    - (machine_stats["avg_vibration_mm_s"] * 2.0)
    - (machine_stats["failure_risk_pct"] * 0.05)
).clip(60, 100)

machine_stats["quality_pct"] = (
    100
    - (machine_stats["failure_events"] * 0.20)
).clip(85, 100)

machine_stats["oee_pct"] = (
    machine_stats["availability_pct"]
    * machine_stats["performance_pct"]
    * machine_stats["quality_pct"]
    / 10000
)

machine_stats["estimated_energy_waste_kwh"] = (
    machine_stats["avg_power_kw"]
    * machine_stats["failure_risk_pct"]
    / 100
    * 0.08
    * 24
)

machine_stats["estimated_material_waste_kg"] = (
    machine_stats["failure_risk_pct"]
    * 0.12
)

machine_stats["estimated_downtime_hours"] = (
    machine_stats["failure_risk_pct"]
    * 0.12
)

machine_stats["estimated_co2_kg"] = (
    machine_stats["estimated_energy_waste_kwh"]
    * 0.42
)

output = machine_stats[
    [
        "machine_id",
        "avg_temperature_c",
        "avg_vibration_mm_s",
        "avg_power_kw",
        "failure_events",
        "failure_risk_pct",
        "availability_pct",
        "performance_pct",
        "quality_pct",
        "oee_pct",
        "estimated_downtime_hours",
        "estimated_energy_waste_kwh",
        "estimated_material_waste_kg",
        "estimated_co2_kg"
    ]
]

Path("data").mkdir(exist_ok=True)
output.to_csv("data/oee_sustainability_intelligence.csv", index=False)

print("=== OEE + Sustainability Intelligence ===")
print(f"Machines analyzed: {len(output)}")
print()
print(
    output.sort_values(
        "oee_pct"
    ).head(10).to_string(index=False)
)
print()
print("Saved to: data/oee_sustainability_intelligence.csv")
