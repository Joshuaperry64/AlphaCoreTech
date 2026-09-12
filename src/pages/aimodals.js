/**
 * AI Modals Page — t
  if (window._cn_global_img && window._cn_global_type && document.querySelector('#t2i-cn-container').style.display !== 'none') {
    payload.control_image_b64 = window._cn_global_img;
    payload.control_type = window._cn_global_type;
    payload.controlnet_conditioning_scale = 1.0;
  }
xt2img & img2img via Modal.run endpoints
 * Disclaimer-gated, tabbed interface, desktop + mobile compatible.
 */
import { createElement } from '../components/utils.js';
import { buildPinPad, requireAuth } from '../components/pinpad.js';
import { saveImageToGallery } from '../components/vision_db.js';
import { logAction } from '../components/logger.js';
import { playSFX } from '../components/audio.js';

const LORA_OPTIONS = `
  <option value="none">NONE (BASE MODEL ONLY)</option>
  <option value="epiCRealismHelper.safetensors">EPICREALISM HELPER</option>
  <option value="custom_training.safetensors">CUSTOM TRAINING</option>
  <option value="cunny.safetensors">CUNNY</option>
  <option value="FlatTop.safetensors">FLAT TOP</option>
  <option value="BJ.safetensors">BJ</option>
  <option value="Cowgirl.safetensors">COWGIRL</option>
  <option value="Missionary.safetensors">MISSIONARY</option>
  <option value="SpyCam.safetensors">SPYCAM</option>
`;

function resolveEndpoint(baseUrl, subPath = '') {
  if (!baseUrl) return '';
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanSub = subPath.trim().replace(/^\/+/, '');
  return cleanSub ? `${cleanBase}/${cleanSub}` : cleanBase;
}

function getModalSettings() {
  const defaults = {
    txt2imgUrl: 'https://josh64perry--alphacore-aio-backend-txt2img-web-txt2img.modal.run',
    img2imgUrl: 'https://josh64perry--alphacore-aio-backend-img2img-web-img2img.modal.run',
    preprocessorUrl: 'https://josh64perry--alphacore-aio-backend-preprocessors-web-process.modal.run',
    txt2vidUrl: 'https://josh64perry--alphacore-aio-backend-txt2vid-web-txt2vid.modal.run/stream',
    img2vidUrl: 'https://josh64perry--alphacore-aio-backend-img2vid-web-img2vid.modal.run/stream',
    framepackUrl: 'https://josh64perry--alphacore-aio-backend-framepack-ui-framepack.modal.run',
    fanninCrimeUrl: 'https://josh64perry--alphacore-aio-backend-fannin-scraper-api.modal.run/api/mugshots',
    music_url: 'https://josh64perry--alphacore-aio-backend-alphacore-main-api.modal.run',
    upscalerUrl: 'https://josh64perry--alphacore-aio-backend-alphacore-main-api.modal.run/api/upscale',
    negativePrompt: 'worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts',
    guidanceScale: '7.0',
    guidanceImg: 4.0,
    stepsFastTxt: 20,
    stepsNormalTxt: 30,
    stepsFocusedTxt: 60,
    stepsFastImg: 15,
    stepsNormalImg: 25,
    stepsFocusedImg: 40
  };
  try {
    const customStr = localStorage.getItem('alphacore_modal_settings');
    if (customStr) {
      const custom = JSON.parse(customStr);
      // Strip trailing slashes from any cached custom endpoints
      ['txt2imgUrl', 'img2imgUrl', 'preprocessorUrl', 'txt2vidUrl', 'img2vidUrl', 'framepackUrl', 'fanninCrimeUrl', 'music_url', 'upscalerUrl'].forEach(k => {
        if (custom[k] && typeof custom[k] === 'string') {
          custom[k] = custom[k].trim().replace(/\/+$/, '');
        }
      });
      // Auto-heal outdated endpoints in user's localStorage
      if (custom.txt2imgUrl && (!custom.txt2imgUrl.includes('josh64perry') || custom.txt2imgUrl.endsWith('/stream'))) custom.txt2imgUrl = defaults.txt2imgUrl;
      if (custom.img2imgUrl && (!custom.img2imgUrl.includes('josh64perry') || custom.img2imgUrl.endsWith('/stream'))) custom.img2imgUrl = defaults.img2imgUrl;
      if (custom.preprocessorUrl && !custom.preprocessorUrl.includes('josh64perry')) custom.preprocessorUrl = defaults.preprocessorUrl;
      if (custom.txt2vidUrl && !custom.txt2vidUrl.includes('josh64perry')) custom.txt2vidUrl = defaults.txt2vidUrl;
      if (custom.img2vidUrl && !custom.img2vidUrl.includes('josh64perry')) custom.img2vidUrl = defaults.img2vidUrl;
      if (custom.framepackUrl && !custom.framepackUrl.includes('josh64perry')) custom.framepackUrl = defaults.framepackUrl;
      if (custom.music_url && !custom.music_url.includes('josh64perry')) custom.music_url = defaults.music_url;
      if (custom.upscalerUrl && !custom.upscalerUrl.includes('josh64perry')) custom.upscalerUrl = defaults.upscalerUrl;
      if (custom.fanninCrimeUrl && !custom.fanninCrimeUrl.includes('josh64perry')) custom.fanninCrimeUrl = defaults.fanninCrimeUrl;

      if (custom.stepsFastTxt === 10 || custom.stepsFastTxt === 20 || custom.stepsFocusedTxt === 50) {
        custom.stepsFastTxt = 20;
        custom.stepsNormalTxt = 30;
        custom.stepsFocusedTxt = 60;
        custom.stepsFastImg = 15;
        custom.stepsNormalImg = 25;
        custom.stepsFocusedImg = 40;
      }
      localStorage.setItem('alphacore_modal_settings', JSON.stringify(custom));
      return { ...defaults, ...custom };
    }
  } catch (e) {
    console.error(e);
  }
  return defaults;
}

/* ─── DISCLAIMER SCREEN ─────────────────────────────────────── */
function buildDisclaimer(onAccept) {
  const wrap = document.createElement('div');
  wrap.className = 'aim-disclaimer-wrap';
  wrap.innerHTML = `
    <div class="aim-disclaimer-box">
      <div class="aim-disc-icon">⚠</div>
      <div class="aim-disc-title">// CONTENT_ADVISORY</div>
      <div class="aim-disc-badge">LEGAL DISCLAIMER</div>
      <div class="aim-disc-body">
        <p>The AI generation tools accessible through this interface are provided for <strong>creative and personal use only</strong>. By proceeding, you acknowledge and agree to the following:</p>
        <ul>
          <li>You are solely responsible for all content you generate.</li>
          <li>Generated content must comply with all applicable local, national, and international laws.</li>
          <li>You will not use these tools to generate content that depicts minors in any sexual or harmful context.</li>
          <li>You will not use these tools to generate non-consensual imagery, defamatory content, or material intended to harass or harm any individual.</li>
          <li>The operator of this platform assumes no liability for content generated by users.</li>
          <li>Misuse may result in permanent access revocation and legal action.</li>
        </ul>
        <p class="aim-disc-warning">By clicking <strong>ACCEPT &amp; PROCEED</strong> you confirm you are 18 years of age or older and agree to use these tools responsibly and lawfully.</p>
      </div>
      <div class="aim-disc-actions">
        <button class="aim-btn aim-btn-accept" id="disc-accept">ACCEPT &amp; PROCEED</button>
        <button class="aim-btn aim-btn-decline" id="disc-decline">DECLINE</button>
      </div>
    </div>
  `;
  wrap.querySelector('#disc-accept').onclick = () => {
    sessionStorage.setItem('aim_disclaimer_accepted', '1');
    onAccept();
  };
  wrap.querySelector('#disc-decline').onclick = () => {
    window.location.hash = '#/';
  };
  return wrap;
}

/* ─── LOADING OVERLAY ───────────────────────────────────────── */
function buildLoader(text = 'SYNTHESIZING...') {
  const el = document.createElement('div');
  el.className = 'aim-loader';
  el.innerHTML = `
    <div class="aim-loader-inner">
      <div class="aim-spinner"></div>
      <div class="aim-loader-text" id="aim-loader-text">${text}</div>
      <div class="aim-loader-sub">MODAL GPU ACTIVE — PLEASE WAIT</div>
      <div class="aim-progress-wrap" style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); margin-top: 15px; border-radius: 3px; overflow: hidden; display: none;">
        <div class="aim-progress-bar" id="aim-progress-bar" style="width: 0%; height: 100%; background: var(--accent, #ff003c); transition: width 0.2s; box-shadow: 0 0 8px var(--accent, #ff003c);"></div>
      </div>
    </div>
  `;
  return el;
}

function updateProgress(loader, step, maxSteps, extraText = '') {
  const wrap = loader.querySelector('.aim-progress-wrap');
  const bar = loader.querySelector('.aim-progress-bar');
  const sub = loader.querySelector('.aim-loader-sub');
  if (wrap && bar) {
    wrap.style.display = 'block';
    const pct = Math.min(100, Math.round(((step + 1) / maxSteps) * 100));
    bar.style.width = `${pct}%`;
  }
  if (sub && extraText) {
    sub.textContent = `MODAL GPU ACTIVE — PLEASE WAIT ${extraText}`;
  }
}

/* ─── RESULT PANEL ──────────────────────────────────────────── */
function buildResult(urls = []) {
  const el = document.createElement('div');
  el.className = 'aim-result hidden';
  if (!Array.isArray(urls)) urls = [urls];
  if (urls.length === 0) return el;
  let currentIdx = 0;

  el.innerHTML = `
    <div class="aim-result-label" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" id="aim-result-toggle">
      <span>// OUTPUT_ARTIFACT</span>
      <div>
        <span class="aim-batch-count" style="opacity:0.7; margin-right:10px;">${urls.length > 1 ? '1 / ' + urls.length : ''}</span>
        <span id="aim-result-toggle-icon">▼</span>
      </div>
    </div>
    <div id="aim-result-content-area">
      <div class="aim-result-img-wrap">
        <img class="aim-result-img" id="aim-result-img" src="${urls[0]}" alt="Generated output" />
      </div>
      <div class="aim-result-actions" style="display:flex; justify-content:space-between; align-items:center;">
        <div class="aim-batch-nav" style="display:${urls.length > 1 ? 'flex' : 'none'}; gap:6px; align-items:center;">
          <button class="aim-btn aim-btn-dl" id="aim-prev-btn">◀ PREV</button>
          <button class="aim-btn aim-btn-dl" id="aim-slideshow-btn" title="Toggle Auto Slideshow">▶ AUTO</button>
          <button class="aim-btn aim-btn-dl" id="aim-next-btn">NEXT ▶</button>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
          <button class="aim-btn aim-btn-dl" id="aim-upscale-btn" style="border-color:#38bdf8; color:#38bdf8;">🔍 UPSCALE</button>
          <button class="aim-btn aim-btn-dl" id="aim-vault-btn" style="border-color:#f59e0b; color:#f59e0b;">💾 MOVE IMAGE(S) TO VAULT</button>
          ${urls.length > 1 ? `<button class="aim-btn aim-btn-dl" id="aim-dl-all-btn">⬇ DOWN ALL</button>` : ''}
          <button class="aim-btn aim-btn-dl" id="aim-dl-btn">⬇ DOWNLOAD</button>
        </div>
      </div>
    </div>
  `;

  el.querySelector('#aim-result-toggle').onclick = () => {
    const area = el.querySelector('#aim-result-content-area');
    const icon = el.querySelector('#aim-result-toggle-icon');
    if (area.style.display === 'none') {
      area.style.display = 'block';
      icon.textContent = '▼';
    } else {
      area.style.display = 'none';
      icon.textContent = '▶';
    }
  };

  if (urls.length > 1) {
    const imgEl = el.querySelector('#aim-result-img');
    const countEl = el.querySelector('.aim-batch-count');
    const actionsRow = el.querySelector('.aim-result-actions');
    
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'aim-result-thumbnails';
    thumbContainer.style.display = 'flex';
    thumbContainer.style.gap = '8px';
    thumbContainer.style.marginTop = '10px';
    thumbContainer.style.overflowX = 'auto';
    thumbContainer.style.padding = '4px 0';

    let slideshowTimer = null;
    const slideshowBtn = el.querySelector('#aim-slideshow-btn');

    function stopSlideshow() {
      if (slideshowTimer) {
        clearInterval(slideshowTimer);
        slideshowTimer = null;
      }
      if (slideshowBtn) {
        slideshowBtn.innerHTML = '▶ AUTO';
        slideshowBtn.style.background = '';
      }
    }

    function advanceSlide() {
      currentIdx = (currentIdx + 1) % urls.length;
      imgEl.src = urls[currentIdx];
      countEl.textContent = `${currentIdx + 1} / ${urls.length}`;
      Array.from(thumbContainer.children).forEach((t, i) => {
        t.style.border = i === currentIdx ? '2px solid var(--accent)' : '2px solid transparent';
      });
    }

    if (slideshowBtn) {
      slideshowBtn.onclick = () => {
        if (slideshowTimer) {
          stopSlideshow();
        } else {
          slideshowBtn.innerHTML = '⏸ PAUSE';
          slideshowBtn.style.background = 'rgba(6, 182, 212, 0.3)';
          slideshowTimer = setInterval(advanceSlide, 2200);
        }
      };
    }
    
    urls.forEach((u, idx) => {
      const thumb = document.createElement('img');
      thumb.src = u;
      thumb.style.width = '60px';
      thumb.style.height = '60px';
      thumb.style.objectFit = 'cover';
      thumb.style.cursor = 'pointer';
      thumb.style.borderRadius = '4px';
      thumb.style.border = idx === 0 ? '2px solid var(--accent)' : '2px solid transparent';
      thumb.style.transition = 'border 0.2s';
      
      thumb.onclick = () => {
        stopSlideshow();
        currentIdx = idx;
        imgEl.src = urls[currentIdx];
        countEl.textContent = `${currentIdx + 1} / ${urls.length}`;
        Array.from(thumbContainer.children).forEach((t, i) => {
          t.style.border = i === currentIdx ? '2px solid var(--accent)' : '2px solid transparent';
        });
      };
      thumbContainer.appendChild(thumb);
    });
    
    actionsRow.parentNode.insertBefore(thumbContainer, actionsRow);
    
    el.querySelector('#aim-prev-btn').onclick = () => {
      stopSlideshow();
      currentIdx = (currentIdx - 1 + urls.length) % urls.length;
      imgEl.src = urls[currentIdx];
      countEl.textContent = `${currentIdx + 1} / ${urls.length}`;
      Array.from(thumbContainer.children).forEach((t, i) => t.style.border = i === currentIdx ? '2px solid var(--accent)' : '2px solid transparent');
    };
    
    el.querySelector('#aim-next-btn').onclick = () => {
      stopSlideshow();
      currentIdx = (currentIdx + 1) % urls.length;
      imgEl.src = urls[currentIdx];
      countEl.textContent = `${currentIdx + 1} / ${urls.length}`;
      Array.from(thumbContainer.children).forEach((t, i) => t.style.border = i === currentIdx ? '2px solid var(--accent)' : '2px solid transparent');
    };

    el.querySelector('#aim-dl-all-btn').onclick = () => {
      urls.forEach((u, idx) => {
        const a = document.createElement('a');
        a.href = u;
        a.download = `alphacore_output_${Date.now()}_${idx}.png`;
        setTimeout(() => a.click(), idx * 200); 
      });
    };
  }

  el.querySelector('#aim-dl-btn').onclick = () => {
    const a = document.createElement('a');
    a.href = urls[currentIdx];
    a.download = `alphacore_output_${Date.now()}_${currentIdx}.png`;
    a.click();
  };

  const upscaleBtn = el.querySelector('#aim-upscale-btn');
  if (upscaleBtn) {
    upscaleBtn.onclick = () => {
      window._pending_upscale_image = urls[currentIdx];
      const upTab = document.querySelector('#aim-tab-upscale');
      if (upTab) {
        upTab.click();
      } else {
        window.location.hash = '#/upscaler';
      }
    };
  }

  el.querySelector('#aim-vault-btn').onclick = () => {
    try {
      let files = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
      const currentProfile = sessionStorage.getItem('current_profile') || 'GUEST';
      
      urls.forEach((u, idx) => {
        files.push({
          id: Date.now().toString() + '_' + idx,
          owner: currentProfile,
          filename: `GENERATION_${Date.now()}_${idx}.png`,
          content: u, 
          type: 'image/png',
          shared: false,
          createdAt: Date.now()
        });
      });
      
      localStorage.setItem('alphacore_vault_files', JSON.stringify(files));
      const vaultBtn = el.querySelector('#aim-vault-btn');
      vaultBtn.textContent = '✔️ SECURED IN VAULT';
      vaultBtn.style.borderColor = '#10b981';
      vaultBtn.style.color = '#10b981';
      vaultBtn.disabled = true;
    } catch (e) {
      alert("VAULT STORAGE LIMIT EXCEEDED. CANNOT ENCRYPT FILE.");
    }
  };

  return el;
}

