import * as THREE from "three";
import { detectQuality, SHARDS, tune, type Quality, type ShardSpec } from "./config";
import { makeShardTexture } from "./text";

// ---------------------------------------------------------------------------
// Deterministic RNG — the shard silhouettes must be identical every reload.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Randomly sampled angles rather than even steps is what makes it read as
 * broken glass: clumps of tight corners separated by long straight runs.
 * Sorting keeps the polygon star-shaped so it never self-intersects.
 */
function jaggedShape(rng: () => number, points: number, aspect: number, spike: number) {
  const angles: number[] = [];
  for (let i = 0; i < points; i++) angles.push(rng() * Math.PI * 2);
  angles.sort((a, b) => a - b);
  for (let i = 1; i < angles.length; i++) {
    if (angles[i] - angles[i - 1] < 0.16) angles[i] = angles[i - 1] + 0.16;
  }

  const pts: THREE.Vector2[] = [];
  for (const a of angles) {
    let r = 0.62 + rng() * rng() * 0.52;
    if (rng() < 0.26) r += spike * (0.5 + rng() * 0.5);
    pts.push(new THREE.Vector2(Math.cos(a) * r * aspect, Math.sin(a) * r));
  }
  const shear = (rng() - 0.5) * 0.45;
  for (const p of pts) p.x += p.y * shear;
  return new THREE.Shape(pts);
}

