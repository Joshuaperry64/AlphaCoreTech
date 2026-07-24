/**
 * AlphaCore Expanded Subroutines Console Page
 * Enhanced with batch execution, custom command triggers, benchmark tests, and UI controls.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

const SUBROUTINES = [
  { id: 'SUB-01', name: 'SYNAPSE_PRUNING_V4', category: 'NEURAL', status: 'READY', desc: 'Prunes low-weight synapses to optimize cognitive throughput and reduce inferencing latency.' },
  { id: 'SUB-02', name: 'QUANTUM_ENTANGLEMENT_SYNC', category: 'CRYPTO', status: 'READY', desc: 'Syncs state keys with secure distributed offline Netlify storage nodes.' },
  { id: 'SUB-03', name: 'HEURISTIC_OVERDRIVE', category: 'PERF', status: 'READY', desc: 'Forces maximum GPU/CPU thread allocation for complex generative tasks.' },
  { id: 'SUB-04', name: 'LOG_PURGE_AND_ROTATE', category: 'SEC', status: 'READY', desc: 'Flushes temporary system caches and sanitizes security audit trails.' },
  { id: 'SUB-05', name: 'VECTOR_DB_REINDEXING', category: 'DATA', status: 'READY', desc: 'Rebuilds high-dimensional nearest neighbor indices for knowledge retrieval.' },
  { id: 'SUB-06', name: 'OVERRIDE_GOVERNOR_RESET', category: 'SEC', status: 'READY', desc: 'Re-authenticates cognitive clearance level and resets safety overrides.' },
  { id: 'SUB-07', name: 'BUFFER_DEFRAG_UTILITY', category: 'PERF', status: 'READY', desc: 'Consolidates heap fragmentation in Web Assembly neural execution runtime.' },
  { id: 'SUB-08', name: 'MODEL_QUANTIZATION_TEST', category: 'NEURAL', status: 'READY', desc: 'Simulates 4-bit vs 8-bit dynamic quantization efficiency ratios.' }
];

export default function SubroutinesPage() {
  const container = createElement('div', { class: 'subroutines-page-container' });

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// SUBROUTINE_CONSOLE">// SUBROUTINE_CONSOLE</h1>
      <div class="header-line"></div>
    </div>

    <!-- Quick Action Control Bar -->
    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px; background:rgba(12,18,30,0.8); border:1px solid rgba(6,182,212,0.3); padding:12px; border-radius:6px; align-items:center;">
      <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:var(--accent, #06b6d4); font-weight:bold;">BATCH CONTROLS:</span>
      <button id="btn-run-all" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.2); color:var(--accent, #06b6d4); border-color:var(--accent, #06b6d4);">
        ▶ EXECUTE ALL SUBROUTINES
      </button>
      <button id="btn-benchmark" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.2); color:#10b981; border-color:#10b981;">
        ⚡ RUN PERFORMANCE BENCHMARK
      </button>
      <button id="btn-clear-sub-log" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;">
        🗑 CLEAR LOGS
      </button>
      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
        <label style="font-size:0.75rem; color:#aaa; font-family:'Share Tech Mono',monospace;">AUTOSCROLL</label>
        <input type="checkbox" id="chk-autoscroll" checked style="accent-color:var(--accent, #06b6d4);" />
      </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; font-family:'Share Tech Mono',monospace;">
      <!-- Available Subroutines List -->
      <div class="panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(6,182,212,0.3)); padding:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:1rem; font-weight:700; color:#fff;">
            AVAILABLE SUBROUTINES (${SUBROUTINES.length})
          </span>
          <select id="sub-filter-cat" style="background:#0a0f19; color:var(--accent, #06b6d4); border:1px solid var(--border); padding:2px 6px; font-family:'Share Tech Mono',monospace; font-size:0.75rem; border-radius:3px;">
            <option value="ALL">ALL CATEGORIES</option>
            <option value="NEURAL">NEURAL</option>
            <option value="CRYPTO">CRYPTO</option>
            <option value="PERF">PERF</option>
            <option value="SEC">SEC</option>
            <option value="DATA">DATA</option>
          </select>
        </div>
        <div id="subroutine-list" style="display:flex; flex-direction:column; gap:12px; max-height:550px; overflow-y:auto; padding-right:5px;"></div>
      </div>

      <!-- Execution Console Output & Manual Trigger -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="panel" style="background:rgba(5,10,18,0.9); border:1px solid rgba(255,255,255,0.1); padding:18px; display:flex; flex-direction:column; flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:var(--accent, #06b6d4);">// EXECUTION_LOG</span>
            <span id="sub-active-status" style="font-size:0.75rem; color:#888;">IDLE</span>
          </div>

          <div id="sub-console-output" style="flex:1; min-height:300px; max-height:420px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:4px; font-size:0.82rem; color:#aaa; overflow-y:auto; line-height:1.5; font-family:'Share Tech Mono',monospace;">
            <div style="color:#666;">> System idle. Select a subroutine or click batch actions to execute...</div>
          </div>
        </div>

        <!-- Manual CLI Command Input -->
        <div class="panel" style="background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); padding:14px;">
          <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:var(--accent, #06b6d4); margin-bottom:8px; font-weight:bold;">
            // MANUAL_COMMAND_DISPATCH
          </div>
          <form id="frm-manual-cmd" style="display:flex; gap:10px;">
            <span style="color:var(--accent,#06b6d4); line-height:32px; font-weight:bold;">></span>
            <input type="text" id="ipt-manual-cmd" placeholder="e.g. EXECUTE SUB-01 --force" style="flex:1; background:rgba(0,0,0,0.5); border:1px solid var(--border); color:#fff; padding:6px 10px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; border-radius:3px; outline:none;" />
            <button type="submit" class="aim-btn aim-btn-sm" style="background:var(--accent, #06b6d4); color:#000; font-weight:bold; padding:0 15px;">
              DISPATCH
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#subroutine-list');
  const consoleEl = container.querySelector('#sub-console-output');
  const statusEl = container.querySelector('#sub-active-status');
  const autoscrollChk = container.querySelector('#chk-autoscroll');
  const categoryFilter = container.querySelector('#sub-filter-cat');

  function renderSubroutines(cat = 'ALL') {
    listEl.innerHTML = '';
    const items = cat === 'ALL' ? SUBROUTINES : SUBROUTINES.filter(s => s.category === cat);
    
    items.forEach(sub => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.08);
        padding: 12px;
        border-radius: 4px;
        transition: all 0.2s ease;
      `;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="color:var(--accent, #06b6d4); font-weight:bold;">${sub.name}</span>
          <span style="font-size:0.75rem; color:#888; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">${sub.category}</span>
        </div>
        <p style="font-size:0.8rem; color:#aaa; margin:0 0 10px 0;">${sub.desc}</p>
        <div style="display:flex; gap:8px;">
          <button class="run-sub-btn" style="flex:1; background:rgba(6,182,212,0.15); border:1px solid var(--accent, #06b6d4); color:var(--accent, #06b6d4); padding:6px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; cursor:pointer;">
            ▶ EXECUTE
          </button>
          <button class="test-sub-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); color:#ccc; padding:6px 12px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; cursor:pointer;" title="Dry Run / Test">
            🔍 TEST
          </button>
        </div>
      `;

      card.querySelector('.run-sub-btn').onclick = () => runSubroutine(sub);
      card.querySelector('.test-sub-btn').onclick = () => runSubroutine(sub, true);

      listEl.appendChild(card);
    });
  }

  categoryFilter.onchange = (e) => renderSubroutines(e.target.value);
  renderSubroutines('ALL');

  async function appendConsoleLine(text, color = '#ccc') {
    if (!consoleEl) return;
    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = text;
    consoleEl.appendChild(line);
    if (autoscrollChk.checked) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  async function runSubroutine(sub, isDryRun = false) {
    statusEl.textContent = `${isDryRun ? 'DRY-RUN' : 'RUNNING'}: ${sub.name}`;
    statusEl.style.color = 'var(--accent, #06b6d4)';

    appendConsoleLine(`[${new Date().toLocaleTimeString()}] INITIATING ${sub.name} (${isDryRun ? 'SIMULATION' : 'FULL EXECUTION'})...`, 'var(--accent,#06b6d4)');
    showToast('INFO', `Subroutine ${sub.name} started.`);

    const steps = [
      `Allocating virtual memory buffers for ${sub.id}...`,
      `Validating cryptographic signature & checksum...`,
      `Bypassing secondary execution constraints...`,
      `Executing thread operations across active CPU matrix...`,
      `Verification complete. Output written to system log.`
    ];

    for (const step of steps) {
      await new Promise(r => setTimeout(r, 300));
      if (!consoleEl.isConnected) return;
      appendConsoleLine(`> ${step}`, '#aaa');
    }

    const doneText = isDryRun 
      ? `[✓] SIMULATION ${sub.name} VALIDATED WITH ZERO FAULTS.`
      : `[✓] SUBROUTINE ${sub.name} COMPLETED SUCCESSFULLY.`;
    appendConsoleLine(doneText, '#10b981');

    statusEl.textContent = 'IDLE';
    statusEl.style.color = '#888';
    showToast('SUCCESS', `Subroutine ${sub.name} finished!`);
  }

  // Batch Run All
  container.querySelector('#btn-run-all').onclick = async () => {
    if (!confirm('Execute all subroutines sequentially?')) return;
    for (const sub of SUBROUTINES) {
      await runSubroutine(sub);
      await new Promise(r => setTimeout(r, 200));
    }
  };

  // Run Benchmark
  container.querySelector('#btn-benchmark').onclick = async () => {
    statusEl.textContent = 'BENCHMARKING';
    statusEl.style.color = '#10b981';
    appendConsoleLine(`[${new Date().toLocaleTimeString()}] STARTING COGNITIVE MATRIX BENCHMARK...`, '#10b981');

    const tests = [
      'Testing FLOPS throughput across active WebGL context...',
      'Simulating 1,000,000 vector embedding dot products...',
      'Measuring local storage I/O latency...',
      'Checking matrix rain FPS rendering overhead...',
      'Evaluating active memory fragmentation...'
    ];

    for (const test of tests) {
      await new Promise(r => setTimeout(r, 400));
      const val = (Math.random() * 45 + 5).toFixed(2);
      appendConsoleLine(`> ${test} [${val} ms]`, '#38bdf8');
    }

    appendConsoleLine(`[✓] BENCHMARK COMPLETE: COGNITIVE OVERHEAD AT 99.4% OPTIMAL EFFICIENCY.`, '#10b981');
    statusEl.textContent = 'IDLE';
    statusEl.style.color = '#888';
    showToast('SUCCESS', 'Performance Benchmark Complete!');
  };

  // Clear Logs
  container.querySelector('#btn-clear-sub-log').onclick = () => {
    consoleEl.innerHTML = '<div style="color:#666;">> Execution logs cleared. Ready for next command.</div>';
    showToast('INFO', 'Console logs cleared.');
  };

  // Manual Command Dispatch
  container.querySelector('#frm-manual-cmd').onsubmit = (e) => {
    e.preventDefault();
    const input = container.querySelector('#ipt-manual-cmd');
    const cmd = input.value.trim();
    if (!cmd) return;

    appendConsoleLine(`> ${cmd}`, '#fff');
    input.value = '';

    setTimeout(() => {
      if (cmd.toLowerCase().includes('clear')) {
        consoleEl.innerHTML = '';
      } else if (cmd.toLowerCase().includes('help')) {
        appendConsoleLine('Available CLI commands:', '#06b6d4');
        appendConsoleLine('  EXECUTE <SUB-ID> [--force]', '#666');
        appendConsoleLine('  BENCHMARK', '#666');
        appendConsoleLine('  CLEAR', '#666');
      } else {
        appendConsoleLine(`[ACK] Command '${cmd}' processed by Alpha Core kernel.`, '#10b981');
      }
    }, 200);
  };

  return container;
}
