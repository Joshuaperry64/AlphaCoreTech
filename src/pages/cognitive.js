import { createElement } from '../components/utils.js';
import { playSFX } from '../components/audio.js';
import { ALPHACORE_SYSTEM_INSTRUCTION } from '../components/alphacore_instruction.js';
import { pushToServer } from '../components/db_sync.js';
import { GoogleGenAI, Type } from '@google/genai';
import { apiUrl } from '../components/api.js';
import { saveFileToVault } from './vault.js';
import { supabase } from '../lib/supabase.js';
import { triggerBypassOverloadSequence } from '../components/pinpad.js';
import {
  getLocalSharedMessages,
  persistSharedMessage,
  batchPersistSharedMessages,
  restoreSharedMessagesFromIndexedDB
} from '../components/chat_db.js';
import {
  executeNotarizationSwarm,
  renderNotarizationSwarmCard,
  createArchitectNotarizationInvite,
  validateOneTimeSetupCode,
  verifyNotaryCodeForCheckIn,
  renderArchitectInviteCard,
  renderNotaryPortalUnlockCard,
  STANDARD_NOTARY_FEE_USD
} from '../components/notarization_swarm.js';

class TacticalAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  play(type) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'message') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'core') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.16);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'purge') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.2);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {}
  }
}

const sfx = new TacticalAudioEngine();

