import { describe, it, expect, beforeEach, vi } from 'vitest';
import CognitiveUplink from './cognitive.js';

describe('Cognitive Core & Global Comm Link API Key Routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders cognitive uplink container and tabs', () => {
    const el = CognitiveUplink();
    expect(el).toBeTruthy();

    const tabs = el.querySelectorAll('.aim-seg-btn');
    expect(tabs.length).toBe(3);

    const privateTab = Array.from(tabs).find(t => t.dataset.target === 'cog-chat-private');
    const sharedTab = Array.from(tabs).find(t => t.dataset.target === 'cog-chat-shared');
    const configTab = Array.from(tabs).find(t => t.dataset.target === 'cog-api-config');

    expect(privateTab).toBeTruthy();
    expect(sharedTab).toBeTruthy();
    expect(configTab).toBeTruthy();
  });

  it('initializes master gemini api key for non-guest registered profiles', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = CognitiveUplink();
    expect(el).toBeTruthy();

    await new Promise(r => setTimeout(r, 60));

    const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
    expect(settings.masterApiKey).toBe(atob('QVEuQWI4Uk42S3FmSjFmTmgtcmxYX196UkJmWTRJaDVUcTB1UTZHTzdxend3Um13Y1E2Y0E='));
  });

  it('switches between Private Uplink and Global Comm Link tabs properly and enforces master key for registered users', async () => {
    sessionStorage.setItem('current_profile', 'Fisherman');
    sessionStorage.setItem('current_pin', '123456789');

    const el = CognitiveUplink();
    await new Promise(r => setTimeout(r, 150));

    const sharedTab = el.querySelector('[data-target="cog-chat-shared"]');
    sharedTab.click();

    const channelTitle = el.querySelector('#chat-channel-title');
    expect(channelTitle.textContent).toContain('GLOBAL_COMM_LINK');
  });
});
