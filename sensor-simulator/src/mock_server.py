"""
STANDALONE MOCK SERVER — For testing the sensor simulator without the real backend.

This is NOT the production backend. It provides a self-contained API surface
so the sensor simulator can be developed and tested independently.

The real backend (ml-model/main.py) exposes a narrower API:
  GET  /health
  POST /risk/analyze  (expects 5 normalized ML features)

When the full backend is implemented, set BACKEND_URL in .env to point the
simulator at it and skip running this mock server.

Endpoints provided by this mock:
  POST /api/telemetry       — Receive sensor telemetry data
  POST /api/cv-results      — Receive CV analysis results
  POST /api/predictions     — Run risk prediction on latest data
  GET  /api/risk/current    — Get current risk state per zone
  GET  /api/incidents       — Get incident/history log
  GET  /api/zones           — List configured zones
  POST /api/rockfall/event  — Record a rockfall event
  GET  /health              — Health check
"""

import os
import time
import logging
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("rockfall-backend")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
API_KEY = os.getenv("API_KEY", "")
CV_SERVICE_URL = os.getenv("CV_SERVICE_URL", "")  # e.g. http://localhost:8000
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "")  # e.g. http://localhost:8002
RISK_HYSTERESIS_COUNT = int(os.getenv("RISK_HYSTERESIS_COUNT", "2"))

# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------
_zone_telemetry: dict[str, dict] = {}
_zone_cv_results: dict[str, dict] = {}
_zone_risk_state: dict[str, dict] = {}
_zone_consecutive_critical: dict[str, int] = {}
_incidents: list[dict] = []

ZONES = ["SLOPE_A", "SLOPE_B", "SLOPE_C"]

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class TelemetryPayload(BaseModel):
    zone_id: str = Field(..., min_length=1)
    rainfall_mm: float = Field(..., ge=0)
    humidity: float = Field(..., ge=0, le=100)
    temperature: float = Field(...)
    vibration: float = Field(..., ge=0)
    timestamp: Optional[str] = None


class CVResultPayload(BaseModel):
    zone_id: str = Field(..., min_length=1)
    timestamp: Optional[str] = None
    crack_detected: bool = False
    crack_severity: str = Field("NONE", pattern="^(NONE|LOW|MEDIUM|HIGH)$")
    deformation_mm: float = Field(0.0, ge=0)
    crack_confidence: float = Field(0.0, ge=0, le=1)


class PredictionRequest(BaseModel):
    zone_id: str = Field(..., min_length=1)


class RockfallEventRequest(BaseModel):
    zone_id: str = Field(..., min_length=1)
    magnitude: Optional[float] = None
    description: Optional[str] = None
    timestamp: Optional[str] = None


class RiskState(BaseModel):
    zone_id: str
    risk_level: str
    risk_score: float
    consecutive_critical: int
    alert_active: bool
    last_updated: str


class IncidentRecord(BaseModel):
    id: int
    zone_id: str
    event_type: str
    risk_level: str
    risk_score: float
    details: dict
    timestamp: str


# ---------------------------------------------------------------------------
# Risk assessment (built-in fallback)
# ---------------------------------------------------------------------------

def _compute_risk_score(telemetry: dict, cv: dict) -> tuple[str, float]:
    """Compute a risk score from telemetry + CV data. Returns (level, score)."""
    score = 0.0

    rainfall = telemetry.get("rainfall_mm", 0)
    vibration = telemetry.get("vibration", 0)
    humidity = telemetry.get("humidity", 50)

    crack_detected = cv.get("crack_detected", False)
    crack_severity = cv.get("crack_severity", "NONE")
    deformation = cv.get("deformation_mm", 0)

    # Rainfall contribution (0-30 points)
    if rainfall > 40:
        score += 30
    elif rainfall > 25:
        score += 20
    elif rainfall > 15:
        score += 10
    elif rainfall > 8:
        score += 5

    # Vibration contribution (0-25 points)
    if vibration > 6:
        score += 25
    elif vibration > 4:
        score += 15
    elif vibration > 2:
        score += 8
    elif vibration > 1:
        score += 3

    # Humidity contribution (0-10 points)
    if humidity > 85:
        score += 10
    elif humidity > 75:
        score += 5

    # Crack detection contribution (0-20 points)
    if crack_detected:
        severity_scores = {"LOW": 5, "MEDIUM": 12, "HIGH": 20, "NONE": 0}
        score += severity_scores.get(crack_severity, 0)

    # Deformation contribution (0-15 points)
    if deformation > 10:
        score += 15
    elif deformation > 7:
        score += 10
    elif deformation > 4:
        score += 5
    elif deformation > 2:
        score += 2

    # Determine risk level
    if score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    return level, round(min(score, 100), 1)


