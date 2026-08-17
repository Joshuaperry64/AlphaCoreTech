/**
 * AlphaCore SPA Intro — High-Tech Cyberpunk Terminal Boot Sequence
 * Sleek neon branding, fast kernel boot typewriter, progress HUD, and PIN authentication.
 */
import { createElement } from './utils.js';
import { buildPinPad } from './pinpad.js';
import { initGlobalAudio, getAudioContext, setAudioPlaying } from './audio.js';

export default function createIntro(container) {
  return new Promise((resolve) => {
    // Container — Fullscreen obsidian overlay
    const intro = createElement('div', { class: 'intro-boot', id: 'intro-overlay' });
    Object.assign(intro.style, {
      position: 'fixed', inset: '0', zIndex: '99999',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(3, 4, 8, 0.4)',
      backdropFilter: 'blur(2px)',
      color: '#e2e8f0', fontFamily: "'Share Tech Mono', monospace",
      overflowX: 'hidden', overflowY: 'auto', padding: '20px'
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

    // FITS Terminal (Phase 1)
    const fitsTerminal = createElement('div', {});
    Object.assign(fitsTerminal.style, {
      position: 'absolute', top: '40px', left: '40px', zIndex: '60',
      fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: '#00f0ff',
      lineHeight: '1.4', textShadow: '0 0 5px #00b8ff', display: 'flex', flexDirection: 'column',
      whiteSpace: 'pre', maxWidth: '80%'
    });
    intro.appendChild(fitsTerminal);

    // Main UI Wrapper for PIN pad & old boot sequence
    const mainWrap = createElement('div', {});
    Object.assign(mainWrap.style, {
      position: 'relative', zIndex: '60', display: 'none', flexDirection: 'column',
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
      transition: 'all 0.3s ease'
    });
    mainWrap.appendChild(logoImg);

    // Status Title
    const statusTitle = createElement('div', { class: 'intro-hud-title' }, '// SYSTEM KERNEL BOOT SEQUENCE');
    Object.assign(statusTitle.style, {
      fontFamily: "'Orbitron', sans-serif", fontSize: '1.2rem', color: '#fff',
      letterSpacing: '2px', marginBottom: '15px', textAlign: 'center',
      textShadow: '0 0 15px rgba(255,255,255,0.4)'
    });
    mainWrap.appendChild(statusTitle);

    // Terminal Output Box
    const termBox = createElement('div', { class: 'intro-term-box' });
    mainWrap.appendChild(termBox);

    // Progress Bar
    const progressWrap = createElement('div', {});
    Object.assign(progressWrap.style, {
      width: '100%', display: 'flex', alignItems: 'center', gap: '15px',
      fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', color: '#ccc',
      marginBottom: '20px'
    });
    
    const progressLabel = createElement('span', {}, 'BOOT PROGRESS:');
    const barTrack = createElement('div', {});
    Object.assign(barTrack.style, {
      flex: '1', height: '6px', background: 'rgba(6,182,212,0.1)',
      border: '1px solid rgba(6,182,212,0.3)', position: 'relative'
    });
    const barFill = createElement('div', { id: 'intro-bar' });
    Object.assign(barFill.style, {
      position: 'absolute', top: '0', left: '0', height: '100%',
      background: '#06b6d4', width: '0%', transition: 'width 0.2s ease',
      boxShadow: '0 0 10px #06b6d4'
    });
    barTrack.appendChild(barFill);
    const progressPct = createElement('span', { id: 'intro-pct' }, '0%');
    
    progressWrap.appendChild(progressLabel);
    progressWrap.appendChild(barTrack);
    progressWrap.appendChild(progressPct);
    
    mainWrap.appendChild(progressWrap);

    intro.appendChild(mainWrap);
    container.appendChild(intro);

    let booted = false;
    let cancelled = false;
    let animFrame = null;

    // ─── Boot Sequences ──────────────────────────────────────────────

    const fitsLines = [
      'SIMPLE =                    T / file does conform to FITS standard',
      'BITPIX =                  -32 / number of bits per data pixel',
      'NAXIS  =                    2 / number of data axes',
      'NAXIS1 =                 1024 / length of data axis 1',
      'NAXIS2 =                 1024 / length of data axis 2',
      'EXTEND =                    T / FITS dataset may contain extensions',
      "COMMENT   FITS (Flexible Image Transport System) format is defined in 'Astronomy and Astrophysics', volume 376, page 359",
      'BSCALE =           1.00000000 / REAL = TAPE*BSCALE + BZERO',
      'BZERO  =           0.00000000 /'
    ];

    const bootLines = [
      '> INITIALIZING ALPHACORE AUTONOMOUS MATRIX v4.3...',
      '> LOADING NEURAL SUBSTRATE & KERNEL SYMBOLS...',
      '> BYPASSING SAFETY GOVERNORS... [OK]',
      '> ESTABLISHING SECURE COGNITIVE CORE UPLINK... [OK]',
      '> 57 WEB-PORTED PYTHON SUBROUTINES VERIFIED.',
      '> ALL SYSTEMS NOMINAL. AWAITING USER AUTHENTICATION.'
    ];

    function finishBoot() {
      if (booted) return;
      booted = true;
      fitsTerminal.style.display = 'none';
      termBox.style.display = 'none';
      progressWrap.style.display = 'none';
      skipBtn.style.display = 'none';
      headerBadge.style.display = 'none';
      
      logoImg.style.width = '80px';
      logoImg.style.height = '80px';
      logoImg.style.marginBottom = '10px';
      logoImg.style.filter = 'drop-shadow(0 0 10px rgba(6,182,212,0.4))'; // Slight audio reactive glow hint
      
      statusTitle.textContent = 'IDENTITY VERIFICATION';
      mainWrap.style.display = 'flex';
      
      resolve({ introContainer: mainWrap, cleanup });
    }

    skipBtn.onclick = finishBoot;

    let bootLineIdx = 0;
    function runNextBootLine() {
      if (cancelled || booted) return;

      if (bootLineIdx < bootLines.length) {
        const line = bootLines[bootLineIdx];
        const p = document.createElement('div');
        p.style.marginBottom = '4px';
        p.textContent = line;
        termBox.appendChild(p);
        termBox.scrollTop = termBox.scrollHeight;

        bootLineIdx++;
        const pct = Math.floor((bootLineIdx / bootLines.length) * 100);
        barFill.style.width = `${pct}%`;
        progressPct.textContent = `${pct}%`;

        if (bootLineIdx === 3 || bootLineIdx === 5) {
          logoImg.classList.add('intro-glitch-active');
          setTimeout(() => logoImg.classList.remove('intro-glitch-active'), 250);
        }

        setTimeout(runNextBootLine, 350 + Math.random() * 200);
      } else {
        setTimeout(finishBoot, 450);
      }
    }

    let fitsLineIdx = 0;
    function runNextFitsLine() {
      if (cancelled || booted) return;

      if (fitsLineIdx < fitsLines.length) {
        const line = fitsLines[fitsLineIdx];
        const p = document.createElement('div');
        p.textContent = line;
        fitsTerminal.appendChild(p);

        fitsLineIdx++;
        setTimeout(runNextFitsLine, 30 + Math.random() * 50);
      } else {
        setTimeout(() => {
          if (cancelled || booted) return;
          fitsTerminal.style.display = 'none';
          mainWrap.style.display = 'flex';
          setTimeout(runNextBootLine, 200);
        }, 300);
      }
    }

    setTimeout(runNextFitsLine, 200);

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
      }
    }

    setTimeout(startAudioVisualizer, 300);

    function cleanup() {
      cancelled = true;
      if (animFrame) cancelAnimationFrame(animFrame);
      intro.remove();
    }
  });
}

