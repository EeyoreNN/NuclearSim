/**
 * main.js — NuclearSim v3 Entry Point
 *
 * DEFENSIVE: Imports from all agent module index files.
 * If an agent module is not yet built, falls back gracefully
 * to the v2 architecture or a functional stub.
 *
 * Build order (per BUILD_PLAN.md):
 *   1. engine/  (Agent 1) — Three.js scene, globe, camera
 *   2. weapons/ (Agent 2) — Arsenal data, ForceManager, TargetDB
 *   3. physics/ (Agent 3) — Blast/thermal/casualty calculators
 *   4. effects/ (Agent 4) — Missile arcs, detonation effects
 *   5. ui/      (Agent 5) — UI shell + scenarios (this file)
 */

import './style.css';

// --- UI (Agent 5 - always available) ---
import {
  runBootSequence,
  MainLayout,
  ScenarioPanel,
  ForceOrderPanel,
  StatsPanel,
  TimelineController,
  ReportExporter,
} from './ui/index.js';

// --- Scenarios ---
import { scenario as usRussia }       from './ui/scenarios/us_russia_full.js';
import { scenario as indiaPakistan }  from './ui/scenarios/india_pakistan.js';
import { scenario as natoRussia }     from './ui/scenarios/nato_russia.js';
import { scenario as chinaUsa }       from './ui/scenarios/china_usa.js';
import { scenario as northKorea }     from './ui/scenarios/north_korea.js';
import { scenario as ukFranceRussia } from './ui/scenarios/uk_france_vs_russia.js';

const ALL_SCENARIOS = [usRussia, indiaPakistan, natoRussia, chinaUsa, northKorea, ukFranceRussia];

// --- Module handles (filled by defensive imports) ---
let sceneManager  = null;
let cameraCtrl    = null;
let forceManager  = null;
let targetDB      = null;
let popGrid       = null;
let casualtyEst   = null;
let thermalFlash  = null;
let shockwave     = null;
let cloudFx       = null;
let ringOverlay   = null;
let detonationSeq = null;
let missileFx     = null;

// === 1. Boot sequence ===
await runBootSequence();

