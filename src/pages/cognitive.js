/**
 * Cognitive Uplink Page — LIVE CHAT INTERFACE & MEMORY MATRIX
 * Connected to Modal DeepSeek backend
 */
import { createElement } from '../components/utils.js';
import { saveImageToGallery } from '../components/vision_db.js';
import { buildNeuralTopologyCanvas } from '../components/neural-canvas.js';

const MODAL_API = "https://bravogod32-alpha--vllm-gemma-agent-model-fastapi-app.modal.run";

export default function CognitiveUplink() {
  const container = createElement('div', { class: 'cognitive-page' });
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// COGNITIVE_CORE">// COGNITIVE_CORE</h1>
      <div class="header-line"></div>
      
      <div class="aim-status-panel" style="margin-top: 15px; padding: 10px; border: 1px solid var(--accent); background: rgba(255,0,60,0.05); display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
        <div id="cog-backend-status" style="font-weight: bold; flex: 1; color: #00ffff; font-family: 'Courier New', monospace;">STATUS: ❄ COLD BOOT</div>
        <button id="cog-lock-btn" class="aim-btn aim-btn-sm" style="font-size: 0.8rem; padding: 6px 12px;">🔒 LOCK ON (15M)</button>
        <button id="cog-shutdown-btn" class="aim-btn aim-btn-sm aim-btn-decline" style="font-size: 0.8rem; padding: 6px 12px; margin-top: 0;">⏻ SHUT DOWN</button>
      </div>
    </div>

    <div class="aim-row" style="margin-bottom: 20px;">
      <div class="aim-seg aim-seg-3" id="cog-tabs">
        <button class="aim-seg-btn active" data-target="cog-chat-view">NEURAL CHAT</button>
        <button class="aim-seg-btn" data-target="cog-memory-view">MEMORY MATRIX</button>
        <button class="aim-seg-btn" data-target="cog-gallery-view">GALLERY</button>
      </div>
    </div>

    <!-- CHAT VIEW -->
    <div class="uplink-grid cog-view active" id="cog-chat-view" style="position: relative;">

      <!-- COMING SOON OVERLAY -->
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10,10,12,0.9); backdrop-filter: blur(5px); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; border-radius: 4px; border: 1px solid rgba(6,182,212,0.3); padding: 20px; text-align: center;">
        <h2 class="glitch" data-text="COMING SOON" style="font-family: 'Orbitron', sans-serif; color: var(--accent, #06b6d4); font-size: clamp(1.8rem, 5vw, 2.5rem); letter-spacing: 2px; text-shadow: 0 0 15px rgba(6,182,212,0.6);">COMING SOON</h2>
        <div style="background: var(--cyan, #06b6d4); color: #000; padding: 5px 15px; border-radius: 2px; font-family: 'Share Tech Mono', monospace; font-weight: bold; margin-top: 10px; font-size: clamp(0.9rem, 3vw, 1.1rem); box-shadow: 0 0 10px rgba(6,182,212,0.4);">// NEURAL CHAT</div>
        <p style="color: #aaa; font-family: 'Share Tech Mono', monospace; font-size: clamp(0.85rem, 3vw, 1rem); margin-top: 20px; border-top: 1px dashed rgba(6,182,212,0.3); padding-top: 15px; width: 100%; max-width: 300px;">Neural Chat synthesis engine is undergoing final training.</p>
      </div>

      <div class="panel chat-panel">
        <div class="panel-title">// NEURAL_BRIDGE — LIVE</div>
        <div class="chat-status-bar">
          <div class="chat-status-dot online" id="chat-status-dot"></div>
          <span class="chat-status-text" id="chat-status-text">BRIDGE ACTIVE — AWAITING INPUT</span>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg system-msg">
            <span class="chat-prefix">[SYSTEM]</span>
            <span class="chat-text">Cognitive Core uplink established. Active profile injected.</span>
          </div>
        </div>
        <div class="chat-input-wrap" style="position: relative;">
          <button class="chat-input-prefix" id="cmd-menu-btn" title="Command Menu" style="background:transparent; border:none; cursor:pointer; color:var(--text); font-family:inherit; outline:none; font-size:1.5rem; padding: 15px; margin-right: 5px;">&gt;_</button>
          
          <div id="cmd-menu-popup" style="display: none; position: absolute; bottom: 110%; left: 0; background: rgba(5,5,10,0.95); border: 1px solid var(--border); padding: 10px; flex-direction: column; gap: 10px; z-index: 100; backdrop-filter: blur(5px); box-shadow: 0 0 10px rgba(0, 184, 255, 0.2); min-width: 150px;">
            <button class="aim-btn" id="cmd-clear-chat" style="padding: 12px; font-size: 1rem; width: 100%;">// CLEAR CHAT</button>
            <button class="aim-btn" id="cmd-reload-history" style="padding: 12px; font-size: 1rem; width: 100%;">// RELOAD HISTORY</button>
            <button class="aim-btn" id="cmd-imagine" style="padding: 12px; font-size: 1rem; width: 100%;">// IMAGINE</button>
            <button class="aim-btn" id="cmd-animate" style="padding: 12px; font-size: 1rem; width: 100%;">// ANIMATE</button>
          </div>
          
          <textarea class="chat-input" id="chat-input" rows="1" placeholder="Message or /imagine, /animate" maxlength="4000" style="padding: 15px; font-size: 1.1rem;" disabled></textarea>
          <button class="chat-send-btn" id="chat-send-btn" title="TRANSMIT" style="padding: 15px; font-size: 1.5rem;" disabled>
            <span class="chat-send-icon">⟩</span>
          </button>
        </div>
      </div>

      <div class="panel uplink-info-panel" style="display: flex; flex-direction: column;">
        <div class="panel-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>// LIVE_MODAL_LOGS</span>
          <a href="https://modal.com/apps/ai-alphacore-tech/main/deployed/alpha-modal-gui-local-llm" target="_blank" class="aim-btn aim-btn-sm" style="font-size: 0.6rem; padding: 4px 8px; text-decoration: none;">EXTERNAL &nearr;</a>
        </div>
        <div style="flex-grow: 1; min-height: 300px; margin-top: 10px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; position: relative;">
          <iframe src="https://modal.com/apps/ai-alphacore-tech/main/deployed/alpha-modal-gui-local-llm" style="width: 100%; height: 100%; border: none; background: #000;"></iframe>
        </div>

        <div style="margin-top: 15px;">
          <div style="font-family:'Orbitron',sans-serif; font-size:0.75rem; color:#888; margin-bottom:8px;">// SYNAPSE_TOPOLOGY</div>
          <div id="neural-canvas-mount"></div>
        </div>
      </div>
    </div>

    <!-- MEMORY VIEW -->
    <div class="panel cog-view" id="cog-memory-view" style="display: none;">
      <div class="panel-title">// MEMORY_INJECTION</div>
      <div class="aim-row" style="margin-bottom:20px;">
        <div class="aim-field aim-field-half">
          <label class="aim-label">MEMORY KEY</label>
          <input type="text" class="aim-input" id="mem-key-input" placeholder="e.g. Username, Preference" />
        </div>
        <div class="aim-field aim-field-half">
          <label class="aim-label">VALUE</label>
          <input type="text" class="aim-input" id="mem-val-input" placeholder="Data payload..." />
        </div>
      </div>
      <button class="aim-btn aim-btn-accept" id="mem-save-btn">INJECT MEMORY</button>
      
      <div class="panel-title" style="margin-top:40px;">// ACTIVE_MEMORIES</div>
      <div id="memory-list" style="color:var(--text); font-family:monospace; margin-top:10px;"></div>
    </div>

    <!-- GALLERY VIEW -->
    <div class="panel cog-view" id="cog-gallery-view" style="display: none;">
      <div class="panel-title">// GENERATED_ASSETS</div>
      <div id="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top:20px;"></div>
    </div>
  `;

  setTimeout(() => {
    // Mount Neural Topology Canvas
    const canvasMount = container.querySelector('#neural-canvas-mount');
    if (canvasMount) {
      canvasMount.appendChild(buildNeuralTopologyCanvas(280, 160));
    }

    const profile = sessionStorage.getItem('current_profile') || 'Guest';
    const profileLabel = container.querySelector('#active-profile-label');
    if (profileLabel) profileLabel.textContent = profile.toUpperCase();

    // TABS
    container.querySelectorAll('.aim-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.aim-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        container.querySelectorAll('.cog-view').forEach(v => v.style.display = 'none');
        container.querySelector('#' + btn.dataset.target).style.display = 
          btn.dataset.target === 'cog-chat-view' ? 'grid' : 'block';
          
        if(btn.dataset.target === 'cog-memory-view') loadMemory();
        if(btn.dataset.target === 'cog-gallery-view') loadGallery();
      });
    });

    // CHAT
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const statusDot = document.getElementById('chat-status-dot');
    const statusText = document.getElementById('chat-status-text');
    let isStreaming = false;
    let history = [];

    async function loadHistory() {
      try {
        const res = await fetch(`${MODAL_API}/api/history?profile=${encodeURIComponent(profile)}`);
        if (res.ok) {
          const pastHistory = await res.json();
          if (pastHistory && pastHistory.length > 0) {
             pastHistory.forEach(msg => {
                if(msg.role === 'user') {
                    appendMessage('USER', msg.content, 'user-msg');
                } else {
                    if (msg.content.startsWith("Generated video:")) {
                       const url = MODAL_API + msg.content.replace("Generated video: ", "");
                       appendVideo('ALPHA_VISION', url, 'Restored video');
                    } else if (msg.content.startsWith("Generated image:")) {
                       const url = MODAL_API + msg.content.replace("Generated image: ", "");
                       appendImage('ALPHA_VISION', url, 'Restored image');
                    } else if (msg.content.startsWith("Generated image for prompt:")) {
                       const urlMatch = msg.content.match(/at (\/files\/.*)/);
                       const url = urlMatch ? MODAL_API + urlMatch[1] : '';
                       if(url) appendImage('ALPHA_VISION', url, 'Restored image');
                    } else {
                       appendMessage('ALPHA', msg.content, 'alpha-msg');
                    }
                }
             });
             history = pastHistory;
          }
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    loadHistory();

    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Command Menu Logic
    const cmdMenuBtn = document.getElementById('cmd-menu-btn');
    const cmdMenuPopup = document.getElementById('cmd-menu-popup');
    const cmdClearChat = document.getElementById('cmd-clear-chat');
    const cmdReloadHistory = document.getElementById('cmd-reload-history');
    
    cmdMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cmdMenuPopup.style.display = cmdMenuPopup.style.display === 'flex' ? 'none' : 'flex';
    });
    
    document.addEventListener('click', () => {
      if (cmdMenuPopup) cmdMenuPopup.style.display = 'none';
    });
    cmdMenuPopup.addEventListener('click', (e) => e.stopPropagation());
    
    cmdClearChat.addEventListener('click', () => {
      chatMessages.innerHTML = '';
      history = [];
      appendMessage('SYSTEM', 'Chat history cleared. Active profile maintained.', 'system-msg');
      cmdMenuPopup.style.display = 'none';
    });
    
    cmdReloadHistory.addEventListener('click', () => {
      chatMessages.innerHTML = '';
      history = [];
      appendMessage('SYSTEM', 'Reloading history from endpoint...', 'system-msg');
      loadHistory();
      cmdMenuPopup.style.display = 'none';
    });

    const cmdImagine = document.getElementById('cmd-imagine');
    const cmdAnimate = document.getElementById('cmd-animate');
    
    cmdImagine.addEventListener('click', () => {
      chatInput.value = '/imagine ';
      chatInput.focus();
      cmdMenuPopup.style.display = 'none';
    });
    
    cmdAnimate.addEventListener('click', () => {
      chatInput.value = '/animate ';
      chatInput.focus();
      cmdMenuPopup.style.display = 'none';
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn.addEventListener('click', sendMessage);

    async function sendMessage() {
      const text = chatInput.value.trim();
      if (!text || isStreaming) return;

      appendMessage('USER', text, 'user-msg');
      chatInput.value = '';
      chatInput.style.height = 'auto';
      
      isStreaming = true;
      statusDot.classList.remove('online'); statusDot.classList.add('streaming');
      
      let processingText = 'PROCESSING NEURAL RESPONSE...';
      let typingHTML = '...';
      const isMedia = text.startsWith('/imagine') || text.startsWith('/animate');
      if (isMedia) {
         processingText = 'RENDERING MEDIA ASSET...';
         typingHTML = '<div class="media-loader"><div class="media-loader-bar"></div></div><span style="font-size:0.8rem; color:var(--accent);">ALLOCATING GPU COMPUTE...</span>';
      }
      
      statusText.textContent = processingText;
      sendBtn.disabled = true;

      const typingEl = appendMessage('ALPHA', typingHTML, 'alpha-msg typing');

      try {
        if (isMedia) {
          const res = await fetch(`${MODAL_API}/api/chat`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text, history, profile})
          });
          const data = await res.json();
          typingEl.remove();
          if (window._cogNotifyWarm) window._cogNotifyWarm();

          if(data.type === 'video') {
             appendVideo('ALPHA_VISION', MODAL_API + data.url, data.content);
             history.push({role: 'user', content: text});
             history.push({role: 'assistant', content: "Generated video: " + data.url});
          } else if(data.type === 'image') {
             appendImage('ALPHA_VISION', MODAL_API + data.url, data.content);
             saveImageToGallery(profile, data.content, 'Cognitive Core', MODAL_API + data.url);
             history.push({role: 'user', content: text});
             history.push({role: 'assistant', content: "Generated image: " + data.url});
          } else {
             const reply = data.content || '[EMPTY RESPONSE]';
             appendMessage('ALPHA', reply, 'alpha-msg');
             history.push({role: 'user', content: text});
             history.push({role: 'assistant', content: reply});
          }
        } else {
          // Streaming text response
          const res = await fetch(`${MODAL_API}/api/chat/stream`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text, history, profile})
          });
          typingEl.remove();
          if (window._cogNotifyWarm) window._cogNotifyWarm();
          
          const reader = res.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let fullReply = "";
          
          // Create an empty message element to update
          const streamEl = appendMessage('ALPHA', '', 'alpha-msg');
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            fullReply += chunk;
            
            // Format chunks dynamically
            let htmlContent = formatThinkBlock(fullReply, true);
            streamEl.querySelector('.chat-text').innerHTML = htmlContent;
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }
          
          history.push({role: 'user', content: text});
          history.push({role: 'assistant', content: fullReply});
          
          // Collapse thoughts when done generating
          const details = streamEl.querySelectorAll('details');
          details.forEach(d => d.removeAttribute('open'));
        }
        
        // Play success/return audio
        try {
          const returnAudio = new Audio('/digital-ui.mp3');
          returnAudio.volume = 0.4;
          returnAudio.play().catch(e => console.log('Audio playback prevented:', e));
        } catch (e) {}

      } catch (err) {
        typingEl.remove();
        appendMessage('ERROR', err.message, 'system-msg');
      } finally {
        isStreaming = false;
        statusDot.classList.remove('streaming'); statusDot.classList.add('online');
        statusText.textContent = 'BRIDGE ACTIVE — AWAITING INPUT';
        sendBtn.disabled = false;
      }
    }

    function appendMessage(prefix, text, className) {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${className}`;
      
      let htmlContent = formatThinkBlock(text, false);

      msg.innerHTML = `<span class="chat-prefix">[${prefix}]</span><span class="chat-text" style="white-space:pre-wrap;">${htmlContent}</span>`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msg;
    }
    
    function appendVideo(prefix, url, prompt) {
      const msg = document.createElement('div');
      msg.className = `chat-msg alpha-msg`;
      msg.innerHTML = `<span class="chat-prefix">[${prefix}]</span><span class="chat-text">Video asset rendered.</span><br/>
      <div style="position:relative; display:inline-block; max-width:100%; margin-top:10px;">
        <video src="${url}" autoplay loop muted controls style="max-width:100%; border-radius:4px; border:1px solid var(--border);"></video>
        <a href="${url}" download="alpha_render.mp4" target="_blank" class="aim-btn" style="display:block; text-align:center; margin-top:5px; text-decoration:none; padding:10px;">// DOWNLOAD VIDEO</a>
      </div>`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msg;
    }

    function appendImage(prefix, url, prompt) {
      const msg = document.createElement('div');
      msg.className = `chat-msg alpha-msg`;
      msg.innerHTML = `<span class="chat-prefix">[${prefix}]</span><span class="chat-text">Image asset rendered.</span><br/>
      <div style="position:relative; display:inline-block; max-width:100%; margin-top:10px;">
        <img src="${url}" style="max-width:100%; border-radius:4px; border:1px solid var(--border);">
        <a href="${url}" download="alpha_render.png" target="_blank" class="aim-btn" style="display:block; text-align:center; margin-top:5px; text-decoration:none; padding:10px;">// DOWNLOAD IMAGE</a>
      </div>`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msg;
    }

    function escapeHtml(str) {
      if (typeof str !== 'string') return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function formatThinkBlock(text, isOpen = false) {
      if (typeof text !== 'string') return '';
      // If there's a </think> but no <think> (model skipped opening tag), prepend it
      if (text.includes('</think>') && !text.includes('<think>')) {
        text = '<think>\n' + text;
      }
      
      if (!text.includes('<think>')) return escapeHtml(text);

      const parts = text.split(/<think>|<\/think>/);
      let html = '';
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) { // Inside think block
          html += `<details class="alpha-thought-block" style="margin: 8px 0; padding: 8px; background: rgba(0,255,255,0.03); border-left: 2px solid var(--text-muted);" ${isOpen ? 'open' : ''}>
            <summary style="cursor: pointer; color: var(--text-muted); font-size: 0.75rem; user-select: none;">// NEURAL_CHAIN_OF_THOUGHT</summary>
            <div style="margin-top: 8px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(parts[i].trim())}</div>
          </details>`;
        } else if (parts[i].trim() !== '') {
          html += `<span>${escapeHtml(parts[i].trim())}</span>`;
        }
      }
      return html;
    }

    // MEMORY
    const memSaveBtn = container.querySelector('#mem-save-btn');
    memSaveBtn.addEventListener('click', async () => {
       const key = container.querySelector('#mem-key-input').value;
       const val = container.querySelector('#mem-val-input').value;
       if(!key || !val) return;
       memSaveBtn.textContent = "INJECTING...";
       try {
           await fetch(`${MODAL_API}/api/memory`, {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({profile, key, value: val})
           });
           container.querySelector('#mem-key-input').value = '';
           container.querySelector('#mem-val-input').value = '';
           loadMemory();
       } catch(e) { console.error(e); }
       memSaveBtn.textContent = "INJECT MEMORY";
    });

    async function loadMemory() {
       try {
           const res = await fetch(`${MODAL_API}/api/memory?profile=${encodeURIComponent(profile)}`);
           const mems = await res.json();
           const list = container.querySelector('#memory-list');
           list.innerHTML = mems.map(m => `<div style="padding:10px; border-bottom:1px solid var(--border);"><strong>${escapeHtml(m.key)}</strong>: ${escapeHtml(m.value)}</div>`).join('');
           if(mems.length === 0) list.innerHTML = '<div style="color:var(--text-muted)">No active memories.</div>';
       } catch(e) { console.error(e); }
    }

    // GALLERY
    async function loadGallery() {
       try {
           const res = await fetch(`${MODAL_API}/api/gallery?profile=${encodeURIComponent(profile)}`);
           const imgs = await res.json();
           const grid = container.querySelector('#gallery-grid');
           grid.innerHTML = imgs.map(img => {
               const fullUrl = MODAL_API + img.url;
               if (fullUrl.endsWith('.mp4')) {
                   return `<div style="display:flex; flex-direction:column; gap:5px;"><video src="${fullUrl}" title="${escapeHtml(img.prompt)}" autoplay loop muted style="width:100%; aspect-ratio:1; object-fit:cover; border-radius:4px; border:1px solid var(--border);"></video><a href="${fullUrl}" download target="_blank" class="aim-btn" style="text-align:center; text-decoration:none; font-size:0.8rem;">// SAVE</a></div>`;
               } else {
                   return `<div style="display:flex; flex-direction:column; gap:5px;"><img src="${fullUrl}" title="${escapeHtml(img.prompt)}" style="width:100%; aspect-ratio:1; object-fit:cover; border-radius:4px; border:1px solid var(--border);"><a href="${fullUrl}" download target="_blank" class="aim-btn" style="text-align:center; text-decoration:none; font-size:0.8rem;">// SAVE</a></div>`;
               }
           }).join('');
           if(imgs.length === 0) grid.innerHTML = '<div style="color:var(--text-muted)">No generated assets found.</div>';
       } catch(e) { console.error(e); }
    }

    // --- Backend Status Logic ---
    let lockInterval = null;
    let expireTime = 0;
    let displayInterval = null;
    let lockEndTime = 0;
    const IDLE_TIMEOUT_MS = 3 * 60 * 1000;

    function updateStatusDisplay() {
      const statusEl = container.querySelector('#cog-backend-status');
      const lockBtn = container.querySelector('#cog-lock-btn');
      if (!statusEl) return;
      const now = Date.now();
      
      if (now < lockEndTime) {
        const remaining = Math.floor((lockEndTime - now) / 1000);
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        statusEl.textContent = `STATUS: 🔒 LOCKED WARM (${m}:${s.toString().padStart(2, '0')})`;
        statusEl.style.color = '#ff003c';
        if (lockBtn) lockBtn.style.opacity = '0.5';
      } else if (now < expireTime) {
        const remaining = Math.floor((expireTime - now) / 1000);
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        statusEl.textContent = `STATUS: 🔥 WARM (${m}:${s.toString().padStart(2, '0')})`;
        statusEl.style.color = '#ffaa00';
        if (lockBtn) lockBtn.style.opacity = '1';
      } else {
        statusEl.textContent = `STATUS: ❄ COLD BOOT`;
        statusEl.style.color = '#00ffff';
        if (lockBtn) lockBtn.style.opacity = '1';
        if (lockInterval) { clearInterval(lockInterval); lockInterval = null; }
      }
    }

    window._cogNotifyWarm = () => {
      expireTime = Math.max(expireTime, Date.now() + IDLE_TIMEOUT_MS);
      if (!displayInterval) displayInterval = setInterval(() => {
        if (!container.isConnected) {
          clearInterval(displayInterval);
          displayInterval = null;
          return;
        }
        updateStatusDisplay();
      }, 1000);
      updateStatusDisplay();
    };

    container.querySelector('#cog-lock-btn').addEventListener('click', () => {
      if (Date.now() < lockEndTime) return; // Already locked
      if (!confirm('WARNING: Locking the backend prevents it from spinning down for 15 minutes. This will incur consistent compute costs even if idle. Are you sure?')) return;
      
      lockEndTime = Date.now() + (15 * 60 * 1000);
      expireTime = Math.max(expireTime, lockEndTime);
      
      if (lockInterval) clearInterval(lockInterval);
      // Ping every 2 minutes
      lockInterval = setInterval(() => {
        if (!container.isConnected || Date.now() >= lockEndTime) {
          clearInterval(lockInterval);
          lockInterval = null;
          return;
        }
        fetch(`${MODAL_API}/api/ping`).catch(()=>{});
        window._cogNotifyWarm();
      }, 2 * 60 * 1000);
      
      // Initial ping
      fetch(`${MODAL_API}/api/ping`).catch(()=>{});
      
      if (!displayInterval) displayInterval = setInterval(() => {
        if (!container.isConnected) {
          clearInterval(displayInterval);
          displayInterval = null;
          return;
        }
        updateStatusDisplay();
      }, 1000);
      updateStatusDisplay();
    });

    container.querySelector('#cog-shutdown-btn').addEventListener('click', async () => {
      if (lockInterval) { clearInterval(lockInterval); lockInterval = null; }
      lockEndTime = 0;
      expireTime = 0;
      updateStatusDisplay();
      
      try { fetch(`${MODAL_API}/api/shutdown`, { method: 'POST' }).catch(()=>{}); } catch(e){};
    });

  }, 50);

  return container;
}
