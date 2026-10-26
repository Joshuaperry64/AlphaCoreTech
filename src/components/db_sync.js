/**
 * AlphaCore State Sync Component — Unified Cross-Device Persistence via Supabase & Express
 */
import { apiUrl } from './api.js';
import { supabase } from '../lib/supabase.js';

let realtimeChannel = null;

/**
 * Synchronize PINs and system settings from Supabase (primary) with fallback to server API.
 */
export async function syncFromServer() {
  const pin = sessionStorage.getItem('current_pin');

  // 1. Primary: Direct Cloud Substrate Sync via Supabase
  if (supabase && typeof supabase.from === 'function') {
    try {
      const [pinsRes, settingsRes] = await Promise.all([
        supabase.from('alphacore_pins').select('*'),
        supabase.from('alphacore_settings').select('*').eq('id', 'global').maybeSingle()
      ]);

      if (pinsRes.data && pinsRes.data.length > 0) {
        const normalizedPins = pinsRes.data.map(p => ({
          pin: p.pin,
          label: p.label,
          type: p.type || 'permanent',
          roles: Array.isArray(p.roles) ? p.roles : (typeof p.roles === 'string' ? JSON.parse(p.roles) : []),
          mustChangePin: Boolean(p.must_change_pin),
          createdAt: p.created_at ? new Date(p.created_at).getTime() : Date.now(),
          pin_history: p.pin_history || []
        }));
        localStorage.setItem('alphacore_pins', JSON.stringify(normalizedPins));
        window.dispatchEvent(new CustomEvent('alphacore_pins_updated', { detail: normalizedPins }));
      }

      if (settingsRes.data && settingsRes.data.data) {
        const remoteSettings = settingsRes.data.data;
        let localSettings = {};
        try {
          localSettings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
        } catch {}
        const mergedSettings = { ...localSettings, ...remoteSettings };
        localStorage.setItem('alphacore_modal_settings', JSON.stringify(mergedSettings));
        window.dispatchEvent(new CustomEvent('alphacore_settings_updated', { detail: mergedSettings }));
      }
    } catch (sbErr) {
      console.warn('[SUPABASE_SYNC] Cloud substrate read note:', sbErr.message || sbErr);
    }
  }

  // 2. Secondary: Fallback to Express / Netlify API
  if (!pin) return;
  try {
    const [setRes, pinRes] = await Promise.all([
      fetch(apiUrl('/api/settings'), { headers: { 'x-user-pin': pin } }),
      fetch(apiUrl('/api/pins'), { headers: { 'x-user-pin': pin } })
    ]);
    
    if (setRes && setRes.ok) {
      const settings = await setRes.json();
      let currentSettings = {};
      try {
        currentSettings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
      } catch {}
      const merged = { ...currentSettings, ...settings };
      localStorage.setItem('alphacore_modal_settings', JSON.stringify(merged));
    }
    
    if (pinRes && pinRes.ok) {
      const pins = await pinRes.json();
      localStorage.setItem('alphacore_pins', JSON.stringify(pins));
    }
  } catch (err) {
    console.warn('[SERVER_SYNC] Server-backed sync note:', err.message || err);
  }
}

/**
 * Push updated PINs or Settings across devices via Supabase and Express API.
 */
export function pushToServer(endpoint, data, authPinOverride = null) {
  const pin = authPinOverride || sessionStorage.getItem('current_pin');
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  // 1. Primary: Direct Cloud Substrate Sync via Supabase
  if (supabase && typeof supabase.from === 'function') {
    if (cleanPath.includes('settings')) {
      supabase.from('alphacore_settings').upsert({
        id: 'global',
        data: data,
        updated_at: new Date().toISOString()
      }).then((res) => {
        if (res && res.error) console.warn('[SUPABASE_PUSH] Settings upsert note:', res.error.message);
      }).catch(() => {});
    } else if (cleanPath.includes('pins') && Array.isArray(data)) {
      const dbRows = data.map(p => ({
        pin: p.pin,
        label: p.label || 'Operator',
        type: p.type || 'permanent',
        roles: Array.isArray(p.roles) ? p.roles : [],
        must_change_pin: Boolean(p.mustChangePin),
        pin_history: p.pin_history || [],
        updated_at: new Date().toISOString()
      }));
      supabase.from('alphacore_pins').upsert(dbRows).then((res) => {
        if (res && res.error) console.warn('[SUPABASE_PUSH] Pins upsert note:', res.error.message);
      }).catch(() => {});
    }
  }

  // 2. Secondary: Fallback to Express / Netlify API
  if (!pin) return;
  const req = fetch(apiUrl(cleanPath), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-pin': pin
    },
    body: JSON.stringify(data)
  });
  if (req && typeof req.catch === 'function') {
    req.catch(err => console.warn(`Failed to push ${cleanPath} to server:`, err.message || err));
  }
}

/**
 * Initialize Realtime Subscriptions for multi-device live sync.
 */
export function initRealtimeSync() {
  if (typeof process !== 'undefined' && process.env && process.env.VITEST) return;
  if (!supabase || typeof supabase.channel !== 'function' || realtimeChannel) return;

  try {
    realtimeChannel = supabase
      .channel('alphacore_cross_device_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alphacore_pins' }, () => {
        syncFromServer();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alphacore_settings' }, (payload) => {
        if (payload.new && payload.new.data) {
          localStorage.setItem('alphacore_modal_settings', JSON.stringify(payload.new.data));
          window.dispatchEvent(new CustomEvent('alphacore_settings_updated', { detail: payload.new.data }));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alphacore_chat' }, (payload) => {
        if (payload.new) {
          window.dispatchEvent(new CustomEvent('alphacore_chat_message', { detail: payload.new }));
        }
      })
      .on('broadcast', { event: 'chat_message' }, (payload) => {
        if (payload && payload.payload) {
          window.dispatchEvent(new CustomEvent('alphacore_chat_message', { detail: payload.payload }));
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('[REALTIME_SYNC] Channel initialization note:', err.message || err);
  }
}

/**
 * Broadcast a real-time message across all active cross-device sessions via Supabase WebSockets.
 */
export function broadcastChatMessage(msg) {
  if (typeof process !== 'undefined' && process.env && process.env.VITEST) return;
  if (!supabase || typeof supabase.channel !== 'function') return;
  if (!realtimeChannel) {
    initRealtimeSync();
  }
  if (realtimeChannel) {
    try {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: msg
      }).catch(err => console.warn('[BROADCAST_CHAT] Send error:', err));
    } catch (e) {
      console.warn('[BROADCAST_CHAT] Send note:', e);
    }
  }
}

