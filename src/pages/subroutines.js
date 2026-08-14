/**
 * AlphaCore Expanded Subroutines Console Page & Web-Ported Projects Directory
 * Overhauled for Milestone 2: Cyberpunk / Terminal UX, Search & Multi-Category Filtering,
 * Alphabetical Sorting, Timeline / Recent View, Fullscreen Workspace Takeover, and Profile Security Clearance.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { getAllPorts } from '../ports/index.js';
import { buildPinPad } from '../components/pinpad.js';
import { showModal } from '../components/modal.js';

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
  let currentSortOrder = 'DEFAULT'; // 'DEFAULT', 'A-Z', 'Z-A'
  let currentViewMode = 'GRID'; // 'GRID', 'TIMELINE'

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch cyber-typing-title" data-text="// SUBROUTINE_CONSOLE">// SUBROUTINE_CONSOLE</h1>
      <div class="header-line"></div>
      <p class="cyber-subtitle" style="font-size:0.8rem; color:#888; margin-top:4px; font-family:'Share Tech Mono',monospace;">
        DIRECT VIEW DIRECTORY // 57 WEB-PORTED PYTHON SUBROUTINES & CORE KERNEL SERVICES
      </p>
    </div>

    <!-- Quick Action, Filtering, Sorting & Auth Control Bar -->
    <div class="sub-control-bar" style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:16px; background:rgba(12,18,30,0.9); border:1px solid rgba(6,182,212,0.35); padding:14px; border-radius:6px; align-items:center; box-shadow:0 0 15px rgba(0,0,0,0.5);">
      <!-- Real-time Search Input -->
      <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:240px;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:var(--accent, #06b6d4); font-weight:bold;">SEARCH:</span>
        <input type="text" id="sub-search-ipt" placeholder="Search ID, name, description, category, source path..." style="flex:1; background:rgba(0,0,0,0.6); border:1px solid var(--border, rgba(6,182,212,0.3)); color:#fff; padding:6px 10px; font-family:'Share Tech Mono',monospace; font-size:0.82rem; border-radius:3px; outline:none;" />
      </div>

      <!-- Domain / Topic Category Filter Dropdown -->
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
          <option value="AI/ML">AI/ML</option>
          <option value="SECURITY">SECURITY</option>
          <option value="MOBILE">MOBILE</option>
          <option value="AUDIO">AUDIO</option>
          <option value="SYSTEM">SYSTEM</option>
          <option value="NETWORK">NETWORK</option>
          <option value="SIMULATION">SIMULATION</option>
          <option value="REVERSE ENGINEERING">REVERSE ENGINEERING</option>
        </select>
      </div>

      <!-- Alphabetical Sort Toggle -->
      <button id="btn-sort-az" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); color:var(--accent, #06b6d4); border-color:var(--accent, #06b6d4); font-size:0.8rem; cursor:pointer;" title="Toggle A-Z / Z-A Sorting">
        🔤 <span id="sort-order-label">SORT: DEFAULT</span>
      </button>

      <!-- Timeline / Recent View Toggle -->
      <button id="btn-timeline-toggle" class="aim-btn aim-btn-sm" style="background:rgba(245,158,11,0.15); color:#f59e0b; border-color:#f59e0b; font-size:0.8rem; cursor:pointer;" title="Toggle Grid / Recent Timeline View">
        ⏱️ <span id="view-mode-label">VIEW: GRID</span>
      </button>

      <!-- Profile Auth Clearance Badge & Button -->
      <div style="display:flex; align-items:center; gap:8px;">
        <div id="sub-auth-badge" style="font-family:'Share Tech Mono',monospace; font-size:0.78rem; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#10b981; padding:4px 8px; border-radius:3px;">
          CLEARANCE: <strong id="sub-profile-label">ARCHITECT</strong>
        </div>
        <button id="btn-sub-auth" class="aim-btn aim-btn-sm" style="background:rgba(168,85,247,0.15); color:#a855f7; border-color:#a855f7; font-size:0.75rem; cursor:pointer;" title="Authenticate / Switch Profile">
          🔑 AUTH PROFILE
        </button>
      </div>

      <!-- Batch Action Controls -->
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

      <!-- Autoscroll Toggle -->
      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
        <label style="font-size:0.75rem; color:#aaa; font-family:'Share Tech Mono',monospace;">AUTOSCROLL</label>
        <input type="checkbox" id="chk-autoscroll" checked style="accent-color:var(--accent, #06b6d4);" />
      </div>
    </div>

    <!-- Quick Category Pill Tabs -->
    <div id="sub-cat-pills-bar" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:20px;"></div>

    <!-- Interactive Workspace Panel / Takeover Container -->
    <div id="workspace-panel" style="display:none; margin-bottom:20px; background:rgba(10,15,25,0.98); border:2px solid var(--accent, #06b6d4); border-radius:6px; overflow:hidden; box-shadow:0 0 25px rgba(6,182,212,0.3); transition:all 0.3s ease;">
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(6,182,212,0.18); padding:12px 18px; border-bottom:1px solid rgba(6,182,212,0.35);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-family:'Orbitron',sans-serif; font-weight:bold; color:var(--accent, #06b6d4); font-size:1rem;" id="workspace-title">// INTERACTIVE WORKSPACE</span>
          <span id="workspace-badge" style="font-size:0.75rem; background:rgba(255,255,255,0.1); padding:3px 10px; border-radius:3px; color:#38bdf8; font-family:'Share Tech Mono',monospace; border:1px solid rgba(56,189,248,0.3);"></span>
        </div>
        <button id="btn-close-workspace" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.25); color:#ef4444; border:1px solid #ef4444; font-size:0.8rem; cursor:pointer; font-weight:bold; padding:6px 14px; border-radius:4px; box-shadow:0 0 10px rgba(239,68,68,0.3);">
          ✕ CLOSE WORKSPACE
        </button>
      </div>
      <div id="workspace-container" style="padding:18px; min-height:220px;"></div>
    </div>

    <!-- Subroutines Main Directory & Log Split View -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap:20px; font-family:'Share Tech Mono',monospace;">
      <!-- Directory Left Column: Core Kernel + Web-Ported Projects -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <!-- Section A: Core Kernel Subroutines List -->
        <div class="panel cyber-panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(6,182,212,0.3)); padding:18px; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:700; color:#fff;" id="section-a-title">
              SECTION A: CORE KERNEL SUBROUTINES (${SUBROUTINES.length})
            </span>
          </div>
          <div id="subroutine-list" style="display:flex; flex-direction:column; gap:12px; max-height:450px; overflow-y:auto; padding-right:5px;"></div>
        </div>

        <!-- Section B: Web-Ported Python Projects -->
        <div class="panel cyber-panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(16,185,129,0.3)); padding:18px; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:700; color:#10b981;" id="section-b-title">
              SECTION B: WEB-PORTED PYTHON PROJECTS
            </span>
            <span id="ported-count-badge" style="font-size:0.75rem; background:rgba(16,185,129,0.15); color:#10b981; padding:2px 8px; border-radius:3px; border:1px solid rgba(16,185,129,0.3);">
              57 PORTS
            </span>
          </div>
          <div id="ported-projects-list" style="display:flex; flex-direction:column; gap:14px; max-height:600px; overflow-y:auto; padding-right:5px;"></div>
        </div>
      </div>

      <!-- Execution Console Output & Manual Trigger -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="panel cyber-panel" style="background:rgba(5,10,18,0.9); border:1px solid rgba(255,255,255,0.1); padding:18px; display:flex; flex-direction:column; flex:1; border-radius:6px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:var(--accent, #06b6d4);">// EXECUTION_LOG</span>
            <span id="sub-active-status" style="font-size:0.75rem; color:#888;">IDLE</span>
          </div>

          <div id="sub-console-output" style="flex:1; min-height:300px; max-height:480px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.08); padding:12px; border-radius:4px; font-size:0.82rem; color:#aaa; overflow-y:auto; line-height:1.5; font-family:'Share Tech Mono',monospace;">
            <div style="color:#666;">> System idle. Select a subroutine or click batch actions to execute...</div>
          </div>
        </div>

        <!-- Manual CLI Command Input -->
        <div class="panel cyber-panel" style="background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); padding:14px; border-radius:6px;">
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

  // Grab element references
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
  const btnSortAZ = container.querySelector('#btn-sort-az');
  const sortOrderLabel = container.querySelector('#sort-order-label');
  const btnTimelineToggle = container.querySelector('#btn-timeline-toggle');
  const viewModeLabel = container.querySelector('#view-mode-label');
  const subProfileLabel = container.querySelector('#sub-profile-label');
  const btnSubAuth = container.querySelector('#btn-sub-auth');
  const catPillsBar = container.querySelector('#sub-cat-pills-bar');
  const portedCountBadge = container.querySelector('#ported-count-badge');

  // Update profile label from session storage
  function updateProfileDisplay() {
    const prof = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('current_profile')) || 'Architect';
    if (subProfileLabel) subProfileLabel.textContent = prof.toUpperCase();
  }
  updateProfileDisplay();

  // Render quick category tab pills
  const categoriesList = ['ALL', 'CORE KERNEL', 'PORTED PYTHON PROJECTS', 'NEURAL', 'CRYPTO', 'PERF', 'SEC', 'DATA', 'HARDWARE', 'UTILITIES', 'AI/ML', 'SECURITY', 'MOBILE', 'AUDIO', 'SYSTEM', 'NETWORK', 'SIMULATION', 'REVERSE ENGINEERING'];
  
  function renderCategoryPills() {
    catPillsBar.innerHTML = '';
    const currentCat = categoryFilter.value;

    categoriesList.forEach(cat => {
      const pill = document.createElement('button');
      pill.className = `cat-tab-pill ${cat === currentCat ? 'active' : ''}`;
      pill.style.cssText = `
        background: ${cat === currentCat ? 'rgba(6,182,212,0.25)' : 'rgba(255,255,255,0.04)'};
        color: ${cat === currentCat ? 'var(--accent, #06b6d4)' : '#aaa'};
        border: 1px solid ${cat === currentCat ? 'var(--accent, #06b6d4)' : 'rgba(255,255,255,0.1)'};
        padding: 4px 10px;
        border-radius: 4px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      pill.textContent = cat;
      pill.onclick = () => {
        categoryFilter.value = cat;
        renderCategoryPills();
        renderHub();
      };
      catPillsBar.appendChild(pill);
    });
  }
  renderCategoryPills();

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
    if (workspacePanel) {
      workspacePanel.style.display = 'none';
      workspacePanel.classList.remove('workspace-takeover-active');
    }
    appendConsoleLine('[WORKSPACES] Closed active workspace panel. Returned to main subroutines directory.', '#888');
  }

  btnCloseWorkspace.onclick = closeWorkspace;

  // Sorting Handler
  btnSortAZ.onclick = () => {
    if (currentSortOrder === 'DEFAULT') currentSortOrder = 'A-Z';
    else if (currentSortOrder === 'A-Z') currentSortOrder = 'Z-A';
    else currentSortOrder = 'DEFAULT';
    
    sortOrderLabel.textContent = `SORT: ${currentSortOrder}`;
    renderHub();
  };

  // Timeline / Recent View Handler
  btnTimelineToggle.onclick = () => {
    currentViewMode = currentViewMode === 'GRID' ? 'TIMELINE' : 'GRID';
    viewModeLabel.textContent = `VIEW: ${currentViewMode}`;
    showToast('INFO', `Switched view mode to ${currentViewMode}`);
    renderHub();
  };

  // Profile Auth Modal Handler
  btnSubAuth.onclick = () => {
    const pinPadModal = buildPinPad({
      authKey: 'subroutines_authenticated',
      onSuccess: (res) => {
        if (res && res.pinObj) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('current_profile', res.pinObj.label);
          }
          updateProfileDisplay();
          showToast('SUCCESS', `Authenticated as ${res.pinObj.label}`);
          appendConsoleLine(`[AUTH] Identity verified for ${res.pinObj.label}. Clearance updated.`, '#10b981');
        }
      },
      title: 'ALPHACORE // CLEARANCE_AUTHENTICATION',
      subtitle: 'VERIFY PROFILE CLEARANCE PIN',
      icon: '⚡'
    });

    showModal({
      title: 'PROFILE SECURITY CLEARANCE',
      content: pinPadModal,
      onClose: () => {}
    });
  };

  function isCategoryMatch(itemCategory, targetCategory) {
    const ic = (itemCategory || '').toUpperCase();
    const tc = (targetCategory || '').toUpperCase();

    if (ic === tc) return true;
    if (tc === 'SECURITY' && ic === 'SEC') return true;
    if (tc === 'SEC' && ic === 'SECURITY') return true;
    return false;
  }

  function renderHub() {
    const cat = categoryFilter.value;
    const query = (searchInput.value || '').trim().toLowerCase();

    // 1. Render Section A: Core Kernel Subroutines
    listEl.innerHTML = '';
    let filteredKernel = [];
    if (cat === 'PORTED PYTHON PROJECTS') {
      filteredKernel = [];
    } else if (cat === 'ALL' || cat === 'CORE KERNEL') {
      filteredKernel = [...SUBROUTINES];
    } else {
      filteredKernel = SUBROUTINES.filter(s => isCategoryMatch(s.category, cat));
    }

    if (query) {
      filteredKernel = filteredKernel.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.desc.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting to kernel subroutines only when explicitly requested
    if (currentSortOrder === 'Z-A') {
      filteredKernel.sort((a, b) => b.name.localeCompare(a.name));
    } else if (currentSortOrder === 'A-Z') {
      filteredKernel.sort((a, b) => a.name.localeCompare(b.name));
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
      filteredPorts = [...allPorts];
    } else {
      filteredPorts = allPorts.filter(p => isCategoryMatch(p.category, cat));
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

    // Apply sorting / view mode
    if (currentViewMode === 'TIMELINE') {
      // Timeline view: newest ports at top
      filteredPorts.reverse();
    } else if (currentSortOrder === 'Z-A') {
      filteredPorts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (currentSortOrder === 'A-Z') {
      filteredPorts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    if (portedCountBadge) {
      portedCountBadge.textContent = `${filteredPorts.length} / ${allPorts.length} PORTS`;
    }

    if (filteredPorts.length === 0) {
      portedListEl.innerHTML = '<div style="color:#666; font-size:0.8rem; font-style:italic; padding:10px;">No web-ported Python projects match the current filter.</div>';
    } else {
      filteredPorts.forEach(port => {
        const card = document.createElement('div');
        card.className = 'cyber-port-card';
        card.style.cssText = `
          background: rgba(16,185,129,0.03);
          border: 1px solid rgba(16,185,129,0.25);
          padding: 14px;
          border-radius: 6px;
          transition: all 0.25s ease;
          position: relative;
        `;

        const isPlaceholder = (port.description || '').includes('Requires Serverless Backend') || (port.version || '').includes('stub');

        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="color:#10b981; font-weight:bold; font-size:0.95rem; font-family:'Orbitron',sans-serif;">${port.name}</span>
            <div style="display:flex; gap:6px; align-items:center;">
              <span style="font-size:0.7rem; color:${isPlaceholder ? '#fbbf24' : '#10b981'}; background:${isPlaceholder ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}; padding:2px 6px; border-radius:3px; border:1px solid ${isPlaceholder ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'};">${port.category || 'UTILITIES'}</span>
              <span style="font-size:0.7rem; color:#888; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px;">v${port.version || '1.0.0'}</span>
            </div>
          </div>
          <div style="font-size:0.72rem; color:#38bdf8; margin-bottom:6px; font-family:'Share Tech Mono',monospace;">
            Source: ${port.pythonSourcePath || 'Python Original'}
          </div>
          <p style="font-size:0.8rem; color:#aaa; margin:0 0 12px 0; line-height:1.4;">${port.description}</p>
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
    workspacePanel.classList.add('workspace-takeover-active');

    try {
      port.render(workspaceContainer, {
        onLog: (msg, color) => appendConsoleLine(msg, color)
      });
      activePortInstance = port;
      appendConsoleLine(`[WORKSPACES] Fullscreen takeover active: Mounted interactive UI for ${port.name} (${port.id}).`, 'var(--accent, #06b6d4)');
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

  categoryFilter.onchange = () => {
    renderCategoryPills();
    renderHub();
  };
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

    // Test 1: Math loop
    let start = performance.now();
    let x = 0;
    for (let i = 0; i < 500000; i++) x += Math.sin(i) * Math.cos(i);
    appendConsoleLine(`> Testing FLOPS throughput... [${(performance.now() - start).toFixed(2)} ms]`, '#38bdf8');

    // Test 2: Array ops
    start = performance.now();
    const arr = new Array(100000).fill(0).map(() => Math.random());
    arr.sort();
    appendConsoleLine(`> Evaluating vector embedding dot products... [${(performance.now() - start).toFixed(2)} ms]`, '#38bdf8');

    // Test 3: Local Storage I/O
    start = performance.now();
    const testData = JSON.stringify(arr.slice(0, 500));
    localStorage.setItem('_alphacore_bench', testData);
    localStorage.getItem('_alphacore_bench');
    localStorage.removeItem('_alphacore_bench');
    appendConsoleLine(`> Measuring local storage I/O latency... [${(performance.now() - start).toFixed(2)} ms]`, '#38bdf8');

    // Test 4: String parsing
    start = performance.now();
    let str = "";
    for (let i=0; i<10000; i++) str += i.toString(16);
    str.match(/[a-f]/g);
    appendConsoleLine(`> Checking matrix rendering overhead... [${(performance.now() - start).toFixed(2)} ms]`, '#38bdf8');

    // Test 5: GC/Allocation
    start = performance.now();
    const map = new Map();
    for (let i = 0; i < 50000; i++) map.set(i, { val: i });
    map.clear();
    appendConsoleLine(`> Evaluating active memory fragmentation... [${(performance.now() - start).toFixed(2)} ms]`, '#38bdf8');

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
