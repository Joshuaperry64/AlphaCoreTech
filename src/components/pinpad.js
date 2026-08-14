/**
 * AlphaCore PIN Authentication System — v3.0 (Client-Side / Hardcoded)
 * No backend dependency. PINs validated locally against hardcoded list.
 * Vault crypto handled via Web Crypto API directly in the browser.
 */

import { logAction } from './logger.js';

// ─── Hardcoded PIN Registry ───────────────────────────────────────────────────
// Edit this list to add/remove users.

const PINS = [
  { pin: '672167566', label: 'Architect', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'] },
  { pin: '6969',      label: 'DoeBoy',    roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'] },
  { pin: '20022005',  label: 'J. P.',     roles: ['aimodals', 'generate'] },
  { pin: '1990',      label: 'Fisherman', roles: ['aimodals', 'generate'] },
];

// ─── Validation ───────────────────────────────────────────────────────────────

export function getPins() {
  return PINS;
}

export async function validatePin(pinVal, requiredRole = null) {
  const found = PINS.find(p => p.pin === pinVal);

  if (!found) {
    return { valid: false, reason: 'ACCESS DENIED' };
  }

  if (requiredRole && !(found.roles || []).includes(requiredRole)) {
    return { valid: false, reason: `CLEARANCE INSUFFICIENT: [${requiredRole.toUpperCase()}] REQUIRED` };
  }

  return { valid: true, pinObj: { ...found } };
}

// Stubs kept for compatibility with any code that still calls these
export function savePins() {}
export function addPin() {}
export function revokePin() {}

// ─── PIN Pad UI Component ─────────────────────────────────────────────────────

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

  const pinBox   = wrap.querySelector('#aim-pin-box-inner');
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

  function handleInput(val) {
    if (locked || currentPin.length >= 12) return;
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
      setFeedback('ACCESS GRANTED. DECRYPTING...', 'ok');
      pinBox.classList.add('aim-access-granted');
      window.removeEventListener('keydown', keyHandler);

      try { logAction('AUTH_SUCCESS', { label: result.pinObj?.label }); } catch {}

      setTimeout(() => {
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

  wrap.querySelectorAll('.aim-pad-btn[data-val]').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); handleInput(btn.dataset.val); };
  });
  wrap.querySelector('#aim-pad-clear').onclick = e => { e.stopPropagation(); handleClear(); };
  wrap.querySelector('#aim-pad-enter').onclick = e => { e.stopPropagation(); handleEnter(); };

  function keyHandler(e) {
    if (e.key >= '0' && e.key <= '9') handleInput(e.key);
    else if (e.key === 'Backspace') handleBackspace();
    else if (e.key === 'Escape' || e.key === 'Delete') handleClear();
    else if (e.key === 'Enter') handleEnter();
  }
  window.addEventListener('keydown', keyHandler);

  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      window.removeEventListener('keydown', keyHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return wrap;
}

export function requireAuth(container, options) {
  if (options.authKey && sessionStorage.getItem(options.authKey)) {
    options.onSuccess();
  } else {
    container.appendChild(buildPinPad(options));
  }
}
