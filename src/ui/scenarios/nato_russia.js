/**
 * nato_russia.js — NATO vs Russia: European Theater Nuclear War
 * Russia escalates after conventional failure; NATO responds.
 * Mix of Iskander SRBMs, UK Trident SLBMs, US B61-12 gravity bombs, French M51 SLBMs.
 */

// Origins
const RU_WEST_LAT = 55.0, RU_WEST_LON = 32.0;          // Western Russia conventional/tactical
const RU_ICBM_LAT = 55.0, RU_ICBM_LON = 50.0;          // Russian ICBM fields
const RU_SLBM_LAT = 72.0, RU_SLBM_LON = 25.0;          // Arctic SLBM patrol
const UK_SLBM_LAT = 58.0, UK_SLBM_LON = -15.0;         // UK SSBN patrol (North Atlantic)
const FR_SLBM_LAT = 48.0, FR_SLBM_LON = -12.0;         // French SSBN patrol
const NATO_AIR_LAT = 50.0, NATO_AIR_LON = 14.0;        // NATO air bases in Central Europe

const SRBM_T    =  120_000;  // T+2 min
const IRBM_T    =  600_000;  // T+10 min
const SLBM_T    =  900_000;  // T+15 min
const ICBM_T    = 1_800_000; // T+30 min
const ALCM_T    = 3_600_000; // T+60 min (B-52 cruise missiles, long standoff)

