import { describe, it, expect, beforeAll } from 'vitest';

let NATO;
beforeAll(async () => {
  await import('../nato.js');
  NATO = window.NATO;
});

describe('NATO.affilOf: side → affiliation letter', () => {
  it('USA is Friendly', () => expect(NATO.affilOf('usa')).toBe('F'));
  it('GBR/FRA/JPN are Friendly', () => {
    expect(NATO.affilOf('gbr')).toBe('F');
    expect(NATO.affilOf('fra')).toBe('F');
    expect(NATO.affilOf('jpn')).toBe('F');
  });
  it('RUS/CHN/PRK/IRN are Hostile', () => {
    expect(NATO.affilOf('rus')).toBe('H');
    expect(NATO.affilOf('chn')).toBe('H');
    expect(NATO.affilOf('prk')).toBe('H');
    expect(NATO.affilOf('irn')).toBe('H');
  });
  it('IND/PAK/BRA are Neutral', () => {
    expect(NATO.affilOf('ind')).toBe('N');
    expect(NATO.affilOf('pak')).toBe('N');
    expect(NATO.affilOf('bra')).toBe('N');
  });
  it('ISR is Friendly in this dataset', () => {
    expect(NATO.affilOf('isr')).toBe('F');
  });
  it('unknown side → U', () => {
    expect(NATO.affilOf('xxx')).toBe('U');
    expect(NATO.affilOf(undefined)).toBe('U');
  });
});

describe('NATO.AFFIL_COLORS palette', () => {
  it('exposes F/H/N/U keys', () => {
    for (const k of ['F', 'H', 'N', 'U']) {
      expect(NATO.AFFIL_COLORS[k]).toBeDefined();
      expect(NATO.AFFIL_COLORS[k].stroke).toMatch(/^#[0-9a-f]{6}$/i);
      expect(NATO.AFFIL_COLORS[k].fill).toContain('rgba');
    }
  });
  it('friendly is blue-ish, hostile is red-ish, neutral is green-ish', () => {
    expect(NATO.AFFIL_COLORS.F.stroke.toLowerCase()).not.toBe(NATO.AFFIL_COLORS.H.stroke.toLowerCase());
    expect(NATO.AFFIL_COLORS.N.stroke.toLowerCase()).not.toBe(NATO.AFFIL_COLORS.F.stroke.toLowerCase());
  });
});

describe('NATO.colorFor passes through the affiliation color', () => {
  it('friendly side yields F color', () => {
    expect(NATO.colorFor('usa').stroke).toBe(NATO.AFFIL_COLORS.F.stroke);
  });
  it('hostile side yields H color', () => {
    expect(NATO.colorFor('rus').stroke).toBe(NATO.AFFIL_COLORS.H.stroke);
  });
});

describe('NATO.renderIcon: SVG output', () => {
  it('returns a non-empty SVG string', () => {
    const svg = NATO.renderIcon({ cls: 'fighter', side: 'usa' });
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('viewBox');
    expect(svg).toContain('</svg>');
  });

  it('respects size prop', () => {
    const svg = NATO.renderIcon({ cls: 'icbm', side: 'rus', size: 30 });
    expect(svg).toContain('width="30"');
    expect(svg).toContain('height="30"');
  });

  it('uses rect frame for friendly affiliation', () => {
    const svg = NATO.renderIcon({ cls: 'fighter', side: 'usa' });
    // friendly rectangular frame path literal
    expect(svg).toContain('M20,28 H80 V72 H20 Z');
  });

  it('uses diamond frame for hostile', () => {
    const svg = NATO.renderIcon({ cls: 'bomber', side: 'rus' });
    expect(svg).toContain('M50,18 L82,50 L50,82 L18,50 Z');
  });

  it('uses square frame for neutral', () => {
    const svg = NATO.renderIcon({ cls: 'fighter', side: 'ind' });
    expect(svg).toContain('M25,28 H75 V72 H25 Z');
  });

  it('unknown side gets quatrefoil frame', () => {
    const svg = NATO.renderIcon({ cls: 'bomber', side: 'xyz' });
    expect(svg).toContain('Q20,80 20,55 Z');
  });

  it('destroyed state applies dashed stroke & reduced opacity', () => {
    const svg = NATO.renderIcon({ cls: 'fighter', side: 'usa', state: 'destroyed' });
    expect(svg).toContain('stroke-dasharray');
    expect(svg).toContain('opacity');
  });

  it('frozen flag also applies dashed stroke', () => {
    const svg = NATO.renderIcon({ cls: 'bomber', side: 'usa', frozen: true });
    expect(svg).toContain('stroke-dasharray');
  });

  it('unknown cls falls back to dot glyph', () => {
    const svg = NATO.renderIcon({ cls: 'not-a-real-class', side: 'usa' });
    expect(svg).toContain('<circle');
  });

  it('has different glyphs for icbm vs bomber vs ssbn', () => {
    const a = NATO.renderIcon({ cls: 'icbm', side: 'rus' });
    const b = NATO.renderIcon({ cls: 'bomber', side: 'rus' });
    const c = NATO.renderIcon({ cls: 'ssbn', side: 'rus' });
    expect(a).not.toBe(b);
    expect(b).not.toBe(c);
  });

  it('friendly color appears in the stroke style', () => {
    const svg = NATO.renderIcon({ cls: 'fighter', side: 'usa' });
    expect(svg.toLowerCase()).toContain(NATO.AFFIL_COLORS.F.stroke.toLowerCase());
  });

  it('hostile color appears in the fill', () => {
    const svg = NATO.renderIcon({ cls: 'bomber', side: 'rus' });
    expect(svg).toContain(NATO.AFFIL_COLORS.H.fill);
  });

  it('has unique glyphs for carrier/destroyer/cruiser/frigate', () => {
    const classes = ['carrier', 'destroyer', 'cruiser', 'frigate'];
    const set = new Set(classes.map(c => NATO.renderIcon({ cls: c, side: 'usa' })));
    expect(set.size).toBe(classes.length);
  });

  it('has unique glyphs for ssbn/ssn/ssk', () => {
    const set = new Set(['ssbn', 'ssn', 'ssk'].map(c => NATO.renderIcon({ cls: c, side: 'rus' })));
    expect(set.size).toBe(3);
  });

  it('default size is 20', () => {
    const svg = NATO.renderIcon({ cls: 'fighter', side: 'usa' });
    expect(svg).toContain('width="20"');
    expect(svg).toContain('height="20"');
  });
});