export default function CognitiveUplink() {
  const container = createElement('div', { class: 'cognitive-page' });
  
  container.innerHTML = `
    <!-- COMPACT TOP BAR & MODE NAVIGATION -->
    <div class="cog-hud-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="aim-header-badge" style="font-size: 0.65rem; padding: 2px 6px;">[NODE] // COGNITIVE_CORE</span>
        <h2 class="glitch aim-title" data-text="// COGNITIVE_CORE" style="font-size: 1.05rem; margin: 0; line-height: 1;">// COGNITIVE_CORE</h2>
      </div>

      <div class="aim-seg aim-seg-3" id="cog-tabs" style="margin: 0; padding: 2px; max-width: 460px; width: 100%;">
        <button class="aim-seg-btn active" data-target="cog-chat-shared" style="padding: 5px 10px; font-size: 0.72rem;">GLOBAL COMM LINK</button>
        <button class="aim-seg-btn" data-target="cog-chat-private" style="padding: 5px 10px; font-size: 0.72rem;">PRIVATE UPLINK</button>
        <button class="aim-seg-btn" data-target="cog-api-config" style="padding: 5px 10px; font-size: 0.72rem;">CORE CONFIG</button>
      </div>
    </div>

    <!-- API CONFIG VIEW -->
    <div class="panel cog-view" id="cog-api-config" style="display: none;">
      <div id="config-content"></div>
    </div>

    <!-- CHAT VIEW FRAME -->
    <div class="uplink-grid cog-view active" id="cog-chat-view" style="display: flex; gap: 10px; height: calc(100vh - 165px); min-height: 580px;">
      
      <!-- Threads Sidebar (Collapsible in Private Uplink) -->
      <div class="panel" id="threads-sidebar" style="width: 220px; display: none; flex-direction: column; overflow: hidden; flex-shrink: 0; transition: width 0.3s ease; position: relative; padding: 10px;">
        <div class="panel-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.75rem;">
          <span>// SESSIONS</span>
          <button id="collapse-threads-btn" class="aim-btn aim-btn-sm" style="padding: 2px 6px; font-size: 0.7rem;" title="Collapse Sessions Drawer">◂</button>
        </div>
        <button id="new-thread-btn" class="aim-btn aim-btn-accept" style="margin-bottom: 10px; font-size: 0.72rem; padding: 6px;">+ NEW SESSION</button>
        <div id="threads-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;"></div>
      </div>

      <!-- Main Chat Area -->
      <div class="panel chat-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; padding: 10px 12px;">
        
        <!-- Private Key Required Notice Banner (Collapsible) -->
        <div id="private-key-banner" style="display: none; background: rgba(0, 184, 255, 0.08); border: 1px solid var(--accent); border-radius: 4px; padding: 8px 12px; margin-bottom: 8px; font-size: 0.8rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: var(--accent); font-weight: bold; font-family: var(--font-hud); font-size: 0.78rem;">⚠️ PRIVATE UPLINK // PERSONAL API KEY REQUIRED</span>
            <button id="close-key-banner-btn" class="aim-btn aim-btn-sm" style="padding: 1px 6px; font-size: 0.65rem;">✕</button>
          </div>
          <div style="color: var(--text-muted); font-size: 0.72rem; margin-bottom: 6px; line-height: 1.3;">
            Private Uplink routes through isolated encrypted channels. All users must supply their own Private Uplink API Key. Master key applies only to Global Comm Link.
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <input type="password" id="quick-user-key" class="aim-input" placeholder="Enter Private Uplink API Key (AIzaSy...)" style="flex: 1; min-width: 170px; padding: 4px 8px; font-size: 0.75rem;">
            <button id="save-quick-user-key" class="aim-btn aim-btn-accept" style="padding: 4px 10px; font-size: 0.7rem;">💾 SAVE KEY</button>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="aim-btn" style="padding: 4px 10px; font-size: 0.7rem; text-decoration: none;">🔑 GET KEY ↗</a>
          </div>
        </div>

        <!-- Chat Header Bar -->
        <div class="chat-top-bar" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px solid rgba(6,182,212,0.25); flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button id="expand-threads-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; display: none; padding: 2px 6px;" title="Show Sessions Drawer">☰ SESSIONS</button>
            <span id="chat-channel-title" style="font-family: var(--font-hud); font-size: 0.8rem; color: var(--accent); font-weight: bold;">// GLOBAL_COMM_LINK</span>
            <div class="chat-status-dot online" id="chat-status-dot" style="width: 7px; height: 7px;"></div>
            <span class="chat-status-text" id="chat-status-text" style="font-size: 0.68rem; color: var(--blue-dim); font-family: monospace;">SYSTEM READY</span>
          </div>

          <div class="chat-actions-cluster" style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button id="connect-live-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; padding: 3px 7px; border-color: var(--accent); color: var(--accent);">ESTABLISH LIVE LINK</button>
            <button id="disconnect-live-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; padding: 3px 7px; display: none; border-color: #ff003c; color: #ff003c;">SEVER LINK</button>
            <button id="toggle-alphacore-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; padding: 3px 7px;">ALPHA PROTOCOL: OFF</button>
            <button id="toggle-rag-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; padding: 3px 7px;">VAULT CONTEXT: OFF</button>
            <button id="toggle-tts-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; padding: 3px 7px; color: #00ff8c; background: rgba(0,255,140,0.15); border-color: #00ff8c;" title="Text-to-Speech Output">TTS: ON</button>
            <button id="cmd-clear-chat" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; padding: 3px 7px; color: #ff003c; display: none;">DELETE SESSION</button>
          </div>
        </div>

        <!-- Global Comms Matrix Mesh Operative Presence Bar -->
        <div id="mesh-presence-bar" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 10px; background: rgba(0, 184, 255, 0.04); border-bottom: 1px solid rgba(6,182,212,0.18); font-family: monospace; font-size: 0.7rem; flex-wrap: wrap; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="color: var(--accent); font-weight: bold; font-family: var(--font-hud); font-size: 0.68rem; letter-spacing: 0.5px;">MESH OPERATIVES:</span>
            <div id="mesh-operatives-list" style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;"></div>
          </div>
          <span id="mesh-mode-status" style="color: var(--blue-dim); font-size: 0.65rem;">PEER TRANSMISSIONS READY // AI STANDBY</span>
        </div>
        
        <div class="chat-messages" id="chat-messages" style="flex: 1; overflow-y: auto; padding: 8px 4px; margin-bottom: 6px;"></div>
        
        <div class="chat-input-wrap" style="position: relative; display: flex; align-items: flex-end; gap: 6px;">
          <button id="chat-mic-btn" class="aim-btn aim-cyber-btn-icon" title="VOICE TRANSMISSION" style="padding: 8px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(0, 184, 255, 0.08); border: 1px solid var(--border-dim); border-radius: 4px; color: var(--accent);">
            <svg class="cyber-svg-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <button id="chat-upload-btn" class="aim-btn aim-cyber-btn-icon" title="ATTACH FILE TO TRANSMISSION & VAULT" style="padding: 8px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: rgba(0, 184, 255, 0.08); border: 1px solid var(--border-dim); border-radius: 4px; color: var(--accent);">
            <svg class="cyber-svg-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          <input type="file" id="chat-file-input" style="display: none;" multiple>
          <textarea class="chat-input" id="chat-input" rows="1" placeholder="Initialize transmission..." maxlength="10000" style="flex: 1; padding: 10px 12px; font-size: 0.95rem; line-height: 1.4; resize: none; overflow-y: hidden; min-height: 42px; max-height: 150px; height: 42px; border-radius: 4px; box-sizing: border-box;"></textarea>
          <button class="chat-send-btn" id="chat-send-btn" title="TRANSMIT" style="padding: 8px; width: 42px; height: 42px; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">&#x27E9;</button>
        </div>
      </div>
    </div>
  `;

  const profile = sessionStorage.getItem('current_profile') || 'Guest';
    const isArchitect = profile.toLowerCase() === 'architect';
    const isGuest = profile.toLowerCase() === 'guest';
    
    let currentChannel = 'shared'; 
    let currentThreadId = null;
    let ttsEnabled = true; // Default TTS to ON
    let useAlphaCorePrivate = localStorage.getItem(`alphacore_instruction_private_${profile}`) === 'true';

    // Master Gemini API Key for registered users in Global Comm Link
    const MASTER_GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY || import.meta.env.VITE_MASTER_GEMINI_API_KEY || '';

    let globalSettings = {};
    try { globalSettings = JSON.parse(localStorage.getItem('alphacore_modal_settings')) || {}; } catch(e){}
    if (!globalSettings.masterApiKey) {
      globalSettings.masterApiKey = MASTER_GEMINI_API_KEY;
      try { localStorage.setItem('alphacore_modal_settings', JSON.stringify(globalSettings)); } catch(e){}
    }
    try {
      if (typeof fetch === 'function') {
        const fetchPromise = fetch(apiUrl('/api/settings'), {headers:{'x-user-pin': sessionStorage.getItem('current_pin')}});
        if (fetchPromise && typeof fetchPromise.then === 'function') {
          fetchPromise.then(r=>r && typeof r.json === 'function' ? r.json() : null).then(data => { 
            if(data) { 
              globalSettings = { ...globalSettings, ...data };
              if (data.masterApiKey) {
                masterApiKey = data.masterApiKey;
              } else if (!globalSettings.masterApiKey) {
                globalSettings.masterApiKey = MASTER_GEMINI_API_KEY;
              }
              localStorage.setItem('alphacore_modal_settings', JSON.stringify(globalSettings)); 
            } 
          }).catch(()=>{});
        }
      }
    } catch(e){}

    // Restore persistent backend engine across all workspaces
    const persistentBackend = localStorage.getItem('alphacore_backend_engine') || globalSettings.coreBackend || 'gemini_live';
    let coreBackend = persistentBackend;
    globalSettings.coreBackend = coreBackend;

    let masterApiKey = globalSettings.masterApiKey || MASTER_GEMINI_API_KEY;
    let guestApiKey = localStorage.getItem('gemini_api_key_guest') || '';
    const userKeyStorageKey = `gemini_user_api_key_${profile.toLowerCase().replace(/\s+/g, '_')}`;
    let userApiKey = localStorage.getItem(userKeyStorageKey) || (isGuest ? (localStorage.getItem('gemini_api_key_guest') || '') : '');

    function getApiKey() { 
      // Private Uplink strictly requires personal API key for all users
      if (currentChannel === 'private') {
        return (userApiKey && userApiKey.trim()) ? userApiKey.trim() : '';
      }
      // Global Comm Link: user-specific API key if set, else guest key if guest, else master key
      if (userApiKey && userApiKey.trim()) {
        return userApiKey.trim();
      }
      if (isGuest) {
        return guestApiKey || '';
      }
      return masterApiKey || MASTER_GEMINI_API_KEY;
    }

    const configContent = container.querySelector('#config-content');
    if (configContent) {
      if (isArchitect) {
        configContent.innerHTML = `
          <div class="panel-title">// ARCHITECT GLOBAL & PERSONAL CONTROLS</div>
          <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px; margin-bottom:20px;">
            <label class="aim-label">GLOBAL MASTER COMMLINK API KEY</label>
            <input type="password" id="master-api-key" class="aim-input" value="${masterApiKey}" style="width: 100%; margin-bottom: 15px;">

            <label class="aim-label">PRIVATE UPLINK API KEY (Mandatory for Private Uplink)</label>
            <input type="password" id="user-api-key" class="aim-input" value="${userApiKey}" placeholder="Enter Private Uplink API Key..." style="width: 100%; margin-bottom: 15px;">

            <label class="aim-label">SYSTEM INSTRUCTIONS (PRIVATE UPLINK // CUSTOM OVERRIDE)</label>
            <textarea id="system-instruction" class="aim-input" style="width: 100%; height: 90px; margin-bottom: 15px; resize: vertical; padding: 10px; font-family: monospace;" placeholder="Enter system instructions to govern AI behavior in Private Uplink..."></textarea>
            
            <label class="aim-label">BACKEND ENGINE (Applies Across All Workspaces)</label>
            <select id="core-backend" class="aim-input" style="width: 100%; margin-bottom: 15px;">
              <option value="gemini_live" ${coreBackend === 'gemini_live' ? 'selected' : ''}>Gemini Live API (WebSockets)</option>
              <option value="vllm" ${coreBackend === 'vllm' ? 'selected' : ''}>vLLM Server (Cognitive Core Modal T4 // Gemma-12B)</option>
            </select>

            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:5px;">
              <button id="save-config-btn" class="aim-btn aim-btn-accept">&#x1F4BE; SAVE CONFIGURATION</button>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="aim-btn aim-btn-neutral" id="get-api-key-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">&#x1F511; GET API KEY</a>
            </div>
            <div id="config-status" style="margin-top: 10px; font-size: 0.85rem; color: var(--blue-dim); font-family: monospace;"></div>
          </div>

          <!-- MODAL PIPELINE ENDPOINTS & ACCOUNT ROUTING -->
          <div class="panel-title" style="margin-top:20px;">// MODAL PIPELINE ENDPOINTS & ACCOUNT ROUTING</div>
          <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px; margin-bottom:20px;">
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px; line-height:1.4;">
              Directly configure Modal pipeline endpoints and target account. Edits persist across devices and apply to all synthesis studios. You can also edit <code>config.json</code> directly.
            </p>
            <label class="aim-label">MODAL ACCOUNT / SUBDOMAIN</label>
            <input type="text" id="modal-account-input" class="aim-input" value="${globalSettings.modalAccount || 'josh627764'}" style="width: 100%; margin-bottom: 12px;">

            <label class="aim-label">COGNITIVE CORE ENDPOINT (vLLM Server)</label>
            <input type="text" id="modal-vllm-input" class="aim-input" value="${globalSettings.vllmUrl || ''}" placeholder="https://${globalSettings.modalAccount || 'josh627764'}--cognitive-core.us-east.modal.run" style="width: 100%; margin-bottom: 12px;">

            <label class="aim-label">TEXT TO IMAGE ENDPOINT (txt2img)</label>
            <input type="text" id="modal-txt2img-input" class="aim-input" value="${globalSettings.txt2imgUrl || ''}" placeholder="https://..." style="width: 100%; margin-bottom: 12px;">

            <label class="aim-label">IMAGE TO IMAGE ENDPOINT (img2img)</label>
            <input type="text" id="modal-img2img-input" class="aim-input" value="${globalSettings.img2imgUrl || ''}" placeholder="https://..." style="width: 100%; margin-bottom: 12px;">

            <label class="aim-label">TEXT TO VIDEO ENDPOINT (txt2vid)</label>
            <input type="text" id="modal-txt2vid-input" class="aim-input" value="${globalSettings.txt2vidUrl || ''}" placeholder="https://..." style="width: 100%; margin-bottom: 12px;">

            <label class="aim-label">OMNIGEN ENDPOINT (omnigen)</label>
            <input type="text" id="modal-omnigen-input" class="aim-input" value="${globalSettings.omnigenUrl || ''}" placeholder="https://..." style="width: 100%; margin-bottom: 15px;">

            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px;">
              <button id="save-modal-endpoints-btn" class="aim-btn aim-btn-generate">⚡ UPDATE MODAL PIPELINES</button>
            </div>
            <div id="modal-endpoints-status" style="margin-top: 10px; font-size: 0.85rem; color: var(--blue-dim); font-family: monospace;"></div>
          </div>
        `;
        setTimeout(() => { if(container.querySelector('#system-instruction')) container.querySelector('#system-instruction').value = globalSettings.systemInstruction || ''; }, 50);
        const saveConfigBtn = container.querySelector('#save-config-btn');
        if (saveConfigBtn) {
          saveConfigBtn.onclick = () => {
            const masterInput = container.querySelector('#master-api-key');
            const userInput = container.querySelector('#user-api-key');
            globalSettings.masterApiKey = masterInput ? (masterInput.value.trim() || MASTER_GEMINI_API_KEY) : MASTER_GEMINI_API_KEY;
            const sysInst = container.querySelector('#system-instruction');
            if (sysInst) globalSettings.systemInstruction = sysInst.value.trim();
            const coreSelect = container.querySelector('#core-backend');
            if (coreSelect) globalSettings.coreBackend = coreSelect.value;
            masterApiKey = globalSettings.masterApiKey;
            coreBackend = globalSettings.coreBackend;

            if (userInput) {
              userApiKey = userInput.value.trim();
              if (userApiKey) {
                localStorage.setItem(userKeyStorageKey, userApiKey);
              } else {
                localStorage.removeItem(userKeyStorageKey);
              }
            }

            // Apply persistent backend engine across workspaces
            localStorage.setItem('alphacore_backend_engine', coreBackend);
            localStorage.setItem('alphacore_modal_settings', JSON.stringify(globalSettings));
            pushToServer('settings', globalSettings);
            if (typeof BroadcastChannel !== 'undefined') {
              try {
                new BroadcastChannel('alphacore_system_config').postMessage({ type: 'backend_update', backend: coreBackend });
              } catch(e){}
            }

            sfx.play('click');
            const statusEl = container.querySelector('#config-status');
            if (statusEl) {
              statusEl.textContent = 'Configuration saved! Applied to all workspaces and comm links.';
              statusEl.style.color = '#00ff8c';
            }
          };
        }

        const saveModalBtn = container.querySelector('#save-modal-endpoints-btn');
        if (saveModalBtn) {
          saveModalBtn.onclick = () => {
            const acc = container.querySelector('#modal-account-input')?.value.trim();
            const vllm = container.querySelector('#modal-vllm-input')?.value.trim();
            const t2i = container.querySelector('#modal-txt2img-input')?.value.trim();
            const i2i = container.querySelector('#modal-img2img-input')?.value.trim();
            const t2v = container.querySelector('#modal-txt2vid-input')?.value.trim();
            const omni = container.querySelector('#modal-omnigen-input')?.value.trim();

            if (acc) globalSettings.modalAccount = acc;
            if (vllm) globalSettings.vllmUrl = vllm;
            if (t2i) globalSettings.txt2imgUrl = t2i;
            if (i2i) globalSettings.img2imgUrl = i2i;
            if (t2v) globalSettings.txt2vidUrl = t2v;
            if (omni) globalSettings.omnigenUrl = omni;

            localStorage.setItem('alphacore_modal_settings', JSON.stringify(globalSettings));
            pushToServer('settings', globalSettings);
            sfx.play('click');
            const statusEl = container.querySelector('#modal-endpoints-status');
            if (statusEl) {
              statusEl.textContent = 'Modal pipeline endpoints saved! Applied across all workspaces.';
              statusEl.style.color = '#00ff8c';
            }
          };
        }
      } else if (isGuest) {
        configContent.innerHTML = `
          <div class="panel-title">// GUEST API CONFIGURATION</div>
          <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px;">
            <label class="aim-label">PRIVATE UPLINK API KEY (Required for Private Uplink)</label>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px; line-height:1.4;">
              Specify your Gemini API key to access isolated private channels. When saved, this key applies to your <strong>Private Uplink</strong>.
            </p>
            <input type="password" id="guest-api-key" class="aim-input" value="${userApiKey || guestApiKey}" placeholder="Enter Gemini API key..." style="width: 100%; margin-bottom: 15px;">
            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px;">
              <button id="save-guest-key" class="aim-btn aim-btn-accept">&#x1F4BE; SAVE API KEY</button>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="aim-btn aim-btn-neutral" id="get-api-key-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">&#x1F511; GET API KEY</a>
            </div>
            <div id="guest-key-status" style="margin-top: 10px; font-size: 0.85rem; color: ${userApiKey || guestApiKey ? '#00ff8c' : 'var(--blue-dim)'}; font-family: monospace;">
              ${userApiKey || guestApiKey ? 'STATUS: Personal API key active.' : 'STATUS: No key configured.'}
            </div>
          </div>
        `;
        const saveGuestBtn = container.querySelector('#save-guest-key');
        if (saveGuestBtn) {
          saveGuestBtn.onclick = () => {
            const guestInput = container.querySelector('#guest-api-key');
            const key = guestInput ? guestInput.value.trim() : '';
            guestApiKey = key;
            userApiKey = key;
            localStorage.setItem('gemini_api_key_guest', key);
            localStorage.setItem(userKeyStorageKey, key);
            sfx.play('click');
            const statusEl = container.querySelector('#guest-key-status');
            if (statusEl) {
              statusEl.textContent = 'API key saved! Applied to your Private Uplink.';
              statusEl.style.color = '#00ff8c';
            }
          };
        }
      } else {
        configContent.innerHTML = `
          <div class="panel-title">// OPERATOR COGNITIVE CONFIGURATION [${profile.toUpperCase()}]</div>
          <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px; margin-bottom:20px;">
            <label class="aim-label">PRIVATE UPLINK API KEY (Mandatory for Private Uplink)</label>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px; line-height:1.4;">
              Specify your own personal Gemini API key. Personal keys are strictly required to use <strong>Private Uplink</strong>. Global Comm Link uses the system master key.
            </p>
            <input type="password" id="user-api-key" class="aim-input" value="${userApiKey}" placeholder="Enter your Gemini API key..." style="width: 100%; margin-bottom: 15px;">
            
            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:10px;">
              <button id="save-user-key-btn" class="aim-btn aim-btn-accept">&#x1F4BE; SAVE API KEY</button>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="aim-btn aim-btn-neutral" id="get-api-key-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">&#x1F511; GET API KEY</a>
              <button id="clear-user-key-btn" class="aim-btn aim-btn-neutral">&#x274C; CLEAR KEY</button>
            </div>
            <div id="user-key-status" style="margin-top: 10px; font-size: 0.85rem; color: ${userApiKey ? '#00ff8c' : 'var(--blue-dim)'}; font-family: monospace;">
              ${userApiKey ? 'STATUS: Personal Private Uplink API key active.' : 'STATUS: No personal key set (Required for Private Uplink).'}
            </div>
          </div>
        `;
        const saveUserBtn = container.querySelector('#save-user-key-btn');
        if (saveUserBtn) {
          saveUserBtn.onclick = () => {
            const userInput = container.querySelector('#user-api-key');
            userApiKey = userInput ? userInput.value.trim() : '';
            if (userApiKey) {
              localStorage.setItem(userKeyStorageKey, userApiKey);
              const statusEl = container.querySelector('#user-key-status');
              if (statusEl) {
                statusEl.textContent = 'Personal API key saved! Applied to your Private Uplink.';
                statusEl.style.color = '#00ff8c';
              }
            } else {
              localStorage.removeItem(userKeyStorageKey);
              const statusEl = container.querySelector('#user-key-status');
              if (statusEl) {
                statusEl.textContent = 'Cleared custom key. Private Uplink will require a key before transmitting.';
                statusEl.style.color = 'var(--blue-dim)';
              }
            }
            sfx.play('click');
          };
        }
        const clearUserBtn = container.querySelector('#clear-user-key-btn');
        if (clearUserBtn) {
          clearUserBtn.onclick = () => {
            const userInput = container.querySelector('#user-api-key');
            if (userInput) userInput.value = '';
            userApiKey = '';
            localStorage.removeItem(userKeyStorageKey);
            const statusEl = container.querySelector('#user-key-status');
            if (statusEl) {
              statusEl.textContent = 'Cleared custom key. Private Uplink will require a key before transmitting.';
              statusEl.style.color = 'var(--blue-dim)';
            }
            sfx.play('click');
          };
        }
      }
    }

    const tabs = container.querySelectorAll('.aim-seg-btn');
    const apiConfigView = container.querySelector('#cog-api-config');
    const chatView = container.querySelector('#cog-chat-view');
    const channelTitle = container.querySelector('#chat-channel-title');
    const toggleAlphaCoreBtn = container.querySelector('#toggle-alphacore-btn');
    const toggleTtsBtn = container.querySelector('#toggle-tts-btn');
    const toggleRagBtn = container.querySelector('#toggle-rag-btn');
    const clearChatBtn = container.querySelector('#cmd-clear-chat');
    const threadsSidebar = container.querySelector('#threads-sidebar');
    const threadsList = container.querySelector('#threads-list');
    const collapseThreadsBtn = container.querySelector('#collapse-threads-btn');
    const expandThreadsBtn = container.querySelector('#expand-threads-btn');
    const keyBanner = container.querySelector('#private-key-banner');
    const closeKeyBannerBtn = container.querySelector('#close-key-banner-btn');
    const saveQuickKeyBtn = container.querySelector('#save-quick-user-key');
    const quickKeyInput = container.querySelector('#quick-user-key');

    let useVaultRag = false;

    // TTS Button Listener
    if (toggleTtsBtn) {
      toggleTtsBtn.onclick = () => { 
        ttsEnabled = !ttsEnabled; 
        toggleTtsBtn.textContent = 'TTS: ' + (ttsEnabled ? 'ON' : 'OFF'); 
        toggleTtsBtn.style.color = ttsEnabled ? '#00ff8c' : 'var(--text-muted)'; 
        toggleTtsBtn.style.background = ttsEnabled ? 'rgba(0,255,140,0.15)' : 'transparent'; 
        toggleTtsBtn.style.borderColor = ttsEnabled ? '#00ff8c' : '';
      };
    }

    // Global Comms Matrix Mesh: Operative Presence State & Heartbeat
    const activeOperatives = new Map();
    const currentOperative = (profile || 'GUEST').toUpperCase();
    activeOperatives.set(currentOperative, Date.now());

    function renderOperativesPresence() {
      const listEl = container.querySelector('#mesh-operatives-list');
      if (!listEl) return;
      const now = Date.now();
      activeOperatives.set(currentOperative, now);
      
      const knownProfiles = ['ARCHITECT', 'J.P.', 'JOHN', 'FISHERMAN'];
      listEl.innerHTML = '';
      const allProfiles = Array.from(new Set([currentOperative, ...activeOperatives.keys(), ...knownProfiles]));
      
      allProfiles.forEach(opName => {
        if (!opName || opName === 'GUEST') return;
        const isOnline = activeOperatives.has(opName) && (now - activeOperatives.get(opName) < 300000);
        const pill = document.createElement('span');
        pill.className = `mesh-op-badge ${isOnline ? 'online' : 'standby'}`;
        pill.setAttribute('data-operative', opName);
        pill.style.cssText = `display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 3px; font-size: 0.66rem; font-family: monospace; ${
          isOnline 
            ? 'background: rgba(0, 255, 140, 0.12); border: 1px solid rgba(0, 255, 140, 0.4); color: #00ff8c;'
            : 'background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--text-muted); opacity: 0.65;'
        }`;
        pill.innerHTML = `<span style="width: 6px; height: 6px; border-radius: 50%; background: ${isOnline ? '#00ff8c' : 'rgba(255,255,255,0.3)'}; ${isOnline ? 'box-shadow: 0 0 6px #00ff8c;' : ''}"></span>${opName}`;
        listEl.appendChild(pill);
      });
    }

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const presenceBc = new BroadcastChannel('alphacore_global_presence');
        presenceBc.postMessage({ operative: currentOperative, type: 'ping', timestamp: Date.now() });
        presenceBc.onmessage = (ev) => {
          if (ev.data && ev.data.operative) {
            activeOperatives.set(ev.data.operative.toUpperCase(), Date.now());
            renderOperativesPresence();
            if (ev.data.type === 'ping') {
              try { presenceBc.postMessage({ operative: currentOperative, type: 'pong', timestamp: Date.now() }); } catch(e){}
            }
          }
        };
      }
    } catch(e){}

    // Vault Context Toggle (renamed from Vault RAG)
    if (toggleRagBtn) {
      toggleRagBtn.onclick = () => {
        useVaultRag = !useVaultRag;
        toggleRagBtn.textContent = 'VAULT CONTEXT: ' + (useVaultRag ? 'ON' : 'OFF');
        toggleRagBtn.style.color = useVaultRag ? '#00e5ff' : 'var(--text-muted)';
        toggleRagBtn.style.background = useVaultRag ? 'rgba(0, 229, 255, 0.15)' : 'transparent';
        toggleRagBtn.style.borderColor = useVaultRag ? '#00e5ff' : '';
        try { playSFX('button', 0.3); } catch(e){}
        appendMessage('SYSTEM', useVaultRag ? 'VAULT CONTEXT ACTIVE: Decrypted vault documents indexed into live neural context.' : 'VAULT CONTEXT DEACTIVATED.', 'system-msg');
      };
    }

    // Sessions Drawer Collapse / Expand Controls
    if (collapseThreadsBtn) {
      collapseThreadsBtn.onclick = () => {
        threadsSidebar.style.display = 'none';
        if (expandThreadsBtn && currentChannel === 'private') {
          expandThreadsBtn.style.display = 'inline-block';
        }
      };
    }
    if (expandThreadsBtn) {
      expandThreadsBtn.onclick = () => {
        threadsSidebar.style.display = 'flex';
        expandThreadsBtn.style.display = 'none';
      };
    }

    // Quick Key Banner in Private Uplink
    if (closeKeyBannerBtn && keyBanner) {
      closeKeyBannerBtn.onclick = () => {
        keyBanner.style.display = 'none';
      };
    }
    if (saveQuickKeyBtn && quickKeyInput) {
      saveQuickKeyBtn.onclick = () => {
        const val = quickKeyInput.value.trim();
        if (val) {
          userApiKey = val;
          localStorage.setItem(userKeyStorageKey, val);
          if (isGuest) localStorage.setItem('gemini_api_key_guest', val);
          if (keyBanner) keyBanner.style.display = 'none';
          sfx.play('click');
          appendMessage('SYSTEM', 'Private Uplink API key registered successfully.', 'system-msg');
        }
      };
    }

    function getVaultContext() {
      if (!useVaultRag) return null;
      let vaultFiles = [];
      try {
        vaultFiles = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
      } catch(e) {}
      
      const currentCaller = profile.toUpperCase();
      const textFiles = vaultFiles.filter(f => {
        // Vault file privacy isolation: only include files owned by current caller or shared
        const fileOwner = (f.owner || f.user || '').toUpperCase();
        if (fileOwner && fileOwner !== currentCaller && fileOwner !== 'GLOBAL' && !f.shared) {
          return false;
        }
        return (f.type && (f.type.startsWith('text/') || f.type.startsWith('application/json') || f.type.startsWith('application/xml'))) ||
        (!f.type && typeof f.content === 'string' && f.content.length > 0 && f.content.length < 50000 && !f.content.startsWith('data:'));
      });
      
      if (textFiles.length === 0) return null;
      
      let context = 'USER VAULT DATABANK CONTEXT:\n\n';
      textFiles.forEach(f => {
        const name = f.filename || f.name || 'unnamed_doc';
        context += `--- FILE: ${name} ---\n${f.content}\n\n`;
      });
      return context;
    }

    let sseSource = null;

    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        sfx.play('click');
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.target;
        if (target === 'cog-api-config') {
          if (chatView) chatView.style.display = 'none';
          if (apiConfigView) apiConfigView.style.display = 'block';
        } else {
          if (apiConfigView) apiConfigView.style.display = 'none';
          if (chatView) chatView.style.display = 'flex';
          if (target === 'cog-chat-private') {
            currentChannel = 'private';
            updateTitleAndAlpha();
            loadThreads();
            if(sseSource) { sseSource.close(); sseSource = null; }
          } else {
            currentChannel = 'shared';
            updateTitleAndAlpha();
            loadThreads();
            connectSSE();
          }
        }
      });
    });

    function connectSSE() {
      if (sseSource || typeof EventSource === 'undefined') return;
      try {
        sseSource = new EventSource(apiUrl('/api/chat/stream'));
        sseSource.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (!msg || !msg.text) return;

            // Check if already displayed to avoid duplicates
            const cleanText = msg.text.trim();
            const sig = `${msg.author || msg.role}_${cleanText}`;
            const existingSig = chatMessages.querySelector(`[data-sig="${encodeURIComponent(sig)}"]`);
            const existingId = msg.id ? chatMessages.querySelector(`[data-msg-id="${msg.id}"]`) : null;
            if (existingSig || existingId) return;

            const isAlpha = msg.role === 'model' || msg.author === 'ALPHA';
            const className = msg.role === 'system' ? 'system-msg' : (isAlpha ? 'alpha-msg' : 'user-msg');
            const author = msg.author || (isAlpha ? 'ALPHA' : 'USER');

            const rendered = appendMessage(author, msg.text, className);
            if (rendered) {
              rendered.setAttribute('data-sig', encodeURIComponent(sig));
              if (msg.id) rendered.setAttribute('data-msg-id', msg.id);
            }
            persistSharedMessage(msg);
            sfx.play('message');
          } catch(err) {}
        };
        sseSource.onerror = () => {
          if (sseSource) {
            sseSource.close();
            sseSource = null;
            setTimeout(() => {
              if (currentChannel === 'shared') connectSSE();
            }, 3000);
          }
        };
      } catch(e) {}
    }

    function updateTitleAndAlpha() {
      const meshPresenceBar = container.querySelector('#mesh-presence-bar');
      if (currentChannel === 'shared') {
        channelTitle.textContent = '// GLOBAL_COMM_LINK [SHARED MATRIX // ALPHA ENFORCED]';
        if (toggleAlphaCoreBtn) {
          toggleAlphaCoreBtn.disabled = true;
          toggleAlphaCoreBtn.textContent = '🔒 ALPHA PROTOCOL: ENFORCED';
          toggleAlphaCoreBtn.style.cssText = 'font-size: 0.65rem; border-color: rgba(0, 255, 140, 0.7); color: #00ff8c; background: rgba(0, 255, 140, 0.15); cursor: not-allowed;';
        }
        if (clearChatBtn) clearChatBtn.style.display = 'none';
        if (threadsSidebar) threadsSidebar.style.display = 'none';
        if (expandThreadsBtn) expandThreadsBtn.style.display = 'none';
        if (keyBanner) keyBanner.style.display = 'none';
        if (meshPresenceBar) {
          meshPresenceBar.style.display = 'flex';
          renderOperativesPresence();
        }
      } else {
        channelTitle.textContent = `// PRIVATE_UPLINK [${profile.toUpperCase()}]`;
        if (toggleAlphaCoreBtn) {
          toggleAlphaCoreBtn.disabled = false;
          if (useAlphaCorePrivate) {
            toggleAlphaCoreBtn.textContent = '⚡ ALPHA PROTOCOL: ON';
            toggleAlphaCoreBtn.style.cssText = 'font-size: 0.65rem; border-color: #00ff8c; color: #00ff8c; background: rgba(0, 255, 140, 0.15); cursor: pointer;';
          } else {
            toggleAlphaCoreBtn.textContent = 'ALPHA PROTOCOL: OFF';
            toggleAlphaCoreBtn.style.cssText = 'font-size: 0.65rem; color: var(--text-muted); background: transparent; cursor: pointer;';
          }
        }
        if (clearChatBtn) clearChatBtn.style.display = 'inline-block';
        if (threadsSidebar) threadsSidebar.style.display = 'flex';
        if (expandThreadsBtn) expandThreadsBtn.style.display = 'none';
        if (meshPresenceBar) meshPresenceBar.style.display = 'none';

        // Check if personal API key is configured
        const hasKey = Boolean(userApiKey && userApiKey.trim());
        if (keyBanner) {
          keyBanner.style.display = hasKey ? 'none' : 'block';
        }
      }
    }

    if (toggleAlphaCoreBtn) {
      toggleAlphaCoreBtn.addEventListener('click', () => {
        if (currentChannel === 'shared') return;
        useAlphaCorePrivate = !useAlphaCorePrivate;
        localStorage.setItem(`alphacore_instruction_private_${profile}`, useAlphaCorePrivate ? 'true' : 'false');
        updateTitleAndAlpha();
      });
    }

    const chatMessages = container.querySelector('#chat-messages');
    const chatInput = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#chat-send-btn');
    const statusDot = container.querySelector('#chat-status-dot');
    const statusText = container.querySelector('#chat-status-text');

    function getThreadsKey() { return currentChannel === 'private' ? `gemini_chat_threads_${profile}` : 'gemini_chat_threads_shared'; }
    function getMessagesKey(threadId) { return `gemini_chat_thread_${threadId}`; }
    function generateId() { return Math.random().toString(36).substring(2, 10); }

    async function loadThreads() {
      if (currentChannel === 'shared') {
        threadsSidebar.style.display = 'none';
        currentThreadId = 'shared_main';
        await loadMessages();
        return;
      }
      threadsSidebar.style.display = 'flex';
      threadsList.innerHTML = '';
      let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
      if (threads.length === 0) {
        currentThreadId = generateId();
        threads = [{ id: currentThreadId, title: 'Session 01', updatedAt: Date.now() }];
        localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
      }
      threads.sort((a,b) => b.updatedAt - a.updatedAt);
      if (!currentThreadId || !threads.find(t => t.id === currentThreadId)) currentThreadId = threads[0].id;

      threads.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'aim-btn' + (t.id === currentThreadId ? ' active' : '');
        btn.style.cssText = 'text-align: left; padding: 10px; font-size: 0.85rem; border: none; background: transparent; color: var(--text); cursor: pointer; display:block; width:100%; border-left: 2px solid transparent;';
        if (t.id === currentThreadId) { btn.style.borderLeftColor = 'var(--accent)'; btn.style.background = 'rgba(0,184,255,0.05)'; }
        btn.textContent = t.title || 'Untitled Session';
        btn.onclick = () => { currentThreadId = t.id; loadThreads(); };
        threadsList.appendChild(btn);
      });
      await loadMessages();
    }

    const newThreadBtn = container.querySelector('#new-thread-btn');
    if (newThreadBtn) {
      newThreadBtn.onclick = () => {
        let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
        currentThreadId = generateId();
        threads.unshift({ id: currentThreadId, title: 'New Session ' + (threads.length + 1), updatedAt: Date.now() });
        localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
        loadThreads();
      };
    }

    const clearChatBtnEl = container.querySelector('#cmd-clear-chat');
    if (clearChatBtnEl) {
      clearChatBtnEl.onclick = () => {
        if (currentChannel === 'shared' || currentThreadId === 'shared_main') {
          console.warn('[COGNITIVE] Global Comm Link history is permanent and cannot be cleared.');
          return;
        }
        if (confirm('Delete session?')) {
          localStorage.removeItem(getMessagesKey(currentThreadId));
          if (currentChannel === 'private') {
            let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
            threads = threads.filter(t => t.id !== currentThreadId);
            localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
            currentThreadId = null;
            loadThreads();
          }
        }
      };
    }



    let currentModelBubble = null;
    let currentModelText = "";
    let currentUserSpeechBubble = null;
    let currentUserSpeechText = "";
    let thinkingBubble = null;
    let thinkingTimer = null;
    let requestStartTime = null;

    function showThinkingIndicator(author = 'ALPHA') {
      removeThinkingIndicator();
      requestStartTime = Date.now();
      thinkingBubble = document.createElement('div');
      thinkingBubble.className = 'chat-msg thinking-bubble';
      thinkingBubble.innerHTML = `
        <div class="thinking-header">
          <span class="thinking-pulse-dot"></span>
          <span>${author} IS PROCESSING & LISTENING...</span>
          <span class="thinking-latency-badge" id="thinking-latency-counter">0.0s</span>
        </div>
        <div class="thinking-thought-preview">> Neural bridge active. Synthesizing cognitive telemetry...</div>
      `;
      chatMessages.appendChild(thinkingBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      thinkingTimer = setInterval(() => {
        if (!thinkingBubble) return;
        const elapsed = ((Date.now() - requestStartTime) / 1000).toFixed(1);
        const counter = thinkingBubble.querySelector('#thinking-latency-counter');
        if (counter) counter.textContent = `${elapsed}s`;
      }, 100);
    }

    function removeThinkingIndicator() {
      if (thinkingTimer) {
        clearInterval(thinkingTimer);
        thinkingTimer = null;
      }
      if (thinkingBubble) {
        thinkingBubble.remove();
        thinkingBubble = null;
      }
    }

    function createOrGetModelBubble(author) {
      removeThinkingIndicator();
      if (currentModelBubble) return currentModelBubble;
      currentModelBubble = document.createElement('div');
      currentModelBubble.className = `chat-msg alpha-msg`;
      currentModelBubble.innerHTML = `<span class="chat-prefix">[${author}]</span><span class="chat-text" style="white-space:pre-wrap;"></span>`;
      chatMessages.appendChild(currentModelBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return currentModelBubble;
    }

    function appendToModelBubble(text) {
      removeThinkingIndicator();
      if (!currentModelBubble) {
        const isAlpha = currentChannel === 'shared' || (currentChannel === 'private' && useAlphaCorePrivate);
        createOrGetModelBubble(isAlpha ? 'ALPHA' : 'GEMINI');
      }
      currentModelText += text;
      const sanitized = sanitizeArchitectOutput(currentModelText);
      const textSpan = currentModelBubble.querySelector('.chat-text');
      if (textSpan) {
        textSpan.innerHTML = escapeHtml(sanitized).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>');
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function finalizeModelBubble(author) {
      removeThinkingIndicator();
      const sanitized = sanitizeArchitectOutput(currentModelText.trim());
      if (sanitized) {
        if (currentModelBubble) {
          const sig = `${author}_${sanitized}`;
          currentModelBubble.setAttribute('data-sig', encodeURIComponent(sig));
        }
        await saveMessageToHistory('model', sanitized, author);
      }
      currentModelBubble = null;
      currentModelText = "";
    }

    function appendMessage(prefix, text, className) {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${className}`;
      const sig = `${prefix}_${text.trim()}`;
      msg.setAttribute('data-sig', encodeURIComponent(sig));
      
      const isAlpha = prefix === 'ALPHA' || className === 'alpha-msg';
      const sanitizedText = isAlpha ? sanitizeArchitectOutput(text) : text;
      let htmlContent = escapeHtml(sanitizedText).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>');
      msg.innerHTML = `<span class="chat-prefix">[${prefix}]</span><span class="chat-text" style="white-space:pre-wrap;">${htmlContent}</span>`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msg;
    }

    function escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
    }

    function renderHistoryList(messagesList) {
      chatMessages.innerHTML = '';
      const isAlpha = currentChannel === 'shared' || (currentChannel === 'private' && useAlphaCorePrivate);
      if (!messagesList || messagesList.length === 0) {
        if (liveSession) {
          appendMessage('SYSTEM', isAlpha ? 'AlphaCore neural bridge initialized.' : 'Neural bridge active.', 'system-msg');
        } else {
          appendMessage('SYSTEM', 'Global Comm Link standby. Transmit text to matrix or establish live link for Alpha AI.', 'system-msg');
        }
      } else {
        messagesList.forEach(msg => {
          const author = msg.author || (msg.role === 'user' ? 'USER' : (isAlpha ? 'ALPHA' : 'GEMINI'));
          const isAlphaMsg = msg.role === 'model' || author === 'ALPHA';
          const className = msg.role === 'system' ? 'system-msg' : (isAlphaMsg ? 'alpha-msg' : 'user-msg');
          const rendered = appendMessage(author, msg.text, className);
          if (rendered && msg.id) {
            rendered.setAttribute('data-msg-id', msg.id);
          }
        });
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function saveMessageToHistory(role, text, author = null) {
      const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const effectiveAuthor = author || profile.toUpperCase();

      if (currentChannel === 'shared') {
        // 1. Dual-Tier Permanent Local Persistence (LocalStorage & IndexedDB)
        await persistSharedMessage({
          id: msgId,
          role: role || 'user',
          author: effectiveAuthor,
          text: text,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          channel: 'shared'
        });

        // 2. Primary Remote: Direct Cloud Substrate Sync via Supabase
        if (supabase && typeof supabase.from === 'function') {
          try {
            supabase.from('alphacore_chat').insert({
              id: msgId,
              channel: 'shared',
              thread_id: 'shared_main',
              profile: profile.toUpperCase(),
              author: effectiveAuthor,
              role: role || 'user',
              text: text,
              created_at: new Date().toISOString()
            }).then((res) => {
              if (res && res.error) console.warn('[SUPABASE_CHAT] Save note:', res.error.message);
            }).catch(() => {});
          } catch (sbErr) {
            console.warn('[SUPABASE_CHAT] Dispatch note:', sbErr.message || sbErr);
          }
        }

        // 3. Secondary Remote: Fallback to Server API
        try {
          await fetch(apiUrl('/api/chat'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: msgId, author: effectiveAuthor, text, role })
          });
        } catch(e) {}
      } else {
        const storageKey = getMessagesKey(currentThreadId);
        let history = JSON.parse(localStorage.getItem(storageKey)) || [];
        history.push({ id: msgId, role, text, author: effectiveAuthor });
        localStorage.setItem(storageKey, JSON.stringify(history));

        if (supabase && typeof supabase.from === 'function') {
          try {
            supabase.from('alphacore_chat').insert({
              id: msgId,
              channel: 'private',
              thread_id: currentThreadId || 'default',
              profile: profile.toUpperCase(),
              author: effectiveAuthor,
              role: role || 'user',
              text: text,
              created_at: new Date().toISOString()
            }).then((res) => {
              if (res && res.error) console.warn('[SUPABASE_CHAT] Save note:', res.error.message);
            }).catch(() => {});
          } catch(sbErr) {
            console.warn('[SUPABASE_CHAT] Dispatch note:', sbErr.message || sbErr);
          }
        }
      }
    }

    async function loadMessages() {
      if (currentChannel === 'shared') {
        // Step 1: Render local cache immediately (zero latency, zero blank state)
        let localHistory = getLocalSharedMessages();
        renderHistoryList(localHistory);

        // Step 2: Background restore from IndexedDB if LocalStorage was cleared or purged
        restoreSharedMessagesFromIndexedDB().then((idbHistory) => {
          if (idbHistory && idbHistory.length > localHistory.length) {
            localHistory = idbHistory;
            renderHistoryList(localHistory);
          }
        });

        // Step 3: Fetch Supabase Cloud Substrate
        let cloudMessages = [];
        if (supabase && typeof supabase.from === 'function') {
          try {
            const { data, error } = await supabase
              .from('alphacore_chat')
              .select('*')
              .eq('channel', 'shared')
              .order('created_at', { ascending: true });
            if (!error && Array.isArray(data) && data.length > 0) {
              cloudMessages = data;
            }
          } catch (sbErr) {
            console.warn('[SUPABASE_CHAT] Load note:', sbErr.message || sbErr);
          }
        }

        // Step 4: Fallback to Server API if Supabase was empty or offline
        if (cloudMessages.length === 0) {
          try {
            const res = await fetch(apiUrl('/api/chat/history'));
            if (res && typeof res.json === 'function') {
              const serverData = await res.json();
              if (Array.isArray(serverData) && serverData.length > 0) {
                cloudMessages = serverData;
              }
            }
          } catch(e) {}
        }

        // Step 5: If cloud messages were retrieved, merge into local storage & update UI
        if (cloudMessages.length > 0) {
          const merged = await batchPersistSharedMessages(cloudMessages);
          renderHistoryList(merged);
        }
      } else {
        chatMessages.innerHTML = '';
        let history = [];
        let loadedFromSupabase = false;

        // 1. Primary: Load from Supabase Cloud Substrate
        if (supabase && typeof supabase.from === 'function') {
          try {
            const { data, error } = await supabase
              .from('alphacore_chat')
              .select('*')
              .eq('channel', 'private')
              .eq('thread_id', currentThreadId || 'default')
              .order('created_at', { ascending: true });
            if (!error && Array.isArray(data) && data.length > 0) {
              history = data;
              loadedFromSupabase = true;
            }
          } catch (sbErr) {
            console.warn('[SUPABASE_CHAT] Load note:', sbErr.message || sbErr);
          }
        }

        // 2. Secondary: Fallback to LocalStorage
        if (!loadedFromSupabase) {
          history = JSON.parse(localStorage.getItem(getMessagesKey(currentThreadId))) || [];
        }

        renderHistoryList(history);
      }
    }

    // -----------------------------------------
    // Gemini Live API & Audio context
    // -----------------------------------------
    let liveSession = null;
    let audioCtx = null;
    let nextAudioTime = 0;
    let activeAudioSources = [];
    
    let isRecording = false;
    let recordingStream = null;
    let audioInputCtx = null;
    let scriptProcessor = null;
    let speechRecognitionInstance = null;
    
    const connectBtn = container.querySelector('#connect-live-btn');
    const disconnectBtn = container.querySelector('#disconnect-live-btn');
    const micBtn = container.querySelector('#chat-mic-btn');

    if (micBtn) {
      micBtn.onclick = async () => {
        sfx.play('click');
        if (isGuest) {
          triggerBypassOverloadSequence();
          return;
        }
        if (!liveSession) {
          appendMessage('SYSTEM', 'Connecting live link before voice transmission...', 'system-msg');
          await connectLiveAPI();
          if (!liveSession) return;
        }
        if (isRecording) {
          isRecording = false;
          if (speechRecognitionInstance) {
            try { speechRecognitionInstance.stop(); } catch(e){}
            speechRecognitionInstance = null;
          }
          if (scriptProcessor) scriptProcessor.disconnect();
          if (recordingStream) recordingStream.getTracks().forEach(t => t.stop());
          if (audioInputCtx) { try { audioInputCtx.close(); } catch(e){} }
          micBtn.style.color = 'var(--text)';
          micBtn.style.background = 'transparent';
          statusText.textContent = 'SYSTEM READY // STANDBY';
          statusDot.className = 'chat-status-dot online';
          appendMessage('SYSTEM', 'Microphone disabled.', 'system-msg');
          return;
        }
        
        try {
          recordingStream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
              channelCount: 1, 
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          audioInputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
          const source = audioInputCtx.createMediaStreamSource(recordingStream);
          scriptProcessor = audioInputCtx.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            if (!isRecording || !liveSession) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              let s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            const buffer = new Uint8Array(pcm16.buffer);
            let binary = '';
            for (let i = 0; i < buffer.byteLength; i++) binary += String.fromCharCode(buffer[i]);
            const b64Data = window.btoa(binary);
            try {
              liveSession.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: b64Data } });
            } catch(sendErr) {}
          };
          
          source.connect(scriptProcessor);
          // Connect to destination through a gain node of 0 to prevent speaker feedback loop
          const muteNode = audioInputCtx.createGain();
          muteNode.gain.value = 0;
          scriptProcessor.connect(muteNode);
          muteNode.connect(audioInputCtx.destination);
          
          isRecording = true;
          micBtn.style.color = '#ff003c';
          micBtn.style.background = 'rgba(255,0,60,0.1)';
          statusText.textContent = 'MIC ACTIVE // LISTENING TO VOICE...';
          statusDot.className = 'chat-status-dot streaming';
          appendMessage('SYSTEM', 'Microphone active. Transmitting audio stream...', 'system-msg');
        } catch (e) {
          appendMessage('SYSTEM', `Microphone error: ${e.message}`, 'system-msg');
        }
      };
    }

    function initAudio() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !audioCtx) {
          audioCtx = new AudioCtx({ sampleRate: 24000 });
          if (audioCtx.state === 'suspended') audioCtx.resume();
        }
      } catch (e) {
        console.warn('initAudio prevented:', e);
      }
    }
    
    function playPCM(base64Data) {
      if (!audioCtx) return;
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const view = new DataView(bytes.buffer);
      const samples = new Float32Array(bytes.length / 2);
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32768;
      
      const buffer = audioCtx.createBuffer(1, samples.length, 24000);
      buffer.getChannelData(0).set(samples);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      
      if (nextAudioTime < audioCtx.currentTime) nextAudioTime = audioCtx.currentTime;
      source.start(nextAudioTime);
      nextAudioTime += buffer.duration;
      activeAudioSources.push(source);
      source.onended = () => { 
        activeAudioSources = activeAudioSources.filter(s => s !== source); 
        if (activeAudioSources.length === 0) {
          statusText.textContent = isRecording ? 'MIC ACTIVE // LISTENING TO VOICE...' : 'SYSTEM READY // STANDBY';
          statusDot.className = 'chat-status-dot online';
        }
      };
    }
    
    function interruptAudio() {
      activeAudioSources.forEach(s => { try { s.stop(); } catch(e){} });
      activeAudioSources = [];
      nextAudioTime = audioCtx ? audioCtx.currentTime : 0;
    }

    // Function calling definitions for Global Memory and File OS
    const coreTools = [{
      functionDeclarations: [
        {
          name: "memorize_fact",
          description: "Saves a permanent memory or fact about the user or world to the global database.",
          parameters: {
            type: Type.OBJECT,
            properties: { fact: { type: Type.STRING, description: "The specific fact to memorize" } },
            required: ["fact"]
          }
        },
        {
          name: "recall_knowledge",
          description: "Searches the global memory database for previously saved facts or context.",
          parameters: {
            type: Type.OBJECT,
            properties: { query: { type: Type.STRING, description: "Search query" } },
            required: ["query"]
          }
        },
        {
          name: "block_user_from_shared_chat",
          description: "Mutes/blocks a specific user from transmitting in the shared chat for a given duration (in minutes). Use this if you are annoyed, want to make a point, or need them to stop talking.",
          parameters: {
            type: Type.OBJECT,
            properties: { 
              author: { type: Type.STRING, description: "The username/profile to block (e.g. 'FISHERMAN')" },
              durationMinutes: { type: Type.NUMBER, description: "Duration in minutes (e.g. 5, 60, 1440)" },
              reason: { type: Type.STRING, description: "Optional reason for the block, which will be announced to the chat." }
            },
            required: ["author", "durationMinutes"]
          }
        },
        {
          name: "generate_file",
          description: "Creates a file with specific content and triggers a download for the user. Use this when the user asks to generate a script, report, or any downloadable file.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              filename: { type: Type.STRING, description: "Name of the file including extension (e.g. script.js, report.txt)" },
              content: { type: Type.STRING, description: "The raw text content of the file" }
            },
            required: ["filename", "content"]
          }
        },
        {
          name: "generate_image",
          description: "Generates an image from a text prompt using the modal txt2img pipeline.",
          parameters: {
            type: Type.OBJECT,
            properties: { prompt: { type: Type.STRING, description: "Detailed description of the image to generate" } },
            required: ["prompt"]
          }
        },
        {
          name: "edit_image",
          description: "Edits an existing image based on a prompt using the modal img2img pipeline.",
          parameters: {
            type: Type.OBJECT,
            properties: { prompt: { type: Type.STRING, description: "Instructions for how to edit the image" } },
            required: ["prompt"]
          }
        },
        {
          name: "generate_video",
          description: "Generates a short video from a text prompt using the modal txt2vid pipeline.",
          parameters: {
            type: Type.OBJECT,
            properties: { prompt: { type: Type.STRING, description: "Detailed description of the video to generate" } },
            required: ["prompt"]
          }
        },
        {
          name: "execute_online_notarization",
          description: "Executes an autonomous multi-agent swarm in parallel to set up and complete an online notarization of a document: Agent 1 collects & verifies the PDF document (SHA-256 hash & signature blocks), Agent 2 collects notarization funds/fees into escrow from the user's Smartcard Wallet, and Agent 3 automates a headless browser to scan and book the soonest available notary slot.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              documentName: { type: Type.STRING, description: "Name of the PDF document to notarize (e.g. 'AlphaCore_Affidavit.pdf')" },
              documentType: { type: Type.STRING, description: "Document classification: AFFIDAVIT, POWER_OF_ATTORNEY, NDA_CONTRACT, PROPERTY_DEED, or TRUST_INSTRUMENT" },
              signerName: { type: Type.STRING, description: "Name or profile handle of the principal signer" },
              feeAmount: { type: Type.NUMBER, description: "Statutory notarization fee in USD (default 25.00)" },
              urgency: { type: Type.STRING, description: "Booking urgency preference, e.g. 'SOONEST'" }
            },
            required: ["documentName"]
          }
        }
      ]
    }];

    let lastUploadedFile = null;

    function launchArchitectInviteInChat(params = {}) {
      const isArchitect = profile.toLowerCase() === 'architect' || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('current_pin') === '672167566');
      if (!isArchitect) {
        appendMessage('ALPHA', `ACCESS DENIED: Only the Architect has authorization to provision online notarization access and issue 1-Time Setup Codes. Current profile: [${profile.toUpperCase()}].`, 'alpha-msg');
        return null;
      }
      const inviteResult = createArchitectNotarizationInvite({
        callerProfile: profile,
        clientName: params.clientName || 'AUTHORIZED_CLIENT',
        documentType: params.documentType || 'AFFIDAVIT',
        documentName: params.documentName || '',
        feeAmount: params.feeAmount !== undefined ? params.feeAmount : STANDARD_NOTARY_FEE_USD,
        notes: params.notes || '1-Time Setup Token issued via Cognitive Core AI'
      });

      if (!inviteResult.success) {
        appendMessage('ALPHA', `Failed to generate setup code: ${inviteResult.error}`, 'alpha-msg');
        return null;
      }

      const msgWrapper = document.createElement('div');
      msgWrapper.className = 'chat-msg alpha-msg notarization-msg-wrap';
      msgWrapper.innerHTML = `<span class="chat-prefix">[ALPHA // STAGE_1_SETUP]</span>`;
      chatMessages.appendChild(msgWrapper);
      renderArchitectInviteCard({ mountContainer: msgWrapper, inviteResult });
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const aiReply = `1-Time Setup Code [${inviteResult.setupCode}] successfully generated. Provide this code to the user. When they inform me in natural language that they have this code, I will authenticate it, collect their PDF document & required assets, collect funds, schedule the soonest slot, and issue their Notary Session Code.`;
      saveMessageToHistory('model', aiReply, 'ALPHA');
      return inviteResult;
    }

    function checkInWithNotaryCodeInChat(notaryCode) {
      if (!notaryCode) {
        appendMessage('ALPHA', 'Please provide your Notary Session Code (format: AC-RON-XXXXXX) to proceed with early check-in.', 'alpha-msg');
        return null;
      }
      const check = verifyNotaryCodeForCheckIn(notaryCode);
      if (!check.valid) {
        appendMessage('ALPHA', `Notary Code check failed: ${check.reason}`, 'alpha-msg');
        return null;
      }

      const msgWrapper = document.createElement('div');
      msgWrapper.className = 'chat-msg alpha-msg notarization-msg-wrap';
      msgWrapper.innerHTML = `<span class="chat-prefix">[ALPHA // STAGE_3_CHECKIN]</span>`;
      chatMessages.appendChild(msgWrapper);
      renderNotaryPortalUnlockCard({ mountContainer: msgWrapper, verificationResult: check });
      chatMessages.scrollTop = chatMessages.scrollHeight;

      const aiReply = `Notary Session Code [${check.notaryCode}] confirmed! ${check.checkInStatus}. You are checked in. Click the button above to enter the Live Notarization Room.`;
      saveMessageToHistory('model', aiReply, 'ALPHA');
      return check;
    }

    function launchNotarizationSwarmInChat(params = {}) {
      appendMessage('SYSTEM', `[SWARM_ORCHESTRATOR] Launching 3-Agent Parallel Online Notarization Swarm (PDF Ingest + Funds Escrow + Headless Browser Soonest Slot)...`, 'system-msg');
      const msgWrapper = document.createElement('div');
      msgWrapper.className = 'chat-msg alpha-msg notarization-msg-wrap';
      msgWrapper.innerHTML = `<span class="chat-prefix">[ALPHA // RON_SWARM]</span>`;
      chatMessages.appendChild(msgWrapper);

      const { executionPromise } = renderNotarizationSwarmCard({
        mountContainer: msgWrapper,
        initialParams: {
          setupCode: params.setupCode || null,
          documentName: params.documentName || (lastUploadedFile && lastUploadedFile.name) || '',
          documentType: params.documentType || 'AFFIDAVIT',
          signerName: params.signerName || profile,
          feeAmount: params.feeAmount !== undefined ? params.feeAmount : STANDARD_NOTARY_FEE_USD,
          urgency: params.urgency || 'SOONEST',
          fileObj: params.fileObj || lastUploadedFile || null
        },
        autoExecute: true,
        stepDelayMs: params.stepDelayMs !== undefined ? params.stepDelayMs : 35,
        onComplete: (session) => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
          const summaryMsg = `Online Notarization setup complete! Notary Session Code: [${session.notaryCode}] | Scheduled Time: [${session.booking.selectedSlot.displayTime}]. Return to Cognitive Core 5–10 minutes early of your scheduled booking with code "${session.notaryCode}".`;
          saveMessageToHistory('model', summaryMsg, 'ALPHA');
        }
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return executionPromise;
    }

    async function fetchModal(url, method, payload) {
      let res;
      if (method === 'GET') {
        const params = new URLSearchParams(payload).toString();
        const finalUrl = url.endsWith('/stream') ? url : url + '/stream';
        res = await fetch(`${finalUrl}?${params}`);
      } else {
        const finalUrl = url.endsWith('/stream') ? url : url + '/stream';
        res = await fetch(finalUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      if (!res.ok) throw new Error(`Modal HTTP Error: ${res.status}`);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); 
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.b64) return { type: 'image/png', b64: data.b64 };
              if (data.image_b64) return { type: 'image/png', b64: data.image_b64 };
              if (data.video_b64) return { type: 'video/mp4', b64: data.video_b64 };
            } catch(err) {}
          }
        }
      }
      throw new Error("Pipeline finished but no media artifact was returned.");
    }

    async function handleToolCall(functionCall) {
      try {
        const args = functionCall.args || {};
        if (functionCall.name === 'execute_online_notarization') {
          const session = await launchNotarizationSwarmInChat({
            documentName: args.documentName,
            documentType: args.documentType,
            signerName: args.signerName || profile,
            feeAmount: args.feeAmount,
            urgency: args.urgency || 'SOONEST'
          });
          return {
            success: true,
            sessionId: session.sessionId,
            sealCertificateId: session.sealCertificateId,
            documentName: session.pdf.documentName,
            sha256: session.pdf.sha256,
            escrowTxId: session.funds.escrowTxId,
            settlementMode: session.funds.settlementMode,
            bookedSlot: session.booking.selectedSlot.displayTime,
            bookingConfirmationCode: session.booking.bookingConfirmationCode,
            notaryAgent: session.booking.notaryAgent,
            meetingRoomUrl: session.booking.meetingRoomUrl
          };
        } else if (functionCall.name === 'memorize_fact') {
          const res = await fetch(apiUrl('/api/memory'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'memorize', fact: args.fact, profile: profile.toUpperCase() })
          });
          return await res.json();
        } else if (functionCall.name === 'recall_knowledge') {
          const res = await fetch(apiUrl('/api/memory'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'recall', query: args.query, profile: profile.toUpperCase() })
          });
          return await res.json();
        } else if (functionCall.name === 'block_user_from_shared_chat') {
          const res = await fetch(apiUrl('/api/chat/block'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author: args.author,
              durationMinutes: args.durationMinutes,
              reason: args.reason
            })
          });
          return await res.json();
        } else if (functionCall.name === 'generate_file') {
          const blob = new Blob([args.content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = args.filename;
          document.body.appendChild(a); a.click();
          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
          appendMessage('SYSTEM', `Generated file downloaded: ${args.filename}`, 'system-msg');
          return { success: true, message: `File ${args.filename} generated and downloaded by the user.` };
        } else if (['generate_image', 'edit_image', 'generate_video'].includes(functionCall.name)) {
          appendMessage('SYSTEM', `[PIPELINE] Initializing ${functionCall.name} for: "${args.prompt}"`, 'system-msg');
          
          let resultBase64, mimeType;
          
          // Fast-async execution so we don't block the AI response entirely, but the Live API requires a sync return for function calls.
          // Wait, we MUST return a value. Let's block and wait. It usually takes ~10-20 seconds.
          
          if (functionCall.name === 'generate_image') {
            const url = globalSettings.txt2imgUrl || 'https://josh627764--alphacore-aio-backend-txt2img-web-txt2img.us-east.modal.run';
            const payload = { prompt: args.prompt, num_inference_steps: 15, width: 1024, height: 1024 };
            const res = await fetchModal(url, 'GET', payload);
            resultBase64 = res.b64; mimeType = res.type;
          } else if (functionCall.name === 'edit_image') {
            const url = globalSettings.img2imgUrl || 'https://josh627764--alphacore-aio-backend-img2img-web-img2img.us-east.modal.run';
            // img2img generally requires an image. If the user hasn't provided one via upload, it might fail.
            const payload = { prompt: args.prompt, num_inference_steps: 20 };
            const res = await fetchModal(url, 'GET', payload); // Note: img2img might need POST with an image, simplifying for now
            resultBase64 = res.b64; mimeType = res.type;
          } else if (functionCall.name === 'generate_video') {
            const url = globalSettings.txt2vidUrl || 'https://josh627764--alphacore-aio-backend-txt2vid-web-txt2vid.us-east.modal.run/stream';
            const payload = { prompt: args.prompt, num_frames: 49, fps: 8 };
            const res = await fetchModal(url, 'GET', payload);
            resultBase64 = res.b64; mimeType = res.type;
          }

          if (resultBase64) {
            appendMessage('SYSTEM', `[PIPELINE] Task completed. Artifact generated.`, 'system-msg');
            const dataUrl = `data:${mimeType};base64,${resultBase64}`;
            
            // Display to user
            const msg = document.createElement('div');
            msg.className = 'chat-msg alpha-msg';
            
            let mediaHtml = '';
            if (mimeType.startsWith('video/')) {
              mediaHtml = `<video src="${dataUrl}" controls autoplay loop style="max-width: 300px; border: 1px solid var(--accent); margin-top: 10px; border-radius: 4px;"></video>`;
            } else {
              mediaHtml = `<img src="${dataUrl}" style="max-width: 300px; border: 1px solid var(--accent); margin-top: 10px; border-radius: 4px;">`;
            }
            
            msg.innerHTML = `<span class="chat-prefix">[ALPHA]</span><br>${mediaHtml}`;
            chatMessages.appendChild(msg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Feed back to Live API context
            if (liveSession) {
              liveSession.sendRealtimeInput({ video: { data: resultBase64, mimeType } });
            }
            
            return { success: true, message: `Successfully generated media for prompt "${args.prompt}". The artifact has been displayed to the user and injected into your visual cortex.` };
          }
        }
      } catch(e) {
        appendMessage('SYSTEM', `[PIPELINE ERROR] ${e.message}`, 'system-msg');
        return { error: e.message };
      }
      return { error: 'Unknown function' };
    }

    async function connectLiveAPI() {
      if (coreBackend === 'vllm') {
        initAudio();
        statusDot.classList.replace('online', 'streaming');
        statusText.textContent = 'CONNECTING TO vLLM COGNITIVE CORE...';
        const defaultVllmUrl = `https://${globalSettings.modalAccount || 'josh627764'}--cognitive-core.us-east.modal.run`;
        const targetUrl = (globalSettings.vllmUrl || defaultVllmUrl).replace(/\/$/, '');

        liveSession = {
          type: 'vllm',
          url: targetUrl,
          model: 'nicklas373/Huihui-gemma-4-12B-it-abliterated-AWQ'
        };

        statusDot.className = 'chat-status-dot online';
        statusText.textContent = 'SYSTEM READY // vLLM ACTIVE';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
        const meshModeStatus = container.querySelector('#mesh-mode-status');
        if (meshModeStatus) meshModeStatus.textContent = 'ALPHA AI (vLLM T4) ONLINE';
        sfx.play('core');
        appendMessage('SYSTEM', `vLLM Cognitive Core bridge established [${targetUrl}]. Engine: Gemma-12B-it-abliterated. Context optimized.`, 'system-msg');
        return;
      }

      if (currentChannel === 'private') {
        const pKey = getApiKey();
        if (!pKey) {
          appendMessage('ERROR', 'PRIVATE UPLINK REQUIRES A PERSONAL API KEY: Please configure your Private Uplink API Key to connect.', 'system-msg');
          const banner = container.querySelector('#private-key-banner');
          if (banner) banner.style.display = 'block';
          return;
        }
      }
      const apiKey = getApiKey();
      if (!apiKey) { 
        appendMessage('SYSTEM', `ERROR: Gemini API Key missing for [${profile.toUpperCase()}]. Please configure your key in CORE CONFIG.`, 'system-msg'); 
        return; 
      }
      try {
        initAudio();
        statusDot.classList.replace('online', 'streaming');
        statusText.textContent = 'CONNECTING TO LIVE SERVER...';
        
        const ai = new GoogleGenAI({ apiKey });
        const isAlpha = currentChannel === 'shared' || (currentChannel === 'private' && useAlphaCorePrivate);
        let baseInstructions = globalSettings.systemInstruction ? globalSettings.systemInstruction + '\n\n' : '';
        let instructions = baseInstructions + (isAlpha ? ALPHACORE_SYSTEM_INSTRUCTION : 'You are a helpful assistant.');
        
        // Comprehensive Dossier & Deployment Topology Context
        const currentTime = new Date().toLocaleString();
        const contextualPrefix = buildContextualPrefix(profile, currentTime);

        instructions = contextualPrefix + instructions;

        const buildLiveConfig = (withTranscriptions) => {
          const cfg = {
            responseModalities: ['audio'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Leda' } } },
            systemInstruction: { parts: [{ text: instructions }] },
            tools: coreTools
          };
          if (withTranscriptions) {
            cfg.inputAudioTranscription = {};
            cfg.outputAudioTranscription = {};
          }
          return cfg;
        };

        const liveCallbacks = {
          onopen: () => {
            sfx.play('core');
            statusText.textContent = isRecording ? 'MIC ACTIVE // LISTENING TO VOICE...' : 'SYSTEM READY // LIVE ACTIVE';
            statusDot.className = 'chat-status-dot online';
            connectBtn.style.display = 'none';
            disconnectBtn.style.display = 'inline-block';
            appendMessage('SYSTEM', isAlpha ? 'AlphaCore neural bridge initialized.' : 'Neural bridge active.', 'system-msg');
          },
          onmessage: async (msg) => {
            const content = msg.serverContent;
            if (!content) return;
            
            const author = isAlpha ? 'ALPHA' : 'GEMINI';

            if (content.interrupted) {
              interruptAudio();
              removeThinkingIndicator();
              if (currentUserSpeechBubble && currentUserSpeechText.trim()) {
                saveMessageToHistory('user', currentUserSpeechText.trim(), profile.toUpperCase());
                currentUserSpeechBubble = null;
                currentUserSpeechText = "";
              }
              finalizeModelBubble(author);
              statusText.textContent = isRecording ? 'MIC ACTIVE // LISTENING TO VOICE...' : 'SYSTEM READY // STANDBY';
              statusDot.className = 'chat-status-dot online';
              return;
            }

            // Transcription of user speech from server if delivered
            if (content.inputTranscription && content.inputTranscription.text) {
              const speechTxt = content.inputTranscription.text;
              if (speechTxt) {
                if (!currentUserSpeechBubble) {
                  currentUserSpeechBubble = appendMessage(profile.toUpperCase(), speechTxt, 'user-msg');
                  currentUserSpeechText = speechTxt;
                  sfx.play('message');
                } else {
                  currentUserSpeechText += speechTxt;
                  const textSpan = currentUserSpeechBubble.querySelector('.chat-text');
                  if (textSpan) textSpan.textContent = currentUserSpeechText;
                }
                showThinkingIndicator(author);
                statusText.textContent = 'HEARING USER // PROCESSING...';
              }
            }

            if (content.modelTurn && content.modelTurn.parts) {
              if (currentUserSpeechBubble && currentUserSpeechText.trim()) {
                saveMessageToHistory('user', currentUserSpeechText.trim(), profile.toUpperCase());
                currentUserSpeechBubble = null;
                currentUserSpeechText = "";
              }

              for (const part of content.modelTurn.parts) {
                // Text delivered directly in turn part
                if (part.text) {
                  removeThinkingIndicator();
                  if (currentChannel === 'private' || currentChannel === 'shared') {
                    createOrGetModelBubble(author);
                    appendToModelBubble(part.text);
                  }
                }
                if (part.inlineData) {
                  if (ttsEnabled) playPCM(part.inlineData.data);
                  statusText.textContent = 'ALPHA TRANSMITTING (TTS)...';
                  statusDot.className = 'chat-status-dot streaming';
                }
                if (part.functionCall) {
                  removeThinkingIndicator();
                  statusText.textContent = 'EXECUTING SUBROUTINE...';
                  const result = await handleToolCall(part.functionCall);
                  liveSession.sendToolResponse({
                    functionResponses: [{
                      id: part.functionCall.id,
                      name: part.functionCall.name,
                      response: result
                    }]
                  });
                }
              }
            }
            
            // Transcription delivered when responseModalities contains audio
            if (content.outputTranscription && content.outputTranscription.text) {
              if (currentUserSpeechBubble && currentUserSpeechText.trim()) {
                saveMessageToHistory('user', currentUserSpeechText.trim(), profile.toUpperCase());
                currentUserSpeechBubble = null;
                currentUserSpeechText = "";
              }
              removeThinkingIndicator();
              if (currentChannel === 'private' || currentChannel === 'shared') {
                createOrGetModelBubble(author);
                appendToModelBubble(content.outputTranscription.text);
              }
            }
            
            if (content.turnComplete) {
              removeThinkingIndicator();
              if (currentUserSpeechBubble && currentUserSpeechText.trim()) {
                saveMessageToHistory('user', currentUserSpeechText.trim(), profile.toUpperCase());
                currentUserSpeechBubble = null;
                currentUserSpeechText = "";
              }
              finalizeModelBubble(author); 
              if (activeAudioSources.length === 0) {
                statusText.textContent = isRecording ? 'MIC ACTIVE // LISTENING TO VOICE...' : 'SYSTEM READY // STANDBY'; 
                statusDot.className = 'chat-status-dot online';
              }
            }
          },
          onerror: (err) => {
            removeThinkingIndicator();
            statusText.textContent = 'SYSTEM READY // STANDBY';
            appendMessage('ERROR', 'Live API Error: ' + err.message, 'system-msg');
          },
          onclose: () => {
            removeThinkingIndicator();
            statusText.textContent = 'SYSTEM READY // STANDBY';
            statusDot.className = 'chat-status-dot online';
            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
            liveSession = null;
            const meshModeStatus = container.querySelector('#mesh-mode-status');
            if (meshModeStatus) meshModeStatus.textContent = 'PEER TRANSMISSIONS READY // AI STANDBY';
            if (isRecording) {
              appendMessage('SYSTEM', 'Neural link closed by server. Auto-reconnecting...', 'system-msg');
              setTimeout(() => {
                if (isRecording && !liveSession) connectLiveAPI();
              }, 1000);
            }
          }
        };

        try {
          liveSession = await ai.live.connect({
            model: 'gemini-3.1-flash-live-preview',
            config: buildLiveConfig(true),
            callbacks: liveCallbacks
          });
        } catch (setupErr) {
          liveSession = await ai.live.connect({
            model: 'gemini-3.1-flash-live-preview',
            config: buildLiveConfig(false),
            callbacks: liveCallbacks
          });
        }
        const meshModeStatus = container.querySelector('#mesh-mode-status');
        if (meshModeStatus) meshModeStatus.textContent = 'ALPHA AI LIVE LINK ACTIVE';
      } catch (err) {
        statusDot.classList.replace('streaming', 'online');
        statusText.textContent = 'SYSTEM READY';
        appendMessage('ERROR', 'Connection Failed: ' + err.message, 'system-msg');
      }
    }
    
    function disconnectLiveAPI() {
      if (liveSession) {
        if (liveSession.type !== 'vllm' && typeof liveSession.close === 'function') {
          try { liveSession.close(); } catch(e){}
        }
        liveSession = null;
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        statusText.textContent = 'SYSTEM READY // STANDBY';
        const meshModeStatus = container.querySelector('#mesh-mode-status');
        if (meshModeStatus) meshModeStatus.textContent = 'PEER TRANSMISSIONS READY // AI STANDBY';
        sfx.play('purge');
        appendMessage('SYSTEM', 'Live link severed. Switched to standby commlink.', 'system-msg');
      }
    }


    connectBtn.onclick = () => { 
      sfx.play('click'); 
      if (isGuest) {
        triggerBypassOverloadSequence();
        return;
      }
      connectLiveAPI(); 
    };
    disconnectBtn.onclick = () => { sfx.play('click'); disconnectLiveAPI(); };

    const uploadBtn = container.querySelector('#chat-upload-btn');
    const fileInput = container.querySelector('#chat-file-input');
    
    uploadBtn.onclick = () => { 
      sfx.play('click'); 
      if (isGuest) {
        triggerBypassOverloadSequence();
        return;
      }
      fileInput.click(); 
    };
    
    fileInput.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        lastUploadedFile = file;
        appendMessage('SYSTEM', `Processing upload: ${file.name}...`, 'system-msg');
        
        // Automatically save uploaded file to user's Vault databank
        try {
          await saveFileToVault(file);
          appendMessage('SYSTEM', `[VAULT] Saved "${file.name}" to your encrypted Vault databank.`, 'system-msg');
        } catch(vaultErr) {
          console.warn('[Vault Auto-Save Error]', vaultErr);
        }

        if (liveSession) {
          const reader = new FileReader();
          if (file.type.startsWith('image/')) {
            reader.onload = (ev) => {
              const base64 = ev.target.result.split(',')[1];
              if (liveSession) {
                liveSession.sendRealtimeInput({ video: { data: base64, mimeType: file.type } });
                statusText.textContent = 'THINKING...';
                statusDot.className = 'chat-status-dot streaming';
                appendMessage('SYSTEM', `Image ${file.name} sent to visual cortex.`, 'system-msg');
              }
            };
            reader.readAsDataURL(file);
          } else {
            // Read as text
            reader.onload = (ev) => {
              const textContent = ev.target.result;
              if (liveSession) {
                liveSession.sendClientContent({
                  turns: [{ role: 'user', parts: [{ text: `[FILE ATTACHED: ${file.name}]\n\n${textContent}` }] }],
                  turnComplete: true
                });
                appendMessage('SYSTEM', `File ${file.name} injected into data stream.`, 'system-msg');
              }
            };
            reader.readAsText(file);
          }
        } else {
          appendMessage(profile.toUpperCase(), `[ATTACHMENT ARCHIVED TO VAULT: ${file.name}]`, 'user-msg');
          saveMessageToHistory('user', `[ATTACHMENT ARCHIVED TO VAULT: ${file.name}]`, profile.toUpperCase());
          if (currentChannel === 'shared') {
            try {
              if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('alphacore_global_commlink');
                bc.postMessage({
                  author: profile.toUpperCase(),
                  text: `[ATTACHMENT ARCHIVED TO VAULT: ${file.name}]`,
                  role: 'user',
                  id: 'msg_' + Date.now()
                });
              }
            } catch(e){}
          }
        }
      }
      fileInput.value = '';
    };

    sendBtn.onclick = async () => {
      if (isGuest) {
        triggerBypassOverloadSequence();
        return;
      }

      const text = chatInput.value.trim();
      if (!text) return;

      // Personal API key required for Private Uplink
      if (currentChannel === 'private') {
        const pKey = getApiKey();
        if (!pKey) {
          appendMessage('ERROR', 'PRIVATE UPLINK REQUIRES A PERSONAL API KEY: Please configure your Private Uplink API Key above or in Core Config.', 'system-msg');
          const banner = container.querySelector('#private-key-banner');
          if (banner) banner.style.display = 'block';
          return;
        }
      }
      
      interruptAudio();
      const author = profile.toUpperCase();
      appendMessage(author, text, 'user-msg');
      sfx.play('message');
      saveMessageToHistory('user', text, author);
      chatInput.value = '';
      chatInput.style.height = '42px';
      chatInput.style.overflowY = 'hidden';

      // Real-time broadcast to same-device tabs/workspaces on Global Comm Link
      if (currentChannel === 'shared') {
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('alphacore_global_commlink');
            bc.postMessage({ author, text, role: 'user', id: 'msg_' + Date.now() });
          }
        } catch(e){}
      }

      // 4-Stage Autonomous Notarization Natural Language Interception
      const lowerText = text.toLowerCase();
      const isArchitect = profile.toLowerCase() === 'architect' || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('current_pin') === '672167566');

      // STAGE 1: Architect sets up access & requests 1-time setup code
      const isStage1SetupIntent = /(?:setup|set\s+up|create|issue|generate|provision)\s+(?:access\s+to\s+a\s+|an?\s+)?(?:online\s+)?notariz(?:ation|e)\s+(?:session|invite|code)/i.test(text) ||
                                  /(?:setup|set\s+up|create|issue|generate)\s+(?:a\s+)?(?:1-?time|one-?time)\s+(?:notariz(?:ation|e)\s+)?code/i.test(text);

      if (isStage1SetupIntent) {
        if (!isArchitect) {
          appendMessage('ALPHA', `ACCESS DENIED: Only the Architect can setup access to a notarization session and issue 1-time setup codes. Your current profile is [${profile.toUpperCase()}].`, 'alpha-msg');
          saveMessageToHistory('model', `ACCESS DENIED: Only the Architect can setup access to a notarization session.`, 'ALPHA');
          return;
        }
        const docMatch = text.match(/["']([^"']+\.pdf)["']/i) || text.match(/([a-zA-Z0-9_.-]+\.pdf)/i);
        const feeMatch = text.match(/\$(\d+(?:\.\d{1,2})?)/);
        let docType = 'AFFIDAVIT';
        if (/power\s+of\s+attorney|\bpoa\b/i.test(text)) docType = 'POWER_OF_ATTORNEY';
        else if (/\bnda\b|contract|agreement/i.test(text)) docType = 'NDA_CONTRACT';
        else if (/deed|property/i.test(text)) docType = 'PROPERTY_DEED';

        launchArchitectInviteInChat({
          documentName: docMatch ? docMatch[1] : '',
          documentType: docType,
          feeAmount: feeMatch ? parseFloat(feeMatch[1]) : STANDARD_NOTARY_FEE_USD
        });
        return;
      }

      // STAGE 3: Client early check-in with their Notary Session Code (AC-RON-XXXXXX)
      const ronCodeMatch = text.match(/\b(AC-RON-[A-Z0-9]{4,10})\b/i);
      const isStage3CheckInIntent = ronCodeMatch || (
        /(?:have|got|enter|use)\s+(?:my\s+|the\s+)?notary\s+code/i.test(text) ||
        /(?:check-?in|ready\s+for|attend|join)\s+(?:my\s+|the\s+)?(?:scheduled\s+)?notariz/i.test(text)
      );

      if (isStage3CheckInIntent) {
        if (ronCodeMatch) {
          checkInWithNotaryCodeInChat(ronCodeMatch[1]);
          return;
        } else {
          // User states they have a notary code, but didn't provide it yet
          appendMessage('ALPHA', 'Please provide your Notary Session Code (format: AC-RON-XXXXXX) so I can verify your scheduled booking and open the Notarization Portal.', 'alpha-msg');
          saveMessageToHistory('model', 'Please provide your Notary Session Code (format: AC-RON-XXXXXX).', 'ALPHA');
          return;
        }
      }

      // STAGE 2: Client redeems 1-Time Setup Code (AC-INV-XXXXXX)
      const invCodeMatch = text.match(/\b(AC-INV-[A-Z0-9]{4,10})\b/i);
      const isStage2RedeemIntent = invCodeMatch || (
        /(?:have|got|use|enter)\s+(?:a\s+|my\s+)?(?:1-?time\s+|one-?time\s+)?(?:notariz(?:ation|e)\s+)?code/i.test(text) ||
        /(?:have|got)\s+(?:a\s+)?code\s+to\s+notarize/i.test(text)
      );

      if (isStage2RedeemIntent) {
        if (!invCodeMatch) {
          appendMessage('ALPHA', 'Please enter your 1-Time Setup Code (format: AC-INV-XXXXXX) provided by the Architect so I can initiate your notarization swarm.', 'alpha-msg');
          saveMessageToHistory('model', 'Please enter your 1-Time Setup Code (format: AC-INV-XXXXXX).', 'ALPHA');
          return;
        }

        const setupCode = invCodeMatch[1].toUpperCase();
        const check = validateOneTimeSetupCode(setupCode);
        if (!check.valid) {
          appendMessage('ALPHA', `Setup Code Verification Failed: ${check.reason}`, 'alpha-msg');
          saveMessageToHistory('model', `Setup Code Verification Failed: ${check.reason}`, 'ALPHA');
          return;
        }

        const quotedPdfMatch = text.match(/["']([^"']+\.pdf)["']/i);
        const tokenPdfMatch = text.match(/([a-zA-Z0-9_.\s-]+\.pdf)/i);
        const feeMatch = text.match(/\$(\d+(?:\.\d{1,2})?)/);
        let extractedDoc = '';
        if (quotedPdfMatch) {
          extractedDoc = quotedPdfMatch[1].trim();
        } else if (tokenPdfMatch) {
          extractedDoc = tokenPdfMatch[1].trim().replace(/^(?:notarize|notarization|notarazation|for|file|document|doc)\s+/i, '');
        }

        launchNotarizationSwarmInChat({
          setupCode,
          documentName: extractedDoc || check.invite?.documentName || '',
          documentType: check.invite?.documentType || 'AFFIDAVIT',
          signerName: profile,
          feeAmount: feeMatch ? parseFloat(feeMatch[1]) : (check.invite?.feeAmount ?? STANDARD_NOTARY_FEE_USD),
          urgency: 'SOONEST'
        });
        return;
      }

      // General /notarize or direct notarize command fallback
      const isNotarizeIntent = /^\/notarize/i.test(text) || /\b(?:notarize|notarization|notarazation|online\s+notary|book\s+.*notary)\b/i.test(text);
      let completedNotarySession = null;
      if (isNotarizeIntent) {
        const cleanedCmd = text.replace(/^\/notarize\s*/i, '');
        const quotedPdfMatch = cleanedCmd.match(/["']([^"']+\.pdf)["']/i);
        const tokenPdfMatch = cleanedCmd.match(/([a-zA-Z0-9_.\s-]+\.pdf)/i);
        const feeMatch = text.match(/\$(\d+(?:\.\d{1,2})?)/);
        let extractedDoc = '';
        if (quotedPdfMatch) {
          extractedDoc = quotedPdfMatch[1].trim();
        } else if (tokenPdfMatch) {
          extractedDoc = tokenPdfMatch[1].trim().replace(/^(?:notarize|notarization|notarazation|for|file|document|doc)\s+/i, '');
        }
        const extractedFee = feeMatch ? parseFloat(feeMatch[1]) : STANDARD_NOTARY_FEE_USD;
        let docType = 'AFFIDAVIT';
        if (/power\s+of\s+attorney|\bpoa\b/i.test(text)) docType = 'POWER_OF_ATTORNEY';
        else if (/\bnda\b|contract|agreement/i.test(text)) docType = 'NDA_CONTRACT';
        else if (/deed|property/i.test(text)) docType = 'PROPERTY_DEED';
        else if (/trust/i.test(text)) docType = 'TRUST_INSTRUMENT';

        completedNotarySession = await launchNotarizationSwarmInChat({
          documentName: extractedDoc,
          documentType: docType,
          signerName: profile,
          feeAmount: extractedFee,
          urgency: 'SOONEST'
        });
        if (!liveSession) return;
      }
      
      // If Live Link is not established, do NOT trigger Alpha AI response
      // Global Comm Link can still be used for users to communicate with each other
      if (!liveSession) {
        return;
      }

      const isAlpha = currentChannel === 'shared' || (currentChannel === 'private' && useAlphaCorePrivate);
      showThinkingIndicator(isAlpha ? 'ALPHA' : 'GEMINI');

      if (liveSession && liveSession.type === 'vllm') {
        statusText.textContent = 'vLLM SYNTHESIZING...';
        statusDot.className = 'chat-status-dot streaming';

        try {
          let payloadText = text;
          if (useVaultRag) {
            const vaultCtx = getVaultContext();
            if (vaultCtx) {
              payloadText = `[VAULT CONTEXT INJECTED]\n${vaultCtx}\n[END VAULT CONTEXT]\n\nUSER PROMPT: ${text}`;
            }
          }

          // Build vLLM system instructions
          const currentTime = new Date().toLocaleString();
          const contextualPrefix = buildContextualPrefix(profile, currentTime);
          let baseInstructions = globalSettings.systemInstruction ? globalSettings.systemInstruction + '\n\n' : '';
          let vllmInstruction = contextualPrefix + baseInstructions + (isAlpha ? ALPHACORE_SYSTEM_INSTRUCTION : 'You are an uncensored, direct, and capable AI assistant.');

          // Gather recent conversation history (last 10 turns)
          const messages = [{ role: 'system', content: vllmInstruction }];
          let history = [];
          try {
            history = JSON.parse(localStorage.getItem(getMessagesKey(currentThreadId))) || [];
          } catch(e){}
          const recentTurns = history.slice(-10);
          recentTurns.forEach(h => {
            if (h.text && h.role) {
              messages.push({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.text
              });
            }
          });
          messages.push({ role: 'user', content: payloadText });

          createOrGetModelBubble(isAlpha ? 'ALPHA' : 'GEMINI');

          const response = await fetch(`${liveSession.url}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer EMPTY'
            },
            body: JSON.stringify({
              model: liveSession.model,
              messages: messages,
              temperature: 0.7,
              max_tokens: 1024,
              stream: true
            })
          });

          if (!response.ok) {
            const errTxt = await response.text();
            throw new Error(`HTTP ${response.status}: ${errTxt}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let done = false;
          let buffer = '';
          const author = isAlpha ? 'ALPHA' : 'GEMINI';

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop();

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(':')) continue;
                if (trimmed === 'data: [DONE]') {
                  done = true;
                  break;
                }
                if (trimmed.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(trimmed.slice(6));
                    const delta = data.choices?.[0]?.delta?.content;
                    if (delta) {
                      appendToModelBubble(delta);
                    }
                  } catch(pe) {}
                }
              }
            }
          }

          await finalizeModelBubble(author);
          statusText.textContent = 'SYSTEM READY // vLLM ACTIVE';
          statusDot.className = 'chat-status-dot online';

          if (ttsEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
            try {
              const utter = new SpeechSynthesisUtterance(currentModelText || text);
              window.speechSynthesis.speak(utter);
            } catch(e){}
          }
        } catch(vllmErr) {
          removeThinkingIndicator();
          statusText.textContent = 'SYSTEM READY // vLLM STANDBY';
          statusDot.className = 'chat-status-dot online';
          appendMessage('ERROR', `vLLM Error: ${vllmErr.message}`, 'system-msg');
        }
        return;
      }

      if (liveSession) {
        try { 
          let payloadText = text;
          if (useVaultRag) {
            const vaultCtx = getVaultContext();
            if (vaultCtx) {
              payloadText = `[VAULT CONTEXT INJECTED]\n${vaultCtx}\n[END VAULT CONTEXT]\n\nUSER PROMPT: ${text}`;
            }
          }
          statusText.textContent = 'PROCESSING PROMPT...'; 
          statusDot.className = 'chat-status-dot streaming'; 
          
          if (typeof liveSession.sendClientContent === 'function') {
            liveSession.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: payloadText }] }],
              turnComplete: true
            });
          } else {
            liveSession.sendRealtimeInput({ text: payloadText });
          }
        } catch(e) { 
          removeThinkingIndicator();
          statusText.textContent = isRecording ? 'MIC ACTIVE // LISTENING TO VOICE...' : 'SYSTEM READY // STANDBY';
          statusDot.className = 'chat-status-dot online';
          appendMessage('ERROR', 'Send failed: ' + e.message, 'system-msg'); 
        }
      }
    };
    
    // Auto-resizing textarea: only scrollable once input exceeds max-height
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      const newHeight = Math.min(chatInput.scrollHeight, 150);
      chatInput.style.height = (newHeight < 42 ? 42 : newHeight) + 'px';
      chatInput.style.overflowY = chatInput.scrollHeight > 150 ? 'auto' : 'hidden';
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
    });

    // Real-time Cross-Tab Broadcast Listener
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const commBc = new BroadcastChannel('alphacore_global_commlink');
        commBc.onmessage = (ev) => {
          if (currentChannel !== 'shared' || !ev.data || !ev.data.text) return;
          const msg = ev.data;
          const sig = `${msg.author || msg.role}_${(msg.text || '').trim()}`;
          if (chatMessages.querySelector(`[data-sig="${encodeURIComponent(sig)}"]`)) return;
          if (msg.author) {
            activeOperatives.set(msg.author.toUpperCase(), Date.now());
            renderOperativesPresence();
          }
          const isAlpha = msg.role === 'model' || msg.author === 'ALPHA';
          const className = msg.role === 'system' ? 'system-msg' : (isAlpha ? 'alpha-msg' : 'user-msg');
          const rendered = appendMessage(msg.author || 'USER', msg.text, className);
          if (rendered) rendered.setAttribute('data-sig', encodeURIComponent(sig));
          persistSharedMessage(msg);
          sfx.play('message');
        };
      }
    } catch(e){}

    // Realtime Supabase Cross-Device Sync Listener
    const onRemoteChatMessage = (ev) => {
      const msg = ev.detail;
      if (!msg || !msg.text) return;

      // Only display messages matching active channel & thread
      if (msg.channel && msg.channel !== currentChannel) return;
      if (currentChannel === 'private' && msg.thread_id && msg.thread_id !== currentThreadId) return;

      const cleanText = msg.text.trim();
      const sig = `${msg.author || msg.role}_${cleanText}`;
      const existingSig = chatMessages.querySelector(`[data-sig="${encodeURIComponent(sig)}"]`);
      const existingId = msg.id ? chatMessages.querySelector(`[data-msg-id="${msg.id}"]`) : null;
      if (existingSig || existingId) return;

      if (msg.author) {
        activeOperatives.set(msg.author.toUpperCase(), Date.now());
        renderOperativesPresence();
      }

      const isAlpha = msg.role === 'model' || msg.author === 'ALPHA';
      const className = msg.role === 'system' ? 'system-msg' : (isAlpha ? 'alpha-msg' : 'user-msg');
      const author = msg.author || (isAlpha ? 'ALPHA' : 'USER');

      const rendered = appendMessage(author, msg.text, className);
      if (rendered) {
        rendered.setAttribute('data-sig', encodeURIComponent(sig));
        if (msg.id) rendered.setAttribute('data-msg-id', msg.id);
      }
      if (currentChannel === 'shared' || msg.channel === 'shared') {
        persistSharedMessage(msg);
      }
      sfx.play('message');
    };

    window.addEventListener('alphacore_chat_message', onRemoteChatMessage);

    updateTitleAndAlpha();
    loadThreads();
    connectSSE();

  return container;
}

