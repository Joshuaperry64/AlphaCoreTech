import { describe, it, expect, beforeEach, vi } from 'vitest';
import createIntro from './intro.js';

describe('Intro Animation Boot Sequence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  it('renders intro overlay, FITS terminal, and skip button', async () => {
    const app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);

    const introPromise = createIntro(app);
    const overlay = document.getElementById('intro-overlay');
    expect(overlay).toBeTruthy();

    const skipBtn = overlay.querySelector('button');
    expect(skipBtn).toBeTruthy();
    expect(skipBtn.textContent).toContain('FAST BOOT / SKIP');

    // Clicking skip finishes boot and resolves
    skipBtn.click();
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

    // Skip button can still be clicked to finish when desired
    const overlay = document.getElementById('intro-overlay');
    const skipBtn = overlay.querySelector('button');
    skipBtn.click();

    const result = await introPromise;
    expect(result.introContainer).toBeTruthy();
    result.cleanup();
  });
});
