import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, model, controls;

function initAvatar() {
    const canvas = document.getElementById('dashboardAvatar');
    if (!canvas) return;

    // Get dimensions accounting for container padding (20px on all sides)
    const width = 300 - 40; // 300 - padding (20*2)
    const height = 400 - 40; // 400 - padding (20*2)

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B0B10);

    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x00B2FF, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const purpleLight = new THREE.DirectionalLight(0x7C3AED, 0.6);
    purpleLight.position.set(-5, 8, -5);
    scene.add(purpleLight);

    const pointLight = new THREE.PointLight(0xA3FF12, 1, 10);
    pointLight.position.set(0, 3, 2);
    scene.add(pointLight);

    // Controls
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

function onWindowResize() {
    const width = 300 - 40;
    const height = 400 - 40;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function loadModel() {
    const loader = new GLTFLoader();
    
    loader.load(
        './assets/present.glb',
        (gltf) => {
            console.log('Model loaded successfully');
            model = gltf.scene;
            model.position.set(0, 0, 0);
            model.scale.set(1.2, 1.2, 1.2);
            
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(model);
            console.log('Avatar rendered');
        },
        (progress) => {
            if (progress.lengthComputable) {
                const loaded = (progress.loaded / progress.total * 100).toFixed(0);
                console.log(`Loading avatar: ${loaded}%`);
            }
        },
        (error) => {
            console.error('Error loading model:', error);
        }
    );
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (model) {
        model.rotation.y += 0.005;
        const time = Date.now() * 0.001;
        model.scale.y = 1.2 + Math.sin(time) * 0.02;
    }
    renderer.render(scene, camera);
}

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvatar);
} else {
    initAvatar();
}
