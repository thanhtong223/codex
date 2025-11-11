const canvasContainer = document.getElementById("globe-canvas");

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
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(
  "https://raw.githubusercontent.com/trekhleb/threejs-sandbox/master/assets/planets/earth_atmos_2048.jpg"
);
const bumpMap = textureLoader.load(
  "https://raw.githubusercontent.com/trekhleb/threejs-sandbox/master/assets/planets/earth_normal_2048.jpg"
);
const specularMap = textureLoader.load(
  "https://raw.githubusercontent.com/trekhleb/threejs-sandbox/master/assets/planets/earth_specular_2048.jpg"
);

const geometry = new THREE.SphereGeometry(1.35, 64, 64);
const material = new THREE.MeshPhongMaterial({
  map: earthTexture,
  bumpMap,
  bumpScale: 0.05,
  specularMap,
  specular: new THREE.Color("#777"),
  shininess: 12,
});

const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

const cloudTexture = textureLoader.load(
  "https://raw.githubusercontent.com/trekhleb/threejs-sandbox/master/assets/planets/earth_clouds_2048.png"
);

const cloudMaterial = new THREE.MeshLambertMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.4,
});

const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.38, 64, 64), cloudMaterial);
scene.add(cloudMesh);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.45;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

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

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  cloudMesh.rotation.y += 0.0008;
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