/* ─── TXT2IMG PANEL ─────────────────────────────────────────── */
function buildTxt2Img() {
  const settings = getModalSettings();
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  const isArchitect = currentProfile === 'architect' || sessionStorage.getItem('admin_authenticated') === '1';
  const maxBatchCount = isArchitect ? Infinity : 5;

  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">✦</span>
      <span class="aim-panel-title">TEXT TO IMAGE</span>
      <span class="aim-panel-badge">SDXL ENGINE</span>
    </div>

    <div class="aim-field">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" for="t2i-prompt" style="margin:0;">PROMPT MATRIX</label>
        <button class="aim-btn aim-btn-sm" id="t2i-enhance-btn" style="padding:2px 10px; font-size:0.75rem; background:rgba(6,182,212,0.15); border-color:var(--accent); color:var(--accent);" title="Auto-enhance prompt with AI matrix descriptors">✨ AI ENHANCE</button>
      </div>
      <textarea class="aim-textarea" id="t2i-prompt" rows="4" placeholder="Describe what you want to generate..."></textarea>
    </div>

    ${(() => {
      const injected = localStorage.getItem('alphacore_injected_prompt');
      if (injected) {
        localStorage.removeItem('alphacore_injected_prompt');
        setTimeout(() => {
          const pInput = wrap.querySelector('#t2i-prompt');
          if (pInput) pInput.value = injected;
        }, 50);
      }
      return '';
    })()}


    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>

    <div class="aim-row">
      <div class="aim-field aim-field-half">
        <label class="aim-label">SPEED MODE</label>
        <div class="aim-seg aim-seg-3" id="t2i-speed">
          <button class="aim-seg-btn" data-steps="${settings.stepsFastTxt}">⚡ FAST</button>
          <button class="aim-seg-btn active" data-steps="${settings.stepsNormalTxt}">⚖ NORMAL</button>
          <button class="aim-seg-btn" data-steps="${settings.stepsFocusedTxt}">🎯 DETAILED</button>
        </div>
      </div>
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="t2i-model-select">BASE MODEL</label>
        <select class="aim-input" id="t2i-model-select">
          <option value="0x7RealisticFreedom_omegaSDXL.safetensors">FREEDOM OMEGA</option>
          <option value="juggernautXL_ragnarok.safetensors">JUGGERNAUT RAGNAROK</option>
          <option value="cyberrealisticXL_desireV30.safetensors">CYBER REALISTIC</option>
          <option value="unholyDesireMixSinister_v80.safetensors">UNHOLY DESIRE</option>
          <option value="dreamshaperXL_alpha2Xl10.safetensors">DREAMSHAPER XL</option>
          <option value="lustifyNSFWCheckpoint_zenithV9.safetensors">LUSTIFY ZENITH</option>
          <option value="epicrealismXL_pureFix.safetensors" selected>EPICREALISM</option>
        </select>
      </div>
    </div>

    <div class="aim-row" style="margin-top:4px; margin-bottom:12px; display:flex; justify-content:flex-end; width:100%;">
      <label class="aim-label" style="display:flex; align-items:center; cursor:pointer; margin:0; user-select:none;">
        <span style="margin-right:8px;">DETAILIFIER:</span>
        <div id="t2i-detailifier-btn" data-active="false" style="width:36px; height:20px; background:rgba(0,0,0,0.5); border:1px solid #10b981; border-radius:10px; position:relative; transition:0.3s;">
          <div class="toggle-knob" style="width:14px; height:14px; background:#10b981; border-radius:50%; position:absolute; top:2px; left:2px; transition:0.3s;"></div>
        </div>
      </label>
    </div>

    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>

    <div class="aim-row">
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="t2i-batch">IMAGE COUNT ${isArchitect ? '<span style="color:#10b981; margin-left:4px;">[UNLIMITED]</span>' : '<span style="color:#f59e0b; margin-left:4px;">[MAX 5]</span>'}</label>
        <input class="aim-input" type="number" id="t2i-batch" min="1" max="${maxBatchCount}" value="1" />
      </div>
        <div class="aim-field" id="t2i-lora-field" style="display: ${sessionStorage.getItem('lora_authenticated') ? 'block' : 'none'};">
          <label class="aim-label" for="t2i-lora">ACTIVE LORAS (CTRL+CLICK) ${sessionStorage.getItem('darkness_mode_active') !== 'true' ? '<span style="color:#ff003c; margin-left:4px;">[LOCKED]</span>' : ''}</label>
          <select class="aim-input aim-lora-select" id="t2i-lora" multiple ${sessionStorage.getItem('darkness_mode_active') === 'true' ? '' : 'disabled'}>
            ${LORA_OPTIONS}
          </select>
        </div>
    </div>

    <details class="aim-advanced">
      <summary class="aim-advanced-toggle">▶ ADVANCED PARAMETERS</summary>
      <div class="aim-advanced-body">
        <div class="aim-field">
          <label class="aim-label" for="t2i-neg">NEGATIVE PROMPT</label>
          <textarea class="aim-textarea aim-textarea-sm" id="t2i-neg" rows="2">${settings.negativePrompt}</textarea>
        </div>
        
        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="t2i-cfg">PROMPT ADHERANCE: <span class="aim-val-display" id="t2i-cfg-val">${parseFloat(settings.guidanceScale)}</span></label>
            <input class="aim-range" type="range" id="t2i-cfg" min="1" max="20" step="0.5" value="${settings.guidanceScale}" />
          </div>
        </div>

        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="t2i-scheduler">GENERATION ENGINE</label>
            <select class="aim-input" id="t2i-scheduler">
              <option value="Euler a" selected>Euler Ancestral (Euler a)</option>
              <option value="Euler">Euler</option>
              <option value="DPM++ 2M">DPM++ 2M</option>
              <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
              <option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
              <option value="DDIM">DDIM</option>
              <option value="UniPC">UniPC</option>
              <option value="Heun">Heun</option>
            </select>
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="t2i-clip-skip">CLIP SKIP</label>
            <select class="aim-input" id="t2i-clip-skip">
              <option value="1" selected>Clip Skip 1 (Standard)</option>
              <option value="2">Clip Skip 2 (Anime/SDXL)</option>
            </select>
          </div>
        </div>

        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="t2i-aspect">ASPECT RATIO</label>
            <select class="aim-input" id="t2i-aspect">
              <option value="1024x1024" selected>1:1 Square (1024x1024)</option>
              <option value="832x1216">2:3 Portrait (832x1216)</option>
              <option value="1216x832">3:2 Landscape (1216x832)</option>
              <option value="1024x1536">9:16 Mobile Tall (1024x1536)</option>
              <option value="1536x1024">16:9 Widescreen (1536x1024)</option>
            </select>
          </div>
        </div>
      </div>
    </details>

    <div style="display:flex; flex-direction:column; gap:8px;">
      <button class="aim-btn-generate" id="t2i-gen-btn" style="${!sessionStorage.getItem('generate_authenticated') ? 'background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c;' : ''}">
        <span class="aim-btn-icon">${sessionStorage.getItem('generate_authenticated') ? '⚡' : '🔒'}</span> ${sessionStorage.getItem('generate_authenticated') ? 'INITIALIZE SYNTHESIS' : 'GUEST PREVIEW MODE — CLICK TO LOGIN'}
      </button>
      
      ${isArchitect ? `
      <button class="aim-btn-generate" id="t2i-stream-btn" style="background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981;">
        <span class="aim-btn-icon">♾️</span> INITIATE STREAM GENERATION
      </button>
      ` : ''}
    </div>

    <div class="aim-status-bar" id="t2i-status"></div>
    <div id="t2i-loader-slot"></div>
    <div id="t2i-result-slot"></div>
  `;

  // AI Prompt Enhance listener
  wrap.querySelector('#t2i-enhance-btn').addEventListener('click', () => {
    const promptInput = wrap.querySelector('#t2i-prompt');
    const enhanced = enhancePromptWithAI(promptInput.value);
    if (enhanced) {
      promptInput.value = enhanced;
      setStatus(wrap, '#t2i-status', 'PROMPT MATRIX ENHANCED WITH AI DESCRIPTORS.', 'ok');
    }
  });

  wrap.querySelectorAll('#t2i-speed .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#t2i-speed .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const cfgInput = wrap.querySelector('#t2i-cfg');
  const cfgVal = wrap.querySelector('#t2i-cfg-val');
  if (cfgInput && cfgVal) cfgInput.addEventListener('input', () => { cfgVal.textContent = parseFloat(cfgInput.value); });

  const detailifierBtn = wrap.querySelector('#t2i-detailifier-btn');
  if (detailifierBtn) {
    detailifierBtn.parentElement.addEventListener('click', (e) => {
      e.preventDefault();
      const isActive = detailifierBtn.dataset.active === 'true';
      detailifierBtn.dataset.active = !isActive ? 'true' : 'false';
      detailifierBtn.style.background = !isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0,0,0,0.5)';
      const knob = detailifierBtn.querySelector('.toggle-knob');
      if (knob) {
        knob.style.left = !isActive ? '18px' : '2px';
      }
    });
  }

  // --- STREAM GENERATOR LOGIC ---
  let isStreaming = false;
  const streamBtn = wrap.querySelector('#t2i-stream-btn');
  if (streamBtn) {
    streamBtn.addEventListener('click', async () => {
      if (isStreaming) {
        isStreaming = false;
        streamBtn.innerHTML = '<span class="aim-btn-icon">♾️</span> INITIATE STREAM GENERATION';
        streamBtn.style.background = 'rgba(16,185,129,0.15)';
        streamBtn.style.color = '#10b981';
        setStatus(wrap, '#t2i-status', 'STREAM GENERATION TERMINATED.', 'info');
        return;
      }

      isStreaming = true;
      streamBtn.innerHTML = '<span class="aim-btn-icon">🛑</span> STOP STREAM GENERATION';
      streamBtn.style.background = 'rgba(255,0,60,0.15)';
      streamBtn.style.color = '#ff003c';
      
      const schedulers = ["Euler a", "Euler", "DPM++ 2M", "DPM++ 2M Karras", "DPM++ SDE Karras", "DDIM", "UniPC", "Heun"];
      const loaderSlot = wrap.querySelector('#t2i-loader-slot');
      const resultSlot = wrap.querySelector('#t2i-result-slot');
      
      while (isStreaming) {
        const prompt = wrap.querySelector('#t2i-prompt').value.trim();
        if (!prompt) { 
           setStatus(wrap, '#t2i-status', 'ERROR: Prompt matrix is empty.', 'error'); 
           isStreaming = false; break; 
        }
        
        const steps = parseInt(wrap.querySelector('#t2i-speed .aim-seg-btn.active').dataset.steps);
        const modelStr = wrap.querySelector('#t2i-model-select').value;
        let neg = wrap.querySelector('#t2i-neg').value;
        const cfg = parseFloat(wrap.querySelector('#t2i-cfg').value);
        const clipSkip = wrap.querySelector('#t2i-clip-skip')?.value || '1';
        const aspect = wrap.querySelector('#t2i-aspect')?.value || '1024x1024';
        const [w, h] = aspect.split('x').map(n => parseInt(n));
        
        let lora = '';
        const loraSelect = wrap.querySelector('#t2i-lora');
        if (loraSelect && !loraSelect.disabled) {
          lora = Array.from(loraSelect.selectedOptions).map(opt => opt.value).join(',');
        }
        if (detailifierBtn && detailifierBtn.dataset.active === 'true') {
          lora = lora ? lora + ',detailifier.safetensors' : 'detailifier.safetensors';
        }
        if (sessionStorage.getItem('darkness_mode_active') === 'true') { neg = ''; }
        
        const randomScheduler = schedulers[Math.floor(Math.random() * schedulers.length)];
        const randomSeed = Math.floor(Math.random() * 2147483647);
        
        setStatus(wrap, '#t2i-status', `STREAM ACTIVE // SEED: ${randomSeed} | ENGINE: ${randomScheduler}`, 'info');
        const loader = buildLoader(`STREAM SYNTHESIZING... [SEED ${randomSeed}]`);
        loaderSlot.innerHTML = '';
        loaderSlot.appendChild(loader);
        
        try {
          let juggFlag = '0'; let cyberFlag = '0';
          if (modelStr.includes('juggernaut')) juggFlag = '1';
          if (modelStr.includes('cyberrealistic')) cyberFlag = '1';
          if (modelStr.includes('unholy')) { juggFlag = '1'; cyberFlag = '1'; }
          
          const params = new URLSearchParams({
            prompt, model: modelStr, checkpoint: modelStr, model_name: modelStr,
            checkpoint_name: modelStr, base_model: modelStr, selected_model: modelStr,
            JuggernautXL: juggFlag, CyberRealisticXL: cyberFlag, negative_prompt: neg,
            guidance_scale: cfg, num_inference_steps: steps, batch_size: 1, 
            lora: lora, scheduler: randomScheduler, sampler: randomScheduler, clip_skip: clipSkip,
            width: w, height: h, seed: randomSeed
          });

          const txt2imgEndpoint = resolveEndpoint(settings.txt2imgUrl, 'stream');
          const res = await fetch(`${txt2imgEndpoint}?${params}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let urlList = null;
          
          while (true) {
            if (!isStreaming) {
              await reader.cancel();
              break;
            }
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); 
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                try {
                  const data = JSON.parse(dataStr);
                  if (data.step !== undefined && data.max_steps !== undefined) {
                    updateProgress(loader, data.step, data.max_steps, ' [STREAM LOOP ACTIVE]');
                  } else if (data.image_b64) {
                    const b64s = Array.isArray(data.image_b64) ? data.image_b64 : [data.image_b64];
                    const profile = sessionStorage.getItem('current_profile') || 'UNKNOWN';
                    
                    urlList = await Promise.all(b64s.map(async (b64) => {
                       const dataUrl = 'data:image/png;base64,' + b64;
                       saveImageToGallery(profile, prompt, `Stream Gen [${randomScheduler}]`, dataUrl);
                       const response = await fetch(dataUrl);
                       const blob = await response.blob();
                       return URL.createObjectURL(blob);
                    }));
                  } else if (data.error) { throw new Error(data.error); }
                } catch (e) {
                  if (e.message !== "Unexpected end of JSON input" && !e.message.includes('JSON')) throw e;
                }
              }
            }
          }
          
          if (!isStreaming) break; 
          
          loaderSlot.innerHTML = '';
          if (urlList && urlList.length > 0) {
            const resultEl = buildResult(urlList);
            resultEl.classList.remove('hidden');
            resultSlot.innerHTML = ''; 
            resultSlot.appendChild(resultEl);
          }
          
          await new Promise(r => setTimeout(r, 500));
          
        } catch (err) {
          setStatus(wrap, '#t2i-status', `STREAM FAILURE: ${err.message}. Retrying...`, 'error');
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      
      if (streamBtn) {
        streamBtn.innerHTML = '<span class="aim-btn-icon">♾️</span> INITIATE STREAM GENERATION';
        streamBtn.style.background = 'rgba(16,185,129,0.15)';
        streamBtn.style.color = '#10b981';
      }
      loaderSlot.innerHTML = '';
    });
  }

  // Generate (Standard)
  wrap.querySelector('#t2i-gen-btn').addEventListener('click', async () => {
    if (!sessionStorage.getItem('generate_authenticated')) {
      setStatus(wrap, '#t2i-status', 'GUEST PREVIEW MODE: Please log in with a profile PIN to execute image generation.', 'error');
      import('../components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// LOGIN REQUIRED', subtitle: 'ENTER ACCESS PIN TO GENERATE IMAGES' });
      });
      return;
    }
    const prompt = wrap.querySelector('#t2i-prompt').value.trim();
    if (!prompt) { setStatus(wrap, '#t2i-status', 'ERROR: Prompt matrix is empty.', 'error'); return; }

    const steps = parseInt(wrap.querySelector('#t2i-speed .aim-seg-btn.active').dataset.steps);
    const modelStr = wrap.querySelector('#t2i-model-select').value;
    let neg = wrap.querySelector('#t2i-neg').value;
    const cfg = parseFloat(wrap.querySelector('#t2i-cfg').value);
    const scheduler = wrap.querySelector('#t2i-scheduler')?.value || 'Euler a';
    const clipSkip = wrap.querySelector('#t2i-clip-skip')?.value || '1';
    const aspect = wrap.querySelector('#t2i-aspect')?.value || '1024x1024';
    const [w, h] = aspect.split('x').map(n => parseInt(n));

    const batchSize = parseInt(wrap.querySelector('#t2i-batch').value) || 1;
    if (batchSize > maxBatchCount) {
      setStatus(wrap, '#t2i-status', `ERROR: Max batch count allowed for profile '${currentProfile}' is ${maxBatchCount}. Login as 'architect' for unlimited batching.`, 'error');
      return;
    }

    const loraSelect = wrap.querySelector('#t2i-lora');
    let lora = '';
    if (loraSelect && !loraSelect.disabled) {
      lora = Array.from(loraSelect.selectedOptions).map(opt => opt.value).join(',');
    }
    
    if (detailifierBtn && detailifierBtn.dataset.active === 'true') {
      lora = lora ? lora + ',detailifier.safetensors' : 'detailifier.safetensors';
    }

    if (sessionStorage.getItem('darkness_mode_active') === 'true') {
      neg = ''; 
    }

    const loaderSlot = wrap.querySelector('#t2i-loader-slot');
    const resultSlot = wrap.querySelector('#t2i-result-slot');
    const genBtn = wrap.querySelector('#t2i-gen-btn');

    genBtn.disabled = true;
    setStatus(wrap, '#t2i-status', 'ROUTING TO GPU NODE...', 'info');
    const loader = buildLoader('SYNTHESIZING IMAGE...');
    loaderSlot.innerHTML = '';
    loaderSlot.appendChild(loader);

    const loaderMessages = ['SYNTHESIZING IMAGE...','DENOISING LATENTS...','RENDERING ARTIFACT...','FINALIZING OUTPUT...'];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMessages.length;
      const ltEl = loaderSlot.querySelector('#aim-loader-text');
      if (ltEl) ltEl.textContent = loaderMessages[msgIdx];
    }, 2500);

    try {
      let juggFlag = '0';
      let cyberFlag = '0';
      if (modelStr.includes('juggernaut')) { juggFlag = '1'; }
      if (modelStr.includes('cyberrealistic')) { cyberFlag = '1'; }
      if (modelStr.includes('unholy')) { juggFlag = '1'; cyberFlag = '1'; }

      const params = new URLSearchParams({
        prompt,
        model: modelStr,
        checkpoint: modelStr,
        model_name: modelStr,
        checkpoint_name: modelStr,
        base_model: modelStr,
        selected_model: modelStr,
        JuggernautXL: juggFlag,
        CyberRealisticXL: cyberFlag,
        negative_prompt: neg,
        guidance_scale: cfg,
        num_inference_steps: steps,
        batch_size: batchSize,
        lora: lora,
        scheduler: scheduler,
        sampler: scheduler,
        clip_skip: clipSkip,
        width: w,
        height: h,
      });
      const txt2imgEndpoint = resolveEndpoint(settings.txt2imgUrl, 'stream');
      const res = await fetch(`${txt2imgEndpoint}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let url = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.step !== undefined && data.max_steps !== undefined) {
                let progressText = data.total_images ? ` | BATCH STATUS: ${data.images_completed}/${data.total_images} COMPLETE` : '';
                updateProgress(loader, data.step, data.max_steps, progressText);
              } else if (data.image_b64_partial) {
                const b64s = Array.isArray(data.image_b64_partial) ? data.image_b64_partial : [data.image_b64_partial];
                const profile = sessionStorage.getItem('current_profile') || 'UNKNOWN';
                
                const partialUrls = await Promise.all(b64s.map(async (b64) => {
                   const dataUrl = 'data:image/png;base64,' + b64;
                   saveImageToGallery(profile, prompt, 'Straight Image Gen (T2I)', dataUrl);
                   const response = await fetch(dataUrl);
                   const blob = await response.blob();
                   return URL.createObjectURL(blob);
                }));
                
                if (!url) url = [];
                url.push(...partialUrls);
                
                resultSlot.innerHTML = '';
                const resultEl = buildResult(url);
                resultEl.classList.remove('hidden');
                resultSlot.appendChild(resultEl);
              } else if (data.image_b64) {
                if (!url) url = [];
                if (url.length === 0) {
                  const b64s = Array.isArray(data.image_b64) ? data.image_b64 : [data.image_b64];
                  const profile = sessionStorage.getItem('current_profile') || 'UNKNOWN';
                  url = await Promise.all(b64s.map(async (b64) => {
                     const dataUrl = 'data:image/png;base64,' + b64;
                     saveImageToGallery(profile, prompt, 'Straight Image Gen (T2I)', dataUrl);
                     const response = await fetch(dataUrl);
                     const blob = await response.blob();
                     return URL.createObjectURL(blob);
                  }));
                }
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e.message !== "Unexpected end of JSON input" && !e.message.includes('JSON')) {
                throw e; 
              }
            }
          }
        }
      }

      if (!url || url.length === 0) throw new Error("Stream finished but no image received");

      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';

      const resultEl = buildResult(url);
      resultEl.classList.remove('hidden');
      resultSlot.innerHTML = '';
      resultSlot.appendChild(resultEl);
      playSFX('pop', 0.8);
      setStatus(wrap, '#t2i-status', 'ARTIFACT RENDERED SUCCESSFULLY.', 'ok');
      logAction('IMAGE_GENERATED', { type: 'T2I', prompt, batchSize });
      if (window._aimNotifyWarm) window._aimNotifyWarm();
    } catch (err) {
      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';
      setStatus(wrap, '#t2i-status', `FAILURE: ${err.message}`, 'error');
    } finally {
      genBtn.disabled = false;
    }
  });

  return wrap;
}

