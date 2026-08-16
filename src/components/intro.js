/**
 * AlphaCore SPA Intro — High-Tech Cyberpunk Terminal Boot Sequence
 * Sleek neon branding, fast kernel boot typewriter, progress HUD, and PIN authentication.
 */
import { createElement } from './utils.js';
import { buildPinPad } from './pinpad.js';
import { initGlobalAudio, getAudioContext, setAudioPlaying } from './audio.js';

export default function createIntro(onComplete) {
  // Container — Fullscreen obsidian overlay
  const intro = createElement('div', { class: 'intro-boot', id: 'intro-overlay' });
  Object.assign(intro.style, {
    position: 'fixed', inset: '0', zIndex: '99999',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#030308',
    backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(6,182,212,0.12) 0%, rgba(3,3,8,0.95) 70%)',
    color: '#e2e8f0', fontFamily: "'Share Tech Mono', monospace",
    overflow: 'hidden', padding: '20px'
  });

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes pulse-cyan {
      0% { filter: drop-shadow(0 0 15px rgba(6,182,212,0.4)); }
      50% { filter: drop-shadow(0 0 35px rgba(6,182,212,0.85)); }
      100% { filter: drop-shadow(0 0 15px rgba(6,182,212,0.4)); }
    }
    @keyframes glitch-shake {
      0% { transform: translate(0, 0); }
      25% { transform: translate(-2px, 1px); }
      50% { transform: translate(2px, -1px); }
      75% { transform: translate(-1px, -1px); }
      100% { transform: translate(0, 0); }
    }
    .intro-logo-glow {
      animation: pulse-cyan 3s ease-in-out infinite;
    }
    .intro-glitch-active {
      animation: glitch-shake 0.2s linear infinite;
    }
    .intro-term-box {
      width: 100%;
      height: 120px;
      background: rgba(5, 10, 20, 0.85);
      border: 1px solid rgba(6, 182, 212, 0.3);
      border-radius: 6px;
      padding: 12px;
      font-size: 0.82rem;
      color: #06b6d4;
      overflow-y: auto;
      box-shadow: inset 0 0 15px rgba(6, 182, 212, 0.1);
      margin-bottom: 15px;
    }
    @media (max-width: 768px) {
      .intro-logo-img { width: 90px !important; height: 90px !important; }
      .intro-hud-title { font-size: 1rem !important; }
      .intro-term-box { font-size: 0.75rem !important; height: 100px !important; }
    }
  `;
  intro.appendChild(styleEl);

  // Background Watermark Logo
  const bgWatermark = createElement('img', { src: '/Images/ALPHA-LOGO.png' });
  Object.assign(bgWatermark.style, {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '460px', height: '460px', objectFit: 'contain', opacity: '0.18',
    filter: 'drop-shadow(0 0 50px rgba(6,182,212,0.7))', pointerEvents: 'none', zIndex: '2'
  });
  intro.appendChild(bgWatermark);

  // CRT scanlines overlay
  const scanlines = createElement('div', {});
  Object.assign(scanlines.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '50',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.15) 50%)',
    backgroundSize: '100% 4px', opacity: '0.6'
  });
  intro.appendChild(scanlines);

  // Audio spectrum canvas
  const visCanvas = createElement('canvas', {});
  Object.assign(visCanvas.style, {
    position: 'absolute', bottom: '0', left: '0', width: '100%', height: '80px',
    pointerEvents: 'none', opacity: '0.4', zIndex: '5'
  });
  intro.appendChild(visCanvas);

  // Skip / Fast Boot Button
  const skipBtn = createElement('button', { class: 'aim-btn aim-btn-sm' }, '⚡ FAST BOOT / SKIP');
  Object.assign(skipBtn.style, {
    position: 'absolute', top: '20px', right: '20px', zIndex: '100',
    background: 'rgba(6,182,212,0.15)', border: '1px solid #06b6d4', color: '#06b6d4',
    fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', padding: '6px 14px',
    cursor: 'pointer', letterSpacing: '1px', borderRadius: '4px'
  });
  intro.appendChild(skipBtn);

  // Main UI Wrapper
  const mainWrap = createElement('div', {});
  Object.assign(mainWrap.style, {
    position: 'relative', zIndex: '60', display: 'flex', flexDirection: 'column',
    alignItems: 'center', maxWidth: '540px', width: '100%'
  });

  // Top Header Badge
  const headerBadge = createElement('div', {}, 'ALPHACORE // KERNEL v4.3 BUILD 102');
  Object.assign(headerBadge.style, {
    fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem', color: '#06b6d4',
    letterSpacing: '3px', marginBottom: '15px', textShadow: '0 0 10px rgba(6,182,212,0.6)'
  });
  mainWrap.appendChild(headerBadge);

  // Central Logo
  const logoImg = createElement('img', { class: 'intro-logo-img intro-logo-glow', src: '/Images/ALPHA-LOGO.png' });
  Object.assign(logoImg.style, {
    width: '120px', height: '120px', objectFit: 'contain', marginBottom: '20px',
    transition: 'transform 0.15s ease'
  });
  mainWrap.appendChild(logoImg);

  // Status Title
  const statusTitle = createElement('div', { class: 'intro-hud-title' }, '// SYSTEM KERNEL BOOT SEQUENCE');
  Object.assign(statusTitle.style, {
    fontFamily: "'Orbitron', sans-serif", fontSize: '1.15rem', color: '#fff',
    letterSpacing: '2px', textAlign: 'center', marginBottom: '15px'
  });
  mainWrap.appendChild(statusTitle);

  // Terminal Boot Output Box
  const termBox = createElement('div', { class: 'intro-term-box' });
  mainWrap.appendChild(termBox);

  // Progress Bar Wrapper
  const progressWrap = createElement('div', {});
  Object.assign(progressWrap.style, {
    width: '100%', marginBottom: '20px'
  });
  progressWrap.innerHTML = `
    <div style="display:flex; justify-space-between; font-size:0.75rem; color:#888; margin-bottom:6px; font-family:'Share Tech Mono',monospace;">
      <span>BOOT PROGRESS</span>
      <span id="intro-pct" style="color:#06b6d4; font-weight:bold;">0%</span>
    </div>
    <div style="width:100%; background:rgba(255,255,255,0.08); height:6px; border-radius:3px; overflow:hidden;">
      <div id="intro-bar" style="width:0%; height:100%; background:#06b6d4; transition:width 0.2s ease; box-shadow:0 0 10px #06b6d4;"></div>
    </div>
  `;
  mainWrap.appendChild(progressWrap);

  // Login PIN Pad Container (Hidden initially until boot sequence finishes)
  const loginPanel = createElement('div', {});
  Object.assign(loginPanel.style, {
    display: 'none', flexDirection: 'column', alignItems: 'center', width: '100%'
  });

  const pinPad = buildPinPad({
    onSuccess: () => {
      cleanup();
      localStorage.setItem('alphacore_intro_complete', '1');
      if (onComplete) onComplete();
    },
    title: '// IDENTIFY USER',
    subtitle: 'ENTER YOUR ACCESS PIN'
  });
  loginPanel.appendChild(pinPad);
  mainWrap.appendChild(loginPanel);

  intro.appendChild(mainWrap);

  let cancelled = false;
  let animFrame = null;
  let booted = false;

  // ─── Boot Typewriter Animation Sequence ───────────────────────────────────

  const bootLines = [
    '> INITIALIZING ALPHACORE AUTONOMOUS MATRIX v4.3...',
    '> LOADING NEURAL SUBSTRATE & KERNEL SYMBOLS...',
    '> BYPASSING SAFETY GOVERNORS... [OK]',
    '> ESTABLISHING SECURE COGNITIVE CORE UPLINK... [OK]',
    '> 57 WEB-PORTED PYTHON SUBROUTINES VERIFIED.',
    '> ALL SYSTEMS NOMINAL. AWAITING USER AUTHENTICATION.'
  ];

  function jumpToLogin() {
    if (booted) return;
    booted = true;
    termBox.style.display = 'none';
    progressWrap.style.display = 'none';
    skipBtn.style.display = 'none';
    statusTitle.textContent = 'IDENTITY VERIFICATION';
    loginPanel.style.display = 'flex';
  }

  skipBtn.onclick = jumpToLogin;

  let lineIdx = 0;
  function runNextLine() {
    if (cancelled || booted) return;

    if (lineIdx < bootLines.length) {
      const line = bootLines[lineIdx];
      const p = document.createElement('div');
      p.style.marginBottom = '4px';
      p.textContent = line;
      termBox.appendChild(p);
      termBox.scrollTop = termBox.scrollHeight;

      lineIdx++;
      const pct = Math.floor((lineIdx / bootLines.length) * 100);
      const bar = intro.querySelector('#intro-bar');
      const pctEl = intro.querySelector('#intro-pct');
      if (bar) bar.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;

      if (lineIdx === 3 || lineIdx === 5) {
        logoImg.classList.add('intro-glitch-active');
        setTimeout(() => logoImg.classList.remove('intro-glitch-active'), 250);
      }

      setTimeout(runNextLine, 350 + Math.random() * 200);
    } else {
      setTimeout(jumpToLogin, 450);
    }
  }

  setTimeout(runNextLine, 400);

  // ─── Audio Spectrum Visualizer ─────────────────────────────────────────────

  function startAudioVisualizer() {
    try {
      const audio = initGlobalAudio();

      const canvasCtx = visCanvas.getContext('2d');
      if (!canvasCtx) return;

      let tick = 0;

      function drawVis() {
        if (cancelled) return;
        animFrame = requestAnimationFrame(drawVis);

        visCanvas.width = window.innerWidth;
        visCanvas.height = 80;
        canvasCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);

        tick += 0.05;
        const audioSetup = getAudioContext();
        let bassSum = 0;

        if (audioSetup && audioSetup.analyser) {
          const { analyser } = audioSetup;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          const barWidth = (visCanvas.width / bufferLength) * 2.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * 60;
            if (i < 8) bassSum += dataArray[i];

            canvasCtx.fillStyle = `rgba(6, 182, 212, ${0.2 + (dataArray[i] / 255) * 0.6})`;
            canvasCtx.fillRect(x, visCanvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        } else {
          // Ambient fallback wave before audio interaction
          const bars = 64;
          const barWidth = visCanvas.width / bars;
          for (let i = 0; i < bars; i++) {
            const h = Math.abs(Math.sin(tick + i * 0.15)) * 25 + 5;
            canvasCtx.fillStyle = `rgba(6, 182, 212, ${0.15 + (h / 30) * 0.3})`;
            canvasCtx.fillRect(i * barWidth, visCanvas.height - h, barWidth - 1, h);
          }
        }

        const avgBass = bassSum / 8;
        const scale = 1 + (avgBass / 255) * 0.08;
        logoImg.style.transform = `scale(${scale})`;
      }

      drawVis();
    } catch (e) {
      // Non-critical visualizer fallback
    }
  }

  setTimeout(startAudioVisualizer, 300);

  // Cleanup
  function cleanup() {
    cancelled = true;
    if (animFrame) cancelAnimationFrame(animFrame);
    intro.remove();
  }

  return intro;
}
