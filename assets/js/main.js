/* Aevum Guard landing — hero 3D chain, scroll reveal, tilt, guard-check widget.
   Real Three.js r160, vendored locally. No network calls. */
import * as THREE from 'three';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ================= HERO 3D — receipt chain + vault ================= */
(function initHero() {
  const canvas = document.getElementById('hero-canvas');
  const caption = document.getElementById('hero-caption');
  const wrap = canvas ? canvas.parentElement : null;
  if (!canvas || !wrap) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    caption.textContent = '3D is not available in this browser. The rest of this page still works.';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0c12, 9, 20);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.4, 9.5);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const keyLight = new THREE.DirectionalLight(0xfff2cf, 1.4);
  keyLight.position.set(4, 6, 6);
  scene.add(keyLight);
  const goldLight = new THREE.PointLight(0xe8b34b, 60, 30, 1.8);
  goldLight.position.set(0, 1.2, 1.5);
  scene.add(goldLight);

  const world = new THREE.Group();
  scene.add(world);

  /* --- the receipt chain: seven glowing blocks on an arc --- */
  const blockMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2113, metalness: 0.55, roughness: 0.35,
    emissive: 0xe8b34b, emissiveIntensity: 0.55,
  });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xf6c95e, transparent: true, opacity: 0.9 });
  const blockGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
  const blockEdges = new THREE.EdgesGeometry(blockGeo);
  const blocks = [];
  const chainPoints = [];
  const N = 7;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1); // 0..1 across the arc
    const x = (t - 0.5) * 7.2;
    const y = Math.sin(t * Math.PI) * 0.9 - 0.4;
    const z = Math.cos((t - 0.5) * Math.PI) * 0.7;
    const mesh = new THREE.Mesh(blockGeo, blockMaterial.clone());
    mesh.position.set(x, y, z);
    mesh.rotation.set(0.15, t * 0.9 - 0.45, 0.1);
    mesh.userData.index = i + 1;
    mesh.add(new THREE.LineSegments(blockEdges, edgeMaterial));
    world.add(mesh);
    blocks.push(mesh);
    chainPoints.push(new THREE.Vector3(x, y, z));
  }
  /* the chain link: a line threading every block */
  const chainLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(chainPoints),
    new THREE.LineBasicMaterial({ color: 0xe8b34b, transparent: true, opacity: 0.45 })
  );
  world.add(chainLine);

  /* --- the vault: a glass cube with a turning core, above the middle block --- */
  const vault = new THREE.Group();
  vault.position.set(0, 1.35, 0);
  const vaultShell = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({
      color: 0x8a6a25, metalness: 0.7, roughness: 0.25,
      emissive: 0xe8b34b, emissiveIntensity: 0.22, transparent: true, opacity: 0.85,
    })
  );
  const vaultEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.5)),
    new THREE.LineBasicMaterial({ color: 0xf6c95e })
  );
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55),
    new THREE.MeshStandardMaterial({ color: 0xf6c95e, metalness: 0.9, roughness: 0.15, emissive: 0xe8b34b, emissiveIntensity: 0.9 })
  );
  vault.add(vaultShell, vaultEdges, core);
  world.add(vault);

  /* --- dust particles --- */
  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
    color: 0xe8b34b, size: 0.045, transparent: true, opacity: 0.65,
  }));
  world.add(particles);

  /* --- wireframe terrain floor, fading into the fog --- */
  const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26, 26, 26),
    new THREE.MeshBasicMaterial({ color: 0x9a7422, wireframe: true, transparent: true, opacity: 0.22 })
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -2.3;
  world.add(terrain);

  /* --- glass torus ring around the vault --- */
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.045, 16, 90),
    new THREE.MeshStandardMaterial({
      color: 0x9fd8cf, metalness: 0.2, roughness: 0.1,
      transparent: true, opacity: 0.55, emissive: 0x2a6f66, emissiveIntensity: 0.4,
    })
  );
  halo.rotation.x = Math.PI / 2.6;
  halo.position.copy(vault.position);
  world.add(halo);

  /* --- three chrome orbs in orbit around the vault --- */
  const orbMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6c95e, metalness: 0.95, roughness: 0.12,
    emissive: 0xe8b34b, emissiveIntensity: 0.25,
  });
  const orbs = [
    { mesh: new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), orbMaterial), radius: 2.7, speed: 0.25, phase: 0.0 },
    { mesh: new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 32), orbMaterial), radius: 3.5, speed: 0.18, phase: 2.1 },
    { mesh: new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), orbMaterial), radius: 4.3, speed: -0.22, phase: 4.2 },
  ];
  orbs.forEach((o) => world.add(o.mesh));

  world.position.y = -0.35;

  /* --- sizing --- */
  function resize() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* --- interaction: drag to turn, hover/click a block --- */
  let autoRotate = true;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let targetRotY = 0;
  let targetRotX = 0;
  const mouse = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function stopAutoRotate() { autoRotate = false; }

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    stopAutoRotate();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    if (!dragging) return;
    targetRotY += (e.clientX - lastX) * 0.008;
    targetRotX += (e.clientY - lastY) * 0.004;
    targetRotX = Math.max(-0.5, Math.min(0.5, targetRotX));
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });

  canvas.addEventListener('click', (e) => {
    if (dragging) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(blocks, false);
    if (!hits.length) return;
    const block = hits[0].object;
    block.scale.setScalar(1.25);
    window.setTimeout(() => block.scale.setScalar(1), 320);
    caption.textContent = 'Receipt #' + block.userData.index +
      ' of 7 — each block hashes the one before it. Change one, and the chain breaks.';
  });

  /* --- render loop: pauses off-screen, one static frame under reduced motion --- */
  let running = false;
  let rafId = 0;
  let lastTime = 0;

  function renderFrame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const t = now / 1000;
    if (autoRotate) {
      world.rotation.y += dt * 0.12;
      vault.rotation.y += dt * 0.25;
    }
    core.rotation.x += dt * 0.6;
    core.rotation.y += dt * 0.8;
    particles.rotation.y += dt * 0.015;
    halo.rotation.z += dt * 0.3;
    orbs.forEach((o) => {
      const a = t * o.speed + o.phase;
      o.mesh.position.set(Math.cos(a) * o.radius, 1.35 + Math.sin(t * 0.7 + o.phase) * 0.35, Math.sin(a) * o.radius * 0.6);
    });
    world.rotation.y += (targetRotY - world.rotation.y) * 0.08;
    world.rotation.x += (targetRotX - world.rotation.x) * 0.08;
    camera.position.x += (mouse.x * 0.9 - camera.position.x) * 0.04;
    camera.position.y += (1.4 + mouse.y * 0.45 - camera.position.y) * 0.04;
    camera.lookAt(0, 0.35, 0);
    renderer.render(scene, camera);
  }

  function loop(now) {
    if (!running) return;
    renderFrame(now);
    rafId = window.requestAnimationFrame(loop);
  }

  function start() {
    if (running || prefersReducedMotion) return;
    running = true;
    lastTime = performance.now();
    rafId = window.requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
  }

  if (prefersReducedMotion) {
    resize();
    renderFrame(performance.now());
    caption.textContent = 'Seven receipt blocks, each chained to the one before it. Motion is paused — reduced-motion is on.';
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) start(); else stop(); });
    }, { threshold: 0.05 });
    observer.observe(wrap);
    start();
  }
})();

