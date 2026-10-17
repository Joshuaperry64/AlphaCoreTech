/**
 * AlphaCore Notification & Dispatch Manager
 * Handles browser notification permissions, post-login/intro prompt UI,
 * service worker notification relays, and realtime administrative broadcast triggers.
 */

import { createElement } from './utils.js';
import { supabase } from '../lib/supabase.js';
import { showToast } from './toast.js';

let realtimeBroadcastChannel = null;

/**
 * Checks whether notifications are supported by the current client environment.
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets current notification permission status: 'default', 'granted', 'denied'
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser notification permission directly.
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      localStorage.setItem('alphacore_notifs_enabled', 'true');
      registerSubscriber(sessionStorage.getItem('current_profile') || 'Guest');
      showLocalNotification('◢ ALPHACORE TECH ◣', {
        body: 'Encrypted notification link established. You will receive system dispatches.',
        tag: 'alphacore-welcome'
      });
    }
    return res;
  } catch (err) {
    console.warn('[NOTIFICATIONS] Permission request notice:', err);
    return Notification.permission;
  }
}

/**
 * Displays a local notification using ServiceWorker registration or standard Notification constructor.
 */
export async function showLocalNotification(title, options = {}) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/Images/favico.png',
    tag: 'alphacore-alert',
    vibrate: [200, 100, 200],
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        return reg.showNotification(title, defaultOptions);
      }
    }
    // Fallback to standard constructor
    new Notification(title, defaultOptions);
  } catch (e) {
    console.warn('[NOTIFICATIONS] Show notification notice:', e);
  }
}

/**
 * Registers the subscriber profile in localStorage and Supabase/server subscriber registry.
 */
export async function registerSubscriber(profileName) {
  const subscriber = {
    profile: profileName || 'Guest',
    userAgent: navigator.userAgent,
    enabledAt: new Date().toISOString(),
    permission: Notification.permission
  };

  // Local record
  localStorage.setItem('alphacore_subscriber_data', JSON.stringify(subscriber));

  // Sync to Supabase if available
  if (supabase && typeof supabase.from === 'function') {
    try {
      await supabase.from('alphacore_subscribers').upsert({
        profile: subscriber.profile,
        user_agent: subscriber.userAgent,
        enabled_at: subscriber.enabledAt
      }, { onConflict: 'profile' });
    } catch (_) {}
  }
}

/**
 * Prompts user with a cyber-styled HUD modal after login/intro to enable browser notifications
 * if permission has not yet been resolved ('default').
 */
