// APP-6 / NATO symbology — simplified, readable at small sizes.
// Frame shape by affiliation: friendly = rect, hostile = diamond, unknown = quad-arc, neutral = square.
// Icon inside encodes class (aircraft/missile/ship/sub/ground).
// Returns an inline SVG string given {cls, side, sub, state, size}.

window.NATO = (function () {
  const SIDE_AFFIL = {
    usa: 'F', gbr: 'F', fra: 'F', deu: 'F', ita: 'F', can: 'F', nld: 'F', pol: 'F', tur: 'F',
    nor: 'F', esp: 'F', jpn: 'F', kor: 'F', aus: 'F', isr: 'F',
    rus: 'H', chn: 'H', prk: 'H', irn: 'H',
    ind: 'N', pak: 'N', bra: 'N',
  };

  const AFFIL_COLORS = {
    F: { stroke: '#6b9ad6', fill: 'rgba(74,122,184,0.18)' },
    H: { stroke: '#d86f68', fill: 'rgba(184,81,74,0.18)' },
    N: { stroke: '#5a9a6a', fill: 'rgba(90,154,106,0.16)' },
    U: { stroke: '#d9b85e', fill: 'rgba(196,162,74,0.16)' },
  };

  function affilOf(side) {
    return SIDE_AFFIL[side] || 'U';
  }

  // Frame paths (in 100x100 viewBox)
  function frame(affil) {
    if (affil === 'F') return 'M20,28 H80 V72 H20 Z';                        // rect
    if (affil === 'H') return 'M50,18 L82,50 L50,82 L18,50 Z';               // diamond
    if (affil === 'N') return 'M25,28 H75 V72 H25 Z';                        // square-ish (neutral, green)
    return 'M20,45 Q20,20 50,20 Q80,20 80,45 L80,55 Q80,80 50,80 Q20,80 20,55 Z'; // quatrefoil-ish unknown
  }

  // Class → inline glyph paths in viewBox 100x100 (inside the frame)
  const GLYPHS = {
    // Aircraft — inverted shallow V
    fighter:      '<path d="M28 48 L50 40 L72 48 M50 40 V60" stroke-width="3" fill="none"/>',
    bomber:       '<path d="M22 48 L50 38 L78 48 M50 38 V62 M40 50 L60 50" stroke-width="3" fill="none"/>',
    awacs:        '<path d="M28 48 L50 40 L72 48 M50 40 V60" stroke-width="3" fill="none"/><circle cx="50" cy="44" r="6" fill="none" stroke-width="2.5"/>',
    tanker:       '<path d="M28 48 L50 40 L72 48 M50 40 V60 M60 52 L72 58" stroke-width="3" fill="none"/>',
    elint:        '<path d="M28 48 L50 40 L72 48 M50 40 V60" stroke-width="3" fill="none"/><path d="M44 56 Q50 62 56 56" stroke-width="2" fill="none"/>',
    recon_uav:    '<path d="M30 50 L50 42 L70 50 M50 42 V58" stroke-width="2.5" fill="none"/>',
    combat_uav:   '<path d="M30 50 L50 42 L70 50 M50 42 V58" stroke-width="2.5" fill="none"/>',

    // Missiles — upward arrow/diamond
    icbm:         '<path d="M50 30 L58 46 L54 46 L54 68 L46 68 L46 46 L42 46 Z" stroke-width="2" fill="currentColor"/>',
    slbm:         '<path d="M50 30 L58 46 L54 46 L54 68 L46 68 L46 46 L42 46 Z" stroke-width="2" fill="currentColor"/><path d="M38 72 H62" stroke-width="2.5"/>',
    mrbm:         '<path d="M50 32 L56 46 L54 46 L54 68 L46 68 L46 46 L44 46 Z" stroke-width="2" fill="currentColor"/>',
    srbm:         '<path d="M50 34 L55 46 L53 46 L53 66 L47 66 L47 46 L45 46 Z" stroke-width="2" fill="currentColor"/>',
    cruise_alcm:  '<path d="M32 52 L64 52 L72 48 L64 44 Z M38 52 V58 M46 52 V58" stroke-width="2" fill="currentColor"/>',
    cruise_slcm:  '<path d="M32 52 L64 52 L72 48 L64 44 Z" stroke-width="2" fill="currentColor"/>',
    cruise_glcm:  '<path d="M32 52 L64 52 L72 48 L64 44 Z" stroke-width="2" fill="currentColor"/>',
    mirv_bus:     '<path d="M44 38 H56 V52 L62 66 L38 66 L44 52 Z" stroke-width="2" fill="none"/>',
    reentry_vehicle: '<path d="M46 36 L54 36 L58 54 L42 54 Z M46 54 L54 54 L50 70 Z" stroke-width="2" fill="currentColor"/>',
    decoy:        '<path d="M46 36 L54 36 L58 54 L42 54 Z M46 54 L54 54 L50 70 Z" stroke-width="1.5" fill="none" stroke-dasharray="2 2"/>',

    // Interceptors
    abm_interceptor: '<path d="M50 34 L58 50 L54 50 L54 66 L46 66 L46 50 L42 50 Z" stroke-width="2" fill="none"/><circle cx="50" cy="50" r="16" fill="none" stroke-width="1" stroke-dasharray="2 2"/>',
    sam_interceptor: '<path d="M50 38 L56 50 L53 50 L53 64 L47 64 L47 50 L44 50 Z" stroke-width="2" fill="none"/>',
    aam:          '<path d="M36 52 H64 L70 50 L64 48 H36 Z" stroke-width="2" fill="none"/>',

    // Ships — APP-6: hull arc above waterline
    carrier:      '<path d="M26 58 H74 M30 58 Q50 42 70 58" stroke-width="2" fill="none"/><path d="M42 50 H58" stroke-width="2"/><rect x="46" y="44" width="8" height="5" fill="none" stroke-width="1.4"/>',
    destroyer:    '<path d="M28 58 H72 M32 58 Q50 44 68 58" stroke-width="2" fill="none"/><path d="M48 48 V54 M52 48 V54" stroke-width="1.6"/>',
    cruiser:      '<path d="M28 58 H72 M32 58 Q50 44 68 58" stroke-width="2" fill="none"/><path d="M46 48 H54 V54 H46 Z" stroke-width="1.6" fill="none"/>',
    frigate:      '<path d="M30 58 H70 M34 58 Q50 46 66 58" stroke-width="2" fill="none"/><path d="M50 48 V54" stroke-width="1.6"/>',

    // Subs — APP-6: semicircle below waterline
    ssbn:         '<path d="M26 48 H74" stroke-width="2"/><path d="M30 48 Q50 70 70 48" stroke-width="2" fill="none"/><path d="M50 38 V48 M44 38 H56" stroke-width="1.6"/>',
    ssn:          '<path d="M28 48 H72" stroke-width="2"/><path d="M32 48 Q50 68 68 48" stroke-width="2" fill="none"/><path d="M50 40 V48" stroke-width="1.6"/>',
    ssk:          '<path d="M30 48 H70" stroke-width="2"/><path d="M34 48 Q50 66 66 48" stroke-width="2" fill="none"/>',

    // Ground / installations
    silo:         '<rect x="38" y="36" width="24" height="28" fill="none" stroke-width="2"/><path d="M44 42 V58 M50 42 V58 M56 42 V58" stroke-width="1.5"/>',
    tel:          '<path d="M28 62 H72 M34 62 V54 L58 54 L66 48" stroke-width="2" fill="none"/><circle cx="36" cy="66" r="3" stroke-width="1.5" fill="none"/><circle cx="64" cy="66" r="3" stroke-width="1.5" fill="none"/>',
    sam_site:     '<path d="M30 62 L50 34 L70 62 Z" stroke-width="2" fill="none"/><path d="M44 56 H56" stroke-width="1.5"/>',
    abm_site:     '<path d="M30 62 L50 34 L70 62 Z" stroke-width="2" fill="none"/><circle cx="50" cy="50" r="7" stroke-width="1.5" fill="none"/>',
    radar_site:   '<path d="M32 62 Q50 30 68 62" stroke-width="2" fill="none"/><path d="M36 62 Q50 42 64 62 M40 62 Q50 50 60 62" stroke-width="1" fill="none"/>',
    oth_radar:    '<path d="M28 64 Q50 28 72 64" stroke-width="2" fill="none"/><path d="M34 64 Q50 40 66 64 M40 64 Q50 50 60 64" stroke-width="1" fill="none"/>',
    space_radar:  '<circle cx="50" cy="48" r="12" stroke-width="2" fill="none"/><path d="M50 36 V24 M50 60 V72 M38 48 H26 M62 48 H74" stroke-width="1.5"/>',
    airbase:      '<circle cx="50" cy="50" r="18" stroke-width="2" fill="none"/><path d="M32 50 H68 M50 32 V68" stroke-width="1.5"/>',
    naval_base:   '<path d="M30 62 H70 M50 38 V62 M38 50 H62" stroke-width="2" fill="none"/><path d="M50 38 A6 6 0 0 1 56 44" stroke-width="1.5" fill="none"/>',
    nc3_node:     '<rect x="36" y="40" width="28" height="20" fill="none" stroke-width="2"/><path d="M42 48 H58 M42 54 H58" stroke-width="1.5"/>',
    command_bunker: '<path d="M32 62 V48 Q32 38 50 38 Q68 38 68 48 V62 Z" stroke-width="2" fill="none"/><path d="M44 62 V52 H56 V62" stroke-width="1.5"/>',
    satellite_early_warning: '<rect x="42" y="42" width="16" height="16" fill="none" stroke-width="2"/><path d="M28 50 L42 50 M58 50 L72 50" stroke-width="1.5"/>',
  };

  function renderIcon(opts) {
    const { cls, side, size = 20, state, frozen } = opts;
    const affil = affilOf(side);
    const c = AFFIL_COLORS[affil];
    const glyph = GLYPHS[cls] || '<circle cx="50" cy="50" r="8" fill="currentColor"/>';
    const framePath = frame(affil);
    const dashed = state === 'destroyed' || frozen ? 'stroke-dasharray="3 2" opacity="0.55"' : '';
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="color:${c.stroke};overflow:visible">
      <path d="${framePath}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.2" ${dashed}/>
      <g stroke="${c.stroke}" ${dashed}>${glyph}</g>
    </svg>`;
  }

  function colorFor(side) {
    const affil = affilOf(side);
    return AFFIL_COLORS[affil];
  }

  return { renderIcon, affilOf, colorFor, AFFIL_COLORS };
})();