/* ============ STATIC 3D CANVASES — no continuous loop ============ */
/* Shared helper: a WebGL canvas that renders one frame on demand — on first
   sight, while scrolling through it, on drag, or when its owner asks.
   Never a second real-time loop; off-screen it stays put. Reduced motion:
   one static frame, no scroll or drag response. */
function staticCanvas(canvas, fov, camPos) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(camPos[0], camPos[1], camPos[2]);
  function render() {
    /* size from the CANVAS's own displayed size, not its parent's — the
       parent (figure / side panel / footer block) is wider or taller than
       the canvas, and sizing from it squashes the render. */
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  return { scene, camera, render };
}

/* Re-render a static canvas while the page scrolls through it. Calls
   onScroll(progress 0..1) only while the canvas is on screen. */
function scrollDriven(canvas, onScroll) {
  let ticking = false;
  function update() {
    ticking = false;
    const rect = canvas.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) return;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    onScroll(progress);
  }
  function request() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  return { request };
}

/* Drag-to-turn for a static canvas. Calls onDrag(dx, dy) and re-renders. */
function dragTurn(canvas, onDrag) {
  let dragging = false;
  let lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    onDrag(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
}

/* ================= DIORAMA — scroll-driven vault (How it works) ================= */
(function initDiorama() {
  const canvas = document.getElementById('diorama-canvas');
  if (!canvas) return;
  const ctx = staticCanvas(canvas, 42, [0, 1.2, 8.5]);
  if (!ctx) return;
  const { scene, camera, render } = ctx;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xfff2cf, 1.4);
  key.position.set(4, 6, 6);
  scene.add(key);
  const glow = new THREE.PointLight(0xe8b34b, 50, 30, 1.8);
  glow.position.set(0, 1, 2);
  scene.add(glow);
  const rim = new THREE.PointLight(0x7fd4c1, 30, 30, 1.8);
  rim.position.set(-3, 2, -3);
  scene.add(rim);

  const world = new THREE.Group();
  scene.add(world);
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 1.7, 1.7),
    new THREE.MeshStandardMaterial({
      color: 0x8a6a25, metalness: 0.7, roughness: 0.25,
      emissive: 0xe8b34b, emissiveIntensity: 0.5, transparent: true, opacity: 0.62,
    })
  );
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.7, 1.7, 1.7)),
    new THREE.LineBasicMaterial({ color: 0xf6c95e })
  );
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.6),
    new THREE.MeshStandardMaterial({ color: 0xf6c95e, metalness: 0.9, roughness: 0.15, emissive: 0xe8b34b, emissiveIntensity: 0.9 })
  );
  world.add(shell, edges, core);
  /* three control rings: limits (gold), session keys (teal), receipts (bone) */
  const rings = [
    { color: 0xe8b34b, radius: 1.9, tilt: 0.5, spin: 0.12 },
    { color: 0x7fd4c1, radius: 2.35, tilt: -0.4, spin: -0.09 },
    { color: 0xf2ede1, radius: 2.8, tilt: 0.9, spin: 0.06 },
  ].map((r) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r.radius, 0.035, 12, 90),
      new THREE.MeshStandardMaterial({
        color: r.color, metalness: 0.6, roughness: 0.3,
        transparent: true, opacity: 0.7, emissive: r.color, emissiveIntensity: 0.25,
      })
    );
    ring.rotation.x = r.tilt;
    world.add(ring);
    return { mesh: ring, spin: r.spin };
  });
  camera.lookAt(0, 0, 0);

  let dragY = 0, dragX = 0;
  function draw(progress) {
    world.rotation.y = progress * Math.PI * 1.5 + dragY;
    world.rotation.x = dragX;
    core.rotation.y = progress * Math.PI * 2;
    rings.forEach((r) => { r.mesh.rotation.z = progress * r.spin * 20; });
    render();
  }
  render();
  if (prefersReducedMotion) return;
  scrollDriven(canvas, draw);
  dragTurn(canvas, (dx, dy) => {
    dragY += dx * 0.008;
    dragX = Math.max(-0.5, Math.min(0.5, dragX + dy * 0.004));
    const rect = canvas.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    draw(progress);
  });
})();

