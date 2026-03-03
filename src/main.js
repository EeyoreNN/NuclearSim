/**
 * main.js — NuclearSim entry point
 * Orchestrates Three.js scene, globe, simulation, and UI.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Globe } from './globe/Globe.js';
import { TargetManager } from './simulation/TargetManager.js';
import { ScenarioPlayer } from './simulation/ScenarioPlayer.js';
import { UIManager } from './ui/UIManager.js';
import { initBootScreen } from './ui/BootScreen.js';
import { CITIES } from './data/cities.js';

// ================================================================
// NuclearSim — main application class
// ================================================================
class NuclearSim {
  constructor() {
    this._setupRenderer();
    this._setupScene();
    this._setupCamera();
    this._setupLights();
    this._setupGlobe();
    this._setupControls();
    this._setupUI();
    this._setupSimulation();
    this._setupEvents();
    this._animate();
  }

  // ---- Renderer ----
  _setupRenderer() {
    const canvas = document.getElementById('globe-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  // ---- Scene ----
  _setupScene() {
    this.scene   = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020408);
    this.clock   = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse   = new THREE.Vector2();
    this._autoRotate = true;
  }

  // ---- Camera ----
  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.01, 1000
    );
    this.camera.position.set(0, 0, 2.8);
  }

  // ---- Lights ----
  _setupLights() {
    const sun = new THREE.DirectionalLight(0xfff5e0, 2.5);
    sun.position.set(5, 3, 5).normalize();
    this.scene.add(sun);

    const ambient = new THREE.AmbientLight(0x112244, 0.6);
    this.scene.add(ambient);
  }

  // ---- Globe ----
  _setupGlobe() {
    this.globe = new Globe(this.scene);
    this.globe.buildCityDots(CITIES);
  }

  // ---- Orbit Controls ----
  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping    = true;
    this.controls.dampingFactor    = 0.06;
    this.controls.minDistance      = 1.15;
    this.controls.maxDistance      = 9.0;
    this.controls.rotateSpeed      = 0.4;
    this.controls.zoomSpeed        = 0.7;
    this.controls.enablePan        = false;
    this.controls.autoRotate       = true;
    this.controls.autoRotateSpeed  = 0.3;
  }

  // ---- UI ----
  _setupUI() {
    this.ui = new UIManager();

    this.ui.onWeaponSelect(w => {
      this.targetManager?.setWeapon(w);
    });
    this.ui.onAirburstChange(v => {
      this.targetManager?.setAirburst(v);
    });
    this.ui.onDetonateAll(() => {
      this.targetManager?.detonateAll();
    });
    this.ui.onAutoTarget(() => {
      this.targetManager?.autoTarget();
    });
    this.ui.onClearTargets(() => {
      this.targetManager?.clearAll();
    });
    this.ui.onReset(() => {
      this.targetManager?.reset();
      this.scenarioPlayer?.stop();
    });
    this.ui.onScenarioPlay(id => {
      this.scenarioPlayer?.selectScenario(id);
      this.scenarioPlayer?.play();
    });
    this.ui.onScenarioStop(() => {
      this.scenarioPlayer?.stop();
    });
    this.ui.onSpeedChange(v => {
      this.scenarioPlayer?.setSpeed(v);
    });
    this.ui.onOptionChange((key, val) => {
      this._handleOption(key, val);
    });
  }

  _handleOption(key, val) {
    switch (key) {
      case 'city-dots':   this.globe.setCityDotsVisible(val); break;
      case 'atmosphere':  this.globe.setAtmosphereVisible(val); break;
      case 'clouds':      this.globe.setCloudsVisible(val); break;
      case 'stars':       this.globe.setStarsVisible(val); break;
      case 'autorotate':
        this._autoRotate = val;
        this.controls.autoRotate = val;
        break;
    }
  }

  // ---- Simulation ----
  _setupSimulation() {
    this.targetManager  = new TargetManager(this.scene, this.globe, this.ui);
    this.scenarioPlayer = new ScenarioPlayer(this.targetManager, this.ui);
  }

  // ---- Events ----
  _setupEvents() {
    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Mouse move — update coords display
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousemove', (e) => {
      this.mouse.set(
        (e.clientX / window.innerWidth)  * 2 - 1,
       -(e.clientY / window.innerHeight) * 2 + 1
      );

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObject(this.globe.earthMeshForRaycast, false);
      if (hits.length > 0) {
        const { lat, lng } = this.globe.worldToLatLng(hits[0].point);
        this.ui.updateCoords(lat, lng);
      }
    });

    // Click — place target
    let _mouseDown = null;
    canvas.addEventListener('mousedown', (e) => {
      _mouseDown = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('mouseup', (e) => {
      if (!_mouseDown) return;
      const dx = Math.abs(e.clientX - _mouseDown.x);
      const dy = Math.abs(e.clientY - _mouseDown.y);
      if (dx < 5 && dy < 5) this._handleClick(e);
      _mouseDown = null;
    });

    // Hide tooltip on canvas click away
    canvas.addEventListener('mousedown', () => {
      document.getElementById('target-tooltip').style.display = 'none';
    });

    // Touch support
    canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0];
        this.mouse.set(
          (t.clientX / window.innerWidth)  * 2 - 1,
         -(t.clientY / window.innerHeight) * 2 + 1
        );
        // Brief delay to distinguish pan from tap
        setTimeout(() => this._handleClick(e, t.clientX, t.clientY), 50);
      }
    });
  }

  _handleClick(e, cx, cy) {
    const x = cx ?? e.clientX;
    const y = cy ?? e.clientY;
    this.mouse.set(
      (x / window.innerWidth)  * 2 - 1,
     -(y / window.innerHeight) * 2 + 1
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObject(this.globe.earthMeshForRaycast, false);
    if (hits.length > 0) {
      const { lat, lng } = this.globe.worldToLatLng(hits[0].point);
      this.targetManager.onGlobeClick(lat, lng);
    }
  }

  // ---- Animation Loop ----
  _animate() {
    requestAnimationFrame(() => this._animate());
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.controls.update();
    this.globe.update(delta, this.camera);
    this.targetManager?.update(delta);

    this.renderer.render(this.scene, this.camera);
  }
}

// ================================================================
// Boot sequence → launch app
// ================================================================
initBootScreen(() => {
  new NuclearSim();
});
