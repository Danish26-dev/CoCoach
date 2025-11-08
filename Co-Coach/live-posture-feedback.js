// Live Golf Posture Feedback - Main JavaScript
// Uses MediaPipe Pose for real-time posture analysis

class PostureFeedbackSystem {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.isRunning = false;
        this.currentDrill = null;
        this.lastFeedbackTime = 0;
        this.feedbackCooldown = 3000; // 3 seconds between voice feedback
        this.sessionStartTime = null;
        
        // Speech synthesis
        this.synth = window.speechSynthesis;
        this.isSpeaking = false;
        
        // Posture metrics
        this.metrics = {
            spineTilt: 0,
            kneeBend: 0,
            shoulderLevel: 0,
            hipRotation: 0,
            headTilt: 0
        };
        
        // Reference ranges (ideal values)
        this.idealRanges = {
            spineTilt: { min: 35, max: 45, name: "Spine Tilt" },
            kneeBend: { min: 15, max: 25, name: "Knee Bend" },
            shoulderLevel: { min: -5, max: 5, name: "Shoulder Level" },
            hipRotation: { min: 20, max: 45, name: "Hip Rotation" },
            headTilt: { min: -10, max: 10, name: "Head Tilt" }
        };
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.initializePose();
    }
    
    setupElements() {
        this.elements = {
            webcam: document.getElementById('webcam'),
            canvas: document.getElementById('canvas'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            feedbackOverlay: document.getElementById('feedbackOverlay'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            mainContent: document.getElementById('mainContent'),
            drillsSection: document.getElementById('drillsSection'),
            sessionSummary: document.getElementById('sessionSummary'),
            
            // Metrics displays
            spineTilt: document.getElementById('spineTilt'),
            spineTiltStatus: document.getElementById('spineTiltStatus'),
            kneeBend: document.getElementById('kneeBend'),
            kneeBendStatus: document.getElementById('kneeBendStatus'),
            shoulderLevel: document.getElementById('shoulderLevel'),
            shoulderLevelStatus: document.getElementById('shoulderLevelStatus'),
            hipRotation: document.getElementById('hipRotation'),
            hipRotationStatus: document.getElementById('hipRotationStatus'),
            headTilt: document.getElementById('headTilt'),
            headTiltStatus: document.getElementById('headTiltStatus')
        };
        
        this.canvasCtx = this.elements.canvas.getContext('2d');
    }
    
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startSession());
        this.elements.stopBtn.addEventListener('click', () => this.stopSession());
        
        // Drill card clicks
        document.querySelectorAll('.drill-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const drill = e.currentTarget.getAttribute('data-drill');
                this.selectDrill(drill);
            });
        });
        
        // Struggle option buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const struggle = e.currentTarget.getAttribute('data-struggle');
                this.showRecommendedDrills(struggle);
            });
        });
    }
    
    async initializePose() {
        try {
            this.elements.loadingSpinner.style.display = 'block';
            
            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });
            
            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            
            this.pose.onResults((results) => this.onPoseResults(results));
            
            // Hide loading, show main content
            setTimeout(() => {
                this.elements.loadingSpinner.style.display = 'none';
                this.elements.mainContent.style.display = 'grid';
                this.elements.drillsSection.style.display = 'block';
            }, 1000);
            
        } catch (error) {
            console.error('Error initializing pose:', error);
            this.showFeedback('Failed to initialize AI Coach. Please refresh.', 'error');
        }
    }
    
    async startSession() {
        try {
            this.sessionStartTime = Date.now();
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            
            this.elements.webcam.srcObject = stream;
            await this.elements.webcam.play();
            
            this.camera = new Camera(this.elements.webcam, {
                onFrame: async () => {
                    await this.pose.send({ image: this.elements.webcam });
                },
                width: 1280,
                height: 720
            });
            
            this.camera.start();
            this.isRunning = true;
            
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            
            this.speak("Let's perfect your golf posture. Position yourself in the frame.");
            this.showFeedback("Session started - Show me your stance!", 'correct');
            
        } catch (error) {
            console.error('Error starting session:', error);
            this.showFeedback('Camera access denied. Please enable camera.', 'error');
        }
    }
    
    stopSession() {
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.elements.webcam.srcObject) {
            this.elements.webcam.srcObject.getTracks().forEach(track => track.stop());
        }
        
        this.isRunning = false;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        
        // Show session summary
        this.elements.sessionSummary.classList.add('show');
        this.speak("Great session! Let's identify areas to improve.");
        
        this.showFeedback("Session ended", 'warning');
    }
    
    onPoseResults(results) {
        if (!results.poseLandmarks) {
            this.showFeedback("Step into frame - I can't see you yet", 'warning');
            return;
        }
        
        // Draw pose on canvas
        this.drawPose(results);
        
        // Analyze posture
        this.analyzePosture(results.poseLandmarks);
        
        // Update UI metrics
        this.updateMetricsDisplay();
        
        // Provide feedback based on current drill or general posture
        if (this.currentDrill) {
            this.provideDrillFeedback(results.poseLandmarks);
        } else {
            this.provideGeneralFeedback();
        }
    }
    
    drawPose(results) {
        const canvasElement = this.elements.canvas;
        const canvasCtx = this.canvasCtx;
        
        canvasElement.width = this.elements.webcam.videoWidth;
        canvasElement.height = this.elements.webcam.videoHeight;
        
        // Clear canvas
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // Draw video frame
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
        // Draw pose landmarks with glow effect
        if (results.poseLandmarks) {
            // Draw connections
            drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: 'rgba(0, 178, 255, 0.6)',
                lineWidth: 4
            });
            
            // Draw landmarks with glow
            for (const landmark of results.poseLandmarks) {
                canvasCtx.beginPath();
                canvasCtx.arc(
                    landmark.x * canvasElement.width,
                    landmark.y * canvasElement.height,
                    8, 0, 2 * Math.PI
                );
                canvasCtx.fillStyle = 'rgba(30, 249, 161, 0.8)';
                canvasCtx.shadowBlur = 15;
                canvasCtx.shadowColor = 'rgba(30, 249, 161, 0.8)';
                canvasCtx.fill();
            }
        }
        
        canvasCtx.restore();
    }
    
    analyzePosture(landmarks) {
        // Calculate spine tilt (angle from hip to shoulder)
        this.metrics.spineTilt = this.calculateSpineTilt(landmarks);
        
        // Calculate knee bend
        this.metrics.kneeBend = this.calculateKneeBend(landmarks);
        
        // Calculate shoulder level (difference in Y coordinates)
        this.metrics.shoulderLevel = this.calculateShoulderLevel(landmarks);
        
        // Calculate hip rotation
        this.metrics.hipRotation = this.calculateHipRotation(landmarks);
        
        // Calculate head tilt
        this.metrics.headTilt = this.calculateHeadTilt(landmarks);
    }
    
    calculateSpineTilt(landmarks) {
        const leftHip = landmarks[23];
        const leftShoulder = landmarks[11];
        
        const dx = leftShoulder.x - leftHip.x;
        const dy = leftShoulder.y - leftHip.y;
        
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle = Math.abs(90 - Math.abs(angle));
        
        return Math.round(angle);
    }
    
    calculateKneeBend(landmarks) {
        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];
        
        const angle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
        const bendAngle = 180 - angle;
        
        return Math.round(bendAngle);
    }
    
    calculateShoulderLevel(landmarks) {
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        
        const diff = (rightShoulder.y - leftShoulder.y) * 100;
        return Math.round(diff);
    }
    
    calculateHipRotation(landmarks) {
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        
        const dx = rightHip.x - leftHip.x;
        const dz = rightHip.z - leftHip.z;
        
        let angle = Math.atan2(dz, dx) * (180 / Math.PI);
        angle = Math.abs(angle);
        
        return Math.round(angle);
    }
    
    calculateHeadTilt(landmarks) {
        const nose = landmarks[0];
        const leftEar = landmarks[7];
        const rightEar = landmarks[8];
        
        const earMidY = (leftEar.y + rightEar.y) / 2;
        const tilt = (nose.y - earMidY) * 100;
        
        return Math.round(tilt);
    }
    
    calculateAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        
        if (angle > 180.0) {
            angle = 360 - angle;
        }
        
        return angle;
    }
    
    updateMetricsDisplay() {
        // Update spine tilt
        this.elements.spineTilt.textContent = this.metrics.spineTilt + '°';
        const spineGood = this.isInRange(this.metrics.spineTilt, this.idealRanges.spineTilt);
        this.updateMetricStatus('spineTilt', spineGood);
        
        // Update knee bend
        this.elements.kneeBend.textContent = this.metrics.kneeBend + '°';
        const kneeGood = this.isInRange(this.metrics.kneeBend, this.idealRanges.kneeBend);
        this.updateMetricStatus('kneeBend', kneeGood);
        
        // Update shoulder level
        this.elements.shoulderLevel.textContent = Math.abs(this.metrics.shoulderLevel) + '°';
        const shoulderGood = this.isInRange(this.metrics.shoulderLevel, this.idealRanges.shoulderLevel);
        this.updateMetricStatus('shoulderLevel', shoulderGood);
        
        // Update hip rotation
        this.elements.hipRotation.textContent = this.metrics.hipRotation + '°';
        const hipGood = this.isInRange(this.metrics.hipRotation, this.idealRanges.hipRotation);
        this.updateMetricStatus('hipRotation', hipGood);
        
        // Update head tilt
        this.elements.headTilt.textContent = Math.abs(this.metrics.headTilt) + '°';
        const headGood = this.isInRange(Math.abs(this.metrics.headTilt), { min: 0, max: 10 });
        this.updateMetricStatus('headTilt', headGood);
    }
    
    updateMetricStatus(metricName, isGood) {
        const metricItem = this.elements[metricName].closest('.metric-item');
        const statusElement = this.elements[metricName + 'Status'];
        
        if (isGood) {
            metricItem.classList.add('good');
            metricItem.classList.remove('bad');
            statusElement.classList.remove('error');
            statusElement.textContent = '✓ Perfect';
        } else {
            metricItem.classList.remove('good');
            metricItem.classList.add('bad');
            statusElement.classList.add('error');
            statusElement.textContent = '✗ Needs adjustment';
        }
    }
    
    isInRange(value, range) {
        return value >= range.min && value <= range.max;
    }
    
    provideGeneralFeedback() {
        const now = Date.now();
        if (now - this.lastFeedbackTime < this.feedbackCooldown) {
            return;
        }
        
        const issues = [];
        const good = [];
        
        // Check each metric
        if (!this.isInRange(this.metrics.spineTilt, this.idealRanges.spineTilt)) {
            if (this.metrics.spineTilt < this.idealRanges.spineTilt.min) {
                issues.push("Your spine is too upright — lean slightly forward");
            } else {
                issues.push("You're bending too far forward — straighten up a bit");
            }
        } else {
            good.push("spine angle");
        }
        
        if (!this.isInRange(this.metrics.kneeBend, this.idealRanges.kneeBend)) {
            if (this.metrics.kneeBend < this.idealRanges.kneeBend.min) {
                issues.push("Bend your knees more — you're too stiff");
            } else {
                issues.push("Your knees are too bent — stand up slightly");
            }
        } else {
            good.push("knee bend");
        }
        
        if (!this.isInRange(this.metrics.shoulderLevel, this.idealRanges.shoulderLevel)) {
            issues.push("Level your shoulders — one is higher than the other");
        } else {
            good.push("shoulder alignment");
        }
        
        if (!this.isInRange(this.metrics.hipRotation, this.idealRanges.hipRotation)) {
            if (this.metrics.hipRotation < this.idealRanges.hipRotation.min) {
                issues.push("Rotate your hips more for better power");
            } else {
                issues.push("You're over-rotating your hips — reduce the twist");
            }
        } else {
            good.push("hip rotation");
        }
        
        if (Math.abs(this.metrics.headTilt) > 10) {
            if (this.metrics.headTilt > 0) {
                issues.push("Lift your head — keep your eyes on the ball");
            } else {
                issues.push("Lower your head slightly — don't look up too much");
            }
        } else {
            good.push("head position");
        }
        
        // Provide feedback
        if (issues.length === 0) {
            this.showFeedback("Excellent posture — perfect golf stance! 🏌️", 'correct');
            this.speak("Excellent posture! Perfect golf stance!");
            this.lastFeedbackTime = now;
        } else if (issues.length === 1) {
            this.showFeedback(issues[0], 'warning');
            this.speak(issues[0]);
            this.lastFeedbackTime = now;
        } else {
            // Pick the most important issue
            this.showFeedback(issues[0], 'error');
            this.speak(issues[0]);
            this.lastFeedbackTime = now;
        }
    }
    
    selectDrill(drillName) {
        // Remove active class from all cards
        document.querySelectorAll('.drill-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to selected card
        const selectedCard = document.querySelector(`[data-drill="${drillName}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
        
        this.currentDrill = drillName;
        this.lastFeedbackTime = 0; // Reset cooldown for new drill
        
        const drillMessages = {
            'wall-back': "Wall-Back Alignment drill activated. Keep your spine straight and head aligned.",
            'hip-twist': "Hip Twist drill activated. Focus on controlled hip rotation.",
            'air-swing': "Air Swing drill activated. Coordinate your shoulder and hip movement.",
            'shoulder-tilt': "Shoulder Tilt Control drill activated. Keep your shoulders level.",
            'balance': "Balance drill activated. Hold steady on one leg."
        };
        
        this.speak(drillMessages[drillName]);
        this.showFeedback(drillMessages[drillName], 'correct');
    }
    
    provideDrillFeedback(landmarks) {
        const now = Date.now();
        if (now - this.lastFeedbackTime < this.feedbackCooldown) {
            return;
        }
        
        switch (this.currentDrill) {
            case 'wall-back':
                this.wallBackFeedback();
                break;
            case 'hip-twist':
                this.hipTwistFeedback();
                break;
            case 'air-swing':
                this.airSwingFeedback();
                break;
            case 'shoulder-tilt':
                this.shoulderTiltFeedback();
                break;
            case 'balance':
                this.balanceFeedback();
                break;
        }
        
        this.lastFeedbackTime = now;
    }
    
    wallBackFeedback() {
        const spineOk = this.isInRange(this.metrics.spineTilt, { min: 85, max: 95 });
        const headOk = Math.abs(this.metrics.headTilt) < 5;
        
        if (spineOk && headOk) {
            this.speak("Perfect alignment! Your back is straight and head is level.");
            this.showFeedback("✓ Perfect alignment!", 'correct');
        } else if (!spineOk) {
            this.speak("Straighten your back against the imaginary wall.");
            this.showFeedback("Straighten your back", 'warning');
        } else {
            this.speak("Adjust your head position to align with your spine.");
            this.showFeedback("Align your head", 'warning');
        }
    }
    
    hipTwistFeedback() {
        const hipOk = this.isInRange(this.metrics.hipRotation, this.idealRanges.hipRotation);
        
        if (hipOk) {
            this.speak("Great hip rotation! That's the sweet spot.");
            this.showFeedback("✓ Optimal hip rotation!", 'correct');
        } else if (this.metrics.hipRotation < this.idealRanges.hipRotation.min) {
            this.speak("Twist your hips more. You need greater rotation.");
            this.showFeedback("Increase hip rotation", 'warning');
        } else {
            this.speak("You're over-rotating. Reduce the twist slightly.");
            this.showFeedback("Reduce hip rotation", 'warning');
        }
    }
    
    airSwingFeedback() {
        const shoulderOk = this.isInRange(this.metrics.shoulderLevel, this.idealRanges.shoulderLevel);
        const hipOk = this.isInRange(this.metrics.hipRotation, this.idealRanges.hipRotation);
        
        if (shoulderOk && hipOk) {
            this.speak("Beautiful coordination! Shoulders and hips moving perfectly together.");
            this.showFeedback("✓ Perfect swing coordination!", 'correct');
        } else if (!shoulderOk) {
            this.speak("Focus on keeping your shoulders level during the swing.");
            this.showFeedback("Level your shoulders", 'warning');
        } else {
            this.speak("Adjust your hip rotation to match your shoulder movement.");
            this.showFeedback("Sync hip and shoulder movement", 'warning');
        }
    }
    
    shoulderTiltFeedback() {
        const shoulderOk = this.isInRange(this.metrics.shoulderLevel, this.idealRanges.shoulderLevel);
        
        if (shoulderOk) {
            this.speak("Excellent! Your shoulders are perfectly level.");
            this.showFeedback("✓ Shoulders perfectly level!", 'correct');
        } else {
            const leftHigher = this.metrics.shoulderLevel > 0;
            const side = leftHigher ? "left" : "right";
            this.speak(`Your ${side} shoulder is higher. Level them out.`);
            this.showFeedback(`Lower your ${side} shoulder`, 'warning');
        }
    }
    
    balanceFeedback() {
        const stability = Math.abs(this.metrics.headTilt) + Math.abs(this.metrics.shoulderLevel);
        
        if (stability < 10) {
            this.speak("Rock solid balance! You're holding steady.");
            this.showFeedback("✓ Excellent stability!", 'correct');
        } else if (stability < 20) {
            this.speak("Good balance, but try to reduce the sway.");
            this.showFeedback("Reduce body sway", 'warning');
        } else {
            this.speak("You're losing balance. Engage your core and stabilize.");
            this.showFeedback("Stabilize your stance", 'error');
        }
    }
    
    showFeedback(message, type = 'warning') {
        this.elements.feedbackOverlay.textContent = message;
        this.elements.feedbackOverlay.className = 'feedback-overlay ' + type;
    }
    
    speak(text) {
        if (this.isSpeaking || !this.synth) return;
        
        // Cancel any ongoing speech
        this.synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
        };
        
        utterance.onerror = () => {
            this.isSpeaking = false;
        };
        
        this.synth.speak(utterance);
    }
    
    showRecommendedDrills(struggle) {
        const recommendations = {
            balance: {
                title: "Balance-Focused Drills",
                drills: ['balance', 'wall-back'],
                message: "These drills will help improve your stability and body control."
            },
            rotation: {
                title: "Rotation-Focused Drills",
                drills: ['hip-twist', 'air-swing'],
                message: "These drills will enhance your rotational power and coordination."
            },
            alignment: {
                title: "Alignment-Focused Drills",
                drills: ['wall-back', 'shoulder-tilt'],
                message: "These drills will perfect your body alignment and posture."
            }
        };
        
        const rec = recommendations[struggle];
        if (!rec) return;
        
        const html = `
            <div style="background: rgba(0,178,255,0.05); border: 1px solid rgba(0,178,255,0.2); 
                        border-radius: 16px; padding: 24px; margin-top: 20px;">
                <h3 style="color: #F5F5F5; font-size: 18px; font-weight: 600; margin-bottom: 12px;">
                    ${rec.title}
                </h3>
                <p style="color: #9CA3AF; font-size: 14px; margin-bottom: 16px;">
                    ${rec.message}
                </p>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    ${rec.drills.map(drill => `
                        <button onclick="system.selectDrill('${drill}')" 
                                style="padding: 12px 24px; background: linear-gradient(135deg, #00B2FF, #1EF9A1);
                                       border: none; border-radius: 10px; color: #0A0B0F; 
                                       font-weight: 600; cursor: pointer;">
                            Start ${drill.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Drill
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('recommendedDrills').innerHTML = html;
        this.speak(rec.message);
    }
}

// Initialize the system when page loads
let system;

window.addEventListener('load', () => {
    system = new PostureFeedbackSystem();
});

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}
