/**
 * DetonationEffect.js — Visual effects for nuclear detonations
 * Includes: flash, fireball, shockwave ring, blast radii circles,
 * mushroom cloud (particle system), and fallout plume.
 */
import * as THREE from 'three';
import { calcBlastRadii } from '../simulation/BlastPhysics.js';

// ---- Helpers ----

function latLngToVec3(lat, lng, r = 1.0) {
  const phi   = (90.0 - lat)  * (Math.PI / 180.0);
  const theta = (lng  + 180.0) * (Math.PI / 180.0);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

/** Create a circle on the sphere surface (great-circle approximation) */
function createSphereCircle(center, radiusKm, color, opacity = 0.8, linewidth = 1) {
  const R_EARTH = 6371;
  const angRad = radiusKm / R_EARTH;
  if (angRad <= 0) return null;

  const N = 128;
  const pts = [];
  const cNorm = center.clone().normalize();

  // Build local orthogonal basis at center
  let up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(cNorm.dot(up)) > 0.99) up.set(1, 0, 0);
  const t1 = new THREE.Vector3().crossVectors(up, cNorm).normalize();
  const t2 = new THREE.Vector3().crossVectors(cNorm, t1).normalize();

  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const pt = cNorm.clone().multiplyScalar(Math.cos(angRad))
      .add(t1.clone().multiplyScalar(Math.sin(angRad) * Math.cos(a)))
      .add(t2.clone().multiplyScalar(Math.sin(angRad) * Math.sin(a)));
    pts.push(pt.multiplyScalar(1.003)); // Slightly above surface
  }

  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  return new THREE.Line(geo, mat);
}

/** Create filled disc on sphere surface (simple plane aligned to surface) */
function createSphereDisc(center, radiusKm, color, opacity) {
  const earthR = 1.0;
  const visR = (radiusKm / 6371) * earthR * 400; // exaggerate for visibility
  const clampedR = Math.min(visR, 0.4);

  const geo = new THREE.CircleGeometry(clampedR, 64);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);

  const norm = center.clone().normalize();
  mesh.position.copy(norm.multiplyScalar(1.002));
  mesh.lookAt(norm.clone().multiplyScalar(2));

  return mesh;
}

// ---- Mushroom Cloud ----

const CLOUD_VERT = /* glsl */`
  attribute float aRand;
  attribute float aPhase;
  uniform float uTime;
  uniform float uProgress; // 0..1 rise progress
  varying float vHeat;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Turbulence
    float noise = sin(pos.y * 8.0 + uTime * 2.0 + aPhase) * 0.01
                + cos(pos.x * 12.0 + uTime * 1.5 + aRand) * 0.008;
    pos.x += noise;
    pos.z += noise;

    // Expand and rise
    pos *= mix(0.05, 1.0, uProgress);

    vHeat = 1.0 - (pos.y / 0.6);
    vAlpha = smoothstep(0.0, 0.15, uProgress) * smoothstep(1.5, 0.5, uProgress * 1.5);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (aRand * 6.0 + 4.0) * (300.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const CLOUD_FRAG = /* glsl */`
  varying float vHeat;
  varying float vAlpha;

  void main() {
    // Soft circular point
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;

    float alpha = (1.0 - r * 2.0) * vAlpha;

    // Fire gradient
    vec3 fireColor = mix(
      vec3(1.0, 0.9, 0.7),  // bright white/yellow core
      mix(
        vec3(1.0, 0.4, 0.05), // orange
        vec3(0.2, 0.1, 0.1),  // dark smoke
        clamp((1.0 - vHeat) * 1.5, 0.0, 1.0)
      ),
      clamp(1.0 - vHeat, 0.0, 1.0)
    );

    gl_FragColor = vec4(fireColor, alpha * 0.85);
  }
