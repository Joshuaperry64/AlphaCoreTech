/**
 * AlphaCore Changelog & System Evolution Page
 * Comprehensive release history, version documentation, and interactive status tracking.
 * Mobile-optimized with clean touch targets and filterable entries.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

const CHANGELOG_DATA = [
  {
    version: 'v4.4.1 BUILD 112',
    date: '2026.08.17',
    badge: 'HOTFIX & UI POLISH',
    badgeColor: '#06b6d4',
    title: 'RESPONSIVE SWEEP & EASTER EGG REFACTOR',
    summary: 'Executed a comprehensive sweep of all new modules to ensure perfect mobile layout responsiveness, overhauled the guest login sequence, and completely refactored the system easter eggs for security and fun.',
    changes: [
      'Refactored the root bootup PIN pad: The standard Guest button was purged. The `[SYSTEM BYPASS]` button now serves as a dynamic, cinematic guest-login sequence on the root screen.',
      'Audited and patched mobile responsive layouts across the new Recon Dossier (`#/recon`) and Voice Synthesis (`#/voice`) modules to ensure perfect single-column stacking on smaller viewports.',
      'Patched a critical security flaw in the original Konami Code easter egg that granted unintended global Admin authorization. It now strictly serves as a safe UI Aesthetic Override.',
      'Injected a highly secretive "White Rabbit" UI easter egg into the Overview dashboard that requires a hidden keyboard input to trigger.',
      'Granted a unique, isolated reward for finding the new easter egg: Guests who trigger it receive a temporary session token that bypasses the Voice Cloner lock without exposing private data.'
    ]
  },
  {
    version: 'v4.4 BUILD 110',
    date: '2026.08.17',
    badge: 'MAJOR UPDATE',
    badgeColor: '#00ff64',
    title: 'LIVE GENERATIVE BACKENDS, UNIVERSAL BYPASS PROTOCOL & SYSTEM PURGE',
    summary: 'Wired up live Server-Sent Events (SSE) backend proxies for all generative AI, deployed a universal system bypass easter egg, replaced legacy tools with new Recon & Voice Cloner modules, and purged all remaining simulated frontend loops.',
    changes: [
      'Integrated real `server.js` SSE (Server-Sent Events) proxies for all generative AI modals (Text-to-Image, Image-to-Image, Text-to-Video).',
      'Systematically audited and implemented strict global Guest-Mode lockouts across Voice Cloner, Event Logs, Vault, Admin Panel, Architect Profile, and bR0k3nC0Re.',
      'Deployed a universal `[SYSTEM BYPASS]` easter egg sequence across all lockouts that violently crashes the kernel UI, wipes session memory, and reboots the interface.',
      'Replaced the deprecated Analytics page with a dynamic Autonomous Reconnaissance & Dossier dashboard (`#/recon`).',
      'Replaced the deprecated CLI Terminal page with an integrated Voice Cloner suite (`#/voice`).',
      'Purged all simulated frontend-only elements (Subroutines batch loops, Network Matrix telemetry) in preparation for live backend API data.'
    ]
  },
  {
    version: 'v4.3 BUILD 102',
    date: '2026.08.16',
    badge: 'LATEST MILESTONE',
    badgeColor: '#ff007f',
    title: 'AI PROMPT ENHANCER, LIVE VLLM COGNITIVE CORE & GUEST PREVIEW SYSTEM',
    summary: 'Major release featuring the new AI Prompt Enhancer, live Modal VLLM Gemma Cognitive Core, sitewide Guest Preview system, music-reactive visual animations, and cyberpunk aesthetic polish.',
    changes: [
      'Rebuilt Prompt Lab into an interactive AI Prompt Enhancer & Master Matrix Generator (`#/promptlab`) with artistic style presets and negative prompt generators.',
      'Unlocked live Cognitive Core (`#/cognitive`) connecting directly to the Modal VLLM Gemma AI Agent backend.',
      'Deployed sitewide Guest Mode preview banners and interactive PIN login modal triggers across all pages.',
      'Added Slideshow Auto-advance, ✨ AI ENHANCE button, hyperparameter samplers (Euler, DPM++, DDIM), Denoise, and Aspect Ratio controls to AI Modals (`#/aimodals`).',
      'Engineered Audio-Reactive frequency energy scaling into background matrix rain glow and drop speed.',
      'Completely purged obsolete Mainframe OS links, routes, and port modules.',
      'Updated Framepack Studio to provide direct Architect clearance execution and public preview overlays.',
      'Added high-voltage metal edge sparks, rotating tech gear icons, CRT scanline grid textures, and sidebar RGB text/logo glitch animations.',
      'Implemented a secret Easter Egg protocol with dynamic UI color palette inversion and hidden reward unlocks.'
    ]
  },
  {
    version: 'v4.2 BUILD 95',
    date: '2026.08.14',
    badge: 'STABLE RELEASE',
    badgeColor: '#38bdf8',
    title: '57 PYTHON SUBROUTINES BULK PORTING & CLIENT VAULT CRYPTO',
    summary: 'Full porting of all 57 Python subroutines, pure browser Web Crypto API integration, client-side hardcoded PIN verification, and bR0k3nC0Re Architect lock.',
    changes: [
      'Ported all 57 Python projects into full-screen takeover web subroutines (`#/subroutines`).',
      'Deployed pure browser Web Crypto API (AES-256-GCM + PBKDF2 100k rounds) for zero-backend ForbiddenArchive vault.',
      'Rebuilt PIN Authentication system to hardcoded client-side verification eliminating backend dependencies.',
      'Locked bR0k3nC0Re remote uplink strictly to Architect clearance profile.',
      'Updated ports registry framework to guarantee seamless dynamic loading across all runtimes.'
    ]
  },
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