// === 2. Agent 1 - Engine (Three.js scene, globe, camera) ===
try {
  const engine  = await import('./engine/index.js');
  const canvas  = document.getElementById('globe-canvas');
  const three   = await import('three');
  sceneManager = new engine.SceneManager(canvas);
  const loader = new three.TextureLoader();
  engine.buildGlobe(sceneManager.scene, loader);
  engine.createAtmosphereMesh(sceneManager.scene);
  engine.buildStarfield(sceneManager.scene);
  cameraCtrl = new engine.CameraController(sceneManager.camera, canvas);
  console.info('[main] Agent 1 engine loaded');
} catch (e) {
  console.warn('[main] Agent 1 not available, falling back to v2 Globe:', e.message);
  try {
    const three = await import('three');
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const { Globe }  = await import('./globe/Globe.js');
    const { CITIES } = await import('./data/cities.js');
    const canvas = document.getElementById('globe-canvas');
    const renderer = new three.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = three.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;
    renderer.outputColorSpace = three.SRGBColorSpace;
    const scene  = new three.Scene();
    const camera = new three.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(0, 0, 2.8);
    const sun = new three.DirectionalLight(0xfff5e0, 2.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    scene.add(new three.AmbientLight(0x112244, 0.6));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.minDistance = 1.15; controls.maxDistance = 9.0;
    controls.enablePan = false; controls.autoRotate = true; controls.autoRotateSpeed = 0.3;
    const globe = new Globe(scene);
    globe.buildCityDots(CITIES);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    const clk = new three.Clock();
    (function legacyLoop() {
      requestAnimationFrame(legacyLoop);
      const delta = Math.min(clk.getDelta(), 0.1);
      controls.update(); globe.update(delta, camera); renderer.render(scene, camera);
    })();
    console.info('[main] v2 Globe fallback active');
  } catch (legacyErr) {
    console.warn('[main] No 3D globe:', legacyErr.message);
  }
}

// === 3. Agent 2 - Weapons & Data ===
try {
  const weapons = await import('./weapons/index.js');
  await weapons.loadAllArsenals();
  targetDB = new weapons.TargetDatabase();
  await targetDB.load();
  if (sceneManager) forceManager = new weapons.ForceManager(sceneManager.scene, 1.0);
  console.info('[main] Agent 2 weapons loaded');
} catch (e) {
  console.warn('[main] Agent 2 not available:', e.message);
  targetDB = {
    getCity: () => null,
    searchCities: () => [],
    getAllCities: () => [],
    getCitiesInRadius: () => [],
    getTopTargets: () => [],
  };
}

// === 4. Agent 3 - Physics ===
try {
  const physics = await import('./physics/index.js');
  popGrid = new physics.PopulationGrid();
  await popGrid.load();
  casualtyEst = new physics.CasualtyEstimator(popGrid, targetDB);
  console.info('[main] Agent 3 physics loaded');
} catch (e) {
  console.warn('[main] Agent 3 not available, using stub estimator:', e.message);
  casualtyEst = {
    estimateDetonation(lat, lon, yieldKt) {
      const dead    = Math.round(50000 * Math.pow(Math.max(yieldKt, 1), 0.7));
      const injured = Math.round(dead * 0.4);
      return {
        immediate_dead: dead, injured, total_affected: dead + injured,
        lat, lon, yield_kt: yieldKt, blast_rings_km: {}, thermal_rings_km: {},
      };
    },
    estimateScenario(detonations) {
      const results = detonations.map(d =>
        this.estimateDetonation(d.lat, d.lon, d.yield_kt || d.yieldKt || 0));
      const total_yield_kt = detonations.reduce((s, d) => s + (d.yield_kt || d.yieldKt || 0), 0);
      return {
        total_dead:     results.reduce((s, r) => s + r.immediate_dead, 0),
        total_injured:  results.reduce((s, r) => s + r.injured, 0),
        total_affected: results.reduce((s, r) => s + r.total_affected, 0),
        by_country: {}, detonation_results: results, total_yield_kt,
        soot_tg: total_yield_kt * 0.000003,
      };
    },
  };
}

// === 5. Agent 4 - Effects ===
try {
  const effects = await import('./effects/index.js');
  if (sceneManager) {
    thermalFlash  = new effects.ThermalFlash();
    shockwave     = new effects.ShockwaveRing(sceneManager.scene);
    cloudFx       = new effects.MushroomCloud(sceneManager.scene);
    ringOverlay   = new effects.BlastRingOverlay(sceneManager.scene);
    detonationSeq = new effects.DetonationSequence(thermalFlash, shockwave, cloudFx, ringOverlay);
    missileFx     = new effects.MissileTrajectory(sceneManager.scene);
  }
  console.info('[main] Agent 4 effects loaded');
} catch (e) {
  console.warn('[main] Agent 4 not available, using CSS flash stub:', e.message);
  thermalFlash = {
    trigger(intensity, duration_ms) {
      const el = document.getElementById('thermal-flash');
      if (!el) return;
      const dur = duration_ms || 400;
      el.style.transition = 'none';
      el.style.opacity = intensity || 1;
      requestAnimationFrame(() => {
        el.style.transition = 'opacity ' + dur + 'ms ease-out';
        requestAnimationFrame(() => { el.style.opacity = 0; });
      });
    },
  };
  detonationSeq = {
    async detonate(lat, lon, yieldKt) {
      const intensity = Math.min(1, Math.log10(Math.max(yieldKt, 1)) / 4);
      thermalFlash.trigger(intensity, 400);
    },
  };
}

// === 6. UI Initialization ===
let simResults = {
  total_dead: 0, total_injured: 0, total_affected: 0,
  by_country: {}, detonation_results: [], total_yield_kt: 0, soot_tg: 0,
};
let currentScenario = null;
const exporter    = new ReportExporter(simResults);
const layout      = new MainLayout();
layout.init();
const statsPanel    = new StatsPanel();
const scenarioPanel = new ScenarioPanel(onLoadScenario);
scenarioPanel.render(ALL_SCENARIOS);
const forcePanel = new ForceOrderPanel(forceManager, targetDB, onExecute);
const timeline   = new TimelineController(onTimelineTick);

// === Scenario load handler ===
function onLoadScenario(scenario) {
  currentScenario = scenario;
  simResults = {
    total_dead: 0, total_injured: 0, total_affected: 0,
    by_country: {}, detonation_results: [], total_yield_kt: 0, soot_tg: 0,
    scenario_name: scenario.name,
  };
  exporter.setResults(simResults);
  statsPanel.reset();
  layout.setDefcon(scenario.defcon || 3);
  timeline.loadSequence(scenario.strikes || []);
  layout.switchPanel('execute');

  const exec = document.getElementById('execute-panel');
  if (exec) {
    exec.innerHTML = `
      <div class="panel-header">&#9889; EXECUTE STRIKE ORDER
        <span class="classified-tag badge-classified">AUTHORIZED</span>
      </div>
      <div style="margin-bottom:12px;font-size:12px;color:var(--text-secondary)">
        <strong style="color:var(--accent-green)">${scenario.name}</strong><br>
        ${scenario.description || ''}
      </div>
      <div class="stats-section" style="margin-bottom:10px">
        <div class="stat-row"><span class="stat-label">STRIKES</span><span class="stat-value">${(scenario.strikes || []).length}</span></div>
        <div class="stat-row"><span class="stat-label">WARHEADS</span><span class="stat-value">${scenario.total_warheads || '?'}</span></div>
        <div class="stat-row"><span class="stat-label">EST. CASUALTIES</span><span class="stat-value red">${scenario.estimated_casualties_range || '?'}</span></div>
      </div>
      <div class="btn-group">
        <button class="btn danger" id="btn-launch-now" style="flex:1;justify-content:center">&#9889; LAUNCH SEQUENCE</button>
        <button class="btn" id="btn-abort-scenario" style="justify-content:center">ABORT</button>
      </div>
    `;
    document.getElementById('btn-launch-now')?.addEventListener('click', () => timeline.play());
    document.getElementById('btn-abort-scenario')?.addEventListener('click', () => {
      timeline.rewind(); statsPanel.reset();
      layout.setDefcon(5); layout.switchPanel('scenarios');
    });
  }
  window.dispatchEvent(new CustomEvent('scenario:loaded', { detail: { scenario } }));
}

// === Detonation handler ===
async function onDetonation(strike) {
  const lat    = strike.lat ?? 0;
  const lon    = strike.lon ?? 0;
  const yieldKt = strike.yield_kt || strike.yieldKt || 10;
  const burstM  = strike.burst_height_m || 1000;

  if (detonationSeq) {
    try { await detonationSeq.detonate(lat, lon, yieldKt, {}, {}); } catch (_) {}
  }
  if (missileFx && strike.origin_lat != null) {
    try {
      missileFx.addFlight(strike.origin_lat, strike.origin_lon, lat, lon,
        { color: 0x00FF41, duration_ms: 3000, warheadId: strike.warhead_id });
    } catch (_) {}
  }
  try {
    const result = casualtyEst.estimateDetonation(lat, lon, yieldKt, burstM, burstM > 0);
    result.attacker       = strike.attacker;
    result.target_city_id = strike.target_city_id;
    result.timestamp_ms   = timeline.getCurrentTime();
    simResults.detonation_results.push(result);
    simResults.total_dead     += result.immediate_dead || 0;
    simResults.total_injured  += result.injured        || 0;
    simResults.total_affected += result.total_affected || 0;
    simResults.total_yield_kt += yieldKt;
    simResults.soot_tg        += yieldKt * 0.000003;
    const c = strike.attacker || 'Unknown';
    if (!simResults.by_country[c]) simResults.by_country[c] = { dead: 0, injured: 0 };
    simResults.by_country[c].dead    += result.immediate_dead || 0;
    simResults.by_country[c].injured += result.injured        || 0;
    exporter.setResults({ ...simResults });
    statsPanel.update({ ...simResults });
    window.dispatchEvent(new CustomEvent('sim:casualties_updated', { detail: { results: { ...simResults } } }));
  } catch (err) {
    console.warn('[main] Casualty error:', err.message);
  }
}

function onExecute() { if (currentScenario) timeline.play(); }
function onTimelineTick() {}

// === Global event wiring ===
window.addEventListener('sim:detonate', async e => {
  if (e.detail && e.detail.strike) await onDetonation(e.detail.strike);
});
window.addEventListener('ui:export_report', () => exporter.exportTextReport());

// === Weapon placement mode (weapon designer → globe click) ===
let _pendingWeaponConfig = null;

function _enterPlacementMode(config) {
  _pendingWeaponConfig = config;
  const canvas = document.getElementById('globe-canvas');
  if (canvas) canvas.style.cursor = 'crosshair';
  // Show placement hint in HUD
  const hint = document.getElementById('placement-hint');
  if (hint) {
    hint.style.display = 'block';
    hint.textContent = `📍 Click globe to place: ${config.system?.name || 'weapon'} (${config.yield_kt ?? '?'}kt) — ESC to cancel`;
  }
}

function _exitPlacementMode() {
  _pendingWeaponConfig = null;
  const canvas = document.getElementById('globe-canvas');
  if (canvas) canvas.style.cursor = '';
  const hint = document.getElementById('placement-hint');
  if (hint) hint.style.display = 'none';
}

// Listen for weapon designer "Add to Force" → enter placement mode
window.addEventListener('weapondesigner:add_to_force', e => {
  if (e.detail?.config) _enterPlacementMode(e.detail.config);
});

// ESC cancels placement
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && _pendingWeaponConfig) _exitPlacementMode();
});

