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

      <!-- MODULE 2: NEURAL OVERDRIVE (ACTIVE) -->
      <div class="panel" style="background:linear-gradient(180deg, rgba(20,10,32,0.95) 0%, rgba(8,4,16,0.95) 100%); border:1.5px solid #a855f7; border-radius:4px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:0 0 20px rgba(168,85,247,0.15);">
        <div style="position:absolute; top:14px; right:14px; background:rgba(168,85,247,0.15); border:1px solid #a855f7; color:#a855f7; font-size:0.7rem; font-family:'Share Tech Mono',monospace; padding:3px 8px; border-radius:2px; font-weight:bold;">
          ● CO-OP PROTOCOL
        </div>

        <div>
          <div style="font-size:2.8rem; margin-bottom:12px;">🧠</div>
          <h2 style="font-family:'Orbitron',sans-serif; font-size:1.3rem; color:#fff; letter-spacing:1px; margin-bottom:6px;">
            NEURAL OVERDRIVE
          </h2>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#a855f7; margin-bottom:14px; letter-spacing:1px;">
            // 2-PLAYER DISTRIBUTED CO-OP // FIREWALL PENETRATION & PAYLOAD
          </div>

          <p style="font-size:0.85rem; color:#ccc; line-height:1.6; margin-bottom:16px;">
            High-speed cyberpunk firewall infiltration. Designed for 2 operators with equal, complementary controls: <strong>Operator 1: Infiltrator & Cipher Specialist</strong> (ports & cryptographic session keys) and <strong>Operator 2: Tactical Defense & Payload</strong> (buffer overflow injection & Counter-ICE trace scrub).
          </p>

          <div style="background:rgba(0,0,0,0.5); padding:10px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">
              <span style="color:#888;">OPERATORS:</span>
              <span style="color:#a855f7; font-weight:bold;">2 LIVE PLAYERS (50/50 SPLIT)</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">
              <span style="color:#888;">THREAT VECTOR:</span>
              <span style="color:#ef4444; font-weight:bold;">SENTINEL ICE TRACE</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
              <span style="color:#888;">TARGET:</span>
              <span style="color:#00ff66;">QUANTUM SUBNET ROOT</span>
            </div>
          </div>
        </div>

        <button id="btn-launch-neural" class="aim-btn" style="width:100%; height:48px; background:rgba(168,85,247,0.2); border-color:#a855f7; color:#fff; font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:bold; letter-spacing:1px; cursor:pointer;">
          ⚡ LAUNCH NEURAL OVERDRIVE
        </button>
      </div>

      <!-- MODULE 3: ASTRO-LINK OBSERVATORY (ACTIVE) -->
      <div class="panel" style="background:linear-gradient(180deg, rgba(6,16,36,0.95) 0%, rgba(2,6,16,0.95) 100%); border:1.5px solid #00ff66; border-radius:4px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; position:relative; box-shadow:0 0 20px rgba(0,255,100,0.15);">
        <div style="position:absolute; top:14px; right:14px; background:rgba(0,255,100,0.15); border:1px solid #00ff66; color:#00ff66; font-size:0.7rem; font-family:'Share Tech Mono',monospace; padding:3px 8px; border-radius:2px; font-weight:bold;">
          ● 2-PLAYER HARDWARE CO-OP
        </div>

        <div>
          <div style="font-size:2.8rem; margin-bottom:12px;">🔭</div>
          <h2 style="font-family:'Orbitron',sans-serif; font-size:1.3rem; color:#fff; letter-spacing:1px; margin-bottom:6px;">
            ASTRO-LINK OBSERVATORY
          </h2>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66; margin-bottom:14px; letter-spacing:1px;">
            // 2-PLAYER MEADE DS TELESCOPE MISSION CONTROL
          </div>

          <p style="font-size:0.85rem; color:#ccc; line-height:1.6; margin-bottom:16px;">
            Cooperate across 2 distinct stations: <strong>Operator 1: Mount Helmsman</strong> (Autostar Handbox, 2D Polar Sky Dome Radar, WebSerial 9600 8N1 link) and <strong>Operator 2: Optical Sensor Engineer</strong> (ASCOM electronic focuser, Lucky imaging stacker, reticle ping, and AI capture).
          </p>

          <div style="background:rgba(0,0,0,0.5); padding:10px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">
              <span style="color:#888;">OPERATORS:</span>
              <span style="color:#00ff66; font-weight:bold;">2 PLAYERS / SOLO OVERRIDE</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:6px;">
              <span style="color:#888;">HARDWARE LINK:</span>
              <span style="color:#06b6d4;">WebSerial LX200 9600 baud</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
              <span style="color:#888;">TELESCOPE:</span>
              <span style="color:#fff;">MEADE DS / AUTOSTAR #494/#497</span>
            </div>
          </div>
        </div>

        <button id="btn-launch-astrolink" class="aim-btn" style="width:100%; height:48px; background:rgba(0,255,100,0.2); border-color:#00ff66; color:#fff; font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:bold; letter-spacing:1px; cursor:pointer;">
          🔭 LAUNCH OBSERVATORY
        </button>
      </div>

    </div>
  `;

  const launchLab = () => {
    playClick();
    onSelectModule('LABORATORY');
  };

  const launchNeural = () => {
    playClick();
    onSelectModule('NEURAL_OVERDRIVE');
  };

  const launchAstro = () => {
    playClick();
    onSelectModule('ASTRO_LINK');
  };

  container.querySelector('#btn-launch-laboratory')?.addEventListener('click', launchLab);
  container.querySelector('#btn-quick-launch-lab')?.addEventListener('click', launchLab);
  container.querySelector('#btn-launch-neural')?.addEventListener('click', launchNeural);
  container.querySelector('#btn-launch-astrolink')?.addEventListener('click', launchAstro);

  return container;
}
