import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- 1. Scene Setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.035); // Black fog for depth fading

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 9); // Positioned to look straight on
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);


// --- 2. Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// Cool blue spotlight from top left
const spotLight = new THREE.SpotLight(0x4455ff, 20);
spotLight.position.set(-5, 10, 5);
spotLight.angle = Math.PI / 6;
spotLight.penumbra = 1;
scene.add(spotLight);

// Warm pink rim light from the right
const rimLight = new THREE.PointLight(0xff00ff, 5);
rimLight.position.set(5, 2, 2);
scene.add(rimLight);


// --- 3. Iridescent Sphere (Custom Shader) ---
// We use a custom shader to achieve that specific pearlescent swirl effect
const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Calculate Fresnel (Rim effect)
        float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.0);

        // Create distortion waves
        float wave = sin(vUv.y * 10.0 + time) * 0.5 + cos(vUv.x * 10.0 + time * 0.5) * 0.5;
        
        // Colors from reference
        vec3 cyan = vec3(0.0, 0.8, 0.9);
        vec3 magenta = vec3(0.8, 0.0, 0.8);
        vec3 white = vec3(1.0);
        
        // Mix based on normal and wave
        float mixFactor = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
        vec3 color = mix(cyan, magenta, mixFactor + wave * 0.2);
        
        // Add strong white rim
        color += white * fresnel * 0.8;

        gl_FragColor = vec4(color, 1.0);
    }
`;

const sphereMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});

const sphereGeo = new THREE.SphereGeometry(1.6, 64, 64);
const sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
sphere.position.y = 1.2;
scene.add(sphere);


// --- 4. Wet Ground (Procedural Texture) ---
// We generate a noise texture on the fly for the ground roughness
function createNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,512,512);
    
    for(let i=0; i<8000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const g = Math.random() * 255;
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.beginPath(); 
        ctx.arc(x,y, Math.random()*2, 0, Math.PI*2); 
        ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
}

const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.4,
    metalness: 0.8,
    roughnessMap: createNoiseTexture(),
});

const groundGeo = new THREE.PlaneGeometry(30, 30, 64, 64);
const ground = new THREE.Mesh(groundGeo, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
scene.add(ground);


// --- 5. Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const time = clock.getElapsedTime();

    // Rotate sphere
    sphere.rotation.y = time * 0.15;
    
    // Update shader uniforms
    sphereMaterial.uniforms.time.value = time;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Parallax Effect on Mouse Move
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    
    // Move camera slightly opposite to mouse
    camera.position.x = x * 0.5;
    camera.position.y = 1.5 + (y * 0.5);
    camera.lookAt(0, 0.5, 0);
});

animate();