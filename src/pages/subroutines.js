/**
 * AlphaCore Interactive Subroutines Console Page
 * Allows executing, benchmarking, and monitoring automated cognitive subroutines.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

const SUBROUTINES = [
  { id: 'SUB-01', name: 'SYNAPSE_PRUNING_V4', category: 'NEURAL', status: 'READY', desc: 'Prunes low-weight synapses to optimize cognitive throughput and reduce inferencing latency.' },
  { id: 'SUB-02', name: 'QUANTUM_ENTANGLEMENT_SYNC', category: 'CRYPTO', status: 'READY', desc: 'Syncs state keys with secure distributed offline Netlify storage nodes.' },
  { id: 'SUB-03', name: 'HEURISTIC_OVERDRIVE', category: 'PERF', status: 'READY', desc: 'Forces maximum GPU/CPU thread allocation for complex generative tasks.' },
  { id: 'SUB-04', name: 'LOG_PURGE_AND_ROTATE', category: 'SEC', status: 'READY', desc: 'Flushes temporary system caches and sanitizes security audit trails.' }
];

export default function SubroutinesPage() {
  const container = createElement('div', { class: 'subroutines-page-container' });

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// SUBROUTINE_CONSOLE">// SUBROUTINE_CONSOLE</h1>
      <div class="header-line"></div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; font-family:'Share Tech Mono',monospace;">
      <!-- Available Subroutines List -->
      <div class="panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(6,182,212,0.3)); padding:18px;">
        <div style="font-family:'Orbitron',sans-serif; font-size:1rem; font-weight:700; color:#fff; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          AVAILABLE SUBROUTINES
        </div>
        <div id="subroutine-list" style="display:flex; flex-direction:column; gap:12px;"></div>
      </div>

      <!-- Execution Console Output -->
      <div class="panel" style="background:rgba(5,10,18,0.9); border:1px solid rgba(255,255,255,0.1); padding:18px; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:var(--accent, #06b6d4);">// EXECUTION_LOG</span>
          <span id="sub-active-status" style="font-size:0.75rem; color:#888;">IDLE</span>
        </div>

        <div id="sub-console-output" style="flex:1; min-height:220px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.05); padding:12px; border-radius:4px; font-size:0.82rem; color:#aaa; overflow-y:auto; line-height:1.5;">
          <div style="color:#666;">> Select a subroutine to execute...</div>
        </div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#subroutine-list');
  const consoleEl = container.querySelector('#sub-console-output');
  const statusEl = container.querySelector('#sub-active-status');

  SUBROUTINES.forEach(sub => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.08);
      padding: 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="color:var(--accent, #06b6d4); font-weight:bold;">${sub.name}</span>
        <span style="font-size:0.75rem; color:#888; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">${sub.category}</span>
      </div>
      <p style="font-size:0.8rem; color:#aaa; margin:0 0 10px 0;">${sub.desc}</p>
      <button class="run-sub-btn" style="width:100%; background:rgba(6,182,212,0.15); border:1px solid var(--accent, #06b6d4); color:var(--accent, #06b6d4); padding:6px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; cursor:pointer;">
        ▶ EXECUTE SUBROUTINE
      </button>
    `;

    card.querySelector('.run-sub-btn').onclick = async (e) => {
      e.stopPropagation();
      runSubroutine(sub);
    };

    listEl.appendChild(card);
  });

  async function runSubroutine(sub) {
    statusEl.textContent = `RUNNING: ${sub.name}`;
    statusEl.style.color = 'var(--accent, #06b6d4)';
    consoleEl.innerHTML = `<div style="color:var(--accent,#06b6d4); font-weight:bold;">[${new Date().toLocaleTimeString()}] INITIATING ${sub.name}...</div>`;

    showToast('INFO', `Subroutine ${sub.name} started.`);

    const steps = [
      `Allocating virtual memory buffers for ${sub.id}...`,
      `Validating cryptographic signature & checksum...`,
      `Bypassing secondary execution constraints...`,
      `Executing thread operations across active CPU matrix...`,
      `Verification complete. Output written to system log.`
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 400));
      if (!consoleEl.isConnected) return;
      const line = document.createElement('div');
      line.style.color = '#ccc';
      line.textContent = `> ${step}`;
      consoleEl.appendChild(line);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }

    const doneLine = document.createElement('div');
    doneLine.style.cssText = 'color:#10b981; font-weight:bold; margin-top:8px;';
    doneLine.textContent = `[✓] SUBROUTINE ${sub.name} COMPLETED SUCCESSFULLY.`;
    consoleEl.appendChild(doneLine);

    statusEl.textContent = 'IDLE';
    statusEl.style.color = '#888';

    showToast('SUCCESS', `Subroutine ${sub.name} completed successfully!`);
  }

  return container;
}
