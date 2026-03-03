/**
 * india_pakistan.js — India / Pakistan Regional Nuclear Exchange
 * ~170 warheads each. Exchange over 15 minutes.
 * Primarily IRBMs and SRBMs; short flight times.
 */

// India launch origin: Pokhran test range / central India
const IN_LAT = 27.0, IN_LON = 72.0;
// Pakistan launch origin: Tarbela / central Pakistan
const PK_LAT = 34.0, PK_LON = 72.5;

// Flight times
const IRBM_T =  300_000;  // T+5 min
const SRBM_T =  120_000;  // T+2 min
const SLBM_T =  600_000;  // T+10 min (K-15 from Bay of Bengal)
const IN_SLBM_LAT = 13.5, IN_SLBM_LON = 82.0;

export const scenario = {
  id: 'india_pakistan',
  name: 'India / Pakistan Regional Exchange',
  description: 'India and Pakistan launch their tactical and strategic nuclear forces against each other\'s cities and military targets. A regional conflict that kills up to 100 million people immediately and triggers a regional nuclear winter that devastates agriculture across South Asia.',
  participants: ['India', 'Pakistan'],
  defcon: 2,
  total_warheads: 340,
  estimated_casualties_range: '100M–150M',
  thumbnail_description: 'Regional nuclear war between two nuclear-armed neighbors',
  strikes: [
    // ─── Pakistan → Indian cities (Shaheen-III IRBM) ───────────────────────
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'new_delhi',   lat:28.6139, lon:77.2090,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'mumbai',      lat:19.0760, lon:72.8777,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'bangalore',   lat:12.9716, lon:77.5946,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'kolkata',     lat:22.5726, lon:88.3639,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'chennai',     lat:13.0827, lon:80.2707,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'hyderabad_in',lat:17.3850, lon:78.4867,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'ahmedabad',   lat:23.0225, lon:72.5714,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'pune',        lat:18.5204, lon:73.8567,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'surat',       lat:21.1702, lon:72.8311,  time_ms:IRBM_T },
    { attacker:'Pakistan', weapon_id:'shaheen-iii', warhead_id:'PK-40kt', yield_kt:40, burst_height_m:600, origin_lat:PK_LAT, origin_lon:PK_LON, target_city_id:'jaipur',      lat:26.9124, lon:75.7873,  time_ms:IRBM_T },

    // Pakistan tactical SRBM → Indian border forces
    { attacker:'Pakistan', weapon_id:'nasr', warhead_id:'PK-5kt', yield_kt:5, burst_height_m:0, origin_lat:31.5, origin_lon:74.0, target_city_id:'amritsar', lat:31.6340, lon:74.8723, time_ms:SRBM_T },
    { attacker:'Pakistan', weapon_id:'nasr', warhead_id:'PK-5kt', yield_kt:5, burst_height_m:0, origin_lat:30.5, origin_lon:74.5, target_city_id:'jodhpur',   lat:26.2389, lon:73.0243, time_ms:SRBM_T },

    // ─── India → Pakistani cities (Agni-V ICBM / Agni-IV IRBM) ────────────
    { attacker:'India', weapon_id:'agni-v',  warhead_id:'IN-500kt', yield_kt:500, burst_height_m:2000, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'karachi',   lat:24.8608, lon:67.0104, time_ms:IRBM_T },
    { attacker:'India', weapon_id:'agni-v',  warhead_id:'IN-500kt', yield_kt:500, burst_height_m:2000, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'lahore',    lat:31.5204, lon:74.3587, time_ms:IRBM_T },
    { attacker:'India', weapon_id:'agni-iv', warhead_id:'IN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'islamabad', lat:33.7294, lon:73.0931, time_ms:IRBM_T },
    { attacker:'India', weapon_id:'agni-iv', warhead_id:'IN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'rawalpindi',lat:33.5651, lon:73.0169, time_ms:IRBM_T },
    { attacker:'India', weapon_id:'agni-iv', warhead_id:'IN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'faisalabad',lat:31.4504, lon:73.1350, time_ms:IRBM_T },
    { attacker:'India', weapon_id:'agni-iv', warhead_id:'IN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'multan',    lat:30.1575, lon:71.5249, time_ms:IRBM_T },
    { attacker:'India', weapon_id:'agni-iv', warhead_id:'IN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'peshawar',  lat:34.0151, lon:71.5249, time_ms:IRBM_T },
    { attacker:'India', weapon_id:'agni-iv', warhead_id:'IN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:IN_LAT, origin_lon:IN_LON, target_city_id:'quetta',    lat:30.1798, lon:66.9750, time_ms:IRBM_T },

    // India SLBM (INS Arihant, Bay of Bengal) → Pakistan coast
    { attacker:'India', weapon_id:'k-15-sagarika', warhead_id:'IN-1kt', yield_kt:1, burst_height_m:0, origin_lat:IN_SLBM_LAT, origin_lon:IN_SLBM_LON, target_city_id:'gwadar', lat:25.1216, lon:62.3254, time_ms:SLBM_T },

    // Pakistan Babur cruise missile → Indian naval base
    { attacker:'Pakistan', weapon_id:'babur-3', warhead_id:'PK-10kt', yield_kt:10, burst_height_m:0, origin_lat:24.0, origin_lon:63.0, target_city_id:'visakhapatnam', lat:17.6868, lon:83.2185, time_ms:SLBM_T },
  ],
};
