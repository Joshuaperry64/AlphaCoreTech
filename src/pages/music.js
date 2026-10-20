import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { logAction } from '../components/logger.js';
import { playSFX } from '../components/audio.js';
import { triggerBypassOverloadSequence } from '../components/pinpad.js';

export default function MusicPage() {
  const container = createElement('div', { class: 'music-page slide-up' });

  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim().toLowerCase();
  const currentPin = (sessionStorage.getItem('current_pin') || '').trim();
  const isArchitect = currentProfile === 'architect' || currentPin === '672167566';
  const defaultEndpoint = isArchitect
    ? 'https://josh627764--alphacore-aio-backend-alphacore-main-api.us-east.modal.run'
    : 'https://josh627764--alphacore-aio-backend-alphacore-main-api.us-east.modal.run';

  const tierName = isArchitect ? 'ARCHITECT PRIORITY' : 'PUBLIC ECONOMY';
  const tierHw = isArchitect ? 'L40S Node (Warm)' : 'Cost-Optimized Node (60s Auto-Scale)';
  const tierColor = isArchitect ? '#38bdf8' : '#10b981';
  const tierBg = isArchitect ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)';
  const tierBorder = isArchitect ? '#38bdf8' : '#10b981';

  // Workstation state
  let selectedGenre = 'Synthwave';
  let selectedMood = 'Dark & Menacing';
  let currentBpm = 120;
  let selectedKey = 'D Minor';
  const selectedInstruments = new Set(['Analog Synth', '808 Bass']);

  const GENRES = [
    { id: 'synthwave', label: '🌆 Synthwave' },
    { id: 'darktechno', label: '⚡ Dark Techno' },
    { id: 'industrial', label: '🏭 Industrial' },
    { id: 'cyberpunk', label: '🦾 Cyberpunk' },
    { id: 'ambient', label: '🌌 Ambient' },
    { id: 'lofi', label: '📼 Lo-Fi' },
    { id: 'glitchhop', label: '👾 Glitch-Hop' },
    { id: 'ebm', label: '🧬 EBM / Aggrotech' }
  ];

  const MOODS = [
    { id: 'dark_menacing', label: '💀 Dark & Menacing' },
    { id: 'high_adrenaline', label: '🔥 High Adrenaline' },
    { id: 'atmospheric', label: '🌫️ Atmospheric & Spatial' },
    { id: 'hypnotic', label: '🌀 Hypnotic & Trance' },
    { id: 'sinister', label: '😈 Sinister & Ominous' },
    { id: 'melancholic', label: '🌧️ Melancholic Neon' }
  ];

  const INSTRUMENTS = [
    'Analog Synth',
    '808 Bass',
    'Cyber Strings',
    'Glitch Percussion',
    'Acid 303 Lead',
    'Modular Arp',
    'Heavy Distorted Kick',
    'Tape Echo Drone',
    'Cyber Choir'
  ];

  const KEYS = [
    'A Minor (Natural)',
    'D Minor (Atmospheric)',
    'F Minor (Industrial Heavy)',
    'E Phrygian Dominant (Dark Cyber)',
    'C Dorian (Neon Runner)',
    'C# Minor (Sinister Tension)',
    'B Minor (Dramatic Melodic)'
  ];

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
        <h1 class="page-title glitch" data-text="CYBER-AUDIO WORKSTATION" style="margin:0; font-family:'Orbitron',sans-serif; letter-spacing:2px;">CYBER-AUDIO WORKSTATION</h1>
        <div style="background:${tierBg}; border:1px solid ${tierBorder}; color:${tierColor}; padding:4px 10px; font-family:var(--font-hud); font-size:0.75rem; border-radius:2px; font-weight:bold; display:flex; align-items:center; gap:6px;">
          <span>●</span> ${tierName} // ${tierHw}
        </div>
      </div>
      <p class="page-subtitle" style="font-family:'Share Tech Mono',monospace; color:var(--accent,#06b6d4);">
        ACE-STEP 1.5 NEURAL AUDIO SYNTHESIS ENGINE // ACTIVE ROUTING: ${tierName}
      </p>
    </div>

    <div class="music-workstation" style="max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
      
      <!-- LEFT COLUMN: CONTROLS & COMPOSER -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        
        <!-- GENRE SELECTOR -->
        <div class="aim-section" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <label class="aim-label" style="margin:0; color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.8rem;">1. GENRE ARCHITECTURE</label>
            <span id="genre-badge" style="font-size:0.75rem; color:#4ade80; font-family:'Share Tech Mono',monospace;">${selectedGenre}</span>
          </div>
          <div id="genre-chips" style="display:flex; flex-wrap:wrap; gap:6px;">
            ${GENRES.map(g => `
              <button type="button" class="aim-btn aim-btn-sm genre-chip ${g.label.includes(selectedGenre) ? 'active' : ''}" data-genre="${g.label.replace(/^.*? /, '')}" style="padding:4px 10px; font-size:0.75rem; ${g.label.includes(selectedGenre) ? 'background:rgba(6,182,212,0.3); border-color:#06b6d4; color:#fff;' : 'background:rgba(0,0,0,0.4); border-color:rgba(255,255,255,0.1); color:#aaa;'}">
                ${g.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- MOOD & VIBE -->
        <div class="aim-section" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <label class="aim-label" style="margin:0; color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.8rem;">2. MOOD & EMOTIONAL SPECTRUM</label>
            <span id="mood-badge" style="font-size:0.75rem; color:#4ade80; font-family:'Share Tech Mono',monospace;">${selectedMood}</span>
          </div>
          <div id="mood-chips" style="display:flex; flex-wrap:wrap; gap:6px;">
            ${MOODS.map(m => `
              <button type="button" class="aim-btn aim-btn-sm mood-chip ${m.label.includes(selectedMood) ? 'active' : ''}" data-mood="${m.label.replace(/^.*? /, '')}" style="padding:4px 10px; font-size:0.75rem; ${m.label.includes(selectedMood) ? 'background:rgba(236,72,153,0.25); border-color:#ec4899; color:#fff;' : 'background:rgba(0,0,0,0.4); border-color:rgba(255,255,255,0.1); color:#aaa;'}">
                ${m.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- TEMPO / BPM -->
        <div class="aim-section" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="aim-label" for="music-bpm" style="margin:0; color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.8rem;">3. TEMPO / BPM</label>
            <span id="music-bpm-val" style="font-family:'Share Tech Mono',monospace; font-size:0.9rem; color:#00ff66; font-weight:bold;">${currentBpm} BPM</span>
          </div>
          <input class="aim-range" type="range" id="music-bpm" min="60" max="180" step="1" value="${currentBpm}" style="width:100%; accent-color:#00ff66;" />
          <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <button type="button" class="aim-btn aim-btn-sm bpm-preset" data-bpm="80" style="padding:2px 8px; font-size:0.7rem;">80 (Lo-Fi)</button>
            <button type="button" class="aim-btn aim-btn-sm bpm-preset" data-bpm="110" style="padding:2px 8px; font-size:0.7rem;">110 (Synthwave)</button>
            <button type="button" class="aim-btn aim-btn-sm bpm-preset" data-bpm="128" style="padding:2px 8px; font-size:0.7rem;">128 (Techno)</button>
            <button type="button" class="aim-btn aim-btn-sm bpm-preset" data-bpm="140" style="padding:2px 8px; font-size:0.7rem;">140 (Industrial)</button>
            <button type="button" class="aim-btn aim-btn-sm bpm-preset" data-bpm="160" style="padding:2px 8px; font-size:0.7rem;">160 (High Adrenaline)</button>
          </div>
        </div>

        <!-- INSTRUMENTATION -->
        <div class="aim-section" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
          <label class="aim-label" style="color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.8rem; margin-bottom:8px; display:block;">4. INSTRUMENTATION LAYERS (MULTI-SELECT)</label>
          <div id="instrument-chips" style="display:flex; flex-wrap:wrap; gap:6px;">
            ${INSTRUMENTS.map(inst => `
              <button type="button" class="aim-btn aim-btn-sm inst-chip ${selectedInstruments.has(inst) ? 'active' : ''}" data-inst="${inst}" style="padding:4px 10px; font-size:0.75rem; ${selectedInstruments.has(inst) ? 'background:rgba(16,185,129,0.25); border-color:#10b981; color:#fff;' : 'background:rgba(0,0,0,0.4); border-color:rgba(255,255,255,0.1); color:#888;'}">
                ${selectedInstruments.has(inst) ? '✓ ' : '+ '} ${inst}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- KEY / SCALE -->
        <div class="aim-section" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
          <label class="aim-label" for="music-key" style="color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.8rem; margin-bottom:8px; display:block;">5. HARMONIC KEY / SCALE</label>
          <select id="music-key" class="aim-input" style="width:100%;">
            ${KEYS.map(k => `<option value="${k.split(' ')[0]} ${k.split(' ')[1]}" ${k.includes('D Minor') ? 'selected' : ''}>${k}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- RIGHT COLUMN: PROMPT COMPOSER, DURATION & EXECUTION -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        
        <!-- AUTO COMPOSER & PROMPT -->
        <div class="aim-section" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px; display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label class="aim-label" for="music-prompt" style="margin:0; color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.8rem;">6. SYNTHESIS PROMPT</label>
            <button type="button" id="btn-compose-prompt" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.2); border-color:#06b6d4; color:#fff; font-family:'Orbitron',sans-serif; font-size:0.75rem; padding:4px 12px;" title="Combine selected genre, mood, tempo, instruments, and key into prompt">
              ✨ COMPOSE PROMPT
            </button>
          </div>
          <textarea id="music-prompt" class="aim-input" style="height:140px; resize:vertical; font-family:'Share Tech Mono',monospace; line-height:1.4;" placeholder="Describe track genre, instruments, mood, tempo or use 'COMPOSE PROMPT'..."></textarea>
        </div>

        <!-- DURATION SLIDER -->
        <div class="aim-section" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="aim-label" for="music-length-slider" style="margin:0; color:#06b6d4; font-family:'Orbitron',sans-serif; font-size:0.8rem;">7. TRACK DURATION</label>
            <span id="music-length-val" style="font-family:'Share Tech Mono',monospace; font-size:0.9rem; color:#38bdf8; font-weight:bold;">30 SECONDS</span>
          </div>
          <input class="aim-range" type="range" id="music-length-slider" min="10" max="120" step="5" value="30" style="width:100%; accent-color:#38bdf8;" />
          <input type="hidden" id="music-length" value="30" />
          <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <button type="button" class="aim-btn aim-btn-sm dur-preset" data-dur="15" style="padding:2px 8px; font-size:0.7rem;">15s</button>
            <button type="button" class="aim-btn aim-btn-sm dur-preset" data-dur="30" style="padding:2px 8px; font-size:0.7rem;">30s (Default)</button>
            <button type="button" class="aim-btn aim-btn-sm dur-preset" data-dur="60" style="padding:2px 8px; font-size:0.7rem;">60s</button>
            <button type="button" class="aim-btn aim-btn-sm dur-preset" data-dur="90" style="padding:2px 8px; font-size:0.7rem;">90s</button>
            <button type="button" class="aim-btn aim-btn-sm dur-preset" data-dur="120" style="padding:2px 8px; font-size:0.7rem;">120s (Max)</button>
          </div>
        </div>

        <!-- GENERATE BUTTON & STATUS -->
        <button id="music-btn" class="aim-btn-generate" style="width:100%; height:55px; font-family:'Orbitron',sans-serif; font-size:1rem; letter-spacing:2px; font-weight:bold; background:linear-gradient(135deg, rgba(6,182,212,0.3), rgba(16,185,129,0.3)); border:1.5px solid #00ff66; color:#fff;">
          <span class="aim-btn-icon">🎵</span> SYNTHESIZE NEURAL AUDIO TRACK
        </button>
        
        <div id="music-status" style="text-align:center; color:#4ade80; letter-spacing:2px; font-size:14px; font-family:'Share Tech Mono',monospace; display:none; padding:10px; background:rgba(0,255,100,0.08); border:1px dashed #00ff66; border-radius:4px;">
          SYNTHESIZING AUDIO...
        </div>
        
        <div id="music-result" style="text-align:center;">
          <!-- Audio player will render here -->
        </div>
      </div>
    </div>
  `;

  // UI Element Selectors
  const btn = container.querySelector('#music-btn');
  const promptIn = container.querySelector('#music-prompt');
  const lengthIn = container.querySelector('#music-length');
  const lengthSlider = container.querySelector('#music-length-slider');
  const lengthVal = container.querySelector('#music-length-val');
  const bpmSlider = container.querySelector('#music-bpm');
  const bpmVal = container.querySelector('#music-bpm-val');
  const status = container.querySelector('#music-status');
  const result = container.querySelector('#music-result');
  const composeBtn = container.querySelector('#btn-compose-prompt');

  // Prompt Composer Function
  function composePromptString() {
    const instrumentsList = Array.from(selectedInstruments).join(', ');
    const instPart = instrumentsList ? `featuring ${instrumentsList}` : 'rich layered synthesizers';
    return `A ${selectedMood.toLowerCase()} ${selectedGenre.toLowerCase()} track in ${selectedKey} at ${currentBpm} BPM, ${instPart}, driving cybernetic rhythm, deep sub-bass, clean stereo imaging, cinematic production quality.`;
  }

  // Pre-fill initial prompt
  promptIn.value = composePromptString();

  composeBtn.addEventListener('click', () => {
    promptIn.value = composePromptString();
    playSFX('pop', 0.8);
    showToast('PROMPT COMPOSED', 'Cyber-workstation synthesized parameter blueprint.');
  });

  // Genre chips
  container.querySelectorAll('.genre-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.genre-chip').forEach(c => {
        c.classList.remove('active');
        c.style.background = 'rgba(0,0,0,0.4)';
        c.style.borderColor = 'rgba(255,255,255,0.1)';
        c.style.color = '#aaa';
      });
      chip.classList.add('active');
      chip.style.background = 'rgba(6,182,212,0.3)';
      chip.style.borderColor = '#06b6d4';
      chip.style.color = '#fff';
      selectedGenre = chip.dataset.genre;
      container.querySelector('#genre-badge').textContent = selectedGenre;
      playSFX('pop', 0.6);
    });
  });

  // Mood chips
  container.querySelectorAll('.mood-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.mood-chip').forEach(c => {
        c.classList.remove('active');
        c.style.background = 'rgba(0,0,0,0.4)';
        c.style.borderColor = 'rgba(255,255,255,0.1)';
        c.style.color = '#aaa';
      });
      chip.classList.add('active');
      chip.style.background = 'rgba(236,72,153,0.25)';
      chip.style.borderColor = '#ec4899';
      chip.style.color = '#fff';
      selectedMood = chip.dataset.mood;
      container.querySelector('#mood-badge').textContent = selectedMood;
      playSFX('pop', 0.6);
    });
  });

  // BPM Slider & Presets
  bpmSlider.addEventListener('input', () => {
    currentBpm = parseInt(bpmSlider.value, 10);
    bpmVal.textContent = `${currentBpm} BPM`;
  });

  container.querySelectorAll('.bpm-preset').forEach(btnPreset => {
    btnPreset.addEventListener('click', () => {
      currentBpm = parseInt(btnPreset.dataset.bpm, 10);
      bpmSlider.value = currentBpm;
      bpmVal.textContent = `${currentBpm} BPM`;
      playSFX('pop', 0.6);
    });
  });

  // Instrumentation toggles
  container.querySelectorAll('.inst-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const inst = chip.dataset.inst;
      if (selectedInstruments.has(inst)) {
        selectedInstruments.delete(inst);
        chip.classList.remove('active');
        chip.style.background = 'rgba(0,0,0,0.4)';
        chip.style.borderColor = 'rgba(255,255,255,0.1)';
        chip.style.color = '#888';
        chip.textContent = `+ ${inst}`;
      } else {
        selectedInstruments.add(inst);
        chip.classList.add('active');
        chip.style.background = 'rgba(16,185,129,0.25)';
        chip.style.borderColor = '#10b981';
        chip.style.color = '#fff';
        chip.textContent = `✓ ${inst}`;
      }
      playSFX('pop', 0.6);
    });
  });

  // Key selector
  const keySelect = container.querySelector('#music-key');
  keySelect.addEventListener('change', () => {
    selectedKey = keySelect.value;
  });

  // Duration Slider & Presets
  lengthSlider.addEventListener('input', () => {
    const val = parseInt(lengthSlider.value, 10);
    lengthIn.value = val;
    lengthVal.textContent = `${val} SECONDS`;
  });

  container.querySelectorAll('.dur-preset').forEach(presetBtn => {
    presetBtn.addEventListener('click', () => {
      const val = parseInt(presetBtn.dataset.dur, 10);
      lengthSlider.value = val;
      lengthIn.value = val;
      lengthVal.textContent = `${val} SECONDS`;
      playSFX('pop', 0.6);
    });
  });

  // Generate Handler
  btn.addEventListener('click', async () => {
    if (!sessionStorage.getItem('generate_authenticated')) {
      triggerBypassOverloadSequence();
      return;
    }
    const prompt = promptIn.value.trim();
    if (!prompt) return showToast('ENTER A PROMPT FIRST', 'error');
    
    const lengthSeconds = parseInt(lengthIn.value, 10) || 30;

    btn.disabled = true;
    status.style.display = 'block';
    result.innerHTML = '';
    status.textContent = 'INITIALIZING ACE-STEP 1.5 AUDIO SYNTHESIS...';

    try {
      const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
      const endpoint = isArchitect ? (settings.music_url || defaultEndpoint) : defaultEndpoint;
      
      status.textContent = 'SYNTHESIZING AUDIO VECTORS & HARMONICS...';
      
      const res = await fetch(`${endpoint}/api/music/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          length_seconds: lengthSeconds
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: Generation failed`);
      const data = await res.json();
      
      if (data.audio_b64) {
        const audioSrc = `data:audio/wav;base64,${data.audio_b64}`;
        result.innerHTML = `
          <div style="background:rgba(0,255,100,0.06); padding:20px; border:1px solid rgba(0,255,100,0.3); border-radius:6px; margin-top:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="color:#00ff66; font-family:'Orbitron',sans-serif; font-size:0.85rem; letter-spacing:1px;">SYNTHESIS COMPLETE // ACE-STEP 1.5</span>
              <span style="color:#aaa; font-family:'Share Tech Mono',monospace; font-size:0.75rem;">${lengthSeconds}s WAV</span>
            </div>
            <audio controls autoplay style="width:100%; outline:none; margin-bottom:12px;">
              <source src="${audioSrc}" type="audio/wav">
              Your browser does not support HTML5 audio playback.
            </audio>
            <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
              <a href="${audioSrc}" download="alphacore_track_${Date.now()}.wav" class="aim-btn aim-btn-sm" style="color:#4ade80; text-decoration:none; border-color:#4ade80; padding:6px 16px; font-size:0.75rem;">
                💾 DOWNLOAD WAV
              </a>
              <button type="button" id="music-to-director-btn" class="aim-btn aim-btn-sm" style="border-color:#ec4899; color:#ec4899; padding:6px 16px; font-size:0.75rem;">
                🎬 SEND TO DIRECTOR
              </button>
            </div>
          </div>
        `;

        result.querySelector('#music-to-director-btn')?.addEventListener('click', () => {
          sessionStorage.setItem('alphacore_director_injected_audio', audioSrc);
          window.location.hash = '#/director';
          playSFX('navigate', 0.5);
          showToast('CYBER-DIRECTOR', 'Track routed to Cyber-Director Audio Track.');
        });

        playSFX('pop', 0.8);
        showToast('TRACK GENERATED', 'Neural audio synthesis completed successfully.');

        logAction('MEDIA_GENERATION', {
          type: 'MUSIC',
          prompt,
          duration: lengthSeconds,
          genre: selectedGenre,
          bpm: currentBpm
        }, {
          category: 'MEDIA',
          level: 'INFO',
          message: prompt
        });

      } else {
        throw new Error(data.error || 'No audio returned from synthesis node');
      }
    } catch (err) {
      console.error(err);
      showToast('GENERATION FAILED', err.message);
    } finally {
      btn.disabled = false;
      status.style.display = 'none';
    }
  });

  return container;
}
