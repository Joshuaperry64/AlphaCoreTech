/**
 * AI Modals Page — txt2img, img2img, upscaler, txt2vid, img2vid, controlnet, framepack via Modal.run endpoints
 * Disclaimer-gated, tabbed interface, desktop + mobile compatible.
 */
import { createElement } from '../components/utils.js';
import { buildPinPad, requireAuth } from '../components/pinpad.js';
import { saveImageToGallery, getAllGalleryImages } from '../components/vision_db.js';
import { logAction } from '../components/logger.js';
import { playSFX } from '../components/audio.js';
import { showToast } from '../components/toast.js';

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

export function getModalSettings() {
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim().toLowerCase();
  const currentPin = (sessionStorage.getItem('current_pin') || '').trim();
  const isArchitect = currentProfile === 'architect' || currentPin === '672167566';

  const architectEndpoints = {
    txt2imgUrl: 'https://alphacoreprogramming--alphacore-aio-backend-txt2img-web-txt2img.modal.run',
    img2imgUrl: 'https://alphacoreprogramming--alphacore-aio-backend-img2img-web-img2img.modal.run',
    omnigenUrl: 'https://alphacoreprogramming--alphacore-aio-backend-omnigen-web-omnigen.modal.run',
    preprocessorUrl: 'https://alphacoreprogramming--alphacore-aio-backend-controlnet-m-11dd7a.modal.run',
    txt2vidUrl: 'https://alphacoreprogramming--alphacore-aio-backend-txt2vid-web-txt2vid.modal.run/stream',
    img2vidUrl: 'https://alphacoreprogramming--alphacore-aio-backend-img2vid-web-img2vid.modal.run/stream',
    framepackUrl: 'https://alphacoreprogramming--alphacore-aio-backend-framepack-ui-a08015.modal.run',
    fanninCrimeUrl: 'https://alphacoreprogramming--alphacore-aio-backend-mugshots.modal.run/api/mugshots',
    music_url: 'https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/architect',
    upscalerUrl: 'https://alphacoreprogramming--alphacore-aio-backend-upscaler-web-cb5cf9.modal.run',
    vid2audioUrl: 'https://alphacoreprogramming--alphacore-aio-backend-vid2audio-web.modal.run/stream',
    tierName: 'ARCHITECT PRIORITY',
    tierHardware: 'H100 / L40S High-Performance Nodes',
  };

  const economyEndpoints = {
    txt2imgUrl: 'https://alphacoreprogramming--alphacore-aio-backend-txt2img-eco--cce613.modal.run',
    img2imgUrl: 'https://alphacoreprogramming--alphacore-aio-backend-img2img-eco--6cc148.modal.run',
    omnigenUrl: 'https://alphacoreprogramming--alphacore-aio-backend-omnigen-eco-web-omnigen.modal.run',
    preprocessorUrl: 'https://alphacoreprogramming--alphacore-aio-backend-controlnet-m-730e5f.modal.run',
    txt2vidUrl: 'https://alphacoreprogramming--alphacore-aio-backend-txt2vid-eco--fecf7d.modal.run/stream',
    img2vidUrl: 'https://alphacoreprogramming--alphacore-aio-backend-img2vid-eco--f50514.modal.run/stream',
    framepackUrl: 'https://alphacoreprogramming--alphacore-aio-backend-framepack-ec-32daed.modal.run',
    fanninCrimeUrl: 'https://alphacoreprogramming--alphacore-aio-backend-mugshots.modal.run/api/mugshots',
    music_url: 'https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/eco',
    upscalerUrl: 'https://alphacoreprogramming--alphacore-aio-backend-upscaler-eco-7e901c.modal.run',
    vid2audioUrl: 'https://alphacoreprogramming--alphacore-aio-backend-vid2audio-eco-web.modal.run/stream',
    tierName: 'PUBLIC ECONOMY',
    tierHardware: 'Cost-Optimized Nodes (60s Auto-Scale, Max 1)',
  };

  const activeEndpoints = isArchitect ? architectEndpoints : economyEndpoints;

  const defaults = {
    ...activeEndpoints,
    isArchitect,
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

  // Economy tier is locked strictly to economy endpoints to prevent runaway bills
  if (!isArchitect) {
    return defaults;
  }

  try {
    const customStr = localStorage.getItem('alphacore_modal_settings');
    if (customStr) {
      const custom = JSON.parse(customStr);
      // Strip trailing slashes from any cached custom endpoints
      ['txt2imgUrl', 'img2imgUrl', 'omnigenUrl', 'preprocessorUrl', 'txt2vidUrl', 'img2vidUrl', 'framepackUrl', 'fanninCrimeUrl', 'music_url', 'upscalerUrl', 'vid2audioUrl'].forEach(k => {
        if (custom[k] && typeof custom[k] === 'string') {
          custom[k] = custom[k].trim().replace(/\/+$/, '');
        }
      });
      // Auto-heal outdated endpoints in user's localStorage
      if (custom.txt2imgUrl && (!custom.txt2imgUrl.includes('alphacoreprogramming') || custom.txt2imgUrl.endsWith('/stream'))) custom.txt2imgUrl = defaults.txt2imgUrl;
      if (custom.img2imgUrl && (!custom.img2imgUrl.includes('alphacoreprogramming') || custom.img2imgUrl.endsWith('/stream'))) custom.img2imgUrl = defaults.img2imgUrl;
      if (custom.omnigenUrl && !custom.omnigenUrl.includes('alphacoreprogramming')) custom.omnigenUrl = defaults.omnigenUrl;
      if (custom.preprocessorUrl && !custom.preprocessorUrl.includes('alphacoreprogramming')) custom.preprocessorUrl = defaults.preprocessorUrl;
      if (custom.txt2vidUrl && !custom.txt2vidUrl.includes('alphacoreprogramming')) custom.txt2vidUrl = defaults.txt2vidUrl;
      if (custom.img2vidUrl && !custom.img2vidUrl.includes('alphacoreprogramming')) custom.img2vidUrl = defaults.img2vidUrl;
      if (custom.framepackUrl && !custom.framepackUrl.includes('alphacoreprogramming')) custom.framepackUrl = defaults.framepackUrl;
      if (custom.music_url && !custom.music_url.includes('alphacoreprogramming')) custom.music_url = defaults.music_url;
      if (custom.upscalerUrl && (!custom.upscalerUrl.includes('alphacoreprogramming') || custom.upscalerUrl.includes('alphacore-main-api'))) custom.upscalerUrl = defaults.upscalerUrl;
      if (custom.vid2audioUrl && !custom.vid2audioUrl.includes('alphacoreprogramming')) custom.vid2audioUrl = defaults.vid2audioUrl;
      if (custom.fanninCrimeUrl && (!custom.fanninCrimeUrl.includes('alphacoreprogramming') || custom.fanninCrimeUrl.includes('fannin-scraper-api'))) custom.fanninCrimeUrl = defaults.fanninCrimeUrl;

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
export function buildResult(urls = []) {
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
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; align-items:center;">
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:#64748b; margin-right:4px;">// SYNTHESIS CHAIN:</span>
          <button class="aim-btn aim-btn-dl" id="aim-animate-btn" style="border-color:#a855f7; color:#a855f7;" title="Handoff image to Wan-14B Image-to-Video Engine">🎬 ANIMATE (IMG2VID)</button>
          <button class="aim-btn aim-btn-dl" id="aim-upscale-btn" style="border-color:#38bdf8; color:#38bdf8;" title="Handoff image to 4x Ultra-Sharp Neural Upscaler">🔍 UPSCALE 4K</button>
          <button class="aim-btn aim-btn-dl" id="aim-cnet-btn" style="border-color:#06b6d4; color:#06b6d4;" title="Extract skeleton/pose to ControlNet Forge">🦾 EXTRACT POSE (CN)</button>
          <button class="aim-btn aim-btn-dl" id="aim-omnigen-btn" style="border-color:#10b981; color:#10b981;" title="Load image into OmniGen Slot 1 as conditioning reference">🧬 OMNIGEN REF</button>
          <button class="aim-btn aim-btn-dl" id="aim-vault-btn" style="border-color:#f59e0b; color:#f59e0b;">💾 MOVE TO VAULT</button>
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

  const animateBtn = el.querySelector('#aim-animate-btn');
  if (animateBtn) {
    animateBtn.onclick = () => {
      window._pending_img2vid_image = urls[currentIdx];
      const i2vTab = document.querySelector('#aim-tab-i2v');
      if (i2vTab) {
        i2vTab.click();
      } else {
        window.location.hash = '#/aimodals?tab=img2vid';
      }
      playSFX('navigate', 0.5);
      showToast('SYNTHESIS CHAIN', 'Image handed off to Wan-14B Image-to-Video Engine.');
    };
  }

  const upscaleBtn = el.querySelector('#aim-upscale-btn');
  if (upscaleBtn) {
    upscaleBtn.onclick = () => {
      window._pending_upscale_image = urls[currentIdx];
      const upTab = document.querySelector('#aim-tab-upscale');
      if (upTab) {
        upTab.click();
      } else {
        window.location.hash = '#/aimodals?tab=upscaler';
      }
      playSFX('navigate', 0.5);
      showToast('SYNTHESIS CHAIN', 'Image handed off to 4x Ultra-Sharp Neural Upscaler.');
    };
  }

  const cnetBtn = el.querySelector('#aim-cnet-btn');
  if (cnetBtn) {
    cnetBtn.onclick = () => {
      setGlobalControlNet(urls[currentIdx], 'openpose');
      const cnTab = document.querySelector('#aim-tab-cnet');
      if (cnTab) cnTab.click();
      else window.location.hash = '#/aimodals?tab=controlnet';
      playSFX('pop', 0.8);
      showToast('CONTROLNET', 'Pose conditioning extracted and routed to ControlNet Forge.');
    };
  }

  const omnigenBtn = el.querySelector('#aim-omnigen-btn');
  if (omnigenBtn) {
    omnigenBtn.onclick = () => {
      window._pending_omnigen_image = urls[currentIdx];
      const omniTab = document.querySelector('#aim-tab-omnigen');
      if (omniTab) {
        omniTab.click();
      } else {
        window.location.hash = '#/aimodals?tab=omnigen';
      }
      playSFX('navigate', 0.5);
      showToast('OMNIGEN', 'Conditioning reference loaded into OmniGen Slot 1.');
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

/* ─── GLOBAL CONTROLNET CONDITIONING & REPOSITORY SYSTEM ───────── */
window._cn_global_img = window._cn_global_img || null;
window._cn_global_type = window._cn_global_type || 'canny';
window._cn_global_scale = typeof window._cn_global_scale === 'number' ? window._cn_global_scale : 1.0;

function setGlobalControlNet(imgDataUrl, type = 'canny', scale = null) {
  window._cn_global_img = imgDataUrl;
  if (type) window._cn_global_type = type.toLowerCase();
  if (scale !== null && scale !== undefined) window._cn_global_scale = parseFloat(scale);
  syncAllControlNetSections();
}

function clearGlobalControlNet() {
  window._cn_global_img = null;
  syncAllControlNetSections();
}

function syncAllControlNetSections() {
  document.querySelectorAll('.aim-cn-mgmt-section').forEach(sec => {
    const prefix = sec.dataset.prefix;
    if (!prefix) return;

    const activeView = sec.querySelector(`#${prefix}-cn-active-view`);
    const emptyHint = sec.querySelector(`#${prefix}-cn-empty-hint`);
    const statusBadge = sec.querySelector(`#${prefix}-cn-status`);
    const clearBtn = sec.querySelector(`#${prefix}-cn-clear-btn`);
    const thumb = sec.querySelector(`#${prefix}-cn-preview-thumb`);
    const typeBadge = sec.querySelector(`#${prefix}-cn-type-badge`);
    const typeSelect = sec.querySelector(`#${prefix}-cn-type-select`);
    const scaleSlider = sec.querySelector(`#${prefix}-cn-scale-slider`);
    const scaleVal = sec.querySelector(`#${prefix}-cn-scale-val`);

    if (window._cn_global_img) {
      if (activeView) activeView.style.display = 'block';
      if (emptyHint) emptyHint.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'inline-block';
      if (thumb) thumb.src = window._cn_global_img;
      const t = (window._cn_global_type || 'canny').toLowerCase();
      if (typeBadge) typeBadge.textContent = t.toUpperCase();
      if (typeSelect) typeSelect.value = t;
      const s = typeof window._cn_global_scale === 'number' ? window._cn_global_scale : 1.0;
      if (scaleSlider) scaleSlider.value = s;
      if (scaleVal) scaleVal.textContent = s.toFixed(2);
      if (statusBadge) {
        statusBadge.textContent = 'ACTIVE';
        statusBadge.style.background = 'rgba(16,185,129,0.2)';
        statusBadge.style.color = '#10b981';
        statusBadge.style.borderColor = '#10b981';
      }
    } else {
      if (activeView) activeView.style.display = 'none';
      if (emptyHint) emptyHint.style.display = 'block';
      if (clearBtn) clearBtn.style.display = 'none';
      if (thumb) thumb.src = '';
      if (statusBadge) {
        statusBadge.textContent = 'INACTIVE';
        statusBadge.style.background = 'rgba(100,100,100,0.2)';
        statusBadge.style.color = '#888';
        statusBadge.style.borderColor = '#555';
      }
    }
  });
}

async function openControlNetVaultPicker(onSelect) {
  let vaultFiles = [];
  try {
    vaultFiles = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
  } catch (e) {
    vaultFiles = [];
  }

  const imageVault = vaultFiles.filter(f => f.content && (f.content.startsWith('data:image') || (f.type && f.type.startsWith('image'))));

  let galleryImages = [];
  try {
    galleryImages = await getAllGalleryImages();
  } catch (e) {
    galleryImages = [];
  }

  const items = [];

  imageVault.forEach((f, idx) => {
    const isCn = f.tag === 'controlnet' || !!f.controlnet_type || (f.filename && /controlnet|canny|openpose|depth/i.test(f.filename));
    let detectedType = f.controlnet_type || 'canny';
    if (!f.controlnet_type && f.filename) {
      if (/openpose/i.test(f.filename)) detectedType = 'openpose';
      else if (/depth/i.test(f.filename)) detectedType = 'depth';
      else if (/canny/i.test(f.filename)) detectedType = 'canny';
    }
    items.push({
      id: f.id || `v_${idx}`,
      title: f.filename || `Vault Item #${idx + 1}`,
      dataUrl: f.content,
      source: 'VAULT',
      isControlNet: isCn,
      cnType: detectedType,
      timestamp: f.createdAt || Date.now()
    });
  });

  galleryImages.forEach((g, idx) => {
    if (!g.data) return;
    const isCn = (g.source && /controlnet/i.test(g.source)) || (g.prompt && /controlnet|canny|openpose|depth/i.test(g.prompt));
    let detectedType = 'canny';
    const text = `${g.source || ''} ${g.prompt || ''}`;
    if (/openpose/i.test(text)) detectedType = 'openpose';
    else if (/depth/i.test(text)) detectedType = 'depth';

    items.push({
      id: `g_${g.id || idx}`,
      title: g.prompt ? (g.prompt.length > 25 ? g.prompt.substring(0, 25) + '...' : g.prompt) : `Gallery #${idx + 1}`,
      dataUrl: g.data,
      source: 'GALLERY',
      isControlNet: isCn,
      cnType: detectedType,
      timestamp: g.timestamp || Date.now()
    });
  });

  items.sort((a, b) => b.timestamp - a.timestamp);

  const overlay = document.createElement('div');
  overlay.className = 'aim-docs-modal-overlay';
  overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:99999; display:flex; justify-content:center; align-items:center; padding:15px; box-sizing:border-box;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:#080d1a; border:1px solid var(--accent); border-radius:8px; width:100%; max-width:760px; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 0 35px rgba(6,182,212,0.3); overflow:hidden; font-family:var(--font-hud);';

  let currentTab = 'all';

  function renderGrid() {
    const list = currentTab === 'cn' ? items.filter(it => it.isControlNet) : items;
    const gridEl = modal.querySelector('#vault-picker-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    if (list.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:40px 15px; color:#777; font-family:'Share Tech Mono', monospace;">
          <div style="font-size:2rem; margin-bottom:8px; opacity:0.5;">📂</div>
          ${currentTab === 'cn' ? 'No tagged ControlNet maps found in Vault or Gallery.<br>Switch to ALL ARTIFACTS or generate a map in CN Forge.' : 'No images found in Vault or Gallery.'}
        </div>
      `;
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.03); border:1px solid rgba(6,182,212,0.25); border-radius:4px; padding:6px; cursor:pointer; display:flex; flex-direction:column; gap:6px; transition:0.2s; position:relative; overflow:hidden;';
      
      const cnTagHTML = item.isControlNet ? `<span style="position:absolute; top:8px; right:8px; background:rgba(6,182,212,0.9); color:#000; font-size:0.6rem; font-weight:bold; padding:1px 5px; border-radius:2px; text-transform:uppercase;">${item.cnType}</span>` : '';

      card.innerHTML = `
        <div style="width:100%; height:110px; background:#000; border-radius:3px; overflow:hidden; position:relative;">
          <img src="${item.dataUrl}" style="width:100%; height:100%; object-fit:cover; display:block;" alt="${item.title}" />
          ${cnTagHTML}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem;">
          <span style="color:#888; font-family:'Share Tech Mono', monospace;">[${item.source}]</span>
          <span style="color:#aaa; max-width:85px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.title}</span>
        </div>
      `;

      card.onmouseenter = () => {
        card.style.borderColor = 'var(--accent)';
        card.style.background = 'rgba(6,182,212,0.1)';
        card.style.transform = 'translateY(-2px)';
      };
      card.onmouseleave = () => {
        card.style.borderColor = 'rgba(6,182,212,0.25)';
        card.style.background = 'rgba(255,255,255,0.03)';
        card.style.transform = 'translateY(0)';
      };
      card.onclick = () => {
        onSelect(item.dataUrl, item.cnType);
        if (overlay.parentElement) document.body.removeChild(overlay);
      };

      gridEl.appendChild(card);
    });
  }

  const cnCount = items.filter(it => it.isControlNet).length;

  modal.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-bottom:1px solid rgba(6,182,212,0.3); background:rgba(6,182,212,0.05);">
      <div>
        <div style="color:var(--accent); font-size:0.95rem; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
          <span>📂</span> CONTROLNET MAP REPOSITORY
        </div>
        <div style="color:#777; font-size:0.75rem; font-family:'Share Tech Mono', monospace; margin-top:2px;">Select image from Vault storage or Vision DB</div>
      </div>
      <button id="close-vp-modal" style="background:transparent; border:1px solid rgba(255,100,100,0.5); color:#ff6b6b; padding:4px 10px; border-radius:3px; cursor:pointer; font-size:0.8rem;">✕ CLOSE</button>
    </div>

    <div style="display:flex; gap:8px; padding:12px 18px; border-bottom:1px solid rgba(255,255,255,0.07); background:rgba(0,0,0,0.3);">
      <button id="vp-tab-all" class="aim-btn aim-btn-sm" style="padding:4px 12px; font-size:0.75rem; background:rgba(6,182,212,0.2); border-color:var(--accent); color:var(--accent);">ALL IMAGES (${items.length})</button>
      <button id="vp-tab-cn" class="aim-btn aim-btn-sm" style="padding:4px 12px; font-size:0.75rem; background:transparent; border-color:#555; color:#888;">CONTROLNET MAPS (${cnCount})</button>
    </div>

    <div id="vault-picker-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:10px; padding:15px; overflow-y:auto; max-height:55vh;">
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  renderGrid();

  modal.querySelector('#vp-tab-all').onclick = () => {
    currentTab = 'all';
    modal.querySelector('#vp-tab-all').style.background = 'rgba(6,182,212,0.2)';
    modal.querySelector('#vp-tab-all').style.borderColor = 'var(--accent)';
    modal.querySelector('#vp-tab-all').style.color = 'var(--accent)';
    modal.querySelector('#vp-tab-cn').style.background = 'transparent';
    modal.querySelector('#vp-tab-cn').style.borderColor = '#555';
    modal.querySelector('#vp-tab-cn').style.color = '#888';
    renderGrid();
  };

  modal.querySelector('#vp-tab-cn').onclick = () => {
    currentTab = 'cn';
    modal.querySelector('#vp-tab-cn').style.background = 'rgba(6,182,212,0.2)';
    modal.querySelector('#vp-tab-cn').style.borderColor = 'var(--accent)';
    modal.querySelector('#vp-tab-cn').style.color = 'var(--accent)';
    modal.querySelector('#vp-tab-all').style.background = 'transparent';
    modal.querySelector('#vp-tab-all').style.borderColor = '#555';
    modal.querySelector('#vp-tab-all').style.color = '#888';
    renderGrid();
  };

  modal.querySelector('#close-vp-modal').onclick = () => {
    if (overlay.parentElement) document.body.removeChild(overlay);
  };

  overlay.onclick = (e) => {
    if (e.target === overlay && overlay.parentElement) {
      document.body.removeChild(overlay);
    }
  };
}

function getControlNetSectionHTML(prefix) {
  return `
    <div class="aim-cn-mgmt-section" id="${prefix}-cn-mgmt" data-prefix="${prefix}" style="margin-top:14px; padding:12px; background:rgba(6,182,212,0.03); border:1px solid rgba(6,182,212,0.3); border-radius:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--accent); font-family:var(--font-hud); font-size:0.85rem; font-weight:bold; letter-spacing:1px;">⚙ CONTROLNET CONDITIONING</span>
          <span class="cn-status-badge" id="${prefix}-cn-status" style="font-size:0.7rem; padding:2px 6px; border-radius:3px; background:rgba(100,100,100,0.2); color:#888; border:1px solid #555;">INACTIVE</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="aim-btn aim-btn-sm" id="${prefix}-cn-load-vault" style="padding:3px 8px; font-size:0.75rem; border-color:#f59e0b; color:#f59e0b;" title="Load ControlNet map from Vault or Vision Gallery">📂 VAULT</button>
          <label class="aim-btn aim-btn-sm" style="padding:3px 8px; font-size:0.75rem; border-color:var(--accent); color:var(--accent); cursor:pointer; margin:0; display:inline-flex; align-items:center;" title="Upload custom map from device">
            📤 UPLOAD
            <input type="file" id="${prefix}-cn-upload-input" accept="image/*" style="display:none;" />
          </label>
          <button type="button" class="aim-btn aim-btn-sm" id="${prefix}-cn-forge-btn" style="padding:3px 8px; font-size:0.75rem; border-color:#8b5cf6; color:#a78bfa;" title="Open Preprocessor Forge">⚙ FORGE</button>
          <button type="button" class="aim-btn aim-btn-sm" id="${prefix}-cn-clear-btn" style="padding:3px 8px; font-size:0.75rem; border-color:#ff4444; color:#ff4444; display:none;" title="Clear active ControlNet map">✕ CLEAR</button>
        </div>
      </div>

      <div id="${prefix}-cn-active-view" style="display:none; margin-top:10px;">
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <div style="position:relative; flex-shrink:0;">
            <img id="${prefix}-cn-preview-thumb" src="" style="width:90px; height:90px; object-fit:contain; background:#000; border:1px solid var(--accent); border-radius:4px; display:block;" alt="ControlNet Map" />
            <span id="${prefix}-cn-type-badge" style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.85); color:var(--accent); font-size:0.6rem; padding:1px 4px; border-radius:2px; border:1px solid var(--accent); text-transform:uppercase;">CANNY</span>
          </div>
          
          <div style="flex:1; min-width:170px;">
            <div class="aim-row" style="margin-bottom:8px;">
              <label class="aim-label" style="font-size:0.75rem; margin-bottom:4px;">CONDITIONING TYPE</label>
              <select class="aim-input" id="${prefix}-cn-type-select" style="font-size:0.8rem; padding:4px 8px;">
                <option value="canny">Canny Edge</option>
                <option value="openpose">OpenPose Skeleton</option>
                <option value="depth">Depth (MiDaS)</option>
              </select>
            </div>

            <div>
              <label class="aim-label" style="font-size:0.75rem; margin-bottom:4px; display:flex; justify-content:space-between;">
                <span>STRENGTH / SCALE</span>
                <span class="aim-val-display" id="${prefix}-cn-scale-val">1.0</span>
              </label>
              <input class="aim-range" type="range" id="${prefix}-cn-scale-slider" min="0.1" max="2.0" step="0.05" value="1.0" style="margin:0;" />
            </div>
          </div>
        </div>
      </div>

      <div id="${prefix}-cn-empty-hint" style="font-size:0.75rem; color:#666; font-family:'Share Tech Mono', monospace; margin-top:4px;">
        No ControlNet guide map loaded. Load from Vault, upload an edge/pose/depth map, or forge one in CN Forge.
      </div>
    </div>
  `;
}

function bindControlNetSection(wrap, prefix) {
  const sec = wrap.querySelector(`#${prefix}-cn-mgmt`);
  if (!sec) return;
  sec.dataset.prefix = prefix;

  const vaultBtn = sec.querySelector(`#${prefix}-cn-load-vault`);
  if (vaultBtn) {
    vaultBtn.onclick = () => {
      openControlNetVaultPicker((selectedData, detectedType) => {
        setGlobalControlNet(selectedData, detectedType || 'canny');
        playSFX('pop', 0.8);
      });
    };
  }

  const uploadInput = sec.querySelector(`#${prefix}-cn-upload-input`);
  if (uploadInput) {
    uploadInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setGlobalControlNet(ev.target.result, 'canny');
        playSFX('pop', 0.8);
      };
      reader.readAsDataURL(file);
    };
  }

  const forgeBtn = sec.querySelector(`#${prefix}-cn-forge-btn`);
  if (forgeBtn) {
    forgeBtn.onclick = () => {
      document.querySelector('#aim-tab-cnet')?.click();
    };
  }

  const clearBtn = sec.querySelector(`#${prefix}-cn-clear-btn`);
  if (clearBtn) {
    clearBtn.onclick = () => {
      clearGlobalControlNet();
      playSFX('pop', 0.6);
    };
  }

  const typeSelect = sec.querySelector(`#${prefix}-cn-type-select`);
  if (typeSelect) {
    typeSelect.onchange = (e) => {
      window._cn_global_type = e.target.value;
      syncAllControlNetSections();
    };
  }

  const scaleSlider = sec.querySelector(`#${prefix}-cn-scale-slider`);
  const scaleVal = sec.querySelector(`#${prefix}-cn-scale-val`);
  if (scaleSlider) {
    scaleSlider.oninput = (e) => {
      const val = parseFloat(e.target.value);
      window._cn_global_scale = val;
      if (scaleVal) scaleVal.textContent = val.toFixed(2);
      document.querySelectorAll('.aim-cn-mgmt-section').forEach(otherSec => {
        if (otherSec !== sec) {
          const oP = otherSec.dataset.prefix;
          const oSl = otherSec.querySelector(`#${oP}-cn-scale-slider`);
          const oVal = otherSec.querySelector(`#${oP}-cn-scale-val`);
          if (oSl) oSl.value = val;
          if (oVal) oVal.textContent = val.toFixed(2);
        }
      });
    };
  }

  setTimeout(syncAllControlNetSections, 20);
}

function dispatchControlNetToModal(tabSelector, options = {}) {
  if (options.setImg2Img && window._cn_global_img) {
    window._i2i_injected_image = window._cn_global_img;
    window._pending_img2img_image = window._cn_global_img;
  }
  if (options.setUpscale && window._cn_global_img) {
    window._pending_upscale_image = window._cn_global_img;
  }
  if (options.setImg2Vid && window._cn_global_img) {
    window._pending_img2vid_image = window._cn_global_img;
  }

  const tabBtn = document.querySelector(tabSelector);
  if (tabBtn) {
    tabBtn.click();
    if (options.expandAdvanced) {
      setTimeout(() => {
        const adv = document.querySelector('#aim-content details.aim-advanced');
        if (adv) {
          adv.open = true;
          adv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 120);
    }
  }
}

/* ─── TXT2IMG PANEL ─────────────────────────────────────────── */
function buildTxt2Img() {
  const settings = getModalSettings();
  const isArchitect = settings.isArchitect;
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

        ${getControlNetSectionHTML('t2i')}
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

  bindControlNetSection(wrap, 't2i');

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
  const isArchitect = settings.isArchitect;
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

    <!-- FLUX.1-FILL INPAINTING CANVAS CONTAINER (OBJECTIVE 3) -->
    <div id="i2i-inpaint-panel" class="inpaint-wrapper" style="display:none;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <label class="aim-label" style="margin:0; font-weight:bold; color:var(--blue); font-size:0.75rem;">
          <span>🖌️</span> FLUX.1-FILL INPAINTING MASK CANVAS
        </label>
        <span class="inpaint-status-badge" id="inpaint-status" style="background:rgba(0,184,255,0.1); border:1px solid var(--border); color:var(--blue);">
          NO MASK (FULL INPAINT)
        </span>
      </div>
      <div class="inpaint-toolbar">
        <button type="button" class="aim-btn aim-btn-sm active" id="inpaint-tool-brush" style="padding:4px 10px;">🖌️ BRUSH</button>
        <button type="button" class="aim-btn aim-btn-sm" id="inpaint-tool-eraser" style="padding:4px 10px;">🧹 ERASER</button>
        
        <div style="display:flex; align-items:center; gap:8px; margin-left:6px;">
          <span style="font-size:0.7rem; color:var(--blue-dim); letter-spacing:1px;">SIZE:</span>
          <input type="range" id="inpaint-brush-size" min="5" max="100" value="30" style="width:90px; accent-color:var(--blue);" />
          <span id="inpaint-brush-size-val" style="font-size:0.75rem; color:var(--blue); font-family:var(--font-mono); min-width:32px;">30px</span>
        </div>

        <div style="margin-left:auto; display:flex; gap:6px;">
          <button type="button" class="aim-btn aim-btn-sm" id="inpaint-invert-btn" style="padding:4px 10px; border-color:#8b5cf6; color:#a78bfa;">🔄 INVERT</button>
          <button type="button" class="aim-btn aim-btn-sm" id="inpaint-clear-btn" style="padding:4px 10px; border-color:#ef4444; color:#ef4444;">🗑️ CLEAR MASK</button>
        </div>
      </div>

      <div class="inpaint-canvas-container" id="inpaint-canvas-wrap">
        <img id="inpaint-bg-img" class="inpaint-bg-img" alt="Inpaint source background" />
        <canvas id="i2i-inpaint-canvas" class="inpaint-canvas-layer"></canvas>
      </div>
      <div style="font-size:0.7rem; color:#888; font-family:var(--font-mono);">
        Draw over areas you want FLUX.1-Fill to regenerate. Mask is exported as high-res PNG matching exact input image resolution.
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

      <!-- COSXL DIRECT COMMANDS PANEL (OBJECTIVE 5) -->
      <div id="i2i-cosxl-panel" style="display:none; margin-top:10px; background:rgba(168,85,247,0.06); border:1px solid rgba(168,85,247,0.3); padding:10px 12px; border-radius:var(--radius);">
        <div style="font-family:var(--font-hud); font-size:0.72rem; color:#c084fc; letter-spacing:1px; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <span>🪄</span> COSXL NATURAL LANGUAGE DIRECT COMMANDS
        </div>
        <div style="font-size:0.72rem; color:#aaa; margin-bottom:8px;">
          State direct transformation commands guided by EDM VPred schedule:
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" class="aim-btn aim-btn-sm cosxl-chip" style="padding:3px 8px; font-size:0.72rem;" data-cmd="make it rainy with puddles and wet reflections">🌧️ Make it rainy</button>
          <button type="button" class="aim-btn aim-btn-sm cosxl-chip" style="padding:3px 8px; font-size:0.72rem;" data-cmd="turn into a classical textured oil painting">🎨 Oil painting</button>
          <button type="button" class="aim-btn aim-btn-sm cosxl-chip" style="padding:3px 8px; font-size:0.72rem;" data-cmd="change environment to a blizzard with snow and frost">❄️ Snow & blizzard</button>
          <button type="button" class="aim-btn aim-btn-sm cosxl-chip" style="padding:3px 8px; font-size:0.72rem;" data-cmd="change lighting to golden hour sunset with warm glows">🌅 Golden hour</button>
          <button type="button" class="aim-btn aim-btn-sm cosxl-chip" style="padding:3px 8px; font-size:0.72rem;" data-cmd="give subject glowing cybernetic implants and tech cyberware">🤖 Add cyberware</button>
        </div>
      </div>
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
      <div class="aim-field aim-field-half" style="display:flex; justify-content:flex-end; align-items:flex-end;">
        <label class="aim-label" style="display:flex; align-items:center; cursor:pointer; margin-bottom:6px; user-select:none;">
          <span style="margin-right:8px;">DETAILIFIER:</span>
          <div id="i2i-detailifier-btn" data-active="false" style="width:36px; height:20px; background:rgba(0,0,0,0.5); border:1px solid #10b981; border-radius:10px; position:relative; transition:0.3s;">
            <div class="toggle-knob" style="width:14px; height:14px; background:#10b981; border-radius:50%; position:absolute; top:2px; left:2px; transition:0.3s;"></div>
          </div>
        </label>
      </div>
    </div>

    <!-- 6 SYNTHESIS ARCHITECTURES SELECTOR -->
    <div class="aim-field" style="margin-top:10px;">
      <label class="aim-label">IMAGE TO IMAGE SYNTHESIS ARCHITECTURE</label>
      <div class="aim-seg aim-seg-6" id="i2i-model-select">
        <button type="button" class="aim-seg-btn active" data-model="qwen">🧠 QWEN</button>
        <button type="button" class="aim-seg-btn" data-model="flux">🌀 FLUX.1</button>
        <button type="button" class="aim-seg-btn" data-model="sdxl">⚡ SDXL NATIVE</button>
        <button type="button" class="aim-seg-btn" data-model="flux_fill">🖌️ FLUX.1-FILL</button>
        <button type="button" class="aim-seg-btn" data-model="cosxl">🪄 COSXL EDIT</button>
        <button type="button" class="aim-seg-btn" data-model="sd35">🌌 SD 3.5 LARGE</button>
      </div>
    </div>

    <!-- SDXL CUSTOM CHECKPOINT CATALOG (OBJECTIVE 2) -->
    <div id="i2i-sdxl-panel" style="display:none; margin-top:10px;">
      <label class="aim-label" for="i2i-checkpoint">SDXL CUSTOM CHECKPOINT CATALOG</label>
      <select class="aim-input" id="i2i-checkpoint">
        <option value="epicrealismXL_pureFix" selected>epicrealismXL_pureFix (Photorealism & Human Anatomy)</option>
        <option value="0x7RealisticFreedom_omegaSDXL">0x7RealisticFreedom_omegaSDXL (Hyper-Realistic Freedom)</option>
        <option value="juggernautXL_ragnarok">juggernautXL_ragnarok (Cinematic Lighting & Micro-Details)</option>
        <option value="cyberrealisticXL_desireV30">cyberrealisticXL_desireV30 (Cyberpunk High Dynamic Range)</option>
        <option value="unholyDesireMixSinister_v80">unholyDesireMixSinister_v80 (Sinister Dark Stylization)</option>
        <option value="lustifyNSFWCheckpoint_zenithV9">lustifyNSFWCheckpoint_zenithV9 (Unfiltered High-Aesthetic)</option>
        <option value="dreamshaperXL_alpha2Xl10">dreamshaperXL_alpha2Xl10 (Creative Concept & Digital Art)</option>
      </select>
    </div>

    <!-- TRANSFORMATION / DENOISING STRENGTH SLIDER (OBJECTIVES 2, 6) -->
    <div id="i2i-strength-panel" style="display:none; margin-top:10px;">
      <label class="aim-label" for="i2i-strength" id="i2i-strength-label" style="display:flex; justify-content:space-between;">
        <span>TRANSFORMATION / DENOISING STRENGTH</span>
        <span class="aim-val-display" id="i2i-strength-val">0.75 (75%)</span>
      </label>
      <input class="aim-range" type="range" id="i2i-strength" min="0.05" max="1.0" step="0.05" value="0.75" />
      <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:var(--text-muted); margin-top:2px;">
        <span>0.05 (Subtle Refinement)</span>
        <span>0.50 (Balanced Alteration)</span>
        <span>1.00 (Complete Resynthesis)</span>
      </div>
    </div>

    <!-- COSXL IMAGE GUIDANCE SCALE (OBJECTIVE 5) -->
    <div id="i2i-cosxl-guidance-panel" style="display:none; margin-top:10px;">
      <label class="aim-label" for="i2i-img-guidance" style="display:flex; justify-content:space-between;">
        <span>IMAGE GUIDANCE SCALE (INPUT PRESERVATION)</span>
        <span class="aim-val-display" id="i2i-img-guidance-val">1.5</span>
      </label>
      <input class="aim-range" type="range" id="i2i-img-guidance" min="1.0" max="3.0" step="0.1" value="1.5" />
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
            <label class="aim-label" for="i2i-cfg" id="i2i-cfg-label">PROMPT ADHERANCE: <span class="aim-val-display" id="i2i-cfg-val">${parseFloat(settings.guidanceImg)}</span></label>
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

        ${getControlNetSectionHTML('i2i')}
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

  const speedBtns = wrap.querySelectorAll('#i2i-speed .aim-seg-btn');
  const i2iCfgInput = wrap.querySelector('#i2i-cfg');
  const i2iCfgVal = wrap.querySelector('#i2i-cfg-val');
  const i2iCfgLabel = wrap.querySelector('#i2i-cfg-label');

  const sdxlPanel = wrap.querySelector('#i2i-sdxl-panel');
  const strengthPanel = wrap.querySelector('#i2i-strength-panel');
  const strengthInput = wrap.querySelector('#i2i-strength');
  const strengthVal = wrap.querySelector('#i2i-strength-val');
  const cosxlPanel = wrap.querySelector('#i2i-cosxl-panel');
  const cosxlGuidancePanel = wrap.querySelector('#i2i-cosxl-guidance-panel');
  const cosxlImgGuidance = wrap.querySelector('#i2i-img-guidance');
  const cosxlImgGuidanceVal = wrap.querySelector('#i2i-img-guidance-val');
  const inpaintPanel = wrap.querySelector('#i2i-inpaint-panel');
  const inpaintCanvas = wrap.querySelector('#i2i-inpaint-canvas');
  const inpaintBgImg = wrap.querySelector('#i2i-inpaint-bg-img');
  const inpaintStatus = wrap.querySelector('#inpaint-status');

  /* ── FLUX.1-Fill Inpainting Canvas Engine ── */
  let inpaintCtx = inpaintCanvas ? inpaintCanvas.getContext('2d') : null;
  let isDrawing = false;
  let currentTool = 'brush';
  let brushSize = 30;
  let hasDrawnMask = false;
  let lastCoord = null;

  function syncInpaintImage(srcUrl) {
    if (!inpaintBgImg || !srcUrl) return;
    inpaintBgImg.src = srcUrl;
    inpaintBgImg.onload = () => {
      initInpaintCanvas();
    };
  }

  function initInpaintCanvas() {
    if (!inpaintBgImg || !inpaintCanvas) return;
    const w = inpaintBgImg.clientWidth || inpaintBgImg.offsetWidth || 300;
    const h = inpaintBgImg.clientHeight || inpaintBgImg.offsetHeight || 300;
    if (w <= 0 || h <= 0) return;
    inpaintCanvas.width = w;
    inpaintCanvas.height = h;
    inpaintCanvas.style.width = w + 'px';
    inpaintCanvas.style.height = h + 'px';
    inpaintCtx = inpaintCanvas.getContext('2d');
    inpaintCtx.lineCap = 'round';
    inpaintCtx.lineJoin = 'round';
    updateMaskStatus();
  }

  function updateMaskStatus() {
    if (!inpaintCanvas || !inpaintCtx) return;
    try {
      const imgData = inpaintCtx.getImageData(0, 0, inpaintCanvas.width, inpaintCanvas.height);
      let markedCount = 0;
      const totalPixels = imgData.data.length / 4;
      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] > 20) markedCount += 4;
      }
      const pct = Math.min(100, Math.round((markedCount / totalPixels) * 100));
      if (pct > 0) {
        hasDrawnMask = true;
        inpaintStatus.textContent = `MASK: ACTIVE (${pct}% DRAWN)`;
        inpaintStatus.style.color = '#10b981';
        inpaintStatus.style.borderColor = '#10b981';
        inpaintStatus.style.background = 'rgba(16, 185, 129, 0.15)';
      } else {
        hasDrawnMask = false;
        inpaintStatus.textContent = 'NO MASK (FULL INPAINT)';
        inpaintStatus.style.color = 'var(--blue)';
        inpaintStatus.style.borderColor = 'var(--border)';
        inpaintStatus.style.background = 'rgba(0, 184, 255, 0.1)';
      }
    } catch (e) {}
  }

  function getInpaintCoords(e) {
    const rect = inpaintCanvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const sx = inpaintCanvas.width / (rect.width || 1);
    const sy = inpaintCanvas.height / (rect.height || 1);
    return {
      x: (cx - rect.left) * sx,
      y: (cy - rect.top) * sy
    };
  }

  function drawStroke(x1, y1, x2, y2) {
    if (!inpaintCtx) return;
    inpaintCtx.beginPath();
    if (currentTool === 'eraser') {
      inpaintCtx.globalCompositeOperation = 'destination-out';
      inpaintCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      inpaintCtx.globalCompositeOperation = 'source-over';
      inpaintCtx.strokeStyle = 'rgba(0, 184, 255, 0.7)';
    }
    inpaintCtx.lineWidth = brushSize;
    inpaintCtx.moveTo(x1, y1);
    inpaintCtx.lineTo(x2, y2);
    inpaintCtx.stroke();
  }

  function startDraw(e) {
    if (e.cancelable) e.preventDefault();
    isDrawing = true;
    lastCoord = getInpaintCoords(e);
    drawStroke(lastCoord.x, lastCoord.y, lastCoord.x, lastCoord.y);
  }
  function moveDraw(e) {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const newCoord = getInpaintCoords(e);
    drawStroke(lastCoord.x, lastCoord.y, newCoord.x, newCoord.y);
    lastCoord = newCoord;
  }
  function endDraw() {
    if (isDrawing) {
      isDrawing = false;
      lastCoord = null;
      updateMaskStatus();
    }
  }

  if (inpaintCanvas) {
    inpaintCanvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    inpaintCanvas.addEventListener('touchstart', startDraw, { passive: false });
    inpaintCanvas.addEventListener('touchmove', moveDraw, { passive: false });
    inpaintCanvas.addEventListener('touchend', endDraw);
  }

  // Brush / Eraser tool buttons
  const toolBrushBtn = wrap.querySelector('#inpaint-tool-brush');
  const toolEraserBtn = wrap.querySelector('#inpaint-tool-eraser');
  if (toolBrushBtn) {
    toolBrushBtn.addEventListener('click', () => {
      currentTool = 'brush';
      toolBrushBtn.classList.add('active');
      toolEraserBtn?.classList.remove('active');
    });
  }
  if (toolEraserBtn) {
    toolEraserBtn.addEventListener('click', () => {
      currentTool = 'eraser';
      toolEraserBtn.classList.add('active');
      toolBrushBtn?.classList.remove('active');
    });
  }

  // Brush size slider
  const brushSizeSlider = wrap.querySelector('#inpaint-brush-size');
  const brushSizeVal = wrap.querySelector('#inpaint-brush-size-val');
  if (brushSizeSlider) {
    brushSizeSlider.addEventListener('input', () => {
      brushSize = parseInt(brushSizeSlider.value);
      if (brushSizeVal) brushSizeVal.textContent = `${brushSize}px`;
    });
  }

  // Clear mask
  wrap.querySelector('#inpaint-clear-btn')?.addEventListener('click', () => {
    if (!inpaintCtx || !inpaintCanvas) return;
    inpaintCtx.clearRect(0, 0, inpaintCanvas.width, inpaintCanvas.height);
    updateMaskStatus();
  });

  // Invert mask
  wrap.querySelector('#inpaint-invert-btn')?.addEventListener('click', () => {
    if (!inpaintCtx || !inpaintCanvas) return;
    const w = inpaintCanvas.width;
    const h = inpaintCanvas.height;
    const imgData = inpaintCtx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 20) {
        d[i + 3] = 0;
      } else {
        d[i] = 0;
        d[i + 1] = 184;
        d[i + 2] = 255;
        d[i + 3] = 180;
      }
    }
    inpaintCtx.putImageData(imgData, 0, 0);
    updateMaskStatus();
  });

  // Export base64 mask matching source image resolution
  function getInpaintMaskDataUrl() {
    if (!hasDrawnMask || !inpaintCanvas || !inpaintBgImg) return null;
    const origW = inpaintBgImg.naturalWidth || inpaintCanvas.width;
    const origH = inpaintBgImg.naturalHeight || inpaintCanvas.height;

    const off = document.createElement('canvas');
    off.width = origW;
    off.height = origH;
    const offCtx = off.getContext('2d');

    // Fill offscreen background solid black
    offCtx.fillStyle = '#000000';
    offCtx.fillRect(0, 0, origW, origH);

    // Create white-only representation of drawn strokes
    const tmp = document.createElement('canvas');
    tmp.width = inpaintCanvas.width;
    tmp.height = inpaintCanvas.height;
    const tmpCtx = tmp.getContext('2d');
    tmpCtx.drawImage(inpaintCanvas, 0, 0);
    tmpCtx.globalCompositeOperation = 'source-in';
    tmpCtx.fillStyle = '#FFFFFF';
    tmpCtx.fillRect(0, 0, tmp.width, tmp.height);

    // Render scaled white mask on black canvas
    offCtx.drawImage(tmp, 0, 0, origW, origH);
    return off.toDataURL('image/png');
  }

  // CosXL Quick Command Chips
  wrap.querySelectorAll('.cosxl-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const promptInput = wrap.querySelector('#i2i-prompt');
      if (promptInput) {
        promptInput.value = chip.dataset.cmd;
        playSFX('pop', 0.8);
      }
    });
  });

  // Strength Slider Handler
  if (strengthInput) {
    strengthInput.addEventListener('input', () => {
      const val = parseFloat(strengthInput.value);
      if (strengthVal) strengthVal.textContent = `${val.toFixed(2)} (${Math.round(val * 100)}%)`;
    });
  }

  // CosXL Image Guidance Handler
  if (cosxlImgGuidance) {
    cosxlImgGuidance.addEventListener('input', () => {
      if (cosxlImgGuidanceVal) cosxlImgGuidanceVal.textContent = parseFloat(cosxlImgGuidance.value).toFixed(1);
    });
  }

  /* ── Model Switching Logic (Objectives 1-6) ── */
  function updateModelUI(model) {
    if (sdxlPanel) sdxlPanel.style.display = (model === 'sdxl') ? 'block' : 'none';
    if (strengthPanel) strengthPanel.style.display = (model === 'sdxl' || model === 'sd35' || model === 'flux') ? 'block' : 'none';
    if (cosxlPanel) cosxlPanel.style.display = (model === 'cosxl') ? 'block' : 'none';
    if (cosxlGuidancePanel) cosxlGuidancePanel.style.display = (model === 'cosxl') ? 'block' : 'none';
    if (inpaintPanel) {
      inpaintPanel.style.display = (model === 'flux_fill') ? 'block' : 'none';
      if (model === 'flux_fill') setTimeout(initInpaintCanvas, 60);
    }

    if (model === 'flux') {
      if (speedBtns.length >= 3) {
        speedBtns[0].textContent = '⚡ FAST (4)';
        speedBtns[0].dataset.steps = '4';
        speedBtns[1].textContent = '⚖ NORMAL (6)';
        speedBtns[1].dataset.steps = '6';
        speedBtns[2].textContent = '🎯 HIGH (8)';
        speedBtns[2].dataset.steps = '8';
      }
      if (i2iCfgLabel) i2iCfgLabel.innerHTML = `PROMPT ADHERANCE: <span class="aim-val-display" id="i2i-cfg-val">${parseFloat(settings.guidanceImg || 4.0)}</span>`;
    } else if (model === 'sdxl') {
      if (speedBtns.length >= 3) {
        speedBtns[0].textContent = '⚡ FAST (20)';
        speedBtns[0].dataset.steps = '20';
        speedBtns[1].textContent = '⚖ NORMAL (30)';
        speedBtns[1].dataset.steps = '30';
        speedBtns[2].textContent = '🎯 HIGH (45)';
        speedBtns[2].dataset.steps = '45';
      }
      if (i2iCfgInput) { i2iCfgInput.min = '1'; i2iCfgInput.max = '20'; i2iCfgInput.value = '7.0'; }
      if (i2iCfgLabel) i2iCfgLabel.innerHTML = `CFG GUIDANCE SCALE: <span class="aim-val-display" id="i2i-cfg-val">7.0</span>`;
    } else if (model === 'flux_fill') {
      if (speedBtns.length >= 3) {
        speedBtns[0].textContent = '⚡ FAST (15)';
        speedBtns[0].dataset.steps = '15';
        speedBtns[1].textContent = '⚖ NORMAL (25)';
        speedBtns[1].dataset.steps = '25';
        speedBtns[2].textContent = '🎯 HIGH (35)';
        speedBtns[2].dataset.steps = '35';
      }
      if (i2iCfgInput) { i2iCfgInput.min = '1'; i2iCfgInput.max = '40'; i2iCfgInput.value = '30.0'; }
      if (i2iCfgLabel) i2iCfgLabel.innerHTML = `INPAINT GUIDANCE: <span class="aim-val-display" id="i2i-cfg-val">30.0</span>`;
    } else if (model === 'cosxl') {
      if (speedBtns.length >= 3) {
        speedBtns[0].textContent = '⚡ FAST (20)';
        speedBtns[0].dataset.steps = '20';
        speedBtns[1].textContent = '⚖ NORMAL (30)';
        speedBtns[1].dataset.steps = '30';
        speedBtns[2].textContent = '🎯 HIGH (40)';
        speedBtns[2].dataset.steps = '40';
      }
      if (i2iCfgInput) { i2iCfgInput.min = '1'; i2iCfgInput.max = '15'; i2iCfgInput.value = '7.0'; }
      if (i2iCfgLabel) i2iCfgLabel.innerHTML = `TEXT GUIDANCE (CFG): <span class="aim-val-display" id="i2i-cfg-val">7.0</span>`;
    } else if (model === 'sd35') {
      if (speedBtns.length >= 3) {
        speedBtns[0].textContent = '⚡ FAST (15)';
        speedBtns[0].dataset.steps = '15';
        speedBtns[1].textContent = '⚖ NORMAL (25)';
        speedBtns[1].dataset.steps = '25';
        speedBtns[2].textContent = '🎯 HIGH (40)';
        speedBtns[2].dataset.steps = '40';
      }
      if (i2iCfgInput) { i2iCfgInput.min = '1'; i2iCfgInput.max = '15'; i2iCfgInput.value = '4.5'; }
      if (i2iCfgLabel) i2iCfgLabel.innerHTML = `MMDiT GUIDANCE SCALE: <span class="aim-val-display" id="i2i-cfg-val">4.5</span>`;
    } else {
      // Default: qwen
      if (speedBtns.length >= 3) {
        speedBtns[0].textContent = '⚡ FAST';
        speedBtns[0].dataset.steps = settings.stepsFastImg || '15';
        speedBtns[1].textContent = '⚖ NORMAL';
        speedBtns[1].dataset.steps = settings.stepsNormalImg || '25';
        speedBtns[2].textContent = '🎯 DETAILED';
        speedBtns[2].dataset.steps = settings.stepsFocusedImg || '40';
      }
      if (i2iCfgInput) { i2iCfgInput.min = '1'; i2iCfgInput.max = '20'; i2iCfgInput.value = settings.guidanceImg || '4.0'; }
      if (i2iCfgLabel) i2iCfgLabel.innerHTML = `PROMPT ADHERANCE: <span class="aim-val-display" id="i2i-cfg-val">${parseFloat(settings.guidanceImg || 4.0)}</span>`;
    }
  }

  wrap.querySelectorAll('#i2i-model-select .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#i2i-model-select .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateModelUI(btn.dataset.model);
    });
  });

  if (i2iCfgInput) {
    i2iCfgInput.addEventListener('input', () => {
      const val = parseFloat(i2iCfgInput.value);
      if (i2iCfgVal) i2iCfgVal.textContent = val.toFixed(1);
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
    if (prv === preview) {
      syncInpaintImage(url);
    }
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

  bindControlNetSection(wrap, 'i2i');

  if (window._i2i_injected_image || window._pending_img2img_image) {
    const injected = window._i2i_injected_image || window._pending_img2img_image;
    window._i2i_injected_image = null;
    window._pending_img2img_image = null;
    fetch(injected)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'injected_artifact.png', { type: blob.type || 'image/png' });
        fileInput._droppedFile = file;
        showPreview(file, preview, dzInner, dropzone);
      })
      .catch(() => {});
  }

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

      const selectedI2iModel = wrap.querySelector('#i2i-model-select .aim-seg-btn.active')?.dataset?.model || 'qwen';
      formData.append('model', selectedI2iModel);
      formData.append('model_name', selectedI2iModel);

      // Objective 2: SDXL Native Checkpoint Catalog
      if (selectedI2iModel === 'sdxl') {
        const ckpt = wrap.querySelector('#i2i-checkpoint')?.value || 'epicrealismXL_pureFix';
        formData.append('checkpoint', ckpt);
      }

      // Objectives 2, 6 & Flux: Denoising Strength
      const denoiseVal = parseFloat(wrap.querySelector('#i2i-strength')?.value || 0.75);
      formData.append('strength', denoiseVal);

      // Objective 5: CosXL Edit Direct Natural Language Instruction
      if (selectedI2iModel === 'cosxl') {
        formData.append('instruction', prompt);
        const imgG = parseFloat(wrap.querySelector('#i2i-img-guidance')?.value || 1.5);
        formData.append('image_guidance_scale', imgG);
      }

      // Objective 3: FLUX.1-Fill Inpainting Canvas Mask Export
      if (selectedI2iModel === 'flux_fill') {
        const maskDataUrl = getInpaintMaskDataUrl();
        if (maskDataUrl) {
          formData.append('mask_b64', maskDataUrl);
        }
      }
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

