/**
 * main.js — NuclearSim entry point
 *
 * Bootstraps the Three.js engine (AGENT 1).
 * Stubs for AGENT 2 (weapons), AGENT 3 (physics), AGENT 4 (effects),
 * and AGENT 5 (UI) are imported but left empty until those agents deliver.
 */
import * as THREE from 'three';

// ── AGENT 1: Core Engine ─────────────────────────────────────────────────────
import {
  SceneManager,
  buildGlobe,
  updateGlobe,
  buildStarfield,
  CameraController,
} from './engine/index.js';

// ── AGENT 2: Weapons & Data (stubs — Agent 2 will implement) ─────────────────
// import { loadAllArsenals, ForceManager, TargetDatabase } from './weapons/index.js';

// ── AGENT 3: Physics (stubs — Agent 3 will implement) ────────────────────────
// import { allBlastRings, CasualtyEstimator } from './physics/index.js';

// ── AGENT 4: Visual Effects (stubs — Agent 4 will implement) ─────────────────
// import { MissileTrajectory, DetonationSequence } from './effects/index.js';

// ── AGENT 5: UI Shell (stubs — Agent 5 will implement) ───────────────────────
// import { runBootSequence, MainLayout, ScenarioPanel } from './ui/index.js';

// ============================================================================
// Boot sequence
// ============================================================================

/**
 * Minimal boot sequence until Agent 5 delivers BootScreen.js.
 * Fades out #boot-screen and shows #app.
 */
function runMinimalBoot(onComplete) {
  const bootScreen  = document.getElementById('boot-screen');
  const app         = document.getElementById('app');
  const bootBar     = document.getElementById('boot-bar');
  const enterBtn    = document.getElementById('boot-enter-btn');

  const lines = [
    'LOADING PHYSICS ENGINE............. OK',
    'LOADING ARSENAL DATABASE........... OK',
    'INITIALIZING GLOBE RENDERER........ OK',
    'CALIBRATING BLAST PHYSICS.......... OK',
    'VERIFYING TARGETING SYSTEMS........ OK',
    'SYSTEM READY.',
  ];

  let pct   = 0;
  let lineI = 0;

  const tick = setInterval(() => {
    pct = Math.min(pct + 2, 100);
    if (bootBar) bootBar.style.width = pct + '%';

    // Print terminal lines at intervals
    const lineIdx = Math.floor((pct / 100) * lines.length);
    while (lineI < lineIdx && lineI < lines.length) {
      const el = document.getElementById(`t-line-${lineI + 1}`);
      if (el) el.textContent = lines[lineI];
      lineI++;
    }

    if (pct >= 100) {
      clearInterval(tick);
      if (enterBtn) {
        enterBtn.style.display = 'inline-block';
        enterBtn.addEventListener('click', () => {
          bootScreen.style.transition = 'opacity 0.8s';
          bootScreen.style.opacity    = '0';
          setTimeout(() => {
            bootScreen.style.display = 'none';
            app.style.display        = 'block';
            onComplete();
          }, 800);
        });
      } else {
        // No button — auto-advance after 300ms
        setTimeout(() => {
          bootScreen.style.transition = 'opacity 0.8s';
          bootScreen.style.opacity    = '0';
          setTimeout(() => {
            bootScreen.style.display = 'none';
            app.style.display        = 'block';
            onComplete();
          }, 800);
        }, 300);
      }
    }
  }, 25); // ~2.5 s total
}

// ============================================================================
// Engine bootstrap
// ============================================================================

function initEngine() {
  const canvas        = document.getElementById('globe-canvas');
  const sceneManager  = new SceneManager(canvas);
  const textureLoader = new THREE.TextureLoader();

  // Build scene objects
  const { earthMesh, cloudMesh } = buildGlobe(sceneManager.scene, textureLoader);
  buildStarfield(sceneManager.scene);

  // Camera controller
  const camCtrl = new CameraController(sceneManager.camera, canvas);

  // Sun direction uniform — update earth shader each frame
  const sunDir = sceneManager.sunDir;

  // Start render loop
  sceneManager.startRenderLoop((delta) => {
    camCtrl.update(delta);
    updateGlobe(cloudMesh);

    // Keep earth shader's sunDir in sync
    if (earthMesh.material.uniforms && earthMesh.material.uniforms.sunDir) {
      earthMesh.material.uniforms.sunDir.value.copy(sunDir);
    }
  });

  // Expose globally for other agents to access (inter-module comms via window)
  window.__NuclearSim = {
    sceneManager,
    camCtrl,
    earthMesh,
    cloudMesh,
    sunDir,
  };

  console.log('[NuclearSim] Engine initialized. Globe radius = 1.0 unit = 6371 km.');
}

// ============================================================================
// Entry point
// ============================================================================

runMinimalBoot(() => {
  initEngine();
});
