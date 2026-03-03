// ArsenalLoader.js — loads and merges all 9 country arsenal JSON files

const ARSENAL_FILES = {
  usa:        'usa.json',
  russia:     'russia.json',
  china:      'china.json',
  uk:         'uk.json',
  france:     'france.json',
  india:      'india.json',
  pakistan:   'pakistan.json',
  israel:     'israel.json',
  northkorea: 'northkorea.json',
};

/**
 * Loads all 9 arsenal JSON files.
 * @returns {Promise<Object>} { usa, russia, china, uk, france, india, pakistan, israel, northkorea }
 */
export async function loadAllArsenals() {
  const base = import.meta.url
    ? new URL('./arsenal/', import.meta.url).href
    : '/src/weapons/arsenal/';

  const entries = await Promise.all(
    Object.entries(ARSENAL_FILES).map(async ([key, file]) => {
      try {
        const res = await fetch(base + file);
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${file}`);
        const data = await res.json();
        return [key, data];
      } catch (err) {
        console.error(`[ArsenalLoader] Failed to load ${file}:`, err);
        return [key, { country: key, warheads: [], delivery_systems: [] }];
      }
    })
  );

  return Object.fromEntries(entries);
}

/**
 * Returns a flat array of all delivery systems across all countries,
 * each augmented with a `countryId` field.
 * @param {Object} arsenals
 * @returns {Array}
 */
export function getAllWeaponSystems(arsenals) {
  const systems = [];
  for (const [countryId, arsenal] of Object.entries(arsenals)) {
    if (!arsenal.delivery_systems) continue;
    for (const sys of arsenal.delivery_systems) {
      systems.push({ ...sys, countryId, flag: arsenal.flag });
    }
  }
  return systems;
}

/**
 * Returns the warhead objects for a given delivery system.
 * @param {Object} arsenals
 * @param {string} countryId   e.g. 'usa'
 * @param {string} systemId    e.g. 'minuteman-iii'
 * @returns {Array} Array of warhead objects
 */
export function getWarheadsForSystem(arsenals, countryId, systemId) {
  const arsenal = arsenals[countryId];
  if (!arsenal) return [];

  const system = (arsenal.delivery_systems || []).find(s => s.id === systemId);
  if (!system) return [];

  const compatibleIds = system.compatible_warheads || [];
  return (arsenal.warheads || []).filter(w => compatibleIds.includes(w.id));
}
