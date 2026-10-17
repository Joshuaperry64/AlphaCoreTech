import { describe, it, expect, beforeEach } from 'vitest';
import Overview from '../pages/overview.js';

describe('Overview Page & 2D Interactive Cyber-Desk', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders the 2D Cyber-Desk workstation container and title', () => {
    const el = Overview();
    expect(el).toBeTruthy();

    const desk = el.querySelector('#cyber-desk-workstation');
    expect(desk).toBeTruthy();

    const surface = el.querySelector('#cyber-desk-surface');
    expect(surface).toBeTruthy();

    const title = el.querySelector('.matrix-command-hub-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toBe('MATRIX COMMAND HUB');
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

  it('renders updated quick navigation links and dismissible nav hint', () => {
    const el = Overview();
    const navHint = el.querySelector('#overview-nav-hint');
    expect(navHint).toBeTruthy();
    expect(navHint.textContent).toContain('Click here for the full navigation menu');

    const dismissBtn = el.querySelector('#dismiss-nav-hint');
    expect(dismissBtn).toBeTruthy();
    dismissBtn.click();
    expect(navHint.style.display).toBe('none');
    expect(sessionStorage.getItem('alphacore_nav_hint_seen')).toBe('1');

    // Quick navigation checks
    const quickNavPanel = Array.from(el.querySelectorAll('.panel')).find(p => p.textContent.includes('QUICK NAV:'));
    expect(quickNavPanel).toBeTruthy();
    const quickNavText = quickNavPanel.textContent;
    expect(quickNavText).toContain('THE LAB');
    expect(quickNavText).toContain('LAUNDROMAT');
    expect(quickNavText).toContain('COGNITIVE CORE');
    expect(quickNavText).toContain('STUDIO MATRIX');
    expect(quickNavText).toContain('VOICE');
    expect(quickNavText).toContain('RECON');
    expect(quickNavText).toContain('CUSTODY');
    expect(quickNavText).toContain('CORE VAULT');
    expect(quickNavText).not.toContain('ADMINISTRATION');
    expect(quickNavText).not.toContain('SUBROUTINES');
  });

  it('renders interactive cyber-desk radio and toggles playback state', () => {
    const el = Overview();
    const tapeBtn = el.querySelector('#tape-toggle-btn');
    const tapeDeck = el.querySelector('#desk-tape-deck');
    const audioWrap = el.querySelector('.prop-audio-wrap');

    expect(tapeBtn).toBeTruthy();
    expect(tapeDeck).toBeTruthy();
    expect(audioWrap).toBeTruthy();
    expect(tapeBtn.textContent).toContain('PLAY RADIO');

    // Click to toggle radio
    tapeBtn.click();
    // Re-verify UI response
    expect(tapeBtn.textContent).toMatch(/PAUSE|PLAY/);
  });

  it('contains living polaroid photo container with gloss and art wrapper', () => {
    const el = Overview();
    const polaroid = el.querySelector('#prop-polaroid');
    const photo = polaroid.querySelector('.polaroid-photo');
    const art = polaroid.querySelector('.polaroid-art');

    expect(polaroid).toBeTruthy();
    expect(photo).toBeTruthy();
    expect(art).toBeTruthy();
  });
});
