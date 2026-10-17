import { describe, it, expect, beforeEach, vi } from 'vitest';
import createIntro from '../components/intro.js';

describe('Intro Animation Boot Sequence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders intro overlay, skip button brings user to disclaimer, and disclaimer must be accepted', async () => {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);

    const introPromise = createIntro(app);
    const overlay = document.getElementById('intro-overlay');
    expect(overlay).toBeTruthy();

    const skipBtn = overlay.querySelector('.intro-skip-btn');
    expect(skipBtn).toBeTruthy();
    expect(skipBtn.textContent).toContain('FAST BOOT / SKIP');

    // Clicking skip reveals the disclaimer and cannot bypass it directly
    skipBtn.click();
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

    // Fast boot button brings user to disclaimer
    const overlay = document.getElementById('intro-overlay');
    const skipBtn = overlay.querySelector('.intro-skip-btn');
    skipBtn.click();

    // Click accept to complete boot
    const disclaimerOverlay = overlay.querySelector('.intro-disclaimer-overlay');
    const acceptBtn = disclaimerOverlay.querySelector('button');
    acceptBtn.click();

    const result = await introPromise;
    expect(result.introContainer).toBeTruthy();
    result.cleanup();
  });
});
