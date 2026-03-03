/**
 * MushroomCloud.js — Particle-system nuclear mushroom cloud.
 *
 * Uses THREE.Points with MushroomShader for heat-glow rendering.
 * Geometry: 2000 particles split between a rising stem and a toroidal cap.
 *
 * Animation timeline (per cloud):
 *   0–3 s  : cloud rises from detonation point (uRiseProgress 0→1)
 *   3–30 s : cloud persists at full size, slowly fading
 *   30+ s  : auto-removed
 *
 * Globe earth-radius = 1.0 THREE unit.  latLonToVector3 is imported from
 * MissileTrajectory.js (single source of truth for coord conversion).
 */
import * as THREE from 'three';
import { createMushroomMaterial } from './MushroomShader.js';
import { latLonToVector3 } from './MissileTrajectory.js';

const MAX_AGE    = 30.0;  // seconds until full fade-out
const RISE_TIME  =  3.0;  // seconds for rise animation
const N_PARTICLES = 2000;

// Build the static particle positions for a unit-scale mushroom cloud.
// Stem occupies lower 55% of particles; toroidal cap the remaining 45%.
function buildParticleGeometry() {
  const positions = new Float32Array(N_PARTICLES * 3);
  const ages      = new Float32Array(N_PARTICLES);   // starts at 0, driven by update()
  const sizes     = new Float32Array(N_PARTICLES);

  for (let i = 0; i < N_PARTICLES; i++) {
    const t        = i / N_PARTICLES;
    const stemFrac = 0.55;
    let x, y, z;

    if (t < stemFrac) {
      // Stem — tight cylinder that flares slightly toward top
      const st  = t / stemFrac;
      const r   = (0.03 + Math.random() * 0.03) * (1.0 + st * 0.35);
      const ang = Math.random() * Math.PI * 2;
      x = r * Math.cos(ang);
      z = r * Math.sin(ang);
      y = st * 0.45 + Math.random() * 0.03;
    } else {
      // Cap — toroidal mushroom head
      const ct   = (t - stemFrac) / (1 - stemFrac);
      const majR = 0.12 + ct * 0.06;              // major (ring) radius
      const minR = 0.04 + Math.random() * 0.04;   // minor (tube) radius
      const a1   = Math.random() * Math.PI * 2;   // around ring
      const a2   = Math.random() * Math.PI * 2;   // around tube
      x = (majR + minR * Math.cos(a2)) * Math.cos(a1);
      z = (majR + minR * Math.cos(a2)) * Math.sin(a1);
      y = 0.50 + minR * Math.sin(a2) * 0.5;
    }

    positions[i * 3]     = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    ages[i]  = 0;
    sizes[i] = 2.5 + Math.random() * 5.0;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('age',      new THREE.BufferAttribute(ages,      1));
  geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));
  return geo;
}

export class MushroomCloud {
  constructor(scene) {
    this._scene  = scene;
    this._clouds = new Map();
    this._nextId = 0;
  }

  /**
   * Spawn a mushroom cloud at (lat, lon) scaled by yieldKt.
   * @returns {number} cloudId — pass to remove() to destroy early
   */
  detonate(lat, lon, yieldKt) {
    const id  = this._nextId++;
    const pos = latLonToVector3(lat, lon, 1.0);

    // Build plan formula: scale = Y^0.4 * 0.01
    const scale = Math.pow(Math.max(1, yieldKt), 0.4) * 0.01;

    const geo = buildParticleGeometry();
    const mat = createMushroomMaterial(MAX_AGE);
    const pts = new THREE.Points(geo, mat);

    // Orient the cloud so its local +Y points radially outward from the surface
    const group = new THREE.Group();
    group.add(pts);

    const norm = pos.clone().normalize();
    group.position.copy(norm.clone().multiplyScalar(1.001)); // just above surface

    const up   = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, norm);
    group.setRotationFromQuaternion(quat);
    group.scale.setScalar(scale * 0.05); // start tiny

    this._scene.add(group);
    this._clouds.set(id, { group, geo, mat, elapsed: 0, scale });
    return id;
  }

  /**
   * Advance all active clouds.  Call once per render frame.
   * @param {number} delta — seconds since last frame
   */
  update(delta) {
    for (const [id, data] of this._clouds) {
      data.elapsed += delta;
      const { elapsed, geo, mat, scale } = data;

      // -- Rise animation: scale group up over RISE_TIME seconds
      const riseProgress  = Math.min(1.0, elapsed / RISE_TIME);
      const eased         = riseProgress * riseProgress * (3 - 2 * riseProgress); // smoothstep
      const currentScaleXZ = scale * (0.15 + eased * 0.85);
      const currentScaleY  = scale * eased;
      data.group.scale.set(currentScaleXZ, currentScaleY, currentScaleXZ);

      // Update shader uniforms
      mat.uniforms.uRiseProgress.value = eased;

      // Update per-particle age (all particles share the same elapsed time)
      const ageAttr = geo.attributes.age;
      const v = elapsed;
      for (let i = 0; i < ageAttr.count; i++) ageAttr.array[i] = v;
      ageAttr.needsUpdate = true;

      // Auto-remove after full fade
      if (elapsed >= MAX_AGE + 2) {
        this.remove(id);
      }
    }
  }

  /** Remove a specific cloud and free GPU resources. */
  remove(cloudId) {
    const data = this._clouds.get(cloudId);
    if (!data) return;
    this._scene.remove(data.group);
    data.geo.dispose();
    data.mat.dispose();
    this._clouds.delete(cloudId);
  }

  /** Remove all clouds. */
  clearAll() {
    for (const [id] of this._clouds) this.remove(id);
  }
}
