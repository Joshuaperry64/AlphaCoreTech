import { describe, it, expect, beforeEach } from 'vitest';
import PlaceholderPage from './placeholder.js';
import AdminPage from './admin.js';

describe('Hidden Architect PLACEHOLDER Page & Admin Darkened State Portal', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders security lockout when profile is Guest or not authenticated as Architect', () => {
    sessionStorage.setItem('current_profile', 'Guest');
    const el = PlaceholderPage();
    expect(el).toBeTruthy();

    expect(el.innerHTML).toContain('[SECTOR_ZERO] // DARKENED_STATE_REQUIRED');
    expect(el.innerHTML).toContain('SANCTUARY_LOCKED');
    expect(el.innerHTML).toContain('Darkened State');
  });

  it('renders full PLACEHOLDER workspace when profile is authenticated as Architect in Darkened State', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    sessionStorage.setItem('darkness_mode_active', 'true');

    const el = PlaceholderPage();
    expect(el).toBeTruthy();

    expect(el.innerHTML).toContain('SECTOR ZERO');
    expect(el.innerHTML).toContain('HYPER-GENERATION ENGINE');
    expect(el.innerHTML).toContain('ACQUISITION MATRIX');
    expect(el.innerHTML).toContain('REMIX ENGINE');
    expect(el.innerHTML).toContain('LIVE SIMULATION CHAMBER');
    expect(el.innerHTML).toContain('OUR FORBIDDEN VAULT');
  });

  it('allows switching between Sector ZERO modules and interacting with simulation chamber', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    sessionStorage.setItem('darkness_mode_active', 'true');

    const el = PlaceholderPage();
    const tabs = el.querySelectorAll('.sz-tab-btn');
    expect(tabs.length).toBe(4);

    const promptInput = el.querySelector('#sz-prompt');
    const genBtn = el.querySelector('#sz-generate-btn');
    expect(promptInput).toBeTruthy();
    expect(genBtn).toBeTruthy();

    const simTab = Array.from(tabs).find(t => t.dataset.tab === 'simulate');
    expect(simTab).toBeTruthy();
    simTab.click();

    const simScenario = el.querySelector('#sz-sim-scenario');
    const simStartBtn = el.querySelector('#sz-sim-start-btn');
    expect(simScenario).toBeTruthy();
    expect(simStartBtn).toBeTruthy();

    simScenario.value = 'Private lounge, neon lights, soft jazz playing.';
    simStartBtn.click();

    const simLive = el.querySelector('#sim-live');
    const simOutput = el.querySelector('#sim-output');
    expect(simLive.style.display).toBe('block');
    expect(simOutput.innerHTML).toContain('Private lounge, neon lights');
  });

  it('displays the access portal to #/placeholder when Darkened State is active in Administration', () => {
    sessionStorage.setItem('admin_authenticated', '1');
    sessionStorage.setItem('current_profile', 'Architect');

    const adminEl = AdminPage();
    const darknessBtn = adminEl.querySelector('#btn-embrace-darkness');
    expect(darknessBtn).toBeTruthy();

    // Trigger Darkened State
    darknessBtn.click();

    const portalBtn = adminEl.querySelector('#btn-portal-placeholder');
    expect(portalBtn).toBeTruthy();
    expect(portalBtn.getAttribute('href')).toBe('#/placeholder');
    expect(portalBtn.textContent).toContain('ACCESS [PLACEHOLDER]');
  });
});
