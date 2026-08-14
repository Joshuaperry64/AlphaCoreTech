/**
 * AlphaCore PIN Authentication System — v2.0
 * Clean rewrite: no profile dropdown, pure server-side validation.
 * User enters their PIN directly; server returns who they are.
 */

import { logAction } from './logger.js';
import { pushToServer } from './db_sync.js';

// ─── Local PIN Cache (for offline / post-sync use) ───────────────────────────

export function getPins() {
  try {
    const data = localStorage.getItem('alphacore_pins');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePins(pins, authPinOverride = null) {
  localStorage.setItem('alphacore_pins', JSON.stringify(pins));
  pushToServer('pins', pins, authPinOverride);
}

export function addPin({ pin, type, durationSeconds, label, roles = [] }) {
  const pins = getPins();
  const newPin = { pin, type, label, roles, createdAt: Date.now() };
  if (type === 'one-time') newPin.used = false;
  if (type === 'temporary') {
    newPin.expiresAt = Date.now() + (parseInt(durationSeconds) || 300) * 1000;
  }
  pins.push(newPin);
  savePins(pins);
  return newPin;
}

export function revokePin(pinVal) {
  savePins(getPins().filter(p => p.pin !== pinVal));
}

// ─── Server Validation ────────────────────────────────────────────────────────

export async function validatePin(pinVal, requiredRole = null) {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinVal, requiredRole })
    });
    if (!res.ok) return { valid: false, reason: 'SERVER ERROR' };
    const result = await res.json();

    // Clean up OTP from local cache if used
    if (result.valid && result.isOtp) {
      savePins(getPins().filter(p => p.pin !== pinVal));
    }

    return result;
  } catch {
    return { valid: false, reason: 'NETWORK ERROR' };
  }
}

// ─── PIN Pad UI Component ─────────────────────────────────────────────────────

/**
 * Builds a standalone cyberpunk PIN pad.
 *
 * @param {Object} opts
 * @param {Function} opts.onSuccess  - Called with the server's pinObj on success
 * @param {string}  [opts.authKey]   - sessionStorage key to set on success
 * @param {string}  [opts.requiredRole] - If set, server enforces this role
 * @param {string}  [opts.title]
 * @param {string}  [opts.subtitle]
 * @param {string}  [opts.icon]
 */
