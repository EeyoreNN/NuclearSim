/**
 * FalloutPlume.js — Fallout plume geometry and dose contour calculation
 *
 * Based on Miller's Simplified Fallout Scaling System (SFSS) and
 * the Department of Defense/DTRA HPAC model simplified to first-order
 * elliptical plume geometry for simulation purposes.
 *
 * Plume ellipse model (Miller SFSS):
 *   downwind length L = 150 * Y^0.4 / v_wind  (km; wind in m/s)
 *   crosswind width  W = 20  * Y^0.3           (km)
 *
 * Dose rate at H+1 hr at any point (r, theta) inside plume:
 *   D_1hr(x) = D_max * exp(-distance_from_axis / decay_factor)
 *
 * Contour ellipse dimensions scale with dose ratio relative to max.
 *
 * References:
 *   - Miller, "Fallout and Radiological Countermeasures", DASA 1922 (1963)
 *   - FEMA, "Handbook of Nuclear Weapon Effects" (1999)
 *   - Glasstone-Dolan Chapter 9
 */

import { FALLOUT_CONTOURS } from './RadiationCalculator.js';

// Reference peak dose rate at H+1 hr at 1 km downwind for 1 kt surface burst (rad/hr)
// Derived from DASA empirical data for 50% fission fraction
const PEAK_DOSE_1KT_AT_1KM = 3000;  // rad/hr

// Earth radius in km (for lat/lon offset calculations)
const EARTH_RADIUS_KM = 6371;

/**
 * FalloutPlume — computes fallout plume geometry and dose contours
 * for a surface burst (airburst produces negligible fallout).
 *
 * @param {number} yieldKt - Weapon yield in kilotons
 * @param {number} fissionFraction - Fraction of yield from fission (0-1); default 0.5
 */
export class FalloutPlume {
  constructor(yieldKt, fissionFraction = 0.5) {
    this.yieldKt = yieldKt;
    this.fissionFraction = fissionFraction;

    // Effective fission yield for fallout production
    this._fissionYieldKt = yieldKt * fissionFraction;
  }

  /**
   * Compute the plume ellipse geometry and dose contour lines.
   *
   * The plume center is offset downwind from ground zero.
   * Wind direction (meteorological convention): degrees FROM which wind blows.
   * Plume extends in the direction the wind is blowing TO.
   *
   * @param {number} groundZeroLat - Burst latitude in degrees
   * @param {number} groundZeroLon - Burst longitude in degrees
   * @param {number} windSpeedMs - Wind speed in m/s (typically 3-15)
   * @param {number} windDirDeg - Wind direction in degrees (0=N, 90=E, 180=S, 270=W)
   *                              Meteorological convention: direction wind comes FROM.
   * @returns {Object} Plume geometry and contour data
   */
  getPlumeEllipse(groundZeroLat, groundZeroLon, windSpeedMs, windDirDeg) {
    const Y = this._fissionYieldKt;
    const v = Math.max(windSpeedMs, 0.5);  // minimum wind to avoid division by zero

    // Miller SFSS plume dimensions
    const semiMajorKm = (150 * Math.pow(Y, 0.4) / v) / 2;   // half-length downwind
    const semiMinorKm = (20  * Math.pow(Y, 0.3))        / 2; // half-width crosswind

    // Peak dose rate at H+1 hr (scales with fission yield)
    const D_max_1hr = PEAK_DOSE_1KT_AT_1KM * Math.pow(Y, 0.4);

    // Direction wind blows TO (plume extends downwind)
    // Met convention: windDirDeg is direction wind comes FROM
    const downwindDeg = (windDirDeg + 180) % 360;
    const downwindRad = downwindDeg * Math.PI / 180;

    // Center of plume ellipse is at semiMajor distance downwind from GZ
    const centerOffsetKm = semiMajorKm;
    const dLat = (centerOffsetKm * Math.cos(downwindRad)) / EARTH_RADIUS_KM * (180 / Math.PI);
    const dLon = (centerOffsetKm * Math.sin(downwindRad)) /
                 (EARTH_RADIUS_KM * Math.cos(groundZeroLat * Math.PI / 180)) * (180 / Math.PI);

    const centerLat = groundZeroLat + dLat;
    const centerLon = groundZeroLon + dLon;

    // Build dose contours — each contour is a sub-ellipse scaled by dose ratio
    // Dose falls off exponentially along the major axis; contour at D_threshold:
    //   ratio = D_threshold / D_max_1hr
    //   Linear dimension scale ~ sqrt(ratio) (for Gaussian-like radial falloff)
    const contours = Object.entries(FALLOUT_CONTOURS)
      .map(([label, doseThreshold]) => {
        if (D_max_1hr < doseThreshold) return null;
        const ratio = Math.sqrt(doseThreshold / D_max_1hr);
        // Contour ellipse is smaller than full plume (higher dose = closer to stem)
        // Scale inversely: high-dose contours are near the GZ-end of plume
        const contourMajor = semiMajorKm * (1 - ratio);
        const contourMinor = semiMinorKm * (1 - ratio * 0.5);
        return {
          label,
          doseRate: doseThreshold,
          semiMajorKm: Math.max(contourMajor, 0.1),
          semiMinorKm: Math.max(contourMinor, 0.05)
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.doseRate - a.doseRate);  // highest dose first

    return {
      groundZeroLat,
      groundZeroLon,
      centerLat,
      centerLon,
      semiMajorKm,
      semiMinorKm,
      rotationDeg: downwindDeg,   // ellipse major axis points downwind
      windSpeedMs: v,
      windDirDeg,
      D_max_1hr,
      contours
    };
  }

  /**
   * Estimate dose rate at a specific lat/lon point (H+1 hr).
   *
   * Uses elliptical distance from plume center to determine dose.
   * Points outside the outer plume ellipse receive dose < 1 rad/hr.
   *
   * @param {number} lat - Query latitude
   * @param {number} lon - Query longitude
   * @param {Object} plumeData - Result from getPlumeEllipse()
   * @returns {number} Dose rate in rad/hr at H+1
   */
  getDoseRateAt(lat, lon, plumeData) {
    const { centerLat, centerLon, semiMajorKm, semiMinorKm, rotationDeg, D_max_1hr } = plumeData;

    // Convert to km offset from plume center
    const dLatKm = (lat - centerLat) * (Math.PI / 180) * EARTH_RADIUS_KM;
    const dLonKm = (lon - centerLon) * (Math.PI / 180) *
                   EARTH_RADIUS_KM * Math.cos(centerLat * Math.PI / 180);

    // Rotate into plume coordinate frame
    const rotRad = rotationDeg * Math.PI / 180;
    const x =  dLonKm * Math.cos(rotRad) + dLatKm * Math.sin(rotRad);
    const y = -dLonKm * Math.sin(rotRad) + dLatKm * Math.cos(rotRad);

    // Normalized elliptical distance (1.0 = on plume boundary)
    const ellipDist = Math.sqrt((x / semiMajorKm) ** 2 + (y / semiMinorKm) ** 2);

    if (ellipDist > 1.0) return 0;

    // Gaussian-like dose decay from plume center
    return D_max_1hr * Math.exp(-3 * ellipDist * ellipDist);
  }
}
