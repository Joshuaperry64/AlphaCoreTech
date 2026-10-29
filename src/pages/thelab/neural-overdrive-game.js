/**
 * AlphaCore The Lab — NEURAL OVERDRIVE (2-Player Co-Op Cyber Infiltration)
 * Features:
 * - Strictly 2-Player Asymmetric Distributed Stations (50/50 Equal Tactical Control):
 *     OP-1: INFILTRATOR & CIPHER SPECIALIST (Port Scanning, Exploitation & Algorithmic Cipher Solving)
 *     OP-2: TACTICAL DEFENSE & PAYLOAD (Buffer Overflow Injection, Heap Control, Forensic Trace Purging & Decoys)
 * - Real-time network sync via LabNetworkManager (WebRTC PeerJS / BroadcastChannel)
 * - Interactive Hex Matrix / Subnet Node Canvas visualizer
 * - Rising Sentinel ICE trace timer with alarms, decoy honeypots, and buffer overflow dynamics
 * - Procedural Web Audio SFX from audio-synth.js
 */

import { createElement } from '../../components/utils.js';
import { showToast } from '../../components/toast.js';
import { LabNetworkManager } from './network-manager.js';
import {
  playClick,
  playPump,
  playSteam,
  playAlarm,
  playSuccess,
  playExplosion
} from './audio-synth.js';

