# Live Golf Posture Feedback - Documentation

## Overview
A real-time athletic performance coaching system using MediaPipe Pose detection and Web Speech API for voice coaching. The system provides instant feedback on form and technique across multiple sports without any scoring system.

## Features

### 🎯 Core Functionality
- **Real-time Pose Detection**: Uses MediaPipe Pose to track full-body landmarks via webcam
- **Continuous Analysis**: Monitors golf stance and swing posture in real-time
- **Voice + Text Feedback**: Provides natural, encouraging coaching through speech synthesis and on-screen text
- **No Scoring System**: Focus on improvement, not points

### 📊 Posture Metrics Analyzed
The system tracks and analyzes 5 key metrics:

1. **Spine Tilt** (Ideal: 35-45°)
   - Too upright: "Your spine is too upright — lean slightly forward"
   - Too bent: "You're bending too far forward — straighten up a bit"

2. **Knee Bend** (Ideal: 15-25°)
   - Too stiff: "Bend your knees more — you're too stiff"
   - Too bent: "Your knees are too bent — stand up slightly"

3. **Shoulder Line** (Ideal: Parallel to ground, ±5°)
   - Uneven: "Level your shoulders — one is higher than the other"

4. **Hip Rotation** (Ideal: 20-45°)
   - Too little: "Rotate your hips more for better power"
   - Too much: "You're over-rotating your hips — reduce the twist"

5. **Head Tilt** (Ideal: <10° deviation)
   - Dropping: "Lift your head — keep your eyes on the ball"
   - Lifting: "Lower your head slightly — don't look up too much"

### 🎮 Five Interactive Drills

Each drill focuses on specific aspects of posture and provides targeted feedback:

#### 1. 🧱 Wall-Back Alignment
**Purpose**: Perfect spine straightness and head position
**Analysis**: 
- Monitors spine straightness (85-95° for vertical alignment)
- Checks head alignment with spine
**Feedback**:
- ✓ "Perfect alignment! Your back is straight and head is level."
- ⚠ "Straighten your back against the imaginary wall."
- ⚠ "Adjust your head position to align with your spine."

#### 2. 🔄 Hip Twist Drill
**Purpose**: Master optimal hip rotation range
**Analysis**: 
- Tracks hip rotation angle (20-45° ideal)
**Feedback**:
- ✓ "Great hip rotation! That's the sweet spot."
- ⚠ "Twist your hips more. You need greater rotation."
- ⚠ "You're over-rotating. Reduce the twist slightly."

#### 3. 🏌️ Air Swing Simulation
**Purpose**: Coordinate shoulder and hip movement
**Analysis**: 
- Monitors shoulder level and hip rotation synchronization
- Checks timing between upper and lower body
**Feedback**:
- ✓ "Beautiful coordination! Shoulders and hips moving perfectly together."
- ⚠ "Focus on keeping your shoulders level during the swing."
- ⚠ "Adjust your hip rotation to match your shoulder movement."

#### 4. ⚖️ Shoulder Tilt Control
**Purpose**: Maintain level shoulders throughout swing
**Analysis**: 
- Measures shoulder height difference (ideal: ±5°)
**Feedback**:
- ✓ "Excellent! Your shoulders are perfectly level."
- ⚠ "Your left/right shoulder is higher. Level them out."

#### 5. 🦩 One-Leg Balance Hold
**Purpose**: Build stability and body control
**Analysis**: 
- Monitors body sway through head and shoulder movement
- Calculates overall stability score
**Feedback**:
- ✓ "Rock solid balance! You're holding steady." (sway <10)
- ⚠ "Good balance, but try to reduce the sway." (sway <20)
- ❌ "You're losing balance. Engage your core and stabilize." (sway ≥20)

### 💬 Post-Session Analysis

After stopping a session, users are asked:
**"Where do you feel you struggle most?"**

Options:
- 🦩 **Balance** → Recommends: Balance Hold + Wall-Back Alignment
- 🔄 **Rotation** → Recommends: Hip Twist + Air Swing Simulation
- 📏 **Alignment** → Recommends: Wall-Back Alignment + Shoulder Tilt Control

The system dynamically displays recommended drills with one-click access.

## Technical Stack

### Dependencies
- **MediaPipe Pose**: Real-time pose detection
- **MediaPipe Camera Utils**: Camera stream management
- **MediaPipe Drawing Utils**: Visualization utilities
- **Web Speech API**: Voice feedback synthesis
- **HTML5 Canvas**: Pose rendering

### Key Technologies
- Vanilla JavaScript (ES6+)
- HTML5 Canvas for real-time rendering
- CSS3 with gradient effects and animations
- MediaPipe JavaScript SDK

## UI/UX Design

### Color Scheme
Consistent with main CoCoach theme:
- **Background**: `#0A0B0F` (dark)
- **Cards**: `#1A1B20` (dark gray)
- **Primary Gradient**: `linear-gradient(135deg, #00B2FF, #1EF9A1)` (blue to green)
- **Success**: `#1EF9A1` (green glow)
- **Warning**: `#FFB200` (orange)
- **Error**: `#FF3B3B` (red)

### Visual Effects
- **Glow effects** when posture is correct
- **Animated highlights** on metric cards
- **Smooth transitions** (0.3s ease)
- **Pulsing gradient orbs** in background
- **Shadow effects** with color-coded borders

### Responsive Layout
- **Desktop**: 2-column grid (camera + metrics)
- **Tablet/Mobile**: Single column stack
- **Drills**: Auto-fit grid (250px min)

## Code Architecture

### Main Class: `PostureFeedbackSystem`

