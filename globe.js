// Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 0, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x202020, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(5, 3, 5);
scene.add(dir);

// Globe
const R = 1;
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(R, 96, 96),
  new THREE.MeshStandardMaterial({ color: 0x1d4ed8 })
);
scene.add(globe);

// Atmosphere
const atmos = new THREE.Mesh(
  new THREE.SphereGeometry(R * 1.03, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0x4ea1ff, transparent:true, opacity:0.08, side: THREE.BackSide })
);
scene.add(atmos);

// Stars
const starGeo = new THREE.BufferGeometry();
const count = 900;
const positions = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const r = 80 + Math.random() * 120;
  const u = Math.random(), v = Math.random();
  const th = Math.acos(2*u - 1), ph = 2*Math.PI*v;
  positions[i*3]   = r * Math.sin(th) * Math.cos(ph);
  positions[i*3+1] = r * Math.sin(th) * Math.sin(ph);
  positions[i*3+2] = r * Math.cos(th);
}
starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size:0.2, opacity:0.8 })));

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enablePan = false;
controls.minDistance = 1.4;
controls.maxDistance = 6;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

// Load texture
const loader = new THREE.TextureLoader();
loader.load(
  "./RenderData.jpeg",  // Make sure file name EXACTLY matches!
  (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    globe.material.map = tex;
    globe.material.color.set(0xffffff);
    globe.material.needsUpdate = true;
    console.log("✅ Earth texture loaded");
  },
  undefined,
  () => console.error("❌ Cannot load RenderData.jpeg — check filename/path")
);

// Resize
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Loop
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
