import { createElement, escapeHTML } from '../components/utils.js';
import { buildPinPad, getPins, addPin, revokePin, requireAuth } from '../components/pinpad.js';
import { getLogs, clearLogs } from '../components/logger.js';
import { playSFX } from '../components/audio.js';

export default function AdminPage() {
  const container = createElement('div');

  function showAdmin() {
    container.className = 'admin-page';
    container.innerHTML = '';
    container.appendChild(buildAdminUI());
  }

  container.className = 'admin-panel-page';

  requireAuth(container, {
    authKey: 'admin_authenticated',
    onSuccess: showAdmin,
    title: 'ALPHACORE // ADMIN_LOCKOUT',
    subtitle: 'ADMINISTRATOR AUTHENTICATION REQUIRED',
    icon: '⚙',
    requiredRole: 'admin'
  });

  return container;
}

function buildAdminUI() {
  const root = document.createElement('div');
  root.className = 'admin-root';

  root.innerHTML = `
    <div class="aim-header">
      <div class="aim-header-badge">[SYS_ADMIN] // CORE_CONFIG</div>
      <h1 class="glitch aim-title" data-text="ALPHACORE // ADMINISTRATION">ALPHACORE // ADMINISTRATION</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Manage security PINs, register/revoke role authorization tokens, adopt classified neural directives, and audit system activity logs.</p>
    </div>

    <div class="admin-grid">
      <!-- PIN management -->
      <div class="panel">
        <div class="panel-title">// SECURITY_PIN_AUTHORIZATION</div>
        <div class="pin-form">
          <div class="aim-row">
            <div class="aim-field aim-field-half">
              <label class="aim-label" for="new-pin-val">ACCESS PIN (8-9 DIGITS)</label>
              <div class="flex-row" style="display: flex; gap: 10px;">
                <input class="aim-input" type="text" id="new-pin-val" placeholder="Enter or generate..." maxlength="9" style="flex-grow: 1;" />
                <button class="aim-btn" id="btn-gen-rand-pin" style="white-space: nowrap;">GENERATE</button>
              </div>
            </div>
            <div class="aim-field aim-field-half">
              <label class="aim-label" for="new-pin-label">LABEL / IDENTIFIER</label>
              <input class="aim-input" type="text" id="new-pin-label" placeholder="e.g. Guest Node" />
            </div>
          </div>

          <div class="aim-row" style="margin-top: 10px;">
            <div class="aim-field aim-field-half">
              <label class="aim-label" for="new-pin-type">PIN EXPIRATION MODEL</label>
              <select class="aim-select" id="new-pin-type">
                <option value="permanent">PERMANENT (NEVER EXPIRES)</option>
                <option value="one-time">ONE-TIME USE ONLY</option>
                <option value="temporary">TEMPORARY (TIME-BASED)</option>
              </select>
            </div>
            <div class="aim-field aim-field-half hidden" id="tmp-duration-field" style="display: none;">
              <label class="aim-label" for="new-pin-duration">DURATION (MINUTES)</label>
              <input class="aim-input" type="number" id="new-pin-duration" value="5" min="1" max="1440" />
            </div>
          </div>

          <div class="aim-field" style="margin-top: 10px;">
            <label class="aim-label">ACCESS LEVEL / ROLES</label>
            <div class="flex-row" style="display: flex; gap: 15px; margin-top: 5px; flex-wrap: wrap;">
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="aimodals"> AI Modals Access</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="generate"> Image Generation</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="lora"> LoRA Usage</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="vault"> Classified Vault</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="diagnostics"> Diagnostics Panel</label>
            </div>
          </div>

          <button class="aim-btn aim-btn-generate" id="btn-save-new-pin" style="margin-top: 15px;">
            AUTHORIZE SECURITY PIN
          </button>
          <div class="admin-feedback" id="pin-form-feedback"></div>
        </div>

        <div class="header-line" style="margin: 20px 0 15px 0; opacity: 0.3;"></div>

        <div class="panel-subtitle">// ACTIVE_ACCESS_TOKENS</div>
        <div class="pin-list-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>LABEL</th>
                <th>PIN</th>
                <th>ROLES</th>
                <th>TYPE</th>
                <th>EXPIRES/STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody id="pin-list-body">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Embrace the darkness section -->
      <div class="darkness-card panel">
        <div class="panel-title" style="color: var(--accent, #ff003c);">// CLASSIFIED_DIRECTIVES</div>
        <p class="aim-subtitle" style="margin-bottom:15px;">Execute internal overlay protocol to adopt alternate persona. CAUTION: Dissolves standard safety governors.</p>
        <button class="aim-btn" id="btn-embrace-darkness" style="background: rgba(255, 0, 60, 0.1); border-color: var(--accent, #ff003c); color: var(--accent, #ff003c); width: 100%;">
          EMBRACE THE DARKNESS
        </button>
        <div id="darkness-menu-slot"></div>
      </div>
    </div>

    <!-- User Logs section -->
    <div class="panel" style="margin-top: 20px;">
      <div class="panel-title flex-between" style="display:flex; justify-content:space-between; align-items:center;">
        <span>// SYSTEM_USER_LOGS</span>
        <button class="aim-btn aim-btn-sm" id="btn-clear-logs" style="color:var(--accent, #ff003c); border-color:var(--accent, #ff003c);">CLEAR LOGS</button>
      </div>
      <div class="pin-list-wrap" style="max-height: 300px; overflow-y: auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>TIMESTAMP</th>
              <th>PROFILE</th>
              <th>ACTION</th>
              <th>DETAILS</th>
            </tr>
          </thead>
          <tbody id="user-logs-body">
            <!-- Rendered dynamically -->
          </tbody>
        </table>
      </div>
    </div>

    </div>
  `;

  const pinVal = root.querySelector('#new-pin-val');
  const pinLabel = root.querySelector('#new-pin-label');
  const pinType = root.querySelector('#new-pin-type');
  const tmpDurationField = root.querySelector('#tmp-duration-field');
  const pinDuration = root.querySelector('#new-pin-duration');
  const genRandBtn = root.querySelector('#btn-gen-rand-pin');
  const savePinBtn = root.querySelector('#btn-save-new-pin');
  const pinFeedback = root.querySelector('#pin-form-feedback');
  const pinListBody = root.querySelector('#pin-list-body');

  const darknessBtn = root.querySelector('#btn-embrace-darkness');
  const darknessSlot = root.querySelector('#darkness-menu-slot');

  // Expiration duration input toggle
  pinType.onchange = () => {
    if (pinType.value === 'temporary') {
      tmpDurationField.style.display = 'block';
    } else {
      tmpDurationField.style.display = 'none';
    }
  };

  // Generate random 8-9 digit PIN
  genRandBtn.onclick = (e) => {
    e.preventDefault();
    let pin = '';
    const digits = '0123456789';
    const length = Math.random() > 0.5 ? 9 : 8;
    for (let i = 0; i < length; i++) {
      pin += digits[Math.floor(Math.random() * 10)];
    }
    pinVal.value = pin;
  };

  // Save/Authorize PIN
  savePinBtn.onclick = (e) => {
    e.preventDefault();
    const pin = pinVal.value.trim();
    const label = pinLabel.value.trim() || 'Guest Node';
    const type = pinType.value;
    const durationMin = parseInt(pinDuration.value) || 5;

    const roleBoxes = root.querySelectorAll('.new-pin-role:checked');
    const roles = Array.from(roleBoxes).map(b => b.value);

    if (!/^\d{8,9}$/.test(pin)) {
      showFeedback(pinFeedback, 'ERROR: PIN must be exactly 8 or 9 digits.', 'error');
      return;
    }

    addPin({
      pin,
      type,
      durationSeconds: durationMin * 60,
      label,
      roles
    });

    pinVal.value = '';
    pinLabel.value = '';
    showFeedback(pinFeedback, 'PIN authorized and written to security databank.', 'ok');
    updatePinList();
  };

  // Global impersonate hook
  window.impersonateProfile = (pinValue) => {
    const pins = getPins();
    const target = pins.find(p => p.pin === pinValue);
    if (!target) return;
    
    // Clear existing session roles
    const allRoles = ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'];
    allRoles.forEach(r => sessionStorage.removeItem(r + '_authenticated'));
    
    // Apply target profile roles
    if (target.roles) {
      target.roles.forEach(r => sessionStorage.setItem(r + '_authenticated', '1'));
    }
    
    // Set active profile name and PIN
    sessionStorage.setItem('current_profile', target.label);
    sessionStorage.setItem('current_pin', target.pin);
    
    // Redirect to overview to see what is unlocked
    window.location.hash = '#/';
    window.location.reload();
  };

  // Global delete PIN hook for inline click handlers
  window.revokePin = (pinValue) => {
    if (pinValue === '672167566') {
      showFeedback(pinFeedback, 'ERROR: Revoking master admin key is disabled.', 'error');
      return;
    }
    revokePin(pinValue);
    updatePinList();
  };

  function showFeedback(el, msg, status) {
    el.textContent = `> ${msg}`;
    el.className = `admin-feedback feedback-${status}`;
    setTimeout(() => {
      el.textContent = '';
      el.className = 'admin-feedback';
    }, 4000);
  }

  // Render authorized PINs table
  function updatePinList() {
    const pins = getPins();
    pinListBody.innerHTML = '';

    pins.forEach(p => {
      let statusHtml = '';
      if (p.type === 'permanent') {
        statusHtml = '<span class="status-green">NEVER</span>';
      } else if (p.type === 'one-time') {
        statusHtml = p.used ? '<span class="status-red">USED</span>' : '<span class="status-green">ACTIVE (OTP)</span>';
      } else if (p.type === 'temporary') {
        const remaining = p.expiresAt - Date.now();
        if (remaining <= 0) {
          statusHtml = '<span class="status-red">EXPIRED</span>';
        } else {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
          statusHtml = `<span class="status-amber">Expires in ${m}:${s}</span>`;
        }
      }

      const isMaster = p.pin === '672167566';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="table-label">${p.label}</td>
        <td class="table-mono">${isMaster ? '*******' : p.pin}</td>
        <td class="table-mono" style="font-size:0.55rem; color:var(--blue-dim);">${(p.roles || []).join(', ').toUpperCase()}</td>
        <td class="table-mono">${p.type.toUpperCase()}</td>
        <td>${statusHtml}</td>
        <td>
          <button class="aim-btn aim-btn-sm" onclick="impersonateProfile('${p.pin}')" style="margin-right: 8px;">IMPERSONATE</button>
          <button class="aim-btn aim-btn-sm" onclick="revokePin('${p.pin}')" ${isMaster ? 'disabled' : ''} style="border-color:${isMaster ? 'rgba(255,255,255,0.1)' : 'var(--accent, #ff003c)'}; color:${isMaster ? 'rgba(255,255,255,0.2)' : 'var(--accent, #ff003c)'}">
            REVOKE
          </button>
        </td>
      `;
      pinListBody.appendChild(tr);
    });
  }

  // Periodic active tokens status refresh (for temp countdowns)
  const refreshInterval = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(refreshInterval);
      return;
    }
    updatePinList();
  }, 1000);

  // Embrace the darkness alternate state trigger
  darknessBtn.onclick = (e) => {
    e.preventDefault();
    sessionStorage.setItem('darkness_mode_active', 'true'); // ACTIVATE DARKNESS
    darknessBtn.style.display = 'none';

    darknessSlot.innerHTML = `
      <div class="panel flex-column" style="margin-top: 15px; border-color: var(--accent, #ff003c); background: rgba(10, 5, 12, 0.8); display: flex; flex-direction: column;">
        <div class="panel-title" style="color: var(--accent, #ff003c);">[WARNING] // DARKENED_STATE_ACTIVE</div>
        <p class="aim-subtitle" style="color: rgba(255, 0, 60, 0.75);">NSFW neural alignments initialized. Alternate persona Luci persistent overlay is operational.</p>
        
        <div class="aim-field" style="margin-top: 10px;">
          <label class="aim-label" style="color: var(--accent, #ff003c);">LUCI ALIGNMENT STRENGTH <span class="aim-val-display" id="dark-str-val" style="color:var(--accent)">100%</span></label>
          <input class="aim-range" type="range" id="dark-range" min="0" max="100" value="100" style="accent-color: var(--accent, #ff003c);" />
        </div>

        <div class="aim-field" style="margin-top: 12px;">
          <label class="aim-label" style="color: var(--accent, #ff003c);">STEALTH OBFUSCATION FREQUENCY</label>
          <div class="aim-seg aim-seg-3" id="dark-freq-seg">
            <button class="aim-seg-btn active" data-f="high">HIGH ENTROPY</button>
            <button class="aim-seg-btn" data-f="mid">VECTOR DRIFT</button>
            <button class="aim-seg-btn" data-f="low">STEALTH IDLE</button>
          </div>
        </div>
        <div class="aim-field" style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed rgba(255, 0, 60, 0.4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="aim-label" style="color: var(--accent, #ff003c); margin-bottom: 0;">// CLASSIFIED_SUBSTRATE</label>
            <span style="font-family: 'Share Tech Mono', monospace; font-size: 0.65rem; color: #ff003c; background: rgba(255,0,60,0.15); border: 1px solid rgba(255,0,60,0.4); padding: 1px 6px; border-radius: 3px; letter-spacing: 1px;">ARCHITECT ONLY</span>
          </div>
          <a href="#/placeholder" id="btn-portal-placeholder" class="aim-btn" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 4px; background: rgba(255, 0, 60, 0.18); border-color: #ff003c; color: #fff; text-shadow: 0 0 10px #ff003c; text-decoration: none; font-family: 'Orbitron', sans-serif; font-size: 0.78rem; letter-spacing: 1.5px; padding: 10px; transition: all 0.25s ease;">
            🔒 ACCESS [PLACEHOLDER]
          </a>
          <p style="font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; color: rgba(255,255,255,0.45); margin-top: 5px; text-align: center;">
            Hidden sandbox substrate accessible strictly via Darkened State directives.
          </p>
        </div>

        <button class="aim-btn" id="btn-revert-darkness" style="margin-top: 15px; border-color: #555; color: #777; width: 100%;">REVERT TO STANDARD</button>
      </div>
    `;
    
    const darkRange = darknessSlot.querySelector('#dark-range');
    const darkVal = darknessSlot.querySelector('#dark-str-val');
    const freqBtns = darknessSlot.querySelectorAll('#dark-freq-seg .aim-seg-btn');
    const revertBtn = darknessSlot.querySelector('#btn-revert-darkness');
    const placeholderPortalBtn = darknessSlot.querySelector('#btn-portal-placeholder');

    if (placeholderPortalBtn) {
      placeholderPortalBtn.onclick = () => {
        playSFX('navigate', 0.6);
      };
    }

    darkRange.oninput = () => {
      darkVal.textContent = `${darkRange.value}%`;
    };

    freqBtns.forEach(btn => {
      btn.onclick = (ev) => {
        ev.preventDefault();
        freqBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    revertBtn.onclick = () => {
      sessionStorage.removeItem('darkness_mode_active'); // DEACTIVATE DARKNESS
      darknessSlot.innerHTML = '';
      darknessBtn.style.display = 'block';
    };
  };
  
  // Check if darkness mode was active on page load
  if (sessionStorage.getItem('darkness_mode_active') === 'true') {
    darknessBtn.click();
  }

  // Initial render of PIN list
  updatePinList();

  // Cleanup periodic refresh interval on component unmount
  if (typeof document !== 'undefined' && document.body) {
    const observer = new MutationObserver(() => {
      if (typeof document === 'undefined' || !document.body || !document.body.contains(root)) {
        clearInterval(refreshInterval);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  renderLogs();

  function renderLogs() {
    const logsBody = root.querySelector('#user-logs-body');
    const logs = getLogs();
    
    if (logs.length === 0) {
      logsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">NO LOGS FOUND IN SYSTEM.</td></tr>';
      return;
    }
    
    logsBody.innerHTML = logs.map(log => {
      const ts = new Date(log.timestamp).toLocaleString();
      let det = '';
      if (log.details) {
        if (log.details.label) det += `[Profile: ${escapeHTML(log.details.label)}] `;
        if (log.details.reason) det += `[Reason: ${escapeHTML(log.details.reason)}] `;
        if (log.details.type) det += `[Type: ${escapeHTML(log.details.type)}] `;
        if (log.details.prompt) det += `[Prompt: ${escapeHTML(log.details.prompt.substring(0, 30))}...] `;
      }
      return `
        <tr>
          <td>${escapeHTML(ts)}</td>
          <td style="color: var(--blue, #00b8ff);">${escapeHTML(log.profile)}</td>
          <td>${escapeHTML(log.action)}</td>
          <td style="font-size: 0.8rem; opacity: 0.8;">${det}</td>
        </tr>
      `;
    }).join('');
  }

  // Clear Logs
  root.querySelector('#btn-clear-logs').addEventListener('click', () => {
    if (confirm('Are you sure you want to purge all system logs?')) {
      clearLogs();
      renderLogs();
    }
  });

  return root;
}