`;

function buildMushroomCloud(position, yieldKt) {
  const scale = Math.max(0.04, Math.min(0.25, 0.04 * Math.pow(yieldKt / 10, 0.33)));

  const N = 2000;
  const positions = new Float32Array(N * 3);
  const rands     = new Float32Array(N);
  const phases    = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const t = i / N;
    const stemFrac = 0.55;
    let x, y, z;

    if (t < stemFrac) {
      // Stem particles
      const st  = t / stemFrac;
      const r   = (0.03 + Math.random() * 0.03) * (1.0 + st * 0.3);
      const ang = Math.random() * Math.PI * 2;
      x = r * Math.cos(ang);
      z = r * Math.sin(ang);
      y = st * 0.45 + Math.random() * 0.03;
    } else {
      // Cap particles (toroidal mushroom head)
      const ct   = (t - stemFrac) / (1 - stemFrac);
      const majR = 0.12 + ct * 0.06;
      const minR = 0.04 + Math.random() * 0.04;
      const ang1 = Math.random() * Math.PI * 2;
      const ang2 = Math.random() * Math.PI * 2;
      x = (majR + minR * Math.cos(ang2)) * Math.cos(ang1);
      z = (majR + minR * Math.cos(ang2)) * Math.sin(ang1);
      y = 0.50 + minR * Math.sin(ang2) * 0.5;
    }

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    rands[i]  = Math.random();
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aRand',    new THREE.BufferAttribute(rands, 1));
  geo.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:     { value: 0 },
      uProgress: { value: 0 },
    },
    vertexShader:   CLOUD_VERT,
    fragmentShader: CLOUD_FRAG,
    transparent:   true,
    depthWrite:    false,
    blending:      THREE.AdditiveBlending,
  });
  mat.extensions = { drawBuffers: false };

  const cloud = new THREE.Points(geo, mat);

  // Orient to surface
  const group = new THREE.Group();
  group.add(cloud);

  const norm = position.clone().normalize();
  group.position.copy(norm.clone().multiplyScalar(1.001));

  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, norm);
  group.setRotationFromQuaternion(quat);
  group.scale.setScalar(scale);

  group.userData.cloud = cloud;
  group.userData.mat   = mat;
  group.userData.scale = scale;

  return group;
}

// ---- Shockwave ring ----
function buildShockwave(position) {
  const N = 128;
  const geo = new THREE.BufferGeometry();
  const pts = new Float32Array((N + 1) * 3);
  // Placeholder — will be updated in animate
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    pts[i * 3]     = Math.cos(a) * 0.01;
    pts[i * 3 + 1] = 0;
    pts[i * 3 + 2] = Math.sin(a) * 0.01;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const line = new THREE.Line(geo, mat);

  const norm = position.clone().normalize();
  const group = new THREE.Group();
  group.add(line);
  group.position.copy(norm.clone().multiplyScalar(1.005));

  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, norm);
  group.setRotationFromQuaternion(quat);

  group.userData.line     = line;
  group.userData.geo      = geo;
  group.userData.norm     = norm;
  group.userData.maxR     = 0.35; // max angular radius (radians)

  return group;
}

function updateShockwave(group, progress) {
  const geo = group.userData.geo;
  const mat = group.userData.line.material;
  const pos = geo.attributes.position;
  const N = pos.count - 1;
  const r = group.userData.maxR * progress;

  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    pos.setXYZ(i, Math.cos(a) * r, 0, Math.sin(a) * r);
  }
  pos.needsUpdate = true;
  mat.opacity = Math.max(0, 0.9 - progress * 0.9);
}

// ---- Fallout plume ----
function buildFalloutPlume(position, radii, windAngleDeg = 45) {
  if (radii.fallout_km <= 0) return null;

  const earthR = 1.003;
  const axisAng   = radii.fallout_km / 6371;
  const lateralAng = radii.fallout_width_km / 6371;

  // Ellipse on sphere plane
  const N = 64;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ex = Math.cos(a) * axisAng;
    const ey = Math.sin(a) * lateralAng;
    // Rotate by wind angle
    const wx = ex * Math.cos(windAngleDeg * Math.PI / 180) - ey * Math.sin(windAngleDeg * Math.PI / 180);
    const wy = ex * Math.sin(windAngleDeg * Math.PI / 180) + ey * Math.cos(windAngleDeg * Math.PI / 180);
    pts.push(new THREE.Vector3(wx, 0, wy));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color: 0xaaff44, transparent: true, opacity: 0.5 });
  const line = new THREE.Line(geo, mat);

  // Offset ellipse center towards wind direction (fallout drifts downwind)
  const offsetFrac = 0.4; // center at 40% of axis length downwind
  const offsetX = offsetFrac * axisAng * Math.cos(windAngleDeg * Math.PI / 180);
  const offsetZ = offsetFrac * axisAng * Math.sin(windAngleDeg * Math.PI / 180);
  line.position.set(offsetX, 0, offsetZ);

  const group = new THREE.Group();
  group.add(line);

  const norm = position.clone().normalize();
  group.position.copy(norm.clone().multiplyScalar(earthR));

  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, norm);
  group.setRotationFromQuaternion(quat);

  return group;
}

// ---- Fireball glow ----
function buildFireball(position, radiusKm) {
  const visR = Math.max(0.008, Math.min(0.06, (radiusKm / 6371) * 30));
  const geo = new THREE.SphereGeometry(visR, 16, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff8800, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);

  const norm = position.clone().normalize();
  mesh.position.copy(norm.clone().multiplyScalar(1.001 + visR * 0.5));
  return mesh;
}

// ================================================================
// Main DetonationEffect class
// ================================================================

export class DetonationEffect {
  /**
   * @param {THREE.Scene|THREE.Group} parent
   * @param {number} lat
   * @param {number} lng
   * @param {Object} weapon   - from arsenal.js
   * @param {boolean} airburst
   * @param {number} windAngleDeg
   */
  constructor(parent, lat, lng, weapon, airburst = true, windAngleDeg = 45) {
    this.parent   = parent;
    this.lat      = lat;
    this.lng      = lng;
    this.weapon   = weapon;
    this.airburst = airburst;
    this.alive    = true;

    this.elapsed  = 0;
    this.duration = 12.0; // seconds until effect starts to fade

    const pos = latLngToVec3(lat, lng, 1.0);
    this.pos = pos;

    const radii = calcBlastRadii(weapon.yield_kt, airburst);

    this.group = new THREE.Group();
    parent.add(this.group);

    // --- Blast ring overlays (persistent) ---
    this.blastRings = new THREE.Group();
    const heavy = createSphereCircle(pos, radii.heavyBlast_km, 0xff0000, 0.9);
    const mod   = createSphereCircle(pos, radii.moderateBlast_km, 0xff6600, 0.75);
    const light = createSphereCircle(pos, radii.lightBlast_km, 0xffcc00, 0.5);
    const therm = createSphereCircle(pos, radii.thermal_km, 0xff4444, 0.35);
    if (heavy) this.blastRings.add(heavy);
    if (mod)   this.blastRings.add(mod);
    if (light) this.blastRings.add(light);
    if (therm) this.blastRings.add(therm);

    // Filled disc for ground zero
    const disc = createSphereDisc(pos, radii.heavyBlast_km, 0xff2200, 0.25);
    if (disc) this.blastRings.add(disc);

    this.group.add(this.blastRings);

    // --- Fireball ---
    this.fireball = buildFireball(pos, radii.fireball_km);
    this.group.add(this.fireball);

    // --- Mushroom cloud ---
    this.cloudGroup = buildMushroomCloud(pos, weapon.yield_kt);
    this.group.add(this.cloudGroup);

    // --- Shockwave ---
    this.shockwaveGroup = buildShockwave(pos);
    this.group.add(this.shockwaveGroup);

    // --- Fallout plume (ground burst only) ---
    if (!airburst) {
      const plume = buildFalloutPlume(pos, radii, windAngleDeg);
      if (plume) this.group.add(plume);
    }

    // --- Radii reference ---
    this.radii = radii;
  }

  update(delta) {
    if (!this.alive) return;
    this.elapsed += delta;

    const t = this.elapsed;
    const cloudProgress = Math.min(t / 6.0, 1.0); // cloud rises over 6 seconds

    // Update mushroom cloud shader
    const mat = this.cloudGroup.userData.mat;
    if (mat && mat.uniforms) {
      mat.uniforms.uTime.value     = t;
      mat.uniforms.uProgress.value = cloudProgress;
    }

    // Fireball fade
    if (this.fireball) {
      this.fireball.material.opacity = Math.max(0, 0.9 - t * 0.3);
      const s = 1.0 + t * 0.5;
      this.fireball.scale.setScalar(Math.min(s, 3.0));
    }

    // Shockwave expansion
    const shockProgress = Math.min(t / 3.0, 1.0);
    updateShockwave(this.shockwaveGroup, shockProgress);

    // Blast rings fade in then persist
    if (t < 1.0) {
      this.blastRings.children.forEach(child => {
        if (child.material) child.material.opacity = (child.material.opacity || 0.5) * Math.min(t, 1.0);
      });
    }
  }

  dispose() {
    this.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    this.parent.remove(this.group);
    this.alive = false;
  }

  // Keep blast rings but remove transient effects
  settle() {
    if (this.fireball) {
      this.group.remove(this.fireball);
      this.fireball.geometry.dispose();
      this.fireball.material.dispose();
      this.fireball = null;
    }
    if (this.shockwaveGroup) {
      this.group.remove(this.shockwaveGroup);
      this.shockwaveGroup = null;
    }
  }
}

/** Trigger flash overlay in DOM */
export function triggerFlash() {
  let overlay = document.getElementById('flash-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'flash-overlay';
    document.body.appendChild(overlay);
  }
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 500;
    background: white; pointer-events: none;
    animation: none;
  `;
  // Force reflow
  overlay.offsetHeight;
  overlay.style.cssText += `
    transition: opacity 0.8s ease-out;
    opacity: 1;
  `;
  setTimeout(() => { overlay.style.opacity = '0'; }, 50);
}
