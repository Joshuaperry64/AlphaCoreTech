/**
 * AlphaCore PIN Authentication System — v4.0
 * Supports Netlify/Express Serverless /api/auth with client-side localStorage fallback.
 */

import { logAction } from './logger.js';
import { pushToServer } from './db_sync.js';
import { playSFX } from './audio.js';

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

export function addPin({ pin, type, label, roles = [], durationSeconds = 300 }) {
  const pins = getPins();
  const newPinObj = {
    pin,
    type,
    label,
    roles: Array.isArray(roles) ? roles : [],
    createdAt: Date.now()
  };

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

export function revokePin(pinVal) {
  const pins = getPins().filter(p => p.pin !== pinVal);
  savePins(pins);
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validatePin(pinVal, requiredRole = null) {
  try {
    const res = await fetch('/api/auth', {
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

      <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
        <button class="aim-btn" id="aim-pin-guest-btn" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: #ccc; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; letter-spacing: 1px; cursor: pointer; transition: all 0.2s;">
          👤 CONTINUE AS GUEST
        </button>
        <button class="aim-btn" id="aim-pin-bypass-btn" style="width: 100%; padding: 8px; background: rgba(255,0,60,0.1); border: 1px solid rgba(255,0,60,0.4); color: #ff003c; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer; transition: all 0.2s;">
          ⚡ [SYSTEM BYPASS]
        </button>
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
    playSFX('click', 0.4);
    currentPin += val;
    renderDots();
    setFeedback('ENTERING PIN...');
  }

  function handleClear() {
    if (locked) return;
    playSFX('click', 0.4);
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

  // Guest button listener
  const guestBtn = wrap.querySelector('#aim-pin-guest-btn');
  if (guestBtn) {
    guestBtn.onclick = (e) => {
      e.stopPropagation();
      sessionStorage.clear();
      sessionStorage.setItem('current_profile', 'Guest');
      setFeedback('GUEST ACCESS GRANTED...', 'ok');
      setTimeout(() => {
        onSuccess({ valid: true, pinObj: { label: 'Guest', roles: [] } });
      }, 400);
    };
  }

  // Bypass Easter Egg button listener
  const bypassBtn = wrap.querySelector('#aim-pin-bypass-btn');
  if (bypassBtn) {
    bypassBtn.onclick = (e) => {
      e.stopPropagation();
      triggerBypassOverloadSequence();
    };
  }

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

export function openLoginModal({ title = '// PROFILE_AUTHENTICATION', subtitle = 'ENTER ACCESS PIN TO UNLOCK FULL FEATURES' } = {}) {
  import('./modal.js').then(({ showModal }) => {
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
  });
}

// ─── Easter Egg: Cracked Screen, Red Overload & Fake 404 Crash Sequence ─────────

function triggerBypassOverloadSequence() {
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
      window.location.reload();
    };
  }, 5000);
}
