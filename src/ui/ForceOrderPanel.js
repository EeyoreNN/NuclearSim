/**
 * ForceOrderPanel.js — Assign weapons to targets, launch sequencing
 * Exports: ForceOrderPanel class
 */

export class ForceOrderPanel {
  /**
   * @param {Object|null} forceManager — ForceManager instance (Agent 2), may be null
   * @param {Object|null} targetDatabase — TargetDatabase instance (Agent 2), may be null
   * @param {Function}    onExecute — called when user clicks EXECUTE STRIKE ORDER
   */
  constructor(forceManager, targetDatabase, onExecute) {
    this._forceManager = forceManager;
    this._targetDB     = targetDatabase;
    this._onExecute    = onExecute;

    this._render();
    this._bindEvents();
  }

  _render() {
    const container = document.getElementById('forces-panel');
    if (!container) return;

    container.innerHTML = `
      <div class="panel-header">
        &#9993; FORCE ORDER OF BATTLE
        <span class="classified-tag badge-classified">CLASSIFIED</span>
      </div>

      <div class="section-label">DEPLOYED UNITS</div>
      <div id="force-unit-list" style="max-height:280px;overflow-y:auto;margin-bottom:10px">
        <div style="color:var(--text-dim);font-size:11px;padding:8px 0">
          No units deployed. Switch to WEAPONS tab to configure and place units.
        </div>
      </div>

      <div class="section-label">ASSIGN TARGET</div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input type="text" id="force-target-search" placeholder="Search city..." style="flex:1" />
        <button class="btn" id="force-target-search-btn" style="padding:5px 10px">&#128269;</button>
      </div>
      <div id="force-target-results" style="max-height:120px;overflow-y:auto;margin-bottom:8px;font-size:11px"></div>

      <div class="section-label">STRIKE TIMING</div>
      <div class="slider-row" style="margin-bottom:8px">
        <span class="slider-label">T+</span>
        <input type="range" id="force-time-offset" min="0" max="3600" step="60" value="0" />
        <span class="slider-value" id="force-time-display">0 min</span>
      </div>

      <div class="separator"></div>

      <div class="btn-group">
        <button class="btn danger" id="btn-execute-strike" style="flex:1;justify-content:center">
          &#9889; EXECUTE STRIKE ORDER
        </button>
        <button class="btn" id="btn-clear-force" style="justify-content:center">
          &#10005; CLEAR ALL
        </button>
      </div>

      <div style="font-size:10px;color:var(--text-dim);margin-top:8px">
        &#9888; All assigned units will fire simultaneously at T+0 unless time offset is set.
      </div>
    `;
  }

  _bindEvents() {
    // Target search
    const searchInput = document.getElementById('force-target-search');
    const searchBtn   = document.getElementById('force-target-search-btn');
    const resultsEl   = document.getElementById('force-target-results');

    const doSearch = () => {
      const query = searchInput?.value?.trim();
      if (!query || !this._targetDB) {
        if (resultsEl) resultsEl.innerHTML = '';
        return;
      }
      try {
        const results = this._targetDB.searchCities(query).slice(0, 8);
        if (resultsEl) {
          resultsEl.innerHTML = results.map(c =>
            `<div class="force-target-item" data-id="${c.id}" style="
              padding:4px 6px;cursor:pointer;border-bottom:1px solid rgba(0,255,65,0.1);
              color:var(--text-secondary)
            ">
              ${c.name}, ${c.country_name} (pop. ${(c.population/1e6).toFixed(1)}M)
            </div>`
          ).join('') || '<div style="color:var(--text-dim);padding:4px">No results</div>';

          resultsEl.querySelectorAll('.force-target-item').forEach(el => {
            el.addEventListener('click', () => {
              const cityId = el.dataset.id;
              this._assignTargetToSelected(cityId, el.textContent.trim());
            });
            el.addEventListener('mouseenter', () => el.style.background = 'rgba(0,255,65,0.08)');
            el.addEventListener('mouseleave', () => el.style.background = '');
          });
        }
      } catch (e) { /* target DB not available */ }
    };

    searchBtn?.addEventListener('click', doSearch);
    searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    // Time offset slider
    const timeSlider   = document.getElementById('force-time-offset');
    const timeDisplay  = document.getElementById('force-time-display');
    timeSlider?.addEventListener('input', () => {
      const minutes = parseInt(timeSlider.value) / 60;
      if (timeDisplay) timeDisplay.textContent = minutes + ' min';
    });

    // Execute button
    document.getElementById('btn-execute-strike')?.addEventListener('click', () => {
      if (this._onExecute) this._onExecute();
      window.dispatchEvent(new CustomEvent('force:execute'));
    });

    // Clear button
    document.getElementById('btn-clear-force')?.addEventListener('click', () => {
      if (this._forceManager) this._forceManager.clearAllUnits();
      this.refreshUnitList();
      window.dispatchEvent(new CustomEvent('force:cleared'));
    });

    // Listen for force updates
    window.addEventListener('force:updated', () => this.refreshUnitList());
  }

  _assignTargetToSelected(cityId, cityName) {
    // Assign target to all selected units, or first unit without target
    if (!this._forceManager) return;
    const units = this._forceManager.getAllUnits();
    const unassigned = units.find(u => !u.targetId);
    if (unassigned) {
      this._forceManager.assignTarget(unassigned.id, cityId);
      this.refreshUnitList();
    }
    const resultsEl = document.getElementById('force-target-results');
    if (resultsEl) resultsEl.innerHTML = `<div style="color:var(--accent-green);padding:4px">&#10003; Assigned: ${cityName}</div>`;
  }

  /** Rebuild the unit list from ForceManager data. */
  refreshUnitList() {
    const listEl = document.getElementById('force-unit-list');
    if (!listEl) return;

    if (!this._forceManager) {
      listEl.innerHTML = '<div style="color:var(--text-dim);font-size:11px;padding:8px 0">Force manager not available.</div>';
      return;
    }

    const units = this._forceManager.getAllUnits();
    if (!units.length) {
      listEl.innerHTML = '<div style="color:var(--text-dim);font-size:11px;padding:8px 0">No units deployed.</div>';
      return;
    }

    listEl.innerHTML = units.map(u => {
      const cfg = u.config || {};
      const icon = cfg.type === 'SLBM' ? '&#128674;' : cfg.type === 'gravity_bomb' ? '&#9992;' : '&#128640;';
      const yieldStr = cfg.yield_kt >= 1000 ? (cfg.yield_kt/1000).toFixed(1) + ' Mt' : cfg.yield_kt + ' kt';
      const targetStr = u.targetId || '<span style="color:var(--accent-amber)">NO TARGET</span>';

      return `<div class="force-unit-row">
        <span class="force-unit-icon">${icon}</span>
        <div class="force-unit-info">
          <div class="force-unit-name">${cfg.name || 'Unknown System'}</div>
          <div class="force-unit-target">&#8594; ${targetStr}</div>
        </div>
        <span class="force-unit-yield">${yieldStr}</span>
        <button class="btn" style="padding:2px 6px;font-size:10px" data-unit-id="${u.id}" title="Remove">&#10005;</button>
      </div>`;
    }).join('');

    listEl.querySelectorAll('button[data-unit-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._forceManager?.removeUnit(btn.dataset.unitId);
        this.refreshUnitList();
      });
    });
  }
}
