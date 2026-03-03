// WeaponDesigner.js — manages the currently-configured weapon loadout

export class WeaponDesigner {
  constructor() {
    this._country   = null;
    this._systemId  = null;
    this._warheadId = null;
    this._yieldKt   = null;   // null = use warhead's default
    this._burstM    = 0;      // 0 = surface burst
    this._arsenals  = null;   // set via setArsenals()
  }

  /** Inject loaded arsenals so the designer can resolve systems/warheads */
  setArsenals(arsenals) {
    this._arsenals = arsenals;
    return this;
  }

  setCountry(countryId) {
    this._country   = countryId;
    this._systemId  = null;
    this._warheadId = null;
    this._yieldKt   = null;
    return this;
  }

  setDeliverySystem(systemId) {
    this._systemId  = systemId;
    this._warheadId = null;
    this._yieldKt   = null;
    return this;
  }

  setWarhead(warheadId) {
    this._warheadId = warheadId;
    this._yieldKt   = null;   // reset override when warhead changes
    return this;
  }

  /** Override yield in kt (custom scenario) */
  setYield(yieldKt) {
    this._yieldKt = Number(yieldKt);
    return this;
  }

  /** Set burst height in metres (0 = surface burst, >0 = airburst) */
  setBurstHeight(heightM) {
    this._burstM = Number(heightM);
    return this;
  }

  /**
   * Returns current configuration.
   * @returns {{ country, system, warhead, yield_kt, burst_m, cep_m } | {}}
   */
  getConfig() {
    if (!this._arsenals || !this._country || !this._systemId || !this._warheadId) {
      return {};
    }
    const arsenal  = this._arsenals[this._country];
    const system   = (arsenal?.delivery_systems || []).find(s => s.id === this._systemId);
    const warhead  = (arsenal?.warheads         || []).find(w => w.id === this._warheadId);

    if (!system || !warhead) return {};

    const yieldKt = this._yieldKt !== null ? this._yieldKt : warhead.yield_kt;

    return {
      country:   this._country,
      flag:      arsenal.flag,
      system,
      warhead,
      yield_kt:  yieldKt,
      burst_m:   this._burstM,
      cep_m:     system.cep_m,
    };
  }

  /**
   * Validates the current configuration.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    if (!this._country)   errors.push('No country selected');
    if (!this._systemId)  errors.push('No delivery system selected');
    if (!this._warheadId) errors.push('No warhead selected');

    if (this._arsenals && this._country && this._systemId) {
      const arsenal = this._arsenals[this._country];
      const system  = (arsenal?.delivery_systems || []).find(s => s.id === this._systemId);
      if (!system) {
        errors.push(`System "${this._systemId}" not found for ${this._country}`);
      } else if (this._warheadId && !system.compatible_warheads?.includes(this._warheadId)) {
        errors.push(`Warhead "${this._warheadId}" is not compatible with ${system.name}`);
      }
    }

    if (this._yieldKt !== null) {
      if (isNaN(this._yieldKt) || this._yieldKt < 0.001 || this._yieldKt > 100000) {
        errors.push('Yield must be between 0.001 kt and 100,000 kt');
      }
    }

    if (isNaN(this._burstM) || this._burstM < 0 || this._burstM > 30000) {
      errors.push('Burst height must be between 0 m and 30,000 m');
    }

    return { valid: errors.length === 0, errors };
  }
}
