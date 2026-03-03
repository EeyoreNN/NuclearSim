/**
 * ReportExporter.js — Generate + download CSV/text/JSON reports
 * Exports: ReportExporter class
 *
 * Header of all exports includes THE QUOTE as required by spec.
 */

const THE_QUOTE = '"This is not a game. It\'s a simulation." — Principal Horizon';

export class ReportExporter {
  /**
   * @param {Object} scenarioResults — results object from CasualtyEstimator.estimateScenario()
   */
  constructor(scenarioResults) {
    this._results = scenarioResults ?? {};
  }

  /** Update the results data (call after simulation completes). */
  setResults(results) {
    this._results = results;
  }

  // ─── CSV Export ───────────────────────────────────────────────────────────

  exportCSV() {
    const rows = ['# ' + THE_QUOTE, ''];
    rows.push('lat,lon,yield_kt,burst_height_m,dead,injured,total_affected,attacker,target_city,timestamp_ms');

    const detonations = this._results.detonation_results ?? [];
    for (const d of detonations) {
      rows.push([
        d.lat        ?? '',
        d.lon        ?? '',
        d.yield_kt   ?? '',
        d.burst_height_m ?? '',
        d.immediate_dead ?? 0,
        d.injured    ?? 0,
        d.total_affected ?? 0,
        d.attacker   ?? '',
        d.target_city_id ?? '',
        d.timestamp_ms ?? 0,
      ].join(','));
    }

    this._download('nuclearsim_report.csv', rows.join('\n'), 'text/csv');
  }

  // ─── Text Report ──────────────────────────────────────────────────────────

  exportTextReport() {
    const r   = this._results;
    const fmt = n => Number(n || 0).toLocaleString();
    const now = new Date().toUTCString();
    const scenario = r.scenario_name ?? 'Custom Scenario';

    const lines = [
      '='.repeat(70),
      '  NUCLEARSIM — STRIKE ASSESSMENT REPORT',
      '  ' + THE_QUOTE,
      '='.repeat(70),
      '',
      `  SCENARIO:   ${scenario}`,
      `  DATE:       ${now}`,
      `  GENERATED:  NuclearSim v3.0 (github.com/EeyoreNN/NuclearSim)`,
      '',
      '='.repeat(70),
      '  GLOBAL SUMMARY',
      '='.repeat(70),
      '',
      `  TOTAL DEAD:        ${fmt(r.total_dead)}`,
      `  TOTAL INJURED:     ${fmt(r.total_injured)}`,
      `  TOTAL AFFECTED:    ${fmt(r.total_affected)}`,
      `  DETONATIONS:       ${(r.detonation_results ?? []).length}`,
      `  TOTAL YIELD:       ${this._fmtYield(r.total_yield_kt)}`,
      `  SOOT INJECTED:     ${(r.soot_tg ?? 0).toFixed(2)} Tg`,
      '',
      '='.repeat(70),
      '  BY NATION',
      '='.repeat(70),
      '',
    ];

    const byCountry = r.by_country ?? {};
    const sorted = Object.entries(byCountry).sort(([,a],[,b]) => (b.dead??0)-(a.dead??0));
    for (const [code, data] of sorted) {
      lines.push(`  ${code.padEnd(6)} DEAD: ${fmt(data.dead).padStart(15)}   INJURED: ${fmt(data.injured).padStart(12)}`);
    }

    lines.push('');
    lines.push('='.repeat(70));
    lines.push('  PER-STRIKE BREAKDOWN');
    lines.push('='.repeat(70));
    lines.push('');
    lines.push(`  ${'ATTACKER'.padEnd(10)} ${'TARGET'.padEnd(20)} ${'YIELD'.padEnd(10)} ${'DEAD'.padEnd(12)} ${'INJURED'.padEnd(12)} T+`);
    lines.push('  ' + '-'.repeat(68));

    const detonations = r.detonation_results ?? [];
    for (const d of detonations) {
      const attacker  = (d.attacker ?? '?').padEnd(10);
      const target    = (d.target_city_id ?? `${(d.lat??0).toFixed(1)},${(d.lon??0).toFixed(1)}`).slice(0,18).padEnd(20);
      const yieldStr  = this._fmtYield(d.yield_kt).padEnd(10);
      const dead      = fmt(d.immediate_dead ?? 0).padStart(12);
      const injured   = fmt(d.injured ?? 0).padStart(12);
      const tplus     = this._fmtTime(d.timestamp_ms ?? 0);
      lines.push(`  ${attacker} ${target} ${yieldStr} ${dead} ${injured} ${tplus}`);
    }

    lines.push('');
    lines.push('='.repeat(70));
    lines.push('  END OF REPORT — NUCLEARSIM — CLASSIFIED — EYES ONLY');
    lines.push('='.repeat(70));

    this._download('nuclearsim_report.txt', lines.join('\n'), 'text/plain');
  }

  // ─── JSON Export ──────────────────────────────────────────────────────────

  exportJSON() {
    const data = {
      _meta: {
        generator: 'NuclearSim v3.0',
        url: 'https://github.com/EeyoreNN/NuclearSim',
        quote: THE_QUOTE,
        generated_at: new Date().toISOString(),
      },
      ...this._results,
    };
    this._download('nuclearsim_scenario.json', JSON.stringify(data, null, 2), 'application/json');
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  _download(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  _fmtYield(kt) {
    if (!kt) return '0 kt';
    return kt >= 1000 ? (kt/1000).toFixed(2) + ' Mt' : kt + ' kt';
  }

  _fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `T+${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }
}
