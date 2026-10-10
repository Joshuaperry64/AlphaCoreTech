import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Application startup feedback', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <section id="startup-status" role="status">
        <h1 id="startup-title">ALPHACORE // CONNECTING</h1>
        <p id="startup-message">Loading the neural interface…</p>
        <a href="">Reload interface</a>
      </section>
    `;
  });

  it('removes the loading screen once the application module starts', async () => {
    vi.doMock('./main.js', () => ({ initialRoute: Promise.resolve() }));
    const { startApplication } = await import('./bootstrap.js');
    await startApplication();
    expect(document.getElementById('startup-status')).toBeNull();
  });

  it('shows an actionable error instead of a blank screen if startup fails', async () => {
    vi.doMock('./main.js', () => { throw new Error('Module unavailable'); });
    const { startApplication } = await import('./bootstrap.js');
    await startApplication();
    const status = document.getElementById('startup-status');
    expect(status.getAttribute('role')).toBe('alert');
    expect(status.textContent).toContain('CONNECTION INTERRUPTED');
    expect(status.textContent).toContain('Check your connection');
    expect(status.querySelector('a').textContent).toBe('Reload interface');
  });

  it('restores the recovery screen when initial route rendering rejects', async () => {
    vi.doMock('./main.js', () => ({ initialRoute: Promise.reject(new Error('Route unavailable')) }));
    const { startApplication } = await import('./bootstrap.js');
    await startApplication();
    const status = document.getElementById('startup-status');
    expect(status.getAttribute('role')).toBe('alert');
    expect(status.textContent).toContain('CONNECTION INTERRUPTED');
  });
});
