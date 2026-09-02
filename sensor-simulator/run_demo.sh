#!/usr/bin/env bash
# ============================================================
#  AI Rockfall Prediction — Demo Launcher (Linux/Mac)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "  AI-Based Rockfall Prediction & Alert System"
echo "  Sensor Simulator — Demo Launcher"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "ERROR: Python3 not found. Please install Python 3.10+."
    exit 1
fi

# Install deps if needed
if ! python3 -c "import fastapi" &>/dev/null; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
fi

echo "Starting mock server on port 8001 (standalone testing only)..."
echo "(Press Ctrl+C to stop)"
echo ""

# Start mock server in background
python3 -m src.mock_server &
BACKEND_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "Running full demo..."
echo ""

# Run the simulator (pass any extra args)
python3 main.py "$@"

echo ""
echo "Demo complete. Stopping backend..."
kill $BACKEND_PID 2>/dev/null || true
echo "Done."
