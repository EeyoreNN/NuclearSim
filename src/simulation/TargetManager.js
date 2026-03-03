/**
 * TargetManager.js — Manages target placement, weapon assignment, and detonation
 */
import * as THREE from 'three';
import { latLngToVector3 } from '../globe/Globe.js';
import { DetonationEffect, triggerFlash } from '../effects/DetonationEffect.js';
import { estimateCasualties, estimateNuclearWinter, formatNumber } from './BlastPhysics.js';
import { CITIES, findNearestCity } from '../data/cities.js';

export class TargetManager {
  constructor(scene, globe, ui) {
    this.scene   = scene;
    this.globe   = globe;
    this.ui      = ui;

    this.targets   = [];       // Array of { id, lat, lng, city, weapon, airburst, marker }
    this.effects   = [];       // Active DetonationEffect instances
    this.nextId    = 1;

    this.selectedWeapon  = null;
    this.airburstMode    = true;

    // Aggregate stats
    this.stats = {
      detonations:    0,
      immediateDeaths: 0,
      radiationDeaths: 0,
      totalYield_kt:  0,
      affectedArea_km2: 0,
    };

    this._detonationLog = [];
    this._windAngle = 45; // Simulated prevailing wind direction
  }

  setWeapon(weapon) { this.selectedWeapon = weapon; }
  setAirburst(v)    { this.airburstMode = v; }

  /** Handle globe click → place target */
  onGlobeClick(lat, lng) {
    if (!this.selectedWeapon) {
      this.ui.showHint('Select a weapon first.');
      return;
    }

    // Snap to nearest city if within 5 degrees
    const nearest = findNearestCity(lat, lng, 5.0);
    const targetLat = nearest ? nearest.lat : lat;
    const targetLng = nearest ? nearest.lng : lng;
    const cityName  = nearest ? nearest.name : `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E`;
    const cityPop   = nearest ? nearest.pop : 0;

    // Don't duplicate targets on same city
    const existing = this.targets.find(t =>
      nearest ? t.city === cityName : (Math.abs(t.lat - lat) < 0.5 && Math.abs(t.lng - lng) < 0.5)
    );
    if (existing) {
      this.showTargetTooltip(existing);
      return;
    }

    const target = {
      id:       this.nextId++,
      lat:      targetLat,
      lng:      targetLng,
      city:     cityName,
      pop:      cityPop,
      weapon:   this.selectedWeapon,
      airburst: this.airburstMode,
      marker:   this._createMarker(targetLat, targetLng),
    };
    this.targets.push(target);
    this.ui.updateTargetCount(this.targets.length);
    this.showTargetTooltip(target);
  }