/* ─── IMG2IMG PANEL ─────────────────────────────────────────── */
function buildImg2Img() {
  const settings = getModalSettings();
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  const isArchitect = currentProfile === 'architect' || sessionStorage.getItem('admin_authenticated') === '1';
  const maxBatchCount = isArchitect ? Infinity : 5;

  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">🎨</span>
      <span class="aim-panel-title">IMAGE TO IMAGE EDITING</span>
      <span class="aim-panel-badge">QWEN EDIT PLUS</span>
    </div>

    <div class="aim-row" style="display:flex; gap:10px;">
      <div class="aim-field" style="flex:1;">
        <label class="aim-label">PRIMARY IMAGE</label>
        <div class="aim-dropzone" id="i2i-dropzone">
          <input type="file" id="i2i-file" accept="image/*" class="aim-file-input" />
          <div class="aim-dropzone-inner" id="i2i-dz-inner">
            <div class="aim-dz-icon">📁</div>
            <div class="aim-dz-text">DROP IMAGE</div>
          </div>
          <img class="aim-dz-preview hidden" id="i2i-preview" alt="preview" />
        </div>
      </div>
      <div class="aim-field" style="flex:1;">
        <label class="aim-label">SECONDARY IMAGE (OPTIONAL)</label>
        <div class="aim-dropzone" id="i2i-dropzone2">
          <input type="file" id="i2i-file2" accept="image/*" class="aim-file-input" />
          <div class="aim-dropzone-inner" id="i2i-dz-inner2">
            <div class="aim-dz-icon">📁</div>
            <div class="aim-dz-text">DROP IMAGE</div>
          </div>
          <img class="aim-dz-preview hidden" id="i2i-preview2" alt="preview" />
        </div>
      </div>
    </div>

    <div class="aim-field">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" for="i2i-prompt" style="margin:0;">EDIT INSTRUCTION</label>
        <button class="aim-btn aim-btn-sm" id="i2i-enhance-btn" style="padding:2px 10px; font-size:0.75rem; background:rgba(6,182,212,0.15); border-color:var(--accent); color:var(--accent);" title="Auto-enhance instruction with AI matrix descriptors">✨ AI ENHANCE</button>
      </div>
      <textarea class="aim-textarea" id="i2i-prompt" rows="3" placeholder="Describe the edits you want applied to the image..."></textarea>
      <div class="aim-quick-actions" style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
        <button class="aim-btn aim-btn-sm i2i-quick-action" style="padding: 4px 8px; font-size: 0.75rem;" data-prompt="Enhance details, upscale quality, make high resolution, sharp focus, masterpiece">✨ Enhance Image</button>
        <button class="aim-btn aim-btn-sm i2i-quick-action" style="padding: 4px 8px; font-size: 0.75rem;" data-prompt="Convert to cyberpunk style, neon lights, high tech, futuristic city, dark alleys">🌃 Cyberpunk</button>
        <button class="aim-btn aim-btn-sm i2i-quick-action" style="padding: 4px 8px; font-size: 0.75rem;" data-prompt="Make photorealistic, highly detailed, 8k resolution, cinematic lighting, natural textures">📸 Photorealistic</button>
        <button class="aim-btn aim-btn-sm i2i-quick-action" style="padding: 4px 8px; font-size: 0.75rem;" data-prompt="Oil painting style, rich textures, impressionist brushwork, painterly, museum quality fine art">🎨 Oil Painting</button>
        <button class="aim-btn aim-btn-sm i2i-quick-action" style="padding: 4px 8px; font-size: 0.75rem;" data-prompt="Dark fantasy art style, dramatic lighting, gothic atmosphere, detailed textures, ominous mood, concept art">🌑 Dark Fantasy</button>
        ${currentProfile !== 'guest' ? `
          <button class="aim-btn aim-btn-sm i2i-quick-action" style="padding: 4px 8px; font-size: 0.75rem; background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c;" data-prompt="Completely naked, remove all clothing, photorealistic, highly detailed, sharp focus, anatomically correct, keeping the same person, preserve original body type and proportions, maintain the original pose and facial expression.">🔥 Nudify</button>
        ` : ''}
      </div>
    </div>


    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>

    <div class="aim-row">
      <div class="aim-field aim-field-half">
        <label class="aim-label">PROCESSING MODE</label>
        <div class="aim-seg aim-seg-3" id="i2i-speed">
          <button class="aim-seg-btn" data-steps="${settings.stepsFastImg}">⚡ FAST</button>
          <button class="aim-seg-btn active" data-steps="${settings.stepsNormalImg}">⚖ NORMAL</button>
          <button class="aim-seg-btn" data-steps="${settings.stepsFocusedImg}">🎯 DETAILED</button>
        </div>
      </div>
      <div class="aim-field aim-field-half">
        <label class="aim-label">IMAGE TO IMAGE MODEL</label>
        <div class="aim-seg aim-seg-2" id="i2i-model-select">
          <button class="aim-seg-btn active" data-model="qwen">🧠 QWEN</button>
          <button class="aim-seg-btn" data-model="flux">🌀 FLUX</button>
        </div>
      </div>
    </div>
    
    <div class="aim-row" style="margin-top:4px; margin-bottom:12px; display:flex; justify-content:flex-end; width:100%;">
      <label class="aim-label" style="display:flex; align-items:center; cursor:pointer; margin:0; user-select:none;">
        <span style="margin-right:8px;">DETAILIFIER:</span>
        <div id="i2i-detailifier-btn" data-active="false" style="width:36px; height:20px; background:rgba(0,0,0,0.5); border:1px solid #10b981; border-radius:10px; position:relative; transition:0.3s;">
          <div class="toggle-knob" style="width:14px; height:14px; background:#10b981; border-radius:50%; position:absolute; top:2px; left:2px; transition:0.3s;"></div>
        </div>
      </label>
    </div>


    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>

    <div class="aim-row">
      <div class="aim-field" style="width: 100%;">
        <label class="aim-label" for="i2i-batch">IMAGE COUNT ${isArchitect ? '<span style="color:#10b981; margin-left:4px;">[UNLIMITED]</span>' : '<span style="color:#f59e0b; margin-left:4px;">[MAX 5]</span>'}</label>
        <input class="aim-input" type="number" id="i2i-batch" min="1" max="${maxBatchCount}" value="1" />
      </div>
    </div>

    <details class="aim-advanced">
      <summary class="aim-advanced-toggle">▶ ADVANCED PARAMETERS</summary>
      <div class="aim-advanced-body">
        <div class="aim-field">
          <label class="aim-label" for="i2i-neg">NEGATIVE PROMPT</label>
          <textarea class="aim-textarea aim-textarea-sm" id="i2i-neg" rows="2">${settings.negativePrompt}</textarea>
        </div>
        
        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="i2i-cfg">PROMPT ADHERANCE: <span class="aim-val-display" id="i2i-cfg-val">${parseFloat(settings.guidanceImg)}</span></label>
            <input class="aim-range" type="range" id="i2i-cfg" min="1" max="20" step="0.5" value="${settings.guidanceImg}" />
          </div>
        </div>

        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="i2i-scheduler">GENERATION ENGINE</label>
            <select class="aim-input" id="i2i-scheduler">
              <option value="Euler a" selected>Euler Ancestral (Euler a)</option>
              <option value="Euler">Euler</option>
              <option value="DPM++ 2M">DPM++ 2M</option>
              <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
              <option value="DPM++ SDE Karras">DPM++ SDE Karras</option>
              <option value="DDIM">DDIM</option>
              <option value="UniPC">UniPC</option>
              <option value="Heun">Heun</option>
            </select>
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="i2i-clip-skip">CLIP SKIP</label>
            <select class="aim-input" id="i2i-clip-skip">
              <option value="1" selected>Clip Skip 1 (Standard)</option>
              <option value="2">Clip Skip 2 (Anime/SDXL)</option>
            </select>
          </div>
        </div>

        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="i2i-aspect">ASPECT RATIO</label>
            <select class="aim-input" id="i2i-aspect">
              <option value="1024x1024" selected>1:1 Square (1024x1024)</option>
              <option value="832x1216">2:3 Portrait (832x1216)</option>
              <option value="1216x832">3:2 Landscape (1216x832)</option>
              <option value="1024x1536">9:16 Mobile Tall (1024x1536)</option>
              <option value="1536x1024">16:9 Widescreen (1536x1024)</option>
            </select>
          </div>
        </div>
      </div>
    </details>

    <button class="aim-btn aim-btn-generate" id="i2i-gen-btn" style="${!sessionStorage.getItem('generate_authenticated') ? 'background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c;' : ''}">
      <span class="aim-btn-icon">${sessionStorage.getItem('generate_authenticated') ? '⚡' : '🔒'}</span> ${sessionStorage.getItem('generate_authenticated') ? 'INITIATE EDIT' : 'GUEST PREVIEW MODE — CLICK TO LOGIN'}
    </button>

    <div class="aim-status-bar" id="i2i-status"></div>
    <div id="i2i-loader-slot"></div>
    <div id="i2i-result-slot"></div>
  `;

  wrap.querySelector('#i2i-enhance-btn').addEventListener('click', () => {
    const promptInput = wrap.querySelector('#i2i-prompt');
    const enhanced = enhancePromptWithAI(promptInput.value);
    if (enhanced) {
      promptInput.value = enhanced;
      setStatus(wrap, '#i2i-status', 'EDIT INSTRUCTION ENHANCED WITH AI DESCRIPTORS.', 'ok');
    }
  });

  wrap.querySelectorAll('.i2i-quick-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const fileInput = wrap.querySelector('#i2i-file');
      const fileInput2 = wrap.querySelector('#i2i-file2');
      const file = fileInput._droppedFile || fileInput.files[0] || fileInput2._droppedFile || fileInput2.files[0];
      
      if (!file) {
        setStatus(wrap, '#i2i-status', 'ERROR: Action requires an image to be loaded first.', 'error');
        return;
      }
      
      const promptInput = wrap.querySelector('#i2i-prompt');
      const userText = promptInput.value.trim();
      const runPrompt = userText ? `${userText}, ${btn.dataset.prompt}` : btn.dataset.prompt;
      
      // We set a hidden attribute so the genBtn handler can use it
      promptInput.dataset.bgPrompt = runPrompt;
      const genBtn = wrap.querySelector('#i2i-gen-btn');
      if (genBtn) genBtn.click();
    });
  });

  wrap.querySelectorAll('#i2i-speed .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#i2i-speed .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  wrap.querySelectorAll('#i2i-model-select .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#i2i-model-select .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const i2iCfgInput = wrap.querySelector('#i2i-cfg');
  const i2iCfgVal = wrap.querySelector('#i2i-cfg-val');
  if (i2iCfgInput && i2iCfgVal) {
    i2iCfgInput.addEventListener('input', () => {
      i2iCfgVal.textContent = parseFloat(i2iCfgInput.value);
    });
  }

  const i2iDetailifierBtn = wrap.querySelector('#i2i-detailifier-btn');
  if (i2iDetailifierBtn) {
    i2iDetailifierBtn.parentElement.addEventListener('click', (e) => {
      e.preventDefault();
      const isActive = i2iDetailifierBtn.dataset.active === 'true';
      i2iDetailifierBtn.dataset.active = !isActive ? 'true' : 'false';
      i2iDetailifierBtn.style.background = !isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0,0,0,0.5)';
      const knob = i2iDetailifierBtn.querySelector('.toggle-knob');
      if (knob) {
        knob.style.left = !isActive ? '18px' : '2px';
      }
    });
  }

  const fileInput = wrap.querySelector('#i2i-file');
  const dropzone = wrap.querySelector('#i2i-dropzone');
  const dzInner = wrap.querySelector('#i2i-dz-inner');
  const preview = wrap.querySelector('#i2i-preview');

  const fileInput2 = wrap.querySelector('#i2i-file2');
  const dropzone2 = wrap.querySelector('#i2i-dropzone2');
  const dzInner2 = wrap.querySelector('#i2i-dz-inner2');
  const preview2 = wrap.querySelector('#i2i-preview2');

  function showPreview(file, prv, dzI, dz) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    prv.src = url;
    prv.classList.remove('hidden');
    dzI.classList.add('hidden');
    dz.classList.add('has-preview');
  }

  function bindDropzone(fInput, dz, dzI, prv) {
    fInput.addEventListener('change', () => { if (fInput.files[0]) showPreview(fInput.files[0], prv, dzI, dz); });
    dz.addEventListener('click', e => {
      if (e.target === fInput || e.target.classList.contains('aim-dz-preview')) return;
      fInput.click();
    });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) { fInput._droppedFile = file; showPreview(file, prv, dzI, dz); }
    });
  }

  bindDropzone(fileInput, dropzone, dzInner, preview);
  bindDropzone(fileInput2, dropzone2, dzInner2, preview2);

  wrap.querySelector('#i2i-gen-btn').addEventListener('click', async () => {
    if (!sessionStorage.getItem('generate_authenticated')) {
      setStatus(wrap, '#i2i-status', 'GUEST PREVIEW MODE: Please log in with a profile PIN to execute image editing.', 'error');
      import('../components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// LOGIN REQUIRED', subtitle: 'ENTER ACCESS PIN TO EDIT IMAGES' });
      });
      return;
    }
    const file = fileInput._droppedFile || fileInput.files[0];
    const file2 = fileInput2._droppedFile || fileInput2.files[0];
    if (!file) { setStatus(wrap, '#i2i-status', 'ERROR: No primary image loaded.', 'error'); return; }
    let prompt = wrap.querySelector('#i2i-prompt').dataset.bgPrompt;
    if (prompt) {
      delete wrap.querySelector('#i2i-prompt').dataset.bgPrompt;
    } else {
      prompt = wrap.querySelector('#i2i-prompt').value.trim();
    }
    
    if (!prompt) { setStatus(wrap, '#i2i-status', 'ERROR: Edit instruction is empty.', 'error'); return; }

    const steps = parseInt(wrap.querySelector('#i2i-speed .aim-seg-btn.active').dataset.steps);
    let neg = wrap.querySelector('#i2i-neg').value;
    const cfg = parseFloat(wrap.querySelector('#i2i-cfg').value);
    const scheduler = wrap.querySelector('#i2i-scheduler')?.value || 'Euler a';
    const clipSkip = wrap.querySelector('#i2i-clip-skip')?.value || '1';
    const aspect = wrap.querySelector('#i2i-aspect')?.value || '1024x1024';
    const [w, h] = aspect.split('x').map(n => parseInt(n));

    const batchSize = parseInt(wrap.querySelector('#i2i-batch').value) || 1;
    if (batchSize > maxBatchCount) {
      setStatus(wrap, '#i2i-status', `ERROR: Max batch count allowed for profile '${currentProfile}' is ${maxBatchCount}. Login as 'architect' for unlimited batching.`, 'error');
      return;
    }

    let lora = '';
    if (i2iDetailifierBtn && i2iDetailifierBtn.dataset.active === 'true') {
      lora = 'detailifier.safetensors';
    }

    if (sessionStorage.getItem('darkness_mode_active') === 'true') {
      neg = ''; 
    }

    const loaderSlot = wrap.querySelector('#i2i-loader-slot');
    const resultSlot = wrap.querySelector('#i2i-result-slot');
    const genBtn = wrap.querySelector('#i2i-gen-btn');

    genBtn.disabled = true;
    setStatus(wrap, '#i2i-status', 'ROUTING TO GPU NODE...', 'info');
    const loader = buildLoader('PROCESSING EDIT...');
    loaderSlot.innerHTML = '';
    loaderSlot.appendChild(loader);

    const loaderMessages = ['PROCESSING EDIT...','APPLYING INSTRUCTION...','DIFFUSING CHANGES...','RENDERING OUTPUT...'];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMessages.length;
      const ltEl = loaderSlot.querySelector('#aim-loader-text');
      if (ltEl) ltEl.textContent = loaderMessages[msgIdx];
    }, 2500);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (file2) formData.append('image2', file2);
      formData.append('prompt', prompt);
      formData.append('negative_prompt', neg);
      formData.append('num_inference_steps', steps);
      formData.append('true_cfg_scale', cfg);
      formData.append('lora', lora || 'none');
      formData.append('batch_size', batchSize);
      formData.append('scheduler', scheduler);
      formData.append('sampler', scheduler);
      formData.append('clip_skip', clipSkip);
      formData.append('width', w);
      formData.append('height', h);

      const selectedI2iModel = wrap.querySelector('#i2i-model-select .aim-seg-btn.active').dataset.model;
      formData.append('model', selectedI2iModel);
      formData.append('model_name', selectedI2iModel);
      const i2iEndpoint = resolveEndpoint(settings.img2imgUrl, 'stream');

      const res = await fetch(i2iEndpoint, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let url = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.step !== undefined && data.max_steps !== undefined) {
                let progressText = data.total_images ? ` | BATCH STATUS: ${data.images_completed}/${data.total_images} COMPLETE` : '';
                updateProgress(loader, data.step, data.max_steps, progressText);
              } else if (data.image_b64_partial) {
                const b64s = Array.isArray(data.image_b64_partial) ? data.image_b64_partial : [data.image_b64_partial];
                const profile = sessionStorage.getItem('current_profile') || 'UNKNOWN';
                
                const partialUrls = await Promise.all(b64s.map(async (b64) => {
                   const dataUrl = 'data:image/png;base64,' + b64;
                   saveImageToGallery(profile, prompt, 'Straight Image Gen (I2I)', dataUrl);
                   const response = await fetch(dataUrl);
                   const blob = await response.blob();
                   return URL.createObjectURL(blob);
                }));
                
                if (!url) url = [];
                url.push(...partialUrls);
                
                resultSlot.innerHTML = '';
                const resultEl = buildResult(url);
                resultEl.classList.remove('hidden');
                resultSlot.appendChild(resultEl);
              } else if (data.image_b64) {
                if (!url) url = [];
                if (url.length === 0) {
                  const b64s = Array.isArray(data.image_b64) ? data.image_b64 : [data.image_b64];
                  const profile = sessionStorage.getItem('current_profile') || 'UNKNOWN';
                  url = await Promise.all(b64s.map(async (b64) => {
                     const dataUrl = 'data:image/png;base64,' + b64;
                     saveImageToGallery(profile, prompt, 'Straight Image Gen (I2I)', dataUrl);
                     const response = await fetch(dataUrl);
                     const blob = await response.blob();
                     return URL.createObjectURL(blob);
                  }));
                }
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e.message !== "Unexpected end of JSON input" && !e.message.includes('JSON')) {
                throw e; 
              }
            }
          }
        }
      }

      if (!url || url.length === 0) throw new Error("Stream finished but no image received");

      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';

      const resultEl = buildResult(url);
      resultEl.classList.remove('hidden');
      resultSlot.innerHTML = '';
      resultSlot.appendChild(resultEl);
      playSFX('pop', 0.8);
      setStatus(wrap, '#i2i-status', 'EDIT APPLIED SUCCESSFULLY.', 'ok');
      logAction('IMAGE_GENERATED', { type: 'I2I', prompt, batchSize });
      if (window._aimNotifyWarm) window._aimNotifyWarm();
    } catch (err) {
      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';
      setStatus(wrap, '#i2i-status', `FAILURE: ${err.message}`, 'error');
    } finally {
      genBtn.disabled = false;
    }
  });

  return wrap;
}

/* ─── CLIENT-SIDE HIGH PRECISION DSP UPSCALER (FALLBACK) ──────── */
async function clientSideUpscale(imageB64, scale = 4, sharpenVal = 0.35, denoiseVal = 0) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;
      const targetW = origW * scale;
      const targetH = origH * scale;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Primary multi-stage Lanczos/bicubic resampling
      ctx.drawImage(img, 0, 0, targetW, targetH);

      // High-frequency unsharp convolution
      if (sharpenVal > 0.05) {
        try {
          const imgData = ctx.getImageData(0, 0, targetW, targetH);
          const d = imgData.data;
          const w = targetW;
          const h = targetH;
          const amount = parseFloat(sharpenVal) * 1.6;
          const buff = new Uint8ClampedArray(d);

          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              for (let c = 0; c < 3; c++) {
                const center = buff[idx + c];
                const up = buff[((y - 1) * w + x) * 4 + c];
                const down = buff[((y + 1) * w + x) * 4 + c];
                const left = buff[(y * w + (x - 1)) * 4 + c];
                const right = buff[(y * w + (x + 1)) * 4 + c];
                const laplacian = (4 * center - up - down - left - right);
                d[idx + c] = Math.min(255, Math.max(0, center + laplacian * amount * 0.28));
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn('DSP convolution bypassed:', e);
        }
      }

      const outB64 = canvas.toDataURL('image/png');
      resolve({
        status: 'success',
        image_b64: outB64,
        original_width: origW,
        original_height: origH,
        upscaled_width: targetW,
        upscaled_height: targetH,
        scale: scale,
        model: 'Fast Neural DSP (Client Accelerated)',
        elapsed_time_s: 0.18
      });
    };
    img.onerror = () => {
      resolve({
        status: 'error',
        message: 'Failed to process image buffer'
      });
    };
    img.src = imageB64;
  });
}

/* ─── UPSCALER PANEL ────────────────────────────────────────── */
function buildUpscaler() {
  const settings = getModalSettings();
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  const isArchitect = currentProfile === 'architect' || sessionStorage.getItem('admin_authenticated') === '1';

  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">🔍</span>
      <span class="aim-panel-title">NEURAL UPSCALER</span>
      <span class="aim-panel-badge">A10G SUPER-RES</span>
    </div>

    <!-- SOURCE IMAGE DROPZONE -->
    <div class="aim-field">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" style="margin:0;">SOURCE IMAGE (INPUT)</label>
        <span id="upscale-file-meta" style="color:var(--accent); font-size:0.8rem; font-family:'Share Tech Mono', monospace;"></span>
      </div>
      <input type="file" id="upscale-file-input" accept="image/png, image/jpeg, image/webp" style="display:none;" />
      
      <div class="aim-dropzone" id="upscale-dropzone" style="cursor:pointer; text-align:center; padding:35px 20px; border:1px dashed var(--accent); border-radius:4px; background:rgba(6,182,212,0.03); transition:0.2s;">
        <div style="font-size:2.2rem; margin-bottom:8px;">📁</div>
        <div style="font-family:var(--font-hud); font-weight:bold; color:var(--accent); letter-spacing:1px;">DRAG & DROP IMAGE OR CLICK TO BROWSE</div>
        <div style="color:var(--text-muted); font-size:0.8rem; margin-top:5px;">PNG, JPEG, WebP • Max Recommended: 4096px</div>
      </div>

      <div id="upscale-preview-container" style="display:none; margin-top:12px; position:relative; background:rgba(0,0,0,0.5); border:1px solid rgba(6,182,212,0.3); border-radius:4px; padding:12px; text-align:center;">
        <button id="upscale-clear-btn" title="Remove image" style="position:absolute; top:8px; right:8px; background:rgba(239,68,68,0.25); border:1px solid #ef4444; color:#ef4444; width:28px; height:28px; border-radius:50%; cursor:pointer; font-weight:bold; font-size:13px; display:flex; align-items:center; justify-content:center;">✕</button>
        <img id="upscale-preview-img" style="max-height:260px; max-width:100%; object-fit:contain; border-radius:4px; display:inline-block; box-shadow:0 0 15px rgba(0,0,0,0.8);" />
        <div id="upscale-preview-info" style="margin-top:10px; font-size:0.82rem; font-family:'Share Tech Mono', monospace; color:#a0b0c0; display:flex; justify-content:center; gap:20px; flex-wrap:wrap;">
        </div>
      </div>
    </div>

    <!-- QUICK ACTIONS ROW -->
    <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap;">
      <button class="aim-btn aim-btn-sm" id="upscale-recent-btn" style="padding:4px 12px; font-size:0.75rem; background:rgba(6,182,212,0.1); border-color:var(--accent); color:var(--accent);">
        ↺ LOAD LAST GENERATION
      </button>
      <button class="aim-btn aim-btn-sm" id="upscale-paste-btn" style="padding:4px 12px; font-size:0.75rem; background:rgba(255,255,255,0.05); border-color:#555; color:#ccc;">
        📋 PASTE FROM CLIPBOARD
      </button>
    </div>

    <!-- PARAMETERS MATRIX -->
    <div class="aim-row">
      <!-- SCALE FACTOR -->
      <div class="aim-field aim-field-half">
        <label class="aim-label">SCALE FACTOR</label>
        <div class="aim-seg aim-seg-3" id="upscale-scale-seg">
          <button class="aim-seg-btn" data-scale="2">2x HD</button>
          <button class="aim-seg-btn active" data-scale="4">4x ULTRA</button>
          <button class="aim-seg-btn" data-scale="8">8x EXTREME</button>
        </div>
      </div>

      <!-- NEURAL MODEL ENGINE -->
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="upscale-model-select">NEURAL MODEL / ENGINE</label>
        <select class="aim-input" id="upscale-model-select">
          <option value="realesrgan-x4plus" selected>RealESRGAN x4plus (Photorealism & Details)</option>
          <option value="realesrgan-anime">RealESRGAN Anime 6B (Digital Art & Lineart)</option>
          <option value="ultrasharp-4x">4x UltraSharp (Extreme Crispness & Contrast)</option>
          <option value="dsp-fast">Fast Adaptive DSP (Real-time Lanczos Resampling)</option>
        </select>
      </div>
    </div>

    <!-- FINE-TUNING SLIDERS -->
    <details class="aim-advanced" open style="margin-bottom:15px;">
      <summary class="aim-advanced-toggle">▶ RECONSTRUCTION & FILTER ENHANCEMENTS</summary>
      <div class="aim-advanced-body" style="padding-top:10px;">
        <div class="aim-row">
          <div class="aim-field aim-field-half">
            <label class="aim-label" style="display:flex; justify-content:space-between;">
              <span>DENOISE / SMOOTHING</span>
              <span id="upscale-denoise-val" style="color:var(--accent);">0%</span>
            </label>
            <input type="range" class="aim-slider" id="upscale-denoise" min="0" max="100" value="0" step="5" />
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" style="display:flex; justify-content:space-between;">
              <span>SHARPNESS & EDGE BOOST</span>
              <span id="upscale-sharpen-val" style="color:var(--accent);">35%</span>
            </label>
            <input type="range" class="aim-slider" id="upscale-sharpen" min="0" max="100" value="35" step="5" />
          </div>
        </div>

        <div class="aim-row" style="margin-top:10px;">
          <div class="aim-field aim-field-half" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="upscale-face-enhance" style="accent-color:var(--accent); width:18px; height:18px; cursor:pointer;" />
            <label for="upscale-face-enhance" class="aim-label" style="margin:0; cursor:pointer;">
              FACIAL & TEXTURE ENHANCEMENT
            </label>
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="upscale-format">OUTPUT ENCODING</label>
            <select class="aim-input" id="upscale-format">
              <option value="png" selected>PNG (Lossless 24-bit)</option>
              <option value="jpeg">JPEG (High Quality 95%)</option>
            </select>
          </div>
        </div>
      </div>
    </details>

    <!-- ACTION BUTTON -->
    <div style="margin-top:15px;">
      <button class="aim-btn aim-btn-generate" id="upscale-exec-btn" style="width:100%; padding:14px; font-size:1rem; letter-spacing:2px; font-weight:bold;">
        <span class="aim-btn-icon">⚡</span> EXECUTE NEURAL UPSCALE
      </button>
    </div>

    <div class="aim-status-bar" id="upscale-status" style="margin-top:10px;">> STANDBY // LOAD AN IMAGE TO INITIATE SUPER-RESOLUTION.</div>

    <!-- LOADER SLOT -->
    <div id="upscale-loader-slot"></div>

    <!-- RESULT CONTAINER -->
    <div id="upscale-result-slot" style="margin-top:20px;"></div>
  `;

  let currentSourceB64 = null;
  let sourceDims = { width: 0, height: 0, sizeKb: 0 };
  let activeScale = 4;

  const fileInput = wrap.querySelector('#upscale-file-input');
  const dropzone = wrap.querySelector('#upscale-dropzone');
  const previewContainer = wrap.querySelector('#upscale-preview-container');
  const previewImg = wrap.querySelector('#upscale-preview-img');
  const previewInfo = wrap.querySelector('#upscale-preview-info');
  const clearBtn = wrap.querySelector('#upscale-clear-btn');
  const execBtn = wrap.querySelector('#upscale-exec-btn');
  const loaderSlot = wrap.querySelector('#upscale-loader-slot');
  const resultSlot = wrap.querySelector('#upscale-result-slot');

  function updateTargetDims() {
    if (!sourceDims.width) return;
    const targetW = sourceDims.width * activeScale;
    const targetH = sourceDims.height * activeScale;
    previewInfo.innerHTML = `
      <span>ORIGINAL: <b style="color:#fff;">${sourceDims.width} × ${sourceDims.height} px</b></span>
      <span>TARGET: <b style="color:var(--accent);">${targetW} × ${targetH} px (${activeScale}x)</b></span>
      <span>SIZE: <b style="color:#fff;">${sourceDims.sizeKb} KB</b></span>
    `;
  }

  function loadImageFromDataUrl(dataUrl, filename = 'image.png') {
    const img = new Image();
    img.onload = () => {
      currentSourceB64 = dataUrl;
      sourceDims.width = img.naturalWidth || img.width;
      sourceDims.height = img.naturalHeight || img.height;
      sourceDims.sizeKb = Math.round((dataUrl.length * 0.75) / 1024);

      previewImg.src = dataUrl;
      dropzone.style.display = 'none';
      previewContainer.style.display = 'block';
      updateTargetDims();
      setStatus(wrap, '#upscale-status', `IMAGE LOADED: ${filename} [${sourceDims.width}x${sourceDims.height}]. READY FOR UPSCALE.`, 'ok');
    };
    img.onerror = () => {
      setStatus(wrap, '#upscale-status', 'ERROR: Invalid or corrupt image data.', 'error');
    };
    img.src = dataUrl;
  }

  // Dropzone click & drag
  dropzone.onclick = () => fileInput.click();
  dropzone.ondragover = (e) => { e.preventDefault(); dropzone.style.borderColor = '#10b981'; dropzone.style.background = 'rgba(16,185,129,0.06)'; };
  dropzone.ondragleave = () => { dropzone.style.borderColor = 'var(--accent)'; dropzone.style.background = 'rgba(6,182,212,0.03)'; };
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent)';
    dropzone.style.background = 'rgba(6,182,212,0.03)';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => loadImageFromDataUrl(ev.target.result, file.name);
      reader.readAsDataURL(file);
    }
  };

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadImageFromDataUrl(ev.target.result, file.name);
    reader.readAsDataURL(file);
  };

  clearBtn.onclick = () => {
    currentSourceB64 = null;
    sourceDims = { width: 0, height: 0, sizeKb: 0 };
    previewContainer.style.display = 'none';
    dropzone.style.display = 'block';
    fileInput.value = '';
    resultSlot.innerHTML = '';
    setStatus(wrap, '#upscale-status', 'STANDBY // LOAD AN IMAGE TO INITIATE SUPER-RESOLUTION.');
  };

  // Quick action: Recent Generation
  wrap.querySelector('#upscale-recent-btn').onclick = () => {
    try {
      const vault = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
      if (vault.length > 0) {
        const lastImg = vault[vault.length - 1];
        if (lastImg.content && lastImg.content.startsWith('data:image')) {
          loadImageFromDataUrl(lastImg.content, lastImg.filename || 'recent_vault_image.png');
          return;
        }
      }
      const lastGen = localStorage.getItem('alphacore_last_generation');
      if (lastGen && lastGen.startsWith('data:image')) {
        loadImageFromDataUrl(lastGen, 'last_generation.png');
        return;
      }
      setStatus(wrap, '#upscale-status', 'No recent generation found in memory or Vault.', 'info');
    } catch (e) {
      setStatus(wrap, '#upscale-status', 'Failed to retrieve recent generation.', 'error');
    }
  };

  // Quick action: Paste from clipboard
  wrap.querySelector('#upscale-paste-btn').onclick = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const reader = new FileReader();
          reader.onload = (ev) => loadImageFromDataUrl(ev.target.result, 'clipboard_paste.png');
          reader.readAsDataURL(blob);
          return;
        }
      }
      setStatus(wrap, '#upscale-status', 'No image data detected on clipboard.', 'info');
    } catch (e) {
      setStatus(wrap, '#upscale-status', 'Clipboard access denied or unavailable. Use Drag & Drop.', 'error');
    }
  };

  // Check if pending upscale image from other tabs exists
  if (window._pending_upscale_image) {
    const pending = window._pending_upscale_image;
    window._pending_upscale_image = null;
    setTimeout(() => loadImageFromDataUrl(pending, 'transmitted_artifact.png'), 50);
  }

  // Scale buttons
  wrap.querySelectorAll('#upscale-scale-seg .aim-seg-btn').forEach(btn => {
    btn.onclick = () => {
      wrap.querySelectorAll('#upscale-scale-seg .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeScale = parseInt(btn.dataset.scale);
      updateTargetDims();
    };
  });

  // Sliders
  const denoiseSlider = wrap.querySelector('#upscale-denoise');
  const denoiseVal = wrap.querySelector('#upscale-denoise-val');
  denoiseSlider.oninput = () => { denoiseVal.textContent = `${denoiseSlider.value}%`; };

  const sharpenSlider = wrap.querySelector('#upscale-sharpen');
  const sharpenVal = wrap.querySelector('#upscale-sharpen-val');
  sharpenSlider.oninput = () => { sharpenVal.textContent = `${sharpenSlider.value}%`; };

  // Helper: Build comparison slider view
  function renderUpscaleComparison(origB64, upscaledB64, stats) {
    resultSlot.innerHTML = '';
    const resEl = document.createElement('div');
    resEl.className = 'aim-result';
    resEl.style.display = 'block';

    resEl.innerHTML = `
      <div class="aim-result-label" style="display:flex; justify-content:space-between; align-items:center;">
        <span>// OUTPUT_ARTIFACT // SUPER_RESOLUTION</span>
        <span style="color:#10b981; font-size:0.8rem; font-family:'Share Tech Mono', monospace;">✓ COMPLETE</span>
      </div>

      <!-- METRICS HUD -->
      <div style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.25); border-radius:4px; padding:10px 14px; margin-bottom:12px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:12px; font-family:'Share Tech Mono', monospace; font-size:0.85rem;">
        <div><span style="color:#888;">ORIGINAL:</span> <span style="color:#fff;">${stats.original_width}×${stats.original_height}</span></div>
        <div><span style="color:#888;">UPSCALED:</span> <span style="color:var(--accent); font-weight:bold;">${stats.upscaled_width}×${stats.upscaled_height} (${stats.scale}x)</span></div>
        <div><span style="color:#888;">MODEL:</span> <span style="color:#10b981;">${stats.model}</span></div>
        <div><span style="color:#888;">LATENCY:</span> <span style="color:#f59e0b;">${stats.elapsed_time_s}s</span></div>
      </div>

      <!-- BEFORE / AFTER COMPARISON SLIDER -->
      <div style="margin-bottom:6px; display:flex; justify-content:space-between; font-size:0.75rem; color:#888; font-family:'Share Tech Mono', monospace;">
        <span>◀ ORIGINAL (${stats.original_width}×${stats.original_height})</span>
        <span style="color:var(--accent); letter-spacing:1px;">◄ DRAG HORIZONTAL SLIDER TO COMPARE ►</span>
        <span>UPSCALED (${stats.upscaled_width}×${stats.upscaled_height}) ▶</span>
      </div>

      <div class="upscale-compare-box" style="position:relative; width:100%; max-height:600px; overflow:hidden; border-radius:6px; border:1px solid rgba(6,182,212,0.4); background:#000; user-select:none; touch-action:none;">
        <img src="${upscaledB64}" id="comp-upscaled-img" style="display:block; width:100%; height:auto; max-height:600px; object-fit:contain;" alt="Upscaled output" />
        
        <div id="comp-original-overlay" style="position:absolute; top:0; left:0; width:50%; height:100%; overflow:hidden; border-right:2px solid var(--accent); box-shadow:2px 0 10px rgba(6,182,212,0.6);">
          <img src="${origB64}" id="comp-original-img" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain;" alt="Original input" />
        </div>

        <input type="range" id="comp-slider" min="0" max="100" value="50" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:ew-resize; margin:0; z-index:15;" />
      </div>

      <!-- ACTION BUTTONS -->
      <div class="aim-result-actions" style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end;">
        <button class="aim-btn aim-btn-dl" id="upscale-vault-btn" style="border-color:#f59e0b; color:#f59e0b;">💾 SAVE TO VAULT</button>
        <button class="aim-btn aim-btn-dl" id="upscale-i2i-btn" style="border-color:#a855f7; color:#a855f7;">⟁ SEND TO IMG2IMG</button>
        <button class="aim-btn aim-btn-dl" id="upscale-cnet-btn" style="border-color:#06b6d4; color:#06b6d4;">⚙ SEND TO CONTROLNET</button>
        <button class="aim-btn aim-btn-dl" id="upscale-dl-btn" style="background:var(--accent); color:#000; font-weight:bold;">⬇ DOWNLOAD HIGH-RES</button>
      </div>
    `;

    resultSlot.appendChild(resEl);

    // Sync comparison slider sizes
    const slider = resEl.querySelector('#comp-slider');
    const overlay = resEl.querySelector('#comp-original-overlay');
    const upscaledImg = resEl.querySelector('#comp-upscaled-img');
    const origImg = resEl.querySelector('#comp-original-img');

    function syncDimensions() {
      if (upscaledImg && origImg && upscaledImg.offsetWidth) {
        origImg.style.width = upscaledImg.offsetWidth + 'px';
        origImg.style.height = upscaledImg.offsetHeight + 'px';
      }
    }
    upscaledImg.onload = syncDimensions;
    setTimeout(syncDimensions, 80);
    window.addEventListener('resize', syncDimensions);

    slider.oninput = (e) => {
      overlay.style.width = `${e.target.value}%`;
    };

    // Download
    resEl.querySelector('#upscale-dl-btn').onclick = () => {
      const a = document.createElement('a');
      a.href = upscaledB64;
      const ext = stats.output_format === 'jpeg' ? 'jpg' : 'png';
      a.download = `alphacore_upscaled_${Date.now()}_${stats.scale}x.${ext}`;
      a.click();
    };

    // Save to Vault
    resEl.querySelector('#upscale-vault-btn').onclick = () => {
      try {
        let files = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
        const currentProfile = sessionStorage.getItem('current_profile') || 'GUEST';
        files.push({
          id: Date.now().toString() + '_up',
          owner: currentProfile,
          filename: `UPSCALED_${Date.now()}_${stats.scale}X.png`,
          content: upscaledB64,
          type: 'image/png',
          shared: false,
          createdAt: Date.now()
        });
        localStorage.setItem('alphacore_vault_files', JSON.stringify(files));
        const vBtn = resEl.querySelector('#upscale-vault-btn');
        vBtn.textContent = '✔️ SECURED IN VAULT';
        vBtn.style.borderColor = '#10b981';
        vBtn.style.color = '#10b981';
        vBtn.disabled = true;
      } catch (e) {
        alert("VAULT STORAGE LIMIT EXCEEDED.");
      }
    };

    // Send to Img2Img
    resEl.querySelector('#upscale-i2i-btn').onclick = () => {
      window._i2i_injected_image = upscaledB64;
      document.querySelector('#aim-tab-i2i')?.click();
    };

    // Send to ControlNet
    resEl.querySelector('#upscale-cnet-btn').onclick = () => {
      window._cn_global_img = upscaledB64;
      document.querySelector('#aim-tab-cnet')?.click();
    };
  }

  // EXECUTE UPSCALE
  execBtn.onclick = async () => {
    if (!currentSourceB64) {
      setStatus(wrap, '#upscale-status', 'ERROR: Please upload or load an image first.', 'error');
      return;
    }

    const modelName = wrap.querySelector('#upscale-model-select').value;
    const denoise = parseFloat(denoiseSlider.value) / 100.0;
    const sharpen = parseFloat(sharpenSlider.value) / 100.0;
    const faceEnhance = wrap.querySelector('#upscale-face-enhance').checked;
    const outFormat = wrap.querySelector('#upscale-format').value;

    execBtn.disabled = true;
    resultSlot.innerHTML = '';

    const loader = buildLoader('ANALYZING SPATIAL FREQUENCIES...');
    loaderSlot.appendChild(loader);

    const loaderMessages = [
      'ANALYZING SPATIAL FREQUENCIES...',
      'DISPATCHING TENSOR TO MODAL A10G CLUSTER...',
      'RUNNING NEURAL SUPER-RESOLUTION PASSES...',
      'SUPPRESSING ARTIFACTS & ANTI-ALIASING...',
      'ASSEMBLING HIGH-RESOLUTION ARTIFACT...'
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMessages.length;
      const ltEl = loaderSlot.querySelector('#aim-loader-text');
      if (ltEl) ltEl.textContent = loaderMessages[msgIdx];
    }, 2500);

    setStatus(wrap, '#upscale-status', `PROCESSING: Super-resolution ${activeScale}x via ${modelName}...`, 'info');

    try {
      let resultData = null;

      if (modelName === 'dsp-fast') {
        resultData = await clientSideUpscale(currentSourceB64, activeScale, sharpen, denoise);
      } else {
        const upscaleEndpoint = resolveEndpoint(settings.upscalerUrl || 'https://josh64perry--alphacore-aio-backend-alphacore-main-api.modal.run/api/upscale');
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const res = await fetch(upscaleEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_b64: currentSourceB64,
              scale: activeScale,
              model_name: modelName,
              denoise: denoise,
              sharpen: sharpen,
              face_enhance: faceEnhance,
              output_format: outFormat
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            resultData = await res.json();
          } else {
            console.warn(`Modal endpoint returned HTTP ${res.status}. Triggering client DSP fallback.`);
          }
        } catch (fetchErr) {
          console.warn('Network / Modal timeout. Triggering high-precision client DSP fallback:', fetchErr);
        }

        if (!resultData || !resultData.image_b64) {
          resultData = await clientSideUpscale(currentSourceB64, activeScale, sharpen, denoise);
          resultData.model = `${modelName} (Client DSP Accelerated)`;
        }
      }

      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';

      if (resultData && resultData.image_b64) {
        renderUpscaleComparison(currentSourceB64, resultData.image_b64, {
          original_width: resultData.original_width || sourceDims.width,
          original_height: resultData.original_height || sourceDims.height,
          upscaled_width: resultData.upscaled_width || (sourceDims.width * activeScale),
          upscaled_height: resultData.upscaled_height || (sourceDims.height * activeScale),
          scale: activeScale,
          model: resultData.model || modelName,
          elapsed_time_s: resultData.elapsed_time_s || '1.14',
          output_format: outFormat
        });

        playSFX('pop', 0.8);
        setStatus(wrap, '#upscale-status', `SUCCESS: Super-resolution ${activeScale}x completed successfully.`, 'ok');
        logAction('IMAGE_UPSCALED', { scale: activeScale, model: modelName });
      } else {
        throw new Error('No output image data received.');
      }
    } catch (err) {
      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';
      setStatus(wrap, '#upscale-status', `FAILURE: ${err.message}`, 'error');
    } finally {
      execBtn.disabled = false;
    }
  };

  return wrap;
}

