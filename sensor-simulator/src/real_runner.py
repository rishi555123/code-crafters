"""
Sensor Simulator — REAL Integration Mode Runner

Sends real image files to the actual Spring Boot backend:

  POST /api/analysis/cv   (multipart: image + zone_id)
  GET  /api/analysis/risk/{zoneId}

Before sending, it checks availability of:
  - the Spring Boot backend (REAL_BACKEND_URL, default http://localhost:8080)
  - the CV service (http://localhost:8000/health)
  - the ML risk engine (http://127.0.0.1:9000/health)

This module does NOT generate or invent fake images. It requires the team to
place real scenario images under sensor-simulator/test-images/.
"""

import logging
from datetime import datetime, timezone

from config.settings import REAL_BACKEND_URL
from config.real_scenarios import get_scenario, resolve_image, all_scenarios, ALL_SCENARIOS
from src import http_client as api

log = logging.getLogger("simulator.real")


def check_all_services() -> dict:
    """Probe backend, CV, ML and report availability of each."""
    backend = api.check_backend_health()
    cv = api.check_cv_health()
    ml = api.check_ml_health()

    report = {
        "backend": backend,
        "cv": cv,
        "ml": ml,
    }

    log.info("")
    log.info("=== Service availability check ===")
    log.info(f"  Backend ({REAL_BACKEND_URL}): "
             f"{'UP' if backend.get('reachable') else 'DOWN'} "
             f"({backend.get('status_code', backend.get('detail', 'unknown'))})")
    log.info(f"  CV      ({api.CV_SERVICE_URL}): "
             f"{'UP' if cv.get('reachable') else 'DOWN'} "
             f"({cv.get('status_code', cv.get('detail', 'unknown'))})")
    log.info(f"  ML      ({api.ML_SERVICE_URL}): "
             f"{'UP' if ml.get('reachable') else 'DOWN'} "
             f"({ml.get('status_code', ml.get('detail', 'unknown'))})")
    log.info("=====================")
    log.info("")

    return report


def run_real_scenario(name: str, zone_id: str | None = None) -> dict:
    """Run a single real integration scenario against the real backend."""
    scenario = get_scenario(name)
    effective_zone = zone_id or scenario["zone_id"]

    log.info("")
    log.info("═" * 60)
    log.info(f"  REAL SCENARIO: {name.upper()}")
    log.info(f"  TIME: {datetime.now(timezone.utc).strftime('%H:%M:%S')}")
    log.info("═" * 60)
    log.info(f"  Expected: {scenario['expected']}")
    log.info("")

    image_path = resolve_image(name)
    if image_path is None:
        log.error(f"  ✗ No image found for scenario '{name}' in: "
                  f"{scenario['image_path']}")
        log.error("    Place a real image there (jpg/png/bmp/tiff/webp) and retry.")
        return {
            "scenario": name,
            "status": "error",
            "detail": "no_image_for_scenario",
            "image_dir": scenario["image_path"],
        }

    log.info(f"  Using image: {image_path}")
    log.info(f"  Zone:        {effective_zone}")
    log.info("")

    # Optional: check the zone-specific risk endpoint first (best-effort)
    risk = api.get_real_risk(effective_zone)

    # Analyse the image
    result = api.post_analysis(image_path, effective_zone)

    return {
        "scenario": name,
        "zone_id": effective_zone,
        "image": image_path,
        "pre_check_risk": risk,
        "analysis": result,
    }


def run_real_demo(zone_ids: dict | None = None) -> dict:
    """Run all supported scenarios sequentially (safe -> warning -> critical)."""
    log.info("")
    log.info("╔══════════════════════════════════════════════════════════╗")
    log.info("║   REAL INTEGRATION DEMO (safe -> warning -> critical)   ║")
    log.info("╚══════════════════════════════════════════════════════════╝")
    log.info("")

    services = check_all_services()
    for svc, info in services.items():
        if not info.get("reachable"):
            log.warning(f"  Warning: {svc} service is unreachable. "
                        f"Continuing (requests may fail).")
    log.info("")

    results = {}
    for name in ALL_SCENARIOS:
        scenario = get_scenario(name)
        zone = (zone_ids or {}).get(name, scenario["zone_id"])
        results[name] = run_real_scenario(name, zone)
        log.info("")

    return results
