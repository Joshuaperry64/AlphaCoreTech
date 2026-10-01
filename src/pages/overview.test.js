import { describe, it, expect, beforeEach } from 'vitest';
import Overview from './overview.js';

describe('Overview Page & 2D Interactive Cyber-Desk', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders the 2D Cyber-Desk workstation container and view controls', () => {
    const el = Overview();
    expect(el).toBeTruthy();

    const desk = el.querySelector('#cyber-desk-workstation');
    expect(desk).toBeTruthy();

    const viewDeskBtn = el.querySelector('#view-desk-btn');
    const viewHudBtn = el.querySelector('#view-hud-btn');
    expect(viewDeskBtn).toBeTruthy();
    expect(viewHudBtn).toBeTruthy();
  });

  it('renders all 8 tactical physical desk props with correct routes and actions', () => {
    const el = Overview();

    const polaroid = el.querySelector('#prop-polaroid');
    expect(polaroid).toBeTruthy();
    expect(polaroid.getAttribute('data-route')).toBe('/aimodals?tab=txt2img');

    const camcorder = el.querySelector('#prop-camcorder');
    expect(camcorder).toBeTruthy();
    expect(camcorder.getAttribute('data-route')).toBe('/aimodals?tab=txt2vid');

    const loupe = el.querySelector('#prop-upscaler');
    expect(loupe).toBeTruthy();
    expect(loupe.getAttribute('data-route')).toBe('/aimodals?tab=upscaler');

    const cnet = el.querySelector('#prop-controlnet');
    expect(cnet).toBeTruthy();
    expect(cnet.getAttribute('data-route')).toBe('/aimodals?tab=controlnet');

    const audio = el.querySelector('#prop-audio');
    expect(audio).toBeTruthy();
    expect(audio.getAttribute('data-route')).toBe('/voice');

    const terminal = el.querySelector('#prop-cognitive');
    expect(terminal).toBeTruthy();
    expect(terminal.getAttribute('data-route')).toBe('/cognitive');

    const vault = el.querySelector('#prop-vault');
    expect(vault).toBeTruthy();
    expect(vault.getAttribute('data-route')).toBe('/vault');

    const mug = el.querySelector('#prop-mug');
    expect(mug).toBeTruthy();
  });

  it('toggles view mode between 2D desk and HUD telemetry', () => {
    const el = Overview();
    const deskSurface = el.querySelector('#cyber-desk-surface');
    const telemMount = el.querySelector('#telemetry-hud-mount');
    const viewDeskBtn = el.querySelector('#view-desk-btn');
    const viewHudBtn = el.querySelector('#view-hud-btn');

    // Default is desk
    expect(deskSurface.style.display).not.toBe('none');

    // Switch to HUD
    viewHudBtn.click();
    expect(deskSurface.style.display).toBe('none');
    expect(telemMount.style.display).toBe('block');
    expect(localStorage.getItem('alphacore_overview_view_mode')).toBe('hud');

    // Switch back to desk
    viewDeskBtn.click();
    expect(deskSurface.style.display).toBe('block');
    expect(telemMount.style.display).toBe('none');
    expect(localStorage.getItem('alphacore_overview_view_mode')).toBe('desk');
  });
});