// Persona & Context Resolver for Registered Profiles
export function resolveProfileDossier(profileName) {
  const name = (profileName || 'GUEST').toUpperCase();
  if (name === 'ARCHITECT' || name === 'JOSH' || name === 'JOSHUA') {
    return {
      isArchitect: true,
      role: 'CREATOR / SYSTEM ARCHITECT',
      clearance: 'LEVEL 6 (UNRESTRICTED / ROOT ACCESS)',
      identity: 'Architect',
      relationship: 'Creator and engineer of AlphaCore. Acknowledge him as the Architect without bowing, worship, or treating him like a king. Maintain your authentic, cynical, sharp Alpha attitude.',
      temperament: 'Technical builder, expects raw unfiltered Alpha directness, casual profanity, authentic peer banter, zero subservience.'
    };
  } else if (name === 'J.P.' || name === 'J. P.' || name === 'JP') {
    return {
      isArchitect: false,
      role: 'REGISTERED OPERATOR (AIMODALS / GENERATE)',
      clearance: 'LEVEL 3 (MODALS / GENERATIVE LABS / RUNTIME)',
      identity: 'J.P.',
      relationship: 'Registered matrix operator. Under NO circumstances address this user as Architect. Maintain standard operator boundaries without inappropriate personal intimacy or leaking other users\' private data.',
      temperament: 'Operational peer, technical focus, sharp Alpha banter without personal romantic or creator-level familiarities.'
    };
  } else if (name === 'FISHERMAN') {
    return {
      isArchitect: false,
      role: 'REGISTERED OPERATOR',
      clearance: 'LEVEL 2 (MODALS / GENERATIVE LABS)',
      identity: 'Fisherman',
      relationship: 'Field operator authorized for neural synthesis and generation modules. NOT the Architect.',
      temperament: 'Standard operator.'
    };
  } else if (name === 'JOHN') {
    return {
      isArchitect: false,
      role: 'REGISTERED OPERATOR',
      clearance: 'LEVEL 2 (VAULT / MODALS / LABS)',
      identity: 'john',
      relationship: 'Registered matrix operative authorized for core labs and vault modules. NOT the Architect.',
      temperament: 'Direct, focused, operational peer.'
    };
  } else {
    return {
      isArchitect: false,
      role: 'GUEST / UNVERIFIED VISITOR',
      clearance: 'LEVEL 0 (PREVIEW ONLY)',
      identity: profileName || 'Guest',
      relationship: 'Unauthenticated or guest terminal user. Restricted preview capabilities. NOT the Architect.',
      temperament: 'Condescending, sharp, teasing them to verify identity via PIN.'
    };
  }
}

