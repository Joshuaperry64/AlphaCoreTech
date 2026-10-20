import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { playSFX } from '../components/audio.js';

export default function AssetManagerPage() {
  const container = createElement('div', { class: 'asset-manager-page slide-up' });

  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim().toLowerCase();
  const currentPin = (sessionStorage.getItem('current_pin') || '').trim();
  const isArchitect = currentProfile === 'architect' || currentPin === '672167566';
  const tierName = isArchitect ? 'ARCHITECT PRIORITY' : 'PUBLIC ECONOMY';
  const tierHw = isArchitect ? 'Dedicated Storage Worker' : 'Cost-Optimized Worker (60s Auto-Scale)';
  const tierColor = isArchitect ? '#38bdf8' : '#10b981';
  const tierBg = isArchitect ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)';
  const tierBorder = isArchitect ? '#38bdf8' : '#10b981';

  // Helper to read injected LoRAs
  function getInjectedLoras() {
    try {
      const stored = localStorage.getItem('alphacore_injected_loras');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveInjectedLoras(list) {
    try {
      localStorage.setItem('alphacore_injected_loras', JSON.stringify(list.slice(0, 3)));
    } catch (e) {
      console.warn('Failed saving injected loras:', e);
    }
  }

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
        <h1 class="page-title glitch" data-text="MODAL ASSET MANAGER" style="margin:0; font-family:'Orbitron',sans-serif; letter-spacing:2px;">MODAL ASSET MANAGER</h1>
        <div style="background:${tierBg}; border:1px solid ${tierBorder}; color:${tierColor}; padding:4px 10px; font-family:var(--font-hud); font-size:0.75rem; border-radius:2px; font-weight:bold; display:flex; align-items:center; gap:6px;">
          <span>●</span> ${tierName} // ${tierHw}
        </div>
      </div>
      <p class="page-subtitle" style="font-family:'Share Tech Mono',monospace; color:var(--accent,#06b6d4);">
        CIVITAI MODEL EXPLORER & GPU VOLUME DOWNLOADER // ACTIVE ROUTING: ${tierName}
      </p>
    </div>
    
    <div style="display:grid; grid-template-columns: minmax(350px, 420px) 1fr; gap:20px; max-width:1400px; margin:0 auto;">
      
      <!-- LEFT: DOWNLOAD FORM -->
      <div class="aim-section" style="padding:20px; background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); border-radius:4px; height:fit-content;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h2 style="color:#fff; font-size:15px; margin:0; letter-spacing:1.5px; font-family:'Orbitron',sans-serif;">
            DOWNLOAD NEW ASSET
          </h2>
          <span class="cyber-info-wrapper">
            <button type="button" class="cyber-info-btn" aria-label="Format Info">i</button>
            <div class="cyber-tooltip">
              <strong>SAFEY & FORMAT GUIDELINES:</strong><br/>
              • <strong>SafeTensors</strong>: Memory-mapped format immune to pickle injection malware.<br/>
              • <strong>Checkpoints</strong>: Full model weights (UNet + CLIP + VAE).<br/>
              • <strong>GGUF</strong>: Quantized weights for ultra-low VRAM execution.<br/>
              • <strong>LoRA</strong>: Fine-tuned weight deltas applied dynamically.
            </div>
          </span>
        </div>
        
        <div class="aim-row" style="margin-bottom:14px;">
          <div class="aim-field" style="width:100%;">
            <label class="aim-label" style="display:flex; align-items:center;">
              SOURCE PLATFORM
              <span class="cyber-info-wrapper">
                <button type="button" class="cyber-info-btn">i</button>
                <div class="cyber-tooltip">
                  Select CivitAI (via Version ID), HuggingFace repo/file path, or arbitrary direct HTTPS download URL.
                </div>
              </span>
            </label>
            <select id="am-source" class="aim-input">
              <option value="civitai">CivitAI Model Hub</option>
              <option value="huggingface">HuggingFace Hub</option>
              <option value="url">Direct HTTP/HTTPS URL</option>
            </select>
          </div>
        </div>

        <div id="am-civitai-fields" class="am-fields-group">
          <div class="aim-row" style="margin-bottom:14px;">
            <div class="aim-field" style="width:100%;">
              <label class="aim-label" style="display:flex; align-items:center;">
                CIVITAI VERSION ID
                <span class="cyber-info-wrapper">
                  <button type="button" class="cyber-info-btn">i</button>
                  <div class="cyber-tooltip">
                    Numeric version identifier from CivitAI URL (e.g. civitai.com/models/1234?modelVersionId=<strong>357609</strong>).
                  </div>
                </span>
              </label>
              <input type="text" id="am-civitai-id" class="aim-input" placeholder="e.g. 357609 (or click 'Use in Downloader' on card)" />
            </div>
          </div>
        </div>

        <div id="am-hf-fields" class="am-fields-group" style="display:none;">
          <div class="aim-row" style="margin-bottom:14px;">
            <div class="aim-field" style="width:100%;">
              <label class="aim-label">HF REPOSITORY</label>
              <input type="text" id="am-hf-repo" class="aim-input" placeholder="e.g. RunDiffusion/Juggernaut-XL-v9" />
            </div>
          </div>
          <div class="aim-row" style="margin-bottom:14px;">
            <div class="aim-field" style="width:100%;">
              <label class="aim-label">FILENAME</label>
              <input type="text" id="am-hf-file" class="aim-input" placeholder="e.g. model.safetensors" />
            </div>
          </div>
        </div>

        <div id="am-url-fields" class="am-fields-group" style="display:none;">
          <div class="aim-row" style="margin-bottom:14px;">
            <div class="aim-field" style="width:100%;">
              <label class="aim-label">DIRECT FILE URL</label>
              <input type="text" id="am-url" class="aim-input" placeholder="https://domain.com/weights.safetensors" />
            </div>
          </div>
        </div>
        
        <div class="aim-row" style="margin-bottom:14px;">
          <div class="aim-field" style="width:100%;">
            <label class="aim-label" style="display:flex; align-items:center;">
              DESTINATION VOLUME SUBFOLDER
              <span class="cyber-info-wrapper">
                <button type="button" class="cyber-info-btn">i</button>
                <div class="cyber-tooltip">
                  • <strong>checkpoints/</strong>: Base generation models.<br/>
                  • <strong>loras/</strong>: Style and character adaptation layers.<br/>
                  • <strong>embeddings/</strong>: Textual inversion tokens.<br/>
                  • <strong>controlnet/</strong>: Conditioning guidance weights.
                </div>
              </span>
            </label>
            <select id="am-subfolder" class="aim-input">
              <option value="checkpoints">checkpoints/ (Base Models)</option>
              <option value="loras" selected>loras/ (Adaptation Weights)</option>
              <option value="embeddings">embeddings/ (Textual Inversions)</option>
              <option value="controlnet">controlnet/ (Spatial Preprocessors)</option>
            </select>
          </div>
        </div>

        <div class="aim-row" style="margin-bottom:18px;">
          <div class="aim-field" style="width:100%;">
            <label class="aim-label">OVERRIDE FILENAME (OPTIONAL)</label>
            <input type="text" id="am-override" class="aim-input" placeholder="e.g. cyberpunk_neon.safetensors" />
          </div>
        </div>

        <button id="am-download-btn" class="aim-btn-generate" style="width:100%; height:45px; font-family:'Orbitron',sans-serif; font-size:0.9rem; font-weight:bold;">
          <span class="aim-btn-icon">⬇️</span> INITIATE CLOUD DOWNLOAD
        </button>
        <div id="am-status" style="text-align:center; color:#4ade80; margin-top:14px; font-size:12px; font-family:'Share Tech Mono',monospace; display:none; padding:8px; background:rgba(0,255,100,0.06); border:1px dashed #00ff66; border-radius:4px;">
          DOWNLOADING... PLEASE WAIT.
        </div>
      </div>

      <!-- RIGHT: CIVITAI MODEL EXPLORER -->
      <div class="aim-section" style="padding:20px; background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); border-radius:4px; display:flex; flex-direction:column; gap:16px;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <h2 style="color:#fff; font-size:15px; margin:0; letter-spacing:1.5px; font-family:'Orbitron',sans-serif;">
              CIVITAI MODEL EXPLORER
            </h2>
            <span class="cyber-info-wrapper">
              <button type="button" class="cyber-info-btn">i</button>
              <div class="cyber-tooltip">
                Query live models, checkpoints, and LoRAs directly from CivitAI API. Injected LoRAs can be dynamically attached to active Studio generation sessions.
              </div>
            </span>
          </div>

          <a href="https://civitai.com" target="_blank" rel="noopener noreferrer" class="aim-btn aim-btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px; border-color:#06b6d4; color:#06b6d4; font-size:0.75rem; padding:4px 10px;">
            <span>🌐</span> CIVITAI.COM ↗
          </a>
        </div>

        <!-- ACTIVE INJECTED LORAS STATUS BAR (OPTION 4 RULES) -->
        <div id="am-injected-bar" style="background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.25); padding:10px 14px; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
            <span style="font-family:'Orbitron',sans-serif; font-size:0.75rem; color:#06b6d4; display:flex; align-items:center; gap:6px;">
              <span>💉</span> ACTIVE LORA INJECTIONS <span id="injected-count-badge" style="color:#00ff66;">(0 / 3 ACTIVE)</span>
            </span>
            <span style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono',monospace;">
              ${currentProfile === 'guest' ? '<span style="color:#ef4444;">🔒 GUEST RESTRICTED</span>' : 'MAX 3 CONCURRENT INJECTIONS'}
            </span>
          </div>
          <div id="injected-chips-container" style="display:flex; gap:6px; flex-wrap:wrap;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- SEARCH & FILTER CONTROLS -->
        <div style="display:grid; grid-template-columns: 1fr 140px 140px auto; gap:8px; align-items:center;">
          <input type="text" id="civitai-search" class="aim-input" placeholder="Search CivitAI models, characters, styles..." value="cyberpunk" style="font-size:0.8rem;" />
          <select id="civitai-type" class="aim-input" style="font-size:0.75rem;">
            <option value="">All Types</option>
            <option value="LORA" selected>LoRA</option>
            <option value="Checkpoint">Checkpoint</option>
            <option value="Controlnet">ControlNet</option>
            <option value="TextualInversion">Embedding</option>
            <option value="Upscaler">Upscaler</option>
          </select>
          <select id="civitai-base-model" class="aim-input" style="font-size:0.75rem;">
            <option value="">All Bases</option>
            <option value="SDXL 1.0" selected>SDXL 1.0</option>
            <option value="SD 1.5">SD 1.5</option>
            <option value="Flux.1 D">Flux.1 Dev</option>
            <option value="Flux.1 S">Flux.1 Schnell</option>
            <option value="Pony">Pony</option>
          </select>
          <button type="button" id="civitai-search-btn" class="aim-btn" style="background:rgba(6,182,212,0.25); border-color:#06b6d4; color:#fff; font-family:'Orbitron',sans-serif; font-size:0.8rem; padding:8px 16px;">
            🔍 SEARCH
          </button>
        </div>

        <!-- RESULTS GRID -->
        <div id="civitai-results-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:14px; max-height:550px; overflow-y:auto; padding-right:4px;">
          <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:#64748b; font-family:'Share Tech Mono',monospace; font-size:0.85rem;">
            CLICK 'SEARCH' TO EXPLORE CIVITAI MODELS
          </div>
        </div>
      </div>
    </div>
  `;

  // UI Handlers & State
  const sourceSel = container.querySelector('#am-source');
  const civitaiGrp = container.querySelector('#am-civitai-fields');
  const hfGrp = container.querySelector('#am-hf-fields');
  const urlGrp = container.querySelector('#am-url-fields');
  const civitaiIdInput = container.querySelector('#am-civitai-id');
  const subfolderSel = container.querySelector('#am-subfolder');
  const overrideInput = container.querySelector('#am-override');

  sourceSel.addEventListener('change', () => {
    civitaiGrp.style.display = sourceSel.value === 'civitai' ? 'block' : 'none';
    hfGrp.style.display = sourceSel.value === 'huggingface' ? 'block' : 'none';
    urlGrp.style.display = sourceSel.value === 'url' ? 'block' : 'none';
  });

  const getEndpoint = () => {
    const defaultUrl = isArchitect
      ? 'https://josh627764--alphacore-aio-backend-alphacore-main-api.us-east.modal.run'
      : 'https://josh627764--alphacore-aio-backend-alphacore-main-api.us-east.modal.run';
    const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
    return isArchitect ? (settings.music_url || defaultUrl) : defaultUrl;
  };

  // Download Action
  const dlBtn = container.querySelector('#am-download-btn');
  const statusEl = container.querySelector('#am-status');

  dlBtn.addEventListener('click', async () => {
    const source = sourceSel.value;
    const params = {
      subfolder: subfolderSel.value,
      output_filename: overrideInput.value.trim()
    };
    
    if (source === 'civitai') {
      const vid = civitaiIdInput.value.trim();
      if (!vid) return showToast('MISSING VERSION ID', 'Please specify a CivitAI version ID.', 'error');
      params.civitai_version_id = vid;
    }
    if (source === 'huggingface') {
      params.hf_repo = container.querySelector('#am-hf-repo').value.trim();
      params.hf_filename = container.querySelector('#am-hf-file').value.trim();
      if (!params.hf_repo || !params.hf_filename) return showToast('MISSING REPO/FILE', 'Please fill in HuggingFace parameters.', 'error');
    }
    if (source === 'url') {
      params.direct_url = container.querySelector('#am-url').value.trim();
      if (!params.direct_url) return showToast('MISSING URL', 'Please provide a valid download URL.', 'error');
    }

    dlBtn.disabled = true;
    statusEl.style.display = 'block';
    statusEl.style.color = '#eab308';
    statusEl.textContent = 'DOWNLOADING TO MODAL GPU VOLUME...';

    try {
      const res = await fetch(`${getEndpoint()}/api/assets/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, params })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Download failed');
      
      statusEl.style.color = '#4ade80';
      statusEl.textContent = `SUCCESS: SAVED ${data.filename || 'FILE'} TO ${params.subfolder}/`;
      playSFX('pop', 0.8);
      showToast('ASSET DOWNLOADED', `Saved to ${params.subfolder}/ successfully.`);
    } catch (err) {
      console.error(err);
      statusEl.style.color = '#ef4444';
      statusEl.textContent = `ERROR: ${err.message}`;
      showToast('DOWNLOAD FAILED', err.message);
    } finally {
      dlBtn.disabled = false;
    }
  });

  // Render Injected LoRAs Chips
  function renderInjectedChips() {
    const injected = getInjectedLoras();
    const countBadge = container.querySelector('#injected-count-badge');
    const containerChips = container.querySelector('#injected-chips-container');
    if (countBadge) {
      countBadge.textContent = `(${injected.length} / 3 ACTIVE)`;
      countBadge.style.color = injected.length >= 3 ? '#f59e0b' : '#00ff66';
    }
    if (!containerChips) return;

    if (injected.length === 0) {
      containerChips.innerHTML = `
        <span style="font-size:0.75rem; color:#64748b; font-family:'Share Tech Mono',monospace;">
          No LoRAs currently injected. Click '💉 INJECT LORA' below to load weights into Studio.
        </span>
      `;
      return;
    }

    containerChips.innerHTML = injected.map((lora, idx) => `
      <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(6,182,212,0.15); border:1px solid #06b6d4; padding:3px 8px; border-radius:3px; font-size:0.72rem; color:#fff; font-family:'Share Tech Mono',monospace;">
        <span>💉</span>
        <strong style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${lora.name}">
          ${lora.name}
        </strong>
        <button type="button" class="btn-remove-injected" data-idx="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-weight:bold; padding:0 2px;" title="Un-inject LoRA">✕</button>
      </div>
    `).join('');

    containerChips.querySelectorAll('.btn-remove-injected').forEach(btnRem => {
      btnRem.addEventListener('click', () => {
        const idx = parseInt(btnRem.dataset.idx, 10);
        const currentList = getInjectedLoras();
        currentList.splice(idx, 1);
        saveInjectedLoras(currentList);
        playSFX('pop', 0.6);
        showToast('LORA REMOVED', 'LoRA removed from active injection list.');
        renderInjectedChips();
      });
    });
  }

  renderInjectedChips();

  // CivitAI Search Logic
  const searchInput = container.querySelector('#civitai-search');
  const typeSelect = container.querySelector('#civitai-type');
  const baseModelSelect = container.querySelector('#civitai-base-model');
  const searchBtn = container.querySelector('#civitai-search-btn');
  const resultsGrid = container.querySelector('#civitai-results-grid');

  async function searchCivitai() {
    const query = searchInput.value.trim();
    const type = typeSelect.value;
    const baseModel = baseModelSelect.value;

    resultsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:30px; color:#38bdf8; font-family:'Share Tech Mono',monospace;">
        🔄 QUERYING CIVITAI API MATRIX...
      </div>
    `;

    try {
      const params = new URLSearchParams({ limit: '12', nsfw: 'false' });
      if (query) params.append('query', query);
      if (type) params.append('types', type);
      if (baseModel) params.append('baseModels', baseModel);

      const res = await fetch(`https://civitai.com/api/v1/models?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to reach CivitAI API`);
      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        resultsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align:center; padding:40px; color:#64748b; font-family:'Share Tech Mono',monospace;">
            NO MODELS FOUND MATCHING FILTERS. TRY A DIFFERENT SEARCH QUERY.
          </div>
        `;
        return;
      }

      resultsGrid.innerHTML = data.items.map(model => {
        const latestVersion = model.modelVersions?.[0] || {};
        const versionId = latestVersion.id || '';
        const previewImg = latestVersion.images?.[0]?.url || '';
        const baseModelBadge = latestVersion.baseModel || '';
        const modelType = model.type || 'LORA';
        const stats = model.stats || {};
        const downloads = stats.downloadCount ? Number(stats.downloadCount).toLocaleString() : '—';
        const rating = stats.rating ? stats.rating.toFixed(1) : '—';

        return `
          <div class="civitai-card" style="background:rgba(0,0,0,0.6); border:1px solid rgba(6,182,212,0.25); border-radius:4px; overflow:hidden; display:flex; flex-direction:column; transition:transform 0.2s, border-color 0.2s;">
            <div style="height:150px; background:#000; position:relative; overflow:hidden;">
              ${previewImg ? `
                <img src="${previewImg}" alt="${model.name}" loading="lazy" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'" />
              ` : `
                <div style="display:flex; align-items:center; justify-content:center; height:100%; color:#475569; font-size:2rem;">💾</div>
              `}
              <span style="position:absolute; top:6px; left:6px; background:rgba(0,0,0,0.75); border:1px solid #06b6d4; color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.65rem; padding:2px 6px; border-radius:2px;">
                ${modelType}
              </span>
              ${baseModelBadge ? `
                <span style="position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.75); border:1px solid #a855f7; color:#c084fc; font-family:'Share Tech Mono',monospace; font-size:0.62rem; padding:2px 6px; border-radius:2px;">
                  ${baseModelBadge}
                </span>
              ` : ''}
            </div>

            <div style="padding:10px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="font-family:'Orbitron',sans-serif; font-size:0.78rem; color:#fff; font-weight:bold; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${model.name}">
                  ${model.name}
                </div>
                <div style="font-size:0.68rem; color:#94a3b8; font-family:'Share Tech Mono',monospace; display:flex; justify-content:space-between; margin-bottom:8px;">
                  <span>by ${model.creator?.username || 'CivitAI User'}</span>
                  <span>⬇️ ${downloads} | ⭐ ${rating}</span>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
                <button type="button" class="aim-btn aim-btn-sm btn-use-downloader" data-vid="${versionId}" data-type="${modelType}" data-name="${model.name}" style="width:100%; font-size:0.7rem; padding:4px 6px; border-color:#06b6d4; color:#06b6d4;">
                  ⬇️ USE IN DOWNLOADER
                </button>
                <button type="button" class="aim-btn aim-btn-sm btn-inject-lora" data-vid="${versionId}" data-name="${model.name}" data-base="${baseModelBadge}" style="width:100%; font-size:0.7rem; padding:4px 6px; border-color:#10b981; color:#10b981;">
                  💉 INJECT LORA (SLOT)
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Bind card actions
      resultsGrid.querySelectorAll('.btn-use-downloader').forEach(btnUse => {
        btnUse.addEventListener('click', () => {
          const vid = btnUse.dataset.vid;
          const type = (btnUse.dataset.type || '').toUpperCase();
          const name = btnUse.dataset.name || '';

          sourceSel.value = 'civitai';
          civitaiGrp.style.display = 'block';
          hfGrp.style.display = 'none';
          urlGrp.style.display = 'none';
          civitaiIdInput.value = vid;

          if (type.includes('CHECKPOINT')) subfolderSel.value = 'checkpoints';
          else if (type.includes('CONTROLNET')) subfolderSel.value = 'controlnet';
          else if (type.includes('EMBED') || type.includes('TEXTUAL')) subfolderSel.value = 'embeddings';
          else subfolderSel.value = 'loras';

          overrideInput.value = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.safetensors`;
          playSFX('pop', 0.8);
          showToast('VERSION LOADED', `CivitAI Version ID ${vid} autofilled into Downloader.`);
        });
      });

      resultsGrid.querySelectorAll('.btn-inject-lora').forEach(btnInj => {
        btnInj.addEventListener('click', () => {
          // Option 4 Rule 1: Non-guest profiles only
          if (currentProfile === 'guest') {
            showToast('AUTH RESTRICTION', 'LoRA injection is restricted to authenticated profiles. Please log in.');
            return;
          }

          const vid = btnInj.dataset.vid;
          const name = btnInj.dataset.name;
          const base = btnInj.dataset.base;
          const currentList = getInjectedLoras();

          // Check if already injected
          const already = currentList.find(l => l.id === vid || l.name === name);
          if (already) {
            showToast('ALREADY ACTIVE', `LoRA '${name}' is already injected in active studio slots.`);
            return;
          }

          // Option 4 Rule 2: Max 3 concurrent active injected LoRAs
          if (currentList.length >= 3) {
            showToast('LIMIT REACHED', 'Maximum of 3 concurrent active LoRA injections allowed. Remove one to inject another.');
            return;
          }

          const safeFileName = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}.safetensors`;
          currentList.push({
            id: vid,
            name: name,
            file: safeFileName,
            baseModel: base
          });

          saveInjectedLoras(currentList);
          renderInjectedChips();
          playSFX('pop', 0.8);
          showToast('LORA INJECTED', `LoRA '${name}' injected into Studio (Slot ${currentList.length}/3).`);
        });
      });

    } catch (err) {
      console.error(err);
      resultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:30px; color:#ef4444; font-family:'Share Tech Mono',monospace;">
          ERROR SEARCHING CIVITAI: ${err.message}
        </div>
      `;
    }
  }

  searchBtn.addEventListener('click', searchCivitai);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchCivitai();
  });

  // Run initial search
  searchCivitai();

  return container;
}
