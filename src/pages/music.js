import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { apiUrl } from '../components/api.js';

export default function MusicPage() {
  const container = createElement('div', { class: 'music-page slide-up' });

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">MUSIC GENERATOR</h1>
      <p class="page-subtitle">ACE-STEP 1.5 AUDIO SYNTHESIS</p>
    </div>
    
    <div class="prompt-container" style="max-width: 800px; margin: 0 auto;">
      <div class="aim-row" style="margin-bottom: 24px;">
        <div class="aim-field" style="width: 100%;">
          <label class="aim-label">PROMPT (DESCRIBE GENRE, INSTRUMENTS, TEMPO)</label>
          <textarea id="music-prompt" class="aim-input" style="height: 100px; resize: vertical;" placeholder="e.g. A fast-paced cyberpunk synthwave track with heavy bass and retro drum machines..."></textarea>
        </div>
      </div>
      
      <div class="aim-row" style="margin-bottom: 24px; align-items: center;">
        <div class="aim-field" style="width: 150px;">
          <label class="aim-label">LENGTH (SECONDS)</label>
          <input type="number" id="music-length" class="aim-input" value="30" min="10" max="120" />
        </div>
        
        <button id="music-btn" class="aim-btn-generate" style="flex: 1; height: 50px; margin-top: 24px;">
          <span class="aim-btn-icon">🎵</span> GENERATE TRACK
        </button>
      </div>
      
      <div id="music-status" style="text-align: center; color: #4ade80; letter-spacing: 2px; font-size: 14px; margin-top: 20px; display: none;">
        SYNTHESIZING AUDIO...
      </div>
      
      <div id="music-result" style="margin-top: 30px; text-align: center;">
        <!-- Audio player will appear here -->
      </div>
    </div>
  `;

  const btn = container.querySelector('#music-btn');
  const promptIn = container.querySelector('#music-prompt');
  const lengthIn = container.querySelector('#music-length');
  const status = container.querySelector('#music-status');
  const result = container.querySelector('#music-result');

  btn.addEventListener('click', async () => {
    const prompt = promptIn.value.trim();
    if (!prompt) return showToast('ENTER A PROMPT FIRST', 'error');
    
    btn.disabled = true;
    status.style.display = 'block';
    result.innerHTML = '';
    status.textContent = 'INITIALIZING ACE-STEP 1.5...';

    try {
      const settings = JSON.parse(localStorage.getItem('alphacore_modal_settings') || '{}');
      const endpoint = settings.music_url || 'https://josh64perry--alphacore-aio-backend-alphacore-main-api.modal.run';
      
      status.textContent = 'SYNTHESIZING AUDIO...';
      
      const res = await fetch(`${endpoint}/api/music/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          length_seconds: parseInt(lengthIn.value, 10) || 30
        })
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      
      if (data.audio_b64) {
        result.innerHTML = `
          <div style="background: rgba(0,255,100,0.05); padding: 20px; border: 1px solid rgba(0,255,100,0.2); border-radius: 8px;">
            <p style="color: #fff; margin-bottom: 15px; font-size: 14px;">GENERATION COMPLETE</p>
            <audio controls style="width: 100%; outline: none;">
              <source src="data:audio/wav;base64,${data.audio_b64}" type="audio/wav">
              Your browser does not support the audio element.
            </audio>
            <a href="data:audio/wav;base64,${data.audio_b64}" download="alphacore_track_${Date.now()}.wav" style="display: inline-block; margin-top: 15px; color: #4ade80; text-decoration: none; border: 1px solid #4ade80; padding: 5px 15px; border-radius: 4px; font-size: 12px; transition: all 0.2s;">
              DOWNLOAD TRACK
            </a>
          </div>
        `;
      } else {
        throw new Error(data.error || 'No audio returned');
      }
    } catch (err) {
      console.error(err);
      showToast('GENERATION FAILED', 'error');
    } finally {
      btn.disabled = false;
      status.style.display = 'none';
    }
  });

  return container;
}
