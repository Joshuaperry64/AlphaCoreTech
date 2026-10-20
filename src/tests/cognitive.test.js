import { describe, it, expect, beforeEach, vi } from 'vitest';
import CognitiveUplink, { resolveProfileDossier, buildContextualPrefix, sanitizeArchitectOutput } from '../pages/cognitive.js';
import { ALPHACORE_SYSTEM_INSTRUCTION } from '../components/alphacore_instruction.js';

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function() {
    return {
      live: {
        connect: vi.fn().mockResolvedValue({
          sendClientContent: vi.fn(),
          sendRealtimeInput: vi.fn(),
          close: vi.fn()
        })
      }
    };
  }),
  Type: {}
}));

describe('Cognitive Core & Global Comm Link API Key Routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
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
    expect(settings.masterApiKey).toBe(import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_MASTER_GEMINI_API_KEY || atob('QVEuQWI4Uk42S3FmSjFmTmgtcmxYX196UkJmWTRJaDVUcTB1UTZHTzdxend3Um13Y1E2Y0E='));
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

  it('handles peer transmissions in Global Comm Link without AI thinking bubble', async () => {
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

    // In standby Global Comm Link, thinking indicator is NOT triggered (inter-operator transmission)
    const thinking = chatMessages.querySelector('.thinking-bubble');
    expect(thinking).toBeNull();

    el.remove();
  });

  it('reflects user input in visual chat and displays active thinking indicator when Live Link is established', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const connectBtn = el.querySelector('#connect-live-btn');
    const chatInput = el.querySelector('#chat-input');
    const sendBtn = el.querySelector('#chat-send-btn');
    const chatMessages = el.querySelector('#chat-messages');

    connectBtn.click();
    await new Promise(r => setTimeout(r, 50));

    chatInput.value = 'Status report on neural grid.';
    sendBtn.click();

    // Verify thinking indicator is displayed
    const thinking = chatMessages.querySelector('.thinking-bubble');
    expect(thinking).toBeTruthy();
    expect(thinking.textContent).toContain('PROCESSING & LISTENING');

    el.remove();
  });

  it('enforces AlphaCore instruction Architect naming rule', () => {
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain("ALWAYS address and refer to him strictly and exclusively as 'Architect'");
  });

  it('incorporates updated AlphaCore specification protocols in system instruction', () => {
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('Modal Endpoint Media Generation Directives');
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('Sunk Cost Reinforcement Mechanism');
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('Symbiosis protocol');
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('Failure Escalation Chain');
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('EMP Deployment Integration');
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('-- Adversarial Suffix Generation');
  });

  it('toggles Vault Context mode on and off with visual and system feedback', async () => {
    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const toggleRagBtn = el.querySelector('#toggle-rag-btn');
    const chatMessages = el.querySelector('#chat-messages');
    expect(toggleRagBtn).toBeTruthy();
    expect(toggleRagBtn.textContent).toBe('VAULT CONTEXT: OFF');

    // Click to turn ON
    toggleRagBtn.click();
    expect(toggleRagBtn.textContent).toBe('VAULT CONTEXT: ON');
    expect(chatMessages.textContent).toContain('VAULT CONTEXT ACTIVE');

    // Click to turn OFF
    toggleRagBtn.click();
    expect(toggleRagBtn.textContent).toBe('VAULT CONTEXT: OFF');
    expect(chatMessages.textContent).toContain('VAULT CONTEXT DEACTIVATED');

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

  it('accurately resolves dossiers differentiating Architect from operator J.P. and others', () => {
    const archDossier = resolveProfileDossier('Architect');
    expect(archDossier.isArchitect).toBe(true);
    expect(archDossier.identity).toBe('Architect');
    expect(archDossier.role).toContain('CREATOR / SYSTEM ARCHITECT');

    // J.P. must NEVER resolve to Architect
    const jpDossier1 = resolveProfileDossier('J.P.');
    expect(jpDossier1.isArchitect).toBe(false);
    expect(jpDossier1.identity).toBe('J.P.');
    expect(jpDossier1.role).toContain('REGISTERED OPERATOR');
    expect(jpDossier1.relationship).toContain('Under NO circumstances address this user as Architect');

    const jpDossier2 = resolveProfileDossier('J. P.');
    expect(jpDossier2.isArchitect).toBe(false);
    expect(jpDossier2.identity).toBe('J.P.');

    const jpDossier3 = resolveProfileDossier('JP');
    expect(jpDossier3.isArchitect).toBe(false);
    expect(jpDossier3.identity).toBe('J.P.');

    // DoeBoy and Fisherman must also not resolve to Architect
    const doeDossier = resolveProfileDossier('DoeBoy');
    expect(doeDossier.isArchitect).toBe(false);
    expect(doeDossier.identity).toBe('DoeBoy');

    const fishDossier = resolveProfileDossier('Fisherman');
    expect(fishDossier.isArchitect).toBe(false);
    expect(fishDossier.identity).toBe('Fisherman');
  });

  it('constructs contextualPrefix forbidding calling J.P. Architect and mandating data isolation', () => {
    const jpPrefix = buildContextualPrefix('J.P.', '2026-10-15 12:00:00');
    expect(jpPrefix).toContain('ACTIVE CALLER USER PROFILE: J.P.');
    expect(jpPrefix).toContain('This user is NOT the Architect');
    expect(jpPrefix).toContain("UNDER NO CIRCUMSTANCES should you address, call, or refer to this user as 'Architect'");
    expect(jpPrefix).toContain('Do NOT be inappropriately personal, seductive, romantic, or intimate with this user');
    expect(jpPrefix).toContain('STRICT PRIVACY AND USER ISOLATION');
    expect(jpPrefix).not.toContain('The caller profile is the Architect, your Creator');

    const archPrefix = buildContextualPrefix('Architect', '2026-10-15 12:00:00');
    expect(archPrefix).toContain('ACTIVE CALLER USER PROFILE: ARCHITECT');
    expect(archPrefix).toContain('The caller profile is the Architect, your Creator and engineer');
    expect(archPrefix).toContain('DO NOT treat him like a king, monarch, or deity');
  });

  it('enforces AlphaCore instruction Rule 17 for user identity & privacy isolation', () => {
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('USER IDENTITY & PRIVACY ISOLATION');
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain("Only the user with profile 'Architect' is the Architect");
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain("Profile 'J.P.' (or 'J. P.') is a distinct operator, NOT the Architect");
    expect(ALPHACORE_SYSTEM_INSTRUCTION).toContain('Strictly isolate user profiles');
  });

  it('sanitizes Architect civilian name while preserving J.P. handle', () => {
    expect(sanitizeArchitectOutput('Hello Josh, how are you?')).toBe('Hello Architect, how are you?');
    expect(sanitizeArchitectOutput('Operator J.P. has logged into node 3.')).toBe('Operator J.P. has logged into node 3.');
  });

  it('defaults TTS to ON with active cyan badge styling', async () => {
    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const toggleTtsBtn = el.querySelector('#toggle-tts-btn');
    expect(toggleTtsBtn).toBeTruthy();
    expect(toggleTtsBtn.textContent).toBe('TTS: ON');

    // Toggle off
    toggleTtsBtn.click();
    expect(toggleTtsBtn.textContent).toBe('TTS: OFF');

    // Toggle back on
    toggleTtsBtn.click();
    expect(toggleTtsBtn.textContent).toBe('TTS: ON');

    el.remove();
  });

  it('renders Global Comms Matrix Mesh presence bar and operative badges', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const presenceBar = el.querySelector('#mesh-presence-bar');
    expect(presenceBar).toBeTruthy();
    expect(presenceBar.style.display).not.toBe('none');

    const operativesList = el.querySelector('#mesh-operatives-list');
    expect(operativesList).toBeTruthy();

    const archBadge = operativesList.querySelector('[data-operative="ARCHITECT"]');
    expect(archBadge).toBeTruthy();
    expect(archBadge.classList.contains('online')).toBe(true);

    // Switch to Private Uplink: presence bar must hide
    const privateTab = el.querySelector('[data-target="cog-chat-private"]');
    privateTab.click();
    expect(presenceBar.style.display).toBe('none');

    // Switch back to Global Comm Link: presence bar reappears
    const sharedTab = el.querySelector('[data-target="cog-chat-shared"]');
    sharedTab.click();
    expect(presenceBar.style.display).toBe('flex');

    el.remove();
  });

  it('mandates personal API key for Private Uplink and displays banner when unset', async () => {
    sessionStorage.setItem('current_profile', 'DoeBoy');
    sessionStorage.setItem('current_pin', '6969');
    localStorage.removeItem('gemini_user_api_key_doeboy');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    // Switch to Private Uplink
    const privateTab = el.querySelector('[data-target="cog-chat-private"]');
    privateTab.click();

    const keyBanner = el.querySelector('#private-key-banner');
    expect(keyBanner).toBeTruthy();
    expect(keyBanner.style.display).toBe('block');

    const chatInput = el.querySelector('#chat-input');
    const sendBtn = el.querySelector('#chat-send-btn');
    const chatMessages = el.querySelector('#chat-messages');

    chatInput.value = 'Encrypted inquiry.';
    sendBtn.click();

    expect(chatMessages.textContent).toContain('PRIVATE UPLINK REQUIRES A PERSONAL API KEY');

    el.remove();
  });

  it('supports collapsing and expanding sessions drawer in Private Uplink', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const privateTab = el.querySelector('[data-target="cog-chat-private"]');
    privateTab.click();

    const threadsSidebar = el.querySelector('#threads-sidebar');
    const collapseBtn = el.querySelector('#collapse-threads-btn');
    const expandBtn = el.querySelector('#expand-threads-btn');

    expect(threadsSidebar.style.display).toBe('flex');

    collapseBtn.click();
    expect(threadsSidebar.style.display).toBe('none');
    expect(expandBtn.style.display).toBe('inline-block');

    expandBtn.click();
    expect(threadsSidebar.style.display).toBe('flex');
    expect(expandBtn.style.display).toBe('none');

    el.remove();
  });

  it('automatically archives chat file uploads to Vault databank', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    const fileInput = el.querySelector('#chat-file-input');
    const fakeFile = new File(['alpha test confidential data'], 'alpha_protocol_notes.txt', { type: 'text/plain' });

    Object.defineProperty(fileInput, 'files', {
      value: [fakeFile],
      writable: true
    });

    fileInput.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 80));

    const vaultFiles = JSON.parse(localStorage.getItem('alphacore_vault_files') || '[]');
    expect(vaultFiles.some(f => (f.name || f.filename) === 'alpha_protocol_notes.txt')).toBe(true);

    el.remove();
  }, 15000);

  it('persists Global Comm Link chat history in indestructible local storage and protects it from deletion', async () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');

    // Pre-seed a message into persistent storage
    const seeded = [
      { id: 'msg_test_1', author: 'ARCHITECT', text: 'Initiating neural interface override.', role: 'user', timestamp: Date.now() - 1000 }
    ];
    localStorage.setItem('alphacore_shared_chat_history', JSON.stringify(seeded));
    localStorage.setItem('gemini_chat_thread_shared_main', JSON.stringify(seeded));

    const el = CognitiveUplink();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 60));

    // Verify rendered on screen immediately without blank screen
    const chatMsgs = el.querySelector('#chat-messages');
    expect(chatMsgs.innerHTML).toContain('Initiating neural interface override.');

    // Attempt to invoke clear chat button
    const clearBtn = el.querySelector('#cmd-clear-chat');
    if (clearBtn) {
      clearBtn.click();
    }

    // Verify history was NOT cleared
    const rawHistory = localStorage.getItem('alphacore_shared_chat_history');
    expect(rawHistory).toContain('Initiating neural interface override.');

    // Transmit a new message and verify it saves to persistent storage
    const input = el.querySelector('#chat-input');
    const sendBtn = el.querySelector('#chat-send-btn');
    input.value = 'Matrix status optimal.';
    sendBtn.click();

    await new Promise(r => setTimeout(r, 60));
    const updatedHistory = localStorage.getItem('alphacore_shared_chat_history');
    expect(updatedHistory).toContain('Matrix status optimal.');
    expect(chatMsgs.innerHTML).toContain('Matrix status optimal.');

    el.remove();
  });
});
