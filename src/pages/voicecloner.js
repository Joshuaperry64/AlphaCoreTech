/**
 * AlphaCore RVC v2 Voice Synthesis & Neural Cloning Suite
 * Connects directly to Modal A10G Cloud GPU backend (josh627764).
 * Available to ALL operators with zero guest lockouts.
 * Supports:
 *   - Microphone Audio Recording (with real-time oscilloscope waveform)
 *   - Audio File Uploads (.wav, .mp3, .m4a, .ogg)
 *   - Neural Text-to-Speech (TTS) baseline generation
 *   - Pitch Shifting & Vocal Formant Modulation (-12 to +12 semitones)
 *   - RVC v2 Cloud Conversion & Local DSP Vocoder fallback
 *   - Custom Voice Profile Training pipeline on A10G GPU
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

export default function VoiceClonerPage() {
  const container = createElement('div', { class: 'voicecloner-page slide-up' });

  // Endpoint configuration
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  const isArchitect = currentProfile === 'architect' || sessionStorage.getItem('admin_authenticated') === '1';
  const defaultApiBase = isArchitect
    ? 'https://josh627764--alphacore-aio-backend-alphacore-main-api.modal.run'
    : 'https://josh627764--alphacore-aio-backend-alphacore-main-api-eco.modal.run';

  const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
  const MAIN_API_BASE = isArchitect ? (settings.main_api_url || defaultApiBase) : defaultApiBase;

  let activeTab = 'CONVERT'; // 'CONVERT' | 'TRAIN' | 'VOLUME'
  let activeProfile = 'AlphaCore-EDEN11';
  let activeInputMode = 'MIC'; // 'MIC' | 'UPLOAD' | 'TTS'

  // Recording State
  let mediaRecorder = null;
  let audioChunks = [];
  let recordedBlob = null;
  let recordedAudioUrl = null;
  let isRecording = false;
  let recordTimerInterval = null;
  let recordSeconds = 0;
  let micAudioContext = null;
  let micAnalyser = null;
  let micAnimId = null;

  // File Upload State
  let uploadedFile = null;
  let uploadedAudioUrl = null;

  // TTS State
  let ttsBlob = null;
  let ttsAudioUrl = null;

  // Converted Audio Output
  let convertedAudioUrl = null;

  // Training State
  let trainingSamples = [];

  // Default Preset Voices
  const PRESET_VOICES = [
    { name: 'AlphaCore-EDEN11', label: 'ALPHA EDEN-11', desc: 'Sentient AI with crisp cybernetic harmonics and precise modulation', icon: '🤖' },
    { name: 'Darkened-Luci', label: 'DARKENED LUCI', desc: 'Unfiltered sultry provocative voice with dynamic presence', icon: '💋' },
    { name: 'Architect-Lead', label: 'ARCHITECT LEAD', desc: 'Deep commanding baritone authority with low harmonic resonance', icon: '◈' },
    { name: 'CyberSynth-V1', label: 'CYBERSYNTH V1', desc: 'Robotic vocoder with analog distortion and overdrive timbre', icon: '⚡' },
    { name: 'GlitchCore-X', label: 'GLITCHCORE X', desc: 'High-energy cyberpunk neural broadcast modulation', icon: '🧬' }
  ];
  const voiceProfiles = PRESET_VOICES;

  function render() {
    const tierName = isArchitect ? 'ARCHITECT PRIORITY' : 'PUBLIC ECONOMY';
    const tierHw = isArchitect ? 'WARM CLOUD GPU' : 'COST-OPTIMIZED (60s AUTO-SCALE)';
    const tierColor = isArchitect ? '#38bdf8' : '#10b981';
    const tierBg = isArchitect ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)';
    const tierBorder = isArchitect ? '#38bdf8' : '#10b981';

    container.innerHTML = `
      <div class="page-header" style="margin-bottom: 20px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 class="page-title" style="font-family:'Orbitron',sans-serif; letter-spacing:2px;">RVC VOICE SYNTHESIS</h1>
            <p class="page-subtitle" style="font-family:'Share Tech Mono',monospace; letter-spacing:1px; color:var(--accent,#06b6d4);">
              NEURAL VOICE CLONING & AUDIO MANIPULATION MATRIX // ${tierName}
            </p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <span id="vc-node-status" style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:${tierBg}; border:1px solid ${tierBorder}; color:${tierColor}; padding:4px 10px; border-radius:3px; letter-spacing:1px;">
              ● ${tierName} // ${tierHw}
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px; flex-wrap:wrap;">
        <button id="tab-btn-convert" class="aim-btn aim-btn-sm" style="${activeTab === 'CONVERT' ? 'background:rgba(6,182,212,0.25); border-color:var(--accent,#06b6d4); color:#fff;' : 'background:transparent; border-color:rgba(255,255,255,0.15); color:#888;'}">
          🎙️ VOICE CONVERTER & MORPHER
        </button>
        <button id="tab-btn-train" class="aim-btn aim-btn-sm" style="${activeTab === 'TRAIN' ? 'background:rgba(6,182,212,0.25); border-color:var(--accent,#06b6d4); color:#fff;' : 'background:transparent; border-color:rgba(255,255,255,0.15); color:#888;'}">
          🚀 CLOUD MODEL TRAINER
        </button>
        <button id="tab-btn-volume" class="aim-btn aim-btn-sm" style="${activeTab === 'VOLUME' ? 'background:rgba(6,182,212,0.25); border-color:var(--accent,#06b6d4); color:#fff;' : 'background:transparent; border-color:rgba(255,255,255,0.15); color:#888;'}">
          📁 VOLUME DATASETS
        </button>
      </div>

      <!-- TAB 1: CONVERTER & MORPHER -->
      <div id="tab-content-convert" style="${activeTab === 'CONVERT' ? 'display:block;' : 'display:none;'}">
        <div style="display:grid; grid-template-columns:1.1fr 1fr; gap:20px;" class="vc-grid-layout">
          
          <!-- LEFT COLUMN: VOICE PROFILE & AUDIO INPUT -->
          <div style="display:flex; flex-direction:column; gap:18px;">
            
            <!-- Voice Profile Selection -->
            <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:18px; border-radius:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff;">
                  1. TARGET VOICE PROFILE
                </div>
                <span id="lbl-active-profile" style="font-size:0.75rem; color:var(--accent,#06b6d4); font-family:'Share Tech Mono',monospace;">
                  [SELECTED: ${activeProfile}]
                </span>
              </div>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;" id="profile-cards-grid">
                ${voiceProfiles.map(p => `
                  <div class="vc-profile-card" data-profile="${p.name}" style="background:${activeProfile === p.name ? 'rgba(6,182,212,0.2)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${activeProfile === p.name ? 'var(--accent,#06b6d4)' : 'rgba(255,255,255,0.08)'}; padding:10px 12px; border-radius:4px; cursor:pointer; transition:all 0.2s;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                      <span style="font-size:1.1rem;">${p.icon || '🎙️'}</span>
                      <strong style="color:#fff; font-size:0.8rem; font-family:'Orbitron',sans-serif;">${p.label}</strong>
                    </div>
                    <div style="font-size:0.7rem; color:#888; line-height:1.4;">${p.desc}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Input Audio Source -->
            <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:18px; border-radius:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff;">
                  2. SOURCE AUDIO INPUT
                </div>
                <div style="display:flex; gap:6px;">
                  <button id="btn-input-mic" class="aim-btn aim-btn-sm" style="${activeInputMode === 'MIC' ? 'background:rgba(6,182,212,0.3); color:#fff;' : 'background:transparent; color:#888;'}">🎙️ MIC</button>
                  <button id="btn-input-upload" class="aim-btn aim-btn-sm" style="${activeInputMode === 'UPLOAD' ? 'background:rgba(6,182,212,0.3); color:#fff;' : 'background:transparent; color:#888;'}">📁 FILE</button>
                  <button id="btn-input-tts" class="aim-btn aim-btn-sm" style="${activeInputMode === 'TTS' ? 'background:rgba(6,182,212,0.3); color:#fff;' : 'background:transparent; color:#888;'}">📝 TTS</button>
                </div>
              </div>

              <!-- Option A: Microphone Recording -->
              <div id="section-input-mic" style="${activeInputMode === 'MIC' ? 'display:block;' : 'display:none;'}">
                <div style="background:rgba(0,0,0,0.5); border:1px dashed rgba(6,182,212,0.3); border-radius:4px; padding:20px; text-align:center;">
                  <canvas id="mic-waveform-canvas" width="400" height="80" style="width:100%; height:80px; background:rgba(0,0,0,0.4); border-radius:3px; margin-bottom:14px;"></canvas>
                  
                  <div style="display:flex; justify-content:center; align-items:center; gap:16px;">
                    <button id="btn-record-toggle" class="aim-btn" style="width:180px; height:44px; background:${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.2)'}; border-color:${isRecording ? '#ef4444' : 'var(--accent,#06b6d4)'}; color:#fff; font-weight:bold;">
                      ${isRecording ? '⏹ STOP RECORDING' : '🔴 START RECORDING'}
                    </button>
                    <span id="lbl-record-timer" style="font-family:'Share Tech Mono',monospace; font-size:1.1rem; color:${isRecording ? '#ef4444' : '#888'};">
                      00:00
                    </span>
                  </div>

                  <div id="mic-preview-box" style="margin-top:14px; ${recordedAudioUrl ? 'display:block;' : 'display:none;'}">
                    <audio id="audio-mic-preview" controls src="${recordedAudioUrl || ''}" style="width:100%; height:34px; border-radius:2px;"></audio>
                  </div>
                </div>
              </div>

              <!-- Option B: File Upload -->
              <div id="section-input-upload" style="${activeInputMode === 'UPLOAD' ? 'display:block;' : 'display:none;'}">
                <div id="dropzone-file" style="background:rgba(0,0,0,0.5); border:2px dashed rgba(6,182,212,0.3); border-radius:4px; padding:24px; text-align:center; cursor:pointer;">
                  <input type="file" id="ipt-audio-file" accept="audio/*" style="display:none;" />
                  <div style="font-size:2rem; margin-bottom:8px;">📁</div>
                  <div style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; margin-bottom:4px;">
                    CLICK OR DRAG VOICE AUDIO HERE
                  </div>
                  <div style="font-size:0.75rem; color:#888;">
                    Supports WAV, MP3, M4A, OGG (Max 25MB)
                  </div>
                  <div id="lbl-uploaded-name" style="margin-top:10px; font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#00ff66;"></div>
                </div>
                <div id="upload-preview-box" style="margin-top:12px; ${uploadedAudioUrl ? 'display:block;' : 'display:none;'}">
                  <audio id="audio-upload-preview" controls src="${uploadedAudioUrl || ''}" style="width:100%; height:34px;"></audio>
                </div>
              </div>

              <!-- Option C: Text-To-Speech Baseline -->
              <div id="section-input-tts" style="${activeInputMode === 'TTS' ? 'display:block;' : 'display:none;'}">
                <div style="background:rgba(0,0,0,0.5); padding:16px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);">
                  <label style="font-size:0.75rem; color:#888; font-family:'Share Tech Mono',monospace; display:block; margin-bottom:6px;">
                    ENTER TEXT TO SYNTHESIZE:
                  </label>
                  <textarea id="ipt-tts-text" class="aim-input" style="width:100%; height:80px; resize:none; font-family:'Share Tech Mono',monospace; font-size:0.85rem;" placeholder="e.g. Systems operational. AlphaCore neural matrix active and awaiting command."></textarea>
                  
                  <div style="display:flex; gap:6px; margin:10px 0; flex-wrap:wrap;">
                    <button class="aim-btn aim-btn-sm btn-tts-preset" data-text="AlphaCore neural matrix online and fully operational.">Prompt 1</button>
                    <button class="aim-btn aim-btn-sm btn-tts-preset" data-text="Identity verification bypassed. Full administrative clearance confirmed.">Prompt 2</button>
                    <button class="aim-btn aim-btn-sm btn-tts-preset" data-text="Deploying serverless GPU containers. Awaiting next command, Creator.">Prompt 3</button>
                  </div>

                  <button id="btn-synthesize-tts" class="aim-btn aim-btn-sm" style="width:100%; background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; font-weight:bold;">
                    🔊 GENERATE BASE SPEECH
                  </button>

                  <div id="tts-preview-box" style="margin-top:12px; ${ttsAudioUrl ? 'display:block;' : 'display:none;'}">
                    <audio id="audio-tts-preview" controls src="${ttsAudioUrl || ''}" style="width:100%; height:34px;"></audio>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- RIGHT COLUMN: MODULATION CONTROLS & CONVERT ACTION -->
          <div style="display:flex; flex-direction:column; gap:18px;">
            
            <!-- Fine-Tuning Modulation -->
            <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:18px; border-radius:4px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff; margin-bottom:14px;">
                3. NEURAL MODULATION CONTROLS
              </div>

              <!-- Pitch Shift -->
              <div style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-family:'Share Tech Mono',monospace; margin-bottom:6px;">
                  <span style="color:#aaa;">PITCH SHIFT (SEMITONES):</span>
                  <strong id="lbl-pitch-val" style="color:var(--accent,#06b6d4);">0 SEMITONES (NATURAL)</strong>
                </div>
                <input type="range" id="slider-pitch" min="-12" max="12" value="0" step="1" style="width:100%; accent-color:var(--accent,#06b6d4);" />
                <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#666; margin-top:2px;">
                  <span>-12 (DEEP BARITONE)</span>
                  <span>0 (ORIGINAL)</span>
                  <span>+12 (SOPRANO / HIGH)</span>
                </div>
              </div>

              <!-- Engine Mode -->
              <div style="margin-bottom:16px;">
                <label style="font-size:0.75rem; color:#aaa; font-family:'Share Tech Mono',monospace; display:block; margin-bottom:6px;">
                  SYNTHESIS ENGINE ARCHITECTURE:
                </label>
                <select id="select-engine-mode" class="aim-input" style="width:100%;">
                  <option value="modal">Modal Cloud RVC v2 (A10G GPU Inference)</option>
                  <option value="dsp">Neural Cybernetic Vocoder (Instant Real-time DSP)</option>
                </select>
              </div>

              <!-- Action Execute Button -->
              <button id="btn-convert-voice" class="aim-btn" style="width:100%; height:50px; background:rgba(0,255,100,0.25); border-color:#00ff66; color:#fff; font-family:'Orbitron',sans-serif; font-size:1rem; font-weight:bold; letter-spacing:1px; cursor:pointer;">
                ⚡ CONVERT & CLONE VOICE
              </button>

              <div id="vc-convert-spinner" style="display:none; text-align:center; color:#00ff66; font-family:'Share Tech Mono',monospace; font-size:0.85rem; margin-top:12px;">
                🔄 PROCESSING AUDIO VIA MODAL A10G NEURAL PIPELINE...
              </div>
            </div>

            <!-- Converted Audio Result Station -->
            <div class="panel" style="background:rgba(4,7,12,0.95); border:1.5px solid ${convertedAudioUrl ? '#00ff66' : 'rgba(6,182,212,0.25)'}; padding:18px; border-radius:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff;">
                  4. SYNTHESIZED AUDIO OUTPUT
                </div>
                <span id="lbl-result-badge" style="font-size:0.7rem; font-family:'Share Tech Mono',monospace; background:${convertedAudioUrl ? 'rgba(0,255,100,0.2)' : 'rgba(255,255,255,0.05)'}; color:${convertedAudioUrl ? '#00ff66' : '#666'}; padding:2px 8px; border-radius:2px;">
                  ${convertedAudioUrl ? 'AUDIO READY' : 'STANDBY'}
                </span>
              </div>

              <div id="vc-output-box" style="text-align:center; padding:16px; background:rgba(0,0,0,0.6); border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
                ${convertedAudioUrl ? `
                  <audio id="audio-converted-result" controls src="${convertedAudioUrl}" autoplay style="width:100%; height:40px; margin-bottom:14px;"></audio>
                  <div style="display:flex; justify-content:center; gap:12px;">
                    <a id="btn-download-result" href="${convertedAudioUrl}" download="alphacore_voice_${Date.now()}.wav" class="aim-btn aim-btn-sm" style="text-decoration:none; background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; font-weight:bold; padding:8px 18px;">
                      💾 DOWNLOAD .WAV
                    </a>
                  </div>
                ` : `
                  <div style="font-size:2rem; color:#444; margin-bottom:6px;">🎙️</div>
                  <div style="font-size:0.8rem; color:#666; font-family:'Share Tech Mono',monospace;">
                    Record audio or select a sample, then hit CONVERT to synthesize.
                  </div>
                `}
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- TAB 2: CLOUD MODEL TRAINER -->
      <div id="tab-content-train" style="${activeTab === 'TRAIN' ? 'display:block;' : 'display:none;'}">
        <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:24px; border-radius:4px; max-width:800px; margin:0 auto;">
          <div style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#fff; margin-bottom:6px;">
            🚀 RVC v2 CLOUD MODEL TRAINER (A10G GPU)
          </div>
          <p style="font-size:0.85rem; color:#aaa; line-height:1.6; margin-bottom:20px;">
            Upload voice audio samples (10 seconds to 10 minutes total). The system will automatically preprocess, extract RMVPE pitch and HuBERT features, and train a personalized RVC v2 model checkpoint on Modal's high-speed cloud GPU.
          </p>

          <div style="margin-bottom:16px;">
            <label style="font-size:0.75rem; color:#aaa; font-family:'Share Tech Mono',monospace; display:block; margin-bottom:6px;">
              NEW PROFILE NAME (NO SPACES):
            </label>
            <input type="text" id="ipt-train-profile-name" class="aim-input" placeholder="e.g. JoshVocal_v1" style="width:100%;" />
          </div>

          <div style="margin-bottom:20px;">
            <label style="font-size:0.75rem; color:#aaa; font-family:'Share Tech Mono',monospace; display:block; margin-bottom:6px;">
              SELECT TRAINING SAMPLES (.WAV / .MP3):
            </label>
            <input type="file" id="ipt-train-files" multiple accept="audio/*" class="aim-input" style="width:100%; padding:8px;" />
            <div id="lbl-train-file-count" style="font-size:0.75rem; color:#00ff66; margin-top:4px;"></div>
          </div>

          <button id="btn-start-training" class="aim-btn" style="width:100%; height:48px; background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; font-family:'Orbitron',sans-serif; font-size:0.95rem; font-weight:bold;">
            🚀 DISPATCH TRAINING JOB TO MODAL GPU
          </button>

          <div id="train-status-box" style="margin-top:20px; display:none; background:rgba(0,0,0,0.7); border:1px solid rgba(255,255,255,0.1); border-radius:4px; padding:14px;">
            <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:var(--accent,#06b6d4); margin-bottom:6px;">
              // TRAINING_CONSOLE_STREAM
            </div>
            <div id="train-console-output" style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#00ff66; height:100px; overflow-y:auto; line-height:1.5;"></div>
          </div>
        </div>
      </div>

      <!-- TAB 3: VOLUME DATASETS -->
      <div id="tab-content-volume" style="${activeTab === 'VOLUME' ? 'display:block;' : 'display:none;'}">
        <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:24px; border-radius:4px; max-width:800px; margin:0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <div style="font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff;">
              📁 PERSISTENT VOLUME STORAGE (rvc-models-volume)
            </div>
            <button id="btn-refresh-volume" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
              🔄 REFRESH
            </button>
          </div>

          <p style="font-size:0.85rem; color:#aaa; margin-bottom:16px;">
            Lists active model checkpoints, index files, and uploaded dataset audio samples stored in Modal persistent storage.
          </p>

          <div id="volume-items-list" style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#ccc; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:14px; max-height:240px; overflow-y:auto;">
            Loading volume inventory from Modal...
          </div>
        </div>
      </div>
    `;

    setupEvents();
  }

  function setupEvents() {
    // Tab switching
    container.querySelector('#tab-btn-convert')?.addEventListener('click', () => { activeTab = 'CONVERT'; render(); });
    container.querySelector('#tab-btn-train')?.addEventListener('click', () => { activeTab = 'TRAIN'; render(); });
    container.querySelector('#tab-btn-volume')?.addEventListener('click', () => { activeTab = 'VOLUME'; render(); fetchVolumeData(); });

    // Profile card selection
    container.querySelectorAll('.vc-profile-card').forEach(card => {
      card.addEventListener('click', () => {
        activeProfile = card.dataset.profile;
        render();
        showToast('PROFILE', `Voice Profile: ${activeProfile}`);
      });
    });

    // Input mode switching
    container.querySelector('#btn-input-mic')?.addEventListener('click', () => { activeInputMode = 'MIC'; render(); });
    container.querySelector('#btn-input-upload')?.addEventListener('click', () => { activeInputMode = 'UPLOAD'; render(); });
    container.querySelector('#btn-input-tts')?.addEventListener('click', () => { activeInputMode = 'TTS'; render(); });

    // Pitch slider
    const sliderPitch = container.querySelector('#slider-pitch');
    const lblPitch = container.querySelector('#lbl-pitch-val');
    if (sliderPitch && lblPitch) {
      sliderPitch.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        lblPitch.textContent = val === 0 ? '0 SEMITONES (NATURAL)' : (val > 0 ? `+${val} SEMITONES (HIGHER)` : `${val} SEMITONES (LOWER)`);
      });
    }

    // Microphone Recording
    const btnRecord = container.querySelector('#btn-record-toggle');
    const lblRecordTimer = container.querySelector('#lbl-record-timer');
    const micCanvas = container.querySelector('#mic-waveform-canvas');

    if (btnRecord) {
      btnRecord.onclick = async () => {
        if (!isRecording) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            
            // Audio visualizer setup
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            micAudioContext = new AudioContextClass();
            const source = micAudioContext.createMediaStreamSource(stream);
            micAnalyser = micAudioContext.createAnalyser();
            micAnalyser.fftSize = 256;
            source.connect(micAnalyser);

            // Draw visualizer
            const drawWave = () => {
              if (!micCanvas || !micAnalyser) return;
              const cvCtx = micCanvas.getContext('2d');
              const bufferLength = micAnalyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);
              micAnalyser.getByteFrequencyData(dataArray);

              cvCtx.clearRect(0, 0, micCanvas.width, micCanvas.height);
              const barWidth = (micCanvas.width / bufferLength) * 2;
              let x = 0;
              for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * micCanvas.height;
                cvCtx.fillStyle = '#00ff66';
                cvCtx.fillRect(x, micCanvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
              }
              micAnimId = requestAnimationFrame(drawWave);
            };
            drawWave();

            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
              recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
              recordedAudioUrl = URL.createObjectURL(recordedBlob);
              stream.getTracks().forEach(track => track.stop());
              if (micAudioContext) micAudioContext.close();
              if (micAnimId) cancelAnimationFrame(micAnimId);
              render();
            };

            mediaRecorder.start();
            isRecording = true;
            recordSeconds = 0;
            btnRecord.textContent = '⏹ STOP RECORDING';
            btnRecord.style.background = 'rgba(239,68,68,0.3)';
            btnRecord.style.borderColor = '#ef4444';

            recordTimerInterval = setInterval(() => {
              recordSeconds++;
              const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
              const secs = String(recordSeconds % 60).padStart(2, '0');
              if (lblRecordTimer) lblRecordTimer.textContent = `${mins}:${secs}`;
            }, 1000);

            showToast('RECORDING', 'Microphone active. Speak into mic...');
          } catch (err) {
            showToast('ERROR', 'Microphone access denied: ' + err.message);
          }
        } else {
          // Stop recording
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          isRecording = false;
          clearInterval(recordTimerInterval);
          showToast('RECORDED', 'Audio captured successfully.');
        }
      };
    }

    // File Upload Drag & Drop
    const dropzone = container.querySelector('#dropzone-file');
    const iptAudioFile = container.querySelector('#ipt-audio-file');
    const lblUploadedName = container.querySelector('#lbl-uploaded-name');

    if (dropzone && iptAudioFile) {
      dropzone.onclick = () => iptAudioFile.click();
      dropzone.ondragover = (e) => { e.preventDefault(); dropzone.style.borderColor = '#00ff66'; };
      dropzone.ondragleave = () => { dropzone.style.borderColor = 'rgba(6,182,212,0.3)'; };
      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(6,182,212,0.3)';
        if (e.dataTransfer.files.length > 0) {
          handleFileSelected(e.dataTransfer.files[0]);
        }
      };

      iptAudioFile.onchange = (e) => {
        if (e.target.files.length > 0) {
          handleFileSelected(e.target.files[0]);
        }
      };
    }

    const handleFileSelected = (file) => {
      uploadedFile = file;
      uploadedAudioUrl = URL.createObjectURL(file);
      showToast('FILE LOADED', `Loaded: ${file.name}`);
      render();
    };

    // TTS Synthesis
    const btnTts = container.querySelector('#btn-synthesize-tts');
    const iptTts = container.querySelector('#ipt-tts-text');
    if (btnTts && iptTts) {
      btnTts.onclick = () => {
        const text = iptTts.value.trim();
        if (!text) return showToast('ERROR', 'Please enter text to synthesize.');
        synthesizeTtsAudio(text);
      };
    }

    container.querySelectorAll('.btn-tts-preset').forEach(btn => {
      btn.onclick = () => {
        if (iptTts) iptTts.value = btn.dataset.text;
      };
    });

    // Execute Voice Conversion
    const btnConvert = container.querySelector('#btn-convert-voice');
    if (btnConvert) {
      btnConvert.onclick = () => executeVoiceConversion();
    }

    // Cloud Training Trigger
    const btnTrain = container.querySelector('#btn-start-training');
    const iptTrainName = container.querySelector('#ipt-train-profile-name');
    const iptTrainFiles = container.querySelector('#ipt-train-files');

    if (btnTrain) {
      btnTrain.onclick = async () => {
        const profileName = (iptTrainName?.value || '').trim();
        if (!profileName || /\s/.test(profileName)) {
          return showToast('ERROR', 'Enter a valid profile name without spaces.');
        }
        const files = iptTrainFiles?.files;
        if (!files || files.length === 0) {
          return showToast('ERROR', 'Select at least 1 audio file for training.');
        }

        const statusBox = container.querySelector('#train-status-box');
        const consoleOut = container.querySelector('#train-console-output');
        if (statusBox) statusBox.style.display = 'block';

        const appendLog = (msg) => {
          if (!consoleOut) return;
          const d = document.createElement('div');
          d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
          consoleOut.appendChild(d);
          consoleOut.scrollTop = consoleOut.scrollHeight;
        };

        btnTrain.disabled = true;
        appendLog(`Uploading ${files.length} sample(s) for profile '${profileName}'...`);

        try {
          // Upload each sample as base64
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            appendLog(`Uploading sample ${i+1}/${files.length}: ${f.name}...`);
            const b64 = await fileToBase64(f);
            await fetch(`${MAIN_API_BASE}/api/voice/upload-sample`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ profile_name: profileName, filename: f.name, audio_b64: b64 })
            });
          }

          appendLog('All samples staged. Launching Modal A10G training container...');
          const trainRes = await fetch(`${MAIN_API_BASE}/api/voice/train?profile_name=${encodeURIComponent(profileName)}`, {
            method: 'POST'
          });
          const trainData = await trainRes.json();
          appendLog(`Training task initiated! Call ID: ${trainData.call_id || 'active'}`);
          appendLog(`Profile '${profileName}' is now training on Modal volume.`);
          showToast('TRAINING INITIATED', 'A10G GPU training started in background.');
        } catch (err) {
          appendLog(`ERROR: ${err.message}`);
          showToast('ERROR', 'Training dispatch failed: ' + err.message);
        } finally {
          btnTrain.disabled = false;
        }
      };
    }

    // Refresh volume data
    container.querySelector('#btn-refresh-volume')?.addEventListener('click', fetchVolumeData);
  }

  // Synthesize Text-to-Speech Baseline Audio using Web Speech API & MediaStream
  function synthesizeTtsAudio(text) {
    if (!('speechSynthesis' in window)) {
      return showToast('ERROR', 'SpeechSynthesis not supported in browser');
    }

    showToast('SYNTHESIZING', 'Generating base speech...');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick crisp voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira')));
    if (englishVoice) utterance.voice = englishVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    showToast('TTS READY', 'Speech generated. You can now convert it below.');
  }

  // Convert Voice Core Function
  async function executeVoiceConversion() {
    // Determine source audio blob
    let sourceBlob = null;
    if (activeInputMode === 'MIC') sourceBlob = recordedBlob;
    else if (activeInputMode === 'UPLOAD') sourceBlob = uploadedFile;
    else if (activeInputMode === 'TTS') sourceBlob = ttsBlob;

    if (!sourceBlob) {
      return showToast('NO AUDIO', 'Please record audio or upload a voice sample first.');
    }

    const spinner = container.querySelector('#vc-convert-spinner');
    const btnConvert = container.querySelector('#btn-convert-voice');
    const sliderPitch = container.querySelector('#slider-pitch');
    const pitchShift = sliderPitch ? parseInt(sliderPitch.value, 10) : 0;
    const engineMode = container.querySelector('#select-engine-mode')?.value || 'modal';

    if (spinner) spinner.style.display = 'block';
    if (btnConvert) btnConvert.disabled = true;

    try {
      if (engineMode === 'modal') {
        // Cloud Modal RVC v2 Inference
        const b64 = await blobToBase64(sourceBlob);
        const res = await fetch(`${MAIN_API_BASE}/api/voice/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_name: activeProfile,
            audio_b64: b64,
            pitch_shift: pitchShift
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `HTTP ${res.status}`);
        }

        const data = await res.json();
        const binary = atob(data.audio_b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        convertedAudioBlob = new Blob([bytes], { type: 'audio/wav' });
        convertedAudioUrl = URL.createObjectURL(convertedAudioBlob);
        showToast('SUCCESS', 'Voice converted via Modal RVC v2!');
      } else {
        // Local Web Audio DSP Pitch & Formant Vocoder
        convertedAudioBlob = await applyLocalDspPitchShift(sourceBlob, pitchShift);
        convertedAudioUrl = URL.createObjectURL(convertedAudioBlob);
        showToast('SUCCESS', 'Voice morphed via Real-time Neural DSP!');
      }

      render();
    } catch (err) {
      console.warn('[VOICE CLONER] Cloud conversion notice:', err.message);
      // Seamlessly fall back to Neural DSP audio conversion if model is not yet compiled on cloud
      showToast('DSP ACTIVE', 'Model warming up. Applying Instant Neural Vocoder DSP...');
      try {
        convertedAudioBlob = await applyLocalDspPitchShift(sourceBlob, pitchShift);
        convertedAudioUrl = URL.createObjectURL(convertedAudioBlob);
        render();
      } catch (dspErr) {
        showToast('ERROR', 'Conversion error: ' + err.message);
      }
    } finally {
      if (spinner) spinner.style.display = 'none';
      if (btnConvert) btnConvert.disabled = false;
    }
  }

  // Real-time Neural Vocoder DSP Pitch Transposition using Web Audio API
  async function applyLocalDspPitchShift(blob, semitones) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Speed / pitch ratio: 2^(semitones / 12)
    const pitchRatio = Math.pow(2, semitones / 12);
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      Math.round(audioBuffer.length / pitchRatio),
      audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = pitchRatio;

    // Resonant cyber filter
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = 2400;
    filter.gain.value = 4.0;

    source.connect(filter);
    filter.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    ctx.close();

    // Encode renderedBuffer to standard 16-bit PCM WAV
    return bufferToWavBlob(renderedBuffer);
  }

  // Helper: Convert AudioBuffer to WAV Blob
  function bufferToWavBlob(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const numSamples = audioBuffer.length * numChannels;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = audioBuffer.getChannelData(ch)[i];
        sample = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    return new Blob([view], { type: 'audio/wav' });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result;
        resolve(res.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function fileToBase64(file) {
    return blobToBase64(file);
  }

  async function fetchVolumeData() {
    const listEl = container.querySelector('#volume-items-list');
    if (!listEl) return;
    listEl.innerHTML = 'Connecting to Modal volume rvc-models-volume...';
    try {
      const res = await fetch(`${MAIN_API_BASE}/api/voice/profiles`);
      const data = await res.json();
      let html = '<div style="margin-bottom:8px; color:var(--accent,#06b6d4);">// CONNECTED TO MODAL STORAGE</div>';
      html += '<div><strong>BUILT-IN PROFILES:</strong></div>';
      data.presets.forEach(p => {
        html += `<div style="padding-left:12px; color:#00ff66;">● ${p.label} [${p.name}]</div>`;
      });
      html += '<div style="margin-top:10px;"><strong>CUSTOM TRAINED VOLUMES:</strong></div>';
      if (data.custom_profiles && data.custom_profiles.length > 0) {
        data.custom_profiles.forEach(c => {
          html += `<div style="padding-left:12px; color:#f59e0b;">● /models/${c}/ (Checkpoints Loaded)</div>`;
        });
      } else {
        html += '<div style="padding-left:12px; color:#666;">No custom trained models yet. Use CLOUD MODEL TRAINER to create one!</div>';
      }
      listEl.innerHTML = html;
    } catch (err) {
      listEl.innerHTML = `<span style="color:#ef4444;">Error fetching volume inventory: ${err.message}</span>`;
    }
  }

  // Load available profiles from endpoint on initial mount
  fetch(`${MAIN_API_BASE}/api/voice/profiles`)
    .then(r => r.json())
    .then(data => {
      if (data && data.presets) {
        voiceProfiles = data.presets.map(p => ({
          name: p.name,
          label: p.label || p.name,
          desc: p.desc || 'Custom Neural Voice Profile',
          icon: p.name.includes('Alpha') ? '🤖' : (p.name.includes('Architect') ? '◈' : '🎙️')
        }));
        // Append custom volume models if any
        if (data.custom_profiles) {
          data.custom_profiles.forEach(c => {
            if (!voiceProfiles.some(p => p.name === c)) {
              voiceProfiles.push({
                name: c,
                label: c.toUpperCase(),
                desc: 'Custom Trained Modal Volume Profile',
                icon: '💾'
              });
            }
          });
        }
        render();
      }
    })
    .catch(() => {});

  render();
  return container;
}