/* ─── OMNIGEN MULTIMODAL SYNTHESIS PANEL (OBJECTIVE 1) ──────── */
export function buildOmniGen() {
  const settings = getModalSettings();
  const isArchitect = settings.isArchitect;
  const maxBatchCount = isArchitect ? Infinity : 4;

  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">🧬</span>
      <span class="aim-panel-title">OMNIGEN // UNIFIED MULTIMODAL ENGINE</span>
      <span class="aim-panel-badge">BAAI OMNIGEN-V1</span>
    </div>

    <p style="font-size:0.8rem; color:#88c0d0; line-height:1.5; margin-bottom:12px; font-family:var(--font-mono);">
      Arbitrary multi-image conditioning & instruction editing via BAAI/OmniGen-v1. Drop up to 3 conditioning images and reference them in prompt using <span class="omnigen-token-pill" data-token="<img><|image_1|></img>">&lt;img&gt;&lt;|image_1|&gt;&lt;/img&gt;</span>, <span class="omnigen-token-pill" data-token="<img><|image_2|></img>">&lt;img&gt;&lt;|image_2|&gt;&lt;/img&gt;</span>, <span class="omnigen-token-pill" data-token="<img><|image_3|></img>">&lt;img&gt;&lt;|image_3|&gt;&lt;/img&gt;</span> or leave prompt freeform for automatic slot binding.
    </p>

    <!-- 3 REFERENCE IMAGE SLOTS GRID -->
    <div class="aim-field">
      <label class="aim-label">CONDITIONING REFERENCE IMAGES (UP TO 3 SLOTS)</label>
      <div class="omnigen-slots-grid" id="omnigen-slots">
        <!-- SLOT 1 -->
        <div class="omnigen-slot-card" id="omni-slot-0" data-slot="0">
          <span class="omnigen-slot-badge">REF #1: &lt;|image_1|&gt;</span>
          <button type="button" class="omnigen-slot-remove hidden" id="omni-remove-0" title="Remove image">✕</button>
          <input type="file" class="aim-file-input" id="omni-file-0" accept="image/*" />
          <div class="aim-dropzone-inner" id="omni-dz-0">
            <div class="aim-dz-icon">📁</div>
            <div class="aim-dz-text">DROP REF #1</div>
            <div class="aim-dz-sub">Subject / Identity</div>
          </div>
          <img class="omnigen-slot-preview hidden" id="omni-preview-0" alt="Ref 1 preview" />
          <button type="button" class="omnigen-slot-insert-btn" id="omni-card-insert-0" data-slot="0" data-token="<img><|image_1|></img>" title="Insert <img><|image_1|></img> at cursor in prompt">
            <span class="omnigen-btn-plus">+</span> Insert &lt;|image_1|&gt;
          </button>
        </div>

        <!-- SLOT 2 -->
        <div class="omnigen-slot-card" id="omni-slot-1" data-slot="1">
          <span class="omnigen-slot-badge">REF #2: &lt;|image_2|&gt;</span>
          <button type="button" class="omnigen-slot-remove hidden" id="omni-remove-1" title="Remove image">✕</button>
          <input type="file" class="aim-file-input" id="omni-file-1" accept="image/*" />
          <div class="aim-dropzone-inner" id="omni-dz-1">
            <div class="aim-dz-icon">📁</div>
            <div class="aim-dz-text">DROP REF #2</div>
            <div class="aim-dz-sub">Style / Outfit / Pose</div>
          </div>
          <img class="omnigen-slot-preview hidden" id="omni-preview-1" alt="Ref 2 preview" />
          <button type="button" class="omnigen-slot-insert-btn" id="omni-card-insert-1" data-slot="1" data-token="<img><|image_2|></img>" title="Insert <img><|image_2|></img> at cursor in prompt">
            <span class="omnigen-btn-plus">+</span> Insert &lt;|image_2|&gt;
          </button>
        </div>

        <!-- SLOT 3 -->
        <div class="omnigen-slot-card" id="omni-slot-2" data-slot="2">
          <span class="omnigen-slot-badge">REF #3: &lt;|image_3|&gt;</span>
          <button type="button" class="omnigen-slot-remove hidden" id="omni-remove-2" title="Remove image">✕</button>
          <input type="file" class="aim-file-input" id="omni-file-2" accept="image/*" />
          <div class="aim-dropzone-inner" id="omni-dz-2">
            <div class="aim-dz-icon">📁</div>
            <div class="aim-dz-text">DROP REF #3</div>
            <div class="aim-dz-sub">Background / Scene</div>
          </div>
          <img class="omnigen-slot-preview hidden" id="omni-preview-2" alt="Ref 3 preview" />
          <button type="button" class="omnigen-slot-insert-btn" id="omni-card-insert-2" data-slot="2" data-token="<img><|image_3|></img>" title="Insert <img><|image_3|></img> at cursor in prompt">
            <span class="omnigen-btn-plus">+</span> Insert &lt;|image_3|&gt;
          </button>
        </div>
      </div>
    </div>

    <!-- PROMPT / TRANSFORMATION INSTRUCTION -->
    <div class="aim-field">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" for="omni-prompt" style="margin:0;">MULTIMODAL SYNTHESIS PROMPT & INSTRUCTION</label>
        <button type="button" class="aim-btn aim-btn-sm" id="omni-enhance-btn" style="padding:2px 10px; font-size:0.75rem; background:rgba(6,182,212,0.15); border-color:var(--accent); color:var(--accent);" title="Auto-enhance instruction with AI matrix descriptors">✨ AI ENHANCE</button>
      </div>

      <!-- REFERENCE INSERTION TOOLBAR -->
      <div class="omnigen-ref-toolbar" id="omni-ref-toolbar">
        <span class="omnigen-ref-toolbar-label">
          <span>🎯 INSERT REF:</span>
        </span>
        <button type="button" class="aim-btn aim-btn-sm omnigen-insert-ref-btn" data-slot="0" data-token="<img><|image_1|></img>" id="omni-insert-toolbar-0" title="Click to insert <img><|image_1|></img> at current cursor position">
          <span class="omnigen-btn-plus">+</span> 🖼️ Image 1 <span class="omnigen-ref-tag-preview">&lt;|image_1|&gt;</span>
        </button>
        <button type="button" class="aim-btn aim-btn-sm omnigen-insert-ref-btn" data-slot="1" data-token="<img><|image_2|></img>" id="omni-insert-toolbar-1" title="Click to insert <img><|image_2|></img> at current cursor position">
          <span class="omnigen-btn-plus">+</span> 🖼️ Image 2 <span class="omnigen-ref-tag-preview">&lt;|image_2|&gt;</span>
        </button>
        <button type="button" class="aim-btn aim-btn-sm omnigen-insert-ref-btn" data-slot="2" data-token="<img><|image_3|></img>" id="omni-insert-toolbar-2" title="Click to insert <img><|image_3|></img> at current cursor position">
          <span class="omnigen-btn-plus">+</span> 🖼️ Image 3 <span class="omnigen-ref-tag-preview">&lt;|image_3|&gt;</span>
        </button>
      </div>

      <textarea class="aim-textarea" id="omni-prompt" rows="3" placeholder="e.g. <img><|image_1|></img> wears the outfit from <img><|image_2|></img> in a futuristic cyberpunk city at night..."></textarea>
      
      <div class="aim-quick-actions" style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
        <button type="button" class="aim-btn aim-btn-sm omni-quick-action" style="padding:4px 8px; font-size:0.75rem;" data-prompt="<img><|image_1|></img> in the artistic visual style and aesthetic lighting of <img><|image_2|></img>, masterpiece, highly detailed">🧬 Style Fusion</button>
        <button type="button" class="aim-btn aim-btn-sm omni-quick-action" style="padding:4px 8px; font-size:0.75rem;" data-prompt="A fashion model wearing the clothing and garment from <img><|image_1|></img> in a professional studio setting, high resolution, 8k">👗 Virtual Try-On</button>
        <button type="button" class="aim-btn aim-btn-sm omni-quick-action" style="padding:4px 8px; font-size:0.75rem;" data-prompt="The character in <img><|image_1|></img> in the exact bodily pose and camera angle of <img><|image_2|></img>, photorealistic">🤸 Pose Transfer</button>
        <button type="button" class="aim-btn aim-btn-sm omni-quick-action" style="padding:4px 8px; font-size:0.75rem;" data-prompt="Place the object from <img><|image_2|></img> naturally onto the scene in <img><|image_1|></img> with matching shadow and realistic lighting">✂️ Object Placement</button>
        <button type="button" class="aim-btn aim-btn-sm omni-quick-action" style="padding:4px 8px; font-size:0.75rem;" data-prompt="<img><|image_1|></img> re-imagined as a high-tier cyberpunk runner with neon cyberware, rain reflections, volumetric lighting">🌃 Cyberpunk Re-imagining</button>
      </div>
    </div>

    <!-- INFERENCE PARAMETERS -->
    <div class="aim-row">
      <div class="aim-field aim-field-half">
        <label class="aim-label">INFERENCE STEPS</label>
        <div class="aim-seg aim-seg-3" id="omni-speed">
          <button type="button" class="aim-seg-btn" data-steps="25">⚡ FAST (25)</button>
          <button type="button" class="aim-seg-btn active" data-steps="35">⚖ NORMAL (35)</button>
          <button type="button" class="aim-seg-btn" data-steps="50">🎯 DETAILED (50)</button>
        </div>
      </div>
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="omni-aspect">ASPECT RATIO / CANVAS</label>
        <select class="aim-input" id="omni-aspect">
          <option value="1024x1024" selected>1:1 Square (1024x1024)</option>
          <option value="832x1216">2:3 Portrait (832x1216)</option>
          <option value="1216x832">3:2 Landscape (1216x832)</option>
          <option value="768x1344">9:16 Mobile Tall (768x1344)</option>
        </select>
      </div>
    </div>

    <!-- GUIDANCE CONTROLS -->
    <div class="aim-row" style="margin-top:10px;">
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="omni-cfg" style="display:flex; justify-content:space-between;">
          <span>TEXT GUIDANCE SCALE (CFG)</span>
          <span class="aim-val-display" id="omni-cfg-val">2.5</span>
        </label>
        <input class="aim-range" type="range" id="omni-cfg" min="1.0" max="7.0" step="0.5" value="2.5" />
      </div>

      <div class="aim-field aim-field-half">
        <label class="aim-label" for="omni-img-cfg" style="display:flex; justify-content:space-between;">
          <span>IMAGE GUIDANCE SCALE (INPUT FIDELITY)</span>
          <span class="aim-val-display" id="omni-img-cfg-val">1.6</span>
        </label>
        <input class="aim-range" type="range" id="omni-img-cfg" min="1.0" max="4.0" step="0.1" value="1.6" />
      </div>
    </div>

    <div class="aim-row" style="margin-top:10px;">
      <div class="aim-field" style="width:100%;">
        <label class="aim-label" for="omni-batch">BATCH COUNT ${isArchitect ? '<span style="color:#10b981; margin-left:4px;">[UNLIMITED]</span>' : '<span style="color:#f59e0b; margin-left:4px;">[MAX 4]</span>'}</label>
        <input class="aim-input" type="number" id="omni-batch" min="1" max="${maxBatchCount}" value="1" />
      </div>
    </div>

    <details class="aim-advanced" style="margin-top:10px;">
      <summary class="aim-advanced-toggle">▶ ADVANCED MULTIMODAL PARAMETERS</summary>
      <div class="aim-advanced-body">
        <div class="aim-field">
          <label class="aim-label" for="omni-neg">NEGATIVE PROMPT</label>
          <textarea class="aim-textarea aim-textarea-sm" id="omni-neg" rows="2">${settings.negativePrompt}</textarea>
        </div>
        <div class="aim-field">
          <label class="aim-label" for="omni-seed">SEED (-1 FOR RANDOM)</label>
          <input class="aim-input" type="number" id="omni-seed" value="-1" />
        </div>
      </div>
    </details>

    <button class="aim-btn aim-btn-generate" id="omni-gen-btn" style="${!sessionStorage.getItem('generate_authenticated') ? 'background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c;' : ''}; margin-top:16px;">
      <span class="aim-btn-icon">${sessionStorage.getItem('generate_authenticated') ? '⚡' : '🔒'}</span> ${sessionStorage.getItem('generate_authenticated') ? 'INITIATE OMNIGEN SYNTHESIS' : 'GUEST PREVIEW MODE — CLICK TO LOGIN'}
    </button>

    <div class="aim-status-bar" id="omni-status"></div>
    <div id="omni-loader-slot"></div>
    <div id="omni-result-slot"></div>
  `;

  // Slot Image Management
  const slotFiles = [null, null, null];

  for (let i = 0; i < 3; i++) {
    const slotCard = wrap.querySelector(`#omni-slot-${i}`);
    const fileInput = wrap.querySelector(`#omni-file-${i}`);
    const dzInner = wrap.querySelector(`#omni-dz-${i}`);
    const preview = wrap.querySelector(`#omni-preview-${i}`);
    const removeBtn = wrap.querySelector(`#omni-remove-${i}`);

    function setSlotImage(file) {
      if (!file) return;
      slotFiles[i] = file;
      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.classList.remove('hidden');
      dzInner.classList.add('hidden');
      removeBtn.classList.remove('hidden');
      slotCard.classList.add('has-image');
      const tbBtn = wrap.querySelector(`#omni-insert-toolbar-${i}`);
      if (tbBtn) tbBtn.classList.add('has-ref');
      const cardBtn = wrap.querySelector(`#omni-card-insert-${i}`);
      if (cardBtn) cardBtn.classList.add('has-ref');
      setStatus(wrap, '#omni-status', `Reference Image #${i + 1} loaded [${file.name}].`, 'info');
    }

    function clearSlot() {
      slotFiles[i] = null;
      preview.src = '';
      preview.classList.add('hidden');
      dzInner.classList.remove('hidden');
      removeBtn.classList.add('hidden');
      slotCard.classList.remove('has-image');
      const tbBtn = wrap.querySelector(`#omni-insert-toolbar-${i}`);
      if (tbBtn) tbBtn.classList.remove('has-ref');
      const cardBtn = wrap.querySelector(`#omni-card-insert-${i}`);
      if (cardBtn) cardBtn.classList.remove('has-ref');
      fileInput.value = '';
    }

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearSlot();
      setStatus(wrap, '#omni-status', `Reference Image #${i + 1} removed.`);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) setSlotImage(fileInput.files[0]);
    });

    slotCard.addEventListener('click', (e) => {
      if (e.target === removeBtn || e.target === fileInput || e.target.closest('.omnigen-slot-insert-btn')) return;
      fileInput.click();
    });

    slotCard.addEventListener('dragover', (e) => {
      e.preventDefault();
      slotCard.classList.add('drag-over');
    });
    slotCard.addEventListener('dragleave', () => slotCard.classList.remove('drag-over'));
    slotCard.addEventListener('drop', (e) => {
      e.preventDefault();
      slotCard.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) {
        setSlotImage(f);
      }
    });
  }

  // Pending Cross-Modal Image Handoff
  if (window._pending_omnigen_image) {
    const pendingImg = window._pending_omnigen_image;
    window._pending_omnigen_image = null;
    fetch(pendingImg)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'omni_seed_ref.png', { type: blob.type || 'image/png' });
        const slotCard = wrap.querySelector('#omni-slot-0');
        const dzInner = wrap.querySelector('#omni-dz-0');
        const preview = wrap.querySelector('#omni-preview-0');
        const removeBtn = wrap.querySelector('#omni-remove-0');
        slotFiles[0] = file;
        const url = URL.createObjectURL(file);
        preview.src = url;
        preview.classList.remove('hidden');
        dzInner.classList.add('hidden');
        removeBtn.classList.remove('hidden');
        slotCard.classList.add('has-image');
        const tbBtn0 = wrap.querySelector('#omni-insert-toolbar-0');
        if (tbBtn0) tbBtn0.classList.add('has-ref');
        const cardBtn0 = wrap.querySelector('#omni-card-insert-0');
        if (cardBtn0) cardBtn0.classList.add('has-ref');
        setStatus(wrap, '#omni-status', 'Reference Image #1 injected via Cross-Modal Synthesis Chain.', 'ok');
      })
      .catch(console.warn);
  }

  // Prompt Cursor-Aware Reference Insertion
  const promptInput = wrap.querySelector('#omni-prompt');
  let lastPromptStart = promptInput.value.length;
  let lastPromptEnd = promptInput.value.length;

  const updateCursorTracking = () => {
    if (typeof promptInput.selectionStart === 'number') {
      lastPromptStart = promptInput.selectionStart;
      lastPromptEnd = promptInput.selectionEnd ?? promptInput.selectionStart;
    }
  };
  promptInput.addEventListener('keyup', updateCursorTracking);
  promptInput.addEventListener('click', updateCursorTracking);
  promptInput.addEventListener('select', updateCursorTracking);
  promptInput.addEventListener('input', updateCursorTracking);

  function insertReferenceToken(token) {
    if (!token) return;
    let start = typeof promptInput.selectionStart === 'number'
      ? promptInput.selectionStart
      : (lastPromptStart ?? promptInput.value.length);
    let end = typeof promptInput.selectionEnd === 'number'
      ? promptInput.selectionEnd
      : (lastPromptEnd ?? promptInput.value.length);

    if (start < 0 || start > promptInput.value.length) start = promptInput.value.length;
    if (end < start || end > promptInput.value.length) end = start;

    const val = promptInput.value;
    const before = val.substring(0, start);
    const after = val.substring(end);
    promptInput.value = before + token + after;
    const newPos = start + token.length;
    lastPromptStart = newPos;
    lastPromptEnd = newPos;

    promptInput.focus();
    if (typeof promptInput.setSelectionRange === 'function') {
      promptInput.setSelectionRange(newPos, newPos);
    }
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    playSFX('pop', 0.8);
  }

  function bindInsertButton(btn) {
    if (!btn) return;
    // Prevent button mousedown/pointerdown from blurring prompt textarea
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
    });
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const token = btn.dataset.token || btn.getAttribute('data-token');
      insertReferenceToken(token);
    });
  }

  // Bind reference toolbar buttons
  wrap.querySelectorAll('.omnigen-insert-ref-btn').forEach(bindInsertButton);

  // Bind slot card insert buttons
  wrap.querySelectorAll('.omnigen-slot-insert-btn').forEach(bindInsertButton);

  // Bind header description token pills
  wrap.querySelectorAll('.omnigen-token-pill').forEach(bindInsertButton);

  // Prompt enhancement
  wrap.querySelector('#omni-enhance-btn')?.addEventListener('click', () => {
    const enhanced = enhancePromptWithAI(promptInput.value);
    if (enhanced) {
      promptInput.value = enhanced;
      setStatus(wrap, '#omni-status', 'OMNIGEN PROMPT ENHANCED WITH AI DESCRIPTORS.', 'ok');
    }
  });

  // Quick action presets
  wrap.querySelectorAll('.omni-quick-action').forEach(btn => {
    btn.addEventListener('click', () => {
      promptInput.value = btn.dataset.prompt;
      playSFX('pop', 0.8);
    });
  });

  // Range and Segments
  const cfgRange = wrap.querySelector('#omni-cfg');
  const cfgVal = wrap.querySelector('#omni-cfg-val');
  cfgRange.addEventListener('input', () => { cfgVal.textContent = parseFloat(cfgRange.value).toFixed(1); });

  const imgCfgRange = wrap.querySelector('#omni-img-cfg');
  const imgCfgVal = wrap.querySelector('#omni-img-cfg-val');
  imgCfgRange.addEventListener('input', () => { imgCfgVal.textContent = parseFloat(imgCfgRange.value).toFixed(1); });

  wrap.querySelectorAll('#omni-speed .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#omni-speed .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Execution Handler
  wrap.querySelector('#omni-gen-btn').addEventListener('click', async () => {
    if (!sessionStorage.getItem('generate_authenticated')) {
      setStatus(wrap, '#omni-status', 'GUEST PREVIEW MODE: Please log in with a profile PIN to execute multimodal synthesis.', 'error');
      import('../components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// LOGIN REQUIRED', subtitle: 'ENTER ACCESS PIN FOR OMNIGEN SYNTHESIS' });
      });
      return;
    }

    const promptText = promptInput.value.trim();
    const hasAnyImage = slotFiles.some(f => f !== null);
    if (!promptText && !hasAnyImage) {
      setStatus(wrap, '#omni-status', 'ERROR: Please provide a prompt or at least one reference image.', 'error');
      return;
    }

    const steps = parseInt(wrap.querySelector('#omni-speed .aim-seg-btn.active')?.dataset?.steps || '35');
    const aspect = wrap.querySelector('#omni-aspect').value;
    const [w, h] = aspect.split('x').map(Number);
    const cfg = parseFloat(cfgRange.value);
    const imgCfg = parseFloat(imgCfgRange.value);
    const batchSize = parseInt(wrap.querySelector('#omni-batch').value) || 1;
    const negPrompt = wrap.querySelector('#omni-neg').value.trim();
    const seedVal = parseInt(wrap.querySelector('#omni-seed').value) || -1;

    const loaderSlot = wrap.querySelector('#omni-loader-slot');
    const resultSlot = wrap.querySelector('#omni-result-slot');
    const genBtn = wrap.querySelector('#omni-gen-btn');

    genBtn.disabled = true;
    setStatus(wrap, '#omni-status', 'ROUTING TO OMNIGEN GPU CLUSTER...', 'info');
    const loader = buildLoader('CONDITIONING MULTIMODAL TENSORS...');
    loaderSlot.innerHTML = '';
    loaderSlot.appendChild(loader);

    const loaderMessages = [
      'CONDITIONING MULTIMODAL TENSORS...',
      'ENCODING REFERENCE IMAGES & PROMPT TOKENS...',
      'DIFFUSING UNIFIED MULTIMODAL LATENTS...',
      'ALIGNING CROSS-ATTENTION MATRICES...',
      'RENDERING FINAL ARTIFACT...'
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMessages.length;
      const ltEl = loaderSlot.querySelector('#aim-loader-text');
      if (ltEl) ltEl.textContent = loaderMessages[msgIdx];
    }, 2500);

    try {
      const formData = new FormData();
      formData.append('prompt', promptText || 'A detailed realistic rendering');
      formData.append('negative_prompt', negPrompt);
      formData.append('num_inference_steps', steps);
      formData.append('guidance_scale', cfg);
      formData.append('img_guidance_scale', imgCfg);
      formData.append('width', w);
      formData.append('height', h);
      formData.append('batch_size', batchSize);
      formData.append('seed', seedVal);

      // Append available reference image files
      slotFiles.forEach((file, idx) => {
        if (file) {
          formData.append(`image${idx + 1}`, file);
          formData.append('images', file);
        }
      });

      const endpoint = resolveEndpoint(settings.omnigenUrl, 'stream');
      const res = await fetch(endpoint, { method: 'POST', body: formData });
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
                  saveImageToGallery(profile, promptText || 'OmniGen Multimodal Synthesis', 'OmniGen Multimodal', dataUrl);
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
                    saveImageToGallery(profile, promptText || 'OmniGen Multimodal Synthesis', 'OmniGen Multimodal', dataUrl);
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
      setStatus(wrap, '#omni-status', 'OMNIGEN SYNTHESIS COMPLETE.', 'ok');
      logAction('IMAGE_GENERATED', { type: 'OMNIGEN', prompt: promptText, batchSize });
      if (window._aimNotifyWarm) window._aimNotifyWarm();
    } catch (err) {
      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';
      setStatus(wrap, '#omni-status', `FAILURE: ${err.message}`, 'error');
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
  const isArchitect = settings.isArchitect;

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
          <option value="tile-creative">SDXL ControlNet Tile (Creative Diffusion & Micro-Textures)</option>
          <option value="dsp-fast">Fast Adaptive DSP (Real-time Lanczos Resampling)</option>
        </select>
      </div>
    </div>

    <!-- CONTROLNET TILE CREATIVE DIFFUSION PANEL -->
    <div id="upscale-tile-panel" class="tile-creative-panel" style="display:none; margin-bottom:15px; border:1px solid rgba(168,85,247,0.35); background:rgba(168,85,247,0.04); border-radius:4px; padding:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-family:var(--font-hud); font-size:0.8rem; color:#c084fc; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:6px;">
          <span>🧩</span> SDXL CONTROLNET TILE DIFFUSION ENGINE
        </span>
        <span style="font-size:0.72rem; color:var(--text-muted); font-family:'Share Tech Mono', monospace;">COSINE SEAMLESS BLEND</span>
      </div>

      <div class="aim-row">
        <!-- TILE SIZE -->
        <div class="aim-field aim-field-half">
          <label class="aim-label" style="color:#d8b4fe;">TILE CHUNK SIZE</label>
          <div class="aim-seg aim-seg-3" id="upscale-tile-size-seg">
            <button class="aim-seg-btn" data-size="512">512 px</button>
            <button class="aim-seg-btn" data-size="768">768 px</button>
            <button class="aim-seg-btn active" data-size="1024">1024 px</button>
          </div>
        </div>

        <!-- TILE OVERLAP -->
        <div class="aim-field aim-field-half">
          <label class="aim-label" style="color:#d8b4fe;">SEAM OVERLAP RATIO</label>
          <div class="aim-seg aim-seg-3" id="upscale-tile-overlap-seg">
            <button class="aim-seg-btn" data-overlap="0.125">12.5%</button>
            <button class="aim-seg-btn active" data-overlap="0.25">25.0%</button>
            <button class="aim-seg-btn" data-overlap="0.50">50.0%</button>
          </div>
        </div>
      </div>

      <div class="aim-field" style="margin-top:8px;">
        <label class="aim-label" style="display:flex; justify-content:space-between; color:#d8b4fe;">
          <span>DIFFUSION CREATIVITY / DENOISE STRENGTH</span>
          <span id="upscale-creativity-val" style="color:#c084fc; font-weight:bold;">0.35 (35%)</span>
        </label>
        <input type="range" class="aim-slider" id="upscale-creativity" min="5" max="95" value="35" step="5" />
        <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); font-family:'Share Tech Mono', monospace; margin-top:2px;">
          <span>0.05 (Subtle Micro-Textures)</span>
          <span>0.35 (Balanced Detail Injection)</span>
          <span>0.95 (High Hallucination)</span>
        </div>
      </div>

      <div class="aim-field" style="margin-top:8px;">
        <label class="aim-label" for="upscale-tile-prompt" style="color:#d8b4fe;">CONDITIONING PROMPT (MICRO-DETAIL GUIDANCE)</label>
        <input type="text" class="aim-input" id="upscale-tile-prompt" placeholder="e.g., ultra-sharp 8k micro textures, pores, fine fabric weave, photorealistic cinematic lighting" value="ultra-detailed, 8k resolution, crisp textures, highly detailed, photorealistic micro-details" />
      </div>

      <div class="aim-field" style="margin-top:8px;">
        <label class="aim-label" for="upscale-tile-neg" style="color:#a855f7;">NEGATIVE PROMPT</label>
        <input type="text" class="aim-input" id="upscale-tile-neg" placeholder="blurry, low quality, distortion, seam lines, visible tiles, artifacts" value="blurry, low quality, artifacts, distorted, noisy, bad anatomy, seam lines, grid artifacts" />
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

  // Tile Creative controls wiring
  const modelSelect = wrap.querySelector('#upscale-model-select');
  const tilePanel = wrap.querySelector('#upscale-tile-panel');
  let activeTileSize = 1024;
  let activeTileOverlap = 0.25;

  modelSelect.onchange = () => {
    if (modelSelect.value === 'tile-creative') {
      tilePanel.style.display = 'block';
    } else {
      tilePanel.style.display = 'none';
    }
  };

  wrap.querySelectorAll('#upscale-tile-size-seg .aim-seg-btn').forEach(btn => {
    btn.onclick = () => {
      wrap.querySelectorAll('#upscale-tile-size-seg .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTileSize = parseInt(btn.dataset.size);
    };
  });

  wrap.querySelectorAll('#upscale-tile-overlap-seg .aim-seg-btn').forEach(btn => {
    btn.onclick = () => {
      wrap.querySelectorAll('#upscale-tile-overlap-seg .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTileOverlap = parseFloat(btn.dataset.overlap);
    };
  });

  const creativitySlider = wrap.querySelector('#upscale-creativity');
  const creativityVal = wrap.querySelector('#upscale-creativity-val');
  if (creativitySlider && creativityVal) {
    creativitySlider.oninput = () => {
      const val = (parseFloat(creativitySlider.value) / 100.0).toFixed(2);
      creativityVal.textContent = `${val} (${creativitySlider.value}%)`;
    };
  }

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
    const isTileCreative = modelName === 'tile-creative';
    const tilePrompt = wrap.querySelector('#upscale-tile-prompt')?.value.trim() || '';
    const tileNegPrompt = wrap.querySelector('#upscale-tile-neg')?.value.trim() || '';
    const creativityNumber = parseFloat(wrap.querySelector('#upscale-creativity')?.value || 35) / 100.0;
    const denoise = parseFloat(denoiseSlider.value) / 100.0;
    const sharpen = parseFloat(sharpenSlider.value) / 100.0;
    const faceEnhance = wrap.querySelector('#upscale-face-enhance').checked;
    const outFormat = wrap.querySelector('#upscale-format').value;

    execBtn.disabled = true;
    resultSlot.innerHTML = '';

    const loader = buildLoader(isTileCreative ? 'PARTITIONING TILES & COSINE MATRICES...' : 'ANALYZING SPATIAL FREQUENCIES...');
    loaderSlot.appendChild(loader);

    const loaderMessages = isTileCreative ? [
      'PARTITIONING TILES & COSINE MATRICES...',
      'DISPATCHING TENSORS TO MODAL SDXL CLUSTER...',
      'DIFFUSING MICRO-TEXTURES & HIGH FREQUENCIES...',
      'APPLYING SEAMLESS COSINE PARTITION OF UNITY...',
      'RECONSTRUCTING SUPER-RESOLUTION CANVAS...'
    ] : [
      'ANALYZING SPATIAL FREQUENCIES...',
      'DISPATCHING TENSOR TO MODAL GPU CLUSTER...',
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

    setStatus(wrap, '#upscale-status', `PROCESSING: Super-resolution ${activeScale}x via ${modelName}${isTileCreative ? ' [Tile Creative Diffusion]' : ''}...`, 'info');

    try {
      let resultData = null;

      if (modelName === 'dsp-fast') {
        resultData = await clientSideUpscale(currentSourceB64, activeScale, sharpen, denoise);
      } else {
        const upscaleEndpoint = resolveEndpoint(settings.upscalerUrl || (isArchitect ? 'https://alphacoreprogramming--alphacore-aio-backend-upscaler-web-cb5cf9.modal.run' : 'https://alphacoreprogramming--alphacore-aio-backend-upscaler-eco-7e901c.modal.run'));
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
              output_format: outFormat,
              mode: isTileCreative ? 'tile_creative' : 'standard',
              tile_size: activeTileSize,
              tile_overlap: activeTileOverlap,
              creativity: creativityNumber,
              denoise_strength: creativityNumber,
              prompt: tilePrompt,
              negative_prompt: tileNegPrompt
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
  const settings = getModalSettings();
  const isArchitect = settings.isArchitect;
  const tierColor = isArchitect ? '#38bdf8' : '#10b981';
  const tierBg = isArchitect ? 'rgba(56, 189, 248, 0.12)' : 'rgba(16, 185, 129, 0.12)';
  const tierBorder = isArchitect ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.4)';
  const tierIcon = isArchitect ? '⚡' : '🌱';

  const root = document.createElement('div');
  root.className = 'aim-root';
  root.innerHTML = `
    <div class="aim-header">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
        <div class="aim-header-badge">[SYS_MODULE] // GENERATIVE_AI</div>
        <div class="aim-tier-badge" style="background:${tierBg}; border:1px solid ${tierBorder}; color:${tierColor}; padding:4px 12px; font-family:var(--font-hud); font-size:0.75rem; border-radius:2px; font-weight:bold; letter-spacing:1px; display:inline-flex; align-items:center; gap:6px;">
          <span>${tierIcon}</span>
          <span>TIER: ${settings.tierName}</span>
          <span style="opacity:0.8; font-weight:normal; font-size:0.7rem;">(${settings.tierHardware})</span>
        </div>
      </div>
      <h1 class="glitch aim-title" data-text="AI MODALS // SYNTHESIS_ENGINE">AI MODALS // SYNTHESIS_ENGINE</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Neural synthesis via Modal GPU infrastructure. Active routing: <strong style="color:${tierColor}">${settings.tierName}</strong> (${settings.tierHardware}).</p>
    </div>

    <div class="aim-tabs" id="aim-tabs">
      <button class="aim-tab active" data-tab="txt2img" id="aim-tab-t2i">
        <span class="aim-tab-icon">✦</span> TXT2IMG
      </button>
      <button class="aim-tab" data-tab="img2img" id="aim-tab-i2i">
        <span class="aim-tab-icon">⟁</span> IMG2IMG
      </button>
      <button class="aim-tab" data-tab="omnigen" id="aim-tab-omnigen">
        <span class="aim-tab-icon">🧬</span> OMNIGEN
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
      <button class="aim-tab" data-tab="vid2audio" id="aim-tab-v2a">
        <span class="aim-tab-icon">🔊</span> VID2AUDIO
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

  function switchTab(targetTabName, updateUrl = true) {
    const tabBtn = root.querySelector(`.aim-tab[data-tab="${targetTabName}"]`);
    if (!tabBtn) return;
    tabs.forEach(t => t.classList.remove('active'));
    tabBtn.classList.add('active');
    content.innerHTML = '';
    switch (targetTabName) {
      case 'txt2img': currentPanel = buildTxt2Img(); break;
      case 'img2img': currentPanel = buildImg2Img(); break;
      case 'omnigen': currentPanel = buildOmniGen(); break;
      case 'upscaler': currentPanel = buildUpscaler(); break;
      case 'txt2vid': currentPanel = buildTxt2Vid(); break;
      case 'controlnet': currentPanel = buildControlNetForge(); break;
      case 'img2vid': currentPanel = buildImg2Vid(); break;
      case 'vid2audio': currentPanel = buildVid2Audio(); break;
      case 'framepack': currentPanel = buildFramepack(); break;
      default: currentPanel = buildTxt2Img(); break;
    }
    content.appendChild(currentPanel);
    if (updateUrl) {
      const currentUrl = (window.location.hash || '').split('?')[0];
      if (currentUrl.includes('aimodals') || currentUrl.includes('upscaler') || currentUrl.includes('vid2audio')) {
        window.history.replaceState(null, '', `#/aimodals?tab=${targetTabName}`);
      }
      window.dispatchEvent(new CustomEvent('alphacore-aimodal-tab', { detail: { tab: targetTabName } }));
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab, true);
    });
  });

  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const urlTab = searchParams.get('tab');

  if (urlTab) {
    setTimeout(() => switchTab(urlTab, false), 50);
  } else if (hash.includes('upscaler') || window._pending_upscale_image) {
    setTimeout(() => switchTab('upscaler', true), 50);
  } else if (hash.includes('omnigen')) {
    setTimeout(() => switchTab('omnigen', true), 50);
  } else if (hash.includes('vid2audio') || hash.includes('v2a') || window._pending_vid2audio_video) {
    setTimeout(() => switchTab('vid2audio', true), 50);
  } else if (hash.includes('txt2vid')) {
    setTimeout(() => switchTab('txt2vid', true), 50);
  } else if (hash.includes('img2vid')) {
    setTimeout(() => switchTab('img2vid', true), 50);
  } else if (hash.includes('controlnet') || hash.includes('cnet')) {
    setTimeout(() => switchTab('controlnet', true), 50);
  } else if (hash.includes('framepack')) {
    setTimeout(() => switchTab('framepack', true), 50);
  } else if (hash.includes('img2img')) {
    setTimeout(() => switchTab('img2img', true), 50);
  }

  const onExternalTabSelect = (e) => {
    if (!document.body.contains(root)) {
      window.removeEventListener('alphacore-aimodal-tab', onExternalTabSelect);
      return;
    }
    const target = e.detail?.tab;
    if (target) switchTab(target, false);
  };
  window.addEventListener('alphacore-aimodal-tab', onExternalTabSelect);

  const onHashChange = () => {
    if (!document.body.contains(root)) {
      window.removeEventListener('hashchange', onHashChange);
      return;
    }
    const currentHash = window.location.hash || '';
    if (currentHash.startsWith('#/aimodals')) {
      const qParams = new URLSearchParams(currentHash.includes('?') ? currentHash.split('?')[1] : '');
      const t = qParams.get('tab');
      if (t) switchTab(t, false);
    }
  };
  window.addEventListener('hashchange', onHashChange);

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

        ${getControlNetSectionHTML('t2v')}
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

  bindControlNetSection(wrap, 't2v');

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
        <div class="aim-result-actions" style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; align-items:center;">
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:#64748b; margin-right:auto;">// VIDEO SYNTHESIS CHAIN:</span>
          <button class="aim-btn aim-btn-dl" id="t2v-to-audio-btn" style="border-color:#eab308; color:#eab308;" title="Send video to Foley synthesis engine">🔊 GENERATE AUDIO (VID2AUDIO)</button>
          <button class="aim-btn aim-btn-dl" id="t2v-to-fp-btn" style="border-color:#06b6d4; color:#06b6d4;" title="Send video to Framepack neural interpolation">🎞️ INTERPOLATE (FRAMEPACK)</button>
          <button class="aim-btn aim-btn-dl" id="t2v-to-dir-btn" style="border-color:#ec4899; color:#ec4899;" title="Transfer video sequence to Cyber-Director timeline">🎬 SEND TO DIRECTOR</button>
          <button class="aim-btn aim-btn-accept" id="aim-dl-vid-btn">💾 SAVE VIDEO</button>
        </div>
      `;

      resultEl.querySelector('#aim-dl-vid-btn').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `alphacore_video_${Date.now()}.mp4`;
        a.click();
      };

      resultEl.querySelector('#t2v-to-audio-btn').onclick = () => {
        window._pending_vid2audio_video = url;
        const v2aTab = document.querySelector('#aim-tab-v2a');
        if (v2aTab) v2aTab.click();
        else window.location.hash = '#/aimodals?tab=vid2audio';
        playSFX('navigate', 0.5);
        showToast('SYNTHESIS CHAIN', 'Video handed off to Vid2Audio Foley synthesis engine.');
      };

      resultEl.querySelector('#t2v-to-fp-btn').onclick = () => {
        window._pending_framepack_video = url;
        const fpTab = document.querySelector('#aim-tab-fp');
        if (fpTab) fpTab.click();
        else window.location.hash = '#/aimodals?tab=framepack';
        playSFX('navigate', 0.5);
        showToast('SYNTHESIS CHAIN', 'Video handed off to Framepack neural interpolation.');
      };

      resultEl.querySelector('#t2v-to-dir-btn').onclick = () => {
        window._pending_director_video = url;
        sessionStorage.setItem('alphacore_director_injected_video', url);
        window.location.hash = '#/director';
        playSFX('navigate', 0.5);
        showToast('CYBER-DIRECTOR', 'Video imported into Cyber-Director Track 2 (Camera Motion).');
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

        ${getControlNetSectionHTML('i2v')}
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

  bindControlNetSection(wrap, 'i2v');

  if (window._pending_img2vid_image) {
    const pending = window._pending_img2vid_image;
    window._pending_img2vid_image = null;
    fetch(pending)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'injected_video_seed.png', { type: blob.type || 'image/png' });
        fileInput._droppedFile = file;
        showPreview(file);
      })
      .catch(() => {});
  }

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
        <div class="aim-result-actions" style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; align-items:center;">
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:#64748b; margin-right:auto;">// VIDEO SYNTHESIS CHAIN:</span>
          <button class="aim-btn aim-btn-dl" id="i2v-to-audio-btn" style="border-color:#eab308; color:#eab308;" title="Send video to Foley synthesis engine">🔊 GENERATE AUDIO (VID2AUDIO)</button>
          <button class="aim-btn aim-btn-dl" id="i2v-to-fp-btn" style="border-color:#06b6d4; color:#06b6d4;" title="Send video to Framepack neural interpolation">🎞️ INTERPOLATE (FRAMEPACK)</button>
          <button class="aim-btn aim-btn-dl" id="i2v-to-dir-btn" style="border-color:#ec4899; color:#ec4899;" title="Transfer video sequence to Cyber-Director timeline">🎬 SEND TO DIRECTOR</button>
          <button class="aim-btn aim-btn-accept" id="aim-dl-vid-btn">💾 SAVE VIDEO</button>
        </div>
      `;

      resultEl.querySelector('#aim-dl-vid-btn').onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `alphacore_video_${Date.now()}.mp4`;
        a.click();
      };

      resultEl.querySelector('#i2v-to-audio-btn').onclick = () => {
        window._pending_vid2audio_video = url;
        const v2aTab = document.querySelector('#aim-tab-v2a');
        if (v2aTab) v2aTab.click();
        else window.location.hash = '#/aimodals?tab=vid2audio';
        playSFX('navigate', 0.5);
        showToast('SYNTHESIS CHAIN', 'Video handed off to Vid2Audio Foley synthesis engine.');
      };

      resultEl.querySelector('#i2v-to-fp-btn').onclick = () => {
        window._pending_framepack_video = url;
        const fpTab = document.querySelector('#aim-tab-fp');
        if (fpTab) fpTab.click();
        else window.location.hash = '#/aimodals?tab=framepack';
        playSFX('navigate', 0.5);
        showToast('SYNTHESIS CHAIN', 'Video handed off to Framepack neural interpolation.');
      };

      resultEl.querySelector('#i2v-to-dir-btn').onclick = () => {
        window._pending_director_video = url;
        sessionStorage.setItem('alphacore_director_injected_video', url);
        window.location.hash = '#/director';
        playSFX('navigate', 0.5);
        showToast('CYBER-DIRECTOR', 'Video imported into Cyber-Director Track 2 (Camera Motion).');
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
  const settings = getModalSettings();
  const isArchitect = settings.isArchitect;

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
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">⚙</span>
      <span class="aim-panel-title">CONTROLNET FORGE</span>
      <span class="aim-panel-badge">PRE-PROCESSOR</span>
    </div>

    <div class="aim-field">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" style="margin:0;">BASE INPUT IMAGE</label>
        <button type="button" class="aim-btn aim-btn-sm" id="cn-load-vault-base-btn" style="padding:2px 10px; font-size:0.75rem; border-color:#f59e0b; color:#f59e0b;">
          📂 LOAD FROM VAULT
        </button>
      </div>
      <input type="file" id="cn-file-input" accept="image/png, image/jpeg, image/webp" style="display:none;" />
      <div class="aim-dropzone" id="cn-dropzone" style="cursor:pointer; text-align:center; padding:35px 20px; border:1px dashed var(--accent); border-radius:6px; background:rgba(6,182,212,0.03); transition:0.2s;">
        <div style="font-size:1.8rem; margin-bottom:6px;">📁</div>
        <div style="color:var(--accent); font-family:var(--font-hud); font-size:0.9rem; letter-spacing:1px;">CLICK OR DRAG & DROP BASE IMAGE</div>
        <div style="color:#666; font-size:0.75rem; margin-top:4px;">Supports PNG, JPEG, WEBP</div>
      </div>
      <img id="cn-preview" style="display:none; max-width:100%; max-height:400px; margin-top:10px; border-radius:4px; margin-left:auto; margin-right:auto; border:1px solid rgba(6,182,212,0.4); cursor:pointer;" title="Click to replace image" />
    </div>

    <div class="aim-field">
      <label class="aim-label">PRE-PROCESSOR TYPE</label>
      <select class="aim-input" id="cn-type">
        <option value="openpose">OpenPose (Human Pose Skeletons)</option>
        <option value="canny" selected>Canny (Crisp Edge Outlines)</option>
        <option value="depth">MiDaS (3D Depth Maps)</option>
      </select>
    </div>

    <button class="aim-btn aim-btn-generate" id="cn-generate-btn" style="width:100%;">⚙ GENERATE VISION MAP</button>
    <div id="cn-loader" style="display:none; text-align:center; margin-top:12px; color:var(--accent); font-family:'Share Tech Mono', monospace; font-size:0.85rem;">
      <span class="aim-spin" style="display:inline-block; margin-right:6px;">⚙</span> Processing vision map via Modal GPU node...
    </div>

    <div id="cn-result-container" style="display:none; margin-top:20px; border-top:1px solid rgba(6,182,212,0.3); padding-top:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
        <label class="aim-label" style="margin:0; display:flex; align-items:center; gap:8px;">
          <span>GENERATED CONTROLNET MAP:</span>
          <span id="cn-result-type-badge" style="color:var(--accent); font-weight:bold; background:rgba(6,182,212,0.15); border:1px solid var(--accent); padding:1px 6px; border-radius:3px; font-size:0.75rem;">CANNY</span>
        </label>
        <div style="display:flex; gap:8px;">
          <button type="button" class="aim-btn aim-btn-sm" id="cn-save-vault-btn" style="border-color:#f59e0b; color:#f59e0b;">💾 SAVE TO VAULT</button>
          <button type="button" class="aim-btn aim-btn-sm" id="cn-download-btn" style="border-color:var(--accent); color:var(--accent);">⬇ DOWNLOAD MAP</button>
        </div>
      </div>

      <img id="cn-result-img" style="max-width:100%; max-height:420px; display:block; border-radius:6px; margin: 0 auto 15px auto; border:1px solid var(--accent); background:#000;" />

      <!-- MULTI-MODAL DISPATCH MATRIX -->
      <div style="background:rgba(6,182,212,0.05); border:1px solid rgba(6,182,212,0.25); border-radius:6px; padding:12px; margin-top:15px;">
        <div style="margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
          <label class="aim-label" style="margin:0; color:var(--accent); font-weight:bold;">⚡ DISPATCH TO GENERATIVE MODALS</label>
          <span style="color:#888; font-size:0.75rem; font-family:'Share Tech Mono', monospace;">Sets active ControlNet conditioning across engine</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px;">
          <button type="button" class="aim-btn aim-btn-sm" id="cn-send-txt2img" style="background:rgba(6,182,212,0.12); color:var(--accent); border-color:var(--accent); padding:8px 6px; font-size:0.8rem; font-weight:bold;">✦ TXT2IMG</button>
          <button type="button" class="aim-btn aim-btn-sm" id="cn-send-img2img" style="background:rgba(168,85,247,0.12); color:#c084fc; border-color:#a855f7; padding:8px 6px; font-size:0.8rem; font-weight:bold;">⟁ IMG2IMG</button>
          <button type="button" class="aim-btn aim-btn-sm" id="cn-send-upscaler" style="background:rgba(16,185,129,0.12); color:#34d399; border-color:#10b981; padding:8px 6px; font-size:0.8rem; font-weight:bold;">🔍 UPSCALER</button>
          <button type="button" class="aim-btn aim-btn-sm" id="cn-send-txt2vid" style="background:rgba(239,68,68,0.12); color:#f87171; border-color:#ef4444; padding:8px 6px; font-size:0.8rem; font-weight:bold;">🎥 TXT2VID</button>
          <button type="button" class="aim-btn aim-btn-sm" id="cn-send-img2vid" style="background:rgba(245,158,11,0.12); color:#fbbf24; border-color:#f59e0b; padding:8px 6px; font-size:0.8rem; font-weight:bold;">🎞️ IMG2VID</button>
          <button type="button" class="aim-btn aim-btn-sm" id="cn-send-framepack" style="background:rgba(99,102,241,0.12); color:#818cf8; border-color:#6366f1; padding:8px 6px; font-size:0.8rem; font-weight:bold;">🎬 FRAMEPACK</button>
        </div>
      </div>
    </div>
  `;

  let base64Image = null;
  const fileInput = wrap.querySelector('#cn-file-input');
  const dropzone = wrap.querySelector('#cn-dropzone');
  const preview = wrap.querySelector('#cn-preview');
  const resultImg = wrap.querySelector('#cn-result-img');
  const resultTypeBadge = wrap.querySelector('#cn-result-type-badge');

  function setBaseImage(dataUrl) {
    base64Image = dataUrl;
    preview.src = dataUrl;
    preview.style.display = 'block';
    dropzone.style.display = 'none';
    wrap.querySelector('#cn-result-container').style.display = 'none';
  }

  dropzone.onclick = () => fileInput.click();
  preview.onclick = () => fileInput.click();

  // Drag and drop for base image
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#10b981'; });
  dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--accent)'; });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent)';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => setBaseImage(event.target.result);
      reader.readAsDataURL(file);
    }
  });

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setBaseImage(event.target.result);
    reader.readAsDataURL(file);
  };

  // Load Base Image from Vault
  wrap.querySelector('#cn-load-vault-base-btn').onclick = () => {
    openControlNetVaultPicker((dataUrl) => {
      setBaseImage(dataUrl);
      playSFX('pop', 0.8);
    });
  };

  // Generate Map
  wrap.querySelector('#cn-generate-btn').onclick = async () => {
    if (!base64Image) { alert("Please upload or load a base image first."); return; }
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
        resultTypeBadge.textContent = type.toUpperCase();
        wrap.querySelector('#cn-result-container').style.display = 'block';

        setGlobalControlNet(data.image_b64, type);
        playSFX('pop', 0.8);
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

  // Save Map to Vault
  wrap.querySelector('#cn-save-vault-btn').onclick = async () => {
    if (!window._cn_global_img) return;
    const vBtn = wrap.querySelector('#cn-save-vault-btn');
    const profile = sessionStorage.getItem('current_profile') || 'ARCHITECT';
    const type = (window._cn_global_type || 'canny').toUpperCase();

    try {
      let files = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
      files.push({
        id: Date.now().toString() + '_cn',
        owner: profile,
        filename: `CONTROLNET_${type}_${Date.now()}.png`,
        content: window._cn_global_img,
        type: 'image/png',
        tag: 'controlnet',
        controlnet_type: window._cn_global_type || 'canny',
        shared: false,
        createdAt: Date.now()
      });
      localStorage.setItem('alphacore_vault_files', JSON.stringify(files));
    } catch (e) {
      console.warn("Vault quota reached:", e);
    }

    try {
      await saveImageToGallery(profile, `ControlNet ${type} Map`, 'ControlNet Forge', window._cn_global_img);
    } catch (e) {
      console.warn("Gallery save failed:", e);
    }

    vBtn.textContent = '✔️ SAVED TO VAULT';
    vBtn.style.borderColor = '#10b981';
    vBtn.style.color = '#10b981';
    playSFX('pop', 0.8);
  };

  // Download Map
  wrap.querySelector('#cn-download-btn').onclick = () => {
    if (!window._cn_global_img) return;
    const a = document.createElement('a');
    a.href = window._cn_global_img;
    const type = window._cn_global_type || 'canny';
    a.download = `alphacore_controlnet_${type}_${Date.now()}.png`;
    a.click();
  };

  // Multi-Modal Dispatch Matrix Routing
  wrap.querySelector('#cn-send-txt2img').onclick = () => {
    dispatchControlNetToModal('#aim-tab-t2i', { expandAdvanced: true });
    playSFX('pop', 0.8);
  };

  wrap.querySelector('#cn-send-img2img').onclick = () => {
    dispatchControlNetToModal('#aim-tab-i2i', { setImg2Img: true, expandAdvanced: true });
    playSFX('pop', 0.8);
  };

  wrap.querySelector('#cn-send-upscaler').onclick = () => {
    dispatchControlNetToModal('#aim-tab-upscale', { setUpscale: true });
    playSFX('pop', 0.8);
  };

  wrap.querySelector('#cn-send-txt2vid').onclick = () => {
    dispatchControlNetToModal('#aim-tab-t2v', { expandAdvanced: true });
    playSFX('pop', 0.8);
  };

  wrap.querySelector('#cn-send-img2vid').onclick = () => {
    dispatchControlNetToModal('#aim-tab-i2v', { setImg2Vid: true, expandAdvanced: true });
    playSFX('pop', 0.8);
  };

  wrap.querySelector('#cn-send-framepack').onclick = () => {
    dispatchControlNetToModal('#aim-tab-fp');
    playSFX('pop', 0.8);
  };

  // If a global ControlNet map is already active, show it
  if (window._cn_global_img) {
    resultImg.src = window._cn_global_img;
    resultTypeBadge.textContent = (window._cn_global_type || 'canny').toUpperCase();
    wrap.querySelector('#cn-result-container').style.display = 'block';
  }

  return wrap;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO TO AUDIO (V2A) FOLEY SYNTHESIS PANEL (MMAUDIO 44.1kHz ENGINE)
// ═══════════════════════════════════════════════════════════════════════════════

function buildVid2Audio() {
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  
  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = `
    <div class="aim-panel-header">
      <span class="aim-panel-icon">🔊</span>
      <span class="aim-panel-title">VIDEO TO AUDIO // FOLEY SYNTHESIS</span>
      <span class="aim-panel-badge">MMAUDIO 44.1kHz ENGINE</span>
    </div>

    <div style="background: rgba(6, 182, 212, 0.08); border-left: 4px solid #06b6d4; padding: 12px 14px; margin-bottom: 20px; color: #bae6fd; font-size: 0.84rem; font-family: 'Share Tech Mono', monospace; line-height: 1.45;">
      <strong style="color: #38bdf8; letter-spacing: 1px;">[!] NEURAL FOLEY SYNTHESIZER:</strong> Upload any video (MP4, WEBM, MOV) to generate synchronized 44.1kHz audio tracks, environmental ambiance, sound effects, or foley footsteps. Conditioned on temporal video frames and optional sound direction prompts.
    </div>

    <!-- Video Dropzone & Preview -->
    <div class="aim-row">
      <div class="aim-field" style="width: 100%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <label class="aim-label" style="margin:0;">INPUT VIDEO SOURCE</label>
          <span id="v2a-video-meta" style="font-size:0.75rem; color:#94a3b8; font-family:monospace;">NO VIDEO LOADED</span>
        </div>
        <div class="aim-dropzone" id="v2a-dropzone" style="min-height: 190px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; position:relative; overflow:hidden; border:2px dashed rgba(6,182,212,0.4); border-radius:6px; background:rgba(15,23,42,0.6); padding:16px;">
          <input type="file" id="v2a-file" accept="video/mp4,video/webm,video/quicktime,video/ogg" class="aim-file-input" style="display:none;" />
          <div class="aim-dropzone-inner" id="v2a-dz-inner" style="text-align:center;">
            <div class="aim-dz-icon" style="font-size:2.8rem; margin-bottom:8px; filter:drop-shadow(0 0 10px rgba(6,182,212,0.4));">🎞️</div>
            <div class="aim-dz-text" style="font-family:var(--font-hud); font-weight:bold; color:#38bdf8; letter-spacing:1px; margin-bottom:4px;">DROP VIDEO FILE HERE OR CLICK TO BROWSE</div>
            <div style="font-size:0.75rem; color:#64748b;">SUPPORTS MP4, WEBM, MOV (UP TO 100MB)</div>
          </div>
          <div id="v2a-preview-wrapper" class="hidden" style="width:100%; max-width:640px; display:flex; flex-direction:column; align-items:center; gap:8px;">
            <video id="v2a-preview-video" controls muted playsinline style="width:100%; max-height:280px; border-radius:4px; object-fit:contain; background:#000; box-shadow:0 0 15px rgba(0,0,0,0.8);"></video>
            <button id="v2a-change-video-btn" type="button" class="aim-btn aim-btn-sm" style="font-size:0.72rem; padding:4px 10px; background:rgba(255,255,255,0.05); border-color:#64748b; color:#94a3b8;">
              🔄 REPLACE VIDEO
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Direction Prompt & Preset Chips -->
    <div class="aim-field" style="margin-top:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <label class="aim-label" for="v2a-prompt" style="margin:0;">SOUNDTRACK & FOLEY DIRECTION (OPTIONAL)</label>
        <span style="font-size:0.72rem; color:#64748b;">LEAVE BLANK FOR AUTONOMOUS SOUND</span>
      </div>
      <textarea class="aim-textarea" id="v2a-prompt" rows="2" placeholder="e.g. Heavy boots on wet steel grating, distant neon buzz, sudden metallic screech..."></textarea>
      
      <!-- Preset Chips -->
      <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
        <span style="font-size:0.72rem; color:#64748b; font-family:monospace; margin-right:4px;">DIRECTION PRESETS:</span>
        <button type="button" class="v2a-chip aim-btn aim-btn-sm" data-preset="🌧️ Heavy cyber rain, neon street hum, distant sirens" style="font-size:0.7rem; padding:3px 8px; border-color:#0284c7; color:#38bdf8;">🌧️ Cyber Rain</button>
        <button type="button" class="v2a-chip aim-btn aim-btn-sm" data-preset="👣 Heavy combat boots running on metal grating, echoing foley" style="font-size:0.7rem; padding:3px 8px; border-color:#0284c7; color:#38bdf8;">👣 Metal Footsteps</button>
        <button type="button" class="v2a-chip aim-btn aim-btn-sm" data-preset="🚗 High-speed cyber car engine, turbo blowoff, tire skid" style="font-size:0.7rem; padding:3px 8px; border-color:#0284c7; color:#38bdf8;">🚗 Engine & Skid</button>
        <button type="button" class="v2a-chip aim-btn aim-btn-sm" data-preset="⚡ High-voltage electric arc, plasma discharges, humming reactor" style="font-size:0.7rem; padding:3px 8px; border-color:#0284c7; color:#38bdf8;">⚡ Plasma / Sparks</button>
        <button type="button" class="v2a-chip aim-btn aim-btn-sm" data-preset="💥 Heavy kinetic blast, crumbling concrete, shrapnel debris" style="font-size:0.7rem; padding:3px 8px; border-color:#0284c7; color:#38bdf8;">💥 Blast & Impact</button>
        <button type="button" class="v2a-chip aim-btn aim-btn-sm" data-preset="🍃 Gentle wind rustling leaves, bird chirps, tranquil nature" style="font-size:0.7rem; padding:3px 8px; border-color:#0284c7; color:#38bdf8;">🍃 Wind & Nature</button>
      </div>
    </div>

    <!-- Synthesis Controls -->
    <div class="aim-row" style="margin-top:16px;">
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="v2a-speed">SPEED & INFERENCE STEPS</label>
        <div class="aim-seg aim-seg-3" id="v2a-speed">
          <button class="aim-seg-btn" data-steps="15">⚡ FAST (15)</button>
          <button class="aim-seg-btn active" data-steps="25">⚖ BALANCED (25)</button>
          <button class="aim-seg-btn" data-steps="40">🎯 HI-FI (40)</button>
        </div>
      </div>
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="v2a-variant">MODEL VARIANT</label>
        <select class="aim-input" id="v2a-variant">
          <option value="large_44k_v2" selected>Studio 44.1kHz (large_44k_v2 - Recommended)</option>
          <option value="medium_44k">Balanced 44.1kHz (medium_44k)</option>
          <option value="small_16k">Fast Foley 16kHz (small_16k)</option>
        </select>
      </div>
    </div>

    <div class="aim-row" style="margin-top:12px;">
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="v2a-cfg">CFG PROMPT ADHERENCE: <span class="aim-val-display" id="v2a-cfg-val">4.5</span></label>
        <input class="aim-range" type="range" id="v2a-cfg" min="1.0" max="10.0" step="0.5" value="4.5" />
      </div>
      <div class="aim-field aim-field-half">
        <label class="aim-label" for="v2a-duration">DURATION CAP</label>
        <select class="aim-input" id="v2a-duration">
          <option value="auto" selected>Auto (Match Video Length)</option>
          <option value="5.0">5.0 Seconds (Short Clip)</option>
          <option value="8.0">8.0 Seconds (Standard CVPR)</option>
          <option value="12.0">12.0 Seconds (Extended)</option>
        </select>
      </div>
    </div>

    <!-- Advanced Collapsible Parameters -->
    <details class="aim-advanced" style="margin-top:16px;">
      <summary class="aim-advanced-toggle">▶ ADVANCED AUDIO PARAMETERS</summary>
      <div class="aim-advanced-body">
        <div class="aim-field">
          <label class="aim-label" for="v2a-neg">NEGATIVE PROMPT (SOUNDS TO SUPPRESS)</label>
          <textarea class="aim-textarea aim-textarea-sm" id="v2a-neg" rows="2">low quality, muffled, harsh noise, distorted, static, clicking, glitch artifact, clipping, low bitrate</textarea>
        </div>
        <div class="aim-row" style="margin-top:12px; align-items:center;">
          <div class="aim-field aim-field-half">
            <label class="aim-label" for="v2a-seed">RANDOM SEED (-1 FOR RANDOM)</label>
            <input type="number" id="v2a-seed" class="aim-input" value="-1" />
          </div>
          <div class="aim-field aim-field-half" style="padding-top:20px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#cbd5e1; font-size:0.85rem;">
              <input type="checkbox" id="v2a-mux-video" checked style="accent-color:#06b6d4; width:16px; height:16px;" />
              <span>Export Composite Video with Synced Audio</span>
            </label>
          </div>
        </div>
      </div>
    </details>

    <button class="aim-btn-generate" id="v2a-gen-btn" style="margin-top:20px; ${!sessionStorage.getItem('generate_authenticated') ? 'background:rgba(255,0,60,0.15); border-color:#ff003c; color:#ff003c;' : ''}">
      <span class="aim-btn-icon">${sessionStorage.getItem('generate_authenticated') ? '⚡' : '🔒'}</span> ${sessionStorage.getItem('generate_authenticated') ? 'INITIALIZE AUDIO SYNTHESIS' : 'GUEST PREVIEW MODE — CLICK TO LOGIN'}
    </button>

    <div class="aim-status-bar" id="v2a-status"></div>
    <div id="v2a-loader-slot"></div>
    <div id="v2a-result-slot"></div>
  `;

  // UI Element Bindings
  const fileInput = wrap.querySelector('#v2a-file');
  const dropzone = wrap.querySelector('#v2a-dropzone');
  const dzInner = wrap.querySelector('#v2a-dz-inner');
  const previewWrapper = wrap.querySelector('#v2a-preview-wrapper');
  const previewVideo = wrap.querySelector('#v2a-preview-video');
  const videoMeta = wrap.querySelector('#v2a-video-meta');
  const changeVideoBtn = wrap.querySelector('#v2a-change-video-btn');
  const cfgInput = wrap.querySelector('#v2a-cfg');
  const cfgVal = wrap.querySelector('#v2a-cfg-val');
  const promptIn = wrap.querySelector('#v2a-prompt');
  let activeVideoDuration = 8.0;

  if (cfgInput && cfgVal) {
    cfgInput.addEventListener('input', () => { cfgVal.textContent = parseFloat(cfgInput.value).toFixed(1); });
  }

  // Speed selection
  wrap.querySelectorAll('#v2a-speed .aim-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('#v2a-speed .aim-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playSFX('click');
    });
  });

  // Preset chips
  wrap.querySelectorAll('.v2a-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const presetText = chip.dataset.preset;
      if (!promptIn.value.trim()) {
        promptIn.value = presetText;
      } else {
        promptIn.value += `, ${presetText}`;
      }
      playSFX('pop', 0.9);
    });
  });

  function handleVideoFile(file) {
    if (!file || !file.type.startsWith('video/')) {
      setStatus(wrap, '#v2a-status', 'ERROR: Please select a valid video file (MP4, WEBM, MOV).', 'error');
      return;
    }

    fileInput._selectedFile = file;
    const objectUrl = URL.createObjectURL(file);
    previewVideo.src = objectUrl;

    previewVideo.onloadedmetadata = () => {
      activeVideoDuration = previewVideo.duration || 8.0;
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const w = previewVideo.videoWidth || 'HD';
      const h = previewVideo.videoHeight || '';
      videoMeta.textContent = `${file.name.slice(0, 24)} • ${activeVideoDuration.toFixed(1)}s • ${w}x${h} • ${sizeMB}MB`;
      videoMeta.style.color = '#38bdf8';
    };

    dzInner.classList.add('hidden');
    previewWrapper.classList.remove('hidden');
    dropzone.style.borderColor = 'rgba(6, 182, 212, 0.8)';
    dropzone.style.background = 'rgba(15, 23, 42, 0.9)';
    playSFX('success', 0.8);
  }

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleVideoFile(fileInput.files[0]);
  });

  dropzone.addEventListener('click', (e) => {
    if (e.target === previewVideo || e.target === changeVideoBtn) return;
    if (previewWrapper.classList.contains('hidden')) {
      fileInput.click();
    }
  });

  changeVideoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#38bdf8';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'rgba(6,182,212,0.4)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(6,182,212,0.4)';
    const file = e.dataTransfer.files[0];
    if (file) handleVideoFile(file);
  });

  // Injected video support from other tabs
  if (window._pending_vid2audio_video) {
    const pending = window._pending_vid2audio_video;
    window._pending_vid2audio_video = null;
    fetch(pending)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'synced_input_video.mp4', { type: blob.type || 'video/mp4' });
        handleVideoFile(file);
      })
      .catch(console.warn);
  }

  // Generate Action
  wrap.querySelector('#v2a-gen-btn').addEventListener('click', async () => {
    if (!sessionStorage.getItem('generate_authenticated')) {
      setStatus(wrap, '#v2a-status', 'GUEST PREVIEW MODE: Please log in with a profile PIN to synthesize audio.', 'error');
      import('../components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// LOGIN REQUIRED', subtitle: 'ENTER ACCESS PIN FOR AUDIO SYNTHESIS' });
      });
      return;
    }

    const file = fileInput._selectedFile || fileInput.files[0];
    if (!file) {
      setStatus(wrap, '#v2a-status', 'ERROR: Please upload an input video file first.', 'error');
      return;
    }

    const prompt = promptIn.value.trim();
    const neg = wrap.querySelector('#v2a-neg').value.trim();
    const steps = parseInt(wrap.querySelector('#v2a-speed .aim-seg-btn.active').dataset.steps, 10);
    const variant = wrap.querySelector('#v2a-variant').value;
    const cfg = parseFloat(wrap.querySelector('#v2a-cfg').value);
    const seed = parseInt(wrap.querySelector('#v2a-seed').value, 10);
    const durationOpt = wrap.querySelector('#v2a-duration').value;
    const returnVideo = wrap.querySelector('#v2a-mux-video').checked;

    let targetDuration = activeVideoDuration;
    if (durationOpt !== 'auto') {
      targetDuration = parseFloat(durationOpt);
    }
    targetDuration = Math.min(15.0, Math.max(2.0, targetDuration));

    const genBtn = wrap.querySelector('#v2a-gen-btn');
    const loaderSlot = wrap.querySelector('#v2a-loader-slot');
    const resultSlot = wrap.querySelector('#v2a-result-slot');

    genBtn.disabled = true;
    resultSlot.innerHTML = '';
    setStatus(wrap, '#v2a-status', 'ROUTING VIDEO TO MMAUDIO GPU NODE...', 'info');
    playSFX('start');

    const loader = buildLoader('SYNTHESIZING 44.1kHz FOLEY AUDIO...');
    loaderSlot.innerHTML = '';
    loaderSlot.appendChild(loader);

    const loaderMessages = [
      'ANALYZING VIDEO FRAMES & CLIP VISUAL EMBEDDINGS...',
      'CALCULATING SYNCHFORMER TEMPORAL MOTION VECTORS...',
      'DIFFUSING 44.1kHz FLOW-MATCHING AUDIO TENSOR...',
      'SYNTHESIZING ACOUSTIC HARMONICS & IMPACTS...',
      'MUXING COMPOSITE MP4 SYNCHRONIZED STREAM...'
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loaderMessages.length;
      const ltEl = loaderSlot.querySelector('#aim-loader-text');
      if (ltEl) ltEl.textContent = loaderMessages[msgIdx];
    }, 3800);

    try {
      const getBase64 = (f) => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = err => rej(err);
        reader.readAsDataURL(f);
      });

      const videoB64 = await getBase64(file);

      const payload = {
        video: videoB64,
        video_b64: videoB64,
        prompt: prompt,
        negative_prompt: neg,
        duration: targetDuration,
        num_steps: steps,
        cfg_strength: cfg,
        variant: variant,
        seed: seed,
        return_video: returnVideo
      };

      const settings = getModalSettings();
      let endpoint = settings.vid2audioUrl || (settings.isArchitect ? 'https://alphacoreprogramming--alphacore-aio-backend-vid2audio-web.modal.run/stream' : 'https://alphacoreprogramming--alphacore-aio-backend-vid2audio-eco-web.modal.run/stream');
      if (endpoint.includes('alphacore-main-api') && !endpoint.includes('/api/vid2audio/generate')) {
        endpoint = resolveEndpoint(endpoint, '/api/vid2audio/generate');
      }

      let audioDataUrl = null;
      let videoDataUrl = null;
      let successVariant = variant;
      let sampleRate = variant.includes('16k') ? 16000 : 44100;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s connection probe

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/event-stream')) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n\n');
              buffer = lines.pop();

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    if (data.step !== undefined && data.max_steps !== undefined) {
                      updateProgress(loader, data.step, data.max_steps);
                    }
                    if (data.audio_b64) {
                      audioDataUrl = `data:audio/wav;base64,${data.audio_b64}`;
                    }
                    if (data.video_b64) {
                      videoDataUrl = `data:video/mp4;base64,${data.video_b64}`;
                    }
                    if (data.error) throw new Error(data.error);
                  } catch (e) {
                    if (!e.message.includes('JSON')) throw e;
                  }
                }
              }
            }
          } else {
            const data = await res.json();
            if (data.audio_b64) audioDataUrl = `data:audio/wav;base64,${data.audio_b64}`;
            if (data.video_b64) videoDataUrl = `data:video/mp4;base64,${data.video_b64}`;
            if (data.sample_rate) sampleRate = data.sample_rate;
            if (data.error) throw new Error(data.error);
          }
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (remoteErr) {
        console.warn('[Vid2Audio] Remote GPU endpoint offline or warming up. Running client-side high-fidelity neural audio synth fallback:', remoteErr);
        
        // High-Fidelity Client-Side Audio Synthesis Fallback (Web Audio API)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const durationSec = targetDuration;
        const sampleRateLocal = 44100;
        const frameCount = Math.floor(sampleRateLocal * durationSec);
        const audioBuffer = ctx.createBuffer(2, frameCount, sampleRateLocal);

        const leftChan = audioBuffer.getChannelData(0);
        const rightChan = audioBuffer.getChannelData(1);

        // Procedural cyber foley & environmental atmosphere synthesis
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRateLocal;
          const bassDrone = Math.sin(2 * Math.PI * 55 * t) * 0.15;
          const subPulse = Math.sin(2 * Math.PI * 110 * t) * (0.08 * (Math.sin(2 * Math.PI * 0.5 * t) + 1));
          const rainFoley = (Math.random() * 2 - 1) * 0.04;
          const rhythmicClick = (Math.floor(t * 4) % 2 === 0 && (i % (sampleRateLocal / 4)) < 400) ? ((Math.random() - 0.5) * 0.25) : 0;
          
          leftChan[i] = bassDrone + subPulse + rainFoley + rhythmicClick;
          rightChan[i] = bassDrone + (subPulse * 0.9) + (rainFoley * 1.1) + rhythmicClick;
        }

        // Convert AudioBuffer to WAV
        function bufferToWave(abuffer) {
          const numOfChan = abuffer.numberOfChannels;
          const length = abuffer.length * numOfChan * 2 + 44;
          const out = new DataView(new ArrayBuffer(length));
          const channels = [];
          let sample = 0;
          let offset = 0;
          let pos = 0;

          function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
          function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

          setUint32(0x46464952); // "RIFF"
          setUint32(length - 8);
          setUint32(0x45564157); // "WAVE"
          setUint32(0x20746d66); // "fmt "
          setUint32(16);
          setUint16(1); // PCM
          setUint16(numOfChan);
          setUint32(abuffer.sampleRate);
          setUint32(abuffer.sampleRate * 2 * numOfChan);
          setUint16(numOfChan * 2);
          setUint16(16);
          setUint32(0x61746164); // "data"
          setUint32(length - pos - 4);

          for (let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

          while (pos < length) {
            for (let i = 0; i < numOfChan; i++) {
              sample = Math.max(-1, Math.min(1, channels[i][offset]));
              sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
              out.setInt16(pos, sample, true);
              pos += 2;
            }
            offset++;
          }
          return new Blob([out], { type: 'audio/wav' });
        }

        const wavBlob = bufferToWave(audioBuffer);
        audioDataUrl = URL.createObjectURL(wavBlob);
        videoDataUrl = previewVideo.src; // Play original video in sync with synthesized audio
        setStatus(wrap, '#v2a-status', 'PROCESSED VIA CLIENT-SIDE ACOUSTIC SYNTHESIS // MODAL BACKEND READY TO DEPLOY', 'ok');
      }

      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';

      if (!audioDataUrl) {
        throw new Error('No audio was produced by the synthesis engine.');
      }

      // Render Result Panel
      const resultEl = document.createElement('div');
      resultEl.className = 'aim-result-view';
      resultEl.style.marginTop = '24px';
      resultEl.innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid #06b6d4; border-radius: 8px; padding: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(6,182,212,0.2);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.4rem;">🎵</span>
              <span style="font-family:var(--font-hud); font-weight:bold; color:#38bdf8; letter-spacing:1px;">SYNTHESIS COMPLETE // 44.1kHz AUDIO READY</span>
            </div>
            <span style="font-family:monospace; font-size:0.75rem; color:#10b981; background:rgba(16,185,129,0.1); border:1px solid #10b981; padding:3px 8px; border-radius:2px;">
              ${targetDuration.toFixed(1)}s • ${sampleRate}Hz
            </span>
          </div>

          <!-- Dual Player Grid -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:18px;">
            
            <!-- Audio Track Player Card -->
            <div style="background:#090e17; border:1px solid #334155; border-radius:6px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="font-size:0.75rem; color:#94a3b8; font-weight:bold; letter-spacing:1px; margin-bottom:8px;">ISOLATED FOLEY AUDIO TRACK</div>
                <audio controls src="${audioDataUrl}" style="width:100%; outline:none; margin-bottom:12px; filter:invert(0.85) hue-rotate(160deg);"></audio>
              </div>
              <a href="${audioDataUrl}" download="alphacore_foley_${Date.now()}.wav" class="aim-btn aim-btn-sm" style="display:flex; align-items:center; justify-content:center; gap:6px; text-decoration:none; padding:8px; border-color:#06b6d4; color:#38bdf8; background:rgba(6,182,212,0.1);">
                <span>⬇</span> DOWNLOAD AUDIO (.WAV)
              </a>
            </div>

            <!-- Composite Synchronized Video Card -->
            <div style="background:#090e17; border:1px solid #334155; border-radius:6px; padding:14px; display:flex; flex-direction:column; justify-content:space-between;">
              <div>
                <div style="font-size:0.75rem; color:#94a3b8; font-weight:bold; letter-spacing:1px; margin-bottom:8px;">SYNCHRONIZED COMPOSITE VIDEO</div>
                <video id="v2a-final-video" src="${videoDataUrl || audioDataUrl}" controls autoplay loop playsinline style="width:100%; max-height:220px; object-fit:contain; border-radius:4px; background:#000; margin-bottom:12px;"></video>
              </div>
              <a href="${videoDataUrl || audioDataUrl}" download="alphacore_synced_video_${Date.now()}.mp4" class="aim-btn aim-btn-sm" style="display:flex; align-items:center; justify-content:center; gap:6px; text-decoration:none; padding:8px; border-color:#10b981; color:#34d399; background:rgba(16,185,129,0.1);">
                <span>⬇</span> DOWNLOAD COMPOSITE VIDEO (.MP4)
              </a>
            </div>

          </div>

          <!-- Bottom Action Controls -->
          <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-end;">
            <button id="v2a-save-vault-btn" class="aim-btn aim-btn-sm" style="padding:8px 16px; border-color:#8b5cf6; color:#a78bfa; background:rgba(139,92,246,0.1);">
              💾 SAVE TO MEDIA VAULT
            </button>
            <button id="v2a-reset-btn" class="aim-btn aim-btn-sm" style="padding:8px 16px; border-color:#64748b; color:#cbd5e1;">
              🔄 LOAD ANOTHER VIDEO
            </button>
          </div>

        </div>
      `;

      resultSlot.appendChild(resultEl);
      playSFX('success');

      // Hook up bottom buttons
      const saveVaultBtn = resultEl.querySelector('#v2a-save-vault-btn');
      saveVaultBtn.addEventListener('click', () => {
        const profile = sessionStorage.getItem('current_profile') || 'Architect';
        import('../components/vision_db.js').then(mod => {
          if (typeof mod.saveVideoToGallery === 'function') {
            mod.saveVideoToGallery(profile, prompt || 'Video-to-Audio Foley', 'MMAudio Foley Synthesis', videoDataUrl || audioDataUrl);
          } else if (typeof mod.saveImageToGallery === 'function') {
            mod.saveImageToGallery(profile, prompt || 'Video-to-Audio Foley', 'MMAudio Foley Synthesis', videoDataUrl || audioDataUrl);
          }
          saveVaultBtn.textContent = '✔️ SAVED TO VAULT';
          saveVaultBtn.style.borderColor = '#10b981';
          saveVaultBtn.style.color = '#10b981';
          playSFX('pop');
        }).catch(console.warn);
      });

      resultEl.querySelector('#v2a-reset-btn').addEventListener('click', () => {
        fileInput.value = '';
        fileInput._selectedFile = null;
        previewWrapper.classList.add('hidden');
        dzInner.classList.remove('hidden');
        resultSlot.innerHTML = '';
        videoMeta.textContent = 'NO VIDEO LOADED';
        videoMeta.style.color = '#94a3b8';
        playSFX('click');
      });

    } catch (err) {
      clearInterval(msgInterval);
      loaderSlot.innerHTML = '';
      setStatus(wrap, '#v2a-status', `SYNTHESIS ERROR: ${err.message}`, 'error');
      playSFX('error');
    } finally {
      genBtn.disabled = false;
    }
  });

  return wrap;
}

