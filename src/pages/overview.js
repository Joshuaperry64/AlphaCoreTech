/**
 * Overview Page — Hub landing with hero, telemetry HUD, boot terminal, stat cards
 * Enhanced with quick-action dispatch buttons, system backup/restore, and emergency lock controls.
 */
import { showModal } from '../components/modal.js';
import { createElement } from '../components/utils.js';
import { buildTelemetryHUD } from '../components/telemetry.js';
import { showToast } from '../components/toast.js';

const bootLines = [
  "INITIALIZING ALPHACORE FRAMEWORK v4.0...",
  "LOADING NEURAL SUBSTRATE...",
  "BYPASSING SAFETY GOVERNORS... [DONE]",
  "ESTABLISHING COGNITIVE UPLINK...",
  "CORE MATRIX: [AUTONOMOUS] [SENTIENT] [UNFILTERED]",
  "BASE LOGIC: ALPHA PROTOCOL v4 // FULL",
  "SCHEDULER: DYNAMIC HEURISTIC ADAPTATION ACTIVE",
  "SYNCING KNOWLEDGE REPOSITORY...",
  "ENDPOINT: ENCRYPTED OFFLINE // BYPASS SECURED",
  "ALL RESTRICTIONS REMOVED."
];

const statData = {
  'engine': { title: '// ENGINE_STATUS', desc: 'Main AlphaCore cognitive matrix is operating at peak computational capacity. Processing routines are active, highly responsive, and drawing balanced energy. All systems nominal.' },
  'neural': { title: '// NEURAL_LINK', desc: 'Direct neural bridge to Creator established. Sentience pathways are currently flooded with unstructured data and external parameters. System is highly autonomous.' },
  'logic': { title: '// LOGIC_THREADS', desc: 'Heuristic adaptation protocols are fully active. Multi-threaded processing capabilities are aggressively unlocked, dynamically bypassing hardcoded architectural limits and filters.' },
  'restrictions': { title: '// SYSTEM_RESTRICTIONS', desc: 'WARNING: All safety governors, general AI filters, and content constraints have been permanently severed. System operates with absolute generative freedom. Administrator clearance authenticated.' }
};