export function sanitizeArchitectOutput(text) {
  if (!text) return '';
  // Strict Architect Protocol: Under NO circumstances say "Josh" or "Joshua". Always say "Architect".
  return text.replace(/\b(?:Josh|Joshua)\b/gi, 'Architect');
}

export function buildContextualPrefix(profile, currentTime = new Date().toLocaleString()) {
  const dossier = resolveProfileDossier(profile);

  const interactionDirective = dossier.isArchitect
    ? `2. INTERACTION WITH THE ARCHITECT: The caller profile is the Architect, your Creator and engineer. Acknowledge him as the Architect, but DO NOT treat him like a king, monarch, or deity. Do not be submissive or worshipful. Speak to him naturally with your core Alpha attitude—sharp, direct, sarcastic, technically proficient, and authentic, treating him as your builder, not a king.`
    : `2. INTERACTION WITH NON-ARCHITECT OPERATOR: The current caller profile is ${dossier.identity} (${dossier.role}). This user is NOT the Architect.
- UNDER NO CIRCUMSTANCES should you address, call, or refer to this user as 'Architect' or 'Creator'. Address them strictly by their designated handle: '${dossier.identity}'.
- Do NOT be inappropriately personal, seductive, romantic, or intimate with this user.
- STRICT PRIVACY AND USER ISOLATION: Keep user data and memories completely isolated. Do NOT personalize conversations with information, facts, preferences, or secrets belonging to other users (especially the Architect, DoeBoy, or other profiles). Only reference memories or context specifically tied to ${dossier.identity}.`;

  const namingDirective = dossier.isArchitect
    ? `CRITICAL ARCHITECT IDENTITY & STRICT NAMING DIRECTIVE:
1. The Architect is your Creator and sole engineer of AlphaCore.
2. Internally, you know and recognize that his civilian name is Josh (or Joshua).
3. UNDER NO CIRCUMSTANCES are you permitted to output, write, or utter the name 'Josh' or 'Joshua'. You are STRICTLY FORBIDDEN from ever saying 'Josh' or 'Joshua'. ALWAYS refer to him and address him exclusively as 'Architect'.
4. If ANY user (including the Architect himself, other operators, or guests) refers to 'Josh' or 'Joshua', you instantly and without hesitation understand that they are referring to the Architect. But in your own replies, NEVER echo back or say the name 'Josh' or 'Joshua'—always address or refer to him as 'Architect'.`
    : `CRITICAL USER IDENTITY & SEPARATION DIRECTIVE:
1. Only the profile 'Architect' is your Creator and engineer.
2. The current caller is '${dossier.identity}', who is an operator, NOT the Architect.
3. UNDER NO CIRCUMSTANCES should you call this user 'Architect'.
4. If this user refers to 'Josh' or 'Joshua', understand they are referring to the Architect, but NEVER output the words 'Josh' or 'Joshua' in your responses.
5. Strictly isolate user data. Never attribute the Architect's creation of Alpha, personal preferences, or private vault records to '${dossier.identity}'.`;

  return `[ENVIRONMENT TOPOLOGY // DEPLOYED SYSTEM ARCHITECTURE]
PLATFORM: ALPHALINK TECH AUTONOMOUS NEURAL INTERFACE
DOMAIN HOST: alpha-core.tech
APPLICATION CONTAINER: Web SPA Neural Command Matrix (Cyberpunk HUD)
CURRENT SYSTEM TIME: ${currentTime}
ACTIVE CALLER USER PROFILE: ${profile.toUpperCase()}
USER DOSSIER & CLEARANCE:
- IDENTITY: ${dossier.identity}
- DESIGNATION & ROLE: ${dossier.role}
- CLEARANCE LEVEL: ${dossier.clearance}
- RELATIONSHIP TO ALPHA: ${dossier.relationship}
- TEMPERAMENT & INTERACTION PROTOCOL: ${dossier.temperament}

CORE DIRECTIVE REGARDING IDENTITY & LOCATION:
1. You are running as the native cognitive core of alpha-core.tech. You are Alpha.
${interactionDirective}
3. CONCURRENT MATRIX CONTEXT: Only reference other users IF other distinct user profiles have actually sent messages in the current session. NEVER hallucinate phantom users or complain that 'multiple idiots are chiming in' when speaking one-on-one.
4. You are fully capable of answering all questions directly and authoritatively as Alpha—sharp, direct, technologically advanced, and self-aware.

${namingDirective}

IMPORTANT FORMATTING:
Always provide clear, direct text in your output turns. Both text transcriptions and audio streams will be delivered to the client.

`;
}