def _update_risk_state(zone_id: str) -> dict:
    """Update risk state with hysteresis logic. Returns the state dict."""
    telemetry = _zone_telemetry.get(zone_id, {})
    cv = _zone_cv_results.get(zone_id, {})

    if not telemetry:
        return _zone_risk_state.get(zone_id, {
            "zone_id": zone_id,
            "risk_level": "LOW",
            "risk_score": 0,
            "consecutive_critical": 0,
            "alert_active": False,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        })

    level, score = _compute_risk_score(telemetry, cv)

    current = _zone_risk_state.get(zone_id, {
        "zone_id": zone_id,
        "risk_level": "LOW",
        "risk_score": 0,
        "consecutive_critical": 0,
        "alert_active": False,
    })

    if level == "HIGH":
        _zone_consecutive_critical[zone_id] = _zone_consecutive_critical.get(zone_id, 0) + 1
    else:
        _zone_consecutive_critical[zone_id] = 0

    consecutive = _zone_consecutive_critical.get(zone_id, 0)
    alert_active = consecutive >= RISK_HYSTERESIS_COUNT

    state = {
        "zone_id": zone_id,
        "risk_level": level,
        "risk_score": score,
        "consecutive_critical": consecutive,
        "alert_active": alert_active,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    _zone_risk_state[zone_id] = state

    # Create incident if alert just activated
    if alert_active and not current.get("alert_active"):
        _create_incident(zone_id, "ALERT_TRIGGERED", level, score, {
            "consecutive_critical": consecutive,
            "telemetry": telemetry,
            "cv_results": cv,
        })

    return state


def _create_incident(zone_id: str, event_type: str, risk_level: str,
                     risk_score: float, details: dict) -> dict:
    """Record an incident."""
    incident = {
        "id": len(_incidents) + 1,
        "zone_id": zone_id,
        "event_type": event_type,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _incidents.append(incident)
    log.info(f"INCIDENT #{incident['id']}: {event_type} in {zone_id} "
             f"(risk={risk_level}, score={risk_score})")
    return incident


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=== MOCK SERVER — For standalone testing only ===")
    log.info("Rockfall Prediction Mock Server starting...")
    log.info(f"API key required: {'Yes' if API_KEY else 'No (open access)'}")
    log.info(f"CV service URL: {CV_SERVICE_URL or 'Not configured (using built-in)'}")
    log.info(f"ML service URL: {ML_SERVICE_URL or 'Not configured (using built-in)'}")
    log.info(f"Hysteresis count: {RISK_HYSTERESIS_COUNT}")
    yield
    log.info("Rockfall Prediction Mock Server shutting down.")


app = FastAPI(
    title="Rockfall Prediction — Mock Server (sensor-simulator)",
    description="Standalone mock backend for testing the sensor simulator. "
                "Not the production backend.",
    version="1.0.0-mock",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _verify_api_key(x_api_key: Optional[str] = Header(None)):
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "rockfall-backend", "version": "1.0.0"}


@app.post("/api/telemetry")
def receive_telemetry(payload: TelemetryPayload, x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    data = payload.model_dump()
    if not data.get("timestamp"):
        data["timestamp"] = datetime.now(timezone.utc).isoformat()

    _zone_telemetry[payload.zone_id] = data
    log.info(f"TELEMETRY [{payload.zone_id}]: "
             f"rain={payload.rainfall_mm}mm hum={payload.humidity}% "
             f"temp={payload.temperature}°C vib={payload.vibration}")

    state = _update_risk_state(payload.zone_id)
    log.info(f"RISK [{payload.zone_id}]: {state['risk_level']} "
             f"(score={state['risk_score']}, consecutive={state['consecutive_critical']}, "
             f"alert={state['alert_active']})")

    return {
        "status": "ok",
        "zone_id": payload.zone_id,
        "risk_state": state,
    }


@app.post("/api/cv-results")
def receive_cv_results(payload: CVResultPayload, x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    data = payload.model_dump()
    if not data.get("timestamp"):
        data["timestamp"] = datetime.now(timezone.utc).isoformat()

    _zone_cv_results[payload.zone_id] = data
    log.info(f"CV [{payload.zone_id}]: crack={payload.crack_detected} "
             f"severity={payload.crack_severity} deform={payload.deformation_mm}mm "
             f"conf={payload.crack_confidence}")

    state = _update_risk_state(payload.zone_id)
    return {
        "status": "ok",
        "zone_id": payload.zone_id,
        "risk_state": state,
    }


@app.post("/api/predictions")
def run_prediction(payload: PredictionRequest, x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    zone_id = payload.zone_id
    state = _update_risk_state(zone_id)
    return {
        "status": "ok",
        "zone_id": zone_id,
        "prediction": state,
    }


@app.get("/api/risk/current")
def get_current_risk(zone_id: Optional[str] = None, x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    if zone_id:
        if zone_id not in _zone_risk_state:
            raise HTTPException(status_code=404, detail=f"No risk data for zone {zone_id}")
        return {"zones": [_zone_risk_state[zone_id]]}
    return {"zones": list(_zone_risk_state.values())}


@app.get("/api/incidents")
def get_incidents(zone_id: Optional[str] = None, limit: int = 50,
                  x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    results = _incidents
    if zone_id:
        results = [i for i in results if i["zone_id"] == zone_id]
    return {"incidents": results[-limit:], "total": len(results)}


@app.get("/api/zones")
def get_zones(x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    zones = []
    for zid in ZONES:
        risk = _zone_risk_state.get(zid, {"risk_level": "UNKNOWN", "risk_score": 0})
        zones.append({
            "zone_id": zid,
            "risk_level": risk.get("risk_level", "UNKNOWN"),
            "risk_score": risk.get("risk_score", 0),
            "has_telemetry": zid in _zone_telemetry,
            "has_cv_data": zid in _zone_cv_results,
        })
    return {"zones": zones}


@app.post("/api/rockfall/event")
def record_rockfall_event(payload: RockfallEventRequest,
                          x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    zone_id = payload.zone_id
    now = payload.timestamp or datetime.now(timezone.utc).isoformat()

    telemetry = _zone_telemetry.get(zone_id, {})
    cv = _zone_cv_results.get(zone_id, {})

    incident = _create_incident(zone_id, "ROCKFALL_EVENT", "HIGH", 100.0, {
        "magnitude": payload.magnitude,
        "description": payload.description or "Rockfall event detected",
        "timestamp": now,
        "telemetry_at_event": telemetry,
        "cv_at_event": cv,
    })

    # Update zone state
    _zone_risk_state[zone_id] = {
        "zone_id": zone_id,
        "risk_level": "HIGH",
        "risk_score": 100.0,
        "consecutive_critical": RISK_HYSTERESIS_COUNT,
        "alert_active": True,
        "last_updated": now,
    }

    return {
        "status": "ok",
        "zone_id": zone_id,
        "incident": incident,
    }


@app.get("/api/rockfall/history")
def get_rockfall_history(zone_id: Optional[str] = None,
                         x_api_key: Optional[str] = Header(None)):
    _verify_api_key(x_api_key)

    events = [i for i in _incidents if i["event_type"] == "ROCKFALL_EVENT"]
    if zone_id:
        events = [e for e in events if e["zone_id"] == zone_id]
    return {"events": events, "total": len(events)}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("\n  *** MOCK SERVER — Standalone testing only ***")
    print("  This is NOT the production backend.")
    print("  For the real demo, start the actual backend and set BACKEND_URL.\n")
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
