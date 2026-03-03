/**
 * NuclearWinter.js — Soot production and nuclear winter severity estimation
 *
 * Based on Turco et al. (1983) "TTAPS" model and subsequent refinements
 * by Robock, Toon et al. for modern nuclear winter research.
 *
 * Key assumptions:
 *   - Urban/industrial fires are the primary soot source
 *   - Soot production ≈ 0.003 Tg per Mt of yield over urban areas
 *     (Toon et al. 2008, "Atmospheric effects and societal consequences of
 *      regional scale nuclear conflicts and acts of individual nuclear terrorism")
 *   - Only surface bursts and low airbursts over cities produce significant smoke
 *   - Military/remote targets produce much less soot (no urban fuel load)
 *
 * Nuclear winter thresholds (Robock et al. 2007):
 *   < 1 Tg soot:  negligible global effects
 *   1–5 Tg soot:  regional climate disruption (crop failures in some regions)
 *   5–50 Tg soot: full nuclear winter (global temperature drop 1–8°C, years)
 *   > 50 Tg soot: "nuclear autumn" transitions to severe nuclear winter
 *
 * Fire energy conversion:
 *   Fires produce ~10 GJ/tonne of urban fuel (Penner et al.)
 *   1 Mt yield can ignite fires over ~1,000 km² urban area
 *   Urban fuel loading: ~10 kg/m² ≈ 10 Tg/1000 km²
 *   Soot yield from fires: ~3% of fuel mass
 */

// Soot production coefficient (Tg per Mt of urban yield)
// Source: Toon et al. 2008 parameterization
const SOOT_PER_MT_URBAN = 0.003;  // Tg soot per Mt effective yield

// Threshold for nuclear winter onset (Tg black carbon in stratosphere)
const NUCLEAR_WINTER_THRESHOLD_TG = 5.0;
const REGIONAL_THRESHOLD_TG = 1.0;

/**
 * Estimate soot production from a set of detonations.
 *
 * Only detonations near urban areas contribute meaningfully to stratospheric soot.
 * We approximate urban fraction by burst type:
 *   - Yield < 100 kt over any area: multiply by 0.5 (partial urban coverage)
 *   - Yield >= 100 kt: multiply by 0.7 (large blast area, likely urban)
 *   - Surface burst: multiply by 0.6 (less fire ignition than airburst)
 *   - Airburst:      multiply by 1.0 (maximum fire ignition area)
 *
 * @param {Array<{yieldKt: number, burstHeightM: number, lat: number, lon: number}>} detonations
 * @returns {{ soot_tg: number, fires_mtoe: number }}
 *   soot_tg:    Tg of black carbon injected into stratosphere
 *   fires_mtoe: Total fire energy in million tonnes of oil equivalent
 */
export function estimateSoot(detonations) {
  if (!detonations || detonations.length === 0) {
    return { soot_tg: 0, fires_mtoe: 0 };
  }

  let totalSoot_Tg = 0;
  let totalFireEnergy_MJ = 0;

  for (const det of detonations) {
    const yieldMt = (det.yieldKt ?? 0) / 1000;
    if (yieldMt <= 0) continue;

    const isSurface = (det.burstHeightM ?? 0) <= 0;

    // Burst type efficiency factor for fire ignition
    const burstFactor = isSurface ? 0.6 : 1.0;

    // Urban coverage fraction (larger yields cover more urban area proportionally)
    const urbanFraction = yieldMt >= 0.1 ? 0.7 : 0.5;

    // Effective urban yield (Mt) contributing to soot
    const effectiveUrbanYield_Mt = yieldMt * burstFactor * urbanFraction;

    // Soot from this detonation
    const soot_Tg = SOOT_PER_MT_URBAN * effectiveUrbanYield_Mt;
    totalSoot_Tg += soot_Tg;

    // Fire energy estimate: ~10 GJ/tonne fuel × 10 kg/m² × fire area
    // Fire area ≈ pi * (thermal_ignition_radius)^2 in km²
    // Thermal ignition radius (wood/fabric) ~ 0.28 * Y^0.41 km (cal_45 zone)
    // Fire area km² * 10 kg/m² * 1e6 m²/km² * 10 GJ/tonne = fire_MJ
    const thermalIgnitionKm = 0.28 * Math.pow(det.yieldKt, 0.41);
    const fireAreaKm2 = Math.PI * thermalIgnitionKm * thermalIgnitionKm;
    const fuelMassKg  = fireAreaKm2 * 1e6 * 10;   // 10 kg/m² urban fuel loading
    const fireEnergy_MJ = fuelMassKg * 10e-3;      // 10 GJ/tonne = 10,000 MJ/tonne → 10 MJ/kg
    totalFireEnergy_MJ += fireEnergy_MJ * urbanFraction;
  }

  // Convert MJ to MTOE (1 MTOE = 4.187e9 MJ)
  const fires_mtoe = totalFireEnergy_MJ / 4.187e9;

  return {
    soot_tg:    Math.round(totalSoot_Tg * 100) / 100,
    fires_mtoe: Math.round(fires_mtoe * 100) / 100
  };
}

/**
 * Classify nuclear winter severity from soot estimate.
 *
 * @param {number} sootTg - Tg of stratospheric black carbon
 * @returns {{ level: string, description: string, temp_drop_c: string }}
 */
export function winterSeverity(sootTg) {
  if (sootTg < REGIONAL_THRESHOLD_TG) {
    return {
      level: 'minimal',
      description: 'Negligible global climate effects. Regional smoke and reduced visibility possible.',
      temp_drop_c: '< 0.1°C'
    };
  }

  if (sootTg < NUCLEAR_WINTER_THRESHOLD_TG) {
    return {
      level: 'regional',
      description: `Regional nuclear winter. Significant agricultural disruption in Northern Hemisphere. ` +
                   `Crop failures likely in affected regions for 1–2 years.`,
      temp_drop_c: '0.5–1.5°C'
    };
  }

  if (sootTg < 50) {
    return {
      level: 'nuclear_winter',
      description: `NUCLEAR WINTER. Global average temperature drop of 2–8°C. ` +
                   `Growing seasons eliminated for 2–5 years. Global famine affecting billions. ` +
                   `Ozone layer severely depleted.`,
      temp_drop_c: '2–8°C'
    };
  }

  return {
    level: 'nuclear_winter',
    description: `SEVERE NUCLEAR WINTER. Catastrophic global cooling. ` +
                 `Agriculture collapse worldwide for 5–10 years. ` +
                 `Extinction-level threat to global civilization.`,
    temp_drop_c: '8–15°C'
  };
}
