/**
 * ThermalCalculator.js — Nuclear thermal radiation physics
 *
 * Thermal radiation scales differently from blast: ranges scale as Y^0.41
 * (area effect — thermal fluence spreads over 4πr² sphere) rather than cube-root.
 *
 * References: Glasstone-Dolan (1977) Chapter 7; NUKEMAP methodology
 *
 * 1 kt thermal yield ≈ 0.35 * 1e12 cal (35% of total energy as thermal)
 * Atmospheric transmission reduces fluence in haze/fog conditions.
 */

// Reference thermal radii at 1 kt airburst (clear day), in km
// Scaled from Glasstone-Dolan Table 7.86 (optimum HOB, visibility 20+ km)
export const THERMAL_REF_RADII_1KT = {
  cal_3:  0.35,    // 3 cal/cm²  — 1st degree burns (threshold)
  cal_5:  0.50,    // 5 cal/cm²  — 2nd degree burns (significant injury)
  cal_8:  0.65,    // 8 cal/cm²  — 3rd degree burns (primary kill zone)
  cal_12: 0.80,    // 12 cal/cm² — 3rd degree burns worst case
  cal_45: 0.28     // 45 cal/cm² — wood charring / fabric ignition threshold
};

// Atmospheric transmission factors (multiplier on fluence)
const TRANSMISSION = {
  clear:  1.0,
  hazy:   0.7,
  overcast: 0.3
};

/**
 * Thermal radius for a given fluence threshold.
 * Scales as Y^0.41 (not cube-root — thermal is an area effect).
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {number} calPerCmSq - Fluence threshold in cal/cm²: 3, 5, 8, 12, or 45
 * @param {boolean} clearDay - True for clear atmosphere (default), false reduces range
 * @returns {number} Radius in km
 */
export function thermalRadius(yieldKt, calPerCmSq, clearDay = true) {
  const key = `cal_${calPerCmSq}`;
  const R_ref = THERMAL_REF_RADII_1KT[key];
  if (R_ref === undefined) {
    throw new Error(`Unknown thermal threshold: ${calPerCmSq} cal/cm². Valid: 3, 5, 8, 12, 45`);
  }
  // Scale factor: Y^0.41 for 1 kt reference
  const scaleFactor = Math.pow(yieldKt / 1.0, 0.41);
  // Atmospheric correction: hazy conditions reduce range by ~sqrt(transmission)
  const atmFactor = clearDay ? 1.0 : Math.sqrt(TRANSMISSION.hazy);
  return R_ref * scaleFactor * atmFactor;
}

/**
 * Thermal fluence at a given range from ground zero.
 *
 * Formula: Q = (eta * Y_cal) / (4 * PI * R_cm^2) * T_atm
 * where:
 *   eta = 0.35  (fraction of weapon yield emitted as thermal)
 *   Y_cal = yieldKt * 1e12 cal  (1 kt = 1e12 cal total energy)
 *   R_cm = rangeKm * 1e5        (convert km to cm)
 *   T_atm = atmospheric transmission factor
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {number} rangeKm - Distance from ground zero in km
 * @param {number} atmosphericTransmission - Fraction of thermal reaching target (0-1)
 * @returns {number} Thermal fluence in cal/cm²
 */
export function thermalFluence(yieldKt, rangeKm, atmosphericTransmission = 1.0) {
  if (rangeKm <= 0) return Infinity;
  const eta = 0.35;                     // thermal fraction
  const Y_cal = yieldKt * 1e12;         // total energy in calories
  const R_cm = rangeKm * 1e5;           // range in centimetres
  return (eta * Y_cal) / (4 * Math.PI * R_cm * R_cm) * atmosphericTransmission;
}

/**
 * Compute all standard thermal burn-zone radii for a given yield.
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {boolean} clearDay - Atmospheric clarity flag
 * @returns {{ cal_3, cal_5, cal_8, cal_12 }} Radii in km
 */
export function allThermalRings(yieldKt, clearDay = true) {
  const scaleFactor = Math.pow(yieldKt / 1.0, 0.41);
  const atmFactor = clearDay ? 1.0 : Math.sqrt(TRANSMISSION.hazy);
  const s = scaleFactor * atmFactor;
  return {
    cal_3:  THERMAL_REF_RADII_1KT.cal_3  * s,
    cal_5:  THERMAL_REF_RADII_1KT.cal_5  * s,
    cal_8:  THERMAL_REF_RADII_1KT.cal_8  * s,
    cal_12: THERMAL_REF_RADII_1KT.cal_12 * s
  };
}
