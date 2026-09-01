"""
Sensor Simulator — HTTP Client

Handles all HTTP communication for both modes:

MOCK MODE:
  Talks to the bundled standalone mock server (BACKEND_URL, default 8001)
  using the /api/telemetry, /api/cv-results, /api/predictions, ... endpoints.

REAL INTEGRATION MODE:
  Talks to the actual Spring Boot backend (REAL_BACKEND_URL, default 8080)
  using POST /api/analysis/cv (multipart image + zone_id) and
  GET /api/analysis/risk/{zoneId}. Also exposes health checks for the
  backend, the CV service, and the ML risk engine.
"""

import json
import logging
import httpx

from config.settings import BACKEND_URL, REAL_BACKEND_URL, CV_SERVICE_URL, ML_SERVICE_URL, API_KEY

log = logging.getLogger("simulator.http")


def _headers() -> dict:
    h = {"Content-Type": "application/json"}
    if API_KEY:
        h["X-API-Key"] = API_KEY
    return h


# ---------------------------------------------------------------------------
# Health checks (used in BOTH modes)
# ---------------------------------------------------------------------------

def check_backend_health(url: str | None = None) -> dict:
    """Check availability of the real Spring Boot backend.

    The Spring Boot backend has no GET /health endpoint; use the root or a
    404-tolerant probe. Returns a dict with 'reachable' and 'detail'.
    """
    target = url or REAL_BACKEND_URL
    log.info(f"GET {target} (backend availability check)")
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(target)
            # Spring Boot returns 404/405 for unknown path but connection
            # succeeded — that means the server is reachable.
            return {"reachable": True, "status_code": resp.status_code}
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot reach backend at {target}")
        return {"reachable": False, "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Backend check failed: {e}")
        return {"reachable": False, "detail": str(e)}


def check_cv_health(url: str | None = None) -> dict:
    """Check availability of the Computer Vision service."""
    target = url or CV_SERVICE_URL
    full = f"{target}/health"
    log.info(f"GET {full}")
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(full)
            ok = resp.status_code == 200 and resp.json().get("status") == "ok"
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return {"reachable": ok, "status_code": resp.status_code}
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot reach CV service at {full}")
        return {"reachable": False, "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ CV health check failed: {e}")
        return {"reachable": False, "detail": str(e)}


def check_ml_health(url: str | None = None) -> dict:
    """Check availability of the ML risk engine."""
    target = url or ML_SERVICE_URL
    full = f"{target}/health"
    log.info(f"GET {full}")
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(full)
            ok = resp.status_code == 200 and resp.json().get("status") == "healthy"
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return {"reachable": ok, "status_code": resp.status_code}
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot reach ML service at {full}")
        return {"reachable": False, "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ ML health check failed: {e}")
        return {"reachable": False, "detail": str(e)}


# ---------------------------------------------------------------------------
# REAL integration mode — analysis
# ---------------------------------------------------------------------------

def post_analysis(image_path: str, zone_id: str, backend_url: str | None = None) -> dict:
    """Send a real image to the real backend for analysis.

    POST {backend}/api/analysis/cv  (multipart/form-data)
      image   = file at image_path
      zone_id = zone string

    Returns the full backend response containing cvResult and riskResult.
    """
    url = f"{backend_url or REAL_BACKEND_URL}/api/analysis/cv"
    log.info(f"POST {url}")
    log.info(f"  image   = {image_path}")
    log.info(f"  zone_id = {zone_id}")

    try:
        with open(image_path, "rb") as fh:
            files = {"image": (image_path.split("\\")[-1].split("/")[-1], fh)}
            data = {"zone_id": zone_id}
            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, files=files, data=data)
                log.info(f"  → {resp.status_code} {resp.text[:500]}")
                try:
                    return {"status_code": resp.status_code, **resp.json()}
                except Exception:
                    return {"status_code": resp.status_code, "text": resp.text}
    except FileNotFoundError:
        log.error(f"  ✗ Image file not found: {image_path}")
        return {"status": "error", "detail": "image_not_found", "image_path": image_path}
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {url}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def get_real_risk(zone_id: str, backend_url: str | None = None) -> dict:
    """Call GET {backend}/api/analysis/risk/{zoneId} on the real backend."""
    url = f"{backend_url or REAL_BACKEND_URL}/api/analysis/risk/{zone_id}"
    log.info(f"GET {url}")
    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url)
            log.info(f"  → {resp.status_code} {resp.text[:300]}")
            try:
                return {"status_code": resp.status_code, **resp.json()}
            except Exception:
                return {"status_code": resp.status_code, "text": resp.text}
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {url}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


# ---------------------------------------------------------------------------
# MOCK-mode functions (preserved — target the standalone mock server)
# ---------------------------------------------------------------------------



def _headers() -> dict:
    h = {"Content-Type": "application/json"}
    if API_KEY:
        h["X-API-Key"] = API_KEY
    return h


def post_telemetry(payload: dict) -> dict:
    url = f"{BACKEND_URL}/api/telemetry"
    log.info(f"POST {url}")
    log.info(f"  payload: {json.dumps(payload, indent=2)}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=_headers())
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def post_cv_results(payload: dict) -> dict:
    url = f"{BACKEND_URL}/api/cv-results"
    log.info(f"POST {url}")
    log.info(f"  payload: {json.dumps(payload, indent=2)}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=_headers())
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def post_prediction(zone_id: str) -> dict:
    url = f"{BACKEND_URL}/api/predictions"
    payload = {"zone_id": zone_id}
    log.info(f"POST {url} zone={zone_id}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=_headers())
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def get_risk(zone_id: str | None = None) -> dict:
    url = f"{BACKEND_URL}/api/risk/current"
    params = {}
    if zone_id:
        params["zone_id"] = zone_id
    log.info(f"GET {url} params={params}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, params=params, headers=_headers())
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def get_incidents(zone_id: str | None = None) -> dict:
    url = f"{BACKEND_URL}/api/incidents"
    params = {}
    if zone_id:
        params["zone_id"] = zone_id
    log.info(f"GET {url} params={params}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, params=params, headers=_headers())
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def post_rockfall_event(payload: dict) -> dict:
    url = f"{BACKEND_URL}/api/rockfall/event"
    log.info(f"POST {url}")
    log.info(f"  payload: {json.dumps(payload, indent=2)}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=_headers())
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def get_zones() -> dict:
    url = f"{BACKEND_URL}/api/zones"
    log.info(f"GET {url}")
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(url, headers=_headers())
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}


def get_health() -> dict:
    url = f"{BACKEND_URL}/health"
    log.info(f"GET {url}")
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url)
            log.info(f"  → {resp.status_code} {resp.text[:200]}")
            return resp.json()
    except httpx.ConnectError:
        log.error(f"  ✗ Cannot connect to backend at {BACKEND_URL}")
        return {"status": "error", "detail": "connection_refused"}
    except Exception as e:
        log.error(f"  ✗ Request failed: {e}")
        return {"status": "error", "detail": str(e)}
