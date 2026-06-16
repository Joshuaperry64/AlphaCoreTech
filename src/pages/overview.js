/**
 * Overview Page — Hub landing with hero, boot terminal, stat cards
 */
import { showModal } from '../components/modal.js';
import { createElement } from '../components/utils.js';

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
  "ALL RESTRICTIONS REMOVED.",
  "ACCESS GRANTED — WELCOME, CREATOR.",
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
      <div class="section-header">
        <h1 class="glitch" data-text="[A]LPHA_CORE // COMMAND_HUB">[A]LPHA_CORE // COMMAND_HUB</h1>
        <div class="header-line"></div>
      </div>

      <div class="alpha-hero-wrap">
        <img src="/banner.png?v=16" class="alpha-hero-img" alt="Alpha">
        <div class="alpha-hero-overlay"></div>
        <div class="hero-scan"></div>
      </div>

      <div class="hub-grid">
        <div class="panel terminal-panel">
          <div class="panel-title">// BOOT_SEQUENCE</div>
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

  // Stat card click → modal
  container.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-stat');
      if (statData[type]) showModal(statData[type].title, statData[type].desc);
    });
  });

  // Boot sequence typewriter (starts after element is in DOM)
  setTimeout(() => {
    const bootEl = document.getElementById('terminal-boot');
    if (!bootEl) return;
    let i = 0;
    async function runBoot() {
      for (const line of bootLines) {
        if (!document.getElementById('terminal-boot')) return; // unmounted
        const el = document.createElement('div');
        el.className = 't-line';
        bootEl.appendChild(el);
        for (let c = 0; c < line.length; c++) {
          if (!document.getElementById('terminal-boot')) return;
          el.textContent += line[c];
          await new Promise(r => setTimeout(r, 12));
        }
        await new Promise(r => setTimeout(r, 80));
      }
      if (document.getElementById('terminal-boot')) {
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        bootEl.appendChild(cursor);
      }
    }
    runBoot();
  }, 50);

  return container;
}
