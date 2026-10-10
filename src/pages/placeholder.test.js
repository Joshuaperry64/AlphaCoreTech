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
  });

  it('allows switching between Sector ZERO modules and interacting with simulation chamber', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    sessionStorage.setItem('darkness_mode_active', 'true');
    localStorage.setItem('gemini_api_key', 'test_key');

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

  it('validates empty prompt on #sz-generate-btn without triggering generation', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    sessionStorage.setItem('darkness_mode_active', 'true');

    let apiCalled = false;
    window.__mock_openrouter_image_generation = async () => {
      apiCalled = true;
      return { result: 'https://example.com/mock.png' };
    };

    const el = PlaceholderPage();
    const genBtn = el.querySelector('#sz-generate-btn');
    const promptInput = el.querySelector('#sz-prompt');
    promptInput.value = '   ';

    await genBtn.onclick();

    expect(apiCalled).toBe(false);
    expect(genBtn.disabled).toBe(false);
  });

  it('constructs weighted LoRA prompt, calls openrouter_image_generation tool, and displays result image', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    sessionStorage.setItem('darkness_mode_active', 'true');

    let passedPrompt = '';
    window.__mock_openrouter_image_generation = async ({ prompt }) => {
      passedPrompt = prompt;
      return { result: 'https://cdn.example.com/cyber_art_123.png' };
    };

    const el = PlaceholderPage();
    const genBtn = el.querySelector('#sz-generate-btn');
    const promptInput = el.querySelector('#sz-prompt');
    const loraSelect = el.querySelector('#sz-lora');
    const outputArea = el.querySelector('#sz-generate-output');

    promptInput.value = 'a girl in a field';
    loraSelect.value = 'younger.safetensors';

    await genBtn.onclick();

    expect(passedPrompt).toBe('(younger:1.3), a girl in a field');
    expect(genBtn.disabled).toBe(false);
    expect(outputArea.innerHTML).toContain('https://cdn.example.com/cyber_art_123.png');
    expect(outputArea.innerHTML).toContain('(younger:1.3), a girl in a field');
    expect(outputArea.innerHTML).toContain('SAVE OUR ART');
  });

  it('handles generation errors gracefully by displaying error message and re-enabling button', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    sessionStorage.setItem('darkness_mode_active', 'true');

    window.__mock_openrouter_image_generation = async () => {
      throw new Error('Neural network timeout');
    };

    const el = PlaceholderPage();
    const genBtn = el.querySelector('#sz-generate-btn');
    const promptInput = el.querySelector('#sz-prompt');
    const outputArea = el.querySelector('#sz-generate-output');

    promptInput.value = 'test neural scene';

    await genBtn.onclick();

    expect(genBtn.disabled).toBe(false);
    expect(outputArea.innerHTML).toContain('Neural network timeout');
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