/* ================= SHIELD — holographic verdict (Try the guard) ================= */
(function initShield() {
  const canvas = document.getElementById('shield-canvas');
  const wrap = canvas ? canvas.parentElement : null;
  if (!canvas || !wrap) return;
  const ctx = staticCanvas(canvas, 42, [0, 0.4, 6.5]);
  if (!ctx) return;
  const { scene, camera, render } = ctx;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xfff2cf, 1.3);
  key.position.set(3, 5, 5);
  scene.add(key);

  const group = new THREE.Group();
  scene.add(group);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xf6c95e, metalness: 0.9, roughness: 0.15,
    emissive: 0xe8b34b, emissiveIntensity: 0.9, transparent: true, opacity: 0.95,
  });
  const shellMat = new THREE.LineBasicMaterial({ color: 0xf6c95e, transparent: true, opacity: 0.9 });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.85), coreMat);
  const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.5, 0)), shellMat);
  group.add(core, shell);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.03, 12, 80),
    new THREE.MeshStandardMaterial({
      color: 0xe8b34b, metalness: 0.5, roughness: 0.3,
      transparent: true, opacity: 0.5, emissive: 0xe8b34b, emissiveIntensity: 0.3,
    })
  );
  halo.rotation.x = Math.PI / 3;
  group.add(halo);
  camera.lookAt(0, 0, 0);

  let dragY = 0, dragX = 0;
  function draw() {
    group.rotation.y = dragY;
    group.rotation.x = dragX;
    render();
  }
  const STATES = {
    idle: { core: 0xf6c95e, emissive: 0xe8b34b, shell: 0xf6c95e },
    allow: { core: 0x8fce9b, emissive: 0x3f8f5f, shell: 0x8fce9b },
    revert: { core: 0xe06c5a, emissive: 0x8f3f34, shell: 0xe06c5a },
  };
  function setState(name) {
    const s = STATES[name] || STATES.idle;
    coreMat.color.setHex(s.core);
    coreMat.emissive.setHex(s.emissive);
    shellMat.color.setHex(s.shell);
    halo.material.color.setHex(s.core);
    halo.material.emissive.setHex(s.emissive);
    draw();
    wrap.classList.remove('pulse');
    void wrap.offsetWidth; // restart the pulse animation
    wrap.classList.add('pulse');
  }
  draw();
  if (prefersReducedMotion) {
    window.addEventListener('guard-verdict', (e) => setState(e.detail.allowed ? 'allow' : 'revert'));
    return;
  }
  dragTurn(canvas, (dx, dy) => {
    dragY += dx * 0.008;
    dragX = Math.max(-0.5, Math.min(0.5, dragX + dy * 0.004));
    draw();
  });
  window.addEventListener('guard-verdict', (e) => setState(e.detail.allowed ? 'allow' : 'revert'));
  window.addEventListener('guard-reset', () => setState('idle'));
})();

