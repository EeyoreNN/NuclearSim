/**
 * arsenal.js — Real-world nuclear arsenal data for 9 nuclear states
 * Sources: FAS Nuclear Notebook, SIPRI, Arms Control Association
 */

export const NATIONS = {
  USA: {
    name: 'United States',
    flag: '🇺🇸',
    color: '#1a6ec4',
    stockpile: 5500,
    deployed: 1700,
  },
  RUS: {
    name: 'Russia',
    flag: '🇷🇺',
    color: '#c0392b',
    stockpile: 6257,
    deployed: 1588,
  },
  CHN: {
    name: 'China',
    flag: '🇨🇳',
    color: '#e74c3c',
    stockpile: 410,
    deployed: 350,
  },
  GBR: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    color: '#2980b9',
    stockpile: 225,
    deployed: 120,
  },
  FRA: {
    name: 'France',
    flag: '🇫🇷',
    color: '#2980b9',
    stockpile: 290,
    deployed: 280,
  },
  IND: {
    name: 'India',
    flag: '🇮🇳',
    color: '#e67e22',
    stockpile: 160,
    deployed: 0,
  },
  PAK: {
    name: 'Pakistan',
    flag: '🇵🇰',
    color: '#27ae60',
    stockpile: 165,
    deployed: 0,
  },
  ISR: {
    name: 'Israel',
    flag: '🇮🇱',
    color: '#3498db',
    stockpile: 90,
    deployed: 0,
  },
  PRK: {
    name: 'North Korea',
    flag: '🇰🇵',
    color: '#8e44ad',
    stockpile: 40,
    deployed: 0,
  },
};

// Weapon types enum
export const WEAPON_TYPES = {
  ICBM:     'ICBM',
  SLBM:     'SLBM',
  CRUISE:   'Cruise Missile',
  BOMB:     'Gravity Bomb',
  TACTICAL: 'Tactical',
  IRBM:     'IRBM/MRBM',
};

/**
 * Each weapon:
 *  id, name, nation, type, yield_kt (warhead yield),
 *  mirv (number of warheads per missile),
 *  range_km, cep_m (circular error probable),
 *  inventory (deployed), year
 */
