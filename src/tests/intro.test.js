import { describe, it, expect, beforeEach, vi } from 'vitest';
import createIntro from '../components/intro.js';

describe('Intro Animation Boot Sequence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders intro overlay without skip button or secondary prompt, allows clicking anywhere to proceed to disclaimer and terminal', async () => {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);

    const introPromise = createIntro(app);
    const overlay = document.getElementById('intro-overlay');
    expect(overlay).toBeTruthy();

    // Verify touchPrompt text
    const touchPrompt = overlay.querySelector('.intro-touch-prompt');
    expect(touchPrompt).toBeTruthy();
    expect(touchPrompt.textContent).toContain('TOUCH THE SCREEN TO INITIALIZE ALPHACORE EXECUTION...');
    expect(touchPrompt.textContent).not.toContain('CLICK ANYWHERE OR PRESS ANY KEY');

    // Verify FAST BOOT / SKIP button is removed
    const skipBtn = overlay.querySelector('.intro-skip-btn');
    expect(skipBtn).toBeNull();

    // Clicking anywhere on the overlay/prompt starts the boot sequence
    overlay.click();

    // Clicking during startup advances directly to the disclaimer
    const startupOverlay = overlay.querySelector('.intro-startup-overlay');
    expect(startupOverlay).toBeTruthy();
    startupOverlay.click();

    const disclaimerOverlay = overlay.querySelector('.intro-disclaimer-overlay');
    expect(disclaimerOverlay).toBeTruthy();
    expect(disclaimerOverlay.style.display).toBe('flex');

    // The disclaimer accept button must be clicked to finish boot
    const acceptBtn = disclaimerOverlay.querySelector('button');
    expect(acceptBtn).toBeTruthy();
    expect(acceptBtn.textContent).toContain('I UNDERSTAND – PROCEED');

    acceptBtn.click();
    const result = await introPromise;
    expect(result.introContainer).toBeTruthy();
    expect(result.cleanup).toBeTypeOf('function');
    result.cleanup();
  });

  it('does not auto-skip even if legacy alphacore_intro_complete was in localStorage', async () => {
    localStorage.setItem('alphacore_intro_complete', '1');

    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);

    // Track whether promise resolves immediately or stays pending
    let resolvedImmediately = false;
    const introPromise = createIntro(app).then((res) => {
      resolvedImmediately = true;
      return res;
    });

    // Check immediately on next microtask tick
    await Promise.resolve();
    expect(resolvedImmediately).toBe(false);

    // Legacy flag was cleared from localStorage
    expect(localStorage.getItem('alphacore_intro_complete')).toBeNull();

    // Clicking anywhere brings user through boot to disclaimer
    const overlay = document.getElementById('intro-overlay');
    overlay.click();

    const startupOverlay = overlay.querySelector('.intro-startup-overlay');
    startupOverlay.click();

    // Click accept to complete boot
    const disclaimerOverlay = overlay.querySelector('.intro-disclaimer-overlay');
    const acceptBtn = disclaimerOverlay.querySelector('button');
    acceptBtn.click();

    const result = await introPromise;
    expect(result.introContainer).toBeTruthy();
    result.cleanup();
  });
});
