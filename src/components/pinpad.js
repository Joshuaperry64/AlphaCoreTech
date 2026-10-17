/**
 * AlphaCore PIN Authentication System — v4.0
 * Supports Netlify/Express Serverless /api/auth with client-side localStorage fallback.
 */

import { apiUrl } from './api.js';
import { logAction } from './logger.js';
import { pushToServer } from './db_sync.js';
import { playSFX } from './audio.js';
import { showModal } from './modal.js';

// ─── Default Hardcoded PIN Registry ──────────────────────────────────────────

const DEFAULT_PINS = [
  { pin: '672167566', type: 'permanent', label: 'Architect', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() },
  { pin: '6969',      type: 'permanent', label: 'DoeBoy',    roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() },
  { pin: '20022005',  type: 'permanent', label: 'J. P.',     roles: ['aimodals', 'generate'], createdAt: Date.now() },
  { pin: '1990',      type: 'permanent', label: 'Fisherman', roles: ['aimodals', 'generate'], createdAt: Date.now() }
];

// ─── PIN Management Functions ────────────────────────────────────────────────

export function getPins() {
  const stored = localStorage.getItem('alphacore_pins');
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  localStorage.setItem('alphacore_pins', JSON.stringify(DEFAULT_PINS));
  return DEFAULT_PINS;
}

export function savePins(pins) {
  localStorage.setItem('alphacore_pins', JSON.stringify(pins));
  try {
    pushToServer('/api/pins', pins);
  } catch {}
}

export function addPin({ pin, type, label, roles = [], durationSeconds = 300, mustChangePin = false }) {
  const pins = getPins();
  const newPinObj = {
    pin,
    type,
    label,
    roles: Array.isArray(roles) ? roles : [],
    createdAt: Date.now()
  };

  if (mustChangePin) {
    newPinObj.mustChangePin = true;
  }

  if (type === 'one-time') {
    newPinObj.used = false;
  } else if (type === 'temporary') {
    let dur = parseInt(durationSeconds, 10);
    if (isNaN(dur) || dur <= 0) dur = 300;
    newPinObj.expiresAt = Date.now() + dur * 1000;
  }

  pins.push(newPinObj);
  savePins(pins);
  return newPinObj;
}

export function updatePin(pinVal, updates) {
  const pins = getPins();
  const idx = pins.findIndex(p => p.pin === pinVal);
  if (idx !== -1) {
    pins[idx] = { ...pins[idx], ...updates };
    savePins(pins);
    return pins[idx];
  }
  return null;
}

export function revokePin(pinVal) {
  const pins = getPins().filter(p => p.pin !== pinVal);
  savePins(pins);
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validatePin(pinVal, requiredRole = null) {
  try {
    const res = await fetch(apiUrl('/api/auth'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinVal, requiredRole })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.isOtp && data.valid) {
        const pins = getPins();
        savePins(pins.filter(p => p.pin !== pinVal));
      }
      return data;
    }
  } catch (e) {
    // Fall back to local validation
  }

  const pins = getPins();
  const found = pins.find(p => p.pin === pinVal);

  if (!found) {
    return { valid: false, reason: 'ACCESS DENIED' };
  }

  if (requiredRole && (!found.roles || !found.roles.includes(requiredRole))) {
    return { valid: false, reason: `INSUFFICIENT CLEARANCE: REQUIRES [${requiredRole.toUpperCase()}]` };
  }

  if (found.mustChangePin) {
    return { valid: true, pinObj: found, requireNewPin: true };
  }

  if (found.type === 'one-time') {
    if (found.used) {
      return { valid: false, reason: 'ONE-TIME PIN EXPIRED' };
    }
    found.used = true;
    savePins(pins.filter(p => p.pin !== pinVal));
    return { valid: true, pinObj: found, isOtp: true };
  }

  if (found.type === 'temporary') {
    if (Date.now() > found.expiresAt) {
      return { valid: false, reason: 'TEMPORARY PIN EXPIRED' };
    }
    return { valid: true, pinObj: found };
  }

  return { valid: true, pinObj: found };
}


// ─── PIN Pad UI Component ─────────────────────────────────────────────────────

