/**
 * ShockwaveRing.js — Expanding shockwave ring on the globe surface.
 *
 * Each ring is a 128-segment line loop that follows the sphere surface
 * exactly (great-circle math), expanding from radius 0 to maxRadius
 * over `duration_ms`, then fading out and auto-removing itself.
 *
 * Globe earth-radius = 1.0 THREE unit.
 * latLonToVector3 is imported from MissileTrajectory.js.
 */
import * as THREE from 'three';
import { latLonToVector3 } from './MissileTrajectory.js';

const RING_SEGMENTS = 128;
const SURFACE_OFFSET = 1.003; // slightly above globe to avoid z-fighting

export class ShockwaveRing {
  constructor(scene) {
    this._scene  = scene;
    this._rings  = new Map();
    this._nextId = 0;
  }

  /**
   * Spawn an expanding ring centred at (lat, lon).
   *
   * @param {number} lat
   * @param {number} lon
   * @param {number} maxRadiusGlobeUnits  — final ring radius in globe units
   *   (tip: convert km → globe units via km / 6371)
   * @param {number} duration_ms          — expansion + fade time
   * @returns {number} ringId
   */
  spawn(lat, lon, maxRadiusGlobeUnits, duration_ms = 3000) {
    const id   = this._nextId++;
    const norm = latLonToVector3(lat, lon, 1.0).normalize();

    // Build a local orthonormal tangent frame at the surface point
    const up = Math.abs(norm.y) < 0.99
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    const t1 = new THREE.Vector3().crossVectors(up, norm).normalize();
    const t2 = new THREE.Vector3().crossVectors(norm, t1).normalize();

    // Pre-allocate position buffer for N+1 vertices (closing the loop)
    const positions = new Float32Array((RING_SEGMENTS + 1) * 3);
    const geo       = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color:       0xFF6600,
      transparent: true,
      opacity:     0.95,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    const ring = new THREE.Line(geo, mat);
    this._scene.add(ring);

    this._rings.set(id, {
      ring, geo, mat,
      norm, t1, t2,
      maxRadius: maxRadiusGlobeUnits,
      duration:  duration_ms / 1000,   // convert to seconds
      elapsed:   0,
    });

    return id;
  }

  /**
   * Advance all active rings.  Call once per render frame.
   * @param {number} delta — seconds since last frame
   */
  update(delta) {
    for (const [id, data] of this._rings) {
      data.elapsed += delta;

      const progress = Math.min(1.0, data.elapsed / data.duration);

      // Ring expands linearly; opacity fades from 0.95 → 0
      const r       = data.maxRadius * progress;
      const opacity = Math.max(0, 0.95 * (1.0 - progress));

      // Rebuild ring vertices on the sphere surface
      const { norm, t1, t2 } = data;
      const sinR = Math.sin(r);
      const cosR = Math.cos(r);
      const pos  = data.geo.attributes.position;

      for (let i = 0; i <= RING_SEGMENTS; i++) {
        const a  = (i / RING_SEGMENTS) * Math.PI * 2;
        const ca = Math.cos(a);
        const sa = Math.sin(a);

        // Great-circle point at angular distance r from centre in direction a
        const px = cosR * norm.x + sinR * (ca * t1.x + sa * t2.x);
        const py = cosR * norm.y + sinR * (ca * t1.y + sa * t2.y);
        const pz = cosR * norm.z + sinR * (ca * t1.z + sa * t2.z);

        pos.setXYZ(i, px * SURFACE_OFFSET, py * SURFACE_OFFSET, pz * SURFACE_OFFSET);
      }

      pos.needsUpdate    = true;
      data.mat.opacity   = opacity;

      // Remove once fully expanded and faded
      if (data.elapsed >= data.duration) {
        this._scene.remove(data.ring);
        data.geo.dispose();
        data.mat.dispose();
        this._rings.delete(id);
      }
    }
  }

  /** Remove all rings immediately. */
  clearAll() {
    for (const [id, data] of this._rings) {
      this._scene.remove(data.ring);
      data.geo.dispose();
      data.mat.dispose();
    }
    this._rings.clear();
  }
}
