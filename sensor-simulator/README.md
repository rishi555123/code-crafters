# Sensor Simulator — AI-Based Rockfall Prediction & Alert System

Sensor and CV data simulator for the AI-Based Rockfall Prediction & Alert System.
It supports **TWO modes**:

- **REAL INTEGRATION MODE** (`--mode real`): sends real image files to the
  actual Spring Boot backend (`POST /api/analysis/cv`).
- **MOCK DEMO MODE** (default): runs the SAFE → WARNING → CRITICAL → ROCKFALL
  demo against the bundled standalone mock server.

## Architecture

```
sensor-simulator/
├── main.py                      # Entry point (--mode real | mock)
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
├── config/
│   ├── settings.py              # All configurable settings (env vars)
│   ├── scenarios.py             # Mock-mode demo calibration ranges (4 stages)
│   └── real_scenarios.py        # Real-mode image path configuration
├── src/
│   ├── mock_server.py           # MOCK backend (standalone testing only — NOT production)
│   ├── real_runner.py           # REAL integration mode runner
│   ├── http_client.py           # HTTP client for backend communication (both modes)
│   └── data_generator.py        # Mock-mode sensor data generation
├── scenarios/
│   └── runner.py                # Mock-mode stage execution (with hysteresis)
├── test-images/
│   ├── safe/                    # Place SAFE scenario images here
│   ├── warning/                 # Place WARNING scenario images here
│   ├── critical/                # Place CRITICAL scenario images here
│   └── README.md                # Image placement documentation
├── postman/
│   ├── rockfall-api-collection.json    # Postman collection (REAL + Mock/Future)
│   └── rockfall-api-environment.json   # Postman environment variables
└── README.md
```

> **Important about the mock server:** `src/mock_server.py` is a **standalone mock** for
> developing and testing the simulator in isolation. It is **NOT the production backend**.
> It is clearly marked as such and is **not required** (and not used) in real integration
> mode.

## Prerequisites

- Python 3.10+
- pip

## Installation

```bash
cd sensor-simulator
pip install -r requirements.txt
```

Copy the environment template and edit as needed:

```bash
cp .env.example .env
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BACKEND_URL` | `http://localhost:8001` | **Mock mode** backend (bundled mock server) |
| `REAL_BACKEND_URL` | `http://localhost:8080` | **Real mode** Spring Boot backend |
| `CV_SERVICE_URL` | `http://localhost:8000` | CV service URL (health check) |
| `ML_SERVICE_URL` | `http://127.0.0.1:9000` | ML risk engine URL (health check) |
| `TEST_IMAGE_ROOT` | `sensor-simulator/test-images` | Directory holding scenario images |
| `API_KEY` | (empty) | API key for authenticated endpoints |
| `REQUEST_INTERVAL` | `2.0` | Seconds between consecutive mock readings |
| `STAGE_DELAY` | `3.0` | Seconds pause between mock stages |
| `DEFAULT_ZONE_ID` | `SLOPE_A` | Default zone to simulate |
| `RANDOM_VARIATION` | `0.1` | Random variation factor (±10%) |
| `CRITICAL_READINGS_NEEDED` | `2` | Consecutive critical readings before alert fires |
| `PORT` | `8001` | Mock server port |
| `RISK_HYSTERESIS_COUNT` | `2` | Mock backend hysteresis threshold |

## REAL INTEGRATION MODE

This mode works with the **actual current system** (Spring Boot backend +
CV + ML). It sends real image files, not generated telemetry.

### Real services

| Service | Base URL | Health endpoint |
|---|---|---|
| Spring Boot backend | `http://localhost:8080` | root probe |
| CV service | `http://localhost:8000` | `GET /health` |
| ML risk engine | `http://127.0.0.1:9000` | `GET /health` |

### Commands

```bash
# Check service availability (backend, CV, ML)
python main.py --mode real --check

# Run one scenario
python main.py --mode real --scenario safe
python main.py --mode real --scenario warning
python main.py --mode real --scenario critical

# Run all supported scenarios sequentially
python main.py --mode real --demo
```

### Real backend endpoint used

```
POST http://localhost:8080/api/analysis/cv
Content-Type: multipart/form-data
    image   = <file from test-images/<scenario>/>
    zone_id = SLOPE_A / SLOPE_B
```

The backend returns:
```json
{
  "cvResult": {
    "zone_id": "SLOPE_A",
    "timestamp": "...",
    "crack_detected": true,
    "crack_severity": "HIGH",
    "deformation_mm": 0.0,
    "crack_confidence": 0.87
  },
  "riskResult": {
    "risk_class": 1,
    "risk_level": "Inter-ramp failure",
    "confidence": 0.94
  }
}
```

Also used: `GET /api/analysis/risk/{zoneId}` for a risk-only read of a zone.

### Test images

Real mode requires actual rock/crack sample images. None exist in the repo yet.
Place them in:

```
test-images/safe/      → stable slope (expect CV NONE/LOW)
test-images/warning/   → moderate cracking (expect CV MEDIUM)
test-images/critical/  → heavily cracked (expect CV HIGH)
```

