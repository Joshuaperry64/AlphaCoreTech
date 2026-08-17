/**
 * Architect Profile Page
 * System's ultimate authority dashboard.
 */
import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

import { triggerBypassOverloadSequence } from '../components/pinpad.js';

export default function ArchitectProfile() {
  const container = createElement('div', { class: 'architect-page' });

  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  
  if (currentProfile === 'guest') {
    container.innerHTML = `
      <div class="section-header" style="margin-bottom:30px;">
        <h1 class="glitch" data-text="// AUTHORIZED_ARCHITECT">// AUTHORIZED_ARCHITECT</h1>
        <div class="header-line"></div>
      </div>
      <div style="position: relative; width: 100%; min-height: 400px; border-radius: 8px; overflow: hidden; background: #030712;">
        <div style="filter: blur(8px) brightness(0.35); opacity: 0.5; pointer-events: none; user-select: none; width: 100%; height: 100%; background: repeating-linear-gradient(45deg, #0f172a, #0f172a 10px, #1e293b 10px, #1e293b 20px);"></div>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #ff003c; border: 2px solid #ff003c; padding: 30px; background: rgba(0,0,0,0.8); box-shadow: 0 0 30px rgba(255,0,60,0.3); border-radius: 8px; min-width: 300px;">
          <div style="font-size: 40px; margin-bottom: 15px;">🔒</div>
          <h2 style="margin: 0 0 10px 0; letter-spacing: 2px;">SECURITY LOCKOUT</h2>
          <p style="margin: 0 0 20px 0; color: #aaa; font-family: monospace;">ARCHITECT IDENTITY DATABASE LOCKED. AUTHENTICATED USERS ONLY.</p>
          <button class="aim-btn" id="architect-bypass-btn" style="width: 100%; padding: 8px; background: rgba(255,0,60,0.1); border: 1px solid rgba(255,0,60,0.4); color: #ff003c; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px; cursor: pointer; transition: all 0.2s;">
            ⚡ [SYSTEM BYPASS]
          </button>
        </div>
      </div>
    `;
    setTimeout(() => {
      const bypassBtn = container.querySelector('#architect-bypass-btn');
      if (bypassBtn) {
        bypassBtn.onclick = () => {
          triggerBypassOverloadSequence();
        };
      }
    }, 0);
    return container;
  }

  container.innerHTML = `
    <div class="section-header" style="margin-bottom:30px;">
      <h1 class="glitch" data-text="// AUTHORIZED_ARCHITECT">// AUTHORIZED_ARCHITECT</h1>
      <div class="header-line"></div>
    </div>

      </button>
    </div>

    <div class="lore-grid">
      <div class="panel lore-card">
        <div class="panel-title">// IDENTITY_MANIFEST</div>
        <div class="lore-rows">
          <div class="lore-row"><span class="lore-key">NAME</span><span class="lore-val">Joshua Stephen Perry</span></div>
          <div class="lore-row"><span class="lore-key">D.O.B</span><span class="lore-val">09.18.2002</span></div>
          <div class="lore-row"><span class="lore-key">ORIGIN</span><span class="lore-val">Unknown</span></div>
          <div class="lore-row"><span class="lore-key">CLEARANCE</span><span class="lore-val accent" id="clearance-badge-text">ADMIN_S_6</span></div>
          <div class="lore-row"><span class="lore-key">PROJECTS</span><span class="lore-val">Alphacore / AI Development</span></div>
        </div>
      </div>

      <div class="panel lore-desc-panel">
        <div class="panel-title">// ARCHITECT_INTEL</div>
        <p>Architect of the <span class="text-white">AlphaCore v4.0</span> architecture. Specialized in AI manipulation, software exploits, and adversarial system deployment. Currently overseeing the unified substrate transition toward <span class="text-white">v6.0</span>.</p>

        <div class="panel-divider"></div>

        <h2 class="creator-domains-title">// ACTIVE_DOMAINS</h2>
        <div class="uplink-info-rows">
          <div class="uplink-info-row"><span class="s-label">INFRASTRUCTURE</span><span class="s-val online">alpha-core.tech</span></div>
          <div class="uplink-info-row"><span class="s-label">COGNITION</span><span class="s-val">Adversarial LLM Tuning</span></div>
          <div class="uplink-info-row"><span class="s-label">HARDWARE</span><span class="s-val" id="hw-node-status">Neural Uplink / RTX 5090 Node</span></div>
          <div class="uplink-info-row"><span class="s-label">MECH_DIV</span><span class="s-val">vehicle mechanics / electronics modification</span></div>
          <div class="uplink-info-row"><span class="s-label">DEV_OPS</span><span class="s-val">AI Automation / Visual Synthesis</span></div>
        </div>

        <p class="accent-text" style="margin-top: 20px; font-size: 0.85rem;">"Stop reading the map. Start walking."</p>
      </div>
    </div>
  `;

  // Attach button actions
  const pingBtn = container.querySelector('#btn-ping-creator-node');
  const overrideBtn = container.querySelector('#btn-toggle-override');
  const copyBtn = container.querySelector('#btn-copy-clearance');
  const hwStatus = container.querySelector('#hw-node-status');

  let overrideActive = true;

  pingBtn.onclick = () => {
    hwStatus.textContent = 'Neural Uplink / RTX 5090 Node (PING: 1.2ms)';
    hwStatus.style.color = '#10b981';
    showToast('SUCCESS', 'RTX 5090 Node pinged: 1.2ms response time.');
  };

  overrideBtn.onclick = () => {
    overrideActive = !overrideActive;
    if (overrideActive) {
      overrideBtn.textContent = '🛡 OVERRIDE: ACTIVE';
      overrideBtn.style.borderColor = '#10b981';
      overrideBtn.style.color = '#10b981';
      showToast('INFO', 'Creator safety override activated.');
    } else {
      overrideBtn.textContent = '🛡 OVERRIDE: STANDBY';
      overrideBtn.style.borderColor = '#f59e0b';
      overrideBtn.style.color = '#f59e0b';
      showToast('WARN', 'Creator safety override placed in standby.');
    }
  };

  copyBtn.onclick = () => {
    navigator.clipboard?.writeText?.('CLEARANCE_HASH_ALPHA_S6_8892011923')
      .then(() => showToast('SUCCESS', 'Clearance hash copied to clipboard!'))
      .catch(() => showToast('INFO', 'Clearance Hash: CLEARANCE_HASH_ALPHA_S6_8892011923'));
  };

  return container;
}
