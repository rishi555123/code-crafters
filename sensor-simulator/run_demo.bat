@echo off
REM ============================================================
REM  AI Rockfall Prediction — Demo Launcher (Windows)
REM ============================================================

setlocal

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo.
echo  AI-Based Rockfall Prediction ^& Alert System
echo  Sensor Simulator — Demo Launcher
echo.

REM Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.10+.
    exit /b 1
)

REM Check dependencies
python -c "import fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

echo Starting mock server on port 8001 (standalone testing only)...
echo (Press Ctrl+C to stop)
echo.

REM Start mock server in background
start "Rockfall Mock Server" python -m src.mock_server

REM Wait for server to start
timeout /t 3 /nobreak >nul

echo.
echo Running full demo...
echo.

REM Run the simulator
python main.py %*

echo.
echo Demo complete. Mock server is still running.
echo Close the "Rockfall Mock Server" window to stop it.
pause