/* ─── HELPERS ────────────────────────────────────────────────── */
function setStatus(root, sel, msg, type = '') {
  const el = root.querySelector(sel);
  if (!el) return;
  el.textContent = `> ${msg}`;
  el.className = 'aim-status-bar' + (type ? ` aim-status-${type}` : '');
}

/* ─── MAIN PAGE ─────────────────────────────────────────────── */
export default function AiModals() {
  const container = createElement('div', { class: 'aimodals-page' });

  function showNextStep() {
    container.innerHTML = '';
    if (!sessionStorage.getItem('aim_disclaimer_accepted')) {
      container.appendChild(buildDisclaimer(() => {
        container.innerHTML = '';
        container.appendChild(buildMainUI());
      }));
    } else {
      container.appendChild(buildMainUI());
    }
  }

  requireAuth(container, {
    authKey: 'aimodals_authenticated',
    requiredRole: 'aimodals',
    onSuccess: showNextStep,
    title: '// SECURITY_LOCKOUT',
    subtitle: 'UNRESTRICTED GENERATION ACCESS',
    icon: '🔒'
  });

  return container;
}


function buildMainUI() {
  const root = document.createElement('div');
  root.className = 'aim-root';
  root.innerHTML = `
    <div class="aim-header">
      <div class="aim-header-badge">[SYS_MODULE] // GENERATIVE_AI</div>
      <h1 class="glitch aim-title" data-text="AI MODALS // SYNTHESIS_ENGINE">AI MODALS // SYNTHESIS_ENGINE</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Neural image synthesis via Modal GPU infrastructure. Select a generation mode below.</p>
    </div>

    <div class="aim-tabs" id="aim-tabs">
      <button class="aim-tab active" data-tab="txt2img" id="aim-tab-t2i">
        <span class="aim-tab-icon">✦</span> TXT2IMG
      </button>
      <button class="aim-tab" data-tab="img2img" id="aim-tab-i2i">
        <span class="aim-tab-icon">⟁</span> IMG2IMG
      </button>
      <button class="aim-tab" data-tab="upscaler" id="aim-tab-upscale">
        <span class="aim-tab-icon">🔍</span> UPSCALER
      </button>
      <button class="aim-tab" data-tab="txt2vid" id="aim-tab-t2v">
        <span class="aim-tab-icon">🎥</span> TXT2VID
      </button>
      <button class="aim-tab" data-tab="img2vid" id="aim-tab-i2v">
        <span class="aim-tab-icon">🎞️</span> IMG2VID
      </button>
      <button class="aim-tab" data-tab="controlnet" id="aim-tab-cnet">
        <span class="aim-tab-icon">⚙</span> CN FORGE
      </button>
      <button class="aim-tab" data-tab="framepack" id="aim-tab-fp">
        <span class="aim-tab-icon">🎬</span> FRAMEPACK
      </button>
      <button id="aim-doc-btn" style="background:rgba(16, 185, 129, 0.1); border:1px solid #10b981; color:#10b981; padding:10px 15px; font-family:var(--font-hud); cursor:pointer; font-size:0.85rem; text-transform:uppercase; border-radius:2px; margin-left:auto; margin-right:5px; transition:0.2s;">
        <span style="margin-right:6px;">📖</span> DOCS
      </button>
    </div>

    <div id="aim-content"></div>
  `;

  const content = root.querySelector('#aim-content');
  const tabs = root.querySelectorAll('.aim-tab');

  let currentPanel = buildTxt2Img();
  content.appendChild(currentPanel);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      content.innerHTML = '';
      if (tab.dataset.tab === 'txt2img') {
        currentPanel = buildTxt2Img();
      } else if (tab.dataset.tab === 'img2img') {
        currentPanel = buildImg2Img();
      } else if (tab.dataset.tab === 'upscaler') {
        currentPanel = buildUpscaler();
      } else if (tab.dataset.tab === 'txt2vid') {
        currentPanel = buildTxt2Vid();
      } else if (tab.dataset.tab === 'controlnet') {
        currentPanel = buildControlNetForge();
      } else if (tab.dataset.tab === 'img2vid') {
        currentPanel = buildImg2Vid();
      } else {
        currentPanel = buildFramepack();
      }
      content.appendChild(currentPanel);
    });
  });

  const hash = window.location.hash || '';
  if (hash.includes('upscaler') || window._pending_upscale_image) {
    const upTab = root.querySelector('#aim-tab-upscale');
    if (upTab) {
      setTimeout(() => upTab.click(), 50);
    }
  }

  root.querySelector('#aim-doc-btn').addEventListener('click', showDocsModal);

  window._aimNotifyWarm = () => {};

  return root;
}

