let scene, camera, renderer, particles;
const count = 12000;
let currentState = 'sphere';

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild(renderer.domElement);

    camera.position.z = 25;

    createParticles();
    setupEventListeners();
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const point = sphericalDistribution(i);

        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.4;
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.4;
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.4;

        const color = new THREE.Color();
        const depth = Math.sqrt(point.x ** 2 + point.y ** 2 + point.z ** 2) / 8;
        color.setHSL(0.55 + depth * 0.2, 0.8, 0.5 + depth * 0.25);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 🔥 Partículas menores e elegantes
    const material = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    });

    if (particles) scene.remove(particles);
    particles = new THREE.Points(geometry, material);
    particles.rotation.set(0, 0, 0);
    scene.add(particles);
}

function setupEventListeners() {
    const typeBtn = document.getElementById('typeBtn');
    const input = document.getElementById('morphText');

    typeBtn.addEventListener('click', () => {
        if (input.value.trim()) morphToText(input.value.trim());
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
            morphToText(input.value.trim());
        }
    });
}

function createTextPoints(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 140;
    const padding = 40;

    ctx.font = `bold ${fontSize}px Inter`;
    const m = ctx.measureText(text);

    canvas.width = m.width + padding * 2;
    canvas.height = fontSize * 1.8;

    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = img.data;
    const points = [];

    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 200 && Math.random() < 0.25) {
            const x = (i / 4) % canvas.width;
            const y = Math.floor(i / 4 / canvas.width);

            points.push({
                x: (x - canvas.width / 2) * 0.06,
                y: -(y - canvas.height / 2) * 0.06
            });
        }
    }

    return points;
}

function morphToText(text) {
    currentState = 'text';
    const textPoints = createTextPoints(text);

    const positions = particles.geometry.attributes.position.array;
    const colors = particles.geometry.attributes.color.array;
    const target = new Float32Array(count * 3);

    // 🔥 PARA A ROTAÇÃO (centraliza o texto)
    gsap.to(particles.rotation, {
        x: 0, y: 0, z: 0,
        duration: 1.2,
        ease: "power3.out"
    });

    // 🔥 Texto centralizado e suave
    for (let i = 0; i < count; i++) {
        if (i < textPoints.length) {
            target[i * 3] = textPoints[i].x;
            target[i * 3 + 1] = textPoints[i].y;
            target[i * 3 + 2] = 0;
        } else {
            // fundo de partículas vivas, não parado
            const a = Math.random() * Math.PI * 2;
            const r = 15 + Math.random() * 10;
            target[i * 3] = Math.cos(a) * r;
            target[i * 3 + 1] = Math.sin(a) * r;
            target[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }
    }

    // 🔥 Movimento cinematográfico
    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
            [i]: target[i],
            [i + 1]: target[i + 1],
            [i + 2]: target[i + 2],
            duration: 3,
            ease: "power3.inOut",
            onUpdate: () => particles.geometry.attributes.position.needsUpdate = true
        });
    }

    // 🔥 Fica respirando no texto por 7 segundos
    setTimeout(() => morphToCinematicReturn(), 7000);
}

function morphToCinematicReturn() {
    // 🔥 dissolve antes de voltar
    gsap.to(particles.material, {
        opacity: 0.2,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => morphToSphere()
    });
}

function morphToSphere() {
    currentState = 'sphere';

    gsap.to(particles.material, {
        opacity: 0.9,
        duration: 1.5
    });

    const positions = particles.geometry.attributes.position.array;
    const colors = particles.geometry.attributes.color.array;
    const target = new Float32Array(count * 3);

    function sphericalDistribution(i) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        return {
            x: 8 * Math.cos(theta) * Math.sin(phi),
            y: 8 * Math.sin(theta) * Math.sin(phi),
            z: 8 * Math.cos(phi)
        };
    }

    for (let i = 0; i < count; i++) {
        const p = sphericalDistribution(i);
        target[i * 3] = p.x;
        target[i * 3 + 1] = p.y;
        target[i * 3 + 2] = p.z;
    }

    // 🔥 volta cinematográfica
    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
            [i]: target[i],
            [i + 1]: target[i + 1],
            [i + 2]: target[i + 2],
            duration: 3.5,
            ease: "power3.inOut",
            onUpdate: () => particles.geometry.attributes.position.needsUpdate = true
        });
    }
}

function animate() {
    requestAnimationFrame(animate);

    // 🔥 esfera sempre viva
    if (currentState === 'sphere') {
        particles.rotation.y += 0.002;
        particles.rotation.x += 0.0008;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();

