@echo off
echo Starting CoCoach ProEm Server...
echo.
echo Installing dependencies...
pip install flask flask-login flask-sqlalchemy bcrypt >nul 2>&1
echo.
echo Starting Flask server on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
python app.py
pause

