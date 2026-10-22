/**
 * AlphaCore App Manager (APK Distribution & Modal Volume Enclave)
 * Allows specified users access to individual .apk downloads saved in a modal volume
 * locked to the designated Modal profile (josh627764).
 */
import { createElement, escapeHTML } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { playSFX } from '../components/audio.js';
import { showModal } from '../components/modal.js';
import { buildPinPad } from '../components/pinpad.js';

export default function AppManagerPage() {
  const container = createElement('div', { class: 'app-manager-page slide-up' });

  // Session state
  let currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim();
  let currentPin = (sessionStorage.getItem('current_pin') || '').trim();
  let isArchitect = currentProfile.toLowerCase() === 'architect' || currentPin === '672167566';
  let appsList = [];
  let activeFilter = 'all'; // 'all', 'authorized', 'restricted'
  let searchQuery = '';

  const TARGET_MODAL_PROFILE = 'josh627764';
  const APPS_MODAL_VOLUME = 'alpha-apps';

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:8px;">
        <div>
          <div class="aim-header-badge" style="font-size:0.75rem; letter-spacing:1px; margin-bottom:4px;">
            [ENCLAVE_SYSTEM] // APK_DISTRIBUTION_NODE
          </div>
          <h1 class="page-title glitch" data-text="ALPHA APP MANAGER" style="margin:0; font-family:'Orbitron',sans-serif; letter-spacing:2px; font-size:1.6rem;">
            ALPHA APP MANAGER
          </h1>
        </div>
        
        <!-- TELEMETRY BADGES -->
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <div style="background:rgba(6,182,212,0.12); border:1px solid #06b6d4; color:#06b6d4; padding:5px 12px; font-family:var(--font-hud); font-size:0.75rem; border-radius:2px; font-weight:bold; display:flex; align-items:center; gap:6px;">
            <span style="color:#00ff9d; animation:blink 1.5s infinite;">●</span>
            MODAL PROFILE: <span style="color:#fff;">${TARGET_MODAL_PROFILE}</span> [LOCKED]
          </div>

          <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; padding:5px 12px; font-family:var(--font-hud); font-size:0.75rem; border-radius:2px; font-weight:bold;">
            VOLUME: <span style="color:#fff;">${APPS_MODAL_VOLUME}</span>
          </div>

          <button id="btn-switch-auth" class="aim-btn aim-btn-sm" style="padding:5px 10px; font-size:0.72rem; border-color:var(--accent); color:var(--accent);" title="Switch or test different user clearance PINs">
            🔑 CLEARANCE: ${currentProfile.toUpperCase()}
          </button>
        </div>
      </div>

      <p class="page-subtitle" style="font-family:'Share Tech Mono',monospace; color:var(--accent,#06b6d4); font-size:0.85rem; margin:0;">
        ENTERPRISE ANDROID APK REPOSITORY // GRANULAR USER ACCESS CONTROL & SECURE VOLUME STREAMING
      </p>
    </div>

    <!-- STATS OVERVIEW -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px;">
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(0,184,255,0.25);">
        <div style="font-size:0.7rem; color:var(--blue-dim); font-family:var(--font-hud);">MANAGED APPLICATIONS</div>
        <div id="stat-total-apps" style="font-size:1.4rem; font-family:'Orbitron',sans-serif; color:#00b8ff; font-weight:bold; margin-top:4px;">--</div>
      </div>
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(0,255,157,0.25);">
        <div style="font-size:0.7rem; color:#00ff9d; font-family:var(--font-hud);">AUTHORIZED FOR CURRENT USER</div>
        <div id="stat-auth-apps" style="font-size:1.4rem; font-family:'Orbitron',sans-serif; color:#00ff9d; font-weight:bold; margin-top:4px;">--</div>
      </div>
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(255,0,60,0.25);">
        <div style="font-size:0.7rem; color:#ff003c; font-family:var(--font-hud);">RESTRICTED / LOCKED</div>
        <div id="stat-locked-apps" style="font-size:1.4rem; font-family:'Orbitron',sans-serif; color:#ff003c; font-weight:bold; margin-top:4px;">--</div>
      </div>
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(245,158,11,0.25);">
        <div style="font-size:0.7rem; color:#f59e0b; font-family:var(--font-hud);">TOTAL DISPATCHED DOWNLOADS</div>
        <div id="stat-downloads" style="font-size:1.4rem; font-family:'Orbitron',sans-serif; color:#f59e0b; font-weight:bold; margin-top:4px;">--</div>
      </div>
    </div>

    <!-- CONTROLS & FILTER BAR -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px;">
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="aim-btn filter-btn active" data-filter="all" style="font-size:0.75rem; padding:6px 14px;">ALL APKS</button>
        <button class="aim-btn filter-btn" data-filter="authorized" style="font-size:0.75rem; padding:6px 14px; border-color:#00ff9d; color:#00ff9d;">AUTHORIZED</button>
        <button class="aim-btn filter-btn" data-filter="restricted" style="font-size:0.75rem; padding:6px 14px; border-color:#ff003c; color:#ff003c;">RESTRICTED</button>
      </div>

      <div style="display:flex; gap:10px; flex-grow:1; max-width:500px;">
        <input type="text" id="app-search-input" class="aim-input" placeholder="Search by app name, package, or description..." style="font-size:0.8rem; height:36px;" />
        <button id="btn-refresh-apps" class="aim-btn" style="white-space:nowrap; padding:0 14px; font-size:0.75rem;" title="Reload from Modal Volume">
          ↻ RE-SYNC
        </button>
        ${isArchitect ? `
          <button id="btn-toggle-deploy" class="aim-btn aim-btn-generate" style="white-space:nowrap; padding:0 14px; font-size:0.75rem;" title="Upload or deploy new APK">
            + DEPLOY APK
          </button>
        ` : ''}
      </div>
    </div>

    <!-- ADMIN DEPLOYMENT DECK (COLLAPSIBLE) -->
    ${isArchitect ? `
      <div id="deploy-panel" class="panel aim-section" style="display:none; margin-bottom:24px; padding:18px; border:1px solid #00b8ff; background:rgba(8,16,28,0.95);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div style="font-family:'Orbitron',sans-serif; color:#fff; font-size:0.95rem; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
            <span style="color:#00b8ff;">▲</span> DEPLOY NEW .APK TO MODAL VOLUME [${TARGET_MODAL_PROFILE} // ${APPS_MODAL_VOLUME}]
          </div>
          <button id="btn-close-deploy" style="background:none; border:none; color:#888; cursor:pointer; font-size:1.1rem;">✕</button>
        </div>

        <form id="deploy-apk-form" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
          <div class="aim-field">
            <label class="aim-label">APPLICATION NAME</label>
            <input type="text" id="deploy-name" class="aim-input" placeholder="e.g. AlphaCore Field Recon" required />
          </div>

          <div class="aim-field">
            <label class="aim-label">UNIQUE APP ID</label>
            <input type="text" id="deploy-id" class="aim-input" placeholder="e.g. alpha-field-recon" required />
          </div>

          <div class="aim-field">
            <label class="aim-label">PACKAGE NAME</label>
            <input type="text" id="deploy-pkg" class="aim-input" placeholder="e.g. com.alphacore.fieldrecon" required />
          </div>

          <div class="aim-field">
            <label class="aim-label">FILENAME (.apk)</label>
            <input type="text" id="deploy-filename" class="aim-input" placeholder="e.g. Alpha_Field_Recon_v1.0.apk" required />
          </div>

          <div class="aim-field">
            <label class="aim-label">VERSION STRING</label>
            <input type="text" id="deploy-version" class="aim-input" placeholder="e.g. v1.0.0" value="v1.0.0" required />
          </div>

          <div class="aim-field">
            <label class="aim-label">MINIMUM ANDROID OS</label>
            <input type="text" id="deploy-min-android" class="aim-input" placeholder="e.g. Android 10+ (API 29)" value="Android 10+ (API 29)" />
          </div>

          <div class="aim-field" style="grid-column:1 / -1;">
            <label class="aim-label">DESCRIPTION</label>
            <textarea id="deploy-desc" class="aim-input" style="height:60px; resize:vertical;" placeholder="Detailed technical overview of this Android package..."></textarea>
          </div>

          <div class="aim-field" style="grid-column:1 / -1;">
            <label class="aim-label">ALLOWED PROFILES (SELECT WHO CAN DOWNLOAD)</label>
            <div id="deploy-profiles-checkboxes" style="display:flex; gap:16px; flex-wrap:wrap; margin-top:6px; background:rgba(0,0,0,0.3); padding:8px 12px; border:1px solid #334155; border-radius:3px;">
              <label style="color:#00ff9d; font-size:0.75rem; cursor:pointer;"><input type="checkbox" value="Architect" checked disabled /> Architect (Always Authorized)</label>
              <label style="color:var(--blue-dim); font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="profile-perm-cb" value="Fisherman" /> Fisherman</label>
              <label style="color:var(--blue-dim); font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="profile-perm-cb" value="J. P." /> J. P.</label>
              <label style="color:var(--blue-dim); font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="profile-perm-cb" value="john" /> john</label>
              <label style="color:#f59e0b; font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="profile-perm-cb" value="*" /> Public (All Authorized Users)</label>
            </div>
          </div>

          <div class="aim-field" style="grid-column:1 / -1;">
            <label class="aim-label">OPTIONAL BINARY FILE (.apk) // LEAVE EMPTY TO AUTO-GENERATE SIGNED ENCLAVE CONTAINER</label>
            <input type="file" id="deploy-file-input" class="aim-input" accept=".apk" style="padding:4px;" />
          </div>

          <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
            <button type="submit" id="btn-submit-deploy" class="aim-btn aim-btn-generate" style="padding:8px 24px;">
              COMMIT & DEPLOY TO MODAL VOLUME
            </button>
          </div>
        </form>
      </div>
    ` : ''}

    <!-- APP CARDS GRID -->
    <div id="apps-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:18px;">
      <div style="color:var(--blue-dim); font-family:var(--font-hud); padding:30px; text-align:center; grid-column:1 / -1;">
        CONNECTING TO MODAL VOLUME ENCLAVE [${APPS_MODAL_VOLUME}]...
      </div>
    </div>
  `;

  // Attach profile switcher
  const btnSwitchAuth = container.querySelector('#btn-switch-auth');
  if (btnSwitchAuth) {
    btnSwitchAuth.onclick = () => {
      const pinPadEl = buildPinPad({
        onSuccess: (res) => {
          showModal({ title: '', content: '' });
          currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim();
          currentPin = (sessionStorage.getItem('current_pin') || '').trim();
          isArchitect = currentProfile.toLowerCase() === 'architect' || currentPin === '672167566';
          fetchApps();
        },
        title: '// AUTHENTICATE_USER_CLEARANCE',
        subtitle: 'ENTER PIN TO VERIFY ACCESS PERMISSIONS',
        icon: '🔑'
      });
      showModal({
        title: 'SWITCH USER CLEARANCE PROFILE',
        content: pinPadEl
      });
    };
  }

  // Filter buttons
  const filterBtns = container.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderApps();
    };
  });

  // Search input
  const searchInput = container.querySelector('#app-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderApps();
    };
  }

  // Re-sync button
  const btnRefresh = container.querySelector('#btn-refresh-apps');
  if (btnRefresh) {
    btnRefresh.onclick = () => {
      playSFX('click');
      btnRefresh.innerHTML = '↻ SYNCING...';
      fetchApps().finally(() => {
        btnRefresh.innerHTML = '↻ RE-SYNC';
      });
    };
  }

  // Deploy toggle
  const btnToggleDeploy = container.querySelector('#btn-toggle-deploy');
  const deployPanel = container.querySelector('#deploy-panel');
  const btnCloseDeploy = container.querySelector('#btn-close-deploy');

  if (btnToggleDeploy && deployPanel) {
    btnToggleDeploy.onclick = () => {
      playSFX('click');
      const isVisible = deployPanel.style.display !== 'none';
      deployPanel.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) deployPanel.scrollIntoView({ behavior: 'smooth' });
    };
  }
  if (btnCloseDeploy && deployPanel) {
    btnCloseDeploy.onclick = () => {
      deployPanel.style.display = 'none';
    };
  }

  // Deploy form submit
  const deployForm = container.querySelector('#deploy-apk-form');
  if (deployForm) {
    deployForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = deployForm.querySelector('#btn-submit-deploy');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'DEPLOYING TO VOLUME...';

      try {
        const id = deployForm.querySelector('#deploy-id').value.trim();
        const name = deployForm.querySelector('#deploy-name').value.trim();
        const pkg = deployForm.querySelector('#deploy-pkg').value.trim();
        const filename = deployForm.querySelector('#deploy-filename').value.trim();
        const version = deployForm.querySelector('#deploy-version').value.trim();
        const minAndroid = deployForm.querySelector('#deploy-min-android').value.trim();
        const desc = deployForm.querySelector('#deploy-desc').value.trim();

        const selectedProfiles = ['Architect'];
        deployForm.querySelectorAll('.profile-perm-cb:checked').forEach(cb => {
          selectedProfiles.push(cb.value);
        });

        let apkBase64 = null;
        const fileInput = deployForm.querySelector('#deploy-file-input');
        if (fileInput && fileInput.files && fileInput.files[0]) {
          const file = fileInput.files[0];
          const arrayBuf = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuf);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          apkBase64 = btoa(binary);
        }

        const payload = {
          id,
          name,
          filename,
          packageName: pkg,
          version,
          versionCode: 1,
          description: desc,
          changelog: '• Deployed via Alpha App Manager HUD',
          minAndroid,
          allowedProfiles: selectedProfiles,
          allowedRoles: ['admin', 'apps'],
          accessLevel: selectedProfiles.includes('*') ? 'PUBLIC_CLEARANCE' : 'RESTRICTED',
          apkBase64
        };

        const res = await fetch('/api/apps/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-pin': currentPin || '672167566'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Deployment failed');

        showToast(`APK '${name}' deployed successfully to ${APPS_MODAL_VOLUME}!`, 'success');
        playSFX('generate_complete');
        deployForm.reset();
        deployPanel.style.display = 'none';
        fetchApps();
      } catch (err) {
        showToast(`Deployment error: ${err.message}`, 'error');
        playSFX('error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'COMMIT & DEPLOY TO MODAL VOLUME';
      }
    };
  }

  // Fetch apps from server
  async function fetchApps() {
    try {
      const res = await fetch(`/api/apps?profile=${encodeURIComponent(currentProfile)}&pin=${encodeURIComponent(currentPin)}`, {
        headers: {
          'x-user-pin': currentPin
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      appsList = data.apps || [];
      renderApps();
      updateStats();
    } catch (err) {
      console.error('[AppManager] Fetch error:', err);
      const grid = container.querySelector('#apps-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="panel" style="grid-column:1 / -1; border-color:var(--accent); padding:20px; text-align:center;">
            <div style="color:var(--accent); font-family:'Orbitron',sans-serif; margin-bottom:8px;">// CONNECTION_FAULT</div>
            <p style="color:#888; font-size:0.85rem; margin:0;">Unable to connect to Modal Volume: ${err.message}</p>
          </div>
        `;
      }
    }
  }

  function updateStats() {
    const totalEl = container.querySelector('#stat-total-apps');
    const authEl = container.querySelector('#stat-auth-apps');
    const lockedEl = container.querySelector('#stat-locked-apps');
    const dlEl = container.querySelector('#stat-downloads');

    const total = appsList.length;
    const authorized = appsList.filter(a => a.canDownload).length;
    const locked = total - authorized;
    const totalDownloads = appsList.reduce((sum, a) => sum + (a.downloadsCount || 0), 0);

    if (totalEl) totalEl.textContent = total;
    if (authEl) authEl.textContent = authorized;
    if (lockedEl) lockedEl.textContent = locked;
    if (dlEl) dlEl.textContent = totalDownloads;
  }

  function renderApps() {
    const grid = container.querySelector('#apps-grid');
    if (!grid) return;

    let filtered = appsList;

    if (activeFilter === 'authorized') {
      filtered = filtered.filter(a => a.canDownload);
    } else if (activeFilter === 'restricted') {
      filtered = filtered.filter(a => !a.canDownload);
    }

    if (searchQuery) {
      filtered = filtered.filter(a => 
        (a.name && a.name.toLowerCase().includes(searchQuery)) ||
        (a.packageName && a.packageName.toLowerCase().includes(searchQuery)) ||
        (a.description && a.description.toLowerCase().includes(searchQuery)) ||
        (a.filename && a.filename.toLowerCase().includes(searchQuery))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="panel" style="grid-column:1 / -1; padding:30px; text-align:center; color:var(--blue-dim); font-family:var(--font-hud);">
          NO APPLICATIONS MATCHING QUERY IN MODAL VOLUME [${APPS_MODAL_VOLUME}].
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(app => {
      const card = buildAppCard(app);
      grid.appendChild(card);
    });
  }

  function buildAppCard(app) {
    const card = createElement('div', { class: 'panel aim-section app-card' });
    card.style.cssText = `
      padding: 16px;
      background: rgba(8, 14, 24, 0.85);
      border: 1px solid ${app.canDownload ? 'rgba(0, 184, 255, 0.35)' : 'rgba(255, 0, 60, 0.3)'};
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    `;

    const isPublic = (app.allowedProfiles || []).includes('*');
    const allowedList = (app.allowedProfiles || []).join(', ');

    card.innerHTML = `
      <div>
        <!-- TOP ROW: BADGE & CLEARANCE -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:40px; height:40px; border-radius:4px; background:rgba(0,184,255,0.1); border:1px solid #00b8ff; display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
              📱
            </div>
            <div>
              <h3 style="margin:0; font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff; letter-spacing:0.5px;">
                ${escapeHTML(app.name)}
              </h3>
              <div style="font-size:0.7rem; color:var(--blue-dim); font-family:monospace; margin-top:2px;">
                ${escapeHTML(app.packageName || 'com.alphacore.app')}
              </div>
            </div>
          </div>

          <div style="text-align:right;">
            <span style="display:inline-block; font-size:0.68rem; font-family:var(--font-hud); font-weight:bold; padding:2px 6px; border-radius:2px; background:${app.canDownload ? 'rgba(0,255,157,0.15)' : 'rgba(255,0,60,0.15)'}; border:1px solid ${app.canDownload ? '#00ff9d' : '#ff003c'}; color:${app.canDownload ? '#00ff9d' : '#ff003c'};">
              ${app.canDownload ? '● AUTHORIZED' : '✕ LOCKED'}
            </span>
            <div style="font-size:0.65rem; color:#888; font-family:monospace; margin-top:4px;">
              ${escapeHTML(app.version)} (${app.versionCode || 1})
            </div>
          </div>
        </div>

        <!-- CLEARANCE BANNER -->
        <div style="background:rgba(0,0,0,0.4); border-left:3px solid ${app.canDownload ? '#00b8ff' : '#ff003c'}; padding:6px 10px; margin-bottom:12px; font-size:0.72rem; font-family:monospace;">
          <span style="color:#aaa;">PERMITTED USERS:</span> 
          <span style="color:${app.canDownload ? '#00b8ff' : '#ff003c'}; font-weight:bold;">
            ${isPublic ? 'PUBLIC (ALL ACTIVE PINS)' : escapeHTML(allowedList)}
          </span>
        </div>

        <!-- DESCRIPTION -->
        <p style="font-size:0.78rem; color:#ccc; line-height:1.4; margin:0 0 12px 0;">
          ${escapeHTML(app.description || 'No technical specification provided.')}
        </p>

        <!-- SPECS ROW -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; font-size:0.7rem; font-family:monospace; color:#888;">
          <div style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:2px;">
            SIZE: <span style="color:#fff;">${app.sizeMb || (app.sizeBytes ? (app.sizeBytes / 1048576).toFixed(1) : '24.5')} MB</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:2px;">
            MIN: <span style="color:#fff;">${escapeHTML(app.minAndroid || 'Android 10+')}</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:2px;">
            DOWNLOADS: <span style="color:#f59e0b;">${app.downloadsCount || 0}</span>
          </div>
        </div>

        <!-- SHA256 CHECKSUM -->
        <div style="background:rgba(0,0,0,0.5); border:1px solid #1e293b; padding:6px 8px; border-radius:2px; font-size:0.65rem; font-family:monospace; color:#64748b; margin-bottom:14px; word-break:break-all; display:flex; justify-content:space-between; align-items:center;">
          <span>SHA256: <span style="color:#94a3b8;">${escapeHTML(app.sha256 || 'SHA-256 NOT RECORDED')}</span></span>
          <button class="btn-copy-hash" style="background:none; border:none; color:#00b8ff; cursor:pointer; font-size:0.65rem; padding:0 4px;" title="Copy SHA-256">
            COPY
          </button>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
        <div style="display:flex; gap:8px;">
          <button class="aim-btn btn-download-apk" style="flex-grow:1; padding:8px 12px; font-size:0.8rem; font-weight:bold; ${app.canDownload ? 'background:rgba(0,184,255,0.15); border-color:#00b8ff; color:#00b8ff;' : 'opacity:0.4; cursor:not-allowed; border-color:#475569; color:#64748b;'}" ${app.canDownload ? '' : 'disabled'}>
            ${app.canDownload ? '⬇ DOWNLOAD .APK' : '🔒 CLEARANCE LOCKED'}
          </button>

          <button class="aim-btn btn-install-guide" style="padding:8px 12px; font-size:0.75rem;" title="View Android Sideloading Instructions">
            GUIDE
          </button>

          <button class="aim-btn btn-qr-code" style="padding:8px 10px; font-size:0.75rem;" title="Mobile Scan Code">
            📱
          </button>
        </div>

        ${isArchitect ? `
          <div style="display:flex; gap:6px; margin-top:2px;">
            <button class="aim-btn aim-btn-sm btn-edit-perms" style="flex-grow:1; font-size:0.68rem; padding:4px; border-color:#64748b; color:#94a3b8;">
              ⚙ EDIT PERMISSIONS
            </button>
            <button class="aim-btn aim-btn-sm btn-delete-app" style="font-size:0.68rem; padding:4px 8px; border-color:#ef4444; color:#ef4444;" title="Delete APK from Volume">
              ✕
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Copy hash
    const btnCopy = card.querySelector('.btn-copy-hash');
    if (btnCopy) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(app.sha256 || '');
        showToast('SHA-256 hash copied to clipboard', 'info');
      };
    }

    // Download handler
    const btnDownload = card.querySelector('.btn-download-apk');
    if (btnDownload && app.canDownload) {
      btnDownload.onclick = () => {
        playSFX('click');
        btnDownload.innerHTML = 'DOWNLOADING...';
        btnDownload.disabled = true;

        // Trigger browser file download directly
        const downloadUrl = `/api/apps/${encodeURIComponent(app.id)}/download?pin=${encodeURIComponent(currentPin)}&profile=${encodeURIComponent(currentProfile)}`;
        
        // Use hidden anchor to download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = app.filename || `${app.id}.apk`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast(`Dispatched download for ${app.filename}`, 'success');
        playSFX('generate_complete');

        setTimeout(() => {
          btnDownload.innerHTML = '⬇ DOWNLOAD .APK';
          btnDownload.disabled = false;
          // Refresh download counter
          fetchApps();
        }, 1500);
      };
    }

    // Install Guide Modal
    const btnGuide = card.querySelector('.btn-install-guide');
    if (btnGuide) {
      btnGuide.onclick = () => {
        playSFX('click');
        const guideContent = document.createElement('div');
        guideContent.innerHTML = `
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; color:#cbd5e1; line-height:1.5;">
            <div style="background:rgba(0,184,255,0.1); border-left:3px solid #00b8ff; padding:10px; margin-bottom:14px;">
              <strong>PACKAGE:</strong> ${escapeHTML(app.packageName)}<br/>
              <strong>VERSION:</strong> ${escapeHTML(app.version)} (Build ${app.versionCode || 1})<br/>
              <strong>TARGET OS:</strong> ${escapeHTML(app.minAndroid || 'Android 10+')}<br/>
              <strong>VOLUME LOCATION:</strong> ${TARGET_MODAL_PROFILE}::${APPS_MODAL_VOLUME}/${app.filename}
            </div>

            <h4 style="color:#00b8ff; font-family:'Orbitron',sans-serif; margin:12px 0 6px 0;">1. ENABLE UNKNOWN APP INSTALLATION</h4>
            <p style="margin:0 0 10px 0;">On your Android device, navigate to <em>Settings → Security (or Apps) → Special app access → Install unknown apps</em>, and enable clearance for your browser (e.g. Chrome, Brave).</p>

            <h4 style="color:#00b8ff; font-family:'Orbitron',sans-serif; margin:12px 0 6px 0;">2. VERIFY CRYPTOGRAPHIC HASH</h4>
            <div style="background:#000; padding:8px; border:1px solid #334155; font-size:0.75rem; word-break:break-all; color:#00ff9d; margin-bottom:10px;">
              sha256sum ${escapeHTML(app.filename)}<br/>
              ${escapeHTML(app.sha256 || 'MATCH_EXPECTED')}
            </div>

            <h4 style="color:#00b8ff; font-family:'Orbitron',sans-serif; margin:12px 0 6px 0;">3. EXECUTE INSTALLER</h4>
            <p style="margin:0 0 10px 0;">Open the downloaded <code>${escapeHTML(app.filename)}</code> from your Notifications drawer or Downloads directory and tap <strong>Install</strong>. If prompted with Play Protect warning, select <em>More details → Install anyway</em> (required for enterprise non-store sideloads).</p>
          </div>
        `;
        showModal({
          title: `INSTALLATION GUIDE // ${app.name.toUpperCase()}`,
          content: guideContent
        });
      };
    }

    // QR Code / Mobile Download Modal
    const btnQr = card.querySelector('.btn-qr-code');
    if (btnQr) {
      btnQr.onclick = () => {
        playSFX('click');
        const dlUrl = `${window.location.origin}/api/apps/${encodeURIComponent(app.id)}/download?pin=${encodeURIComponent(currentPin)}&profile=${encodeURIComponent(currentProfile)}`;
        
        const qrContent = document.createElement('div');
        qrContent.style.cssText = 'text-align:center; padding:10px;';
        qrContent.innerHTML = `
          <div style="background:#fff; padding:16px; display:inline-block; border-radius:6px; margin-bottom:14px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(dlUrl)}" alt="Download QR Code" style="display:block; width:200px; height:200px;" />
          </div>
          <div style="font-family:monospace; font-size:0.75rem; color:#aaa; margin-bottom:12px; word-break:break-all;">
            DIRECT DOWNLOAD LINK:<br/>
            <a href="${dlUrl}" target="_blank" style="color:#00b8ff;">${dlUrl}</a>
          </div>
          <p style="color:#888; font-size:0.75rem; margin:0;">Scan with your Android camera or QR scanner to download directly to your mobile device.</p>
        `;
        showModal({
          title: `MOBILE DOWNLOAD // ${app.name.toUpperCase()}`,
          content: qrContent
        });
      };
    }

    // Edit Permissions Modal (Admin Only)
    const btnEditPerms = card.querySelector('.btn-edit-perms');
    if (btnEditPerms) {
      btnEditPerms.onclick = () => {
        playSFX('click');
        const permsForm = document.createElement('form');
        permsForm.innerHTML = `
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.85rem;">
            <p style="color:#aaa; margin-top:0;">Configure which user profiles or PINs are permitted to download <strong>${escapeHTML(app.name)}</strong> from Modal volume <code>${APPS_MODAL_VOLUME}</code>.</p>
            
            <div style="background:rgba(0,0,0,0.4); padding:12px; border:1px solid #334155; margin-bottom:14px; border-radius:3px;">
              <div style="margin-bottom:8px; font-size:0.75rem; color:#00b8ff; font-weight:bold;">ALLOWED PROFILES:</div>
              <label style="display:block; margin-bottom:6px; color:#00ff9d;"><input type="checkbox" value="Architect" checked disabled /> Architect (Always Allowed)</label>
              <label style="display:block; margin-bottom:6px; color:var(--blue-dim);"><input type="checkbox" class="edit-p-cb" value="Fisherman" ${(app.allowedProfiles || []).includes('Fisherman') ? 'checked' : ''} /> Fisherman</label>
              <label style="display:block; margin-bottom:6px; color:var(--blue-dim);"><input type="checkbox" class="edit-p-cb" value="J. P." ${(app.allowedProfiles || []).includes('J. P.') ? 'checked' : ''} /> J. P.</label>
              <label style="display:block; margin-bottom:6px; color:var(--blue-dim);"><input type="checkbox" class="edit-p-cb" value="john" ${(app.allowedProfiles || []).includes('john') ? 'checked' : ''} /> john</label>
              <label style="display:block; margin-bottom:6px; color:#f59e0b;"><input type="checkbox" class="edit-p-cb" value="*" ${(app.allowedProfiles || []).includes('*') ? 'checked' : ''} /> Public / All Users (*)</label>
            </div>

            <button type="submit" class="aim-btn aim-btn-generate" style="width:100%; padding:8px;">
              SAVE ACCESS CLEARANCE
            </button>
          </div>
        `;

        permsForm.onsubmit = async (e) => {
          e.preventDefault();
          const selected = ['Architect'];
          permsForm.querySelectorAll('.edit-p-cb:checked').forEach(cb => selected.push(cb.value));

          try {
            const res = await fetch(`/api/apps/${encodeURIComponent(app.id)}/permissions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-pin': currentPin || '672167566'
              },
              body: JSON.stringify({
                allowedProfiles: selected,
                accessLevel: selected.includes('*') ? 'PUBLIC_CLEARANCE' : 'RESTRICTED'
              })
            });
            if (!res.ok) throw new Error('Failed updating permissions');
            showToast(`Permissions updated for ${app.name}!`, 'success');
            showModal({ title: '', content: '' });
            fetchApps();
          } catch (err) {
            showToast(err.message, 'error');
          }
        };

        showModal({
          title: `PERMISSIONS MATRIX // ${app.name.toUpperCase()}`,
          content: permsForm
        });
      };
    }

    // Delete APK (Admin Only)
    const btnDelete = card.querySelector('.btn-delete-app');
    if (btnDelete) {
      btnDelete.onclick = async () => {
        if (!confirm(`Are you sure you want to permanently delete '${app.name}' (${app.filename}) from Modal Volume '${APPS_MODAL_VOLUME}'?`)) {
          return;
        }
        playSFX('click');
        try {
          const res = await fetch(`/api/apps/${encodeURIComponent(app.id)}`, {
            method: 'DELETE',
            headers: {
              'x-user-pin': currentPin || '672167566'
            }
          });
          if (!res.ok) throw new Error('Deletion failed');
          showToast(`Deleted ${app.name}`, 'info');
          fetchApps();
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
    }

    return card;
  }

  // Initial load
  fetchApps();

  return container;
}