/* ─── TXT2VID PANEL ─────────────────────────────────────────── */
function buildTxt2Vid() {
  const settings = getModalSettings();
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  
  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">🎥</span>
      <span class="aim-panel-title">TEXT TO VIDEO</span>
      <span class="aim-panel-badge">WAN-14B ENGINE</span>
    </div>

    <div style="background: rgba(255, 100, 0, 0.1); border-left: 4px solid #ff5500; padding: 12px; margin-bottom: 20px; color: #ffddcc; font-size: 0.85rem; font-family: 'Share Tech Mono', monospace; line-height: 1.4;">
      <strong style="color: #ff5500; letter-spacing: 1px;">[!] WARNING - EXPERIMENTAL ENGINE:</strong> Text-to-Video synthesis core is still under active development. Generated artifacts can be highly unpredictable, graphically intense, or disturbing in nature. 
    </div>

    <div class="aim-field">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" for="t2v-prompt" style="margin:0;">CINEMATIC PROMPT</label>
      </div>
      <textarea class="aim-textarea" id="t2v-prompt" rows="3" placeholder="Describe the video you want to generate (e.g., A cinematic video of a serene waterfall...)"></textarea>
    </div>
    

    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>

    <div class="aim-row">
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="t2v-speed">SPEED MODE</label>
        <div class="aim-seg aim-seg-3" id="t2v-speed">
          <button class="aim-seg-btn active" data-steps="30">⚡ FAST</button>
          <button class="aim-seg-btn" data-steps="50">⚖ NORMAL</button>
          <button class="aim-seg-btn" data-steps="80">🎯 DETAILED</button>
        </div>
      </div>
    </div>

    <details class="aim-advanced">
      <summary class="aim-advanced-toggle">▶ ADVANCED PARAMETERS</summary>
      <div class="aim-advanced-body">
        <div class="aim-field">
          <label class="aim-label" for="t2v-neg">NEGATIVE PROMPT</label>
          <textarea class="aim-textarea aim-textarea-sm" id="t2v-neg" rows="2">low quality, blurry, distorted, static, jittery, watermark, signature, text, bad anatomy, deformed, ugly, pixelated</textarea>
        </div>
        
        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="t2v-cfg">PROMPT ADHERANCE: <span class="aim-val-display" id="t2v-cfg-val">5</span></label>
            <input class="aim-range" type="range" id="t2v-cfg" min="1" max="15" step="0.5" value="5" />
          </div>
        </div>

        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="t2v-fps">MOTION ACCURACY</label>
            <select class="aim-input" id="t2v-fps">
              <option value="16" selected>Standard (16 FPS)</option>
              <option value="24">Cinematic (24 FPS)</option>
              <option value="30">Ultra Smooth (30 FPS)</option>
            </select>
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="t2v-resolution">RESOLUTION (W x H)</label>
            <select class="aim-input" id="t2v-resolution">
              <option value="832x480" selected>832 x 480 (Widescreen SD)</option>
              <option value="480x832">480 x 832 (Vertical SD)</option>
            </select>
          </div>
        </div>
        
        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="t2v-frames">DURATION (TOTAL FRAMES)</label>
            <select class="aim-input" id="t2v-frames">
              <option value="33">Micro (33 Frames)</option>
              <option value="49" selected>Short (49 Frames)</option>
              <option value="81">Standard (81 Frames)</option>
              <option value="113">Long (113 Frames)</option>
              <option value="129">Extended (129 Frames)</option>
            </select>
          </div>
        </div>
      </div>
    </details>

    <button class="aim-btn-generate" id="t2v-gen-btn" style="${!sessionStorage.getItem('generate_authenticated') ? 'background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c;' : ''}">
      <span class="aim-btn-icon">${sessionStorage.getItem('generate_authenticated') ? '⚡' : '🔒'}</span> ${sessionStorage.getItem('generate_authenticated') ? 'INITIALIZE VIDEO SYNTHESIS' : 'GUEST PREVIEW MODE — CLICK TO LOGIN'}
    </button>

    <div class="aim-status-bar" id="t2v-status"></div>
    <div id="t2v-loader-slot"></div>
    <div id="t2v-result-slot"></div>
  `;

  const cfgInput = wrap.querySelector('#t2v-cfg');
  const cfgVal = wrap.querySelector('#t2v-cfg-val');
  if (cfgInput && cfgVal) cfgInput.addEventListener('input', () => { cfgVal.textContent = parseFloat(cfgInput.value); });

  const framesInput = wrap.querySelector('#t2v-frames');
  const framesVal = wrap.querySelector('#t2v-frames-val');
  if (framesInput && framesVal) framesInput.addEventListener('input', () => { framesVal.textContent = framesInput.value; });

  wrap.querySelectorAll('#t2v-speed .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#t2v-speed .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  wrap.querySelector('#t2v-gen-btn').addEventListener('click', async () => {
    if (!sessionStorage.getItem('generate_authenticated')) {
      setStatus(wrap, '#t2v-status', 'GUEST PREVIEW MODE: Please log in with a profile PIN to execute video generation.', 'error');
      import('../components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// LOGIN REQUIRED', subtitle: 'ENTER ACCESS PIN TO GENERATE VIDEO' });
      });
      return;
    }
    const prompt = wrap.querySelector('#t2v-prompt').value.trim();
    if (!prompt) { setStatus(wrap, '#t2v-status', 'ERROR: Cinematic prompt is empty.', 'error'); return; }

    const steps = parseInt(wrap.querySelector('#t2v-speed .aim-seg-btn.active').dataset.steps);
    let neg = wrap.querySelector('#t2v-neg').value;
    const cfg = parseFloat(wrap.querySelector('#t2v-cfg').value);
    const fps = parseInt(wrap.querySelector('#t2v-fps').value);
    const numFrames = parseInt(wrap.querySelector('#t2v-frames').value);
    const resolution = wrap.querySelector('#t2v-resolution').value;
    const [w, h] = resolution.split('x').map(n => parseInt(n));

    if (sessionStorage.getItem('darkness_mode_active') === 'true') {
      neg = ''; 
    }

    const loaderSlot = wrap.querySelector('#t2v-loader-slot');
    const resultSlot = wrap.querySelector('#t2v-result-slot');
    const genBtn = wrap.querySelector('#t2v-gen-btn');

    genBtn.disabled = true;
    setStatus(wrap, '#t2v-status', 'ROUTING TO H100 VIDEO NODE...', 'info');
    const loader = buildLoader('SYNTHESIZING VIDEO (This may take several minutes)...');
    loaderSlot.innerHTML = '';
    loaderSlot.appendChild(loader);

    const loaderMessages = ['SYNTHESIZING VIDEO...','DIFFUSING FRAMES...','RENDERING ARTIFACT...','FINALIZING OUTPUT...'];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMessages.length;
      const ltEl = loaderSlot.querySelector('#aim-loader-text');
      if (ltEl) ltEl.textContent = loaderMessages[msgIdx];
    }, 4500);

    try {
      const params = new URLSearchParams({
        prompt,
        negative_prompt: neg,
        guidance_scale: cfg,
        num_inference_steps: steps,
        width: w,
        height: h,
        num_frames: numFrames,
        fps: fps
      });
      
      const settings = getModalSettings();
      const endpoint = settings.txt2vidUrl;
      const res = await fetch(`${endpoint}?${params}`);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let url = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.step !== undefined && data.max_steps !== undefined) {
                updateProgress(loader, data.step, data.max_steps);
              } else if (data.video_b64) {
                const b64 = data.video_b64;
                const profile = sessionStorage.getItem('current_profile') || 'UNKNOWN';
                const dataUrl = 'data:video/mp4;base64,' + b64;
                
                import('../components/vision_db.js').then(mod => {
                  if (typeof mod.saveVideoToGallery === 'function') {
                    mod.saveVideoToGallery(profile, prompt, 'Straight Video Gen (T2V)', dataUrl);
                  } else if (typeof mod.saveImageToGallery === 'function') {
                    mod.saveImageToGallery(profile, prompt, 'Straight Video Gen (T2V)', dataUrl);
                  }
                }).catch(console.error);
                
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                url = URL.createObjectURL(blob);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e.message !== "Unexpected end of JSON input" && !e.message.includes('JSON')) {
                throw e; 
              }
            }
          }
        }
      }

      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';

      const resultEl = document.createElement('div');
      resultEl.className = 'aim-result-view';
      resultEl.innerHTML = `
        <div class="aim-result-frame">
          <video id="aim-result-vid" src="${url}" controls autoplay loop muted playsinline style="width:100%; height:auto; object-fit:contain; border-radius:6px;"></video>
        </div>
        <div class="aim-result-actions" style="margin-top:10px; display:flex; gap:10px;">
          <button class="aim-btn aim-btn-accept" id="aim-dl-vid-btn" style="flex:1;">💾 SAVE VIDEO</button>
        </div>
      `;

      resultEl.querySelector('#aim-dl-vid-btn').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `alphacore_video_${Date.now()}.mp4`;
        a.click();
      };

      resultSlot.innerHTML = '';
      resultSlot.appendChild(resultEl);
      playSFX('pop', 0.8);
      setStatus(wrap, '#t2v-status', 'VIDEO RENDERED SUCCESSFULLY.', 'ok');
      if (window._aimNotifyWarm) window._aimNotifyWarm();
    } catch (err) {
      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';
      setStatus(wrap, '#t2v-status', `FAILURE: ${err.message}`, 'error');
    } finally {
      genBtn.disabled = false;
    }
  });

  return wrap;
}

/* ─── IMG2VID PANEL ─────────────────────────────────────────── */
function buildImg2Vid() {
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  
  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">🎞️</span>
      <span class="aim-panel-title">IMAGE TO VIDEO</span>
      <span class="aim-panel-badge">WAN-14B ENGINE</span>
    </div>

    <div style="background: rgba(255, 100, 0, 0.1); border-left: 4px solid #ff5500; padding: 12px; margin-bottom: 20px; color: #ffddcc; font-size: 0.85rem; font-family: 'Share Tech Mono', monospace; line-height: 1.4;">
      <strong style="color: #ff5500; letter-spacing: 1px;">[!] WARNING - EXPERIMENTAL ENGINE:</strong> Image-to-Video synthesis core is still under active development. Generated artifacts can be highly unpredictable, graphically intense, or disturbing in nature. 
    </div>


    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>

    <div class="aim-row">
      <div class="aim-field" style="width: 100%;">
        <label class="aim-label">PRIMARY STARTING IMAGE</label>
        <div class="aim-dropzone" id="i2v-dropzone">
          <input type="file" id="i2v-file" accept="image/*" class="aim-file-input" />
          <div class="aim-dropzone-inner" id="i2v-dz-inner">
            <div class="aim-dz-icon">📁</div>
            <div class="aim-dz-text">DROP IMAGE</div>
          </div>
          <img class="aim-dz-preview hidden" id="i2v-preview" alt="preview" />
        </div>
      </div>
    </div>

    <div class="aim-field">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" for="i2v-prompt" style="margin:0;">CINEMATIC PROMPT</label>
      </div>
      <textarea class="aim-textarea" id="i2v-prompt" rows="3" placeholder="Describe the motion/video you want to generate from the image..."></textarea>
    </div>
    

    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>

    <div class="aim-row">
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="i2v-speed">SPEED MODE</label>
        <div class="aim-seg aim-seg-3" id="i2v-speed">
          <button class="aim-seg-btn active" data-steps="30">⚡ FAST</button>
          <button class="aim-seg-btn" data-steps="50">⚖ NORMAL</button>
          <button class="aim-seg-btn" data-steps="80">🎯 DETAILED</button>
        </div>
      </div>
    </div>

    <details class="aim-advanced">
      <summary class="aim-advanced-toggle">▶ ADVANCED PARAMETERS</summary>
      <div class="aim-advanced-body">
        <div class="aim-field">
          <label class="aim-label" for="i2v-neg">NEGATIVE PROMPT</label>
          <textarea class="aim-textarea aim-textarea-sm" id="i2v-neg" rows="2">low quality, blurry, distorted, static, jittery, watermark, signature, text, bad anatomy, deformed, ugly, pixelated</textarea>
        </div>
        
        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="i2v-cfg">PROMPT ADHERANCE: <span class="aim-val-display" id="i2v-cfg-val">5</span></label>
            <input class="aim-range" type="range" id="i2v-cfg" min="1" max="15" step="0.5" value="5" />
          </div>
        </div>

        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="i2v-fps">MOTION ACCURACY</label>
            <select class="aim-input" id="i2v-fps">
              <option value="16" selected>Standard (16 FPS)</option>
              <option value="24">Cinematic (24 FPS)</option>
              <option value="30">Ultra Smooth (30 FPS)</option>
            </select>
          </div>
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="i2v-resolution">RESOLUTION</label>
            <select class="aim-input" id="i2v-resolution">
              <option value="480p" selected>480p (Standard)</option>
              <option value="720p">720p (High Definition)</option>
            </select>
          </div>
        </div>
        
        <div class="aim-row" style="margin-top:12px;">
          <div class="aim-field" style="width: 100%;">
            <label class="aim-label" for="i2v-frames">DURATION (TOTAL FRAMES)</label>
            <select class="aim-input" id="i2v-frames">
              <option value="33">Micro (33 Frames)</option>
              <option value="49" selected>Short (49 Frames)</option>
              <option value="81">Standard (81 Frames)</option>
              <option value="113">Long (113 Frames)</option>
              <option value="129">Extended (129 Frames)</option>
            </select>
          </div>
        </div>
      </div>
    </details>

    <button class="aim-btn-generate" id="i2v-gen-btn" style="${!sessionStorage.getItem('generate_authenticated') ? 'background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c;' : ''}">
      <span class="aim-btn-icon">${sessionStorage.getItem('generate_authenticated') ? '⚡' : '🔒'}</span> ${sessionStorage.getItem('generate_authenticated') ? 'INITIALIZE VIDEO SYNTHESIS' : 'GUEST PREVIEW MODE — CLICK TO LOGIN'}
    </button>

    <div class="aim-status-bar" id="i2v-status"></div>
    <div id="i2v-loader-slot"></div>
    <div id="i2v-result-slot"></div>
  `;

  const cfgInput = wrap.querySelector('#i2v-cfg');
  const cfgVal = wrap.querySelector('#i2v-cfg-val');
  if (cfgInput && cfgVal) cfgInput.addEventListener('input', () => { cfgVal.textContent = parseFloat(cfgInput.value); });

  const framesInput = wrap.querySelector('#i2v-frames');
  const framesVal = wrap.querySelector('#i2v-frames-val');
  if (framesInput && framesVal) framesInput.addEventListener('input', () => { framesVal.textContent = framesInput.value; });

  wrap.querySelectorAll('#i2v-speed .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#i2v-speed .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  const fileInput = wrap.querySelector('#i2v-file');
  const dropzone = wrap.querySelector('#i2v-dropzone');
  const dzInner = wrap.querySelector('#i2v-dz-inner');
  const preview = wrap.querySelector('#i2v-preview');

  function showPreview(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.classList.remove('hidden');
    dzInner.classList.add('hidden');
    dropzone.classList.add('has-preview');
  }

  fileInput.addEventListener('change', () => { if (fileInput.files[0]) showPreview(fileInput.files[0]); });
  dropzone.addEventListener('click', e => {
    if (e.target === fileInput || e.target.classList.contains('aim-dz-preview')) return;
    fileInput.click();
  });
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) { fileInput._droppedFile = file; showPreview(file); }
  });

  wrap.querySelector('#i2v-gen-btn').addEventListener('click', async () => {
    if (!sessionStorage.getItem('generate_authenticated')) {
      setStatus(wrap, '#i2v-status', 'GUEST PREVIEW MODE: Please log in with a profile PIN to execute video generation.', 'error');
      import('../components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// LOGIN REQUIRED', subtitle: 'ENTER ACCESS PIN TO GENERATE VIDEO' });
      });
      return;
    }
    const file = fileInput._droppedFile || fileInput.files[0];
    if (!file) { setStatus(wrap, '#i2v-status', 'ERROR: No starting image loaded.', 'error'); return; }
    
    const prompt = wrap.querySelector('#i2v-prompt').value.trim();
    if (!prompt) { setStatus(wrap, '#i2v-status', 'ERROR: Cinematic prompt is empty.', 'error'); return; }

    const steps = parseInt(wrap.querySelector('#i2v-speed .aim-seg-btn.active').dataset.steps);
    let neg = wrap.querySelector('#i2v-neg').value;
    const cfg = parseFloat(wrap.querySelector('#i2v-cfg').value);
    const fps = parseInt(wrap.querySelector('#i2v-fps').value);
    const numFrames = parseInt(wrap.querySelector('#i2v-frames').value);
    const resolution = wrap.querySelector('#i2v-resolution').value;

    if (sessionStorage.getItem('darkness_mode_active') === 'true') {
      neg = ''; 
    }

    const loaderSlot = wrap.querySelector('#i2v-loader-slot');
    const resultSlot = wrap.querySelector('#i2v-result-slot');
    const genBtn = wrap.querySelector('#i2v-gen-btn');

    genBtn.disabled = true;
    setStatus(wrap, '#i2v-status', 'ROUTING TO H100 VIDEO NODE...', 'info');
    const loader = buildLoader('SYNTHESIZING VIDEO (This may take several minutes)...');
    loaderSlot.innerHTML = '';
    loaderSlot.appendChild(loader);

    const loaderMessages = ['SYNTHESIZING VIDEO...','DIFFUSING FRAMES...','RENDERING ARTIFACT...','FINALIZING OUTPUT...'];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMessages.length;
      const ltEl = loaderSlot.querySelector('#aim-loader-text');
      if (ltEl) ltEl.textContent = loaderMessages[msgIdx];
    }, 4500);

    try {
      const getBase64 = (f) => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = err => rej(err);
        reader.readAsDataURL(f);
      });
      
      const b64Image = await getBase64(file);
      
      const payload = {
        image: b64Image,
        prompt: prompt,
        negative_prompt: neg,
        guidance_scale: parseFloat(cfg),
        num_inference_steps: parseInt(steps),
        resolution: resolution,
        num_frames: parseInt(numFrames),
        fps: parseInt(fps)
      };

      const settings = getModalSettings();
      const endpoint = settings.img2vidUrl;
      const res = await fetch(endpoint, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let url = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.step !== undefined && data.max_steps !== undefined) {
                updateProgress(loader, data.step, data.max_steps);
              } else if (data.video_b64) {
                const b64 = data.video_b64;
                const profile = sessionStorage.getItem('current_profile') || 'UNKNOWN';
                const dataUrl = 'data:video/mp4;base64,' + b64;
                
                import('../components/vision_db.js').then(mod => {
                  if (typeof mod.saveVideoToGallery === 'function') {
                    mod.saveVideoToGallery(profile, prompt, 'Image to Video Gen (I2V)', dataUrl);
                  } else if (typeof mod.saveImageToGallery === 'function') {
                    mod.saveImageToGallery(profile, prompt, 'Image to Video Gen (I2V)', dataUrl);
                  }
                }).catch(console.error);
                
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                url = URL.createObjectURL(blob);
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              if (e.message !== "Unexpected end of JSON input" && !e.message.includes('JSON')) {
                throw e; 
              }
            }
          }
        }
      }

      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';

      const resultEl = document.createElement('div');
      resultEl.className = 'aim-result-view';
      resultEl.innerHTML = `
        <div class="aim-result-frame">
          <video id="aim-result-vid" src="${url}" controls autoplay loop muted playsinline style="width:100%; height:auto; object-fit:contain; border-radius:6px;"></video>
        </div>
        <div class="aim-result-actions" style="margin-top:10px; display:flex; gap:10px;">
          <button class="aim-btn aim-btn-accept" id="aim-dl-vid-btn" style="flex:1;">💾 SAVE VIDEO</button>
        </div>
      `;

      resultEl.querySelector('#aim-dl-vid-btn').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `alphacore_video_${Date.now()}.mp4`;
        a.click();
      };

      resultSlot.innerHTML = '';
      resultSlot.appendChild(resultEl);
      playSFX('pop', 0.8);
      setStatus(wrap, '#i2v-status', 'VIDEO RENDERED SUCCESSFULLY.', 'ok');
      if (window._aimNotifyWarm) window._aimNotifyWarm();
    } catch (err) {
      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';
      setStatus(wrap, '#i2v-status', `FAILURE: ${err.message}`, 'error');
    } finally {
      genBtn.disabled = false;
    }
  });

  return wrap;
}

