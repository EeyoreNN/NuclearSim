// TargetDatabase.js — loads cities.json and exposes query/search API

export class TargetDatabase {
  constructor() {
    this._cities = [];   // Array of city objects
    this._byId   = {};   // id → city object
  }

  /**
   * Fetches and indexes cities.json.
   * @returns {Promise<void>}
   */
  async load() {
    try {
      const base = import.meta.url
        ? new URL('./cities.json', import.meta.url).href
        : '/src/weapons/cities.json';
      const res = await fetch(base);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this._cities = await res.json();
      // Build id index
      for (const city of this._cities) {
        this._byId[city.id] = city;
      }
    } catch (err) {
      console.error('[TargetDatabase] Failed to load cities.json:', err);
    }
  }

  /**
   * Returns a city by id.
   * @param {string} cityId
   * @returns {Object|null}
   */
  getCity(cityId) {
    return this._byId[cityId] || null;
  }

  /**
   * Fuzzy name search — returns cities whose name contains the query (case-insensitive).
   * @param {string} query
   * @returns {Object[]}
   */
  searchCities(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    return this._cities.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.country_name.toLowerCase().includes(q)
    );
  }

  /**
   * Returns cities within `km` of the given lat/lon using Haversine.
   * @param {number} lat
   * @param {number} lon
   * @param {number} km
   * @returns {Object[]}
   */
  getCitiesInRadius(lat, lon, km) {
    return this._cities.filter(c => this._haversine(lat, lon, c.lat, c.lon) <= km);
  }

  /**
   * Returns all cities for an ISO 3166-1 alpha-2 country code.
   * @param {string} countryCode
   * @returns {Object[]}
   */
  getCitiesByCountry(countryCode) {
    const code = countryCode.toUpperCase();
    return this._cities.filter(c => c.country === code);
  }

  /**
   * Returns top n cities sorted by population descending.
   * @param {number} n
   * @returns {Object[]}
   */
  getTopTargets(n) {
    return [...this._cities]
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, n);
  }

  /**
   * Returns all 500+ cities.
   * @returns {Object[]}
   */
  getAllCities() {
    return this._cities;
  }

  /**
   * Returns cities by nuclear target priority (1 = highest).
   * @param {number} priority  — 1, 2, or 3
   * @returns {Object[]}
   */
  getCitiesByPriority(priority) {
    return this._cities.filter(c => c.nuclear_target_priority === priority);
  }

  /**
   * Returns cities that have military bases.
   * @param {string|null} militaryType  — filter by type ('ICBM_field', 'submarine_base', etc.) or null for all
   * @returns {Object[]}
   */
  getMilitaryTargets(militaryType = null) {
    return this._cities.filter(c =>
      c.has_military_base && (militaryType === null || c.military_type === militaryType)
    );
  }

  // ─── Haversine distance (km) ─────────────────────────────────────────────

  _haversine(lat1, lon1, lat2, lon2) {
    const R    = 6371;
    const toR  = Math.PI / 180;
    const dLat = (lat2 - lat1) * toR;
    const dLon = (lon2 - lon1) * toR;
    const a    = Math.sin(dLat / 2) ** 2
               + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
