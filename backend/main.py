from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import snowflake.connector

load_dotenv()

app = FastAPI(title="PredictiveAI Forge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:5175", "http://127.0.0.1:5175", "http://localhost:5176", "http://127.0.0.1:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_connection():
    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
        role=os.getenv("SNOWFLAKE_ROLE"),
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/snowflake/health")
def snowflake_health():
    conn = get_connection()
    try:
        row = conn.cursor().execute(
            "SELECT CURRENT_USER(), CURRENT_DATABASE(), CURRENT_SCHEMA()"
        ).fetchone()

        return {
            "status": "connected",
            "user": row[0],
            "database": row[1],
            "schema": row[2],
        }
    finally:
        conn.close()


@app.get("/api/factory-resilience")
def factory_resilience():
    conn = get_connection()

    try:
        cursor = conn.cursor()
        row = cursor.execute("""
            SELECT
                FACTORY_RESILIENCE_SCORE,
                STATUS,
                AVERAGE_MACHINE_RISK_PCT,
                HIGH_RISK_MACHINE_RATIO_PCT,
                AVERAGE_CASCADE_EXPOSURE_PCT,
                AVERAGE_OEE_PCT,
                ESTIMATED_DOWNTIME_EXPOSURE_HOURS,
                ESTIMATED_ENERGY_WASTE_KWH,
                DATA_QUALITY_SCORE
            FROM PREDICTIVEAI_FORGE.INDUSTRIAL.FACTORY_RESILIENCE
            LIMIT 1
        """).fetchone()

        if not row:
            return {"status": "no_data"}

        columns = [
            "factory_resilience_score",
            "status",
            "average_machine_risk_pct",
            "high_risk_machine_ratio_pct",
            "average_cascade_exposure_pct",
            "average_oee_pct",
            "estimated_downtime_exposure_hours",
            "estimated_energy_waste_kwh",
            "data_quality_score",
        ]

        return dict(zip(columns, row))

    finally:
        conn.close()

@app.get("/api/machines")
def machines():
    conn = get_connection()

    try:
        cursor = conn.cursor()
        rows = cursor.execute("""
            SELECT
                r.MACHINE_ID,
                r.MACHINE_TYPE,
                r.TEMPERATURE_C,
                r.VIBRATION_MM_S,
                r.POWER_KW,
                r.PRESSURE_BAR,
                r.FAILURE_RISK_PCT,
                r.RISK_LEVEL,
                o.OEE_PCT,
                o.ESTIMATED_DOWNTIME_HOURS,
                o.ESTIMATED_ENERGY_WASTE_KWH,
                o.ESTIMATED_MATERIAL_WASTE_KG,
                o.ESTIMATED_CO2_KG
            FROM PREDICTIVEAI_FORGE.INDUSTRIAL.MACHINE_RISK r
            LEFT JOIN PREDICTIVEAI_FORGE.INDUSTRIAL.OEE_SUSTAINABILITY o
                ON r.MACHINE_ID = o.MACHINE_ID
            ORDER BY r.FAILURE_RISK_PCT DESC
        """).fetchall()

        columns = [
            "machine_id",
            "machine_type",
            "temperature_c",
            "vibration_mm_s",
            "power_kw",
            "pressure_bar",
            "failure_risk_pct",
            "risk_level",
            "oee_pct",
            "estimated_downtime_hours",
            "estimated_energy_waste_kwh",
            "estimated_material_waste_kg",
            "estimated_co2_kg"
        ]

        return [dict(zip(columns, row)) for row in rows]

    finally:
        conn.close()

@app.get("/api/failure-cascade")
def failure_cascade():
    conn = get_connection()

    try:
        cursor = conn.cursor()

        rows = cursor.execute("""
            SELECT
                SOURCE_MACHINE,
                TARGET_MACHINE,
                DEPENDENCY_TYPE,
                SOURCE_RISK,
                IMPACT_WEIGHT,
                PROPAGATED_RISK,
                CASCADE_RISK_PCT
            FROM PREDICTIVEAI_FORGE.INDUSTRIAL.FAILURE_CASCADE_RISK
            ORDER BY CASCADE_RISK_PCT DESC
        """).fetchall()

        columns = [
            "source_machine",
            "target_machine",
            "dependency_type",
            "source_risk",
            "impact_weight",
            "propagated_risk",
            "cascade_risk_pct"
        ]

        return [dict(zip(columns, row)) for row in rows]

    finally:
        conn.close()

@app.get("/api/counterfactuals")
def counterfactuals():
    conn = get_connection()

    try:
        cursor = conn.cursor()

        rows = cursor.execute("""
            SELECT
                MACHINE_ID,
                SCENARIO,
                CURRENT_RISK_PCT,
                PROJECTED_RISK_PCT,
                CASCADE_EXPOSURE_PCT,
                ESTIMATED_DOWNTIME_HOURS,
                ESTIMATED_OEE_PCT
            FROM PREDICTIVEAI_FORGE.INDUSTRIAL.COUNTERFACTUAL_SIMULATIONS
            ORDER BY MACHINE_ID, PROJECTED_RISK_PCT
        """).fetchall()

        columns = [
            "machine_id",
            "scenario",
            "current_risk_pct",
            "projected_risk_pct",
            "cascade_exposure_pct",
            "estimated_downtime_hours",
            "estimated_oee_pct"
        ]

        return [dict(zip(columns, row)) for row in rows]

    finally:
        conn.close()

@app.get("/api/oee-sustainability")
def oee_sustainability():
    conn = get_connection()

    try:
        cursor = conn.cursor()

        rows = cursor.execute("""
            SELECT
                MACHINE_ID,
                AVG_TEMPERATURE_C,
                AVG_VIBRATION_MM_S,
                AVG_POWER_KW,
                FAILURE_EVENTS,
                FAILURE_RISK_PCT,
                AVAILABILITY_PCT,
                PERFORMANCE_PCT,
                QUALITY_PCT,
                OEE_PCT,
                ESTIMATED_DOWNTIME_HOURS,
                ESTIMATED_ENERGY_WASTE_KWH,
                ESTIMATED_MATERIAL_WASTE_KG,
                ESTIMATED_CO2_KG
            FROM PREDICTIVEAI_FORGE.INDUSTRIAL.OEE_SUSTAINABILITY
            ORDER BY OEE_PCT ASC
        """).fetchall()

        columns = [
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

        return [dict(zip(columns, row)) for row in rows]

    finally:
        conn.close()



@app.get("/api/root-cause/{machine_id}")
def root_cause(machine_id: str):
    conn = get_connection()

    try:
        row = conn.cursor().execute("""
            SELECT
                MACHINE_ID,
                MACHINE_TYPE,
                TEMPERATURE_C,
                VIBRATION_MM_S,
                POWER_KW,
                PRESSURE_BAR,
                FAILURE_RISK_PCT,
                RISK_LEVEL
            FROM PREDICTIVEAI_FORGE.INDUSTRIAL.MACHINE_RISK
            WHERE MACHINE_ID = %s
        """, (machine_id,)).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Machine not found")

        machine = dict(zip([
            "machine_id", "machine_type", "temperature_c",
            "vibration_mm_s", "power_kw", "pressure_bar",
            "failure_risk_pct", "risk_level"
        ], row))

        risk = float(machine["failure_risk_pct"])
        temperature = float(machine["temperature_c"])
        vibration = float(machine["vibration_mm_s"])
        power = float(machine["power_kw"])
        pressure = float(machine["pressure_bar"])

        causes = [
            {
                "factor": "Temperature",
                "value": temperature,
                "impact_pct": round(min(100, max(0, temperature / 100 * risk)), 1),
                "signal": "Thermal stress"
            },
            {
                "factor": "Vibration",
                "value": vibration,
                "impact_pct": round(min(100, max(0, vibration / 5 * risk)), 1),
                "signal": "Mechanical instability"
            },
            {
                "factor": "Power demand",
                "value": power,
                "impact_pct": round(min(100, max(0, power / 100 * risk)), 1),
                "signal": "Load variation"
            },
            {
                "factor": "Pressure",
                "value": pressure,
                "impact_pct": round(min(100, max(0, pressure / 10 * risk)), 1),
                "signal": "Process pressure variation"
            }
        ]

        causes.sort(key=lambda x: x["impact_pct"], reverse=True)

        return {
            "machine_id": machine["machine_id"],
            "machine_type": machine["machine_type"],
            "risk_pct": risk,
            "risk_level": machine["risk_level"],
            "primary_root_cause": causes[0]["factor"],
            "confidence_pct": round(min(98, 60 + risk * 0.45), 1),
            "causes": causes,
            "recommended_action": (
                "Inspect thermal and mechanical conditions before continued operation."
                if risk >= 50
                else "Continue monitoring and schedule preventive inspection."
            )
        }

    finally:
        conn.close()



# ============================================================
# REAL MACHINE RISK SUMMARY
# ============================================================

from backend.risk_summary import get_machine_risk_summary

@app.get("/api/risk-summary")
def risk_summary():
    df = get_machine_risk_summary()

    machines = []

    for _, row in df.iterrows():
        machines.append({
            "machine_id": str(row["machine_id"]),
            "failure_risk": round(float(row["failure_risk"]), 6),
            "risk_pct": round(float(row["risk_pct"]), 2),
            "max_failure_risk": round(float(row["max_failure_risk"]), 6),
            "max_risk_pct": round(float(row["max_risk_pct"]), 2),
            "risk_level": str(row["risk_level"]),
            "observations": int(row["observations"])
        })

    return {
        "machine_count": len(machines),
        "average_risk_pct": round(
            sum(m["risk_pct"] for m in machines) / len(machines), 2
        ) if machines else 0,
        "max_risk_pct": round(
            max((m["max_risk_pct"] for m in machines), default=0), 2
        ),
        "machines": machines
    }

