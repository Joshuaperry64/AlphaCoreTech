/**
 * Shared PIN authentication & PIN pad component for AlphaCore Tech.
 * Manages authorized PIN configurations, temporary durations, and OTP status.
 */

// Load all registered PINs from localStorage or initialize defaults
export function getPins() {
  const data = localStorage.getItem('alphacore_pins');
  if (!data) {
    const defaultPins = [
      { pin: '672167566', type: 'permanent', label: 'Master Admin PIN', createdAt: Date.now() },
      { pin: '12345678', type: 'one-time', used: false, label: 'Default OTP', createdAt: Date.now() }
    ];
    localStorage.setItem('alphacore_pins', JSON.stringify(defaultPins));
    return defaultPins;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse PINs from storage:', e);
    return [];
  }
}

// Save PINs to localStorage
export function savePins(pins) {
  localStorage.setItem('alphacore_pins', JSON.stringify(pins));
}

// Add a new security PIN (permanent, one-time, or temporary)
export function addPin({ pin, type, durationSeconds, label }) {
  const pins = getPins();
  const newPin = {
    pin,
    type,
    label,
    createdAt: Date.now()
  };
  
  if (type === 'one-time') {
    newPin.used = false;
  } else if (type === 'temporary') {
    const duration = parseInt(durationSeconds) || 300; // default to 5 minutes
    newPin.expiresAt = Date.now() + duration * 1000;
  }
  
  pins.push(newPin);
  savePins(pins);
  return newPin;
}

// Delete / Revoke a registered PIN
export function revokePin(pinVal) {
  let pins = getPins();
  pins = pins.filter(p => p.pin !== pinVal);
  savePins(pins);
}

// Validate PIN entry
export function validatePin(pinVal) {
  const pins = getPins();
  const found = pins.find(p => p.pin === pinVal);
  
  if (!found) {
    return { valid: false, reason: 'ACCESS DENIED' };
  }
  
  if (found.type === 'one-time') {
    if (found.used) {
      return { valid: false, reason: 'ONE-TIME PIN EXPIRED' };
    }
    // Mark as used
    found.used = true;
    savePins(pins);
    return { valid: true };
  }
  
  if (found.type === 'temporary') {
    if (Date.now() > found.expiresAt) {
      return { valid: false, reason: 'TEMPORARY PIN EXPIRED' };
    }
    return { valid: true };
  }
  
  return { valid: true };
}

// Dynamic PIN Pad UI component creator
export function buildPinPad({ authKey, onSuccess, title = '// SECURITY_LOCKOUT', subtitle = 'UNRESTRICTED ACCESS REQUIRED', icon = '🔒' }) {
  const wrap = document.createElement('div');
  wrap.className = 'aim-pin-wrap';
  wrap.innerHTML = `
    <div class="aim-pin-box">
      <div class="aim-pin-header">
        <div class="aim-pin-icon">${icon}</div>
        <div class="aim-pin-title">${title}</div>
        <div class="aim-pin-subtitle">${subtitle}</div>
      </div>
      
      <div class="aim-pin-display-wrap">
        <div class="aim-pin-display" id="aim-pin-display">
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
          <span class="aim-pin-dot"></span>
        </div>
        <div class="aim-pin-feedback" id="aim-pin-feedback">> ENTER VALID ACCESS PIN</div>
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
  const display = wrap.querySelector('#aim-pin-display');
  const feedback = wrap.querySelector('#aim-pin-feedback');
  const pinBox = wrap.querySelector('.aim-pin-box');
  const dots = display.querySelectorAll('.aim-pin-dot');

  function updateDisplay() {
    dots.forEach((dot, idx) => {
      if (idx < currentPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  function handleInput(val) {
    if (currentPin.length < 9) {
      currentPin += val;
      updateDisplay();
      feedback.textContent = '> ENTERING PIN...';
      feedback.className = 'aim-pin-feedback';
    }
  }

  function handleClear() {
    currentPin = '';
    updateDisplay();
    feedback.textContent = '> ENTER VALID ACCESS PIN';
    feedback.className = 'aim-pin-feedback';
  }

  function handleBackspace() {
    if (currentPin.length > 0) {
      currentPin = currentPin.slice(0, -1);
      updateDisplay();
      if (currentPin.length === 0) {
        feedback.textContent = '> ENTER VALID ACCESS PIN';
      } else {
        feedback.textContent = '> ENTERING PIN...';
      }
      feedback.className = 'aim-pin-feedback';
    }
  }

  function handleEnter() {
    const result = validatePin(currentPin);
    if (result.valid) {
      handleSuccess();
    } else {
      handleFailure(result.reason);
    }
  }

  function handleSuccess() {
    feedback.textContent = '> ACCESS GRANTED. DECRYPTING...';
    feedback.className = 'aim-pin-feedback aim-feedback-ok';
    pinBox.classList.add('aim-access-granted');
    
    // Disable inputs
    window.removeEventListener('keydown', keyHandler);
    
    setTimeout(() => {
      sessionStorage.setItem(authKey, '1');
      onSuccess();
    }, 1200);
  }

  function handleFailure(reason) {
    feedback.textContent = `> ${reason}`;
    feedback.className = 'aim-pin-feedback aim-feedback-error';
    pinBox.classList.add('aim-shake');
    
    setTimeout(() => {
      pinBox.classList.remove('aim-shake');
      currentPin = '';
      updateDisplay();
    }, 600);
  }

  // Mouse / Touch click events
  wrap.querySelectorAll('.aim-pad-btn[data-val]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handleInput(btn.dataset.val);
    };
  });

  wrap.querySelector('#aim-pad-clear').onclick = (e) => {
    e.stopPropagation();
    handleClear();
  };

  wrap.querySelector('#aim-pad-enter').onclick = (e) => {
    e.stopPropagation();
    handleEnter();
  };

  // Keyboard events
  function keyHandler(e) {
    if (e.key >= '0' && e.key <= '9') {
      handleInput(e.key);
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Escape' || e.key === 'Delete') {
      handleClear();
    } else if (e.key === 'Enter') {
      handleEnter();
    }
  }

  window.addEventListener('keydown', keyHandler);

  // Clean up key listener if element is removed from DOM
  const observer = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      window.removeEventListener('keydown', keyHandler);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return wrap;
}
