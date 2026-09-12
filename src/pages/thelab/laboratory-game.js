/**
 * AlphaCore The Lab — LABORATORY (1-4 Players Co-op Chemical Synthesis)
 * Features real-time multi-operator roles, interactive particle fluid canvas,
 * procedural Web Audio SFX, thermal/pressure dynamics, and P2P live synchronization.
 */

import { createElement } from '../../components/utils.js';
import { showToast } from '../../components/toast.js';
import { LabNetworkManager } from './network-manager.js';
import {
  playClick,
  playPump,
  playBubble,
  playSteam,
  playAlarm,
  playSuccess,
  playExplosion
} from './audio-synth.js';

const RECIPES = [
  {
    id: 'stasis_gel',
    name: 'LUMINESCENT STASIS GEL',
    difficulty: 'TIER 1 // CALIBRATION',
    description: 'Stabilize a viscous stasis compound. Maintain moderate thermal energy and steady magnetic agitation.',
    targetTempMin: 140,
    targetTempMax: 190,
    targetPressureMin: 2.0,
    targetPressureMax: 4.0,
    targetRpmMin: 800,
    targetRpmMax: 1800,
    targetPhMin: 6.2,
    targetPhMax: 7.8,
    requiredReagents: { cyano: 2, ether: 2, argon: 1 },
    fluidColor: [0, 184, 255] // Cyan
  },
  {
    id: 'hyper_coolant',
    name: 'HYPER-DRIVE COOLANT C-14',
    difficulty: 'TIER 2 // PRESSURE INTENSIVE',
    description: 'Highly volatile endothermic coolant. Requires rapid cryo compensation and high-RPM agitation.',
    targetTempMin: 80,
    targetTempMax: 130,
    targetPressureMin: 4.5,
    targetPressureMax: 6.5,
    targetRpmMin: 1800,
    targetRpmMax: 2600,
    targetPhMin: 5.0,
    targetPhMax: 6.5,
    requiredReagents: { cyano: 3, argon: 3, chelate: 2 },
    fluidColor: [0, 255, 120] // Emerald Green
  },
  {
    id: 'void_adrenaline',
    name: 'NEURO-SYNTHETIC ADRENALINE',
    difficulty: 'TIER 3 // EXTREME HAZARD',
    description: 'Ultra-reactive neural stimulant with explosive thermal runaway risk. Balance Pyro-Catalysts with precision venting.',
    targetTempMin: 260,
    targetTempMax: 310,
    targetPressureMin: 5.5,
    targetPressureMax: 7.5,
    targetRpmMin: 2000,
    targetRpmMax: 2900,
    targetPhMin: 7.2,
    targetPhMax: 8.5,
    requiredReagents: { ether: 3, pyro: 3, chelate: 1 },
    fluidColor: [255, 0, 128] // Hot Pink / Neon Violet
  }
];

