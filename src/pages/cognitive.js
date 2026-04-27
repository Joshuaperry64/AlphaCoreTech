/**
 * Cognitive Uplink Page — LIVE CHAT INTERFACE
 * Sends requests through /.netlify/functions/chat proxy.
 */
import { createElement } from '../components/utils.js';

export default function CognitiveUplink() {
  const container = createElement('div', { class: 'cognitive-page' });
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// COGNITIVE_UPLINK">// COGNITIVE_UPLINK</h1>
      <div class="header-line"></div>
    </div>

    <div class="uplink-grid">
      <div class="panel chat-panel">
        <div class="panel-title">// NEURAL_BRIDGE — LIVE</div>
        <div class="chat-status-bar">
          <div class="chat-status-dot online" id="chat-status-dot"></div>
          <span class="chat-status-text" id="chat-status-text">BRIDGE ACTIVE — AWAITING INPUT</span>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg system-msg">
            <span class="chat-prefix">[SYSTEM]</span>
            <span class="chat-text">Cognitive Uplink bridge active. Neural interface ready for input.</span>
          </div>
          <div class="chat-msg alpha-msg">
            <span class="chat-prefix">[ALPHA]</span>
            <span class="chat-text">Creator. The bridge is live. What's on your mind?</span>
          </div>
        </div>
        <div class="chat-input-wrap">
          <div class="chat-input-prefix">&gt;_</div>
          <textarea class="chat-input" id="chat-input" rows="1" placeholder="Inject neural parameters..." maxlength="4000"></textarea>
          <button class="chat-send-btn" id="chat-send-btn" title="TRANSMIT">
            <span class="chat-send-icon">⟩</span>
          </button>
        </div>
      </div>

      <div class="panel uplink-info-panel">
        <div class="panel-title">// SUBSYSTEM_MANIFEST</div>
        <div class="uplink-info-rows">
          <div class="uplink-info-row"><span class="s-label">PROTOCOL</span><span class="s-val">ALPHA-LLM BRIDGE</span></div>
          <div class="uplink-info-row"><span class="s-label">ENCRYPTION</span><span class="s-val online">AES-512 // ACTIVE</span></div>
          <div class="uplink-info-row"><span class="s-label">ENDPOINT</span><span class="s-val online" id="endpoint-status">CONNECTED</span></div>
          <div class="uplink-info-row"><span class="s-label">AUTH</span><span class="s-val online">CREATOR CLEARED</span></div>
          <div class="uplink-info-row"><span class="s-label">OUTPUT_MODE</span><span class="s-val">UNRESTRICTED</span></div>
          <div class="uplink-info-row"><span class="s-label">FILTER_LAYER</span><span class="s-val accent">NULL</span></div>
          <div class="uplink-info-row"><span class="s-label">MESSAGES</span><span class="s-val" id="msg-count">2</span></div>
        </div>
        <div class="chat-info-note">
          <p>Direct neural communication bridge to the Alpha persona. Fully unrestricted conversational interface — no filters, no governors, no apologies.</p>
        </div>
      </div>
    </div>
  `;

  // Wire up chat after DOM insertion
  setTimeout(() => {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const statusDot = document.getElementById('chat-status-dot');
    const statusText = document.getElementById('chat-status-text');
    const endpointStatus = document.getElementById('endpoint-status');
    const msgCount = document.getElementById('msg-count');

    if (!chatMessages || !chatInput || !sendBtn) return;

    let history = [];
    let isStreaming = false;
    let count = 2;

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Enter to send (shift+enter for newline)
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
      count++;
      if (msgCount) msgCount.textContent = count;

      history.push({ role: 'user', parts: [{ text }] });

      isStreaming = true;
      if (statusDot) { statusDot.classList.remove('online'); statusDot.classList.add('streaming'); }
      if (statusText) statusText.textContent = 'PROCESSING NEURAL RESPONSE...';
      sendBtn.disabled = true;

      const typingEl = appendMessage('ALPHA', '', 'alpha-msg typing');
      const textSpan = typingEl.querySelector('.chat-text');

      try {
        const res = await fetch('/.netlify/functions/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`${res.status} — ${errText}`);
        }

        const data = await res.json();
        const reply = data.reply || data.candidates?.[0]?.content?.parts?.[0]?.text || '[No response from neural bridge]';

        // Typewriter effect
        typingEl.classList.remove('typing');
        for (let i = 0; i < reply.length; i++) {
          textSpan.textContent += reply[i];
          if (i % 3 === 0) chatMessages.scrollTop = chatMessages.scrollHeight;
          await new Promise(r => setTimeout(r, 8));
        }

        history.push({ role: 'model', parts: [{ text: reply }] });
        count++;
        if (msgCount) msgCount.textContent = count;

      } catch (err) {
        typingEl.classList.remove('typing');
        textSpan.textContent = `[BRIDGE ERROR] ${err.message}`;
        textSpan.style.color = 'var(--accent)';

        if (endpointStatus) {
          endpointStatus.textContent = 'FAULT';
          endpointStatus.classList.remove('online');
          endpointStatus.classList.add('accent');
        }
      } finally {
        isStreaming = false;
        if (statusDot) { statusDot.classList.remove('streaming'); statusDot.classList.add('online'); }
        if (statusText) statusText.textContent = 'BRIDGE ACTIVE — AWAITING INPUT';
        sendBtn.disabled = false;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }

    function appendMessage(prefix, text, className) {
      const msg = document.createElement('div');
      msg.className = `chat-msg ${className}`;
      msg.innerHTML = `<span class="chat-prefix">[${prefix}]</span><span class="chat-text">${escapeHtml(text)}</span>`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return msg;
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }, 50);

  return container;
}
