"""
Sensor Simulator — Data Generator

Generates realistic sensor values with controlled randomness.
Values stay within scenario-specific boundaries for reliable demo execution.
"""

import random
from datetime import datetime, timezone


def vary(base: float, min_val: float, max_val: float, variation: float = 0.1) -> float:
    """Add controlled random variation around a base value, clamped to [min, max]."""
    delta = base * variation
    value = base + random.uniform(-delta, delta)
    return round(max(min_val, min(max_val, value)), 2)


def generate_telemetry(zone_id: str, scenario: dict, variation: float = 0.1) -> dict:
    """Generate a telemetry payload from a scenario config."""
    return {
        "zone_id": zone_id,
        "rainfall_mm": vary(
            scenario["rainfall_mm"]["base"],
            scenario["rainfall_mm"]["min"],
            scenario["rainfall_mm"]["max"],
            variation,
        ),
        "humidity": vary(
            scenario["humidity"]["base"],
            scenario["humidity"]["min"],
            scenario["humidity"]["max"],
            variation,
        ),
        "temperature": vary(
            scenario["temperature"]["base"],
            scenario["temperature"]["min"],
            scenario["temperature"]["max"],
            variation,
        ),
        "vibration": vary(
            scenario["vibration"]["base"],
            scenario["vibration"]["min"],
            scenario["vibration"]["max"],
            variation,
        ),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def generate_cv_results(zone_id: str, scenario: dict, variation: float = 0.1) -> dict:
    """Generate a CV results payload from a scenario config."""
    crack_confidence = scenario.get("crack_confidence", 0.0)
    if scenario.get("crack_detected", False):
        crack_confidence = round(
            max(0.25, min(1.0, crack_confidence + random.uniform(-0.05, 0.05))), 2
        )

    deformation = 0.0
    if "deformation_mm" in scenario:
        d = scenario["deformation_mm"]
        deformation = vary(d["base"], d["min"], d["max"], variation)

    return {
        "zone_id": zone_id,
        "crack_detected": scenario.get("crack_detected", False),
        "crack_severity": scenario.get("crack_severity", "NONE"),
        "crack_confidence": crack_confidence,
        "deformation_mm": deformation,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
