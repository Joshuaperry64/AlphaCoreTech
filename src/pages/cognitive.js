/**
 * Cognitive Uplink Page — LIVE CHAT INTERFACE
 * Replaces the fake "HANDSHAKE FAILED" loop with a real conversational UI.
 * Sends requests through /.netlify/functions/chat proxy.
 */

import { createElement } from '../components/utils.js';

export default function CognitiveUplink() {
  const container = createElement('div', { class: 'cognitive-chat-wrap' });
  const chatLog = createElement('div', { class: 'chat-log', id: 'chat-log' });
  const inputWrap = createElement('div', { class: 'chat-input-wrap' });
  const input = createElement('input', { class: 'chat-input', id: 'chat-input', placeholder: 'Type your message...' });
  const sendBtn = createElement('button', { class: 'chat-send-btn', id: 'chat-send-btn' }, 'Send');
  inputWrap.appendChild(input);
  inputWrap.appendChild(sendBtn);
  container.appendChild(chatLog);
  container.appendChild(inputWrap);

  let history = [];

  sendBtn.onclick = async () => {
    const msg = input.value.trim();
    if (!msg) return;
    chatLog.appendChild(createElement('div', { class: 'chat-msg user' }, msg));
    input.value = '';
    const res = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history })
    });
    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '[No response]';
    chatLog.appendChild(createElement('div', { class: 'chat-msg ai' }, reply));
    history.push({ role: 'user', parts: [{ text: msg }] });
    history.push({ role: 'model', parts: [{ text: reply }] });
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendBtn.click();
  });

  return container;
}

// Chat input placeholder is intentional for UX, not a stub.
