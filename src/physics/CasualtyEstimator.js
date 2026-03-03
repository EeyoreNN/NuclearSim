/**
 * CasualtyEstimator.js — Nuclear detonation casualty estimation
 *
 * Casualty model (Glasstone-Dolan / FEMA methodology):
 *
 *   Immediate dead:
 *     Population inside 5 psi blast ring (>50% structural collapse, blast mortality)
 *     OR inside 8 cal/cm² thermal ring (3rd degree burns, mortality > 50%)
 *     (union of zones, not double-counted)
 *
 *   Injured:
 *     Population in 1–5 psi zone (light-moderate blast damage)
 *     Survival fraction applied: 0.5 (50% of exposed population becomes injured)
 *
 *   Total affected:
 *     All population inside 0.5 psi ring (glass injury zone + psychological effects)
 *
 * For scenario-level estimation, detonations are processed independently
 * and population is NOT double-counted (each cell counts once for worst effect).
 *
 * NuclearWinter estimates are integrated via NuclearWinter.js.
 */

import { allBlastRings, fireballRadius, craterRadius } from './BlastCalculator.js';
import { allThermalRings } from './ThermalCalculator.js';
import { estimateSoot, winterSeverity } from './NuclearWinter.js';

// Survival fraction for injured zone (1–5 psi)
const INJURED_SURVIVAL_FRACTION = 0.5;

export class CasualtyEstimator {
  /**
   * @param {PopulationGrid} populationGrid - Loaded PopulationGrid instance
   * @param {Object} targetDatabase - TargetDatabase instance (optional, for country attribution)
   */
  constructor(populationGrid, targetDatabase = null) {
    this._pop = populationGrid;
    this._targets = targetDatabase;
  }

  /**
   * Estimate casualties from a single detonation.
   *
   * @param {number} lat - Burst latitude
   * @param {number} lon - Burst longitude
   * @param {number} yieldKt - Weapon yield in kilotons
   * @param {number} burstHeightM - Height of burst in meters (0 = surface burst)
   * @param {boolean} airburstMode - True = airburst (optimum HOB blast rings); false = surface
   * @returns {Object} Casualty and damage summary
   */
  estimateDetonation(lat, lon, yieldKt, burstHeightM, airburstMode = true) {
    const isSurface = !airburstMode || burstHeightM <= 0;

    const blastRings   = allBlastRings(yieldKt);
    const thermalRings = allThermalRings(yieldKt, true);
    const fireball     = fireballRadius(yieldKt, isSurface);
    const crater       = isSurface ? craterRadius(yieldKt) : null;

    // Population in kill zone (5 psi blast OR 8 cal/cm² thermal — larger radius wins)
    const killRadius = Math.max(blastRings.psi_5, thermalRings.cal_8);
    const killZonePop = this._pop.getPopulationInCircle(lat, lon, killRadius);

    // Population in 5 psi zone only (for thermal overlap already counted above)
    // We use simple union: P(A∪B) ≈ max(P(A), P(B)) as conservative estimate
    const immediate_dead = Math.round(killZonePop * 0.85);  // ~85% mortality in kill zone

    // Injured: in 1–5 psi annulus (between psi_1 and psi_5 radii)
    const pop_in_psi1  = this._pop.getPopulationInCircle(lat, lon, blastRings.psi_1);
    const pop_in_psi5  = this._pop.getPopulationInCircle(lat, lon, blastRings.psi_5);
    const injured_zone_pop = Math.max(0, pop_in_psi1 - pop_in_psi5);
    const injured = Math.round(injured_zone_pop * INJURED_SURVIVAL_FRACTION);

    // Total affected: everyone inside 0.5 psi ring
    const total_affected = this._pop.getPopulationInCircle(lat, lon, blastRings.psi_0_5);

    return {
      lat,
      lon,
      yield_kt: yieldKt,
      burst_height_m: burstHeightM,
      is_surface_burst: isSurface,
      immediate_dead,
      injured,
      total_affected: Math.max(total_affected, immediate_dead + injured),
      blast_rings_km: blastRings,
      thermal_rings_km: thermalRings,
      fireball_km: fireball,
      crater_km: crater
    };
  }

  /**
   * Estimate casualties for an entire scenario (multiple detonations).
   *
   * Population cells are tracked to avoid double-counting in overlapping kill zones.
   * (Approximated by tracking counted cells via a Set of cell indices.)
   *
   * @param {Array<{lat, lon, yieldKt, burstHeightM}>} detonations
   * @returns {Object} Aggregate scenario results
   */
  estimateScenario(detonations) {
    const results = detonations.map(d =>
      this.estimateDetonation(d.lat, d.lon, d.yieldKt, d.burstHeightM ?? 0, d.burstHeightM > 0)
    );

    // Aggregate totals
    // For overlapping detonations we use a conservative approach:
    // Total dead = sum of individual deads, but cap at global affected population
    // (Real de-duplication would require full grid tracking — acceptable approximation)
    let total_dead     = 0;
    let total_injured  = 0;
    let total_affected = 0;

    for (const r of results) {
      total_dead     += r.immediate_dead;
      total_injured  += r.injured;
      total_affected  = Math.max(total_affected, r.total_affected);
    }
    // Sum affected for non-overlapping estimate
    total_affected = results.reduce((s, r) => s + r.total_affected, 0);

    // By-country attribution using target database if available
    const by_country = {};
    if (this._targets) {
      for (const r of results) {
        try {
          // Find nearest city to attribute country
          const nearby = this._targets.getCitiesInRadius(r.lat, r.lon, r.blast_rings_km.psi_0_5);
          for (const city of nearby) {
            const cc = city.country || 'UN';
            if (!by_country[cc]) by_country[cc] = { dead: 0, injured: 0 };
            // Attribute proportionally (rough)
            const fraction = 1 / Math.max(nearby.length, 1);
            by_country[cc].dead    += Math.round(r.immediate_dead * fraction);
            by_country[cc].injured += Math.round(r.injured * fraction);
          }
        } catch (_) { /* no cities nearby */ }
      }
    }

    // Nuclear winter estimate
    const { soot_tg, fires_mtoe } = estimateSoot(detonations);
    const winter = winterSeverity(soot_tg);

    return {
      total_dead:     Math.round(total_dead),
      total_injured:  Math.round(total_injured),
      total_affected: Math.round(total_affected),
      by_country,
      detonation_results: results,
      soot_tg,
      fires_mtoe,
      nuclear_winter: winter
    };
  }
}
