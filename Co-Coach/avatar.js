import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, model, controls;
const loading = document.getElementById('loading');
const canvas = document.getElementById('avatarCanvas');

function initThreeJS() {
    const container = document.getElementById('avatarPreview');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B0B10);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00B2FF, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const purpleLight = new THREE.DirectionalLight(0x7C3AED, 0.6);
    purpleLight.position.set(-5, 8, -5);
    scene.add(purpleLight);

    // Add some accent glow
    const pointLight = new THREE.PointLight(0xA3FF12, 1, 10);
    pointLight.position.set(0, 3, 2);
    scene.add(pointLight);

    // Camera controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.target.set(0, 1, 0);

    loadModel();
    animate();

    window.addEventListener('resize', onWindowResize);
}

function loadModel() {
    try {
        const loader = new GLTFLoader();
        
        loader.load(
            './assets/present.glb',
            function(gltf) {
                console.log('Model loaded successfully');
                model = gltf.scene;
                model.position.set(0, 0, 0);
                model.scale.set(0.8, 0.8, 0.8);
                
                model.traverse(function(child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        console.log('Mesh found:', child.name);
                    }
                });

                scene.add(model);
                loading.style.display = 'none';
                
                // Initial rotation animation
                animateModel();
            },
            function(xhr) {
                const loaded = (xhr.loaded / xhr.total * 100).toFixed(0);
                if (loading) loading.textContent = `Loading 3D Avatar... ${loaded}%`;
            },
            function(error) {
                console.error('Error loading model:', error);
                if (loading) loading.textContent = 'Error loading avatar. Check console.';
                createFallbackAvatar();
            }
        );
    } catch (err) {
        console.error('Error initializing loader:', err);
        if (loading) loading.textContent = 'Failed to initialize 3D viewer.';
        createFallbackAvatar();
    }
}

function createFallbackAvatar() {
    loading.style.display = 'none';
    
    const geometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
    const material = new THREE.MeshStandardMaterial({ color: 0x1A1B20 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.6, 0);
    scene.add(cube);
}

function updateModelPose() {
    if (!model) return;

    const pose = document.getElementById('pose').value;
    
    // Reset rotation
    model.rotation.set(0, 0, 0);
    
    switch(pose) {
        case 'running':
            model.rotation.x = 0.1;
            model.rotation.y = -0.2;
            break;
        case 'squat':
            model.position.y = -0.3;
            model.rotation.x = 0.2;
            break;
        case 'yoga':
            model.position.y = 0.1;
            model.rotation.y = 0.5;
            break;
        case 'boxing':
            model.rotation.z = -0.2;
            break;
        case 'cycling':
            model.rotation.y = 0.5;
            model.rotation.x = 0.15;
            break;
        case 'stretching':
            model.rotation.y = -0.3;
            break;
    }
}

function updateModelColors() {
    if (!model) return;
    
    const outfit = document.getElementById('outfit').value;
    const colors = {
        blue: 0x00B2FF,
        purple: 0x7C3AED,
        lime: 0xA3FF12,
        red: 0xFF375F,
        mint: 0x1EF9A1
    };
    
    model.traverse(function(child) {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    if (mat.name && mat.name.toLowerCase().includes('outfit')) {
                        mat.color.set(colors[outfit] || 0x00B2FF);
                    }
                });
            } else {
                if (child.material.name && child.material.name.toLowerCase().includes('outfit')) {
                    child.material.color.set(colors[outfit] || 0x00B2FF);
                }
            }
        }
    });
}

function updateGlow() {
    if (!model) return;
    
    const glowValue = parseInt(document.getElementById('glow').value) / 100;
    const energyValue = parseInt(document.getElementById('energy').value) / 100;
    
    // Update point light intensity
    scene.children.forEach(child => {
        if (child instanceof THREE.PointLight) {
            child.intensity = energyValue * 1.5;
        }
    });
    
    // Add emissive glow if material supports it
    model.traverse(function(child) {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.emissive = new THREE.Color(0x00B2FF).multiplyScalar(glowValue * 0.3);
                });
            } else {
                child.material.emissive = new THREE.Color(0x00B2FF).multiplyScalar(glowValue * 0.3);
            }
        }
    });
}

function animateModel() {
    if (!model) return;
    
    const rotation = () => {
        if (model) {
            model.rotation.y += 0.005;
            requestAnimationFrame(rotation);
        }
    };
    rotation();
}

function animate() {
    requestAnimationFrame(animate);
    
    try {
        if (controls) controls.update();
    } catch (e) {}
    
    if (model) {
        // Subtle breathing animation
        const time = Date.now() * 0.001;
        const breatheAmount = 0.02;
        model.scale.y = 1 + Math.sin(time) * breatheAmount;
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('avatarPreview');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function updateLabels() {
    const skintoneLabel = document.getElementById('skintoneLabel');
    const energyLabel = document.getElementById('energyLabel');
    const glowLabel = document.getElementById('glowLabel');
    
    if (skintoneLabel) {
        const st = parseInt(document.getElementById('skintone').value);
        const labels = ['Light', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark'];
        skintoneLabel.textContent = labels[st - 1];
    }
    
    if (energyLabel) {
        energyLabel.textContent = document.getElementById('energy').value + '%';
    }
    
    if (glowLabel) {
        glowLabel.textContent = document.getElementById('glow').value + '%';
    }
}

// Event listeners
const saveBtn = document.getElementById('saveBtn');

saveBtn.addEventListener('click', () => {
    const data = {
        timestamp: Date.now()
    };
    localStorage.setItem('twc_avatar', JSON.stringify(data));
    
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#1A1B20;color:#1EF9A1;padding:16px 24px;border-radius:12px;border:1px solid rgba(30,249,161,.3);z-index:9999;font-weight:600;';
    alertDiv.textContent = '✓ Proceeding...';
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        window.location.href = 'coach.html'; // Navigate to next page
    }, 1000);
});

// Initialize everything
initThreeJS();

// Initial label updates
updateLabels();

// Skin tone function
function updateSkinTone() {
    if (!model) return;
    const skinValue = parseInt(document.getElementById('skintone').value);
    const skinColors = {
        1: 0xFFE0BD, 2: 0xFFCCAA, 3: 0xD4A574,
        4: 0xC68642, 5: 0x8D5524, 6: 0x5C3317
    };
    const skinColor = skinColors[skinValue] || skinColors[3];
    model.traverse(function(child) {
        if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(mat => {
                if (mat.name && (mat.name.toLowerCase().includes('body') || mat.name.toLowerCase().includes('head'))) {
                    mat.color.set(skinColor);
                }
            });
        }
    });
}

// Expose functions globally
window.updateModelPose = updateModelPose;
window.updateModelColors = updateModelColors;
window.updateSkinTone = updateSkinTone;
window.updateGlow = updateGlow;
window.updateLabels = updateLabels;
