/**
 * AI Prompt Enhancer & Master Matrix Generator Page
 * Transforms raw concepts into production-ready AI image prompts & negative matrices.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { playSFX } from '../components/audio.js';

export default function PromptLabPage() {
  const container = createElement('div', { class: 'promptlab-page-container' });

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// PROMPT_ENHANCER">// PROMPT_ENHANCER</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Neural prompt expansion engine for SDXL, Midjourney, and Stable Diffusion checkpoints.</p>
    </div>

    <div style="display:grid; grid-template-columns: 1fr; gap:20px; font-family:'Share Tech Mono',monospace; max-width: 900px; margin: 0 auto;">
      
      <!-- Input Panel -->
      <div class="panel" style="background:rgba(10,15,25,0.9); border:1px solid var(--border-accent, rgba(6,182,212,0.3)); padding:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
          <div style="font-family:'Orbitron',sans-serif; font-size:1.1rem; font-weight:700; color:#fff;">
            ✦ RAW CONCEPT INPUT
          </div>
          <span style="font-size:0.75rem; color:var(--accent,#06b6d4);">[AI NEURAL ENHANCER v4.0]</span>
        </div>

        <div class="aim-field">
          <label class="aim-label" for="prompt-input-concept">BASE IDEA / SHORT DESCRIPTION</label>
          <textarea id="prompt-input-concept" class="aim-textarea" rows="3" placeholder="e.g. A cyberpunk samurai standing in neon rain, glowing katana, dark futuristic alleyway..."></textarea>
        </div>

        <!-- Style Matrix Selectors -->
        <div style="margin-top:16px;">
          <label class="aim-label">ARTISTIC STYLE PRESET</label>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-top:6px;" id="style-presets-wrap">
            <button class="aim-btn aim-btn-sm style-btn active" data-style="photorealistic">📸 PHOTOREALISTIC</button>
            <button class="aim-btn aim-btn-sm style-btn" data-style="cyberpunk">🌃 CYBERPUNK</button>
            <button class="aim-btn aim-btn-sm style-btn" data-style="anime">🎨 ANIME / PONY</button>
            <button class="aim-btn aim-btn-sm style-btn" data-style="fantasy">🐉 DARK FANTASY</button>
            <button class="aim-btn aim-btn-sm style-btn" data-style="scifi">🚀 SCI-FI MECHA</button>
          </div>
        </div>

        <!-- Detail Booster Toggles -->
        <div style="margin-top:18px;">
          <label class="aim-label">DETAIL ENHANCERS</label>
          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:8px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; cursor:pointer; color:#ccc;">
              <input type="checkbox" id="chk-lighting" checked /> 💡 Cinematic Lighting
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; cursor:pointer; color:#ccc;">
              <input type="checkbox" id="chk-8k" checked /> 💎 8K Ultra Detail
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; cursor:pointer; color:#ccc;">
              <input type="checkbox" id="chk-atmosphere" checked /> 🌫 Volumetric Atmosphere
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; cursor:pointer; color:#ccc;">
              <input type="checkbox" id="chk-camera" checked /> 📷 35mm Lens & Bokeh
            </label>
          </div>
        </div>

        <button id="btn-enhance-prompt" class="aim-btn-generate" style="margin-top:22px; width:100%;">
          ⚡ ENHANCE PROMPT MATRIX
        </button>
      </div>

      <!-- Output Panel -->
      <div class="panel" style="background:rgba(6,10,18,0.9); border:1px solid var(--accent, #06b6d4); padding:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
          <div style="font-family:'Orbitron',sans-serif; font-size:1.1rem; font-weight:700; color:#00f0ff;">
            ✨ ENHANCED PROMPT MATRIX
          </div>
          <div style="font-size:0.75rem; color:#888;">
            TOKENS: <span id="out-token-count" style="color:#10b981; font-weight:bold;">0</span>
          </div>
        </div>

        <div class="aim-field">
          <label class="aim-label" for="prompt-out-enhanced">POSITIVE PROMPT</label>
          <textarea id="prompt-out-enhanced" class="aim-textarea" rows="5" placeholder="Enhanced prompt will appear here..."></textarea>
        </div>

        <div class="aim-field" style="margin-top:14px;">
          <label class="aim-label" for="prompt-out-negative">RECOMMENDED NEGATIVE PROMPT</label>
          <textarea id="prompt-out-negative" class="aim-textarea aim-textarea-sm" rows="3">worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts</textarea>
        </div>

        <div style="display:flex; gap:12px; margin-top:20px; flex-wrap:wrap;">
          <button id="btn-copy-enhanced" class="aim-btn" style="flex:1; padding:10px; font-size:0.85rem;">
            📋 COPY ENHANCED PROMPT
          </button>
          <button id="btn-send-txt2img" class="aim-btn" style="flex:1; padding:10px; font-size:0.85rem; background:rgba(6,182,212,0.2); border-color:var(--accent); color:#fff;">
            ⚡ SEND TO TEXT TO IMAGE
          </button>
        </div>
      </div>

    </div>
  `;

  const conceptInput = container.querySelector('#prompt-input-concept');
  const outEnhanced = container.querySelector('#prompt-out-enhanced');
  const outNegative = container.querySelector('#prompt-out-negative');
  const tokenCountEl = container.querySelector('#out-token-count');

  const btnEnhance = container.querySelector('#btn-enhance-prompt');
  const btnCopy = container.querySelector('#btn-copy-enhanced');
  const btnSendTxt2Img = container.querySelector('#btn-send-txt2img');

  let activeStyle = 'photorealistic';

  // Style button selection
  container.querySelectorAll('.style-btn').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStyle = btn.getAttribute('data-style');
      playSFX('click', 0.4);
    };
  });

  const styleDescriptors = {
    photorealistic: ['photorealistic hyper-detailed', '8k resolution', 'masterpiece photography', 'award-winning portrait', 'octane render', 'dramatic studio lighting'],
    cyberpunk: ['cyberpunk aesthetic', 'neon cyan and magenta lighting', 'rain-slicked asphalt', 'holographic reflections', 'futuristic dark city', 'high contrast'],
    anime: ['anime masterwork', 'vibrant cel-shaded artwork', 'intricate linework', 'expressive features', 'trending on ArtStation', 'makoto shinkai style'],
    fantasy: ['dark fantasy art', 'volumetric fog', 'charming chiaroscuro lighting', 'intricate mythical details', 'epic cinematic composition', 'digital painting'],
    scifi: ['hard sci-fi aesthetic', 'intricate mecha plating', 'glowing plasma energy conduit', 'industrial chrome reflections', 'futuristic space station']
  };

  const negativePresets = {
    photorealistic: 'worst quality, low quality, normal quality, lowres, blur, watermark, text, signature, bad anatomy, deformed hands',
    cyberpunk: 'blurry, low resolution, daylight, oversaturated, text, signature, ugly, bad hands, mutated fingers',
    anime: 'photorealistic, 3d render, low quality, worst quality, bad linework, disfigured, text, watermark',
    fantasy: 'modern clothing, futuristic, low quality, text, watermark, bad anatomy, blurry, cartoon',
    scifi: 'fantasy, organic, blurry, bad anatomy, text, signature, low quality, deformed'
  };

  function calculateTokens(text) {
    if (!text) return 0;
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(0, Math.ceil(words * 1.3));
  }

  outEnhanced.addEventListener('input', () => {
    tokenCountEl.textContent = calculateTokens(outEnhanced.value);
  });

  btnEnhance.onclick = () => {
    const raw = conceptInput.value.trim();
    if (!raw) {
      showToast('WARN', 'Please enter a base concept or description first.');
      return;
    }

    playSFX('transition', 0.5);

    const boosters = [];
    if (container.querySelector('#chk-lighting').checked) boosters.push('cinematic rim lighting', 'god rays');
    if (container.querySelector('#chk-8k').checked) boosters.push('hyper-detailed 8k resolution', 'sharp focus');
    if (container.querySelector('#chk-atmosphere').checked) boosters.push('volumetric atmosphere', 'depth of field');
    if (container.querySelector('#chk-camera').checked) boosters.push('35mm camera lens', 'subtle bokeh');

    const styleTags = styleDescriptors[activeStyle] || styleDescriptors.photorealistic;
    const combinedBoosters = Array.from(new Set([...styleTags, ...boosters]));

    const enhancedText = `${raw}, ${combinedBoosters.join(', ')}`;
    outEnhanced.value = enhancedText;
    outNegative.value = negativePresets[activeStyle] || negativePresets.photorealistic;

    tokenCountEl.textContent = calculateTokens(enhancedText);
    showToast('SUCCESS', 'Prompt matrix enhanced successfully!');
  };

  btnCopy.onclick = () => {
    if (!outEnhanced.value) return;
    navigator.clipboard?.writeText?.(outEnhanced.value)
      .then(() => showToast('SUCCESS', 'Enhanced prompt copied to clipboard!'))
      .catch(() => showToast('INFO', 'Prompt ready for copy.'));
  };

  btnSendTxt2Img.onclick = () => {
    if (!outEnhanced.value) {
      showToast('WARN', 'Enhance a prompt first before sending to Text to Image.');
      return;
    }
    // Store in localStorage for automatic injection into aimodals txt2img prompt box
    localStorage.setItem('alphacore_injected_prompt', outEnhanced.value);
    showToast('SUCCESS', 'Prompt dispatched to Text to Image!');
    location.hash = '#/aimodals';
  };

  return container;
}
