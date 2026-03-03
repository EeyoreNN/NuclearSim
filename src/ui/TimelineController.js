/**
 * TimelineController.js — Simulation playback: play/pause/step/speed + scrubber
 * Exports: TimelineController class
 */

export class TimelineController {
  /**
   * @param {Function} onTick — called each frame with (simulationTimeMs)
   */
  constructor(onTick) {
    this._onTick      = onTick;
    this._sequence    = [];   // sorted array of { time_ms, ...strike }
    this._simTime     = 0;    // current simulation time in ms
    this._maxTime     = 0;    // max time in ms
    this._speed       = 1.0;  // playback multiplier
    this._playing     = false;
    this._lastTick    = null; // wall-clock time of last RAF frame
    this._firedIdx    = 0;    // index of next unfired strike in sequence

    this._buildDOM();
    this._bindEvents();
  }

  // ─── DOM ──────────────────────────────────────────────────────────────────

  _buildDOM() {
    // Buttons already in index.html; just grab refs
    this._playBtn    = document.getElementById('btn-play');
    this._pauseBtn   = document.getElementById('btn-pause');
    this._rewindBtn  = document.getElementById('btn-rewind');
    this._stepBtn    = document.getElementById('btn-step');
    this._scrubber   = document.getElementById('timeline-scrubber');
    this._timeDisplay= document.getElementById('timeline-time');
    this._speedSel   = document.getElementById('timeline-speed');
    this._seqDisplay = document.getElementById('strike-sequence-display');
  }

  _bindEvents() {
    this._playBtn?.addEventListener('click',   () => this.play());
    this._pauseBtn?.addEventListener('click',  () => this.pause());
    this._rewindBtn?.addEventListener('click', () => this.rewind());
    this._stepBtn?.addEventListener('click',   () => this.step());

    this._scrubber?.addEventListener('input', () => {
      const frac = parseFloat(this._scrubber.value) / 100;
      this._seekTo(frac * this._maxTime);
    });

    this._speedSel?.addEventListener('change', () => {
      this._speed = parseFloat(this._speedSel.value);
    });

    // Allow external speed changes
    window.addEventListener('timeline:setSpeed', e => {
      if (e.detail?.speed) this.setSpeed(e.detail.speed);
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Load a strike sequence and reset to T=0.
   * @param {Object[]} detonations — array of { time_ms, lat, lon, yieldKt, ... }
   */
  loadSequence(detonations) {
    this._sequence  = [...detonations].sort((a, b) => a.time_ms - b.time_ms);
    this._maxTime   = this._sequence.length
      ? this._sequence[this._sequence.length - 1].time_ms + 60000  // 1 min after last
      : 0;
    this._simTime   = 0;
    this._firedIdx  = 0;
    this._playing   = false;

    if (this._scrubber) {
      this._scrubber.max   = 100;
      this._scrubber.value = 0;
    }
    this._updateDisplay(0);
    this._updateSequenceLabel();
  }

  play() {
    if (this._playing) return;
    this._playing  = true;
    this._lastTick = performance.now();
    this._loop();
  }

  pause() {
    this._playing = false;
  }

  rewind() {
    this._playing  = false;
    this._seekTo(0);
  }

  /** Advance to the next scheduled strike. */
  step() {
    if (!this._sequence.length) return;
    const nextStrike = this._sequence[this._firedIdx];
    if (nextStrike) this._seekTo(nextStrike.time_ms + 1);
  }

  setSpeed(multiplier) {
    this._speed = multiplier;
    if (this._speedSel) {
      const opt = [...this._speedSel.options].find(o => parseFloat(o.value) === multiplier);
      if (opt) this._speedSel.value = opt.value;
    }
  }

  getCurrentTime() { return this._simTime; }

  // ─── Internal ─────────────────────────────────────────────────────────────

  _loop() {
    if (!this._playing) return;

    const now   = performance.now();
    const wallDt = now - (this._lastTick ?? now);
    this._lastTick = now;

    const simDt = wallDt * this._speed;
    this._simTime += simDt;

    // Clamp to max
    if (this._maxTime > 0 && this._simTime >= this._maxTime) {
      this._simTime = this._maxTime;
      this._playing = false;
    }

    // Fire any strikes whose time has come
    while (this._firedIdx < this._sequence.length &&
           this._sequence[this._firedIdx].time_ms <= this._simTime) {
      const strike = this._sequence[this._firedIdx];
      this._fireStrike(strike);
      this._firedIdx++;
    }

    this._updateDisplay(this._simTime);
    this._updateScrubber();
    if (this._onTick) this._onTick(this._simTime);

    if (this._playing) requestAnimationFrame(() => this._loop());
  }

  _seekTo(targetMs) {
    const wasPlaying = this._playing;
    this._playing   = false;
    this._simTime   = Math.max(0, Math.min(targetMs, this._maxTime));

    // Reset fired index to re-fire from beginning if seeking back
    this._firedIdx = this._sequence.findIndex(s => s.time_ms > this._simTime);
    if (this._firedIdx === -1) this._firedIdx = this._sequence.length;

    this._updateDisplay(this._simTime);
    this._updateScrubber();
    if (this._onTick) this._onTick(this._simTime);

    if (wasPlaying) {
      this._lastTick = performance.now();
      this._playing  = true;
      this._loop();
    }
  }

  _fireStrike(strike) {
    window.dispatchEvent(new CustomEvent('sim:detonate', { detail: { strike } }));
    this._updateSequenceLabel(strike);
  }

  _updateDisplay(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h   = Math.floor(totalSec / 3600);
    const m   = Math.floor((totalSec % 3600) / 60);
    const s   = totalSec % 60;
    const pad = n => String(n).padStart(2, '0');
    if (this._timeDisplay) this._timeDisplay.textContent = `T+${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  _updateScrubber() {
    if (!this._scrubber || !this._maxTime) return;
    this._scrubber.value = (this._simTime / this._maxTime) * 100;
  }

  _updateSequenceLabel(strike) {
    if (!this._seqDisplay) return;
    if (!strike) {
      const pending = this._sequence.length - this._firedIdx;
      this._seqDisplay.textContent = `${this._sequence.length} STRIKES LOADED — ${pending} PENDING`;
      return;
    }
    const yieldStr = strike.yield_kt >= 1000
      ? (strike.yield_kt / 1000).toFixed(1) + ' Mt'
      : strike.yield_kt + ' kt';
    this._seqDisplay.textContent =
      `&#9889; ${strike.attacker ?? '?'} → ${strike.target_city_id ?? `${strike.lat?.toFixed(1)},${strike.lon?.toFixed(1)}`} | ${yieldStr}`;
  }

  /** Called by main.js render loop to advance sim time without internal RAF. */
  update(deltaMs) {
    if (!this._playing) return;
    // If using external render loop, call this instead of internal _loop
    // (used when engine is available and drives RAF)
    this._simTime += deltaMs * this._speed;
    if (this._maxTime > 0 && this._simTime >= this._maxTime) {
      this._simTime = this._maxTime;
      this._playing = false;
    }

    while (this._firedIdx < this._sequence.length &&
           this._sequence[this._firedIdx].time_ms <= this._simTime) {
      this._fireStrike(this._sequence[this._firedIdx]);
      this._firedIdx++;
    }

    this._updateDisplay(this._simTime);
    this._updateScrubber();
    if (this._onTick) this._onTick(this._simTime);
  }
}
