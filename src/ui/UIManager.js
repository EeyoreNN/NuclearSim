/**
 * UIManager.js — Coordinates all UI panels and interactions
 */
import { NATIONS, WEAPONS, getWeaponsByNation, formatYield } from '../data/arsenal.js';
import { SCENARIOS } from '../data/scenarios.js';
import { estimateNuclearWinter, formatNumber } from '../simulation/BlastPhysics.js';

export class UIManager {
  constructor() {
    this._hintTimeout = null;
    this._onWeaponSelect  = null;
    this._onScenarioPlay  = null;
    this._onScenarioStop  = null;
    this._onDetonateAll   = null;
    this._onAutoTarget    = null;
    this._onClearTargets  = null;
    this._onReset         = null;
    this._onAirburstChange = null;
    this._onOptionChange  = null;
    this._onSpeedChange   = null;

    this._selectedNation  = null;
    this._selectedWeapon  = null;
    this._selectedScenario = null;

    this._setupPanelToggles();
    this._setupTabs();
    this._buildCountryGrid();
    this._buildScenarioList();
    this._setupButtons();
    this._setupOptions();
  }

  // ---- Public callback setters ----
  onWeaponSelect(fn)   { this._onWeaponSelect   = fn; }
  onScenarioPlay(fn)   { this._onScenarioPlay   = fn; }
  onScenarioStop(fn)   { this._onScenarioStop   = fn; }
  onDetonateAll(fn)    { this._onDetonateAll    = fn; }
  onAutoTarget(fn)     { this._onAutoTarget     = fn; }
  onClearTargets(fn)   { this._onClearTargets   = fn; }
  onReset(fn)          { this._onReset          = fn; }
  onAirburstChange(fn) { this._onAirburstChange = fn; }
  onOptionChange(fn)   { this._onOptionChange   = fn; }
  onSpeedChange(fn)    { this._onSpeedChange    = fn; }

  // ---- Panel toggles ----
  _setupPanelToggles() {
    const left  = document.getElementById('panel-left');
    const right = document.getElementById('panel-right');

    document.getElementById('btn-toggle-left')?.addEventListener('click', () => left.classList.toggle('hidden'));
    document.getElementById('btn-toggle-right')?.addEventListener('click', () => right.classList.toggle('hidden'));
    document.getElementById('btn-close-left')?.addEventListener('click', () => left.classList.add('hidden'));
    document.getElementById('btn-close-right')?.addEventListener('click', () => right.classList.add('hidden'));
  }

