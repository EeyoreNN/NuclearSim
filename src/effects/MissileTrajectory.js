/**
 * MissileTrajectory.js — Animated great-circle missile arcs on the globe.
 *
 * Also exports `latLonToVector3` — the single source-of-truth coordinate
 * conversion used by all effects modules.
 *
 * Each flight:
 *   1. Computes 64-segment great-circle path between launch and target points.
 *   2. Lifts each path point above the sphere surface with a sinusoidal arc
 *      (max arc height = 0.4 × great-circle-angle / π).
 *   3. Animates a green glowing line whose draw range grows from 0 → 65 points
 *      over `duration_ms`, revealing the flight path in real time.
 *   4. Moves a bright warhead sprite at the leading edge of the line.
 *   5. On arrival, dispatches a `missile:detonated` CustomEvent on `window`.
 *
 * Globe earth-radius = 1.0 THREE unit.
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Coordinate Conversion — shared utility, re-exported via effects/index.js
// ---------------------------------------------------------------------------
/**
 * Convert geographic (lat, lon) to a 3-D point on a sphere of given radius.
 *
 * Convention (matches engine GlobeBuilder):
 *   +X = 0° lon, 0° lat  (Gulf of Guinea)
 *   +Y = north pole
 *   −Z = 90° E
 *
 * @param {number} lat     — degrees, −90…90
 * @param {number} lon     — degrees, −180…180
 * @param {number} radius  — sphere radius in THREE units (default 1.0)
 * @returns {THREE.Vector3}
 */
export function latLonToVector3(lat, lon, radius = 1.0) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Spherical linear interpolation between two unit vectors.
 * Returns a unit vector at fraction t along the arc.
 */
function slerp(v1, v2, t) {
  const dot   = Math.max(-1, Math.min(1, v1.dot(v2)));
  const angle = Math.acos(dot);
  if (angle < 1e-6) return v1.clone().lerp(v2, t).normalize();

  const sinA = Math.sin(angle);
  const s1   = Math.sin((1 - t) * angle) / sinA;
  const s2   = Math.sin(t       * angle) / sinA;
  return new THREE.Vector3(
    s1 * v1.x + s2 * v2.x,
    s1 * v1.y + s2 * v2.y,
    s1 * v1.z + s2 * v2.z,
  );
}

/**
 * Build arc path: 65 points (64 segments) along the great circle from v1→v2,
 * each lifted above the sphere surface by arcHeight * sin(t*π).
 *
 * @param {THREE.Vector3} v1
 * @param {THREE.Vector3} v2
 * @param {number}        arcHeight — additional radius at mid-arc
 * @returns {THREE.Vector3[]}
 */
function buildArcPoints(v1, v2, arcHeight) {
  const SEG = 64;
  const pts = [];
  for (let i = 0; i <= SEG; i++) {
    const t    = i / SEG;
    const base = slerp(v1, v2, t);                         // unit vec on sphere
    const lift = 1.0 + arcHeight * Math.sin(t * Math.PI);  // sinusoidal lift
    pts.push(base.multiplyScalar(lift));
  }
  return pts;
}

// ---------------------------------------------------------------------------
// MissileTrajectory class
// ---------------------------------------------------------------------------
export class MissileTrajectory {
  constructor(scene) {
    this._scene   = scene;
    this._flights = new Map();
    this._nextId  = 0;
  }

