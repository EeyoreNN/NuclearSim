# ☢ NuclearSim — Strategic Nuclear Exchange Simulator

> **"This is not a game. It's a simulation."**
> — Principal Horizon

NuclearSim is a browser-based, 3D interactive nuclear war simulation built with **Three.js** and **Vite**. It visualizes realistic nuclear weapons effects, casualty estimates, and predefined strategic exchange scenarios on an interactive 3D Earth globe.

---

## Screenshots

| Boot Screen | Globe with Targets | Detonation Effects |
|:-----------:|:------------------:|:-----------------:|
| Animated terminal boot sequence with classified styling | Interactive globe with city markers and target placement | Mushroom clouds, shockwaves, blast rings, and fallout plumes |

---

## Features

### 🌍 3D Earth Globe
- High-resolution day/night Earth textures with seamless day-night blend shader
- Atmosphere glow using custom GLSL rim-lighting shader
- Rotating cloud layer
- 8,000-star procedurally generated starfield
- Smooth OrbitControls with damping (drag, zoom, pan)

### ☢ Real-World Arsenal Data
Nine nuclear states with authentic weapon system data:
- **USA** — Minuteman III, Trident II D5, B61-12, B83, AGM-86B ALCM
- **Russia** — RS-28 Sarmat, R-36M2 Voevoda, RS-24 Yars, R-30 Bulava, Kinzhal, Iskander-M
- **China** — DF-5B, DF-41, DF-31AG, JL-2, DF-26, DF-21D
- **UK** — Trident II D5 (W76-1)
- **France** — M51.2 SLBM, ASMP-A cruise missile
- **India** — Agni-V, Agni-III, K-4 SLBM
- **Pakistan** — Shaheen-III, Shaheen-II, Babur cruise missile, Nasr tactical
- **Israel** — Jericho III, Jericho II, Popeye Turbo (suspected)
- **North Korea** — Hwasong-17, Hwasong-15, Hwasong-12, KN-23, Pukguksong-2

Each weapon includes: yield (kt), MIRV count, range, CEP, deployed inventory, and year.

### 🎯 Target Placement
- Click anywhere on the globe to place a target
- Automatic snap-to-nearest city (within 5° radius)
- 500+ world cities pre-loaded with population data and strategic importance ratings
- Per-target weapon assignment
- AI auto-targeting mode

### 💥 Detonation Physics (Glasstone & Dolan)
Using the standard cube-root scaling law from "The Effects of Nuclear Weapons" (1977):

| Zone | Overpressure | Effect |
|------|-------------|--------|
| Heavy Blast | 20 psi | Near-total destruction |
| Moderate Blast | 5 psi | Severe structural damage |
| Light Blast | 1 psi | Windows broken, minor damage |
| Thermal | — | 3rd-degree burns radius |
| Fallout | — | Wind-driven ellipse (ground burst only) |

- Airburst vs. ground burst toggle (affects fallout and blast radius)
- Casualty estimation using multi-city population overlap model
- Nuclear winter soot estimate (Robock et al. 2007)

### 🔥 Visual Effects
- **Mushroom cloud**: Procedural particle system with 2,000 particles, custom GLSL shader with fire gradient, turbulence noise, and animated rise
- **Shockwave ring**: Expanding circle on globe surface with fade
- **Blast rings**: Color-coded overpressure zone circles on globe surface
- **Fireball**: Glowing sphere at ground zero
- **Fallout plume**: Wind-directed ellipse (ground burst)
- **Flash effect**: Full-screen white flash at detonation moment
- Supports **simultaneous multiple detonations**

### 📋 Predefined Scenarios
1. **US–Russia Full Exchange** — 28 events, ~4,000 MT total yield
2. **India–Pakistan Nuclear War** — 20 events, ~50 MT (nuclear winter trigger)
3. **NATO vs Russia** — 16 events, escalation from theater to strategic
4. **China–Taiwan / US Conflict** — 14 events, Pacific theater focus
5. **North Korea vs South Korea/US** — 10 events, regional exchange
6. **Global Zero** — Visualization only, no detonations

Adjustable playback speed (0.5×–4×).

### 📊 Real-Time Damage Assessment
- Immediate deaths
- Radiation deaths
- Total yield (MT)
- Affected area (km²)
- Nuclear winter soot estimate (Tg) with severity rating
- Per-detonation breakdown in scrollable log

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run
```bash
git clone https://github.com/EeyoreNN/NuclearSim
cd NuclearSim
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Build for Production
```bash
npm run build
```
Output is in `dist/` — deploy to Vercel, Netlify, or GitHub Pages.

### Deploy to GitHub Pages
```bash
# In vite.config.js, set base to '/NuclearSim/'
npm run build
# Push dist/ to gh-pages branch
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| 3D Engine | [Three.js](https://threejs.org/) r170 |
| Bundler | [Vite](https://vitejs.dev/) |
| Language | Vanilla JavaScript (ES Modules) |
| Fonts | IBM Plex Mono (Google Fonts) |
| Textures | NASA Blue Marble / three-globe CDN |
| Shaders | Custom GLSL (atmosphere, earth day/night, mushroom cloud) |

---

## Project Structure

```
NuclearSim/
├── index.html              # Main HTML with UI structure
├── vite.config.js          # Vite build configuration
├── src/
│   ├── main.js             # App entry point and orchestration
│   ├── styles/
│   │   └── main.css        # Dark military UI stylesheet
│   ├── globe/
│   │   └── Globe.js        # 3D Earth with shaders, clouds, stars
│   ├── data/
│   │   ├── arsenal.js      # Nuclear weapon data (9 nations, 42 systems)
│   │   ├── cities.js       # 500+ city coordinates and population
│   │   └── scenarios.js    # 6 predefined scenarios
│   ├── simulation/
│   │   ├── BlastPhysics.js # Weapons effects calculations
│   │   ├── TargetManager.js # Target placement and detonation
│   │   └── ScenarioPlayer.js # Scenario playback
│   ├── effects/
│   │   └── DetonationEffect.js # All visual effects
│   └── ui/
│       ├── UIManager.js    # UI coordination and state
│       └── BootScreen.js   # Animated boot sequence
└── public/
    └── textures/           # (Optional) local texture files
```

---

## Data Sources

- **Weapon data**: Federation of American Scientists (FAS) Nuclear Notebook, SIPRI Yearbook, Arms Control Association
- **Blast physics**: Glasstone & Dolan, *The Effects of Nuclear Weapons* (3rd ed., 1977)
- **Casualty model**: NUKEMAP methodology (Alex Wellerstein, Stevens Institute of Technology)
- **Nuclear winter**: Robock et al., *Nuclear winter revisited* (2007)
- **City data**: UN World Urbanization Prospects, Wikipedia

---

## Disclaimer

This simulation is provided **strictly for educational, policy research, and awareness purposes**. Nuclear weapons cause catastrophic, indiscriminate humanitarian harm. The simulation is intended to help people understand the scale and consequences of nuclear weapons use.

No operational or classified data is used. All weapon specifications are from publicly available sources. The simulation is not designed to assist in any planning or targeting.

> *"A nuclear exchange would be a catastrophe of unimaginable proportions. The only rational policy is prevention."*

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

*Built with Three.js. Inspired by [Nuclear War Simulator](https://store.steampowered.com/app/1603940/Nuclear_War_Simulator/) by UndercoverDevs.*
