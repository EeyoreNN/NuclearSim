/**
 * BlastRingOverlay.js — Persistent coloured overpressure & thermal rings on the globe.
 *
 * Creates one THREE.Line per ring that follows the sphere surface exactly
 * (great-circle formula), and groups them so they can be added / removed
 * as a single overlay.
 *
 * Ring colours match the NUKEMAP standard:
 *   psi_20  → #FF0000  red     — reinforced concrete levelled
 *   psi_5   → #FF6600  orange  — severe blast / >50% killed
 *   psi_2   → #FFAA00  amber   — moderate structural damage
 *   psi_1   → #FFFF00  yellow  — light structural damage
 *   psi_0_5 → #00FFFF  cyan    — glass injury / overpressure hazard
 *   cal_8   → #FF00FF  magenta — 3rd-degree burns thermal radius
 *
 * Globe earth-radius = 1.0 THREE unit  →  1 km = 1/6371 globe units.
 */
import * as THREE from 'three';
import { latLonToVector3 } from './MissileTrajectory.js';

const EARTH_RADIUS_KM = 6371;
const CIRCLE_SEGMENTS = 128;
const SURFACE_OFFSET  = 1.003;  // above globe to prevent z-fighting

const RING_SPEC = [
  { key: 'psi_20',  source: 'blast',   color: 0xFF0000, opacity: 0.90 },
  { key: 'psi_5',   source: 'blast',   color: 0xFF6600, opacity: 0.85 },
  { key: 'psi_2',   source: 'blast',   color: 0xFFAA00, opacity: 0.80 },
  { key: 'psi_1',   source: 'blast',   color: 0xFFFF00, opacity: 0.75 },
  { key: 'psi_0_5', source: 'blast',   color: 0x00FFFF, opacity: 0.70 },
  { key: 'cal_8',   source: 'thermal', color: 0xFF00FF, opacity: 0.70 },
];

/**
 * Build a great-circle line loop on the sphere surface.
 *
 * @param {THREE.Vector3} centre — normalised surface point
 * @param {number}        radiusKm
 * @param {number}        color   — hex colour
 * @param {number}        opacity
 * @returns {THREE.Line|null}
 */
function buildSphereCircle(centre, radiusKm, color, opacity) {
  if (radiusKm <= 0) return null;

  const angRad = radiusKm / EARTH_RADIUS_KM;  // angular radius in radians
  const norm   = centre.clone().normalize();

  const refUp = Math.abs(norm.y) < 0.99
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const t1 = new THREE.Vector3().crossVectors(refUp, norm).normalize();
  const t2 = new THREE.Vector3().crossVectors(norm, t1).normalize();

  const sinR = Math.sin(angRad);
  const cosR = Math.cos(angRad);
  const pts  = [];

  for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
    const a  = (i / CIRCLE_SEGMENTS) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);

    pts.push(new THREE.Vector3(
      (cosR * norm.x + sinR * (ca * t1.x + sa * t2.x)) * SURFACE_OFFSET,
      (cosR * norm.y + sinR * (ca * t1.y + sa * t2.y)) * SURFACE_OFFSET,
      (cosR * norm.z + sinR * (ca * t1.z + sa * t2.z)) * SURFACE_OFFSET,
    ));
  }

  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  return new THREE.Line(geo, mat);
}

export class BlastRingOverlay {
  constructor(scene) {
    this._scene    = scene;
    this._overlays = new Map();
    this._nextId   = 0;
  }

  /**
   * Add a complete set of blast + thermal rings at (lat, lon).
   *
   * @param {number} lat
   * @param {number} lon
   * @param {object} blastRings   — { psi_20, psi_10, psi_5, psi_2, psi_1, psi_0_5 } in km
   * @param {object} thermalRings — { cal_3, cal_5, cal_8 } in km
   * @returns {number} overlayId — pass to removeRings() to clear
   */
  addRings(lat, lon, blastRings, thermalRings) {
    const id     = this._nextId++;
    const centre = latLonToVector3(lat, lon, 1.0);
    const group  = new THREE.Group();

    for (const spec of RING_SPEC) {
      const radii = spec.source === 'blast' ? blastRings : thermalRings;
      if (!radii) continue;
      const km = radii[spec.key];
      if (!km || km <= 0) continue;

      const line = buildSphereCircle(centre, km, spec.color, spec.opacity);
      if (line) group.add(line);
    }

    this._scene.add(group);
    this._overlays.set(id, group);
    return id;
  }

  /**
   * Remove a specific overlay by ID and free GPU resources.
   * @param {number} overlayId
   */
  removeRings(overlayId) {
    const group = this._overlays.get(overlayId);
    if (!group) return;

    group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    this._scene.remove(group);
    this._overlays.delete(overlayId);
  }

  /** Remove all overlays. */
  clearAll() {
    for (const [id] of this._overlays) this.removeRings(id);
  }
}
