import { createElement } from '../components/utils.js';
import { playSFX } from '../components/audio.js';

export default function CognitiveUplink() {
  const container = createElement('div', { class: 'cognitive-page' });
  
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// COGNITIVE_CORE_GEMINI">// COGNITIVE_CORE_GEMINI</h1>
      <div class="header-line"></div>
    </div>

    <div class="aim-row" style="margin-bottom: 20px; margin-top: 15px;">
      <div class="aim-seg aim-seg-3" id="cog-tabs">
        <button class="aim-seg-btn active" data-target="cog-chat-private">PRIVATE UPLINK</button>
        <button class="aim-seg-btn" data-target="cog-chat-shared">GLOBAL COMM LINK</button>
        <button class="aim-seg-btn" data-target="cog-api-config">API CONFIG</button>
      </div>
    </div>

    <!-- API CONFIG VIEW -->
    <div class="panel cog-view" id="cog-api-config" style="display: none;">
      <div class="panel-title">// GEMINI API KEY AUTHORIZATION</div>
      <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px; margin-bottom:20px;">
        <label class="aim-label">YOUR GEMINI API KEY</label>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <input type="password" id="gemini-api-key-input" class="aim-input" placeholder="AIzaSy..." style="flex: 1; min-width: 250px;">
          <button id="save-api-key-btn" class="aim-btn aim-btn-accept" style="min-width: 150px;">&#x1F4BE; SAVE KEY</button>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" class="aim-btn" style="min-width: 150px; text-decoration: none; text-align: center; display: flex; align-items: center; justify-content: center;">&#x1F511; GET KEY</a>
        </div>
        <div id="api-key-status" style="margin-top: 10px; font-size: 0.85rem; color: var(--blue-dim);"></div>
      </div>
      <div class="panel-title" style="margin-top:30px;">// API KEY DOCUMENTATION</div>
      <details style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-dim); padding: 10px; margin-bottom: 10px; cursor: pointer;">
        <summary style="color: var(--accent); font-family: var(--font-hud); font-size: 0.9rem; outline: none; padding: 5px;">WHAT IS AN API KEY?</summary>
        <div style="padding: 10px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">An API key grants access to Google's Gemini AI directly from your browser. Keep it secret.</div>
      </details>
      <details style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-dim); padding: 10px; margin-bottom: 10px; cursor: pointer;">
        <summary style="color: var(--accent); font-family: var(--font-hud); font-size: 0.9rem; outline: none; padding: 5px;">WHY DO I NEED ONE?</summary>
        <div style="padding: 10px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">Direct client-to-model topology ensures privacy, bypasses shared rate limits, and uses your own quota.</div>
      </details>
    </div>

    <!-- CHAT VIEW FRAME -->
    <div class="uplink-grid cog-view active" id="cog-chat-view" style="display: flex; gap: 15px; height: 65vh; min-height: 500px;">
      
      <!-- Threads Sidebar -->
      <div class="panel" id="threads-sidebar" style="width: 250px; display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;">
        <div class="panel-title" style="margin-bottom: 10px;">// SESSIONS</div>
        <button id="new-thread-btn" class="aim-btn aim-btn-accept" style="margin-bottom: 15px; font-size: 0.8rem; padding: 10px;">+ NEW SESSION</button>
        <div id="threads-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px; padding-right: 5px;">
          <!-- Threads populate here -->
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="panel chat-panel" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <div class="panel-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; padding-bottom: 10px; border-bottom: 1px solid rgba(6,182,212,0.2);">
          <span id="chat-channel-title">// PRIVATE_UPLINK</span>
          <div style="display: flex; gap: 10px;">
            <button id="toggle-rag-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; border-color: rgba(6,182,212,0.3);" title="Inject Vault text files as context">VAULT RAG: OFF</button>
            <button id="toggle-tts-btn" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; border-color: rgba(6,182,212,0.3);" title="Text-to-Speech Output">TTS: OFF</button>
            <button id="cmd-clear-chat" class="aim-btn aim-btn-sm" style="font-size: 0.65rem; color: #ff003c; border-color: rgba(255,0,60,0.3);" title="Delete current session">DELETE SESSION</button>
          </div>
        </div>
        
        <div class="chat-status-bar" style="margin-top: 10px;">
          <div class="chat-status-dot online" id="chat-status-dot"></div>
          <span class="chat-status-text" id="chat-status-text">SYSTEM READY</span>
        </div>
        
        <div class="chat-messages" id="chat-messages" style="flex: 1; overflow-y: auto; padding-right: 5px; margin-bottom: 10px;"></div>
        
        <!-- Attachment Previews -->
        <div id="attachment-previews" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; margin-bottom: 5px; min-height: 0;"></div>

        <div class="chat-input-wrap" style="position: relative; display: flex; align-items: flex-end; gap: 8px;">
          <button id="attach-file-btn" class="aim-btn" title="Attach Image/Video/File" style="padding: 15px; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; height: 50px;">&#x1F4CE;</button>
          <input type="file" id="file-upload-input" style="display: none;" multiple accept="image/*,video/*,audio/*,text/plain,application/pdf">
          
          <textarea class="chat-input" id="chat-input" rows="1" placeholder="Initialize transmission..." maxlength="10000" style="flex: 1; padding: 15px; font-size: 1.1rem; resize: none; overflow-y: auto; max-height: 150px; height: 50px; border-radius: 4px;"></textarea>
          
          <button id="mic-btn" class="aim-btn" title="Voice Input" style="padding: 15px; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; height: 50px;">&#x1F3A4;</button>
          <button class="chat-send-btn" id="chat-send-btn" title="TRANSMIT" style="padding: 15px; font-size: 1.5rem; height: 50px;">&#x27E9;</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const profile = sessionStorage.getItem('current_profile') || 'Guest';
    let currentChannel = 'private'; // 'private' or 'shared'
    let currentThreadId = null;
    let pendingAttachments = []; // { dataUrl, mimeType, name, b64 }
    let useVaultRAG = false;
    let useTTS = false;
    
    // UI Elements
    const tabs = container.querySelectorAll('.aim-seg-btn');
    const apiConfigView = container.querySelector('#cog-api-config');
    const chatView = container.querySelector('#cog-chat-view');
    const channelTitle = container.querySelector('#chat-channel-title');
    const threadsSidebar = container.querySelector('#threads-sidebar');
    
    const apiKeyInput = container.querySelector('#gemini-api-key-input');
    const saveKeyBtn = container.querySelector('#save-api-key-btn');
    const apiKeyStatus = container.querySelector('#api-key-status');
    
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const statusDot = document.getElementById('chat-status-dot');
    const statusText = document.getElementById('chat-status-text');
    const clearChatBtn = document.getElementById('cmd-clear-chat');
    
    const attachFileBtn = document.getElementById('attach-file-btn');
    const fileUploadInput = document.getElementById('file-upload-input');
    const attachmentPreviews = document.getElementById('attachment-previews');
    const micBtn = document.getElementById('mic-btn');
    const toggleRAGBtn = document.getElementById('toggle-rag-btn');
    const toggleTTSBtn = document.getElementById('toggle-tts-btn');
    const newThreadBtn = document.getElementById('new-thread-btn');
    const threadsList = document.getElementById('threads-list');

    let isStreaming = false;

    // Load API Key
    const savedKey = localStorage.getItem(`gemini_api_key_${profile}`);
    if (savedKey) {
      apiKeyInput.value = savedKey;
      apiKeyStatus.textContent = '✓ Key loaded from local storage.';
      apiKeyStatus.style.color = 'var(--accent)';
    }

    saveKeyBtn.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      if (key) {
        localStorage.setItem(`gemini_api_key_${profile}`, key);
        apiKeyStatus.textContent = '✓ Key successfully saved securely in browser storage.';
        apiKeyStatus.style.color = '#00ff8c';
      } else {
        localStorage.removeItem(`gemini_api_key_${profile}`);
        apiKeyStatus.textContent = 'Key removed.';
        apiKeyStatus.style.color = 'var(--text-muted)';
      }
    });

    // Vault RAG Toggle
    toggleRAGBtn.addEventListener('click', () => {
      useVaultRAG = !useVaultRAG;
      toggleRAGBtn.textContent = useVaultRAG ? 'VAULT RAG: ON' : 'VAULT RAG: OFF';
      toggleRAGBtn.style.background = useVaultRAG ? 'rgba(0,184,255,0.2)' : '';
      toggleRAGBtn.style.color = useVaultRAG ? '#00b8ff' : '';
    });

    // TTS Toggle
    toggleTTSBtn.addEventListener('click', () => {
      useTTS = !useTTS;
      toggleTTSBtn.textContent = useTTS ? 'TTS: ON' : 'TTS: OFF';
      toggleTTSBtn.style.background = useTTS ? 'rgba(0,184,255,0.2)' : '';
      toggleTTSBtn.style.color = useTTS ? '#00b8ff' : '';
      if (!useTTS && window.speechSynthesis) window.speechSynthesis.cancel();
    });

    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        micBtn.style.color = '#ff003c';
        micBtn.style.borderColor = '#ff003c';
        chatInput.placeholder = 'Listening...';
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          chatInput.value = (chatInput.value + ' ' + finalTranscript).trim();
          adjustInputHeight();
        }
      };
      
      recognition.onend = () => {
        micBtn.style.color = '';
        micBtn.style.borderColor = '';
        chatInput.placeholder = 'Initialize transmission...';
      };
    } else {
      micBtn.style.display = 'none';
    }

    micBtn.addEventListener('click', () => {
      if (recognition) {
        try { recognition.start(); } catch(e) { recognition.stop(); }
      }
    });

    // File Attachments
    attachFileBtn.addEventListener('click', () => fileUploadInput.click());
    
    fileUploadInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          const [mimeHeader, b64] = dataUrl.split(',');
          const mimeType = file.type || 'application/octet-stream';
          
          pendingAttachments.push({ mimeType, b64, name: file.name, dataUrl });
          renderAttachmentPreviews();
        };
        reader.readAsDataURL(file);
      });
      fileUploadInput.value = '';
    });

    function renderAttachmentPreviews() {
      attachmentPreviews.innerHTML = '';
      pendingAttachments.forEach((att, idx) => {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position: relative; width: 60px; height: 60px; border-radius: 4px; border: 1px solid var(--border); overflow: hidden; background: #000; flex-shrink: 0;';
        
        if (att.mimeType.startsWith('image/')) {
          wrap.innerHTML = `<img src="${att.dataUrl}" style="width:100%; height:100%; object-fit:cover;">`;
        } else if (att.mimeType.startsWith('video/')) {
          wrap.innerHTML = `<video src="${att.dataUrl}" style="width:100%; height:100%; object-fit:cover;"></video>`;
        } else {
          wrap.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:var(--text-muted); word-break:break-all; text-align:center; padding:2px;">${att.name.substring(0,8)}</div>`;
        }
        
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'position:absolute; top:2px; right:2px; background:rgba(255,0,0,0.8); color:white; width:16px; height:16px; border-radius:50%; font-size:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:sans-serif; line-height:1; padding-bottom:1px; z-index:10;';
        closeBtn.onclick = () => {
          pendingAttachments.splice(idx, 1);
          renderAttachmentPreviews();
        };
        
        wrap.appendChild(closeBtn);
        attachmentPreviews.appendChild(wrap);
      });
    }

    // Thread Management
    function getThreadsKey() {
      return currentChannel === 'private' ? `gemini_chat_threads_${profile}` : `gemini_chat_threads_shared`;
    }

    function getMessagesKey(threadId) {
      return `gemini_chat_thread_${threadId}`;
    }

    function generateId() {
      return Math.random().toString(36).substring(2, 10);
    }

    function loadThreads() {
      if (currentChannel === 'shared') {
        threadsSidebar.style.display = 'none';
        currentThreadId = 'shared_main'; // Only one thread for global channel
        loadMessages();
        return;
      }
      
      threadsSidebar.style.display = 'flex';
      threadsList.innerHTML = '';
      
      let threads = [];
      try {
        threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
      } catch(e) {}
      
      if (threads.length === 0) {
        // Create initial thread
        const newId = generateId();
        threads = [{ id: newId, title: 'Session 01', updatedAt: Date.now() }];
        localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
      }
      
      // Sort by updated descending
      threads.sort((a,b) => b.updatedAt - a.updatedAt);
      
      if (!currentThreadId || !threads.find(t => t.id === currentThreadId)) {
        currentThreadId = threads[0].id;
      }

      threads.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'aim-btn' + (t.id === currentThreadId ? ' active' : '');
        btn.style.cssText = 'text-align: left; padding: 10px; font-size: 0.85rem; border: none; border-left: 2px solid transparent; background: transparent; color: var(--text); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display:block; width:100%;';
        if (t.id === currentThreadId) {
          btn.style.borderLeftColor = 'var(--accent)';
          btn.style.background = 'rgba(0,184,255,0.05)';
        }
        btn.textContent = t.title || 'Untitled Session';
        
        btn.onclick = () => {
          currentThreadId = t.id;
          loadThreads(); // re-render list
          loadMessages();
        };
        threadsList.appendChild(btn);
      });
      
      loadMessages();
    }

    newThreadBtn.addEventListener('click', () => {
      let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
      const newId = generateId();
      threads.unshift({ id: newId, title: 'New Session ' + (threads.length + 1), updatedAt: Date.now() });
      localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
      currentThreadId = newId;
      loadThreads();
    });

    clearChatBtn.addEventListener('click', () => {
      if (confirm('Delete this session permanently?')) {
        localStorage.removeItem(getMessagesKey(currentThreadId));
        if (currentChannel === 'private') {
          let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
          threads = threads.filter(t => t.id !== currentThreadId);
          localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
          currentThreadId = null;
          loadThreads();
        } else {
          loadMessages();
        }
      }
    });

    // Tab Switching
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
            channelTitle.textContent = `// PRIVATE_UPLINK [${profile.toUpperCase()}]`;
            loadThreads();
          } else if (target === 'cog-chat-shared') {
            currentChannel = 'shared';
            channelTitle.textContent = '// GLOBAL_COMM_LINK [SHARED MATRIX]';
            loadThreads();
          }
        }
      });
    });

    function loadMessages() {
      chatMessages.innerHTML = '';
      const historyStr = localStorage.getItem(getMessagesKey(currentThreadId));
      
      let history = [];
      if (historyStr) {
        try { history = JSON.parse(historyStr); } catch(e) {}
      }

      if (history.length === 0) {
        appendMessage('SYSTEM', 'Neural bridge active. Ready for transmission.', 'system-msg');
      } else {
        history.forEach(msg => {
          if (msg.role === 'user') {
            appendMessage(msg.author || 'USER', msg.displayHtml || msg.parts[0].text, 'user-msg', true);
          } else {
            appendMessage('GEMINI', msg.parts[0].text, 'alpha-msg');
          }
        });
      }
    }

    function saveMessageToHistory(role, displayHtml, parts, author = null) {
      const storageKey = getMessagesKey(currentThreadId);
      let history = [];
      const historyStr = localStorage.getItem(storageKey);
      if (historyStr) {
        try { history = JSON.parse(historyStr); } catch(e) {}
      }
      
      const msgObj = { role, parts, displayHtml };
      if (author) msgObj.author = author;
      
      history.push(msgObj);
      localStorage.setItem(storageKey, JSON.stringify(history));
      
      // Update thread title and timestamp
      if (currentChannel === 'private' && role === 'user' && history.length <= 2) {
        let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
        const t = threads.find(x => x.id === currentThreadId);
        if (t) {
          const firstTextPart = parts.find(p => p.text)?.text || 'Attachment Session';
          t.title = firstTextPart.substring(0, 25) + (firstTextPart.length > 25 ? '...' : '');
          t.updatedAt = Date.now();
          localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
          loadThreads(); // Soft refresh to update sidebar title
        }
      } else if (currentChannel === 'private') {
        let threads = JSON.parse(localStorage.getItem(getThreadsKey())) || [];
        const t = threads.find(x => x.id === currentThreadId);
        if (t) {
          t.updatedAt = Date.now();
          localStorage.setItem(getThreadsKey(), JSON.stringify(threads));
        }
      }
    }

    function adjustInputHeight() {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + 'px';
      if (chatInput.scrollHeight <= 50) chatInput.style.height = '50px';
    }

    chatInput.addEventListener('input', adjustInputHeight);

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn.addEventListener('click', sendMessage);

    function getVaultContext() {
      if (!useVaultRAG) return null;
      let vaultFiles = [];
      try {
        vaultFiles = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
      } catch(e) {}
      
      const textFiles = vaultFiles.filter(f => 
        (f.type && (f.type.startsWith('text/') || f.type.startsWith('application/json') || f.type.startsWith('application/xml'))) ||
        (!f.type && typeof f.content === 'string' && f.content.length > 0 && f.content.length < 50000 && !f.content.startsWith('data:'))
      );
      
      if (textFiles.length === 0) return null;
      
      let context = 'USER VAULT FILES CONTEXT:\n\n';
      textFiles.forEach(f => {
        context += `--- FILE: ${f.filename} ---\n${f.content}\n\n`;
      });
      return context;
    }

    async function sendMessage() {
      const text = chatInput.value.trim();
      if ((!text && pendingAttachments.length === 0) || isStreaming) return;

      const apiKey = localStorage.getItem(`gemini_api_key_${profile}`);
      if (!apiKey) {
        appendMessage('SYSTEM', 'ERROR: Gemini API Key missing. Configure it in the API CONFIG tab.', 'system-msg');
        return;
      }

      // Build Parts for Gemini API
      const parts = [];
      if (text) parts.push({ text });
      
      let displayHtml = formatOutput(text);
      if (pendingAttachments.length > 0) {
        displayHtml += '<div style="display:flex; gap:5px; margin-top:8px; flex-wrap:wrap;">';
        pendingAttachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.b64
            }
          });
          if (att.mimeType.startsWith('image/')) {
            displayHtml += `<img src="${att.dataUrl}" style="height:60px; border-radius:4px; border:1px solid var(--border);">`;
          } else if (att.mimeType.startsWith('video/')) {
            displayHtml += `<video src="${att.dataUrl}" style="height:60px; border-radius:4px; border:1px solid var(--border);"></video>`;
          } else {
            displayHtml += `<div style="height:60px; padding:5px; border-radius:4px; border:1px solid var(--border); background:rgba(255,255,255,0.05); font-size:0.7rem; display:flex; align-items:center;">${att.name}</div>`;
          }
        });
        displayHtml += '</div>';
      }

      const displayAuthor = currentChannel === 'shared' ? profile.toUpperCase() : 'USER';
      appendMessage(displayAuthor, displayHtml, 'user-msg', true);
      saveMessageToHistory('user', displayHtml, parts, displayAuthor);
      
      chatInput.value = '';
      adjustInputHeight();
      pendingAttachments = [];
      renderAttachmentPreviews();
      
      isStreaming = true;
      statusDot.classList.remove('online'); statusDot.classList.add('streaming');
      statusText.textContent = 'CONNECTING TO GEMINI CLUSTER...';
      sendBtn.disabled = true;

      const typingEl = appendMessage('GEMINI', '...', 'alpha-msg typing');

      try {
        let geminiHistory = [];
        const historyStr = localStorage.getItem(getMessagesKey(currentThreadId));
        if (historyStr) {
          try {
            const fullHistory = JSON.parse(historyStr);
            geminiHistory = fullHistory.map(h => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: h.parts
            }));
            geminiHistory.pop(); // Remove the one we just added to build payload manually
          } catch(e) {}
        }

        // Vault RAG Injection
        const vaultContext = getVaultContext();
        let finalParts = [...parts];
        if (vaultContext) {
          // Prepend context instructions to the user's text
          const combinedText = `[SYSTEM CONTEXT INJECTED FROM USER VAULT RAG]\n\n${vaultContext}\n\n[END CONTEXT]\n\nUSER QUERY: ${text}`;
          
          const textPartIdx = finalParts.findIndex(p => p.text);
          if (textPartIdx !== -1) {
            finalParts[textPartIdx].text = combinedText;
          } else {
            finalParts.unshift({ text: combinedText });
          }
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}`;
        
        const payload = {
          contents: [
            ...geminiHistory,
            { role: "user", parts: finalParts }
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || 'API Request Failed');
        }

        typingEl.remove();
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullReply = "";
        
        const streamEl = appendMessage('GEMINI', '', 'alpha-msg');
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          let parsedText = '';
          const allTexts = buffer.match(/"text":\s*"((?:[^"\\]|\\.)*)"/g) || [];
          allTexts.forEach(match => {
              let str = match.substring(9, match.length - 1);
              str = str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              parsedText += str;
          });
          if (parsedText) fullReply = parsedText;
          
          streamEl.querySelector('.chat-text').innerHTML = formatOutput(fullReply);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        saveMessageToHistory('model', formatOutput(fullReply), [{ text: fullReply }]);
        
        // TTS Output
        if (useTTS && window.speechSynthesis) {
          const cleanText = fullReply.replace(/[*#_`]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.1;
          utterance.volume = 0.5;
          window.speechSynthesis.speak(utterance);
        }

        try {
          playSFX('response', 0.4);
        } catch (e) {}

      } catch (err) {
        if (typingEl) typingEl.remove();
        appendMessage('ERROR', err.message, 'system-msg');
      } finally {
        isStreaming = false;
        statusDot.classList.remove('streaming'); statusDot.classList.add('online');
        statusText.textContent = 'SYSTEM READY — AWAITING INPUT';
        sendBtn.disabled = false;
      }
    }

    function appendMessage(prefix, text, className, isRawHtml = false) {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${className}`;
      
      let htmlContent = isRawHtml ? text : formatOutput(text);

      msg.innerHTML = `<span class="chat-prefix">[${prefix}]</span><span class="chat-text" style="white-space:pre-wrap;">${htmlContent}</span>`;
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

    function formatOutput(text) {
      if (typeof text !== 'string') return '';
      let html = escapeHtml(text);
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html = html.replace(/\n/g, '<br/>');
      return html;
    }

    loadThreads();

  }, 50);

  return container;
}
