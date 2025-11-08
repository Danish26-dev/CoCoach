# Live Golf Posture Feedback - Startup Script
# PowerShell version

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Live Golf Posture Feedback - CoCoach" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting local server..." -ForegroundColor Yellow
Write-Host ""

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if Python is installed
$pythonInstalled = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonInstalled) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://www.python.org/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[SUCCESS] Python detected" -ForegroundColor Green
Write-Host ""
Write-Host "Server will start on: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Opening browser..." -ForegroundColor Yellow
Write-Host ""
Write-Host "[IMPORTANT] Grant camera permissions when prompted!" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Ctrl+C to stop the server when done." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Open browser
Start-Process "http://localhost:8000/live-posture-feedback.html"

# Start Python HTTP server
python -m http.server 8000
