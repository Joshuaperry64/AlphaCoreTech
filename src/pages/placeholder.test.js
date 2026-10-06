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

    expect(el.innerHTML).toContain('SECURITY_LOCKOUT');
    expect(el.innerHTML).toContain('ACCESS RESTRICTED');
    expect(el.innerHTML).toContain('LEVEL 5 REQUIRED');
    expect(el.querySelector('#placeholder-pinpad-slot')).toBeTruthy();
  });

  it('renders full PLACEHOLDER workspace when profile is authenticated as Architect', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = PlaceholderPage();
    expect(el).toBeTruthy();

    expect(el.innerHTML).toContain('ALPHACORE // PLACEHOLDER');
    expect(el.innerHTML).toContain('ARCHITECT (JOSH)');
    expect(el.innerHTML).toContain('LEVEL 5 [UNRESTRICTED]');
    expect(el.innerHTML).toContain('EXPERIMENTAL_SANDBOX');
    expect(el.innerHTML).toContain('LUCI_SUBSTRATE_PARAMS');
    expect(el.innerHTML).toContain('RESERVED_EXPANSION_CHAMBER');
  });

  it('allows executing sandbox directives and clearing the terminal output', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = PlaceholderPage();
    const cmdInput = el.querySelector('#placeholder-test-cmd');
    const execBtn = el.querySelector('#btn-exec-probe');
    const clearBtn = el.querySelector('#btn-clear-term');
    const termOut = el.querySelector('#placeholder-terminal-out');

    expect(cmdInput).toBeTruthy();
    expect(execBtn).toBeTruthy();
    expect(termOut).toBeTruthy();

    cmdInput.value = 'neural-probe --test-vector';
    execBtn.click();

    expect(termOut.innerHTML).toContain('neural-probe --test-vector');
    expect(termOut.innerHTML).toContain('ZERO GOVERNOR INTERCEPT');

    clearBtn.click();
    expect(termOut.innerHTML).toContain('Substrate terminal reset');
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
