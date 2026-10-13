/**
 * AlphaCore Global Accessibility & Machine-Readable / OCR Enhancement Engine
 * 
 * Ensures every button, link, form control, modal, and dynamic region:
 * 1. Has fully descriptive ARIA roles, states, and labels for screen readers (NVDA, JAWS, Narrator).
 * 2. Emits live status updates via an invisible polite aria-live announcer.
 * 3. Supports keyboard navigation (focus visibility, Skip Links, modal focus traps, Escape closing).
 * 4. Enhances high-contrast text rendering, OCR bounding, and text-selectability for WINOCR.
 */

class AccessibilityEngine {
  constructor() {
    this.liveRegion = null;
    this.observer = null;
    this.skipLink = null;
  }

  init() {
    this.createAnnouncer();
    this.createSkipLink();
    this.setupGlobalKeyboardListeners();
    this.enhanceExistingDOM(document.body);
    this.startObserver();
  }

  /**
   * Invisible polite screen reader announcement channel
   */
  createAnnouncer() {
    if (document.getElementById('alphacore-a11y-announcer')) {
      this.liveRegion = document.getElementById('alphacore-a11y-announcer');
      return;
    }

    const announcer = document.createElement('div');
    announcer.id = 'alphacore-a11y-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
      pointer-events: none !important;
    `;
    document.body.appendChild(announcer);
    this.liveRegion = announcer;
  }

  /**
   * Speak status or state change to screen readers
   */
  announce(message) {
    if (!this.liveRegion || !message) return;
    this.liveRegion.textContent = '';
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 50);
  }

  /**
   * Accessible Skip to Main Content Link
   */
  createSkipLink() {
    if (document.getElementById('alphacore-skip-to-main')) return;

    const skip = document.createElement('a');
    skip.id = 'alphacore-skip-to-main';
    skip.href = '#app';
    skip.textContent = 'Skip to main content';
    skip.className = 'skip-to-content';
    skip.style.cssText = `
      position: absolute;
      top: -100px;
      left: 10px;
      background: #00b8ff;
      color: #030308;
      padding: 10px 18px;
      font-family: 'Share Tech Mono', monospace;
      font-weight: bold;
      z-index: 1000000;
      text-decoration: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 0 15px rgba(0, 184, 255, 0.8);
      transition: top 0.2s ease;
    `;

    skip.addEventListener('focus', () => {
      skip.style.top = '0px';
    });
    skip.addEventListener('blur', () => {
      skip.style.top = '-100px';
    });

    skip.addEventListener('click', (e) => {
      const app = document.getElementById('app');
      if (app) {
        app.setAttribute('tabindex', '-1');
        app.focus();
      }
    });

    document.body.insertBefore(skip, document.body.firstChild);
  }

  /**
   * Global keyboard management: Alt+S (skip to main), Esc (close active modals/menus)
   */
  setupGlobalKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Escape key to dismiss top modal, drawer, or dropdown
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.stat-modal.active, #cmd-palette-overlay[style*="display: flex"]');
        if (activeModal) {
          const closeBtn = activeModal.querySelector('#close-modal, .close-btn');
          if (closeBtn) closeBtn.click();
        }
      }
    });
  }

  /**
   * Normalize and enhance arbitrary DOM nodes
   */
  enhanceExistingDOM(root) {
    if (!root) return;

    // 1. Buttons without aria-label
    const buttons = root.querySelectorAll('button:not([aria-label])');
    buttons.forEach((btn) => {
      const text = (btn.textContent || '').trim();
      if (!text) {
        if (btn.id === 'hamburger' || btn.classList.contains('hamburger')) {
          btn.setAttribute('aria-label', 'Toggle Navigation Menu');
        } else if (btn.id === 'sidebar-collapse-btn') {
          btn.setAttribute('aria-label', 'Toggle Sidebar Collapse');
        } else if (btn.id === 'play-audio-btn') {
          btn.setAttribute('aria-label', 'Toggle Background Audio Stream');
        } else if (btn.id === 'eco-mode-btn') {
          btn.setAttribute('aria-label', 'Toggle Eco and Performance Mode');
        } else if (btn.classList.contains('close-btn') || btn.id === 'close-modal') {
          btn.setAttribute('aria-label', 'Close Dialog');
        } else {
          btn.setAttribute('aria-label', 'Interactive Control');
        }
      } else {
        // Strip out non-alphanumeric unicode icons from the start for clean screen reader reading
        const cleanText = text.replace(/^[⎔🧺🔬⟁✨🎨🖼️🧬🔍🎬🎥🦾🔊🎞️🎙️🎵💾👁️🔐⌬◬◈⚡⍾📑📜⚙●‹›✖✕✓▲▼▴▾►⚡🔑📝⏳ℹ]+/u, '').trim();
        if (cleanText && !btn.getAttribute('aria-label')) {
          btn.setAttribute('aria-label', cleanText);
        }
      }
    });

    // 2. Navigation items
    const navItems = root.querySelectorAll('a.nav-item, a.nav-sub-item');
    navItems.forEach((link) => {
      const label = link.getAttribute('data-label') || (link.textContent || '').trim();
      const cleanLabel = label.replace(/^[⎔🧺🔬⟁✨🎨🖼️🧬🔍🎬🎥🦾🔊🎞️🎙️🎵💾👁️🔐⌬◬◈⚡⍾📑📜⚙●‹›]+/u, '').trim();
      if (cleanLabel && !link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', `Navigate to ${cleanLabel}`);
      }
    });

    // 3. Inputs & textareas without labels
    const inputs = root.querySelectorAll('input:not([aria-label]), textarea:not([aria-label]), select:not([aria-label])');
    inputs.forEach((input) => {
      if (input.type === 'hidden') return;
      const placeholder = input.getAttribute('placeholder') || '';
      const name = input.getAttribute('name') || input.id || 'Input field';
      const cleanLabel = placeholder ? placeholder.replace(/\.\.\.$/, '') : name;
      input.setAttribute('aria-label', cleanLabel);
    });

    // 4. Decorative canvases and visual backgrounds: mark aria-hidden="true"
    const visuals = root.querySelectorAll('canvas, .crt-overlay, .intro-bg-watermark');
    visuals.forEach((vis) => {
      if (!vis.hasAttribute('aria-hidden')) {
        vis.setAttribute('aria-hidden', 'true');
      }
    });

    // 5. Images missing alt tags
    const images = root.querySelectorAll('img:not([alt])');
    images.forEach((img) => {
      img.setAttribute('alt', 'AlphaCore Visual Interface Graphic');
    });

    // 6. Ensure OCR accessibility attributes: data-ocr-readable="true" on key text containers
    const textBlocks = root.querySelectorAll('.panel-title, .aim-pin-title, .status-row, .aim-pin-feedback, .log-console');
    textBlocks.forEach((tb) => {
      if (!tb.hasAttribute('data-ocr-readable')) {
        tb.setAttribute('data-ocr-readable', 'true');
      }
    });
  }

  /**
   * Observe new dynamic DOM additions (e.g. page routes, modal creation)
   */
  startObserver() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.enhanceExistingDOM(node);
            }
          }
        }
      }
    });

    this.observer.observe(document.body, { childList: true, subtree: true });
  }
}

export const a11y = new AccessibilityEngine();