/** ExtrudeGeometry's own UV generator is unusable for a baked planar map. */
function planarUVs(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const w = bb.max.x - bb.min.x;
  const h = bb.max.y - bb.min.y;
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - bb.min.x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / h;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function shardGeometry(seed: number, q: Quality, points: number, aspect: number, depth = 0.16) {
  const rng = mulberry32(seed);
  const geo = new THREE.ExtrudeGeometry(jaggedShape(rng, points, aspect, 0.42), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.055,
    bevelOffset: 0,
    // The bevel is what sells it: a flat transmissive plane just looks like a
    // window. The ring of small facets is what throws the chromatic fringe.
    bevelSegments: q === "low" ? 1 : 2,
    steps: 1,
    curveSegments: 1,
  });
  planarUVs(geo);
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

/** Procedural warm equirect so the glass has something directional to reflect. */
function warmEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, "#2a1d12");
  g.addColorStop(0.42, "#c98f4a");
  g.addColorStop(0.55, "#ffd9a8");
  g.addColorStop(0.75, "#6d4a2a");
  g.addColorStop(1.0, "#1c120a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  // A couple of soft hot spots give the bevels something to catch.
  for (const [x, y, r, a] of [
    [150, 105, 90, 0.75],
    [370, 130, 70, 0.5],
  ] as const) {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(255,236,205,${a})`);
    rg.addColorStop(1, "rgba(255,236,205,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

const BACKDROP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Warm "curtain of light": broad vertical curtains, fine striations and a soft
// hot core. Amber rather than the red of the reference.
const BACKDROP_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uCore;
  uniform vec3  uBase;
  uniform vec3  uHot;
  uniform float uCurtain;
  uniform float uStriation;
  uniform float uExposure;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
               mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 d  = uv - uCore;

    float drift = uTime * 0.035;
    float curtains   = fbm(vec2(uv.x * uCurtain + drift, uv.y * 1.2));
    float striations = fbm(vec2(uv.x * uStriation - drift * 2.0, uv.y * 0.6)) * 0.35;

    float radial = 1.0 - smoothstep(0.0, 1.05, length(d * vec2(1.15, 0.95)));
    float core   = pow(max(0.0, 1.0 - length(d * vec2(2.4, 1.9))), 3.0);
    float flick  = 0.92 + 0.08 * sin(uTime * 0.9);

    float energy = (curtains * 0.75 + striations) * radial + core * 1.35 * flick;
    vec3 col = mix(uBase, uHot, clamp(energy, 0.0, 1.0));
    col *= uExposure * (0.35 + energy);

    // Gentle vignette so the frame edges fall away.
    col *= 1.0 - 0.32 * smoothstep(0.45, 1.15, length(uv - 0.5) * 1.6);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export type ShardScene = {
  setProgress: (p: number) => void;
  resize: () => void;
  start: () => void;
  dispose: () => void;
};

export function createShardScene(canvas: HTMLCanvasElement): ShardScene {
  const q = detectQuality();
  const T = tune(q);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: q !== "low",
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, q === "high" ? 2 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // The single biggest perf lever for transmissive glass.
  if ("transmissionResolutionScale" in renderer) {
    (renderer as unknown as { transmissionResolutionScale: number }).transmissionResolutionScale =
      T.transmissionScale;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(T.fov, 1, 0.1, 200);
  camera.position.z = T.cameraZ;
  scene.add(camera);

  const envMap = warmEnvironment(renderer);
  scene.environment = envMap;

  // The backdrop is a MESH, not scene.background. MeshPhysicalMaterial's
  // transmission re-renders the scene into an offscreen buffer and the glass
  // samples *that* — a background texture never lands in it, so it would not
  // refract. The quad rides with the camera so it always fills the frustum.
  const BACK_DIST = 60;
  const backdropMat = new THREE.ShaderMaterial({
    vertexShader: BACKDROP_VERT,
    fragmentShader: BACKDROP_FRAG,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uCore: { value: new THREE.Vector2(0.5, 0.46) },
      uBase: { value: new THREE.Color(0.34, 0.19, 0.11) },
      uHot: { value: new THREE.Color(1.0, 0.72, 0.42) },
      uCurtain: { value: 5.5 },
      uStriation: { value: 42.0 },
      uExposure: { value: 1.32 },
    },
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backdropMat);
  backdrop.position.z = -BACK_DIST;
  backdrop.renderOrder = -1;
  camera.add(backdrop);

  const key = new THREE.DirectionalLight(0xffe2bd, 2.4);
  key.position.set(-3, 2.5, 4);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xffd7ad, 0.35));

  // --- shards ---------------------------------------------------------------
  function glassMaterial(emissive: THREE.Texture | null) {
    const g = T.glass;
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xfff6ec,
      metalness: 0,
      roughness: g.roughness,
      transmission: 1,
      thickness: g.thickness,
      ior: g.ior,
      attenuationColor: new THREE.Color(g.attenuationColor),
      attenuationDistance: g.attenuationDistance,
      specularIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      iridescence: g.iridescence,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [200, 900],
      envMap,
      envMapIntensity: 2.0,
      // FrontSide deliberately: DoubleSide shows the emissive type a second
      // time on the far cap, refracted and offset — it reads as a bug.
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: true,
    });
    if ("dispersion" in mat) mat.dispersion = g.dispersion;
    if (emissive) {
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveMap = emissive;
      mat.emissiveIntensity = 0.5;
    }
    return mat;
  }

  const field = new THREE.Group();
  scene.add(field);

  type Holder = {
    group: THREE.Group;
    beat: number;
    home: THREE.Vector3;
    baseRot: THREE.Euler;
    phase: number;
    mat: THREE.MeshPhysicalMaterial;
  };

  const holders: Holder[] = [];
  const disposables: Array<{ dispose: () => void }> = [envMap];

  SHARDS.forEach((spec: ShardSpec, i) => {
    const geo = shardGeometry(1000 + i * 37, q, 9 + (i % 3), 1.7 + (i % 2) * 0.22);
    const tex = makeShardTexture(spec, q);
    const mat = glassMaterial(tex);
    // Vary the thin-film thickness per shard so each breaks light into a
    // different part of the spectrum instead of all going the same green.
    const base = 180 + i * 150;
    mat.iridescenceThicknessRange = [base, base + 620];

    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.setScalar(spec.scale);
    mesh.renderOrder = 4;

    const group = new THREE.Group();
    group.add(mesh);
    const sx = spec.side === "left" ? -1.2 : spec.side === "right" ? 1.1 : 0;
    group.position.set(sx, 0.4, 0.1 - (i % 3) * 0.35);
    group.rotation.set(...spec.tilt);
    field.add(group);

    holders.push({
      group,
      beat: i,
      home: group.position.clone(),
      baseRot: group.rotation.clone(),
      phase: i * 1.7,
      mat,
    });
    disposables.push(geo, tex, mat);
  });

  // --- debris ---------------------------------------------------------------
  const debrisGeos = [0, 1, 2, 3].map((k) => shardGeometry(5000 + k * 91, q, 6, 1.5, 0.05));
  const debrisMat = glassMaterial(null);
  debrisMat.thickness = 0.3;
  disposables.push(...debrisGeos, debrisMat);

  const debris: Array<{ mesh: THREE.Mesh; spin: THREE.Vector3; drift: number; phase: number; homeY: number }> = [];
  const rng = mulberry32(99);
  for (let i = 0; i < T.debris; i++) {
    const m = new THREE.Mesh(debrisGeos[i % debrisGeos.length], debrisMat);
    m.scale.setScalar(0.08 + rng() * 0.24);
    m.position.set((rng() - 0.5) * 9, (rng() - 0.5) * 6, -1.5 - rng() * 14);
    m.rotation.set(rng() * 6.28, rng() * 6.28, rng() * 6.28);
    m.renderOrder = 3;
    field.add(m);
    debris.push({
      mesh: m,
      spin: new THREE.Vector3((rng() - 0.5) * 0.25, (rng() - 0.5) * 0.25, (rng() - 0.5) * 0.25),
      drift: 0.1 + rng() * 0.35,
      phase: rng() * 6.28,
      homeY: m.position.y,
    });
  }

  // --- loop -----------------------------------------------------------------
  const SPAN_Y = 3.8;
  const SPAN_X = 0.55;
  const SPAN_Z = 1.1;

  let target = 0;
  let current = 0;
  let raf = 0;
  let last = performance.now();
  let running = false;
  const clock = new THREE.Clock();

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Size the backdrop to exactly fill the frustum at its distance.
    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * BACK_DIST;
    backdrop.scale.set(vh * camera.aspect * 1.05, vh * 1.05, 1);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    current += (target - current) * T.scroll.damping;
    const t = clock.getElapsedTime();
    backdropMat.uniforms.uTime.value = t;

    const beats = Math.max(1, SHARDS.length - 1);
    const head = current * beats;

    for (const h of holders) {
      const k = head - h.beat; // 0 = this shard is the hero
      const ak = Math.abs(k);

      h.group.position.y = h.home.y + k * SPAN_Y + Math.sin(t * 0.45 + h.phase) * 0.12;
      h.group.position.x = h.home.x + k * SPAN_X + Math.cos(t * 0.33 + h.phase) * 0.09;
      h.group.position.z = h.home.z - ak * SPAN_Z;
      h.group.rotation.x = h.baseRot.x + Math.sin(t * 0.28 + h.phase) * 0.06 + k * 0.1;
      h.group.rotation.y = h.baseRot.y + Math.sin(t * 0.21 + h.phase * 1.3) * 0.09 - k * 0.16;
      h.group.rotation.z = h.baseRot.z + Math.cos(t * 0.19 + h.phase) * 0.04 + k * 0.07;

      const a = 1 - THREE.MathUtils.smoothstep(ak, 1.0, 1.5);
      h.mat.opacity = a;
      if (h.mat.emissiveMap) h.mat.emissiveIntensity = 0.5 * a;
      h.group.visible = a > 0.01;
    }

    for (const d of debris) {
      d.mesh.rotation.x += d.spin.x * dt;
      d.mesh.rotation.y += d.spin.y * dt;
      d.mesh.rotation.z += d.spin.z * dt;
      d.mesh.position.y = d.homeY + Math.sin(t * d.drift + d.phase) * 0.35 + head * 0.9;
    }

    // Slight camera drift keeps the glass alive when nobody is scrolling.
    camera.position.x = Math.sin(t * 0.12) * 0.12;
    camera.position.y = Math.cos(t * 0.09) * 0.08;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  return {
    setProgress: (p) => {
      target = Math.max(0, Math.min(1, p));
    },
    resize,
    start: () => {
      if (running) return;
      running = true;
      resize();
      last = performance.now();
      frame();
    },
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      for (const d of disposables) d.dispose();
      backdrop.geometry.dispose();
      backdropMat.dispose();
      renderer.dispose();
    },
  };
}
