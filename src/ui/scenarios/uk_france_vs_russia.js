/**
 * uk_france_vs_russia.js — UK & France vs Russia
 * UK Vanguard SSBNs + French Le Triomphant-class SSBNs strike Russia.
 * Russia retaliates against London, Paris, Glasgow, Brest, Edinburgh.
 * Total ~400 warheads. European theater.
 */

// Origins
const UK_SSBN_LAT  = 56.0, UK_SSBN_LON  = -15.0;   // UK SSBN North Atlantic
const FR_SSBN_LAT  = 48.0, FR_SSBN_LON  = -12.0;   // French SSBN patrol
const RU_ICBM_LAT  = 55.0, RU_ICBM_LON  = 50.0;    // Russian ICBM fields
const RU_SLBM_LAT  = 72.0, RU_SLBM_LON  = 25.0;    // Arctic SSBN

const SLBM_T  =   900_000;  // T+15 min
const ICBM_T  = 1_800_000;  // T+30 min
const ALCM_T  = 1_800_000;  // T+30 min (ASMP-A from Rafale near border)
const RAFALE_LAT = 48.5, RAFALE_LON = 10.0;          // Rafale airborne position

export const scenario = {
  id: 'uk_france_vs_russia',
  name: 'UK & France vs Russia',
  description: 'The UK deploys all four Vanguard-class SSBNs and France launches from Le Triomphant-class submarines against Russian strategic targets. Russia retaliates against London, Paris, Glasgow, and Brest (France). A European nuclear exchange with ~400 warheads that devastates both Western and Eastern Europe.',
  participants: ['UK', 'France', 'Russia'],
  defcon: 2,
  total_warheads: 385,
  estimated_casualties_range: '50M–120M',
  thumbnail_description: 'Anglo-French vs Russian nuclear exchange',
  strikes: [
    // ─── UK Trident II (Vanguard-class, 4 SSBNs) → Russia (T+15 min) ─────
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'moscow',           lat:55.7558, lon:37.6173, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'moscow',           lat:55.7558, lon:37.6173, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'st_petersburg',    lat:59.9311, lon:30.3609, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'st_petersburg',    lat:59.9311, lon:30.3609, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:0,    origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'kozelsk_icbm',     lat:54.0375, lon:35.7891, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:0,    origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'tatischevo_icbm',  lat:51.8375, lon:45.6000, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'murmansk',         lat:68.9585, lon:33.0827, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'kaliningrad',      lat:54.7065, lon:20.5110, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'novosibirsk',      lat:54.9833, lon:82.8964, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:0,    origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'gadzhiyevo_sub',   lat:69.2548, lon:33.3178, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'severomorsk',      lat:69.0689, lon:33.4167, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SSBN_LAT, origin_lon:UK_SSBN_LON, target_city_id:'chelyabinsk',      lat:55.1644, lon:61.4368, time_ms:SLBM_T },

    // ─── France M51 SLBM (Le Triomphant-class) → Russia (T+15 min) ────────
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SSBN_LAT, origin_lon:FR_SSBN_LON, target_city_id:'moscow',       lat:55.7558, lon:37.6173, time_ms:SLBM_T },
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SSBN_LAT, origin_lon:FR_SSBN_LON, target_city_id:'moscow',       lat:55.7558, lon:37.6173, time_ms:SLBM_T },
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SSBN_LAT, origin_lon:FR_SSBN_LON, target_city_id:'volgograd',    lat:48.7194, lon:44.5018, time_ms:SLBM_T },
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SSBN_LAT, origin_lon:FR_SSBN_LON, target_city_id:'yekaterinburg',lat:56.8389, lon:60.6057, time_ms:SLBM_T },
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:0,    origin_lat:FR_SSBN_LAT, origin_lon:FR_SSBN_LON, target_city_id:'uzhur_icbm',   lat:55.3054, lon:89.8329, time_ms:SLBM_T },
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SSBN_LAT, origin_lon:FR_SSBN_LON, target_city_id:'samara',       lat:53.2038, lon:50.1606, time_ms:SLBM_T },

    // French ASMP-A cruise missiles (Rafale, airborne) → Western Russia (T+30 min)
    { attacker:'France', weapon_id:'asmp-a', warhead_id:'FR-300kt', yield_kt:300, burst_height_m:1200, origin_lat:RAFALE_LAT, origin_lon:RAFALE_LON, target_city_id:'kaliningrad',  lat:54.7065, lon:20.5110, time_ms:ALCM_T },
    { attacker:'France', weapon_id:'asmp-a', warhead_id:'FR-300kt', yield_kt:300, burst_height_m:1200, origin_lat:RAFALE_LAT, origin_lon:RAFALE_LON, target_city_id:'minsk',        lat:53.9045, lon:27.5615, time_ms:ALCM_T },

    // ─── Russian ICBM retaliation → UK cities (T+30 min) ─────────────────
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'london',   lat:51.5074, lon:-0.1278,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'london',   lat:51.5074, lon:-0.1278,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'glasgow',  lat:55.8642, lon:-4.2518,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'birmingham',lat:52.4862, lon:-1.8904,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:0,    origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'raf_lossiemouth', lat:57.7050, lon:-3.3390, time_ms:ICBM_T },

    // ─── Russian ICBM retaliation → French cities (T+30 min) ─────────────
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'paris',    lat:48.8566, lon:2.3522,   time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'paris',    lat:48.8566, lon:2.3522,   time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'marseille',lat:43.2965, lon:5.3698,   time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:0,    origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'brest_france', lat:48.3905, lon:-4.4860, time_ms:ICBM_T },  // French naval base

    // Russian SLBM (Arctic patrol) → UK submarine base (T+15 min)
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'clyde_faslane', lat:56.0717, lon:-4.8167, time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:0, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'devonport_base', lat:50.3706, lon:-4.1873, time_ms:SLBM_T },
  ],
};