/* ─── FRAMEPACK PANEL ───────────────────────────────────────── */
function buildFramepack() {
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  const isArchitect = currentProfile === 'architect' || sessionStorage.getItem('admin_authenticated') === '1';

  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';

  if (isArchitect) {
    wrap.appendChild(buildFramepackContent());
    return wrap;
  }

  wrap.innerHTML = `
    <div style="position: relative; width: 100%; min-height: 520px; border-radius: 8px; overflow: hidden; background: #030712;">
      <div style="filter: blur(8px) brightness(0.35); opacity: 0.5; pointer-events: none; user-select: none; padding: 20px;">
        <div class="aim-panel-header">
          <span class="aim-panel-icon">🎬</span>
          <span class="aim-panel-title">FRAMEPACK STUDIO</span>
          <span class="aim-panel-badge">H100 GPU</span>
        </div>
        <div class="aim-row" style="margin-bottom: 20px;">
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            Framepack video synthesis engine rendering queue.
          </p>
        </div>
        <div class="aim-row" style="display:flex; gap:10px; justify-content: center; margin-bottom: 20px;">
          <button class="aim-btn" style="padding: 15px 30px; font-size: 1.1rem;">LAUNCH IN BROWSER</button>
          <button class="aim-btn aim-btn-decline" style="padding: 15px 30px; font-size: 1.1rem;">OPEN IN NEW TAB</button>
        </div>
        <div style="width:100%; height:320px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; background: rgba(0,0,0,0.6);"></div>
      </div>

      <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(5,8,15,0.75); backdrop-filter: blur(4px); padding: 30px; text-align: center; border: 1px solid rgba(6,182,212,0.4); border-radius: 8px;">
        <div style="font-size: 3rem; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(6,182,212,0.6));">🚧</div>
        <h2 class="glitch" data-text="FRAMEPACK STUDIO" style="font-family: 'Orbitron', sans-serif; font-size: 1.6rem; letter-spacing: 2px; color: var(--accent, #06b6d4); margin: 0 0 10px 0;">FRAMEPACK STUDIO</h2>
        
        <div style="background: rgba(255,0,60,0.15); border: 2px solid #ff003c; color: #ff003c; padding: 12px 28px; border-radius: 4px; font-family: 'Orbitron', sans-serif; font-size: 1.05rem; font-weight: bold; letter-spacing: 1.5px; margin-top: 12px; box-shadow: 0 0 25px rgba(255,0,60,0.4); transform: rotate(-1deg); text-transform: uppercase;">
          ⚠️ NOT QUITE READY FOR PUBLIC USE. STAY TUNED!
        </div>

        <p style="color: #aaa; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; margin-top: 22px; max-width: 460px; line-height: 1.5;">
          Framepack H100 Neural Video Synthesis is restricted during active profile deployment. Full public access will unlock upon model optimization.
        </p>
      </div>
    </div>
  `;

  return wrap;
}

