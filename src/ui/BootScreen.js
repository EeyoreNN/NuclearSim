/**
 * BootScreen.js — Animated boot sequence
 * Exports: runBootSequence() → Promise<void>
 *
 * Shows: logo, THE QUOTE, system-check lines, progress bar.
 * Resolves when boot animation completes and #app is revealed.
 */

const SYSTEM_CHECKS = [
  'VERIFYING LAUNCH AUTHORIZATION CODES',
  'LOADING ARSENAL DATABASE (9 NATIONS / 42 SYSTEMS)',
  'INITIALIZING PHYSICS ENGINE (GLASSTONE-DOLAN)',
  'INDEXING TARGET CITIES (500+ LOCATIONS)',
  'CALIBRATING BLAST RADIUS CALCULATOR',
  'LOADING POPULATION GRID (GPWV4)',
  'INITIALIZING THREE.JS WEBGL RENDERER',
  'ESTABLISHING NORAD LINK',
  'ALL SYSTEMS NOMINAL — CLEARED FOR OPERATION',
];

/**
 * Animate the progress bar and system check lines, then reveal #app.
 * @returns {Promise<void>} Resolves when transition to #app is complete.
 */
export function runBootSequence() {
  return new Promise(resolve => {
    const bootScreen = document.getElementById('boot-screen');
    const bootBar    = document.getElementById('boot-bar');
    const checksEl   = document.getElementById('boot-checks');

    if (!bootScreen) { resolve(); return; }

    // Build check line elements
    const lineEls = SYSTEM_CHECKS.map(text => {
      const div = document.createElement('div');
      div.className = 'boot-check-line';
      checksEl?.appendChild(div);
      return { el: div, text };
    });

    const TOTAL_DURATION = 2800; // ms for full bar animation
    const startTime = performance.now();
    let checkIdx = 0;
    let done = false;

    function update(now) {
      if (done) return;

      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / TOTAL_DURATION, 1.0);

      // Update progress bar
      if (bootBar) bootBar.style.width = (progress * 100) + '%';

      // Reveal check lines at evenly-spaced intervals
      const lineProgress = progress * (SYSTEM_CHECKS.length - 1);
      while (checkIdx <= Math.floor(lineProgress) && checkIdx < lineEls.length) {
        const { el, text } = lineEls[checkIdx];
        const isLast = checkIdx === lineEls.length - 1;
        el.classList.add('visible');
        el.innerHTML = isLast
          ? `<span class="ok">&#10003; ${text}</span>`
          : `<span class="ok">&#10003; ${text}... OK</span>`;
        checkIdx++;
      }

      if (progress < 1.0) {
        requestAnimationFrame(update);
      } else {
        done = true;
        // Short pause, then fade out boot screen and reveal app
        setTimeout(() => {
          bootScreen.classList.add('fade-out');
          setTimeout(() => {
            bootScreen.style.display = 'none';
            const app = document.getElementById('app');
            if (app) app.style.display = 'block';
            resolve();
          }, 800);
        }, 400);
      }
    }

    requestAnimationFrame(update);
  });
}
