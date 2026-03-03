/**
 * BlastCalculator.js — Glasstone-Dolan nuclear blast physics
 *
 * All formulas from "The Effects of Nuclear Weapons" (Glasstone & Dolan, 1977)
 * Cube-root scaling law: R(Y) = R_ref * (Y / Y_ref)^(1/3)
 * Reference yield: 1 kt airburst at optimum height of burst (HOB)
 */

// Reference radii at 1 kt airburst (optimum HOB), in km
export const BLAST_REF_RADII = {
  psi_20:  0.28,   // 138 kPa — reinforced concrete leveled
  psi_10:  0.40,   // 69 kPa  — all structures collapse
  psi_5:   0.60,   // 34 kPa  — wood/masonry destroyed, >50% killed
  psi_2:   1.00,   // 14 kPa  — moderate structural damage
  psi_1:   1.70,   // 7 kPa   — light structural damage, windows out
  psi_0_5: 2.80    // 3.5 kPa — glass injury zone
};

// PSI key to numeric value mapping
const PSI_KEY_MAP = {
  20:   'psi_20',
  10:   'psi_10',
  5:    'psi_5',
  2:    'psi_2',
  1:    'psi_1',
  0.5:  'psi_0_5'
};

/**
 * Compute blast radius for a given yield and overpressure threshold.
 * Uses cube-root scaling law: R = R_ref * (Y / 1kt)^(1/3)
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {number} overpressurePsi - Overpressure threshold: 20, 10, 5, 2, 1, or 0.5
 * @returns {number} Radius in km
 */
export function blastRadius(yieldKt, overpressurePsi) {
  const key = PSI_KEY_MAP[overpressurePsi];
  if (!key) {
    throw new Error(`Unknown overpressure: ${overpressurePsi} psi. Valid values: 20, 10, 5, 2, 1, 0.5`);
  }
  const R_ref = BLAST_REF_RADII[key];
  return R_ref * Math.pow(yieldKt / 1.0, 1 / 3);
}

/**
 * Compute all blast rings for a given yield.
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @returns {{ psi_20, psi_10, psi_5, psi_2, psi_1, psi_0_5 }} Radii in km
 */
export function allBlastRings(yieldKt) {
  const cbrt = Math.pow(yieldKt / 1.0, 1 / 3);
  return {
    psi_20:  BLAST_REF_RADII.psi_20  * cbrt,
    psi_10:  BLAST_REF_RADII.psi_10  * cbrt,
    psi_5:   BLAST_REF_RADII.psi_5   * cbrt,
    psi_2:   BLAST_REF_RADII.psi_2   * cbrt,
    psi_1:   BLAST_REF_RADII.psi_1   * cbrt,
    psi_0_5: BLAST_REF_RADII.psi_0_5 * cbrt
  };
}

/**
 * Optimal burst height (HOB) for maximum ground-level radius at a given overpressure.
 * Formula: HOB = C * Y^(1/3), where C is overpressure-dependent constant.
 *
 * C values (Glasstone-Dolan Table 3.68):
 *   psi_5  → C = 0.45
 *   psi_10 → C = 0.28
 *   psi_20 → C = 0.18
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {number} targetPsi - Overpressure of interest (5, 10, or 20)
 * @returns {number} Optimal HOB in km
 */
export function optimalBurstHeight(yieldKt, targetPsi = 5) {
  const C_MAP = {
    5:  0.45,
    10: 0.28,
    20: 0.18
  };
  const C = C_MAP[targetPsi] ?? 0.45;
  return C * Math.pow(yieldKt, 1 / 3);
}

/**
 * Maximum fireball radius (maximum extent of luminous fireball).
 * Scales as Y^0.4 (area-limited rather than cube-root for smaller yields).
 *
 * References:
 *   Airburst: R_fb = 0.07 * Y^0.4  (km)
 *   Surface:  R_fb = 0.05 * Y^0.4  (km)
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {boolean} surface - True for surface burst, false for airburst
 * @returns {number} Fireball radius in km
 */
export function fireballRadius(yieldKt, surface = false) {
  return (surface ? 0.05 : 0.07) * Math.pow(yieldKt, 0.4);
}

/**
 * Apparent crater radius for a surface burst in dry soil.
 * Formula: R_crater = 0.0389 * Y^(1/3.4)  (km)
 *
 * Source: Glasstone-Dolan, equation for apparent crater radius.
 * Exponent 1/3.4 ≈ 0.294 accounts for soil coupling efficiency.
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @returns {number} Apparent crater radius in km
 */
export function craterRadius(yieldKt) {
  return 0.0389 * Math.pow(yieldKt, 1 / 3.4);
}