See `test-images/README.md`. The simulator does **not** invent fake images —
it reports a clear error if a scenario has no image.

> **Note:** The zone must exist in the backend Postgres `zones` table
> (`SLOPE_A`, `SLOPE_B`, `SLOPE_C`), otherwise the backend returns a 500
> "Zone not found" error.

## MOCK DEMO MODE (default, preserved)

This is the original simulator behaviour — SAFE → WARNING → CRITICAL → ROCKFALL
against the bundled standalone mock server.

### Start the mock server (standalone testing ONLY)

The sensor-simulator includes a **mock server** (`src/mock_server.py`) for standalone
testing of the simulator without the real backend. Start it in a separate terminal:

```bash
# Terminal 1 — Start mock server (standalone testing ONLY)
cd sensor-simulator
python -m src.mock_server
```

The mock server starts on port 8001. You should see:

```
*** MOCK SERVER — Standalone testing only ***
INFO:     Rockfall Prediction Mock Server starting...
```

> ⚠️ This is a mock, not the production backend. It exists only to let the simulator
> be developed and tested independently. In real mode you do **not** run the mock
> server — you point the simulator at the real Spring Boot backend instead.

### Run the mock demo

With the mock server running, run the full SAFE → WARNING → CRITICAL → ROCKFALL demo:

```bash
# Terminal 2 — Run the simulator against the mock server
python main.py
```

## How to Run the Full Demo

```bash
# Terminal 2 — Run the simulator (mock mode, default)
python main.py
```

This runs all four stages in sequence:

```
STAGE 1 — SAFE      → LOW risk, green dashboard
STAGE 2 — WARNING   → MEDIUM risk, yellow dashboard
STAGE 3 — CRITICAL  → HIGH risk, red dashboard, alert fires after hysteresis
STAGE 4 — ROCKFALL  → Event recorded, incident in history
```

## How to Run Individual Scenarios

```bash
python main.py --stage safe       # SAFE conditions only
python main.py --stage warning    # WARNING conditions only
python main.py --stage critical   # CRITICAL conditions (sends 2+ readings)
python main.py --stage rockfall   # ROCKFALL EVENT trigger
```

## Utility Commands

```bash
python main.py --status           # Show current risk status
python main.py --incidents        # Show incident history
python main.py --zones            # List configured zones
python main.py --zone SLOPE_B     # Use a different zone
```

## Expected Output

### SAFE Stage
```
STAGE: 1 — SAFE
Conditions: No crack, low rainfall, low vibration
Expected: LOW risk, green dashboard, no alert
TELEMETRY [SLOPE_A]: rain=3.12mm hum=58.7% temp=29.8°C vib=1.18
RISK [SLOPE_A]: LOW (score=5.0, consecutive=0, alert=False)
```

### WARNING Stage
```
STAGE: 2 — WARNING
TELEMETRY [SLOPE_A]: rain=21.3mm hum=77.2% temp=27.5°C vib=3.62
RISK [SLOPE_A]: MEDIUM (score=38.0, consecutive=0, alert=False)
```

### CRITICAL Stage
```
STAGE: 3 — CRITICAL
Sending 2 critical readings for hysteresis compliance
>>> Critical reading 1/2 <<<
RISK [SLOPE_A]: HIGH (score=72.5, consecutive=1, alert=False)
>>> Critical reading 2/2 <<<
RISK [SLOPE_A]: HIGH (score=74.0, consecutive=2, alert=True)
INCIDENT #1: ALERT_TRIGGERED in SLOPE_A (risk=HIGH, score=74.0)
```

### ROCKFALL EVENT
```
STAGE: 4 — ROCKFALL EVENT
INCIDENT #2: ROCKFALL_EVENT in SLOPE_A (risk=HIGH, score=100.0)
Total incidents for SLOPE_A: 2
```

## How to Run Postman Tests

The collection is organised into folders:

- **Real Backend - Analysis** — the actual Spring Boot APIs
  (`POST /api/analysis/cv`, `GET /api/analysis/risk/{zoneId}`)
- **Services - Health Checks** — CV and ML health checks
- **Mock/Future API Tests** — the standalone mock server endpoints
  (telemetry, cv-results, predictions, risk status, incidents, rockfall events)

To run:

1. Open Postman
2. Import `postman/rockfall-api-collection.json`
3. Import `postman/rockfall-api-environment.json`
4. Select the "Rockfall Prediction - Local" environment
5. Set `baseUrl` to the mock server (8001) for Mock/Future tests, or
   `realBackendUrl` to the real backend (8080) for Real Backend tests.
6. Run the collection manually or via Collection Runner

The collection includes test scripts that validate:
- HTTP status codes
- Response JSON structure (cvResult / riskResult for real APIs)
- Risk level correctness for each mock scenario
- Incident recording
- CV and ML health

## How to Run Newman Tests

Install Newman globally (or use npx):

```bash
npm install -g newman
```