export function buildPinPad({
  onSuccess,
  authKey = null,
  requiredRole = null,
  title = '// IDENTITY_VERIFICATION',
  subtitle = 'ENTER YOUR ACCESS PIN',
  icon = '⟁'
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'aim-pin-wrap';

  wrap.innerHTML = `
    <div class="aim-pin-box" id="aim-pin-box-inner">
      <div class="aim-pin-header">
        <div class="aim-pin-icon">${icon}</div>
        <div class="aim-pin-title">${title}</div>
        <div class="aim-pin-subtitle">${subtitle}</div>
      </div>

      <div class="aim-pin-display-wrap">
        <div class="aim-pin-display" id="aim-pin-display"></div>
        <div class="aim-pin-feedback" id="aim-pin-feedback">> AWAITING INPUT</div>
      </div>

      <div class="aim-pinpad-grid">
        <button class="aim-pad-btn" data-val="1">1</button>
        <button class="aim-pad-btn" data-val="2">2</button>
        <button class="aim-pad-btn" data-val="3">3</button>
        <button class="aim-pad-btn" data-val="4">4</button>
        <button class="aim-pad-btn" data-val="5">5</button>
        <button class="aim-pad-btn" data-val="6">6</button>
        <button class="aim-pad-btn" data-val="7">7</button>
        <button class="aim-pad-btn" data-val="8">8</button>
        <button class="aim-pad-btn" data-val="9">9</button>
        <button class="aim-pad-btn aim-pad-btn-clear" id="aim-pad-clear">CLR</button>
        <button class="aim-pad-btn" data-val="0">0</button>
        <button class="aim-pad-btn aim-pad-btn-enter" id="aim-pad-enter">ENT</button>
      </div>
    </div>
  `;

  let currentPin = '';
  let locked = false;

  const pinBox  = wrap.querySelector('#aim-pin-box-inner');
  const display  = wrap.querySelector('#aim-pin-display');
  const feedback = wrap.querySelector('#aim-pin-feedback');

  // ── Display helpers ────────────────────────────────────────────────────────
  function renderDots() {
    display.innerHTML = '';
    for (let i = 0; i < currentPin.length; i++) {
      const dot = document.createElement('span');
      dot.className = 'aim-pin-dot filled';
      display.appendChild(dot);
    }
  }

  function setFeedback(msg, state = '') {
    feedback.textContent = `> ${msg}`;
    feedback.className = `aim-pin-feedback${state ? ' aim-feedback-' + state : ''}`;
  }

  // ── Input handlers ─────────────────────────────────────────────────────────
  function handleInput(val) {
    if (locked) return;
    if (currentPin.length >= 12) return;
    currentPin += val;
    renderDots();
    setFeedback('ENTERING PIN...');
  }

  function handleClear() {
    if (locked) return;
    currentPin = '';
    renderDots();
    setFeedback('AWAITING INPUT');
  }

  function handleBackspace() {
    if (locked || !currentPin.length) return;
    currentPin = currentPin.slice(0, -1);
    renderDots();
    setFeedback(currentPin.length ? 'ENTERING PIN...' : 'AWAITING INPUT');
  }

  async function handleEnter() {
    if (locked) return;
    if (!currentPin) {
      setFeedback('ENTER A PIN FIRST', 'error');
      return;
    }

    locked = true;
    setFeedback('VERIFYING...', '');

    const result = await validatePin(currentPin, requiredRole);

    if (result.valid) {
      setFeedback('ACCESS GRANTED. DECRYPTING...', 'ok');
      pinBox.classList.add('aim-access-granted');
      window.removeEventListener('keydown', keyHandler);

      logAction('AUTH_SUCCESS', { label: result.pinObj?.label });

      setTimeout(() => {
        if (authKey) sessionStorage.setItem(authKey, '1');
        if (result.pinObj) {
          sessionStorage.setItem('current_profile', result.pinObj.label);
          if (!result.isOtp) sessionStorage.setItem('current_pin', result.pinObj.pin);
          if (result.pinObj.roles) {
            result.pinObj.roles.forEach(r => sessionStorage.setItem(r + '_authenticated', '1'));
          }
        }
        onSuccess(result);
      }, 1000);
    } else {
      logAction('AUTH_FAILED', { reason: result.reason });
      setFeedback(result.reason || 'ACCESS DENIED', 'error');
      pinBox.classList.add('aim-shake');
      setTimeout(() => {
        pinBox.classList.remove('aim-shake');
        currentPin = '';
        renderDots();
        locked = false;
        setFeedback('AWAITING INPUT');
      }, 700);
    }
  }

  // ── Button events ──────────────────────────────────────────────────────────
  wrap.querySelectorAll('.aim-pad-btn[data-val]').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); handleInput(btn.dataset.val); };
  });
  wrap.querySelector('#aim-pad-clear').onclick = e => { e.stopPropagation(); handleClear(); };
  wrap.querySelector('#aim-pad-enter').onclick = e => { e.stopPropagation(); handleEnter(); };

  // ── Keyboard events ────────────────────────────────────────────────────────
  function keyHandler(e) {
    if (e.key >= '0' && e.key <= '9') handleInput(e.key);
    else if (e.key === 'Backspace') handleBackspace();
    else if (e.key === 'Escape' || e.key === 'Delete') handleClear();
    else if (e.key === 'Enter') handleEnter();
  }
  window.addEventListener('keydown', keyHandler);

  // Auto-cleanup when removed from DOM
  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      window.removeEventListener('keydown', keyHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return wrap;
}

// ─── requireAuth helper (used by individual pages) ────────────────────────────

export function requireAuth(container, options) {
  if (options.authKey && sessionStorage.getItem(options.authKey)) {
    options.onSuccess();
  } else {
    container.appendChild(buildPinPad(options));
  }
}
