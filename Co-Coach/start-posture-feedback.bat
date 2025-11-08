@echo off
echo ============================================
echo   Live Golf Posture Feedback - CoCoach
echo ============================================
echo.
echo Starting local server...
echo.
echo The app will open in your default browser.
echo.
echo [IMPORTANT] Grant camera permissions when prompted!
echo.
echo Press Ctrl+C to stop the server when done.
echo.
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Start Python HTTP server
cd /d "%~dp0"
start "" "http://localhost:8000/live-posture-feedback.html"
python -m http.server 8000

pause
