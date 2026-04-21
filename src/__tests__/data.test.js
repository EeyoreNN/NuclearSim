import { describe, it, expect, beforeAll } from 'vitest';

let SD;
beforeAll(async () => {
  await import('../data.js');
  SD = window.SimData;
});

describe('SimData top-level shape', () => {
  it('exposes required top-level keys', () => {
    for (const k of ['NATIONS', 'CITIES', 'ENT', 'DETONATIONS', 'EVENTS', 'NOW_T', 'TARGETS_CATALOG', 'METRICS']) {
      expect(SD).toHaveProperty(k);
    }
  });
  it('NOW_T is a number', () => expect(typeof SD.NOW_T).toBe('number'));
  it('NOW_T is positive (mid-salvo scenario)', () => expect(SD.NOW_T).toBeGreaterThan(0));
});

describe('SimData.NATIONS', () => {
  it('has exactly 10 nations', () => {
    expect(SD.NATIONS).toHaveLength(10);
  });
  it('every nation has code/name/capital/defcon/c2_state', () => {
    for (const n of SD.NATIONS) {
      expect(n.code).toMatch(/^[a-z]{3}$/);
      expect(typeof n.name).toBe('string');
      expect(Array.isArray(n.capital)).toBe(true);
      expect(n.capital).toHaveLength(2);
      expect(n.defcon).toBeGreaterThanOrEqual(1);
      expect(n.defcon).toBeLessThanOrEqual(5);
      expect(n.c2_state).toMatch(/NOMINAL|DEGRADED|DECAPITATED/);
    }
  });
  it('arsenal counts are non-negative integers', () => {
    for (const n of SD.NATIONS) {
      for (const k of ['icbm_remaining', 'slbm_remaining', 'alcm_remaining', 'bombers_airborne', 'fighters_airborne']) {
        expect(n[k]).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(n[k])).toBe(true);
      }
    }
  });
  it('codes are unique', () => {
    const codes = SD.NATIONS.map(n => n.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
  it('USA is under counter-attack (DEFCON ≤ 2)', () => {
    const usa = SD.NATIONS.find(n => n.code === 'usa');
    expect(usa.defcon).toBeLessThanOrEqual(2);
  });
  it('Russia has DEGRADED C2 in this scenario', () => {
    const rus = SD.NATIONS.find(n => n.code === 'rus');
    expect(rus.c2_state).toBe('DEGRADED');
  });
});

describe('SimData.CITIES', () => {
  it('has enough entries for visual context', () => {
    expect(SD.CITIES.length).toBeGreaterThanOrEqual(25);
  });
  it('every city has id/name/country/pos/population_total', () => {
    for (const c of SD.CITIES) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.name).toBe('string');
      expect(c.country).toMatch(/^[a-z]{3}$/);
      expect(Array.isArray(c.pos)).toBe(true);
      expect(c.pos.length).toBe(2);
      expect(c.pos[0]).toBeGreaterThanOrEqual(-90);
      expect(c.pos[0]).toBeLessThanOrEqual(90);
      expect(c.pos[1]).toBeGreaterThanOrEqual(-180);
      expect(c.pos[1]).toBeLessThanOrEqual(180);
      expect(c.population_total).toBeGreaterThan(0);
    }
  });
  it('at least one city per nuclear nation is present', () => {
    for (const iso of ['usa', 'rus', 'chn', 'gbr', 'fra', 'ind', 'pak', 'isr', 'prk']) {
      expect(SD.CITIES.some(c => c.country === iso)).toBe(true);
    }
  });
  it('Moscow is capital', () => {
    const m = SD.CITIES.find(c => c.name === 'Moscow');
    expect(m?.is_capital).toBe(true);
  });
  it('ids are unique', () => {
    const ids = SD.CITIES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('SimData.ENT — entity cross-section', () => {
  it('has entities', () => {
    expect(SD.ENT.length).toBeGreaterThan(20);
  });
  it('includes at least one silo, icbm, ssbn, bomber', () => {
    const classes = new Set(SD.ENT.map(e => e.cls));
    expect(classes.has('silo')).toBe(true);
    expect(classes.has('icbm')).toBe(true);
    expect(classes.has('ssbn')).toBe(true);
    expect(classes.has('bomber')).toBe(true);
  });
  it('every entity has id/cls/side/pos', () => {
    for (const e of SD.ENT) {
      expect(typeof e.id).toBe('string');
      expect(typeof e.cls).toBe('string');
      expect(typeof e.side).toBe('string');
      expect(Array.isArray(e.pos)).toBe(true);
    }
  });
  it('ids are unique', () => {
    const ids = SD.ENT.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('positions pass sanity ranges', () => {
    for (const e of SD.ENT) {
      const [lat, lon] = e.pos;
      expect(lat).toBeGreaterThanOrEqual(-90);
      expect(lat).toBeLessThanOrEqual(90);
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
    }
  });
});

describe('SimData.DETONATIONS', () => {
  it('is an array', () => expect(Array.isArray(SD.DETONATIONS)).toBe(true));
  it('each has pos + radius fields', () => {
    for (const d of SD.DETONATIONS) {
      expect(Array.isArray(d.pos)).toBe(true);
      expect(typeof d.psi5_radius_km).toBe('number');
      expect(d.psi5_radius_km).toBeGreaterThan(0);
    }
  });
});

describe('SimData.METRICS', () => {
  it('has global key', () => {
    expect(SD.METRICS).toHaveProperty('global');
  });
  it('global.missiles_in_flight matches scenario state (mid-salvo has some)', () => {
    expect(SD.METRICS.global.missiles_in_flight).toBeGreaterThan(0);
  });
  it('global has casualty counter', () => {
    expect(typeof SD.METRICS.global.estimated_casualties_total).toBe('number');
  });
  it('global counts are non-negative numbers', () => {
    for (const [, v] of Object.entries(SD.METRICS.global)) {
      expect(typeof v).toBe('number');
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('SimData.EVENTS', () => {
  it('is an array', () => expect(Array.isArray(SD.EVENTS)).toBe(true));
  it('each event has t + kind', () => {
    for (const ev of SD.EVENTS) {
      expect(typeof ev.t).toBe('number');
      expect(typeof ev.kind).toBe('string');
    }
  });
  it('events sorted ascending by t', () => {
    for (let i = 1; i < SD.EVENTS.length; i++) {
      expect(SD.EVENTS[i].t).toBeGreaterThanOrEqual(SD.EVENTS[i-1].t);
    }
  });
});