export function promptNotificationPermissionIfNeeded() {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'default') return;

  // Don't reprompt in the same session if dismissed
  if (sessionStorage.getItem('alphacore_notif_prompt_dismissed') === '1') return;

  // Render HUD notification banner
  const existing = document.getElementById('alphacore-notif-prompt-hud');
  if (existing) existing.remove();

  const hud = createElement('div', {
    id: 'alphacore-notif-prompt-hud',
    role: 'dialog',
    'aria-label': 'Enable Browser Notifications Prompt'
  });

  Object.assign(hud.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    maxWidth: '420px',
    width: 'calc(100% - 48px)',
    background: 'linear-gradient(135deg, rgba(0, 18, 36, 0.96) 0%, rgba(0, 5, 10, 0.98) 100%)',
    border: '1px solid rgba(0, 255, 204, 0.4)',
    boxShadow: '0 0 25px rgba(0, 255, 204, 0.25), inset 0 0 15px rgba(0, 255, 204, 0.08)',
    borderRadius: '10px',
    padding: '18px 20px',
    zIndex: '99999',
    backdropFilter: 'blur(12px)',
    fontFamily: "'Share Tech Mono', monospace",
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  hud.innerHTML = `
    <div style="display:flex; align-items:flex-start; gap:14px;">
      <div style="font-size:1.8rem; line-height:1; filter:drop-shadow(0 0 8px #00ffcc);">⚡</div>
      <div style="flex:1;">
        <div style="font-family:'Orbitron', sans-serif; font-size:0.85rem; font-weight:700; color:#00ffcc; letter-spacing:1.5px; margin-bottom:6px;">
          SYSTEM COMM LINK // NOTIFICATIONS
        </div>
        <div style="color:#94a3b8; font-size:0.78rem; line-height:1.5; margin-bottom:14px;">
          Authorize browser notifications to receive encrypted system dispatches and broadcast alerts from the Architect.
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button id="notif-prompt-enable-btn" class="aim-btn aim-btn-sm" style="background:rgba(0, 255, 204, 0.15); border-color:#00ffcc; color:#00ffcc; font-family:'Orbitron', sans-serif; font-size:0.75rem; font-weight:700; padding:6px 14px; border-radius:4px; cursor:pointer;">
            ENABLE ALERTS
          </button>
          <button id="notif-prompt-dismiss-btn" class="aim-btn aim-btn-sm" style="background:rgba(255, 255, 255, 0.05); border-color:#475569; color:#94a3b8; font-family:'Orbitron', sans-serif; font-size:0.75rem; padding:6px 12px; border-radius:4px; cursor:pointer;">
            DISMISS
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(hud);

  const enableBtn = hud.querySelector('#notif-prompt-enable-btn');
  const dismissBtn = hud.querySelector('#notif-prompt-dismiss-btn');

  if (enableBtn) {
    enableBtn.onclick = async () => {
      hud.remove();
      const status = await requestNotificationPermission();
      if (status === 'granted') {
        showToast('SUCCESS', 'Encrypted browser notifications activated');
      } else {
        showToast('WARN', 'Notification permission was not granted');
      }
    };
  }

  if (dismissBtn) {
    dismissBtn.onclick = () => {
      sessionStorage.setItem('alphacore_notif_prompt_dismissed', '1');
      hud.remove();
    };
  }
}

/**
 * Initializes realtime listener for incoming administrative broadcasts.
 */
export function initBroadcastListener() {
  if (realtimeBroadcastChannel || !supabase || typeof supabase.channel !== 'function') return;

  try {
    realtimeBroadcastChannel = supabase
      .channel('alphacore_broadcast_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alphacore_broadcasts' }, (payload) => {
        if (payload.new) {
          handleIncomingBroadcast(payload.new);
        }
      })
      .on('broadcast', { event: 'dispatch' }, (payload) => {
        if (payload.payload) {
          handleIncomingBroadcast(payload.payload);
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('[NOTIFICATIONS] Realtime broadcast subscribe note:', err);
  }
}

/**
 * Handles incoming broadcast payload: displays browser notification and in-app toast.
 */
export function handleIncomingBroadcast(broadcast) {
  if (!broadcast) return;
  const currentProfile = sessionStorage.getItem('current_profile') || 'Guest';

  // Check target audience
  if (broadcast.target && broadcast.target !== 'ALL') {
    const targetNorm = String(broadcast.target).trim().toLowerCase();
    const currNorm = String(currentProfile).trim().toLowerCase();
    if (targetNorm !== currNorm) return;
  }

  const title = broadcast.title || '◢ ALPHACORE TECH // BROADCAST ◣';
  const body = broadcast.message || broadcast.body || 'New transmission received.';

  // 1. Show OS browser notification if allowed
  if (isNotificationSupported() && Notification.permission === 'granted') {
    showLocalNotification(title, {
      body,
      tag: `alphacore-broadcast-${broadcast.id || Date.now()}`,
      data: { url: broadcast.url || '/#/overview' }
    });
  }

  // 2. Also trigger in-app toast
  showToast('INFO', `[BROADCAST] ${title}: ${body}`);
}

/**
 * Dispatches an administrative broadcast message to all users or specific targets.
 * 
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.target='ALL']
 * @param {string} [options.urgency='STANDARD']
 * @param {string} [options.url='/#/overview']
 */
export async function dispatchBroadcast({ title, message, target = 'ALL', urgency = 'STANDARD', url = '/#/overview' }) {
  const payload = {
    id: `bc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: title || '◢ ALPHACORE TECH // ALERT ◣',
    message,
    target,
    urgency,
    url,
    sender: sessionStorage.getItem('current_profile') || 'Architect',
    created_at: new Date().toISOString()
  };

  // 1. Direct Supabase insertion (triggers Realtime for all clients)
  let savedToCloud = false;
  if (supabase && typeof supabase.from === 'function') {
    try {
      const res = await supabase.from('alphacore_broadcasts').insert(payload);
      if (!res.error) savedToCloud = true;
    } catch (_) {}
  }

  // 2. Fallback to Supabase Realtime broadcast channel send
  if (realtimeBroadcastChannel && typeof realtimeBroadcastChannel.send === 'function') {
    try {
      realtimeBroadcastChannel.send({
        type: 'broadcast',
        event: 'dispatch',
        payload
      });
    } catch (_) {}
  }

  // 3. Fallback to local dispatch so the sender also sees confirmation immediately
  handleIncomingBroadcast(payload);

  return { success: true, payload, savedToCloud };
}
