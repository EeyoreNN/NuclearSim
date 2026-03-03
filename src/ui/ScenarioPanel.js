/**
 * ScenarioPanel.js — Predefined scenario selector
 * Exports: ScenarioPanel class
 */

export class ScenarioPanel {
  /**
   * @param {Function} onLoadScenario — callback(scenarioObject) when user loads a scenario
   */
  constructor(onLoadScenario) {
    this._onLoadScenario = onLoadScenario;
    this._scenarios = [];
    this._selected  = null;
  }

  /**
   * Render scenario cards into #scenarios-panel.
   * @param {Object[]} scenarios — array of scenario objects
   */
  render(scenarios) {
    this._scenarios = scenarios;
    const container = document.getElementById('scenarios-panel');
    if (!container) return;

    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `
      &#9760; PREDEFINED SCENARIOS
      <span class="classified-tag badge-classified">EYES ONLY</span>
    `;
    container.appendChild(header);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:10px;color:var(--text-dim);margin-bottom:12px;line-height:1.5';
    subtitle.textContent = 'Select a scenario to load. Detonation times scaled to simulation speed.';
    container.appendChild(subtitle);

    // Scenario cards
    scenarios.forEach(s => {
      const card = this._buildCard(s);
      container.appendChild(card);
    });

    // Load button
    this._loadBtn = document.createElement('button');
    this._loadBtn.className = 'btn primary';
    this._loadBtn.style.cssText = 'width:100%;margin-top:10px;justify-content:center';
    this._loadBtn.textContent = 'LOAD SELECTED SCENARIO';
    this._loadBtn.disabled = true;
    this._loadBtn.addEventListener('click', () => {
      if (this._selected && this._onLoadScenario) {
        this._onLoadScenario(this._selected);
        window.dispatchEvent(new CustomEvent('scenario:loaded', { detail: { scenario: this._selected } }));
      }
    });
    container.appendChild(this._loadBtn);
  }

  _buildCard(scenario) {
    const defconColors = { 1: '#FF0040', 2: '#FF6600', 3: '#FFB800', 4: '#FFFF00', 5: '#00FF41' };
    const defcon = scenario.defcon ?? 3;
    const color  = defconColors[defcon] ?? '#00FF41';

    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.style.borderLeft = `3px solid ${color}`;

    card.innerHTML = `
      <div class="scenario-name">${scenario.name}</div>
      <div class="scenario-participants">${(scenario.participants || []).join(' vs ')}</div>
      <div class="scenario-desc">${scenario.description || ''}</div>
      <div class="scenario-meta">
        <span>&#9888; ${(scenario.strikes || []).length} STRIKES</span>
        <span>&#9760; ${scenario.total_warheads || '?'} WARHEADS</span>
        <span class="scenario-defcon" style="color:${color}">DEFCON ${defcon}</span>
        <span>${scenario.estimated_casualties_range || ''}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      this._selected = scenario;
      if (this._loadBtn) this._loadBtn.disabled = false;
    });

    return card;
  }
}