Run the collection (mock tests — start the mock server first):

```bash
newman run postman/rockfall-api-collection.json \
  -e postman/rockfall-api-environment.json \
  --reporters cli
```

Or with HTML report:

```bash
newman run postman/rockfall-api-collection.json \
  -e postman/rockfall-api-environment.json \
  --reporters cli,htmlextra
```

Make sure the relevant service is running before executing Newman tests:
the mock server (`python -m src.mock_server`) for Mock/Future tests, or the
real Spring Boot backend / CV / ML services for the Real Backend tests.

## API Endpoints Reference

### Real Backend (`http://localhost:8080`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analysis/cv` | Analyze an image (multipart: `image` + `zone_id`) → returns `cvResult` + `riskResult` |
| `GET` | `/api/analysis/risk/{zoneId}` | Get ML risk for a zone |
| `GET` | `/` | Backend root (availability probe) |

### Services

| Method | Endpoint | Service |
|---|---|---|
| `GET` | `/health` | CV service (`http://localhost:8000`) |
| `GET` | `/health` | ML risk engine (`http://127.0.0.1:9000`) |

### Mock Server (`http://localhost:8001`) — Mock/Future APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Mock health check |
| `POST` | `/api/telemetry` | Receive sensor telemetry |
| `POST` | `/api/cv-results` | Receive CV analysis results |
| `POST` | `/api/predictions` | Run risk prediction |
| `GET` | `/api/risk/current` | Get current risk state |
| `GET` | `/api/incidents` | Get incident/history log |
| `GET` | `/api/zones` | List configured zones |
| `POST` | `/api/rockfall/event` | Record a rockfall event |
| `GET` | `/api/rockfall/history` | Get rockfall event history |

## Demo Calibration Ranges

These are NOT geological standards — they are simulation values for reliable demo execution.

### SAFE
| Sensor | Range | Unit |
|---|---|---|
| Rainfall | 1.0 – 6.0 | mm |
| Humidity | 50 – 70 | % |
| Temperature | 25 – 35 | °C |
| Vibration | 0.5 – 2.0 | mm/s |
| Deformation | 0.5 – 3.0 | mm |
| Crack Detected | false | — |
| Crack Severity | NONE | — |

### WARNING
| Sensor | Range | Unit |
|---|---|---|
| Rainfall | 15 – 28 | mm |
| Humidity | 70 – 85 | % |
| Temperature | 22 – 34 | °C |
| Vibration | 2.5 – 5.0 | mm/s |
| Deformation | 5.0 – 9.0 | mm |
| Crack Detected | true | — |
| Crack Severity | MEDIUM | — |

### CRITICAL
| Sensor | Range | Unit |
|---|---|---|
| Rainfall | 35 – 50 | mm |
| Humidity | 85 – 95 | % |
| Temperature | 20 – 32 | °C |
| Vibration | 5.5 – 9.0 | mm/s |
| Deformation | 9.0 – 16.0 | mm |
| Crack Detected | true | — |
| Crack Severity | HIGH | — |

## Troubleshooting

### Backend/mock connection refused
- For standalone testing, ensure the mock server is running: `python -m src.mock_server`
- Check the port (default 8001): `curl http://localhost:8001/health`
- Verify `BACKEND_URL` in your `.env` matches the running server (mock or real backend)
- For the real integrated demo, start the real backend separately and set `BACKEND_URL` to it

### Authentication errors (401)
- If `API_KEY` is set on the server, ensure the same key is in your `.env`
- Or leave `API_KEY` empty on both sides for open access

### Validation errors (422)
- All fields in telemetry payload are required: `zone_id`, `rainfall_mm`, `humidity`, `temperature`, `vibration`
- `crack_severity` must be one of: `NONE`, `LOW`, `MEDIUM`, `HIGH`

### Alert not firing during CRITICAL stage
- The backend uses hysteresis: alert fires only after `CRITICAL_READINGS_NEEDED` (default 2) consecutive HIGH-risk readings
- The simulator handles this automatically in `run_critical()`

### Random values too unpredictable
- Adjust `RANDOM_VARIATION` (default 0.1 = ±10%) to reduce variance
- Set to 0.0 for deterministic output

## Integration with Other Modules

Harshith's module is **Data Simulation + Testing**. It POSTs data to the backend; it does
not replace or duplicate it. The driver does:

1. Sending telemetry to the backend API (`POST /api/telemetry`)
2. Sending CV analysis results (`POST /api/cv-results`) — simulating what the `computer-vision` module produces
3. Triggering risk predictions (`POST /api/predictions`) — simulating what the `ml-model` module computes
4. Recording rockfall events (`POST /api/rockfall/event`) for incident history

The simulator's target backend is configured through the `BACKEND_URL` environment
variable (see `src/http_client.py`). By default it points at `http://localhost:8001`,
which works with the bundled mock server for standalone testing. For the real integrated
demo, set `BACKEND_URL` to the actual backend and start it separately — the mock server
is not required for the production demo.
