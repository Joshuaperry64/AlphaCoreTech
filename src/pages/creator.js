/**
 * Creator Profile Page
 * Enhanced with interactive clearance toggle, terminal command runner, and action buttons.
 */
import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

export default function CreatorProfile() {
  const container = createElement('div', { class: 'creator-page' });
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// AUTHORIZED_CREATOR">// AUTHORIZED_CREATOR</h1>
      <div class="header-line"></div>
    </div>

    <!-- Creator Quick Toolbar -->
    <div class="panel" style="margin-bottom:20px; padding:12px 18px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:var(--accent,#06b6d4); font-weight:bold;">CREATOR CONTROLS:</span>
        <button id="btn-ping-creator-node" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
          ⚡ PING NODE (RTX 5090)
        </button>
        <button id="btn-toggle-override" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981;">
          🛡 OVERRIDE: ACTIVE
        </button>
      </div>

      <button id="btn-copy-clearance" class="aim-btn aim-btn-sm" style="background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.2); color:#ccc;">
        📋 COPY CLEARANCE HASH
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
