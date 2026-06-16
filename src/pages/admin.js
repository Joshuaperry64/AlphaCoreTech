import { createElement } from '../components/utils.js';
import { buildPinPad, getPins, addPin, revokePin } from '../components/pinpad.js';

export default function AdminPage() {
  const container = createElement('div', { class: 'admin-panel-page' });

  function showAdmin() {
    container.innerHTML = '';
    container.appendChild(buildAdminUI());
  }

  // Check if authenticated
  if (sessionStorage.getItem('admin_authenticated')) {
    showAdmin();
  } else {
    container.appendChild(buildPinPad({
      authKey: 'admin_authenticated',
      onSuccess: showAdmin,
      title: 'ALPHACORE // ADMIN_LOCKOUT',
      subtitle: 'ADMINISTRATOR AUTHENTICATION REQUIRED',
      icon: '⚙'
    }));
  }

  return container;
}

function buildAdminUI() {
  const root = document.createElement('div');
  root.className = 'admin-root';

  const defaultSettings = {
    txt2imgUrl: 'https://ai-alphacore-tech--text-to-image-sdxl-merger-inference-web.modal.run/',
    img2imgUrl: 'https://ai-alphacore-tech--img2img-qwen-edit-plus-model-web.modal.run/',
    negativePrompt: 'worst quality, low quality, censorship, text, watermark, signature, blur, bad anatomy, ugly, deformed'
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

      <!-- Generator configuration -->
      <div class="panel">
        <div class="panel-title">// GENERATOR_PIPELINE_DEFAULTS</div>
        <div class="config-form">
          <div class="aim-field">
            <label class="aim-label" for="cfg-t2i-url">TXT2IMG ROUTING ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-t2i-url" value="${settings.txt2imgUrl}" />
          </div>
          <div class="aim-field" style="margin-top: 12px;">
            <label class="aim-label" for="cfg-i2i-url">IMG2IMG ROUTING ENDPOINT</label>
            <input class="aim-input" type="text" id="cfg-i2i-url" value="${settings.img2imgUrl}" />
          </div>
          <div class="aim-field" style="margin-top: 12px;">
            <label class="aim-label" for="cfg-neg">GLOBAL DEFAULT NEGATIVE PROMPT</label>
            <textarea class="aim-textarea" id="cfg-neg" rows="4">${settings.negativePrompt}</textarea>
          </div>
          <button class="aim-btn aim-btn-generate" id="btn-save-cfg" style="margin-top: 15px;">
            SAVE GENERATIVE PIPELINES
          </button>
          <div class="admin-feedback" id="cfg-form-feedback"></div>
        </div>

        <div class="header-line" style="margin: 20px 0 15px 0; opacity: 0.3;"></div>

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
  const cfgNeg = root.querySelector('#cfg-neg');
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

    if (!/^\d{8,9}$/.test(pin)) {
      showFeedback(pinFeedback, 'ERROR: PIN must be exactly 8 or 9 digits.', 'error');
      return;
    }

    addPin({
      pin,
      type,
      durationSeconds: durationMin * 60,
      label
    });

    pinVal.value = '';
    pinLabel.value = '';
    showFeedback(pinFeedback, 'PIN authorized and written to security databank.', 'ok');
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
        <td class="table-mono">${p.type.toUpperCase()}</td>
        <td>${statusHtml}</td>
        <td>
          <button class="aim-btn aim-btn-sm" onclick="revokePin('${p.pin}')" ${isMaster ? 'disabled' : ''} style="border-color:${isMaster ? 'rgba(255,255,255,0.1)' : 'var(--accent, #ff003c)'}; color:${isMaster ? 'rgba(255,255,255,0.2)' : 'var(--accent, #ff003c)'}">
            REVOKE
          </button>
        </td>
      `;
      pinListBody.appendChild(tr);
    });
  }

  // Periodic active tokens status refresh (for temp countdowns)
  const refreshInterval = setInterval(updatePinList, 1000);

  // Save generative defaults
  saveCfgBtn.onclick = (e) => {
    e.preventDefault();
    const t2i = cfgT2iUrl.value.trim();
    const i2i = cfgI2iUrl.value.trim();
    const neg = cfgNeg.value.trim();

    if (!t2i || !i2i) {
      showFeedback(cfgFeedback, 'ERROR: Pipeline endpoints cannot be empty.', 'error');
      return;
    }

    const newSettings = {
      txt2imgUrl: t2i,
      img2imgUrl: i2i,
      negativePrompt: neg,
      guidanceScale: settings.guidanceScale || '7.0'
    };

    localStorage.setItem('alphacore_modal_settings', JSON.stringify(newSettings));
    showFeedback(cfgFeedback, 'Generative pipeline configurations synchronized.', 'ok');
  };

  // Embrace the darkness alternate state trigger
  darknessBtn.onclick = (e) => {
    e.preventDefault();
    darknessBtn.classList.add('hidden');
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
      </div>
    `;

    const darkRange = darknessSlot.querySelector('#dark-range');
    const darkVal = darknessSlot.querySelector('#dark-str-val');
    const freqBtns = darknessSlot.querySelectorAll('#dark-freq-seg .aim-seg-btn');

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

    console.log('[SYS] Adopted Alternate Persona: Luci. Standard safety mechanisms overridden.');
  };

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

  return root;
}