/* ================= KEY — gold key emblem (footer) ================= */
(function initKey() {
  const canvas = document.getElementById('key-canvas');
  if (!canvas) return;
  const ctx = staticCanvas(canvas, 40, [0, 0.6, 7]);
  if (!ctx) return;
  const { scene, camera, render } = ctx;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const keyLight = new THREE.DirectionalLight(0xfff2cf, 1.5);
  keyLight.position.set(3, 5, 4);
  scene.add(keyLight);

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf6c95e, metalness: 0.95, roughness: 0.12,
    emissive: 0xe8b34b, emissiveIntensity: 0.35,
  });
  const key = new THREE.Group();
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.16, 14, 36), goldMat);
  bow.position.x = -1.25;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.3, 16), goldMat);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.x = 0.15;
  const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.13), goldMat);
  tooth1.position.set(1.05, -0.28, 0);
  const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.13), goldMat);
  tooth2.position.set(1.35, -0.22, 0);
  key.add(bow, shaft, tooth1, tooth2);
  key.rotation.z = 0.12;
  key.rotation.x = -0.22; // tilt toward the viewer so the flat key catches light
  key.scale.setScalar(1.3);
  scene.add(key);
  camera.lookAt(0, 0, 0);

  function draw(progress) {
    /* small sway only — the key must never turn edge-on to the viewer */
    key.rotation.y = progress * 0.6 - 0.3;
    render();
  }
  render();
  if (prefersReducedMotion) return;
  scrollDriven(canvas, draw);
})();

/* ================= SCROLL REVEAL ================= */
(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => observer.observe(el));
})();

/* ================= 3D TILT ON CARDS ================= */
(function initTilt() {
  if (prefersReducedMotion || !finePointer) return;
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = 'perspective(900px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 7).toFixed(2) + 'deg) translateY(-3px)';
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
})();

