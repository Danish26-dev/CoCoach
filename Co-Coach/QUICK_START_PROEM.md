# 🚀 Quick Start - ProEm Page

## Fastest Way to Run (3 Steps)

### Step 1: Install Python Dependencies
```bash
pip install flask flask-login flask-sqlalchemy bcrypt
```

### Step 2: Start the Server
```bash
python app.py
```

### Step 3: Open in Browser
Go to: **http://localhost:5000/proem.html**

---

## Even Faster (Windows)

**Double-click:** `start-proem.bat`

This will automatically:
- Install dependencies
- Start the server
- Show you the URL

---

## Even Faster (Mac/Linux)

**Run:**
```bash
chmod +x start-proem.sh
./start-proem.sh
```

---

## Access Methods

### Method 1: Direct Access (No Login)
- URL: `http://localhost:5000/proem.html`
- ⚠️ Note: API calls will fail, but UI works great for demos

### Method 2: With Login (Full Functionality)
1. Go to: `http://localhost:5000`
2. Login with any email/password (creates account automatically)
3. Click "ProEm" in sidebar
4. ✅ All features work including workout history

---

## Troubleshooting

### "Port 5000 already in use"
**Solution:** Change port in `app.py` line 182:
```python
app.run(host='0.0.0.0', port=8000, debug=False)  # Changed to 8000
```

### "Module not found"
**Solution:** Install dependencies:
```bash
pip install flask flask-login flask-sqlalchemy bcrypt
```

### API Errors in Browser
**Solution:** This is normal if not logged in. The page will show with default/demo data.

---

## For Hackathon Demo

### Best Setup:
1. ✅ Start Flask server: `python app.py`
2. ✅ Open: `http://localhost:5000/proem.html`
3. ✅ Enable "Demo Mode" (top-right toggle)
4. ✅ Show all sections by scrolling

### Demo Features to Highlight:
- 🎯 Hero section with AI badges
- 📊 Animated counters
- 🤖 AI showcase sections
- 📈 Enhanced charts
- 🏆 Achievement badges
- 💬 Voice support
- 📱 Mobile responsive design

---

## What You'll See

1. **Hero Section** - Key metrics at top
2. **Demo Mode Toggle** - Top-right corner
3. **7 Main Sections:**
   - Last Workout
   - Current Workout
   - Progress
   - Form Quality Score
   - Elite Athlete Metrics
   - Performance Forecasting
   - Voice Emotional Support

4. **Progress Indicator** - Bottom-right (shows current section)

---

## Need Help?

- Check browser console (F12) for errors
- Ensure server is running
- Try Chrome or Edge browser
- See `START_PROEM.md` for detailed instructions

---

**That's it! You're ready to demo ProEm! 🎉**

