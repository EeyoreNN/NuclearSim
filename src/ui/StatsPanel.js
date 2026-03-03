/**
 * StatsPanel.js — Live casualty counter, yield totals, damage summary
 * Exports: StatsPanel class
 */

const fmt = n => (n >= 1e9 ? (n/1e9).toFixed(2)+'B'
                : n >= 1e6 ? (n/1e6).toFixed(1)+'M'
                : n >= 1e3 ? (n/1e3).toFixed(0)+'K'
                : n.toString());

export class StatsPanel {
  constructor() {
    this._data = {
      total_dead:     0,
      total_injured:  0,
      total_affected: 0,
      warheads:       0,
      total_yield_kt: 0,
      soot_tg:        0,
      by_country:     {},
      detonations:    0,
    };
    this._render();
    this._bindEvents();
  }

  _render() {
    const container = document.getElementById('stats-panel');
    if (!container) return;

    container.innerHTML = `
      <div class="panel-header">
        &#9760; DAMAGE ASSESSMENT
        <span class="classified-tag badge-classified">EYES ONLY</span>
      </div>

      <!-- Casualties -->
      <div class="stats-section">
        <div class="stats-section-title">&#9760; ESTIMATED CASUALTIES</div>
        <div style="margin-bottom:8px">
          <span class="counter-value" id="stat-dead">0</span>
          <div class="stat-row">
            <span class="stat-label">DEAD</span>
            <span class="stat-value red" id="stat-dead-display">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">INJURED</span>
            <span class="stat-value amber" id="stat-injured">0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">AFFECTED</span>
            <span class="stat-value blue" id="stat-affected">0</span>
          </div>
        </div>
      </div>

      <!-- Weapons deployed -->
      <div class="stats-section">
        <div class="stats-section-title">&#9889; WEAPONS DEPLOYED</div>
        <div class="stat-row">
          <span class="stat-label">DETONATIONS</span>
          <span class="stat-value" id="stat-detonations">0</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">WARHEADS USED</span>
          <span class="stat-value" id="stat-warheads">0</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">TOTAL YIELD</span>
          <span class="stat-value amber" id="stat-yield">0 kt</span>
        </div>
      </div>

      <!-- Nuclear winter -->
      <div class="stats-section">
        <div class="stats-section-title">&#10052; NUCLEAR WINTER</div>
        <div class="stat-row">
          <span class="stat-label">SOOT INJECTED</span>
          <span class="stat-value blue" id="stat-soot">0 Tg</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">SEVERITY</span>
          <span class="stat-value" id="stat-winter-severity" style="color:var(--accent-green)">NONE</span>
        </div>
      </div>

      <!-- By country -->
      <div class="stats-section">
        <div class="stats-section-title">BY NATION</div>
        <div class="by-country-list" id="stat-by-country">
          <span style="color:var(--text-dim);font-size:11px">No data yet</span>
        </div>
      </div>

      <!-- Export button -->
      <button class="btn primary" id="btn-export-report" style="width:100%;justify-content:center;margin-top:8px">
        &#128196; EXPORT REPORT
      </button>
    `;
  }

  _bindEvents() {
    document.getElementById('btn-export-report')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ui:export_report', { detail: { data: this._data } }));
    });

    // Listen for simulation events
    window.addEventListener('sim:casualties_updated', e => {
      if (e.detail?.results) this.update(e.detail.results);
    });
  }

  /**
   * Update panel with new results data.
   * @param {Object} results — from CasualtyEstimator.estimateScenario()
   */
  update(results) {
    this._data = { ...this._data, ...results };

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('stat-dead',         fmt(results.total_dead     ?? 0));
    set('stat-dead-display', fmt(results.total_dead     ?? 0));
    set('stat-injured',      fmt(results.total_injured  ?? 0));
    set('stat-affected',     fmt(results.total_affected ?? 0));
    set('stat-detonations',  results.detonation_results?.length ?? 0);

    const warheads = results.warheads ?? results.detonation_results?.length ?? 0;
    set('stat-warheads', warheads);

    const yieldKt = results.total_yield_kt ?? 0;
    set('stat-yield', yieldKt >= 1000 ? (yieldKt/1000).toFixed(1) + ' Mt' : yieldKt + ' kt');

    const soot = results.soot_tg ?? 0;
    set('stat-soot', soot.toFixed(2) + ' Tg');

    // Nuclear winter severity
    let severity = 'NONE';
    let severityColor = 'var(--accent-green)';
    if (soot >= 5)  { severity = 'NUCLEAR WINTER'; severityColor = 'var(--accent-red)'; }
    else if (soot >= 1) { severity = 'REGIONAL';   severityColor = '#FF6600'; }
    else if (soot > 0)  { severity = 'MINIMAL';    severityColor = 'var(--accent-amber)'; }
    const sevEl = document.getElementById('stat-winter-severity');
    if (sevEl) { sevEl.textContent = severity; sevEl.style.color = severityColor; }

    // By country
    const byCountry = results.by_country ?? {};
    const countryEl = document.getElementById('stat-by-country');
    if (countryEl) {
      const entries = Object.entries(byCountry)
        .sort(([,a],[,b]) => (b.dead ?? 0) - (a.dead ?? 0))
        .slice(0, 10);

      if (entries.length) {
        countryEl.innerHTML = entries.map(([code, data]) =>
          `<div class="stat-row">
            <span class="stat-label">${code}</span>
            <span class="stat-value red">${fmt(data.dead ?? 0)} dead</span>
          </div>`
        ).join('');
      } else {
        countryEl.innerHTML = '<span style="color:var(--text-dim);font-size:11px">No data yet</span>';
      }
    }
  }

  /**
   * Increment detonation counter (called per strike).
   * @param {number} yieldKt
   */
  addDetonation(yieldKt = 0) {
    this._data.detonations = (this._data.detonations || 0) + 1;
    this._data.total_yield_kt = (this._data.total_yield_kt || 0) + yieldKt;

    const d = document.getElementById('stat-detonations');
    if (d) d.textContent = this._data.detonations;

    const y = document.getElementById('stat-yield');
    const kt = this._data.total_yield_kt;
    if (y) y.textContent = kt >= 1000 ? (kt/1000).toFixed(1) + ' Mt' : kt + ' kt';
  }

  reset() {
    this._data = {
      total_dead:0, total_injured:0, total_affected:0,
      warheads:0, total_yield_kt:0, soot_tg:0, by_country:{}, detonations:0,
    };
    this.update({ total_dead:0, total_injured:0, total_affected:0, soot_tg:0, by_country:{}, detonation_results:[], total_yield_kt:0 });
  }
}
