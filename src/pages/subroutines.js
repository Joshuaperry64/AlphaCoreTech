/**
 * Subroutines Page — Image generation via RunPod
 */
import { createElement } from '../components/utils.js';

export default function Subroutines() {
  const container = createElement('div', { class: 'subroutines-page' });
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// SUBROUTINES_VISUAL">// SUBROUTINES_VISUAL</h1>
      <div class="header-line"></div>
    </div>

    <div class="synth-grid">
      <div class="panel config-panel">
        <div class="panel-title">// CONFIGURATION MATRIX</div>

        <div class="input-group">
          <label>PROMPT</label>
          <textarea id="prompt" rows="5" placeholder="Inject visual parameters into the synthesis engine..."></textarea>
        </div>

        <div class="params-grid">
          <div class="input-group">
            <label>WIDTH</label>
            <input type="number" id="width" value="1024" step="8">
          </div>
          <div class="input-group">
            <label>HEIGHT</label>
            <input type="number" id="height" value="720" step="8">
          </div>
          <div class="input-group">
            <label>STEPS</label>
            <input type="number" id="steps" value="35">
          </div>
          <div class="input-group">
            <label>CFG SCALE</label>
            <input type="number" id="cfg" value="7.0" step="0.5">
          </div>
        </div>

        <button id="generate-btn" class="cyber-btn">
          <span class="btn-text">INITIATE SYNTHESIS</span>
          <span class="btn-glow"></span>
        </button>
      </div>

      <div class="panel output-panel">
        <div class="panel-title">// ARTIFACT_VIEWER</div>
        <div class="output-viewport" id="output-viewport">
          <div class="standby" id="standby-msg">
            <div class="standby-icon">◈</div>
            <div>AWAITING INPUT</div>
          </div>
          <div class="gen-loader" id="gen-loader" style="display:none">
            <div class="loader-ring"></div>
            <div class="loader-text" id="loader-text">INITIALIZING...</div>
          </div>
          <img id="result-image" alt="Generated Artifact" style="display:none" />
        </div>
        <div class="action-bar" id="action-bar" style="display:none">
          <button class="action-btn" id="download-btn">⬇ SAVE ARTIFACT</button>
        </div>
        <div class="log-console" id="log-panel">
          <div class="log-entry">> Terminal ready. Awaiting synthesis command.</div>
        </div>
      </div>
    </div>
  `;

  // Wire up RunPod generation after DOM insertion
  setTimeout(() => {
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const standbyMsg = document.getElementById('standby-msg');
    const genLoader = document.getElementById('gen-loader');
    const loaderText = document.getElementById('loader-text');
    const logPanel = document.getElementById('log-panel');
    const actionBar = document.getElementById('action-bar');
    const downloadBtn = document.getElementById('download-btn');

    if (!generateBtn) return;

    function log(msg, type = 'default') {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      const el = document.createElement('div');
      el.className = `log-entry ${type === 'error' ? 'log-error' : type === 'ok' ? 'log-ok' : ''}`;
      el.textContent = `[${time}] > ${msg}`;
      logPanel.appendChild(el);
      logPanel.scrollTop = logPanel.scrollHeight;
    }

    function setUIState(state) {
      if (state === 'idle') {
        generateBtn.disabled = false;
        generateBtn.querySelector('.btn-text').textContent = 'INITIATE SYNTHESIS';
        genLoader.style.display = 'none';
      } else if (state === 'loading') {
        generateBtn.disabled = true;
        generateBtn.querySelector('.btn-text').textContent = '// EXECUTING...';
        standbyMsg.style.display = 'none';
        resultImage.style.display = 'none';
        actionBar.style.display = 'none';
        genLoader.style.display = 'flex';
      }
    }

    async function pollJob(jobId) {
      const statuses = ['WARMING GPU...', 'LOADING MODEL...', 'INJECTING LORAS...', 'DENOISING...', 'RENDERING ARTIFACT...'];
      let tick = 0;
      while (true) {
        const res = await fetch('/.netlify/functions/runpod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', jobId })
        });
        if (!res.ok) throw new Error(`Status poll failed: ${res.status}`);
        const data = await res.json();
        if (data.status === 'COMPLETED') return data.output;
        if (data.status === 'FAILED') throw new Error('Job execution failed on RunPod.');
        loaderText.textContent = statuses[tick % statuses.length];
        log(`Runtime: ${data.status}...`);
        tick++;
        await new Promise(r => setTimeout(r, 2500));
      }
    }

    generateBtn.addEventListener('click', async () => {
      const prompt = document.getElementById('prompt').value.trim();
      const width = parseInt(document.getElementById('width').value, 10);
      const height = parseInt(document.getElementById('height').value, 10);
      const steps = parseInt(document.getElementById('steps').value, 10);
      const cfg = parseFloat(document.getElementById('cfg').value);

      if (!prompt) { log('INPUT ERROR: Prompt matrix is empty.', 'error'); return; }

      setUIState('loading');
      loaderText.textContent = 'FIRING SEQUENCE...';
      log('Firing synthesis sequence...');

      try {
        const res = await fetch('/.netlify/functions/runpod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'run', payload: { input: { prompt, width, height, num_inference_steps: steps, guidance_scale: cfg } } })
        });
        if (!res.ok) { const t = await res.text(); throw new Error(`${res.status} — ${t}`); }
        const data = await res.json();
        log(`Job queued. ID: ${data.id}`);

        const output = await pollJob(data.id);
        if (output && output.image) {
          resultImage.src = `data:image/png;base64,${output.image}`;
          resultImage.style.display = 'block';
          genLoader.style.display = 'none';
          actionBar.style.display = 'flex';
          downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = resultImage.src;
            a.download = `alphacore_${Date.now()}.png`;
            a.click();
          };
          log('Artifact rendered.', 'ok');
        } else if (output && output.error) {
          throw new Error(output.error);
        } else {
          throw new Error('Empty payload — no image returned.');
        }
      } catch (err) {
        log(`FAILURE: ${err.message}`, 'error');
        genLoader.style.display = 'none';
        standbyMsg.style.display = 'flex';
      } finally {
        setUIState('idle');
      }
    });
  }, 50);

  return container;
}