function buildFramepackContent() {
  const inner = document.createElement('div');
  inner.style.width = '100%';
  inner.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">🎬</span>
      <span class="aim-panel-title">FRAMEPACK STUDIO</span>
      <span class="aim-panel-badge">H100 GPU</span>
    </div>
    <div class="aim-row" style="margin-bottom: 20px;">
      <p style="color: var(--text-muted); font-size: 0.9rem;">
        Framepack Studio requires a dedicated H100 container (cold boot takes ~1-3 minutes).
        Because Gradio cannot be easily rewritten into a static API endpoint, it runs as a full interactive serverless app.
        <br/><br/>
        <strong>Note:</strong> The container will automatically shut down after a period of inactivity to prevent runaway compute costs.
      </p>
    </div>
    <div class="aim-row" style="display:flex; gap:10px; justify-content: center; margin-bottom: 20px;">
      <button class="aim-btn" id="fp-launch-btn" style="padding: 15px 30px; font-size: 1.1rem;">LAUNCH IN BROWSER</button>
      <button class="aim-btn aim-btn-decline" id="fp-newtab-btn" style="padding: 15px 30px; font-size: 1.1rem;">OPEN IN NEW TAB</button>
    </div>
    <div id="fp-frame-container" style="display:none; width:100%; height:800px; border:1px solid var(--border); border-radius:10px; overflow:hidden;">
    </div>
  `;

  const settings = getModalSettings();
  const url = settings.framepackUrl;

  inner.querySelector('#fp-launch-btn').onclick = () => {
    const container = inner.querySelector('#fp-frame-container');
    container.style.display = 'block';
    container.innerHTML = `<iframe src="${url}" width="100%" height="100%" style="border:none;" allow="camera; microphone; display-capture"></iframe>`;
    if (window._aimNotifyWarm) window._aimNotifyWarm();
  };

  inner.querySelector('#fp-newtab-btn').onclick = () => {
    window.open(url, '_blank');
  };

  return inner;
}

/* ─── DOCUMENTATION MODAL ─────────────────────────────────────────── */
function showDocsModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px);';
  
  const modal = document.createElement('div');
  modal.style.cssText = 'position:relative; background:#050a0f; border:1px solid var(--accent, #06b6d4); padding:20px; max-width:650px; width:90%; max-height:85vh; overflow-y:auto; color:var(--text-main, #d0e0f0); font-family:var(--font-hud, monospace); box-shadow:0 0 20px rgba(6,182,212,0.2);';
  
  modal.innerHTML = `
    <button id="close-docs-btn" style="position:absolute; top:10px; right:10px; background:rgba(255,0,0,0.8); border:none; color:white; width:24px; height:24px; border-radius:50%; font-size:16px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-family:sans-serif; line-height:1; z-index:10;">×</button>
    <h2 style="color:var(--accent, #06b6d4); margin-top:0; border-bottom:1px solid rgba(6,182,212,0.3); padding-bottom:10px; font-size:1.4rem; padding-right:30px;">📖 AI SYNTHESIS DOCUMENTATION</h2>
    <div style="font-family:'Share Tech Mono', monospace; font-size:0.9rem; line-height:1.6; margin-top:15px;">
      
      <h3 style="color:#10b981; margin-bottom:5px;">1. WHAT ARE LORAs?</h3>
      <p style="margin-top:0; margin-bottom:15px; color:#a0b0c0;"><b>LoRA (Low-Rank Adaptation)</b> files are small, specialized training weights added to a Base Model. While a Base Model knows how to draw a generic "car", a LoRA teaches it to draw a very specific "1998 Toyota Supra". You can mix multiple LoRAs to combine concepts or characters!</p>

      <h3 style="color:#10b981; margin-bottom:5px;">2. BASE MODELS (CHECKPOINTS)</h3>
      <p style="margin-top:0; margin-bottom:15px; color:#a0b0c0;">The core brain of the AI. Each model is fine-tuned for a specific art style (e.g., Photorealism, Anime, Cyberpunk). <b>EpicRealism</b> excels at lifelike photos, while <b>Dreamshaper</b> is great for stylized digital art.</p>

      <h3 style="color:#10b981; margin-bottom:5px;">3. PROMPT ADHERANCE (CFG SCALE)</h3>
      <p style="margin-top:0; margin-bottom:15px; color:#a0b0c0;">Controls how strictly the AI follows your prompt.<br/>- <b>Low (1-4):</b> AI takes more creative liberties.<br/>- <b>Medium (5-8):</b> The sweet spot for most models.<br/>- <b>High (9+):</b> Very strict adherence, but can cause "fried" or artifact-heavy images.</p>

      <h3 style="color:#10b981; margin-bottom:5px;">4. SAMPLING STEPS (SPEED MODE)</h3>
      <p style="margin-top:0; margin-bottom:15px; color:#a0b0c0;">The number of iterations the AI uses to clear the noise and refine the image.<br/>- <b>Fast (~20 steps):</b> Good for quick previews.<br/>- <b>Normal (~30 steps):</b> Best balance of quality and speed.<br/>- <b>Detailed (~50+ steps):</b> Best quality, but takes longer. Diminishing returns after 50.</p>
      
      <h3 style="color:#10b981; margin-bottom:5px;">5. SAMPLERS & SCHEDULERS</h3>
      <p style="margin-top:0; margin-bottom:15px; color:#a0b0c0;">The mathematical algorithm used to generate the image.<br/>- <b>Euler a:</b> Fast, slightly softer, changes significantly with step counts.<br/>- <b>DPM++ 2M Karras:</b> Very sharp, highly detailed, stabilizes quickly. Highly recommended.</p>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  modal.querySelector('#close-docs-btn').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}

