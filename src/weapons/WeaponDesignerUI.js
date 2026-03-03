// WeaponDesignerUI.js — DOM panel: warhead selector, yield slider, delivery type
import { WeaponDesigner } from './WeaponDesigner.js';
import { getWarheadsForSystem } from './ArsenalLoader.js';

export class WeaponDesignerUI {
  /**
   * @param {string} panelId   — CSS selector for the panel container
   * @param {Object} arsenals  — loaded arsenal data from loadAllArsenals()
   */
  constructor(panelId, arsenals) {
    this._panel    = document.querySelector(panelId);
    this._arsenals = arsenals;
    this._designer = new WeaponDesigner().setArsenals(arsenals);
    this._render();
  }

  // ─── Build the panel HTML ────────────────────────────────────────────────

  _render() {
    if (!this._panel) return;
    this._panel.innerHTML = `
      <div class="wd-header">[ WEAPON DESIGNER ]</div>

      <div class="wd-row">
        <label class="wd-label">COUNTRY</label>
        <select id="wd-country" class="wd-select"></select>
      </div>

      <div class="wd-row">
        <label class="wd-label">SYSTEM</label>
        <select id="wd-system" class="wd-select"></select>
      </div>

      <div class="wd-row">
        <label class="wd-label">WARHEAD</label>
        <select id="wd-warhead" class="wd-select"></select>
      </div>

      <div class="wd-row">
        <label class="wd-label">YIELD</label>
        <input type="range" id="wd-yield-slider" min="0" max="100" step="1" value="50" class="wd-slider"/>
        <span id="wd-yield-display" class="wd-value">— kt</span>
      </div>

      <div class="wd-row">
        <label class="wd-label">BURST HT</label>
        <input type="range" id="wd-burst-slider" min="0" max="3000" step="50" value="0" class="wd-slider"/>
        <span id="wd-burst-display" class="wd-value">0 m (SURFACE)</span>
      </div>

      <div class="wd-row">
        <label class="wd-label">CEP</label>
        <span id="wd-cep-display" class="wd-value">— m</span>
      </div>

      <div class="wd-row">
        <label class="wd-label">RANGE</label>
        <span id="wd-range-display" class="wd-value">— km</span>
      </div>

      <div class="wd-desc" id="wd-desc"></div>

      <button id="wd-add-btn" class="wd-btn">+ ADD TO FORCE</button>
    `;

    this._populateCountries();
    this._bindEvents();
  }

  // ─── Populate dropdowns ──────────────────────────────────────────────────

