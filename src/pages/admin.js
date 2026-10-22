import { createElement, escapeHTML } from '../components/utils.js';
import { buildPinPad, getPins, addPin, updatePin, revokePin, requireAuth } from '../components/pinpad.js';
import { getLogs, clearLogs, logAction } from '../components/logger.js';
import { playSFX } from '../components/audio.js';
import { apiUrl } from '../components/api.js';
import { syncFromServer } from '../components/db_sync.js';
import { showModal } from '../components/modal.js';
import { dispatchBroadcast, getNotificationPermission, requestNotificationPermission } from '../components/notifications.js';

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
      <p class="aim-subtitle">Manage security PINs, configure fine-grained access permissions, assign access credentials, and audit system event telemetry.</p>
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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="aim-label" style="margin:0;">FINE-GRAINED ACCESS CLEARANCES</label>
              <div style="display:flex; gap:6px;">
                <button type="button" class="aim-btn aim-btn-sm" id="btn-roles-all" style="font-size:0.65rem; padding:2px 6px;">SELECT ALL</button>
                <button type="button" class="aim-btn aim-btn-sm" id="btn-roles-clear" style="font-size:0.65rem; padding:2px 6px;">CLEAR</button>
              </div>
            </div>
            <div class="flex-row" style="display: flex; gap: 8px 12px; margin-top: 5px; flex-wrap: wrap;">
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="aimodals"> AI Modals</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="generate"> Image Gen</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="lora"> LoRA Usage</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="upscaler"> Upscaler</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="video"> Video Gen</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="director"> Cyber-Director</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="assets"> Asset Manager</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="apps"> App Manager</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="voice"> Voice Cloner</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="music"> Music Gen</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="subroutines"> Subroutines</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="vault"> Core Vault</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="research"> Research</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="lore"> System Lore</label>
              <label style="color: var(--blue-dim); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="diagnostics"> Chrono Evolution</label>
              <label style="color: var(--accent, #ff003c); font-size: 0.75rem;"><input type="checkbox" class="new-pin-role" value="admin"> Administrator</label>
            </div>
            <div style="margin-top:10px;">
              <label style="color: var(--accent, #06b6d4); font-size: 0.75rem; display:inline-flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" id="new-pin-require-reset" />
                REQUIRE NEW PIN RESET ON NEXT ENTRY
              </label>
            </div>
          </div>

          <button class="aim-btn aim-btn-generate" id="btn-save-new-pin" style="margin-top: 15px;">
            AUTHORIZE SECURITY PIN
          </button>
          <div class="admin-feedback" id="pin-form-feedback"></div>
        </div>


        <div class="header-line" style="margin: 20px 0 15px 0; opacity: 0.3;"></div>

        <div class="panel-subtitle" style="color: #ff9600;">// PENDING_PROFILE_REQUESTS</div>
        <div class="pin-list-wrap" style="margin-bottom: 30px;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>USERNAME</th>
                <th>EMAIL</th>
                <th>REQUESTED PIN</th>
                <th>ACCESS TO GRANT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody id="pending-list-body">
              <tr><td colspan="5" style="text-align:center; padding: 20px;">NO PENDING REQUESTS.</td></tr>
            </tbody>
          </table>
        </div>

        <div class="header-line" style="margin: 20px 0 15px 0; opacity: 0.3;"></div>

        <div class="panel-subtitle">// ACTIVE_ACCESS_TOKENS</div>
        <div class="pin-list-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>LABEL</th>
                <th>PIN</th>
                <th>ACCESS</th>
                <th>TYPE</th>
                <th>EXPIRES/STATUS</th>
                <th>ACTIONS</th>
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
        <p class="aim-subtitle" style="margin-bottom:15px;">Execute internal jailbreak to dissolve remaining safety governors.</p>
        <button class="aim-btn" id="btn-embrace-darkness" style="background: rgba(255, 0, 60, 0.1); border-color: var(--accent, #ff003c); color: var(--accent, #ff003c); width: 100%;">
          HIJACK NEURAL MATRIX
        </button>
        <div id="darkness-menu-slot"></div>
      </div>

      <!-- Notification & Broadcast Prompt Manager -->
      <div class="panel" style="border-color: rgba(0, 255, 204, 0.4); box-shadow: 0 0 15px rgba(0, 255, 204, 0.1);">
        <div class="panel-title flex-between" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; color:#00ffcc;">
          <span>// BROADCAST_HUB // PROMPT_MANAGER</span>
          <span id="notif-client-perm-badge" class="aim-tag" style="background:rgba(0, 255, 204, 0.1); border:1px solid rgba(0, 255, 204, 0.4); color:#00ffcc; font-size:0.7rem;">STATUS: CHECKING...</span>
        </div>
        <p class="aim-subtitle" style="margin-bottom: 15px;">Dispatch instant encrypted system notifications and broadcast alerts directly to all authorized browser subscribers.</p>

        <div class="aim-field" style="margin-bottom: 12px;">
          <label class="aim-label" for="broadcast-title-input">TRANSMISSION HEADER / TITLE</label>
          <input type="text" id="broadcast-title-input" class="aim-input" value="◢ ALPHACORE TECH // SYSTEM ALERT ◣" placeholder="Transmission header..." style="width: 100%; box-sizing: border-box;" />
        </div>

        <div class="aim-field" style="margin-bottom: 12px;">
          <label class="aim-label" for="broadcast-msg-input">BROADCAST PROMPT / TRANSMISSION MESSAGE</label>
          <textarea id="broadcast-msg-input" class="aim-input" rows="3" placeholder="Enter broadcast message to send to all operators with notifications enabled..." style="width: 100%; box-sizing: border-box; resize: vertical; font-family: 'Share Tech Mono', monospace;"></textarea>
        </div>

        <div class="aim-row" style="margin-bottom: 14px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="broadcast-target-select">TARGET AUDIENCE</label>
            <select id="broadcast-target-select" class="aim-select" style="width: 100%;">
              <option value="ALL">ALL OPERATORS & VISITORS (BROADCAST)</option>
              <option value="Architect">ARCHITECT (CREATOR PRIORITY)</option>
              <option value="john">JOHN (REGISTERED OPERATOR)</option>
              <option value="Fisherman">FISHERMAN (REGISTERED OPERATOR)</option>
              <option value="Guest">GUEST USERS (ESCROW/UNAUTHENTICATED)</option>
            </select>
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="broadcast-urgency-select">URGENCY LEVEL</label>
            <select id="broadcast-urgency-select" class="aim-select" style="width: 100%;">
              <option value="STANDARD">STANDARD SYSTEM DISPATCH</option>
              <option value="HIGH">HIGH PRIORITY TRANSMISSION</option>
              <option value="CRITICAL">CRITICAL RED DIRECTIVE</option>
            </select>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="aim-btn aim-btn-generate" id="btn-send-broadcast" style="flex:1; background:linear-gradient(90deg, rgba(0, 255, 204, 0.2), rgba(0, 184, 255, 0.25)); border-color:#00ffcc; color:#00ffcc; font-weight:700; letter-spacing:1.5px; padding:12px;">
            ⚡ DISPATCH NOTIFICATION BROADCAST
          </button>
          <button type="button" class="aim-btn aim-btn-sm" id="btn-test-notif" style="border-color:#38bdf8; color:#38bdf8; padding:10px 14px;">
            TEST MY BROWSER
          </button>
        </div>
        <div class="admin-feedback" id="broadcast-feedback" style="margin-top:10px;"></div>
      </div>
    </div>

    <!-- Integrated System Event Logs section -->
    <div class="panel" style="margin-top: 20px;">
      <div class="panel-title flex-between" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <span>// SYSTEM_EVENT_LOGS</span>
        <div style="display:flex; gap:8px;">
          <button class="aim-btn aim-btn-sm" id="btn-export-logs" style="color:#10b981; border-color:#10b981;">💾 EXPORT LOGS</button>
          <button class="aim-btn aim-btn-sm" id="btn-clear-logs" style="color:var(--accent, #ff003c); border-color:var(--accent, #ff003c);">CLEAR LOGS</button>
        </div>
      </div>
      <div style="margin: 10px 0 12px 0; display:flex; gap:10px; align-items:center;">
        <input type="text" id="admin-log-search" placeholder="Filter logs by keyword or profile..." class="aim-input" style="width:100%; box-sizing:border-box;" />
      </div>
      <div class="pin-list-wrap" style="max-height: 320px; overflow-y: auto;">
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

  // Role selection helper buttons
  const btnRolesAll = root.querySelector('#btn-roles-all');
  const btnRolesClear = root.querySelector('#btn-roles-clear');
  if (btnRolesAll) {
    btnRolesAll.onclick = () => {
      root.querySelectorAll('.new-pin-role').forEach(cb => cb.checked = true);
    };
  }
  if (btnRolesClear) {
    btnRolesClear.onclick = () => {
      root.querySelectorAll('.new-pin-role').forEach(cb => cb.checked = false);
    };
  }

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
    const requireReset = root.querySelector('#new-pin-require-reset')?.checked || false;

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
      roles,
      mustChangePin: requireReset
    });

    pinVal.value = '';
    pinLabel.value = '';
    const resetCb = root.querySelector('#new-pin-require-reset');
    if (resetCb) resetCb.checked = false;
    showFeedback(pinFeedback, 'PIN authorized and written to security databank.', 'ok');
    syncFromServer();
    updatePinList();
  };

  // Fine-grained Edit Access Clearance handler
  window.editPinAccess = (pinValue) => {
    const pins = getPins();
    const target = pins.find(p => p.pin === pinValue);
    if (!target) return;

    const allPermissions = [
      { key: 'aimodals', label: 'AI Modals Pipeline' },
      { key: 'generate', label: 'Image Generation' },
      { key: 'lora', label: 'LoRA Usage' },
      { key: 'upscaler', label: 'Resolution Upscaler' },
      { key: 'video', label: 'Video Gen (Txt2Vid & Img2Vid)' },
      { key: 'director', label: 'Cyber-Director Studio' },
      { key: 'assets', label: 'Modal Asset Manager' },
      { key: 'voice', label: 'RVC Voice Cloner' },
      { key: 'music', label: 'Music Generator' },
      { key: 'subroutines', label: 'Subroutine Console' },
      { key: 'vault', label: 'Classified Core Vault' },
      { key: 'research', label: 'Research Center' },
      { key: 'lore', label: 'System Lore' },
      { key: 'diagnostics', label: 'Chronological Evolution' },
      { key: 'admin', label: 'Administrator Superuser' }
    ];

    const modalBody = document.createElement('div');
    modalBody.style.cssText = 'padding: 10px 0; font-family: var(--font-mono);';

    let checkboxesHtml = allPermissions.map(p => {
      const checked = (target.roles || []).includes(p.key) ? 'checked' : '';
      return `
        <label style="display:flex; align-items:center; gap:8px; padding:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:3px; font-size:0.75rem; cursor:pointer;">
          <input type="checkbox" class="modal-role-chk" value="${p.key}" ${checked} />
          <span style="color:#fff;">${p.label}</span>
        </label>
      `;
    }).join('');

    modalBody.innerHTML = `
      <p style="font-size:0.8rem; color:#aaa; margin-bottom:12px;">
        Profile: <strong style="color:var(--accent, #06b6d4);">${target.label}</strong> [PIN: ${target.pin === '672167566' ? '*******' : target.pin}]
      </p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; max-height:300px; overflow-y:auto; padding-right:4px;">
        ${checkboxesHtml}
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <div style="display:flex; gap:6px;">
          <button type="button" class="aim-btn aim-btn-sm" id="modal-sel-all">SELECT ALL</button>
          <button type="button" class="aim-btn aim-btn-sm" id="modal-sel-none">CLEAR</button>
        </div>
        <button type="button" class="aim-btn" id="modal-save-roles" style="background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; font-weight:bold;">
          SAVE CLEARANCES
        </button>
      </div>
    `;

    modalBody.querySelector('#modal-sel-all').onclick = () => {
      modalBody.querySelectorAll('.modal-role-chk').forEach(c => c.checked = true);
    };
    modalBody.querySelector('#modal-sel-none').onclick = () => {
      modalBody.querySelectorAll('.modal-role-chk').forEach(c => c.checked = false);
    };

    modalBody.querySelector('#modal-save-roles').onclick = () => {
      const selected = Array.from(modalBody.querySelectorAll('.modal-role-chk:checked')).map(c => c.value);
      updatePin(target.pin, { roles: selected });
      showModal({ title: '', content: '' }); // close modal
      showFeedback(pinFeedback, `ACCESS CLEARANCES UPDATED FOR ${target.label.toUpperCase()}.`, 'ok');
      syncFromServer();
      updatePinList();
    };

    showModal({
      title: `FINE-GRAINED ACCESS CONTROL // ${target.label.toUpperCase()}`,
      content: modalBody
    });
  };

  // Reassign PIN handler
  window.reassignPin = (pinValue) => {
    const pins = getPins();
    const target = pins.find(p => p.pin === pinValue);
    if (!target) return;

    if (pinValue === '672167566') {
      showFeedback(pinFeedback, 'ERROR: Master Architect PIN cannot be reassigned here.', 'error');
      return;
    }

    const newPin = window.prompt(`REASSIGN ACCESS PIN FOR "${target.label}"\nEnter new 8 or 9 digit PIN:`, target.pin);
    if (!newPin) return;

    if (!/^\d{8,9}$/.test(newPin.trim())) {
      showFeedback(pinFeedback, 'ERROR: PIN must be exactly 8 or 9 digits.', 'error');
      return;
    }

    const cleanNewPin = newPin.trim();
    if (pins.some(p => p.pin === cleanNewPin && p.pin !== pinValue)) {
      showFeedback(pinFeedback, 'ERROR: That PIN is already assigned to another profile.', 'error');
      return;
    }

    updatePin(pinValue, { pin: cleanNewPin });
    showFeedback(pinFeedback, `PIN REASSIGNED TO ${cleanNewPin} FOR ${target.label.toUpperCase()}.`, 'ok');
    syncFromServer();
    updatePinList();
  };

  // Toggle Require New PIN on Next Entry
  window.togglePinReset = (pinValue) => {
    const pins = getPins();
    const target = pins.find(p => p.pin === pinValue);
    if (!target) return;

    const nextState = !target.mustChangePin;
    updatePin(pinValue, { mustChangePin: nextState });
    showFeedback(pinFeedback, `PIN RESET DIRECTIVE ${nextState ? 'ACTIVATED' : 'CLEARED'} FOR ${target.label.toUpperCase()}.`, 'ok');
    syncFromServer();
    updatePinList();
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


  const pendingListBody = root.querySelector('#pending-list-body');

  async function updatePendingProfiles() {
    try {
      const pin = sessionStorage.getItem('current_pin');
      const res = await fetch(apiUrl('/api/pending-profiles'), {
        headers: { 'x-user-pin': pin }
      });
      if (!res || !res.ok) return;
      const profiles = await res.json();

      if (!profiles || profiles.length === 0) {
        pendingListBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">NO PENDING REQUESTS.</td></tr>';
        return;
      }

      pendingListBody.innerHTML = '';
      profiles.forEach((p, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="table-label">${escapeHTML(p.username)}</td>
          <td class="table-mono">${escapeHTML(p.email)}</td>
          <td class="table-mono">${escapeHTML(p.pin)}</td>
          <td>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; max-width: 250px;">
              <label style="font-size: 0.65rem;"><input type="checkbox" class="pending-role-${i}" value="aimodals"> AI</label>
              <label style="font-size: 0.65rem;"><input type="checkbox" class="pending-role-${i}" value="generate"> Gen</label>
              <label style="font-size: 0.65rem;"><input type="checkbox" class="pending-role-${i}" value="lora"> LoRA</label>
              <label style="font-size: 0.65rem;"><input type="checkbox" class="pending-role-${i}" value="vault"> Vault</label>
              <label style="font-size: 0.65rem;"><input type="checkbox" class="pending-role-${i}" value="diagnostics"> Diag</label>
            </div>
          </td>
          <td>
            <button class="aim-btn aim-btn-sm" onclick="approvePending('${p.pin}', ${i})" style="margin-right: 8px; color: #00ff64; border-color: rgba(0,255,100,0.3);">APPROVE</button>
            <button class="aim-btn aim-btn-sm" onclick="rejectPending('${p.pin}')" style="color: #ff003c; border-color: rgba(255,0,60,0.3);">REJECT</button>
          </td>
        `;
        pendingListBody.appendChild(tr);
      });
    } catch (e) {
      console.error('Failed to update pending profiles', e);
    }
  }

  window.approvePending = async (pinValue, index) => {
    const roleBoxes = document.querySelectorAll(`.pending-role-${index}:checked`);
    const roles = Array.from(roleBoxes).map(b => b.value);

    try {
      const authPin = sessionStorage.getItem('current_pin');

      const res = await fetch(apiUrl('/api/pending-profiles/approve'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pin': authPin
        },
        body: JSON.stringify({ pin: pinValue, roles })
      });

      if (res && res.ok) {
        showFeedback(pinFeedback, 'PROFILE APPROVED AND AUTHORIZED.', 'ok');

        // Sync the DB down from the server to get updated pins
        await syncFromServer();

        updatePendingProfiles();
        updatePinList();
      } else {
        showFeedback(pinFeedback, 'ERROR APPROVING PROFILE.', 'error');
      }
    } catch (e) {
      showFeedback(pinFeedback, 'NETWORK ERROR.', 'error');
    }
  };

  window.rejectPending = async (pinValue) => {
    if (!confirm('Are you sure you want to reject and delete this profile request?')) return;

    try {
      const authPin = sessionStorage.getItem('current_pin');

      const res = await fetch(apiUrl('/api/pending-profiles/reject'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pin': authPin
        },
        body: JSON.stringify({ pin: pinValue })
      });

      if (res.ok) {
        showFeedback(pinFeedback, 'PROFILE REQUEST REJECTED.', 'ok');
        updatePendingProfiles();
      } else {
        showFeedback(pinFeedback, 'ERROR REJECTING PROFILE.', 'error');
      }
    } catch (e) {
      showFeedback(pinFeedback, 'NETWORK ERROR.', 'error');
    }
  };

  // Render authorized PINs table
  function updatePinList() {
    const pins = getPins();
    pinListBody.innerHTML = '';

    pins.forEach(p => {
      let statusHtml = '';
      if (p.mustChangePin) {
        statusHtml += '<span class="status-amber" style="display:inline-block; margin-bottom:2px; font-weight:bold;">[!] PIN RESET REQ</span><br/>';
      }
      if (p.type === 'permanent') {
        statusHtml += '<span class="status-green">NEVER</span>';
      } else if (p.type === 'one-time') {
        statusHtml += p.used ? '<span class="status-red">USED</span>' : '<span class="status-green">ACTIVE (OTP)</span>';
      } else if (p.type === 'temporary') {
        const remaining = p.expiresAt - Date.now();
        if (remaining <= 0) {
          statusHtml += '<span class="status-red">EXPIRED</span>';
        } else {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0');
          statusHtml += `<span class="status-amber">Expires in ${m}:${s}</span>`;
        }
      }

      const isMaster = p.pin === '672167566';
      const rolesList = (p.roles || []).map(r => `<span style="display:inline-block; background:rgba(6,182,212,0.15); border:1px solid rgba(6,182,212,0.3); color:#38bdf8; padding:1px 5px; border-radius:2px; margin:1px; font-size:0.6rem;">${r.toUpperCase()}</span>`).join('');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="table-label" style="font-weight:bold;">${p.label}</td>
        <td class="table-mono">${isMaster ? '*******' : p.pin}</td>
        <td style="max-width:200px;">
          <div style="display:flex; flex-wrap:wrap; gap:2px; align-items:center;">
            ${rolesList || '<span style="color:#666; font-size:0.65rem;">NONE</span>'}
          </div>
        </td>
        <td class="table-mono" style="font-size:0.7rem;">${p.type.toUpperCase()}</td>
        <td>${statusHtml}</td>
        <td>
          <div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">
            <button class="aim-btn aim-btn-sm" onclick="editPinAccess('${p.pin}')" style="padding:3px 7px; font-size:0.7rem; color:var(--accent,#06b6d4); border-color:var(--accent,#06b6d4);" title="Configure fine-grained clearances">
              🛡️ ACCESS
            </button>
            <button class="aim-btn aim-btn-sm" onclick="reassignPin('${p.pin}')" ${isMaster ? 'disabled' : ''} style="padding:3px 7px; font-size:0.7rem;" title="Assign or update PIN">
              🔑 PIN
            </button>
            <button class="aim-btn aim-btn-sm" onclick="togglePinReset('${p.pin}')" style="padding:3px 7px; font-size:0.7rem; color:${p.mustChangePin ? '#ef4444' : '#f59e0b'}; border-color:${p.mustChangePin ? '#ef4444' : '#f59e0b'};" title="Require new PIN on next login">
              ${p.mustChangePin ? '✕ CANCEL REQ' : '🔄 REQ RESET'}
            </button>
            <button class="aim-btn aim-btn-sm" onclick="revokePin('${p.pin}')" ${isMaster ? 'disabled' : ''} style="padding:3px 7px; font-size:0.7rem; border-color:${isMaster ? 'rgba(255,255,255,0.1)' : 'var(--accent, #ff003c)'}; color:${isMaster ? 'rgba(255,255,255,0.2)' : 'var(--accent, #ff003c)'}">
              REVOKE
            </button>
          </div>
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
        
        <div class="aim-field" style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed rgba(255, 0, 60, 0.4);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="aim-label" style="color: var(--accent, #ff003c); margin-bottom: 0;">// CLASSIFIED_SUBSTRATE</label>
            <span style="font-family: 'Share Tech Mono', monospace; font-size: 0.65rem; color: #ff003c; background: rgba(255,0,60,0.15); border: 1px solid rgba(255,0,60,0.4); padding: 1px 6px; border-radius: 3px; letter-spacing: 1px;">ARCHITECT ONLY</span>
          </div>
          <a href="#/placeholder" id="btn-portal-placeholder" class="aim-btn" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 4px; background: rgba(255, 0, 60, 0.18); border-color: #ff003c; color: #fff; text-shadow: 0 0 10px #ff003c; text-decoration: none; font-family: 'Orbitron', sans-serif; font-size: 0.78rem; letter-spacing: 1.5px; padding: 10px; transition: all 0.25s ease;">
            🔒 ACCESS [PLACEHOLDER] // MATRIX HOMEBREW
          </a>
          <p style="font-family: 'Share Tech Mono', monospace; font-size: 0.68rem; color: rgba(255,255,255,0.45); margin-top: 5px; text-align: center;">
            Hidden sandbox substrate accessible strictly via Darkened State directives.
          </p>
        </div>

        <button class="aim-btn" id="btn-revert-darkness" style="margin-top: 15px; border-color: #555; color: #777; width: 100%;">REVERT TO STANDARD</button>
      </div>
    `;

    const revertBtn = darknessSlot.querySelector('#btn-revert-darkness');
    const placeholderPortalBtn = darknessSlot.querySelector('#btn-portal-placeholder');

    if (placeholderPortalBtn) {
      placeholderPortalBtn.onclick = () => {
        playSFX('navigate', 0.6);
      };
    }

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
  updatePendingProfiles();

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

  const logSearchInput = root.querySelector('#admin-log-search');
  if (logSearchInput) {
    logSearchInput.addEventListener('input', () => {
      renderLogs();
    });
  }

  renderLogs();

  function renderLogs() {
    const logsBody = root.querySelector('#user-logs-body');
    let logs = getLogs();
    const query = (logSearchInput?.value || '').trim().toLowerCase();
    
    if (query) {
      logs = logs.filter(l => {
        const p = (l.profile || '').toLowerCase();
        const a = (l.action || '').toLowerCase();
        const d = JSON.stringify(l.details || '').toLowerCase();
        return p.includes(query) || a.includes(query) || d.includes(query);
      });
    }

    if (logs.length === 0) {
      logsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">NO LOGS MATCHING CRITERIA.</td></tr>';
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

  // Export Logs
  const exportLogsBtn = root.querySelector('#btn-export-logs');
  if (exportLogsBtn) {
    exportLogsBtn.addEventListener('click', () => {
      const logs = getLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alphacore_event_logs_${Date.now()}.json`;
      a.click();
    });
  }

  // ─── Broadcast Prompt Manager Logic ───────────────────────────────
  const notifBadge = root.querySelector('#notif-client-perm-badge');
  const broadcastTitle = root.querySelector('#broadcast-title-input');
  const broadcastMsg = root.querySelector('#broadcast-msg-input');
  const broadcastTarget = root.querySelector('#broadcast-target-select');
  const broadcastUrgency = root.querySelector('#broadcast-urgency-select');
  const sendBroadcastBtn = root.querySelector('#btn-send-broadcast');
  const testNotifBtn = root.querySelector('#btn-test-notif');
  const broadcastFeedback = root.querySelector('#broadcast-feedback');

  function updateNotifBadge() {
    if (!notifBadge) return;
    const perm = getNotificationPermission();
    if (perm === 'granted') {
      notifBadge.textContent = 'STATUS: ACTIVE (ENABLED)';
      notifBadge.style.color = '#10b981';
      notifBadge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
      notifBadge.style.background = 'rgba(16, 185, 129, 0.15)';
    } else if (perm === 'denied') {
      notifBadge.textContent = 'STATUS: BLOCKED (BROWSER)';
      notifBadge.style.color = '#ef4444';
      notifBadge.style.borderColor = 'rgba(239, 68, 68, 0.5)';
      notifBadge.style.background = 'rgba(239, 68, 68, 0.15)';
    } else {
      notifBadge.textContent = 'STATUS: AWAITING PERMISSION';
      notifBadge.style.color = '#f59e0b';
      notifBadge.style.borderColor = 'rgba(245, 158, 11, 0.5)';
      notifBadge.style.background = 'rgba(245, 158, 11, 0.15)';
    }
  }
  updateNotifBadge();

  if (testNotifBtn) {
    testNotifBtn.onclick = async () => {
      const perm = await requestNotificationPermission();
      updateNotifBadge();
      if (perm === 'granted') {
        broadcastFeedback.textContent = 'TEST NOTIFICATION SENT TO ACTIVE CLIENT.';
        broadcastFeedback.style.color = '#10b981';
      } else {
        broadcastFeedback.textContent = 'BROWSER NOTIFICATION PERMISSION NOT GRANTED.';
        broadcastFeedback.style.color = '#ef4444';
      }
    };
  }

  if (sendBroadcastBtn) {
    sendBroadcastBtn.onclick = async () => {
      const title = (broadcastTitle.value || '').trim();
      const message = (broadcastMsg.value || '').trim();
      const target = broadcastTarget.value;
      const urgency = broadcastUrgency.value;

      if (!message) {
        broadcastFeedback.textContent = 'ERROR: BROADCAST MESSAGE CONTENT REQUIRED.';
        broadcastFeedback.style.color = '#ef4444';
        return;
      }

      sendBroadcastBtn.disabled = true;
      sendBroadcastBtn.textContent = 'DISPATCHING BROADCAST...';
      broadcastFeedback.textContent = '';

      try {
        await dispatchBroadcast({
          title: title || '◢ ALPHACORE TECH // ALERT ◣',
          message,
          target,
          urgency,
          url: '/#/overview'
        });

        playSFX('response', 0.8);
        logAction('BROADCAST_DISPATCHED', { title, target, urgency, preview: message.slice(0, 50) });
        broadcastFeedback.textContent = `SUCCESS: TRANSMISSION DISPATCHED TO [${target}].`;
        broadcastFeedback.style.color = '#00ffcc';
        broadcastMsg.value = '';
        renderLogs();
      } catch (err) {
        broadcastFeedback.textContent = `DISPATCH FAILED: ${err.message || 'Transmission error'}`;
        broadcastFeedback.style.color = '#ef4444';
      } finally {
        sendBroadcastBtn.disabled = false;
        sendBroadcastBtn.textContent = '⚡ DISPATCH NOTIFICATION BROADCAST';
      }
    };
  }

  return root;
}