import { createElement, escapeHTML } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { playSFX } from '../components/audio.js';
import { buildPinPad, requireAuth } from '../components/pinpad.js';
import { showModal } from '../components/modal.js';
import { supabase } from '../lib/supabase.js';

export default function VaultPage() {
  const container = createElement('div', { class: 'vault-page' });

  function showVault() {
    container.innerHTML = '';
    container.appendChild(buildVaultUI());
  }

  requireAuth(container, {
    authKey: 'vault_authenticated',
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
      <button class="aim-tab" data-tab="links">
        <span class="aim-tab-icon">🔗</span> CLASSIFIED LINKS
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
    } else if (activeTab === 'links') {
      content.appendChild(buildLinksPanel());
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
        audioGain.gain.value = 0.025; // Low volume synth signal
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

  const getPublicUrl = (path) => {
    if (!path) return '';
    const { data } = supabase.storage.from('vault_data').getPublicUrl(path);
    return data.publicUrl;
  };

  async function loadFiles() {
    el.innerHTML = '<div style="color: var(--blue); font-family: var(--font-hud); padding: 20px;">> SYNCING DATABANKS...</div>';
    let cloudFiles = [];
    try {
      if (supabase && supabase.from) {
        const { data, error } = await supabase.from('vault_files').select('*').order('created_at', { ascending: false });
        if (!error && data) cloudFiles = data;
      }
    } catch(err) {
      console.warn('[Vault] Cloud substrate notice:', err.message);
    }

    let localFiles = [];
    try {
      localFiles = JSON.parse(localStorage.getItem('alphacore_vault_files') || '[]');
    } catch {}

    const seen = new Set();
    const merged = [];
    [...cloudFiles, ...localFiles].forEach(f => {
      const key = f.id || f.filename;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(f);
      }
    });

    files = merged;
    renderUI();
  }

  function renderUI() {
    const curUpper = currentProfile.toUpperCase();
    const myFiles = files.filter(f => (f.owner || '').toUpperCase() === curUpper);
    const sharedFiles = files.filter(f => f.shared && (f.owner || '').toUpperCase() !== curUpper);

    function renderFileList(list, listTitle, emptyMsg) {
      let html = `<div class="panel-subtitle">// ${listTitle}</div>`;
      if (list.length === 0) {
        html += `<div style="padding: 10px; color: var(--blue-dim); font-size: 0.8rem;">> ${emptyMsg}</div>`;
      } else {
        html += '<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:12px;">';
        list.forEach(f => {
          const isImage = f.type && f.type.startsWith('image/');
          const isVideo = f.type && f.type.startsWith('video/');
          const url = (f.storage_path ? getPublicUrl(f.storage_path) : null) || f.dataUrl || '';
          
          let previewBlock = `<div style="display:flex; justify-content:center; align-items:center; width:100%; height:100%; font-size:3rem; color:var(--blue-dim);">📄</div>`;
          if (isImage && url) {
            previewBlock = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;" />`;
          } else if (isVideo && url) {
            previewBlock = `<video src="${url}" style="width:100%; height:100%; object-fit:cover;" controls loop playsinline></video>`;
          }

          html += `
            <div style="border: 1px solid var(--border-dim); background: rgba(0,184,255,0.02); border-radius: var(--radius); display: flex; flex-direction: column; overflow: hidden;">
              <div style="height:140px; background:rgba(0,0,0,0.5); border-bottom:1px solid var(--border-dim); position:relative;">
                ${previewBlock}
              </div>
              <div style="padding:10px; display:flex; flex-direction:column; justify-content:space-between; flex-grow:1;">
                <div>
                  <div style="font-family: var(--font-hud); color: var(--blue); font-size: 0.85rem; word-break: break-all; margin-bottom:4px; line-height:1.2;">${f.filename}</div>
                  <div style="color: var(--blue-dim); font-size: 0.65rem;">OWNER: ${f.owner}</div>
                </div>
                <div style="display:flex; gap:6px; margin-top:10px;">
                  <button class="aim-btn btn-view-file" style="flex:1; padding:4px 0; font-size:0.7rem;" data-id="${f.id}">VIEW</button>
                  ${f.owner === currentProfile ? `<button class="aim-btn btn-del-file" style="flex:1; padding:4px 0; font-size:0.7rem; border-color:var(--accent); color:var(--accent);" data-id="${f.id}">DEL</button>` : ''}
                </div>
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
            <input type="text" class="aim-input" id="new-file-name" placeholder="OPTIONAL_FILENAME" />
            <textarea class="aim-textarea" id="new-file-content" rows="4" placeholder="ENTER TEXT DATA..."></textarea>
            <div style="font-size: 0.75rem; color: var(--text-dim, #607080); text-align: center;">-- OR ATTACH FILE --</div>
            <input type="file" class="aim-input" id="new-file-upload" style="font-size: 0.8rem; padding: 5px; cursor: pointer;" />
            <label style="color: var(--blue-dim); font-size: 0.75rem; display: block; margin-top: 4px;">
              <input type="checkbox" id="new-file-shared"> SHARE WITH OTHER USERS
            </label>
            <button class="aim-btn aim-btn-generate" id="btn-save-file" style="margin-top:10px;">ENCRYPT & UPLOAD</button>
          </div>
        </div>
      </div>
    `;

    // Attach events
    const btnSave = el.querySelector('#btn-save-file');
    btnSave.onclick = async () => {
      let filename = el.querySelector('#new-file-name').value.trim();
      const contentText = el.querySelector('#new-file-content').value.trim();
      const fileInput = el.querySelector('#new-file-upload');
      const shared = el.querySelector('#new-file-shared').checked;
      
      let fileObj;
      let fileType = 'text/plain';

      if (fileInput.files && fileInput.files[0]) {
        fileObj = fileInput.files[0];
        if (!filename) filename = fileObj.name;
        fileType = fileObj.type || 'application/octet-stream';
      } else if (contentText) {
        if (!filename) filename = `SECURE_NOTE_${Date.now().toString().slice(-5)}.txt`;
        fileObj = new Blob([contentText], { type: 'text/plain' });
      } else {
        alert("CONTENT OR FILE REQUIRED.");
        return;
      }
      
      btnSave.textContent = "UPLOADING...";
      btnSave.disabled = true;
      
      try {
        const storagePath = `${currentProfile}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vault_data')
          .upload(storagePath, fileObj);
          
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from('vault_files').insert([{
          filename,
          type: fileType,
          owner: currentProfile,
          shared,
          storage_path: uploadData.path
        }]);

        if (dbError) throw dbError;

        loadFiles();
      } catch(e) {
        alert("UPLOAD FAILED: " + e.message);
        btnSave.textContent = "ENCRYPT & UPLOAD";
        btnSave.disabled = false;
      }
    };

    el.querySelectorAll('.btn-view-file').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const file = files.find(f => f.id === id);
        if (file) {
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px);';
          
          const modal = document.createElement('div');
          modal.style.cssText = 'background:#050a0f; border:1px solid var(--accent); padding:20px; max-width:800px; width:90%; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 0 20px rgba(6,182,212,0.2);';
          
          const url = getPublicUrl(file.storage_path);
          let contentHtml = '';
          
          if (file.type && file.type.startsWith('image/')) {
            contentHtml = `<img src="${url}" style="max-width:100%; max-height:60vh; object-fit:contain; border:1px solid var(--border-dim);" />`;
          } else if (file.type && file.type.startsWith('video/')) {
            contentHtml = `<video src="${url}" style="max-width:100%; max-height:60vh; object-fit:contain; border:1px solid var(--border-dim);" controls autoplay loop playsinline></video>`;
          } else {
            // Fetch raw text for preview
            try {
              const res = await fetch(url);
              const text = await res.text();
              contentHtml = `<pre style="white-space: pre-wrap; word-break: break-all; font-family: var(--font-mono, monospace); color: var(--blue-dim, #a0b0c0); font-size: 0.85rem; overflow-y:auto; max-height:60vh; margin:0; padding:10px; background:rgba(0,0,0,0.3); border:1px solid var(--border-dim);">${text}</pre>`;
            } catch (e) {
              contentHtml = `<div style="color:var(--accent);">FAILED TO LOAD PREVIEW</div>`;
            }
          }

          modal.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(6,182,212,0.3); padding-bottom:10px; margin-bottom:15px;">
              <div style="color:var(--accent); font-family:var(--font-hud, monospace); font-size:1.1rem;">// VIEWING: ${file.filename}</div>
              <div style="color:var(--blue-dim); font-size:0.7rem;"><a href="${url}" target="_blank" style="color:var(--blue); text-decoration:none;">DOWNLOAD</a> | TYPE: ${file.type || 'TEXT'}</div>
            </div>
            ${contentHtml}
            <button id="close-file-btn" class="aim-btn" style="margin-top:20px; text-align:center;">CLOSE PREVIEW</button>
          `;

          overlay.appendChild(modal);
          document.body.appendChild(overlay);

          modal.querySelector('#close-file-btn').addEventListener('click', () => {
            document.body.removeChild(overlay);
          });
        }
      };
    });

    el.querySelectorAll('.btn-del-file').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const file = files.find(f => f.id === id);
        if (file && confirm('DELETE CLASSIFIED DATA?')) {
          btn.textContent = '...';
          try {
            if (supabase && supabase.storage && file.storage_path) {
              await supabase.storage.from('vault_data').remove([file.storage_path]);
              await supabase.from('vault_files').delete().eq('id', id);
            }
          } catch (e) {
            console.warn('Cloud delete notice:', e);
          }
          try {
            const local = JSON.parse(localStorage.getItem('alphacore_vault_files') || '[]');
            const filtered = local.filter(f => f.id !== id && f.filename !== file.filename);
            localStorage.setItem('alphacore_vault_files', JSON.stringify(filtered));
          } catch {}
          loadFiles();
        }
      };
    });
  }

  // Initial load
  loadFiles();

  return el;
}

