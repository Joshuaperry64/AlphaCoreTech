/**
 * AlphaCore Unified Voice Cloning & TTS Pipeline
 * One-click pipeline: Text -> Neural Base -> RVC Voice Profile morph.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

export default function VoiceClonerPage() {
  const container = createElement('div', { class: 'voicecloner-page slide-up' });

  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim().toLowerCase();
  const currentPin = (sessionStorage.getItem('current_pin') || '').trim();
  const isArchitect = currentProfile === 'architect' || currentPin === '672167566';
  const defaultApiBase = isArchitect
    ? 'https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/architect'
    : 'https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/eco';

  const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
  const MAIN_API_BASE = isArchitect ? (settings.main_api_url || defaultApiBase) : defaultApiBase;

  let activeTab = 'CONVERT'; 
  let activeProfile = 'AlphaCore-EDEN11';
  let activeInputMode = 'TTS'; // Default to Text-to-Voice

  // State
  let mediaRecorder = null;
  let audioChunks = [];
  let recordedBlob = null;
  let isRecording = false;
  let micAnimId = null;
  let uploadedFile = null;
  let convertedAudioUrl = null;

  const PRESET_VOICES = [
    { name: 'AlphaCore-EDEN11', label: 'ALPHA EDEN-11', desc: 'Sentient cybernetic harmonics', icon: '🤖' },
    { name: 'Darkened-Luci', label: 'DARKENED LUCI', desc: 'Sultry dynamic presence', icon: '💋' },
    { name: 'Architect-Lead', label: 'ARCHITECT LEAD', desc: 'Deep baritone authority', icon: '◈' }
  ];
  let voiceProfiles = PRESET_VOICES;

  function render() {
    container.innerHTML = `
      <div class="page-header" style="margin-bottom: 20px;">
        <h1 class="page-title" style="font-family:'Orbitron',sans-serif; letter-spacing:2px;">RVC SYNTHESIS MATRIX</h1>
        <p class="page-subtitle" style="font-family:'Share Tech Mono',monospace; color:var(--accent,#06b6d4);">
          UNIFIED TEXT-TO-VOICE & VOICE-TO-VOICE PIPELINE
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
              <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff; margin-bottom:10px;">1. SELECT VOICE PROFILE</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="profile-cards-grid">
                ${voiceProfiles.map(p => `
                  <div class="vc-profile-card" data-profile="${p.name}" style="background:${activeProfile === p.name ? 'rgba(6,182,212,0.2)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${activeProfile === p.name ? 'var(--accent,#06b6d4)' : 'rgba(255,255,255,0.08)'}; padding:8px; border-radius:4px; cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:6px; font-family:'Orbitron',sans-serif; font-size:0.75rem; color:#fff;">
                      <span>${p.icon}</span>${p.label}
                    </div>
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
                <textarea id="ipt-tts-text" class="aim-input" style="width:100%; height:100px; resize:none;" placeholder="Type text here to be synthesized and cloned..."></textarea>
              </div>

              <div id="ui-mic" style="${activeInputMode === 'MIC' ? 'display:block;' : 'display:none; text-align:center;'}">
                <canvas id="mic-waveform-canvas" width="400" height="60" style="width:100%; height:60px; background:rgba(0,0,0,0.4); margin-bottom:10px;"></canvas>
                <button id="btn-record-toggle" class="aim-btn" style="width:100%; background:${isRecording ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.2)'}; border-color:${isRecording ? '#ef4444' : 'var(--accent,#06b6d4)'}; color:#fff;">
                  ${isRecording ? '⏹ STOP RECORDING' : '🔴 START RECORDING'}
                </button>
                <div id="lbl-mic-status" style="margin-top:8px; font-size:0.75rem; color:#00ff66;">${recordedBlob ? 'Audio captured and ready.' : ''}</div>
              </div>

              <div id="ui-upload" style="${activeInputMode === 'UPLOAD' ? 'display:block;' : 'display:none;'}">
                <input type="file" id="ipt-audio-file" accept="audio/*" class="aim-input" style="width:100%; padding:8px;" />
                <div id="lbl-upload-status" style="margin-top:8px; font-size:0.75rem; color:#00ff66;">${uploadedFile ? `Loaded: ${uploadedFile.name}` : ''}</div>
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
              
              <div id="pipeline-status" style="margin-top:12px; text-align:center; font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#00ff66; display:none;">
                🔄 PROCESSING PIPELINE...
              </div>
            </div>

            <div class="panel" style="background:rgba(4,7,12,0.95); border:1.5px solid ${convertedAudioUrl ? '#00ff66' : 'rgba(6,182,212,0.25)'}; padding:16px; border-radius:4px;">
              <div style="font-family:'Orbitron',sans-serif; font-size:0.9rem; color:#fff; margin-bottom:12px;">4. OUTPUT</div>
              <div style="text-align:center; padding:16px; background:rgba(0,0,0,0.6); border-radius:4px;">
                ${convertedAudioUrl ? `
                  <audio controls src="${convertedAudioUrl}" autoplay style="width:100%; height:40px; margin-bottom:12px;"></audio>
                  <a href="${convertedAudioUrl}" download="cloned_voice.wav" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66;">💾 SAVE AUDIO</a>
                ` : `<div style="font-size:0.8rem; color:#666; font-family:'Share Tech Mono',monospace;">Awaiting execution...</div>`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: TRAIN -->
      <div id="tab-content-train" style="${activeTab === 'TRAIN' ? 'display:block;' : 'display:none;'}">
         <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:24px; border-radius:4px;">
          <div style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#fff; margin-bottom:16px;">🚀 CLOUD MODEL TRAINER</div>
          <input type="text" id="ipt-train-profile-name" class="aim-input" placeholder="New Profile Name (e.g. JoshVocal_v1)" style="width:100%; margin-bottom:12px;" />
          <input type="file" id="ipt-train-files" multiple accept="audio/*" class="aim-input" style="width:100%; padding:8px; margin-bottom:16px;" />
          <button id="btn-start-training" class="aim-btn" style="width:100%; background:rgba(0,255,100,0.2); border-color:#00ff66; color:#00ff66;">🚀 START TRAINING</button>
        </div>
      </div>
    `;

    setupEvents();
  }

  function setupEvents() {
    container.querySelector('#tab-btn-convert')?.addEventListener('click', () => { activeTab = 'CONVERT'; render(); });
    container.querySelector('#tab-btn-train')?.addEventListener('click', () => { activeTab = 'TRAIN'; render(); });

    container.querySelectorAll('.vc-profile-card').forEach(card => {
      card.addEventListener('click', () => { activeProfile = card.dataset.profile; render(); });
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

    // Microphone setup
    const btnRecord = container.querySelector('#btn-record-toggle');
    if (btnRecord) {
      btnRecord.onclick = async () => {
        if (!isRecording) {
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
        } else {
          mediaRecorder.stop();
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
        const statusBox = container.querySelector('#pipeline-status');
        const pitchShift = parseInt(container.querySelector('#slider-pitch')?.value || 0, 10);
        let sourceBlob = null;

        btnExecute.disabled = true;
        statusBox.style.display = 'block';

        try {
          if (activeInputMode === 'TTS') {
            const text = container.querySelector('#ipt-tts-text')?.value.trim();
            if (!text) throw new Error("Please enter text.");
            
            statusBox.textContent = "🔄 STEP 1: GENERATING NEURAL BASE SPEECH...";
            const ttsRes = await fetch(`${MAIN_API_BASE}/api/voice/tts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, voice: 'en-US-ChristopherNeural' })
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
          
          showToast('SUCCESS', 'Voice cloning complete!');
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
        showToast('TRAINING INITIATED', 'Check backend logs for progress.');
        fetch(`${MAIN_API_BASE}/api/voice/train?profile_name=${encodeURIComponent(name)}`, { method: 'POST' });
      };
    }
  }

  // Load backend profiles
  fetch(`${MAIN_API_BASE}/api/voice/profiles`).then(r => r.json()).then(data => {
    if (data.presets) voiceProfiles = [...data.presets, ...(data.custom_profiles || []).map(c => ({ name: c, label: c.toUpperCase(), desc: 'Custom Profile', icon: '💾' }))];
    render();
  }).catch(() => {});

  render();
  return container;
}