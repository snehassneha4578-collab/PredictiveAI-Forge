from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent

def get_predicted_risk_csv():
    matches = [
        p for p in BASE_DIR.rglob("predicted_risk.csv")
        if ".venv" not in p.parts
        and "node_modules" not in p.parts
        and "dist" not in p.parts
        and ".git" not in p.parts
    ]

    if not matches:
        raise FileNotFoundError("predicted_risk.csv not found")

    return matches[0]

def get_machine_risk_summary():
    df = pd.read_csv(get_predicted_risk_csv())

    df["failure_risk"] = pd.to_numeric(
        df["failure_risk"], errors="coerce"
    ).fillna(0)

    df["risk_pct"] = df["failure_risk"] * 100

    summary = (
        df.groupby("machine_id", as_index=False)
        .agg(
            failure_risk=("failure_risk", "mean"),
            max_failure_risk=("failure_risk", "max"),
            risk_pct=("risk_pct", "mean"),
            max_risk_pct=("risk_pct", "max"),
            risk_level=("risk_level", "last"),
            observations=("machine_id", "size"),
        )
    )

    return summary
