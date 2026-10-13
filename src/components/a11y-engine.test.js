import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { a11y } from './a11y-engine.js';
import { showModal, initModal } from './modal.js';

describe('Global Accessibility Engine & Screen Reader Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <header id="mobile-topbar">
        <button id="hamburger" class="hamburger"></button>
      </header>
      <nav id="sidebar-nav">
        <a href="#/" class="nav-item">⎔ Overview</a>
        <a href="#/laundry" class="nav-item">🧺 Laundro-mat</a>
      </nav>
      <main id="app">
        <div class="panel-title">// TELEMETRY HUD</div>
        <button class="aim-btn">EXECUTE DIAGNOSTICS</button>
        <button class="close-btn"></button>
        <input id="sample-input" placeholder="Enter target host..." />
        <canvas id="test-canvas"></canvas>
      </main>
      <div id="stat-modal" class="stat-modal"></div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates invisible live announcer and skip link', () => {
    a11y.init();

    const announcer = document.getElementById('alphacore-a11y-announcer');
    expect(announcer).not.toBeNull();
    expect(announcer.getAttribute('role')).toBe('status');
    expect(announcer.getAttribute('aria-live')).toBe('polite');

    const skipLink = document.getElementById('alphacore-skip-to-main');
    expect(skipLink).not.toBeNull();
    expect(skipLink.textContent).toBe('Skip to main content');
    expect(skipLink.getAttribute('href')).toBe('#app');
  });

  it('automatically augments unlabelled buttons, inputs, links, and decorative elements', () => {
    a11y.init();

    const hamburger = document.getElementById('hamburger');
    expect(hamburger.getAttribute('aria-label')).toBe('Toggle Navigation Menu');

    const execBtn = document.querySelector('.aim-btn');
    expect(execBtn.getAttribute('aria-label')).toBe('EXECUTE DIAGNOSTICS');

    const closeBtn = document.querySelector('.close-btn');
    expect(closeBtn.getAttribute('aria-label')).toBe('Close Dialog');

    const input = document.getElementById('sample-input');
    expect(input.getAttribute('aria-label')).toBe('Enter target host');

    const canvas = document.getElementById('test-canvas');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');

    const navLink = document.querySelector('a.nav-item');
    expect(navLink.getAttribute('aria-label')).toBe('Navigate to Overview');

    const panelTitle = document.querySelector('.panel-title');
    expect(panelTitle.getAttribute('data-ocr-readable')).toBe('true');
  });

  it('emits screen reader announcements via live region', async () => {
    a11y.init();
    a11y.announce('System Subroutine Initialized');

    await new Promise((r) => setTimeout(r, 70));
    const announcer = document.getElementById('alphacore-a11y-announcer');
    expect(announcer.textContent).toBe('System Subroutine Initialized');
  });

  it('provides accessible modal dialog with role, aria-modal, and escape key listener', () => {
    initModal();
    const modal = document.getElementById('stat-modal');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');

    showModal('// SECURITY CHECK', 'Clearance verified');
    expect(modal.classList.contains('active')).toBe(true);

    // Escape closes active modal
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.classList.contains('active')).toBe(false);
  });
});
