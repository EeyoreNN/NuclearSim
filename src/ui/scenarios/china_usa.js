/**
 * china_usa.js — China / US Pacific Nuclear Exchange
 * China targets US Pacific bases; US responds with Tridents and Minuteman IIIs.
 * DF-41 ICBMs vs Ohio-class Tridents.
 */

// China launch origins
const CN_ICBM_LAT = 35.0, CN_ICBM_LON = 104.0;  // Central China ICBM sites
const CN_IRBM_LAT = 28.0, CN_IRBM_LON = 116.0;  // Eastern China DF-26 launch

// US origins
const US_ICBM_LAT = 41.5, US_ICBM_LON = -98.0;
const US_SLBM_PACIFIC_LAT = 38.0, US_SLBM_PACIFIC_LON = 160.0;  // Pacific Trident patrol

const IRBM_T = 600_000;    // T+10 min (DF-26 to Guam)
const ICBM_T = 1_800_000;  // T+30 min
const SLBM_T =   900_000;  // T+15 min

export const scenario = {
  id: 'china_usa',
  name: 'China / US Pacific Exchange',
  description: 'China launches DF-26 IRBMs at US Pacific bases and DF-41 ICBMs at continental US cities. The US retaliates with Ohio-class Trident SLBMs against Chinese cities and military installations, plus Minuteman IIIs from the continental US. Taiwan and Japan caught in the crossfire.',
  participants: ['China', 'USA'],
  defcon: 2,
  total_warheads: 520,
  estimated_casualties_range: '200M–400M',
  thumbnail_description: 'Sino-American nuclear exchange across the Pacific',
  strikes: [
    // ─── China DF-26 IRBM → US Pacific forward bases (T+10 min) ──────────
    { attacker:'China', weapon_id:'df-26', warhead_id:'CN-1Mt', yield_kt:1000, burst_height_m:0, origin_lat:CN_IRBM_LAT, origin_lon:CN_IRBM_LON, target_city_id:'guam',             lat:13.4443, lon:144.7937,  time_ms:IRBM_T },
    { attacker:'China', weapon_id:'df-26', warhead_id:'CN-1Mt', yield_kt:1000, burst_height_m:0, origin_lat:CN_IRBM_LAT, origin_lon:CN_IRBM_LON, target_city_id:'anderson_afb_guam', lat:13.5840, lon:144.9300,  time_ms:IRBM_T },
    { attacker:'China', weapon_id:'df-26', warhead_id:'CN-1Mt', yield_kt:1000, burst_height_m:0, origin_lat:CN_IRBM_LAT, origin_lon:CN_IRBM_LON, target_city_id:'yokosuka',          lat:35.2820, lon:139.6690,  time_ms:IRBM_T },
    { attacker:'China', weapon_id:'df-26', warhead_id:'CN-1Mt', yield_kt:1000, burst_height_m:0, origin_lat:CN_IRBM_LAT, origin_lon:CN_IRBM_LON, target_city_id:'kadena_okinawa',    lat:26.3520, lon:127.7680,  time_ms:IRBM_T },
    { attacker:'China', weapon_id:'df-26', warhead_id:'CN-1Mt', yield_kt:1000, burst_height_m:0, origin_lat:CN_IRBM_LAT, origin_lon:CN_IRBM_LON, target_city_id:'misawa_afb',        lat:40.7030, lon:141.3680,  time_ms:IRBM_T },

    // ─── China DF-41 ICBM → US cities (T+30 min) ─────────────────────────
    { attacker:'China', weapon_id:'df-41', warhead_id:'CN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'los_angeles',    lat:34.0522, lon:-118.2437, time_ms:ICBM_T },
    { attacker:'China', weapon_id:'df-41', warhead_id:'CN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'san_francisco',  lat:37.7749, lon:-122.4194, time_ms:ICBM_T },
    { attacker:'China', weapon_id:'df-41', warhead_id:'CN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'seattle',        lat:47.6062, lon:-122.3321, time_ms:ICBM_T },
    { attacker:'China', weapon_id:'df-41', warhead_id:'CN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'honolulu',       lat:21.3069, lon:-157.8583, time_ms:ICBM_T },
    { attacker:'China', weapon_id:'df-41', warhead_id:'CN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'pearl_harbor',   lat:21.3473, lon:-157.9742, time_ms:ICBM_T },
    { attacker:'China', weapon_id:'df-41', warhead_id:'CN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'washington_dc',  lat:38.9072, lon:-77.0369,  time_ms:ICBM_T },
    { attacker:'China', weapon_id:'df-41', warhead_id:'CN-200kt', yield_kt:200, burst_height_m:1500, origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'new_york',       lat:40.7128, lon:-74.0060,  time_ms:ICBM_T },
    { attacker:'China', weapon_id:'df-5b',  warhead_id:'CN-5Mt', yield_kt:5000, burst_height_m:0,    origin_lat:CN_ICBM_LAT, origin_lon:CN_ICBM_LON, target_city_id:'offutt_afb',     lat:41.1185, lon:-95.9127,  time_ms:ICBM_T },

    // ─── US Trident SLBM response → Chinese cities (T+15 min) ────────────
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:1800, origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'beijing',     lat:39.9042, lon:116.4074, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:1800, origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'beijing',     lat:39.9042, lon:116.4074, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:1800, origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'shanghai',    lat:31.2304, lon:121.4737, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:1800, origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'guangzhou',   lat:23.1291, lon:113.2644, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:1800, origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'chengdu',     lat:30.5728, lon:104.0668, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W88', yield_kt:455, burst_height_m:1800, origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'wuhan',       lat:30.5928, lon:114.3055, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W76-1', yield_kt:90, burst_height_m:0,   origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'df41_missile_base_north', lat:42.0, lon:119.0, time_ms:SLBM_T },
    { attacker:'USA', weapon_id:'trident-ii', warhead_id:'W76-1', yield_kt:90, burst_height_m:0,   origin_lat:US_SLBM_PACIFIC_LAT, origin_lon:US_SLBM_PACIFIC_LON, target_city_id:'sanya_naval_base',        lat:18.2, lon:109.5, time_ms:SLBM_T },

    // ─── US Minuteman III → Chinese ICBM fields (T+30 min) ────────────────
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'lop_nur_test_site', lat:40.5, lon:88.7, time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:0, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'jiuquan_launch',    lat:40.9, lon:100.3, time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'tianjin',        lat:39.3434, lon:117.3616, time_ms:ICBM_T },
    { attacker:'USA', weapon_id:'minuteman-iii', warhead_id:'W87-0', yield_kt:300, burst_height_m:1800, origin_lat:US_ICBM_LAT, origin_lon:US_ICBM_LON, target_city_id:'xian',           lat:34.3416, lon:108.9398, time_ms:ICBM_T },
  ],
};