  /**
   * Launch a missile arc from (startLat, startLon) → (endLat, endLon).
   *
   * @param {number} startLat
   * @param {number} startLon
   * @param {number} endLat
   * @param {number} endLon
   * @param {object} options
   *   @param {number}  options.color        — hex colour (default green #00FF41)
   *   @param {number}  options.arcHeight    — max arc height above sphere (auto if null)
   *   @param {number}  options.duration_ms  — flight time in ms (default 8000)
   *   @param {*}       options.warheadId    — passed through in detonation event
   * @returns {number} flightId
   */
  addFlight(startLat, startLon, endLat, endLon, options = {}) {
    const {
      color       = 0x00FF41,
      arcHeight   = null,
      duration_ms = 8000,
      warheadId   = null,
    } = options;

    const id = this._nextId++;

    // Convert to unit vectors on the globe
    const v1 = latLonToVector3(startLat, startLon, 1.0).normalize();
    const v2 = latLonToVector3(endLat,   endLon,   1.0).normalize();

    // Arc height: 0.4 × (great-circle angle / π)
    const gcAngle  = Math.acos(Math.max(-1, Math.min(1, v1.dot(v2))));
    const finalArc = arcHeight !== null ? arcHeight : 0.4 * gcAngle / Math.PI;

    const points = buildArcPoints(v1, v2, finalArc);
    const SEG    = points.length - 1;

    // ---- Trail line (animated drawRange) ----
    const flatPos = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      flatPos[i * 3]     = p.x;
      flatPos[i * 3 + 1] = p.y;
      flatPos[i * 3 + 2] = p.z;
    });

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(flatPos, 3));
    trailGeo.setDrawRange(0, 0);

    const trailMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity:     0.95,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });
    const trail = new THREE.Line(trailGeo, trailMat);
    this._scene.add(trail);

    // ---- Warhead sprite (bright small sphere at leading edge) ----
    const wGeo = new THREE.SphereGeometry(0.006, 6, 6);
    const wMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity:     1.0,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });
    const warhead = new THREE.Mesh(wGeo, wMat);
    warhead.position.copy(points[0]);
    this._scene.add(warhead);

    // CatmullRomCurve3 for smooth per-frame warhead positioning
    const curve = new THREE.CatmullRomCurve3(points);

    this._flights.set(id, {
      trail, trailGeo, trailMat,
      warhead, wGeo, wMat,
      curve,
      points,
      segments:   SEG,
      elapsed:    0,
      duration:   duration_ms / 1000,
      endLat,
      endLon,
      warheadId,
      completed:  false,
      fadeTimer:  null,
    });

    return id;
  }

  /**
   * Remove a specific flight and free all GPU resources.
   * @param {number} flightId
   */
  removeFlight(flightId) {
    const data = this._flights.get(flightId);
    if (!data) return;

    if (data.fadeTimer) clearTimeout(data.fadeTimer);

    this._scene.remove(data.trail);
    this._scene.remove(data.warhead);
    data.trailGeo.dispose();
    data.trailMat.dispose();
    data.wGeo.dispose();
    data.wMat.dispose();

    this._flights.delete(flightId);
  }

  /**
   * Advance all in-flight trajectories.  Call once per render frame.
   * @param {number} delta — seconds since last frame
   */
  update(delta) {
    for (const [id, data] of this._flights) {
      if (data.completed) continue;

      data.elapsed += delta;
      const t     = Math.min(1.0, data.elapsed / data.duration);
      const count = Math.round(t * (data.segments + 1));

      // Reveal trail progressively
      data.trailGeo.setDrawRange(0, count);

      // Move warhead to leading edge
      if (t < 1.0) {
        const pos = data.curve.getPointAt(Math.min(t + 0.01, 1.0));
        data.warhead.position.copy(pos);
      }

      // On arrival
      if (t >= 1.0 && !data.completed) {
        data.completed = true;
        data.warhead.visible = false;

        // Notify other modules via CustomEvent
        window.dispatchEvent(new CustomEvent('missile:detonated', {
          detail: {
            lat:       data.endLat,
            lon:       data.endLon,
            warheadId: data.warheadId,
            flightId:  id,
          },
        }));

        // Fade trail out over 5 s then dispose
        let fadeElapsed = 0;
        const FADE = 5.0;
        const fadeFn = () => {
          if (!this._flights.has(id)) return;
          // We rely on the main update loop no longer running for this flight,
          // so we schedule a one-shot removal
        };
        data.fadeTimer = setTimeout(() => this.removeFlight(id), FADE * 1000);

        // Begin opacity fade on the trail material
        const startFade = () => {
          const fadeDelta = 1 / 60;
          const step = () => {
            if (!this._flights.has(id)) return;
            const f = this._flights.get(id);
            if (!f || !f.trailMat) return;
            f.trailMat.opacity = Math.max(0, f.trailMat.opacity - fadeDelta / FADE);
            if (f.trailMat.opacity > 0) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        };
        startFade();
      }
    }
  }

  /** Remove all active flights immediately. */
  clearAll() {
    for (const [id] of [...this._flights]) this.removeFlight(id);
  }
}
