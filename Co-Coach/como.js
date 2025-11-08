// CoMo Page - Real-time Avatar Mirroring and Posture Feedback
// This script is scoped only to the CoMo page

(function() {
    'use strict';

    // State variables (scoped to this page only)
    let camera = null;
    let pose = null;
    let isRunning = false;
    let currentExercise = null;
    let speechSynthesis = window.speechSynthesis;
    let lastVoiceTime = 0;
    const VOICE_DELAY = 2000;

    // Three.js scene variables
    let scene, avatarCamera, renderer, avatarModel, avatarBones = {};
    let animationFrameId = null;

    // Smooth interpolation function
    function smooth(current, target, factor = 0.2) {
        return current + (target - current) * factor;
    }

    // Voice feedback function
    function speakFeedback(text) {
        const now = Date.now();
        if (now - lastVoiceTime < VOICE_DELAY) return;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 0.95;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
        lastVoiceTime = now;
    }

    // Text feedback function
    function showFeedback(message, type = 'info') {
        const container = document.getElementById('feedbackContainer');
        if (!container) return;

        const item = document.createElement('div');
        item.className = `feedback-item ${type}`;
        item.innerHTML = `<div>${message}</div>`;
        container.prepend(item);

        // Keep only last 15 items
        while (container.children.length > 15) {
            container.removeChild(container.lastChild);
        }
    }

    // Calculate angle between three points
    function calculateAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180) angle = 360 - angle;
        return angle;
    }

    // Exercise definitions with evaluation logic
    const exercises = {
        squat: {
            name: 'Squat',
            keypoints: ['left_hip', 'left_knee', 'left_ankle'],
            evaluatePose(landmarks) {
                const leftHip = landmarks[23];
                const leftKnee = landmarks[25];
                const leftAnkle = landmarks[27];
                const rightHip = landmarks[24];
                const rightKnee = landmarks[26];
                const rightAnkle = landmarks[28];
                const leftShoulder = landmarks[11];
                const rightShoulder = landmarks[12];

                const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
                const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
                const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

                const hipY = (leftHip.y + rightHip.y) / 2;
                const kneeY = (leftKnee.y + rightKnee.y) / 2;
                const hipDepth = Math.abs(hipY - kneeY);

                const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
                const hipX = (leftHip.x + rightHip.x) / 2;
                const spineAlignment = Math.abs(shoulderX - hipX);

                updateMetrics({
                    'Knee Angle': `${avgKneeAngle.toFixed(0)}°`,
                    'Hip Depth': hipDepth > 0.1 ? 'Good' : 'Shallow',
                    'Spine': spineAlignment < 0.05 ? 'Aligned' : 'Leaning'
                });

                if (avgKneeAngle >= 80 && avgKneeAngle <= 100) {
                    showFeedback('✅ Great squat depth!', 'good');
                } else if (avgKneeAngle >= 100) {
                    showFeedback('⬇️ Go lower!', 'warning');
                    speakFeedback('Go lower');
                } else {
                    showFeedback('⬆️ Don\'t go too low!', 'warning');
                }

                if (spineAlignment > 0.08) {
                    showFeedback('⬆️ Straighten your back', 'warning');
                    speakFeedback('Straighten your back');
                }
            }
        },
        pushup: {
            name: 'Push-up',
            keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
            evaluatePose(landmarks) {
                const leftShoulder = landmarks[11];
                const leftHip = landmarks[23];
                const leftAnkle = landmarks[27];
                const rightShoulder = landmarks[12];
                const rightHip = landmarks[24];
                const rightAnkle = landmarks[28];
                const leftElbow = landmarks[13];
                const rightElbow = landmarks[14];
                const leftWrist = landmarks[15];
                const rightWrist = landmarks[16];

                const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
                const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
                const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

                const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                const hipY = (leftHip.y + rightHip.y) / 2;
                const ankleY = (leftAnkle.y + rightAnkle.y) / 2;
                const bodyLineDeviation = Math.abs((shoulderY + ankleY) / 2 - hipY);

                updateMetrics({
                    'Elbow Angle': `${avgElbowAngle.toFixed(0)}°`,
                    'Body Line': bodyLineDeviation < 0.05 ? 'Straight' : 'Sagging'
                });

                if (avgElbowAngle >= 85 && avgElbowAngle <= 95) {
                    showFeedback('✅ Perfect push-up depth!', 'good');
                } else if (avgElbowAngle > 120) {
                    showFeedback('⬇️ Lower your chest more', 'warning');
                    speakFeedback('Go lower');
                }

                if (bodyLineDeviation > 0.06) {
                    showFeedback('⚠️ Engage core - keep body straight!', 'warning');
                    speakFeedback('Tighten your core');
                } else {
                    showFeedback('✅ Great body alignment!', 'good');
                }
            }
        },
        bicepcurl: {
            name: 'Bicep Curl',
            keypoints: ['left_shoulder', 'left_elbow', 'left_wrist'],
            evaluatePose(landmarks) {
                const leftShoulder = landmarks[11];
                const leftElbow = landmarks[13];
                const leftWrist = landmarks[15];
                const rightShoulder = landmarks[12];
                const rightElbow = landmarks[14];
                const rightWrist = landmarks[16];

                const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
                const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
                const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

                const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                const elbowY = (leftElbow.y + rightElbow.y) / 2;
                const wristY = (leftWrist.y + rightWrist.y) / 2;

                const armSymmetry = Math.abs(leftWrist.y - rightWrist.y);
                const fullRange = Math.abs(wristY - shoulderY);

                updateMetrics({
                    'Elbow Angle': `${avgElbowAngle.toFixed(0)}°`,
                    'Range': fullRange > 0.15 ? 'Full' : 'Partial',
                    'Symmetry': armSymmetry < 0.05 ? 'Balanced' : 'Uneven'
                });

                if (avgElbowAngle < 30) {
                    showFeedback('✅ Great curl! Full contraction', 'good');
                } else if (avgElbowAngle > 160) {
                    showFeedback('⬇️ Curl up - bring weights to shoulders', 'warning');
                    speakFeedback('Curl up');
                } else {
                    showFeedback('💪 Keep going!', 'good');
                }

                if (armSymmetry > 0.08) {
                    showFeedback('⚠️ Keep both arms in sync', 'warning');
                    speakFeedback('Sync your arms');
                }
            }
        },
        golfswing: {
            name: 'Golf Swing',
            keypoints: ['left_shoulder', 'left_hip', 'left_knee'],
            evaluatePose(landmarks) {
                const leftShoulder = landmarks[11];
                const rightShoulder = landmarks[12];
                const leftHip = landmarks[23];
                const rightHip = landmarks[24];
                const leftKnee = landmarks[25];
                const rightKnee = landmarks[26];

                const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
                const hipWidth = Math.abs(leftHip.x - rightHip.x);
                const shoulderHipAlignment = Math.abs((leftShoulder.x + rightShoulder.x) / 2 - (leftHip.x + rightHip.x) / 2);

                const leftKneeAngle = calculateAngle(leftHip, leftKnee, landmarks[27]);
                const rightKneeAngle = calculateAngle(rightHip, rightKnee, landmarks[28]);
                const kneeFlex = (leftKneeAngle + rightKneeAngle) / 2;

                updateMetrics({
                    'Posture': shoulderHipAlignment < 0.05 ? 'Aligned' : 'Leaning',
                    'Knee Flex': `${kneeFlex.toFixed(0)}°`,
                    'Stance': shoulderWidth > hipWidth * 1.2 ? 'Wide' : 'Narrow'
                });

                if (shoulderHipAlignment < 0.05 && kneeFlex > 150) {
                    showFeedback('✅ Good posture and stance!', 'good');
                } else if (shoulderHipAlignment > 0.08) {
                    showFeedback('⬆️ Keep your spine straight', 'warning');
                    speakFeedback('Straighten your spine');
                }

                if (kneeFlex < 150) {
                    showFeedback('⬆️ Slightly bend your knees', 'warning');
                    speakFeedback('Bend your knees slightly');
                }
            }
        }
    };

    // Update metrics display
    function updateMetrics(metrics) {
        const container = document.getElementById('metricsContainer');
        const display = document.getElementById('metricsDisplay');
        if (!container || !display) return;

        display.innerHTML = '';
        for (const [key, value] of Object.entries(metrics)) {
            const div = document.createElement('div');
            div.className = 'metric-display';
            div.innerHTML = `
                <span>${key}</span>
                <span>${value}</span>
            `;
            display.appendChild(div);
        }
        container.style.display = 'block';
    }

    // Initialize BlazePose
    function initializePose() {
        if (pose) return;

        pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        pose.onResults(onPoseResults);
    }

    // Handle pose detection results
    function onPoseResults(results) {
        if (!results.poseLandmarks || !isRunning) return;

        const video = document.getElementById('webcamVideo');
        const canvas = document.getElementById('webcamCanvas');
        if (!video || !canvas) return;

        // Show pose detected indicator
        const poseChip = document.getElementById('poseDetectedChip');
        if (poseChip) poseChip.style.display = 'inline-block';

        // Draw pose on canvas
        const ctx = canvas.getContext('2d');
        canvas.width = results.image.width;
        canvas.height = results.image.height;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
                color: '#00B2FF',
                lineWidth: 3
            });
            drawLandmarks(ctx, results.poseLandmarks, {
                color: '#1EF9A1',
                lineWidth: 1.5,
                radius: 4
            });
        }

        ctx.restore();
        canvas.style.display = 'block';

        // Map pose to avatar (only if avatar is loaded)
        if (avatarModel) {
            mapPoseToAvatar(results.poseLandmarks);
        } else {
            // Debug: log why mapping isn't happening
            if (!onPoseResults._warned) {
                console.warn('Avatar model not loaded yet, cannot map pose');
                onPoseResults._warned = true;
            }
        }
        
        // Note: Animation loop should be continuously rendering, but we ensure it's active

        // Evaluate exercise if selected
        if (currentExercise && exercises[currentExercise]) {
            exercises[currentExercise].evaluatePose(results.poseLandmarks);
        }
    }

    // Map BlazePose landmarks to avatar bones
    function mapPoseToAvatar(landmarks) {
        if (!avatarModel) {
            console.warn('Avatar model not loaded yet');
            return;
        }

        const video = document.getElementById('webcamVideo');
        if (!video) {
            console.warn('Video element not found');
            return;
        }

        // Direct landmark-based movement (works without Kalidokit)
        if (landmarks && landmarks.length >= 33) {
            // Get key landmarks
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            const leftHip = landmarks[23];
            const rightHip = landmarks[24];
            const leftKnee = landmarks[25];
            const rightKnee = landmarks[26];
            const leftAnkle = landmarks[27];
            const rightAnkle = landmarks[28];
            const leftWrist = landmarks[15];
            const rightWrist = landmarks[16];
            
            // Special handling for squat exercise
            if (currentExercise === 'squat') {
                // Lock avatar to side view - minimal rotation
                avatarModel.rotation.y = smooth(avatarModel.rotation.y, 0, 0.3);
                avatarModel.rotation.x = smooth(avatarModel.rotation.x, 0, 0.3);
                avatarModel.rotation.z = smooth(avatarModel.rotation.z, 0, 0.3);
                
                // Calculate knee angles for squat depth
                const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
                const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
                const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
                
                // Calculate hip depth (how low the hips are)
                const hipY = (leftHip.y + rightHip.y) / 2;
                const kneeY = (leftKnee.y + rightKnee.y) / 2;
                const hipDepth = Math.abs(hipY - kneeY);
                
                // Find leg objects in the model (try multiple approaches)
                let leftLegObj = null, rightLegObj = null;
                const legObjects = [];
                
                avatarModel.traverse((child) => {
                    if (!child) return;
                    const name = (child.name || '').toLowerCase();
                    
                    // Try to find by name
                    if (!leftLegObj && name.includes('left') && (name.includes('leg') || name.includes('thigh') || name.includes('knee') || name.includes('upleg'))) {
                        leftLegObj = child;
                        legObjects.push({ obj: child, side: 'left' });
                    }
                    if (!rightLegObj && name.includes('right') && (name.includes('leg') || name.includes('thigh') || name.includes('knee') || name.includes('upleg'))) {
                        rightLegObj = child;
                        legObjects.push({ obj: child, side: 'right' });
                    }
                });
                
                // If no named legs found, try to find by position (legs are usually lower in the model)
                if (!leftLegObj || !rightLegObj) {
                    const children = [];
                    avatarModel.traverse((child) => {
                        if (child.isMesh || child.isGroup || child.isBone) {
                            if (child.position.y < 0.5) { // Legs are usually below hip level
                                children.push(child);
                            }
                        }
                    });
                    
                    // Use first two lower objects as legs if we found them
                    if (children.length >= 2 && !leftLegObj) {
                        leftLegObj = children[0];
                    }
                    if (children.length >= 2 && !rightLegObj) {
                        rightLegObj = children[1];
                    }
                }
                
                // Apply leg bending based on knee angle
                // When knee angle is small (bent), rotate leg forward
                // Knee angle: 180 = straight, 90 = bent, 0 = fully bent
                const legBendAmount = Math.max(0, (180 - avgKneeAngle) / 180); // 0 = straight, 1 = fully bent
                const legRotation = legBendAmount * Math.PI / 3; // Max 60 degrees forward
                
                if (leftLegObj) {
                    leftLegObj.rotation.x = smooth(leftLegObj.rotation.x || 0, legRotation, 0.4);
                }
                if (rightLegObj) {
                    rightLegObj.rotation.x = smooth(rightLegObj.rotation.x || 0, legRotation, 0.4);
                }
                
                // Also try to rotate the entire model's lower part if legs not found
                if (!leftLegObj && !rightLegObj) {
                    // Rotate the whole model slightly forward when squatting
                    avatarModel.rotation.x = smooth(avatarModel.rotation.x, legRotation * 0.5, 0.4);
                }
                
                // Also lower the avatar model position to simulate squatting
                const squatDepth = hipDepth * 0.5;
                avatarModel.position.y = smooth(avatarModel.position.y, -squatDepth, 0.3);
                
                // Log first time
                if (!mapPoseToAvatar._squatLogged) {
                    console.log('✅ Squat mode active - side view locked, leg bending enabled');
                    console.log('Knee angle:', avgKneeAngle.toFixed(1), 'degrees');
                    mapPoseToAvatar._squatLogged = true;
                }
                
                return; // Skip other movement for squat
            }
            
            // Normal movement for other exercises
            // Calculate body center and rotation
            const hipCenter = {
                x: (leftHip.x + rightHip.x) / 2,
                y: (leftHip.y + rightHip.y) / 2,
                z: (leftHip.z + rightHip.z) / 2
            };
            
            const shoulderCenter = {
                x: (leftShoulder.x + rightShoulder.x) / 2,
                y: (leftShoulder.y + rightShoulder.y) / 2,
                z: (leftShoulder.z + rightShoulder.z) / 2
            };
            
            // Keep avatar centered (minimal position movement)
            avatarModel.position.x = smooth(avatarModel.position.x, 0, 0.3);
            avatarModel.position.y = smooth(avatarModel.position.y, 0, 0.3);
            avatarModel.position.z = smooth(avatarModel.position.z, 0, 0.3);
            
            // Calculate body rotation from landmarks (more visible movement)
            const bodyAngle = Math.atan2(
                shoulderCenter.x - hipCenter.x,
                shoulderCenter.y - hipCenter.y
            );
            avatarModel.rotation.y = smooth(avatarModel.rotation.y, bodyAngle * 0.8, 0.3);
            
            // Calculate body lean from shoulder-hip alignment
            const bodyLean = (shoulderCenter.y - hipCenter.y) * 2;
            avatarModel.rotation.x = smooth(avatarModel.rotation.x, bodyLean * 0.5, 0.3);
            
            // Calculate tilt from shoulder height difference
            const shoulderTilt = (rightShoulder.y - leftShoulder.y) * 1.5;
            avatarModel.rotation.z = smooth(avatarModel.rotation.z, shoulderTilt * 0.3, 0.3);
            
            // Log first time to confirm it's working
            if (!mapPoseToAvatar._directLogged) {
                console.log('✅ Direct landmark mapping active - avatar should move!');
                console.log('Hip center:', hipCenter);
                mapPoseToAvatar._directLogged = true;
            }
        }

        // Try Kalidokit for proper bone-based animation (if available)
        if (!Kalidokit) {
            console.warn('Kalidokit not available - using basic positioning only');
            return;
        }

        try {
            const riggedPose = Kalidokit.Pose.solve(landmarks, {
                runtime: 'mediapipe',
                video: video,
                enableLegs: true
            });

            if (!riggedPose) {
                console.warn('Kalidokit did not return rigged pose');
                return;
            }
            
            // Debug: log first few calls
            if (!mapPoseToAvatar._logged) {
                console.log('✅ Kalidokit working! Attempting bone-based animation');
                console.log('Rigged pose data:', riggedPose);
                console.log('Avatar bones found:', Object.keys(avatarBones).length);
                mapPoseToAvatar._logged = true;
            }

            // If no bones found, apply basic model rotation and movement (like fitness.html)
            if (Object.keys(avatarBones).length === 0) {
                if (!mapPoseToAvatar._noBonesLogged) {
                    console.log('No bones found - using Kalidokit-based model movement');
                    mapPoseToAvatar._noBonesLogged = true;
                }
                
                // Override the direct landmark mapping with Kalidokit data (more accurate)
                if (riggedPose.Hips && riggedPose.Hips.rotation) {
                    avatarModel.rotation.y = smooth(avatarModel.rotation.y, riggedPose.Hips.rotation.y * 0.8, 0.3);
                    avatarModel.rotation.x = smooth(avatarModel.rotation.x, riggedPose.Hips.rotation.x * 0.5, 0.3);
                    avatarModel.rotation.z = smooth(avatarModel.rotation.z, riggedPose.Hips.rotation.z * 0.5, 0.3);
                }
                
                // Apply spine rotation for body lean
                if (riggedPose.Spine && riggedPose.Spine.rotation) {
                    avatarModel.rotation.x += smooth(0, riggedPose.Spine.rotation.x * 0.3, 0.3);
                }
                
                // Keep position minimal
                if (riggedPose.Hips && riggedPose.Hips.position) {
                    const hipPos = riggedPose.Hips.position;
                    avatarModel.position.x = smooth(avatarModel.position.x, -hipPos.x * 0.3, 0.3);
                    avatarModel.position.y = smooth(avatarModel.position.y, 0, 0.3);
                }
                
                return;
            }

            // Apply rotations to bones with smoothing
            if (riggedPose.Hips) {
                applyRotationToBone('Hips', riggedPose.Hips.rotation, 1, 0.3);
                // Keep position minimal when bones are working
                if (riggedPose.Hips.position) {
                    const hipPos = riggedPose.Hips.position;
                    avatarModel.position.x = smooth(avatarModel.position.x, -hipPos.x * 0.3, 0.2);
                    avatarModel.position.y = smooth(avatarModel.position.y, 0, 0.2); // Keep centered
                    avatarModel.position.z = smooth(avatarModel.position.z, 0, 0.2); // Keep centered
                }
            }

            if (riggedPose.Spine) {
                applyRotationToBone('Spine', riggedPose.Spine, 1, 0.3);
            }
            if (riggedPose.Chest) {
                applyRotationToBone('Chest', riggedPose.Chest, 0.25, 0.3);
            }
            if (riggedPose.Neck) {
                applyRotationToBone('Neck', riggedPose.Neck, 0.5, 0.3);
            }
            if (riggedPose.Head) {
                applyRotationToBone('Head', riggedPose.Head, 1, 0.3);
            }

            if (riggedPose.LeftUpperArm) {
                applyRotationToBone('LeftUpperArm', riggedPose.LeftUpperArm, 1, 0.3);
            }
            if (riggedPose.LeftLowerArm) {
                applyRotationToBone('LeftLowerArm', riggedPose.LeftLowerArm, 1, 0.3);
            }
            if (riggedPose.RightUpperArm) {
                applyRotationToBone('RightUpperArm', riggedPose.RightUpperArm, 1, 0.3);
            }
            if (riggedPose.RightLowerArm) {
                applyRotationToBone('RightLowerArm', riggedPose.RightLowerArm, 1, 0.3);
            }

            if (riggedPose.LeftUpperLeg) {
                applyRotationToBone('LeftUpperLeg', riggedPose.LeftUpperLeg, 1, 0.3);
            }
            if (riggedPose.LeftLowerLeg) {
                applyRotationToBone('LeftLowerLeg', riggedPose.LeftLowerLeg, 1, 0.3);
            }
            if (riggedPose.RightUpperLeg) {
                applyRotationToBone('RightUpperLeg', riggedPose.RightUpperLeg, 1, 0.3);
            }
            if (riggedPose.RightLowerLeg) {
                applyRotationToBone('RightLowerLeg', riggedPose.RightLowerLeg, 1, 0.3);
            }
        } catch (error) {
            console.warn('Avatar mapping error:', error);
        }
    }

    // Apply rotation to a bone with smoothing
    function applyRotationToBone(kalidoName, rotation, dampener = 1, lerpAmount = 0.3) {
        if (!rotation || !avatarModel) return;

        const boneMap = {
            'Hips': ['Hips', 'mixamorigHips', 'hips', 'Hips_JNT'],
            'Spine': ['Spine', 'mixamorigSpine', 'spine', 'Spine_JNT'],
            'Chest': ['Chest', 'mixamorigSpine1', 'chest', 'upper_body', 'Chest_JNT'],
            'Neck': ['Neck', 'mixamorigNeck', 'neck', 'Neck_JNT'],
            'Head': ['Head', 'mixamorigHead', 'head', 'Head_JNT'],
            'LeftUpperArm': ['LeftUpperArm', 'mixamorigLeftArm', 'LeftArm', 'left_upper_arm', 'LeftArm_JNT'],
            'LeftLowerArm': ['LeftLowerArm', 'mixamorigLeftForeArm', 'LeftForeArm', 'left_lower_arm', 'LeftForeArm_JNT'],
            'RightUpperArm': ['RightUpperArm', 'mixamorigRightArm', 'RightArm', 'right_upper_arm', 'RightArm_JNT'],
            'RightLowerArm': ['RightLowerArm', 'mixamorigRightForeArm', 'RightForeArm', 'right_lower_arm', 'RightForeArm_JNT'],
            'LeftUpperLeg': ['LeftUpperLeg', 'mixamorigLeftUpLeg', 'LeftUpLeg', 'left_upper_leg', 'LeftUpLeg_JNT'],
            'LeftLowerLeg': ['LeftLowerLeg', 'mixamorigLeftLeg', 'LeftLeg', 'left_lower_leg', 'LeftLeg_JNT'],
            'RightUpperLeg': ['RightUpperLeg', 'mixamorigRightUpLeg', 'RightUpLeg', 'right_upper_leg', 'RightUpLeg_JNT'],
            'RightLowerLeg': ['RightLowerLeg', 'mixamorigRightLeg', 'RightLeg', 'right_lower_leg', 'RightLeg_JNT']
        };

        const possibleNames = boneMap[kalidoName] || [kalidoName];
        let bone = null;

        for (const name of possibleNames) {
            if (avatarBones[name]) {
                bone = avatarBones[name];
                break;
            }
        }

        // If no bone found, try to find by traversing
        if (!bone && avatarModel) {
            avatarModel.traverse((object) => {
                if (object.isBone || object.isSkinnedMesh) {
                    for (const name of possibleNames) {
                        if (object.name.toLowerCase().includes(name.toLowerCase())) {
                            bone = object;
                            avatarBones[kalidoName] = object;
                            break;
                        }
                    }
                }
            });
        }

        if (!bone) {
            // Log missing bones for debugging (only once per bone type)
            if (!applyRotationToBone._missingBones) {
                applyRotationToBone._missingBones = new Set();
            }
            if (!applyRotationToBone._missingBones.has(kalidoName)) {
                console.warn(`Bone not found: ${kalidoName} (tried: ${possibleNames.join(', ')})`);
                applyRotationToBone._missingBones.add(kalidoName);
            }
            return;
        }

        const euler = new THREE.Euler(
            rotation.x * dampener,
            rotation.y * dampener,
            rotation.z * dampener
        );
        const targetQuaternion = new THREE.Quaternion().setFromEuler(euler);
        bone.quaternion.slerp(targetQuaternion, lerpAmount);
    }

    // Initialize Three.js avatar - matching fitness.html structure exactly
    function initializeAvatar() {
        const canvas = document.getElementById('avatarCanvas');
        const container = document.getElementById('avatarContainer');
        if (!canvas || !container) {
            console.error('Avatar container or canvas not found');
            showFeedback('⚠️ Avatar container not found', 'warning');
            return;
        }

        console.log('Initializing avatar...');
        console.log('Container dimensions:', container.clientWidth, 'x', container.clientHeight);

        // Scene setup - exactly like fitness.html
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0B0B10);

        // Camera with aspect 1 initially (like fitness.html)
        avatarCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        // Default camera position (front view)
        avatarCamera.position.set(0, 1.5, 3);
        avatarCamera.lookAt(0, 1, 0);
        
        // Function to update camera based on exercise
        window.updateAvatarCamera = function(exercise) {
            if (!avatarCamera) return;
            
            if (exercise === 'squat') {
                // Side view for squat
                avatarCamera.position.set(3, 1.5, 0);
                avatarCamera.lookAt(0, 1, 0);
                console.log('Camera set to side view for squat');
            } else {
                // Front view for other exercises
                avatarCamera.position.set(0, 1.5, 3);
                avatarCamera.lookAt(0, 1, 0);
            }
        };

        // Renderer - exactly like fitness.html
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 3, 2);
        scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0x00B2FF, 0.3);
        backLight.position.set(-2, 2, -2);
        scene.add(backLight);

        // Add a visible test cube immediately to verify rendering works
        const testGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const testMaterial = new THREE.MeshStandardMaterial({ color: 0x1EF9A1 });
        const testCube = new THREE.Mesh(testGeometry, testMaterial);
        testCube.position.set(0, 1.5, 0);
        scene.add(testCube);
        
        // Hide placeholder immediately to show test cube
        const placeholder = document.getElementById('avatarPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
            console.log('Placeholder hidden - test cube should be visible');
        }

        // Render immediately to show test cube
        if (renderer && scene && avatarCamera) {
            renderer.render(scene, avatarCamera);
            console.log('Initial render completed - you should see a green cube');
        }

        // Start animation loop
        if (!animationFrameId) {
            animate();
            console.log('Animation loop started');
        }

        // Load avatar model - exactly like fitness.html
        const loader = new THREE.GLTFLoader();
        console.log('Loading avatar from assets/present.glb...');
        
        loader.load('assets/present.glb', 
            (gltf) => {
                console.log('✅ Avatar model loaded successfully!');
                
                // Remove test cube
                scene.remove(testCube);
                
                avatarModel = gltf.scene;
                avatarModel.position.set(0, 0, 0);
                avatarModel.scale.set(1, 1, 1);
                scene.add(avatarModel);

                // Extract bones and log model structure
                const allObjects = [];
                avatarModel.traverse((object) => {
                    if (object.isBone) {
                        avatarBones[object.name] = object;
                        console.log('Found bone:', object.name);
                    }
                    // Collect all named objects for debugging
                    if (object.name && object.name.length > 0) {
                        allObjects.push({
                            name: object.name,
                            type: object.type,
                            isBone: object.isBone,
                            isMesh: object.isMesh,
                            isGroup: object.isGroup
                        });
                    }
                });

                console.log('Avatar added to scene - should be visible now');
                console.log('Total bones found:', Object.keys(avatarBones).length);
                console.log('All objects in model:', allObjects);
                
                // If no bones found, try to find by common names
                if (Object.keys(avatarBones).length === 0) {
                    console.warn('No bones found in avatar model. Will use direct mesh rotation.');
                    // Store model structure for reference
                    mapPoseToAvatar._modelStructure = allObjects;
                }
            }, 
            undefined, 
            (error) => {
                console.error('❌ Failed to load assets/present.glb:', error);
                console.log('Trying assets/coach.glb...');
                
                // Try coach.glb as fallback
                loader.load('assets/coach.glb',
                    (gltf) => {
                        console.log('✅ Coach model loaded successfully!');
                        
                        // Remove test cube
                        scene.remove(testCube);
                        
                        avatarModel = gltf.scene;
                        avatarModel.position.set(0, 0, 0);
                        avatarModel.scale.set(1, 1, 1);
                        scene.add(avatarModel);

                        avatarModel.traverse((object) => {
                            if (object.isBone) {
                                avatarBones[object.name] = object;
                            }
                        });
                    },
                    undefined,
                    (error2) => {
                        console.error('❌ Both avatar models failed to load:', error2);
                        showFeedback('⚠️ Avatar model not found. Using fallback visualization.', 'warning');
                        // Keep test cube visible as fallback
                    }
                );
            }
        );

        // Handle window resize
        window.addEventListener('resize', () => {
            if (!container || !avatarCamera || !renderer) return;
            const newWidth = container.clientWidth || 400;
            const newHeight = container.clientHeight || 400;
            avatarCamera.aspect = newWidth / newHeight;
            avatarCamera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        });
    }

    // Create fallback avatar if model doesn't load
    function createFallbackAvatar() {
        if (!scene) {
            console.error('Scene not initialized for fallback avatar');
            return;
        }
        
        console.log('Creating fallback avatar');
        
        // Create a simple humanoid shape
        const bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00B2FF });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0.4, 0);
        scene.add(body);
        
        const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0x7C3AED });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 1.0, 0);
        scene.add(head);
        
        avatarModel = new THREE.Group();
        avatarModel.add(body);
        avatarModel.add(head);
        
        // Render immediately
        if (renderer && scene && avatarCamera) {
            renderer.render(scene, avatarCamera);
            console.log('Fallback avatar rendered');
        }
    }

    // Animation loop
    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        if (renderer && scene && avatarCamera) {
            renderer.render(scene, avatarCamera);
        }
    }

    // Start camera and pose detection
    async function startCamera() {
        const video = document.getElementById('webcamVideo');
        if (!video) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' },
                audio: false
            });

            video.srcObject = stream;
            await video.play();

            if (!pose) {
                initializePose();
            }

            camera = new Camera(video, {
                onFrame: async () => {
                    if (pose && isRunning) {
                        await pose.send({ image: video });
                    }
                },
                width: 1280,
                height: 720
            });

            await camera.start();
            isRunning = true;

            const canvas = document.getElementById('webcamCanvas');
            if (canvas) canvas.style.display = 'block';

            showFeedback(`📹 Camera started - ${currentExercise ? exercises[currentExercise].name + ' selected' : 'Choose an exercise'}`, 'good');
        } catch (err) {
            console.error('Camera error:', err);
            showFeedback('❌ Camera access denied. Please allow camera permissions.', 'warning');
        }
    }

    // Stop camera and pose detection
    function stopCamera() {
        if (camera) {
            camera.stop();
            camera = null;
        }

        const video = document.getElementById('webcamVideo');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        const canvas = document.getElementById('webcamCanvas');
        if (canvas) canvas.style.display = 'none';

        const poseChip = document.getElementById('poseDetectedChip');
        if (poseChip) poseChip.style.display = 'none';

        isRunning = false;
    }

    // Initialize when DOM is ready
    function init() {
        // Exercise selector
        const exerciseSelect = document.getElementById('exerciseSelect');
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', (e) => {
                const exerciseKey = e.target.value;
                if (exerciseKey && exercises[exerciseKey]) {
                    currentExercise = exerciseKey;
                    const exerciseChip = document.getElementById('exerciseChip');
                    if (exerciseChip) {
                        exerciseChip.textContent = exercises[exerciseKey].name;
                        exerciseChip.style.display = 'inline-block';
                    }
                    
                    // Update camera view based on exercise
                    if (typeof window.updateAvatarCamera === 'function') {
                        window.updateAvatarCamera(exerciseKey);
                    }
                    
                    showFeedback(`🎯 ${exercises[exerciseKey].name} selected - Press Start to begin!`, 'good');
                    speakFeedback(`${exercises[exerciseKey].name} selected. Press start when ready.`);
                } else {
                    currentExercise = null;
                    const exerciseChip = document.getElementById('exerciseChip');
                    if (exerciseChip) exerciseChip.style.display = 'none';
                    
                    // Reset to front view
                    if (typeof window.updateAvatarCamera === 'function') {
                        window.updateAvatarCamera(null);
                    }
                }
            });
        }

        // Start/Stop button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                if (!isRunning) {
                    if (!currentExercise) {
                        showFeedback('⚠️ Please select an exercise first!', 'warning');
                        return;
                    }
                    await startCamera();
                    startBtn.textContent = 'Stop';
                    startBtn.classList.add('stop');
                } else {
                    stopCamera();
                    startBtn.textContent = 'Start';
                    startBtn.classList.remove('stop');
                }
            });
        }

        // Initialize avatar (with a delay to ensure all scripts and DOM are ready)
        function initAvatarWhenReady() {
            const container = document.getElementById('avatarContainer');
            const canvas = document.getElementById('avatarCanvas');
            
            if (!container || !canvas) {
                console.error('Container or canvas not found!', { container: !!container, canvas: !!canvas });
                showFeedback('⚠️ Avatar elements not found', 'warning');
                return;
            }
            
            // Check if container has dimensions
            if (container.clientWidth === 0 || container.clientHeight === 0) {
                console.warn('Container has zero dimensions, waiting...', {
                    width: container.clientWidth,
                    height: container.clientHeight
                });
                setTimeout(initAvatarWhenReady, 100);
                return;
            }
            
            if (typeof THREE === 'undefined') {
                console.error('Three.js is not loaded');
                showFeedback('⚠️ Three.js library failed to load. Please refresh the page.', 'warning');
                return;
            }
            
            // Wait a bit more for GLTFLoader if needed
            if (typeof THREE.GLTFLoader === 'undefined') {
                console.warn('GLTFLoader not ready yet, waiting...');
                setTimeout(initAvatarWhenReady, 100);
                return;
            }
            
            console.log('All checks passed, initializing avatar...');
            console.log('Container:', container.clientWidth, 'x', container.clientHeight);
            console.log('Canvas:', canvas.width, 'x', canvas.height);
            initializeAvatar();
        }
        
        // Wait for page to be fully loaded and styles applied
        function startInit() {
            // Give extra time for CSS to apply
            setTimeout(initAvatarWhenReady, 300);
        }
        
        if (document.readyState === 'complete') {
            startInit();
        } else {
            window.addEventListener('load', startInit);
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            stopCamera();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        });

        showFeedback('👋 Welcome to CoMo! Select an exercise and click Start to begin.', 'good');
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded, but wait a bit for styles to apply
        setTimeout(init, 50);
    }
})();