export function createLaboratoryGame({ onBack }) {
  const container = createElement('div', { class: 'laboratory-game-view slide-up' });

  // Game Engine State
  let currentRecipeIndex = 0;
  let activeRecipe = RECIPES[currentRecipeIndex];

  let state = {
    temp: 100, // °C
    pressure: 1.0, // Bar
    rpm: 0, // RPM
    ph: 7.0,
    volume: 20, // ml in vessel
    purity: 100, // %
    progress: 0, // %
    heaterActive: false,
    cryoActive: false,
    valveOpen: false,
    runawayRisk: 0, // 0 - 100%
    gameOver: false,
    gameWon: false,
    reagentsAdded: { cyano: 0, ether: 0, argon: 0, pyro: 0, chelate: 0 }
  };

  let animationFrameId = null;
  let gameLoopInterval = null;
  let network = null;
  let audioMuted = false;

  // Render Skeleton
  container.innerHTML = `
    <!-- Top Action Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <button id="btn-back-modules" class="aim-btn aim-btn-sm" style="background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.2); color:#ccc;">
          ‹ MODULES
        </button>
        <div>
          <div style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#fff; font-weight:bold; letter-spacing:1px;">
            LABORATORY // CO-OP SYNTHESIS
          </div>
          <div id="active-recipe-subtitle" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:var(--accent,#06b6d4);">
            ${activeRecipe.name} [${activeRecipe.difficulty}]
          </div>
        </div>
      </div>

      <!-- Multiplayer Status & Room Pill -->
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <div id="room-status-pill" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:rgba(0,0,0,0.5); border:1px solid rgba(6,182,212,0.4); padding:4px 10px; border-radius:3px; color:#aaa; display:flex; align-items:center; gap:8px;">
          <span>ROOM: <strong id="lbl-room-code" style="color:#00ff66;">OFFLINE (SOLO)</strong></span>
          <button id="btn-copy-code" style="display:none; background:transparent; border:none; color:var(--accent,#06b6d4); cursor:pointer; font-size:0.75rem;">📋 COPY</button>
        </div>

        <button id="btn-open-multiplayer-modal" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
          👥 MULTIPLAYER (1-4)
        </button>

        <button id="btn-toggle-audio" class="aim-btn aim-btn-sm" style="background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.2); color:#aaa;">
          🔊 AUDIO
        </button>
      </div>
    </div>

    <!-- Active Connected Operators Manifest Bar -->
    <div id="operators-manifest-bar" style="display:flex; gap:10px; margin-bottom:16px; overflow-x:auto; padding-bottom:4px;">
      <!-- Populated dynamically with operator slots -->
    </div>

    <!-- Main Workspace Grid (Reactor Center, Controls Side) -->
    <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:20px; margin-bottom:20px;" class="lab-main-layout">
      
      <!-- LEFT: REACTOR VESSEL & LIVE TELEMETRY GAUGES -->
      <div class="panel" style="background:rgba(5,9,16,0.92); border:1.5px solid rgba(6,182,212,0.3); border-radius:4px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
        
        <!-- Reactor Canvas Area -->
        <div style="position:relative; width:100%; height:320px; background:radial-gradient(circle at 50% 50%, rgba(10,25,45,0.6) 0%, rgba(2,4,8,0.95) 100%); border:1px solid rgba(6,182,212,0.2); border-radius:4px; overflow:hidden; display:flex; justify-content:center; align-items:center;">
          <canvas id="reactor-canvas" width="480" height="320" style="width:100%; height:100%;"></canvas>
          
          <!-- Danger Flashing Overlay -->
          <div id="danger-overlay" style="position:absolute; inset:0; background:rgba(255,0,0,0.2); pointer-events:none; opacity:0; transition:opacity 0.2s;"></div>

          <!-- Purity & Progress Badges -->
          <div style="position:absolute; top:12px; left:14px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; background:rgba(0,0,0,0.7); padding:4px 8px; border:1px solid rgba(255,255,255,0.1); border-radius:3px;">
            PURITY: <strong id="lbl-purity-val" style="color:#00ff66;">100%</strong>
          </div>
          <div style="position:absolute; top:12px; right:14px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; background:rgba(0,0,0,0.7); padding:4px 8px; border:1px solid rgba(255,255,255,0.1); border-radius:3px;">
            YIELD PROGRESS: <strong id="lbl-progress-val" style="color:var(--accent,#06b6d4);">0%</strong>
          </div>

          <!-- Status Banner inside canvas -->
          <div id="reactor-status-banner" style="position:absolute; bottom:12px; font-family:'Orbitron',sans-serif; font-size:0.85rem; letter-spacing:1px; background:rgba(0,0,0,0.85); padding:6px 14px; border:1px solid #00ff66; color:#00ff66; border-radius:3px;">
            CONTAINMENT NOMINAL // READY
          </div>
        </div>

        <!-- Live Telemetry Meters -->
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-top:16px;">
          <!-- Temperature -->
          <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:3px; border:1px solid rgba(255,255,255,0.08); text-align:center;">
            <div style="font-size:0.65rem; color:#888; font-family:'Share Tech Mono',monospace;">TEMPERATURE</div>
            <div id="meter-temp" style="font-size:1.1rem; font-weight:bold; color:#fff; font-family:'Orbitron',sans-serif; margin:3px 0;">100°C</div>
            <div id="meter-temp-target" style="font-size:0.65rem; color:var(--accent,#06b6d4);">TARGET: 140-190°C</div>
          </div>

          <!-- Pressure -->
          <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:3px; border:1px solid rgba(255,255,255,0.08); text-align:center;">
            <div style="font-size:0.65rem; color:#888; font-family:'Share Tech Mono',monospace;">PRESSURE</div>
            <div id="meter-pressure" style="font-size:1.1rem; font-weight:bold; color:#fff; font-family:'Orbitron',sans-serif; margin:3px 0;">1.0 BAR</div>
            <div id="meter-pressure-target" style="font-size:0.65rem; color:var(--accent,#06b6d4);">TARGET: 2.0-4.0</div>
          </div>

          <!-- Agitator RPM -->
          <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:3px; border:1px solid rgba(255,255,255,0.08); text-align:center;">
            <div style="font-size:0.65rem; color:#888; font-family:'Share Tech Mono',monospace;">AGITATION</div>
            <div id="meter-rpm" style="font-size:1.1rem; font-weight:bold; color:#fff; font-family:'Orbitron',sans-serif; margin:3px 0;">0 RPM</div>
            <div id="meter-rpm-target" style="font-size:0.65rem; color:var(--accent,#06b6d4);">TARGET: 800-1800</div>
          </div>

          <!-- pH Level -->
          <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:3px; border:1px solid rgba(255,255,255,0.08); text-align:center;">
            <div style="font-size:0.65rem; color:#888; font-family:'Share Tech Mono',monospace;">pH LEVEL</div>
            <div id="meter-ph" style="font-size:1.1rem; font-weight:bold; color:#fff; font-family:'Orbitron',sans-serif; margin:3px 0;">7.0</div>
            <div id="meter-ph-target" style="font-size:0.65rem; color:var(--accent,#06b6d4);">TARGET: 6.2-7.8</div>
          </div>
        </div>

        <!-- Synthesis Yield Progress Bar -->
        <div style="margin-top:14px;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px; font-family:'Share Tech Mono',monospace;">
            <span style="color:#aaa;">COMPOUND SYNTHESIS FORMATION:</span>
            <span id="lbl-progress-percent" style="color:#00ff66; font-weight:bold;">0%</span>
          </div>
          <div style="width:100%; height:10px; background:rgba(0,0,0,0.6); border:1px solid rgba(6,182,212,0.3); border-radius:2px; overflow:hidden;">
            <div id="bar-progress-fill" style="width:0%; height:100%; background:linear-gradient(90deg, var(--accent,#06b6d4) 0%, #00ff66 100%); transition:width 0.2s;"></div>
          </div>
        </div>
      </div>

      <!-- RIGHT: INTERACTIVE OPERATOR CONTROLS DOCK -->
      <div style="display:flex; flex-direction:column; gap:16px;">

        <!-- STATION 1: REAGENT INJECTION -->
        <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.25); padding:14px;">
          <div style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span>🧪 STATION 1 // REAGENT INJECTORS</span>
            <span style="font-size:0.65rem; color:#888;">[SYNTHESIZER ROLE]</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;">
            <button class="aim-btn aim-btn-sm btn-reagent" data-reagent="cyano" style="border-color:#00b8ff; color:#00b8ff; font-size:0.7rem; padding:8px 2px;">
              CYANO<br><small>+Acid</small>
            </button>
            <button class="aim-btn aim-btn-sm btn-reagent" data-reagent="ether" style="border-color:#00ff66; color:#00ff66; font-size:0.7rem; padding:8px 2px;">
              ETHER<br><small>+Solvent</small>
            </button>
            <button class="aim-btn aim-btn-sm btn-reagent" data-reagent="argon" style="border-color:#a855f7; color:#a855f7; font-size:0.7rem; padding:8px 2px;">
              ARGON<br><small>+Cool</small>
            </button>
            <button class="aim-btn aim-btn-sm btn-reagent" data-reagent="pyro" style="border-color:#ef4444; color:#ef4444; font-size:0.7rem; padding:8px 2px;">
              PYRO<br><small>+Heat</small>
            </button>
            <button class="aim-btn aim-btn-sm btn-reagent" data-reagent="chelate" style="border-color:#f59e0b; color:#f59e0b; font-size:0.7rem; padding:8px 2px;">
              BUFFER<br><small>+pH 7</small>
            </button>
          </div>
        </div>

        <!-- STATION 2 & 3: THERMAL & PRESSURE CONTROLS -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          
          <!-- Thermal Controls -->
          <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.25); padding:14px;">
            <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff; margin-bottom:8px;">
              🔥 THERMAL ENGINE
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button id="btn-heat-coil" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.15); border-color:#ef4444; color:#ef4444; font-weight:bold;">
                🔥 HEAT COILS (+30°C)
              </button>
              <button id="btn-cryo-cool" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4); font-weight:bold;">
                ❄️ CRYO COOL (-30°C)
              </button>
            </div>
          </div>

          <!-- Pressure & Agitation -->
          <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.25); padding:14px;">
            <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff; margin-bottom:8px;">
              🌪️ AGITATION & VENT
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <div>
                <label style="font-size:0.65rem; color:#888; display:flex; justify-content:space-between;">
                  <span>STIR SPEED</span> <span id="lbl-slider-rpm">0 RPM</span>
                </label>
                <input type="range" id="slider-rpm" min="0" max="3000" step="100" value="0" style="width:100%; accent-color:var(--accent,#06b6d4);" />
              </div>
              <button id="btn-vent-pressure" class="aim-btn aim-btn-sm" style="background:rgba(245,158,11,0.15); border-color:#f59e0b; color:#f59e0b; font-weight:bold;">
                💨 VENT VALVE (-2.5 BAR)
              </button>
            </div>
          </div>
        </div>

        <!-- STATION 4: HAZARD & STABILIZER PURGE -->
        <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.25); padding:14px;">
          <div style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; margin-bottom:8px; display:flex; justify-content:space-between;">
            <span>⚠️ HAZARD & CONTAINMENT</span>
            <span style="font-size:0.65rem; color:#888;">[HAZARD SPEC]</span>
          </div>
          <div style="display:flex; gap:10px;">
            <button id="btn-inject-stabilizer" class="aim-btn aim-btn-sm" style="flex:1; background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66; font-weight:bold;">
              💉 DRIP STABILIZER (+15% PURITY)
            </button>
            <button id="btn-emergency-purge" class="aim-btn aim-btn-sm" style="flex:1; background:rgba(239,68,68,0.15); border-color:#ef4444; color:#ef4444; font-weight:bold;">
              🚨 EMERGENCY FLUSH
            </button>
          </div>
        </div>

        <!-- Quick Intercom / Activity Log -->
        <div class="panel" style="background:rgba(4,7,12,0.95); border:1px solid rgba(255,255,255,0.06); padding:12px; height:120px; display:flex; flex-direction:column;">
          <div style="font-size:0.7rem; color:var(--accent,#06b6d4); font-family:'Share Tech Mono',monospace; margin-bottom:4px;">
            // INTERCOM_LOG
          </div>
          <div id="game-intercom-stream" style="flex:1; overflow-y:auto; font-family:'Share Tech Mono',monospace; font-size:0.75rem; line-height:1.5; color:#aaa;">
            <div>[00:00] STANDING BY FOR SYNTHESIS COMMAND...</div>
          </div>
        </div>

      </div>
    </div>

    <!-- Multiplayer Connection Modal (Hidden by Default) -->
    <div id="mp-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center;">
      <div class="panel" style="width:90%; max-width:480px; background:rgba(10,15,25,0.98); border:1.5px solid var(--accent,#06b6d4); padding:24px; border-radius:4px; box-shadow:0 0 30px rgba(6,182,212,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#fff;">CO-OP MULTIPLAYER (1-4)</h3>
          <button id="btn-close-mp-modal" style="background:transparent; border:none; color:#888; font-size:1.2rem; cursor:pointer;">✕</button>
        </div>

        <p style="font-size:0.85rem; color:#aaa; margin-bottom:20px; line-height:1.5;">
          Connect with up to 4 live operators across any browser. Direct peer synchronization lets you divide labor across reactor stations in real time.
        </p>

        <!-- Host Option -->
        <div style="background:rgba(0,0,0,0.4); padding:14px; border-radius:4px; border:1px solid rgba(6,182,212,0.3); margin-bottom:14px;">
          <div style="font-weight:bold; color:#fff; font-size:0.85rem; margin-bottom:4px;">HOST A NEW CO-OP SESSION</div>
          <div style="font-size:0.75rem; color:#888; margin-bottom:10px;">Generates a live room code for other operators to join.</div>
          <button id="btn-host-room" class="aim-btn aim-btn-sm" style="width:100%; background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; font-weight:bold;">
            ⚡ CREATE HOST ROOM
          </button>
        </div>

        <!-- Join Option -->
        <div style="background:rgba(0,0,0,0.4); padding:14px; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">
          <div style="font-weight:bold; color:#fff; font-size:0.85rem; margin-bottom:4px;">JOIN AN EXISTING ROOM</div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <input type="text" id="ipt-join-room-code" placeholder="e.g. LAB-4821" style="flex:1; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.2); color:#fff; padding:6px 10px; font-family:'Share Tech Mono',monospace; text-transform:uppercase;" />
            <button id="btn-join-room" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.2); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4); font-weight:bold;">
              JOIN
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // UI Element Selectors
  const canvas = container.querySelector('#reactor-canvas');
  const ctx = canvas.getContext('2d');
  const dangerOverlay = container.querySelector('#danger-overlay');
  const statusBanner = container.querySelector('#reactor-status-banner');
  const intercomStream = container.querySelector('#game-intercom-stream');
  const operatorsBar = container.querySelector('#operators-manifest-bar');

  const meterTemp = container.querySelector('#meter-temp');
  const meterPressure = container.querySelector('#meter-pressure');
  const meterRpm = container.querySelector('#meter-rpm');
  const meterPh = container.querySelector('#meter-ph');
  const lblPurity = container.querySelector('#lbl-purity-val');
  const lblProgress = container.querySelector('#lbl-progress-val');
  const barProgressFill = container.querySelector('#bar-progress-fill');
  const lblProgressPercent = container.querySelector('#lbl-progress-percent');
  const sliderRpm = container.querySelector('#slider-rpm');
  const lblSliderRpm = container.querySelector('#lbl-slider-rpm');

  const logIntercom = (text, color = '#aaa') => {
    if (!intercomStream) return;
    const item = document.createElement('div');
    item.style.color = color;
    const time = new Date().toTimeString().split(' ')[0].substring(3);
    item.textContent = `[${time}] ${text}`;
    intercomStream.appendChild(item);
    intercomStream.scrollTop = intercomStream.scrollHeight;
  };

  // Render Operators Manifest
  const renderOperators = (players) => {
    if (!operatorsBar) return;
    operatorsBar.innerHTML = '';

    const allRoles = ['SYNTHESIZER', 'THERMAL', 'PRESSURE', 'HAZARD'];
    for (let i = 0; i < 4; i++) {
      const p = players[i];
      const slot = document.createElement('div');
      slot.style.cssText = `
        flex: 1; min-width: 140px; background: rgba(0,0,0,0.4); border: 1px solid ${p ? 'rgba(0,255,100,0.3)' : 'rgba(255,255,255,0.06)'};
        padding: 6px 10px; border-radius: 3px; font-family:'Share Tech Mono',monospace;
      `;
      if (p) {
        slot.innerHTML = `
          <div style="font-size:0.65rem; color:#888; display:flex; justify-content:space-between;">
            <span>SLOT ${i+1}</span> <span style="color:#00ff66;">● ${p.ping || 'LIVE'}</span>
          </div>
          <div style="font-size:0.8rem; font-weight:bold; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${p.name} ${p.isHost ? '(HOST)' : ''}
          </div>
          <div style="font-size:0.65rem; color:var(--accent,#06b6d4);">
            ROLE: ${p.role || allRoles[i]}
          </div>
        `;
      } else {
        slot.innerHTML = `
          <div style="font-size:0.65rem; color:#555;">SLOT ${i+1} [VACANT]</div>
          <div style="font-size:0.75rem; color:#666;">OPEN OPERATOR</div>
          <div style="font-size:0.65rem; color:#444;">${allRoles[i]}</div>
        `;
      }
      operatorsBar.appendChild(slot);
    }
  };

  // Initialize Network Manager
  network = new LabNetworkManager({
    onPlayersUpdate: (players) => {
      renderOperators(players);
    },
    onActionReceived: (payload) => {
      handleRemoteAction(payload);
    },
    onStateUpdate: (remoteState) => {
      // Sync state on clients
      state = { ...state, ...remoteState };
    },
    onLogMessage: (msg, color) => {
      logIntercom(msg, color);
    }
  });

  // Start with default local operator
  renderOperators([{
    id: network.localPlayerId,
    name: network.localPlayerName,
    role: 'SYNTHESIZER',
    isHost: true,
    ping: '0ms'
  }]);

  // Remote Action Dispatcher
  const handleRemoteAction = (payload) => {
    const { senderName, action } = payload;
    switch (action.type) {
      case 'INJECT_REAGENT':
        applyReagent(action.reagent, senderName);
        break;
      case 'HEAT':
        state.temp = Math.min(400, state.temp + 30);
        state.pressure = Math.min(10, state.pressure + 0.6);
        if (!audioMuted) playPump();
        logIntercom(`${senderName} FIRED HEAT COILS (+30°C)`, '#ef4444');
        break;
      case 'CRYO':
        state.temp = Math.max(20, state.temp - 30);
        state.pressure = Math.max(0.8, state.pressure - 0.4);
        if (!audioMuted) playSteam();
        logIntercom(`${senderName} ENGAGED CRYO INJECTION (-30°C)`, '#00b8ff');
        break;
      case 'VENT':
        state.pressure = Math.max(0.5, state.pressure - 2.5);
        state.temp = Math.max(40, state.temp - 10);
        if (!audioMuted) playSteam();
        logIntercom(`${senderName} VENTED PRESSURE (-2.5 BAR)`, '#f59e0b');
        break;
      case 'RPM':
        state.rpm = action.rpm;
        if (sliderRpm) sliderRpm.value = action.rpm;
        if (lblSliderRpm) lblSliderRpm.textContent = `${action.rpm} RPM`;
        break;
      case 'STABILIZE':
        state.purity = Math.min(100, state.purity + 15);
        state.ph = (state.ph * 0.7) + (7.0 * 0.3);
        if (!audioMuted) playBubble();
        logIntercom(`${senderName} DRIPPED STABILIZER (+15% PURITY)`, '#00ff66');
        break;
      case 'PURGE':
        resetVessel(senderName);
        break;
    }
  };

  const applyReagent = (reagent, operatorName) => {
    state.volume = Math.min(100, state.volume + 10);
    state.reagentsAdded[reagent] = (state.reagentsAdded[reagent] || 0) + 1;
    if (!audioMuted) {
      playPump();
      setTimeout(playBubble, 100);
    }

    switch (reagent) {
      case 'cyano':
        state.ph = Math.max(1, state.ph - 0.8);
        state.temp = Math.max(20, state.temp - 8);
        logIntercom(`${operatorName} INJECTED CYANO-PHOSPHATE (-pH, -Temp)`, '#00b8ff');
        break;
      case 'ether':
        state.pressure = Math.min(10, state.pressure + 1.2);
        state.temp = Math.min(400, state.temp + 12);
        logIntercom(`${operatorName} INJECTED NEON-ETHER (+Pressure)`, '#00ff66');
        break;
      case 'argon':
        state.temp = Math.max(20, state.temp - 25);
        state.pressure = Math.max(0.8, state.pressure - 0.8);
        logIntercom(`${operatorName} INJECTED ARGON-STABILIZER (Chilled)`, '#a855f7');
        break;
      case 'pyro':
        state.temp = Math.min(400, state.temp + 45);
        state.pressure = Math.min(10, state.pressure + 1.5);
        logIntercom(`${operatorName} INJECTED PYRO-CATALYST (+45°C)`, '#ef4444');
        break;
      case 'chelate':
        state.ph = 7.0;
        state.purity = Math.min(100, state.purity + 10);
        logIntercom(`${operatorName} INJECTED pH 7.0 BUFFER`, '#f59e0b');
        break;
    }
  };

  const resetVessel = (operatorName = 'SYSTEM') => {
    state.temp = 80;
    state.pressure = 1.0;
    state.rpm = 0;
    state.ph = 7.0;
    state.volume = 20;
    state.purity = 100;
    state.progress = 0;
    state.gameOver = false;
    state.gameWon = false;
    state.reagentsAdded = { cyano: 0, ether: 0, argon: 0, pyro: 0, chelate: 0 };
    if (!audioMuted) playSteam();
    logIntercom(`CONTAINMENT VESSEL PURGED BY ${operatorName}`, '#ef4444');
    statusBanner.textContent = 'VESSEL PURGED // READY';
    statusBanner.style.borderColor = '#00ff66';
    statusBanner.style.color = '#00ff66';
    dangerOverlay.style.opacity = '0';
  };

  // Particles array for animated bubbling liquid
  const particles = [];
  for (let i = 0; i < 35; i++) {
    particles.push({
      x: 200 + Math.random() * 80,
      y: 200 + Math.random() * 60,
      r: 1.5 + Math.random() * 3.5,
      vy: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.8
    });
  }

  // Visual Canvas Loop
  let frameCount = 0;
  const renderCanvas = () => {
    frameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Outer Beaker / Containment Vessel Wireframe
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 70, 80);
    ctx.lineTo(cx - 70, cy + 90);
    ctx.quadraticCurveTo(cx - 70, cy + 120, cx - 40, cy + 120);
    ctx.lineTo(cx + 40, cy + 120);
    ctx.quadraticCurveTo(cx + 70, cy + 120, cx + 70, cy + 90);
    ctx.lineTo(cx + 70, 80);
    ctx.stroke();

    // Measurement Tick Marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let h = cy + 100; h >= 100; h -= 20) {
      ctx.beginPath();
      ctx.moveTo(cx - 70, h);
      ctx.lineTo(cx - 60, h);
      ctx.stroke();
    }

    // Dynamic Liquid Fill
    const fillHeight = (state.volume / 100) * 140;
    const liquidTop = (cy + 115) - fillHeight;

    // Color shift based on temperature & recipe
    let [r, g, b] = activeRecipe.fluidColor;
    if (state.temp > 250) {
      r = Math.min(255, r + (state.temp - 250) * 1.5);
      g = Math.max(0, g - 50);
    }
    const colorStr = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 66, cy + 90);
    ctx.quadraticCurveTo(cx - 66, cy + 116, cx - 40, cy + 116);
    ctx.lineTo(cx + 40, cy + 116);
    ctx.quadraticCurveTo(cx + 66, cy + 116, cx + 66, cy + 90);
    ctx.lineTo(cx + 66, liquidTop);

    // Wave ripple on top of fluid
    const waveAmp = (state.rpm / 3000) * 8 + 2;
    ctx.quadraticCurveTo(cx, liquidTop + Math.sin(frameCount * 0.1) * waveAmp, cx - 66, liquidTop);
    ctx.closePath();
    ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0.65)`;
    ctx.fill();

    // Glow under fluid
    ctx.shadowColor = colorStr;
    ctx.shadowBlur = 20;
    ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0.3)`;
    ctx.fill();
    ctx.restore();

    // Agitator vortex pin
    if (state.rpm > 100) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, 70);
      ctx.lineTo(cx, cy + 105);
      ctx.stroke();
      // Spinner pill
      ctx.translate(cx, cy + 105);
      ctx.rotate(frameCount * (state.rpm / 600));
      ctx.fillStyle = '#fff';
      ctx.fillRect(-12, -3, 24, 6);
      ctx.restore();
    }

    // Bubbles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Rise
      p.y -= p.vy * (1 + state.rpm / 1000);
      p.x += p.vx + Math.sin(frameCount * 0.05) * 0.5;

      if (p.y < liquidTop) {
        p.y = cy + 100 + Math.random() * 10;
        p.x = cx - 50 + Math.random() * 100;
      }
    });

    // Steam vents if valve is open or temperature > 300°C
    if (state.temp > 280 || state.pressure > 7.0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let s = 0; s < 5; s++) {
        const sx = cx + (Math.random() - 0.5) * 40;
        const sy = 60 - Math.random() * 40;
        ctx.beginPath();
        ctx.arc(sx, sy, 6 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    animationFrameId = requestAnimationFrame(renderCanvas);
  };

  // Main Simulation Physics Loop (100ms ticks)
  let lastAlarmTime = 0;
  gameLoopInterval = setInterval(() => {
    if (state.gameOver || state.gameWon) return;

    // Ambient thermal equilibrium
    if (state.temp > 70) state.temp -= 0.3;
    if (state.pressure > 1.0) state.pressure -= 0.02;

    // Agitation temperature bump
    if (state.rpm > 1500) {
      state.temp += 0.4;
      state.pressure += 0.03;
    }

    // Check sweet spots
    const inTemp = state.temp >= activeRecipe.targetTempMin && state.temp <= activeRecipe.targetTempMax;
    const inPressure = state.pressure >= activeRecipe.targetPressureMin && state.pressure <= activeRecipe.targetPressureMax;
    const inRpm = state.rpm >= activeRecipe.targetRpmMin && state.rpm <= activeRecipe.targetRpmMax;
    const inPh = state.ph >= activeRecipe.targetPhMin && state.ph <= activeRecipe.targetPhMax;

    // Check if within sweet spot
    if (inTemp && inPressure && inRpm && inPh) {
      state.progress = Math.min(100, state.progress + 1.2);
      statusBanner.textContent = 'OPTIMAL EQUILIBRIUM // SYNTHESIZING...';
      statusBanner.style.borderColor = '#00ff66';
      statusBanner.style.color = '#00ff66';
      dangerOverlay.style.opacity = '0';
    } else {
      // Impurities accumulate outside sweet spot
      if (state.progress > 5 && Math.random() < 0.2) {
        state.purity = Math.max(40, state.purity - 0.5);
      }
      statusBanner.textContent = 'SUB-OPTIMAL PARAMETERS // ADJUST VARIABLES';
      statusBanner.style.borderColor = '#f59e0b';
      statusBanner.style.color = '#f59e0b';
    }

    // Hazard checks: Thermal Runaway
    if (state.temp > 330 || state.pressure > 8.5) {
      state.runawayRisk += 2;
      dangerOverlay.style.opacity = (Math.sin(Date.now() * 0.01) * 0.3 + 0.3).toString();
      statusBanner.textContent = '🚨 WARNING: THERMAL RUNAWAY IMMINENT!';
      statusBanner.style.borderColor = '#ef4444';
      statusBanner.style.color = '#ef4444';

      if (!audioMuted && Date.now() - lastAlarmTime > 1200) {
        playAlarm();
        lastAlarmTime = Date.now();
      }

      // Meltdown Explosion condition
      if (state.temp > 380 || state.pressure >= 9.8 || state.runawayRisk >= 100) {
        state.gameOver = true;
        if (!audioMuted) playExplosion();
        logIntercom('💥 CATASTROPHIC REACTOR MELTDOWN! VESSEL RUPTURED!', '#ef4444');
        statusBanner.textContent = 'REACTOR MELTDOWN // CONTAINMENT FAILED';
        showToast('MELTDOWN', 'Containment breach! Reactor destroyed.', 'error');
      }
    } else {
      state.runawayRisk = Math.max(0, state.runawayRisk - 1);
    }

    // Victory condition
    if (state.progress >= 100 && !state.gameWon) {
      state.gameWon = true;
      if (!audioMuted) playSuccess();
      logIntercom(`🏆 BATCH SUCCESSFUL! Synthesized ${activeRecipe.name} (Purity: ${Math.round(state.purity)}%)`, '#00ff66');
      statusBanner.textContent = `BATCH COMPLETE // GRADE: ${state.purity > 90 ? 'S-RANK' : 'A-RANK'}`;
      showToast('SUCCESS', `Compound Synthesized! Purity: ${Math.round(state.purity)}%`);
    }

    // Update Telemetry UI
    meterTemp.textContent = `${Math.round(state.temp)}°C`;
    meterTemp.style.color = inTemp ? '#00ff66' : (state.temp > activeRecipe.targetTempMax ? '#ef4444' : '#00b8ff');

    meterPressure.textContent = `${state.pressure.toFixed(1)} BAR`;
    meterPressure.style.color = inPressure ? '#00ff66' : (state.pressure > activeRecipe.targetPressureMax ? '#ef4444' : '#00b8ff');

    meterRpm.textContent = `${state.rpm} RPM`;
    meterRpm.style.color = inRpm ? '#00ff66' : '#fff';

    meterPh.textContent = state.ph.toFixed(1);
    meterPh.style.color = inPh ? '#00ff66' : '#f59e0b';

    lblPurity.textContent = `${Math.round(state.purity)}%`;
    lblProgress.textContent = `${Math.round(state.progress)}%`;
    lblProgressPercent.textContent = `${Math.round(state.progress)}%`;
    barProgressFill.style.width = `${state.progress}%`;

    // Broadcast state to remote players if Host
    if (network && network.isHost) {
      network.broadcastGameState(state);
    }
  }, 100);

  // Attach Operator Control Events
  container.querySelectorAll('.btn-reagent').forEach(btn => {
    btn.addEventListener('click', () => {
      const reagent = btn.dataset.reagent;
      network.sendGameAction({ type: 'INJECT_REAGENT', reagent });
    });
  });

  container.querySelector('#btn-heat-coil')?.addEventListener('click', () => {
    network.sendGameAction({ type: 'HEAT' });
  });

  container.querySelector('#btn-cryo-cool')?.addEventListener('click', () => {
    network.sendGameAction({ type: 'CRYO' });
  });

  container.querySelector('#btn-vent-pressure')?.addEventListener('click', () => {
    network.sendGameAction({ type: 'VENT' });
  });

  sliderRpm?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    lblSliderRpm.textContent = `${val} RPM`;
    network.sendGameAction({ type: 'RPM', rpm: val });
  });

  container.querySelector('#btn-inject-stabilizer')?.addEventListener('click', () => {
    network.sendGameAction({ type: 'STABILIZE' });
  });

  container.querySelector('#btn-emergency-purge')?.addEventListener('click', () => {
    network.sendGameAction({ type: 'PURGE' });
  });

  // Audio Toggle
  const btnToggleAudio = container.querySelector('#btn-toggle-audio');
  if (btnToggleAudio) {
    btnToggleAudio.onclick = () => {
      audioMuted = !audioMuted;
      btnToggleAudio.textContent = audioMuted ? '🔇 MUTED' : '🔊 AUDIO';
      showToast('AUDIO', audioMuted ? 'Audio SFX Muted' : 'Audio SFX Active');
    };
  }

  // Multiplayer Modal Handling
  const mpModal = container.querySelector('#mp-modal-overlay');
  const btnOpenMp = container.querySelector('#btn-open-multiplayer-modal');
  const btnCloseMp = container.querySelector('#btn-close-mp-modal');
  const btnHost = container.querySelector('#btn-host-room');
  const btnJoin = container.querySelector('#btn-join-room');
  const iptJoinCode = container.querySelector('#ipt-join-room-code');
  const lblRoomCode = container.querySelector('#lbl-room-code');
  const btnCopyCode = container.querySelector('#btn-copy-code');

  if (btnOpenMp && mpModal) {
    btnOpenMp.onclick = () => { mpModal.style.display = 'flex'; };
  }
  if (btnCloseMp && mpModal) {
    btnCloseMp.onclick = () => { mpModal.style.display = 'none'; };
  }

  if (btnHost) {
    btnHost.onclick = () => {
      const code = network.hostRoom();
      lblRoomCode.textContent = code;
      btnCopyCode.style.display = 'inline-block';
      mpModal.style.display = 'none';
      showToast('HOSTING', `Room Created: ${code}`);
    };
  }

  if (btnJoin && iptJoinCode) {
    btnJoin.onclick = () => {
      const code = iptJoinCode.value.trim().toUpperCase();
      if (!code) return showToast('ERROR', 'Please enter a room code');
      network.joinRoom(code);
      lblRoomCode.textContent = code;
      btnCopyCode.style.display = 'inline-block';
      mpModal.style.display = 'none';
      showToast('JOINING', `Connecting to: ${code}`);
    };
  }

  if (btnCopyCode) {
    btnCopyCode.onclick = () => {
      navigator.clipboard.writeText(lblRoomCode.textContent);
      showToast('COPIED', 'Room code copied to clipboard!');
    };
  }

  // Navigation Back Button
  container.querySelector('#btn-back-modules')?.addEventListener('click', () => {
    playClick();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (network) network.disconnect();
    onBack();
  });

  // Start Canvas animation
  renderCanvas();

  // Cleanup on unmount
  container.cleanup = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (gameLoopInterval) clearInterval(gameLoopInterval);
    if (network) network.disconnect();
  };

  return container;
}
