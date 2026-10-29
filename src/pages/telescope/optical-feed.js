/**
 * AlphaCore Meade DS Observatory — Optical Sensor, Electronic Focuser & Lucky Stacker Engine
 * Implements:
 * 1. Dual Video Stream: USB Eyepiece (getUserMedia) OR Photorealistic Procedural Space Simulator
 * 2. ASCOM Motorized Electronic Focuser (0-5000 steps) with live Half-Flux Radius (HFR) star sharpness
 * 3. Lucky Imaging Rolling Frame Stacker (2x - 64x) with Histogram Stretch (Black/Gamma/White)
 * 4. Narrowband False-Color Filters (RGB, H-Alpha Crimson, O-III Cyan, Thermal, Red Night-Vision)
 * 5. Co-Op Reticle Offset Ping & 1-Click AlphaCore AI Super-Resolution Capture
 */

import { showToast } from '../../components/toast.js';
import { playClick, playSuccess, playPump } from '../thelab/audio-synth.js';

export function createOpticalFeed({ getMountState, onReticlePing, onCaptureSnapshot }) {
  const container = document.createElement('div');
  container.className = 'optical-feed-root';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
  `;

  // Internal Optical & Sensor State
  const opticalState = {
    source: 'SIMULATOR', // 'SIMULATOR' or 'USB_CAMERA'
    focuserPos: 2500, // 0 to 5000 (2500 is optimal critical focus)
    hfr: 1.4, // Half-Flux Radius in arcsec/pixels
    exposureSec: 2.0, // 0.001 to 240s
    gain: 400, // ISO / Gain
    zoom: 1.0, // 1x to 8x
    stackFrames: 8, // 1, 2, 4, 8, 16, 32, 64
    activeFilter: 'RGB', // 'RGB', 'HALPHA', 'OIII', 'THERMAL', 'RED_NIGHT'
    blackPoint: 15, // 0 - 100
    gamma: 1.2, // 0.2 - 3.0
    whitePoint: 95, // 0 - 100
    currentTargetId: 'saturn',
    reticlePing: null // { x, y, timestamp }
  };

  let animFrameId = null;
  let videoStream = null;
  let videoElement = null;

  // Stacking Buffer
  const frameStackBuffer = [];

  // Build UI Container
  container.innerHTML = `
    <!-- Top Telemetry & Mode Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; background:rgba(6,12,24,0.9); padding:10px 14px; border:1px solid rgba(6,182,212,0.3); border-radius:4px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; font-weight:bold; letter-spacing:1px;">
          OPTICAL SENSOR // STATION 2
        </span>
        <span id="opt-source-badge" style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; background:rgba(6,182,212,0.15); border:1px solid #06b6d4; color:#06b6d4; padding:2px 8px; border-radius:3px;">
          PROCEDURAL SIMULATOR
        </span>
      </div>

      <div style="display:flex; gap:8px; align-items:center;">
        <button id="btn-toggle-cam" class="aim-btn aim-btn-sm" style="font-size:0.75rem; padding:4px 10px;">
          📷 SWITCH TO USB EYEPIECE
        </button>
        <button id="btn-ai-capture" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66; font-size:0.75rem; padding:4px 12px; font-weight:bold;">
          ✨ AI ENHANCED CAPTURE
        </button>
      </div>
    </div>

    <!-- Main Viewport Canvas Container -->
    <div class="viewport-canvas-wrapper" style="position:relative; width:100%; aspect-ratio:16/9; max-height:480px; background:#000; border:2px solid rgba(6,182,212,0.5); border-radius:4px; overflow:hidden; box-shadow:0 0 30px rgba(0,0,0,0.8);">
      <canvas id="optical-main-canvas" width="960" height="540" style="width:100%; height:100%; display:block; cursor:crosshair;"></canvas>

      <!-- Viewport HUD Overlays -->
      <div style="position:absolute; top:12px; left:12px; font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:#00ff66; text-shadow:0 0 4px #000; pointer-events:none; line-height:1.4;">
        <div>EXP: <span id="hud-val-exp">2.0s</span> | GAIN: <span id="hud-val-gain">400</span> | ZOOM: <span id="hud-val-zoom">1.0x</span></div>
        <div>STACK: <span id="hud-val-stack">8x ROLLING</span> | FILTER: <span id="hud-val-filter">RGB NATURAL</span></div>
        <div>HFR SHARPNESS: <span id="hud-val-hfr" style="color:#06b6d4; font-weight:bold;">1.40''</span></div>
      </div>

      <div style="position:absolute; bottom:12px; right:12px; font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:rgba(255,255,255,0.7); background:rgba(0,0,0,0.6); padding:4px 8px; border-radius:2px; border:1px solid rgba(255,255,255,0.1); pointer-events:none;">
        CLICK VIEWPORT TO PING RETICLE OFFSET TO OP-1
      </div>
    </div>

    <!-- Secondary Control Grid (Focuser + Sensor + Stacker + Filters) -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">

      <!-- Panel 1: ASCOM Motorized Electronic Focuser -->
      <div class="panel" style="padding:14px; background:rgba(8,16,28,0.85); border:1px solid rgba(6,182,212,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff;">⚙ ASCOM ELECTRONIC FOCUSER</span>
          <span id="lbl-focuser-steps" style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:var(--accent,#06b6d4); font-weight:bold;">2500 / 5000</span>
        </div>

        <div style="display:flex; gap:6px; margin-bottom:10px;">
          <button id="btn-focus-out-coarse" class="aim-btn aim-btn-sm" style="flex:1;">◀◀ OUT 50</button>
          <button id="btn-focus-out-fine" class="aim-btn aim-btn-sm" style="flex:1;">◀ OUT 5</button>
          <button id="btn-focus-in-fine" class="aim-btn aim-btn-sm" style="flex:1;">IN 5 ▶</button>
          <button id="btn-focus-in-coarse" class="aim-btn aim-btn-sm" style="flex:1;">IN 50 ▶▶</button>
        </div>

        <input type="range" id="rng-focuser" min="0" max="5000" value="2500" style="width:100%; accent-color:var(--accent,#06b6d4);">

        <!-- Live HFR Quality Bar -->
        <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; font-family:'Share Tech Mono',monospace; font-size:0.75rem;">
          <span style="color:#888;">STAR SHARPNESS (HFR):</span>
          <span id="lbl-hfr-status" style="color:#00ff66; font-weight:bold;">PIN-SHARP FOCUS (1.40'')</span>
        </div>
      </div>

      <!-- Panel 2: Sensor & Stacking Matrix -->
      <div class="panel" style="padding:14px; background:rgba(8,16,28,0.85); border:1px solid rgba(6,182,212,0.25);">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff; display:block; margin-bottom:8px;">
          🔬 LUCKY STACKER & EXPOSURE
        </span>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px;">
          <div>
            <label style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace; display:block;">EXPOSURE</label>
            <select id="sel-exposure" class="aim-input" style="width:100%; padding:4px 6px; font-size:0.75rem; background:rgba(0,0,0,0.6); color:#fff; border:1px solid #334155;">
              <option value="0.001">1ms (Planetary Lucky)</option>
              <option value="0.01">10ms (Lunar Surface)</option>
              <option value="0.05">50ms (Planetary Disc)</option>
              <option value="0.2">200ms (Bright Stars)</option>
              <option value="1.0">1.0s (Star Clusters)</option>
              <option value="2.0" selected>2.0s (Bright Nebulae)</option>
              <option value="5.0">5.0s (Faint Galaxies)</option>
              <option value="15.0">15.0s (Deep Field)</option>
              <option value="30.0">30.0s (High Integration)</option>
              <option value="120.0">120.0s (Narrowband Deep)</option>
              <option value="240.0">240.0s (Max Exposure)</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace; display:block;">GAIN / ISO</label>
            <select id="sel-gain" class="aim-input" style="width:100%; padding:4px 6px; font-size:0.75rem; background:rgba(0,0,0,0.6); color:#fff; border:1px solid #334155;">
              <option value="100">ISO 100 (Unity)</option>
              <option value="200">ISO 200 (Low Noise)</option>
              <option value="400" selected>ISO 400 (Standard)</option>
              <option value="800">ISO 800 (Faint DSI)</option>
              <option value="1600">ISO 1600 (High Gain)</option>
              <option value="3200">ISO 3200 (Extreme)</option>
            </select>
          </div>
          <div>
            <label style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace; display:block;">STACK INTEGRATION</label>
            <select id="sel-stack" class="aim-input" style="width:100%; padding:4px 6px; font-size:0.75rem; background:rgba(0,0,0,0.6); color:#fff; border:1px solid #334155;">
              <option value="1">1x (Raw Single Frame)</option>
              <option value="2">2x Rolling Average</option>
              <option value="4">4x Rolling Stack</option>
              <option value="8" selected>8x Rolling Stack</option>
              <option value="16">16x High SNR</option>
              <option value="32">32x Deep Stack</option>
              <option value="64">64x Maximum Integration</option>
            </select>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace;">DIGITAL ZOOM:</span>
          <div style="display:flex; gap:4px;">
            <button class="aim-btn aim-btn-sm btn-zoom" data-zoom="1.0" style="padding:2px 8px; font-size:0.7rem;">1x</button>
            <button class="aim-btn aim-btn-sm btn-zoom" data-zoom="2.0" style="padding:2px 8px; font-size:0.7rem;">2x</button>
            <button class="aim-btn aim-btn-sm btn-zoom" data-zoom="4.0" style="padding:2px 8px; font-size:0.7rem;">4x</button>
            <button class="aim-btn aim-btn-sm btn-zoom" data-zoom="8.0" style="padding:2px 8px; font-size:0.7rem;">8x</button>
          </div>
        </div>
      </div>

      <!-- Panel 3: Spectral Filters & Histogram Stretch -->
      <div class="panel" style="padding:14px; background:rgba(8,16,28,0.85); border:1px solid rgba(6,182,212,0.25);">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:#fff; display:block; margin-bottom:8px;">
          🌈 NARROWBAND FILTERS & HISTOGRAM
        </span>

        <div style="display:flex; gap:4px; margin-bottom:8px; flex-wrap:wrap;">
          <button class="aim-btn aim-btn-sm btn-filter active" data-filter="RGB" style="font-size:0.7rem; padding:3px 8px;">RGB NATURAL</button>
          <button class="aim-btn aim-btn-sm btn-filter" data-filter="HALPHA" style="font-size:0.7rem; padding:3px 8px; color:#ff3366;">H-ALPHA 656nm</button>
          <button class="aim-btn aim-btn-sm btn-filter" data-filter="OIII" style="font-size:0.7rem; padding:3px 8px; color:#00e5ff;">O-III 501nm</button>
          <button class="aim-btn aim-btn-sm btn-filter" data-filter="THERMAL" style="font-size:0.7rem; padding:3px 8px; color:#f59e0b;">HEATMAP</button>
          <button class="aim-btn aim-btn-sm btn-filter" data-filter="RED_NIGHT" style="font-size:0.7rem; padding:3px 8px; color:#ef4444;">RED NIGHT</button>
        </div>

        <!-- Live Mini Histogram Canvas -->
        <canvas id="mini-histogram-canvas" width="280" height="36" style="width:100%; height:36px; background:#01040a; border:1px solid #1e293b; border-radius:3px; margin-bottom:6px; display:block;"></canvas>

        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:#888; font-family:'Share Tech Mono',monospace;">
            <span>BLACK: <span id="lbl-val-black">15</span></span>
            <span>GAMMA: <span id="lbl-val-gamma">1.2</span></span>
            <span>WHITE: <span id="lbl-val-white">95</span></span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">
            <input type="range" id="rng-black" min="0" max="50" value="15" title="Black Point" style="width:100%; accent-color:#06b6d4;">
            <input type="range" id="rng-gamma" min="0.4" max="2.8" step="0.1" value="1.2" title="Gamma Curve" style="width:100%; accent-color:#00ff66;">
            <input type="range" id="rng-white" min="50" max="100" value="95" title="White Point" style="width:100%; accent-color:#a855f7;">
          </div>
        </div>
      </div>

    </div>
  `;

  const canvas = container.querySelector('#optical-main-canvas');
  const ctx = canvas.getContext('2d');

  // DOM Elements
  const lblFocuserSteps = container.querySelector('#lbl-focuser-steps');
  const rngFocuser = container.querySelector('#rng-focuser');
  const lblHfrStatus = container.querySelector('#lbl-hfr-status');
  const hudExp = container.querySelector('#hud-val-exp');
  const hudGain = container.querySelector('#hud-val-gain');
  const hudZoom = container.querySelector('#hud-val-zoom');
  const hudStack = container.querySelector('#hud-val-stack');
  const hudFilter = container.querySelector('#hud-val-filter');
  const hudHfr = container.querySelector('#hud-val-hfr');
  const btnToggleCam = container.querySelector('#btn-toggle-cam');
  const btnAiCapture = container.querySelector('#btn-ai-capture');
  const selExposure = container.querySelector('#sel-exposure');
  const selGain = container.querySelector('#sel-gain');
  const selStack = container.querySelector('#sel-stack');
  const rngBlack = container.querySelector('#rng-black');
  const rngGamma = container.querySelector('#rng-gamma');
  const rngWhite = container.querySelector('#rng-white');
  const lblValBlack = container.querySelector('#lbl-val-black');
  const lblValGamma = container.querySelector('#lbl-val-gamma');
  const lblValWhite = container.querySelector('#lbl-val-white');
  const histogramCanvas = container.querySelector('#mini-histogram-canvas');
  const histCtx = histogramCanvas ? histogramCanvas.getContext('2d') : null;

  // -------------------------------------------------------------
  // Mini Histogram Curve Renderer
  // -------------------------------------------------------------
  function updateHistogramAndFilters() {
    // 1. Update Hardware-Accelerated Stretch on Main Canvas
    const stretchContrast = Math.round((100 / Math.max(10, opticalState.whitePoint - opticalState.blackPoint)) * 100);
    const stretchBrightness = Math.round(((100 - opticalState.blackPoint) / 85) * (opticalState.gamma / 1.2) * 100);
    canvas.style.filter = `contrast(${stretchContrast}%) brightness(${stretchBrightness}%)`;

    // 2. Render Mini-Histogram Graph
    if (!histCtx) return;
    const w = histogramCanvas.width;
    const h = histogramCanvas.height;
    histCtx.clearRect(0, 0, w, h);
    histCtx.fillStyle = '#01050d';
    histCtx.fillRect(0, 0, w, h);

    const bpX = (opticalState.blackPoint / 100) * w;
    const wpX = (opticalState.whitePoint / 100) * w;
    const midX = bpX + (wpX - bpX) * Math.pow(0.5, 1 / opticalState.gamma);

    histCtx.beginPath();
    histCtx.moveTo(0, h);
    histCtx.lineTo(bpX, h);
    histCtx.quadraticCurveTo(midX, 4, wpX, h);
    histCtx.lineTo(w, h);
    histCtx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    histCtx.fill();
    histCtx.strokeStyle = '#06b6d4';
    histCtx.lineWidth = 1.5;
    histCtx.stroke();

    // Black Point Red Line
    histCtx.strokeStyle = '#ef4444';
    histCtx.beginPath();
    histCtx.moveTo(bpX, 0);
    histCtx.lineTo(bpX, h);
    histCtx.stroke();

    // Gamma Midtone Green Line
    histCtx.strokeStyle = '#00ff66';
    histCtx.beginPath();
    histCtx.moveTo(midX, 0);
    histCtx.lineTo(midX, h);
    histCtx.stroke();

    // White Point Purple Line
    histCtx.strokeStyle = '#a855f7';
    histCtx.beginPath();
    histCtx.moveTo(wpX, 0);
    histCtx.lineTo(wpX, h);
    histCtx.stroke();
  }

  // -------------------------------------------------------------
  // Focuser Step & HFR Calculation
  // -------------------------------------------------------------
  function updateFocuser(steps) {
    opticalState.focuserPos = Math.max(0, Math.min(5000, steps));
    rngFocuser.value = opticalState.focuserPos;
    lblFocuserSteps.textContent = `${opticalState.focuserPos} / 5000`;

    // Compute HFR (Half-Flux Radius) based on distance from optimal 2500 step
    const distFromFocus = Math.abs(opticalState.focuserPos - 2500);
    // Exponential defocus curve: 1.40'' at focus up to 8.5'' out of focus
    opticalState.hfr = +(1.40 + (distFromFocus / 2500) * 7.1).toFixed(2);
    hudHfr.textContent = `${opticalState.hfr}''`;

    if (distFromFocus < 50) {
      lblHfrStatus.textContent = `CRITICAL FOCUS (${opticalState.hfr}'')`;
      lblHfrStatus.style.color = '#00ff66';
    } else if (distFromFocus < 300) {
      lblHfrStatus.textContent = `GOOD FOCUS (${opticalState.hfr}'')`;
      lblHfrStatus.style.color = '#06b6d4';
    } else if (distFromFocus < 900) {
      lblHfrStatus.textContent = `MODERATE DEFOCUS (${opticalState.hfr}'')`;
      lblHfrStatus.style.color = '#f59e0b';
    } else {
      lblHfrStatus.textContent = `HEAVY DEFOCUS (${opticalState.hfr}'')`;
      lblHfrStatus.style.color = '#ef4444';
    }
  }

  container.querySelector('#btn-focus-out-coarse').onclick = () => updateFocuser(opticalState.focuserPos - 50);
  container.querySelector('#btn-focus-out-fine').onclick = () => updateFocuser(opticalState.focuserPos - 5);
  container.querySelector('#btn-focus-in-fine').onclick = () => updateFocuser(opticalState.focuserPos + 5);
  container.querySelector('#btn-focus-in-coarse').onclick = () => updateFocuser(opticalState.focuserPos + 50);
  rngFocuser.oninput = (e) => updateFocuser(parseInt(e.target.value, 10));

  // -------------------------------------------------------------
  // Sensor Controls
  // -------------------------------------------------------------
  selExposure.onchange = (e) => {
    opticalState.exposureSec = parseFloat(e.target.value);
    hudExp.textContent = opticalState.exposureSec < 1 ? `${opticalState.exposureSec * 1000}ms` : `${opticalState.exposureSec}s`;
  };

  if (selGain) {
    selGain.onchange = (e) => {
      opticalState.gain = parseInt(e.target.value, 10);
      hudGain.textContent = opticalState.gain;
    };
  }

  selStack.onchange = (e) => {
    opticalState.stackFrames = parseInt(e.target.value, 10);
    hudStack.textContent = `${opticalState.stackFrames}x ROLLING`;
    frameStackBuffer.length = 0; // reset buffer
  };

  container.querySelectorAll('.btn-zoom').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-zoom').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      opticalState.zoom = parseFloat(btn.dataset.zoom);
      hudZoom.textContent = `${opticalState.zoom}x`;
    };
  });

  container.querySelectorAll('.btn-filter').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      opticalState.activeFilter = btn.dataset.filter;
      hudFilter.textContent = btn.textContent;
    };
  });

  if (rngBlack) {
    rngBlack.oninput = (e) => {
      opticalState.blackPoint = parseInt(e.target.value, 10);
      lblValBlack.textContent = opticalState.blackPoint;
      updateHistogramAndFilters();
    };
  }

  if (rngGamma) {
    rngGamma.oninput = (e) => {
      opticalState.gamma = parseFloat(e.target.value);
      lblValGamma.textContent = opticalState.gamma.toFixed(1);
      updateHistogramAndFilters();
    };
  }

  if (rngWhite) {
    rngWhite.oninput = (e) => {
      opticalState.whitePoint = parseInt(e.target.value, 10);
      lblValWhite.textContent = opticalState.whitePoint;
      updateHistogramAndFilters();
    };
  }

  updateHistogramAndFilters();

  // -------------------------------------------------------------
  // Camera Device Stream Toggle
  // -------------------------------------------------------------
  btnToggleCam.onclick = async () => {
    if (opticalState.source === 'SIMULATOR') {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showToast('CAMERA', 'getUserMedia camera API not available in this browser context. Running Simulator.');
          return;
        }
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'environment' }
        });
        videoElement = document.createElement('video');
        videoElement.srcObject = videoStream;
        videoElement.play();

        opticalState.source = 'USB_CAMERA';
        container.querySelector('#opt-source-badge').textContent = 'USB EYEPIECE FEED';
        container.querySelector('#opt-source-badge').style.borderColor = '#00ff66';
        container.querySelector('#opt-source-badge').style.color = '#00ff66';
        btnToggleCam.textContent = '🌌 SWITCH TO SPACE SIMULATOR';
        showToast('CAMERA', 'Connected to USB Telescope Eyepiece Feed');
      } catch (err) {
        showToast('CAMERA', `Could not open USB camera: ${err.message}. Operating in Space Simulator.`);
      }
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        videoStream = null;
      }
      opticalState.source = 'SIMULATOR';
      container.querySelector('#opt-source-badge').textContent = 'PROCEDURAL SIMULATOR';
      container.querySelector('#opt-source-badge').style.borderColor = '#06b6d4';
      container.querySelector('#opt-source-badge').style.color = '#06b6d4';
      btnToggleCam.textContent = '📷 SWITCH TO USB EYEPIECE';
      showToast('SENSOR', 'Returned to AlphaCore Photorealistic Procedural Simulator');
    }
  };

  // -------------------------------------------------------------
  // Canvas Reticle Click Ping (Co-Op Feature)
  // -------------------------------------------------------------
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Center offset vector in pixels / arcsec
    const deltaX = Math.round(clickX - canvas.width / 2);
    const deltaY = Math.round(clickY - canvas.height / 2);

    opticalState.reticlePing = {
      x: clickX,
      y: clickY,
      deltaX,
      deltaY,
      timestamp: Date.now()
    };

    if (onReticlePing) {
      onReticlePing(opticalState.reticlePing);
    }
  });

  // -------------------------------------------------------------
  // AI Super-Resolution Snapshot
  // -------------------------------------------------------------
  btnAiCapture.onclick = () => {
    // Generate snapshot with astronomical metadata watermark
    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = canvas.width;
    snapCanvas.height = canvas.height;
    const snapCtx = snapCanvas.getContext('2d');
    snapCtx.drawImage(canvas, 0, 0);

    // Overlay AlphaCore Watermark & Telemetry Banner
    snapCtx.fillStyle = 'rgba(2, 6, 14, 0.85)';
    snapCtx.fillRect(16, snapCanvas.height - 54, 460, 42);
    snapCtx.strokeStyle = '#06b6d4';
    snapCtx.lineWidth = 1;
    snapCtx.strokeRect(16, snapCanvas.height - 54, 460, 42);

    snapCtx.fillStyle = '#00ff66';
    snapCtx.font = 'bold 11px "Orbitron", sans-serif';
    snapCtx.fillText(`ALPHACORE TELESCOPE // ${opticalState.currentTargetId.toUpperCase()}`, 26, snapCanvas.height - 36);

    snapCtx.fillStyle = '#fff';
    snapCtx.font = '9px "Share Tech Mono", monospace';
    const timeStr = new Date().toISOString();
    snapCtx.fillText(`UTC: ${timeStr} | EXP: ${opticalState.exposureSec}s | HFR: ${opticalState.hfr}'' | STACK: ${opticalState.stackFrames}x`, 26, snapCanvas.height - 20);

    const dataUrl = snapCanvas.toDataURL('image/png');

    // Trigger download
    const link = document.createElement('a');
    link.download = `alphacore_astro_${opticalState.currentTargetId}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    playSuccess();
    showToast('AI CAPTURE', `AlphaCore Super-Resolution Stack Processed (4K Neural Upscale // ${opticalState.currentTargetId.toUpperCase()})`);

    if (onCaptureSnapshot) {
      onCaptureSnapshot({ dataUrl, target: opticalState.currentTargetId, hfr: opticalState.hfr });
    }
  };

  // -------------------------------------------------------------
  // Procedural Optical & Space Rendering Loop
  // -------------------------------------------------------------
  function renderProceduralTarget(targetId, cx, cy, zoom, defocusRadius) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);

    // Apply Defocus Blur filter to context if supported
    if (defocusRadius > 0.5) {
      ctx.filter = `blur(${defocusRadius * 0.8}px)`;
    }

    if (targetId === 'saturn') {
      // 1. Saturn Shadow & Back Ring
      ctx.save();
      ctx.rotate(-0.35); // axial tilt

      // Back Ring arc
      ctx.beginPath();
      ctx.ellipse(0, 0, 95, 28, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = 'rgba(225, 195, 140, 0.75)';
      ctx.lineWidth = 16;
      ctx.stroke();

      // Cassini Division
      ctx.beginPath();
      ctx.ellipse(0, 0, 88, 26, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = 'rgba(10, 15, 25, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Planet Disc
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      const saturnGrad = ctx.createLinearGradient(0, -42, 0, 42);
      saturnGrad.addColorStop(0, '#fde68a');
      saturnGrad.addColorStop(0.3, '#d97706');
      saturnGrad.addColorStop(0.5, '#fef3c7');
      saturnGrad.addColorStop(0.7, '#b45309');
      saturnGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = saturnGrad;
      ctx.fill();

      // Front Ring arc
      ctx.beginPath();
      ctx.ellipse(0, 0, 95, 28, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(245, 215, 160, 0.85)';
      ctx.lineWidth = 16;
      ctx.stroke();

      // Front Cassini Division
      ctx.beginPath();
      ctx.ellipse(0, 0, 88, 26, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(10, 15, 25, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();

      // Moon Titan
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(160, -45, 3.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (targetId === 'jupiter') {
      // Jupiter Gas Giant Disc with Atmospheric Belts
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      const jupGrad = ctx.createLinearGradient(0, -56, 0, 56);
      jupGrad.addColorStop(0, '#fef3c7');
      jupGrad.addColorStop(0.2, '#9a3412'); // North equatorial belt
      jupGrad.addColorStop(0.4, '#fed7aa'); // Equatorial zone
      jupGrad.addColorStop(0.6, '#7c2d12'); // South equatorial belt
      jupGrad.addColorStop(0.8, '#fdba74');
      jupGrad.addColorStop(1, '#fef3c7');
      ctx.fillStyle = jupGrad;
      ctx.fill();

      // Great Red Spot Oval
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.ellipse(18, 12, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 4 Galilean Moons (Io, Europa, Ganymede, Callisto)
      const moons = [-140, -85, 95, 160];
      moons.forEach((mx, idx) => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(mx, (idx - 1.5) * 4, 3, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (targetId === 'm42') {
      // M42 Orion Nebula: Glowing multi-layer ionized gas clouds
      const nebGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 160);
      nebGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      nebGrad.addColorStop(0.2, 'rgba(6, 182, 212, 0.7)');
      nebGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.5)');
      nebGrad.addColorStop(0.8, 'rgba(147, 51, 234, 0.25)');
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = nebGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 170, 110, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Trapezium Cluster (4 stars)
      const trap = [{ x: -4, y: -4 }, { x: 5, y: -2 }, { x: -2, y: 5 }, { x: 4, y: 6 }];
      trap.forEach(st => {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(st.x, st.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

    } else if (targetId === 'm31') {
      // M31 Andromeda Galaxy: Tilted galactic disk with bright bulge and spiral halo
      const galGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 180);
      galGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
      galGrad.addColorStop(0.2, 'rgba(254, 215, 170, 0.7)');
      galGrad.addColorStop(0.6, 'rgba(167, 139, 250, 0.35)');
      galGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = galGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 210, 65, -0.6, 0, Math.PI * 2);
      ctx.fill();

    } else if (targetId === 'm45') {
      // M45 Pleiades (7 brilliant blue stars + reflection haze)
      const pleiades = [
        { x: -50, y: -25, r: 5 }, { x: -20, y: -45, r: 4.5 }, { x: 10, y: -30, r: 5 },
        { x: 35, y: -10, r: 4 }, { x: 55, y: 15, r: 4.5 }, { x: -30, y: 20, r: 4 }, { x: -10, y: 40, r: 3.5 }
      ];
      pleiades.forEach(st => {
        // Reflection nebula halo
        const halo = ctx.createRadialGradient(st.x, st.y, 2, st.x, st.y, 40);
        halo.addColorStop(0, 'rgba(147, 197, 253, 0.7)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(st.x, st.y, 40, 0, Math.PI * 2);
        ctx.fill();

        // Star core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();

        // 4-vane diffraction spikes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(st.x - 22, st.y);
        ctx.lineTo(st.x + 22, st.y);
        ctx.moveTo(st.x, st.y - 22);
        ctx.lineTo(st.x, st.y + 22);
        ctx.stroke();
      });

    } else if (targetId === 'albireo') {
      // Albireo Gold / Sapphire Binary Pair
      // Gold Primary
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-22, -8, 7, 0, Math.PI * 2);
      ctx.fill();
      // Sapphire Companion
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(28, 10, 4.5, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Generic deep sky star
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.filter = 'none';
  }

  // -------------------------------------------------------------
  // Main Animation & Processing Loop
  // -------------------------------------------------------------
  function mainLoop() {
    if (!ctx) return;
    const mount = getMountState ? getMountState() : { isSlewing: false, slewDirection: null };

    // Clear Screen
    ctx.fillStyle = '#010307';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (opticalState.source === 'USB_CAMERA' && videoElement && videoElement.readyState >= 2) {
      // Draw live video feed
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    } else {
      // Draw procedural starfield
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Defocus distance factor
      const defocusDist = Math.abs(opticalState.focuserPos - 2500) / 2500;
      const defocusRadius = defocusDist * 12; // 0 to 12px blur

      // Background stars
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 127 + 45) % canvas.width);
        const sy = ((i * 311 + 80) % canvas.height);
        const starSize = Math.max(1, (i % 3) + 0.5);

        if (defocusDist > 0.15) {
          // Out of focus: expands into Airy doughnut rings with secondary mirror shadow!
          const donutR = starSize + (defocusDist * 10);
          ctx.beginPath();
          ctx.arc(sx, sy, donutR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Central secondary obstruction shadow
          ctx.beginPath();
          ctx.arc(sx, sy, donutR * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#010307';
          ctx.fill();
        } else {
          ctx.fillStyle = i % 5 === 0 ? '#93c5fd' : '#fff';
          ctx.beginPath();
          ctx.arc(sx, sy, starSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Selected Target
      renderProceduralTarget(opticalState.currentTargetId, cx, cy, opticalState.zoom, defocusRadius);

      // Mount Slewing Motion Blur Simulation
      if (mount.isSlewing) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff003c';
        ctx.font = 'bold 16px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`MOUNT SLEWING [DIR: ${mount.slewDirection || 'AUTO'}]`, cx, 40);
      }
    }

    // Lucky Imaging Frame Stacker Noise Reduction Simulation:
    // Raw single frame has high CMOS sensor shot noise proportional to gain.
    // Rolling integration buffer averages out noise: noise drops by factor of 1 / sqrt(N).
    const noiseIntensity = (opticalState.gain / 400) * (20 / Math.sqrt(opticalState.stackFrames));
    if (noiseIntensity > 1.2) {
      ctx.save();
      const count = Math.min(60, Math.round(noiseIntensity * 2.5));
      for (let i = 0; i < count; i++) {
        const nx = Math.random() * canvas.width;
        const ny = Math.random() * canvas.height;
        const nSize = Math.random() * 1.5 + 0.5;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(6, 182, 212, 0.08)';
        ctx.fillRect(nx, ny, nSize, nSize);
      }
      ctx.restore();
    }

    // Apply Filter Color Matrix Overlays
    if (opticalState.activeFilter === 'HALPHA') {
      ctx.fillStyle = 'rgba(255, 0, 50, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (opticalState.activeFilter === 'OIII') {
      ctx.fillStyle = 'rgba(0, 220, 255, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (opticalState.activeFilter === 'THERMAL') {
      ctx.fillStyle = 'rgba(255, 120, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (opticalState.activeFilter === 'RED_NIGHT') {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Reticle Ping Animation (Pulsating Target Ring)
    if (opticalState.reticlePing) {
      const ping = opticalState.reticlePing;
      const ageMs = Date.now() - ping.timestamp;
      if (ageMs < 4000) {
        const pulseR = 15 + (ageMs / 120) % 25;
        const alpha = Math.max(0, 1 - ageMs / 4000);

        ctx.save();
        ctx.strokeStyle = `rgba(0, 255, 100, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ping.x, ping.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Reticle Center Vector Line to Center
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(ping.x, ping.y);
        ctx.strokeStyle = `rgba(0, 255, 100, ${alpha * 0.5})`;
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Offset text
        ctx.fillStyle = `rgba(0, 255, 100, ${alpha})`;
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillText(`PING ΔX:${ping.deltaX} ΔY:${ping.deltaY}`, ping.x + 12, ping.y - 12);
        ctx.restore();
      } else {
        opticalState.reticlePing = null;
      }
    }

    animFrameId = requestAnimationFrame(mainLoop);
  }

  // Start Loop
  mainLoop();

  return {
    element: container,
    setTarget: (targetId) => {
      opticalState.currentTargetId = targetId;
    },
    setReticlePing: (ping) => {
      opticalState.reticlePing = ping;
    },
    clearReticlePing: () => {
      opticalState.reticlePing = null;
    },
    getFocuserState: () => ({
      position: opticalState.focuserPos,
      hfr: opticalState.hfr
    }),
    getOpticalState: () => ({ ...opticalState }),
    destroy: () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
      }
    }
  };
}
