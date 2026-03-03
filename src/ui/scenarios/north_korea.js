/**
 * north_korea.js — North Korea Strike Package
 * NK launches Hwasong ICBMs at Seoul, Tokyo, Guam, and US cities.
 * US responds with Minuteman IIIs and Tomahawk strikes on NK targets.
 * Small-yield asymmetric exchange; massive US retaliation.
 */

// NK launch origin: Pyongyang area
const NK_LAT = 39.0, NK_LON = 125.7;

// US origins
const US_ICBM_LAT = 41.5, US_ICBM_LON = -98.0;
const US_SLBM_LAT = 38.0, US_SLBM_LON = 135.0;  // Pacific patrol (near Japan)

const SRBM_T  =  120_000;  // T+2 min (KN-23, short range)
const IRBM_T  =  480_000;  // T+8 min (Hwasong-12 → Guam ~3,400 km)
const ICBM_T  = 1_800_000; // T+30 min (Hwasong-17 → US West Coast)
const US_RET_T= 2_400_000; // T+40 min US retaliation ICBMs
const SLBM_T  =   900_000; // T+15 min US SLBM retaliation

export const scenario = {
  id: 'north_korea',
  name: 'North Korea Strike Package',
  description: 'North Korea launches its full strategic arsenal: KN-23 SRBMs at Seoul and military bases, Hwasong-12 IRBMs at Guam, and Hwasong-15/17 ICBMs at Los Angeles, Seattle, and Washington DC. The US responds with a devastating counterforce and countervalue strike that eliminates the NK leadership and DPRK military infrastructure.',
  participants: ['North Korea', 'USA', 'South Korea', 'Japan'],
  defcon: 3,
  total_warheads: 45,
  estimated_casualties_range: '5M–20M',
  thumbnail_description: 'DPRK asymmetric nuclear strike and US retaliation',
  strikes: [
    // ─── NK KN-23 SRBM → Seoul and South Korean bases (T+2 min) ──────────
    { attacker:'North Korea', weapon_id:'kn-23', warhead_id:'NK-60kt', yield_kt:60, burst_height_m:0, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'seoul',        lat:37.5665, lon:126.9780, time_ms:SRBM_T },
    { attacker:'North Korea', weapon_id:'kn-23', warhead_id:'NK-60kt', yield_kt:60, burst_height_m:0, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'osan_afb',     lat:37.0900, lon:127.0300, time_ms:SRBM_T },
    { attacker:'North Korea', weapon_id:'kn-23', warhead_id:'NK-60kt', yield_kt:60, burst_height_m:0, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'camp_humphreys',lat:36.9600, lon:127.0300, time_ms:SRBM_T },
    { attacker:'North Korea', weapon_id:'kn-23', warhead_id:'NK-60kt', yield_kt:60, burst_height_m:0, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'busan',        lat:35.1796, lon:129.0756, time_ms:SRBM_T },

    // ─── NK Hwasong-12 IRBM → Guam (T+8 min) ─────────────────────────────
    { attacker:'North Korea', weapon_id:'hwasong-12', warhead_id:'NK-150kt', yield_kt:150, burst_height_m:600, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'guam',        lat:13.4443, lon:144.7937, time_ms:IRBM_T },
    { attacker:'North Korea', weapon_id:'hwasong-12', warhead_id:'NK-150kt', yield_kt:150, burst_height_m:600, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'anderson_afb', lat:13.5840, lon:144.9300, time_ms:IRBM_T },

    // ─── NK Hwasong-15 IRBM → Tokyo, Osaka (T+12 min) ────────────────────
    { attacker:'North Korea', weapon_id:'hwasong-15', warhead_id:'NK-500kt', yield_kt:500, burst_height_m:1800, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'tokyo',  lat:35.6762, lon:139.6503, time_ms:720_000 },
    { attacker:'North Korea', weapon_id:'hwasong-15', warhead_id:'NK-500kt', yield_kt:500, burst_height_m:1800, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'osaka',  lat:34.6937, lon:135.5023, time_ms:780_000 },

    // ─── NK Hwasong-17 ICBM → US West Coast (T+30 min) ───────────────────
    { attacker:'North Korea', weapon_id:'hwasong-17', warhead_id:'NK-1Mt', yield_kt:1000, burst_height_m:2400, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'los_angeles', lat:34.0522, lon:-118.2437, time_ms:ICBM_T },
    { attacker:'North Korea', weapon_id:'hwasong-17', warhead_id:'NK-1Mt', yield_kt:1000, burst_height_m:2400, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'seattle',     lat:47.6062, lon:-122.3321, time_ms:ICBM_T },
    { attacker:'North Korea', weapon_id:'hwasong-15', warhead_id:'NK-500kt', yield_kt:500, burst_height_m:1800, origin_lat:NK_LAT, origin_lon:NK_LON, target_city_id:'washington_dc',lat:38.9072, lon:-77.0369, time_ms:ICBM_T + 120000 },

    // ─── US Minuteman III retaliation → NK targets (T+40 min) ────────────
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'pyongyang',       lat:39.0392, lon:125.7625, time_ms:US_RET_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'pyongyang',       lat:39.0392, lon:125.7625, time_ms:US_RET_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'wonsan',          lat:39.1500, lon:127.4400, time_ms:US_RET_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'hamhung',         lat:39.9200, lon:127.5400, time_ms:US_RET_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'nk_missile_base_1',lat:40.5, lon:128.0, time_ms:US_RET_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'nk_missile_base_2',lat:41.8, lon:129.2, time_ms:US_RET_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'chongjin',        lat:41.7950, lon:129.7750, time_ms:US_RET_T },

    // ─── US SLBM retaliation → NK leadership (T+15 min) ──────────────────
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W76-2', yield_kt:8, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'pyongyang_palace', lat:39.0350, lon:125.7220, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W76-2', yield_kt:8, burst_height_m:0, origin_lat:US_SLBM_LAT, origin_lon:US_SLBM_LON, target_city_id:'nk_command_bunker', lat:38.9500, lon:125.5000, time_ms:SLBM_T },
  ],
};