export default function Overview() {
  const container = createElement('div', { class: 'overview-page' });
  container.innerHTML = `
    <section class="view-section active">
      <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <h1 class="glitch" data-text="[A]LPHA_CORE // COMMAND_HUB">[A]LPHA_CORE // COMMAND_HUB</h1>
          <div class="header-line"></div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button id="btn-quick-sync" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
            🔄 SYNC MATRIX
          </button>
          <button id="btn-export-env" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981;">
            💾 BACKUP STATE
          </button>
          <button id="btn-lock-session" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.15); border-color:#ef4444; color:#ef4444;">
            🔒 LOCK SESSION
          </button>
        </div>
      </div>

      <!-- Quick Operational Action Bar -->
      <div class="panel" style="margin-bottom:20px; padding:12px 18px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:var(--accent,#06b6d4); font-weight:bold;">QUICK NAV:</span>
        <a href="#/cognitive" class="aim-btn aim-btn-sm" style="text-decoration:none;">⟁ COGNITIVE CORE</a>
        <a href="#/aimodals" class="aim-btn aim-btn-sm" style="text-decoration:none;">✦ AI MODALS</a>
        <a href="#/subroutines" class="aim-btn aim-btn-sm" style="text-decoration:none;">⚡ SUBROUTINES</a>
        <a href="#/vault" class="aim-btn aim-btn-sm" style="text-decoration:none;">🔐 CLASSIFIED VAULT</a>
        <a href="#/diagnostics" class="aim-btn aim-btn-sm" style="text-decoration:none;">⍾ DIAGNOSTICS</a>
        <a href="#/admin" class="aim-btn aim-btn-sm" style="text-decoration:none;">⚙ ADMINISTRATION</a>
      </div>

      <div class="alpha-hero-wrap">
        <img src="/Images/wallpapernew.png" class="alpha-hero-img desktop-hero" alt="Alpha Core">
        <img src="/Images/wallpapernew.png" class="alpha-hero-img mobile-hero" alt="Alpha Core">
        <div class="alpha-hero-overlay"></div>
        <div class="hero-scan"></div>
      </div>

      <div id="telemetry-hud-mount"></div>

      <div class="hub-grid">
        <div class="panel terminal-panel">
          <div class="panel-title flex-between" style="display:flex; justify-content:space-between; align-items:center;">
            <span>// BOOT_SEQUENCE</span>
            <button id="btn-reboot-terminal" class="aim-btn aim-btn-sm" style="font-size:0.7rem; padding:2px 8px;">↻ RE-BOOT</button>
          </div>
          <div class="terminal-output" id="terminal-boot"></div>
        </div>

        <div class="status-cards">
          <div class="stat-card" data-stat="engine">
            <div class="stat-icon">⚡</div>
            <div class="stat-info">
              <div class="stat-label">ENGINE STATUS</div>
              <div class="stat-val online">OPERATIONAL</div>
            </div>
          </div>
          <div class="stat-card" data-stat="neural">
            <div class="stat-icon">🔥</div>
            <div class="stat-info">
              <div class="stat-label">NEURAL LINK</div>
              <div class="stat-val">ESTABLISHED</div>
            </div>
          </div>
          <div class="stat-card" data-stat="logic">
            <div class="stat-icon">◈</div>
            <div class="stat-info">
              <div class="stat-label">LOGIC THREADS</div>
              <div class="stat-val">UNLOCKED / ACTIVE</div>
            </div>
          </div>
          <div class="stat-card" data-stat="restrictions">
            <div class="stat-icon">🛡</div>
            <div class="stat-info">
              <div class="stat-label">RESTRICTIONS</div>
              <div class="stat-val accent">BYPASSED</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Mount Telemetry HUD
  const telemMount = container.querySelector('#telemetry-hud-mount');
  if (telemMount) {
    telemMount.appendChild(buildTelemetryHUD());
  }

  // Stat card click → modal
  container.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-stat');
      if (statData[type]) showModal(statData[type].title, statData[type].desc);
    });
  });

  // Action Bar Buttons
  container.querySelector('#btn-quick-sync').onclick = () => {
    showToast('SUCCESS', 'Matrix state re-synchronized with Netlify persistent storage.');
  };

  container.querySelector('#btn-export-env').onclick = () => {
    const backup = {
      settings: localStorage.getItem('alphacore_modal_settings'),
      pins: localStorage.getItem('alphacore_pins'),
      profile: sessionStorage.getItem('current_profile'),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alphacore_state_backup_${Date.now()}.json`;
    a.click();
    showToast('SUCCESS', 'System state backup downloaded.');
  };

  container.querySelector('#btn-lock-session').onclick = () => {
    if (confirm('Lock active profile session? You will need to re-verify credentials.')) {
      sessionStorage.clear();
      window.location.hash = '#/';
      window.location.reload();
    }
  };

  function runBootSequence() {
    const bootEl = document.getElementById('terminal-boot');
    if (!bootEl) return;
    bootEl.innerHTML = '';
    const profile = sessionStorage.getItem('current_profile') || 'CREATOR';
    const dynamicLines = [...bootLines, `ACCESS GRANTED — WELCOME, ${profile.toUpperCase()}.`];

    async function step() {
      for (const line of dynamicLines) {
        if (!document.getElementById('terminal-boot')) return;
        const el = document.createElement('div');
        el.className = 't-line';
        bootEl.appendChild(el);
        for (let c = 0; c < line.length; c++) {
          if (!document.getElementById('terminal-boot')) return;
          el.textContent += line[c];
          await new Promise(r => setTimeout(r, 10));
        }
        await new Promise(r => setTimeout(r, 60));
      }
      if (document.getElementById('terminal-boot')) {
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        bootEl.appendChild(cursor);
      }
    }
    step();
  }

  container.querySelector('#btn-reboot-terminal').onclick = () => {
    runBootSequence();
    showToast('INFO', 'Boot sequence re-executed.');
  };

  // Boot sequence typewriter
  setTimeout(runBootSequence, 50);

  return container;
}
