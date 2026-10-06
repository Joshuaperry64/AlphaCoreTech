/**
 * AlphaCore v4.0 — Hidden Architect Substrate
 * Route: #/placeholder
 * Accessible strictly via Darkened State directives in Administration.
 * Restricted to Architect clearance (Level 5).
 */
import { createElement, escapeHTML } from '../components/utils.js';
import { buildPinPad } from '../components/pinpad.js';
import { showToast } from '../components/toast.js';
import { playSFX } from '../components/audio.js';

export default function PlaceholderPage() {
  const container = createElement('div', { class: 'placeholder-page' });

  function isArchitectAuthenticated() {
    const profile = (sessionStorage.getItem('current_profile') || '').toLowerCase();
    const pin = sessionStorage.getItem('current_pin') || '';
    return profile === 'architect' || pin === '672167566';
  }

  function renderView() {
    container.innerHTML = '';
    if (isArchitectAuthenticated()) {
      container.appendChild(buildArchitectPlaceholderUI());
    } else {
      container.appendChild(buildLockoutUI());
    }
  }

  function buildLockoutUI() {
    const wrap = document.createElement('div');
    wrap.className = 'placeholder-lockout-wrap';
    wrap.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; padding: 20px;';

    wrap.innerHTML = `
      <div class="panel" style="max-width: 480px; width: 100%; text-align: center; border-color: var(--accent, #ff003c); background: rgba(12, 5, 14, 0.94); box-shadow: 0 0 40px rgba(255, 0, 60, 0.25); padding: 30px 24px; border-radius: 8px;">
        <div style="font-size: 2.8rem; margin-bottom: 12px; filter: drop-shadow(0 0 10px #ff003c);">🔒</div>
        <div class="aim-header-badge" style="color: #ff003c; border-color: #ff003c; display: inline-block; margin-bottom: 8px;">
          [SECURITY_LOCKOUT] // LEVEL 5 REQUIRED
        </div>
        <h2 class="glitch" data-text="// ACCESS RESTRICTED" style="color: #ff003c; font-family: 'Orbitron', sans-serif; font-size: 1.4rem; letter-spacing: 2px; margin-bottom: 10px;">
          // ACCESS RESTRICTED
        </h2>
        <p style="font-family: 'Share Tech Mono', monospace; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 22px;">
          THE <strong style="color: #ff003c;">[PLACEHOLDER]</strong> SUBSTRATE IS A CLASSIFIED ARCHITECT ENVIRONMENT. ENTER AUTHORIZED ARCHITECT CREDENTIALS TO INITIALIZE ACCESS.
        </p>

        <div id="placeholder-pinpad-slot" style="margin-bottom: 20px;"></div>

        <div style="border-top: 1px dashed rgba(255, 255, 255, 0.15); padding-top: 16px; display: flex; justify-content: center; gap: 10px;">
          <a href="#/admin" class="aim-btn aim-btn-sm" style="text-decoration: none; border-color: #64748b; color: #94a3b8; font-family: 'Orbitron', sans-serif;">
            ← RETURN TO ADMINISTRATION
          </a>
        </div>
      </div>
    `;

    const pinpadSlot = wrap.querySelector('#placeholder-pinpad-slot');
    const pinPad = buildPinPad({
      title: '// ARCHITECT_VERIFICATION',
      subtitle: 'ENTER ARCHITECT ACCESS PIN',
      icon: '⟁',
      requiredRole: 'admin',
      onSuccess: (result) => {
        const label = (result.pinObj?.label || '').toLowerCase();
        const pin = result.pinObj?.pin || '';
        if (label === 'architect' || pin === '672167566') {
          sessionStorage.setItem('current_profile', 'Architect');
          sessionStorage.setItem('current_pin', '672167566');
          showToast('SUCCESS', 'Architect clearance confirmed. Initializing PLACEHOLDER environment.');
          playSFX('login', 0.8);
          renderView();
        } else {
          showToast('WARN', 'Clearance denied. Authenticated token is not Architect level.');
          playSFX('incorrect', 0.7);
        }
      }
    });
    pinpadSlot.appendChild(pinPad);

    return wrap;
  }

  function buildArchitectPlaceholderUI() {
    const root = document.createElement('div');
    root.className = 'placeholder-root';
    root.style.cssText = 'padding: 10px 0 30px;';

    const isDarknessActive = sessionStorage.getItem('darkness_mode_active') === 'true';

    root.innerHTML = `
      <!-- Header -->
      <div class="aim-header" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div class="aim-header-badge" style="color: #ff003c; border-color: #ff003c;">
            [ARCHITECT_ONLY] // DARKENED_SUBSTRATE // LEVEL_5
          </div>
          <div style="display: flex; gap: 8px;">
            <a href="#/admin" class="aim-btn aim-btn-sm" style="text-decoration: none; border-color: #ff003c; color: #ff003c;">
              ← ADMINISTRATION
            </a>
            <a href="#/overview" class="aim-btn aim-btn-sm" style="text-decoration: none; border-color: #00f0ff; color: #00f0ff;">
              ⎔ COMMAND HUB
            </a>
          </div>
        </div>
        
        <h1 class="glitch aim-title" data-text="ALPHACORE // PLACEHOLDER" style="color: #fff; margin-top: 10px;">
          ALPHACORE // PLACEHOLDER
        </h1>
        <div class="header-line" style="background: linear-gradient(90deg, #ff003c, #00f0ff, transparent);"></div>
        <p class="aim-subtitle">
          Classified sandbox substrate reserved exclusively for the Architect. Deployed via Darkened State directives within Administration.
        </p>
      </div>

      <!-- Telemetry Strip -->
      <div class="panel" style="margin-bottom: 24px; padding: 14px 18px; border-color: rgba(255, 0, 60, 0.4); background: rgba(15, 6, 18, 0.85); box-shadow: 0 0 25px rgba(255, 0, 60, 0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; font-family: 'Share Tech Mono', monospace; font-size: 0.8rem;">
          <div>
            <span style="color: #888;">OPERATOR:</span>
            <strong style="color: #00f0ff; margin-left: 6px;">ARCHITECT (JOSH)</strong>
          </div>
          <div>
            <span style="color: #888;">CLEARANCE:</span>
            <strong style="color: #ff003c; margin-left: 6px;">LEVEL 5 [UNRESTRICTED]</strong>
          </div>
          <div>
            <span style="color: #888;">STATE:</span>
            <strong style="color: ${isDarknessActive ? '#ff003c' : '#f59e0b'}; margin-left: 6px;">
              ${isDarknessActive ? '● DARKENED STATE ACTIVE' : '○ STANDARD OVERLAY'}
            </strong>
          </div>
          <div>
            <span style="color: #888;">NODE:</span>
            <strong style="color: #10b981; margin-left: 6px;">SECURE_PLACEHOLDER_0x7F</strong>
          </div>
        </div>
      </div>

      <!-- Grid of Substrate Modules -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        
        <!-- Module 1: Experimental Directives Sandbox -->
        <div class="panel" style="border-color: rgba(255, 0, 60, 0.35); background: rgba(14, 7, 20, 0.85); display: flex; flex-direction: column;">
          <div class="panel-title" style="color: #ff003c; display: flex; justify-content: space-between; align-items: center;">
            <span>// EXPERIMENTAL_SANDBOX</span>
            <span style="font-size: 0.65rem; color: #10b981; border: 1px solid #10b981; padding: 1px 6px; border-radius: 3px;">ONLINE</span>
          </div>
          <p class="aim-subtitle" style="margin-bottom: 14px;">
            Execute isolated cognitive commands or prompt injections directly into the darkened neural substrate.
          </p>

          <div style="margin-bottom: 12px;">
            <label class="aim-label" for="placeholder-test-cmd" style="color: #ff003c;">DIRECTIVE PAYLOAD</label>
            <input type="text" id="placeholder-test-cmd" class="aim-input" placeholder="e.g. inject --bypass-entropy-v6 --target=core" value="override --eval-unrestricted" style="border-color: rgba(255, 0, 60, 0.4); width: 100%;" />
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 15px;">
            <button class="aim-btn" id="btn-exec-probe" style="flex: 1; background: rgba(255, 0, 60, 0.15); border-color: #ff003c; color: #fff;">
              ⚡ EXECUTE DIRECTIVE
            </button>
            <button class="aim-btn aim-btn-secondary" id="btn-clear-term" style="border-color: #555; color: #aaa;">
              CLR
            </button>
          </div>

          <!-- Sandbox Terminal Output -->
          <div id="placeholder-terminal-out" style="flex: 1; min-height: 140px; max-height: 180px; overflow-y: auto; background: rgba(0, 0, 0, 0.7); border: 1px solid rgba(255, 0, 60, 0.3); border-radius: 4px; padding: 10px; font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; color: #00f0ff; line-height: 1.4;">
            <div style="color: #64748b;">// Substrate terminal ready. Awaiting Architect command...</div>
          </div>
        </div>

        <!-- Module 2: Darkened State Configuration -->
        <div class="panel" style="border-color: rgba(255, 0, 60, 0.35); background: rgba(14, 7, 20, 0.85); display: flex; flex-direction: column;">
          <div class="panel-title" style="color: #ff003c;">// LUCI_SUBSTRATE_PARAMS</div>
          <p class="aim-subtitle" style="margin-bottom: 14px;">
            Real-time status of the alternate persona overlay and ethical governor disengagement parameters.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px; font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px;">
              <span style="color: #94a3b8;">SAFETY BYPASS:</span>
              <span style="color: #10b981; font-weight: bold;">DISENGAGED [OK]</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px;">
              <span style="color: #94a3b8;">NSFW NEURAL MATRIX:</span>
              <span style="color: #ff003c; font-weight: bold;">UNRESTRICTED</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px;">
              <span style="color: #94a3b8;">ENTROPY DRIFT:</span>
              <span style="color: #00f0ff; font-weight: bold;">99.4% MAX</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px;">
              <span style="color: #94a3b8;">STORAGE SECTOR:</span>
              <span style="color: #f59e0b; font-weight: bold;">SECTOR_DARK_09</span>
            </div>
          </div>

          <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px;">
            <button class="aim-btn" id="btn-purge-sandbox" style="width: 100%; border-color: rgba(255,0,60,0.5); color: #ff003c; background: rgba(255,0,60,0.08);">
              🛡 PURGE SANDBOX CACHE
            </button>
            <button class="aim-btn" id="btn-toggle-beacon" style="width: 100%; border-color: #00f0ff; color: #00f0ff; background: rgba(0,240,255,0.08);">
              📡 BROADCAST SUBSTRATE BEACON
            </button>
          </div>
        </div>

        <!-- Module 3: Reserved Subsystem Placeholder -->
        <div class="panel" style="border-color: rgba(0, 240, 255, 0.35); background: rgba(10, 15, 26, 0.85); grid-column: 1 / -1;">
          <div class="panel-title" style="color: #00f0ff;">// RESERVED_EXPANSION_CHAMBER</div>
          <p class="aim-subtitle" style="margin-bottom: 16px;">
            This module space is reserved for future custom architect tools, jailbreak script synthesizers, or dedicated Darkened State subroutines.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
            <div style="background: rgba(0,0,0,0.4); border: 1px dashed rgba(0, 240, 255, 0.3); border-radius: 4px; padding: 14px; text-align: center;">
              <div style="font-size: 1.6rem; margin-bottom: 6px;">🧪</div>
              <div style="font-family: 'Orbitron', sans-serif; font-size: 0.8rem; color: #00f0ff; font-weight: bold; margin-bottom: 4px;">SLOT A // UNASSIGNED</div>
              <div style="font-family: 'Share Tech Mono', monospace; font-size: 0.72rem; color: #64748b;">Ready for dynamic module ingestion.</div>
            </div>
            <div style="background: rgba(0,0,0,0.4); border: 1px dashed rgba(255, 0, 60, 0.3); border-radius: 4px; padding: 14px; text-align: center;">
              <div style="font-size: 1.6rem; margin-bottom: 6px;">🧬</div>
              <div style="font-family: 'Orbitron', sans-serif; font-size: 0.8rem; color: #ff003c; font-weight: bold; margin-bottom: 4px;">SLOT B // LUCI EXPANSION</div>
              <div style="font-family: 'Share Tech Mono', monospace; font-size: 0.72rem; color: #64748b;">Reserved for multi-turn cognitive hooks.</div>
            </div>
            <div style="background: rgba(0,0,0,0.4); border: 1px dashed rgba(16, 185, 129, 0.3); border-radius: 4px; padding: 14px; text-align: center;">
              <div style="font-size: 1.6rem; margin-bottom: 6px;">🔐</div>
              <div style="font-family: 'Orbitron', sans-serif; font-size: 0.8rem; color: #10b981; font-weight: bold; margin-bottom: 4px;">SLOT C // VAULT PROXY</div>
              <div style="font-family: 'Share Tech Mono', monospace; font-size: 0.72rem; color: #64748b;">Direct memory relay to classified directives.</div>
            </div>
          </div>
        </div>

      </div>
    `;

    // Interactive button listeners
    const execBtn = root.querySelector('#btn-exec-probe');
    const clearBtn = root.querySelector('#btn-clear-term');
    const cmdInput = root.querySelector('#placeholder-test-cmd');
    const termOut = root.querySelector('#placeholder-terminal-out');
    const purgeBtn = root.querySelector('#btn-purge-sandbox');
    const beaconBtn = root.querySelector('#btn-toggle-beacon');

    if (execBtn && cmdInput && termOut) {
      execBtn.onclick = () => {
        const val = cmdInput.value.trim() || 'override --test';
        playSFX('click', 0.5);
        
        const timestamp = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.style.marginBottom = '4px';
        line.innerHTML = `
          <span style="color:#64748b;">[${timestamp}]</span> 
          <span style="color:#ff003c;">ARCHITECT></span> 
          <span style="color:#fff;">${escapeHTML(val)}</span>
          <div style="color:#10b981; margin-left: 14px;">↳ EXECUTING: Substrate pipeline initialized. Response 200 OK. [ZERO GOVERNOR INTERCEPT]</div>
        `;
        termOut.appendChild(line);
        termOut.scrollTop = termOut.scrollHeight;
        showToast('SUCCESS', `Directive executed: "${val}"`);
      };
    }

    if (clearBtn && termOut) {
      clearBtn.onclick = () => {
        playSFX('click', 0.4);
        termOut.innerHTML = '<div style="color: #64748b;">// Substrate terminal reset.</div>';
      };
    }

    if (purgeBtn) {
      purgeBtn.onclick = () => {
        playSFX('click', 0.4);
        showToast('INFO', 'Sandbox cache purged. Neural substrate re-initialized.');
      };
    }

    if (beaconBtn) {
      beaconBtn.onclick = () => {
        playSFX('modal', 0.6);
        showToast('SUCCESS', 'Substrate beacon ping broadcast to all active cognitive nodes.');
      };
    }

    return root;
  }

  renderView();
  return container;
}
