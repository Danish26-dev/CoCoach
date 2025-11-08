import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, model, controls;
const loading = document.getElementById('loading');
const canvas = document.getElementById('coachCanvas');

function initThreeJS() {
    const container = document.getElementById('coachPreview');
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

    // Accent glow
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
            './assets/coach.glb',
            function(gltf) {
                console.log('Coach model loaded successfully');
                model = gltf.scene;
                model.position.set(0, 0, 0);
                model.scale.set(1, 1, 1);
                
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
                if (loading) loading.textContent = `Loading Your Coach... ${loaded}%`;
            },
            function(error) {
                console.error('Error loading model:', error);
                if (loading) loading.textContent = 'Error loading coach. Check console.';
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
    const container = document.getElementById('coachPreview');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

const startBtn = document.getElementById('startBtn');

startBtn.addEventListener('click', () => {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#1A1B20;color:#1EF9A1;padding:16px 24px;border-radius:12px;border:1px solid rgba(30,249,161,.3);z-index:9999;font-weight:600;';
    alertDiv.textContent = '✓ Starting training session...';
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
});

// Initialize everything
initThreeJS();