export const scenario = {
  id: 'nato_russia',
  name: 'NATO vs Russia: European Theater',
  description: 'Russia launches Iskander strikes on NATO forward positions, then escalates to nuclear. NATO responds with UK Trident SLBMs, French M51s, and US B61-12 gravity bombs delivered by F-35As from European bases. Russia retaliates against NATO capitals. Approximately 800 million at risk.',
  participants: ['Russia', 'NATO', 'UK', 'France', 'USA'],
  defcon: 1,
  total_warheads: 850,
  estimated_casualties_range: '400M–800M',
  thumbnail_description: 'NATO-Russia nuclear exchange over Europe',
  strikes: [
    // ─── Russia: Iskander SRBM opening strike → NATO positions (T+2 min) ──
    { attacker:'Russia', weapon_id:'iskander-m', warhead_id:'RV-500kt', yield_kt:500, burst_height_m:0, origin_lat:RU_WEST_LAT, origin_lon:RU_WEST_LON, target_city_id:'warsaw',    lat:52.2297, lon:21.0122, time_ms:SRBM_T },
    { attacker:'Russia', weapon_id:'iskander-m', warhead_id:'RV-500kt', yield_kt:500, burst_height_m:0, origin_lat:RU_WEST_LAT, origin_lon:RU_WEST_LON, target_city_id:'vilnius',   lat:54.6872, lon:25.2797, time_ms:SRBM_T },
    { attacker:'Russia', weapon_id:'iskander-m', warhead_id:'RV-500kt', yield_kt:500, burst_height_m:0, origin_lat:RU_WEST_LAT, origin_lon:RU_WEST_LON, target_city_id:'riga',      lat:56.9496, lon:24.1052, time_ms:SRBM_T },
    { attacker:'Russia', weapon_id:'iskander-m', warhead_id:'RV-500kt', yield_kt:500, burst_height_m:0, origin_lat:54.7, origin_lon:20.5, target_city_id:'kaliningrad_nato', lat:54.3520, lon:18.6466, time_ms:SRBM_T },

    // ─── Russia: ICBM/SLBM escalation → NATO capitals (T+15/30 min) ────────
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'london',    lat:51.5074, lon:-0.1278, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'london',    lat:51.5074, lon:-0.1278, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'paris',     lat:48.8566, lon:2.3522,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'paris',     lat:48.8566, lon:2.3522,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'berlin',    lat:52.5200, lon:13.4050, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'madrid',    lat:40.4168, lon:-3.7038, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'rome',      lat:41.9028, lon:12.4964, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-24-yars', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'brussels',  lat:50.8503, lon:4.3517,  time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rs-20v-voevoda', warhead_id:'RV-800kt', yield_kt:800, burst_height_m:2400, origin_lat:RU_ICBM_LAT, origin_lon:RU_ICBM_LON, target_city_id:'ramstein_afb', lat:49.4369, lon:7.6003, time_ms:ICBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'oslo',      lat:59.9139, lon:10.7522, time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'amsterdam', lat:52.3676, lon:4.9041,  time_ms:SLBM_T },
    { attacker:'Russia', weapon_id:'rsm-56-bulava', warhead_id:'RV-100kt', yield_kt:100, burst_height_m:1200, origin_lat:RU_SLBM_LAT, origin_lon:RU_SLBM_LON, target_city_id:'glasgow',   lat:55.8642, lon:-4.2518, time_ms:SLBM_T },

    // ─── UK Trident SLBM response (T+15 min) ──────────────────────────────
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SLBM_LAT, origin_lon:UK_SLBM_LON, target_city_id:'moscow',       lat:55.7558, lon:37.6173, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SLBM_LAT, origin_lon:UK_SLBM_LON, target_city_id:'st_petersburg',lat:59.9311, lon:30.3609, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SLBM_LAT, origin_lon:UK_SLBM_LON, target_city_id:'murmansk',     lat:68.9585, lon:33.0827, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SLBM_LAT, origin_lon:UK_SLBM_LON, target_city_id:'kaliningrad',  lat:54.7065, lon:20.5110, time_ms:SLBM_T },
    { attacker:'UK', weapon_id:'trident-ii', warhead_id:'W76-1-UK', yield_kt:100, burst_height_m:1200, origin_lat:UK_SLBM_LAT, origin_lon:UK_SLBM_LON, target_city_id:'sevastopol',   lat:44.6166, lon:33.5254, time_ms:SLBM_T },

    // ─── France M51 SLBM response (T+15 min) ──────────────────────────────
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SLBM_LAT, origin_lon:FR_SLBM_LON, target_city_id:'moscow',        lat:55.7558, lon:37.6173, time_ms:SLBM_T },
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SLBM_LAT, origin_lon:FR_SLBM_LON, target_city_id:'novosibirsk',   lat:54.9833, lon:82.8964, time_ms:SLBM_T },
    { attacker:'France', weapon_id:'m51', warhead_id:'FR-100kt', yield_kt:100, burst_height_m:1200, origin_lat:FR_SLBM_LAT, origin_lon:FR_SLBM_LON, target_city_id:'chelyabinsk',   lat:55.1644, lon:61.4368, time_ms:SLBM_T },

    // ─── NATO B61-12 gravity bombs (F-35A from European bases, T+60 min) ──
    { attacker:'USA/NATO', weapon_id:'f35a', warhead_id:'B61-12', yield_kt:50, burst_height_m:0, origin_lat:NATO_AIR_LAT, origin_lon:NATO_AIR_LON, target_city_id:'kozelsk_icbm',    lat:54.0375, lon:35.7891, time_ms:ALCM_T },
    { attacker:'USA/NATO', weapon_id:'f35a', warhead_id:'B61-12', yield_kt:50, burst_height_m:0, origin_lat:NATO_AIR_LAT, origin_lon:NATO_AIR_LON, target_city_id:'tatischevo_icbm', lat:51.8375, lon:45.6000, time_ms:ALCM_T },
    { attacker:'USA/NATO', weapon_id:'f35a', warhead_id:'B61-12', yield_kt:50, burst_height_m:0, origin_lat:NATO_AIR_LAT, origin_lon:NATO_AIR_LON, target_city_id:'kaliningrad',     lat:54.7065, lon:20.5110, time_ms:ALCM_T },
    { attacker:'USA/NATO', weapon_id:'f35a', warhead_id:'B61-12', yield_kt:50, burst_height_m:0, origin_lat:NATO_AIR_LAT, origin_lon:NATO_AIR_LON, target_city_id:'minsk',           lat:53.9045, lon:27.5615, time_ms:ALCM_T },
  ],
};
