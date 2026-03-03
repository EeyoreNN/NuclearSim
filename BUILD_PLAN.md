# NuclearSim — Complete Build Plan
## Architect: Claude Sonnet 4.6 | Date: 2026-03-03

> **"This is not a game. It's a simulation."**
> — Displayed on every boot screen, permanently.

---

## Table of Contents
1. [Overview & Tech Stack](#1-overview--tech-stack)
2. [Complete File Architecture](#2-complete-file-architecture)
3. [Agent Task Assignments](#3-agent-task-assignments)
4. [Module Interfaces & Exports](#4-module-interfaces--exports)
5. [Nuclear Physics Formulas](#5-nuclear-physics-formulas)
6. [Weapons Dataset Specification](#6-weapons-dataset-specification)
7. [Target Cities Database Spec](#7-target-cities-database-spec)
8. [UI Design Specification](#8-ui-design-specification)
9. [Predefined Scenarios Spec](#9-predefined-scenarios-spec)
10. [GitHub Pages Deploy Config](#10-github-pages-deploy-config)
11. [Integration Checklist](#11-integration-checklist)

---

## 1. Overview & Tech Stack

### What We're Building
A high-fidelity nuclear war simulation web application that clones the feature set of [Nuclear War Simulator (Steam)](https://store.steampowered.com/app/1603940/Nuclear_War_Simulator/). Users design nuclear forces, target cities on an interactive 3D globe, execute attack scenarios, and receive detailed casualty/effects reports.

### Tech Stack — ZERO EXCEPTIONS
| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Bundler | **Vite** | latest | Fast HMR, native ESM, easy GitHub Pages via `vite build` |
| 3D Engine | **Three.js** | r168+ | Industry standard WebGL; massive shader/globe ecosystem |
| Language | **Vanilla JavaScript** | ES2022+ | No framework overhead; direct Three.js control |
| CSS | **Custom CSS** | — | IBM Plex Mono font; glassmorphism; CSS variables |
| Data | **JSON files** | — | Arsenal data, cities, scenarios bundled as static assets |
| Charts | **None** | — | Custom canvas/SVG drawing for stats (no Chart.js bloat) |
| Physics | **Custom JS** | — | Glasstone-Dolan formulas implemented directly |
| Deployment | **GitHub Pages** | — | `gh-pages` npm package or GitHub Actions workflow |

**No React. No Vue. No TypeScript. No UI framework libraries.**

---

## 2. Complete File Architecture

```
NuclearSim/
├── index.html                    # Entry point — boot screen + app container
├── vite.config.js                # Vite config — base path for GitHub Pages
├── package.json
├── .gitignore
├── BUILD_PLAN.md                 # This file
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions auto-deploy to gh-pages
│
├── public/                       # Static assets (copied as-is to dist/)
│   ├── textures/
│   │   ├── earth_daymap.jpg      # 4096×2048 NASA Blue Marble day texture
│   │   ├── earth_nightmap.jpg    # 4096×2048 city lights texture
│   │   ├── earth_specular.jpg    # 2048×1024 ocean specular map
│   │   ├── earth_bump.jpg        # 2048×1024 elevation bump map
│   │   ├── earth_clouds.png      # 2048×1024 cloud alpha map
│   │   └── stars_milkyway.jpg    # 4096×2048 starfield texture (sphere interior)
│   ├── sounds/
│   │   ├── launch.mp3            # ICBM launch sound
│   │   ├── detonation.mp3        # Nuclear detonation boom
│   │   └── alert.mp3             # DEFCON alert klaxon
│   └── fonts/
│       └── IBMPlexMono-Regular.woff2
│
├── src/
│   ├── main.js                   # App entry — imports all modules, wires together
│   ├── style.css                 # Global styles, CSS variables, glassmorphism
│   │
│   ├── engine/                   # AGENT 1: Core Three.js engine
│   │   ├── SceneManager.js       # THREE.Scene, renderer, clock, resize handler
│   │   ├── GlobeBuilder.js       # Earth mesh with all texture layers
│   │   ├── AtmosphereShader.js   # GLSL vertex+fragment for Fresnel atmosphere glow
│   │   ├── DayNightShader.js     # GLSL day/night blend based on sun direction
│   │   ├── StarfieldBuilder.js   # Starfield sphere (BackSide render)
│   │   ├── CameraController.js   # OrbitControls wrapper with constraints
│   │   └── index.js              # Re-exports: { SceneManager, GlobeBuilder, ... }
│   │
│   ├── weapons/                  # AGENT 2: Weapons & data layer
│   │   ├── arsenal/
│   │   │   ├── usa.json          # US arsenal — complete warhead/delivery data
│   │   │   ├── russia.json       # Russian arsenal
│   │   │   ├── china.json        # Chinese arsenal
│   │   │   ├── uk.json           # UK arsenal
│   │   │   ├── france.json       # French arsenal
│   │   │   ├── india.json        # Indian arsenal
│   │   │   ├── pakistan.json     # Pakistani arsenal
│   │   │   ├── israel.json       # Israeli arsenal
│   │   │   └── northkorea.json   # North Korean arsenal
│   │   ├── cities.json           # 500+ cities with lat/lon/population
│   │   ├── ArsenalLoader.js      # Loads + merges all arsenal JSON files
│   │   ├── WeaponDesigner.js     # Weapon customization logic (not UI)
│   │   ├── WeaponDesignerUI.js   # DOM panel: warhead selector, yield slider, delivery type
│   │   ├── ForceManager.js       # Manages placed forces on globe (positions, assignments)
│   │   ├── TargetDatabase.js     # Loads cities.json, exposes query/search API
│   │   └── index.js              # Re-exports all weapons module APIs
│   │
│   ├── physics/                  # AGENT 3: Physics & effects engine
│   │   ├── BlastCalculator.js    # Glasstone cube-root scaling, overpressure rings
│   │   ├── ThermalCalculator.js  # Thermal fluence, burn radius formulas
│   │   ├── RadiationCalculator.js# Prompt radiation dose; fallout dose-rate model
│   │   ├── FalloutPlume.js       # Miller SFSS fallout ellipse geometry + dose contours
│   │   ├── CasualtyEstimator.js  # Population grid overlay, lethal zone integration
│   │   ├── PopulationGrid.js     # 1-degree cell population data; spatial queries
│   │   ├── NuclearWinter.js      # Soot production estimate from scenario total yield
│   │   └── index.js              # Re-exports all physics APIs
│   │
│   ├── effects/                  # AGENT 4: Visual effects
│   │   ├── MushroomCloud.js      # Particle system + shader for mushroom cloud
│   │   ├── MushroomShader.js     # GLSL for cloud particles (heat shimmer, opacity)
│   │   ├── ShockwaveRing.js      # Expanding ring mesh animation on globe surface
│   │   ├── ThermalFlash.js       # Full-screen white flash overlay (CSS + canvas)
│   │   ├── MissileTrajectory.js  # Animated arc path along great circle
│   │   ├── DetonationSequence.js # Orchestrates: flash → shockwave → cloud → rings
│   │   ├── BlastRingOverlay.js   # Persistent colored rings on globe for effect radii
│   │   └── index.js              # Re-exports all effects APIs
│   │
│   └── ui/                       # AGENT 5: UI shell + scenarios
│       ├── BootScreen.js         # Splash screen with quote, scanline animation
│       ├── MainLayout.js         # Top nav, sidebar panels, bottom timeline
│       ├── ScenarioPanel.js      # Predefined scenario selector + loader
│       ├── ForceOrderPanel.js    # Assign weapons to targets, launch sequencing
│       ├── StatsPanel.js         # Live casualty counter, yield totals, damage summary
│       ├── TimelineController.js # Playback: play/pause/step/speed controls + scrubber
│       ├── ReportExporter.js     # Generate text/CSV report; trigger download
│       ├── scenarios/
│       │   ├── us_russia_full.js     # US/Russia full exchange (~3,000 warheads)
│       │   ├── india_pakistan.js     # India/Pakistan regional war
│       │   ├── nato_russia.js        # NATO vs Russia (European theater)
│       │   ├── china_usa.js          # China/US Pacific exchange
│       │   ├── north_korea.js        # NK strikes on South Korea + Japan + Guam
│       │   └── uk_france_vs_russia.js# European powers vs Russia
│       └── index.js              # Re-exports all UI module APIs
```

---

## 3. Agent Task Assignments

### AGENT 1 — Core Engine
**Files owned:** `src/engine/` (all 7 files)
**Dependency:** None. Build first — all other agents depend on it.

#### Deliverables

**`SceneManager.js`** — exports `SceneManager` class:
```javascript
export class SceneManager {
  constructor(canvasEl)          // Takes <canvas> element
  get scene()                    // THREE.Scene ref
  get camera()                   // THREE.PerspectiveCamera ref
  get renderer()                 // THREE.WebGLRenderer ref
  get clock()                    // THREE.Clock ref
  startRenderLoop(updateFn)      // RAF loop; calls updateFn(delta) each frame
  onResize()                     // Bound to window resize
}
```
- `THREE.WebGLRenderer` with `antialias: true`, `logarithmicDepthBuffer: true`
- Canvas fills viewport; `pixelRatio = Math.min(window.devicePixelRatio, 2)`
- `THREE.PerspectiveCamera(45, aspect, 0.1, 1000)`
- Camera starts at `[0, 0, 3.5]` (3.5 earth-radii from center)
- `THREE.AmbientLight(0xffffff, 0.1)` + `THREE.DirectionalLight(0xffffff, 1.0)` positioned as sun

**`GlobeBuilder.js`** — exports `buildGlobe(scene, textureLoader)` → returns `{ earthMesh, cloudMesh }`:
- `THREE.SphereGeometry(1.0, 64, 64)` — earth radius = 1.0 unit (ALL other systems reference this)
- `DayNightShader` material applied to earth
- Cloud layer: `SphereGeometry(1.01, 32, 32)` with alpha-transparent cloud texture
- Cloud rotates +0.0005 rad/frame around Y axis

**`AtmosphereShader.js`** — exports `createAtmosphereMesh()` → returns `THREE.Mesh`:
- `SphereGeometry(1.08, 64, 64)` with `ShaderMaterial`
- `THREE.FrontSide` render
- Fresnel-based glow: `pow(1.0 + dot(vNormal, eyeVector), 3.0)`
- Color: `vec3(0.2, 0.6, 1.0)` (blue glow)
- `transparent: true`, `depthWrite: false`, `blending: THREE.AdditiveBlending`

```glsl
// AtmosphereShader VERTEX:
varying vec3 vNormal;
varying vec3 eyeVector;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  eyeVector = normalize(worldPos.xyz - cameraPosition);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// AtmosphereShader FRAGMENT:
varying vec3 vNormal;
varying vec3 eyeVector;
uniform vec3 atmColor;      // default: vec3(0.2, 0.6, 1.0)
uniform float atmPower;     // default: 3.0
void main() {
  float intensity = pow(1.0 + dot(vNormal, eyeVector), atmPower);
  gl_FragColor = vec4(atmColor, intensity * 0.8);
}
```

**`DayNightShader.js`** — exports `createDayNightMaterial(textures)` → returns `THREE.ShaderMaterial`:
```glsl
// DayNightShader FRAGMENT:
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D specularMap;
uniform sampler2D bumpMap;
uniform vec3 sunDir;          // normalized direction to sun in world space
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  float cosA = dot(normalize(vNormal), normalize(sunDir));
  float blend = smoothstep(-0.15, 0.15, cosA);
  vec4 day   = texture2D(dayMap, vUv);
  vec4 night = texture2D(nightMap, vUv);
  // specular highlight on oceans
  float spec = texture2D(specularMap, vUv).r;
  vec3 col = mix(night.rgb, day.rgb, blend);
  col += spec * pow(max(cosA, 0.0), 32.0) * 0.3;
  gl_FragColor = vec4(col, 1.0);
}
```
- `sunDir` uniform updated each frame by SceneManager: `sunDir = new THREE.Vector3(1, 0.2, 0.5).normalize()`

**`StarfieldBuilder.js`** — exports `buildStarfield(scene)`:
- `SphereGeometry(500, 64, 64)` with `MeshBasicMaterial({ map: starTexture, side: THREE.BackSide })`
- Does NOT rotate (fixed background)

**`CameraController.js`** — exports `CameraController` class:
```javascript
export class CameraController {
  constructor(camera, domElement)
  // Wraps THREE.OrbitControls with custom constraints:
  //   minDistance: 1.3  (can't go inside atmosphere)
  //   maxDistance: 12.0 (can't go too far from globe)
  //   enableDamping: true, dampingFactor: 0.08
  //   enablePan: false   (globe only rotates, no pan)
  //   autoRotate: false (user controls)
  update(delta)              // Call in render loop
  flyTo(lat, lon, distance)  // GSAP-style tween camera to lat/lon on globe
  getPickedLatLon(event)     // Raycaster against globe; returns {lat, lon} or null
}
```
- `flyTo` uses linear interpolation over 60 frames, eases with `smoothstep`
- `getPickedLatLon` converts Three.js intersection point on unit sphere to lat/lon:
  ```javascript
  // point = normalized intersection on unit sphere
  lat = Math.asin(point.y) * 180 / Math.PI;
  lon = Math.atan2(-point.z, point.x) * 180 / Math.PI;
  ```

**`engine/index.js`**:
```javascript
export { SceneManager } from './SceneManager.js';
export { buildGlobe } from './GlobeBuilder.js';
export { createAtmosphereMesh } from './AtmosphereShader.js';
export { buildStarfield } from './StarfieldBuilder.js';
export { CameraController } from './CameraController.js';
```

---

### AGENT 2 — Weapons & Data Layer
**Files owned:** `src/weapons/` (all files + all arsenal JSON files + cities.json)
**Dependency:** Engine (for globe interaction). Reads `CameraController.getPickedLatLon`.

#### Deliverables

**Arsenal JSON files** — Each country file follows this schema:
```json
{
  "country": "USA",
  "flag": "🇺🇸",
  "warheads": [
    {
      "id": "W87-0",
      "name": "W87-0",
      "yield_kt": 300,
      "type": "thermonuclear",
      "weight_kg": 276,
      "description": "Minuteman III primary warhead"
    }
  ],
  "delivery_systems": [
    {
      "id": "minuteman-iii",
      "name": "LGM-30G Minuteman III",
      "type": "ICBM",
      "platform": "silo",
      "range_km": 13000,
      "cep_m": 120,
      "warheads_per_missile": 1,
      "compatible_warheads": ["W87-0", "W78"],
      "count": 400,
      "icon": "🚀",
      "description": "Land-based silo ICBM, backbone of US nuclear triad"
    }
  ]
}
```

**Delivery system `type` values** (exactly): `"ICBM"`, `"SLBM"`, `"ALCM"`, `"GLCM"`, `"IRBM"`, `"SRBM"`, `"gravity_bomb"`, `"HGV"`
**Platform values**: `"silo"`, `"submarine"`, `"mobile_TEL"`, `"aircraft"`, `"surface_ship"`

**`ArsenalLoader.js`** — exports:
```javascript
export async function loadAllArsenals()
// Returns: { usa: {...}, russia: {...}, china: {...}, ... }
// Fetches all 9 country JSON files via fetch()

export function getAllWeaponSystems(arsenals)
// Returns flat array of all delivery systems across all countries

export function getWarheadsForSystem(arsenals, countryId, systemId)
// Returns array of compatible warhead objects
```

**`WeaponDesigner.js`** — exports:
```javascript
export class WeaponDesigner {
  // Manages the currently-configured weapon loadout
  constructor()
  setCountry(countryId)
  setDeliverySystem(systemId)
  setWarhead(warheadId)
  setYield(yieldKt)         // Override yield (custom scenario)
  setBurstHeight(heightM)   // 0 = surface, positive = airburst
  getConfig()               // Returns { country, system, warhead, yield_kt, burst_m, cep_m }
  validate()                // Returns { valid: bool, errors: string[] }
}
```

**`WeaponDesignerUI.js`** — exports `WeaponDesignerUI` class:
- Manages the "WEAPON DESIGNER" panel DOM
- Panel HTML structure (injected into `#weapon-designer-panel`):
  ```
  [WEAPON DESIGNER]
  Country:  [dropdown — 9 countries with flags]
  System:   [dropdown — filtered by country]
  Warhead:  [dropdown — filtered by system]
  Yield:    [slider 1kt–10,000kt, log scale] [value display]
  Burst Ht: [slider 0m–3000m] [value display]
  CEP:      [display only, from selected system]
  [+ ADD TO FORCE] button
  ```
- All controls fire events: `weapondesigner:change` with `detail: { config }`

**`ForceManager.js`** — exports:
```javascript
export class ForceManager {
  constructor(scene, globeRadius)
  addUnit(config, lat, lon)     // Places a marker on globe; returns unitId
  removeUnit(unitId)
  getUnit(unitId)
  getAllUnits()                  // Returns array of { id, config, lat, lon, targetId }
  assignTarget(unitId, targetId) // Assign city target to unit
  clearAllUnits()
  // Each unit marker: THREE.Mesh sprite (2D icon facing camera)
  // Silo: green rectangle; Submarine: blue submarine icon; Aircraft: triangle
  // Emits: 'force:updated' custom event on window
}
```

**`TargetDatabase.js`** — exports:
```javascript
export class TargetDatabase {
  constructor()
  async load()                        // Fetches cities.json
  getCity(cityId)                     // Returns city object
  searchCities(query)                 // Fuzzy name search → array
  getCitiesInRadius(lat, lon, km)     // Returns cities within km
  getCitiesByCountry(countryCode)     // Returns all cities for country
  getTopTargets(n)                    // Returns top n by population
  getAllCities()                       // Returns all 500+ cities
}
```

**`cities.json`** — 500+ cities, schema:
```json
[
  {
    "id": "new_york",
    "name": "New York City",
    "country": "US",
    "country_name": "United States",
    "lat": 40.7128,
    "lon": -74.0060,
    "population": 8336817,
    "metro_population": 20153634,
    "is_capital": false,
    "is_major_target": true,
    "has_military_base": true,
    "nuclear_target_priority": 1
  }
]
```
Include all national capitals + all cities with population > 500,000 + major military bases.
`nuclear_target_priority`: 1=highest (capitals, major cities, military HQs), 2=medium, 3=lower.

**`weapons/index.js`**:
```javascript
export { loadAllArsenals, getAllWeaponSystems, getWarheadsForSystem } from './ArsenalLoader.js';
export { WeaponDesigner } from './WeaponDesigner.js';
export { WeaponDesignerUI } from './WeaponDesignerUI.js';
export { ForceManager } from './ForceManager.js';
export { TargetDatabase } from './TargetDatabase.js';
```

---

### AGENT 3 — Physics & Effects Engine
**Files owned:** `src/physics/` (all 8 files)
**Dependency:** None. Pure calculation functions — no Three.js imports.

#### Deliverables

**`BlastCalculator.js`** — exports:
```javascript
// Reference radii at 1 kt airburst (optimum HOB), in km
export const BLAST_REF_RADII = {
  psi_20:  0.28,   // 138 kPa — reinforced concrete leveled
  psi_10:  0.40,   // 69 kPa  — all structures collapse
  psi_5:   0.60,   // 34 kPa  — wood/masonry destroyed, >50% killed
  psi_2:   1.00,   // 14 kPa  — moderate structural damage
  psi_1:   1.70,   // 7 kPa   — light structural damage, windows out
  psi_0_5: 2.80    // 3.5 kPa — glass injury zone
};

// Cube-root scaling law: R(Y) = R_ref * (Y / 1.0)^(1/3)
export function blastRadius(yieldKt, overpressurePsi)
// Returns: radius in km
// overpressurePsi: one of 20, 10, 5, 2, 1, 0.5

export function allBlastRings(yieldKt)
// Returns: { psi_20, psi_10, psi_5, psi_2, psi_1, psi_0_5 } — all radii in km

export function optimalBurstHeight(yieldKt, targetPsi = 5)
// Returns: HOB in km for maximum ground radius at given overpressure
// Formula: HOB = C * Y^(1/3)
// C values: psi_5→0.45, psi_10→0.28, psi_20→0.18

export function fireballRadius(yieldKt, surface = false)
// Returns: fireball radius in km
// Airburst: 0.07 * Y^0.4
// Surface:  0.05 * Y^0.4

export function craterRadius(yieldKt)
// Returns: crater radius in km for surface burst
// Formula: 0.0389 * Y^(1/3.4)  (apparent crater, dry soil)
```

**`ThermalCalculator.js`** — exports:
```javascript
export const THERMAL_REF_RADII_1KT = {
  cal_3:  0.35,    // 1st degree burns threshold
  cal_5:  0.50,    // 2nd degree burns
  cal_8:  0.65,    // 3rd degree burns (primary kill zone)
  cal_12: 0.80,    // 3rd degree burns worst case
  cal_45: 0.28     // Wood charring / fabric ignition
};

// Thermal ranges scale as Y^0.41 (NOT cube-root — area effect)
export function thermalRadius(yieldKt, calPerCmSq, clearDay = true)
// Returns: radius in km

export function thermalFluence(yieldKt, rangeKm, atmosphericTransmission = 1.0)
// Returns: thermal fluence in cal/cm²
// Formula: Q = (0.35 * Y_cal) / (4 * PI * R_cm^2) * T_atm
// 1 kt = 1e12 cal; R must be in cm

export function allThermalRings(yieldKt, clearDay = true)
// Returns: { cal_3, cal_5, cal_8, cal_12 } — radii in km
```

**`RadiationCalculator.js`** — exports:
```javascript
// Prompt radiation (neutron + gamma) — only significant for yields < 50kt
export function promptRadiationRadius(yieldKt, doseSv = 5)
// Returns: radius in km for given dose in Sv (5 Sv = likely lethal)
// Formula: D(R) = D0 * exp(-R / lambda) / R^2
// Effective only for yields < 50 kt; set to 0 beyond that

// Fallout dose-rate model (Miller SFSS, surface bursts only)
export function falloutArrivalTime(yieldKt)
// Returns: minutes after burst
// Formula: 4 * Y^0.2

export function doseRateAtTime(D_1hr, t_hours)
// Returns: dose rate in rad/hr at time t
// Formula: D_1hr * t^(-1.2)

export function accumulatedDose(D_1hr, t1_hours, t2_hours)
// Returns: total dose in rad from t1 to t2
// Formula: D_1hr * (t1^(-0.2) - t2^(-0.2)) / 0.2

// Dose rate contours (H+1 hr reference, in rad/hr)
export const FALLOUT_CONTOURS = {
  lethal_immediate: 1000,    // >1000 rad/hr — fatal within hours
  lethal_exposure:   100,    // >100 rad/hr — lethal with extended exposure
  hazardous:          10,    // >10 rad/hr — significant hazard
  detectable:          1     // >1 rad/hr — measurable hazard
};
```

**`FalloutPlume.js`** — exports:
```javascript
export class FalloutPlume {
  constructor(yieldKt, fissionFraction = 0.5)
  // fissionFraction: 0.5 for fission bomb, 0.5 for thermonuclear (fission stage)

  // Compute plume ellipse parameters
  getPlumeEllipse(windSpeedMs, windDirDeg)
  // Returns: {
  //   centerLat, centerLon,     // downwind center point
  //   semiMajorKm,              // downwind axis (depends on yield + wind)
  //   semiMinorKm,              // crosswind axis
  //   rotationDeg,              // ellipse rotation = wind direction
  //   contours: [               // array of contour ellipses
  //     { doseRate: 1000, semiMajor, semiMinor },
  //     { doseRate: 100,  ... },
  //     { doseRate: 10,   ... },
  //     { doseRate: 1,    ... }
  //   ]
  // }

  // Miller SFSS formula for plume dimensions:
  // downwind length L = 150 * Y^0.4 / v_wind  (km, wind in m/s)
  // crosswind width W = 20  * Y^0.3            (km)
}
```

**`CasualtyEstimator.js`** — exports:
```javascript
export class CasualtyEstimator {
  constructor(populationGrid, targetDatabase)

  estimateDetonation(lat, lon, yieldKt, burstHeightM, airburstMode = true)
  // Returns: {
  //   immediate_dead: number,      // inside 5 psi ring + 8 cal/cm² ring
  //   injured: number,             // 1-5 psi ring
  //   total_affected: number,      // all inside 0.5 psi ring
  //   lat, lon, yield_kt,
  //   blast_rings_km: { psi_20, psi_10, psi_5, psi_2, psi_1, psi_0_5 },
  //   thermal_rings_km: { cal_3, cal_5, cal_8 },
  //   fireball_km: number,
  //   crater_km: number | null     // null if airburst
  // }

  estimateScenario(detonations)
  // detonations: array of { lat, lon, yieldKt, burstHeightM }
  // Returns: {
  //   total_dead: number,
  //   total_injured: number,
  //   total_affected: number,
  //   by_country: { [countryCode]: { dead, injured } },
  //   detonation_results: [...],    // per-detonation results
  //   soot_tg: number              // Tg soot (NuclearWinter estimate)
  // }

  // Casualty model:
  // Dead = sum of population in cells where:
  //   (overpressure >= 5 psi) OR (thermal >= 8 cal/cm²)
  // Injured = population in cells: (1 psi <= overpressure < 5 psi)
  //   with some survival fraction applied
}
```

**`PopulationGrid.js`** — exports:
```javascript
export class PopulationGrid {
  // Uses a simplified 1-degree lat/lon grid (180×360 = 64,800 cells)
  // Population data derived from GPWv4 / LandScan estimates
  // Stored as Float32Array for performance

  async load()   // Fetches population grid data (bundled JSON or binary)

  getCellPopulation(lat, lon)
  // Returns: population count for 1-degree cell containing lat/lon

  getPopulationInCircle(lat, lon, radiusKm)
  // Returns: total population within radius
  // Uses Haversine for cell-center distance

  getPopulationInEllipse(centerLat, centerLon, semiMajorKm, semiMinorKm, rotDeg)
  // Returns: total population within ellipse (for fallout plume)
}

// NOTE: If full GPWv4 data is too large, use cities.json as proxy:
// Distribute each city's population across cells within 50 km radius.
// This is acceptable for simulation fidelity.
```

**`NuclearWinter.js`** — exports:
```javascript
export function estimateSoot(detonations)
// detonations: array of { yieldKt, burstHeightM, lat, lon }
// Returns: { soot_tg: number, fires_mtoe: number }
// Model:
//   Urban fuel loading: ~10 Tg per 1 Mt yield (Turco et al.)
//   Soot = 0.003 * totalUrbanYield_Mt   (only cities, not military targets)
//   Nuclear winter threshold: ~5 Tg soot

export function winterSeverity(sootTg)
// Returns: { level: "minimal"|"regional"|"nuclear_winter", description: string }
```

**`physics/index.js`**:
```javascript
export { blastRadius, allBlastRings, optimalBurstHeight, fireballRadius, craterRadius, BLAST_REF_RADII } from './BlastCalculator.js';
export { thermalRadius, thermalFluence, allThermalRings, THERMAL_REF_RADII_1KT } from './ThermalCalculator.js';
export { promptRadiationRadius, falloutArrivalTime, doseRateAtTime, accumulatedDose, FALLOUT_CONTOURS } from './RadiationCalculator.js';
export { FalloutPlume } from './FalloutPlume.js';
export { CasualtyEstimator } from './CasualtyEstimator.js';
export { PopulationGrid } from './PopulationGrid.js';
export { estimateSoot, winterSeverity } from './NuclearWinter.js';
```

---

### AGENT 4 — Visual Effects
**Files owned:** `src/effects/` (all 8 files)
**Dependency:** Engine (THREE.js scene), Physics (ring radii), cities/lat-lon conversion.

#### Coordinate Conversion (shared utility — define in effects, re-export for others)
```javascript
// Convert lat/lon to 3D point on unit sphere (radius 1.0)
export function latLonToVector3(lat, lon, radius = 1.0) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}
```

**`MissileTrajectory.js`** — exports `MissileTrajectory` class:
```javascript
export class MissileTrajectory {
  constructor(scene)

  addFlight(startLat, startLon, endLat, endLon, options = {})
  // options: { color, arcHeight, duration_ms, warheadId }
  // Returns: flightId
  // Implementation:
  //   1. Compute great circle points (64 segments) on sphere of radius 1.0
  //   2. Lift midpoint by arcHeight (default: 0.4 * great-circle-distance/PI)
  //   3. Create THREE.TubeGeometry along points, radius 0.002
  //   4. Material: MeshBasicMaterial, color: #00FF41 (green), additive blend
  //   5. Animate drawRange from 0 to n over duration_ms frames
  //   6. Warhead sprite (small triangle) moves along path at leading edge
  //   7. After full draw, flash DetonationSequence at endLat/endLon

  removeFlight(flightId)
  update(delta)             // Advance all in-flight trajectories
  clearAll()
}
```

**`MushroomCloud.js`** — exports `MushroomCloud` class:
```javascript
export class MushroomCloud {
  constructor(scene)

  detonate(lat, lon, yieldKt)
  // Creates particle system at lat/lon on globe surface
  // Scales cloud size by Math.pow(yieldKt, 0.4) * 0.01  (globe units)
  // Returns: cloudId

  update(delta)       // Animate particles — rises over ~3 seconds, persists 30s, fades
  remove(cloudId)
  clearAll()
}
// Particle system:
//   2000 particles (THREE.Points)
//   Positions initialized: sphere burst + upward stem
//   MushroomShader applies: red-orange-grey gradient by height
//   Alpha fades with age
```

**`MushroomShader.js`** — provides GLSL material for `MushroomCloud`:
```glsl
// VERTEX
attribute float age;
attribute float size;
varying float vAge;
varying float vHeight;
void main() {
  vAge = age;
  vHeight = position.y;  // in local cloud space
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mvPos.z);
  gl_Position = projectionMatrix * mvPos;
}

// FRAGMENT
varying float vAge;
varying float vHeight;
uniform float maxAge;
void main() {
  float alpha = 1.0 - (vAge / maxAge);
  float r = smoothstep(0.0, 0.5, vHeight);   // red-orange at bottom
  vec3 col = mix(vec3(1.0, 0.3, 0.0), vec3(0.5, 0.5, 0.5), r); // orange to grey
  // Round particle
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  gl_FragColor = vec4(col, alpha * (1.0 - d*2.0));
}
```

**`ShockwaveRing.js`** — exports `ShockwaveRing` class:
```javascript
export class ShockwaveRing {
  constructor(scene)

  spawn(lat, lon, maxRadiusGlobeUnits, duration_ms = 3000)
  // Creates expanding ring on globe surface at lat/lon
  // Ring is a torus geometry that expands radius from 0 to maxRadius
  // Material: MeshBasicMaterial, color #FF6600, transparent, alpha fades
  // Ring lies flat on globe surface (normal = outward radial from center)
  // Returns: ringId

  update(delta)
  clearAll()
}
// Technical: Ring normal = normalize(latLonToVector3(lat, lon))
// Torus geometry: TubeRadialSegments=2, radius starts 0, expands linearly
// Alternative: use RingGeometry scaled + placed tangent to globe surface
```

**`ThermalFlash.js`** — exports `ThermalFlash` class:
```javascript
export class ThermalFlash {
  constructor()
  // Creates a fixed full-screen <div id="thermal-flash"> with CSS:
  //   position: fixed; top:0; left:0; width:100vw; height:100vh;
  //   background: white; opacity: 0; pointer-events: none; z-index: 9999;

  trigger(intensity = 1.0, duration_ms = 400)
  // Instantly sets opacity = intensity, then fades to 0 over duration_ms
  // intensity: 0-1 (1 = full white flash for large yield)
}
```

**`BlastRingOverlay.js`** — exports `BlastRingOverlay` class:
```javascript
export class BlastRingOverlay {
  constructor(scene)

  addRings(lat, lon, blastRings, thermalRings)
  // blastRings: { psi_20, psi_10, psi_5, psi_2, psi_1, psi_0_5 } in km
  // thermalRings: { cal_3, cal_5, cal_8 } in km
  // Creates persistent ring meshes on globe surface
  // RING COLORS (match NUKEMAP standard):
  //   psi_20: #FF0000 (red)     — fireball
  //   psi_5:  #FF6600 (orange)  — severe blast
  //   psi_2:  #FFAA00 (amber)   — moderate blast
  //   psi_1:  #FFFF00 (yellow)  — light blast
  //   psi_0_5: #00FFFF (cyan)   — glass hazard
  //   cal_8:  #FF00FF (magenta) — 3rd degree burns
  // Returns: overlayId

  removeRings(overlayId)
  clearAll()

  // COORDINATE MATH for ring mesh placement:
  // Ring at lat/lon with radius R km on unit sphere:
  //   globeRadius = 6371 km → 1 unit = 6371 km
  //   ringRadius_units = R / 6371
  //   Place RingGeometry flat, then rotate to face outward from lat/lon point
}
```

**`DetonationSequence.js`** — exports `DetonationSequence` class:
```javascript
export class DetonationSequence {
  constructor(thermalFlash, shockwaveRing, mushroomCloud, blastRingOverlay)
  // Injects dependencies (all effects classes)

  async detonate(lat, lon, yieldKt, blastRings, thermalRings)
  // Orchestrates effects in timed sequence:
  //   t=0ms:      ThermalFlash.trigger(intensity by yield)
  //   t=0ms:      ShockwaveRing.spawn(lat, lon, maxRadius=psi_0_5 in globe units)
  //   t=200ms:    MushroomCloud.detonate(lat, lon, yieldKt)
  //   t=500ms:    BlastRingOverlay.addRings(lat, lon, blastRings, thermalRings)
  //   t=600ms:    Play detonation.mp3 audio
  // Returns: Promise<overlayId>

  // Intensity scaling: intensity = Math.min(1, Math.log10(yieldKt) / 4)
  // (log scale: 1kt→0.25, 10kt→0.5, 100kt→0.75, 1000kt→1.0)
}
```

**`effects/index.js`**:
```javascript
export { MissileTrajectory } from './MissileTrajectory.js';
export { MushroomCloud } from './MushroomCloud.js';
export { ShockwaveRing } from './ShockwaveRing.js';
export { ThermalFlash } from './ThermalFlash.js';
export { BlastRingOverlay } from './BlastRingOverlay.js';
export { DetonationSequence } from './DetonationSequence.js';
export { latLonToVector3 } from './MissileTrajectory.js';
```

---

### AGENT 5 — UI Shell + Scenarios
**Files owned:** `src/ui/` (all files + `src/style.css` + `index.html`)
**Dependency:** All other agents. Wires everything together via `src/main.js`.

#### `index.html` — Complete Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NuclearSim</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <!-- BOOT SCREEN -->
  <div id="boot-screen">
    <div class="boot-content">
      <div class="boot-logo">☢ NUCLEARSIM</div>
      <div class="boot-quote">"This is not a game. It's a simulation."</div>
      <div class="boot-loading">INITIALIZING SYSTEMS<span class="blink">_</span></div>
      <div class="boot-progress"><div id="boot-bar"></div></div>
    </div>
    <div class="scanlines"></div>
  </div>

  <!-- MAIN APP (hidden until boot complete) -->
  <div id="app" style="display:none">
    <!-- Three.js Canvas -->
    <canvas id="globe-canvas"></canvas>

    <!-- TOP NAV BAR -->
    <nav id="top-nav">
      <span class="nav-logo">☢ NUCLEARSIM</span>
      <div class="nav-tabs">
        <button class="nav-tab active" data-panel="scenarios">SCENARIOS</button>
        <button class="nav-tab" data-panel="weapons">WEAPONS</button>
        <button class="nav-tab" data-panel="forces">FORCES</button>
        <button class="nav-tab" data-panel="execute">EXECUTE</button>
        <button class="nav-tab" data-panel="results">RESULTS</button>
      </div>
      <div class="nav-defcon">DEFCON <span id="defcon-level">5</span></div>
    </nav>

    <!-- LEFT SIDEBAR (panels swap here) -->
    <aside id="left-panel">
      <div id="scenarios-panel" class="panel active"></div>
      <div id="weapon-designer-panel" class="panel"></div>
      <div id="forces-panel" class="panel"></div>
      <div id="execute-panel" class="panel"></div>
    </aside>

    <!-- RIGHT SIDEBAR — Stats -->
    <aside id="right-panel">
      <div id="stats-panel" class="panel active"></div>
    </aside>

    <!-- BOTTOM TIMELINE -->
    <div id="timeline-bar">
      <div id="timeline-controls">
        <button id="btn-rewind">⏮</button>
        <button id="btn-play">▶</button>
        <button id="btn-pause">⏸</button>
        <button id="btn-step">⏭</button>
        <input type="range" id="timeline-scrubber" min="0" max="100" value="0" />
        <span id="timeline-time">T+00:00</span>
        <select id="timeline-speed">
          <option value="0.25">0.25×</option>
          <option value="0.5">0.5×</option>
          <option value="1" selected>1×</option>
          <option value="2">2×</option>
          <option value="5">5×</option>
          <option value="10">10×</option>
        </select>
      </div>
      <div id="strike-sequence-display"></div>
    </div>

    <!-- THERMAL FLASH OVERLAY -->
    <div id="thermal-flash"></div>

    <!-- SCANLINE OVERLAY (always on top) -->
    <div id="scanlines-overlay"></div>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**`BootScreen.js`** — exports `runBootSequence()`:
- Animates progress bar from 0→100% over 2.5 seconds
- Simulates system checks: "LOADING ARSENAL DATABASE... OK", "INITIALIZING PHYSICS ENGINE... OK", etc.
- Blinks cursor on "INITIALIZING SYSTEMS_"
- At 100%: fade out `#boot-screen`, show `#app`
- Returns Promise that resolves when boot complete

**`MainLayout.js`** — exports `MainLayout` class:
```javascript
export class MainLayout {
  constructor()
  init()                      // Wire nav tabs → panel switching
  switchPanel(panelName)      // Show/hide left panels
  setDefcon(level)            // Update DEFCON indicator (1-5)
  // DEFCON color mapping:
  //   5: #00FF41 (green)
  //   4: #FFFF00 (yellow)
  //   3: #FFA500 (orange)
  //   2: #FF6600 (red-orange)
  //   1: #FF0000 (red) + pulsing animation
}
```

**`ScenarioPanel.js`** — exports `ScenarioPanel` class:
```javascript
export class ScenarioPanel {
  constructor(onLoadScenario)
  // Renders scenario list in #scenarios-panel
  // Each scenario card shows: name, participants, total warheads, est. casualties
  // [LOAD SCENARIO] button calls onLoadScenario(scenarioData)
}
```

**`ForceOrderPanel.js`** — exports `ForceOrderPanel` class:
```javascript
export class ForceOrderPanel {
  constructor(forceManager, targetDatabase, onExecute)
  // Renders list of placed units with assigned targets
  // Allows: set target (click on globe or type name), set detonation time (T+ offset)
  // [EXECUTE STRIKE] button calls onExecute()
  // Shows: unit icon, weapon name, target city, yield, burst mode, T+ time
}
```

**`StatsPanel.js`** — exports `StatsPanel` class:
- Updates `#stats-panel` in real-time during/after simulation
- Live counters animate with CSS counter transitions
- Layout:
  ```
  ┌─────────────────────────────┐
  │ ☠ ESTIMATED CASUALTIES       │
  │   DEAD:    123,456,789       │
  │   INJURED:  45,678,901       │
  │   AFFECTED: 234,567,890      │
  ├─────────────────────────────┤
  │ 💥 WEAPONS DEPLOYED           │
  │   WARHEADS: 142              │
  │   TOTAL YIELD: 847 Mt        │
  ├─────────────────────────────┤
  │ ❄ NUCLEAR WINTER              │
  │   SOOT: 34.2 Tg              │
  │   SEVERITY: NUCLEAR WINTER   │
  ├─────────────────────────────┤
  │ BY COUNTRY:                  │
  │   USA: 45M / RU: 78M / ...  │
  └─────────────────────────────┘
  ```

**`TimelineController.js`** — exports `TimelineController` class:
```javascript
export class TimelineController {
  constructor(onTick)
  // onTick(simulationTimeMs) called each frame when playing

  loadSequence(detonations)
  // detonations: array of { time_ms, lat, lon, yieldKt, ... }
  // Sorts by time_ms, sets scrubber max to max time

  play()
  pause()
  step()     // advance one event
  rewind()   // reset to t=0
  setSpeed(multiplier)

  getCurrentTime()  // Returns current sim time in ms
  // Updates #timeline-time display: "T+HH:MM:SS"
  // Fires detonations at their scheduled sim time
}
```

**`ReportExporter.js`** — exports `ReportExporter` class:
```javascript
export class ReportExporter {
  constructor(scenarioResults)

  exportCSV()
  // Downloads: nuclearsim_report.csv
  // Columns: lat, lon, yield_kt, burst_height_m, dead, injured, timestamp_ms

  exportTextReport()
  // Downloads: nuclearsim_report.txt
  // Header: "NUCLEARSIM STRIKE ASSESSMENT REPORT"
  // Includes: scenario name, date, total casualties, country breakdown, per-strike table

  exportJSON()
  // Downloads: nuclearsim_scenario.json
  // Full scenario data for re-import
}
```

#### Scenario Data Format (all 6 scenario files)
```javascript
// Each scenario file exports a scenario object:
export const scenario = {
  id: "us_russia_full",
  name: "US/Russia Full Exchange",
  description: "Both sides launch their full deployed arsenal simultaneously.",
  participants: ["USA", "Russia"],
  total_warheads: 3480,
  estimated_casualties_range: "500M–2B",
  thumbnail_description: "Global nuclear war between the two largest arsenals",
  strikes: [
    {
      attacker: "USA",
      weapon_id: "minuteman-iii",
      warhead_id: "W87-0",
      yield_kt: 300,
      burst_height_m: 1800,    // airburst
      origin_lat: 41.5,        // approximate silo field location
      origin_lon: -98.0,       // Nebraska/Wyoming ICBM belt
      target_city_id: "moscow",
      time_ms: 0               // T+0: missiles launch simultaneously
    },
    // ... (50-200 entries per scenario)
  ]
};
```

**Six Scenarios Required:**
1. **`us_russia_full.js`** — US/Russia Full Exchange: ~3,480 warheads. US targets: Moscow, St. Petersburg, all major Russian cities + military bases. Russia targets: Washington DC, New York, LA, Chicago, all 400 US ICBM silos, all major NATO cities. All missiles launch at T=0; ICBMs arrive ~30 min, SLBMs ~15 min.

2. **`india_pakistan.js`** — India/Pakistan Regional: ~170 + 170 warheads. Regional targets: Karachi, Lahore, Islamabad, Rawalpindi, Delhi, Mumbai, Bangalore, Kolkata. Mix of short-range Shaheen and Agni strikes. Entire exchange over ~15 minutes.

3. **`nato_russia.js`** — NATO vs Russia: Russia launches at NATO capitals (London, Paris, Berlin, Warsaw, Brussels), NATO responds with B61-12s from European bases + UK Trident. Includes conventional-looking Iskander strike opening.

4. **`china_usa.js`** — China/US Pacific Exchange: China targets US Pacific bases (Guam, Pearl Harbor, Yokosuka), US targets Beijing, Shanghai, Chengdu, Wuhan, military bases. DF-41s vs. Tridents from Ohio-class.

5. **`north_korea.js`** — NK Strike Package: NK launches Hwasong-15 ICBMs at Seoul, Tokyo, Osaka, Guam, and continental US (Los Angeles, Seattle). US responds with Minuteman IIIs and Tomahawk strikes. Small yield asymmetric exchange.

6. **`uk_france_vs_russia.js`** — European Powers: UK launches 4 Vanguard SSBNs + France launches from Le Triomphant at Russian targets. Russia retaliates at London, Paris, Glasgow, Brest (France). Total ~400 warheads.

**`src/main.js`** — Top-level wiring (Agent 5 writes this):
```javascript
import { SceneManager, buildGlobe, createAtmosphereMesh, buildStarfield, CameraController } from './engine/index.js';
import { loadAllArsenals, WeaponDesignerUI, ForceManager, TargetDatabase } from './weapons/index.js';
import { CasualtyEstimator, PopulationGrid, FalloutPlume } from './physics/index.js';
import { DetonationSequence, MissileTrajectory, ThermalFlash, ShockwaveRing, MushroomCloud, BlastRingOverlay } from './effects/index.js';
import { runBootSequence, MainLayout, ScenarioPanel, ForceOrderPanel, StatsPanel, TimelineController, ReportExporter } from './ui/index.js';

// 1. Boot sequence
await runBootSequence();

// 2. Init Three.js engine
const canvas = document.getElementById('globe-canvas');
const sceneManager = new SceneManager(canvas);
buildGlobe(sceneManager.scene, ...);
createAtmosphereMesh(sceneManager.scene);
buildStarfield(sceneManager.scene);
const camera = new CameraController(sceneManager.camera, canvas);

// 3. Load data
const arsenals = await loadAllArsenals();
const targetDB = new TargetDatabase();
await targetDB.load();
const popGrid = new PopulationGrid();
await popGrid.load();

// 4. Init effects
const thermalFlash = new ThermalFlash();
const shockwave = new ShockwaveRing(sceneManager.scene);
const cloudFx = new MushroomCloud(sceneManager.scene);
const ringOverlay = new BlastRingOverlay(sceneManager.scene);
const detonationSeq = new DetonationSequence(thermalFlash, shockwave, cloudFx, ringOverlay);
const missileFx = new MissileTrajectory(sceneManager.scene);

// 5. Init weapons
const forceManager = new ForceManager(sceneManager.scene, 1.0);
const casualtyEst = new CasualtyEstimator(popGrid, targetDB);

// 6. Init UI
const layout = new MainLayout();
layout.init();
const statsPanel = new StatsPanel();
const scenarioPanel = new ScenarioPanel(onLoadScenario);
const forcePanel = new ForceOrderPanel(forceManager, targetDB, onExecute);
const timeline = new TimelineController(onTimelineTick);

// 7. Globe click → place unit or target
canvas.addEventListener('click', (e) => {
  const { lat, lon } = camera.getPickedLatLon(e);
  // ... placement logic
});

// 8. Render loop
sceneManager.startRenderLoop((delta) => {
  camera.update(delta);
  missileFx.update(delta);
  cloudFx.update(delta);
  shockwave.update(delta);
  timeline.update(delta);
});
```

**`ui/index.js`**:
```javascript
export { runBootSequence } from './BootScreen.js';
export { MainLayout } from './MainLayout.js';
export { ScenarioPanel } from './ScenarioPanel.js';
export { ForceOrderPanel } from './ForceOrderPanel.js';
export { StatsPanel } from './StatsPanel.js';
export { TimelineController } from './TimelineController.js';
export { ReportExporter } from './ReportExporter.js';
```

---

## 4. Module Interfaces & Exports

### Data Flow Diagram
```
user click → CameraController.getPickedLatLon()
                ↓
          ForceManager.addUnit(config, lat, lon)
                ↓
          ForceOrderPanel shows unit list
                ↓
    [EXECUTE] → TimelineController.loadSequence(strikes)
                ↓ (per strike at scheduled time)
          MissileTrajectory.addFlight(origin, target)
                ↓ (on arrival)
          BlastCalculator.allBlastRings(yieldKt)
          ThermalCalculator.allThermalRings(yieldKt)
                ↓
          DetonationSequence.detonate(lat, lon, ...)
                ↓
          CasualtyEstimator.estimateDetonation(...)
                ↓
          StatsPanel.update(cumulativeResults)
```

### Critical Shared Constants
```javascript
// Globe radius in km (for converting blast radii to globe units)
export const EARTH_RADIUS_KM = 6371;

// Convert km radius to Three.js globe units (globe radius = 1.0)
export function kmToGlobeUnits(km) { return km / EARTH_RADIUS_KM; }
```
**This constant must be used by ALL agents when placing objects on the globe.**

### Event Bus (window CustomEvents)
All modules communicate via window events — no direct coupling:
```javascript
// Fired by ForceManager when unit placed
window.dispatchEvent(new CustomEvent('force:unit_added', { detail: { unit } }));

// Fired by TimelineController at each detonation time
window.dispatchEvent(new CustomEvent('sim:detonate', { detail: { strike } }));

// Fired by CasualtyEstimator after each calculation
window.dispatchEvent(new CustomEvent('sim:casualties_updated', { detail: { results } }));

// Fired by ScenarioPanel when scenario loaded
window.dispatchEvent(new CustomEvent('scenario:loaded', { detail: { scenario } }));
```

---

## 5. Nuclear Physics Formulas

### All formulas implemented in `src/physics/` — exact JavaScript form

```javascript
const EARTH_RADIUS_KM = 6371;

// ─── BLAST ────────────────────────────────────────────────────────────────

// Reference radii at 1kt airburst (km)
const R1 = { psi_20: 0.28, psi_10: 0.40, psi_5: 0.60, psi_2: 1.00, psi_1: 1.70, psi_0_5: 2.80 };

// Blast radius at any yield (cube-root scaling law — Hopkinson-Cranz)
function blastRadius(yieldKt, psi) {
  return R1[`psi_${psi}`] * Math.pow(yieldKt, 1/3);
}

// Optimal burst height for given overpressure (km)
// C: psi_5→0.45, psi_10→0.28, psi_20→0.18
function optimalHOB(yieldKt, C = 0.45) {
  return C * Math.pow(yieldKt, 1/3);
}

// Fireball radius (km)
function fireballRadius(yieldKt, surface = false) {
  return (surface ? 0.05 : 0.07) * Math.pow(yieldKt, 0.4);
}

// Apparent crater radius — surface burst, dry soil (km)
function craterRadius(yieldKt) {
  return 0.0389 * Math.pow(yieldKt, 1/3.4);
}

// ─── THERMAL ──────────────────────────────────────────────────────────────

// Thermal fluence (cal/cm²) at range R_km
// 1 kt = 1e12 cal; f_th = 0.35
function thermalFluence(yieldKt, rangeKm, transmission = 1.0) {
  const Y_cal = yieldKt * 1e12;
  const R_cm  = rangeKm * 1e5;
  return (0.35 * Y_cal) / (4 * Math.PI * R_cm * R_cm) * transmission;
}

// Thermal radius for given cal/cm² threshold (scales as Y^0.41)
// ref: 3rd degree burns at 8 cal/cm² = 0.65 km at 1 kt
function thermalRadius(yieldKt, calThreshold = 8) {
  const refs = { 3: 0.35, 5: 0.50, 8: 0.65, 12: 0.80, 45: 0.28 };
  return refs[calThreshold] * Math.pow(yieldKt, 0.41);
}

// ─── RADIATION ────────────────────────────────────────────────────────────

// Fallout dose rate at time t (hours after burst), given H+1 hr rate D1
function doseRate(D1, t) { return D1 * Math.pow(t, -1.2); }

// Accumulated dose from t1 to t2 hours
function accDose(D1, t1, t2) { return D1 * (Math.pow(t1, -0.2) - Math.pow(t2, -0.2)) / 0.2; }

// Fallout plume arrival time (minutes after surface burst)
function arrivalTime(yieldKt) { return 4 * Math.pow(yieldKt, 0.2); }

// ─── GEOMETRY ─────────────────────────────────────────────────────────────

// Haversine distance between two lat/lon points (km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, toRad = Math.PI/180;
  const dLat = (lat2-lat1)*toRad, dLon = (lon2-lon1)*toRad;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toRad)*Math.cos(lat2*toRad)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── CASUALTY MODEL ───────────────────────────────────────────────────────

// Simplified population-in-circle using city data as proxy
// For each city within blast range, apply fraction of city population:
//   fraction = 1.0 if distance < r_5psi    → count as dead
//   fraction = 0.5 if r_5psi < d < r_2psi → dead (collapse with survival)
//   fraction = 0.3 if r_2psi < d < r_1psi → injured

// ─── NUCLEAR WINTER ───────────────────────────────────────────────────────

// Soot production estimate (Tg) from urban fires
// Only count detonations within 50 km of cities with pop > 100,000
function estimateSoot(urbanYieldMt) { return 0.003 * urbanYieldMt; }
```

---

## 6. Weapons Dataset Specification

### Complete Arsenal Data — All 9 Countries

#### USA `arsenal/usa.json` (excerpt — Agent 2 writes complete file)
```json
{
  "country": "USA", "flag": "🇺🇸",
  "warheads": [
    {"id":"W87-0","name":"W87-0","yield_kt":300,"type":"thermonuclear","weight_kg":276,"description":"Minuteman III Mk21 warhead"},
    {"id":"W78","name":"W78","yield_kt":335,"type":"thermonuclear","weight_kg":272,"description":"Minuteman III Mk12A warhead (retiring)"},
    {"id":"W76-1","name":"W76-1","yield_kt":90,"type":"thermonuclear","weight_kg":164,"description":"Trident II primary warhead"},
    {"id":"W76-2","name":"W76-2","yield_kt":8,"type":"thermonuclear","weight_kg":164,"description":"Low-yield Trident warhead"},
    {"id":"W88","name":"W88","yield_kt":455,"type":"thermonuclear","weight_kg":360,"description":"Trident II Mk5 warhead, highest-yield US SLBM"},
    {"id":"B61-12","name":"B61-12","yield_kt":50,"type":"thermonuclear","weight_kg":315,"description":"Guided gravity bomb, variable yield 0.3/1.5/10/50 kt"},
    {"id":"B83-1","name":"B83-1","yield_kt":1200,"type":"thermonuclear","weight_kg":1089,"description":"Megaton gravity bomb, in reserve"}
  ],
  "delivery_systems": [
    {"id":"minuteman-iii","name":"LGM-30G Minuteman III","type":"ICBM","platform":"silo","range_km":13000,"cep_m":120,"warheads_per_missile":1,"compatible_warheads":["W87-0","W78"],"count":400,"icon":"🚀"},
    {"id":"trident-ii","name":"UGM-133A Trident II D5","type":"SLBM","platform":"submarine","range_km":11300,"cep_m":90,"warheads_per_missile":4,"compatible_warheads":["W76-1","W76-2","W88"],"count":280,"icon":"🚢"},
    {"id":"b2-spirit","name":"B-2A Spirit","type":"gravity_bomb","platform":"aircraft","range_km":11000,"cep_m":5,"warheads_per_missile":16,"compatible_warheads":["B61-12","B83-1"],"count":20,"icon":"✈"},
    {"id":"f35a","name":"F-35A Lightning II","type":"gravity_bomb","platform":"aircraft","range_km":2200,"cep_m":5,"warheads_per_missile":2,"compatible_warheads":["B61-12"],"count":100,"icon":"✈"}
  ]
}
```

#### Russia `arsenal/russia.json` — key systems:
- Minuteman-equivalent: RS-24 Yars (ICBM, 3 warheads, 100 kt each, silo+mobile, CEP 150m, range 12,000km)
- SLBM: RSM-56 Bulava (6 warheads, 100-150 kt, 8,000km range, Borei-class subs)
- Heavy ICBM: RS-20V Voevoda (10 warheads, 800 kt, silo, 11,000km range)
- New: RS-28 Sarmat (10-16 warheads, silo, 18,000km range, HGV-capable)
- Glide vehicle: Avangard (1 warhead, 800 kt – 2 Mt, RS-28/SS-19 platform)
- Tactical: 9M723 Iskander-M (nuclear-capable, 500 kt, 500km range)

#### China `arsenal/china.json`:
- DF-5B: silo ICBM, 5 Mt, 12,000km, 2 warheads
- DF-31AG: mobile ICBM, 1 warhead (est. 150-200 kt), 11,200km
- DF-41: mobile+silo ICBM, 6-10 warheads, 12,000km
- DF-26: IRBM, 1 warhead (est. 1-2 Mt), 4,000km
- JL-3: SLBM on Type-096 sub, 8 warheads, 10,000km

#### UK `arsenal/uk.json`:
- Trident II D5: SLBM, 4 Vanguard-class subs, up to 8 warheads per missile at ~100 kt, range 11,300km, CEP 90m
- Total deployed: ~120 warheads

#### France `arsenal/france.json`:
- M51.3: SLBM on Le Triomphant-class (4 SSBNs), 6 warheads at ~100 kt, range 8,000km
- ASMP-A: ALCM on Rafale/Mirage 2000N, 1 warhead ~300 kt, range 500km

#### India `arsenal/india.json`:
- Agni-V: ICBM-capable, 1 warhead (est. 500 kt), 5,000km range, 2024 MIRV test (3 warheads)
- Agni-IV: IRBM, 1 warhead, 3,500km
- K-15 Sagarika: SLBM from INS Arihant, 1 warhead, 750km

#### Pakistan `arsenal/pakistan.json`:
- Shaheen-III: MRBM, 1 warhead (est. 40 kt), 2,750km
- Babur-3: SLCM, 1 warhead, 450km
- Nasr: tactical short-range, est. 5-10 kt, 60km

#### Israel `arsenal/israel.json`:
- Jericho III: ICBM, est. 1 warhead ~1 Mt, 6,500km
- F-16I Sufa: aircraft delivery for gravity bombs

#### North Korea `arsenal/northkorea.json`:
- Hwasong-17: ICBM, est. 1 warhead ~1 Mt, 15,000km
- Hwasong-15: ICBM, 1 warhead, 13,000km
- KN-23: SRBM, 1 warhead, 60 kt est., 600km

---

## 7. Target Cities Database Spec

### `src/weapons/cities.json` — 500+ Cities

Minimum required cities (Agent 2 must include ALL of these + many more):

**Tier 1 — Capitals (195 cities):** Include ALL national capitals with lat/lon/population.

**Tier 2 — Major Cities (pop > 500k):**
Must include: New York, Los Angeles, Chicago, Houston, Phoenix, Washington DC, Moscow, St. Petersburg, Novosibirsk, Beijing, Shanghai, Guangzhou, Shenzhen, Chongqing, London, Birmingham, Paris, Marseille, Berlin, Hamburg, Munich, Tokyo, Osaka, Osaka, Nagoya, Seoul, Busan, Mumbai, Delhi, Kolkata, Bangalore, Chennai, Karachi, Lahore, Islamabad, Istanbul, Tehran, Baghdad, Cairo, Lagos, Kinshasa, Johannesburg, São Paulo, Buenos Aires, Mexico City, Toronto, Sydney, Melbourne, Jakarta, Manila, Dhaka, Hanoi, Ho Chi Minh City, Bangkok, Yangon, Kuala Lumpur, Singapore, Riyadh, Dubai, Tel Aviv, Kyiv, Warsaw, Prague, Vienna, Rome, Madrid, Barcelona, Amsterdam, Brussels, Stockholm, Oslo, Helsinki, Copenhagen, Zurich.

**Tier 3 — Military/Strategic Targets:**
US ICBM bases (F.E. Warren AFB, Malmstrom AFB, Minot AFB), Submarine bases (Bangor WA, Kings Bay GA), SAC/STRATCOM HQ (Offutt AFB), NORAD (Cheyenne Mountain), NATO HQ (Brussels), Russian ICBM fields (Kozelsk, Tatischevo, Uzhur, Dombarovsky), Russian submarine bases (Gadzhiyevo, Petropavlovsk-Kamchatsky).

### Required JSON Fields per City
```json
{
  "id": "string (snake_case, unique)",
  "name": "string",
  "country": "ISO 3166-1 alpha-2",
  "country_name": "string",
  "lat": "number (-90 to 90)",
  "lon": "number (-180 to 180)",
  "population": "number",
  "metro_population": "number (or null)",
  "is_capital": "boolean",
  "is_major_target": "boolean",
  "has_military_base": "boolean",
  "military_type": "string or null (ICBM_field|submarine_base|air_base|command)",
  "nuclear_target_priority": "1|2|3",
  "region": "string (North_America|Europe|Russia|China|South_Asia|...)"
}
```

---

## 8. UI Design Specification

### Color Palette — CSS Variables (in `style.css`)
```css
:root {
  --bg-primary:    #0a0a0f;   /* Deep space black */
  --bg-secondary:  #0f0f1a;   /* Panel background */
  --bg-glass:      rgba(15, 15, 26, 0.85);
  --accent-green:  #00FF41;   /* Phosphor green — primary accent */
  --accent-red:    #FF0040;   /* Alert red */
  --accent-amber:  #FFB800;   /* Warning amber */
  --accent-blue:   #0099FF;   /* Info blue */
  --text-primary:  #00FF41;   /* Main text = phosphor green */
  --text-secondary:#88CC88;   /* Dimmed green */
  --text-dim:      #336633;   /* Very dim green */
  --border-color:  rgba(0, 255, 65, 0.3);
  --panel-shadow:  0 0 20px rgba(0, 255, 65, 0.15);
}
```

### Typography
```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap');

body {
  font-family: 'IBM Plex Mono', 'Courier New', monospace;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-primary);
}
```

### Glassmorphism Panels
```css
.panel {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: var(--panel-shadow);
  padding: 16px;
}
```

### Scanline Overlay
```css
#scanlines-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  pointer-events: none;
  z-index: 9998;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 0, 0, 0.15) 3px,
    rgba(0, 0, 0, 0.15) 4px
  );
}
```

### Boot Screen
```css
#boot-screen {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.boot-logo {
  font-size: 48px;
  color: var(--accent-green);
  text-shadow: 0 0 30px var(--accent-green);
  margin-bottom: 20px;
}
.boot-quote {
  font-size: 18px;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 40px;
  border-left: 3px solid var(--accent-green);
  padding-left: 20px;
}
.boot-progress {
  width: 400px;
  height: 4px;
  background: #111;
  border: 1px solid var(--border-color);
}
#boot-bar {
  height: 100%;
  background: var(--accent-green);
  box-shadow: 0 0 10px var(--accent-green);
  transition: width 0.1s linear;
}
```

### Layout
```css
#top-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 50px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  z-index: 100;
}

#left-panel {
  position: fixed;
  top: 50px; left: 0; bottom: 60px;
  width: 320px;
  z-index: 100;
  overflow-y: auto;
}

#right-panel {
  position: fixed;
  top: 50px; right: 0; bottom: 60px;
  width: 280px;
  z-index: 100;
}

#timeline-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  z-index: 100;
}

#globe-canvas {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
}
```

### Nav Tabs & Buttons
```css
.nav-tab {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 11px;
  padding: 6px 14px;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.2s;
}
.nav-tab:hover, .nav-tab.active {
  background: rgba(0, 255, 65, 0.1);
  color: var(--accent-green);
  border-color: var(--accent-green);
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.3);
}

button.danger {
  border-color: var(--accent-red);
  color: var(--accent-red);
}
button.danger:hover {
  background: rgba(255, 0, 64, 0.15);
  box-shadow: 0 0 8px rgba(255, 0, 64, 0.4);
}
```

### DEFCON Indicator
```css
.nav-defcon { font-size: 16px; font-weight: 700; letter-spacing: 2px; }
/* JS adds class defcon-1 through defcon-5 */
.defcon-5 #defcon-level { color: var(--accent-green); }
.defcon-4 #defcon-level { color: #FFFF00; animation: defcon-pulse 2s infinite; }
.defcon-3 #defcon-level { color: var(--accent-amber); animation: defcon-pulse 1.5s infinite; }
.defcon-2 #defcon-level { color: #FF6600; animation: defcon-pulse 1s infinite; }
.defcon-1 #defcon-level { color: var(--accent-red); animation: defcon-pulse 0.5s infinite; }

@keyframes defcon-pulse {
  0%, 100% { text-shadow: none; }
  50% { text-shadow: 0 0 15px currentColor; }
}
```

### Required Quote Placement
The quote **"This is not a game. It's a simulation."** must appear:
1. **Boot screen** — centered, large, with glow effect (always shown at startup)
2. **Report exports** — as header line in all text/CSV exports
3. **About modal** (if implemented) — as the primary text

---

## 9. Predefined Scenarios Spec

All scenarios stored in `src/ui/scenarios/`. Each must have ≥ 20 realistic strikes to demonstrate the simulation.

### DEFCON Levels by Scenario
| Scenario | DEFCON |
|----------|--------|
| US/Russia Full Exchange | 1 |
| India/Pakistan | 2 |
| NATO vs Russia | 1 |
| China/US | 2 |
| North Korea Strike | 3 |
| UK/France vs Russia | 2 |

### Strike Timing Model
```
// ICBM: launch → target ~1800 seconds (30 min), origin = silo lat/lon
// SLBM: launch → target ~900 seconds (15 min), origin = patrol area lat/lon
// ALCM: launch → target ~3600 seconds (60 min), origin = aircraft lat/lon
// IRBM: launch → target ~600 seconds (10 min)
// SRBM: launch → target ~120 seconds (2 min)
```
Timeline simulates from first launch (T=0). Timeline Controller compresses time (configurable 1×–100×).

---

## 10. GitHub Pages Deploy Config

### `vite.config.js`
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/NuclearSim/',   // Must match GitHub repo name exactly
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        }
      }
    }
  }
});
```

### `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### `package.json` scripts section (add to existing):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

### Texture Asset Sourcing (Agent 1 responsible)
Download textures from NASA/public domain sources and place in `public/textures/`:
- Day map: https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg (resize to 4096×2048)
- Night map: https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg
- Specular: https://planetpixelemporium.com/download/download.php?earthspec1k.jpg
- Bump: https://planetpixelemporium.com/download/download.php?earthbump1k.jpg
- Clouds: https://planetpixelemporium.com/download/download.php?earthcloudmap.jpg
- Stars: https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/starmap_2020_4k.jpg

All textures are public domain (NASA) or Creative Commons.

---

## 11. Integration Checklist

### What Must Work End-to-End
- [ ] Boot screen shows quote, completes, reveals globe
- [ ] Globe spins with day/night shading, atmosphere glow, stars background
- [ ] Click globe → get lat/lon coordinate
- [ ] Load scenario → missiles fly along arcs → detonate → effects play → casualties calculated
- [ ] Stats panel updates in real-time during playback
- [ ] Timeline scrubber correctly rewinds/replays
- [ ] Export button generates downloadable CSV
- [ ] GitHub Pages URL loads without errors

### Agent Build Order
1. **Agent 1 FIRST** — engine must exist before any other agent can test
2. **Agent 2 + Agent 3 PARALLEL** — data and physics are independent
3. **Agent 4** — depends on Agent 1 (Three.js) and Agent 3 (ring radii)
4. **Agent 5 LAST** — wires everything in `main.js`

### Key Coordinate Convention
- **Globe radius = 1.0 Three.js units = 6371 km**
- All ring radii from physics must be converted: `globeUnits = km / 6371`
- Lat/lon → Vector3: use `latLonToVector3()` from `src/effects/MissileTrajectory.js`
- **Never use kilometers directly in Three.js scene coordinates**

### Three.js Version Pin
```json
"three": "^0.168.0"
```
Import OrbitControls as:
```javascript
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
```

---

*BUILD_PLAN.md — NuclearSim Architect Document*
*Generated: 2026-03-03 | Version: 1.0*
*"This is not a game. It's a simulation."*
