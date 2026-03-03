/**
 * RadiationCalculator.js — Nuclear radiation physics
 *
 * Two radiation regimes:
 *   1. Prompt radiation (neutrons + initial gamma) — only significant < 50 kt
 *   2. Fallout dose-rate (delayed gamma from fission products)
 *
 * Fallout model: "7-10 rule" / Wayne/Miller SFSS
 *   For every 7-fold increase in time after burst, dose rate decreases by 10x
 *   Exact: D(t) = D_1hr * t^(-1.2)
 *
 * References:
 *   - Glasstone & Dolan (1977), Chapters 8 & 9
 *   - Miller, "Fallout and Radiological Countermeasures", DASA 1922
 */

// Dose rate contour thresholds at H+1 hour (rad/hr)
export const FALLOUT_CONTOURS = {
  lethal_immediate: 1000,    // >1000 rad/hr — fatal within hours
  lethal_exposure:   100,    // >100 rad/hr  — lethal with extended exposure (48-72h)
  hazardous:          10,    // >10 rad/hr   — significant hazard (evacuate)
  detectable:          1     // >1 rad/hr    — measurable hazard (shelter in place)
};

// Prompt radiation parameters (neutron + initial gamma combined)
// D0 = dose at 1 km for 1 kt (rem); lambda = mean free path in air (km)
const PROMPT_D0_REM_PER_KT = 1e6;   // ~1 Mrem at 1 km for 1 kt (unshielded)
const PROMPT_LAMBDA_KM     = 0.30;  // effective attenuation length in air

/**
 * Prompt radiation radius for a given lethal dose threshold.
 * Only meaningful for yields < 50 kt; larger weapons are blast-limited.
 *
 * Dose model (1/r² geometric + exponential air attenuation):
 *   D(R) = D0 * (Y/1kt) * exp(-R / lambda) / R²
 *
 * Solve numerically for R where D(R) = doseSv:
 *   - Convert doseSv to rad (1 Sv ≈ 100 rad for gamma)
 *   - Binary search over plausible range
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {number} doseSv - Dose threshold in Sievert (5 Sv = likely lethal LD50)
 * @returns {number} Radius in km (0 if beyond practical range or yield > 50 kt)
 */
export function promptRadiationRadius(yieldKt, doseSv = 5) {
  // Prompt radiation is negligible vs blast for large yields
  if (yieldKt > 50) return 0;

  const doseRad = doseSv * 100;  // 1 Sv = 100 rad for gamma/neutron

  // Dose at radius R (km): D(R) = D0 * Y * exp(-R/lambda) / R²
  const dose = (R) => PROMPT_D0_REM_PER_KT * yieldKt * Math.exp(-R / PROMPT_LAMBDA_KM) / (R * R);

  // Find radius where dose equals threshold via binary search
  let lo = 0.01, hi = 10.0;

  // If even at 10 km dose is still above threshold, something's off; clamp
  if (dose(hi) >= doseRad) return hi;
  // If at minimum range dose is below threshold, weapon is too small
  if (dose(lo) < doseRad) return 0;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (dose(mid) > doseRad) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Time for fallout to arrive at ground zero vicinity.
 * Approximation for calm-wind conditions (surface burst).
 *
 * Formula: t_arrival = 4 * Y^0.2  (minutes after burst)
 * Source: Miller SFSS simplified arrival model
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @returns {number} Arrival time in minutes after burst
 */
export function falloutArrivalTime(yieldKt) {
  return 4 * Math.pow(yieldKt, 0.2);
}

/**
 * Dose rate at time t after burst (H+1 hr normalized model).
 *
 * Formula: D(t) = D_1hr * t^(-1.2)
 * The -1.2 exponent is the empirical Wayne-Crocker "7-10 rule" fit.
 *
 * @param {number} D_1hr - Dose rate at H+1 hour in rad/hr
 * @param {number} t_hours - Time after burst in hours (must be >= 1)
 * @returns {number} Dose rate in rad/hr
 */
export function doseRateAtTime(D_1hr, t_hours) {
  if (t_hours <= 0) return Infinity;
  // Model is valid from H+1; for t < 1 clamp to t=1 as conservative estimate
  const t = Math.max(t_hours, 1.0);
  return D_1hr * Math.pow(t, -1.2);
}

/**
 * Total accumulated radiation dose from t1 to t2.
 *
 * Integral of D_1hr * t^(-1.2) dt from t1 to t2:
 *   = D_1hr * [t^(-0.2) / -0.2] from t1 to t2
 *   = D_1hr * (t1^(-0.2) - t2^(-0.2)) / 0.2
 *
 * @param {number} D_1hr - Dose rate at H+1 in rad/hr
 * @param {number} t1_hours - Start time in hours (must be >= 1)
 * @param {number} t2_hours - End time in hours (must be > t1)
 * @returns {number} Accumulated dose in rad
 */
export function accumulatedDose(D_1hr, t1_hours, t2_hours) {
  const t1 = Math.max(t1_hours, 1.0);
  const t2 = Math.max(t2_hours, t1 + 0.001);
  return D_1hr * (Math.pow(t1, -0.2) - Math.pow(t2, -0.2)) / 0.2;
}
