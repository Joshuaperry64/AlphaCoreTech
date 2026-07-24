/**
 * AlphaCore Quick Command Palette (Ctrl+K / Cmd+K)
 * Modal palette for fast navigation, subroutines execution, theme changing, and audio control.
 */

import { applyTheme, THEMES } from './theme-switcher.js';

let modalOverlay = null;

const COMMANDS = [
  { icon: '⎔', title: 'Go to Overview', path: '#/' },
  { icon: '⟁', title: 'Go to Cognitive Core', path: '#/cognitive' },
  { icon: '🧪', title: 'Go to Prompt Lab', path: '#/promptlab' },
  { icon: '⚡', title: 'Go to Subroutines Console', path: '#/subroutines' },
  { icon: '💻', title: 'Go to CLI Shell Terminal', path: '#/terminal' },
  { icon: '📊', title: 'Go to System Analytics', path: '#/analytics' },
  { icon: '📜', title: 'Go to System Changelog', path: '#/changelog' },
  { icon: '⚙', title: 'Go to Administration', path: '#/admin' },
  { icon: '✦', title: 'Go to AI Modals Hub', path: '#/aimodals' },
  { icon: '🔐', title: 'Go to Classified Vault', path: '#/vault' },
  { icon: '👁', title: 'Go to Vision Processor', path: '#/vision' },
  { icon: '⍾', title: 'Go to Diagnostics', path: '#/diagnostics' },
  { icon: '📑', title: 'Go to System Event Logs', path: '#/logs' },
  { icon: '⌬', title: 'Go to Research Center', path: '#/research' },
  { icon: '◬', title: 'Go to System Lore', path: '#/lore' },
  { icon: '◈', title: 'Go to Creator Auth', path: '#/creator' },
  { icon: '⚡', title: 'Toggle Performance / Eco Mode', action: 'toggle-eco' },
  { icon: '🎵', title: 'Toggle Background Audio', action: 'toggle-audio' },
  { icon: '🎨', title: 'Set Theme: Cyan Protocol', action: 'theme-cyan' },
  { icon: '🎨', title: 'Set Theme: Amber Matrix', action: 'theme-amber' },
  { icon: '🎨', title: 'Set Theme: Emerald Terminal', action: 'theme-emerald' },
  { icon: '🎨', title: 'Set Theme: Plasma Violet', action: 'theme-violet' },
  { icon: '🎨', title: 'Set Theme: Overdrive Crimson', action: 'theme-crimson' }
];

export function initCommandPalette() {
  if (modalOverlay) return;

  modalOverlay = document.createElement('div');
  modalOverlay.id = 'cmd-palette-overlay';
  modalOverlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(5, 10, 20, 0.85);
    backdrop-filter: blur(8px);
    z-index: 10000;
    justify-content: center;
    align-items: flex-start;
    padding-top: 12vh;
  `;

  modalOverlay.innerHTML = `
    <div style="width: 90%; max-width: 600px; background: rgba(12, 18, 30, 0.95); border: 1px solid var(--accent, #06b6d4); box-shadow: 0 0 25px rgba(6,182,212,0.3); border-radius: 6px; overflow: hidden; font-family: 'Share Tech Mono', monospace;">
      <div style="display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding: 12px 16px;">
        <span style="color: var(--accent, #06b6d4); font-size: 1.2rem; margin-right: 10px;">>_</span>
        <input type="text" id="cmd-input" placeholder="Type a command or navigate... (e.g. 'changelog', 'terminal', 'prompt')" style="flex: 1; background: transparent; border: none; outline: none; color: #fff; font-family: 'Share Tech Mono', monospace; font-size: 1rem;" autofocus />
        <span style="font-size: 0.75rem; color: #666; background: rgba(255,255,255,0.05); padding: 3px 6px; border-radius: 3px;">ESC to exit</span>
      </div>
      <div id="cmd-list" style="max-height: 320px; overflow-y: auto; padding: 8px 0;"></div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const input = modalOverlay.querySelector('#cmd-input');
  const list = modalOverlay.querySelector('#cmd-list');

  function renderItems(filter = '') {
    list.innerHTML = '';
    const q = filter.toLowerCase().trim();
    const filtered = COMMANDS.filter(c => c.title.toLowerCase().includes(q) || (c.path && c.path.includes(q)));

    if (filtered.length === 0) {
      list.innerHTML = `<div style="padding: 16px; text-align: center; color: #666; font-size: 0.85rem;">No matching commands found</div>`;
      return;
    }

    filtered.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.style.cssText = `
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 16px; cursor: pointer; color: #ccc; transition: all 0.15s ease;
        border-left: 3px solid transparent;
      `;

      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: var(--accent, #06b6d4);">${cmd.icon}</span>
          <span style="font-size: 0.9rem;">${cmd.title}</span>
        </div>
        <span style="font-size: 0.75rem; color: #666;">${cmd.path || 'ACTION'}</span>
      `;

      item.onmouseenter = () => {
        item.style.background = 'rgba(6, 182, 212, 0.15)';
        item.style.color = '#fff';
        item.style.borderLeftColor = 'var(--accent, #06b6d4)';
      };
      item.onmouseleave = () => {
        item.style.background = 'transparent';
        item.style.color = '#ccc';
        item.style.borderLeftColor = 'transparent';
      };

      item.onclick = () => {
        executeCommand(cmd);
        closePalette();
      };

      list.appendChild(item);
    });
  }

  function executeCommand(cmd) {
    if (cmd.path) {
      window.location.hash = cmd.path;
    } else if (cmd.action) {
      if (cmd.action === 'toggle-eco') {
        const btn = document.getElementById('eco-mode-btn');
        if (btn) btn.click();
      } else if (cmd.action === 'toggle-audio') {
        const btn = document.getElementById('play-audio-btn');
        if (btn) btn.click();
      } else if (cmd.action.startsWith('theme-')) {
        const themeKey = cmd.action.replace('theme-', '');
        applyTheme(themeKey);
      }
    }
  }

  function openPalette() {
    modalOverlay.style.display = 'flex';
    input.value = '';
    renderItems('');
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    modalOverlay.style.display = 'none';
  }

  input.addEventListener('input', (e) => renderItems(e.target.value));

  // Global keydown triggers
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modalOverlay.style.display === 'flex') {
        closePalette();
      } else {
        openPalette();
      }
    } else if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
      closePalette();
    }
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closePalette();
  });
}
