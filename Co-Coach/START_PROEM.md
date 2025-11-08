# How to Run ProEm - Quick Start Guide

## Option 1: Using Flask Server (Recommended - Full Functionality)

This option provides full functionality including API endpoints for workout history.

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Steps

1. **Install Dependencies**
   ```bash
   pip install flask flask-login flask-sqlalchemy bcrypt
   ```

2. **Navigate to Project Directory**
   ```bash
   cd CoCoach-main
   ```

3. **Run the Flask Server**
   ```bash
   python app.py
   ```
   or
   ```bash
   python3 app.py
   ```

4. **Open in Browser**
   - Open your web browser
   - Go to: `http://localhost:5000`
   - Login with any credentials (or use the login page)
   - Navigate to ProEm page

## Option 2: Simple HTTP Server (Quick Demo - Limited Functionality)

This option is faster to start but API calls won't work. Good for viewing the UI.

### Steps

1. **Navigate to Project Directory**
   ```bash
   cd CoCoach-main
   ```

2. **Run Simple HTTP Server**
   ```bash
   python server.py
   ```
   or
   ```bash
   python3 server.py
   ```
   or using Python's built-in server:
   ```bash
   python -m http.server 5000
   ```

3. **Open in Browser**
   - Go to: `http://localhost:5000/proem.html`

## Option 3: Direct File Open (No Server - UI Only)

**Note:** Some features may not work due to browser security restrictions.

1. **Open File Directly**
   - Double-click `proem.html` in your file explorer
   - Or right-click → "Open with" → Your browser

**Limitations:**
- API calls will fail
- Some features may not work
- Best for viewing static content only

## Recommended: Quick Start Script

### Windows (PowerShell)
```powershell
cd CoCoach-main
python app.py
```

### Windows (Command Prompt)
```cmd
cd CoCoach-main
python app.py
```

### Mac/Linux
```bash
cd CoCoach-main
python3 app.py
```

## Accessing ProEm Page

Once the server is running:

1. **With Flask Server (app.py):**
   - Go to: `http://localhost:5000`
   - Login (or sign up)
   - Click on "ProEm" in the sidebar

2. **With Simple Server (server.py):**
   - Go to: `http://localhost:5000/proem.html`

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, you can:
- Change the port in `app.py` (line 182) or `server.py` (line 6)
- Or stop the process using port 5000

### Module Not Found Error
Install missing dependencies:
```bash
pip install flask flask-login flask-sqlalchemy bcrypt
```

### Database Error
The Flask app will create a SQLite database automatically on first run.

### API Calls Failing
- Make sure you're using the Flask server (app.py), not the simple server
- Check browser console for errors
- Ensure you're logged in (required for API access)

## Features to Test

Once running, test these ProEm features:

1. **Hero Section** - View key metrics at the top
2. **Demo Mode** - Toggle in top-right corner to see real-time updates
3. **Animated Counters** - Watch metrics count up
4. **Progress Indicator** - Scroll to see section tracking
5. **AI Showcase** - Read about AI algorithms
6. **Interactive Charts** - Hover over charts for details
7. **Achievement Badges** - Earn badges for streaks
8. **Voice Support** - Test voice interaction

## For Hackathon Presentation

### Best Setup:
1. Use Flask server (app.py) for full functionality
2. Have some workout data in the database for better demo
3. Enable Demo Mode for live updates
4. Use Chrome or Edge for best compatibility

### Presentation Tips:
- Show the hero section first
- Demonstrate Demo Mode toggle
- Scroll through sections to show progress indicator
- Highlight AI showcase sections
- Show animated counters
- Demonstrate voice support

## Need Help?

Check the browser console (F12) for any errors and ensure:
- Server is running
- Port is accessible
- Dependencies are installed
- Browser supports required features (Chrome/Edge recommended)

