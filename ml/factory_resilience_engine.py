import pandas as pd
from pathlib import Path

risk = pd.read_csv("data/machine_risk_summary.csv")
cascade = pd.read_csv("data/failure_cascade_risk.csv")
oee = pd.read_csv("data/oee_sustainability_intelligence.csv")

machine_risk = risk["failure_risk_pct"].mean()

high_risk_ratio = (
    (risk["risk_level"].isin(["HIGH", "CRITICAL"])).mean() * 100
)

cascade_exposure = cascade["cascade_risk_pct"].mean()

average_oee = oee["oee_pct"].mean()

downtime_exposure = oee["estimated_downtime_hours"].sum()

energy_waste = oee["estimated_energy_waste_kwh"].sum()

data_quality_score = 100.0

risk_score = max(
    0,
    100
    - (machine_risk * 0.35)
    - (high_risk_ratio * 0.20)
    - (cascade_exposure * 0.20)
    - ((100 - average_oee) * 0.15)
    - (downtime_exposure * 0.05)
)

resilience_score = min(100, round(risk_score, 1))

if resilience_score >= 80:
    status = "RESILIENT"
elif resilience_score >= 60:
    status = "WATCH"
elif resilience_score >= 40:
    status = "VULNERABLE"
else:
    status = "CRITICAL"

result = pd.DataFrame([{
    "factory_resilience_score": resilience_score,
    "status": status,
    "average_machine_risk_pct": round(machine_risk, 2),
    "high_risk_machine_ratio_pct": round(high_risk_ratio, 2),
    "average_cascade_exposure_pct": round(cascade_exposure, 2),
    "average_oee_pct": round(average_oee, 2),
    "estimated_downtime_exposure_hours": round(downtime_exposure, 2),
    "estimated_energy_waste_kwh": round(energy_waste, 2),
    "data_quality_score": data_quality_score
}])

Path("data").mkdir(exist_ok=True)
result.to_csv("data/factory_resilience_score.csv", index=False)

print("=== Factory Resilience Intelligence ===")
print()
print(result.to_string(index=False))
print()
print("Saved to: data/factory_resilience_score.csv")