  /** Create a 3D marker on the globe */
  _createMarker(lat, lng) {
    const pos = latLngToVector3(lat, lng, 1.004);
    // Apply globe group rotation
    pos.applyMatrix4(this.globe.group.matrixWorld);

    const group = new THREE.Group();

    // Center dot
    const dotGeo = new THREE.SphereGeometry(0.003, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xff0040 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    group.add(dot);

    // Pulsing ring (will be animated)
    const ringGeo = new THREE.RingGeometry(0.005, 0.007, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0040, side: THREE.DoubleSide, transparent: true, opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.lookAt(pos.clone().multiplyScalar(2));
    group.add(ring);

    const localPos = latLngToVector3(lat, lng, 1.004);
    group.position.copy(localPos);

    // Align to globe surface
    const norm = localPos.clone().normalize();
    const up   = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, norm);
    group.quaternion.copy(quat);

    group.userData.ring    = ring;
    group.userData.ringMat = ringMat;

    this.globe.group.add(group);
    return group;
  }

  showTargetTooltip(target) {
    const tooltip = document.getElementById('target-tooltip');
    const ttCity   = document.getElementById('tt-city');
    const ttPop    = document.getElementById('tt-pop');
    const ttWeapon = document.getElementById('tt-weapon');

    ttCity.textContent   = target.city;
    ttPop.textContent    = target.pop ? `Population: ${formatNumber(target.pop * 1000)}` : 'Population: unknown';
    ttWeapon.textContent = `${target.weapon.name} — ${target.weapon.yield_kt >= 1000
      ? (target.weapon.yield_kt / 1000).toFixed(2) + ' MT'
      : target.weapon.yield_kt + ' kT'}`;

    tooltip.style.display = 'block';

    const onDetonate = () => {
      this.detonateTarget(target);
      tooltip.style.display = 'none';
      cleanup();
    };
    const onRemove = () => {
      this.removeTarget(target);
      tooltip.style.display = 'none';
      cleanup();
    };
    const cleanup = () => {
      document.getElementById('tt-detonate').removeEventListener('click', onDetonate);
      document.getElementById('tt-remove').removeEventListener('click', onRemove);
    };

    document.getElementById('tt-detonate').addEventListener('click', onDetonate);
    document.getElementById('tt-remove').addEventListener('click', onRemove);

    // Position tooltip near screen center with slight offset
    tooltip.style.left = '50%';
    tooltip.style.top  = '50%';
    tooltip.style.transform = 'translate(-50%, -60%)';

    // Auto-hide after 8 seconds
    setTimeout(() => { tooltip.style.display = 'none'; }, 8000);
  }

  detonateTarget(target) {
    const cas = estimateCasualties(
      target.weapon.yield_kt, target.airburst,
      target.pop, target.lat, target.lng, CITIES
    );

    // Trigger flash
    triggerFlash();

    // Create visual effect on globe group
    const effect = new DetonationEffect(
      this.globe.group, target.lat, target.lng,
      target.weapon, target.airburst, this._windAngle
    );
    this.effects.push(effect);

    // Update stats
    this.stats.detonations++;
    this.stats.immediateDeaths  += cas.immediateDeaths;
    this.stats.radiationDeaths  += cas.radiationDeaths;
    this.stats.totalYield_kt    += target.weapon.yield_kt;
    this.stats.affectedArea_km2 += cas.affectedArea_km2;

    // Log entry
    const entry = {
      city:   target.city,
      weapon: target.weapon.name,
      yield_kt: target.weapon.yield_kt,
      airburst: target.airburst,
      immediateDeaths: cas.immediateDeaths,
      radiationDeaths: cas.radiationDeaths,
      time: new Date().toISOString().substring(11, 19),
    };
    this._detonationLog.unshift(entry);

    // Remove target marker
    if (target.marker) {
      this.globe.group.remove(target.marker);
    }
    this.targets = this.targets.filter(t => t !== target);

    this.ui.updateStats(this.stats);
    this.ui.addLogEntry(entry);
    this.ui.setStatus('DETONATION DETECTED', true);

    // Reset status after 3 seconds
    setTimeout(() => {
      if (this.targets.length === 0) this.ui.setStatus('SIMULATION READY', false);
    }, 3000);

    this.ui.updateTargetCount(this.targets.length);
  }

  detonateAll() {
    const snapshot = [...this.targets];
    snapshot.forEach((t, i) => {
      setTimeout(() => this.detonateTarget(t), i * 600);
    });
  }

  removeTarget(target) {
    if (target.marker) this.globe.group.remove(target.marker);
    this.targets = this.targets.filter(t => t !== target);
    this.ui.updateTargetCount(this.targets.length);
  }

  clearAll() {
    this.targets.forEach(t => { if (t.marker) this.globe.group.remove(t.marker); });
    this.targets = [];
    this.ui.updateTargetCount(0);
  }

  clearEffects() {
    this.effects.forEach(e => e.dispose());
    this.effects = [];
    this.stats = { detonations: 0, immediateDeaths: 0, radiationDeaths: 0, totalYield_kt: 0, affectedArea_km2: 0 };
    this.ui.updateStats(this.stats);
    this.ui.clearLog();
  }

  /** AI auto-targeting: spread selected weapon across strategic cities of target nations */
  autoTarget(targetNations = null) {
    if (!this.selectedWeapon) { this.ui.showHint('Select a weapon first.'); return; }

    let cities = CITIES.filter(c => c.strategic >= 2);
    if (targetNations && targetNations.length > 0) {
      cities = cities.filter(c => targetNations.includes(c.country));
    }

    // Sort by strategic importance * population
    cities.sort((a, b) => (b.strategic * b.pop) - (a.strategic * a.pop));

    const maxTargets = Math.min(cities.length, this.selectedWeapon.inventory || 20);
    const toPlace = cities.slice(0, maxTargets);

    toPlace.forEach(city => {
      const alreadyTargeted = this.targets.find(t => t.city === city.name);
      if (!alreadyTargeted) {
        const target = {
          id:       this.nextId++,
          lat:      city.lat,
          lng:      city.lng,
          city:     city.name,
          pop:      city.pop,
          weapon:   this.selectedWeapon,
          airburst: this.airburstMode,
          marker:   this._createMarker(city.lat, city.lng),
        };
        this.targets.push(target);
      }
    });

    this.ui.updateTargetCount(this.targets.length);
    this.ui.showHint(`${toPlace.length} targets assigned automatically.`);
  }

  /** Detonation for scenario events */
  detonateAt(lat, lng, weapon, airburst = true, label = '') {
    const nearest = findNearestCity(lat, lng, 3.0);
    const cityPop = nearest ? nearest.pop : 0;

    const cas = estimateCasualties(weapon.yield_kt, airburst, cityPop, lat, lng, CITIES);

    triggerFlash();

    const effect = new DetonationEffect(
      this.globe.group, lat, lng, weapon, airburst, this._windAngle
    );
    this.effects.push(effect);

    this.stats.detonations++;
    this.stats.immediateDeaths  += cas.immediateDeaths;
    this.stats.radiationDeaths  += cas.radiationDeaths;
    this.stats.totalYield_kt    += weapon.yield_kt;
    this.stats.affectedArea_km2 += cas.affectedArea_km2;

    const entry = {
      city:   label || (nearest ? nearest.name : `${lat.toFixed(1)}°, ${lng.toFixed(1)}°`),
      weapon: weapon.name,
      yield_kt: weapon.yield_kt,
      airburst,
      immediateDeaths: cas.immediateDeaths,
      radiationDeaths: cas.radiationDeaths,
      time: new Date().toISOString().substring(11, 19),
    };
    this._detonationLog.unshift(entry);
    this.ui.updateStats(this.stats);
    this.ui.addLogEntry(entry);
  }

  update(delta) {
    // Animate target markers (pulsing ring)
    const t = performance.now() / 1000;
    this.targets.forEach(target => {
      if (target.marker && target.marker.userData.ring) {
        const s = 1.0 + 0.3 * Math.sin(t * 3);
        target.marker.userData.ring.scale.setScalar(s);
        target.marker.userData.ringMat.opacity = 0.4 + 0.3 * Math.sin(t * 3);
      }
    });

    // Update detonation effects
    this.effects.forEach(e => { if (e.alive) e.update(delta); });

    // Settle old effects (keep blast rings, remove transient)
    this.effects.forEach(e => {
      if (e.alive && e.elapsed > 8.0) e.settle();
    });
  }

  reset() {
    this.clearAll();
    this.clearEffects();
    this.ui.setStatus('SIMULATION READY', false);
    this._detonationLog = [];
  }
}