```javascript
class PostureFeedbackSystem {
    constructor()
    init()
    
    // Setup
    setupElements()
    setupEventListeners()
    initializePose()
    
    // Session Control
    startSession()
    stopSession()
    
    // Pose Analysis
    onPoseResults(results)
    analyzePosture(landmarks)
    
    // Metric Calculations
    calculateSpineTilt(landmarks)
    calculateKneeBend(landmarks)
    calculateShoulderLevel(landmarks)
    calculateHipRotation(landmarks)
    calculateHeadTilt(landmarks)
    calculateAngle(a, b, c)
    
    // Feedback System
    provideGeneralFeedback()
    provideDrillFeedback(landmarks)
    
    // Drill-Specific Feedback
    wallBackFeedback()
    hipTwistFeedback()
    airSwingFeedback()
    shoulderTiltFeedback()
    balanceFeedback()
    
    // UI Updates
    updateMetricsDisplay()
    updateMetricStatus(metricName, isGood)
    showFeedback(message, type)
    
    // Voice
    speak(text)
    
    // Utilities
    isInRange(value, range)
    selectDrill(drillName)
    showRecommendedDrills(struggle)
}
```

### Feedback Cooldown System
- **Cooldown Period**: 3 seconds between voice feedback
- **Purpose**: Prevent overwhelming the user with too many messages
- **Behavior**: Text feedback updates continuously, voice waits for cooldown

### Angle Calculation Methods

#### Spine Tilt
```
Calculate angle between hip-shoulder line and horizontal
Result: 0° (lying down) to 90° (standing straight)
```

#### Knee Bend
```
Calculate angle at knee joint (hip-knee-ankle)
Result: 180° - joint angle = bend angle
```

#### Shoulder Level
```
Y-coordinate difference between left and right shoulder
Normalized to percentage and converted to degrees
```

#### Hip Rotation
```
3D angle calculation using X and Z coordinates of hip landmarks
Measures forward/backward rotation
```

#### Head Tilt
```
Compare nose position to midpoint between ears
Detects forward/backward head tilt
```

## Usage Instructions

### For Users

1. **Start Session**
   - Click "Start Session" button
   - Grant camera permissions when prompted
   - Position yourself in frame (full body visible)

2. **Receive Feedback**
   - Watch real-time metrics on right panel
   - Listen to voice coaching
   - Read text feedback overlay on video

3. **Select a Drill** (Optional)
   - Click on any of the 5 drill cards
   - Follow drill-specific instructions
   - Active drill shows with green glow

4. **Stop Session**
   - Click "Stop Session" when done
   - Answer post-session question
   - Review recommended drills

### Best Practices for Users
- Ensure good lighting
- Stand 6-8 feet from camera
- Wear form-fitting clothing
- Clear background helps tracking
- Full body should be in frame

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+ (Recommended)
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Required Permissions
- 📹 **Camera Access**: Required for pose detection
- 🔊 **Audio Output**: Required for voice feedback

### Feature Support
- WebRTC (getUserMedia)
- Web Speech API (SpeechSynthesis)
- HTML5 Canvas
- ES6+ JavaScript

## Performance Optimization

### MediaPipe Configuration
```javascript
modelComplexity: 1        // Balance between accuracy and speed
smoothLandmarks: true      // Reduce jitter
minDetectionConfidence: 0.5
minTrackingConfidence: 0.5
```

### Canvas Rendering
- Uses `requestAnimationFrame` implicitly through MediaPipe
- Efficient drawing with minimal DOM updates
- Glow effects use CSS shadows (GPU-accelerated)

### Memory Management
- Properly stops camera streams on session end
- Clears speech synthesis queue
- Removes event listeners when needed

## Accessibility Features

### Voice Feedback
- Natural speech rate (1.0x)
- Moderate pitch (1.0)
- Clear volume (0.8)
- Encouraging tone

### Visual Feedback
- High contrast text (white on dark)
- Color-coded status (green/orange/red)
- Large, readable fonts
- Clear iconography

### Keyboard Support
- All buttons are keyboard accessible
- Tab navigation supported
- Enter/Space to activate buttons

## Future Enhancements

### Potential Features
- [ ] Session history tracking
- [ ] Video recording with annotations
- [ ] Comparison with pro golfer poses
- [ ] Multiple camera angles
- [ ] Export session reports
- [ ] Custom drill creation
- [ ] Social sharing of progress
- [ ] Mobile app version

### Technical Improvements
- [ ] WebGL-accelerated rendering
- [ ] TensorFlow.js custom models
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

## Troubleshooting

### Common Issues

**Camera not detected**
- Check browser permissions
- Try different browser
- Restart browser
- Check system camera settings

**Voice feedback not working**
- Check system volume
- Verify browser audio permissions
- Try Chrome (best speech synthesis support)

**Poor pose detection**
- Improve lighting
- Move closer/farther from camera
- Wear contrasting clothing
- Clear background

**Feedback not appearing**
- Ensure full body is in frame
- Check internet connection (for CDN)
- Refresh page
- Clear browser cache

## File Structure

```
nhce/
├── live-posture-feedback.html    # Main HTML page
├── live-posture-feedback.js      # Core JavaScript logic
├── profile.css                   # Shared styling
├── dashboard.css                 # Shared dashboard styling
└── LIVE_POSTURE_FEEDBACK_README.md
```

## Credits

- **Pose Detection**: Google MediaPipe
- **Design Theme**: CoCoach platform
- **Voice Synthesis**: Web Speech API
- **Icons**: Unicode emoji

## License

Part of the CoCoach platform. All rights reserved.

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
