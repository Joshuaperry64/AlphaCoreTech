import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { apiUrl } from '../components/api.js';

export default function AssetManagerPage() {
  const container = createElement('div', { class: 'asset-manager-page slide-up' });

  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  const isArchitect = currentProfile === 'architect' || sessionStorage.getItem('admin_authenticated') === '1';
  const tierName = isArchitect ? 'ARCHITECT PRIORITY' : 'PUBLIC ECONOMY';
  const tierHw = isArchitect ? 'Dedicated Storage Worker' : 'Cost-Optimized Worker (60s Auto-Scale)';
  const tierColor = isArchitect ? '#38bdf8' : '#10b981';
  const tierBg = isArchitect ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)';
  const tierBorder = isArchitect ? '#38bdf8' : '#10b981';

  container.innerHTML = `
    <div class="page-header">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
        <h1 class="page-title" style="margin:0;">MODAL ASSET MANAGER</h1>
        <div style="background:${tierBg}; border:1px solid ${tierBorder}; color:${tierColor}; padding:4px 10px; font-family:var(--font-hud); font-size:0.75rem; border-radius:2px; font-weight:bold;">
          ● ${tierName} // ${tierHw}
        </div>
      </div>
      <p class="page-subtitle">CIVITAI / HUGGINGFACE VOLUME DOWNLOADER // ACTIVE ROUTING: ${tierName}</p>
    </div>
    
    <div style="display: flex; gap: 20px; max-width: 1200px; margin: 0 auto; flex-wrap: wrap;">
      <!-- DOWNLOAD FORM -->
      <div class="aim-section" style="flex: 1; min-width: 400px; padding: 24px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);">
        <h2 style="color: #fff; font-size: 16px; margin-bottom: 20px; letter-spacing: 2px;">DOWNLOAD NEW ASSET</h2>
        
        <div class="aim-row" style="margin-bottom: 16px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label">SOURCE PLATFORM</label>
            <select id="am-source" class="aim-input">
              <option value="civitai">CivitAI</option>
              <option value="huggingface">HuggingFace</option>
              <option value="url">Direct URL</option>
            </select>
          </div>
        </div>

        <div id="am-civitai-fields" class="am-fields-group">
          <div class="aim-row" style="margin-bottom: 16px;">
            <div class="aim-field" style="width: 100%;">
              <label class="aim-label">CIVITAI VERSION ID</label>
              <input type="text" id="am-civitai-id" class="aim-input" placeholder="e.g. 357609" />
            </div>
          </div>
        </div>

        <div id="am-hf-fields" class="am-fields-group" style="display: none;">
          <div class="aim-row" style="margin-bottom: 16px;">
            <div class="aim-field" style="flex: 1;">
              <label class="aim-label">HF REPOSITORY</label>
              <input type="text" id="am-hf-repo" class="aim-input" placeholder="e.g. RunDiffusion/Juggernaut-XL-v9" />
            </div>
            <div class="aim-field" style="flex: 1;">
              <label class="aim-label">FILENAME</label>
              <input type="text" id="am-hf-file" class="aim-input" placeholder="e.g. model.safetensors" />
            </div>
          </div>
        </div>

        <div id="am-url-fields" class="am-fields-group" style="display: none;">
          <div class="aim-row" style="margin-bottom: 16px;">
            <div class="aim-field" style="width: 100%;">
              <label class="aim-label">DIRECT URL</label>
              <input type="text" id="am-url" class="aim-input" placeholder="https://..." />
            </div>
          </div>
        </div>
        
        <div class="aim-row" style="margin-bottom: 16px;">
          <div class="aim-field" style="flex: 1;">
            <label class="aim-label">DESTINATION SUBFOLDER</label>
            <select id="am-subfolder" class="aim-input">
              <option value="checkpoints">checkpoints</option>
              <option value="loras">loras</option>
              <option value="embeddings">embeddings</option>
              <option value="controlnet">controlnet</option>
            </select>
          </div>
          <div class="aim-field" style="flex: 1;">
            <label class="aim-label">OVERRIDE FILENAME (OPTIONAL)</label>
            <input type="text" id="am-override" class="aim-input" placeholder="custom_name.safetensors" />
          </div>
        </div>

        <button id="am-download-btn" class="aim-btn-generate" style="width: 100%; margin-top: 10px;">
          <span class="aim-btn-icon">⬇️</span> INITIATE DOWNLOAD
        </button>
        <div id="am-status" style="text-align: center; color: #4ade80; margin-top: 15px; font-size: 12px; display: none;">DOWNLOADING... PLEASE WAIT.</div>
      </div>

      <!-- BROWSER -->
      <div class="aim-section" style="flex: 1; min-width: 400px; padding: 24px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #fff; font-size: 16px; letter-spacing: 2px;">VOLUME BROWSER</h2>
          <button id="am-refresh-btn" class="aim-btn" style="padding: 5px 10px; font-size: 12px;">🔄 REFRESH</button>
        </div>
        
        <div class="aim-row" style="margin-bottom: 16px;">
          <div class="aim-field" style="width: 100%;">
            <select id="am-view-subfolder" class="aim-input">
              <option value="checkpoints">/hf-hub-cache/checkpoints/</option>
              <option value="loras">/hf-hub-cache/loras/</option>
              <option value="embeddings">/hf-hub-cache/embeddings/</option>
              <option value="controlnet">/hf-hub-cache/controlnet/</option>
            </select>
          </div>
        </div>
        
        <div id="am-file-list" style="max-height: 400px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); padding: 10px; background: rgba(0,0,0,0.2);">
          <div style="color: #64748b; font-size: 12px; text-align: center; padding: 20px;">CLICK REFRESH TO LOAD FILES</div>
        </div>
      </div>
    </div>
  `;

  // UI Logic
  const sourceSel = container.querySelector('#am-source');
  const civitaiGrp = container.querySelector('#am-civitai-fields');
  const hfGrp = container.querySelector('#am-hf-fields');
  const urlGrp = container.querySelector('#am-url-fields');
  
  sourceSel.addEventListener('change', () => {
    civitaiGrp.style.display = sourceSel.value === 'civitai' ? 'block' : 'none';
    hfGrp.style.display = sourceSel.value === 'huggingface' ? 'block' : 'none';
    urlGrp.style.display = sourceSel.value === 'url' ? 'block' : 'none';
  });

  const getEndpoint = () => {
    const defaultUrl = isArchitect
      ? 'https://josh627764--alphacore-aio-backend-alphacore-main-api.modal.run'
      : 'https://josh627764--alphacore-aio-backend-alphacore-main-api-eco.modal.run';
    const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
    return isArchitect ? (settings.music_url || defaultUrl) : defaultUrl;
  };

  // Download Logic
  const dlBtn = container.querySelector('#am-download-btn');
  const statusEl = container.querySelector('#am-status');

  dlBtn.addEventListener('click', async () => {
    const source = sourceSel.value;
    const params = {
      subfolder: container.querySelector('#am-subfolder').value,
      output_filename: container.querySelector('#am-override').value.trim()
    };
    
    if (source === 'civitai') params.civitai_version_id = container.querySelector('#am-civitai-id').value.trim();
    if (source === 'huggingface') {
      params.hf_repo = container.querySelector('#am-hf-repo').value.trim();
      params.hf_filename = container.querySelector('#am-hf-file').value.trim();
    }
    if (source === 'url') params.direct_url = container.querySelector('#am-url').value.trim();

    dlBtn.disabled = true;
    statusEl.style.display = 'block';
    statusEl.style.color = '#eab308';
    statusEl.textContent = 'DOWNLOADING TO MODAL VOLUME (THIS MAY TAKE A WHILE)...';

    try {
      const res = await fetch(`${getEndpoint()}/api/assets/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, params })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Download failed');
      
      statusEl.style.color = '#4ade80';
      statusEl.textContent = `SUCCESS: SAVED ${data.filename}`;
      showToast('ASSET DOWNLOADED SUCCESSFULLY', 'success');
      loadFiles(); // refresh list
    } catch (err) {
      console.error(err);
      statusEl.style.color = '#ef4444';
      statusEl.textContent = `ERROR: ${err.message}`;
      showToast('DOWNLOAD FAILED', 'error');
    } finally {
      dlBtn.disabled = false;
    }
  });

  // Browser Logic
  const refreshBtn = container.querySelector('#am-refresh-btn');
  const viewFolderSel = container.querySelector('#am-view-subfolder');
  const fileListEl = container.querySelector('#am-file-list');

  const loadFiles = async () => {
    fileListEl.innerHTML = '<div style="color: #eab308; font-size: 12px; text-align: center; padding: 20px;">FETCHING...</div>';
    try {
      const res = await fetch(`${getEndpoint()}/api/assets/list?subfolder=${viewFolderSel.value}`);
      if (!res.ok) throw new Error('Failed to list files');
      const data = await res.json();
      
      if (!data.files || data.files.length === 0) {
        fileListEl.innerHTML = '<div style="color: #64748b; font-size: 12px; text-align: center; padding: 20px;">VOLUME DIRECTORY EMPTY</div>';
        return;
      }

      fileListEl.innerHTML = data.files.map(f => `
        <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;">
          <span style="color: #cbd5e1; word-break: break-all;">${f.name}</span>
          <span style="color: #64748b; margin-left: 10px; white-space: nowrap;">${f.size_mb} MB</span>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
      fileListEl.innerHTML = '<div style="color: #ef4444; font-size: 12px; text-align: center; padding: 20px;">FAILED TO LOAD FILES</div>';
    }
  };

  refreshBtn.addEventListener('click', loadFiles);
  viewFolderSel.addEventListener('change', loadFiles);

  return container;
}