// ==========================================
// VAULT CLASSIFIED LINKS PANEL
// ==========================================
function buildLinksPanel() {
  const container = document.createElement('div');
  container.className = 'vault-links-panel slide-up';
  container.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

  // Session state
  let currentProfile = (sessionStorage.getItem('current_profile') || 'Architect').trim();
  let currentPin = (sessionStorage.getItem('current_pin') || '').trim();
  let isArchitect = currentProfile.toLowerCase() === 'architect' || currentPin === '672167566';
  let linksList = [];
  let activeFilter = 'all'; // 'all', 'authorized', 'restricted'
  let activeCategory = 'ALL';
  let searchQuery = '';

  const CATEGORIES = ['ALL', 'INFRASTRUCTURE', 'TELEMETRY', 'DATABASE', 'AI_MODELS', 'UTILITIES', 'RESEARCH'];

  container.innerHTML = `
    <!-- HEADER SUB-BAR -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid rgba(0,184,255,0.2); padding-bottom:14px;">
      <div>
        <div class="aim-header-badge" style="font-size:0.75rem; letter-spacing:1px; margin-bottom:4px;">
          [VAULT_ENCLAVE] // CLASSIFIED_URL_MATRIX
        </div>
        <div style="font-family:'Orbitron',sans-serif; color:#00b8ff; font-size:1.2rem; font-weight:bold; letter-spacing:1px;">
          CLASSIFIED VAULT LINKS
        </div>
        <div style="font-family:'Share Tech Mono',monospace; color:var(--blue-dim); font-size:0.78rem; margin-top:2px;">
          RESTRICTED ENDPOINTS & EXTERNAL REPOSITORIES // PER-PROFILE RBAC ENFORCEMENT
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <div style="background:rgba(0,255,157,0.1); border:1px solid #00ff9d; color:#00ff9d; padding:4px 10px; font-family:var(--font-hud); font-size:0.72rem; border-radius:2px; font-weight:bold; display:flex; align-items:center; gap:6px;">
          <span style="color:#00ff9d; animation:blink 1.5s infinite;">●</span>
          RBAC: ACTIVE
        </div>

        <button id="btn-switch-links-auth" class="aim-btn aim-btn-sm" style="padding:4px 10px; font-size:0.72rem; border-color:var(--accent); color:var(--accent);" title="Switch or test different user clearance PINs">
          🔑 CLEARANCE: ${currentProfile.toUpperCase()}
        </button>
      </div>
    </div>

    <!-- STATS OVERVIEW -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(0,184,255,0.25);">
        <div style="font-size:0.7rem; color:var(--blue-dim); font-family:var(--font-hud);">CLASSIFIED LINKS</div>
        <div id="stat-total-links" style="font-size:1.3rem; font-family:'Orbitron',sans-serif; color:#00b8ff; font-weight:bold; margin-top:4px;">--</div>
      </div>
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(0,255,157,0.25);">
        <div style="font-size:0.7rem; color:#00ff9d; font-family:var(--font-hud);">AUTHORIZED FOR USER</div>
        <div id="stat-auth-links" style="font-size:1.3rem; font-family:'Orbitron',sans-serif; color:#00ff9d; font-weight:bold; margin-top:4px;">--</div>
      </div>
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(255,0,60,0.25);">
        <div style="font-size:0.7rem; color:#ff003c; font-family:var(--font-hud);">RESTRICTED / CLOAKED</div>
        <div id="stat-locked-links" style="font-size:1.3rem; font-family:'Orbitron',sans-serif; color:#ff003c; font-weight:bold; margin-top:4px;">--</div>
      </div>
      <div class="panel" style="padding:12px; background:rgba(8,12,20,0.7); border:1px solid rgba(245,158,11,0.25);">
        <div style="font-size:0.7rem; color:#f59e0b; font-family:var(--font-hud);">DISPATCHED LAUNCHES</div>
        <div id="stat-clicks-links" style="font-size:1.3rem; font-family:'Orbitron',sans-serif; color:#f59e0b; font-weight:bold; margin-top:4px;">--</div>
      </div>
    </div>

    <!-- CONTROLS & FILTER BAR -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; gap:6px; flex-wrap:wrap;">
        <button class="aim-btn filter-links-btn active" data-filter="all" style="font-size:0.75rem; padding:6px 12px;">ALL LINKS</button>
        <button class="aim-btn filter-links-btn" data-filter="authorized" style="font-size:0.75rem; padding:6px 12px; border-color:#00ff9d; color:#00ff9d;">AUTHORIZED</button>
        <button class="aim-btn filter-links-btn" data-filter="restricted" style="font-size:0.75rem; padding:6px 12px; border-color:#ff003c; color:#ff003c;">RESTRICTED</button>
      </div>

      <div style="display:flex; gap:8px; flex-grow:1; max-width:550px;">
        <input type="text" id="links-search-input" class="aim-input" placeholder="Search by title, url, category, description..." style="font-size:0.8rem; height:36px;" />
        <button id="btn-refresh-links" class="aim-btn" style="white-space:nowrap; padding:0 12px; font-size:0.75rem;" title="Refresh databank">
          ↻ RE-SYNC
        </button>
        ${isArchitect ? `
          <button id="btn-toggle-add-link" class="aim-btn aim-btn-generate" style="white-space:nowrap; padding:0 14px; font-size:0.75rem;" title="Register new classified URL">
            + ADD LINK
          </button>
        ` : ''}
      </div>
    </div>

    <!-- CATEGORY PILLS -->
    <div id="links-cat-pills" style="display:flex; gap:6px; flex-wrap:wrap;">
      ${CATEGORIES.map(cat => `
        <button class="aim-btn cat-pill-btn ${cat === 'ALL' ? 'active' : ''}" data-cat="${cat}" style="font-size:0.7rem; padding:3px 10px; border-radius:2px; ${cat === 'ALL' ? 'background:rgba(0,184,255,0.2); border-color:#00b8ff; color:#fff;' : 'background:transparent; border-color:var(--border-dim); color:var(--blue-dim);'}">
          ${cat}
        </button>
      `).join('')}
    </div>

    <!-- ARCHITECT ADD LINK PANEL (COLLAPSIBLE) -->
    ${isArchitect ? `
      <div id="add-link-panel" class="panel aim-section" style="display:none; padding:18px; border:1px solid #00b8ff; background:rgba(8,16,28,0.95);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div style="font-family:'Orbitron',sans-serif; color:#fff; font-size:0.95rem; letter-spacing:1px; display:flex; align-items:center; gap:8px;">
            <span style="color:#00b8ff;">▲</span> CLASSIFY & REGISTER NEW VAULT LINK [ARCHITECT MASTER CLEARANCE]
          </div>
          <button id="btn-close-add-link" style="background:none; border:none; color:#888; cursor:pointer; font-size:1.1rem;">✕</button>
        </div>

        <form id="add-link-form" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px;">
          <div class="aim-field">
            <label class="aim-label">LINK TITLE</label>
            <input type="text" id="link-input-title" class="aim-input" placeholder="e.g. Modal Autonomous Orchestrator" required />
          </div>

          <div class="aim-field">
            <label class="aim-label">DESTINATION URL</label>
            <input type="text" id="link-input-url" class="aim-input" placeholder="e.g. https://modal.com/apps/orchestrator" required />
          </div>

          <div class="aim-field">
            <label class="aim-label">CATEGORY</label>
            <select id="link-input-cat" class="aim-input" style="background:#050a12; color:#fff;">
              <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
              <option value="TELEMETRY">TELEMETRY</option>
              <option value="DATABASE">DATABASE</option>
              <option value="AI_MODELS">AI_MODELS</option>
              <option value="UTILITIES">UTILITIES</option>
              <option value="RESEARCH">RESEARCH</option>
            </select>
          </div>

          <div class="aim-field">
            <label class="aim-label">ACCESS CLEARANCE LEVEL</label>
            <select id="link-input-access" class="aim-input" style="background:#050a12; color:#fff;">
              <option value="RESTRICTED">RESTRICTED (Specified Profiles Only)</option>
              <option value="ROLE_LOCKED">ROLE_LOCKED (Profiles or Assigned Roles)</option>
              <option value="PUBLIC_CLEARANCE">PUBLIC_CLEARANCE (All Authenticated Profiles)</option>
            </select>
          </div>

          <div class="aim-field" style="grid-column:1 / -1;">
            <label class="aim-label">DESCRIPTION</label>
            <input type="text" id="link-input-desc" class="aim-input" placeholder="Brief technical summary or purpose of this classified link..." />
          </div>

          <div class="aim-field" style="grid-column:1 / -1;">
            <label class="aim-label">ALLOWED OPERATIVES (SELECT PROFILES WITH ACCESS)</label>
            <div id="link-profiles-cbs" style="display:flex; gap:16px; flex-wrap:wrap; margin-top:6px; background:rgba(0,0,0,0.3); padding:8px 12px; border:1px solid #334155; border-radius:3px;">
              <label style="color:#00ff9d; font-size:0.75rem; cursor:pointer;"><input type="checkbox" value="Architect" checked disabled /> Architect (Always Authorized)</label>
              <label style="color:var(--blue-dim); font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="link-perm-cb" value="Fisherman" /> Fisherman</label>
              <label style="color:var(--blue-dim); font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="link-perm-cb" value="J. P." /> J. P.</label>
              <label style="color:var(--blue-dim); font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="link-perm-cb" value="john" /> john</label>
              <label style="color:#f59e0b; font-size:0.75rem; cursor:pointer;"><input type="checkbox" class="link-perm-cb" value="*" /> Public (All Authorized Users)</label>
            </div>
          </div>

          <div style="grid-column:1 / -1; display:flex; justify-content:flex-end; gap:10px; margin-top:6px;">
            <button type="submit" id="btn-submit-link" class="aim-btn aim-btn-generate" style="padding:8px 24px;">
              COMMIT & STORE IN VAULT
            </button>
          </div>
        </form>
      </div>
    ` : ''}

    <!-- LINKS CARDS GRID -->
    <div id="links-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:16px;">
      <div style="color:var(--blue-dim); font-family:var(--font-hud); padding:30px; text-align:center; grid-column:1 / -1;">
        CONNECTING TO VAULT CLASSIFIED DIRECTORY...
      </div>
    </div>
  `;

  // Profile switcher
  const btnSwitchAuth = container.querySelector('#btn-switch-links-auth');
  if (btnSwitchAuth) {
    btnSwitchAuth.onclick = () => {
      const pinPadEl = buildPinPad({
        onSuccess: () => {
          showModal({ title: '', content: '' });
          currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').trim();
          currentPin = (sessionStorage.getItem('current_pin') || '').trim();
          isArchitect = currentProfile.toLowerCase() === 'architect' || currentPin === '672167566';
          fetchLinks();
        },
        title: '// VERIFY_OPERATIVE_CLEARANCE',
        subtitle: 'ENTER PIN TO VERIFY ACCESS PERMISSIONS',
        icon: '🔑'
      });
      showModal({
        title: 'SWITCH OPERATIVE CLEARANCE PROFILE',
        content: pinPadEl
      });
    };
  }

  // Filter buttons
  const filterBtns = container.querySelectorAll('.filter-links-btn');
  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-filter');
      renderLinks();
    };
  });

  // Category pills
  const catPills = container.querySelectorAll('.cat-pill-btn');
  catPills.forEach(pill => {
    pill.onclick = () => {
      catPills.forEach(p => {
        p.classList.remove('active');
        p.style.background = 'transparent';
        p.style.borderColor = 'var(--border-dim)';
        p.style.color = 'var(--blue-dim)';
      });
      pill.classList.add('active');
      pill.style.background = 'rgba(0,184,255,0.2)';
      pill.style.borderColor = '#00b8ff';
      pill.style.color = '#fff';
      activeCategory = pill.getAttribute('data-cat');
      renderLinks();
    };
  });

  // Search input
  const searchInput = container.querySelector('#links-search-input');
  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderLinks();
    };
  }

  // Refresh button
  const btnRefresh = container.querySelector('#btn-refresh-links');
  if (btnRefresh) {
    btnRefresh.onclick = () => {
      playSFX('click');
      btnRefresh.innerHTML = '↻ SYNCING...';
      fetchLinks().finally(() => {
        btnRefresh.innerHTML = '↻ RE-SYNC';
      });
    };
  }

  // Add Link panel toggle
  const btnToggleAdd = container.querySelector('#btn-toggle-add-link');
  const addLinkPanel = container.querySelector('#add-link-panel');
  const btnCloseAdd = container.querySelector('#btn-close-add-link');

  if (btnToggleAdd && addLinkPanel) {
    btnToggleAdd.onclick = () => {
      playSFX('click');
      const isVisible = addLinkPanel.style.display !== 'none';
      addLinkPanel.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) addLinkPanel.scrollIntoView({ behavior: 'smooth' });
    };
  }
  if (btnCloseAdd && addLinkPanel) {
    btnCloseAdd.onclick = () => {
      addLinkPanel.style.display = 'none';
    };
  }

  // Add link form submit
  const addLinkForm = container.querySelector('#add-link-form');
  if (addLinkForm) {
    addLinkForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = addLinkForm.querySelector('#btn-submit-link');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'REGISTERING IN VAULT...';

      try {
        const title = addLinkForm.querySelector('#link-input-title').value.trim();
        const url = addLinkForm.querySelector('#link-input-url').value.trim();
        const category = addLinkForm.querySelector('#link-input-cat').value;
        const accessLevel = addLinkForm.querySelector('#link-input-access').value;
        const description = addLinkForm.querySelector('#link-input-desc').value.trim();

        const selectedProfiles = ['Architect'];
        addLinkForm.querySelectorAll('.link-perm-cb:checked').forEach(cb => {
          selectedProfiles.push(cb.value);
        });

        const payload = {
          title,
          url,
          category,
          accessLevel,
          description,
          allowedProfiles: selectedProfiles,
          allowedRoles: ['admin', 'vault']
        };

        const res = await fetch('/api/vault/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-pin': currentPin || '672167566'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to register link');

        showToast(`Vault link '${title}' registered successfully!`, 'success');
        playSFX('response');
        addLinkForm.reset();
        addLinkPanel.style.display = 'none';
        fetchLinks();
      } catch (err) {
        showToast(`Registration error: ${err.message}`, 'error');
        playSFX('incorrect');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'COMMIT & STORE IN VAULT';
      }
    };
  }

  // Fetch classified links from backend
  async function fetchLinks() {
    try {
      const res = await fetch(`/api/vault/links?profile=${encodeURIComponent(currentProfile)}&pin=${encodeURIComponent(currentPin)}`, {
        headers: {
          'x-user-pin': currentPin
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      linksList = data.links || [];
      if (typeof data.isArchitect === 'boolean') {
        isArchitect = data.isArchitect;
      }
      renderLinks();
      updateStats();
    } catch (err) {
      console.error('[VaultLinks] Fetch error:', err);
      const grid = container.querySelector('#links-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="panel" style="grid-column:1 / -1; border-color:var(--accent); padding:20px; text-align:center;">
            <div style="color:var(--accent); font-family:'Orbitron',sans-serif; margin-bottom:8px;">// DATABANK_ERROR</div>
            <p style="color:#888; font-size:0.85rem; margin:0;">Unable to retrieve classified links: ${err.message}</p>
          </div>
        `;
      }
    }
  }

  function updateStats() {
    const totalEl = container.querySelector('#stat-total-links');
    const authEl = container.querySelector('#stat-auth-links');
    const lockedEl = container.querySelector('#stat-locked-links');
    const clicksEl = container.querySelector('#stat-clicks-links');

    const total = linksList.length;
    const authorized = linksList.filter(l => l.canAccess).length;
    const locked = total - authorized;
    const totalClicks = linksList.reduce((sum, l) => sum + (l.clicksCount || 0), 0);

    if (totalEl) totalEl.textContent = total;
    if (authEl) authEl.textContent = authorized;
    if (lockedEl) lockedEl.textContent = locked;
    if (clicksEl) clicksEl.textContent = totalClicks;
  }

  function renderLinks() {
    const grid = container.querySelector('#links-grid');
    if (!grid) return;

    let filtered = linksList;

    if (activeFilter === 'authorized') {
      filtered = filtered.filter(l => l.canAccess);
    } else if (activeFilter === 'restricted') {
      filtered = filtered.filter(l => !l.canAccess);
    }

    if (activeCategory !== 'ALL') {
      filtered = filtered.filter(l => (l.category || '').toUpperCase() === activeCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(l =>
        (l.title && l.title.toLowerCase().includes(searchQuery)) ||
        (l.url && l.url.toLowerCase().includes(searchQuery)) ||
        (l.description && l.description.toLowerCase().includes(searchQuery)) ||
        (l.category && l.category.toLowerCase().includes(searchQuery))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="panel" style="grid-column:1 / -1; padding:30px; text-align:center; color:var(--blue-dim); font-family:var(--font-hud);">
          NO CLASSIFIED LINKS MATCH CURRENT QUERY OR FILTER CRITERIA.
        </div>
      `;
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(link => {
      const card = buildLinkCard(link);
      grid.appendChild(card);
    });
  }

  function getCategoryIcon(cat) {
    switch ((cat || '').toUpperCase()) {
      case 'INFRASTRUCTURE': return '🌐';
      case 'TELEMETRY': return '📡';
      case 'DATABASE': return '🗄️';
      case 'AI_MODELS': return '🧠';
      case 'RESEARCH': return '🔬';
      default: return '🔗';
    }
  }

  function buildLinkCard(link) {
    const card = createElement('div', { class: 'panel aim-section link-card' });
    card.style.cssText = `
      padding: 16px;
      background: rgba(8, 14, 24, 0.85);
      border: 1px solid ${link.canAccess ? 'rgba(0, 184, 255, 0.35)' : 'rgba(255, 0, 60, 0.3)'};
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    `;

    const isPublic = (link.allowedProfiles || []).includes('*');
    const allowedList = (link.allowedProfiles || []).join(', ');
    const icon = getCategoryIcon(link.category);

    card.innerHTML = `
      <div>
        <!-- TOP ROW: ICON, TITLE, BADGES -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px; border-radius:4px; background:rgba(0,184,255,0.1); border:1px solid #00b8ff; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
              ${icon}
            </div>
            <div>
              <h3 style="margin:0; font-family:'Orbitron',sans-serif; font-size:0.95rem; color:#fff; letter-spacing:0.5px;">
                ${escapeHTML(link.title)}
              </h3>
              <div style="font-size:0.68rem; color:#00b8ff; font-family:var(--font-hud); margin-top:2px;">
                [${escapeHTML((link.category || 'GENERAL').toUpperCase())}]
              </div>
            </div>
          </div>

          <div style="text-align:right;">
            <span style="display:inline-block; font-size:0.68rem; font-family:var(--font-hud); font-weight:bold; padding:2px 6px; border-radius:2px; background:${link.canAccess ? 'rgba(0,255,157,0.15)' : 'rgba(255,0,60,0.15)'}; border:1px solid ${link.canAccess ? '#00ff9d' : '#ff003c'}; color:${link.canAccess ? '#00ff9d' : '#ff003c'};">
              ${link.canAccess ? '● AUTHORIZED' : '✕ CLASSIFIED'}
            </span>
            <div style="font-size:0.65rem; color:#888; font-family:monospace; margin-top:4px;">
              ${link.accessLevel || 'RESTRICTED'}
            </div>
          </div>
        </div>

        <!-- CLEARANCE BANNER -->
        <div style="background:rgba(0,0,0,0.4); border-left:3px solid ${link.canAccess ? '#00b8ff' : '#ff003c'}; padding:6px 10px; margin-bottom:12px; font-size:0.72rem; font-family:monospace;">
          <span style="color:#aaa;">PERMITTED OPERATIVES:</span> 
          <span style="color:${link.canAccess ? '#00b8ff' : '#ff003c'}; font-weight:bold;">
            ${isPublic ? 'PUBLIC (ALL ACTIVE OPERATIVES)' : escapeHTML(allowedList)}
          </span>
        </div>

        <!-- DESCRIPTION -->
        <p style="font-size:0.78rem; color:#ccc; line-height:1.4; margin:0 0 12px 0;">
          ${escapeHTML(link.description || 'No operational description logged.')}
        </p>

        <!-- DESTINATION URL BOX -->
        <div style="background:rgba(0,0,0,0.5); border:1px solid #1e293b; padding:8px 10px; border-radius:3px; font-size:0.72rem; font-family:monospace; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <span style="color:${link.canAccess ? '#38bdf8' : '#64748b'}; word-break:break-all; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${escapeHTML(link.url)}
          </span>
          ${link.canAccess ? `
            <button class="btn-copy-link-url" style="background:none; border:none; color:#00b8ff; cursor:pointer; font-size:0.7rem; padding:2px 6px; white-space:nowrap;" title="Copy URL">
              COPY
            </button>
          ` : `
            <span style="color:#ef4444; font-size:0.65rem; white-space:nowrap;">🔒 CLOAKED</span>
          `}
        </div>

        <!-- METRICS ROW -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; font-size:0.68rem; font-family:monospace; color:#888;">
          <div style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:2px;">
            LAUNCHES: <span style="color:#f59e0b;">${link.clicksCount || 0}</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:2px;">
            SECURITY: <span style="color:${link.canAccess ? '#00ff9d' : '#ff003c'};">${link.canAccess ? 'CLEARED' : 'RESTRICTED'}</span>
          </div>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px;">
        <div style="display:flex; gap:8px;">
          <button class="aim-btn btn-launch-link" style="flex-grow:1; padding:8px 12px; font-size:0.8rem; font-weight:bold; ${link.canAccess ? 'background:rgba(0,184,255,0.15); border-color:#00b8ff; color:#00b8ff;' : 'opacity:0.4; cursor:not-allowed; border-color:#475569; color:#64748b;'}" ${link.canAccess ? '' : 'disabled'}>
            ${link.canAccess ? '↗ LAUNCH ENDPOINT' : '🔒 CLEARANCE LOCKED'}
          </button>

          <button class="aim-btn btn-qr-link" style="padding:8px 10px; font-size:0.75rem; ${link.canAccess ? '' : 'opacity:0.4; cursor:not-allowed;'}" title="Scan Mobile QR Code" ${link.canAccess ? '' : 'disabled'}>
            📱
          </button>
        </div>

        ${isArchitect ? `
          <div style="display:flex; gap:6px; margin-top:2px;">
            <button class="aim-btn aim-btn-sm btn-edit-link-perms" style="flex-grow:1; font-size:0.68rem; padding:4px; border-color:#64748b; color:#94a3b8;">
              ⚙ EDIT PERMISSIONS
            </button>
            <button class="aim-btn aim-btn-sm btn-delete-link" style="font-size:0.68rem; padding:4px 8px; border-color:#ef4444; color:#ef4444;" title="Delete Link from Vault">
              ✕
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Copy URL handler
    const btnCopy = card.querySelector('.btn-copy-link-url');
    if (btnCopy && link.canAccess) {
      btnCopy.onclick = () => {
        navigator.clipboard.writeText(link.url);
        showToast('Destination URL copied to clipboard', 'info');
        playSFX('click');
      };
    }

    // Launch handler
    const btnLaunch = card.querySelector('.btn-launch-link');
    if (btnLaunch && link.canAccess) {
      btnLaunch.onclick = () => {
        playSFX('click');
        // Increment clicks in background
        fetch(`/api/vault/links/${encodeURIComponent(link.id)}/click`, { method: 'POST' }).catch(() => {});
        link.clicksCount = (link.clicksCount || 0) + 1;
        updateStats();
        window.open(link.url, '_blank', 'noopener,noreferrer');
      };
    }

    // QR Code modal
    const btnQr = card.querySelector('.btn-qr-link');
    if (btnQr && link.canAccess) {
      btnQr.onclick = () => {
        playSFX('click');
        const qrContent = document.createElement('div');
        qrContent.style.cssText = 'text-align:center; padding:10px;';
        qrContent.innerHTML = `
          <div style="background:#fff; padding:16px; display:inline-block; border-radius:6px; margin-bottom:14px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link.url)}" alt="QR Code" style="display:block; width:200px; height:200px;" />
          </div>
          <div style="font-family:monospace; font-size:0.75rem; color:#aaa; margin-bottom:12px; word-break:break-all;">
            DESTINATION URL:<br/>
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:#00b8ff;">${escapeHTML(link.url)}</a>
          </div>
          <p style="color:#888; font-size:0.75rem; margin:0;">Scan with camera or mobile browser to open endpoint directly.</p>
        `;
        showModal({
          title: `ENDPOINT QR // ${link.title.toUpperCase()}`,
          content: qrContent
        });
      };
    }

    // Edit permissions modal (Architect only)
    const btnEditPerms = card.querySelector('.btn-edit-link-perms');
    if (btnEditPerms && isArchitect) {
      btnEditPerms.onclick = () => {
        playSFX('click');
        const permsForm = document.createElement('form');
        permsForm.innerHTML = `
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.85rem;">
            <p style="color:#aaa; margin-top:0;">Configure access clearance for <strong>${escapeHTML(link.title)}</strong>.</p>

            <div style="background:rgba(0,0,0,0.4); padding:12px; border:1px solid #334155; margin-bottom:14px; border-radius:3px;">
              <div style="margin-bottom:8px; font-size:0.75rem; color:#00b8ff; font-weight:bold;">ALLOWED PROFILES:</div>
              <label style="display:block; margin-bottom:6px; color:#00ff9d;"><input type="checkbox" value="Architect" checked disabled /> Architect (Always Allowed)</label>
              <label style="display:block; margin-bottom:6px; color:var(--blue-dim);"><input type="checkbox" class="edit-link-p-cb" value="Fisherman" ${(link.allowedProfiles || []).includes('Fisherman') ? 'checked' : ''} /> Fisherman</label>
              <label style="display:block; margin-bottom:6px; color:var(--blue-dim);"><input type="checkbox" class="edit-link-p-cb" value="J. P." ${(link.allowedProfiles || []).includes('J. P.') ? 'checked' : ''} /> J. P.</label>
              <label style="display:block; margin-bottom:6px; color:var(--blue-dim);"><input type="checkbox" class="edit-link-p-cb" value="john" ${(link.allowedProfiles || []).includes('john') ? 'checked' : ''} /> john</label>
              <label style="display:block; margin-bottom:6px; color:#f59e0b;"><input type="checkbox" class="edit-link-p-cb" value="*" ${(link.allowedProfiles || []).includes('*') ? 'checked' : ''} /> Public / All Users (*)</label>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; margin-bottom:4px; font-size:0.75rem; color:#00b8ff; font-weight:bold;">ACCESS LEVEL:</label>
              <select id="edit-link-access-level" class="aim-input" style="width:100%; background:#050a12; color:#fff;">
                <option value="RESTRICTED" ${link.accessLevel === 'RESTRICTED' ? 'selected' : ''}>RESTRICTED (Specified Profiles Only)</option>
                <option value="ROLE_LOCKED" ${link.accessLevel === 'ROLE_LOCKED' ? 'selected' : ''}>ROLE_LOCKED (Profiles or Assigned Roles)</option>
                <option value="PUBLIC_CLEARANCE" ${link.accessLevel === 'PUBLIC_CLEARANCE' ? 'selected' : ''}>PUBLIC_CLEARANCE (All Users)</option>
              </select>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px;">
              <button type="submit" class="aim-btn aim-btn-generate" style="padding:6px 18px;">SAVE PERMISSIONS</button>
            </div>
          </div>
        `;

        permsForm.onsubmit = async (e) => {
          e.preventDefault();
          const selected = ['Architect'];
          permsForm.querySelectorAll('.edit-link-p-cb:checked').forEach(cb => selected.push(cb.value));
          const newAccess = permsForm.querySelector('#edit-link-access-level').value;

          try {
            const res = await fetch(`/api/vault/links/${encodeURIComponent(link.id)}/permissions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-user-pin': currentPin || '672167566'
              },
              body: JSON.stringify({
                allowedProfiles: selected,
                accessLevel: newAccess
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');

            showToast('Permissions updated successfully!', 'success');
            showModal({ title: '', content: '' });
            fetchLinks();
          } catch (err) {
            showToast(`Update error: ${err.message}`, 'error');
          }
        };

        showModal({
          title: `PERMISSIONS // ${link.title.toUpperCase()}`,
          content: permsForm
        });
      };
    }

    // Delete handler (Architect only)
    const btnDel = card.querySelector('.btn-delete-link');
    if (btnDel && isArchitect) {
      btnDel.onclick = async () => {
        if (!confirm(`Permanently remove classified link '${link.title}' from Vault?`)) return;
        playSFX('click');
        try {
          const res = await fetch(`/api/vault/links/${encodeURIComponent(link.id)}`, {
            method: 'DELETE',
            headers: {
              'x-user-pin': currentPin || '672167566'
            }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to delete');
          showToast(`Link '${link.title}' removed from Vault.`, 'info');
          fetchLinks();
        } catch (err) {
          showToast(`Deletion error: ${err.message}`, 'error');
        }
      };
    }

    return card;
  }

  // Initial load
  fetchLinks();

  return container;
}


// ===
// PROGRAMMATIC VAULT STORAGE API
// ==========================================
export async function saveFileToVault(fileObj, customFilename = null, isShared = false) {
  const currentProfile = sessionStorage.getItem('current_profile') || 'Architect';
  const filename = customFilename || (fileObj && fileObj.name) || `ATTACHMENT_${Date.now()}`;
  const fileType = (fileObj && fileObj.type) || 'application/octet-stream';

  let textContent = null;
  let dataUrl = null;

  try {
    if (typeof fileObj.text === 'function' && (fileType.startsWith('text/') || fileType.includes('json') || fileType.includes('xml') || fileType.includes('javascript') || fileType === 'text/plain')) {
      textContent = await fileObj.text();
    } else if (typeof FileReader !== 'undefined' && fileObj instanceof Blob) {
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(fileObj);
      });
    }
  } catch (readErr) {
    console.warn('[Vault] File content read warning:', readErr);
  }

  // 1. Persistent Local Databank Cache for instantaneous RAG / Neural indexing
  const fileId = 'vf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const entry = {
    id: fileId,
    filename,
    name: filename,
    type: fileType,
    owner: currentProfile.toUpperCase(),
    shared: isShared,
    size: (fileObj && fileObj.size) || (textContent ? textContent.length : 0),
    content: textContent,
    dataUrl: dataUrl,
    created_at: new Date().toISOString()
  };

  try {
    const localVault = JSON.parse(localStorage.getItem('alphacore_vault_files') || '[]');
    localVault.unshift(entry);
    localStorage.setItem('alphacore_vault_files', JSON.stringify(localVault));
  } catch (cacheErr) {
    console.warn('[Vault] Local cache write error:', cacheErr);
  }

  // 2. Cloud Substrate Backup (Supabase) if authenticated / reachable (non-blocking)
  const isTest = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
  if (!isTest && supabase && supabase.storage) {
    (async () => {
      try {
        const storagePath = `${currentProfile.toLowerCase()}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('vault_data')
          .upload(storagePath, fileObj);

        if (!uploadErr && uploadData) {
          await supabase.from('vault_files').insert([{
            filename,
            type: fileType,
            owner: currentProfile.toUpperCase(),
            shared: isShared,
            storage_path: uploadData.path
          }]);
        }
      } catch (cloudErr) {
        // Graceful fallback to local vault cache
      }
    })();
  }

  return { success: true, filename, id: fileId, entry };
}
