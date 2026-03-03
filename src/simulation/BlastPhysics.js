/**
 * BlastPhysics.js — Nuclear weapons effects calculator
 * Based on Glasstone & Dolan "The Effects of Nuclear Weapons" (1977)
 * and NUKEMAP methodology (Alex Wellerstein)
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate all blast effect radii for a nuclear detonation.
 * @param {number} yield_kt - Warhead yield in kilotons
 * @param {boolean} airburst - true = airburst, false = ground burst
 * @returns {Object} radii in km for each effect zone
 */
export function calcBlastRadii(yield_kt, airburst = true) {
  // Cube-root scaling law: all radii scale as W^(1/3)
  const W = yield_kt;
  const cbrt = Math.cbrt(W);

  // Overpressure radii (from Glasstone & Dolan)
  // Airburst optimized for maximum overpressure radius
  const airburstFactor = airburst ? 1.0 : 0.75;

  return {
    fireball_km:     0.059 * Math.pow(W, 0.4),                    // Fireball radius
    heavyBlast_km:   0.36  * cbrt * airburstFactor,               // 20 psi — near-total destruction
    moderateBlast_km:0.83  * cbrt * airburstFactor,               // 5 psi — severe structural damage
    lightBlast_km:   2.20  * cbrt * airburstFactor,               // 1 psi — windows broken, minor damage
    thermal_km:      1.73  * Math.pow(W, 0.41) * airburstFactor,  // 3rd degree burns radius
    radiation_km:    airburst ? 1.06 * cbrt : 0,                  // ~500 rem — lethal radiation (airburst)
    fallout_km:      airburst ? 0 : 18.0 * Math.pow(W, 0.35),    // Fallout zone major axis (ground burst)
    fallout_width_km:airburst ? 0 :  4.0 * Math.pow(W, 0.30),    // Fallout zone minor axis
  };
}

/**
 * Estimate casualties for a nuclear detonation over a city/area.
 * Uses simplified concentric-ring population density model.
 */
export function estimateCasualties(yield_kt, airburst, cityPop, lat, lng, allCities) {
  const radii = calcBlastRadii(yield_kt, airburst);

  // Area of each zone (km²)
  const areaHeavy    = Math.PI * radii.heavyBlast_km ** 2;
  const areaModerate = Math.PI * radii.moderateBlast_km ** 2 - areaHeavy;
  const areaLight    = Math.PI * radii.lightBlast_km ** 2 - areaHeavy - areaModerate;
  const areaThermal  = Math.PI * radii.thermal_km ** 2;
  const areaFallout  = airburst ? 0 : Math.PI * radii.fallout_km * radii.fallout_width_km;

  // Sum all cities within blast radii to get affected population
  let pop20psi = 0, pop5psi = 0, pop1psi = 0, popFallout = 0;

  for (const city of allCities) {
    const dist = haversineKm(lat, lng, city.lat, city.lng);
    const cpop = city.pop * 1000; // cities stored in thousands

    if (dist <= radii.heavyBlast_km)    pop20psi  += cpop;
    else if (dist <= radii.moderateBlast_km) pop5psi += cpop;
    else if (dist <= radii.lightBlast_km)    pop1psi += cpop;

    if (!airburst && dist <= radii.fallout_km) popFallout += cpop * 0.2; // 20% of fallout zone pop affected
  }

  // Casualty fractions based on overpressure (Glasstone & Dolan)
  const killed20psi   = pop20psi   * 0.98; // 98% killed in heavy blast zone
  const killed5psi    = pop5psi    * 0.50; // 50% killed in moderate blast
  const killed1psi    = pop1psi    * 0.05; // 5% killed in light blast
  const killedFallout = popFallout * 0.25; // 25% radiation deaths in fallout

  const immediateDeaths = Math.round(killed20psi + killed5psi + killed1psi);
  const radiationDeaths = Math.round(killedFallout + pop20psi * 0.01 + pop5psi * 0.10);

  const totalAffectedKm2 = Math.max(areaLight, areaThermal) + areaFallout;

  return {
    immediateDeaths,
    radiationDeaths,
    totalDeaths: immediateDeaths + radiationDeaths,
    affectedArea_km2: Math.round(totalAffectedKm2),
    zones: {
      heavyBlast:    { radius_km: radii.heavyBlast_km,    pop: pop20psi },
      moderateBlast: { radius_km: radii.moderateBlast_km, pop: pop5psi },
      lightBlast:    { radius_km: radii.lightBlast_km,    pop: pop1psi },
    },
  };
}

/** Haversine great-circle distance in km */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = EARTH_RADIUS_KM;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Convert km radius to angular radius on Earth (radians) */
export function kmToAngle(km) {
  return km / EARTH_RADIUS_KM;
}

/**
 * Estimate nuclear winter soot injection (Tg) from total yield
 * Based on Robock et al. 2007 "Nuclear winter revisited"
 */
export function estimateNuclearWinter(totalYield_kt) {
  const mt = totalYield_kt / 1000;
  // Urban fires produce ~5 Tg soot per 100 Mt (Robock scaling)
  const soot_Tg = mt * 0.05;
  return {
    soot_Tg: Math.round(soot_Tg * 10) / 10,
    // 5 Tg = limited regional effects; 150 Tg = full nuclear winter
    severity: soot_Tg < 1 ? 'Negligible' :
              soot_Tg < 5 ? 'Regional climate disruption' :
              soot_Tg < 30 ? 'Nuclear autumn — significant crop failures' :
              soot_Tg < 80 ? 'Nuclear winter — civilizational threat' :
                             'Full nuclear winter — mass extinction risk',
    winterFraction: Math.min(soot_Tg / 150, 1),
  };
}

export function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toString();
}
