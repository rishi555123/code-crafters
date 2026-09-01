from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from predict import predict_risk


app = FastAPI(
    title="Rockfall Risk Engine",
    description="ML-based rockfall risk prediction service",
    version="1.0.0"
)


class RiskRequest(BaseModel):
    P16: float = Field(..., ge=0, le=1)
    P5: float = Field(..., ge=0, le=1)
    P17: float = Field(..., ge=0, le=1)
    P2: float = Field(..., ge=0, le=1)
    P1: float = Field(..., ge=0, le=1)


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/risk/analyze")
def analyze_risk(request: RiskRequest):

    try:

        values = [
            request.P16,
            request.P5,
            request.P17,
            request.P2,
            request.P1
        ]

        result = predict_risk(values)

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail="Risk prediction failed"
        )