  _setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`)?.classList.add('active');
      });
    });
  }

  // ---- Country grid ----
  _buildCountryGrid() {
    const grid = document.getElementById('country-grid');
    if (!grid) return;
    for (const [code, nation] of Object.entries(NATIONS)) {
      const btn = document.createElement('button');
      btn.className   = 'country-btn';
      btn.textContent = code;
      btn.title       = `${nation.name} — ${nation.stockpile} warheads`;
      btn.addEventListener('click', () => this._selectNation(code, btn));
      grid.appendChild(btn);
    }
  }

  _selectNation(code, btn) {
    this._selectedNation = code;
    document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this._buildWeaponList(code);
  }

  // ---- Weapon list ----
  _buildWeaponList(nationCode) {
    const list = document.getElementById('weapon-list');
    if (!list) return;
    list.innerHTML = '';

    const weapons = getWeaponsByNation(nationCode);
    weapons.forEach(w => {
      const item = document.createElement('div');
      item.className = 'weapon-item';
      item.innerHTML = `
        <span>${w.name}</span>
        <span class="weapon-yield">${formatYield(w.yield_kt)}</span>
      `;
      item.addEventListener('click', () => this._selectWeapon(w, item));
      list.appendChild(item);
    });
  }

  _selectWeapon(weapon, el) {
    this._selectedWeapon = weapon;
    document.querySelectorAll('.weapon-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    this._renderWeaponDetail(weapon);
    if (this._onWeaponSelect) this._onWeaponSelect(weapon);
    document.getElementById('bottom-weapon').textContent = `WEAPON: ${weapon.name}`;
  }

  _renderWeaponDetail(w) {
    const el = document.getElementById('weapon-detail');
    if (!el) return;
    el.innerHTML = `
      <div class="prop-row"><span class="prop-key">Type</span><span class="prop-val">${w.type}</span></div>
      <div class="prop-row"><span class="prop-key">Yield</span><span class="prop-val">${formatYield(w.yield_kt)}</span></div>
      <div class="prop-row"><span class="prop-key">MIRVs</span><span class="prop-val">${w.mirv}</span></div>
      <div class="prop-row"><span class="prop-key">Range</span><span class="prop-val">${w.range_km ? w.range_km.toLocaleString() + ' km' : 'Unguided'}</span></div>
      <div class="prop-row"><span class="prop-key">CEP</span><span class="prop-val">${w.cep_m} m</span></div>
      <div class="prop-row"><span class="prop-key">Deployed</span><span class="prop-val">${w.inventory}</span></div>
      <div class="prop-row"><span class="prop-key">In service</span><span class="prop-val">${w.year}</span></div>
      <div style="margin-top:8px;font-size:10px;color:var(--text-dim);line-height:1.6">${w.description}</div>
    `;
  }

  // ---- Scenarios ----
  _buildScenarioList() {
    const list = document.getElementById('scenario-list');
    if (!list) return;
    SCENARIOS.forEach(s => {
      const item = document.createElement('div');
      item.className = 'scenario-item';
      item.innerHTML = `
        <div class="scenario-name">${s.name}</div>
        <div class="scenario-desc">${s.description}</div>
        <div class="scenario-meta">Yield: ${s.totalYield} &nbsp;|&nbsp; Events: ${s.events.length}</div>
      `;
      item.style.borderLeft = `3px solid ${s.color}`;
      item.addEventListener('click', () => {
        document.querySelectorAll('.scenario-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this._selectedScenario = s;
        document.getElementById('btn-play-scenario').disabled = false;
      });
      list.appendChild(item);
    });
  }

  // ---- Action buttons ----
  _setupButtons() {
    document.getElementById('btn-detonate-all')?.addEventListener('click', () => {
      if (this._onDetonateAll) this._onDetonateAll();
    });
    document.getElementById('btn-auto-target')?.addEventListener('click', () => {
      if (this._onAutoTarget) this._onAutoTarget();
    });
    document.getElementById('btn-clear-targets')?.addEventListener('click', () => {
      if (this._onClearTargets) this._onClearTargets();
    });
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      if (this._onReset) this._onReset();
    });
    document.getElementById('btn-play-scenario')?.addEventListener('click', () => {
      if (this._selectedScenario && this._onScenarioPlay) this._onScenarioPlay(this._selectedScenario.id);
    });
    document.getElementById('btn-stop-scenario')?.addEventListener('click', () => {
      if (this._onScenarioStop) this._onScenarioStop();
    });
    document.getElementById('airburst-toggle')?.addEventListener('change', (e) => {
      if (this._onAirburstChange) this._onAirburstChange(e.target.checked);
    });
    document.getElementById('playback-speed')?.addEventListener('input', (e) => {
      if (this._onSpeedChange) this._onSpeedChange(parseFloat(e.target.value));
    });
  }

  _setupOptions() {
    const opts = ['opt-city-dots', 'opt-atmosphere', 'opt-clouds', 'opt-stars', 'opt-autorotate'];
    opts.forEach(id => {
      document.getElementById(id)?.addEventListener('change', (e) => {
        if (this._onOptionChange) this._onOptionChange(id.replace('opt-', ''), e.target.checked);
      });
    });
  }

  // ---- Scenario callbacks ----
  onScenarioSelected(scenario) {
    document.getElementById('btn-play-scenario').disabled = false;
    document.getElementById('btn-stop-scenario').disabled = false;
  }

  setPlaybackState(playing) {
    const playBtn = document.getElementById('btn-play-scenario');
    const stopBtn = document.getElementById('btn-stop-scenario');
    if (playBtn) playBtn.disabled = playing;
    if (stopBtn) stopBtn.disabled = !playing;
  }

  // ---- Status updates ----
  setStatus(text, alert = false) {
    const badge = document.getElementById('status-badge');
    if (!badge) return;
    badge.textContent = text;
    badge.className   = alert ? 'status-badge alert' : 'status-badge';
  }

  updateTargetCount(n) {
    const el = document.getElementById('bottom-targets');
    if (el) el.textContent = `TARGETS: ${n}`;
  }

  updateCoords(lat, lng) {
    const el = document.getElementById('bottom-coords');
    if (el) el.textContent = `LAT: ${lat.toFixed(3)}° LON: ${lng.toFixed(3)}°`;
  }

  updateStats(stats) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('stat-detonations',    stats.detonations);
    set('stat-immediate-deaths', formatNumber(stats.immediateDeaths));
    set('stat-radiation-deaths', formatNumber(stats.radiationDeaths));
    set('stat-total-yield',    stats.totalYield_kt >= 1000
      ? (stats.totalYield_kt / 1000).toFixed(1) + ' MT'
      : stats.totalYield_kt + ' kT');
    set('stat-affected-area',  stats.affectedArea_km2.toLocaleString() + ' km²');

    const winter = estimateNuclearWinter(stats.totalYield_kt);
    set('stat-soot', winter.soot_Tg + ' Tg');

    const bar   = document.getElementById('winter-bar');
    const label = document.getElementById('winter-label');
    if (bar)   bar.style.width = (winter.winterFraction * 100) + '%';
    if (label) label.textContent = winter.severity;
  }

  addLogEntry(entry) {
    const log = document.getElementById('detonation-log');
    if (!log) return;

    // Remove placeholder
    const placeholder = log.querySelector('.dim-text');
    if (placeholder) placeholder.remove();

    const el = document.createElement('div');
    el.className = 'log-entry';
    el.innerHTML = `
      <div class="log-header">
        <span>${entry.city}</span>
        <span class="log-time">${entry.time}</span>
      </div>
      <div class="log-yield">${entry.weapon} — ${formatYield(entry.yield_kt)} ${entry.airburst ? '(AB)' : '(GB)'}</div>
      <div class="log-dead">Immediate: ${formatNumber(entry.immediateDeaths)}</div>
      <div class="log-rad">Radiation: ${formatNumber(entry.radiationDeaths)}</div>
    `;
    log.prepend(el);
  }

  clearLog() {
    const log = document.getElementById('detonation-log');
    if (log) log.innerHTML = '<p class="dim-text" style="padding:8px 0">No detonations recorded.</p>';
  }

  showHint(text, duration = 3000) {
    const hint = document.querySelector('.hint-text');
    if (!hint) return;
    const orig = hint.textContent;
    hint.textContent = text;
    hint.style.color = 'var(--green)';
    clearTimeout(this._hintTimeout);
    this._hintTimeout = setTimeout(() => {
      hint.textContent = orig;
      hint.style.color = '';
    }, duration);
  }
}
