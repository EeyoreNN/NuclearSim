import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * CameraController — OrbitControls wrapper with globe-specific constraints,
 * smooth fly-to animation, and globe raycasting for lat/lon picking.
 */
export class CameraController {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {HTMLElement}             domElement  Renderer's DOM element
   */
  constructor(camera, domElement) {
    this._camera     = camera;
    this._domElement = domElement;
    this._raycaster  = new THREE.Raycaster();
    this._mouse      = new THREE.Vector2();

    // Reusable globe sphere for raycasting (unit sphere, no mesh needed in scene)
    this._globeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 32, 32),
      new THREE.MeshBasicMaterial({ visible: false }),
    );

    // OrbitControls
    this._controls = new OrbitControls(camera, domElement);
    this._controls.enableDamping   = true;
    this._controls.dampingFactor   = 0.08;
    this._controls.minDistance     = 1.3;   // can't enter atmosphere
    this._controls.maxDistance     = 12.0;  // can't fly too far
    this._controls.enablePan       = false;
    this._controls.autoRotate      = false;
    this._controls.rotateSpeed     = 0.5;
    this._controls.zoomSpeed       = 0.8;

    // fly-to state
    this._flyTo       = null;
    this._flyProgress = 0;
  }

  /** Call once per frame inside the render loop. */
  update(delta) {
    this._controls.update();
    this._tickFlyTo(delta);
  }

  /**
   * Smoothly fly the camera to point above the given lat/lon.
   * Uses linear interpolation over 60 frames with smoothstep easing.
   *
   * @param {number} lat       Latitude  in degrees
   * @param {number} lon       Longitude in degrees
   * @param {number} distance  Desired distance from globe center (default 2.5)
   */
  flyTo(lat, lon, distance = 2.5) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    const target = new THREE.Vector3(
      -distance * Math.sin(phi) * Math.cos(theta),
       distance * Math.cos(phi),
       distance * Math.sin(phi) * Math.sin(theta),
    );

    this._flyTo = {
      startPos:   this._camera.position.clone(),
      endPos:     target,
      totalFrames: 60,
    };
    this._flyProgress = 0;
  }

  /**
   * Raycast against the unit globe sphere.
   * @param {MouseEvent} event
   * @returns {{ lat: number, lon: number } | null}
   */
  getPickedLatLon(event) {
    const rect = this._domElement.getBoundingClientRect();
    this._mouse.set(
      ((event.clientX - rect.left) / rect.width)  *  2 - 1,
      ((event.clientY - rect.top)  / rect.height) * -2 + 1,
    );
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const hits = this._raycaster.intersectObject(this._globeSphere, false);
    if (hits.length === 0) return null;

    const p   = hits[0].point.normalize();
    const lat = Math.asin(p.y)           * 180 / Math.PI;
    const lon = Math.atan2(-p.z, p.x)   * 180 / Math.PI;
    return { lat, lon };
  }

  /** Enable/disable the globe's auto-rotation. */
  setAutoRotate(enabled, speed = 0.3) {
    this._controls.autoRotate      = enabled;
    this._controls.autoRotateSpeed = speed;
  }

  // ── internal ─────────────────────────────────────────────────────

  _tickFlyTo(delta) {
    if (!this._flyTo) return;
    this._flyProgress++;
    const t  = this._flyProgress / this._flyTo.totalFrames;
    const ts = this._smoothstep(t);  // eased t
    this._camera.position.lerpVectors(this._flyTo.startPos, this._flyTo.endPos, ts);
    this._camera.lookAt(0, 0, 0);
    if (this._flyProgress >= this._flyTo.totalFrames) {
      this._flyTo = null;
    }
  }

  _smoothstep(t) {
    const tc = Math.max(0, Math.min(1, t));
    return tc * tc * (3 - 2 * tc);
  }
}
