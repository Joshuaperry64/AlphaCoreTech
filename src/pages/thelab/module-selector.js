/**
 * AlphaCore The Lab — Game Module Selector
 * Displays the library of experimental games, allowing 1-4 operators to select
 * active simulations. Primary module: LABORATORY.
 */

import { createElement } from '../../components/utils.js';
import { playClick } from './audio-synth.js';

export function createModuleSelector({ onSelectModule }) {
  const container = createElement('div', { class: 'module-selector-view slide-up' });

  container.innerHTML = `
    <div class="section-header" style="margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
        <div>
          <h1 class="glitch" data-text="// EXPERIMENTAL_MODULES">// EXPERIMENTAL_MODULES</h1>
          <div class="header-line"></div>
          <p class="aim-subtitle">SELECT AN EXPERIMENTAL MULTIPLAYER PROTOCOL // 1-4 OPERATORS</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:rgba(0,255,100,0.1); border:1px solid #00ff66; color:#00ff66; padding:4px 10px; border-radius:3px; letter-spacing:1px;">
            ● SIMULATION CORE READY
          </span>
        </div>
      </div>
    </div>

    <!-- Announcement / System Notice -->
    <div class="panel" style="margin-bottom:24px; padding:14px 20px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:1.4rem;">🧪</span>
        <div>
          <div style="font-size:0.85rem; font-weight:bold; color:#fff; font-family:'Orbitron',sans-serif;">
            FEATURED PROTOCOL // LABORATORY v1.0 ONLINE
          </div>
          <div style="font-size:0.75rem; color:#aaa;">
            1 to 4 Operator Live Co-op Chemical Synthesis. Balance temperature, agitation, pressure, and volatile catalysts.
          </div>
        </div>
      </div>
      <button id="btn-quick-launch-lab" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; font-weight:bold; padding:8px 16px;">
        ⚡ LAUNCH NOW
      </button>
    </div>

    <!-- Modules Grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:22px; margin-bottom:30px;">

      <!-- MODULE 1: LABORATORY (ACTIVE) -->
      <div class="panel" style="background:linear-gradient(180deg, rgba(8,20,30,0.95) 0%, rgba(4,8,16,0.95) 100%); border:1.5px solid var(--accent,#06b6d4); border-radius:4px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:0 0 20px rgba(6,182,212,0.15);">
        <div style="position:absolute; top:14px; right:14px; background:rgba(0,255,100,0.15); border:1px solid #00ff66; color:#00ff66; font-size:0.7rem; font-family:'Share Tech Mono',monospace; padding:3px 8px; border-radius:2px; font-weight:bold;">
          ● PRIMARY MODULE
        </div>

        <div>
          <div style="font-size:2.8rem; margin-bottom:12px;">⚗️</div>
          <h2 style="font-family:'Orbitron',sans-serif; font-size:1.3rem; color:#fff; letter-spacing:1px; margin-bottom:6px;">
            LABORATORY
          </h2>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:var(--accent,#06b6d4); margin-bottom:14px; letter-spacing:1px;">
            // CO-OP CHEMICAL SYNTHESIS MATRIX (1-4 PLAYERS)
          </div>

          <p style="font-size:0.85rem; color:#ccc; line-height:1.6; margin-bottom:16px;">
            Take command of an advanced chemical reactor in real time. Work solo or coordinate with up to 4 live operators across specialized roles: <strong>Synthesizer</strong>, <strong>Thermal Engineer</strong>, <strong>Pressure Controller</strong>, and <strong>Hazard Specialist</strong>.
          </p>

          <div style="background:rgba(0,0,0,0.5); padding:10px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">
              <span style="color:#888;">OPERATORS:</span>
              <span style="color:#00ff66; font-weight:bold;">1 - 4 LIVE PLAYERS</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">
              <span style="color:#888;">NETWORK STACK:</span>
              <span style="color:var(--accent,#06b6d4);">P2P WebRTC / BCAST</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
              <span style="color:#888;">HAZARD CLASS:</span>
              <span style="color:#ef4444; font-weight:bold;">THERMAL RUNAWAY RISK</span>
            </div>
          </div>
        </div>

        <button id="btn-launch-laboratory" class="aim-btn" style="width:100%; height:48px; background:rgba(6,182,212,0.2); border-color:var(--accent,#06b6d4); color:#fff; font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:bold; letter-spacing:1px; cursor:pointer;">
          🔬 LAUNCH LABORATORY
        </button>
      </div>

      <!-- MODULE 2: NEURAL OVERDRIVE (FUTURE) -->
      <div class="panel" style="background:rgba(6,8,14,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; opacity:0.75;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-size:2.8rem;">🧠</div>
            <span style="background:rgba(168,85,247,0.15); border:1px solid #a855f7; color:#a855f7; font-size:0.7rem; font-family:'Share Tech Mono',monospace; padding:3px 8px; border-radius:2px;">
              STAGING
            </span>
          </div>
          <h2 style="font-family:'Orbitron',sans-serif; font-size:1.2rem; color:#fff; letter-spacing:1px; margin-bottom:6px;">
            NEURAL OVERDRIVE
          </h2>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#888; margin-bottom:14px; letter-spacing:1px;">
            // COMPETITIVE FIREWALL DECRYPTION (2-4 PLAYERS)
          </div>
          <p style="font-size:0.85rem; color:#888; line-height:1.6; margin-bottom:16px;">
            High-speed adversarial penetration testing. Race against rival operators to infiltrate neural security nodes, inject malware payloads, and seize sub-matrix control.
          </p>
        </div>
        <button disabled class="aim-btn aim-btn-sm" style="width:100%; height:44px; background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.1); color:#666; cursor:not-allowed;">
          🔒 CLASSIFIED // IN STAGING
        </button>
      </div>

      <!-- MODULE 3: VOID RUNNER (FUTURE) -->
      <div class="panel" style="background:rgba(6,8,14,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; opacity:0.75;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="font-size:2.8rem;">⚡</div>
            <span style="background:rgba(245,158,11,0.15); border:1px solid #f59e0b; color:#f59e0b; font-size:0.7rem; font-family:'Share Tech Mono',monospace; padding:3px 8px; border-radius:2px;">
              IN DEV
            </span>
          </div>
          <h2 style="font-family:'Orbitron',sans-serif; font-size:1.2rem; color:#fff; letter-spacing:1px; margin-bottom:6px;">
            VOID RUNNER
          </h2>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#888; margin-bottom:14px; letter-spacing:1px;">
            // SUB-NEURAL SECTOR RECON (1-2 PLAYERS)
          </div>
          <p style="font-size:0.85rem; color:#888; line-height:1.6; margin-bottom:16px;">
            Tactical co-op grid traversal through corrupted memory sectors. Collect encryption artifacts while evading automated hunter-killer watchdog subroutines.
          </p>
        </div>
        <button disabled class="aim-btn aim-btn-sm" style="width:100%; height:44px; background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.1); color:#666; cursor:not-allowed;">
          🔒 LOCKED // IN DEVELOPMENT
        </button>
      </div>

    </div>
  `;

  const launch = () => {
    playClick();
    onSelectModule('LABORATORY');
  };

  container.querySelector('#btn-launch-laboratory')?.addEventListener('click', launch);
  container.querySelector('#btn-quick-launch-lab')?.addEventListener('click', launch);

  return container;
}
