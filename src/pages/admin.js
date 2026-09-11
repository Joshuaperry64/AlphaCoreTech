import { createElement, escapeHTML } from '../components/utils.js';
import { buildPinPad, getPins, addPin, revokePin, requireAuth } from '../components/pinpad.js';
import { getLogs, clearLogs } from '../components/logger.js';

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

  const defaultSettings = {
    txt2imgUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-txt2img-w-235075.modal.run',
    img2imgUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-img2img-w-0e3ec9.modal.run',
    preprocessorUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-preproces-d30863.modal.run',
    txt2vidUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-txt2vid-w-2cf2c7.modal.run/stream',
    img2vidUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-img2vid-w-784511.modal.run/stream',
    framepackUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-framepack-e7f107.modal.run',
    fanninCrimeUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-fannin-sc-92fe44.modal.run/api/mugshots',
    music_url: 'https://alphacoreprogramming-ai--alphacore-aio-backend-alphacore-f5c3d8.modal.run',
    negativePrompt: 'worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts',
    stepsFastTxt: 20,
    stepsNormalTxt: 30,
    stepsFocusedTxt: 60,
    stepsFastImg: 15,
    stepsNormalImg: 25,
    stepsFocusedImg: 40,
    guidanceImg: 4.0
  };

  let settings = { ...defaultSettings };
  try {
    const custom = localStorage.getItem('alphacore_modal_settings');
    if (custom) {
      settings = { ...defaultSettings, ...JSON.parse(custom) };
    }
  } catch (e) {
    console.error(e);
  }

  root.innerHTML = `
    <div class="aim-header">
      <div class="aim-header-badge">[SYS_ADMIN] // CORE_CONFIG</div>
      <h1 class="glitch aim-title" data-text="ALPHACORE // ADMINISTRATION">ALPHACORE // ADMINISTRATION</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Modify security protocols, register/revoke authorization access tokens, and calibrate generator pipeline defaults.</p>
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

    <!-- Generator configuration -->
    <div class="panel" style="margin-top: 20px;">
      <div class="panel-title">// GENERATOR_PIPELINE_DEFAULTS</div>
      <div class="config-form">
        <div class="aim-row">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="cfg-t2i-url">TXT2IMG ROUTING ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-t2i-url" value="${settings.txt2imgUrl}" />
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="cfg-i2i-url">IMG2IMG ROUTING ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-i2i-url" value="${settings.img2imgUrl}" />
          </div>
        </div>
        <div class="aim-row" style="margin-top: 12px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="cfg-t2v-url">TXT2VID ROUTING ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-t2v-url" value="${settings.txt2vidUrl}" />
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="cfg-i2v-url">IMG2VID ROUTING ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-i2v-url" value="${settings.img2vidUrl}" />
          </div>
        </div>
        <div class="aim-row" style="margin-top: 12px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="cfg-framepack-url">FRAMEPACK STUDIO ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-framepack-url" value="${settings.framepackUrl}" />
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="cfg-fannin-url">MUGSHOT SCRAPER ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-fannin-url" value="${settings.fanninCrimeUrl}" />
          </div>
        </div>
        <div class="aim-field" style="margin-top: 12px;">
          <label class="aim-label" for="cfg-neg">GLOBAL DEFAULT NEGATIVE PROMPT</label>
          <textarea class="aim-textarea" id="cfg-neg" rows="2">${settings.negativePrompt}</textarea>
        </div>
        <div class="aim-row" style="margin-top: 12px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" style="margin-bottom: 5px;">TXT2IMG STEPS</label>
            <div class="flex-row" style="display: flex; gap: 10px;">
              <div style="flex:1;">
                <label style="display:block; font-size:10px; color:rgba(0,184,255,0.7); margin-bottom:4px; font-family:monospace;">FAST</label>
                <input class="aim-input" type="number" id="cfg-t2i-fast" value="${settings.stepsFastTxt}" style="width:100%; text-align:center;" />
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:10px; color:rgba(0,184,255,0.7); margin-bottom:4px; font-family:monospace;">FOCUSED</label>
                <input class="aim-input" type="number" id="cfg-t2i-focused" value="${settings.stepsFocusedTxt}" style="width:100%; text-align:center;" />
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:10px; color:rgba(0,184,255,0.7); margin-bottom:4px; font-family:monospace;">NORMAL</label>
                <input class="aim-input" type="number" id="cfg-t2i-normal" value="${settings.stepsNormalTxt}" style="width:100%; text-align:center;" />
              </div>
            </div>
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" style="margin-bottom: 5px;">IMG2IMG STEPS</label>
            <div class="flex-row" style="display: flex; gap: 10px;">
              <div style="flex:1;">
                <label style="display:block; font-size:10px; color:rgba(0,184,255,0.7); margin-bottom:4px; font-family:monospace;">FAST</label>
                <input class="aim-input" type="number" id="cfg-i2i-fast" value="${settings.stepsFastImg}" style="width:100%; text-align:center;" />
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:10px; color:rgba(0,184,255,0.7); margin-bottom:4px; font-family:monospace;">FOCUSED</label>
                <input class="aim-input" type="number" id="cfg-i2i-focused" value="${settings.stepsFocusedImg}" style="width:100%; text-align:center;" />
              </div>
              <div style="flex:1;">
                <label style="display:block; font-size:10px; color:rgba(0,184,255,0.7); margin-bottom:4px; font-family:monospace;">NORMAL</label>
                <input class="aim-input" type="number" id="cfg-i2i-normal" value="${settings.stepsNormalImg}" style="width:100%; text-align:center;" />
              </div>
            </div>
          </div>
        </div>
        <div class="aim-row" style="margin-top: 12px;">
           <div class="aim-field aim-field-half">
              <label class="aim-label" for="cfg-i2i-guidance">IMG2IMG DEFAULT GUIDANCE</label>
              <input class="aim-input" type="number" step="0.1" id="cfg-i2i-guidance" value="${settings.guidanceImg}" style="max-width:200px;" />
           </div>
           <div class="aim-field aim-field-half" style="display: flex; align-items: flex-end; justify-content: flex-end; gap: 10px;">
              <button class="aim-btn" id="btn-reset-cfg" style="width: auto; padding-left: 20px; padding-right: 20px; background: rgba(255, 0, 60, 0.1); border-color: var(--accent, #ff003c); color: var(--accent, #ff003c);">
                RESET TO DEFAULTS
              </button>
              <button class="aim-btn aim-btn-generate" id="btn-save-cfg" style="width: auto; padding-left: 30px; padding-right: 30px;">
                SAVE PIPELINES
              </button>
           </div>
        </div>
        <div class="admin-feedback" id="cfg-form-feedback"></div>
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
  
  const cfgT2iUrl = root.querySelector('#cfg-t2i-url');
  const cfgI2iUrl = root.querySelector('#cfg-i2i-url');
  const cfgT2vUrl = root.querySelector('#cfg-t2v-url');
  const cfgI2vUrl = root.querySelector('#cfg-i2v-url');
  const cfgFramepackUrl = root.querySelector('#cfg-framepack-url');
  const cfgFanninUrl = root.querySelector('#cfg-fannin-url');
  const cfgNeg = root.querySelector('#cfg-neg');
  const cfgT2iFast = root.querySelector('#cfg-t2i-fast');
  const cfgT2iFocused = root.querySelector('#cfg-t2i-focused');
  const cfgT2iNormal = root.querySelector('#cfg-t2i-normal');
  const cfgI2iFast = root.querySelector('#cfg-i2i-fast');
  const cfgI2iFocused = root.querySelector('#cfg-i2i-focused');
  const cfgI2iNormal = root.querySelector('#cfg-i2i-normal');
  const cfgI2iGuidance = root.querySelector('#cfg-i2i-guidance');
  const saveCfgBtn = root.querySelector('#btn-save-cfg');
  const cfgFeedback = root.querySelector('#cfg-form-feedback');
  
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
    
    // Set active profile name
    sessionStorage.setItem('current_profile', target.label);
    
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
    if (!container.isConnected) {
      clearInterval(refreshInterval);
      return;
    }
    updatePinList();
  }, 1000);

  // Reset generative defaults button
  const resetCfgBtn = root.querySelector('#btn-reset-cfg');
  if (resetCfgBtn) {
    resetCfgBtn.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('alphacore_modal_settings');
      showFeedback(cfgFeedback, 'Pipeline settings purged from localStorage. Restoring active cloud defaults...', 'ok');
      setTimeout(() => window.location.reload(), 800);
    };
  }

  // Save generative defaults
  saveCfgBtn.onclick = (e) => {
    e.preventDefault();
    const t2i = cfgT2iUrl.value.trim();
    const i2i = cfgI2iUrl.value.trim();
    const t2v = cfgT2vUrl.value.trim();
    const i2v = cfgI2vUrl.value.trim();
    const fp = cfgFramepackUrl.value.trim();
    const fannin = cfgFanninUrl.value.trim();
    const neg = cfgNeg.value.trim();

    if (!t2i || !i2i) {
      showFeedback(cfgFeedback, 'ERROR: Pipeline endpoints cannot be empty.', 'error');
      return;
    }

    const newSettings = {
      txt2imgUrl: t2i.replace(/\/+$/, ''),
      img2imgUrl: i2i.replace(/\/+$/, ''),
      preprocessorUrl: (settings.preprocessorUrl || 'https://alphacoreprogramming-ai--alphacore-aio-backend-preproces-d30863.modal.run').replace(/\/+$/, ''),
      txt2vidUrl: t2v,
      img2vidUrl: i2v,
      framepackUrl: fp,
      fanninCrimeUrl: fannin,
      negativePrompt: neg,
      guidanceScale: settings.guidanceScale || '7.0',
      stepsFastTxt: parseInt(cfgT2iFast.value) || 2,
      stepsFocusedTxt: parseInt(cfgT2iFocused.value) || 4,
      stepsNormalTxt: parseInt(cfgT2iNormal.value) || 8,
      stepsFastImg: parseInt(cfgI2iFast.value) || 20,
      stepsFocusedImg: parseInt(cfgI2iFocused.value) || 30,
      stepsNormalImg: parseInt(cfgI2iNormal.value) || 40,
      guidanceImg: parseFloat(cfgI2iGuidance.value) || 7.0
    };

    localStorage.setItem('alphacore_modal_settings', JSON.stringify(newSettings));
    import('../components/db_sync.js').then(module => module.pushToServer('settings', newSettings));
    showFeedback(cfgFeedback, 'Generative pipeline configurations synchronized.', 'ok');
  };

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
        <button class="aim-btn" id="btn-revert-darkness" style="margin-top: 15px; border-color: #555; color: #777; width: 100%;">REVERT TO STANDARD</button>
      </div>
    `;
    
    const darkRange = darknessSlot.querySelector('#dark-range');
    const darkVal = darknessSlot.querySelector('#dark-str-val');
    const freqBtns = darknessSlot.querySelectorAll('#dark-freq-seg .aim-seg-btn');
    const revertBtn = darknessSlot.querySelector('#btn-revert-darkness');

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
  const observer = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      clearInterval(refreshInterval);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

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