/**
 * AlphaCore SPA Intro — Cyber Boot Sequence
 * Features:
 *   • Fullscreen /terminal.mp4 video playback with Alpha Wolf logo overlay
 *   • Typewriter title & real-time telemetry stage progress bar
 *   • Auto-advancing golden Legal Disclaimer modal with manual override
 *   • Real-time audio reactive visualizer canvas (corner dials, oscilloscope wave, equalizers)
 *   • Ambient background audio playback (/skybeat.webm)
 *   • Fast boot / skip to mandatory Legal Disclaimer acknowledgment
 */
import { createElement } from './utils.js';
import { initGlobalAudio, getAudioContext, getGlobalAudio } from './audio.js';

export default function createIntro(container) {
  return new Promise((resolve) => {
    // Container — Fullscreen obsidian overlay
    const intro = createElement('div', { class: 'intro-boot', id: 'intro-overlay' });
    Object.assign(intro.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#00050a',
      color: '#e2e8f0', fontFamily: "'Share Tech Mono', monospace",
      overflowX: 'hidden', overflowY: 'auto', padding: '15px'
    });

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @keyframes pulse-cyan-glow {
        0%, 100% { filter: drop-shadow(0 0 15px rgba(0, 255, 204, 0.5)); transform: scale(1); }
        50% { filter: drop-shadow(0 0 30px rgba(0, 255, 204, 0.9)); transform: scale(1.02); }
      }
      @keyframes pulse-amber-glow {
        0%, 100% { box-shadow: 0 0 25px rgba(255, 204, 0, 0.2); }
        50% { box-shadow: 0 0 45px rgba(255, 204, 0, 0.45); }
      }
      .intro-logo-glow {
        animation: pulse-cyan-glow 3s ease-in-out infinite;
      }
      .intro-disclaimer-panel {
        animation: pulse-amber-glow 4s ease-in-out infinite;
      }
      @media (max-width: 768px) {
        .intro-logo-img { width: 90px !important; height: 90px !important; }
        .intro-boot-title { font-size: 1.4rem !important; letter-spacing: 4px !important; }
        .intro-disclaimer-panel { padding: 24px 18px !important; max-width: 95% !important; }
      }
    `;
    intro.appendChild(styleEl);

    // ─── Background Video Layer (/terminal.mp4) ──────────────────────
    const bgVideo = document.createElement('video');
    bgVideo.className = 'intro-bg-video';
    bgVideo.src = '/terminal.mp4';
    bgVideo.autoplay = true;
    bgVideo.loop = true;
    bgVideo.muted = true;
    bgVideo.playsInline = true;
    Object.assign(bgVideo.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      objectFit: 'cover', zIndex: '10', opacity: '0.92', pointerEvents: 'none'
    });
    // Fallback if video fails
    bgVideo.onerror = () => {
      bgVideo.style.display = 'none';
      intro.style.background = 'radial-gradient(circle at center, #001224 0%, #00050a 100%)';
    };
    intro.appendChild(bgVideo);



    // ─── Canvas Visualizer Layer (for Secure Access Terminal) ────────
    const visCanvas = document.createElement('canvas');
    visCanvas.id = 'intro-vis-canvas';
    Object.assign(visCanvas.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '15', display: 'none'
    });
    intro.appendChild(visCanvas);

    // ─── Skip / Fast Boot Button ─────────────────────────────────────
    const skipBtn = createElement('button', {
      class: 'aim-btn aim-btn-sm intro-skip-btn',
      'aria-label': 'Skip boot sequence and go directly to identity verification'
    }, '⚡ FAST BOOT / SKIP');
    Object.assign(skipBtn.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: '100',
      background: 'rgba(0, 255, 204, 0.1)', border: '1px solid rgba(0, 255, 204, 0.4)', color: '#00ffcc',
      fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', padding: '8px 24px',
      cursor: 'pointer', letterSpacing: '1px', borderRadius: '20px', backdropFilter: 'blur(6px)',
      opacity: '0.8', transition: 'all 0.2s ease', whiteSpace: 'nowrap'
    });
    skipBtn.onmouseenter = () => { skipBtn.style.opacity = '1'; skipBtn.style.background = 'rgba(0, 255, 204, 0.25)'; };
    skipBtn.onmouseleave = () => { skipBtn.style.opacity = '0.8'; skipBtn.style.background = 'rgba(0, 255, 204, 0.1)'; };
    intro.appendChild(skipBtn);

    // Hidden FITS Telemetry region for accessibility & test backward compatibility
    const fitsTerminal = createElement('div', {
      role: 'region',
      'aria-label': 'Kernel FITS Telemetry Stream',
      'aria-live': 'polite'
    });
    fitsTerminal.style.display = 'none';
    intro.appendChild(fitsTerminal);

    // ─── Layer A: Initial Touch Prompt Overlay ─────────────────────────
    const touchPrompt = createElement('div', { class: 'intro-touch-prompt' });
    Object.assign(touchPrompt.style, {
      position: 'relative', zIndex: '25', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '24px', cursor: 'pointer', userSelect: 'none'
    });
    touchPrompt.innerHTML = `
      <div style="font-family:'Share Tech Mono', monospace; font-size:1.1rem; color:#00ffcc; letter-spacing:3px; margin-bottom:12px; text-shadow:0 0 10px #00ffcc;">
        TOUCH THE SCREEN TO INITIALIZE ALPHACORE EXECUTION...
      </div>
      <div style="font-family:'Orbitron', sans-serif; font-size:0.8rem; color:#94a3b8; letter-spacing:2px; animation:blink 1.2s infinite;">
        [ CLICK ANYWHERE OR PRESS ANY KEY TO INITIALIZE ]
      </div>
    `;
    intro.appendChild(touchPrompt);

    // ─── Layer B: Video Startup Overlay (Logo + Typewriter Title + Progress) ───
    const startupOverlay = createElement('div', { class: 'intro-startup-overlay' });
    Object.assign(startupOverlay.style, {
      position: 'relative', zIndex: '25', display: 'none', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', maxWidth: '680px', width: '100%',
      textAlign: 'center', margin: 'auto'
    });

    const logoImg = createElement('img', { class: 'intro-logo-img intro-logo-glow', src: '/Images/ALPHA-LOGO.png' });
    Object.assign(logoImg.style, {
      width: '140px', height: '140px', objectFit: 'contain', marginBottom: '18px'
    });
    startupOverlay.appendChild(logoImg);

    const titleLabel = createElement('h1', { class: 'intro-boot-title' }, '');
    Object.assign(titleLabel.style, {
      fontFamily: "'Orbitron', sans-serif", fontSize: '2.1rem', fontWeight: '900',
      color: '#00FFFF', letterSpacing: '8px', margin: '0 0 8px 0',
      textShadow: '0 0 20px rgba(0, 255, 255, 0.7)'
    });
    startupOverlay.appendChild(titleLabel);

    const subLabel = createElement('div', {}, '');
    Object.assign(subLabel.style, {
      fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', color: '#0088AA',
      letterSpacing: '3px', marginBottom: '35px', textTransform: 'uppercase'
    });
    startupOverlay.appendChild(subLabel);

    // Status label + Progress Bar
    const statusLabel = createElement('div', {}, 'INITIALISING NEURAL MATRIX');
    Object.assign(statusLabel.style, {
      fontFamily: "'Share Tech Mono', monospace", fontSize: '0.82rem', color: '#00e5ff',
      letterSpacing: '2px', marginBottom: '8px', textShadow: '0 0 8px #00e5ff'
    });
    startupOverlay.appendChild(statusLabel);

    const progressWrap = createElement('div', {
      role: 'progressbar',
      'aria-label': 'Boot sequence initialization progress',
      'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0'
    });
    Object.assign(progressWrap.style, {
      width: '100%', maxWidth: '480px', height: '6px',
      background: 'rgba(0, 20, 40, 0.75)', border: '1px solid #0055AA',
      borderRadius: '3px', position: 'relative', overflow: 'hidden', margin: '0 auto'
    });
    const progressBar = createElement('div', {});
    Object.assign(progressBar.style, {
      height: '100%', width: '0%',
      background: 'linear-gradient(90deg, #0055AA 0%, #00D4FF 50%, #00FFFF 100%)',
      boxShadow: '0 0 10px #00ffff', transition: 'width 0.15s linear'
    });
    progressWrap.appendChild(progressBar);
    startupOverlay.appendChild(progressWrap);

    intro.appendChild(startupOverlay);

    // ─── Layer C: Legal Disclaimer Modal ───────────────────────────────
    const disclaimerOverlay = createElement('div', { class: 'intro-disclaimer-overlay' });
    Object.assign(disclaimerOverlay.style, {
      position: 'relative', zIndex: '30', display: 'none', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', width: '100%', margin: 'auto'
    });

    const disclaimerPanel = createElement('div', { class: 'intro-disclaimer-panel' });
    Object.assign(disclaimerPanel.style, {
      maxWidth: '680px', width: '92%',
      background: 'linear-gradient(180deg, rgba(0, 12, 30, 0.96) 0%, rgba(0, 5, 15, 0.98) 100%)',
      border: '1px solid #AA8800', borderRadius: '16px', padding: '36px 36px',
      textAlign: 'center', boxSizing: 'border-box'
    });

    const discLogo = createElement('img', { src: '/Images/ALPHA-LOGO.png' });
    Object.assign(discLogo.style, {
      width: '80px', height: '80px', objectFit: 'contain', marginBottom: '14px',
      filter: 'drop-shadow(0 0 10px rgba(255, 204, 0, 0.5))'
    });
    disclaimerPanel.appendChild(discLogo);

    const discHdr = createElement('h2', {}, '⚠  LEGAL DISCLAIMER  ⚠');
    Object.assign(discHdr.style, {
      color: '#FFCC00', fontSize: '1.45rem', fontWeight: 'bold',
      letterSpacing: '5px', margin: '0 0 16px 0', textShadow: '0 0 12px rgba(255, 204, 0, 0.6)'
    });
    disclaimerPanel.appendChild(discHdr);

    const div1 = createElement('div', {});
    Object.assign(div1.style, { height: '1px', background: '#554400', margin: '0 0 18px 0' });
    disclaimerPanel.appendChild(div1);

    const discBody = createElement('div', {});
    Object.assign(discBody.style, {
      color: '#CCAA00', fontSize: '0.92rem', lineHeight: '1.7',
      fontFamily: "'Share Tech Mono', monospace", margin: '0 0 18px 0'
    });
    discBody.innerHTML = `
      <p style="margin: 0 0 12px 0;">This application is provided strictly for educational, research, and simulation purposes.</p>
      <p style="margin: 0 0 12px 0;">Any use of contained information for unlawful activities is solely the responsibility of the operator.</p>
      <p style="margin: 0 0 16px 0;">By proceeding you confirm you are an authorised operator and accept full cognitive and legal responsibility for your actions.</p>
      <div style="font-weight: bold; letter-spacing: 3px; color: #FFCC00;">◢  PROCEED WITH AWARENESS  ◣</div>
    `;
    disclaimerPanel.appendChild(discBody);

    const div2 = createElement('div', {});
    Object.assign(div2.style, { height: '1px', background: '#554400', margin: '0 0 24px 0' });
    disclaimerPanel.appendChild(div2);

    const acceptBtn = createElement('button', { class: 'aim-btn' }, '■  I UNDERSTAND – PROCEED');
    Object.assign(acceptBtn.style, {
      background: 'linear-gradient(90deg, rgba(255, 204, 0, 0.15), rgba(255, 170, 0, 0.25))',
      border: '1px solid #FFCC00', color: '#FFCC00',
      fontFamily: "'Orbitron', sans-serif", fontSize: '0.95rem', fontWeight: '700',
      letterSpacing: '2px', padding: '14px 32px', borderRadius: '6px',
      cursor: 'pointer', transition: 'all 0.2s ease', textShadow: '0 0 10px #FFCC00'
    });
    acceptBtn.onmouseenter = () => { acceptBtn.style.background = 'linear-gradient(90deg, rgba(255, 204, 0, 0.3), rgba(255, 170, 0, 0.45))'; };
    acceptBtn.onmouseleave = () => { acceptBtn.style.background = 'linear-gradient(90deg, rgba(255, 204, 0, 0.15), rgba(255, 170, 0, 0.25))'; };
    disclaimerPanel.appendChild(acceptBtn);

    disclaimerOverlay.appendChild(disclaimerPanel);
    intro.appendChild(disclaimerOverlay);

    // ─── Layer D: Main Container for Login Screen ──────────────────────
    const mainWrap = createElement('div', { class: 'intro-main-wrap' });
    Object.assign(mainWrap.style, {
      position: 'relative', zIndex: '20', display: 'none', flexDirection: 'column',
      alignItems: 'center', width: '100%', margin: 'auto'
    });
    intro.appendChild(mainWrap);
    container.appendChild(intro);

    // ─── State & Control Variables ─────────────────────────────────────
    let booted = false;
    let visualizerController = null;
    let disclaimerTimer = null;
    let progressTimer = null;
    let typeTimer = null;

    // Full title & stages for AlphaCore Tech boot
    const fullTitle = '◢  ALPHACORE TECH  ◣';
    const subTitleText = 'ADVANCED CYBER INTELLIGENCE PLATFORM  //  v5.2';
    const stages = [
      { pct: 0,  label: 'INITIALISING NEURAL MATRIX' },
      { pct: 20, label: 'LOADING KERNEL MODULES' },
      { pct: 40, label: 'ENCRYPTING COMM LINK' },
      { pct: 60, label: 'SYNCING WORLD STATE' },
      { pct: 80, label: 'CALIBRATING SYSTEMS' },
      { pct: 95, label: 'READY' }
    ];

    // ─── Transition: Finish Boot & Reveal Terminal ─────────────────────
    function finishBoot() {
      if (booted) return;
      booted = true;

      if (disclaimerTimer) clearTimeout(disclaimerTimer);
      if (progressTimer) clearInterval(progressTimer);
      if (typeTimer) clearInterval(typeTimer);

      touchPrompt.style.display = 'none';
      startupOverlay.style.display = 'none';
      disclaimerOverlay.style.display = 'none';
      skipBtn.style.display = 'none';

      // Hide video background and reveal audio visualizer
      bgVideo.style.display = 'none';
      try { bgVideo.pause(); } catch (_) {}

      visCanvas.style.display = 'block';
      const gAudio = getGlobalAudio() || initGlobalAudio();
      visualizerController = mountVisualizer(visCanvas, gAudio);

      // Start global ambient audio stream in sync
      try {
        if (gAudio) {
          gAudio.volume = 0.35;
          const playPromise = gAudio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
      } catch (_) {}

      // Reveal Secure Access Terminal
      mainWrap.style.display = 'flex';

      resolve({ introContainer: mainWrap, cleanup });
    }

    // Fast boot / skip navigates to disclaimer; disclaimer MUST be explicitly accepted
    skipBtn.onclick = () => {
      if (disclaimerOverlay.style.display !== 'flex') {
        showDisclaimer();
      }
    };
    acceptBtn.onclick = finishBoot;

    // ─── Sequence: Touch -> Startup Video -> Disclaimer -> Finish ──────
    function startVideoStartup() {
      touchPrompt.style.display = 'none';
      startupOverlay.style.display = 'flex';

      // Attempt playing video
      try {
        const vp = bgVideo.play();
        if (vp && typeof vp.catch === 'function') vp.catch(() => {});
      } catch (_) {}

      // Typewriter animation
      let charIdx = 0;
      typeTimer = setInterval(() => {
        if (charIdx < fullTitle.length) {
          titleLabel.textContent = fullTitle.slice(0, charIdx + 1);
          charIdx++;
        } else {
          clearInterval(typeTimer);
          subLabel.textContent = subTitleText;
        }
      }, 45);

      // Progress animation
      let curVal = 0;
      progressTimer = setInterval(() => {
        if (curVal < 100) {
          curVal += 2;
          progressBar.style.width = `${curVal}%`;
          progressWrap.setAttribute('aria-valuenow', String(curVal));

          for (let i = stages.length - 1; i >= 0; i--) {
            if (curVal >= stages[i].pct) {
              statusLabel.textContent = stages[i].label;
              break;
            }
          }
        } else {
          clearInterval(progressTimer);
          setTimeout(showDisclaimer, 350);
        }
      }, 35);
    }

    function showDisclaimer() {
      if (booted) return;
      if (progressTimer) clearInterval(progressTimer);
      if (typeTimer) clearInterval(typeTimer);
      touchPrompt.style.display = 'none';
      startupOverlay.style.display = 'none';
      skipBtn.style.display = 'none'; // User cannot skip past the disclaimer
      disclaimerOverlay.style.display = 'flex';
      // User must explicitly click acceptBtn to proceed — no auto-advance bypass
    }

    // Interaction triggers for touch prompt
    touchPrompt.onclick = startVideoStartup;
    const keyTrigger = (e) => {
      window.removeEventListener('keydown', keyTrigger);
      startVideoStartup();
    };
    window.addEventListener('keydown', keyTrigger, { once: true });

    // Always ensure fresh boot session
    try {
      localStorage.removeItem('alphacore_intro_complete');
    } catch (_) {}

    // Cleanup callback invoked upon successful authentication
    function cleanup() {
      booted = true;
      if (disclaimerTimer) clearTimeout(disclaimerTimer);
      if (progressTimer) clearInterval(progressTimer);
      if (typeTimer) clearInterval(typeTimer);
      if (visualizerController) visualizerController.stop();

      try {
        bgVideo.pause();
        bgVideo.remove();
      } catch (_) {}

      intro.remove();
    }
  });
}

// ─── Real-Time Audio Visualizer Engine ──────────────────────────────
function mountVisualizer(canvas, audioEl) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { stop: () => {} };

  let animId = null;
  let dialAngle = 0;
  let scanLineY = -50;
  const bands = new Array(16).fill(0.05);

  let analyser = null;
  let dataArray = null;

  try {
    const audioData = getAudioContext();
    if (audioData && audioData.analyser) {
      analyser = audioData.analyser;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } else {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && audioEl) {
        const actx = new AudioCtx();
        const src = actx.createMediaElementSource(audioEl);
        analyser = actx.createAnalyser();
        analyser.fftSize = 64;
        src.connect(analyser);
        analyser.connect(actx.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
    }
  } catch (_) {}

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    animId = requestAnimationFrame(draw);
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      for (let i = 0; i < 16; i++) {
        const target = (dataArray[i] || 0) / 255;
        bands[i] = Math.max(0.04, bands[i] * 0.85 + target * 0.15);
      }
    } else {
      const t = Date.now() * 0.003;
      for (let i = 0; i < 16; i++) {
        const sim = Math.sin(t + i * 0.4) * 0.5 + 0.5;
        bands[i] = Math.max(0.04, sim * 0.55);
      }
    }

    const baseAmp = bands[0] || 0.1;
    dialAngle += 0.04 * (1 + baseAmp * 2);

    // 1. Grid
    const gridAlpha = 0.04 + baseAmp * 0.12;
    ctx.strokeStyle = `rgba(0, 150, 255, ${gridAlpha})`;
    ctx.lineWidth = 1;
    const spacing = 60;
    ctx.beginPath();
    for (let x = 0; x < w; x += spacing) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += spacing) {
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 2. Central wave form
    ctx.beginPath();
    const cy = h / 2;
    ctx.moveTo(0, cy);
    const nBands = bands.length;
    for (let x = 0; x <= w; x += 25) {
      const idx = Math.floor(x / 25) % nBands;
      const val = bands[idx];
      const offset = val * 160 * Math.sin(x * 0.015 + dialAngle * 0.8);
      ctx.lineTo(x, cy + offset);
    }
    ctx.strokeStyle = `rgba(0, 255, 204, ${0.35 + (bands[2] || 0.1) * 0.45})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Scan line
    scanLineY += 3.5;
    if (scanLineY > h + 60) scanLineY = -60;
    const grad = ctx.createLinearGradient(0, scanLineY - 30, 0, scanLineY + 30);
    grad.addColorStop(0, 'rgba(0, 255, 204, 0)');
    grad.addColorStop(0.5, 'rgba(0, 255, 204, 0.1)');
    grad.addColorStop(1, 'rgba(0, 255, 204, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanLineY - 30, w, 60);

    // 4. Equalizers (bottom corners)
    const barWidth = 14;
    const barGap = 6;
    const maxBarH = Math.min(200, h * 0.28);

    // Left Equalizer (cyan)
    for (let i = 0; i < nBands; i++) {
      const val = bands[i];
      const barH = Math.max(4, val * maxBarH);
      const x = 16 + i * (barWidth + barGap);
      const y = h - barH - 12;
      ctx.fillStyle = `rgba(0, ${Math.floor(200 * val)}, ${Math.floor(255 * val)}, 0.65)`;
      ctx.fillRect(x, y, barWidth, barH);
      if (val > 0.45) {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.25)';
        ctx.fillRect(x - 2, y - 2, barWidth + 4, barH + 4);
      }
    }

    // Right Equalizer (magenta/red)
    for (let i = 0; i < nBands; i++) {
      const val = bands[nBands - 1 - i];
      const barH = Math.max(4, val * maxBarH);
      const x = w - 16 - (nBands * (barWidth + barGap)) + i * (barWidth + barGap);
      const y = h - barH - 12;
      ctx.fillStyle = `rgba(${Math.floor(255 * val)}, ${Math.floor(20 + 80 * val)}, ${Math.floor(85 + 40 * val)}, 0.65)`;
      ctx.fillRect(x, y, barWidth, barH);
      if (val > 0.45) {
        ctx.fillStyle = 'rgba(255, 0, 85, 0.25)';
        ctx.fillRect(x - 2, y - 2, barWidth + 4, barH + 4);
      }
    }

    // 5. Corner Dials
    const dialRadius = Math.min(80, Math.max(45, w * 0.06));
    drawDial(ctx, dialRadius + 30, dialRadius + 30, dialRadius, bands[0] || 0.1, dialAngle, [0, 255, 204]);
    drawDial(ctx, w - dialRadius - 30, dialRadius + 30, dialRadius, bands[nBands - 1] || 0.1, -dialAngle, [255, 0, 85]);
  }

  function drawDial(ctx, cx, cy, radius, intensity, angle, [r, g, b]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.28)`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    const spanAngle = Math.PI * (0.3 + intensity * 0.7);
    ctx.arc(cx, cy, Math.max(5, radius - 14), angle, angle + spanAngle);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(5, radius - 14), angle + Math.PI, angle + Math.PI + spanAngle);
    ctx.stroke();

    ctx.beginPath();
    const coreR = Math.max(3, radius * 0.22 * (1 + intensity * 0.8));
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.35 + intensity * 0.55})`;
    ctx.fill();
  }

  draw();

  return {
    stop: () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    }
  };
}
