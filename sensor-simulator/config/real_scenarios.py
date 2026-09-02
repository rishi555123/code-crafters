"""
Sensor Simulator — REAL Integration Scenario Configuration

In REAL integration mode the simulator sends actual image files to the
Spring Boot backend at:

  POST /api/analysis/cv   (multipart/form-data)

Each scenario maps to a directory under `test-images/`. The team must place
real rock/crack sample images in each directory. This module does NOT invent
or generate fake images.

Expected directories:

  sensor-simulator/test-images/safe/data.jpg
  sensor-simulator/test-images/warning/data.jpg
  sensor-simulator/test-images/critical/data.jpg

If an image is missing, the simulator reports a clear error rather than
sending a fake image.
"""

import os

from config.settings import TEST_IMAGE_ROOT, DEFAULT_ZONE_ID


def _image_path(scenario: str) -> str:
    return os.path.join(TEST_IMAGE_ROOT, scenario)


SAFE = {
    "scenario": "safe",
    "zone_id": "SLOPE_A",
    "image_path": _image_path("safe"),
    "expected": "Low/no crack risk (CV NONE/LOW)",
}

WARNING = {
    "scenario": "warning",
    "zone_id": "SLOPE_B",
    "image_path": _image_path("warning"),
    "expected": "Moderate crack risk (CV MEDIUM, ML Inter-ramp failure)",
}

CRITICAL = {
    "scenario": "critical",
    "zone_id": "SLOPE_A",
    "image_path": _image_path("critical"),
    "expected": "High crack risk (CV HIGH, ML Overall failure)",
}

ALL_SCENARIOS = ["safe", "warning", "critical"]

SCENARIO_MAP = {
    "safe": SAFE,
    "warning": WARNING,
    "critical": CRITICAL,
}


def get_scenario(name: str) -> dict:
    """Return the config for a named scenario (safe/warning/critical)."""
    if name not in SCENARIO_MAP:
        raise ValueError(
            f"Unknown scenario '{name}'. Valid: {ALL_SCENARIOS}"
        )
    return SCENARIO_MAP[name]


def resolve_image(name: str) -> str:
    """Resolve the single image file used for a scenario.

    The scenario directory may contain one or more images; the first
    supported image file found is used. Returns a full path or None if
    no image exists.
    """
    import glob

    directory = get_scenario(name)["image_path"]
    if not os.path.isdir(directory):
        return None

    patterns = ["*.jpg", "*.jpeg", "*.png", "*.bmp", "*.tiff", "*.webp"]
    for pattern in patterns:
        matches = sorted(glob.glob(os.path.join(directory, pattern)))
        if matches:
            return matches[0]

    return None


def all_scenarios() -> list[dict]:
    return [SCENARIO_MAP[name] for name in ALL_SCENARIOS]
