import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)

machines = [f"M-{100+i}" for i in range(1, 21)]
rows = []

for machine_id in machines:
    machine_type = np.random.choice(["Motor", "Pump", "Compressor", "CNC", "Turbine"])
    base_temp = np.random.uniform(55, 75)
    base_vibration = np.random.uniform(1.5, 3.5)
    base_power = np.random.uniform(35, 70)

    for hour in range(720):
        degradation = max(0, (hour - np.random.randint(500, 680)) / 120)

        temperature = base_temp + np.random.normal(0, 2) + degradation * np.random.uniform(8, 18)
        vibration = base_vibration + np.random.normal(0, 0.15) + degradation * np.random.uniform(0.8, 2.5)
        power = base_power + np.random.normal(0, 2) + degradation * np.random.uniform(4, 12)
        pressure = np.random.uniform(35, 65) + degradation * np.random.uniform(-3, 3)
        operating_hours = hour + np.random.randint(1000, 5000)

        risk_signal = (
            (temperature > 85)
            + (vibration > 4.5)
            + (power > base_power + 12)
        )

        failure = int(
            risk_signal >= 2
            and degradation > 0.35
            and np.random.random() < 0.35
        )

        rows.append({
            "machine_id": machine_id,
            "machine_type": machine_type,
            "hour": hour,
            "temperature_c": round(temperature, 2),
            "vibration_mm_s": round(vibration, 3),
            "power_kw": round(power, 2),
            "pressure_bar": round(pressure, 2),
            "operating_hours": operating_hours,
            "failure": failure
        })

df = pd.DataFrame(rows)

output = Path("data/industrial_telemetry.csv")
output.parent.mkdir(parents=True, exist_ok=True)
df.to_csv(output, index=False)

print(f"Generated {len(df):,} telemetry records.")
print(f"Machines: {df['machine_id'].nunique()}")
print(f"Failures: {df['failure'].sum()}")
print(f"Saved to: {output}")