export function createNeuralOverdriveGame({ onBack }) {
  const container = createElement('div', { class: 'neural-overdrive-game-view slide-up' });

  // Game Engine State
  let state = {
    tier: 1, // Tier 1 (Gateway), Tier 2 (Neural Hub), Tier 3 (Quantum Core)
    breachProgress: 0, // 0 - 100%
    traceLevel: 10, // 0 - 100% (at 100% Sentinel ICE triggers lockout)
    activePorts: [
      { port: 22, name: 'SSH_TUNNEL', status: 'SCANNED', vuln: 'RSA_WEAK_PRIME', breached: false },
      { port: 8080, name: 'HTTP_PROXY', status: 'CLOSED', vuln: 'BUFFER_OVERFLOW', breached: false },
      { port: 443, name: 'TLS_GATEWAY', status: 'CLOSED', vuln: 'CERT_SPOOF', breached: false },
      { port: 9001, name: 'RPC_DAEMON', status: 'CLOSED', vuln: 'HEAP_CORRUPT', breached: false }
    ],
    cipherSequence: ['0x4F', '0xA2', '0x7C', '0xE8'],
    cipherInput: [],
    sessionToken: null,
    heapBufferUsage: 25, // %
    proxyChainNodes: 4,
    decoysDeployed: 0,
    isIceAlert: false,
    gameOver: false,
    gameWon: false,
    soloMode: true
  };

  let localRole = 'INFILTRATOR'; // 'INFILTRATOR' (Op 1) or 'TACTICAL_DEFENSE' (Op 2)
  let network = null;
  let gameInterval = null;
  let canvasAnimId = null;

  // DOM Skeleton
  container.innerHTML = `
    <!-- Top Mission Header & Telemetry -->
    <div class="panel" style="margin-bottom:14px; padding:12px 18px; background:rgba(6,12,24,0.92); border:1.5px solid #a855f7; border-radius:4px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:2rem;">🧠</span>
          <div>
            <h1 style="font-family:'Orbitron',sans-serif; font-size:1.25rem; color:#fff; letter-spacing:1px; margin:0 0 2px 0;">
              NEURAL OVERDRIVE // SUB-MATRIX INFILTRATION
            </h1>
            <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#a855f7; letter-spacing:1px;">
              2-PLAYER DISTRIBUTED CO-OP // 50/50 ASYMMETRIC TACTICAL STATIONS
            </div>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button id="btn-back-to-modules" class="aim-btn aim-btn-sm" style="font-size:0.75rem;">
            ◀ MODULE SELECTOR
          </button>
          <button id="btn-toggle-solo-no" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66; font-size:0.75rem; font-weight:bold;">
            ⚡ SOLO FULL-COMMAND: ON
          </button>
        </div>
      </div>

      <!-- Co-Op Network & Role Bar -->
      <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div style="display:flex; gap:8px; align-items:center;">
          <button id="btn-host-no" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
            🌐 HOST 2P ROOM
          </button>
          <input type="text" id="ipt-room-no" placeholder="ROOM CODE" class="aim-input" style="width:110px; padding:4px 8px; font-size:0.75rem; background:rgba(0,0,0,0.6); color:#fff; border:1px solid #334155; text-transform:uppercase;">
          <button id="btn-join-no" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
            JOIN
          </button>
          <span id="lbl-room-no" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66; margin-left:6px;">
            SOLO RUN
          </span>
        </div>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#888;">2P OPERATOR STATION:</span>
          <button id="btn-role-infiltrator" class="aim-btn aim-btn-sm btn-no-role active" data-role="INFILTRATOR" style="font-size:0.75rem; padding:4px 10px; border-color:#06b6d4;">
            OP-1: INFILTRATOR (PORTS & CIPHERS)
          </button>
          <button id="btn-role-defense" class="aim-btn aim-btn-sm btn-no-role" data-role="TACTICAL_DEFENSE" style="font-size:0.75rem; padding:4px 10px; border-color:#a855f7;">
            OP-2: TACTICAL DEFENSE (PAYLOAD & ICE)
          </button>
        </div>
      </div>
    </div>

    <!-- Main Game Grid: Shared Hex Matrix + Active Station Controls -->
    <div style="display:grid; grid-template-columns:minmax(320px, 1.2fr) minmax(320px, 1.8fr); gap:16px;">

      <!-- Left Column: Sentinel Trace, Breach Progress & Hex Canvas Visualizer -->
      <div style="display:flex; flex-direction:column; gap:14px;">

        <!-- Gauge Bar 1: Breach Progress -->
        <div class="panel" style="padding:12px 16px; background:rgba(8,16,28,0.85); border:1px solid rgba(6,182,212,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff;">TARGET BREACH PROGRESS</span>
            <span id="lbl-breach-pct" style="font-family:'Share Tech Mono',monospace; font-size:0.9rem; color:#00ff66; font-weight:bold;">0%</span>
          </div>
          <div style="width:100%; height:12px; background:rgba(0,0,0,0.6); border:1px solid #334155; border-radius:3px; overflow:hidden;">
            <div id="bar-breach" style="width:0%; height:100%; background:linear-gradient(90deg, #06b6d4, #00ff66); transition:width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Gauge Bar 2: Sentinel Trace Alert -->
        <div class="panel" style="padding:12px 16px; background:rgba(8,16,28,0.85); border:1px solid rgba(239,68,68,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff;">SENTINEL ICE TRACE LOCK</span>
            <span id="lbl-trace-pct" style="font-family:'Share Tech Mono',monospace; font-size:0.9rem; color:#ef4444; font-weight:bold;">10%</span>
          </div>
          <div style="width:100%; height:12px; background:rgba(0,0,0,0.6); border:1px solid #334155; border-radius:3px; overflow:hidden;">
            <div id="bar-trace" style="width:10%; height:100%; background:linear-gradient(90deg, #f59e0b, #ef4444); transition:width 0.3s ease;"></div>
          </div>
        </div>

        <!-- Subnet Hex Matrix Canvas -->
        <div class="panel" style="position:relative; width:100%; aspect-ratio:4/3; background:#020610; border:1.5px solid rgba(168,85,247,0.4); border-radius:4px; overflow:hidden; padding:0;">
          <canvas id="neural-matrix-canvas" width="480" height="360" style="width:100%; height:100%; display:block;"></canvas>
          <div style="position:absolute; bottom:8px; left:10px; font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:rgba(255,255,255,0.6); pointer-events:none;">
            SUBNET: 192.168.42.0/24 // TIER <span id="lbl-cur-tier">1</span> ONLINE
          </div>
        </div>

      </div>

      <!-- Right Column: Interactive Tactical Stations -->
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div id="no-game-status-banner" style="display:none; padding:12px; border-radius:4px; font-family:'Orbitron',sans-serif; text-align:center;"></div>
        <div id="no-stations-container" style="display:flex; flex-direction:column; gap:14px;"></div>
      </div>

    </div>
  `;

  const stationsContainer = container.querySelector('#no-stations-container');
  const barBreach = container.querySelector('#bar-breach');
  const lblBreachPct = container.querySelector('#lbl-breach-pct');
  const barTrace = container.querySelector('#bar-trace');
  const lblTracePct = container.querySelector('#lbl-trace-pct');
  const lblCurTier = container.querySelector('#lbl-cur-tier');
  const btnToggleSolo = container.querySelector('#btn-toggle-solo-no');
  const btnHost = container.querySelector('#btn-host-no');
  const btnJoin = container.querySelector('#btn-join-no');
  const iptRoom = container.querySelector('#ipt-room-no');
  const lblRoom = container.querySelector('#lbl-room-no');

  // Matrix Canvas
  const canvas = container.querySelector('#neural-matrix-canvas');
  const ctx = canvas.getContext('2d');

  // -------------------------------------------------------------
  // Networking Sync
  // -------------------------------------------------------------
  network = new LabNetworkManager({
    onPlayersUpdate: (players) => {
      lblRoom.textContent = `ROOM: ${network.roomCode} (${players.length}P)`;
    },
    onActionReceived: (packet) => {
      const act = packet.action;
      if (!act) return;

      if (act.type === 'NO_PORT_BREACHED') {
        const p = state.activePorts.find(x => x.port === act.port);
        if (p) p.breached = true;
        state.breachProgress = Math.min(100, state.breachProgress + 20);
        playSuccess();
      } else if (act.type === 'NO_CIPHER_SOLVED') {
        state.sessionToken = act.token;
        state.breachProgress = Math.min(100, state.breachProgress + 20);
        playSuccess();
      } else if (act.type === 'NO_PAYLOAD_INJECTED') {
        state.heapBufferUsage = Math.min(100, state.heapBufferUsage + 25);
        state.breachProgress = Math.min(100, state.breachProgress + (act.progressGain || 20));
        playExplosion();
      } else if (act.type === 'NO_TRACE_PURGED') {
        state.traceLevel = Math.max(0, state.traceLevel - act.amount);
        playSteam();
      } else if (act.type === 'NO_DECOY_DEPLOYED') {
        state.decoysDeployed++;
        state.traceLevel = Math.max(0, state.traceLevel - 15);
        playPump();
      }
      updateHUD();
    }
  });

  btnHost.onclick = () => {
    playClick();
    const code = network.hostRoom();
    lblRoom.textContent = `ROOM: ${code} (HOST)`;
    showToast('HOSTING', `Neural Overdrive Room: ${code}`);
  };

  btnJoin.onclick = () => {
    playClick();
    const code = iptRoom.value.trim().toUpperCase();
    if (!code) return showToast('ERROR', 'Enter room code');
    network.joinRoom(code);
    lblRoom.textContent = `ROOM: ${code} (CLIENT)`;
    showToast('JOINING', `Connecting to Room: ${code}`);
  };

  // Solo mode toggle
  btnToggleSolo.onclick = () => {
    playClick();
    state.soloMode = !state.soloMode;
    if (state.soloMode) {
      btnToggleSolo.textContent = '⚡ SOLO FULL-COMMAND: ON';
      btnToggleSolo.style.borderColor = '#00ff66';
      btnToggleSolo.style.color = '#00ff66';
      showToast('SOLO', 'Solo Command: All 4 Stations Live');
    } else {
      btnToggleSolo.textContent = '⚡ SOLO FULL-COMMAND: OFF';
      btnToggleSolo.style.borderColor = '#888';
      btnToggleSolo.style.color = '#888';
      showToast('CO-OP', 'Station Specialization Active');
    }
    renderStations();
  };

  // Station Role Selectors
  container.querySelectorAll('.btn-no-role').forEach(btn => {
    btn.onclick = () => {
      playClick();
      container.querySelectorAll('.btn-no-role').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      localRole = btn.dataset.role;
      renderStations();
    };
  });

  // -------------------------------------------------------------
  // Render Stations (Breacher, Crypto, Payload, Counter-ICE)
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // Render 2-Player Asymmetric Stations (50/50 Control Distribution)
  // OP-1: INFILTRATOR & CIPHER SPECIALIST (Ports & Ciphers)
  // OP-2: TACTICAL DEFENSE & PAYLOAD (Buffer Overflow & ICE Defense)
  // -------------------------------------------------------------
  function renderStations() {
    stationsContainer.innerHTML = '';

    const showOp1 = state.soloMode || localRole === 'INFILTRATOR';
    const showOp2 = state.soloMode || localRole === 'TACTICAL_DEFENSE';

    // =========================================================
    // OPERATOR 1: INFILTRATION & CIPHER SPECIALIST
    // =========================================================
    if (showOp1) {
      const card = document.createElement('div');
      card.className = 'panel';
      card.style.cssText = 'padding:16px; background:rgba(8,16,28,0.95); border:1.5px solid #06b6d4; border-radius:4px;';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(6,182,212,0.25); padding-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">⚡</span>
            <div>
              <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#06b6d4; font-weight:bold;">
                OPERATOR 1: INFILTRATION & CIPHER SPECIALIST
              </span>
              <div style="font-size:0.68rem; color:#888;">PORTS, PROXY TUNNELS & CRYPTOGRAPHIC SESSION KEYS</div>
            </div>
          </div>
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:${state.sessionToken ? '#00ff66' : '#f59e0b'}; background:rgba(0,0,0,0.5); padding:3px 8px; border-radius:3px; border:1px solid ${state.sessionToken ? '#00ff66' : '#f59e0b'};">
            ${state.sessionToken ? '● TOKEN ARMED: ' + state.sessionToken : '○ CIPHER UNARMED'}
          </span>
        </div>

        <!-- Section 1A: Subnet Port Infiltration -->
        <div style="margin-bottom:14px;">
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#aaa; margin-bottom:8px;">
            // SUBNET INFILTRATION VECTORS:
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${state.activePorts.map((p, idx) => `
              <div style="background:rgba(0,0,0,0.5); padding:8px 10px; border-radius:3px; border:1px solid ${p.breached ? '#00ff66' : 'rgba(255,255,255,0.08)'}; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:${p.breached ? '#00ff66' : '#fff'}; font-weight:bold;">
                    PORT ${p.port} // ${p.name}
                  </div>
                  <div style="font-size:0.68rem; color:#888;">${p.vuln}</div>
                </div>
                <button class="aim-btn aim-btn-sm btn-breach-port" data-index="${idx}" ${p.breached ? 'disabled' : ''} style="font-size:0.68rem; padding:3px 8px; ${p.breached ? 'background:rgba(0,255,100,0.1); border-color:#00ff66; color:#00ff66;' : ''}">
                  ${p.breached ? '✓ INFILTRATED' : 'BREACH'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 1B: Cryptographic Parity Cipher -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#a855f7;">
              // PARITY CIPHER (ARM SESSION TOKEN FOR OP-2):
            </span>
            <span style="font-size:0.7rem; color:#aaa;">INPUT: ${state.cipherInput.join(' ') || 'EMPTY'}</span>
          </div>

          <div style="display:flex; gap:8px; margin-bottom:10px; align-items:center;">
            <span style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace;">TARGET HASH:</span>
            ${state.cipherSequence.map(hex => `
              <span style="background:rgba(168,85,247,0.15); border:1px solid #a855f7; color:#fff; font-family:'Share Tech Mono',monospace; font-size:0.75rem; padding:3px 8px; border-radius:2px;">
                ${hex}
              </span>
            `).join('')}
          </div>

          <div style="display:flex; gap:6px;">
            ${['0x4F', '0x1B', '0xA2', '0x7C', '0xE8', '0x99'].map(val => `
              <button class="aim-btn aim-btn-sm btn-cipher-key" data-val="${val}" style="flex:1; font-family:'Share Tech Mono',monospace; font-size:0.75rem; padding:6px 0;">
                ${val}
              </button>
            `).join('')}
            <button id="btn-cipher-reset" class="aim-btn aim-btn-sm" style="font-size:0.7rem; color:#ef4444; border-color:#ef4444; padding:6px 10px;">RESET</button>
          </div>
        </div>
      `;

      card.querySelectorAll('.btn-breach-port').forEach(btn => {
        btn.onclick = () => {
          playPump();
          const idx = parseInt(btn.dataset.index, 10);
          const p = state.activePorts[idx];
          p.breached = true;
          state.breachProgress = Math.min(100, state.breachProgress + 20);
          network.sendGameAction({ type: 'NO_PORT_BREACHED', port: p.port });
          showToast('BREACH', `Infiltrated Port ${p.port} [${p.name}]!`);
          updateHUD();
          renderStations();
        };
      });

      card.querySelectorAll('.btn-cipher-key').forEach(btn => {
        btn.onclick = () => {
          playClick();
          state.cipherInput.push(btn.dataset.val);
          if (state.cipherInput.length === state.cipherSequence.length) {
            const matches = state.cipherInput.every((v, i) => v === state.cipherSequence[i]);
            if (matches) {
              playSuccess();
              state.sessionToken = '0xSEC_' + Math.floor(1000 + Math.random() * 9000);
              state.breachProgress = Math.min(100, state.breachProgress + 20);
              network.sendGameAction({ type: 'NO_CIPHER_SOLVED', token: state.sessionToken });
              showToast('CRYPTO', `Cipher Solved! Authorized Token: ${state.sessionToken}`);
            } else {
              playAlarm();
              showToast('ERROR', 'Cipher mismatch. Parity check failed.');
              state.cipherInput = [];
            }
            updateHUD();
            renderStations();
          }
        };
      });

      const btnReset = card.querySelector('#btn-cipher-reset');
      if (btnReset) {
        btnReset.onclick = () => {
          playClick();
          state.cipherInput = [];
          showToast('INFO', 'Cipher buffer cleared');
          renderStations();
        };
      }

      stationsContainer.appendChild(card);
    }

    // =========================================================
    // OPERATOR 2: TACTICAL DEFENSE & PAYLOAD SPECIALIST
    // =========================================================
    if (showOp2) {
      const card = document.createElement('div');
      card.className = 'panel';
      card.style.cssText = 'padding:16px; background:rgba(8,16,28,0.95); border:1.5px solid #a855f7; border-radius:4px;';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(168,85,247,0.25); padding-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2rem;">🛡️</span>
            <div>
              <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#a855f7; font-weight:bold;">
                OPERATOR 2: TACTICAL DEFENSE & PAYLOAD SPECIALIST
              </span>
              <div style="font-size:0.68rem; color:#888;">HEAP EXPLOIT INJECTION, LOG SCRUBBING & SENTINEL DECOYS</div>
            </div>
          </div>
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:#00ff66; background:rgba(0,0,0,0.5); padding:3px 8px; border-radius:3px; border:1px solid #334155;">
            HEAP: ${state.heapBufferUsage}% // PROXIES: ${state.proxyChainNodes}
          </span>
        </div>

        <!-- Section 2A: Payload Buffer Overflow Injection -->
        <div style="margin-bottom:14px;">
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66; margin-bottom:6px;">
            // WEAPONIZATION (REQUIRES OP-1 SESSION TOKEN):
          </div>
          <p style="font-size:0.72rem; color:#bbb; line-height:1.4; margin:0 0 8px 0;">
            Consume Operator 1's authorized session token to flood target memory heap and corrupt execution stack:
          </p>
          <div style="display:flex; gap:8px;">
            <button id="btn-inject-payload" class="aim-btn aim-btn-sm" style="flex:1.2; background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66; font-weight:bold; padding:8px;">
              💥 INJECT EXPLOIT BUFFER (+20% BREACH)
            </button>
            <button id="btn-balance-heap" class="aim-btn aim-btn-sm" style="flex:1; padding:8px;">
              ⚖ DEFRAG HEAP MEMORY
            </button>
          </div>
        </div>

        <!-- Section 2B: Counter-ICE Forensic Scrub & Decoys -->
        <div>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#ef4444; margin-bottom:6px;">
            // COUNTER-ICE DEFENSE (KEEP SENTINEL TRACE UNDER 100%):
          </div>
          <p style="font-size:0.72rem; color:#bbb; line-height:1.4; margin:0 0 8px 0;">
            Purge digital forensic traces or deploy honeypot decoys to divert automated ICE hunter-killer watchdogs:
          </p>
          <div style="display:flex; gap:8px;">
            <button id="btn-purge-trace" class="aim-btn aim-btn-sm" style="flex:1; background:rgba(6,182,212,0.15); border-color:#06b6d4; color:#06b6d4; font-weight:bold; padding:8px;">
              🧹 SCRUB FORENSIC LOGS (-20% TRACE)
            </button>
            <button id="btn-deploy-decoy" class="aim-btn aim-btn-sm" style="flex:1; background:rgba(245,158,11,0.15); border-color:#f59e0b; color:#f59e0b; font-weight:bold; padding:8px;">
              🎯 DEPLOY HONEYPOT DECOY
            </button>
          </div>
        </div>
      `;

      card.querySelector('#btn-inject-payload').onclick = () => {
        if (!state.sessionToken && !state.soloMode) {
          playAlarm();
          return showToast('LOCKED', 'Need Operator 1 session token before injecting payload!');
        }
        playExplosion();
        state.heapBufferUsage = Math.min(100, state.heapBufferUsage + 25);
        state.breachProgress = Math.min(100, state.breachProgress + 20);
        network.sendGameAction({ type: 'NO_PAYLOAD_INJECTED', progressGain: 20 });
        showToast('PAYLOAD', 'Exploit Payload Injected! Stack corrupted.');
        updateHUD();
      };

      card.querySelector('#btn-balance-heap').onclick = () => {
        playPump();
        state.heapBufferUsage = Math.max(10, state.heapBufferUsage - 30);
        showToast('HEAP', 'Memory heap garbage collection complete.');
        renderStations();
      };

      card.querySelector('#btn-purge-trace').onclick = () => {
        playSteam();
        state.traceLevel = Math.max(0, state.traceLevel - 20);
        network.sendGameAction({ type: 'NO_TRACE_PURGED', amount: 20 });
        showToast('TRACE SCRUB', 'Cleaned forensic telemetry logs.');
        updateHUD();
      };

      card.querySelector('#btn-deploy-decoy').onclick = () => {
        playPump();
        state.traceLevel = Math.max(0, state.traceLevel - 15);
        state.decoysDeployed++;
        network.sendGameAction({ type: 'NO_DECOY_DEPLOYED' });
        showToast('DECOY', 'Honeypot Decoy deployed! Sentinel diverted.');
        updateHUD();
      };

      stationsContainer.appendChild(card);
    }
  }

  function resetRun() {
    playSuccess();
    state.breachProgress = 0;
    state.traceLevel = 10;
    state.activePorts.forEach(p => { p.breached = false; });
    state.cipherInput = [];
    state.sessionToken = null;
    state.heapBufferUsage = 25;
    state.gameOver = false;
    state.gameWon = false;
    state.isIceAlert = false;
    const banner = container.querySelector('#no-game-status-banner');
    if (banner) banner.style.display = 'none';
    startLoop();
    updateHUD();
    renderStations();
    showToast('REBOOT', 'Infiltration run reset. Good luck, Operator.');
  }

  // -------------------------------------------------------------
  // HUD Update & Victory / Game Over Checks
  // -------------------------------------------------------------
  function updateHUD() {
    barBreach.style.width = `${state.breachProgress}%`;
    lblBreachPct.textContent = `${Math.round(state.breachProgress)}%`;

    barTrace.style.width = `${state.traceLevel}%`;
    lblTracePct.textContent = `${Math.round(state.traceLevel)}%`;

    const banner = container.querySelector('#no-game-status-banner');

    if (state.breachProgress >= 100 && !state.gameWon) {
      state.gameWon = true;
      playSuccess();
      showToast('VICTORY', 'FIREWALL COMPROMISED! Sub-matrix Seized Successfully.');
      clearInterval(gameInterval);
      if (banner) {
        banner.style.display = 'block';
        banner.style.background = 'rgba(0, 255, 100, 0.15)';
        banner.style.border = '1.5px solid #00ff66';
        banner.innerHTML = `
          <div style="color:#00ff66; font-size:1.05rem; font-weight:bold; margin-bottom:6px;">
            🏆 MISSION ACCOMPLISHED // SYSTEM COMPROMISED
          </div>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#eee; margin-bottom:10px;">
            Target sub-matrix database captured with 100% breach integrity!
          </div>
          <button id="btn-reboot-run" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.25); border-color:#00ff66; color:#00ff66; font-weight:bold; padding:6px 16px;">
            ⚡ REBOOT INFILTRATION
          </button>
        `;
        banner.querySelector('#btn-reboot-run').onclick = resetRun;
      }
    }

    if (state.traceLevel >= 100 && !state.gameOver) {
      state.gameOver = true;
      playAlarm();
      showToast('FAILED', 'SENTINEL TRACE 100%! System Lockout Triggered.');
      clearInterval(gameInterval);
      if (banner) {
        banner.style.display = 'block';
        banner.style.background = 'rgba(239, 68, 68, 0.15)';
        banner.style.border = '1.5px solid #ef4444';
        banner.innerHTML = `
          <div style="color:#ef4444; font-size:1.05rem; font-weight:bold; margin-bottom:6px;">
            🚨 SYSTEM LOCKOUT // TRACE 100%
          </div>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#eee; margin-bottom:10px;">
            Sentinel ICE trapped your connection. Emergency reboot required.
          </div>
          <button id="btn-reboot-run" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.25); border-color:#ef4444; color:#ef4444; font-weight:bold; padding:6px 16px;">
            ⚡ REBOOT INFILTRATION
          </button>
        `;
        banner.querySelector('#btn-reboot-run').onclick = resetRun;
      }
    }
  }

  // -------------------------------------------------------------
  // Hex Matrix Canvas Visualizer
  // -------------------------------------------------------------
  function renderMatrixCanvas() {
    if (!ctx) return;
    ctx.fillStyle = '#020610';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Cyber Subnet Nodes
    const nodes = [
      { x: 80, y: 80, name: 'GW-01', active: true },
      { x: 240, y: 60, name: 'CORE-HUB', active: state.breachProgress > 30 },
      { x: 400, y: 120, name: 'VAULT-ICE', active: state.breachProgress > 70 },
      { x: 120, y: 260, name: 'ROUTER-04', active: true },
      { x: 320, y: 280, name: 'TARGET-DB', active: state.breachProgress >= 100 }
    ];

    // Connection lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    ctx.lineTo(nodes[1].x, nodes[1].y);
    ctx.lineTo(nodes[2].x, nodes[2].y);
    ctx.moveTo(nodes[0].x, nodes[0].y);
    ctx.lineTo(nodes[3].x, nodes[3].y);
    ctx.lineTo(nodes[4].x, nodes[4].y);
    ctx.stroke();

    // Node glyphs
    nodes.forEach(n => {
      ctx.fillStyle = n.active ? '#00ff66' : '#a855f7';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '9px "Share Tech Mono", monospace';
      ctx.fillText(n.name, n.x - 18, n.y + 18);
    });

    // Random streaming hex characters
    ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.font = '10px "Share Tech Mono", monospace';
    for (let i = 0; i < 5; i++) {
      const rx = (i * 97 + (Date.now() / 20)) % canvas.width;
      const ry = (i * 61 + (Date.now() / 15)) % canvas.height;
      ctx.fillText(`0x${Math.floor(Math.random() * 256).toString(16).toUpperCase()}`, rx, ry);
    }

    canvasAnimId = requestAnimationFrame(renderMatrixCanvas);
  }

  // -------------------------------------------------------------
  // Game Loop: Sentinel Trace Escalation
  // -------------------------------------------------------------
  function startLoop() {
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(() => {
      if (state.gameOver || state.gameWon) return;
      // Trace slowly creeps up
      state.traceLevel = Math.min(100, state.traceLevel + 1.2);
      if (state.traceLevel > 75 && !state.isIceAlert) {
        state.isIceAlert = true;
        playAlarm();
        showToast('WARNING', 'Sentinel ICE Watchdog actively locking on!');
      }
      updateHUD();
    }, 1000);
  }
  startLoop();

  // Initial render
  renderStations();
  renderMatrixCanvas();
  updateHUD();

  // Navigation Back Button
  container.querySelector('#btn-back-to-modules').onclick = () => {
    playClick();
    if (gameInterval) clearInterval(gameInterval);
    if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
    if (network) network.disconnect();
    onBack();
  };

  // Cleanup on unmount
  container.cleanup = () => {
    if (gameInterval) clearInterval(gameInterval);
    if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
    if (network) network.disconnect();
  };

  return container;
}