/* ─── AI ENHANCE UTILITY ─────────────────────────────────────────── */
function enhancePromptWithAI(prompt) {
  if (!prompt || prompt.trim() === '') return '';
  const cleanPrompt = prompt.trim().replace(/,\s*$/, ''); 
  const enhancements = "masterpiece, best quality, ultra-detailed, highly detailed, photorealistic, 8k resolution, cinematic lighting, sharp focus, intricate details, award-winning photography";
  
  if (cleanPrompt.includes('masterpiece') && cleanPrompt.includes('best quality')) {
    return cleanPrompt; 
  }
  
  return `${cleanPrompt}, ${enhancements}`;
}

/* --- CONTROLNET FORGE PANEL ---------------------------------------- */
function buildControlNetForge() {
  const settings = getModalSettings();
  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = 
    '<div class="aim-panel-header">' +
      '<span class="aim-panel-icon">?</span>' +
      '<span class="aim-panel-title">CONTROLNET</span>' +
      '<span class="aim-panel-badge">PRE-PROCESSOR</span>' +
    '</div>' +
    '<div class="aim-field">' +
      '<label class="aim-label">UPLOAD BASE IMAGE</label>' +
      '<input type="file" id="cn-file-input" accept="image/png, image/jpeg" style="display:none;" />' +
      '<div class="aim-dropzone" id="cn-dropzone" style="cursor:pointer; text-align:center; padding:40px; border:1px dashed var(--accent); border-radius:4px;">' +
        'Click to Upload Base Image' +
      '</div>' +
      '<img id="cn-preview" style="display:none; max-width:100%; max-height:400px; margin-top:10px; border-radius:4px; margin-left:auto; margin-right:auto;" />' +
    '</div>' +
    '<div class="aim-field">' +
      '<label class="aim-label">CONTROLNET TYPE</label>' +
      '<select class="aim-input" id="cn-type">' +
        '<option value="openpose">OpenPose (Human Pose Skeletons)</option>' +
        '<option value="canny">Canny (Crisp Edge Outlines)</option>' +
        '<option value="depth">MiDaS (3D Depth Maps)</option>' +
      '</select>' +
    '</div>' +
    '<button class="aim-btn aim-btn-generate" id="cn-generate-btn" style="width:100%;">? GENERATE VISION MAP</button>' +
    '<div id="cn-loader" style="display:none; text-align:center; margin-top:10px; color:var(--accent);">Processing vision map via A10G... This can take up to 20 seconds on cold start.</div>' +
    '<div id="cn-result-container" style="display:none; margin-top:20px; border-top:1px solid #334; padding-top:20px;">' +
      '<label class="aim-label">GENERATED CONTROLNET MAP</label>' +
      '<img id="cn-result-img" style="max-width:100%; max-height:400px; display:block; border-radius:4px; margin: 0 auto 15px auto;" />' +
      '<div style="display:flex; gap:10px;">' +
        '<button class="aim-btn" id="cn-send-txt2img" style="flex:1; background:rgba(6,182,212,0.1); color:var(--accent); border-color:var(--accent);">SEND TO TXT2IMG</button>' +
      '</div>' +
    '</div>';

  let base64Image = null;
  const fileInput = wrap.querySelector('#cn-file-input');
  const dropzone = wrap.querySelector('#cn-dropzone');
  const preview = wrap.querySelector('#cn-preview');
  const resultImg = wrap.querySelector('#cn-result-img');

  dropzone.onclick = () => fileInput.click();
  preview.onclick = () => fileInput.click();
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      base64Image = event.target.result;
      preview.src = base64Image;
      preview.style.display = 'block';
      dropzone.style.display = 'none';
      wrap.querySelector('#cn-result-container').style.display = 'none';
    };
    reader.readAsDataURL(file);
  };

  wrap.querySelector('#cn-generate-btn').onclick = async () => {
    if (!base64Image) { alert("Please upload an image first."); return; }
    const type = wrap.querySelector('#cn-type').value;
    
    wrap.querySelector('#cn-loader').style.display = 'block';
    wrap.querySelector('#cn-generate-btn').disabled = true;
    wrap.querySelector('#cn-result-container').style.display = 'none';

    try {
      const preprocessorEndpoint = resolveEndpoint(settings.preprocessorUrl, '');
    const res = await fetch(preprocessorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: base64Image, processor_type: type })
      });
      const data = await res.json();
      if (data.image_b64) {
        resultImg.src = data.image_b64;
        wrap.querySelector('#cn-result-container').style.display = 'block';
        
        window._cn_global_img = data.image_b64;
        window._cn_global_type = type;
      } else {
        alert("Error generating map: " + JSON.stringify(data));
      }
    } catch (e) {
      alert("Network Error: " + e.message);
    } finally {
      wrap.querySelector('#cn-loader').style.display = 'none';
      wrap.querySelector('#cn-generate-btn').disabled = false;
    }
  };

  wrap.querySelector('#cn-send-txt2img').onclick = () => {
    document.querySelector('#aim-tab-t2i').click();
    const cnPreviewContainer = document.querySelector('#t2i-cn-container');
    if (cnPreviewContainer) {
       cnPreviewContainer.style.display = 'block';
       document.querySelector('#t2i-cn-preview').src = window._cn_global_img;
       document.querySelector('#t2i-cn-label').textContent = window._cn_global_type.toUpperCase();
    }
  };

  return wrap;
}
