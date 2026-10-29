/**
 * AlphaCore Meade DS Digital Electronic Telescope & Observatory Integration
 * Supports:
 * - 2-Player Asymmetric Co-Op Network Distribution (Operator 1 Helmsman & Operator 2 Optical Engineer)
 * - Solo Full-Bridge Override (Single-operator dual-console)
 * - Red Night-Vision HUD toggle
 * - Virtual Autostar Handbox (with dual-skins: #494 14-button vs #497 20-button + WebSerial probe)
 * - 2D Polar Sky Dome Radar Canvas
 * - ASCOM Electronic Focuser, Lucky Stacker, Narrowband Filters & Reticle Offset Ping
 * - Complete C:\Users\josh6\Documents\Telescope Pre-Flight, RPi5 & ASCOM Vault integration
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { LabNetworkManager } from './thelab/network-manager.js';
import { LX200SerialEngine } from './telescope/lx200-serial.js';
import { createSkyRadarCanvas, calculateLST, SKY_CATALOG, findCelestialTarget } from './telescope/sky-catalog.js';
import { createOpticalFeed } from './telescope/optical-feed.js';
import { createKnowledgeHub } from './telescope/knowledge-hub.js';
import { playClick, playPump, playAlarm, playSuccess } from './thelab/audio-synth.js';

export default function TelescopePage() {
  const container = createElement('div', { class: 'telescope-observatory-view slide-up' });

  // Serial Mount Engine
  const mountEngine = new LX200SerialEngine();

  // Network Manager (using the hybrid P2P/Broadcast stack from The Lab)
  let network = null;
  let localRole = 'HELMSMAN'; // 'HELMSMAN' (Op 1) or 'OPTICAL_ENGINEER' (Op 2)
  let isSoloOverride = true; // Default to full-bridge solo override for convenience
  let activeTab = 'MISSION_CONTROL'; // 'MISSION_CONTROL', 'PREFLIGHT', 'ASCOM_VAULT'
  let handboxSkin = '497'; // '494' or '497'
  let isNightVision = false;

  // Clock interval
  let clockInterval = null;

  // UI Skeleton
  container.innerHTML = `
    <!-- Top Observatory Header & Telemetry Clocks -->
    <div class="panel" style="margin-bottom:14px; padding:12px 18px; background:rgba(6,12,24,0.92); border:1.5px solid var(--accent,#06b6d4); border-radius:4px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:2rem;">🔭</span>
          <div>
            <h1 style="font-family:'Orbitron',sans-serif; font-size:1.25rem; color:#fff; letter-spacing:1px; margin:0 0 2px 0;">
              ALPHACORE OBSERVATORY // MEADE DS LX200
            </h1>
            <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:var(--accent,#06b6d4); letter-spacing:1px;">
              2-PLAYER CO-OP MISSION CONTROL & HARDWARE BRIDGE
            </div>
          </div>
        </div>

        <!-- Clocks & Status -->
        <div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;">
          <div style="text-align:right; font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
            <div style="color:#888;">LOCAL SIDEREAL TIME</div>
            <div id="clock-lst" style="color:#00ff66; font-size:0.95rem; font-weight:bold;">02:31:49 LST</div>
          </div>
          <div style="text-align:right; font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
            <div style="color:#888;">UTC TIME</div>
            <div id="clock-utc" style="color:#fff; font-size:0.95rem;">00:00:00 UTC</div>
          </div>

          <!-- Night Vision Toggle -->
          <button id="btn-toggle-night-vision" class="aim-btn aim-btn-sm" style="background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c; font-family:'Orbitron',sans-serif; font-size:0.75rem; font-weight:bold; padding:6px 12px;">
            🔴 NIGHT-VISION HUD
          </button>
        </div>
      </div>

      <!-- Co-Op Lobby & Station Role Switcher Bar -->
      <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:8px; align-items:center;">
          <button id="btn-host-room" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
            🌐 HOST 2P ROOM
          </button>
          <input type="text" id="ipt-room-code" placeholder="ROOM CODE" class="aim-input" style="width:110px; padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.6); color:#fff; border:1px solid #334155; text-transform:uppercase;">
          <button id="btn-join-room" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
            JOIN
          </button>
          <span id="lbl-active-room" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66; margin-left:6px;">
            SOLO LOCAL
          </span>
        </div>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#888;">OPERATOR STATION:</span>
          <button id="btn-role-helmsman" class="aim-btn aim-btn-sm active" style="font-size:0.75rem; padding:4px 10px; border-color:var(--accent,#06b6d4);">
            OP-1: HELMSMAN (MOUNT)
          </button>
          <button id="btn-role-optical" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
            OP-2: OPTICAL ENGINEER
          </button>
          <button id="btn-toggle-solo" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66; font-size:0.75rem; padding:4px 10px; font-weight:bold;">
            ⚡ SOLO FULL-BRIDGE: ON
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div style="display:flex; gap:8px; margin-bottom:14px; border-bottom:1px solid rgba(6,182,212,0.3); padding-bottom:10px;">
      <button id="nav-tab-mission" class="aim-btn active-tab" style="font-family:'Orbitron',sans-serif; font-size:0.85rem; padding:8px 16px; border-color:var(--accent,#06b6d4); color:#fff;">
        🔭 MISSION CONTROL
      </button>
      <button id="nav-tab-preflight" class="aim-btn" style="font-family:'Orbitron',sans-serif; font-size:0.85rem; padding:8px 16px; color:#aaa;">
        🧭 PRE-FLIGHT & HANDBOX ID
      </button>
      <button id="nav-tab-ascom" class="aim-btn" style="font-family:'Orbitron',sans-serif; font-size:0.85rem; padding:8px 16px; color:#aaa;">
        🔌 ASCOM DRIVERS, RPI5 & VAULT
      </button>
    </div>

    <!-- Main Content Dynamic Host Container -->
    <div id="telescope-dynamic-content" style="width:100%;"></div>
  `;

  const dynamicContent = container.querySelector('#telescope-dynamic-content');
  const clockLst = container.querySelector('#clock-lst');
  const clockUtc = container.querySelector('#clock-utc');
  const btnToggleNightVision = container.querySelector('#btn-toggle-night-vision');
  const btnRoleHelmsman = container.querySelector('#btn-role-helmsman');
  const btnRoleOptical = container.querySelector('#btn-role-optical');
  const btnToggleSolo = container.querySelector('#btn-toggle-solo');
  const btnHostRoom = container.querySelector('#btn-host-room');
  const btnJoinRoom = container.querySelector('#btn-join-room');
  const iptRoomCode = container.querySelector('#ipt-room-code');
  const lblActiveRoom = container.querySelector('#lbl-active-room');

  // Subtab buttons
  const navTabMission = container.querySelector('#nav-tab-mission');
  const navTabPreflight = container.querySelector('#nav-tab-preflight');
  const navTabAscom = container.querySelector('#nav-tab-ascom');

  // -------------------------------------------------------------
  // Real-Time LST & UTC Clock
  // -------------------------------------------------------------
  function updateClocks() {
    const now = new Date();
    const lstHours = calculateLST(now, mountEngine.state.longitudeDeg);
    const lh = Math.floor(lstHours);
    const lm = Math.floor((lstHours - lh) * 60);
    const ls = Math.floor(((lstHours - lh) * 60 - lm) * 60);
    clockLst.textContent = `${String(lh).padStart(2, '0')}:${String(lm).padStart(2, '0')}:${String(ls).padStart(2, '0')} LST`;
    clockUtc.textContent = now.toUTCString().split(' ')[4] + ' UTC';
  }
  clockInterval = setInterval(updateClocks, 1000);
  updateClocks();

  // -------------------------------------------------------------
  // Red Night-Vision HUD Mode
  // -------------------------------------------------------------
  btnToggleNightVision.onclick = () => {
    isNightVision = !isNightVision;
    playClick();
    if (isNightVision) {
      container.classList.add('night-vision-mode');
      btnToggleNightVision.style.background = '#ff003c';
      btnToggleNightVision.style.color = '#fff';
      showToast('NIGHT-VISION', 'Monochrome Red Dark-Adaptation Mode Active');
    } else {
      container.classList.remove('night-vision-mode');
      btnToggleNightVision.style.background = 'rgba(255,0,60,0.15)';
      btnToggleNightVision.style.color = '#ff003c';
      showToast('INFO', 'Standard Cyberpunk HUD Restored');
    }
  };

  // -------------------------------------------------------------
  // Co-Op Network Layer Integration
  // -------------------------------------------------------------
  network = new LabNetworkManager({
    onPlayersUpdate: (players) => {
      lblActiveRoom.textContent = `ROOM: ${network.roomCode} (${players.length}P)`;
    },
    onActionReceived: (packet) => {
      const act = packet.action;
      if (!act) return;

      if (act.type === 'MOUNT_SLEW') {
        mountEngine.state.slewRate = act.rate || mountEngine.state.slewRate;
        mountEngine.slew(act.direction);
      } else if (act.type === 'MOUNT_HALT') {
        mountEngine.halt();
      } else if (act.type === 'GOTO_TARGET') {
        mountEngine.gotoTarget(act.ra, act.dec);
        showToast('GOTO', `Operator initiated GoTo slew: ${act.targetName || 'Target'}`);
      } else if (act.type === 'ALIGN_SYNC') {
        mountEngine.syncAlignment();
        showToast('ALIGN', 'Mount Alignment Synced across network');
      } else if (act.type === 'RETICLE_PING') {
        if (opticalFeedInstance) {
          opticalFeedInstance.setReticlePing(act.ping);
        }
        playAlarm();
        showToast('RETICLE PING', `Op-2 pinged target offset: ΔX ${act.ping.deltaX}, ΔY ${act.ping.deltaY}`);
        const driftAlert = container.querySelector('#helmsman-drift-alert');
        const driftText = container.querySelector('#drift-alert-text');
        if (driftAlert && driftText) {
          driftAlert.style.display = 'flex';
          driftAlert.dataset.dx = act.ping.deltaX;
          driftAlert.dataset.dy = act.ping.deltaY;
          driftText.textContent = `TARGET OFFSET: ΔX ${act.ping.deltaX > 0 ? '+' : ''}${act.ping.deltaX}px, ΔY ${act.ping.deltaY > 0 ? '+' : ''}${act.ping.deltaY}px (${act.ping.deltaX > 0 ? 'EAST' : 'WEST'} / ${act.ping.deltaY > 0 ? 'SOUTH' : 'NORTH'})`;
        }
      }
    },
    onLogMessage: (msg) => {
      // optional
    }
  });

  btnHostRoom.onclick = () => {
    playClick();
    const code = network.hostRoom();
    lblActiveRoom.textContent = `ROOM: ${code} (HOST)`;
    showToast('HOSTING', `Observatory Room: ${code}`);
  };

  btnJoinRoom.onclick = () => {
    playClick();
    const code = iptRoomCode.value.trim().toUpperCase();
    if (!code) return showToast('ERROR', 'Enter room code to join');
    network.joinRoom(code);
    lblActiveRoom.textContent = `ROOM: ${code} (CLIENT)`;
    showToast('CONNECTING', `Connecting to Observatory: ${code}`);
  };

  // -------------------------------------------------------------
  // Role & Solo Switchers
  // -------------------------------------------------------------
  btnRoleHelmsman.onclick = () => {
    playClick();
    localRole = 'HELMSMAN';
    btnRoleHelmsman.classList.add('active');
    btnRoleOptical.classList.remove('active');
    if (activeTab === 'MISSION_CONTROL') renderMissionControl();
  };

  btnRoleOptical.onclick = () => {
    playClick();
    localRole = 'OPTICAL_ENGINEER';
    btnRoleOptical.classList.add('active');
    btnRoleHelmsman.classList.remove('active');
    if (activeTab === 'MISSION_CONTROL') renderMissionControl();
  };

  btnToggleSolo.onclick = () => {
    playClick();
    isSoloOverride = !isSoloOverride;
    if (isSoloOverride) {
      btnToggleSolo.textContent = '⚡ SOLO FULL-BRIDGE: ON';
      btnToggleSolo.style.borderColor = '#00ff66';
      btnToggleSolo.style.color = '#00ff66';
      showToast('SOLO', 'Full-Bridge Override Active: Dual Station Command');
    } else {
      btnToggleSolo.textContent = '⚡ SOLO FULL-BRIDGE: OFF';
      btnToggleSolo.style.borderColor = '#888';
      btnToggleSolo.style.color = '#888';
      showToast('CO-OP', 'Strict Role Station Split Active');
    }
    if (activeTab === 'MISSION_CONTROL') renderMissionControl();
  };

  // -------------------------------------------------------------
  // Instances
  // -------------------------------------------------------------
  let skyRadarInstance = null;
  let opticalFeedInstance = null;

  // -------------------------------------------------------------
  // Tab 1: MISSION CONTROL (Dual Operator Stations)
  // -------------------------------------------------------------
  function renderMissionControl() {
    // Cleanup prior canvas loops
    if (skyRadarInstance) skyRadarInstance.destroy();
    if (opticalFeedInstance) opticalFeedInstance.destroy();

    dynamicContent.innerHTML = '';

    const missionGrid = document.createElement('div');
    missionGrid.className = 'observatory-mission-grid';
    missionGrid.style.cssText = `
      display: grid;
      grid-template-columns: ${isSoloOverride ? '1fr 1fr' : '1fr'};
      gap: 16px;
      width: 100%;
    `;

    // -------------------------------------------------------------
    // STATION 1: MOUNT HELMSMAN & ASTROMETRIST
    // -------------------------------------------------------------
    const station1 = document.createElement('div');
    station1.className = 'station-panel helmsman-station';
    station1.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 14px;
    `;

    station1.innerHTML = `
      <!-- Station 1 Header -->
      <div style="background:rgba(6,12,24,0.9); padding:10px 14px; border:1px solid rgba(6,182,212,0.3); border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; font-weight:bold; letter-spacing:1px;">
            OPERATOR 1: MOUNT HELMSMAN & ASTROMETRIST
          </span>
          <div style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace;">
            HARDWARE: MEADE DS ALT-AZ // AUTOSTAR SERIAL BUS
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button id="btn-skin-494" class="aim-btn aim-btn-sm ${handboxSkin === '494' ? 'active' : ''}" style="font-size:0.7rem; padding:2px 8px;">
            #494 SKIN
          </button>
          <button id="btn-skin-497" class="aim-btn aim-btn-sm ${handboxSkin === '497' ? 'active' : ''}" style="font-size:0.7rem; padding:2px 8px;">
            #497 SKIN
          </button>
        </div>
      </div>

      <!-- WebSerial Hardware Link Widget -->
      <div class="panel" style="padding:12px; background:rgba(8,16,28,0.85); border:1px solid rgba(6,182,212,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span id="serial-status-dot" style="width:10px; height:10px; border-radius:50%; background:#00ff66; display:inline-block; box-shadow:0 0 8px #00ff66;"></span>
            <span id="lbl-serial-port" style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#fff;">
              PORT: ${mountEngine.state.portName} (9600 8N1)
            </span>
          </div>
          <div style="display:flex; gap:6px;">
            <button id="btn-connect-serial" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
              🔌 CONNECT WEBSERIAL
            </button>
            <button id="btn-autodetect-hbx" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
              🔍 AUTO-DETECT HBX
            </button>
            <button id="btn-inject-pc-time" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66; font-size:0.75rem; padding:4px 10px;">
              ⚡ AUTO-INJECT PC TIME
            </button>
          </div>
        </div>
      </div>

      <!-- 2D Polar Sky Dome Radar & Target Lock -->
      <div class="panel" style="padding:14px; background:rgba(8,16,28,0.85); border:1px solid rgba(6,182,212,0.25); display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff;">🌌 2D POLAR SKY DOME RADAR</span>
          <span id="lbl-current-coords" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66;">
            RA 02h 31m | DEC +89° 15' | ALT 40.0°
          </span>
        </div>

        <div id="radar-canvas-slot" style="display:flex; justify-content:center;"></div>

        <!-- Target Lock & Slew Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; background:rgba(0,0,0,0.5); padding:8px 12px; border-radius:4px;">
          <div>
            <div style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace;">SELECTED TARGET:</div>
            <div id="lbl-selected-target-name" style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#06b6d4; font-weight:bold;">
              Saturn (Ringed Planet)
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="btn-exec-goto" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.2); border-color:#06b6d4; color:#fff; font-weight:bold; padding:6px 14px;">
              🎯 GOTO TARGET (:MS#)
            </button>
            <button id="btn-sync-alignment" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66; font-weight:bold; padding:6px 14px;">
              ⭐ 2-STAR SYNC (:CM#)
            </button>
          </div>
        </div>
      </div>

      <!-- Helmsman Drift Alert HUD (Revealed on Operator 2 Reticle Ping) -->
      <div id="helmsman-drift-alert" style="display:none; background:rgba(239,68,68,0.18); border:1.5px solid #ef4444; border-radius:4px; padding:10px 14px; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.2rem;">🚨</span>
          <div>
            <div style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#ef4444; font-weight:bold;">
              OP-2 OPTICAL RETICLE DRIFT DETECTED
            </div>
            <div id="drift-alert-text" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#fca5a5;">
              TARGET OFFSET: ΔX 0px, ΔY 0px
            </div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button id="btn-quick-correct-drift" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.3); border-color:#ef4444; color:#fff; font-size:0.75rem; font-weight:bold; padding:4px 12px;">
            🎯 1-CLICK AUTO-NUDGE
          </button>
          <button id="btn-dismiss-drift" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 8px;">
            ✕ DISMISS
          </button>
        </div>
      </div>

      <!-- Virtual Autostar Handbox Controller -->
      <div class="panel" style="padding:16px; background:rgba(8,16,28,0.95); border:1.5px solid rgba(6,182,212,0.4); border-radius:6px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; font-weight:bold;">
            VIRTUAL AUTOSTAR HANDBOX // ${handboxSkin === '494' ? '#494 (14-KEY)' : '#497 (20-KEY)'}
          </span>
          <span id="lbl-handbox-display-screen" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:#010e14; border:1px solid #00ff66; color:#00ff66; padding:3px 10px; border-radius:2px;">
            AUTOSTAR READY: TRACKING
          </span>
        </div>

        <!-- Directional Rockers & Emergency Halt -->
        <div style="display:flex; justify-content:center; align-items:center; margin-bottom:14px;">
          <div style="display:grid; grid-template-columns:56px 56px 56px; grid-template-rows:56px 56px 56px; gap:6px;">
            <div></div>
            <button id="btn-slew-n" class="aim-btn" style="font-size:1.1rem; font-weight:bold; border-color:#06b6d4;">▲ N</button>
            <div></div>

            <button id="btn-slew-w" class="aim-btn" style="font-size:1.1rem; font-weight:bold; border-color:#06b6d4;">◀ W</button>
            <button id="btn-slew-halt" class="aim-btn" style="background:rgba(239,68,68,0.25); border-color:#ef4444; color:#ef4444; font-family:'Orbitron',sans-serif; font-size:0.7rem; font-weight:bold; padding:0;">
              HALT<br>:Q#
            </button>
            <button id="btn-slew-e" class="aim-btn" style="font-size:1.1rem; font-weight:bold; border-color:#06b6d4;">E ▶</button>

            <div></div>
            <button id="btn-slew-s" class="aim-btn" style="font-size:1.1rem; font-weight:bold; border-color:#06b6d4;">▼ S</button>
            <div></div>
          </div>
        </div>

        <!-- Slew Rate Selector 1 to 9 -->
        <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06); margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
            <span style="color:#888;">SLEW RATE:</span>
            <span id="lbl-slew-rate-desc" style="color:#00ff66; font-weight:bold;">RATE 5 // FIND (0.5°/SEC)</span>
          </div>
          <div style="display:flex; gap:4px;">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(r => `
              <button class="aim-btn aim-btn-sm btn-rate ${r === 5 ? 'active' : ''}" data-rate="${r}" style="flex:1; padding:4px 0; font-size:0.75rem; font-weight:bold;">
                ${r}
              </button>
            `).join('')}
          </div>
        </div>

        ${handboxSkin === '497' ? `
          <!-- #497 Numeric & Function Keypad (Keys 0-9 + ENTER, MODE, GOTO, ?, SCROLL) -->
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="1" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">1</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="2" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">2</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="3" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">3</button>

            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="4" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">4</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="5" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">5</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="6" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">6</button>

            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="7" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">7</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="8" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">8</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="9" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">9</button>

            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="MODE" style="font-size:0.7rem; color:#06b6d4;">MODE</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="0" style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; padding:8px;">0</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="ENTER" style="font-size:0.7rem; color:#00ff66;">ENTER</button>

            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="GOTO" style="font-size:0.7rem; color:#a855f7;">GO TO</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="?" style="font-size:0.7rem; color:#f59e0b;">? HELP</button>
            <div style="display:flex; gap:3px;">
              <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SCROLL_UP" style="flex:1; font-size:0.7rem; padding:4px 0;">▲</button>
              <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SCROLL_DOWN" style="flex:1; font-size:0.7rem; padding:4px 0;">▼</button>
            </div>
          </div>
        ` : `
          <!-- #494 14-Button Compact Layout (4 Slew + 6 Func + 4 Speed) -->
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="MODE" style="font-size:0.75rem; color:#06b6d4;">MODE</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="ENTER" style="font-size:0.75rem; color:#00ff66;">ENTER</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="GOTO" style="font-size:0.75rem; color:#a855f7;">GO TO</button>

            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="?" style="font-size:0.75rem; color:#f59e0b;">? HELP</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SCROLL_UP" style="font-size:0.75rem;">▲ SCROLL</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SCROLL_DOWN" style="font-size:0.75rem;">▼ SCROLL</button>

            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SPD_1" style="font-size:0.72rem;">SPD 1</button>
            <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SPD_2" style="font-size:0.72rem;">SPD 4</button>
            <div style="display:flex; gap:3px;">
              <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SPD_3" style="flex:1; font-size:0.68rem; padding:4px 0;">SPD 7</button>
              <button class="aim-btn aim-btn-sm btn-hbx-key" data-key="SPD_4" style="flex:1; font-size:0.68rem; padding:4px 0;">SPD 9</button>
            </div>
          </div>
        `}
      </div>
    `;

    // -------------------------------------------------------------
    // STATION 2: OPTICAL SENSOR & AI IMAGING ENGINEER
    // -------------------------------------------------------------
    const station2 = document.createElement('div');
    station2.className = 'station-panel optical-station';
    station2.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 14px;
    `;

    // Instantiate Optical Feed
    opticalFeedInstance = createOpticalFeed({
      getMountState: () => mountEngine.getTelemetry(),
      onReticlePing: (ping) => {
        // Broadcast reticle ping to Operator 1
        network.sendGameAction({
          type: 'RETICLE_PING',
          ping: ping
        });
        showToast('PING', `Reticle offset broadcasted: ΔX ${ping.deltaX}, ΔY ${ping.deltaY}`);
      },
      onCaptureSnapshot: ({ target, hfr }) => {
        showToast('SNAPSHOT', `Captured ${target.toUpperCase()} (HFR: ${hfr}''). Saved to Downloads!`);
      }
    });

    station2.appendChild(opticalFeedInstance.element);

    // Mount appropriate panels based on role & solo mode
    if (isSoloOverride) {
      missionGrid.appendChild(station1);
      missionGrid.appendChild(station2);
    } else if (localRole === 'HELMSMAN') {
      missionGrid.appendChild(station1);
    } else {
      missionGrid.appendChild(station2);
    }

    dynamicContent.appendChild(missionGrid);

    // -------------------------------------------------------------
    // Embed Sky Dome Radar in Station 1
    // -------------------------------------------------------------
    const radarSlot = station1.querySelector('#radar-canvas-slot');
    const lblSelectedTargetName = station1.querySelector('#lbl-selected-target-name');

    skyRadarInstance = createSkyRadarCanvas({
      getMountState: () => mountEngine.getTelemetry(),
      onSelectTarget: (target) => {
        lblSelectedTargetName.textContent = `${target.name} (${target.catalog || target.constellation})`;
        if (opticalFeedInstance) {
          opticalFeedInstance.setTarget(target.id);
        }
      }
    });
    if (radarSlot) {
      radarSlot.appendChild(skyRadarInstance.element);
    }

    // -------------------------------------------------------------
    // Wire Station 1 Slew & Serial Controls
    // -------------------------------------------------------------
    const btnSlewN = station1.querySelector('#btn-slew-n');
    const btnSlewS = station1.querySelector('#btn-slew-s');
    const btnSlewE = station1.querySelector('#btn-slew-e');
    const btnSlewW = station1.querySelector('#btn-slew-w');
    const btnSlewHalt = station1.querySelector('#btn-slew-halt');
    const lblCurrentCoords = station1.querySelector('#lbl-current-coords');
    const lblSlewRateDesc = station1.querySelector('#lbl-slew-rate-desc');

    const triggerSlew = (dir) => {
      mountEngine.slew(dir);
      network.sendGameAction({ type: 'MOUNT_SLEW', direction: dir, rate: mountEngine.state.slewRate });
    };

    const triggerHalt = () => {
      mountEngine.halt();
      network.sendGameAction({ type: 'MOUNT_HALT' });
    };

    // Mouse & Touch bindings for slewing with runaway prevention
    [
      { btn: btnSlewN, dir: 'N' },
      { btn: btnSlewS, dir: 'S' },
      { btn: btnSlewE, dir: 'E' },
      { btn: btnSlewW, dir: 'W' }
    ].forEach(({ btn, dir }) => {
      if (!btn) return;
      btn.onmousedown = () => triggerSlew(dir);
      btn.onmouseup = () => triggerHalt();
      btn.onmouseleave = () => triggerHalt();
      btn.ontouchstart = (e) => { e.preventDefault(); triggerSlew(dir); };
      btn.ontouchend = (e) => { e.preventDefault(); triggerHalt(); };
      btn.ontouchcancel = (e) => { e.preventDefault(); triggerHalt(); };
    });

    if (btnSlewHalt) {
      btnSlewHalt.onclick = triggerHalt;
    }

    // Slew Rate Buttons
    const rateDescriptions = [
      'RATE 1 // GUIDE (1X SIDEREAL)',
      'RATE 2 // CENTERING (2X)',
      'RATE 3 // CENTERING (8X)',
      'RATE 4 // FIND (16X)',
      'RATE 5 // FIND (0.5°/SEC)',
      'RATE 6 // SLEW (1.0°/SEC)',
      'RATE 7 // SLEW (2.0°/SEC)',
      'RATE 8 // SLEW (3.0°/SEC)',
      'RATE 9 // MAX SLEW (4.0°/SEC)'
    ];

    station1.querySelectorAll('.btn-rate').forEach(b => {
      b.onclick = () => {
        station1.querySelectorAll('.btn-rate').forEach(rb => rb.classList.remove('active'));
        b.classList.add('active');
        const r = parseInt(b.dataset.rate, 10);
        mountEngine.setSlewRate(r);
        lblSlewRateDesc.textContent = rateDescriptions[r - 1];
        const hbxDisplay = station1.querySelector('#lbl-handbox-display-screen');
        if (hbxDisplay) {
          hbxDisplay.textContent = `RATE ${r}: ${rateDescriptions[r - 1].split('//')[1].trim()}`;
        }
      };
    });

    // Wire Virtual Autostar Handbox Keys (0-9, MODE, ENTER, GOTO, ?, SCROLL, SPD)
    const lblHandboxDisplayScreen = station1.querySelector('#lbl-handbox-display-screen');
    station1.querySelectorAll('.btn-hbx-key').forEach(btn => {
      btn.onclick = () => {
        playClick();
        const key = btn.dataset.key;
        if (/^[1-9]$/.test(key)) {
          const rateNum = parseInt(key, 10);
          mountEngine.setSlewRate(rateNum);
          station1.querySelectorAll('.btn-rate').forEach(rb => {
            rb.classList.toggle('active', parseInt(rb.dataset.rate, 10) === rateNum);
          });
          lblSlewRateDesc.textContent = rateDescriptions[rateNum - 1];
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = `RATE ${key}: ${rateDescriptions[rateNum - 1].split('//')[1].trim()}`;
          }
        } else if (key === '0') {
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = 'KEYPAD 0: SOLAR SYSTEM';
          }
        } else if (key === 'MODE') {
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = 'MODE: OBJECT MENU';
          }
        } else if (key === 'ENTER') {
          playSuccess();
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = 'ENTER: TARGET CONFIRMED';
          }
        } else if (key === 'GOTO') {
          if (btnExecGoto) btnExecGoto.click();
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = 'GOTO: SLEWING TO TARGET';
          }
        } else if (key === '?') {
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = 'HELP: USE ARROWS TO SLEW';
          }
        } else if (key === 'SCROLL_UP' || key === 'SCROLL_DOWN') {
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = `SCROLL: ${key === 'SCROLL_UP' ? '▲ PREV ITEM' : '▼ NEXT ITEM'}`;
          }
        } else if (key.startsWith('SPD_')) {
          const speedMap = { SPD_1: 1, SPD_2: 4, SPD_3: 7, SPD_4: 9 };
          const rateNum = speedMap[key] || 5;
          mountEngine.setSlewRate(rateNum);
          station1.querySelectorAll('.btn-rate').forEach(rb => {
            rb.classList.toggle('active', parseInt(rb.dataset.rate, 10) === rateNum);
          });
          lblSlewRateDesc.textContent = rateDescriptions[rateNum - 1];
          if (lblHandboxDisplayScreen) {
            lblHandboxDisplayScreen.textContent = `SPEED: ${rateDescriptions[rateNum - 1]}`;
          }
        }
      };
    });

    // GoTo & Sync Buttons
    const btnExecGoto = station1.querySelector('#btn-exec-goto');
    const btnSyncAlignment = station1.querySelector('#btn-sync-alignment');

    if (btnExecGoto) {
      btnExecGoto.onclick = () => {
        playPump();
        const activeTarget = findCelestialTarget(lblSelectedTargetName.textContent) || SKY_CATALOG[0];
        mountEngine.gotoTarget(activeTarget.raHours, activeTarget.decDeg);
        network.sendGameAction({
          type: 'GOTO_TARGET',
          ra: activeTarget.raHours,
          dec: activeTarget.decDeg,
          targetName: activeTarget.name
        });
        showToast('GOTO', `Slewing mount to: ${activeTarget.name}`);
      };
    }

    if (btnSyncAlignment) {
      btnSyncAlignment.onclick = () => {
        playSuccess();
        mountEngine.syncAlignment();
        network.sendGameAction({ type: 'ALIGN_SYNC' });
        showToast('SYNC', '2-Star Alignment Synced (:CM#)! Coordinates locked.');
      };
    }

    // Helmsman Reticle Drift Correction & Dismiss
    const helmsmanDriftAlert = station1.querySelector('#helmsman-drift-alert');
    const btnQuickCorrectDrift = station1.querySelector('#btn-quick-correct-drift');
    const btnDismissDrift = station1.querySelector('#btn-dismiss-drift');

    if (btnQuickCorrectDrift) {
      btnQuickCorrectDrift.onclick = () => {
        playSuccess();
        const dx = parseFloat(helmsmanDriftAlert.dataset.dx || 0);
        const dy = parseFloat(helmsmanDriftAlert.dataset.dy || 0);

        if (dx > 5) {
          mountEngine.slew('W');
          setTimeout(() => mountEngine.halt(), 300);
        } else if (dx < -5) {
          mountEngine.slew('E');
          setTimeout(() => mountEngine.halt(), 300);
        }

        if (dy > 5) {
          mountEngine.slew('N');
          setTimeout(() => mountEngine.halt(), 300);
        } else if (dy < -5) {
          mountEngine.slew('S');
          setTimeout(() => mountEngine.halt(), 300);
        }

        if (opticalFeedInstance && opticalFeedInstance.clearReticlePing) {
          opticalFeedInstance.clearReticlePing();
        } else if (opticalFeedInstance) {
          opticalFeedInstance.setReticlePing({ x: 190, y: 190, deltaX: 0, deltaY: 0 });
        }

        helmsmanDriftAlert.style.display = 'none';
        showToast('AUTO-NUDGE', `Corrected reticle offset (ΔX ${dx}px, ΔY ${dy}px). Target Centered!`);
      };
    }

    if (btnDismissDrift) {
      btnDismissDrift.onclick = () => {
        playClick();
        if (helmsmanDriftAlert) helmsmanDriftAlert.style.display = 'none';
      };
    }

    // WebSerial Connect / Probe / Inject
    const btnConnectSerial = station1.querySelector('#btn-connect-serial');
    const btnAutodetectHbx = station1.querySelector('#btn-autodetect-hbx');
    const btnInjectPcTime = station1.querySelector('#btn-inject-pc-time');
    const lblSerialPort = station1.querySelector('#lbl-serial-port');
    const serialStatusDot = station1.querySelector('#serial-status-dot');

    if (btnConnectSerial) {
      btnConnectSerial.onclick = async () => {
        playClick();
        await mountEngine.connectSerial();
        lblSerialPort.textContent = `PORT: ${mountEngine.state.portName} (9600 8N1)`;
        serialStatusDot.style.background = mountEngine.state.isConnected ? '#00ff66' : '#ef4444';
        serialStatusDot.style.boxShadow = mountEngine.state.isConnected ? '0 0 8px #00ff66' : '0 0 8px #ef4444';
        showToast('SERIAL', `Mount Link: ${mountEngine.state.portName}`);
      };
    }

    if (btnAutodetectHbx) {
      btnAutodetectHbx.onclick = async () => {
        playClick();
        await mountEngine.autoDetectHandbox();
        showToast('DETECT', `Handbox Identified: ${mountEngine.state.handboxModel}`);
      };
    }

    if (btnInjectPcTime) {
      btnInjectPcTime.onclick = () => {
        playSuccess();
        mountEngine.injectPcTimeAndSite();
        showToast('TIME SYNC', 'Injected PC Time & Observer Coordinates into Autostar (:SL# :SC# :St# :Sg#)');
      };
    }

    // Dual-Skin Switcher
    station1.querySelector('#btn-skin-494').onclick = () => {
      handboxSkin = '494';
      renderMissionControl();
    };
    station1.querySelector('#btn-skin-497').onclick = () => {
      handboxSkin = '497';
      renderMissionControl();
    };

    // Telemetry updates
    mountEngine.on('telemetry', (telem) => {
      if (lblCurrentCoords) {
        lblCurrentCoords.textContent = `RA ${telem.raHours.toFixed(2)}h | DEC ${telem.decDeg >= 0 ? '+' : ''}${telem.decDeg.toFixed(2)}° | ALT ${telem.altDeg.toFixed(1)}°`;
      }
    });
  }

  // -------------------------------------------------------------
  // Tab 2 & 3: Pre-Flight & ASCOM Knowledge Hub
  // -------------------------------------------------------------
  function renderPreFlightTab() {
    dynamicContent.innerHTML = '';
    const hub = createKnowledgeHub({
      mountEngine,
      onSkinSelect: (s) => {
        handboxSkin = s;
        renderMissionControl();
      }
    });
    dynamicContent.appendChild(hub);
  }

  function renderAscomVaultTab() {
    dynamicContent.innerHTML = '';
    const hub = createKnowledgeHub({
      mountEngine,
      onSkinSelect: (s) => {
        handboxSkin = s;
        renderMissionControl();
      }
    });
    // Trigger ASCOM subtab
    const ascomBtn = hub.querySelector('#kh-tab-ascom');
    if (ascomBtn) ascomBtn.click();
    dynamicContent.appendChild(hub);
  }

  // -------------------------------------------------------------
  // Navigation Tab Switching
  // -------------------------------------------------------------
  navTabMission.onclick = () => {
    activeTab = 'MISSION_CONTROL';
    navTabMission.classList.add('active-tab');
    navTabPreflight.classList.remove('active-tab');
    navTabAscom.classList.remove('active-tab');
    navTabMission.style.borderColor = 'var(--accent,#06b6d4)';
    navTabMission.style.color = '#fff';
    navTabPreflight.style.borderColor = '';
    navTabPreflight.style.color = '#aaa';
    navTabAscom.style.borderColor = '';
    navTabAscom.style.color = '#aaa';
    renderMissionControl();
  };

  navTabPreflight.onclick = () => {
    activeTab = 'PREFLIGHT';
    navTabPreflight.classList.add('active-tab');
    navTabMission.classList.remove('active-tab');
    navTabAscom.classList.remove('active-tab');
    navTabPreflight.style.borderColor = 'var(--accent,#06b6d4)';
    navTabPreflight.style.color = '#fff';
    navTabMission.style.borderColor = '';
    navTabMission.style.color = '#aaa';
    navTabAscom.style.borderColor = '';
    navTabAscom.style.color = '#aaa';
    renderPreFlightTab();
  };

  navTabAscom.onclick = () => {
    activeTab = 'ASCOM_VAULT';
    navTabAscom.classList.add('active-tab');
    navTabMission.classList.remove('active-tab');
    navTabPreflight.classList.remove('active-tab');
    navTabAscom.style.borderColor = 'var(--accent,#06b6d4)';
    navTabAscom.style.color = '#fff';
    navTabMission.style.borderColor = '';
    navTabMission.style.color = '#aaa';
    navTabPreflight.style.borderColor = '';
    navTabPreflight.style.color = '#aaa';
    renderAscomVaultTab();
  };

  // Initial Render: Mission Control
  renderMissionControl();

  // Cleanup on unmount
  container.cleanup = () => {
    if (clockInterval) clearInterval(clockInterval);
    if (mountEngine) mountEngine.destroy();
    if (skyRadarInstance) skyRadarInstance.destroy();
    if (opticalFeedInstance) opticalFeedInstance.destroy();
    if (network) network.disconnect();
  };

  return container;
}
