// Mock simulation data — mid-salvo state.
// Frozen reference data the prototype reads from.

window.SimData = (function () {
  const NATIONS = [
    { code: 'usa', name: 'United States',   side: 'blue', capital: [38.895,-77.036], defcon: 2,
      icbm_remaining: 382, slbm_remaining: 224, alcm_remaining: 498, bombers_airborne: 62, fighters_airborne: 214,
      cities_struck: 0, estimated_casualties: 0, c2_state: 'NOMINAL' },
    { code: 'rus', name: 'Russian Federation', side: 'red', capital: [55.751,37.618], defcon: 1,
      icbm_remaining: 294, slbm_remaining: 168, alcm_remaining: 312, bombers_airborne: 44, fighters_airborne: 186,
      cities_struck: 0, estimated_casualties: 0, c2_state: 'DEGRADED' },
    { code: 'chn', name: "China",            side: 'red', capital: [39.904,116.407], defcon: 2,
      icbm_remaining: 148, slbm_remaining: 72, alcm_remaining: 188, bombers_airborne: 18, fighters_airborne: 142,
      cities_struck: 0, estimated_casualties: 0, c2_state: 'NOMINAL' },
    { code: 'gbr', name: 'United Kingdom',   side: 'blue', capital: [51.507,-0.128], defcon: 3,
      icbm_remaining: 0, slbm_remaining: 48, alcm_remaining: 64, bombers_airborne: 6, fighters_airborne: 48, c2_state: 'NOMINAL' },
    { code: 'fra', name: 'France',           side: 'blue', capital: [48.857,2.352], defcon: 3,
      icbm_remaining: 0, slbm_remaining: 64, alcm_remaining: 54, bombers_airborne: 4, fighters_airborne: 52, c2_state: 'NOMINAL' },
    { code: 'prk', name: "DPRK",             side: 'red', capital: [39.019,125.738], defcon: 2,
      icbm_remaining: 14, slbm_remaining: 0, alcm_remaining: 0, bombers_airborne: 0, fighters_airborne: 12, c2_state: 'NOMINAL' },
    { code: 'ind', name: 'India',            side: 'yel', capital: [28.613,77.209], defcon: 4,
      icbm_remaining: 24, slbm_remaining: 12, alcm_remaining: 36, bombers_airborne: 2, fighters_airborne: 38, c2_state: 'NOMINAL' },
    { code: 'pak', name: 'Pakistan',         side: 'yel', capital: [33.684,73.047], defcon: 4,
      icbm_remaining: 0, slbm_remaining: 0, alcm_remaining: 42, bombers_airborne: 0, fighters_airborne: 24, c2_state: 'NOMINAL' },
    { code: 'isr', name: 'Israel',           side: 'blue', capital: [31.779,35.213], defcon: 3,
      icbm_remaining: 8, slbm_remaining: 0, alcm_remaining: 18, bombers_airborne: 0, fighters_airborne: 22, c2_state: 'NOMINAL' },
    { code: 'irn', name: 'Iran',             side: 'red', capital: [35.689,51.389], defcon: 3,
      icbm_remaining: 0, slbm_remaining: 0, alcm_remaining: 24, bombers_airborne: 0, fighters_airborne: 18, c2_state: 'NOMINAL' },
  ];

  const CITIES = [
    // A mix of capitals and major cities — enough for visual context.
    { id:'c-mos', name:'Moscow',        country:'rus', pos:[55.751, 37.618], population_total:12600000, is_capital:true },
    { id:'c-lan', name:'St. Petersburg',country:'rus', pos:[59.934, 30.336], population_total:5384000 },
    { id:'c-nsb', name:'Novosibirsk',   country:'rus', pos:[55.008, 82.935], population_total:1634000 },
    { id:'c-yek', name:'Yekaterinburg', country:'rus', pos:[56.838, 60.597], population_total:1468000 },
    { id:'c-sev', name:'Severomorsk',   country:'rus', pos:[69.066, 33.420], population_total:52000, is_counterforce_adjacent:true },
    { id:'c-vla', name:'Vladivostok',   country:'rus', pos:[43.115, 131.886],population_total:604000 },
    { id:'c-was', name:'Washington DC', country:'usa', pos:[38.907,-77.037], population_total:689545, is_capital:true },
    { id:'c-nyc', name:'New York',      country:'usa', pos:[40.713,-74.006], population_total:8336000 },
    { id:'c-chi', name:'Chicago',       country:'usa', pos:[41.878,-87.630], population_total:2746000 },
    { id:'c-lax', name:'Los Angeles',   country:'usa', pos:[34.052,-118.244],population_total:3898000 },
    { id:'c-mia', name:'Miami',         country:'usa', pos:[25.761,-80.192], population_total:442000 },
    { id:'c-hou', name:'Houston',       country:'usa', pos:[29.760,-95.369], population_total:2304000 },
    { id:'c-oma', name:'Omaha',         country:'usa', pos:[41.257,-95.934], population_total:486000, is_counterforce_adjacent:true },
    { id:'c-minot', name:'Minot',       country:'usa', pos:[48.232,-101.296], population_total:48000, is_counterforce_adjacent:true },
    { id:'c-bei', name:'Beijing',       country:'chn', pos:[39.904,116.407], population_total:21540000, is_capital:true },
    { id:'c-sha', name:'Shanghai',      country:'chn', pos:[31.230,121.473], population_total:24870000 },
    { id:'c-chg', name:'Chongqing',     country:'chn', pos:[29.430,106.912], population_total:16880000 },
    { id:'c-lon', name:'London',        country:'gbr', pos:[51.507,-0.128],  population_total:9000000, is_capital:true },
    { id:'c-par', name:'Paris',         country:'fra', pos:[48.857, 2.352],  population_total:2160000, is_capital:true },
    { id:'c-ber', name:'Berlin',        country:'deu', pos:[52.520,13.405],  population_total:3645000 },
    { id:'c-tok', name:'Tokyo',         country:'jpn', pos:[35.682,139.759], population_total:13960000, is_capital:true },
    { id:'c-seo', name:'Seoul',         country:'kor', pos:[37.566,126.978], population_total:9776000, is_capital:true },
    { id:'c-pyo', name:'Pyongyang',     country:'prk', pos:[39.019,125.738], population_total:3255000, is_capital:true },
    { id:'c-del', name:'New Delhi',     country:'ind', pos:[28.613,77.209],  population_total:29000000, is_capital:true },
    { id:'c-mum', name:'Mumbai',        country:'ind', pos:[19.076,72.877],  population_total:20410000 },
    { id:'c-isl', name:'Islamabad',     country:'pak', pos:[33.684,73.047],  population_total:1015000, is_capital:true },
    { id:'c-teh', name:'Tehran',        country:'irn', pos:[35.689,51.389],  population_total:8693000, is_capital:true },
    { id:'c-jer', name:'Jerusalem',     country:'isr', pos:[31.779,35.213],  population_total:936000, is_capital:true },
    { id:'c-syd', name:'Sydney',        country:'aus', pos:[-33.868,151.209],population_total:5312000 },
    { id:'c-sao', name:'São Paulo',     country:'bra', pos:[-23.550,-46.633],population_total:12325000 },
    { id:'c-anc', name:'Anchorage',     country:'usa', pos:[61.218,-149.900],population_total:288000 },
    { id:'c-fai', name:'Fairbanks',     country:'usa', pos:[64.838,-147.716],population_total:32000 },
    { id:'c-tul', name:'Tula',          country:'rus', pos:[54.203, 37.617], population_total:475000 },
  ];

  // Entities — a cross-section. Positions are snapshot at sim-t = ~780s.
  // Boundaries of arcs encoded as origin & destination for missiles; we'll animate along them.
  const ENT = [];

  function push(e) { ENT.push(e); return e; }

  // Silos (USA — Minuteman fields in Montana / ND / Wyoming)
  ['usa-silo-1','usa-silo-2','usa-silo-3','usa-silo-4','usa-silo-5'].forEach((id, i) => {
    push({ id, cls:'silo', sub:'LGM-30G', side:'usa',
      pos:[47.5 + i*0.4, -109 - i*0.8, 0], hp:1.0, state:'ready',
      hardening_psi: 2000, mobile:false, magazine:{'W87':1}, name:`MINOT-${i+1}`
    });
  });
  // Silos (RUS)
  ['rus-silo-1','rus-silo-2','rus-silo-3','rus-silo-4'].forEach((id, i) => {
    push({ id, cls:'silo', sub:'RS-28 SARMAT', side:'rus',
      pos:[52.0 + i*0.5, 60 + i*1.2, 0], hp:1.0, state:'ready',
      hardening_psi: 2200, name:`UZHUR-${i+1}`
    });
  });
  // TEL (RUS mobile)
  push({ id:'rus-tel-1', cls:'tel', sub:'RS-24 YARS', side:'rus',
    pos:[55.0, 38.5, 0], hp:1.0, state:'ready', mobile:true, name:'TEEYKOVO-07' });
  push({ id:'rus-tel-2', cls:'tel', sub:'RS-24 YARS', side:'rus',
    pos:[58.2, 49.2, 0], hp:1.0, state:'ready', mobile:true, name:'YOSHKAR-12' });
  push({ id:'chn-tel-1', cls:'tel', sub:'DF-41', side:'chn',
    pos:[38.5, 106.2, 0], hp:1.0, state:'ready', mobile:true, name:'JILANTAI-03' });
  push({ id:'chn-tel-2', cls:'tel', sub:'DF-41', side:'chn',
    pos:[41.2, 111.8, 0], hp:1.0, state:'ready', mobile:true, name:'WUHAI-04' });

  // Silos (CHN)
  push({ id:'chn-silo-1', cls:'silo', sub:'DF-5B', side:'chn', pos:[38.8, 105.2, 0], hp:1.0, name:'YUMEN-01' });
  push({ id:'chn-silo-2', cls:'silo', sub:'DF-5B', side:'chn', pos:[40.1, 103.4, 0], hp:1.0, name:'HAMI-02' });

  // SAM / ABM / Radar
  push({ id:'usa-abm-ft-greely', cls:'abm_site', sub:'GMD', side:'usa',
    pos:[64.053, -145.728, 0], hp:1.0, radar_range_km: 4500, name:'FT. GREELY' });
  push({ id:'usa-abm-vandenberg', cls:'abm_site', sub:'GMD', side:'usa',
    pos:[34.742, -120.572, 0], hp:1.0, radar_range_km: 4500, name:'VANDENBERG' });
  push({ id:'rus-abm-a135', cls:'abm_site', sub:'A-135', side:'rus',
    pos:[56.172, 36.977, 0], hp:1.0, radar_range_km: 3500, name:'SOFRINO' });
  push({ id:'usa-radar-clear', cls:'radar_site', sub:'UEWR', side:'usa',
    pos:[64.300, -149.187, 0], hp:1.0, radar_range_km: 5500, name:'CLEAR AFS' });
  push({ id:'usa-radar-fylingdales', cls:'radar_site', sub:'UEWR', side:'gbr',
    pos:[54.362, -0.670, 0], hp:1.0, radar_range_km: 4800, name:'FYLINGDALES' });
  push({ id:'rus-radar-voronezh', cls:'radar_site', sub:'VORONEZH-M', side:'rus',
    pos:[60.275, 30.506, 0], hp:1.0, radar_range_km: 6000, name:'LEKHTUSI' });
  push({ id:'usa-sam-1', cls:'sam_site', sub:'PATRIOT PAC-3', side:'usa',
    pos:[38.9, -77.1, 0], hp:1.0, radar_range_km: 170, name:'DC-01' });
  push({ id:'rus-sam-1', cls:'sam_site', sub:'S-400', side:'rus',
    pos:[55.8, 37.5, 0], hp:1.0, radar_range_km: 400, name:'MOS-01' });
  push({ id:'rus-sam-2', cls:'sam_site', sub:'S-400', side:'rus',
    pos:[59.9, 30.3, 0], hp:1.0, radar_range_km: 400, name:'LEN-01' });

  // Early-warning satellites
  push({ id:'sat-sbirs-1', cls:'satellite_early_warning', sub:'SBIRS-GEO-5', side:'usa',
    pos:[0.0, -115, 35786000], hp:1.0, name:'SBIRS-GEO-5' });
  push({ id:'sat-tundra-1', cls:'satellite_early_warning', sub:'TUNDRA', side:'rus',
    pos:[63.4, 38, 35786000], hp:1.0, name:'TUNDRA-5' });

  // Carriers + escorts
  push({ id:'usn-cvn78', cls:'carrier', sub:'FORD-CLASS', side:'usa',
    pos:[36.0, -15.2, 0], hp:0.98, callsign:'CVN-78',
    class_tonnage_t:100000, embarked_aircraft:['f35-01','f35-02'], name:'USS GERALD R. FORD' });
  push({ id:'usn-ddg1', cls:'destroyer', sub:'ARLEIGH BURKE', side:'usa',
    pos:[35.2, -16.0, 0], hp:1.0, callsign:'DDG-51', name:'USS ARLEIGH BURKE',
    vls_cells:{total:96, loaded:{'SM-3 IIA':24,'SM-6':24,'TOMAHAWK':32}} });
  push({ id:'rus-ssbn-1', cls:'ssbn', sub:'BOREI', side:'rus',
    pos:[72.5, 55.0, -90], hp:1.0, depth_m:90, name:'K-535 YURI DOLGORUKIY',
    vls_cells:{total:16, loaded:{'BULAVA':16}} });
  push({ id:'usn-ssbn-1', cls:'ssbn', sub:'OHIO', side:'usa',
    pos:[42.5, -155.0, -120], hp:1.0, depth_m:120, name:'USS MAINE (SSBN-741)',
    vls_cells:{total:24, loaded:{'TRIDENT II D5':24}} });
  push({ id:'gbr-ssbn-1', cls:'ssbn', sub:'VANGUARD', side:'gbr',
    pos:[58.0, -14.0, -100], hp:1.0, depth_m:100, name:'HMS VICTORIOUS' });

  // Airborne platforms
  push({ id:'usa-b2-01', cls:'bomber', sub:'B-2A SPIRIT', side:'usa',
    pos:[62.1, 160.0, 12200], hp:1.0, fuel:0.62, state:'cruise',
    callsign:'SPIRIT-11', stealth_rcs_m2:0.0001,
    weapons:[{sub:'B61-12',qty:16}] });
  push({ id:'usa-b2-02', cls:'bomber', sub:'B-2A SPIRIT', side:'usa',
    pos:[58.0, 140.0, 12200], hp:1.0, fuel:0.58, state:'cruise',
    callsign:'SPIRIT-12', weapons:[{sub:'AGM-158B',qty:16}] });
  push({ id:'rus-tu160-01', cls:'bomber', sub:'TU-160', side:'rus',
    pos:[68.0, -10.0, 11800], hp:1.0, fuel:0.71, state:'cruise',
    callsign:'BLACKJACK-01', weapons:[{sub:'KH-102',qty:12}] });
  push({ id:'usa-awacs-01', cls:'awacs', sub:'E-3G SENTRY', side:'usa',
    pos:[52.0, -10.0, 9200], hp:1.0, fuel:0.82, state:'cruise',
    callsign:'MAGIC-21', radar_on:true });
  push({ id:'usa-tanker-01', cls:'tanker', sub:'KC-46A PEGASUS', side:'usa',
    pos:[56.0, -30.0, 8500], hp:1.0, fuel:0.88, callsign:'SHELL-41' });
  push({ id:'f35-01', cls:'fighter', sub:'F-35C', side:'usa',
    pos:[37.0, -14.5, 9800], hp:1.0, fuel:0.55, callsign:'NAVY-310',
    weapons:[{sub:'AIM-120D',qty:4},{sub:'AIM-9X',qty:2}] });
  push({ id:'f35-02', cls:'fighter', sub:'F-35C', side:'usa',
    pos:[36.4, -13.9, 9800], hp:1.0, fuel:0.56, callsign:'NAVY-311' });
  push({ id:'rus-mig31-01', cls:'fighter', sub:'MiG-31BM', side:'rus',
    pos:[65.0, 40.0, 18000], hp:1.0, fuel:0.63, callsign:'FOXHOUND-03' });

  // In-flight missiles (mid-salvo)
  const flights = [
    { from:[47.5,-109], to:[55.75,37.62],  t: 0.38, cls:'icbm', side:'usa', sub:'LGM-30G MINUTEMAN III',
      name:'FLIGHT-MK-14', warheads:3, apogee:1200000 },
    { from:[47.9,-109.8],to:[59.93,30.33], t: 0.52, cls:'icbm', side:'usa', sub:'LGM-30G MINUTEMAN III',
      name:'FLIGHT-MK-15', warheads:3, apogee:1150000 },
    { from:[48.3,-110.6],to:[55.01,82.94], t: 0.24, cls:'icbm', side:'usa', sub:'LGM-30G MINUTEMAN III',
      name:'FLIGHT-MK-16', warheads:3, apogee:900000 },
    { from:[42.5,-155],  to:[43.12,131.89],t: 0.41, cls:'slbm', side:'usa', sub:'TRIDENT II D5',
      name:'TRIDENT-AA-02', warheads:8, apogee:1300000 },
    { from:[42.5,-155],  to:[39.90,116.41],t: 0.32, cls:'slbm', side:'usa', sub:'TRIDENT II D5',
      name:'TRIDENT-AA-03', warheads:8, apogee:1280000 },
    { from:[52.0,60.0],  to:[38.91,-77.04],t: 0.48, cls:'icbm', side:'rus', sub:'RS-28 SARMAT',
      name:'FLIGHT-UZ-01', warheads:10, apogee:1350000 },
    { from:[52.5,60.6],  to:[40.71,-74.01],t: 0.62, cls:'icbm', side:'rus', sub:'RS-28 SARMAT',
      name:'FLIGHT-UZ-02', warheads:10, apogee:1320000 },
    { from:[53.0,61.2],  to:[41.88,-87.63],t: 0.35, cls:'icbm', side:'rus', sub:'RS-28 SARMAT',
      name:'FLIGHT-UZ-03', warheads:10, apogee:1280000 },
    { from:[55.0,38.5],  to:[34.05,-118.24],t:0.28, cls:'icbm', side:'rus', sub:'RS-24 YARS',
      name:'FLIGHT-TK-01', warheads:4, apogee:1200000 },
    { from:[58.2,49.2],  to:[29.76,-95.37],t:0.45, cls:'icbm', side:'rus', sub:'RS-24 YARS',
      name:'FLIGHT-YO-02', warheads:4, apogee:1220000 },
    { from:[72.5,55.0],  to:[47.61,-122.33],t:0.58, cls:'slbm', side:'rus', sub:'RSM-56 BULAVA',
      name:'BULAVA-K5-01', warheads:6, apogee:1180000 },
    { from:[72.5,55.0],  to:[37.77,-122.42],t:0.71, cls:'slbm', side:'rus', sub:'RSM-56 BULAVA',
      name:'BULAVA-K5-02', warheads:6, apogee:1200000 },
    { from:[38.8,105.2], to:[34.05,-118.24],t:0.22, cls:'icbm', side:'chn', sub:'DF-5B',
      name:'FLIGHT-YM-01', warheads:5, apogee:1280000 },
    { from:[38.5,106.2], to:[21.31,-157.86],t:0.36, cls:'icbm', side:'chn', sub:'DF-41',
      name:'FLIGHT-JL-02', warheads:3, apogee:1200000 },
    { from:[41.2,111.8], to:[47.61,-122.33],t:0.44, cls:'icbm', side:'chn', sub:'DF-41',
      name:'FLIGHT-WH-03', warheads:3, apogee:1220000 },
    // Cruise missiles (low)
    { from:[62.1,160.0], to:[55.75,37.62],  t:0.18, cls:'cruise_alcm', side:'usa', sub:'AGM-158B JASSM-ER',
      name:'JASSM-B2-04', warheads:1, apogee:100 },
    { from:[68.0,-10.0], to:[38.91,-77.04], t:0.14, cls:'cruise_alcm', side:'rus', sub:'KH-102',
      name:'KH102-TU-02', warheads:1, apogee:80 },
    // Interceptors in flight
    { from:[64.053,-145.728], to:[55.0,-140.0], t:0.72, cls:'abm_interceptor', side:'usa',
      sub:'GBI', name:'GBI-GRL-03', warheads:0, apogee:800000, intercepting:'FLIGHT-UZ-01' },
    { from:[34.742,-120.572], to:[30.0,-130.0], t:0.64, cls:'abm_interceptor', side:'usa',
      sub:'GBI', name:'GBI-VBG-02', warheads:0, apogee:780000, intercepting:'FLIGHT-YM-01' },
    { from:[56.172,36.977], to:[58.0,20.0], t:0.58, cls:'abm_interceptor', side:'rus',
      sub:'53T6M', name:'A135-SOF-01', warheads:0, apogee:120000, intercepting:'TRIDENT-AA-02' },
  ];

  // Generate entity records for in-flight missiles
  flights.forEach((f, idx) => {
    const id = 'wep-' + idx;
    push({
      id, cls: f.cls, sub: f.sub, side: f.side, name: f.name,
      pos: interp(f.from, f.to, f.t), hp: 1.0, state: phase(f.t),
      origin: f.from, destination: f.to, progress: f.t,
      warheads_count: f.warheads, apogee_m: f.apogee,
      impact_eta_s: Math.round((1 - f.t) * (f.cls.startsWith('cruise') ? 3000 : 1800)),
      intercepting: f.intercepting || null,
      is_mirv: f.warheads > 1
    });
  });

  function interp(a, b, t) {
    // Spherical linear interpolation (great-circle) — rough.
    const [lat1,lon1] = a, [lat2,lon2] = b;
    const lat = lat1 + (lat2-lat1)*t;
    const lon = lon1 + (lon2-lon1)*t;
    // arc altitude bump — sinusoidal
    const alt = Math.sin(t * Math.PI) * 800000;
    return [lat, lon, alt];
  }
  function phase(t) {
    if (t < 0.08) return 'boost';
    if (t < 0.88) return 'midcourse';
    return 'terminal';
  }

  // Detonations (first ones — counterforce adjacent)
  const DETONATIONS = [
    { id:'det-01', pos:[48.23, -101.29], yield_kt: 800, fuse:'groundburst', t_ago_s: 42,
      psi5_radius_km: 6.4, psi20_radius_km: 3.2, thermal_3rd_deg_radius_km: 9.1,
      target_city:'c-minot', warhead_sub:'YASEN-15 MK' },
    { id:'det-02', pos:[41.257, -95.934], yield_kt: 500, fuse:'airburst', hob_m: 2400, t_ago_s: 71,
      psi5_radius_km: 8.2, psi20_radius_km: 3.8, thermal_3rd_deg_radius_km: 11.5,
      target_city:'c-oma', warhead_sub:'RS-24 MIRV' },
    { id:'det-03', pos:[69.066, 33.420], yield_kt: 475, fuse:'groundburst', t_ago_s: 124,
      psi5_radius_km: 5.9, psi20_radius_km: 3.0, thermal_3rd_deg_radius_km: 8.4,
      target_city:'c-sev', warhead_sub:'W88' },
  ];

  // Event log seed
  const EVENTS = [
    { t: 0,    kind:'order',         actors:['usa'], msg:'NATION_POSTURE usa → DEFCON 2' },
    { t: 42,   kind:'order',         actors:['rus'], msg:'NATION_POSTURE rus → DEFCON 1' },
    { t: 88,   kind:'launch',        actors:['rus-silo-1','wep-5'], msg:'RUS-SILO UZHUR-1 launched <em>RS-28 SARMAT</em> → Washington DC' },
    { t: 92,   kind:'launch',        actors:['usa-silo-1','wep-0'], msg:'USA-SILO MINOT-1 launched <em>LGM-30G</em> → Moscow' },
    { t: 101,  kind:'detect',        actors:['sat-tundra-1','wep-0'], msg:'TUNDRA-5 detected <em>LGM-30G MINUTEMAN III</em> boost · SNR 24dB' },
    { t: 105,  kind:'detect',        actors:['sat-sbirs-1','wep-5'], msg:'SBIRS-GEO-5 detected <em>RS-28 SARMAT</em> boost · SNR 27dB' },
    { t: 120,  kind:'boost_end',     actors:['wep-0'], msg:'FLIGHT-MK-14 boost-end · apogee 1,200km · impact ETA 18m 04s' },
    { t: 142,  kind:'track',         actors:['rus-radar-voronezh','wep-0'], msg:'LEKHTUSI acquired track on <em>FLIGHT-MK-14</em>' },
    { t: 188,  kind:'launch',        actors:['chn-silo-1','wep-12'], msg:'CHN-SILO YUMEN-01 launched <em>DF-5B</em> → Los Angeles' },
    { t: 244,  kind:'engage',        actors:['usa-abm-ft-greely','wep-5'], msg:'FT. GREELY engage <em>FLIGHT-UZ-01</em> · Pk 0.62 · GBI×2' },
    { t: 302,  kind:'reentry',       actors:['wep-0'], msg:'FLIGHT-MK-14 MIRV bus released 3 RVs' },
    { t: 388,  kind:'engage',        actors:['rus-sam-1','wep-16'], msg:'MOS-01 S-400 engage <em>JASSM-B2-04</em>' },
    { t: 441,  kind:'intercept_miss',actors:['rus-sam-1','wep-16'], msg:'S-400 miss <em>JASSM-B2-04</em> · reason MANEUVER' },
    { t: 512,  kind:'detonation',    actors:['det-03'], msg:'DETONATION Severomorsk · 475kT groundburst · counterforce' },
    { t: 548,  kind:'casualty_update',actors:['c-sev'], msg:'SEVEROMORSK Δdead 18,400 · Δinjured 22,100 · fires active' },
    { t: 610,  kind:'detect',        actors:['usa-radar-clear','wep-5'], msg:'CLEAR AFS acquired <em>FLIGHT-UZ-01</em> · SNR 31dB' },
    { t: 648,  kind:'engage',        actors:['usa-abm-ft-greely','wep-5'], msg:'FT. GREELY GBI-GRL-03 launched · intercept T-340s' },
    { t: 684,  kind:'detonation',    actors:['det-01'], msg:'DETONATION Minot AFB · 800kT groundburst' },
    { t: 688,  kind:'casualty_update',actors:['c-minot'], msg:'MINOT Δdead 26,800 · Δinjured 14,200 · fires active' },
    { t: 712,  kind:'detonation',    actors:['det-02'], msg:'DETONATION Omaha/STRATCOM · 500kT airburst · HOB 2400m' },
    { t: 716,  kind:'casualty_update',actors:['c-oma'], msg:'OMAHA Δdead 81,300 · Δinjured 142,800 · fires active' },
    { t: 724,  kind:'c2_link_lost',  actors:['usa'], msg:'STRATCOM offutt primary link lost · failover to Looking Glass' },
    { t: 752,  kind:'engage',        actors:['usn-ddg1','wep-6'], msg:'USS ARLEIGH BURKE SM-3 IIA engage <em>FLIGHT-UZ-02</em>' },
    { t: 769,  kind:'track',         actors:['usa-radar-fylingdales','wep-6'], msg:'FYLINGDALES track on <em>FLIGHT-UZ-02</em>' },
    { t: 778,  kind:'intercept_hit', actors:['usn-ddg1','wep-6'], msg:'SM-3 IIA INTERCEPT HIT <em>FLIGHT-UZ-02</em> · alt 820km · miss 1.2m' },
  ];

  const NOW_T = 780;

  // Bases for launch-order target picker
  const TARGETS_CATALOG = [
    { kind:'city', id:'c-mos', label:'Moscow',       country:'rus', pop:12600000, lat:55.75, lon:37.62 },
    { kind:'city', id:'c-lan', label:'St. Petersburg',country:'rus',pop:5384000,  lat:59.93, lon:30.33 },
    { kind:'city', id:'c-nsb', label:'Novosibirsk',  country:'rus', pop:1634000,  lat:55.01, lon:82.94 },
    { kind:'city', id:'c-vla', label:'Vladivostok',  country:'rus', pop:604000,   lat:43.12, lon:131.89 },
    { kind:'city', id:'c-bei', label:'Beijing',      country:'chn', pop:21540000, lat:39.90, lon:116.41 },
    { kind:'city', id:'c-sha', label:'Shanghai',     country:'chn', pop:24870000, lat:31.23, lon:121.47 },
    { kind:'entity', id:'rus-silo-1', label:'UZHUR SILO 1', country:'rus', lat:52.0, lon:60.0 },
    { kind:'entity', id:'rus-silo-2', label:'UZHUR SILO 2', country:'rus', lat:52.5, lon:60.6 },
    { kind:'entity', id:'rus-tel-1',  label:'TEEYKOVO TEL 07', country:'rus', lat:55.0, lon:38.5 },
    { kind:'entity', id:'chn-silo-1', label:'YUMEN SILO 01', country:'chn', lat:38.8, lon:105.2 },
    { kind:'entity', id:'rus-abm-a135',label:'SOFRINO ABM',  country:'rus', lat:56.17, lon:36.98 },
    { kind:'entity', id:'rus-ssbn-1',  label:'K-535 BOREI',  country:'rus', lat:72.5, lon:55.0 },
  ];

  // Global metrics (from §2.5)
  const METRICS = {
    global: {
      missiles_in_flight: 18,
      warheads_in_flight: 74,
      intercepts_attempted: 6,
      intercepts_successful: 1,
      detonations: 3,
      estimated_casualties_total: 126500,
    }
  };

  return {
    NATIONS, CITIES, ENT, DETONATIONS, EVENTS, NOW_T, TARGETS_CATALOG, METRICS,
  };
})();
