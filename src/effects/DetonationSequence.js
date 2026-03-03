/**
 * DetonationSequence.js — Orchestrates all visual + audio effects for a detonation.
 *
 * Timed sequence (from BUILD_PLAN.md):
 *   t =   0 ms  ThermalFlash.trigger()  +  ShockwaveRing.spawn()
 *   t = 200 ms  MushroomCloud.detonate()
 *   t = 500 ms  BlastRingOverlay.addRings()
 *   t = 600 ms  Play detonation.mp3
 *
 * Intensity is log-scaled so small yields flash faintly and 1 Mt flashes fully:
 *   intensity = clamp( log10(yieldKt) / 4 , 0, 1 )
 *   → 1 kt ≈ 0.00, 10 kt ≈ 0.25, 100 kt ≈ 0.50, 1 000 kt ≈ 0.75, 10 000 kt = 1.0
 *
 * Dependencies are injected via constructor so each can be mocked in tests.
 */

const EARTH_RADIUS_KM = 6371;

// Tiny helper — resolves after `ms` milliseconds
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Try to play the detonation sound; silently swallow autoplay-policy errors.
function playDetonationSound() {
  try {
    // BASE_URL is set by Vite from vite.config.js (e.g. '/NuclearSim/')
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    const src  = base.replace(/\/$/, '') + '/sounds/detonation.mp3';
    const audio = new Audio(src);
    audio.volume = 0.65;
    audio.play().catch(() => { /* autoplay blocked — ignore */ });
  } catch {
    // Audio API not available (e.g. server-side or test env)
  }
}

export class DetonationSequence {
  /**
   * @param {import('./ThermalFlash.js').ThermalFlash}         thermalFlash
   * @param {import('./ShockwaveRing.js').ShockwaveRing}       shockwaveRing
   * @param {import('./MushroomCloud.js').MushroomCloud}       mushroomCloud
   * @param {import('./BlastRingOverlay.js').BlastRingOverlay} blastRingOverlay
   */
  constructor(thermalFlash, shockwaveRing, mushroomCloud, blastRingOverlay) {
    this._flash    = thermalFlash;
    this._shockwave = shockwaveRing;
    this._cloud    = mushroomCloud;
    this._overlay  = blastRingOverlay;
  }

  /**
   * Run the full detonation sequence at (lat, lon).
   *
   * @param {number} lat
   * @param {number} lon
   * @param {number} yieldKt
   * @param {object} blastRings   — { psi_20, psi_10, psi_5, psi_2, psi_1, psi_0_5 } in km
   *   (from physics/BlastCalculator.allBlastRings)
   * @param {object} thermalRings — { cal_3, cal_5, cal_8 } in km
   *   (from physics/ThermalCalculator.allThermalRings)
   * @returns {Promise<number>} overlayId — pass to BlastRingOverlay.removeRings() to clear rings
   */
  async detonate(lat, lon, yieldKt, blastRings, thermalRings) {
    // Log-scaled intensity: 0 at 1kt, 1.0 at 10000kt
    const intensity = Math.min(1.0, Math.log10(Math.max(1, yieldKt)) / 4);

    // ── t = 0 ms: flash + shockwave ─────────────────────────────────────────
    this._flash.trigger(intensity, 400);

    // Shockwave max radius = psi_0_5 ring converted to globe units
    const psi_0_5_km  = blastRings?.psi_0_5 ?? 1.0;
    const maxRadUnits = psi_0_5_km / EARTH_RADIUS_KM;
    this._shockwave.spawn(lat, lon, maxRadUnits, 3000);

    // ── t = 200 ms: mushroom cloud ───────────────────────────────────────────
    await delay(200);
    this._cloud.detonate(lat, lon, yieldKt);

    // ── t = 500 ms: persistent blast / thermal ring overlays ─────────────────
    await delay(300);
    const overlayId = this._overlay.addRings(lat, lon, blastRings, thermalRings);

    // ── t = 600 ms: audio ────────────────────────────────────────────────────
    await delay(100);
    playDetonationSound();

    return overlayId;
  }
}
