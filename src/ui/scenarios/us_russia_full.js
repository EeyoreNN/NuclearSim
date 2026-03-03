/**
 * us_russia_full.js — US / Russia Full Nuclear Exchange
 * ~3,480 warheads total. Representative 80-strike sample.
 *
 * Timing model (detonation arrival times):
 *   SLBM  (US sub Atlantic)  → 900,000 ms  (T+15 min)
 *   ICBM  (US / Russia)      → 1,800,000 ms (T+30 min)
 *   SLBM  (Russia sub Arctic)→ 900,000 ms
 */

// US ICBM origin: central Nebraska/Wyoming ICBM belt
const US_ICBM_LAT = 41.5;
const US_ICBM_LON = -98.0;

// US SLBM patrol: North Atlantic
const US_SLBM_LAT = 48.0;
const US_SLBM_LON = -32.0;

// Russian ICBM origin: central Russia
const RU_ICBM_LAT = 55.0;
const RU_ICBM_LON = 50.0;

// Russian SLBM patrol: Arctic Ocean
const RU_SLBM_LAT = 75.0;
const RU_SLBM_LON = 30.0;

// Russian SLBM patrol: Pacific
const RU_SLBM_PACIFIC_LAT = 52.0;
const RU_SLBM_PACIFIC_LON = 165.0;

const ICBM_T = 1_800_000;  // 30 min
const SLBM_T =   900_000;  // 15 min

export const scenario = {
  id: 'us_russia_full',
  name: 'US / Russia Full Exchange',
  description: 'Both sides launch their full deployed arsenals simultaneously. US ICBMs and SLBMs target Russian cities and military installations. Russian ICBMs and SLBMs target US cities, ICBM silos, naval bases, and command centers. Estimated 1.5–2 billion deaths from blast, fire, and radiation alone.',
  participants: ['USA', 'Russia'],
  defcon: 1,
  total_warheads: 3480,
  estimated_casualties_range: '1.5B–2B',
  thumbnail_description: 'Global nuclear war between the two largest arsenals',
  strikes: [
    // ─── US ICBMs → Russian cities (T+30 min) ──────────────────────────────
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'moscow',          lat:55.7558, lon:37.6173,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'moscow',          lat:55.7558, lon:37.6173,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'st_petersburg',   lat:59.9311, lon:30.3609,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'st_petersburg',   lat:59.9311, lon:30.3609,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'novosibirsk',    lat:54.9833, lon:82.8964,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'yekaterinburg',  lat:56.8389, lon:60.6057,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'nizhniy_novgorod',lat:56.2965,lon:43.9361,  time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'kazan',          lat:55.7963, lon:49.1088,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'omsk',           lat:54.9685, lon:73.3685,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'chelyabinsk',    lat:55.1644, lon:61.4368,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'samara',         lat:53.2038, lon:50.1606,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'ufa',            lat:54.7388, lon:55.9721,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'rostov_on_don',  lat:47.2357, lon:39.7015,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'volgograd',      lat:48.7194, lon:44.5018,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'perm',           lat:58.0105, lon:56.2502,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'krasnoyarsk',    lat:56.0153, lon:92.8932,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'murmansk',       lat:68.9585, lon:33.0827,   time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'vladivostok',    lat:43.1198, lon:131.8869,  time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'kaliningrad',    lat:54.7065, lon:20.5110,   time_ms:ICBM_T },

    // ─── US SLBMs → Russian military targets (T+15 min) ───────────────────
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'kozelsk_icbm',        lat:54.0375, lon:35.7891,   time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'tatischevo_icbm',    lat:51.8375, lon:45.6000,   time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'uzhur_icbm',         lat:55.3054, lon:89.8329,   time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'dombarovsky_icbm',   lat:51.0669, lon:59.5489,   time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'gadzhiyevo_sub',     lat:69.2548, lon:33.3178,   time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'severomorsk',        lat:69.0689, lon:33.4167,   time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'petropavlovsk_kc',   lat:53.0452, lon:158.6512,  time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'irkutsk',            lat:52.2978, lon:104.2964,  time_ms:SLBM_T },

    // ─── Russian ICBMs → US cities (T+30 min) ─────────────────────────────
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'washington_dc',    lat:38.9072, lon:-77.0369,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'washington_dc',    lat:38.9072, lon:-77.0369,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'new_york',         lat:40.7128, lon:-74.0060,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'new_york',         lat:40.7128, lon:-74.0060,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'los_angeles',      lat:34.0522, lon:-118.2437, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'chicago',          lat:41.8781, lon:-87.6298,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'houston',          lat:29.7604, lon:-95.3698,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'seattle',          lat:47.6062, lon:-122.3321, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'san_francisco',    lat:37.7749, lon:-122.4194, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'denver',           lat:39.7392, lon:-104.9903, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'miami',            lat:25.7617, lon:-80.1918,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'boston',           lat:42.3601, lon:-71.0589,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'dallas',           lat:32.7767, lon:-96.7970,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'detroit',          lat:42.3314, lon:-83.0458,  time_ms:ICBM_T },

    // ─── Russian SLBMs → US military targets (T+15 min) ───────────────────
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'fe_warren_afb',    lat:41.1450, lon:-104.8669, time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'malmstrom_afb',    lat:47.5109, lon:-111.1887, time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'minot_afb',        lat:48.4159, lon:-101.3582, time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'offutt_afb',       lat:41.1185, lon:-95.9127,  time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'cheyenne_mountain', lat:38.7440, lon:-104.8450, time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_PACIFIC_LAT, origin_lon:RU_SLBM_PACIFIC_LON, target_city_id:'naval_base_bangor', lat:47.7235, lon:-122.7096, time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_PACIFIC_LAT, origin_lon:RU_SLBM_PACIFIC_LON, target_city_id:'kings_bay',        lat:30.7988, lon:-81.5637,  time_ms:SLBM_T + 120000 },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-150kt', yield_kt:150, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'pentagon',         lat:38.8719, lon:-77.0563,  time_ms:SLBM_T },

    // ─── RS-28 Sarmat (heavy ICBM) → NATO capitals (T+30 min) ─────────────
    { attacker:'Russia', weapon_id:'rs-28-sarmat', warhead_id:'RV-800kt', yield_kt:800, burst_height_m:2400, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'london',  lat:51.5074, lon:-0.1278,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-28-sarmat', warhead_id:'RV-800kt', yield_kt:800, burst_height_m:2400, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'paris',   lat:48.8566, lon:2.3522,   time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-28-sarmat', warhead_id:'RV-800kt', yield_kt:800, burst_height_m:2400, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'berlin',  lat:52.5200, lon:13.4050,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-28-sarmat', warhead_id:'RV-800kt', yield_kt:800, burst_height_m:2400, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'warsaw',  lat:52.2297, lon:21.0122,  time_ms:ICBM_T },
  ],
};
