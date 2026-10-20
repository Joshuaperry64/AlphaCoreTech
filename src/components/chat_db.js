/**
 * AlphaCore Chat IndexedDB & LocalStorage Resilience Substrate
 * Guarantees permanent, zero-data-loss persistence for Global Comm Link (Shared Matrix).
 */

const DB_NAME = 'AlphaCoreChatDB';
const DB_VERSION = 1;
const STORE_NAME = 'shared_messages';
export const SHARED_STORAGE_KEY = 'alphacore_shared_chat_history';
export const LEGACY_STORAGE_KEY = 'gemini_chat_thread_shared_main';

function openChatDB() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Synchronously retrieves all shared messages currently in LocalStorage.
 */
export function getLocalSharedMessages() {
  try {
    const raw = localStorage.getItem(SHARED_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persists a message to LocalStorage (both primary and legacy keys) and asynchronously to IndexedDB.
 */
export async function persistSharedMessage(msg) {
  if (!msg || !msg.text) return null;

  const normalized = {
    id: msg.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    role: msg.role || 'user',
    author: (msg.author || (msg.role === 'model' ? 'ALPHA' : 'USER')).toUpperCase(),
    text: msg.text,
    timestamp: msg.timestamp || (msg.created_at ? new Date(msg.created_at).getTime() : Date.now()),
    created_at: msg.created_at || new Date().toISOString(),
    channel: 'shared'
  };

  // 1. Update LocalStorage immediately
  try {
    const history = getLocalSharedMessages();
    const cleanText = (normalized.text || '').trim();
    const exists = history.some(m => m.id === normalized.id || (m.author === normalized.author && (m.text || '').trim() === cleanText));
    if (!exists) {
      history.push(normalized);
      // Retain last 500 messages to prevent excessive memory usage
      if (history.length > 500) history.shift();
      const serialized = JSON.stringify(history);
      localStorage.setItem(SHARED_STORAGE_KEY, serialized);
      localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
    }
  } catch (err) {
    console.warn('[CHAT_STORE] LocalStorage write note:', err);
  }

  // 2. Asynchronously write to IndexedDB
  try {
    const db = await openChatDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(normalized);
    }
  } catch (err) {
    console.warn('[CHAT_STORE] IndexedDB write note:', err);
  }

  return normalized;
}

/**
 * Batch-persists an array of messages (e.g. from Supabase or Server sync).
 */
export async function batchPersistSharedMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return getLocalSharedMessages();

  const localHistory = getLocalSharedMessages();
  const map = new Map();

  localHistory.forEach(m => {
    const key = m.id || `${m.author}_${(m.text || '').trim()}`;
    map.set(key, m);
  });

  messages.forEach(msg => {
    if (!msg || !msg.text) return;
    const normalized = {
      id: msg.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      role: msg.role || 'user',
      author: (msg.author || (msg.role === 'model' ? 'ALPHA' : 'USER')).toUpperCase(),
      text: msg.text,
      timestamp: msg.timestamp || (msg.created_at ? new Date(msg.created_at).getTime() : Date.now()),
      created_at: msg.created_at || new Date().toISOString(),
      channel: 'shared'
    };
    const key = normalized.id || `${normalized.author}_${(normalized.text || '').trim()}`;
    map.set(key, normalized);
  });

  const merged = Array.from(map.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  if (merged.length > 500) merged.splice(0, merged.length - 500);

  try {
    const serialized = JSON.stringify(merged);
    localStorage.setItem(SHARED_STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('[CHAT_STORE] Batch LocalStorage write note:', err);
  }

  try {
    const db = await openChatDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      merged.forEach(m => store.put(m));
    }
  } catch (err) {
    console.warn('[CHAT_STORE] Batch IndexedDB write note:', err);
  }

  return merged;
}

/**
 * Restores messages from IndexedDB if LocalStorage was wiped or cleared.
 */
export async function restoreSharedMessagesFromIndexedDB() {
  try {
    const db = await openChatDB();
    if (!db) return getLocalSharedMessages();

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const idbMessages = Array.isArray(req.result) ? req.result : [];
        if (idbMessages.length > 0) {
          const merged = batchPersistSharedMessages(idbMessages);
          resolve(merged);
        } else {
          resolve(getLocalSharedMessages());
        }
      };
      req.onerror = () => resolve(getLocalSharedMessages());
    });
  } catch {
    return getLocalSharedMessages();
  }
}
