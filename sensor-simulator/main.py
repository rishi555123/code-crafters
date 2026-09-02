"""
Sensor Simulator — Entry Point

The simulator supports TWO modes:

REAL INTEGRATION MODE  (--mode real):
  Sends real image files to the actual Spring Boot backend.
    python main.py --mode real --scenario safe|warning|critical
    python main.py --mode real --demo
    python main.py --mode real --check

MOCK DEMO MODE  (default, preserved):
  Runs the SAFE->WARNING->CRITICAL->ROCKFALL demo against the bundled
  standalone mock server (NOT the production backend).
    python main.py                       # full mock demo
    python main.py --stage safe|warning|critical|rockfall
    python main.py --zone SLOPE_B
    python main.py --status
    python main.py --incidents
    python main.py --zones
"""

import sys
import signal
import logging
import argparse
from datetime import datetime, timezone

from scenarios.runner import (
    run_full_demo, run_safe, run_warning, run_critical, run_rockfall
)
from src import http_client as api
from src.real_runner import (
    check_all_services, run_real_scenario, run_real_demo,
)
from config.real_scenarios import ALL_SCENARIOS
from config.settings import DEFAULT_ZONE_ID, REAL_BACKEND_URL, BACKEND_URL, CV_SERVICE_URL, ML_SERVICE_URL


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    # Suppress noisy HTTP client logs
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def handle_signal(signum, frame):
    print("\n\nSimulation interrupted by user. Cleaning up...")
    sys.exit(0)


def main():
    setup_logging()
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    parser = argparse.ArgumentParser(
        description="AI Rockfall Prediction — Sensor Simulator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
REAL INTEGRATION MODE (--mode real):
  python main.py --mode real --scenario safe      # analyze safe image
  python main.py --mode real --scenario warning
  python main.py --mode real --scenario critical
  python main.py --mode real --demo               # safe -> warning -> critical
  python main.py --mode real --check              # check backend/CV/ML health

MOCK DEMO MODE (default):
  python main.py                                  # full mock demo
  python main.py --stage safe                     # run SAFE stage only
  python main.py --stage critical                 # run CRITICAL stage only
  python main.py --zone SLOPE_B                   # use a different zone
  python main.py --status                         # show current risk status
  python main.py --incidents                      # show incident history
        """,
    )
    parser.add_argument(
        "--mode",
        choices=["real", "mock"],
        default="mock",
        help="real = actual Spring Boot backend (image analysis); "
             "mock = bundled standalone mock server (default, preserved)",
    )
    parser.add_argument(
        "--stage",
        choices=["safe", "warning", "critical", "rockfall"],
        help="MOCK mode: run a specific demo stage (default: full demo)",
    )
    parser.add_argument(
        "--scenario",
        choices=ALL_SCENARIOS,
        dest="real_scenario",
        help="REAL mode: run a specific scenario (safe|warning|critical)",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="REAL mode: run all supported scenarios sequentially",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="REAL mode: check availability of backend/CV/ML and exit",
    )
    parser.add_argument(
        "--zone",
        default=None,
        help=f"Override zone ID (default: per-scenario zone, e.g. {DEFAULT_ZONE_ID})",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="MOCK mode: show current risk status and exit",
    )
    parser.add_argument(
        "--incidents",
        action="store_true",
        help="MOCK mode: show incident history and exit",
    )
    parser.add_argument(
        "--zones",
        action="store_true",
        help="MOCK mode: list configured zones and exit",
    )

    args = parser.parse_args()

    print(f"")
    print(f"  AI Rockfall Prediction — Sensor Simulator")
    print(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    if args.mode == "real":
        print(f"  Mode: REAL INTEGRATION")
        print(f"  Backend: {REAL_BACKEND_URL}")
        print(f"  CV:      {CV_SERVICE_URL}")
        print(f"  ML:      {ML_SERVICE_URL}")
    else:
        print(f"  Mode: MOCK DEMO (standalone mock server — NOT production)")
        print(f"  Backend: {BACKEND_URL}")
    print(f"")

    # ------------------------------------------------------------------
    # REAL INTEGRATION MODE
    # ------------------------------------------------------------------
    if args.mode == "real":
        if args.check:
            check_all_services()
            return

        if args.real_scenario:
            zone = args.zone  # optional override
            run_real_scenario(args.real_scenario, zone)
            return

        if args.demo:
            run_real_demo()
            return

        log = logging.getLogger("simulator.cli")
        log.warning("Real mode requires --scenario <safe|warning|critical>, "
                    "--demo, or --check.")
        parser.print_help()
        return

    # ------------------------------------------------------------------
    # MOCK DEMO MODE (default, preserved)
    # ------------------------------------------------------------------
    effective_zone = args.zone or DEFAULT_ZONE_ID

    if args.status:
        result = api.get_risk(effective_zone)
        print(f"\nRisk status for {effective_zone}:")
        print(f"  {result}")
        return

    if args.incidents:
        result = api.get_incidents(effective_zone)
        print(f"\nIncidents for {effective_zone}:")
        for inc in result.get("incidents", []):
            print(f"  #{inc['id']} [{inc['event_type']}] {inc['risk_level']} "
                  f"(score={inc['risk_score']}) at {inc['timestamp']}")
        if not result.get("incidents"):
            print("  No incidents recorded.")
        return

    if args.zones:
        result = api.get_zones()
        print(f"\nConfigured zones:")
        for z in result.get("zones", []):
            print(f"  {z['zone_id']}: risk={z['risk_level']} score={z['risk_score']}")
        return

    if args.stage:
        stage_map = {
            "safe": run_safe,
            "warning": run_warning,
            "critical": run_critical,
            "rockfall": run_rockfall,
        }
        stage_map[args.stage](effective_zone)
    else:
        run_full_demo(effective_zone)


if __name__ == "__main__":
    main()
