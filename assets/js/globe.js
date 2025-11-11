const canvasContainer = document.getElementById("globe-canvas");

if (!canvasContainer) {
  throw new Error("Globe canvas container not found in the document.");
}

const scene = new THREE.Scene();
scene.background = null;

function getDimensions() {
  const parentWidth = canvasContainer.parentElement.clientWidth;
  const fallbackSize = parentWidth;
  const width = canvasContainer.clientWidth || canvasContainer.offsetWidth || fallbackSize;
  const height = canvasContainer.clientHeight || canvasContainer.offsetHeight || fallbackSize;
  return { width, height: height || width };
}

const { width: initialWidth, height: initialHeight } = getDimensions();

const camera = new THREE.PerspectiveCamera(35, initialWidth / initialHeight, 0.1, 1000);

camera.position.set(0, 0, 4.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(initialWidth, initialHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
canvasContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function createEarthTexture() {
  const width = 1024;
  const height = 512;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const oceanGradient = ctx.createLinearGradient(0, 0, 0, height);
  oceanGradient.addColorStop(0, "#03102b");
  oceanGradient.addColorStop(0.5, "#062d55");
  oceanGradient.addColorStop(1, "#094b7b");
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, width, height);

  const sunlight = ctx.createRadialGradient(
    width * 0.35,
    height * 0.4,
    width * 0.05,
    width * 0.35,
    height * 0.4,
    width * 0.55
  );
  sunlight.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  sunlight.addColorStop(0.6, "rgba(142, 246, 228, 0.1)");
  sunlight.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = sunlight;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  function drawContinent(cx, cy, rx, ry, rotation, color, roughness = 0.4) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.beginPath();
    const steps = 48;
    for (let i = 0; i <= steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const rNoise =
        1 -
        roughness * 0.3 +
        Math.sin(angle * 3.2 + cx * 0.001 + cy * 0.002) * roughness * 0.35 +
        Math.cos(angle * 1.6 + cy * 0.0025) * roughness * 0.25;
      const x = Math.cos(angle) * rx * rNoise;
      const y = Math.sin(angle) * ry * rNoise;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1.5, Math.min(rx, ry) * 0.04);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  const landMain = "#2ea86e";
  const landSecondary = "#21915f";

  drawContinent(width * 0.33, height * 0.52, width * 0.17, height * 0.18, -0.6, landMain, 0.45);
  drawContinent(width * 0.52, height * 0.47, width * 0.22, height * 0.24, 0.3, landMain, 0.5);
  drawContinent(width * 0.68, height * 0.58, width * 0.14, height * 0.12, 0.85, landMain, 0.43);
  drawContinent(width * 0.6, height * 0.32, width * 0.12, height * 0.16, 0.2, landMain, 0.4);

  drawContinent(width * 0.22, height * 0.35, width * 0.12, height * 0.14, -0.15, landSecondary, 0.35);
  drawContinent(width * 0.45, height * 0.26, width * 0.1, height * 0.12, 0.45, landSecondary, 0.32);
  drawContinent(width * 0.71, height * 0.4, width * 0.08, height * 0.1, 0.95, landSecondary, 0.3);
  drawContinent(width * 0.41, height * 0.66, width * 0.11, height * 0.08, -0.25, landSecondary, 0.28);

  const mountainShade = ctx.createLinearGradient(0, 0, width, 0);
  mountainShade.addColorStop(0, "rgba(20, 84, 52, 0.15)");
  mountainShade.addColorStop(0.6, "rgba(7, 38, 26, 0.35)");
  mountainShade.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mountainShade;
  ctx.fillRect(0, 0, width, height);

  const rimShade = ctx.createLinearGradient(0, 0, width, 0);
  rimShade.addColorStop(0, "rgba(0, 0, 0, 0.35)");
  rimShade.addColorStop(0.35, "rgba(0, 0, 0, 0)");
  rimShade.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = rimShade;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function createCloudTexture() {
  const width = 1024;
  const height = 512;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);

  function pseudoRandom(x, y) {
    const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }

  const cloudCount = 6500;
  for (let i = 0; i < cloudCount; i += 1) {
    const u = i / cloudCount;
    const baseX = (u * width + (pseudoRandom(i, 2) - 0.5) * width + width) % width;
    const baseY = (pseudoRandom(i, 3) * 0.8 + 0.1) * height;
    const radius = 12 + pseudoRandom(i, 5) * 18;
    const alpha = 0.04 + pseudoRandom(i, 7) * 0.05;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(baseX, baseY, radius * 1.4, radius, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

const earthTexture = createEarthTexture();

const geometry = new THREE.SphereGeometry(1.35, 128, 128);
const material = new THREE.MeshStandardMaterial({
  map: earthTexture,
  roughness: 0.78,
  metalness: 0.1,
});

const earth = new THREE.Mesh(geometry, material);
scene.add(earth);
earth.rotation.y = -Math.PI * 0.25;

const cloudTexture = createCloudTexture();

const cloudMaterial = new THREE.MeshLambertMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});

const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.38, 128, 128), cloudMaterial);
scene.add(cloudMesh);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.45;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.target.set(0, 0, 0);

const haloGeometry = new THREE.SphereGeometry(1.42, 64, 64);
const haloMaterial = new THREE.ShaderMaterial({
  uniforms: {
    c: { value: 0.8 },
    p: { value: 1.6 },
    glowColor: { value: new THREE.Color(0x8ef6e4) },
    viewVector: { value: camera.position },
  },
  vertexShader: `
    uniform vec3 viewVector;
    uniform float c;
    uniform float p;
    varying float intensity;
    void main() {
      vec3 vNormal = normalize(normalMatrix * normal);
      vec3 vNormView = normalize(viewVector - (modelViewMatrix * vec4(position, 1.0)).xyz);
      intensity = pow(c - dot(vNormal, vNormView), p);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    varying float intensity;
    void main() {
      gl_FragColor = vec4(glowColor * intensity, intensity);
    }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
});

const halo = new THREE.Mesh(haloGeometry, haloMaterial);
scene.add(halo);

const viewVector = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  cloudMesh.rotation.y += 0.0008;
  viewVector.copy(camera.position);
  haloMaterial.uniforms.viewVector.value = viewVector;
  renderer.render(scene, camera);
}

animate();

function onResize() {
  const { width, height } = getDimensions();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

window.addEventListener("resize", onResize);

const ctaButtons = document.querySelectorAll(".primary, .secondary");
ctaButtons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    controls.autoRotate = false;
  });
  btn.addEventListener("mouseleave", () => {
    controls.autoRotate = true;
  });
});
