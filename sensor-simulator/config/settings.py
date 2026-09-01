"""
Sensor Simulator — Configuration

All configurable settings via environment variables.

The simulator supports TWO modes:

  MOCK MODE (default, preserved):
    Runs the SAFE -> WARNING -> CRITICAL -> ROCKFALL demo against the bundled
    standalone mock server. Uses BACKEND_URL (default 8001).

  REAL INTEGRATION MODE:
    Sends real image files to the actual Spring Boot backend at
    http://localhost:8080/api/analysis/cv. Use with:
      python main.py --mode real --scenario <safe|warning|critical>
      python main.py --mode real --demo
"""

import os

# ---------------------------------------------------------------------------
# Mock-mode backend (bundled standalone mock server)
# ---------------------------------------------------------------------------
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")

# ---------------------------------------------------------------------------
# Real integration mode services (actual working system)
# ---------------------------------------------------------------------------
REAL_BACKEND_URL = os.getenv("REAL_BACKEND_URL", "http://localhost:8080")
CV_SERVICE_URL = os.getenv("CV_SERVICE_URL", "http://localhost:8000")
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:9000")

# Real-mode image directory (place scenario images here)
TEST_IMAGE_ROOT = os.getenv("TEST_IMAGE_ROOT", os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test-images"
))

# Authentication
API_KEY = os.getenv("API_KEY", "")

# Timing
REQUEST_INTERVAL_SECONDS = float(os.getenv("REQUEST_INTERVAL", "2.0"))
STAGE_DELAY_SECONDS = float(os.getenv("STAGE_DELAY", "3.0"))

# Simulation
DEFAULT_ZONE_ID = os.getenv("DEFAULT_ZONE_ID", "SLOPE_A")
RANDOM_VARIATION = float(os.getenv("RANDOM_VARIATION", "0.1"))  # ±10%

# Hysteresis: how many consecutive critical readings before alert fires
CRITICAL_READINGS_NEEDED = int(os.getenv("CRITICAL_READINGS_NEEDED", "2"))
