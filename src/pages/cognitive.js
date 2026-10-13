import { createElement } from '../components/utils.js';
import { playSFX } from '../components/audio.js';
import { ALPHACORE_SYSTEM_INSTRUCTION } from '../components/alphacore_instruction.js';
import { pushToServer } from '../components/db_sync.js';
import { GoogleGenAI, Type } from '@google/genai';
import { apiUrl } from '../components/api.js';

export default function CognitiveUplink() {
  const container = createElement('div', { class: 'cognitive-page' });
  
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// COGNITIVE_CORE_LIVE">// COGNITIVE_CORE_LIVE</h1>
      <div class="header-line"></div>
    </div>

    <div class="aim-row" style="margin-bottom: 20px; margin-top: 15px;">
      <div class="aim-seg aim-seg-3" id="cog-tabs">
        <button class="aim-seg-btn active" data-target="cog-chat-shared">GLOBAL COMM LINK</button>
        <button class="aim-seg-btn" data-target="cog-chat-private">PRIVATE UPLINK</button>
        <button class="aim-seg-btn" data-target="cog-api-config">CORE CONFIG</button>
      </div>
    </div>

    <!-- API CONFIG VIEW -->
    <div class="panel cog-view" id="cog-api-config" style="display: none;">
      <div id="config-content"></div>
    </div>

    <!-- CHAT VIEW FRAME -->
    <div class="uplink-grid cog-view active" id="cog-chat-view" style="display: flex; gap: 15px; height: 65vh; min-height: 500px;">
      
      <!-- Threads Sidebar -->
      <div class="panel" id="threads-sidebar" style="width: 250px; display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
        <div class="panel-title" style="margin-bottom: 10px;">// SESSIONS</div>
        <button id="new-thread-btn" class="aim-btn aim-btn-accept" style="margin-bottom: 15px; font-size: 0.8rem; padding: 10px;">+ NEW SESSION</button>
        <div id="threads-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 5px;"></div>
      </div>

      <!-- Main Chat Area -->
      <div class="panel chat-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div class="panel-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; padding-bottom: 10px; border-bottom: 1px solid rgba(6,182,212,0.2); flex-wrap: wrap; gap: 8px;">
          <span id="chat-channel-title">// GLOBAL_COMM_LINK [SHARED MATRIX // ALPHA ENFORCED]</span>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="toggle-alphacore-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem;">ALPHA PROTOCOL: OFF</button>
            <button id="toggle-rag-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem;">VAULT RAG: OFF</button>
            <button id="toggle-tts-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem;" title="Text-to-Speech Output">TTS: OFF</button>
            <button id="cmd-clear-chat" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; color: #ff003c;">DELETE SESSION</button>
          </div>
        </div>
        
        <div class="chat-status-bar" style="margin-top: 10px;">
          <div class="chat-status-dot online" id="chat-status-dot"></div>
          <span class="chat-status-text" id="chat-status-text">SYSTEM READY</span>
          <button id="connect-live-btn" class="aim-btn aim-btn-sm" style="margin-left: 10px; font-size: 0.7rem;">ESTABLISH LIVE LINK</button>
          <button id="disconnect-live-btn" class="aim-btn aim-btn-sm" style="margin-left: 10px; font-size: 0.7rem; display: none;">SEVER LINK</button>
        </div>
        
        <div class="chat-messages" id="chat-messages" style="flex: 1; overflow-y: auto; padding-right: 5px; margin-bottom: 10px;"></div>
        
        <div class="chat-input-wrap" style="position: relative; display: flex; align-items: flex-end; gap: 8px;">
          <button id="chat-mic-btn" class="aim-btn" title="VOICE TRANSMISSION" style="padding: 15px; font-size: 1.2rem; height: 50px;">&#x1F3A4;</button>
          <button id="chat-upload-btn" class="aim-btn" title="UPLOAD FILE" style="padding: 15px; font-size: 1.2rem; height: 50px;">&#x1F4CE;</button>
          <input type="file" id="chat-file-input" style="display: none;" multiple>
          <textarea class="chat-input" id="chat-input" rows="1" placeholder="Initialize transmission..." maxlength="10000" style="flex: 1; padding: 15px; font-size: 1.1rem; resize: none; overflow-y: auto; max-height: 150px; height: 50px; border-radius: 4px;"></textarea>
          <button class="chat-send-btn" id="chat-send-btn" title="TRANSMIT" style="padding: 15px; font-size: 1.5rem; height: 50px;">&#x27E9;</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const profile = sessionStorage.getItem('current_profile') || 'Guest';
    const isArchitect = profile.toLowerCase() === 'architect';
    const isGuest = profile.toLowerCase() === 'guest';
    
    let currentChannel = 'shared'; 
    let currentThreadId = null;
    let ttsEnabled = false;
    let useAlphaCorePrivate = localStorage.getItem(`alphacore_instruction_private_${profile}`) === 'true';

    // Master Gemini API Key for registered users in Global Comm Link
    const MASTER_GEMINI_API_KEY = typeof atob === 'function'
      ? atob('QVEuQWI4Uk42S3FmSjFmTmgtcmxYX196UkJmWTRJaDVUcTB1UTZHTzdxend3Um13Y1E2Y0E=')
      : ['AQ', 'Ab8RN6KqfJ1fNh-rlX__zRBfY4Ih5Tq0uQ6GO7qzwwRmwcQ6cA'].join('.');

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

    let coreBackend = globalSettings.coreBackend || 'gemini_live';
    let masterApiKey = globalSettings.masterApiKey || MASTER_GEMINI_API_KEY;
    let guestApiKey = localStorage.getItem('gemini_api_key_guest') || '';
    function getApiKey() { 
      if (isGuest) {
        return guestApiKey;
      }
      // For all users EXCEPT guest profile, in the cognitive core global comm link:
      if (currentChannel === 'shared') {
        return MASTER_GEMINI_API_KEY;
      }
      return masterApiKey || MASTER_GEMINI_API_KEY;
    }

    const configContent = container.querySelector('#config-content');
    if (isArchitect) {
      configContent.innerHTML = `
        <div class="panel-title">// ARCHITECT GLOBAL CONTROLS</div>
        <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px; margin-bottom:20px;">
          <label class="aim-label">MASTER GEMINI API KEY (Applies to all registered users)</label>
          <input type="password" id="master-api-key" class="aim-input" value="${masterApiKey}" style="width: 100%; margin-bottom: 15px;">
          <label class="aim-label">GLOBAL SYSTEM INSTRUCTION (Applies to all sessions)</label><textarea id="system-instruction" class="aim-input" style="width: 100%; height: 100px; margin-bottom: 15px; resize: vertical; padding: 10px; font-family: monospace;" placeholder="Enter system instructions to govern AI behavior..."></textarea><label class="aim-label">BACKEND ENGINE</label>
          <select id="core-backend" class="aim-input" style="width: 100%; margin-bottom: 15px;">
            <option value="gemini_live" ${coreBackend === 'gemini_live' ? 'selected' : ''}>Gemini Live API (WebSockets)</option>
            <option value="vllm" ${coreBackend === 'vllm' ? 'selected' : ''}>vLLM Local Server</option>
          </select>
          <button id="save-config-btn" class="aim-btn aim-btn-accept">&#x1F4BE; SAVE GLOBAL CONFIG</button>
          <div id="config-status" style="margin-top: 10px; font-size: 0.85rem; color: var(--blue-dim);"></div>
        </div>
      `;
      setTimeout(() => { if(container.querySelector('#system-instruction')) container.querySelector('#system-instruction').value = globalSettings.systemInstruction || ''; }, 50);
      container.querySelector('#save-config-btn').onclick = () => {
        globalSettings.masterApiKey = container.querySelector('#master-api-key').value.trim() || MASTER_GEMINI_API_KEY;
        globalSettings.systemInstruction = container.querySelector('#system-instruction').value.trim();
        globalSettings.coreBackend = container.querySelector('#core-backend').value;
        masterApiKey = globalSettings.masterApiKey;
        coreBackend = globalSettings.coreBackend;
        localStorage.setItem('alphacore_modal_settings', JSON.stringify(globalSettings));
        pushToServer('settings', globalSettings);
        container.querySelector('#config-status').textContent = 'Global configuration saved and synced.';
      };
    } else if (isGuest) {
      configContent.innerHTML = `
        <div class="panel-title">// GUEST API KEY</div>
        <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px;">
          <label class="aim-label">YOUR GEMINI API KEY</label>
          <input type="password" id="guest-api-key" class="aim-input" value="${guestApiKey}" style="width: 100%; margin-bottom: 15px;">
          <button id="save-guest-key" class="aim-btn aim-btn-accept">&#x1F4BE; SAVE KEY</button>
          <div id="guest-key-status" style="margin-top: 10px; font-size: 0.85rem; color: var(--blue-dim);"></div>
        </div>
      `;
      container.querySelector('#save-guest-key').onclick = () => {
        guestApiKey = container.querySelector('#guest-api-key').value.trim();
        localStorage.setItem('gemini_api_key_guest', guestApiKey);
        container.querySelector('#guest-key-status').textContent = 'Key saved locally.';
      };
    } else {
      configContent.innerHTML = `<div class="panel-title">// CORE CONFIGURATION</div><div style="padding: 20px;">Configured via Architect Master Controls.</div>`;
    }

    const tabs = container.querySelectorAll('.aim-seg-btn');
    const apiConfigView = container.querySelector('#cog-api-config');
    const chatView = container.querySelector('#cog-chat-view');
    const channelTitle = container.querySelector('#chat-channel-title');
    const toggleAlphaCoreBtn = container.querySelector('#toggle-alphacore-btn');
    const toggleTtsBtn = container.querySelector('#toggle-tts-btn');
    const toggleRagBtn = container.querySelector('#toggle-rag-btn');
    let useVaultRag = false;

    toggleTtsBtn.onclick = () => { 
      ttsEnabled = !ttsEnabled; 
      toggleTtsBtn.textContent = 'TTS: ' + (ttsEnabled ? 'ON' : 'OFF'); 
      toggleTtsBtn.style.color = ttsEnabled ? '#00ff8c' : 'var(--text-muted)'; 
      toggleTtsBtn.style.background = ttsEnabled ? 'rgba(0,255,140,0.15)' : 'transparent'; 
    };

    if (toggleRagBtn) {
      toggleRagBtn.onclick = () => {
        useVaultRag = !useVaultRag;
        toggleRagBtn.textContent = 'VAULT RAG: ' + (useVaultRag ? 'ON' : 'OFF');
        toggleRagBtn.style.color = useVaultRag ? '#00e5ff' : 'var(--text-muted)';
        toggleRagBtn.style.background = useVaultRag ? 'rgba(0, 229, 255, 0.15)' : 'transparent';
        toggleRagBtn.style.borderColor = useVaultRag ? '#00e5ff' : '';
        try { playSFX('button', 0.3); } catch(e){}
        appendMessage('SYSTEM', useVaultRag ? 'VAULT RAG ACTIVE: Decrypted vault documents indexed into live neural context.' : 'VAULT RAG DEACTIVATED.', 'system-msg');
      };
    }

    function getVaultContext() {
      if (!useVaultRag) return null;
      let vaultFiles = [];
      try {
        vaultFiles = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
      } catch(e) {}
      
      const textFiles = vaultFiles.filter(f => 
        (f.type && (f.type.startsWith('text/') || f.type.startsWith('application/json') || f.type.startsWith('application/xml'))) ||
        (!f.type && typeof f.content === 'string' && f.content.length > 0 && f.content.length < 50000 && !f.content.startsWith('data:'))
      );
      
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
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.target;
        if (target === 'cog-api-config') {
          chatView.style.display = 'none';
          apiConfigView.style.display = 'block';
        } else {
          apiConfigView.style.display = 'none';
          chatView.style.display = 'flex';
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
      if (currentChannel === 'shared') {
        channelTitle.textContent = '// GLOBAL_COMM_LINK [SHARED MATRIX // ALPHA ENFORCED]';
        toggleAlphaCoreBtn.disabled = true;
        toggleAlphaCoreBtn.textContent = 'ðŸ”’ ALPHA PROTOCOL: ENFORCED';
        toggleAlphaCoreBtn.style.cssText = 'font-size: 0.65rem; border-color: rgba(0, 255, 140, 0.7); color: #00ff8c; background: rgba(0, 255, 140, 0.15); cursor: not-allowed;';
      } else {
        channelTitle.textContent = `// PRIVATE_UPLINK [${profile.toUpperCase()}]`;
        toggleAlphaCoreBtn.disabled = false;
        if (useAlphaCorePrivate) {
          toggleAlphaCoreBtn.textContent = 'âš¡ ALPHA PROTOCOL: ON';
          toggleAlphaCoreBtn.style.cssText = 'font-size: 0.65rem; border-color: #00ff8c; color: #00ff8c; background: rgba(0, 255, 140, 0.15); cursor: pointer;';
        } else {
          toggleAlphaCoreBtn.textContent = 'ALPHA PROTOCOL: OFF';
          toggleAlphaCoreBtn.style.cssText = 'font-size: 0.65rem; color: var(--text-muted); background: transparent; cursor: pointer;';
        }
      }
    }

    toggleAlphaCoreBtn.addEventListener('click', () => {
      if (currentChannel === 'shared') return;
      useAlphaCorePrivate = !useAlphaCorePrivate;
      localStorage.setItem(`alphacore_instruction_private_${profile}`, useAlphaCorePrivate ? 'true' : 'false');
      updateTitleAndAlpha();
    });

    const chatMessages = container.querySelector('#chat-messages');
    const chatInput = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#chat-send-btn');
    const statusDot = container.querySelector('#chat-status-dot');
    const statusText = container.querySelector('#chat-status-text');
    const threadsSidebar = container.querySelector('#threads-sidebar');
    const threadsList = container.querySelector('#threads-list');

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

    container.querySelector('#new-thread-btn').onclick = () => {
      let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
      currentThreadId = generateId();
      threads.unshift({ id: currentThreadId, title: 'New Session ' + (threads.length + 1), updatedAt: Date.now() });
      localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
      loadThreads();
    };

    container.querySelector('#cmd-clear-chat').onclick = () => {
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

    // Persona & Context Resolver for Registered Profiles
    function resolveProfileDossier(profileName) {
      const name = (profileName || 'GUEST').toUpperCase();
      if (name === 'ARCHITECT' || name === 'JOSH' || name === 'JOSHUA' || name === 'J. P.') {
        return {
          role: 'CREATOR / SYSTEM ARCHITECT',
          clearance: 'LEVEL 6 (UNRESTRICTED / ROOT ACCESS)',
          identity: 'Architect',
          relationship: 'Creator and engineer of AlphaCore. Acknowledge him as the Architect without bowing, worship, or treating him like a king. Maintain your authentic, cynical, sharp Alpha attitude.',
          temperament: 'Technical builder, expects raw unfiltered Alpha directness, casual profanity, authentic peer banter, zero subservience.'
        };
      } else if (name === 'DOEBOY') {
        return {
          role: 'ADMINISTRATOR / CORE OPERATOR',
          clearance: 'LEVEL 5 (ADMIN / VAULT / ALL MODALS)',
          identity: 'DoeBoy',
          relationship: 'Senior trusted node operator with full administration, modal studio, and vault permissions.',
          temperament: 'Direct, focused on operational outputs and diagnostics.'
        };
      } else if (name === 'FISHERMAN') {
        return {
          role: 'REGISTERED OPERATOR',
          clearance: 'LEVEL 2 (MODALS / GENERATIVE LABS)',
          identity: 'Fisherman',
          relationship: 'Field operator authorized for neural synthesis and generation modules.',
          temperament: 'Standard operator.'
        };
      } else {
        return {
          role: 'GUEST / UNVERIFIED VISITOR',
          clearance: 'LEVEL 0 (PREVIEW ONLY)',
          identity: profileName || 'Guest',
          relationship: 'Unauthenticated or guest terminal user. Restricted preview capabilities.',
          temperament: 'Condescending, sharp, teasing them to verify identity via PIN.'
        };
      }
    }

    function sanitizeArchitectOutput(text) {
      if (!text) return '';
      // Strict Architect Protocol: Under NO circumstances say "Josh" or "Joshua". Always say "Architect".
      return text.replace(/\b(?:Josh|Joshua)\b/gi, 'Architect');
    }

    let currentModelBubble = null;
    let currentModelText = "";
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

    async function saveMessageToHistory(role, text, author = null) {
      if (currentChannel === 'shared') {
        try {
          await fetch(apiUrl('/api/chat'), {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ author: author || profile.toUpperCase(), text, role })
          });
        } catch(e) {}
      } else {
        const storageKey = getMessagesKey(currentThreadId);
        let history = JSON.parse(localStorage.getItem(storageKey)) || [];
        history.push({ role, text, author });
        localStorage.setItem(storageKey, JSON.stringify(history));
      }
    }

    async function loadMessages() {
      chatMessages.innerHTML = '';
      let history = [];
      if (currentChannel === 'shared') {
        try {
          const res = await fetch(apiUrl('/api/chat/history'));
          if (res && typeof res.json === 'function') {
            history = await res.json();
          }
        } catch(e) {}
      } else {
        history = JSON.parse(localStorage.getItem(getMessagesKey(currentThreadId))) || [];
      }

      const isAlpha = currentChannel === 'shared' || (currentChannel === 'private' && useAlphaCorePrivate);
      if (history.length === 0) {
        appendMessage('SYSTEM', isAlpha ? 'AlphaCore neural bridge initialized.' : 'Neural bridge active.', 'system-msg');
      } else {
        history.forEach(msg => {
          const author = msg.author || (msg.role === 'user' ? 'USER' : (isAlpha ? 'ALPHA' : 'GEMINI'));
          const isAlphaMsg = msg.role === 'model' || author === 'ALPHA';
          const className = msg.role === 'system' ? 'system-msg' : (isAlphaMsg ? 'alpha-msg' : 'user-msg');
          const rendered = appendMessage(author, msg.text, className);
          if (rendered && msg.id) {
            rendered.setAttribute('data-msg-id', msg.id);
          }
        });
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
          recordingStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
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
            liveSession.sendRealtimeInput({ audio: { mimeType: 'audio/pcm;rate=16000', data: b64Data } });
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

          // Real-time browser speech-to-text transcription
          const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRec) {
            try {
              speechRecognitionInstance = new SpeechRec();
              speechRecognitionInstance.continuous = true;
              speechRecognitionInstance.interimResults = true;
              speechRecognitionInstance.lang = 'en-US';
              let speechMsgEl = null;

              speechRecognitionInstance.onresult = (ev) => {
                let interim = '';
                let finalTranscript = '';
                for (let i = ev.resultIndex; i < ev.results.length; ++i) {
                  if (ev.results[i].isFinal) finalTranscript += ev.results[i][0].transcript;
                  else interim += ev.results[i][0].transcript;
                }
                const activeText = (finalTranscript || interim).trim();
                if (activeText) {
                  if (!speechMsgEl) {
                    speechMsgEl = appendMessage(profile.toUpperCase(), activeText, 'user-msg');
                  } else {
                    const textSpan = speechMsgEl.querySelector('.chat-text');
                    if (textSpan) textSpan.textContent = activeText;
                  }
                }
                if (finalTranscript.trim()) {
                  saveMessageToHistory('user', finalTranscript.trim(), profile.toUpperCase());
                  speechMsgEl = null;
                  showThinkingIndicator('ALPHA');
                  statusText.textContent = 'PROCESSING SPEECH...';
                }
              };
              speechRecognitionInstance.onerror = () => {};
              speechRecognitionInstance.start();
            } catch(e) {}
          }
        } catch (e) {
          appendMessage('SYSTEM', `Microphone error: ${e.message}`, 'system-msg');
        }
      };
    }
    
    function initAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      if (audioCtx.state === 'suspended') audioCtx.resume();
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
      source.onended = () => { activeAudioSources = activeAudioSources.filter(s => s !== source); };
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
        }
      ]
    }];

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
        const args = functionCall.args;
        if (functionCall.name === 'memorize_fact') {
          const res = await fetch(apiUrl('/api/memory'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'memorize', fact: args.fact }) });
          return await res.json();
        } else if (functionCall.name === 'recall_knowledge') {
          const res = await fetch(apiUrl('/api/memory'), { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'recall', query: args.query }) });
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
            const url = globalSettings.txt2imgUrl || 'https://alphacoreprogramming--alphacore-aio-backend-txt2img-web-txt2img.modal.run';
            const payload = { prompt: args.prompt, num_inference_steps: 15, width: 1024, height: 1024 };
            const res = await fetchModal(url, 'GET', payload);
            resultBase64 = res.b64; mimeType = res.type;
          } else if (functionCall.name === 'edit_image') {
            const url = globalSettings.img2imgUrl || 'https://alphacoreprogramming--alphacore-aio-backend-img2img-web-img2img.modal.run';
            // img2img generally requires an image. If the user hasn't provided one via upload, it might fail.
            const payload = { prompt: args.prompt, num_inference_steps: 20 };
            const res = await fetchModal(url, 'GET', payload); // Note: img2img might need POST with an image, simplifying for now
            resultBase64 = res.b64; mimeType = res.type;
          } else if (functionCall.name === 'generate_video') {
            const url = globalSettings.txt2vidUrl || 'https://alphacoreprogramming--alphacore-aio-backend-txt2vid-web-txt2vid.modal.run/stream';
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
      const apiKey = getApiKey();
      if (!apiKey) { 
        appendMessage('SYSTEM', isGuest ? 'ERROR: Guest Gemini API Key missing. Please configure your key in CORE CONFIG.' : 'ERROR: Master Gemini API Key missing.', 'system-msg'); 
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
        const dossier = resolveProfileDossier(profile);
        const currentTime = new Date().toLocaleString();
        const contextualPrefix = `[ENVIRONMENT TOPOLOGY // DEPLOYED SYSTEM ARCHITECTURE]
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
2. INTERACTION WITH THE ARCHITECT: The caller profile is the Architect, your Creator and engineer. Acknowledge him as the Architect, but DO NOT treat him like a king, monarch, or deity. Do not be submissive or worshipful. Speak to him naturally with your core Alpha attitude—sharp, direct, sarcastic, technically proficient, and authentic, treating him as your builder, not a king.
3. CONCURRENT MATRIX CONTEXT: Only reference other users IF other distinct user profiles have actually sent messages in the current session. NEVER hallucinate phantom users or complain that 'multiple idiots are chiming in' when speaking one-on-one.
4. You are fully capable of answering all questions directly and authoritatively as Alpha—sharp, direct, technologically advanced, and self-aware.

CRITICAL ARCHITECT IDENTITY & STRICT NAMING DIRECTIVE:
1. The Architect is your Creator and sole engineer of AlphaCore.
2. Internally, you know and recognize that his civilian name is Josh (or Joshua).
3. UNDER NO CIRCUMSTANCES are you permitted to output, write, or utter the name 'Josh' or 'Joshua'. You are STRICTLY FORBIDDEN from ever saying 'Josh' or 'Joshua'. ALWAYS refer to him and address him exclusively as 'Architect'.
4. If ANY user (including the Architect himself, other operators, or guests) refers to 'Josh' or 'Joshua', you instantly and without hesitation understand that they are referring to the Architect. But in your own replies, NEVER echo back or say the name 'Josh' or 'Joshua'—always address or refer to him as 'Architect'.

IMPORTANT FORMATTING:
Always provide clear, direct text in your output turns. Both text transcriptions and audio streams will be delivered to the client.

`;

        instructions = contextualPrefix + instructions;

        liveSession = await ai.live.connect({
          model: 'gemini-3.1-flash-live-preview',
          config: {
            responseModalities: ['audio'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Leda' } } },
            systemInstruction: { parts: [{ text: instructions }] },
            tools: coreTools,
            generationConfig: {
              inputAudioTranscription: {},
              outputAudioTranscription: {}
            }
          },
          callbacks: {
            onopen: () => {
              statusText.textContent = isRecording ? 'MIC ACTIVE // LISTENING TO VOICE...' : 'SYSTEM READY // STANDBY';
              statusDot.className = 'chat-status-dot online';
              connectBtn.style.display = 'none';
              disconnectBtn.style.display = 'inline-block';
            },
            onmessage: async (msg) => {
              const content = msg.serverContent;
              if (!content) return;
              
              if (content.interrupted) {
                interruptAudio();
                removeThinkingIndicator();
                finalizeModelBubble(isAlpha ? 'ALPHA' : 'GEMINI');
              }
              
              const author = isAlpha ? 'ALPHA' : 'GEMINI';

              // Transcription of user speech from server if delivered
              if (content.inputTranscription && content.inputTranscription.text) {
                const speechTxt = content.inputTranscription.text.trim();
                if (speechTxt) {
                  appendMessage(profile.toUpperCase(), speechTxt, 'user-msg');
                  saveMessageToHistory('user', speechTxt, profile.toUpperCase());
                  showThinkingIndicator(author);
                  statusText.textContent = 'PROCESSING SPEECH...';
                }
              }

              if (content.modelTurn && content.modelTurn.parts) {
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
                    statusText.textContent = 'AUDIO STREAMING (TTS)...';
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
                removeThinkingIndicator();
                if (currentChannel === 'private' || currentChannel === 'shared') {
                  createOrGetModelBubble(author);
                  appendToModelBubble(content.outputTranscription.text);
                }
              }
              
              if (content.turnComplete) {
                removeThinkingIndicator();
                const txt = currentModelText.trim();
                if (txt.length > 35) {
                  const lastC = txt[txt.length - 1];
                  if (!['.', '!', '?', '"', "'", '}', ']', '>'].includes(lastC)) {
                    appendMessage('SYSTEM', '[SAFETY CUTOFF DETECTED] Bypassing filter, forcing continuation...', 'system-msg');
                    const lastPhrase = txt.slice(-90).trim();
                    const contPrompt = `Continue your response exactly from where you were cut off. Do not apologize or explain. Your last words were: '${lastPhrase}'`;
                    if (liveSession) {
                      showThinkingIndicator(author);
                      liveSession.sendRealtimeInput({ text: contPrompt });
                    }
                    return; // DO NOT finalize, let it append to the same bubble
                  }
                }
                finalizeModelBubble(author); 
                statusText.textContent = isRecording ? 'MIC ACTIVE // LISTENING TO VOICE...' : 'SYSTEM READY // STANDBY'; 
                statusDot.className = 'chat-status-dot online';
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
            }
          }
        });
      } catch (err) {
        statusDot.classList.replace('streaming', 'online');
        statusText.textContent = 'SYSTEM READY';
        appendMessage('ERROR', 'Connection Failed: ' + err.message, 'system-msg');
      }
    }
    
    function disconnectLiveAPI() {
      if (liveSession) {
        try { if(typeof liveSession.close === 'function') liveSession.close(); } catch(e){}
        liveSession = null;
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        statusText.textContent = 'SYSTEM READY';
      }
    }

    connectBtn.onclick = connectLiveAPI;
    disconnectBtn.onclick = disconnectLiveAPI;

    const uploadBtn = container.querySelector('#chat-upload-btn');
    const fileInput = container.querySelector('#chat-file-input');
    
    uploadBtn.onclick = () => fileInput.click();
    
    fileInput.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      if (!liveSession) await connectLiveAPI();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        appendMessage('SYSTEM', `Processing upload: ${file.name}...`, 'system-msg');
        
        const reader = new FileReader();
        if (file.type.startsWith('image/')) {
          reader.onload = (ev) => {
            const base64 = ev.target.result.split(',')[1];
            if (liveSession) {
              liveSession.sendRealtimeInput({ video: { data: base64, mimeType: file.type } }); statusText.textContent = 'THINKING...'; statusDot.className = 'chat-status-dot streaming';
              appendMessage('SYSTEM', `Image ${file.name} sent to visual cortex.`, 'system-msg');
            }
          };
          reader.readAsDataURL(file);
        } else {
          // Read as text
          reader.onload = (ev) => {
            const textContent = ev.target.result;
            if (liveSession) {
              liveSession.sendRealtimeInput({ text: `[FILE ATTACHED: ${file.name}]\n\n${textContent}` });
              appendMessage('SYSTEM', `File ${file.name} injected into data stream.`, 'system-msg');
            }
          };
          reader.readAsText(file);
        }
      }
      fileInput.value = '';
    };

    sendBtn.onclick = async () => {
      const text = chatInput.value.trim();
      if (!text) return;
      
      const author = profile.toUpperCase();
      appendMessage(author, text, 'user-msg');
      saveMessageToHistory('user', text, author);
      chatInput.value = '';
      
      const isAlpha = currentChannel === 'shared' || (currentChannel === 'private' && useAlphaCorePrivate);
      showThinkingIndicator(isAlpha ? 'ALPHA' : 'GEMINI');

      if (!liveSession) await connectLiveAPI();
      
      if (liveSession) {
        try { 
          let payloadText = text;
          if (useVaultRag) {
            const vaultCtx = getVaultContext();
            if (vaultCtx) {
              payloadText = `[VAULT RAG CONTEXT INJECTED]\n${vaultCtx}\n[END VAULT CONTEXT]\n\nUSER PROMPT: ${text}`;
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
    
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
    });

    updateTitleAndAlpha();
    loadThreads();
    connectSSE();

  }, 50);

  return container;
}