export const WEAPONS = [
  // ===== USA =====
  {
    id: 'usa_minuteman3',
    nation: 'USA', name: 'LGM-30G Minuteman III',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 335, mirv: 1, range_km: 13000, cep_m: 170,
    inventory: 400, year: 1970,
    description: 'Land-based silo ICBM. W87 warhead (300-475 kt). Backbone of US land-based deterrence.',
  },
  {
    id: 'usa_trident2',
    nation: 'USA', name: 'UGM-133 Trident II D5',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 475, mirv: 8, range_km: 12000, cep_m: 90,
    inventory: 240, year: 1990,
    description: 'Sub-launched ballistic missile. W88 (475kt) or W76 (100kt) warheads. Extremely accurate.',
  },
  {
    id: 'usa_trident2_w76',
    nation: 'USA', name: 'Trident II D5 (W76-1)',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 100, mirv: 8, range_km: 12000, cep_m: 90,
    inventory: 800, year: 1990,
    description: 'Lower-yield Trident variant with W76-1 warhead (100kt). Used for counterforce targeting.',
  },
  {
    id: 'usa_b61',
    nation: 'USA', name: 'B61-12 Gravity Bomb',
    type: WEAPON_TYPES.BOMB,
    yield_kt: 50, mirv: 1, range_km: 0, cep_m: 30,
    inventory: 230, year: 2022,
    description: 'Variable-yield gravity bomb (0.3–50 kt). Guided tail kit provides exceptional accuracy. NATO dual-capable aircraft.',
  },
  {
    id: 'usa_b83',
    nation: 'USA', name: 'B83-1 Gravity Bomb',
    type: WEAPON_TYPES.BOMB,
    yield_kt: 1200, mirv: 1, range_km: 0, cep_m: 150,
    inventory: 50, year: 1983,
    description: 'Largest US nuclear weapon in active stockpile. 1.2 Mt yield. Strategic bomber delivery.',
  },
  {
    id: 'usa_alcm',
    nation: 'USA', name: 'AGM-86B ALCM',
    type: WEAPON_TYPES.CRUISE,
    yield_kt: 150, mirv: 1, range_km: 2500, cep_m: 30,
    inventory: 528, year: 1981,
    description: 'Air-launched cruise missile with W80-1 warhead (150kt). Launched from B-52H.',
  },
  {
    id: 'usa_lrso',
    nation: 'USA', name: 'AGM-181 LRSO',
    type: WEAPON_TYPES.CRUISE,
    yield_kt: 150, mirv: 1, range_km: 2400, cep_m: 5,
    inventory: 0, year: 2032,
    description: 'Long Range Stand-Off missile (in development). Replaces ALCM with stealth design and W80-4 warhead.',
  },

  // ===== RUSSIA =====
  {
    id: 'rus_sarmat',
    nation: 'RUS', name: 'RS-28 Sarmat',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 750, mirv: 10, range_km: 18000, cep_m: 150,
    inventory: 50, year: 2023,
    description: 'Next-generation Russian super-heavy ICBM (NATO: SS-X-30 Satan 2). Can carry 10–15 MIRVs of 750kt each plus hypersonic glide vehicles.',
  },
  {
    id: 'rus_voevoda',
    nation: 'RUS', name: 'R-36M2 Voevoda (SS-18)',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 750, mirv: 10, range_km: 15000, cep_m: 220,
    inventory: 46, year: 1988,
    description: 'Heaviest ICBM ever deployed. 10 × 750kt MIRVs or single 20 Mt warhead. Being phased out for Sarmat.',
  },
  {
    id: 'rus_topol_m',
    nation: 'RUS', name: 'RT-2PM2 Topol-M (SS-27)',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 800, mirv: 1, range_km: 11000, cep_m: 200,
    inventory: 60, year: 1997,
    description: 'Single-warhead road-mobile and silo ICBM. 800kt warhead. Maneuvering reentry vehicle for ABM defeat.',
  },
  {
    id: 'rus_yars',
    nation: 'RUS', name: 'RS-24 Yars (SS-29)',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 300, mirv: 4, range_km: 12000, cep_m: 150,
    inventory: 190, year: 2010,
    description: 'Road-mobile and silo-based MIRV ICBM. 4 × 300kt warheads. Russia\'s main modern ICBM.',
  },
  {
    id: 'rus_bulava',
    nation: 'RUS', name: 'R-30 Bulava (SS-N-32)',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 150, mirv: 6, range_km: 9300, cep_m: 200,
    inventory: 192, year: 2018,
    description: 'Sea-based SLBM for Borei-class submarines. 6 × 150kt MIRVs. Russia\'s primary sea leg.',
  },
  {
    id: 'rus_sineva',
    nation: 'RUS', name: 'RSM-54 Sineva (SS-N-23)',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 100, mirv: 4, range_km: 11500, cep_m: 500,
    inventory: 96, year: 2007,
    description: 'Liquid-fueled SLBM aboard Delta IV submarines. 4 × 100kt warheads.',
  },
  {
    id: 'rus_kinzhal',
    nation: 'RUS', name: 'Kh-47M2 Kinzhal',
    type: WEAPON_TYPES.CRUISE,
    yield_kt: 500, mirv: 1, range_km: 2000, cep_m: 1000,
    inventory: 60, year: 2017,
    description: 'Air-launched hypersonic aeroballistic missile (Mach 10+). Conventional or 500kt nuclear warhead.',
  },
  {
    id: 'rus_iskander',
    nation: 'RUS', name: 'Iskander-M (SS-26)',
    type: WEAPON_TYPES.TACTICAL,
    yield_kt: 100, mirv: 1, range_km: 500, cep_m: 5,
    inventory: 200, year: 2006,
    description: 'Short-range ballistic missile with precision guidance. Conventional or 5–100kt tactical nuclear warhead.',
  },

  // ===== CHINA =====
  {
    id: 'chn_df5b',
    nation: 'CHN', name: 'DF-5B (CSS-4)',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 400, mirv: 5, range_km: 12000, cep_m: 800,
    inventory: 20, year: 2015,
    description: 'Liquid-fueled silo ICBM. Originally single 4–5 Mt warhead; upgraded to carry 5 × 400kt MIRVs.',
  },
  {
    id: 'chn_df41',
    nation: 'CHN', name: 'DF-41 (CSS-X-20)',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 150, mirv: 10, range_km: 14000, cep_m: 100,
    inventory: 100, year: 2020,
    description: 'China\'s most advanced solid-fuel road-mobile ICBM. Up to 10 × 150kt MIRVs. Range covers continental US.',
  },
  {
    id: 'chn_df31ag',
    nation: 'CHN', name: 'DF-31AG (CSS-10)',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 150, mirv: 3, range_km: 11200, cep_m: 300,
    inventory: 36, year: 2018,
    description: 'Upgraded road-mobile solid-fuel ICBM. 1 × 1Mt or 3 × 150kt warheads.',
  },
  {
    id: 'chn_jl2',
    nation: 'CHN', name: 'JL-2 (CSS-NX-14)',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 250, mirv: 4, range_km: 7400, cep_m: 600,
    inventory: 48, year: 2015,
    description: 'China\'s primary SLBM aboard Jin-class SSBNs. 4 × 250kt warheads.',
  },
  {
    id: 'chn_df26',
    nation: 'CHN', name: 'DF-26 (CSS-18)',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 250, mirv: 1, range_km: 4000, cep_m: 150,
    inventory: 200, year: 2018,
    description: 'Dual-capable IRBM (conventional or nuclear). Can target US Guam base. "Guam Killer."',
  },

  {
    id: 'chn_df21',
    nation: 'CHN', name: 'DF-21D (CSS-5)',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 300, mirv: 1, range_km: 1700, cep_m: 20,
    inventory: 100, year: 2010,
    description: 'Anti-ship ballistic missile / nuclear MRBM. The "carrier killer." 300kt nuclear variant for anti-access/area-denial.',
  },

  // ===== UK =====
  {
    id: 'gbr_trident2',
    nation: 'GBR', name: 'Trident II D5 (UK)',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 100, mirv: 8, range_km: 12000, cep_m: 90,
    inventory: 120, year: 1994,
    description: 'UK operates 4 Vanguard-class SSBNs. W76-1 warheads (100kt). One submarine on patrol at all times.',
  },

  // ===== FRANCE =====
  {
    id: 'fra_m51',
    nation: 'FRA', name: 'M51.2 SLBM',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 100, mirv: 6, range_km: 9000, cep_m: 200,
    inventory: 64, year: 2015,
    description: 'French submarine-launched ballistic missile. 6 × TN 75 warheads (100kt). Triomphant-class submarines.',
  },
  {
    id: 'fra_asmp',
    nation: 'FRA', name: 'ASMP-A Air-Launched Cruise',
    type: WEAPON_TYPES.CRUISE,
    yield_kt: 300, mirv: 1, range_km: 500, cep_m: 20,
    inventory: 54, year: 2009,
    description: 'Air-launched cruise missile (Mach 3). TNA warhead (variable up to 300kt). Carried by Rafale and Mirage 2000N.',
  },

  // ===== INDIA =====
  {
    id: 'ind_agni5',
    nation: 'IND', name: 'Agni-V ICBM',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 150, mirv: 3, range_km: 8000, cep_m: 300,
    inventory: 12, year: 2016,
    description: 'India\'s first true ICBM. Solid-fuel, canister-launched. Under development for MIRV (3 × 150kt).',
  },
  {
    id: 'ind_agni3',
    nation: 'IND', name: 'Agni-III MRBM',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 200, mirv: 1, range_km: 3500, cep_m: 40,
    inventory: 24, year: 2011,
    description: 'Solid-fuel intermediate-range ballistic missile. Single 200kt warhead. Covers all of China.',
  },
  {
    id: 'ind_k4',
    nation: 'IND', name: 'K-4 SLBM',
    type: WEAPON_TYPES.SLBM,
    yield_kt: 200, mirv: 1, range_km: 3500, cep_m: 50,
    inventory: 16, year: 2023,
    description: 'SLBM for Arihant-class submarines. 200kt warhead. India\'s sea-based deterrent.',
  },

  // ===== PAKISTAN =====
  {
    id: 'pak_shaheen3',
    nation: 'PAK', name: 'Shaheen-III MRBM',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 40, mirv: 1, range_km: 2750, cep_m: 100,
    inventory: 12, year: 2015,
    description: 'Pakistan\'s longest-range ballistic missile. Can reach all of India. 40kt warhead.',
  },
  {
    id: 'pak_shaheen2',
    nation: 'PAK', name: 'Shaheen-II MRBM',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 40, mirv: 1, range_km: 2000, cep_m: 150,
    inventory: 24, year: 2014,
    description: 'Two-stage solid-fuel MRBM. 40kt warhead. Can reach all major Indian cities.',
  },
  {
    id: 'pak_babur',
    nation: 'PAK', name: 'Babur Cruise Missile',
    type: WEAPON_TYPES.CRUISE,
    yield_kt: 10, mirv: 1, range_km: 700, cep_m: 10,
    inventory: 48, year: 2010,
    description: 'Ground-launched cruise missile (Pakistan\'s equivalent of Tomahawk). 10kt warhead.',
  },
  {
    id: 'pak_nasr',
    nation: 'PAK', name: 'Nasr (Hatf-IX) Tactical',
    type: WEAPON_TYPES.TACTICAL,
    yield_kt: 6, mirv: 1, range_km: 70, cep_m: 25,
    inventory: 60, year: 2013,
    description: 'Short-range tactical nuclear weapon. 6kt warhead. Intended for battlefield use against armored formations.',
  },

  // ===== ISRAEL =====
  {
    id: 'isr_jericho3',
    nation: 'ISR', name: 'Jericho III ICBM (suspected)',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 750, mirv: 3, range_km: 6500, cep_m: 30,
    inventory: 25, year: 2011,
    description: 'Three-stage solid-fuel missile. Estimated 750kt single warhead or MIRVs. Israel maintains policy of nuclear ambiguity.',
  },
  {
    id: 'isr_jericho2',
    nation: 'ISR', name: 'Jericho II MRBM (suspected)',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 1000, mirv: 1, range_km: 1500, cep_m: 800,
    inventory: 50, year: 1990,
    description: 'Two-stage solid-fuel MRBM. Estimated 1Mt warhead. Can reach all Middle East targets.',
  },
  {
    id: 'isr_popeye',
    nation: 'ISR', name: 'Popeye Turbo SLCM (suspected)',
    type: WEAPON_TYPES.CRUISE,
    yield_kt: 200, mirv: 1, range_km: 1500, cep_m: 10,
    inventory: 0, year: 2002,
    description: 'Submarine-launched cruise missile variant (suspected). Provides Israel a second-strike capability.',
  },

  // ===== NORTH KOREA =====
  {
    id: 'prk_hwasong17',
    nation: 'PRK', name: 'Hwasong-17 ICBM',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 800, mirv: 3, range_km: 15000, cep_m: 1000,
    inventory: 18, year: 2022,
    description: 'North Korea\'s largest ICBM. Can potentially reach all of continental US. Estimated 800kt warhead.',
  },
  {
    id: 'prk_hwasong15',
    nation: 'PRK', name: 'Hwasong-15 ICBM',
    type: WEAPON_TYPES.ICBM,
    yield_kt: 500, mirv: 1, range_km: 13000, cep_m: 1500,
    inventory: 24, year: 2017,
    description: 'Two-stage liquid-fuel ICBM. Can reach anywhere in continental US. Single large warhead.',
  },
  {
    id: 'prk_hwasong12',
    nation: 'PRK', name: 'Hwasong-12 IRBM',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 300, mirv: 1, range_km: 4500, cep_m: 1000,
    inventory: 30, year: 2017,
    description: 'Intermediate-range ballistic missile. Can reach Guam and Alaska. 300kt warhead.',
  },
  {
    id: 'prk_kn23',
    nation: 'PRK', name: 'KN-23 Tactical SRBM',
    type: WEAPON_TYPES.TACTICAL,
    yield_kt: 50, mirv: 1, range_km: 600, cep_m: 30,
    inventory: 60, year: 2019,
    description: 'North Korean short-range ballistic missile. Low-altitude trajectory for ABM defeat. 50kt tactical warhead.',
  },
  {
    id: 'prk_pukguksong2',
    nation: 'PRK', name: 'Pukguksong-2 MRBM',
    type: WEAPON_TYPES.IRBM,
    yield_kt: 250, mirv: 1, range_km: 1200, cep_m: 500,
    inventory: 12, year: 2019,
    description: 'Two-stage solid-fuel MRBM. 250kt warhead. Can strike all South Korea and Japan.',
  },
];

export function getWeaponsByNation(nationCode) {
  return WEAPONS.filter(w => w.nation === nationCode);
}

export function getWeaponById(id) {
  return WEAPONS.find(w => w.id === id);
}

export function formatYield(kt) {
  if (kt >= 1000) return `${(kt / 1000).toFixed(2)} MT`;
  return `${kt} kT`;
}
