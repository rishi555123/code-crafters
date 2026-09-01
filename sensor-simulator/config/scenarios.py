"""
Sensor Simulator — Demo Calibration Ranges

These are NOT precise geological standards. They are demo calibration values
chosen to reliably trigger the expected risk levels in the rockfall prediction
system while maintaining internal consistency.

Each scenario defines base values with controlled random variation (±10%)
to make repeated runs look realistic without compromising reliability.
"""

# ─────────────────────────────────────────────────────────────
# STAGE 1 — SAFE
# Expected: LOW risk, green dashboard, no alert
# ─────────────────────────────────────────────────────────────
SAFE = {
    "rainfall_mm": {"base": 3.0, "min": 1.0, "max": 6.0},
    "humidity": {"base": 60.0, "min": 50.0, "max": 70.0},
    "temperature": {"base": 30.0, "min": 25.0, "max": 35.0},
    "vibration": {"base": 1.2, "min": 0.5, "max": 2.0},
    "crack_detected": False,
    "crack_severity": "NONE",
    "crack_confidence": 0.10,
    "deformation_mm": {"base": 2.0, "min": 0.5, "max": 3.0},
}

# ─────────────────────────────────────────────────────────────
# STAGE 2 — WARNING
# Expected: MEDIUM risk, yellow dashboard, no high-risk alert
# ─────────────────────────────────────────────────────────────
WARNING = {
    "rainfall_mm": {"base": 20.0, "min": 15.0, "max": 28.0},
    "humidity": {"base": 78.0, "min": 70.0, "max": 85.0},
    "temperature": {"base": 28.0, "min": 22.0, "max": 34.0},
    "vibration": {"base": 3.5, "min": 2.5, "max": 5.0},
    "crack_detected": True,
    "crack_severity": "MEDIUM",
    "crack_confidence": 0.60,
    "deformation_mm": {"base": 7.0, "min": 5.0, "max": 9.0},
}

# ─────────────────────────────────────────────────────────────
# STAGE 3 — CRITICAL
# Expected: HIGH risk, red dashboard, alert after hysteresis
#
# CRITICAL: Must send at least 2 consecutive readings before
# the alert fires (hysteresis logic in backend).
# ─────────────────────────────────────────────────────────────
CRITICAL = {
    "rainfall_mm": {"base": 42.0, "min": 35.0, "max": 50.0},
    "humidity": {"base": 90.0, "min": 85.0, "max": 95.0},
    "temperature": {"base": 26.0, "min": 20.0, "max": 32.0},
    "vibration": {"base": 7.0, "min": 5.5, "max": 9.0},
    "crack_detected": True,
    "crack_severity": "HIGH",
    "crack_confidence": 0.88,
    "deformation_mm": {"base": 12.0, "min": 9.0, "max": 16.0},
}

# ─────────────────────────────────────────────────────────────
# STAGE 4 — ROCKFALL EVENT
# At the peak of critical conditions, trigger the event endpoint.
# ─────────────────────────────────────────────────────────────
ROCKFALL_EVENT = {
    "magnitude": 4.5,
    "description": "Automated rockfall event triggered by sensor simulator — "
                  "critical threshold exceeded across all indicators",
}

# ─────────────────────────────────────────────────────────────
# Risk score thresholds (for reference)
# ─────────────────────────────────────────────────────────────
RISK_THRESHOLDS = {
    "LOW_MAX": 29.9,
    "MEDIUM_MAX": 59.9,
    "HIGH_MIN": 60.0,
}

# ─────────────────────────────────────────────────────────────
# Sensor value reference ranges
# ─────────────────────────────────────────────────────────────
SENSOR_RANGES = {
    "rainfall_mm": {"unit": "mm", "range": "0–60", "description": "Hourly rainfall"},
    "humidity": {"unit": "%", "range": "0–100", "description": "Relative humidity"},
    "temperature": {"unit": "°C", "range": "0–50", "description": "Ambient temperature"},
    "vibration": {"unit": "mm/s", "range": "0–10", "description": "Ground vibration velocity"},
    "deformation_mm": {"unit": "mm", "range": "0–20", "description": "Surface crack deformation"},
    "crack_confidence": {"unit": "0–1", "range": "0.0–1.0", "description": "CV model confidence"},
    "crack_severity": {"unit": "enum", "range": "NONE/LOW/MEDIUM/HIGH", "description": "Crack severity class"},
}
