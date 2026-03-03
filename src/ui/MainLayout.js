/**
 * MainLayout.js — Top nav panel switching + DEFCON indicator
 * Exports: MainLayout class
 */

export class MainLayout {
  constructor() {
    this._currentPanel = 'scenarios';
  }

  /** Wire nav tab clicks to panel switching. */
  init() {
    const tabs = document.querySelectorAll('.nav-tab[data-panel]');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const panelName = btn.dataset.panel;
        this.switchPanel(panelName);
      });
    });

    // Set initial state
    this.switchPanel('scenarios');
    this.setDefcon(5);
  }

  /**
   * Show the named panel in #left-panel; hide all others.
   * @param {string} panelName — 'scenarios'|'weapons'|'forces'|'execute'|'results'
   */
  switchPanel(panelName) {
    this._currentPanel = panelName;

    // Update tab highlight
    document.querySelectorAll('.nav-tab[data-panel]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.panel === panelName);
    });

    // Map panel name → DOM id
    const panelMap = {
      scenarios: 'scenarios-panel',
      weapons:   'weapon-designer-panel',
      forces:    'forces-panel',
      execute:   'execute-panel',
    };

    // Right panel shows stats for 'results', left panel changes otherwise
    const rightPanel = document.getElementById('stats-panel');
    if (rightPanel) {
      rightPanel.style.display = panelName === 'results' ? 'block' : 'block'; // always show stats
    }

    // Switch left panels
    const leftPanels = document.querySelectorAll('#left-panel .panel');
    leftPanels.forEach(p => p.classList.remove('active'));

    const targetId = panelMap[panelName];
    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    }
  }

  /**
   * Update the DEFCON indicator (1-5).
   * @param {number} level — 1 (war) to 5 (peace)
   */
  setDefcon(level) {
    const nav = document.getElementById('top-nav');
    const levelEl = document.getElementById('defcon-level');
    if (!nav || !levelEl) return;

    // Remove old defcon class
    for (let i = 1; i <= 5; i++) nav.classList.remove(`defcon-${i}`);
    nav.classList.add(`defcon-${level}`);
    levelEl.textContent = level;

    const labels = { 1: 'COCKED PISTOL', 2: 'FAST PACE', 3: 'ROUND HOUSE', 4: 'DOUBLE TAKE', 5: 'FADE OUT' };
    nav.title = `DEFCON ${level} — ${labels[level] || ''}`;
  }

  getCurrentPanel() { return this._currentPanel; }
}
