from fastapi import FastAPI

app = FastAPI(
    title="PredictiveAI Forge",
    description="Industrial Resilience Intelligence Platform",
    version="0.1.0"
)

@app.get("/")
def root():
    return {
        "name": "PredictiveAI Forge",
        "status": "online",
        "version": "0.1.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
