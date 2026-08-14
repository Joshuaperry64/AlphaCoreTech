/**
 * AlphaCore Extended System Event Logs Page Component
 * Real-time filterable security, neural, and administrative event log viewer.
 * Enhanced with export controls, live polling simulation, log clearing, and severity filtering.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { getLogs, logAction, clearLogs } from '../components/logger.js';

export default function LogsPage() {
  const container = createElement('div', { class: 'logs-page-container' });

  let livePollingActive = false;
  let pollingInterval = null;

  function render() {
    container.innerHTML = `
      <div class="section-header">
        <h1 class="glitch" data-text="// SYSTEM_EVENT_LOGS">// SYSTEM_EVENT_LOGS</h1>
        <div class="header-line"></div>
      </div>

      <!-- Action & Control Bar -->
      <div class="panel" style="margin-bottom:20px; padding:15px; background:rgba(10,15,25,0.85); border:1px solid var(--border-accent, rgba(6,182,212,0.3));">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <input type="text" id="log-search" placeholder="Filter logs by keyword or module..." style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:6px 12px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; width:220px;" />
            <select id="log-type-filter" style="background:rgba(0,0,0,0.8); border:1px solid rgba(255,255,255,0.1); color:var(--accent, #06b6d4); padding:6px 10px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem;">
              <option value="ALL">ALL CATEGORIES</option>
              <option value="AUTH">AUTH</option>
              <option value="NEURAL">NEURAL</option>
              <option value="PERF">PERF</option>
              <option value="SEC">SEC</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
            <select id="log-level-filter" style="background:rgba(0,0,0,0.8); border:1px solid rgba(255,255,255,0.1); color:#10b981; padding:6px 10px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem;">
              <option value="ALL">ALL LEVELS</option>
              <option value="INFO">INFO</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <button id="btn-toggle-live" style="background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#10b981; padding:6px 14px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; cursor:pointer;">
              ● LIVE STREAM: OFF
            </button>
            <button id="add-mock-log-btn" style="background:rgba(6,182,212,0.15); border:1px solid var(--accent, #06b6d4); color:var(--accent, #06b6d4); padding:6px 14px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; cursor:pointer;">
              + EMIT EVENT
            </button>
            <button id="export-logs-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); color:#ccc; padding:6px 14px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; cursor:pointer;" title="Export JSON">
              💾 EXPORT
            </button>
            <button id="purge-logs-btn" style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; color:#ef4444; padding:6px 14px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; cursor:pointer;">
              🗑 PURGE
            </button>
          </div>
        </div>
      </div>

      <div class="panel" style="background:rgba(5,10,18,0.9); border:1px solid rgba(255,255,255,0.08); padding:0; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse; font-family:'Share Tech Mono',monospace; font-size:0.85rem; text-align:left;">
          <thead>
            <tr style="background:rgba(255,255,255,0.03); color:var(--accent, #06b6d4); border-bottom:1px solid rgba(255,255,255,0.1);">
              <th style="padding:12px 16px;">EVENT ID</th>
              <th style="padding:12px 16px;">TIMESTAMP</th>
              <th style="padding:12px 16px;">TYPE</th>
              <th style="padding:12px 16px;">LEVEL</th>
              <th style="padding:12px 16px;">SOURCE</th>
              <th style="padding:12px 16px;">MESSAGE</th>
            </tr>
          </thead>
          <tbody id="logs-tbody"></tbody>
        </table>
      </div>
    `;

    const searchInput = container.querySelector('#log-search');
    const typeFilter = container.querySelector('#log-type-filter');
    const levelFilter = container.querySelector('#log-level-filter');
    const tbody = container.querySelector('#logs-tbody');
    const emitBtn = container.querySelector('#add-mock-log-btn');
    const toggleLiveBtn = container.querySelector('#btn-toggle-live');
    const exportBtn = container.querySelector('#export-logs-btn');
    const purgeBtn = container.querySelector('#purge-logs-btn');

    function updateTable() {
      const q = searchInput.value.toLowerCase();
      const cat = typeFilter.value;
      const lvl = levelFilter.value;
      const rawLogs = getLogs();

      const mappedLogs = rawLogs.map((log, index) => {
        return {
          id: `LOG-${rawLogs.length - index}`,
          timestamp: new Date(log.timestamp).toISOString(),
          type: log.action || 'SYSTEM',
          level: (log.action && log.action.includes('ERROR')) ? 'ERROR' : (log.action && log.action.includes('WARN')) ? 'WARN' : 'INFO',
          source: log.profile || 'SYSTEM',
          message: log.details ? JSON.stringify(log.details) : ''
        };
      });

      const filtered = mappedLogs.filter(l => {
        const matchesCat = cat === 'ALL' || l.type === cat;
        const matchesLvl = lvl === 'ALL' || l.level === lvl;
        const matchesQ = l.message.toLowerCase().includes(q) || l.source.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
        return matchesCat && matchesLvl && matchesQ;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center; color:#666;">No system logs matching criteria</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(l => {
        let levelColor = '#10b981';
        if (l.level === 'WARN') levelColor = '#f59e0b';
        if (l.level === 'ERROR') levelColor = '#ef4444';
        if (l.level === 'INFO') levelColor = 'var(--accent, #06b6d4)';

        return `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.15s ease;" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
            <td style="padding:10px 16px; color:#888;">${l.id}</td>
            <td style="padding:10px 16px; color:#aaa;">${l.timestamp.split('T')[1].slice(0,8)}</td>
            <td style="padding:10px 16px;"><span style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:3px; color:#ccc;">${l.type}</span></td>
            <td style="padding:10px 16px; color:${levelColor}; font-weight:bold;">${l.level}</td>
            <td style="padding:10px 16px; color:var(--accent, #06b6d4);">${l.source}</td>
            <td style="padding:10px 16px; color:#eee;">${l.message}</td>
          </tr>
        `;
      }).join('');
    }

    searchInput.addEventListener('input', updateTable);
    typeFilter.addEventListener('change', updateTable);
    levelFilter.addEventListener('change', updateTable);

    function emitLog() {
      logAction('SYSTEM_DIAGNOSTIC', { details: 'Event emitted' });
      updateTable();
    }

    emitBtn.addEventListener('click', () => {
      emitLog();
      showToast('INFO', 'Diagnostic log event generated.');
    });

    toggleLiveBtn.addEventListener('click', () => {
      livePollingActive = !livePollingActive;
      if (livePollingActive) {
        toggleLiveBtn.textContent = '● LIVE STREAM: ON';
        toggleLiveBtn.style.background = 'rgba(16,185,129,0.3)';
        showToast('SUCCESS', 'Live event stream started.');
        pollingInterval = setInterval(() => {
          if (!container.isConnected) {
            clearInterval(pollingInterval);
            return;
          }
          emitLog();
        }, 2500);
      } else {
        toggleLiveBtn.textContent = '● LIVE STREAM: OFF';
        toggleLiveBtn.style.background = 'rgba(16,185,129,0.15)';
        if (pollingInterval) clearInterval(pollingInterval);
        showToast('INFO', 'Live event stream paused.');
      }
    });

    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alphacore_event_logs_${Date.now()}.json`;
      a.click();
      showToast('SUCCESS', 'Logs exported as JSON file.');
    });

    purgeBtn.addEventListener('click', () => {
      if (confirm('Clear all system event logs?')) {
        clearLogs();
        updateTable();
        showToast('WARN', 'All event logs purged.');
      }
    });

    updateTable();
  }

  render();
  return container;
}