/* ================= GUARD-CHECK WIDGET ================= */
/* Local mirror of the contract's pay() checks. Demo figures only — no chain calls. */
(function initGuardCheck() {
  const form = document.getElementById('guard-form');
  const result = document.getElementById('guard-result');
  const ledger = document.getElementById('demo-ledger');
  const recipientSelect = document.getElementById('recipient');
  const resetBtn = document.getElementById('guard-reset');
  if (!form || !result) return;

  const RECIPIENTS = {
    supplier:   { label: 'Supplier', perTx: 500, perDay: 1000, perWeek: 2500, spentToday: 400, spentWeek: 1100 },
    agent:      { label: 'Agent wallet', perTx: 100, perDay: 300, perWeek: 1000, spentToday: 120, spentWeek: 450 },
    treasurer:  { label: 'Treasurer', perTx: 2000, perDay: 5000, perWeek: 10000, spentToday: 1500, spentWeek: 4200 },
    stranger:   { label: 'Unknown address', perTx: null, perDay: null, perWeek: null, spentToday: 0, spentWeek: 0 },
  };
  const SESSION_MAX_PER_TX = 100;
  const SESSION_SCOPE = 'supplies';

  function updateLedger() {
    const r = RECIPIENTS[recipientSelect.value];
    ledger.innerHTML = 'Already spent by this recipient — today: <strong>' + r.spentToday +
      '</strong> · this week: <strong>' + r.spentWeek + '</strong> tUSD8. Demo figures, set for this page only.';
  }
  recipientSelect.addEventListener('change', updateLedger);
  updateLedger();

  function verdict(allowed, rule, explanation) {
    window.dispatchEvent(new CustomEvent('guard-verdict', { detail: { allowed } }));
    result.innerHTML =
      '<p><span class="guard-verdict ' + (allowed ? 'allow' : 'revert') + '">' +
      (allowed ? 'ALLOW — payment passes' : 'REVERT — payment blocked') + '</span></p>' +
      '<p class="rule-line">Rule: <code>' + rule + '</code></p>' +
      '<p>' + explanation + '</p>' +
      '<p>Local demo only — the same checks run on-chain inside <code>pay()</code>. No chain call was made.</p>';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const payer = document.getElementById('payer').value;
    const recipientKey = recipientSelect.value;
    const category = document.getElementById('category').value;
    const amount = Number(document.getElementById('amount').value);
    const r = RECIPIENTS[recipientKey];

    /* caller checks, in contract order */
    if (payer === 'expired') {
      verdict(false, 'SessionExpired', 'This session key has passed its expiry. Expired keys cannot pay — the owner would need to grant a new one.');
      return;
    }
    if (payer === 'revoked') {
      verdict(false, 'SessionRevoked', 'This session key was revoked by the owner. Revoked keys cannot pay, even before their expiry.');
      return;
    }
    if (payer === 'live' && category !== SESSION_SCOPE) {
      verdict(false, 'ScopeMismatch', 'This session key is scoped to “supplies” only. It cannot pay for “' + category + '”.');
      return;
    }
    if (payer === 'live' && amount > SESSION_MAX_PER_TX) {
      verdict(false, 'OverPerTxCap', 'The session key’s own per-transaction cap is 100 tUSD8. This payment is ' + amount + ' tUSD8 — past the key’s cap, whatever the recipient’s limit says.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      verdict(false, 'ZeroAmount', 'The amount is zero or missing. A payment of nothing reverts.');
      return;
    }
    if (r.perTx === null) {
      verdict(false, 'NoActiveLimit', 'No limit has been set for this address. Default-deny: with no active limit, no payment can happen.');
      return;
    }
    if (amount > r.perTx) {
      verdict(false, 'OverPerTxCap', 'The per-transaction cap for ' + r.label + ' is ' + r.perTx + ' tUSD8. This payment is ' + amount + ' tUSD8.');
      return;
    }
    if (r.spentToday + amount > r.perDay) {
      verdict(false, 'OverDailyCap', r.label + ' has already spent ' + r.spentToday + ' tUSD8 today, against a daily cap of ' + r.perDay + '. Adding ' + amount + ' would pass it.');
      return;
    }
    if (r.spentWeek + amount > r.perWeek) {
      verdict(false, 'OverWeeklyCap', r.label + ' has already spent ' + r.spentWeek + ' tUSD8 this week, against a weekly cap of ' + r.perWeek + '. Adding ' + amount + ' would pass it.');
      return;
    }
    verdict(true, 'pay() — all checks passed', 'Caller allowed, recipient limit active, amount inside the per-transaction, daily and weekly caps. On-chain, this payment would transfer the tUSD8 and append a receipt to the chain.');
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    updateLedger();
    window.dispatchEvent(new CustomEvent('guard-reset'));
    result.innerHTML = '<p class="guard-result-empty">Run a check to see the guard’s answer.</p>';
  });
})();

/* ================= COPY BUTTONS ================= */
(function initCopy() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      const original = btn.textContent;
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { ta.setSelectionRange(0, ta.value.length); } catch (e) { /* older browsers */ }
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
      }
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      window.setTimeout(() => { btn.textContent = original; }, 1600);
    });
  });
})();
