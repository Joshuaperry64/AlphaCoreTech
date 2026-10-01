import MugshotsPage from './mugshots.js';
import { apiUrl } from '../components/api.js';

export default function ReconPage() {
    const container = document.createElement('div');
    container.className = 'page-content slide-up';

    container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">RECON & CUSTODY</h1>
      <p class="page-subtitle">ADVANCED OSINT GATHERING AND ARREST INTEL MATRIX</p>
    </div>
    <div class="aim-row" style="margin-bottom: 24px;">
      <div class="aim-field" style="width: 100%;">
        <label class="aim-label">TARGET IDENTIFIER</label>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <input type="text" id="recon-target" class="aim-input" placeholder="ENTER USERNAME, EMAIL, OR DOMAIN..." style="flex: 1; min-width: 200px;" />
          <button id="recon-btn" class="aim-btn-generate" style="flex: 1; min-width: 200px; max-width: 300px;">
            <span class="aim-btn-icon">👁️</span> INITIATE SCAN
          </button>
        </div>
      </div>
    </div>
    <div class="aim-row" style="gap: 20px; align-items: flex-start; flex-wrap: wrap;">
      <div class="aim-panel" style="flex: 1; min-width: 280px; min-height: 400px; display: flex; flex-direction: column;">
        <div class="aim-panel-header"><span class="aim-panel-icon">📡</span><span class="aim-panel-title">TELEMETRY STREAM</span></div>
        <div id="recon-terminal" style="flex: 1; background: #030712; border: 1px solid rgba(0,184,255,0.2); padding: 15px; font-family: monospace; font-size: 13px; color: #00b8ff; overflow-y: auto; text-shadow: 0 0 5px rgba(0,184,255,0.4); white-space: pre-line;">[SYS] WAITING FOR TARGET...</div>
      </div>
      <div class="aim-panel" style="flex: 1; min-width: 280px; max-width: 100%; display: flex; flex-direction: column; opacity: 0.5;" id="recon-dossier-wrap">
        <div class="aim-panel-header"><span class="aim-panel-icon">📁</span><span class="aim-panel-title">COMPILED DOSSIER</span></div>
        <div id="recon-dossier" style="flex: 1; display: flex; flex-direction: column; padding: 20px; gap: 15px; overflow-y: auto; max-height: 500px;">
          <div id="dossier-placeholder" style="text-align: center; margin: auto;">
              <div style="font-size: 18px; letter-spacing: 2px; color: #fff;">NO DATA</div>
          </div>
        </div>
      </div>
    </div>
  `;

    const btn = container.querySelector('#recon-btn');
    const input = container.querySelector('#recon-target');
    const terminal = container.querySelector('#recon-terminal');
    const dossierWrap = container.querySelector('#recon-dossier-wrap');
    const dossier = container.querySelector('#recon-dossier');
    const pin = sessionStorage.getItem('alphacore_pin');
    const headers = { 'Content-Type': 'application/json', 'x-user-pin': pin };

    function logToTerminal(message, type = 'SYS') {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        const typeColor = type === 'ERROR' ? '#ff003c' : type === 'SUCCESS' ? '#00ff8c' : '#00b8ff';
        const cleanMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        terminal.innerHTML += `\n<span style="color:${typeColor}">[${type}] ${timestamp}</span>: ${cleanMessage}`;
        terminal.scrollTop = terminal.scrollHeight;
    }

    async function handleScan() {
        const target = input.value.trim();
        if (!target) return logToTerminal("Target identifier cannot be empty.", 'ERROR');

        btn.disabled = true;
        input.disabled = true;
        btn.innerHTML = '<span class="aim-btn-icon">⏳</span> SCANNING...';
        terminal.innerHTML = '';
        logToTerminal(`Target acquired: ${target}`);
        logToTerminal("Executing advanced OSINT protocols...");
        dossierWrap.style.opacity = '0.5';
        dossier.innerHTML = `<div id="dossier-placeholder" style="text-align: center; margin: auto;"><div style="font-size: 18px; letter-spacing: 2px; color: #fff;">COMPILING...</div></div>`;

        try {
            const response = await fetch(apiUrl('/api/recon/scan'), { method: 'POST', headers, body: JSON.stringify({ target }) });
            const result = await response.json();

            if (response.ok && result.status === 'SUCCESS') {
                logToTerminal(result.message, 'SUCCESS');
                renderDossier(result.data);
            } else {
                throw new Error(result.message || 'Unknown scan failure.');
            }
        } catch (err) {
            logToTerminal(err.message, 'ERROR');
        } finally {
            btn.disabled = false;
            input.disabled = false;
            btn.innerHTML = '<span class="aim-btn-icon">👁️</span> INITIATE SCAN';
        }
    }

    function renderDossier(data) {
        dossierWrap.style.opacity = '1';
        let html = `<div style="font-size: 20px; font-weight: bold; color: #fff; margin-bottom: 15px; border-bottom: 1px solid rgba(0,184,255,0.2); padding-bottom: 10px;">DOSSIER: ${data.query}</div>`;

        // Social Footprints Section
        if (data.social_footprints) {
            html += `<h4>Social Footprints</h4>`;
            html += data.social_footprints.length > 0 ? data.social_footprints.map(fp => `<div><a href="${fp.url}" target="_blank" rel="noopener noreferrer">${fp.site}</a></div>`).join('') : '<div>None found.</div>';
        }
        
        // Email Domain Validity Section
        if (data.domain_validity) {
            html += `<h4 style="margin-top: 20px;">Email Domain Validity</h4>`;
            html += `<div>MX Records Found: <span style="font-weight:bold; color: ${data.domain_validity.valid_mx_records ? '#00ff8c' : '#ffaa00'};">${data.domain_validity.valid_mx_records}</span></div>`;
        }

        // Data Breaches Section
        if (data.breaches) {
            html += `<h4 style="margin-top: 20px;">Data Breaches (HIBP)</h4>`;
            if (data.breaches.status === 'skipped') {
                html += `<div style="color: #ffaa00;">SKIPPED: HIBP API key not configured.</div>`;
            } else if (data.breaches.status === 'error') {
                html += `<div style="color: #ff003c;">ERROR: ${data.breaches.message}</div>`;
            } else if (data.breaches.status === 'complete') {
                html += `<div>Pwned: <span style="font-weight: bold; color: ${data.breaches.pwned ? '#ff003c' : '#00ff8c'};">${data.breaches.pwned}</span></div>`;
                if (data.breaches.pwned) {
                    html += `<div>Found in: ${data.breaches.breaches.map(b => b.Name).join(', ')}</div>`;
                }
            }
        }

        // WHOIS Section
        if (data.whois) {
            html += `<h4 style="margin-top: 20px;">WHOIS Record</h4>`;
            if(data.whois.error) {
                html += `<div style="color: #ff003c;">${data.whois.error}</div>`;
            } else {
                html += `<div>Registrar: ${data.whois.registrar || 'N/A'}</div>`;
                html += `<div>Created: ${data.whois.creation_date ? new Date(data.whois.creation_date[0] || data.whois.creation_date).toLocaleDateString() : 'N/A'}</div>`;
                html += `<div>Expires: ${data.whois.expiration_date ? new Date(data.whois.expiration_date[0] || data.whois.expiration_date).toLocaleDateString() : 'N/A'}</div>`;
            }
        }
        
        dossier.innerHTML = html.replace(/<h4>/g, '<div style="font-size: 14px; font-weight: bold; color: rgba(255,255,255,0.7); margin-bottom: 8px;">').replace(/<\/h4>/g, '</div>');
    }

    btn.addEventListener('click', handleScan);
    
    // Append Local Custody / Mugshots below
    const mugshots = MugshotsPage();
    // Remove the mugshots header since we have a combined one
    const mugHeader = mugshots.querySelector('.page-header');
    if (mugHeader) mugHeader.remove();
    
    container.appendChild(document.createElement('br'));
    container.appendChild(document.createElement('hr'));
    container.appendChild(document.createElement('br'));
    container.appendChild(mugshots);

    return container;
}