const globeCanvas = document.getElementById('globe-canvas');
if (globeCanvas && cameraCtrl && cameraCtrl.getPickedLatLon) {
  globeCanvas.addEventListener('click', e => {
    try {
      const picked = cameraCtrl.getPickedLatLon(e);
      if (!picked) return;

      // If in placement mode → place weapon unit at clicked location
      if (_pendingWeaponConfig && forceManager) {
        const config = _pendingWeaponConfig;
        _exitPlacementMode();
        const unitId = forceManager.addUnit(config, picked.lat, picked.lon);
        console.info(`[NuclearSim] Unit placed: ${unitId} @ (${picked.lat.toFixed(2)}, ${picked.lon.toFixed(2)})`);
        // Auto-switch to force order panel so user sees the placed unit
        layout.switchPanel?.('force');
        return;
      }

      window.dispatchEvent(new CustomEvent('globe:click', { detail: picked }));
    } catch (_) {}
  });
}

// === Engine render loop (Agent 1) ===
if (sceneManager && sceneManager.startRenderLoop) {
  sceneManager.startRenderLoop(delta => {
    if (cameraCtrl && cameraCtrl.update) cameraCtrl.update(delta);
    if (missileFx  && missileFx.update)  missileFx.update(delta);
    if (cloudFx    && cloudFx.update)    cloudFx.update(delta);
    if (shockwave  && shockwave.update)  shockwave.update(delta);
  });
}

console.info('[NuclearSim] v3 ready. "This is not a game. It\'s a simulation."');
