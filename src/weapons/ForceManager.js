// ForceManager.js — manages placed nuclear forces on the globe
import * as THREE from 'three';

const EARTH_RADIUS_KM = 6371;

/** Convert lat/lon to 3D point on unit sphere */
function latLonToVector3(lat, lon, radius = 1.0) {
  const phi   = (90 - lat)  * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Icon colors per delivery platform */
const PLATFORM_COLORS = {
  silo:         0x00FF41,   // phosphor green
  submarine:    0x0099FF,   // blue
  mobile_TEL:   0xFFB800,   // amber
  aircraft:     0xFF6600,   // orange
  surface_ship: 0x00FFFF,   // cyan
};

export class ForceManager {
  /**
   * @param {THREE.Scene} scene
   * @param {number} globeRadius  — 1.0 Three.js units
   */
  constructor(scene, globeRadius = 1.0) {
    this._scene       = scene;
    this._globeRadius = globeRadius;
    this._units       = new Map();   // unitId → { id, config, lat, lon, targetId, mesh }
    this._nextId      = 1;
  }

  /**
   * Places a marker on the globe for a weapon unit.
   * @param {Object} config — from WeaponDesigner.getConfig()
   * @param {number} lat
   * @param {number} lon
   * @returns {string} unitId
   */
  addUnit(config, lat, lon) {
    const unitId = `unit_${this._nextId++}`;

    const mesh = this._createMarker(config);
    const pos  = latLonToVector3(lat, lon, this._globeRadius + 0.012);
    mesh.position.copy(pos);

    // Orient marker to face outward from globe center
    mesh.lookAt(0, 0, 0);
    mesh.rotateX(Math.PI / 2);

    mesh.userData = { unitId };
    this._scene.add(mesh);

    const unit = { id: unitId, config, lat, lon, targetId: null, mesh };
    this._units.set(unitId, unit);

    window.dispatchEvent(new CustomEvent('force:unit_added', { detail: { unit } }));
    window.dispatchEvent(new CustomEvent('force:updated',    { detail: { units: this.getAllUnits() } }));

    return unitId;
  }

  removeUnit(unitId) {
    const unit = this._units.get(unitId);
    if (!unit) return;
    if (unit.mesh) this._scene.remove(unit.mesh);
    this._units.delete(unitId);
    window.dispatchEvent(new CustomEvent('force:updated', { detail: { units: this.getAllUnits() } }));
  }

  getUnit(unitId) {
    return this._units.get(unitId) || null;
  }

  getAllUnits() {
    return Array.from(this._units.values()).map(u => ({
      id:       u.id,
      config:   u.config,
      lat:      u.lat,
      lon:      u.lon,
      targetId: u.targetId,
    }));
  }

  /**
   * Assigns a city target to a unit.
   * @param {string} unitId
   * @param {string} targetId  — city id from TargetDatabase
   */
  assignTarget(unitId, targetId) {
    const unit = this._units.get(unitId);
    if (!unit) return;
    unit.targetId = targetId;
    window.dispatchEvent(new CustomEvent('force:updated', { detail: { units: this.getAllUnits() } }));
  }

  clearAllUnits() {
    for (const unit of this._units.values()) {
      if (unit.mesh) this._scene.remove(unit.mesh);
    }
    this._units.clear();
    window.dispatchEvent(new CustomEvent('force:updated', { detail: { units: [] } }));
  }

  // ─── Marker geometry ────────────────────────────────────────────────────

  _createMarker(config) {
    const platform = config.system?.platform || 'silo';
    const color    = PLATFORM_COLORS[platform] || 0x00FF41;

    let geometry;
    if (platform === 'submarine' || platform === 'surface_ship') {
      // Diamond shape for naval
      geometry = new THREE.CylinderGeometry(0, 0.008, 0.016, 4);
    } else if (platform === 'aircraft') {
      // Thin triangle for aircraft
      geometry = new THREE.ConeGeometry(0.006, 0.018, 3);
    } else {
      // Rectangle for silos / mobile TEL
      geometry = new THREE.BoxGeometry(0.010, 0.004, 0.016);
    }

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Glow ring underneath
    const ringGeo  = new THREE.RingGeometry(0.010, 0.014, 8);
    const ringMat  = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);

    return mesh;
  }
}
