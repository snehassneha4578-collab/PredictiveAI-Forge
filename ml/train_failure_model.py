import pandas as pd
import numpy as np
from pathlib import Path
import joblib

df = pd.read_csv("data/industrial_telemetry.csv")

features = [
    "temperature_c",
    "vibration_mm_s",
    "power_kw",
    "pressure_bar",
    "operating_hours"
]

X = df[features].astype(float)

medians = X.median()
q10 = X.quantile(0.10)
q90 = X.quantile(0.90)

scale = (q90 - q10).replace(0, 1)

scores = ((X - medians).abs() / scale).clip(0, 5)

weights = np.array([0.30, 0.30, 0.20, 0.10, 0.10])

raw_score = (scores * weights).sum(axis=1)

risk_probability = 1 / (1 + np.exp(-(raw_score - 1.0) * 2.5))

df["failure_risk"] = risk_probability

df["risk_level"] = pd.cut(
    df["failure_risk"],
    bins=[-0.01, 0.20, 0.45, 0.70, 1.01],
    labels=["LOW", "MEDIUM", "HIGH", "CRITICAL"]
)

output = Path("ml/models")
output.mkdir(parents=True, exist_ok=True)

model_data = {
    "features": features,
    "medians": medians.to_dict(),
    "scale": scale.to_dict(),
    "weights": weights.tolist()
}

joblib.dump(model_data, output / "failure_risk_model.joblib")

result = df[
    [
        "machine_id",
        "machine_type",
        "hour",
        "temperature_c",
        "vibration_mm_s",
        "power_kw",
        "pressure_bar",
        "failure",
        "failure_risk",
        "risk_level"
    ]
]

result.to_csv("data/predicted_risk.csv", index=False)

print("=== PredictiveAI Forge Risk Engine v0.2 ===")
print(f"Records analyzed: {len(df):,}")
print(f"Actual failures: {df['failure'].sum():,}")
print()
print("Risk distribution:")
print(result["risk_level"].value_counts().sort_index())
print()
print("Highest-risk observations:")
print(
    result.sort_values("failure_risk", ascending=False)
    .head(10)
    .to_string(index=False)
)
print()
print("Model saved to: ml/models/failure_risk_model.joblib")
print("Predictions saved to: data/predicted_risk.csv")