  _populateCountries() {
    const sel = this._panel.querySelector('#wd-country');
    sel.innerHTML = '<option value="">-- SELECT --</option>';
    for (const [id, data] of Object.entries(this._arsenals)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${data.flag || ''} ${data.country}`;
      sel.appendChild(opt);
    }
    this._populateSystems(null);
  }

  _populateSystems(countryId) {
    const sel = this._panel.querySelector('#wd-system');
    sel.innerHTML = '<option value="">-- SELECT --</option>';

    if (countryId && this._arsenals[countryId]) {
      const systems = this._arsenals[countryId].delivery_systems || [];
      for (const sys of systems) {
        const opt = document.createElement('option');
        opt.value = sys.id;
        opt.textContent = `${sys.icon || ''} ${sys.name} (${sys.type})`;
        sel.appendChild(opt);
      }
    }
    this._populateWarheads(countryId, null);
  }

  _populateWarheads(countryId, systemId) {
    const sel = this._panel.querySelector('#wd-warhead');
    sel.innerHTML = '<option value="">-- SELECT --</option>';

    if (countryId && systemId) {
      const warheads = getWarheadsForSystem(this._arsenals, countryId, systemId);
      for (const wh of warheads) {
        const opt = document.createElement('option');
        opt.value = wh.id;
        opt.textContent = `${wh.name} (${wh.yield_kt} kt)`;
        sel.appendChild(opt);
      }
      // Auto-select first warhead
      if (sel.options.length > 1) {
        sel.selectedIndex = 1;
        this._onWarheadChange(sel.value);
      }
    }
    this._updateDisplays();
  }

  // ─── Event binding ────────────────────────────────────────────────────────

  _bindEvents() {
    this._panel.querySelector('#wd-country').addEventListener('change', e => {
      const cid = e.target.value;
      this._designer.setCountry(cid);
      this._populateSystems(cid || null);
      this._fireChange();
    });

    this._panel.querySelector('#wd-system').addEventListener('change', e => {
      const sid = e.target.value;
      this._designer.setDeliverySystem(sid);
      const cid = this._panel.querySelector('#wd-country').value;
      this._populateWarheads(cid || null, sid || null);
      this._updateSystemInfo();
      this._fireChange();
    });

    this._panel.querySelector('#wd-warhead').addEventListener('change', e => {
      this._onWarheadChange(e.target.value);
    });

    this._panel.querySelector('#wd-yield-slider').addEventListener('input', e => {
      const logYield = this._sliderToYield(Number(e.target.value));
      this._designer.setYield(logYield);
      this._panel.querySelector('#wd-yield-display').textContent =
        `${logYield < 1 ? logYield.toFixed(2) : Math.round(logYield)} kt`;
      this._fireChange();
    });

    this._panel.querySelector('#wd-burst-slider').addEventListener('input', e => {
      const h = Number(e.target.value);
      this._designer.setBurstHeight(h);
      const label = h === 0 ? '0 m (SURFACE)' : `${h} m (AIRBURST)`;
      this._panel.querySelector('#wd-burst-display').textContent = label;
      this._fireChange();
    });

    this._panel.querySelector('#wd-add-btn').addEventListener('click', () => {
      const cfg = this._designer.getConfig();
      const { valid, errors } = this._designer.validate();
      if (!valid) {
        alert('Invalid configuration:\n' + errors.join('\n'));
        return;
      }
      window.dispatchEvent(new CustomEvent('weapondesigner:add_to_force', {
        detail: { config: cfg }
      }));
    });
  }

  _onWarheadChange(warheadId) {
    this._designer.setWarhead(warheadId);
    const wh = this._getSelectedWarhead();
    if (wh) {
      const yieldKt = wh.yield_kt;
      this._designer.setYield(yieldKt);
      const sliderVal = this._yieldToSlider(yieldKt);
      this._panel.querySelector('#wd-yield-slider').value = sliderVal;
      this._panel.querySelector('#wd-yield-display').textContent =
        `${yieldKt < 1 ? yieldKt.toFixed(2) : Math.round(yieldKt)} kt`;
      this._panel.querySelector('#wd-desc').textContent = wh.description || '';
    }
    this._updateDisplays();
    this._fireChange();
  }

  // ─── Display helpers ─────────────────────────────────────────────────────

  _updateDisplays() {
    this._updateSystemInfo();
  }

  _updateSystemInfo() {
    const cid = this._panel.querySelector('#wd-country').value;
    const sid = this._panel.querySelector('#wd-system').value;

    let cep = '—', range = '—';
    if (cid && sid && this._arsenals[cid]) {
      const sys = (this._arsenals[cid].delivery_systems || []).find(s => s.id === sid);
      if (sys) {
        cep   = `${sys.cep_m} m`;
        range = `${sys.range_km.toLocaleString()} km`;
      }
    }
    const cepEl   = this._panel.querySelector('#wd-cep-display');
    const rangeEl = this._panel.querySelector('#wd-range-display');
    if (cepEl)   cepEl.textContent   = cep;
    if (rangeEl) rangeEl.textContent = range;
  }

  _getSelectedWarhead() {
    const cid = this._panel.querySelector('#wd-country').value;
    const wid = this._panel.querySelector('#wd-warhead').value;
    if (!cid || !wid || !this._arsenals[cid]) return null;
    return (this._arsenals[cid].warheads || []).find(w => w.id === wid) || null;
  }

  // Log-scale slider: 0→1 kt, 50→~100 kt, 100→10,000 kt
  _sliderToYield(v) {
    const MIN_LOG = Math.log10(0.1);
    const MAX_LOG = Math.log10(10000);
    return Math.pow(10, MIN_LOG + (v / 100) * (MAX_LOG - MIN_LOG));
  }

  _yieldToSlider(yieldKt) {
    const MIN_LOG = Math.log10(0.1);
    const MAX_LOG = Math.log10(10000);
    return Math.round(((Math.log10(Math.max(0.1, yieldKt)) - MIN_LOG) / (MAX_LOG - MIN_LOG)) * 100);
  }

  // ─── Event firing ─────────────────────────────────────────────────────────

  _fireChange() {
    const cfg = this._designer.getConfig();
    window.dispatchEvent(new CustomEvent('weapondesigner:change', {
      detail: { config: cfg }
    }));
  }

  /** Returns the WeaponDesigner instance for programmatic access */
  getDesigner() {
    return this._designer;
  }
}
