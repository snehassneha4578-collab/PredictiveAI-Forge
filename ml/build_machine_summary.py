import pandas as pd
from pathlib import Path

df = pd.read_csv("data/predicted_risk.csv")

latest = (
    df.sort_values("hour")
    .groupby("machine_id")
    .tail(1)
    .copy()
)

latest["failure_risk_pct"] = (latest["failure_risk"] * 100).round(1)

summary = latest[
    [
        "machine_id",
        "machine_type",
        "temperature_c",
        "vibration_mm_s",
        "power_kw",
        "pressure_bar",
        "failure_risk_pct",
        "risk_level"
    ]
].sort_values("failure_risk_pct", ascending=False)

Path("data").mkdir(exist_ok=True)
summary.to_csv("data/machine_risk_summary.csv", index=False)

print("=== Machine Risk Summary ===")
print(f"Machines: {len(summary)}")
print()
print(summary.to_string(index=False))
print()
print("Saved to: data/machine_risk_summary.csv")
