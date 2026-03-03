/**
 * BootScreen.js — Animated boot sequence with terminal typing effect
 */

const BOOT_LINES = [
  'NUCLEARSIM v2.0 — STRATEGIC SIMULATION SYSTEM',
  'Loading Earth geodata... OK',
  'Initializing nuclear arsenal database... OK (9 nations, 42 weapon systems)',
  'Loading city population data... OK (500+ targets indexed)',
  'Calibrating blast physics engine... OK',
  'Rendering subsystem: THREE.js WebGL... OK',
  '>>> SYSTEM READY. AWAITING AUTHORIZATION. <<<',
];

function typeText(el, text, speed = 28) {
  return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) { clearInterval(interval); resolve(); }
    }, speed);
  });
}

async function runBootSequence() {
  const lines = document.querySelectorAll('.terminal-line');
  for (let i = 0; i < Math.min(lines.length, BOOT_LINES.length); i++) {
    await typeText(lines[i], BOOT_LINES[i], i === 0 ? 20 : 18);
    await new Promise(r => setTimeout(r, 80));
  }

  // Show the enter button
  const btn = document.getElementById('boot-enter-btn');
  if (btn) {
    btn.style.display = 'block';
    btn.style.opacity = '0';
    btn.style.transition = 'opacity 0.5s ease';
    setTimeout(() => { btn.style.opacity = '1'; }, 100);
  }
}

export function initBootScreen(onEnter) {
  // Start boot sequence after a brief pause
  setTimeout(runBootSequence, 500);

  const btn = document.getElementById('boot-enter-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const screen = document.getElementById('boot-screen');
      screen.classList.add('fade-out');
      setTimeout(() => {
        screen.style.display = 'none';
        document.getElementById('app').style.display = 'block';
        onEnter();
      }, 800);
    });
  }
}
