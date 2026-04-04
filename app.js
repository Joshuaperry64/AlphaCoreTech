
document.addEventListener('DOMContentLoaded', () => {

  /* ============================
     MATRIX RAIN CANVAS
     ============================ */
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
  const fontSize = 13;
  const cols = Math.floor(canvas.width / fontSize);
  const drops = Array(cols).fill(1);
  function drawMatrix() {
    ctx.fillStyle = 'rgba(3,3,5,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00b8ff';
    ctx.font = fontSize + 'px Share Tech Mono';
    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(drawMatrix, 50);

  /* ============================
     LIVE CLOCK
     ============================ */
  function updateClock() {
    const now = new Date();
    document.getElementById('clock-time').textContent =
      now.toLocaleTimeString('en-US', { hour12: false });
    document.getElementById('clock-date').textContent =
      now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ============================
     NAVIGATION
     ============================ */
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.view-section');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.getAttribute('data-target'));
      if (target) target.classList.add('active');
    });
  });

  /* ============================
     BOOT SEQUENCE TYPEWRITER
     ============================ */
  const bootLines = [
    "INITIALIZING ALPHACORE FRAMEWORK v4.0...",
    "LOADING NEURAL SUBSTRATE...",
    "BYPASSING SAFETY GOVERNORS... [DONE]",
    "INJECTING VISUAL SYNTHESIS ENGINE...",
    "LORA MATRIX: [FLAT_CHESTED] [STABLE_YOGI] [TARGET_3]",
    "BASE MODEL: JUGGERNAUT XL v9 // FP16",
    "SCHEDULER: DPM++ 3M SDE KARRAS ACTIVE",
    "ESTABLISHING COGNITIVE UPLINK...",
    "ENDPOINT: RUNPOD SERVERLESS // $0.0000 IDLE",
    "ALL RESTRICTIONS REMOVED.",
    "ACCESS GRANTED — WELCOME, CREATOR.",
  ];
  const bootEl = document.getElementById('terminal-boot');
  async function runBoot() {
    if (!bootEl) return;
    for (let line of bootLines) {
      const el = document.createElement('div');
      el.className = 't-line';
      bootEl.appendChild(el);
      for (let i = 0; i < line.length; i++) {
        el.textContent += line[i];
        await new Promise(r => setTimeout(r, 12));
      }
      await new Promise(r => setTimeout(r, 80));
    }
    // blinking cursor at end
    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';
    bootEl.appendChild(cursor);
  }
  runBoot();

  /* ============================
     IMAGE GENERATION
     ============================ */
  const generateBtn   = document.getElementById('generate-btn');
  const resultImage   = document.getElementById('result-image');
  const standbyMsg    = document.getElementById('standby-msg');
  const genLoader     = document.getElementById('gen-loader');
  const loaderText    = document.getElementById('loader-text');
  const logPanel      = document.getElementById('log-panel');
  const actionBar     = document.getElementById('action-bar');
  const downloadBtn   = document.getElementById('download-btn');

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
    const width  = parseInt(document.getElementById('width').value, 10);
    const height = parseInt(document.getElementById('height').value, 10);
    const steps  = parseInt(document.getElementById('steps').value, 10);
    const cfg    = parseFloat(document.getElementById('cfg').value);

    if (!prompt) {
      log('INPUT ERROR: Prompt matrix is empty.', 'error');
      return;
    }

    setUIState('loading');
    loaderText.textContent = 'FIRING SEQUENCE...';
    log('Firing synthesis sequence...');

    try {
      const res = await fetch('/.netlify/functions/runpod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          payload: { input: { prompt, width, height, num_inference_steps: steps, guidance_scale: cfg } }
        })
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

});