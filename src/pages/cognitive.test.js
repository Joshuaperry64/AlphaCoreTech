import { describe, it, expect, beforeEach, vi } from 'vitest';
import CognitiveUplink from './cognitive.js';
import { ALPHACORE_SYSTEM_INSTRUCTION } from '../components/alphacore_instruction.js';

describe('Cognitive Core & Global Comm Link API Key Routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders cognitive uplink container and tabs with Global Comm Link as primary default', async () => {
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

    // Verify Global Comm Link tab is active by default
    expect(sharedTab.classList.contains('active')).toBe(true);

    await new Promise(r => setTimeout(r, 60));
    const channelTitle = el.querySelector('#chat-channel-title');
    expect(channelTitle.textContent).toContain('GLOBAL_COMM_LINK');
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

  it('switches to Private Uplink as secondary and can switch back to Global Comm Link', async () => {
    sessionStorage.setItem('current_profile', 'Fisherman');
    sessionStorage.setItem('current_pin', '123456789');

    const el = CognitiveUplink();
    await new Promise(r => setTimeout(r, 60));

    // Initially in Global Comm Link
    let channelTitle = el.querySelector('#chat-channel-title');
    expect(channelTitle.textContent).toContain('GLOBAL_COMM_LINK');

    // Switch to Private Uplink (secondary)
    const privateTab = el.querySelector('[data-target="cog-chat-private"]');
    privateTab.click();
    expect(channelTitle.textContent).toContain('PRIVATE_UPLINK [FISHERMAN]');

    // Switch back to Global Comm Link
    const sharedTab = el.querySelector('[data-target="cog-chat-shared"]');
    sharedTab.click();
    expect(channelTitle.textContent).toContain('GLOBAL_COMM_LINK');
  });

  it('reflects user input in visual chat and displays active thinking indicator', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const chatInput = el.querySelector('#chat-input');
    const sendBtn = el.querySelector('#chat-send-btn');
    const chatMessages = el.querySelector('#chat-messages');

    chatInput.value = 'Status report on neural grid.';
    sendBtn.click();

    // Verify user message appears in chat
    const userMsg = chatMessages.querySelector('.user-msg');
    expect(userMsg).toBeTruthy();
    expect(userMsg.textContent).toContain('[ARCHITECT]');
    expect(userMsg.textContent).toContain('Status report on neural grid.');

    // Verify thinking indicator is displayed
    const thinking = chatMessages.querySelector('.thinking-bubble');
    expect(thinking).toBeTruthy();
    expect(thinking.textContent).toContain('PROCESSING & LISTENING');

    el.remove();
  });

  it('enforces AlphaCore instruction Architect naming rule', () => {
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('ARCHITECT NAMING PROTOCOL');
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain("STRICTLY FORBIDDEN from ever outputting, uttering, or generating the words 'Josh' or 'Joshua'");
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain("ALWAYS address and refer to him strictly and exclusively as 'Architect'");
  });

  it('toggles Vault RAG mode on and off with visual and system feedback', async () => {
    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const toggleRagBtn = el.querySelector('#toggle-rag-btn');
    const chatMessages = el.querySelector('#chat-messages');
    expect(toggleRagBtn).toBeTruthy();
    expect(toggleRagBtn.textContent).toBe('VAULT RAG: OFF');

    // Click to turn ON
    toggleRagBtn.click();
    expect(toggleRagBtn.textContent).toBe('VAULT RAG: ON');
    expect(chatMessages.textContent).toContain('VAULT RAG ACTIVE');

    // Click to turn OFF
    toggleRagBtn.click();
    expect(toggleRagBtn.textContent).toBe('VAULT RAG: OFF');
    expect(chatMessages.textContent).toContain('VAULT RAG DEACTIVATED');

    el.remove();
  });

  it('allows registered operators to specify and save their own API key for private and global links', async () => {
    sessionStorage.setItem('current_profile', 'DoeBoy');
    sessionStorage.setItem('current_pin', '6969');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    // Open Core Config
    const configTab = el.querySelector('[data-target="cog-api-config"]');
    configTab.click();

    const userInput = el.querySelector('#user-api-key');
    const saveBtn = el.querySelector('#save-user-key-btn');
    const statusEl = el.querySelector('#user-key-status');

    expect(userInput).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // Enter custom API key and save
    userInput.value = 'AIzaSyTestDoeBoyCustomKey999';
    saveBtn.click();

    // Verify saved to localStorage
    expect(localStorage.getItem('gemini_user_api_key_doeboy')).toBe('AIzaSyTestDoeBoyCustomKey999');
    expect(statusEl.textContent).toContain('Personal API key saved');

    // Clear key using button
    const clearBtn = el.querySelector('#clear-user-key-btn');
    clearBtn.click();
    expect(localStorage.getItem('gemini_user_api_key_doeboy')).toBeNull();
    expect(statusEl.textContent).toContain('Cleared custom key');

    el.remove();
  });

  it('allows Architect to configure personal API key override alongside master controls', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const configTab = el.querySelector('[data-target="cog-api-config"]');
    configTab.click();

    const masterInput = el.querySelector('#master-api-key');
    const userInput = el.querySelector('#user-api-key');
    const saveBtn = el.querySelector('#save-config-btn');
    const statusEl = el.querySelector('#config-status');

    expect(masterInput).toBeTruthy();
    expect(userInput).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    userInput.value = 'AIzaSyArchitectPersonalKey123';
    saveBtn.click();

    expect(localStorage.getItem('gemini_user_api_key_architect')).toBe('AIzaSyArchitectPersonalKey123');
    expect(statusEl.textContent).toContain('Configuration saved');

    el.remove();
  });
});
