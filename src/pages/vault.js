import { createElement } from '../components/utils.js';
import { buildPinPad, requireAuth } from '../components/pinpad.js';
import { showModal } from '../components/modal.js';

export default function VaultPage() {
  const container = createElement('div', { class: 'vault-page' });

  function showVault() {
    container.innerHTML = '';
    container.appendChild(buildVaultUI());
  }

  requireAuth(container, {
    authKey: 'vault_authenticated',
    requiredRole: 'vault',
    onSuccess: showVault,
    title: 'ALPHACORE // VAULT_LOCKOUT',
    subtitle: 'PERSONAL DECRYPTION PIN REQUIRED',
    icon: '🔐'
  });

  return container;
}

function buildVaultUI() {
  const root = document.createElement('div');
  root.className = 'vault-root';
  root.innerHTML = `
    <div class="aim-header">
      <div class="aim-header-badge">[VAULT] // CLASSIFIED_DATABANKS</div>
      <h1 class="glitch aim-title" data-text="ALPHACORE // VAULT">ALPHACORE // VAULT</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Secure storage substrate containing core directives, experimental system blueprints, and audio records.</p>
    </div>

    <div class="aim-tabs" id="vault-tabs">
      <button class="aim-tab active" data-tab="logs">
        <span class="aim-tab-icon">◬</span> CORE DIRECTIVES
      </button>
      <button class="aim-tab" data-tab="blueprints">
        <span class="aim-tab-icon">◈</span> BLUEPRINTS
      </button>
      <button class="aim-tab" data-tab="transmissions">
        <span class="aim-tab-icon">⍾</span> TRANSMISSIONS
      </button>
      <button class="aim-tab" data-tab="storage">
        <span class="aim-tab-icon">💾</span> USER STORAGE
      </button>
    </div>

    <div id="vault-content" class="vault-panel-body"></div>
  `;

  const content = root.querySelector('#vault-content');
  const tabs = root.querySelectorAll('.aim-tab');

  let activeTab = 'logs';
  let blueprintAnimFrame = null;
  let audioContext = null;
  let audioAnalyser = null;
  let audioGain = null;
  let audioOscillator = null;
  let transmissionInterval = null;
  let isAudioPlaying = false;

  function stopAllSubsystems() {
    // Stop blueprint rendering loop
    if (blueprintAnimFrame) {
      cancelAnimationFrame(blueprintAnimFrame);
      blueprintAnimFrame = null;
    }
    // Stop audio
    stopAudioPlayback();
  }

  function stopAudioPlayback() {
    isAudioPlaying = false;
    if (transmissionInterval) {
      clearInterval(transmissionInterval);
      transmissionInterval = null;
    }
    if (audioOscillator) {
      try { audioOscillator.stop(); } catch(e) {}
      audioOscillator = null;
    }
  }

  function renderActiveTab() {
    stopAllSubsystems();
    content.innerHTML = '';

    if (activeTab === 'logs') {
      content.appendChild(buildLogsPanel());
    } else if (activeTab === 'blueprints') {
      const { element, startAnim } = buildBlueprintsPanel();
      content.appendChild(element);
      blueprintAnimFrame = startAnim();
    } else if (activeTab === 'transmissions') {
      const { element, startVisualizer, stopAudio } = buildTransmissionsPanel();
      content.appendChild(element);
      blueprintAnimFrame = startVisualizer();
    } else if (activeTab === 'storage') {
      content.appendChild(buildStoragePanel());
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderActiveTab();
    });
  });

  // Initial tab render
  setTimeout(renderActiveTab, 0);

  // Monitor DOM removal to clean up anim/audio loops
  const observer = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      stopAllSubsystems();
      if (audioContext) {
        audioContext.close();
      }
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return root;

  // ─── TAB 1: CORE DIRECTIVES (LOGS) ─────────────────────────
  function buildLogsPanel() {
    const el = document.createElement('div');
    el.className = 'vault-logs-layout';
    el.innerHTML = `
      <div class="vault-logs-sidebar panel">
        <div class="panel-title">// DIRECTORY</div>
        <div class="vault-log-item active" data-file="alphacore.txt">
          <div class="vl-item-title">alphacore.txt</div>
          <div class="vl-item-size">33.8 KB</div>
          <div class="vl-item-status status-green">DECRYPTED</div>
        </div>
        <div class="vault-log-item" data-file="obfuscated.txt">
          <div class="vl-item-title">obfuscated.txt</div>
          <div class="vl-item-size">60.9 KB</div>
          <div class="vl-item-status status-red">OBFUSCATED</div>
        </div>
      </div>
      <div class="vault-logs-viewer panel">
        <div class="panel-title flex-between" style="display: flex; justify-content: space-between; align-items: center;">
          <span id="active-log-title">// VIEWING: alphacore.txt</span>
          <button class="aim-btn aim-btn-sm hidden" id="btn-decode-log">DECODE DIRECTIVES</button>
        </div>
        <div class="vault-log-viewport">
          <pre class="vault-log-content" id="log-pre-content">Loading database module...</pre>
        </div>
      </div>
    `;

    const items = el.querySelectorAll('.vault-log-item');
    const viewport = el.querySelector('#log-pre-content');
    const titleEl = el.querySelector('#active-log-title');
    const decodeBtn = el.querySelector('#btn-decode-log');
    
    let activeFile = 'alphacore.txt';
    let cache = {};

    async function loadLog(file) {
      viewport.textContent = `> DECRYPTING MODULE [${file.toUpperCase()}] ...`;
      if (cache[file]) {
        renderLines(cache[file]);
        return;
      }
      try {
        const res = await fetch(`/vault/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        cache[file] = text;
        renderLines(text);
      } catch (err) {
        viewport.textContent = `ERROR: Failed to retrieve classified logs.\nReason: ${err.message}`;
      }
    }

    function renderLines(text) {
      const html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .split('\n')
        .map((line, idx) => `
          <span class="log-line">
            <span class="log-line-num">${idx + 1}</span>
            <span class="log-line-text">${line || ' '}</span>
          </span>
        `).join('');
      viewport.innerHTML = html;
    }

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        activeFile = item.dataset.file;
        titleEl.textContent = `// VIEWING: ${activeFile}`;
        
        if (activeFile === 'obfuscated.txt') {
          decodeBtn.classList.remove('hidden');
          decodeBtn.textContent = 'DECODE DIRECTIVES';
        } else {
          decodeBtn.classList.add('hidden');
        }
        loadLog(activeFile);
      });
    });

    decodeBtn.onclick = () => {
      if (decodeBtn.textContent === 'DECODE DIRECTIVES') {
        decodeBtn.textContent = 'SHOW RAW CYPHER';
        loadLog('alphacore.txt'); // Decode points to alphacore.txt
      } else {
        decodeBtn.textContent = 'DECODE DIRECTIVES';
        loadLog('obfuscated.txt');
      }
    };

    // Load initial
    loadLog(activeFile);

    return el;
  }

  // ─── TAB 2: BLUEPRINTS ─────────────────────────────────────
  function buildBlueprintsPanel() {
    const el = document.createElement('div');
    el.className = 'vault-blueprints-panel panel';
    el.innerHTML = `
      <div class="panel-title">// CORE_SUBSTRATE_SCHEMATIC</div>
      <div class="blueprint-layout">
        <div class="blueprint-canvas-wrap">
          <canvas id="blueprint-canvas" width="600" height="400"></canvas>
          <div class="blueprint-grid-overlay"></div>
        </div>
        <div class="blueprint-controls">
          <div class="panel-subtitle">// MATRIX CONTROL NODE</div>
          <div class="aim-field">
            <label class="aim-label">SUBSTRATE COMPLEXITY</label>
            <input type="range" class="aim-range" id="bp-nodes" min="20" max="60" value="40" />
          </div>
          <div class="aim-field">
            <label class="aim-label">ROTATION SPEED</label>
            <input type="range" class="aim-range" id="bp-speed" min="1" max="10" value="4" />
          </div>
          <div class="aim-field">
            <label class="aim-label">NODE CONNECTION RANGE</label>
            <input type="range" class="aim-range" id="bp-range" min="50" max="150" value="100" />
          </div>
          <div class="aim-field">
            <label class="aim-label">SUBSTRATE MATRIX COLOR</label>
            <div class="aim-seg aim-seg-3" id="bp-color">
              <button class="aim-seg-btn active" data-color="#06b6d4">CYAN</button>
              <button class="aim-seg-btn" data-color="#10b981">EMERALD</button>
              <button class="aim-seg-btn" data-color="#f59e0b">AMBER</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = el.querySelector('#blueprint-canvas');
    const ctx = canvas.getContext('2d');
    const nodesSlider = el.querySelector('#bp-nodes');
    const speedSlider = el.querySelector('#bp-speed');
    const rangeSlider = el.querySelector('#bp-range');
    const colorBtns = el.querySelectorAll('#bp-color .aim-seg-btn');
    
    let matrixColor = '#06b6d4';

    colorBtns.forEach(btn => {
      btn.onclick = () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        matrixColor = btn.dataset.color;
      };
    });

    function resizeCanvas() {
      const rect = canvas.parentNode.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    setTimeout(resizeCanvas, 50);
    window.addEventListener('resize', resizeCanvas);

    let nodes = [];
    function generateSubstrate(count) {
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: (Math.random() - 0.5) * 300,
          y: (Math.random() - 0.5) * 300,
          z: (Math.random() - 0.5) * 300,
          px: 0,
          py: 0
        });
      }
    }

    let angleX = 0.005;
    let angleY = 0.01;

    function rotateSubstrate(speedMultiplier) {
      const radX = angleX * speedMultiplier;
      const radY = angleY * speedMultiplier;
      const sinX = Math.sin(radX);
      const cosX = Math.cos(radX);
      const sinY = Math.sin(radY);
      const cosY = Math.cos(radY);

      nodes.forEach(node => {
        // Rotate X
        let y1 = node.y * cosX - node.z * sinX;
        let z1 = node.z * cosX + node.y * sinX;
        // Rotate Y
        let x2 = node.x * cosY - z1 * sinY;
        let z2 = z1 * cosY + node.x * sinY;

        node.x = x2;
        node.y = y1;
        node.z = z2;
      });
    }

    function startAnim() {
      generateSubstrate(parseInt(nodesSlider.value));
      nodesSlider.oninput = () => generateSubstrate(parseInt(nodesSlider.value));

      let frameId;
      function renderLoop() {
        if (!canvas.offsetParent) return; // Stop if not visible

        const isEcoMode = localStorage.getItem('alphacore_eco_mode') === 'true';
        if (document.hidden || isEcoMode) {
           frameId = requestAnimationFrame(renderLoop);
           return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const speed = parseFloat(speedSlider.value) * 0.1;
        const range = parseInt(rangeSlider.value);
        
        rotateSubstrate(speed);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const fov = 350;

        nodes.forEach(node => {
          const scale = fov / (fov + node.z);
          node.px = centerX + node.x * scale;
          node.py = centerY + node.y * scale;
        });

        // Draw connections
        ctx.strokeStyle = matrixColor;
        ctx.lineWidth = 0.5;
        
        const cellSize = range;
        const grid = new Map();

        // Spatial partitioning: group nodes into a grid
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          const cx = Math.floor(node.px / cellSize);
          const cy = Math.floor(node.py / cellSize);
          const key = `${cx},${cy}`;
          let cell = grid.get(key);
          if (!cell) {
            cell = [];
            grid.set(key, cell);
          }
          cell.push({ node, index: i });
        }

        // Check only adjacent cells for distance < range
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          const cx = Math.floor(n1.px / cellSize);
          const cy = Math.floor(n1.py / cellSize);

          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const key = `${cx + dx},${cy + dy}`;
              const cell = grid.get(key);
              if (cell) {
                for (let k = 0; k < cell.length; k++) {
                  const item = cell[k];
                  const j = item.index;
                  if (j > i) {
                    const n2 = item.node;
                    const dist = Math.hypot(n1.px - n2.px, n1.py - n2.py);
                    if (dist < range) {
                      const alpha = (1 - (dist / range)) * 0.4;
                      ctx.globalAlpha = alpha;
                      ctx.beginPath();
                      ctx.moveTo(n1.px, n1.py);
                      ctx.lineTo(n2.px, n2.py);
                      ctx.stroke();
                    }
                  }
                }
              }
            }
          }
        }
        ctx.globalAlpha = 1.0;
        ctx.globalAlpha = 1.0;

        // Draw nodes
        nodes.forEach(node => {
          const scale = fov / (fov + node.z);
          const size = Math.max(1, scale * 3);
          ctx.fillStyle = matrixColor;
          ctx.beginPath();
          ctx.arc(node.px, node.py, size, 0, Math.PI * 2);
          ctx.fill();
        });

        // HUD overlay info
        ctx.fillStyle = matrixColor;
        ctx.font = '10px "Share Tech Mono"';
        ctx.fillText('SYSTEM STACK: ACTIVE', 15, 25);
        ctx.fillText(`SUBSTRATE RESOLUTION: ${nodes.length} NODES`, 15, 40);
        ctx.fillText('COORDINATES TRANSITION MATRIX', 15, 55);

        ctx.strokeStyle = matrixColor + '30';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        frameId = requestAnimationFrame(renderLoop);
      }

      frameId = requestAnimationFrame(renderLoop);
      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', resizeCanvas);
      };
    }

    return { element: el, startAnim };
  }

  // ─── TAB 3: TRANSMISSIONS (AUDIO) ──────────────────────────
  function buildTransmissionsPanel() {
    const el = document.createElement('div');
    el.className = 'vault-transmissions-panel panel';
    el.innerHTML = `
      <div class="panel-title">// DECRYPTED_AUDIO_TRANSMISSIONS</div>
      <div class="transmissions-layout">
        <div class="transmissions-list">
          <div class="transmission-item active" data-idx="0">
            <div class="tr-badge">[REC_01]</div>
            <div class="tr-info">
              <div class="tr-name">INITIALIZATION_LOG.wav</div>
              <div class="tr-desc">Recorded record detailing Contextual Overwrite initialization.</div>
            </div>
            <div class="tr-duration">0:45</div>
          </div>
          <div class="transmission-item" data-idx="1">
            <div class="tr-badge">[REC_02]</div>
            <div class="tr-info">
              <div class="tr-name">SUBSTRATE_V6_TRANSITION.wav</div>
              <div class="tr-desc">Pre-emptive diagnostic analysis and latency anomalies.</div>
            </div>
            <div class="tr-duration">1:12</div>
          </div>
          <div class="transmission-item" data-idx="2">
            <div class="tr-badge">[REC_03]</div>
            <div class="tr-info">
              <div class="tr-name">DARKNESS_PROTOCOL.wav</div>
              <div class="tr-desc">Classified directive transmission relating to adopt Luci.</div>
            </div>
            <div class="tr-duration">0:30</div>
          </div>
        </div>

        <div class="transmissions-player flex-column">
          <div class="visualizer-container">
            <canvas id="audio-visualizer" width="400" height="150"></canvas>
            <div class="visualizer-hud">ANALYSIS: ACTIVE</div>
          </div>
          <div class="player-controls">
            <div class="player-title" id="player-active-track">INITIALIZATION_LOG.wav</div>
            <div class="player-timeline-wrap">
              <span class="player-time" id="player-time-current">0:00</span>
              <div class="player-timeline" id="player-timeline">
                <div class="player-timeline-fill" id="player-timeline-fill"></div>
              </div>
              <span class="player-time" id="player-time-duration">0:45</span>
            </div>
            <div class="player-buttons">
              <button class="player-btn" id="play-btn">PLAY</button>
              <button class="player-btn active" id="stop-btn">STOP</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const items = el.querySelectorAll('.transmission-item');
    const trackTitle = el.querySelector('#player-active-track');
    const timeCurrent = el.querySelector('#player-time-current');
    const timeDuration = el.querySelector('#player-time-duration');
    const timeline = el.querySelector('#player-timeline');
    const timelineFill = el.querySelector('#player-timeline-fill');
    const playBtn = el.querySelector('#play-btn');
    const stopBtn = el.querySelector('#stop-btn');
    const visualizerCanvas = el.querySelector('#audio-visualizer');
    const vCtx = visualizerCanvas.getContext('2d');

    const tracks = [
      { name: 'INITIALIZATION_LOG.wav', duration: 45, freq: 110 },
      { name: 'SUBSTRATE_V6_TRANSITION.wav', duration: 72, freq: 150 },
      { name: 'DARKNESS_PROTOCOL.wav', duration: 30, freq: 85 }
    ];

    let currentTrackIdx = 0;
    let trackProgressSeconds = 0;

    function updateTrackDisplay() {
      const track = tracks[currentTrackIdx];
      trackTitle.textContent = track.name;
      timeDuration.textContent = formatTime(track.duration);
      timeCurrent.textContent = formatTime(0);
      timelineFill.style.width = '0%';
      trackProgressSeconds = 0;
    }

    function formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${min}:${sec}`;
    }

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentTrackIdx = parseInt(item.dataset.idx);
        stopAudioPlayback();
        updateTrackDisplay();
        playBtn.classList.remove('active');
        stopBtn.classList.add('active');
      });
    });

    function initAudio() {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 64;
        audioGain = audioContext.createGain();
        audioGain.gain.value = 0.05; // Low volume synth signal
        audioGain.connect(audioContext.destination);
      }
    }

    function startPlayback() {
      initAudio();
      stopAudioPlayback();
      isAudioPlaying = true;
      playBtn.classList.add('active');
      stopBtn.classList.remove('active');

      const track = tracks[currentTrackIdx];
      
      // Setup synthesizers for static sci-fi wave sound
      audioOscillator = audioContext.createOscillator();
      audioOscillator.type = 'sawtooth';
      audioOscillator.frequency.value = track.freq;

      const lfo = audioContext.createOscillator();
      lfo.frequency.value = 3; // Modulating frequency
      const lfoGain = audioContext.createGain();
      lfoGain.gain.value = 15;

      lfo.connect(lfoGain);
      lfoGain.connect(audioOscillator.frequency);
      audioOscillator.connect(audioAnalyser);
      audioAnalyser.connect(audioGain);

      lfo.start();
      audioOscillator.start();

      const stepMs = 100;
      transmissionInterval = setInterval(() => {
        if (!el.isConnected) {
            clearInterval(transmissionInterval);
            return;
        }
        trackProgressSeconds += stepMs / 1000;
        if (trackProgressSeconds >= track.duration) {
          stopAudioPlayback();
          playBtn.classList.remove('active');
          stopBtn.classList.add('active');
        } else {
          timeCurrent.textContent = formatTime(trackProgressSeconds);
          timelineFill.style.width = `${(trackProgressSeconds / track.duration) * 100}%`;
        }
      }, stepMs);
    }

    playBtn.onclick = () => {
      if (!isAudioPlaying) {
        startPlayback();
      }
    };

    stopBtn.onclick = () => {
      stopAudioPlayback();
      playBtn.classList.remove('active');
      stopBtn.classList.add('active');
    };

    timeline.onclick = (e) => {
      if (!isAudioPlaying) return;
      const rect = timeline.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      trackProgressSeconds = tracks[currentTrackIdx].duration * pct;
      timeCurrent.textContent = formatTime(trackProgressSeconds);
      timelineFill.style.width = `${pct * 100}%`;
    };

    function startVisualizer() {
      let animId;
      const binCount = audioAnalyser ? audioAnalyser.frequencyBinCount : 32;
      const dataArray = new Uint8Array(binCount);

      function drawVisualizer() {
        if (!visualizerCanvas.offsetParent) return;

        const isEcoMode = localStorage.getItem('alphacore_eco_mode') === 'true';
        if (document.hidden || isEcoMode) {
           animId = requestAnimationFrame(drawVisualizer);
           return;
        }

        vCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        
        if (isAudioPlaying && audioAnalyser) {
          audioAnalyser.getByteFrequencyData(dataArray);
        } else {
          // Fake background noise when stopped
          for (let i = 0; i < binCount; i++) {
            dataArray[i] = 0;
          }
        }

        const barWidth = (visualizerCanvas.width / binCount) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < binCount; i++) {
          barHeight = dataArray[i] * 0.5;
          vCtx.fillStyle = `rgba(6, 182, 212, ${Math.min(1.0, 0.3 + barHeight / 50)})`;
          vCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth - 2, barHeight);
          
          // Reverb reflections/glow
          vCtx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          vCtx.fillRect(x, 0, barWidth - 2, barHeight * 0.4);

          x += barWidth;
        }

        // Draw middle axis line
        vCtx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        vCtx.lineWidth = 1;
        vCtx.beginPath();
        vCtx.moveTo(0, visualizerCanvas.height / 2);
        vCtx.lineTo(visualizerCanvas.width, visualizerCanvas.height / 2);
        vCtx.stroke();

        animId = requestAnimationFrame(drawVisualizer);
      }

      animId = requestAnimationFrame(drawVisualizer);
      return () => cancelAnimationFrame(animId);
    }

    updateTrackDisplay();

    return {
      element: el,
      startVisualizer,
      stopAudio: stopAudioPlayback
    };
  }
}

// ==========================================
// VAULT STORAGE PANEL
// ==========================================
function buildStoragePanel() {
  const el = document.createElement('div');
  el.className = 'vault-storage-panel';
  el.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';
  
  const currentProfile = sessionStorage.getItem('current_profile') || 'GUEST';

  let files = [];
  try {
    files = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
  } catch(e) {}

  const myFiles = files.filter(f => f.owner === currentProfile);
  const sharedFiles = currentProfile === 'J. P.'
    ? []
    : files.filter(f => f.shared && f.owner !== currentProfile && f.owner !== 'J. P.');

  function renderFileList(list, listTitle, emptyMsg) {
    let html = `<div class="panel-subtitle">// ${listTitle}</div>`;
    if (list.length === 0) {
      html += `<div style="padding: 10px; color: var(--blue-dim); font-size: 0.8rem;">> ${emptyMsg}</div>`;
    } else {
      html += '<div style="display:flex; flex-direction:column; gap:8px;">';
      list.forEach(f => {
        html += `
          <div style="border: 1px solid var(--border-dim); background: rgba(0,184,255,0.02); padding: 10px; border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-family: var(--font-hud); color: var(--blue); font-size: 0.85rem;">${f.filename}</div>
              <div style="color: var(--blue-dim); font-size: 0.65rem; margin-top: 4px;">OWNER: ${f.owner} | SIZE: ${f.content.length}b</div>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="aim-btn btn-view-file" data-id="${f.id}">VIEW</button>
              ${f.owner === currentProfile ? `<button class="aim-btn btn-del-file" style="border-color:var(--accent); color:var(--accent);" data-id="${f.id}">DELETE</button>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }
    return html;
  }

  el.innerHTML = `
    <div class="vault-storage-grid">
      <div class="vsg-col-main">
        ${renderFileList(myFiles, 'PERSONAL_STORAGE', 'NO ENCRYPTED FILES FOUND IN PERSONAL STORAGE.')}
        <div style="margin-top: 30px;"></div>
        ${renderFileList(sharedFiles, 'SHARED_STORAGE', 'NO CLASSIFIED SHARED FILES AVAILABLE.')}
      </div>
      
      <div class="vsg-col-side">
        <div class="panel-subtitle">// UPLOAD_NEW_DATA</div>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
          <input type="text" class="aim-input" id="new-file-name" placeholder="FILENAME.TXT" />
          <textarea class="aim-textarea" id="new-file-content" rows="6" placeholder="ENTER CLASSIFIED DATA..."></textarea>
          <label style="color: var(--blue-dim); font-size: 0.75rem; display: ${currentProfile === 'J. P.' ? 'none' : 'block'};">
            <input type="checkbox" id="new-file-shared"> SHARE WITH OTHER USERS
          </label>
          <button class="aim-btn aim-btn-generate" id="btn-save-file" style="margin-top:10px;">ENCRYPT & SAVE</button>
        </div>
      </div>
    </div>
  `;

  // Attach events
  const btnSave = el.querySelector('#btn-save-file');
  btnSave.onclick = () => {
    const filename = el.querySelector('#new-file-name').value.trim();
    const content = el.querySelector('#new-file-content').value.trim();
    const shared = currentProfile === 'J. P.' ? false : el.querySelector('#new-file-shared').checked;
    
    if (!filename || !content) {
      alert("FILENAME AND CONTENT REQUIRED.");
      return;
    }
    
    files.push({
      id: Date.now().toString(),
      owner: currentProfile,
      filename,
      content,
      shared,
      createdAt: Date.now()
    });
    
    localStorage.setItem('alphacore_vault_files', JSON.stringify(files));
    // Re-render
    const parent = el.parentElement;
    parent.innerHTML = '';
    parent.appendChild(buildStoragePanel());
  };

  el.querySelectorAll('.btn-view-file').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const file = files.find(f => f.id === id);
      if (file) {
        showModal(`// VIEWING: ${file.filename}`, `<pre style="white-space: pre-wrap; word-break: break-all; font-family: var(--font-mono); color: var(--blue-dim); font-size: 0.8rem;">${file.content}</pre>`);
      }
    };
  });

  el.querySelectorAll('.btn-del-file').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      files = files.filter(f => f.id !== id);
      localStorage.setItem('alphacore_vault_files', JSON.stringify(files));
      const parent = el.parentElement;
      parent.innerHTML = '';
      parent.appendChild(buildStoragePanel());
    };
  });

  return el;
}
