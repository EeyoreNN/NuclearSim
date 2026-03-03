/**
 * ThermalFlash.js — Full-screen white flash for nuclear detonation.
 *
 * Creates (or reuses) a fixed full-screen <div> overlay.
 * Instantly sets opacity to `intensity`, then fades to 0 over `duration_ms`.
 *
 * The HTML template (index.html) should include:
 *   <div id="thermal-flash"></div>
 * but this class will create the element if it is missing.
 */
export class ThermalFlash {
  constructor() {
    let el = document.getElementById('thermal-flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'thermal-flash';
      document.body.appendChild(el);
    }

    // Apply base styles (safe to re-apply idempotently)
    Object.assign(el.style, {
      position:       'fixed',
      top:            '0',
      left:           '0',
      width:          '100vw',
      height:         '100vh',
      background:     'white',
      opacity:        '0',
      pointerEvents:  'none',
      zIndex:         '9999',
      transition:     'none',
    });

    this._el = el;
    this._timer = null;
  }

  /**
   * Trigger a flash at `intensity` (0–1) that fades over `duration_ms`.
   *
   * Intensity is log-scaled by the caller (see DetonationSequence):
   *   1 kt  → ~0.25   (faint flicker)
   *   10 kt → ~0.50
   *   100kt → ~0.75
   *   1 Mt  → ~1.00   (full white-out)
   *
   * @param {number} intensity  0–1
   * @param {number} duration_ms  fade-out time in milliseconds (default 400)
   */
  trigger(intensity = 1.0, duration_ms = 400) {
    const el = this._el;
    const clamped = Math.max(0, Math.min(1, intensity));

    // Cancel any in-progress fade
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    // Step 1: disable transition, slam to full intensity instantly
    el.style.transition = 'none';
    el.style.opacity    = String(clamped);

    // Force a reflow so the browser actually paints the opaque state
    void el.offsetHeight;

    // Step 2: start fade-out transition
    el.style.transition = `opacity ${duration_ms}ms ease-out`;
    el.style.opacity    = '0';

    // Safety: ensure opacity is 0 after transition completes
    this._timer = setTimeout(() => {
      el.style.transition = 'none';
      el.style.opacity    = '0';
      this._timer = null;
    }, duration_ms + 50);
  }
}
