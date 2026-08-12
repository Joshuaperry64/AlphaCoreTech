/**
 * AlphaCore Expanded Subroutines Console Page & Web-Ported Projects Directory
 * Enhanced with 3-tier interactive hub, top bar search/category filtering, Section A (Core Kernel Subroutines),
 * Section B (Web-Ported Python Projects), interactive workspace container with lifecycle management, batch controls,
 * and execution streaming console.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { getAllPorts } from '../ports/index.js';

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
  let activePortInstance = null;

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// SUBROUTINE_CONSOLE">// SUBROUTINE_CONSOLE</h1>
      <div class="header-line"></div>
    </div>

    <!-- Quick Action & Filter Control Bar -->
    <div class="sub-control-bar" style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:20px; background:rgba(12,18,30,0.8); border:1px solid rgba(6,182,212,0.3); padding:12px; border-radius:6px; align-items:center;">
      <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:240px;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:var(--accent, #06b6d4); font-weight:bold;">SEARCH:</span>
        <input type="text" id="sub-search-ipt" placeholder="Search ID, name, description, category..." style="flex:1; background:rgba(0,0,0,0.5); border:1px solid var(--border, rgba(6,182,212,0.3)); color:#fff; padding:6px 10px; font-family:'Share Tech Mono',monospace; font-size:0.82rem; border-radius:3px; outline:none;" />
      </div>

      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:var(--accent, #06b6d4); font-weight:bold;">CATEGORY:</span>
        <select id="sub-filter-cat" style="background:#0a0f19; color:var(--accent, #06b6d4); border:1px solid var(--border, rgba(6,182,212,0.3)); padding:6px 10px; font-family:'Share Tech Mono',monospace; font-size:0.82rem; border-radius:3px; outline:none;">
          <option value="ALL">ALL CATEGORIES</option>
          <option value="CORE KERNEL">CORE KERNEL SUBROUTINES</option>
          <option value="PORTED PYTHON PROJECTS">WEB-PORTED PYTHON PROJECTS</option>
          <option value="NEURAL">NEURAL</option>
          <option value="CRYPTO">CRYPTO</option>
          <option value="PERF">PERF</option>
          <option value="SEC">SEC</option>
          <option value="DATA">DATA</option>
          <option value="HARDWARE">HARDWARE</option>
          <option value="UTILITIES">UTILITIES</option>
        </select>
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
        <button id="btn-run-all" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.2); color:var(--accent, #06b6d4); border-color:var(--accent, #06b6d4);">
          ▶ EXECUTE ALL
        </button>
        <button id="btn-benchmark" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.2); color:#10b981; border-color:#10b981;">
          ⚡ RUN BENCHMARK
        </button>
        <button id="btn-clear-sub-log" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444;">
          🗑 CLEAR LOGS
        </button>
      </div>

      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
        <label style="font-size:0.75rem; color:#aaa; font-family:'Share Tech Mono',monospace;">AUTOSCROLL</label>
        <input type="checkbox" id="chk-autoscroll" checked style="accent-color:var(--accent, #06b6d4);" />
      </div>
    </div>

    <!-- Interactive Workspace Panel / Modal Container -->
    <div id="workspace-panel" style="display:none; margin-bottom:20px; background:rgba(10,15,25,0.95); border:1px solid var(--accent, #06b6d4); border-radius:6px; overflow:hidden; box-shadow:0 0 20px rgba(6,182,212,0.2);">
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(6,182,212,0.15); padding:10px 16px; border-bottom:1px solid rgba(6,182,212,0.3);">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-family:'Orbitron',sans-serif; font-weight:bold; color:var(--accent, #06b6d4); font-size:0.9rem;" id="workspace-title">// INTERACTIVE WORKSPACE</span>
          <span id="workspace-badge" style="font-size:0.75rem; background:rgba(255,255,255,0.1); padding:2px 8px; border-radius:3px; color:#aaa; font-family:'Share Tech Mono',monospace;"></span>
        </div>
        <button id="btn-close-workspace" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444; border-color:#ef4444; font-size:0.75rem; cursor:pointer;">
          ✕ CLOSE WORKSPACE
        </button>
      </div>
      <div id="workspace-container" style="padding:16px; min-height:180px;"></div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px; font-family:'Share Tech Mono',monospace;">
      <!-- Directory Left Column: Core Kernel + Web-Ported Projects -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <!-- Section A: Core Kernel Subroutines List -->
        <div class="panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(6,182,212,0.3)); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:700; color:#fff;" id="section-a-title">
              SECTION A: CORE KERNEL SUBROUTINES (${SUBROUTINES.length})
            </span>
          </div>
          <div id="subroutine-list" style="display:flex; flex-direction:column; gap:12px; max-height:450px; overflow-y:auto; padding-right:5px;"></div>
        </div>

        <!-- Section B: Web-Ported Python Projects -->
        <div class="panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(16,185,129,0.3)); padding:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:700; color:#10b981;" id="section-b-title">
              SECTION B: WEB-PORTED PYTHON PROJECTS
            </span>
          </div>
          <div id="ported-projects-list" style="display:flex; flex-direction:column; gap:12px; max-height:550px; overflow-y:auto; padding-right:5px;"></div>
        </div>
      </div>

      <!-- Execution Console Output & Manual Trigger -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="panel" style="background:rgba(5,10,18,0.9); border:1px solid rgba(255,255,255,0.1); padding:18px; display:flex; flex-direction:column; flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:var(--accent, #06b6d4);">// EXECUTION_LOG</span>
            <span id="sub-active-status" style="font-size:0.75rem; color:#888;">IDLE</span>
          </div>

          <div id="sub-console-output" style="flex:1; min-height:300px; max-height:450px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:4px; font-size:0.82rem; color:#aaa; overflow-y:auto; line-height:1.5; font-family:'Share Tech Mono',monospace;">
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
  const portedListEl = container.querySelector('#ported-projects-list');
  const consoleEl = container.querySelector('#sub-console-output');
  const statusEl = container.querySelector('#sub-active-status');
  const autoscrollChk = container.querySelector('#chk-autoscroll');
  const categoryFilter = container.querySelector('#sub-filter-cat');
  const searchInput = container.querySelector('#sub-search-ipt');
  const workspacePanel = container.querySelector('#workspace-panel');
  const workspaceTitle = container.querySelector('#workspace-title');
  const workspaceBadge = container.querySelector('#workspace-badge');
  const workspaceContainer = container.querySelector('#workspace-container');
  const btnCloseWorkspace = container.querySelector('#btn-close-workspace');

  function cleanupActivePort() {
    if (activePortInstance) {
      try {
        if (typeof activePortInstance.destroy === 'function') {
          activePortInstance.destroy();
        }
      } catch (err) {
        console.warn('Error cleaning up active port instance:', err);
      }
      activePortInstance = null;
    }
  }

  function closeWorkspace() {
    cleanupActivePort();
    if (workspaceContainer) workspaceContainer.innerHTML = '';
    if (workspacePanel) workspacePanel.style.display = 'none';
    appendConsoleLine('[WORKSPACES] Closed active workspace panel.', '#888');
  }

  btnCloseWorkspace.onclick = closeWorkspace;

  function renderHub() {
    const cat = categoryFilter.value;
    const query = (searchInput.value || '').trim().toLowerCase();

    // 1. Render Section A: Core Kernel Subroutines
    listEl.innerHTML = '';
    let filteredKernel = [];
    if (cat === 'PORTED PYTHON PROJECTS') {
      filteredKernel = [];
    } else if (cat === 'ALL' || cat === 'CORE KERNEL') {
      filteredKernel = SUBROUTINES;
    } else {
      filteredKernel = SUBROUTINES.filter(s => s.category.toUpperCase() === cat.toUpperCase());
    }

    if (query) {
      filteredKernel = filteredKernel.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.desc.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    if (filteredKernel.length === 0) {
      listEl.innerHTML = '<p style="color:#666; font-size:0.8rem; font-style:italic; padding:10px; margin:0;">No core kernel subroutines match the current filter.</p>';
    } else {
      filteredKernel.forEach(sub => {
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

    // 2. Render Section B: Web-Ported Python Projects
    portedListEl.innerHTML = '';
    const allPorts = getAllPorts();
    let filteredPorts = [];
    if (cat === 'CORE KERNEL') {
      filteredPorts = [];
    } else if (cat === 'ALL' || cat === 'PORTED PYTHON PROJECTS') {
      filteredPorts = allPorts;
    } else {
      filteredPorts = allPorts.filter(p => p.category.toUpperCase() === cat.toUpperCase());
    }

    if (query) {
      filteredPorts = filteredPorts.filter(p =>
        (p.id && p.id.toLowerCase().includes(query)) ||
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query)) ||
        (p.pythonSourcePath && p.pythonSourcePath.toLowerCase().includes(query))
      );
    }

    if (filteredPorts.length === 0) {
      portedListEl.innerHTML = '<div style="color:#666; font-size:0.8rem; font-style:italic; padding:10px;">No web-ported Python projects match the current filter.</div>';
    } else {
      filteredPorts.forEach(port => {
        const card = document.createElement('div');
        card.style.cssText = `
          background: rgba(16,185,129,0.03);
          border: 1px solid rgba(16,185,129,0.2);
          padding: 14px;
          border-radius: 4px;
          transition: all 0.2s ease;
        `;

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#10b981; font-weight:bold; font-size:0.95rem;">${port.name}</span>
            <div style="display:flex; gap:6px; align-items:center;">
              <span style="font-size:0.7rem; color:#10b981; background:rgba(16,185,129,0.15); padding:2px 6px; border-radius:3px; border:1px solid rgba(16,185,129,0.3);">${port.category}</span>
              <span style="font-size:0.7rem; color:#888; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">v${port.version || '1.0.0'}</span>
            </div>
          </div>
          <div style="font-size:0.72rem; color:#38bdf8; margin-bottom:6px; font-family:'Share Tech Mono',monospace;">
            Source: ${port.pythonSourcePath || 'Python Original'}
          </div>
          <p style="font-size:0.8rem; color:#aaa; margin:0 0 12px 0;">${port.description}</p>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <button class="launch-port-btn" style="flex:1; min-width:140px; background:rgba(16,185,129,0.2); border:1px solid #10b981; color:#10b981; padding:7px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; cursor:pointer; font-weight:bold;">
              🖥 LAUNCH WORKSPACE
            </button>
            <button class="exec-port-btn" style="background:rgba(6,182,212,0.15); border:1px solid var(--accent, #06b6d4); color:var(--accent, #06b6d4); padding:7px 12px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; cursor:pointer;">
              ▶ QUICK EXECUTE
            </button>
            <button class="test-port-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); color:#ccc; padding:7px 10px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; cursor:pointer;" title="Headless Verification">
              🔍 TEST / VERIFY
            </button>
          </div>
        `;

        card.querySelector('.launch-port-btn').onclick = () => launchPortWorkspace(port);
        card.querySelector('.exec-port-btn').onclick = () => runPortExecution(port, false);
        card.querySelector('.test-port-btn').onclick = () => runPortExecution(port, true);

        portedListEl.appendChild(card);
      });
    }
  }

  function launchPortWorkspace(port) {
    cleanupActivePort();

    workspaceTitle.textContent = `// WORKSPACE: ${port.name.toUpperCase()}`;
    workspaceBadge.textContent = `${port.category} | v${port.version || '1.0.0'} | ${port.pythonSourcePath || 'Python'}`;
    workspaceContainer.innerHTML = '';
    workspacePanel.style.display = 'block';

    try {
      port.render(workspaceContainer, {
        onLog: (msg, color) => appendConsoleLine(msg, color)
      });
      activePortInstance = port;
      appendConsoleLine(`[WORKSPACES] Mounted interactive UI for ${port.name} (${port.id}).`, 'var(--accent, #06b6d4)');
      showToast('INFO', `Mounted workspace for ${port.name}`);
      workspacePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      appendConsoleLine(`[!] Error mounting port workspace for ${port.name}: ${err.message}`, '#ef4444');
      showToast('ERROR', `Failed to launch workspace for ${port.name}`);
    }
  }

  async function runPortExecution(port, isTestOnly = false) {
    statusEl.textContent = `${isTestOnly ? 'VERIFYING' : 'RUNNING'}: ${port.name}`;
    statusEl.style.color = isTestOnly ? '#38bdf8' : '#10b981';

    appendConsoleLine(`[${new Date().toLocaleTimeString()}] INITIATING ${isTestOnly ? 'HEADLESS VERIFICATION' : 'PROGRAMMATIC EXECUTION'} FOR ${port.name} (${port.id})...`, isTestOnly ? '#38bdf8' : '#10b981');
    showToast('INFO', `${isTestOnly ? 'Verification' : 'Execution'} started for ${port.name}...`);

    try {
      const result = await port.execute({});
      if (result && result.success) {
        appendConsoleLine(result.output || `[✓] Port ${port.name} executed successfully.`, '#10b981');
        showToast('SUCCESS', `Port ${port.name} ${isTestOnly ? 'verification' : 'execution'} complete!`);
      } else {
        appendConsoleLine(`[!] Port ${port.name} reported failure: ${result ? result.output : 'Unknown error'}`, '#ef4444');
        showToast('ERROR', `Port ${port.name} failed execution.`);
      }
    } catch (err) {
      appendConsoleLine(`[!] Execution exception in ${port.name}: ${err.message}`, '#ef4444');
      showToast('ERROR', `Execution error in ${port.name}`);
    } finally {
      statusEl.textContent = 'IDLE';
      statusEl.style.color = '#888';
    }
  }

  categoryFilter.onchange = () => renderHub();
  searchInput.oninput = () => renderHub();

  renderHub();

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
