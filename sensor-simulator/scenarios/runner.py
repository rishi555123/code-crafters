"""
Sensor Simulator — Scenario Runner

Executes each demo stage: SAFE → WARNING → CRITICAL → ROCKFALL EVENT.
Handles timing, logging, and hysteresis compliance.
"""

import time
import logging
from datetime import datetime, timezone

from config.settings import (
    DEFAULT_ZONE_ID, REQUEST_INTERVAL_SECONDS, STAGE_DELAY_SECONDS,
    CRITICAL_READINGS_NEEDED, RANDOM_VARIATION,
)
from config.scenarios import SAFE, WARNING, CRITICAL, ROCKFALL_EVENT
from src.data_generator import generate_telemetry, generate_cv_results
from src import http_client as api

log = logging.getLogger("simulator.scenarios")


def _banner(stage: str, color: str = "white"):
    colors = {"green": "\033[92m", "yellow": "\033[93m", "red": "\033[91m", "white": "\033[0m"}
    c = colors.get(color, "")
    reset = "\033[0m"
    now = datetime.now(timezone.utc).strftime("%H:%M:%S")
    width = 60
    log.info(f"{c}{'═' * width}{reset}")
    log.info(f"{c}  STAGE: {stage:<{width - 9}}{reset}")
    log.info(f"{c}  TIME:  {now:<{width - 9}}{reset}")
    log.info(f"{c}{'═' * width}{reset}")


def _send_reading(zone_id: str, scenario: dict, label: str) -> dict:
    """Send one telemetry + CV reading and return the combined result."""
    telemetry = generate_telemetry(zone_id, scenario, RANDOM_VARIATION)
    cv = generate_cv_results(zone_id, scenario, RANDOM_VARIATION)

    log.info(f"--- Sending {label} reading for {zone_id} ---")

    t_result = api.post_telemetry(telemetry)
    time.sleep(0.3)
    c_result = api.post_cv_results(cv)

    return {
        "telemetry": t_result,
        "cv": c_result,
    }


def run_safe(zone_id: str = DEFAULT_ZONE_ID) -> dict:
    """Stage 1: SAFE conditions."""
    _banner("1 — SAFE", "green")
    log.info("Conditions: No crack, low rainfall, low vibration, normal humidity")
    log.info("Expected: LOW risk, green dashboard, no alert")
    log.info("")

    result = _send_reading(zone_id, SAFE, "SAFE")

    log.info("")
    log.info("✓ SAFE stage complete")
    return result


def run_warning(zone_id: str = DEFAULT_ZONE_ID) -> dict:
    """Stage 2: WARNING conditions."""
    _banner("2 — WARNING", "yellow")
    log.info("Conditions: Medium crack, moderate rainfall, moderate vibration")
    log.info("Expected: MEDIUM risk, yellow dashboard, no high-risk alert")
    log.info("")

    result = _send_reading(zone_id, WARNING, "WARNING")

    log.info("")
    log.info("✓ WARNING stage complete")
    return result


def run_critical(zone_id: str = DEFAULT_ZONE_ID) -> list[dict]:
    """Stage 3: CRITICAL conditions — sends multiple readings for hysteresis."""
    _banner("3 — CRITICAL", "red")
    log.info("Conditions: High crack, heavy rainfall, high vibration, high humidity")
    log.info(f"Expected: HIGH risk after {CRITICAL_READINGS_NEEDED} consecutive readings")
    log.info(f"Sending {CRITICAL_READINGS_NEEDED} critical readings for hysteresis compliance")
    log.info("")

    results = []
    for i in range(1, CRITICAL_READINGS_NEEDED + 1):
        log.info(f">>> Critical reading {i}/{CRITICAL_READINGS_NEEDED} <<<")
        result = _send_reading(zone_id, CRITICAL, f"CRITICAL-{i}")
        results.append(result)
        if i < CRITICAL_READINGS_NEEDED:
            log.info(f"Waiting {REQUEST_INTERVAL_SECONDS}s before next reading...")
            time.sleep(REQUEST_INTERVAL_SECONDS)

    log.info("")
    log.info("✓ CRITICAL stage complete")
    return results


def run_rockfall(zone_id: str = DEFAULT_ZONE_ID) -> dict:
    """Stage 4: Trigger rockfall event at peak critical conditions."""
    _banner("4 — ROCKFALL EVENT", "red")
    log.info("Triggering rockfall event at peak critical conditions")
    log.info("")

    # Ensure critical state is active first
    _send_reading(zone_id, CRITICAL, "PEAK-CRITICAL")
    time.sleep(0.5)

    event_payload = {
        "zone_id": zone_id,
        "magnitude": ROCKFALL_EVENT["magnitude"],
        "description": ROCKFALL_EVENT["description"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    result = api.post_rockfall_event(event_payload)

    log.info("")
    log.info("Verifying incident was recorded...")
    time.sleep(0.5)
    incidents = api.get_incidents(zone_id)
    log.info(f"Total incidents for {zone_id}: {incidents.get('total', 'unknown')}")

    log.info("")
    log.info("✓ ROCKFALL EVENT stage complete")
    return result


def run_full_demo(zone_id: str = DEFAULT_ZONE_ID) -> dict:
    """Run all four stages in sequence: SAFE → WARNING → CRITICAL → ROCKFALL."""
    log.info("")
    log.info("╔════════════════════════════════════════════════════════════╗")
    log.info("║     AI-BASED ROCKFALL PREDICTION — FULL DEMO             ║")
    log.info("║     Sensor Simulator                                     ║")
    log.info(f"║     Zone: {zone_id:<46} ║")
    log.info(f"║     Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC'):<46} ║")
    log.info("╚════════════════════════════════════════════════════════════╝")
    log.info("")

    # Health check
    log.info("Checking backend health...")
    health = api.get_health()
    if health.get("status") != "ok":
        log.warning(f"Backend health check returned: {health}")
        log.warning("Proceeding anyway — some endpoints may not respond...")
    else:
        log.info("Backend is healthy ✓")
    log.info("")

    results = {}

    # Stage 1: SAFE
    results["safe"] = run_safe(zone_id)
    time.sleep(STAGE_DELAY_SECONDS)

    # Stage 2: WARNING
    results["warning"] = run_warning(zone_id)
    time.sleep(STAGE_DELAY_SECONDS)

    # Stage 3: CRITICAL (multiple readings for hysteresis)
    results["critical"] = run_critical(zone_id)
    time.sleep(STAGE_DELAY_SECONDS)

    # Stage 4: ROCKFALL EVENT
    results["rockfall"] = run_rockfall(zone_id)

    # Final summary
    log.info("")
    log.info("╔════════════════════════════════════════════════════════════╗")
    log.info("║                    DEMO COMPLETE                          ║")
    log.info("╚════════════════════════════════════════════════════════════╝")
    log.info("")

    log.info("Fetching final state...")
    risk = api.get_risk(zone_id)
    log.info(f"Final risk state: {risk}")
    log.info("")

    incidents = api.get_incidents(zone_id)
    log.info(f"Total incidents: {incidents.get('total', 'unknown')}")
    for inc in incidents.get("incidents", []):
        log.info(f"  #{inc['id']} [{inc['event_type']}] {inc['risk_level']} "
                 f"(score={inc['risk_score']}) at {inc['timestamp']}")

    return results
