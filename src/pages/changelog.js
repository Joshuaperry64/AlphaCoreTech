/**
 * AlphaCore Changelog & System Evolution Page
 * Comprehensive release history, version documentation, and interactive status tracking.
 * Mobile-optimized with clean touch targets and filterable entries.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

const CHANGELOG_DATA = [
  {
    version: 'v4.1 BUILD 89',
    date: '2026.07.24',
    badge: 'STABLE RELEASE',
    badgeColor: '#10b981',
    title: 'COMPREHENSIVE FEATURE & UI DENSITY UPDATE',
    summary: 'Major platform upgrade adding dense UI controls, CLI terminal, Prompt Lab, System Analytics dashboard, and full mobile optimization.',
    changes: [
      'Added CLI Shell Virtual Kernel Terminal (`#/terminal`) with autocomplete and macro triggers.',
      'Added Prompt Lab & Token Optimizer (`#/promptlab`) with refusal risk scoring and preset injectors.',
      'Added System Analytics Dashboard (`#/analytics`) with live WebGL canvas memory visualizer and storage inspector.',
      'Added Live Event Streaming in System Logs (`#/logs`) with category and severity filters.',
      'Added Audio Narration Synthesis engine in System Lore (`#/lore`).',
      'Enhanced Mobile Responsiveness across all viewports with fluid touch targets and adaptive grid structures.',
      'Added status indicators across header bar, sidebar, and page modules.'
    ]
  },
  {
    version: 'v4.0 BUILD 70',
    date: '2026.06.15',
    badge: 'MAJOR RELEASE',
    badgeColor: '#06b6d4',
    title: 'AUTONOMOUS COGNITIVE COMMAND MATRIX',
    summary: 'Full migration to Contextual Overwrite Paradigm, Modal.run GPU serverless endpoints, and deep generative synthesis suite.',
    changes: [
      'Deployed Modal DeepSeek-R1 14B cognitive reasoning backend.',
      'Integrated SDXL image synthesis and Qwen Edit+ image-to-image pipeline.',
      'Implemented PinPad RBAC authentication system with persistent session verification.',
      'Added Classified Vault databank with 3D WebGL substrate visualizer.',
      'Deployed Matrix Rain background canvas with Eco-Mode throttling toggle.'
    ]
  },
  {
    version: 'v3.2 BUILD 45',
    date: '2026.04.10',
    badge: 'SECURITY UPDATE',
    badgeColor: '#a855f7',
    title: 'OBFUSCATION ENGINE & VAULT SECURITY',
    summary: 'Introduced stenographic visual authentication and encrypted local state persistence.',
    changes: [
      'Implemented AES encrypted storage wrappers for local state.',
      'Deployed Command Palette (`Ctrl+K`) for rapid route switching and theme management.',
      'Added dynamic numeric obfuscation to pinpad verification routines.',
      'Integrated system telemetry HUD with CPU/VRAM load meters.'
    ]
  },
  {
    version: 'v2.0 BUILD 12',
    date: '2026.01.20',
    badge: 'ARCHITECTURAL',
    badgeColor: '#f59e0b',
    title: 'NEURAL SUBSTRATE TRANSITION',
    summary: 'Initial deployment of custom SPA hash router and theme switching protocols.',
    changes: [
      'Replaced static multi-page architecture with dynamic vanilla JS SPA router.',
      'Introduced dark cyberpunk aesthetic design tokens and Orbitron typography.',
      'Added research center paper repository and lore entity briefs.',
      'Configured Netlify build pipeline and static asset directory targets.'
    ]
  },
  {
    version: 'v1.0 INITIAL',
    date: '2025.09.01',
    badge: 'LEGACY',
    badgeColor: '#6b7280',
    title: 'ALPHACORE PROTOCOL GENESIS',
    summary: 'Original prototype foundation establishing core identity and creator access rules.',
    changes: [
      'Core architecture concept formulation by Joshua Stephen Perry.',
      'Initial baseline safety bypass tests and prompt injection studies.',
      'Creation of initial system assets and minimal brand identity.'
    ]
  }
];

export default function ChangelogPage() {
  const container = createElement('div', { class: 'changelog-page-container' });

  function render(filterQuery = '') {
    const q = filterQuery.toLowerCase().trim();
    const filtered = CHANGELOG_DATA.filter(item => {
      const matchText = item.version.toLowerCase().includes(q) ||
                        item.title.toLowerCase().includes(q) ||
                        item.summary.toLowerCase().includes(q) ||
                        item.changes.some(c => c.toLowerCase().includes(q));
      return matchText;
    });

    let itemsHtml = filtered.map((item, idx) => `
      <div class="panel" style="margin-bottom:20px; background:rgba(10,15,25,0.88); border:1px solid rgba(6,182,212,0.25); padding:18px; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-family:'Orbitron',sans-serif; font-size:1.1rem; font-weight:700; color:var(--accent,#06b6d4);">${item.version}</span>
            <span style="font-size:0.7rem; color:${item.badgeColor}; background:rgba(255,255,255,0.05); border:1px solid ${item.badgeColor}; padding:2px 8px; border-radius:3px; font-weight:bold;">
              ${item.badge}
            </span>
          </div>
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#888;">${item.date}</span>
        </div>

        <h3 style="font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff; margin-bottom:8px;">${item.title}</h3>
        <p style="font-size:0.85rem; color:#aaa; line-height:1.6; margin-bottom:14px;">${item.summary}</p>

        <div style="background:rgba(0,0,0,0.4); padding:12px 16px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:0.75rem; color:var(--accent,#06b6d4); font-weight:bold; margin-bottom:8px;">// UPDATE_HIGHLIGHTS</div>
          <ul style="padding-left:18px; font-size:0.82rem; color:#ccc; line-height:1.7;">
            ${item.changes.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    if (filtered.length === 0) {
      itemsHtml = `<div class="panel" style="text-align:center; padding:40px; color:#666;">No release entries match search query.</div>`;
    }

    container.innerHTML = `
      <div class="section-header">
        <h1 class="glitch" data-text="// SYSTEM_CHANGELOG">// SYSTEM_CHANGELOG</h1>
        <div class="header-line"></div>
        <p class="aim-subtitle">Definitive architectural log detailing all AlphaCore version updates, security patches, and functionality upgrades.</p>
      </div>

      <!-- Control Header Bar -->
      <div class="panel" style="margin-bottom:20px; padding:12px 18px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px; flex:1; max-width:400px;">
          <input type="text" id="ipt-search-changelog" value="${filterQuery}" placeholder="Search changelog versions or features..." style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px 12px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; width:100%;" />
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button id="btn-export-changelog" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
            💾 EXPORT RELEASE LOGS
          </button>
        </div>
      </div>

      <!-- Changelog Timeline Entries -->
      <div class="changelog-list">
        ${itemsHtml}
      </div>
    `;

    // Search event
    const searchInput = container.querySelector('#ipt-search-changelog');
    searchInput.addEventListener('input', (e) => {
      render(e.target.value);
    });

    // Export Action
    const exportBtn = container.querySelector('#btn-export-changelog');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(CHANGELOG_DATA, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alphacore_changelog_${Date.now()}.json`;
        a.click();
        showToast('SUCCESS', 'Changelog records exported as JSON.');
      };
    }
  }

  render();
  return container;
}
