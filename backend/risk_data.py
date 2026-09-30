from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
RISK_CSV = next(
    (
        p for p in BASE_DIR.rglob("predicted_risk.csv")
        if ".venv" not in p.parts
        and "node_modules" not in p.parts
        and "dist" not in p.parts
        and ".git" not in p.parts
    ),
    None,
)

def load_risk_data():
    if RISK_CSV is None:
        raise FileNotFoundError("predicted_risk.csv not found")

    df = pd.read_csv(RISK_CSV)

    required = {
        "machine_id",
        "failure_risk",
        "risk_level",
    }

    missing = required - set(df.columns)

    if missing:
        raise ValueError(
            f"predicted_risk.csv missing columns: {sorted(missing)}"
        )

    return df
