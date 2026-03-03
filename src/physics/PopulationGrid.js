/**
 * PopulationGrid.js — Global population data and spatial queries
 *
 * Uses a 1-degree lat/lon grid (180×360 = 64,800 cells) backed by
 * city population data from cities.json as a proxy for full GPWv4 data.
 *
 * City populations are distributed across 1-degree cells weighted by
 * distance (Gaussian kernel, sigma ≈ 30 km) to approximate real
 * population density distributions around urban centers.
 *
 * Coordinate convention:
 *   lat: -90 (S) to +90 (N)
 *   lon: -180 (W) to +180 (E)
 *   Cell (lat, lon) covers: [lat, lat+1) × [lon, lon+1)
 *   Cell index: row = lat + 90, col = lon + 180
 *
 * Reference: GPWv4 (CIESIN), LandScan Global 2020 methodology
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine great-circle distance between two lat/lon points.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in km
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = EARTH_RADIUS_KM;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export class PopulationGrid {
  constructor() {
    // 180 rows (lat: -90..+89) × 360 cols (lon: -180..+179)
    this._grid = new Float32Array(180 * 360);
    this._loaded = false;
  }

  /**
   * Load population data from cities.json (proxy for GPWv4).
   * Distributes each city's population as a Gaussian kernel over nearby cells.
   *
   * @param {string} citiesUrl - URL to cities.json (default: relative path)
   * @returns {Promise<void>}
   */
  async load(citiesUrl = './src/weapons/cities.json') {
    if (this._loaded) return;

    let cities = [];
    try {
      const resp = await fetch(citiesUrl);
      cities = await resp.json();
    } catch (e) {
      // If cities.json not available, grid stays empty (all queries return 0)
      console.warn('PopulationGrid: could not load cities.json', e);
      this._loaded = true;
      return;
    }

    // Distribute city populations over nearby cells
    // Sigma = 0.5 degrees ≈ 55 km (urban spread radius)
    const sigma = 0.5;
    const spread = 3; // cells to spread into (±3 degrees)

    for (const city of cities) {
      const pop = city.metro_population ?? city.population ?? 0;
      if (!pop) continue;

      // Normalize Gaussian over affected cells so total stays = pop
      let totalWeight = 0;
      const weights = [];

      for (let dlat = -spread; dlat <= spread; dlat++) {
        for (let dlon = -spread; dlon <= spread; dlon++) {
          const w = Math.exp(-(dlat * dlat + dlon * dlon) / (2 * sigma * sigma));
          weights.push({ dlat, dlon, w });
          totalWeight += w;
        }
      }

      for (const { dlat, dlon, w } of weights) {
        const row = Math.round(city.lat) + 90 + dlat;
        const col = Math.round(city.lon) + 180 + dlon;
        if (row < 0 || row >= 180 || col < 0 || col >= 360) continue;
        this._grid[row * 360 + col] += pop * (w / totalWeight);
      }
    }

    this._loaded = true;
  }

  /**
   * Get population count for the 1-degree cell containing lat/lon.
   *
   * @param {number} lat - Latitude in degrees
   * @param {number} lon - Longitude in degrees
   * @returns {number} Population in cell
   */
  getCellPopulation(lat, lon) {
    const row = Math.floor(lat) + 90;
    const col = Math.floor(lon) + 180;
    if (row < 0 || row >= 180 || col < 0 || col >= 360) return 0;
    return this._grid[row * 360 + col];
  }

  /**
   * Get total population within a circular radius of a point.
   * Uses Haversine distance to each cell center.
   *
   * @param {number} lat - Center latitude in degrees
   * @param {number} lon - Center longitude in degrees
   * @param {number} radiusKm - Radius in km
   * @returns {number} Total population within radius
   */
  getPopulationInCircle(lat, lon, radiusKm) {
    if (!this._loaded || radiusKm <= 0) return 0;

    // Bounding box in degrees for rough pre-filter
    const latDelta = radiusKm / EARTH_RADIUS_KM * (180 / Math.PI);
    const lonDelta = latDelta / Math.max(Math.cos(lat * Math.PI / 180), 0.001);

    const latMin = Math.floor(lat - latDelta);
    const latMax = Math.floor(lat + latDelta);
    const lonMin = Math.floor(lon - lonDelta);
    const lonMax = Math.floor(lon + lonDelta);

    let total = 0;
    for (let la = latMin; la <= latMax; la++) {
      for (let lo = lonMin; lo <= lonMax; lo++) {
        const row = la + 90;
        const col = ((lo + 180) % 360 + 360) % 360;  // wrap longitude
        if (row < 0 || row >= 180) continue;

        // Cell center
        const cellLat = la + 0.5;
        const cellLon = lo + 0.5;

        if (haversineKm(lat, lon, cellLat, cellLon) <= radiusKm) {
          total += this._grid[row * 360 + col];
        }
      }
    }
    return Math.round(total);
  }

  /**
   * Get total population within an ellipse (for fallout plume queries).
   *
   * The ellipse is defined in km with rotation angle, then projected back
   * to geographic coordinates for cell enumeration.
   *
   * @param {number} centerLat - Ellipse center latitude
   * @param {number} centerLon - Ellipse center longitude
   * @param {number} semiMajorKm - Semi-major axis in km
   * @param {number} semiMinorKm - Semi-minor axis in km
   * @param {number} rotDeg - Rotation of major axis in degrees (0=North, 90=East)
   * @returns {number} Total population inside ellipse
   */
  getPopulationInEllipse(centerLat, centerLon, semiMajorKm, semiMinorKm, rotDeg) {
    if (!this._loaded) return 0;

    const rotRad = rotDeg * Math.PI / 180;
    const maxRadius = Math.max(semiMajorKm, semiMinorKm);

    // Bounding box
    const latDelta = maxRadius / EARTH_RADIUS_KM * (180 / Math.PI);
    const lonDelta = latDelta / Math.max(Math.cos(centerLat * Math.PI / 180), 0.001);

    const latMin = Math.floor(centerLat - latDelta);
    const latMax = Math.floor(centerLat + latDelta);
    const lonMin = Math.floor(centerLon - lonDelta);
    const lonMax = Math.floor(centerLon + lonDelta);

    let total = 0;
    for (let la = latMin; la <= latMax; la++) {
      for (let lo = lonMin; lo <= lonMax; lo++) {
        const row = la + 90;
        const col = ((lo + 180) % 360 + 360) % 360;
        if (row < 0 || row >= 180) continue;

        const cellLat = la + 0.5;
        const cellLon = lo + 0.5;

        // Convert to km offset from center
        const dLatKm = (cellLat - centerLat) * (Math.PI / 180) * EARTH_RADIUS_KM;
        const dLonKm = (cellLon - centerLon) * (Math.PI / 180) *
                       EARTH_RADIUS_KM * Math.cos(centerLat * Math.PI / 180);

        // Rotate into ellipse frame
        const x =  dLonKm * Math.cos(rotRad) + dLatKm * Math.sin(rotRad);
        const y = -dLonKm * Math.sin(rotRad) + dLatKm * Math.cos(rotRad);

        // Check if inside ellipse
        if ((x / semiMajorKm) ** 2 + (y / semiMinorKm) ** 2 <= 1) {
          total += this._grid[row * 360 + col];
        }
      }
    }
    return Math.round(total);
  }
}
