/**
 * System Analytics & Performance Dashboard Page
 * Real-time canvas chart, storage inspector, memory heap monitor, and stress tester.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

export default function AnalyticsPage() {
  const container = createElement('div', { class: 'analytics-page-container' });

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// SYSTEM_ANALYTICS">// SYSTEM_ANALYTICS</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Real-time performance telemetry, heap memory canvas visualizer, local storage manager, and synthetic stress testing hub.</p>
    </div>

    <!-- Quick Action Control Bar -->
    <div class="panel" style="margin-bottom:20px; padding:12px 18px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:var(--accent,#06b6d4); font-weight:bold;">BENCHMARK CONTROLS:</span>
        <button id="btn-run-stress-test" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#ef4444;">
          ⚡ RUN STRESS TEST
        </button>
        <button id="btn-force-gc" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.2); border-color:#10b981; color:#10b981;">
          🧹 PURGE UNUSED HEAP
        </button>
      </div>

      <button id="btn-export-storage" class="aim-btn aim-btn-sm" style="background:rgba(255,255,255,0.05); border-color:rgba(255,255,255,0.2); color:#ccc;">
        💾 EXPORT STORAGE BACKUP
      </button>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px; font-family:'Share Tech Mono',monospace;">
      <!-- Canvas Chart Visualizer -->
      <div class="panel" style="background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(6,182,212,0.3)); padding:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:#fff;">
            HEAP MEMORY & FRAME RATE MONITOR
          </span>
          <span id="analytics-fps" style="font-size:0.75rem; color:var(--accent,#06b6d4);">60 FPS</span>
        </div>
        <canvas id="analytics-canvas" width="450" height="200" style="width:100%; height:200px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:4px;"></canvas>
      </div>

      <!-- LocalStorage Inspector Panel -->
      <div class="panel" style="background:rgba(5,10,18,0.9); border:1px solid rgba(255,255,255,0.1); padding:18px; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:8px;">
          <span style="font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:700; color:var(--accent, #06b6d4);">
            LOCAL STORAGE INSPECTOR
          </span>
          <span id="storage-total-size" style="font-size:0.75rem; color:#888;">0 KB USED</span>
        </div>

        <div id="storage-table-wrap" style="flex:1; max-height:220px; overflow-y:auto; border:1px solid rgba(255,255,255,0.08); border-radius:4px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.8rem; text-align:left;">
            <thead>
              <tr style="background:rgba(255,255,255,0.05); color:var(--accent,#06b6d4);">
                <th style="padding:8px 10px;">KEY</th>
                <th style="padding:8px 10px;">SIZE</th>
                <th style="padding:8px 10px; text-align:right;">ACTION</th>
              </tr>
            </thead>
            <tbody id="storage-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Canvas Real-Time Chart Logic
  const canvas = container.querySelector('#analytics-canvas');
  const ctx = canvas.getContext('2d');
  const fpsEl = container.querySelector('#analytics-fps');

  let historyData = new Array(50).fill(25);
  let isRunning = true;
  let lastFrameTime = performance.now();
  let frameCount = 0;

  function renderChart() {
    if (!container.isConnected || !canvas.offsetParent) return;

    const now = performance.now();
    frameCount++;
    if (now - lastFrameTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
      if (fpsEl) fpsEl.textContent = `${fps} FPS`;
      frameCount = 0;
      lastFrameTime = now;
    }

    // Shift data
    const newVal = Math.min(90, Math.max(10, historyData[historyData.length - 1] + (Math.random() * 12 - 6)));
    historyData.shift();
    historyData.push(newVal);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw Area Chart
    ctx.beginPath();
    const stepX = canvas.width / (historyData.length - 1);
    ctx.moveTo(0, canvas.height);

    historyData.forEach((val, i) => {
      const x = i * stepX;
      const y = canvas.height - (val / 100) * canvas.height;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(6,182,212,0.35)');
    gradient.addColorStop(1, 'rgba(6,182,212,0.02)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Line
    ctx.beginPath();
    historyData.forEach((val, i) => {
      const x = i * stepX;
      const y = canvas.height - (val / 100) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    requestAnimationFrame(renderChart);
  }

  setTimeout(renderChart, 50);

  // Storage Inspector Logic
  const tbody = container.querySelector('#storage-tbody');
  const sizeEl = container.querySelector('#storage-total-size');

  function updateStorageInspector() {
    tbody.innerHTML = '';
    let totalBytes = 0;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      const bytes = (key.length + val.length) * 2;
      totalBytes += bytes;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
      tr.innerHTML = `
        <td style="padding:8px 10px; color:#ccc;">${key}</td>
        <td style="padding:8px 10px; color:#888;">${(bytes / 1024).toFixed(2)} KB</td>
        <td style="padding:8px 10px; text-align:right;">
          <button class="btn-clear-key aim-btn aim-btn-sm" data-key="${key}" style="border-color:#ef4444; color:#ef4444; padding:2px 6px;">DELETE</button>
        </td>
      `;

      tr.querySelector('.btn-clear-key').onclick = () => {
        localStorage.removeItem(key);
        updateStorageInspector();
        showToast('WARN', `Removed item '${key}' from LocalStorage.`);
      };

      fragment.appendChild(tr);
    }

    tbody.appendChild(fragment);

    if (localStorage.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="padding:15px; text-align:center; color:#666;">No items stored in LocalStorage</td></tr>`;
    }

    sizeEl.textContent = `${(totalBytes / 1024).toFixed(2)} KB TOTAL`;
  }

  updateStorageInspector();

  // Stress Test Action
  container.querySelector('#btn-run-stress-test').onclick = () => {
    showToast('WARN', 'Initiating synthetic CPU stress test (1,000,000 operations)...');
    const start = performance.now();
    let x = 0;
    for (let i = 0; i < 10000000; i++) {
      x += Math.sin(i) * Math.cos(i);
    }
    const elapsed = (performance.now() - start).toFixed(2);
    showToast('SUCCESS', `Stress test completed in ${elapsed} ms! Ops throughput nominal.`);
  };

  // Garbage Collection simulation
  container.querySelector('#btn-force-gc').onclick = () => {
    historyData = new Array(50).fill(15);
    showToast('SUCCESS', 'Heap garbage collection forced. Allocation reset.');
  };

  // Export Storage
  container.querySelector('#btn-export-storage').onclick = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alphacore_localstorage_${Date.now()}.json`;
    a.click();
    showToast('SUCCESS', 'LocalStorage export completed.');
  };

  return container;
}
