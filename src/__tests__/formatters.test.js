import { describe, it, expect } from 'vitest';
import { formatNum, formatAlt, fmtLat, fmtLon, fmtDur } from '../panels.jsx';

describe('formatNum', () => {
  it('returns em-dash for null / undefined', () => {
    expect(formatNum(null)).toBe('—');
    expect(formatNum(undefined)).toBe('—');
  });
  it('formats small numbers with locale string', () => {
    expect(formatNum(0)).toBe('0');
    expect(formatNum(42)).toBe('42');
    expect(formatNum(999)).toBe('999');
  });
  it('uses k suffix for thousands', () => {
    expect(formatNum(1500)).toBe('1.5k');
    expect(formatNum(9999)).toBe('10.0k');
  });
  it('uses M suffix for millions', () => {
    expect(formatNum(1_500_000)).toBe('1.5M');
    expect(formatNum(12_000_000)).toBe('12M');
  });
  it('rounds to whole integer above threshold', () => {
    expect(formatNum(15_000)).toBe('15k');
  });
  it('keeps 3-digit locale separator for 1000 (exact boundary)', () => {
    // 1000 → falls into >=1000 branch -> 1.0k
    expect(formatNum(1000)).toBe('1.0k');
  });
});

describe('formatAlt', () => {
  it('em-dashes null', () => {
    expect(formatAlt(null)).toBe('—');
  });
  it('SURF for sea-level 0', () => {
    expect(formatAlt(0)).toBe('SURF');
  });
  it('negative depth → m SUB suffix', () => {
    expect(formatAlt(-200)).toBe('-200 m SUB');
  });
  it('low altitude in meters', () => {
    expect(formatAlt(150)).toBe('150 m');
  });
  it('kilometer scale 1–1000 km', () => {
    expect(formatAlt(12_000)).toBe('12.0 km');
  });
  it('megameter scale ≥ 1 Mm', () => {
    expect(formatAlt(1_200_000)).toBe('1.20 Mm');
  });
});

describe('fmtLat', () => {
  it('positive = N', () => {
    expect(fmtLat(38.9)).toMatch(/38°.* N$/);
  });
  it('negative = S', () => {
    expect(fmtLat(-38.9)).toMatch(/ S$/);
  });
  it('zero is N', () => {
    expect(fmtLat(0)).toMatch(/ N$/);
  });
  it('formats degrees with zero-pad 2-digit', () => {
    const s = fmtLat(5.5);
    expect(s.startsWith('05°')).toBe(true);
  });
  it('includes apostrophe minutes', () => {
    expect(fmtLat(38.9)).toContain("'");
  });
});

describe('fmtLon', () => {
  it('positive = E', () => {
    expect(fmtLon(45)).toMatch(/ E$/);
  });
  it('negative = W', () => {
    expect(fmtLon(-75)).toMatch(/ W$/);
  });
  it('zero = E', () => {
    expect(fmtLon(0)).toMatch(/ E$/);
  });
  it('formats degrees with zero-pad 3-digit', () => {
    expect(fmtLon(5.5).startsWith('005°')).toBe(true);
  });
  it('handles 180', () => {
    expect(fmtLon(180)).toMatch(/180°.* E$/);
  });
});

describe('fmtDur', () => {
  it('zero → 00m00s', () => {
    expect(fmtDur(0)).toBe('00m00s');
  });
  it('negative clamps to zero', () => {
    expect(fmtDur(-5)).toBe('00m00s');
  });
  it('under a minute', () => {
    expect(fmtDur(45)).toBe('00m45s');
  });
  it('over a minute', () => {
    expect(fmtDur(125)).toBe('02m05s');
  });
  it('hours included when ≥3600s', () => {
    expect(fmtDur(3671)).toMatch(/^\d+h01m11s$/);
  });
  it('double-digit hours', () => {
    expect(fmtDur(36_000)).toMatch(/^\d+h00m00s$/);
  });
});
