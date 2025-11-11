(function () {
  const errEl = document.getElementById("err");
  function showError(msg) {
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = "block";
    console.error(msg);
  }

  // Wait until THREE and OrbitControls are loaded
  function ready() {
    return typeof THREE !== "undefined" && typeof THREE.OrbitControls !== "undefined";
  }
  function waitForLibs() {
    if (ready()) init();
    else setTimeout(waitForLibs, 30);
  }
  waitForLibs();

  function init() {
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
      camera.position.set(0, 0, 3);

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      document.body.appendChild(renderer.domElement);

      // Lights
      scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x202020, 0.6));
      const dir = new THREE.DirectionalLight(0xffffff, 1.1);
      dir.position.set(5, 3, 5);
      scene.add(dir);

      // Globe
      const radius = 1;
      const globeGeom = new THREE.SphereGeometry(radius, 128, 128);
      const globeMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 1, metalness: 0,
        side: THREE.FrontSide
      });
      const globe = new THREE.Mesh(globeGeom, globeMat);
      scene.add(globe);

      // Atmosphere
      const atmos = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.03, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x4ea1ff, transparent: true, opacity: 0.08, side: THREE.BackSide })
      );
      scene.add(atmos);

      // Stars
      const starsGeo = new THREE.BufferGeometry();
      const starCount = 1200;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 80 + Math.random() * 120;
        const u = Math.random(), v = Math.random();
        const theta = Math.acos(2 * u - 1), phi = 2 * Math.PI * v;
        positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
        positions[i * 3 + 2] = r * Math.cos(theta);
      }
      starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: 0.2, transparent: true, opacity: 0.85 })));

      // Controls
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.minDistance = radius * 1.4;   // keep camera outside
      controls.maxDistance = radius * 6;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;

      // Texture — absolute path to avoid relative path confusion
      const TEX_PATH = "/codex/RenderData.jpeg"; // exact case-sensitive filename
      const loader = new THREE.TextureLoader();
      loader.load(
        TEX_PATH,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter; // safe for 1440x720
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;

          globe.material.map = tex;
          globe.material.color.set(0xffffff);
          globe.material.needsUpdate = true;

          console.log("Applied texture:", TEX_PATH);
        },
        undefined,
        (err) => showError("Could not load " + TEX_PATH + ". Check the exact file name, extension, and location.")
      );

      // Resize
      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      });

      // Animate
      renderer.setAnimationLoop(() => {
        controls.update();
        renderer.render(scene, camera);
      });
    } catch (e) {
      showError("Startup error: " + e.message);
      console.error(e);
    }
  }
})();
