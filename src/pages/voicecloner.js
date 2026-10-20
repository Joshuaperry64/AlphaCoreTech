/**
 * AlphaCore Unified Voice Cloning & TTS Pipeline
 * One-click pipeline: Text -> Neural Base -> RVC Voice Profile morph.
 * Operates strictly with genuine user/cloud profiles (no hardcoded mock presets).
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { logAction } from '../components/logger.js';
import { playSFX } from '../components/audio.js';
import { triggerBypassOverloadSequence } from '../components/pinpad.js';

export default function VoiceClonerPage() {
  const container = createElement('div', { class: 'voicecloner-page slide-up' });

  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim().toLowerCase();
  const currentPin = (sessionStorage.getItem('current_pin') || '').trim();
  const isArchitect = currentProfile === 'architect' || currentPin === '672167566';
  const defaultApiBase = isArchitect
    ? 'https://josh627764--alphacore-aio-backend-alphacore-main-api.us-east.modal.run/architect'
    : 'https://josh627764--alphacore-aio-backend-alphacore-main-api.us-east.modal.run/eco';

  const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
  const MAIN_API_BASE = isArchitect ? (settings.main_api_url || defaultApiBase) : defaultApiBase;

  let activeTab = 'CONVERT'; 
  let activeInputMode = 'TTS'; // Default to Text-to-Voice

  // State
  let mediaRecorder = null;
  let audioChunks = [];
  let recordedBlob = null;
  let isRecording = false;
  let uploadedFile = null;
  let convertedAudioUrl = null;

  // Genuine saved profiles retrieval
  function getSavedProfiles() {
    try {
      const stored = localStorage.getItem('alphacore_voice_profiles');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveVoiceProfile(profileObj) {
    try {
      const current = getSavedProfiles();
      const existingIdx = current.findIndex(p => p.name === profileObj.name);
      if (existingIdx >= 0) {
        current[existingIdx] = profileObj;
      } else {
        current.push(profileObj);
      }
      localStorage.setItem('alphacore_voice_profiles', JSON.stringify(current));
    } catch (e) {
      console.warn('Failed saving voice profile:', e);
    }
  }

  let voiceProfiles = getSavedProfiles();
  let activeProfile = voiceProfiles.length > 0 ? voiceProfiles[0].name : '';

  function render() {
    if (voiceProfiles.length > 0 && (!activeProfile || !voiceProfiles.some(p => p.name === activeProfile))) {
      activeProfile = voiceProfiles[0].name;
    }

    container.innerHTML = `
      <div class="page-header" style="margin-bottom: 20px;">
        <h1 class="page-title glitch" data-text="RVC SYNTHESIS MATRIX" style="font-family:'Orbitron',sans-serif; letter-spacing:2px; margin:0 0 6px 0;">RVC SYNTHESIS MATRIX</h1>
        <p class="page-subtitle" style="font-family:'Share Tech Mono',monospace; color:var(--accent,#06b6d4);">
          UNIFIED TEXT-TO-VOICE & VOICE-TO-VOICE PIPELINE // USER & CLOUD PROFILES
        </p>
      </div>

      <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
        <button id="tab-btn-convert" class="aim-btn aim-btn-sm" style="${activeTab === 'CONVERT' ? 'background:rgba(6,182,212,0.25); color:#fff; border-color:var(--accent,#06b6d4);' : 'background:transparent; color:#888;'}">🎙️ PIPELINE</button>
        <button id="tab-btn-train" class="aim-btn aim-btn-sm" style="${activeTab === 'TRAIN' ? 'background:rgba(6,182,212,0.25); color:#fff; border-color:var(--accent,#06b6d4);' : 'background:transparent; color:#888;'}">🚀 TRAIN NEW PROFILE</button>
      </div>

      <div id="tab-content-convert" style="${activeTab === 'CONVERT' ? 'display:block;' : 'display:none;'}">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
          
          <!-- LEFT: SETUP -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff;">1. SELECT VOICE PROFILE</div>
                <span style="font-size:0.75rem; color:#4ade80; font-family:'Share Tech Mono',monospace;">${voiceProfiles.length} ACTIVE</span>
              </div>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="profile-cards-grid">
                ${voiceProfiles.length === 0 ? `
                  <div style="grid-column: 1 / -1; padding: 24px 16px; text-align: center; border: 1px dashed rgba(6,182,212,0.3); background: rgba(0,0,0,0.4); border-radius: 4px;">
                    <div style="font-size: 1.8rem; margin-bottom: 8px;">🎙️</div>
                    <div style="font-family:'Orbitron',sans-serif; font-size:0.85rem; color:#fff; margin-bottom:6px;">NO SAVED VOICE PROFILES FOUND</div>
                    <div style="font-size:0.75rem; color:#888; font-family:'Share Tech Mono',monospace; margin-bottom:14px; line-height:1.4;">
                      No saved user profiles detected. Record audio below or use 'TRAIN NEW PROFILE' to create a custom RVC voice profile.
                    </div>
                    <button type="button" id="btn-empty-goto-train" class="aim-btn aim-btn-sm" style="border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4); padding:6px 14px;">
                      🚀 TRAIN NEW PROFILE
                    </button>
                  </div>
                ` : voiceProfiles.map(p => `
                  <div class="vc-profile-card" data-profile="${p.name}" style="background:${activeProfile === p.name ? 'rgba(6,182,212,0.2)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${activeProfile === p.name ? 'var(--accent,#06b6d4)' : 'rgba(255,255,255,0.08)'}; padding:8px 10px; border-radius:4px; cursor:pointer; transition:0.2s;">
                    <div style="display:flex; align-items:center; gap:6px; font-family:'Orbitron',sans-serif; font-size:0.75rem; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                      <span>${p.icon || '🎙️'}</span>
                      <span title="${p.name}">${p.label || p.name}</span>
                    </div>
                    ${p.desc ? `<div style="font-size:0.65rem; color:#888; font-family:'Share Tech Mono',monospace; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.desc}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff;">2. INPUT DATA</div>
                <div style="display:flex; gap:4px;">
                  <button id="btn-mode-tts" class="aim-btn aim-btn-sm" style="${activeInputMode === 'TTS' ? 'background:rgba(6,182,212,0.3); color:#fff;' : 'background:transparent; color:#888;'}">📝 TEXT</button>
                  <button id="btn-mode-mic" class="aim-btn aim-btn-sm" style="${activeInputMode === 'MIC' ? 'background:rgba(6,182,212,0.3); color:#fff;' : 'background:transparent; color:#888;'}">🎙️ MIC</button>
                  <button id="btn-mode-upload" class="aim-btn aim-btn-sm" style="${activeInputMode === 'UPLOAD' ? 'background:rgba(6,182,212,0.3); color:#fff;' : 'background:transparent; color:#888;'}">📁 FILE</button>
                </div>
              </div>

              <div id="ui-tts" style="${activeInputMode === 'TTS' ? 'display:block;' : 'display:none;'}">
                <textarea id="ipt-tts-text" class="aim-input" style="width:100%; height:110px; resize:vertical; font-family:'Share Tech Mono',monospace;" placeholder="Type text here to be synthesized and cloned..."></textarea>
              </div>

              <div id="ui-mic" style="${activeInputMode === 'MIC' ? 'display:block;' : 'display:none; text-align:center;'}">
                <canvas id="mic-waveform-canvas" width="400" height="60" style="width:100%; height:60px; background:rgba(0,0,0,0.4); margin-bottom:10px; border-radius:3px;"></canvas>
                <button id="btn-record-toggle" class="aim-btn" style="width:100%; background:${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.2)'}; border-color:${isRecording ? '#ef4444' : 'var(--accent,#06b6d4)'}; color:#fff; font-family:'Orbitron',sans-serif;">
                  ${isRecording ? '⏹ STOP RECORDING' : '🔴 START RECORDING'}
                </button>
                <div id="lbl-mic-status" style="margin-top:8px; font-size:0.75rem; color:#00ff66; font-family:'Share Tech Mono',monospace;">
                  ${recordedBlob ? '✓ Audio sample captured and ready.' : ''}
                </div>
                ${recordedBlob ? `
                  <div style="margin-top:12px; padding:10px; background:rgba(6,182,212,0.08); border:1px dashed rgba(6,182,212,0.3); border-radius:4px; text-align:left;">
                    <div style="font-size:0.72rem; color:#06b6d4; font-family:'Orbitron',sans-serif; margin-bottom:6px;">SAVE AS NEW VOICE PROFILE:</div>
                    <div style="display:flex; gap:6px;">
                      <input type="text" id="ipt-save-rec-name" class="aim-input" placeholder="Profile Name (e.g. MyVoice_v1)" style="flex:1; font-size:0.75rem; padding:4px 8px;" />
                      <button type="button" id="btn-save-rec-profile" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.25); border-color:#10b981; color:#fff; font-size:0.72rem; padding:4px 10px;">💾 SAVE</button>
                    </div>
                  </div>
                ` : ''}
              </div>

              <div id="ui-upload" style="${activeInputMode === 'UPLOAD' ? 'display:block;' : 'display:none;'}">
                <input type="file" id="ipt-audio-file" accept="audio/*" class="aim-input" style="width:100%; padding:8px;" />
                <div id="lbl-upload-status" style="margin-top:8px; font-size:0.75rem; color:#00ff66; font-family:'Share Tech Mono',monospace;">
                  ${uploadedFile ? `✓ Loaded: ${uploadedFile.name}` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: EXECUTE & OUTPUT -->
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:16px; border-radius:4px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff; margin-bottom:12px;">3. MODULATION & EXECUTION</div>
              
              <div style="margin-bottom:16px;">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-family:'Share Tech Mono',monospace; margin-bottom:6px; color:#aaa;">
                  <span>PITCH SHIFT:</span> <strong id="lbl-pitch-val" style="color:var(--accent,#06b6d4);">0 (NATURAL)</strong>
                </div>
                <input type="range" id="slider-pitch" min="-12" max="12" value="0" step="1" style="width:100%; accent-color:var(--accent,#06b6d4);" />
              </div>

              <button id="btn-execute-pipeline" class="aim-btn" style="width:100%; height:50px; background:rgba(0,255,100,0.25); border-color:#00ff66; color:#fff; font-family:'Orbitron',sans-serif; font-weight:bold; font-size:1rem;">
                ⚡ SYNTHESIZE & CLONE VOICE
              </button>
              
              <div id="pipeline-status" style="margin-top:12px; text-align:center; font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#00ff66; display:none; padding:8px; background:rgba(0,255,100,0.06); border:1px dashed #00ff66; border-radius:4px;">
                🔄 PROCESSING PIPELINE...
              </div>
            </div>

            <div class="panel" style="background:rgba(4,7,12,0.95); border:1.5px solid ${convertedAudioUrl ? '#00ff66' : 'rgba(6,182,212,0.25)'}; padding:16px; border-radius:4px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff; margin-bottom:12px;">4. OUTPUT & AUDITION</div>
              <div style="text-align:center; padding:16px; background:rgba(0,0,0,0.6); border-radius:4px;">
                ${convertedAudioUrl ? `
                  <audio controls src="${convertedAudioUrl}" autoplay style="width:100%; height:40px; margin-bottom:12px;"></audio>
                  <div style="display:flex; gap:8px; justify-content:center;">
                    <a href="${convertedAudioUrl}" download="cloned_voice_${Date.now()}.wav" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; text-decoration:none; padding:6px 14px;">💾 SAVE AUDIO</a>
                  </div>
                ` : `<div style="font-size:0.8rem; color:#666; font-family:'Share Tech Mono',monospace;">Awaiting pipeline execution...</div>`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: TRAIN -->
      <div id="tab-content-train" style="${activeTab === 'TRAIN' ? 'display:block;' : 'display:none;'}">
         <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:24px; border-radius:4px; max-width:700px; margin:0 auto;">
          <div style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#fff; margin-bottom:8px;">🚀 CLOUD MODEL TRAINER</div>
          <p style="font-size:0.75rem; color:#aaa; font-family:'Share Tech Mono',monospace; margin-bottom:16px; line-height:1.4;">
            Upload clean vocal audio samples (WAV/MP3) to train a dedicated RVC neural voice clone profile on the GPU node.
          </p>
          <div class="aim-field" style="margin-bottom:12px;">
            <label class="aim-label">NEW PROFILE IDENTIFIER</label>
            <input type="text" id="ipt-train-profile-name" class="aim-input" placeholder="e.g. OperativeVocal_v1" style="width:100%;" />
          </div>
          <div class="aim-field" style="margin-bottom:16px;">
            <label class="aim-label">TRAINING AUDIO SAMPLES</label>
            <input type="file" id="ipt-train-files" multiple accept="audio/*" class="aim-input" style="width:100%; padding:8px;" />
          </div>
          <button id="btn-start-training" class="aim-btn" style="width:100%; height:45px; background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66; font-family:'Orbitron',sans-serif; font-weight:bold;">
            🚀 INITIATE TRAINING MATRIX
          </button>
        </div>
      </div>
    `;

    setupEvents();
  }

  function setupEvents() {
    container.querySelector('#tab-btn-convert')?.addEventListener('click', () => { activeTab = 'CONVERT'; render(); });
    container.querySelector('#tab-btn-train')?.addEventListener('click', () => { activeTab = 'TRAIN'; render(); });
    container.querySelector('#btn-empty-goto-train')?.addEventListener('click', () => { activeTab = 'TRAIN'; render(); });

    container.querySelectorAll('.vc-profile-card').forEach(card => {
      card.addEventListener('click', () => {
        activeProfile = card.dataset.profile;
        playSFX('pop', 0.6);
        render();
      });
    });

    container.querySelector('#btn-mode-tts')?.addEventListener('click', () => { activeInputMode = 'TTS'; render(); });
    container.querySelector('#btn-mode-mic')?.addEventListener('click', () => { activeInputMode = 'MIC'; render(); });
    container.querySelector('#btn-mode-upload')?.addEventListener('click', () => { activeInputMode = 'UPLOAD'; render(); });

    const sliderPitch = container.querySelector('#slider-pitch');
    if (sliderPitch) {
      sliderPitch.addEventListener('input', (e) => {
        container.querySelector('#lbl-pitch-val').textContent = e.target.value;
      });
    }

    // Save recorded audio as new profile
    const btnSaveRec = container.querySelector('#btn-save-rec-profile');
    if (btnSaveRec) {
      btnSaveRec.addEventListener('click', () => {
        const nameInput = container.querySelector('#ipt-save-rec-name');
        const name = (nameInput?.value || '').trim();
        if (!name) {
          showToast('ENTER NAME', 'Please specify a profile name.');
          return;
        }
        saveVoiceProfile({
          name,
          label: name.toUpperCase(),
          desc: 'User Audio Recording',
          icon: '🎙️'
        });
        voiceProfiles = getSavedProfiles();
        activeProfile = name;
        playSFX('pop', 0.8);
        showToast('PROFILE SAVED', `Voice profile '${name}' registered.`);
        render();
      });
    }

    // Microphone setup
    const btnRecord = container.querySelector('#btn-record-toggle');
    if (btnRecord) {
      btnRecord.onclick = async () => {
        if (!isRecording) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = () => {
              recordedBlob = new Blob(audioChunks, { type: 'audio/wav' });
              stream.getTracks().forEach(track => track.stop());
              render();
            };
            mediaRecorder.start();
            isRecording = true;
            render();
          } catch (err) {
            showToast('MIC ERROR', 'Could not access microphone.');
          }
        } else {
          if (mediaRecorder) mediaRecorder.stop();
          isRecording = false;
        }
      };
    }

    const iptFile = container.querySelector('#ipt-audio-file');
    if (iptFile) {
      iptFile.onchange = (e) => {
        if (e.target.files.length > 0) { uploadedFile = e.target.files[0]; render(); }
      };
    }

    // Unified Execution Pipeline
    const btnExecute = container.querySelector('#btn-execute-pipeline');
    if (btnExecute) {
      btnExecute.onclick = async () => {
        if (!sessionStorage.getItem('generate_authenticated')) {
          triggerBypassOverloadSequence();
          return;
        }
        const statusBox = container.querySelector('#pipeline-status');
        const pitchShift = parseInt(container.querySelector('#slider-pitch')?.value || 0, 10);
        let sourceBlob = null;
        let textPrompt = '';

        if (!activeProfile && voiceProfiles.length === 0) {
          showToast('NO PROFILE', 'Please train or create a voice profile first.');
          return;
        }

        btnExecute.disabled = true;
        statusBox.style.display = 'block';

        try {
          if (activeInputMode === 'TTS') {
            textPrompt = container.querySelector('#ipt-tts-text')?.value.trim();
            if (!textPrompt) throw new Error("Please enter text.");
            
            statusBox.textContent = "🔄 STEP 1: GENERATING NEURAL BASE SPEECH...";
            const ttsRes = await fetch(`${MAIN_API_BASE}/api/voice/tts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: textPrompt, voice: 'en-US-ChristopherNeural' })
            });
            if (!ttsRes.ok) throw new Error("TTS generation failed");
            const ttsData = await ttsRes.json();
            const binary = atob(ttsData.audio_b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            sourceBlob = new Blob([bytes], { type: 'audio/mp3' });
          } else if (activeInputMode === 'MIC') {
            if (!recordedBlob) throw new Error("Please record audio first.");
            sourceBlob = recordedBlob;
          } else {
            if (!uploadedFile) throw new Error("Please select a file.");
            sourceBlob = uploadedFile;
          }

          statusBox.textContent = `🔄 STEP 2: CLONING TO ${activeProfile.toUpperCase()}...`;
          
          const reader = new FileReader();
          reader.readAsDataURL(sourceBlob);
          await new Promise(resolve => reader.onloadend = resolve);
          const b64 = reader.result.split(',')[1];

          const convertRes = await fetch(`${MAIN_API_BASE}/api/voice/convert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_name: activeProfile, audio_b64: b64, pitch_shift: pitchShift })
          });

          if (!convertRes.ok) throw new Error("Voice cloning failed on GPU.");
          
          const convertData = await convertRes.json();
          const outBinary = atob(convertData.audio_b64);
          const outBytes = new Uint8Array(outBinary.length);
          for (let i = 0; i < outBinary.length; i++) outBytes[i] = outBinary.charCodeAt(i);
          convertedAudioUrl = URL.createObjectURL(new Blob([outBytes], { type: 'audio/wav' }));
          
          playSFX('pop', 0.8);
          showToast('SUCCESS', 'Voice cloning complete!');

          logAction('MEDIA_GENERATION', {
            type: 'VOICE_CLONE',
            profile: activeProfile,
            mode: activeInputMode,
            prompt: activeInputMode === 'TTS' ? textPrompt : 'Audio Morphing'
          }, {
            category: 'MEDIA',
            level: 'INFO',
            message: activeInputMode === 'TTS' ? textPrompt : `Cloned voice using profile '${activeProfile}'`
          });

          render();

        } catch (err) {
          showToast('ERROR', err.message);
          statusBox.style.display = 'none';
          btnExecute.disabled = false;
        }
      };
    }

    // Training 
    const btnTrain = container.querySelector('#btn-start-training');
    if (btnTrain) {
      btnTrain.onclick = async () => {
        const name = container.querySelector('#ipt-train-profile-name').value.trim();
        if (!name) return showToast('ERROR', 'Enter profile name.');
        
        saveVoiceProfile({
          name,
          label: name.toUpperCase(),
          desc: 'Trained Voice Model',
          icon: '💾'
        });
        voiceProfiles = getSavedProfiles();
        activeProfile = name;

        playSFX('pop', 0.8);
        showToast('TRAINING INITIATED', 'Profile added. Check backend logs for GPU training progress.');
        fetch(`${MAIN_API_BASE}/api/voice/train?profile_name=${encodeURIComponent(name)}`, { method: 'POST' }).catch(() => {});
        activeTab = 'CONVERT';
        render();
      };
    }
  }

  // Load genuine backend custom profiles (if any) and merge with saved profiles
  try {
    const resPromise = fetch(`${MAIN_API_BASE}/api/voice/profiles`);
    if (resPromise && typeof resPromise.then === 'function') {
      resPromise.then(r => r && r.json ? r.json() : null).then(data => {
        if (!data) return;
        const customList = (data.custom_profiles || []).map(c => ({
          name: typeof c === 'string' ? c : c.name,
          label: (typeof c === 'string' ? c : (c.label || c.name)).toUpperCase(),
          desc: 'Cloud RVC Profile',
          icon: '☁️'
        }));
        const local = getSavedProfiles();
        const combined = [...local];
        customList.forEach(cp => {
          if (!combined.some(p => p.name === cp.name)) {
            combined.push(cp);
          }
        });
        voiceProfiles = combined;
        if (!activeProfile && voiceProfiles.length > 0) {
          activeProfile = voiceProfiles[0].name;
        }
        render();
      }).catch(() => {});
    }
  } catch (_) {}

  render();
  return container;
}