// 3D pickleballs floating in the hero (Three.js). Click / tap a ball to smack it.
import * as THREE from "three";

const stage = document.getElementById("ballStage");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function supportsWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

if (stage && supportsWebGL()) init();

function holeTexture(base, hole) {
  const W = 1024, H = 512;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  // subtle seam
  g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  // 40 holes on a Fibonacci sphere, projected to equirect
  const N = 40, golden = Math.PI * (3 - Math.sqrt(5));
  g.fillStyle = hole;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    const lat = Math.asin(y), lon = Math.atan2(Math.sin(th) * r, Math.cos(th) * r);
    const u = ((lon + Math.PI) / (2 * Math.PI)) * W, v = (0.5 - lat / Math.PI) * H;
    const rad = 17, sx = rad / Math.max(0.18, Math.cos(lat));
    for (const off of [-W, 0, W]) {
      g.beginPath(); g.ellipse(u + off, v, sx, rad, 0, 0, Math.PI * 2); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  scene.add(new THREE.HemisphereLight(0xbfdcff, 0x0b1530, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 6, 8); scene.add(key);
  const rimR = new THREE.PointLight(0xff2338, 40, 30); rimR.position.set(-7, -2, 3); scene.add(rimR);
  const rimB = new THREE.PointLight(0x1e9bff, 40, 30); rimB.position.set(7, 3, 2); scene.add(rimB);

  const geo = new THREE.SphereGeometry(1, 96, 64);
  const defs = [
    { base: "#d8ff3a", hole: "#5c7d06", size: 1.7, home: [5.4, 2.6, -1], spin: 0.35 },
    { base: "#3fb0ff", hole: "#0c4f8f", size: 1.05, home: [-5.6, -2.4, 0], spin: -0.5 },
    { base: "#ff4a5c", hole: "#8c0f1c", size: 0.7, home: [-4.4, 3.2, -2], spin: 0.6 },
    { base: "#c6ff6b", hole: "#4d6b10", size: 0.55, home: [4.6, -3.1, 1], spin: -0.7 },
  ];
  const balls = defs.map((d, i) => {
    const mat = new THREE.MeshPhysicalMaterial({ map: holeTexture(d.base, d.hole), roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color(d.base) });
    const m = new THREE.Mesh(geo, mat);
    m.scale.setScalar(0.0001);
    m.userData = { ...d, pos: new THREE.Vector3(...d.home), vel: new THREE.Vector3(), phase: i * 1.7, target: d.size };
    m.position.copy(m.userData.pos);
    m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    scene.add(m);
    return m;
  });

  // layout scaling for narrow screens
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const narrow = w / h < 0.9;
    balls.forEach((b) => {
      const [x, y, z] = b.userData.home;
      b.userData.pos.set(narrow ? x * 0.42 : x, narrow ? y * 1.45 : y, z);
      b.userData.target = b.userData.size * (narrow ? 0.62 : 1);
    });
  }
  resize();
  new ResizeObserver(resize).observe(stage);

  // pointer parallax + click to smack
  const pointer = new THREE.Vector2(0, 0), ray = new THREE.Raycaster();
  addEventListener("pointermove", (e) => { pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); }, { passive: true });
  stage.parentElement.addEventListener("pointerdown", (e) => {
    const r = stage.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(p, camera);
    const hit = ray.intersectObjects(balls)[0];
    if (!hit) return;
    const b = hit.object;
    const dir = b.position.clone().sub(hit.point).normalize();
    b.userData.vel.add(dir.multiplyScalar(0.55)).add(new THREE.Vector3(0, 0.25, 0));
    b.userData.kick = 1;
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
    if (window.confetti) confetti({ particleCount: 24, spread: 60, startVelocity: 26, origin: { x: e.clientX / innerWidth, y: e.clientY / innerHeight }, colors: ["#c6ff6b", "#1e9bff", "#ff2338"], scalar: 0.8, ticks: 90 });
  });

  let scrollY = 0;
  addEventListener("scroll", () => (scrollY = window.scrollY), { passive: true });

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(stage);

  let ready = false;
  document.addEventListener("rj:ready", () => (ready = true));
  setTimeout(() => (ready = true), 4000);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const sp = scrollY / innerHeight;
    balls.forEach((b, i) => {
      const u = b.userData;
      // spring back home
      const home = u.pos.clone();
      home.y += Math.sin(t * 0.8 + u.phase) * 0.35 + sp * (i % 2 ? 3 : 5);
      home.x += pointer.x * (0.5 + i * 0.15);
      home.y += pointer.y * (0.35 + i * 0.1);
      const toHome = home.sub(b.position).multiplyScalar(3.2 * dt);
      u.vel.add(toHome).multiplyScalar(0.94);
      b.position.add(u.vel);
      b.rotation.y += (u.spin + u.vel.length() * 6) * dt * (reduce ? 0.2 : 1);
      b.rotation.x += u.spin * 0.4 * dt;
      // squash on kick
      u.kick = (u.kick || 0) * 0.9;
      const s = ready ? u.target : 0.0001;
      const cur = b.scale.x + (s - b.scale.x) * Math.min(1, dt * 3.2);
      b.scale.set(cur * (1 + u.kick * 0.25), cur * (1 - u.kick * 0.2), cur);
    });
    renderer.render(scene, camera);
  }
  frame();
}
