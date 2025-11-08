#!/bin/bash

echo "Starting CoCoach ProEm Server..."
echo ""
echo "Installing dependencies..."
pip3 install flask flask-login flask-sqlalchemy bcrypt > /dev/null 2>&1
echo ""
echo "Starting Flask server on http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
python3 app.py

