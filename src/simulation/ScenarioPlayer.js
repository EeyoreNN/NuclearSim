/**
 * ScenarioPlayer.js — Plays back predefined nuclear exchange scenarios
 */
import { WEAPONS } from '../data/arsenal.js';
import { SCENARIOS } from '../data/scenarios.js';

export class ScenarioPlayer {
  constructor(targetManager, ui) {
    this.targetManager = targetManager;
    this.ui            = ui;
    this.selectedScenario = null;
    this.isPlaying     = false;
    this._timers       = [];
    this._speed        = 1.0;
  }

  selectScenario(scenarioId) {
    const s = SCENARIOS.find(sc => sc.id === scenarioId);
    if (!s) return;
    this.selectedScenario = s;
    this.ui.onScenarioSelected(s);
  }

  setSpeed(v) { this._speed = v; }

  play() {
    if (!this.selectedScenario || this.isPlaying) return;
    const s = this.selectedScenario;

    if (s.isVisualizationOnly) {
      this.ui.showHint('Global Zero: No detonations. This is a visualization of current arsenals.');
      return;
    }

    this.isPlaying = true;
    this.ui.setPlaybackState(true);
    this.targetManager.reset();

    const speed = this._speed;

    s.events.forEach(ev => {
      const weapon = WEAPONS.find(w => w.id === ev.weaponId);
      if (!weapon) return;

      const delay = (ev.t / speed) * 1000; // ms
      const timer = setTimeout(() => {
        if (!this.isPlaying) return;
        this.targetManager.detonateAt(ev.lat, ev.lng, weapon, true, ev.label);
        this.ui.setStatus(`STRIKE: ${ev.label}`, true);
      }, delay);

      this._timers.push(timer);
    });

    // End of scenario
    const lastT = s.events.length > 0 ? s.events[s.events.length - 1].t : 0;
    const endTimer = setTimeout(() => {
      this.isPlaying = false;
      this.ui.setPlaybackState(false);
      this.ui.setStatus('SCENARIO COMPLETE', false);
      this.ui.showHint(`Scenario ended. ${s.name} complete.`);
    }, ((lastT + 3) / speed) * 1000);
    this._timers.push(endTimer);
  }

  stop() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
    this.isPlaying = false;
    this.ui.setPlaybackState(false);
    this.ui.setStatus('SIMULATION READY', false);
  }
}
