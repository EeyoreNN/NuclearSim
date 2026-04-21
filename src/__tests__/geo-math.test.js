import { describe, it, expect } from 'vitest';
import { project, gcPath, projectPolyline, pathFromSegs, kmToPx } from '../globe.jsx';

describe('project(): orthographic projection', () => {
  it('projects the rotation center to (0, 0, visible)', () => {
    const [x, y, v] = project(20, -30, -30, 20, 300);
    expect(v).toBe(true);
    expect(Math.abs(x)).toBeLessThan(1e-6);
    expect(Math.abs(y)).toBeLessThan(1e-6);
  });

  it('marks the antipode as not visible', () => {
    const [, , v] = project(-20, 150, -30, 20, 300);
    expect(v).toBe(false);
  });

  it('returns (0, 0) for the invisible hemisphere', () => {
    const [x, y, v] = project(-60, 150, -30, 20, 300);
    expect(v).toBe(false);
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it('flips y so north is up on screen', () => {
    const [, yNorth] = project(80, -30, -30, 20, 300);
    const [, ySouth] = project(-40, -30, -30, 20, 300);
    expect(yNorth).toBeLessThan(ySouth); // north visible = more negative y
  });

  it('projects east-west symmetrically around center lon', () => {
    const [xE] = project(20, -15, -30, 20, 300);
    const [xW] = project(20, -45, -30, 20, 300);
    expect(xE + xW).toBeCloseTo(0, 5);
  });

  it('returns x within ±radius', () => {
    for (const lon of [-180, -90, 0, 45, 120]) {
      const [x] = project(10, lon, 0, 0, 250);
      expect(Math.abs(x)).toBeLessThanOrEqual(250 + 1e-6);
    }
  });

  it('scales linearly with radius', () => {
    const [x1] = project(10, 10, 0, 0, 100);
    const [x2] = project(10, 10, 0, 0, 300);
    expect(x2 / x1).toBeCloseTo(3, 5);
  });

  it('is deterministic', () => {
    expect(project(10, 20, 0, 0, 300)).toEqual(project(10, 20, 0, 0, 300));
  });

  it('north pole projects onto central meridian', () => {
    const [x, , v] = project(90, 0, 0, 0, 300);
    expect(v).toBe(true);
    expect(Math.abs(x)).toBeLessThan(1e-6);
  });

  it('south pole invisible when rotated to north', () => {
    const [, , v] = project(-90, 0, 0, 90, 300);
    expect(v).toBe(false);
  });

  it('equator-center-lon projects to origin', () => {
    const [x, y, v] = project(0, 50, 50, 0, 300);
    expect(v).toBe(true);
    expect(Math.abs(x)).toBeLessThan(1e-6);
    expect(Math.abs(y)).toBeLessThan(1e-6);
  });

  it('handles 180°-wrap in longitude correctly', () => {
    // 175 vs -185 are the same point
    const [x1] = project(0, 175, 0, 0, 300);
    const [x2] = project(0, -185, 0, 0, 300);
    expect(x1).toBeCloseTo(x2, 4);
  });
});

describe('gcPath(): great-circle interpolation', () => {
  it('returns a single point for identical endpoints', () => {
    const pts = gcPath([10, 20], [10, 20]);
    expect(pts).toHaveLength(1);
  });

  it('returns n+1 points for n steps', () => {
    const pts = gcPath([0, 0], [0, 90], 24);
    expect(pts).toHaveLength(25);
  });

  it('first point equals start, last equals end', () => {
    const pts = gcPath([10, 20], [40, -60], 16);
    expect(pts[0][0]).toBeCloseTo(10, 3);
    expect(pts[0][1]).toBeCloseTo(20, 3);
    expect(pts.at(-1)[0]).toBeCloseTo(40, 3);
    expect(pts.at(-1)[1]).toBeCloseTo(-60, 3);
  });

  it('stays on the unit sphere (no drift)', () => {
    const pts = gcPath([30, 30], [-30, 150], 32);
    for (const [lat, lon] of pts) {
      expect(lat).toBeGreaterThanOrEqual(-90.01);
      expect(lat).toBeLessThanOrEqual(90.01);
      expect(lon).toBeGreaterThanOrEqual(-180.01);
      expect(lon).toBeLessThanOrEqual(180.01);
    }
  });

  it('equator-to-equator along a parallel stays at zero lat', () => {
    const pts = gcPath([0, 0], [0, 90], 10);
    for (const [lat] of pts) {
      expect(Math.abs(lat)).toBeLessThan(1e-6);
    }
  });

  it('midpoint between DC and Moscow is over Arctic-ish latitudes', () => {
    const dc = [38.9, -77.0], moscow = [55.7, 37.6];
    const pts = gcPath(dc, moscow, 20);
    const midLat = pts[10][0];
    expect(midLat).toBeGreaterThan(55); // great circle bows north
  });

  it('produces n+1 monotonic steps', () => {
    const pts = gcPath([0, 0], [0, 60], 12);
    expect(pts.length).toBe(13);
  });

  it('default steps is 48', () => {
    const pts = gcPath([5, 5], [15, 15]);
    expect(pts.length).toBe(49);
  });
});

describe('kmToPx(): km-to-pixel conversion', () => {
  it('maps 6371 km to ~arc-sin 1 * R (radius)', () => {
    // A quarter circumference (0 km) maps to 0; half circumference approaches R.
    // Actual formula: sin(km/earthKm) * R. At km=6371, sin(1 rad)*R.
    const R = 300;
    const px = kmToPx(6371, R);
    expect(px).toBeCloseTo(Math.sin(1) * R, 3);
  });

  it('maps 0 km to 0 px', () => {
    expect(kmToPx(0, 300)).toBeCloseTo(0, 6);
  });

  it('scales with R', () => {
    const a = kmToPx(1000, 100);
    const b = kmToPx(1000, 300);
    expect(b / a).toBeCloseTo(3, 5);
  });

  it('is monotonic increasing up to quarter circumference', () => {
    const prev = kmToPx(500, 300);
    const next = kmToPx(1500, 300);
    expect(next).toBeGreaterThan(prev);
  });

  it('returns positive for positive km', () => {
    expect(kmToPx(100, 300)).toBeGreaterThan(0);
    expect(kmToPx(5000, 300)).toBeGreaterThan(0);
  });
});

describe('projectPolyline(): hemisphere-aware polyline projection', () => {
  it('splits when the line crosses into the invisible hemisphere', () => {
    const coords = [[0, -160], [0, -90], [0, 0], [0, 90], [0, 160]];
    const segs = projectPolyline(coords, 0, 0, 300, 500, 500);
    // At rotLon=0 rotLat=0 center, longitudes -90..90 are visible.
    // -160 and 160 are behind the sphere => they won't be part of any segment
    expect(segs.length).toBeGreaterThanOrEqual(1);
    for (const seg of segs) expect(seg.length).toBeGreaterThanOrEqual(2);
  });

  it('returns a single seg for a ring entirely on the visible side', () => {
    const coords = [[10, 10], [20, 10], [20, 20], [10, 20]];
    const segs = projectPolyline(coords, 10, 10, 300, 500, 500);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toHaveLength(4);
  });

  it('returns [] for a ring entirely on the invisible side', () => {
    const coords = [[0, 170], [0, 175], [5, 175], [5, 170]];
    const segs = projectPolyline(coords, -10, 0, 300, 500, 500);
    expect(segs).toEqual([]);
  });

  it('applies cx/cy translation', () => {
    const segs = projectPolyline([[0, 0]], 0, 0, 300, 400, 250);
    // Single point → not a segment (<2), so empty
    expect(segs).toEqual([]);
  });

  it('ignores 1-point partial segments', () => {
    const segs = projectPolyline([[0, -91], [0, 0], [0, 91]], 0, 0, 300, 0, 0);
    // only (0,0) visible, that's a single point — discarded
    expect(segs).toEqual([]);
  });
});

describe('pathFromSegs(): SVG path string builder', () => {
  it('returns a string beginning with M for each segment', () => {
    const p = pathFromSegs([[[0, 0], [10, 10]], [[20, 20], [30, 30]]]);
    expect(p.split('M').length - 1).toBe(2);
  });

  it('closes each segment with Z', () => {
    const p = pathFromSegs([[[0, 0], [10, 0], [10, 10]]]);
    expect(p.endsWith(' Z')).toBe(true);
  });

  it('returns empty string for no segments', () => {
    expect(pathFromSegs([])).toBe('');
  });
});
