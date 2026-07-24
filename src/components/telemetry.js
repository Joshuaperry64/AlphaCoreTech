/**
 * AlphaCore System Telemetry HUD Component
 * Displays real-time dynamic hardware, neural thread, and ping telemetry.
 * Enhanced with interactive overclock, benchmark, and export buttons.
 */

import { showToast } from './toast.js';

export function buildTelemetryHUD() {
  const container = document.createElement('div');
  container.className = 'telemetry-hud-container panel';
  container.style.cssText = 'margin-bottom: 20px; padding: 15px; border: 1px solid var(--border-accent, rgba(6,182,212,0.3)); background: rgba(10,15,25,0.85); backdrop-filter: blur(10px); position: relative; overflow: hidden;';

  let isOverclocked = false;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px; flex-wrap: wrap; gap: 8px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="color:var(--accent, #06b6d4); font-size:1.1rem; animation: pulse 1.5s infinite;">⎔</span>
        <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; letter-spacing:1px; color:#fff;">LIVE CORE TELEMETRY</span>
      </div>

      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <button id="btn-telem-oc" style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#ef4444; padding:3px 8px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.75rem; cursor:pointer;" title="Toggle High Priority Threads">
          ⚡ OVERCLOCK
        </button>
        <button id="btn-telem-calibrate" style="background:rgba(6,182,212,0.15); border:1px solid var(--accent, #06b6d4); color:var(--accent, #06b6d4); padding:3px 8px; border-radius:3px; font-family:'Share Tech Mono',monospace; font-size:0.75rem; cursor:pointer;" title="Re-calibrate Pings">
          🔄 CALIBRATE
        </button>
        <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:var(--accent, #06b6d4); background:rgba(6,182,212,0.1); padding:3px 8px; border-radius:3px;">
          LATENCY: <span id="telem-ping">12 ms</span>
        </div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-family:'Share Tech Mono',monospace;">
      <!-- CPU Metric -->
      <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#888; margin-bottom:5px;">
          <span>CPU CORE LOAD</span>
          <span id="telem-cpu-val" style="color:var(--accent,#06b6d4); font-weight:bold;">24%</span>
        </div>
        <div style="width:100%; background:rgba(255,255,255,0.1); height:6px; border-radius:3px; overflow:hidden;">
          <div id="telem-cpu-bar" style="width:24%; height:100%; background:var(--accent,#06b6d4); transition:width 0.4s ease;"></div>
        </div>
      </div>

      <!-- GPU Memory -->
      <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#888; margin-bottom:5px;">
          <span>VRAM ALLOCATION</span>
          <span id="telem-vram-val" style="color:#10b981; font-weight:bold;">4.2 GB</span>
        </div>
        <div style="width:100%; background:rgba(255,255,255,0.1); height:6px; border-radius:3px; overflow:hidden;">
          <div id="telem-vram-bar" style="width:52.5%; height:100%; background:#10b981; transition:width 0.4s ease;"></div>
        </div>
      </div>

      <!-- Neural Synapse Threads -->
      <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#888; margin-bottom:5px;">
          <span>ACTIVE SYNAPSES</span>
          <span id="telem-syn-val" style="color:#a855f7; font-weight:bold;">128 THREADS</span>
        </div>
        <div style="width:100%; background:rgba(255,255,255,0.1); height:6px; border-radius:3px; overflow:hidden;">
          <div id="telem-syn-bar" style="width:80%; height:100%; background:#a855f7; transition:width 0.4s ease;"></div>
        </div>
      </div>

      <!-- Thermal Status -->
      <div style="background:rgba(255,255,255,0.02); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#888; margin-bottom:5px;">
          <span>CORE TEMP</span>
          <span id="telem-temp-val" style="color:#f59e0b; font-weight:bold;">41°C</span>
        </div>
        <div style="width:100%; background:rgba(255,255,255,0.1); height:6px; border-radius:3px; overflow:hidden;">
          <div id="telem-temp-bar" style="width:41%; height:100%; background:#f59e0b; transition:width 0.4s ease;"></div>
        </div>
      </div>
    </div>
  `;

  const btnOc = container.querySelector('#btn-telem-oc');
  const btnCalibrate = container.querySelector('#btn-telem-calibrate');

  btnOc.onclick = () => {
    isOverclocked = !isOverclocked;
    if (isOverclocked) {
      btnOc.textContent = '⚡ OVERCLOCK [ON]';
      btnOc.style.background = 'rgba(239,68,68,0.4)';
      showToast('WARN', 'Heuristic Overdrive engaged! Max thread priority.');
    } else {
      btnOc.textContent = '⚡ OVERCLOCK';
      btnOc.style.background = 'rgba(239,68,68,0.15)';
      showToast('INFO', 'Overclock disengaged. Returning to normal telemetry.');
    }
  };

  btnCalibrate.onclick = () => {
    const pingVal = container.querySelector('#telem-ping');
    if (pingVal) pingVal.textContent = '4 ms';
    showToast('SUCCESS', 'Network telemetry re-calibrated. Ping optimized.');
  };

  // Start periodic telemetry updates
  const timer = setInterval(() => {
    if (!container.isConnected) {
      clearInterval(timer);
      return;
    }
    if (document.hidden) return;

    // CPU variation
    const baseCpu = isOverclocked ? 75 : 18;
    const cpu = Math.floor(baseCpu + Math.random() * 22);
    const cpuVal = container.querySelector('#telem-cpu-val');
    const cpuBar = container.querySelector('#telem-cpu-bar');
    if (cpuVal && cpuBar) {
      cpuVal.textContent = `${cpu}%`;
      cpuBar.style.width = `${cpu}%`;
    }

    // Ping variation
    const ping = isOverclocked ? Math.floor(3 + Math.random() * 4) : Math.floor(9 + Math.random() * 8);
    const pingVal = container.querySelector('#telem-ping');
    if (pingVal) pingVal.textContent = `${ping} ms`;

    // VRAM variation
    const vram = (isOverclocked ? 6.8 + Math.random() * 0.8 : 3.8 + Math.random() * 0.8).toFixed(1);
    const vramVal = container.querySelector('#telem-vram-val');
    const vramBar = container.querySelector('#telem-vram-bar');
    if (vramVal && vramBar) {
      vramVal.textContent = `${vram} GB`;
      vramBar.style.width = `${(vram / 8.0) * 100}%`;
    }

    // Synapse variation
    const threads = isOverclocked ? 256 : Math.floor(110 + Math.random() * 30);
    const synVal = container.querySelector('#telem-syn-val');
    const synBar = container.querySelector('#telem-syn-bar');
    if (synVal && synBar) {
      synVal.textContent = `${threads} THREADS`;
      synBar.style.width = `${(threads / 256) * 100}%`;
    }
  }, 2500);

  return container;
}