export function buildPinPad({
  onSuccess,
  authKey = null,
  requiredRole = null,
  title = '// ALPHACORE \\\\ [IDENTITY VERIFICATION]',
  subtitle = 'ENTER YOUR ACCESS PIN',
  icon = '<img src="/Images/ALPHA-LOGO.png" class="aim-pin-wolf-icon" alt="AlphaCore" style="width: 34px; height: 34px; object-fit: contain; filter: drop-shadow(0 0 8px rgba(0, 184, 255, 0.7)); display: inline-block; vertical-align: middle;" />',
  isLoginScreen = false
} = {}) {
  const wrap = document.createElement('div');
  wrap.className = `aim-pin-wrap${isLoginScreen ? ' aim-login-terminal-screen' : ''}`;

  let titleHtml = title;
  if (!title || title.includes('IDENTITY_VERIFICATION') || title.includes('IDENTITY VERIFICATION') || title.includes('ALPHACORE')) {
    titleHtml = `<div class="aim-pin-title-row">// ALPHACORE \\\\</div><div class="glitch" data-text="[IDENTITY VERIFICATION]">[IDENTITY VERIFICATION]</div>`;
  }

  wrap.innerHTML = `
    <style>
      .aim-login-terminal-screen {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .aim-forbidden-terminal-box {
        max-width: 1100px !important;
        width: 95% !important;
        background: rgba(0, 10, 20, 0.78) !important;
        border: 1px solid rgba(0, 255, 204, 0.35) !important;
        box-shadow: 0 0 50px rgba(0, 255, 204, 0.15), inset 0 0 30px rgba(0, 184, 255, 0.08) !important;
        backdrop-filter: blur(12px) !important;
        padding: 35px 40px !important;
        border-radius: 8px !important;
      }
      .aim-forbidden-brand {
        text-align: center;
        margin-bottom: 25px;
      }
      .aim-forbidden-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.85rem;
        font-weight: 900;
        letter-spacing: 12px;
        color: #ffffff;
        margin: 4px 0;
        text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
      }
      .aim-forbidden-subtitle {
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.85rem;
        letter-spacing: 5px;
        color: #00ffcc;
        font-weight: bold;
        text-shadow: 0 0 10px rgba(0, 255, 204, 0.6);
      }
      .aim-forbidden-columns {
        display: flex;
        gap: 60px;
        align-items: center;
        justify-content: center;
        width: 100%;
      }
      .aim-forbidden-col-left {
        flex: 1.15;
        max-width: 500px;
        text-align: left;
      }
      .aim-forbidden-col-right {
        flex: 0.85;
        max-width: 360px;
      }
      .aim-forbidden-label {
        display: block;
        color: #00ffcc;
        font-size: 0.8rem;
        font-weight: bold;
        letter-spacing: 2.5px;
        font-family: 'Share Tech Mono', monospace;
        margin-bottom: 8px;
        text-shadow: 0 0 8px rgba(0, 255, 204, 0.4);
      }
      .aim-forbidden-select {
        min-height: 50px;
        background: rgba(0, 25, 40, 0.65) !important;
        color: #00ffcc !important;
        border: 1px solid rgba(0, 255, 204, 0.4) !important;
        border-radius: 4px !important;
        padding: 12px 16px !important;
        font-size: 0.95rem !important;
        font-weight: bold !important;
        font-family: 'Share Tech Mono', monospace !important;
        letter-spacing: 2px !important;
        width: 100% !important;
        box-sizing: border-box;
      }
      .aim-forbidden-select:hover {
        border-color: #00ffcc !important;
        background: rgba(0, 35, 55, 0.85) !important;
      }
      .aim-forbidden-auth-btn {
        width: 100%;
        min-height: 64px;
        margin-top: 22px;
        background: linear-gradient(90deg, rgba(0, 255, 204, 0.18), rgba(0, 184, 255, 0.28)) !important;
        border: 2px solid #00ffcc !important;
        color: #ffffff !important;
        font-family: 'Orbitron', sans-serif !important;
        font-size: 1.15rem !important;
        font-weight: 900 !important;
        letter-spacing: 4px !important;
        cursor: pointer;
        border-radius: 6px !important;
        text-shadow: 0 0 12px #00ffcc !important;
        box-shadow: 0 0 20px rgba(0, 255, 204, 0.25) !important;
        transition: all 0.2s ease !important;
      }
      .aim-forbidden-auth-btn:hover {
        background: linear-gradient(90deg, rgba(0, 255, 204, 0.35), rgba(0, 184, 255, 0.45)) !important;
        box-shadow: 0 0 30px rgba(0, 255, 204, 0.5) !important;
        transform: translateY(-1px);
      }
      @media (max-width: 860px) {
        .aim-forbidden-columns {
          flex-direction: column !important;
          gap: 25px !important;
        }
        .aim-forbidden-col-left, .aim-forbidden-col-right {
          max-width: 100% !important;
          width: 100% !important;
        }
      }
    </style>

    <div class="aim-pin-box ${isLoginScreen ? 'aim-forbidden-terminal-box' : ''}">
      <!-- Main PIN Pad View -->
      <form id="pin-login-form" class="aim-pin-box-inner" autocomplete="off" onsubmit="return false;">
        ${isLoginScreen ? `
          <div class="aim-forbidden-brand">
            <img src="/Images/ALPHA-LOGO.png" class="aim-pin-wolf-icon intro-logo-glow" alt="AlphaCore Logo" style="width: 100px; height: 100px; object-fit: contain; margin-bottom: 8px;" />
            <h1 class="aim-forbidden-title">FORBIDDEN ARCHIVE</h1>
            <div class="aim-forbidden-subtitle">SECURE ACCESS TERMINAL</div>
          </div>
          <div class="aim-forbidden-columns">
            <div class="aim-forbidden-col-left">
              <div class="aim-forbidden-field">
                <label class="aim-forbidden-label" for="operator-selector">▶ OPERATOR IDENTIFIER</label>
                <select id="operator-selector" class="aim-input aim-forbidden-select">
                  <option value="Architect" selected>Joshua (Architect)</option>
                  <option value="DoeBoy">DoeBoy</option>
                  <option value="J. P.">J. P.</option>
                  <option value="Fisherman">Fisherman</option>
                  <option value="Guest">Guest (Preview Mode)</option>
                </select>
              </div>

              <div class="aim-forbidden-field" style="margin-top: 18px;">
                <label class="aim-forbidden-label">▶ SECURITY AUTHENTICATION PIN</label>
                <input 
                  type="password" 
                  id="secure-pin-input" 
                  name="pin" 
                  autocomplete="off" 
                  maxlength="12"
                  inputmode="numeric"
                  tabindex="0"
                  aria-label="Secure Access PIN"
                  style="opacity: 0; position: absolute; z-index: -1; width: 1px; height: 1px; pointer-events: none;"
                />
                <div class="aim-pin-display-wrap" style="margin-top: 6px;">
                  <div class="aim-pin-display" id="aim-pin-display" aria-hidden="true"></div>
                  <div class="aim-pin-feedback" id="aim-pin-feedback" aria-live="polite" role="status">> AWAITING INPUT</div>
                </div>
              </div>

              <button type="submit" class="aim-btn aim-pad-btn-action aim-forbidden-auth-btn" id="aim-pad-enter" aria-label="Submit PIN">
                ◢  AUTHENTICATE  ◣
              </button>

              <div style="display: flex; gap: 10px; margin-top: 14px; width: 100%;">
                <button type="button" class="aim-btn" id="aim-pin-bypass-btn" aria-label="Bypass Authentication" style="flex: 1; padding: 10px; background: rgba(0, 150, 255, 0.1); border: 1px solid rgba(0, 150, 255, 0.4); color: #00b8ff; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer;">
                  ⚡ BYPASS
                </button>
                <button type="button" class="aim-btn" id="aim-pin-request-btn" aria-label="Request Access Profile" style="flex: 1; padding: 10px; background: rgba(255, 150, 0, 0.1); border: 1px solid rgba(255, 150, 0, 0.4); color: #ff9600; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px; border-radius: 4px; cursor: pointer;">
                  📝 REQUEST ACCESS
                </button>
              </div>
            </div>

            <div class="aim-forbidden-col-right">
              <div class="aim-pinpad-grid" role="group" aria-label="PIN Keypad" style="gap: 12px;">
                <button type="button" class="aim-pad-btn" data-val="1" aria-label="Digit 1">1</button>
                <button type="button" class="aim-pad-btn" data-val="2" aria-label="Digit 2">2</button>
                <button type="button" class="aim-pad-btn" data-val="3" aria-label="Digit 3">3</button>
                <button type="button" class="aim-pad-btn" data-val="4" aria-label="Digit 4">4</button>
                <button type="button" class="aim-pad-btn" data-val="5" aria-label="Digit 5">5</button>
                <button type="button" class="aim-pad-btn" data-val="6" aria-label="Digit 6">6</button>
                <button type="button" class="aim-pad-btn" data-val="7" aria-label="Digit 7">7</button>
                <button type="button" class="aim-pad-btn" data-val="8" aria-label="Digit 8">8</button>
                <button type="button" class="aim-pad-btn" data-val="9" aria-label="Digit 9">9</button>
                <button type="button" class="aim-pad-btn aim-pad-btn-clear" id="aim-pad-clear" aria-label="Clear Input">CLR</button>
                <button type="button" class="aim-pad-btn" data-val="0" aria-label="Digit 0">0</button>
                <button type="button" class="aim-pad-btn aim-pad-btn-back" id="aim-pad-back" aria-label="Backspace">⌫</button>
              </div>
            </div>
          </div>
        ` : `
          ${icon ? `<div class="aim-pin-icon" aria-hidden="true">${icon}</div>` : ''}
          <h2 class="aim-pin-title">${titleHtml}</h2>
          <p class="aim-pin-subtitle">${subtitle}</p>

          <!-- Native hidden input for browser automation & physical keyboard synchronization -->
          <input 
            type="password" 
            id="secure-pin-input" 
            name="pin" 
            autocomplete="off" 
            maxlength="12"
            inputmode="numeric"
            tabindex="0"
            aria-label="Secure Access PIN"
            style="opacity: 0; position: absolute; z-index: -1; width: 1px; height: 1px; pointer-events: none;"
          />

          <div class="aim-pin-display-wrap">
            <div class="aim-pin-display" id="aim-pin-display" aria-hidden="true"></div>
            <div class="aim-pin-feedback" id="aim-pin-feedback" aria-live="polite" role="status">> AWAITING INPUT</div>
          </div>
          <div class="aim-pinpad-grid" role="group" aria-label="PIN Keypad">
            <button type="button" class="aim-pad-btn" data-val="1" aria-label="Digit 1">1</button>
            <button type="button" class="aim-pad-btn" data-val="2" aria-label="Digit 2">2</button>
            <button type="button" class="aim-pad-btn" data-val="3" aria-label="Digit 3">3</button>
            <button type="button" class="aim-pad-btn" data-val="4" aria-label="Digit 4">4</button>
            <button type="button" class="aim-pad-btn" data-val="5" aria-label="Digit 5">5</button>
            <button type="button" class="aim-pad-btn" data-val="6" aria-label="Digit 6">6</button>
            <button type="button" class="aim-pad-btn" data-val="7" aria-label="Digit 7">7</button>
            <button type="button" class="aim-pad-btn" data-val="8" aria-label="Digit 8">8</button>
            <button type="button" class="aim-pad-btn" data-val="9" aria-label="Digit 9">9</button>
            <button type="button" class="aim-pad-btn aim-pad-btn-clear" id="aim-pad-clear" aria-label="Clear Input">CLR</button>
            <button type="button" class="aim-pad-btn" data-val="0" aria-label="Digit 0">0</button>
            <button type="button" class="aim-pad-btn aim-pad-btn-back" id="aim-pad-back" aria-label="Backspace">⌫</button>

            <!-- Row 5: Bypass button under CLR (Col 1), Enter button under 0 and ⌫ (Cols 2-3) -->
            <button type="button" class="aim-btn aim-pad-btn-action" id="aim-pin-bypass-btn" aria-label="Bypass Authentication" style="grid-column: 1; padding: 10px 4px; background: rgba(0, 150, 255, 0.1); border: 1px solid rgba(0, 150, 255, 0.4); color: #0096ff; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer; transition: all 0.3s; text-align: center; border-radius: 6px;">
              ⚡ BYPASS
            </button>
            <button type="submit" class="aim-btn aim-pad-btn-action" id="aim-pad-enter" aria-label="Submit PIN" style="grid-column: 2 / span 2; padding: 10px 4px; background: rgba(0, 255, 100, 0.12); border: 1px solid rgba(0, 255, 100, 0.45); color: #00ff64; font-family: 'Orbitron', sans-serif; font-size: 0.85rem; font-weight: 700; letter-spacing: 2px; cursor: pointer; transition: all 0.3s; text-align: center; border-radius: 6px;">
              ENTER
            </button>
          </div>
        `}
      </form>

      <!-- Request Access View -->
      <div id="aim-pin-signup-view" class="aim-pin-box-inner" style="display: none; flex-direction: column;">
        <div class="aim-pin-icon">📝</div>
        <h2 class="aim-pin-title">REQUEST ACCESS</h2>
        <p class="aim-pin-subtitle">SUBMIT PROFILE FOR APPROVAL</p>

        <div style="text-align: left; margin-bottom: 15px;">
          <label style="display:block; color:var(--blue-dim); font-size:0.75rem; margin-bottom:4px;">USERNAME</label>
          <input type="text" id="signup-username" class="aim-input" placeholder="Enter username..." style="width: 100%; box-sizing: border-box;" />
        </div>
        <div style="text-align: left; margin-bottom: 15px;">
          <label style="display:block; color:var(--blue-dim); font-size:0.75rem; margin-bottom:4px;">EMAIL</label>
          <input type="email" id="signup-email" class="aim-input" placeholder="Enter email address..." style="width: 100%; box-sizing: border-box;" />
        </div>
        <div style="text-align: left; margin-bottom: 15px;">
          <label style="display:block; color:var(--blue-dim); font-size:0.75rem; margin-bottom:4px;">REQUESTED PIN (8-9 DIGITS)</label>
          <input type="text" id="signup-pin" class="aim-input" placeholder="Enter 8-9 digit PIN..." maxlength="9" style="width: 100%; box-sizing: border-box;" />
        </div>

        <div id="signup-feedback" class="aim-pin-feedback" style="margin-bottom: 10px;">> AWAITING INPUT</div>

        <div style="display: flex; flex-direction: row; gap: 8px;">
          <button class="aim-btn" id="signup-submit-btn" style="flex: 1; padding: 10px; background: rgba(0, 255, 100, 0.1); border: 1px solid rgba(0, 255, 100, 0.4); color: #00ff64;">SUBMIT REQUEST</button>
          <button class="aim-btn" id="signup-cancel-btn" style="flex: 1; padding: 10px;">CANCEL</button>
        </div>
      </div>

      <!-- Pending Approval View -->
      <div id="aim-pin-pending-view" class="aim-pin-box-inner" style="display: none; flex-direction: column;">
        <div class="aim-pin-icon" style="color: #ff9600; text-shadow: 0 0 10px #ff9600;">⏳</div>
        <h2 class="aim-pin-title" style="color: #ff9600;">PROFILE PENDING</h2>
        <p class="aim-pin-subtitle" style="color: #ff9600;">AWAITING ADMINISTRATOR APPROVAL</p>

        <div style="margin: 20px 0; color: #aaa; font-size: 0.9rem; text-align: center; line-height: 1.5;">
          Your profile request has been received and is currently under review by an administrator.<br/><br/>
          Please check back later or contact an admin to expedite the process.
        </div>

        <button class="aim-btn" id="pending-back-btn" style="width: 100%; padding: 10px; margin-top: 10px;">RETURN TO LOGIN</button>
      </div>

    </div>
  `;

  let currentPin = '';
  let locked = false;

  const pinForm  = wrap.querySelector('#pin-login-form');
  const pinBox   = pinForm;
  const mainView = pinForm;
  const pinInput = wrap.querySelector('#secure-pin-input');
  const signupView = wrap.querySelector('#aim-pin-signup-view');
  const pendingView = wrap.querySelector('#aim-pin-pending-view');
  const display  = wrap.querySelector('#aim-pin-display');
  const feedback = wrap.querySelector('#aim-pin-feedback');

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

  function syncFromNativeInput(notifyAudio = false) {
    if (locked) return;
    const sanitized = (pinInput.value || '').replace(/\D/g, '').slice(0, 12);
    if (pinInput.value !== sanitized) {
      pinInput.value = sanitized;
    }
    const oldLen = currentPin.length;
    currentPin = sanitized;
    renderDots();

    if (currentPin.length > 0) {
      const countMsg = `${currentPin.length} digit${currentPin.length > 1 ? 's' : ''} entered`;
      feedback.setAttribute('aria-label', countMsg);
      if (notifyAudio && currentPin.length > oldLen) {
        playSFX('click', 0.4);
      }
    } else {
      setFeedback('AWAITING INPUT');
      feedback.setAttribute('aria-label', 'Awaiting input');
      if (notifyAudio && oldLen > 0) {
        playSFX('click', 0.4);
      }
    }
  }

  function appendPinDigit(val) {
    if (locked || pinInput.value.length >= 12) return;
    pinInput.value += val;
    pinInput.dispatchEvent(new Event('input', { bubbles: true }));
    playSFX('click', 0.4);
  }

  function handleClear() {
    if (locked) return;
    playSFX('click', 0.4);
    pinInput.value = '';
    pinInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function handleBackspace() {
    if (locked || !pinInput.value.length) return;
    playSFX('click', 0.4);
    pinInput.value = pinInput.value.slice(0, -1);
    pinInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  pinInput.addEventListener('input', () => {
    syncFromNativeInput(false);
  });
  pinInput.addEventListener('change', () => {
    syncFromNativeInput(false);
  });

  // Pre-fill saved PIN if previously stored, so user only has to tap Enter
  try {
    const remembered = localStorage.getItem('alphacore_saved_pin');
    if (remembered) {
      pinInput.value = remembered;
      currentPin = remembered;
      renderDots();
      setFeedback('SAVED PIN READY // PRESS ENTER');
    }
  } catch (_) {}

  // Allow clicking dot display to summon keyboard if explicitly desired
  display.style.cursor = 'pointer';
  display.onclick = () => {
    try { pinInput.focus(); } catch (_) {}
  };

  const operatorSel = wrap.querySelector('#operator-selector');
  if (operatorSel) {
    try {
      const pins = getPins();
      const distinctLabels = [...new Set(pins.map(p => p.label).filter(Boolean))];
      if (distinctLabels.length > 0) {
        operatorSel.innerHTML = '';
        distinctLabels.forEach(lbl => {
          const opt = document.createElement('option');
          opt.value = lbl;
          opt.textContent = lbl === 'Architect' ? 'Joshua (Architect)' : lbl;
          if (lbl === 'Architect') opt.selected = true;
          operatorSel.appendChild(opt);
        });
        const guestOpt = document.createElement('option');
        guestOpt.value = 'Guest';
        guestOpt.textContent = 'Guest (Preview Mode)';
        operatorSel.appendChild(guestOpt);
      }
    } catch (_) {}

    operatorSel.addEventListener('change', () => {
      const selected = operatorSel.value;
      if (selected === 'Guest') {
        const bypassBtn = wrap.querySelector('#aim-pin-bypass-btn');
        if (bypassBtn) bypassBtn.click();
      } else {
        sessionStorage.setItem('current_profile', selected);
      }
    });
  }

  async function handleEnter() {
    if (locked || !currentPin) {
      if (!currentPin) setFeedback('ENTER A PIN FIRST', 'error');
      return;
    }

    locked = true;
    setFeedback('VERIFYING...');

    // Small artificial delay so it feels like it's doing something
    await new Promise(r => setTimeout(r, 400));

    const result = await validatePin(currentPin, requiredRole);

    if (result.valid) {
      if (result.requireNewPin) {
        setFeedback('MANDATORY NEW PIN REQUIRED', 'warn');
        const newPin = (typeof window !== 'undefined' && window.prompt) ? window.prompt('ALPHACORE SECURITY // NEW PIN DIRECTIVE\nEnter a new 8 or 9 digit PIN for this profile:') : null;
        if (newPin && /^\d{8,9}$/.test(newPin.trim())) {
          const cleanNewPin = newPin.trim();
          updatePin(currentPin, { pin: cleanNewPin, mustChangePin: false });
          result.pinObj.pin = cleanNewPin;
          result.pinObj.mustChangePin = false;
          currentPin = cleanNewPin;
          try { logAction('PIN_RESET_COMPLETED', { label: result.pinObj?.label }); } catch {}
        } else {
          setFeedback('INVALID NEW PIN (8-9 DIGITS REQUIRED)', 'error');
          locked = false;
          return;
        }
      }

      playSFX('login', 0.8); // Add success sound effect
      setFeedback('ACCESS GRANTED. DECRYPTING...', 'ok');
      pinBox.classList.add('aim-access-granted');
      window.removeEventListener('keydown', keyHandler);

      try { 
        localStorage.setItem('alphacore_saved_pin', currentPin);
      } catch (_) {}

      try { logAction('AUTH_SUCCESS', { label: result.pinObj?.label }); } catch {}

      setTimeout(() => {
        const allKnownRoles = ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics', 'upscaler', 'video', 'director', 'assets', 'voice', 'music', 'subroutines', 'research', 'lore', 'thelab', 'laundry', 'cognitive'];
        allKnownRoles.forEach(r => sessionStorage.removeItem(r + '_authenticated'));

        if (authKey) sessionStorage.setItem(authKey, '1');
        if (result.pinObj) {
          sessionStorage.setItem('current_profile', result.pinObj.label);
          sessionStorage.setItem('current_pin', result.pinObj.pin);
          (result.pinObj.roles || []).forEach(r => sessionStorage.setItem(r + '_authenticated', '1'));
        }
        onSuccess(result);
      }, 900);
    } else {
      try { logAction('AUTH_FAILED', { reason: result.reason }); } catch {}
      playSFX('incorrect', 0.7);
      setFeedback(result.reason || 'ACCESS DENIED', 'error');
      pinBox.classList.add('aim-shake');

      // Highlight bypass and request access buttons so they stand out brightly
      const bypassBtn = wrap.querySelector('#aim-pin-bypass-btn');
      const reqBtn = wrap.querySelector('#aim-pin-request-btn');
      if (bypassBtn) bypassBtn.classList.add('aim-btn-highlight-glow');
      if (reqBtn) reqBtn.classList.add('aim-btn-request-glow');

      setTimeout(() => {
        pinBox.classList.remove('aim-shake');
        pinInput.value = '';
        pinInput.dispatchEvent(new Event('input', { bubbles: true }));
        locked = false;
        setFeedback('AWAITING INPUT');
      }, 700);
    }
  }

  // Native form submit handling (for automation & enter key)
  pinForm.onsubmit = e => {
    e.preventDefault();
    handleEnter();
    return false;
  };

  wrap.querySelectorAll('.aim-pad-btn[data-val]').forEach(btn => {
    btn.onclick = e => { 
      e.preventDefault();
      e.stopPropagation(); 
      appendPinDigit(btn.dataset.val); 
    };
  });
  wrap.querySelector('#aim-pad-clear').onclick = e => { 
    e.preventDefault();
    e.stopPropagation(); 
    handleClear(); 
  };
  wrap.querySelector('#aim-pad-enter').onclick = e => { 
    // Trigger standard form submission
    e.preventDefault();
    e.stopPropagation(); 
    pinForm.requestSubmit ? pinForm.requestSubmit() : handleEnter(); 
  };
  wrap.querySelector('#aim-pad-back').onclick = e => { 
    e.preventDefault();
    e.stopPropagation(); 
    handleBackspace(); 
  };

  // Request Access / Signup Flow
  const requestBtn = wrap.querySelector('#aim-pin-request-btn');
  if (requestBtn) {
    requestBtn.onclick = (e) => {
      e.stopPropagation();
      playSFX('click');
      mainView.style.display = 'none';
      signupView.style.display = 'flex';
      signupView.style.flexDirection = 'column';
    };
  }

  const cancelSignupBtn = wrap.querySelector('#signup-cancel-btn');
  if (cancelSignupBtn) {
    cancelSignupBtn.onclick = (e) => {
      e.stopPropagation();
      playSFX('click');
      signupView.style.display = 'none';
      mainView.style.display = 'flex';
      mainView.style.flexDirection = 'column';
      wrap.querySelector('#signup-username').value = '';
      wrap.querySelector('#signup-email').value = '';
      wrap.querySelector('#signup-pin').value = '';
      wrap.querySelector('#signup-feedback').textContent = '> AWAITING INPUT';
      wrap.querySelector('#signup-feedback').className = 'aim-pin-feedback';
    };
  }

  const submitSignupBtn = wrap.querySelector('#signup-submit-btn');
  if (submitSignupBtn) {
    submitSignupBtn.onclick = async (e) => {
      e.stopPropagation();
      const username = wrap.querySelector('#signup-username').value.trim();
      const email = wrap.querySelector('#signup-email').value.trim();
      const pin = wrap.querySelector('#signup-pin').value.trim();
      const signupFeedback = wrap.querySelector('#signup-feedback');

      if (!username || !email || !pin) {
        signupFeedback.textContent = '> ERROR: ALL FIELDS REQUIRED';
        signupFeedback.className = 'aim-pin-feedback feedback-error';
        return;
      }

      if (!/^\d{8,9}$/.test(pin)) {
        signupFeedback.textContent = '> ERROR: PIN MUST BE 8-9 DIGITS';
        signupFeedback.className = 'aim-pin-feedback feedback-error';
        return;
      }

      submitSignupBtn.disabled = true;
      signupFeedback.textContent = '> TRANSMITTING REQUEST...';
      signupFeedback.className = 'aim-pin-feedback';

      try {
        const res = await fetch(apiUrl('/api/pending-profiles/request'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, pin })
        });

        const data = await res.json();

        if (data.success) {
          playSFX('success');
          signupView.style.display = 'none';
          pendingView.style.display = 'flex';
          pendingView.style.flexDirection = 'column';
        } else {
          playSFX('incorrect');
          signupFeedback.textContent = `> ERROR: ${data.error || 'REQUEST FAILED'}`;
          signupFeedback.className = 'aim-pin-feedback feedback-error';
        }
      } catch (err) {
        playSFX('incorrect');
        signupFeedback.textContent = '> ERROR: CONNECTION FAILED';
        signupFeedback.className = 'aim-pin-feedback feedback-error';
      } finally {
        submitSignupBtn.disabled = false;
      }
    };
  }

  const pendingBackBtn = wrap.querySelector('#pending-back-btn');
  if (pendingBackBtn) {
    pendingBackBtn.onclick = (e) => {
      e.stopPropagation();
      playSFX('click');
      pendingView.style.display = 'none';
      mainView.style.display = 'flex';
      mainView.style.flexDirection = 'column';
      if (signupView) {
        wrap.querySelector('#signup-username').value = '';
        wrap.querySelector('#signup-email').value = '';
        wrap.querySelector('#signup-pin').value = '';
      }
    };
  }

  // Guest button listener
  // Bypass Easter Egg button listener
  const bypassBtn = wrap.querySelector('#aim-pin-bypass-btn');
  if (bypassBtn) {
    bypassBtn.onclick = (e) => {
      e.stopPropagation();
      if (isLoginScreen) {
        // Unique successful bypass animation
        bypassBtn.innerHTML = '⚡ BYPASS SUCCESSFUL...';
        bypassBtn.style.background = 'rgba(0,255,100,0.3)';
        bypassBtn.style.boxShadow = '0 0 20px rgba(0,255,100,0.8)';
        bypassBtn.style.borderColor = '#00ff64';
        bypassBtn.style.color = '#fff';
        playSFX('login', 0.8);
        setFeedback('SYSTEM BYPASSED. GUEST ACCESS GRANTED.', 'ok');
        
        sessionStorage.clear();
        sessionStorage.setItem('current_profile', 'Guest');
        setTimeout(() => {
          onSuccess({ valid: true, pinObj: { label: 'Guest', roles: [] } });
        }, 800);
      } else {
        // Standard kernel crash reboot
        triggerBypassOverloadSequence();
      }
    };
  }

  function keyHandler(e) {
    // If active element is another input (e.g. signup form inputs), don't intercept keypad keys
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && document.activeElement !== pinInput) {
      return;
    }

    if ((e.key >= '0' && e.key <= '9')) {
      e.preventDefault();
      appendPinDigit(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Escape' || e.key === 'Delete') {
      e.preventDefault();
      handleClear();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (pinForm.requestSubmit) {
        pinForm.requestSubmit();
      } else {
        handleEnter();
      }
    }
  }
  window.addEventListener('keydown', keyHandler);

  if (typeof document !== 'undefined' && document.body) {
    const observer = new MutationObserver(() => {
      try {
        if (typeof document === 'undefined' || !document?.body || !document.body.contains(wrap)) {
          window.removeEventListener('keydown', keyHandler);
          observer.disconnect();
        }
      } catch (_) {
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return wrap;
}

export function requireAuth(container, options) {
  if (options.authKey && sessionStorage.getItem(options.authKey)) {
    options.onSuccess();
  } else {
    container.appendChild(buildPinPad(options));
  }
}

export function openLoginModal({ 
  title = '// PROFILE_AUTHENTICATION',
  subtitle = 'ENTER ACCESS PIN TO UNLOCK FULL FEATURES',
  icon = '🔒',
  isLoginScreen = false
} = {}) {
  const pinPadEl = buildPinPad({
    onSuccess: () => {
      showModal({ title: '', content: '' });
      window.location.reload();
    },
    title,
    subtitle,
    icon: '🔑'
  });

  const modalWrap = document.createElement('div');
  modalWrap.appendChild(pinPadEl);

  if (sessionStorage.getItem('current_profile') && sessionStorage.getItem('current_profile') !== 'Guest') {
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'aim-btn';
    logoutBtn.style.cssText = 'width: 100%; margin-top: 12px; background: rgba(239,68,68,0.15); border-color: #ef4444; color: #ef4444;';
    logoutBtn.textContent = 'LOGOUT TO GUEST PROFILE';
    logoutBtn.onclick = () => {
      sessionStorage.clear();
      sessionStorage.setItem('current_profile', 'Guest');
      window.location.reload();
    };
    modalWrap.appendChild(logoutBtn);
  }

  showModal({
    title: 'AUTH_SESSION_GATEWAY',
    content: modalWrap
  });
}

// ─── Easter Egg: Cracked Screen, Red Overload & Fake 404 Crash Sequence ─────────

export function triggerBypassOverloadSequence() {
  // Play custom bypass.mp3 sound effect (5 seconds duration)
  playSFX('bypass', 0.9);

  // 1. Overlay Container
  const crashOverlay = document.createElement('div');
  crashOverlay.id = 'bypass-crash-overlay';
  Object.assign(crashOverlay.style, {
    position: 'fixed', inset: '0', zIndex: '999999',
    background: 'rgba(255, 0, 40, 0.25)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Orbitron', sans-serif", color: '#ff003c',
    overflow: 'hidden', pointerEvents: 'auto',
    animation: 'aim-shake 0.15s infinite'
  });

  // 2. Canvas Cracked Glass Fracture Lines
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  Object.assign(canvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '2'
  });
  const ctx = canvas.getContext('2d');

  // Draw jagged cracked glass fractures
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowColor = '#ff003c';
  ctx.shadowBlur = 12;

  function drawCrackLine(x, y, angle, length, depth) {
    if (depth <= 0) return;
    const nextX = x + Math.cos(angle) * length;
    const nextY = y + Math.sin(angle) * length;
    ctx.lineWidth = Math.max(1, depth * 1.2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nextX, nextY);
    ctx.stroke();

    // Branching cracks
    const numBranches = Math.floor(Math.random() * 3);
    for (let i = 0; i < numBranches; i++) {
      const branchAngle = angle + (Math.random() - 0.5) * 1.2;
      const branchLength = length * (0.5 + Math.random() * 0.5);
      drawCrackLine(nextX, nextY, branchAngle, branchLength, depth - 1);
    }
  }

  const numMainCracks = 14;
  for (let i = 0; i < numMainCracks; i++) {
    const angle = (i * (Math.PI * 2) / numMainCracks) + (Math.random() - 0.5) * 0.3;
    drawCrackLine(cx, cy, angle, 80 + Math.random() * 120, 4);
  }

  crashOverlay.appendChild(canvas);

  // 3. Overload HUD Message
  const hudBox = document.createElement('div');
  hudBox.style.cssText = `
    position: relative; z-index: 10; text-align: center; background: rgba(0,0,0,0.9);
    border: 2px solid #ff003c; padding: 30px; border-radius: 8px; box-shadow: 0 0 50px rgba(255,0,60,0.8);
    max-width: 90%; width: 500px;
  `;
  hudBox.innerHTML = `
    <div style="font-size: 3rem; margin-bottom: 10px; animation: pulse 0.3s infinite alternate;">⚠️</div>
    <h2 style="margin: 0 0 10px 0; font-size: 1.4rem; letter-spacing: 2px; color: #ff003c;">CRITICAL KERNEL OVERLOAD</h2>
    <p style="font-family: 'Share Tech Mono', monospace; font-size: 0.9rem; color: #ff8899; margin: 0 0 15px 0;">
      BYPASS HARDWARE DRIFT DETECTED // GOVERNOR SEVERED<br/>
      MEMORY ADDRESS 0x000000FF CORRUPTED
    </p>
    <div style="height: 4px; background: rgba(255,0,60,0.3); border-radius: 2px; overflow: hidden;">
      <div id="overload-bar" style="height: 100%; width: 0%; background: #ff003c; transition: width 4.8s linear;"></div>
    </div>
  `;
  crashOverlay.appendChild(hudBox);
  document.body.appendChild(crashOverlay);

  // Fill overload progress bar over 4.8 seconds
  setTimeout(() => {
    const bar = crashOverlay.querySelector('#overload-bar');
    if (bar) bar.style.width = '100%';
  }, 50);

  // 4. Crash to Fake 404 Page after 5.0 seconds (matching bypass.mp3 audio length)
  setTimeout(() => {
    crashOverlay.innerHTML = '';
    Object.assign(crashOverlay.style, {
      background: '#030305', animation: 'none',
      justifyContent: 'center', alignItems: 'center'
    });

    const fake404 = document.createElement('div');
    fake404.style.cssText = `
      text-align: center; max-width: 600px; padding: 40px; border: 1px solid rgba(255,0,60,0.4);
      background: rgba(10,0,15,0.95); border-radius: 8px; box-shadow: 0 0 40px rgba(255,0,60,0.2);
    `;
    fake404.innerHTML = `
      <h1 style="font-size: 4rem; margin: 0; color: #ff003c; text-shadow: 0 0 20px rgba(255,0,60,0.6);">404</h1>
      <h3 style="font-size: 1.1rem; color: #fff; letter-spacing: 2px; margin: 10px 0 15px 0;">KERNEL PANIC // PAGE NOT FOUND</h3>
      <p style="font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; color: #aaa; line-height: 1.6; margin-bottom: 25px;">
        FATAL_SYSTEM_EXPRESSION: Hardware bypass overload caused memory stack overflow. Target URL endpoint <code>/.kernel/bypass</code> is unmapped or destroyed.
      </p>
      <div style="background: rgba(0,0,0,0.6); padding: 12px; border-radius: 4px; border: 1px dashed rgba(255,0,60,0.3); font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; color: #ff4466; text-align: left; margin-bottom: 25px; overflow-x: auto;">
        [STACK TRACE]<br/>
        > 0x7FFF0012: BYPASS_VECTOR_FAULT<br/>
        > 0x7FFF0044: MEMORY_CORRUPTION_INJECTED<br/>
        > 0x7FFF0089: KERNEL_HALT_SUCCESSFUL
      </div>
      <button id="btn-reboot-404" class="aim-btn" style="background: rgba(255,0,60,0.2); border-color: #ff003c; color: #ff003c; font-size: 1rem; padding: 12px 30px;">
        ↻ REBOOT KERNEL
      </button>
    `;

    crashOverlay.appendChild(fake404);

    fake404.querySelector('#btn-reboot-404').onclick = () => {
      crashOverlay.remove();
      sessionStorage.clear();
      window.location.hash = '#/';
      window.location.reload();
    };
  }, 5000);
}
