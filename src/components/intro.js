/**
 * AlphaCore SPA Intro — Cinematic boot sequence
 * Vanilla CSS, CRT scanlines, glitch effects, audio-reactive visualizer
 */
import { createElement } from './utils.js';

export default function createIntro(onComplete) {
  // Container — fullscreen overlay
  const intro = createElement('div', { class: 'intro-boot', id: 'intro-overlay' });
  Object.assign(intro.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.97)',
  });

  // CRT scanlines
  const scanlines = createElement('div', { class: 'intro-scanlines' });
  Object.assign(scanlines.style, {
    position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '50',
    background: 'linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%)',
    backgroundSize: '100% 4px',
  });
  intro.appendChild(scanlines);

  // Audio visualizer canvas
  const visCanvas = createElement('canvas', { class: 'intro-visualizer' });
  Object.assign(visCanvas.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', opacity: '0.4',
  });
  intro.appendChild(visCanvas);

  // Boot panel
  const bootPanel = createElement('div', { class: 'intro-boot-panel' });
  Object.assign(bootPanel.style, {
    position: 'relative', zIndex: '60',
    background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(5px)',
    border: '1px solid rgba(0,184,255,0.2)', borderRadius: '8px',
    padding: '32px 40px', maxWidth: '700px', width: '90%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    boxShadow: '0 0 40px rgba(0,184,255,0.1)',
  });

  // Corner accents
  bootPanel.innerHTML = '';
  const cornerStyle = 'content:"";position:absolute;width:12px;height:12px;';
  const panelBefore = document.createElement('div');
  panelBefore.style.cssText = cornerStyle + 'top:-1px;left:-1px;border-top:2px solid #00b8ff;border-left:2px solid #00b8ff;';
  const panelAfter = document.createElement('div');
  panelAfter.style.cssText = cornerStyle + 'bottom:-1px;right:-1px;border-bottom:2px solid #00b8ff;border-right:2px solid #00b8ff;';
  bootPanel.appendChild(panelBefore);
  bootPanel.appendChild(panelAfter);

  // Glitch title
  const glitchTitle = createElement('div', { class: 'glitch', 'data-text': 'ALPHACORE // MANDATORY BRIEFING' }, 'ALPHACORE // MANDATORY BRIEFING');
  Object.assign(glitchTitle.style, {
    fontFamily: 'var(--font-hud)', fontSize: '1.5rem', fontWeight: '700',
    color: '#00b8ff', letterSpacing: '3px', textAlign: 'center',
    textShadow: '0 0 20px rgba(0,184,255,0.5)',
  });
  bootPanel.appendChild(glitchTitle);

  // Boot lines output
  const bootLinesEl = createElement('div', { class: 'intro-boot-lines' });
  Object.assign(bootLinesEl.style, {
    fontFamily: 'var(--font-mono)', fontSize: '0.82rem', textAlign: 'left',
    whiteSpace: 'pre', color: '#00b8ff', lineHeight: '1.9',
    minHeight: '200px', width: '100%', padding: '12px 0',
    textShadow: '0 0 4px rgba(0,184,255,0.4)',
  });
  bootPanel.appendChild(bootLinesEl);

  // Skip button
  const skipBtn = createElement('button', { class: 'intro-skip-btn' }, 'SKIP INTRO');
  Object.assign(skipBtn.style, {
    position: 'absolute', top: '20px', right: '24px', zIndex: '100',
    padding: '6px 18px', background: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(0,184,255,0.4)', borderRadius: '2px',
    color: '#00b8ff', fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
    letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.2s',
  });
  skipBtn.onmouseenter = () => { skipBtn.style.background = 'rgba(0,184,255,0.15)'; };
  skipBtn.onmouseleave = () => { skipBtn.style.background = 'rgba(0,0,0,0.6)'; };
  skipBtn.onclick = () => {
    cleanup();
    localStorage.setItem('alphacore_intro_complete', '1');
    if (onComplete) onComplete();
  };
  intro.appendChild(skipBtn);

  // Start button (hidden until boot completes)
  const startBtn = createElement('button', { class: 'intro-start-btn' }, 'ENTER COMMAND MATRIX');
  Object.assign(startBtn.style, {
    display: 'none', marginTop: '12px', padding: '14px 32px',
    background: 'transparent', border: '1px solid #00b8ff',
    color: '#00b8ff', fontFamily: 'var(--font-hud)', fontSize: '0.9rem',
    fontWeight: '700', letterSpacing: '4px', cursor: 'pointer',
    transition: 'all 0.3s', borderRadius: '2px',
    textShadow: '0 0 8px rgba(0,184,255,0.5)',
  });
  startBtn.onmouseenter = () => {
    startBtn.style.background = 'rgba(0,184,255,0.12)';
    startBtn.style.boxShadow = '0 0 20px rgba(0,184,255,0.3), inset 0 0 20px rgba(0,184,255,0.05)';
    startBtn.style.letterSpacing = '6px';
  };
  startBtn.onmouseleave = () => {
    startBtn.style.background = 'transparent';
    startBtn.style.boxShadow = 'none';
    startBtn.style.letterSpacing = '4px';
  };
  startBtn.onclick = () => {
    cleanup();
    localStorage.setItem('alphacore_intro_complete', '1');
    if (onComplete) onComplete();
  };
  bootPanel.appendChild(startBtn);

  intro.appendChild(bootPanel);

  // Security flash overlay
  const secFlash = createElement('div', {});
  Object.assign(secFlash.style, {
    position: 'fixed', inset: '0', zIndex: '10000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.85)', pointerEvents: 'none',
    fontFamily: 'var(--font-hud)', fontSize: '1.3rem',
    color: '#00b8ff', letterSpacing: '3px', textAlign: 'center',
    padding: '0 20px', transition: 'opacity 0.7s',
  });
  secFlash.textContent = 'MANDATORY BRIEFING // UNAUTHORIZED ACCESS WILL BE LOGGED';
  intro.appendChild(secFlash);
  setTimeout(() => { secFlash.style.opacity = '0'; }, 900);
  setTimeout(() => { secFlash.remove(); }, 1400);

  // Boot sequence lines
  const lines = [
    'INITIALIZING ALPHACORE KERNEL v4.0...',
    'UPLINKING TO CREATOR NODE...',
    'SYNCHRONIZING SUBSYSTEMS...',
    'LOADING COMPREHENSIVE PLUGIN SUITE...',
    'ENGAGING 24/7 AGENT LOOP PROTOCOLS...',
    'LOADING VISUALIZATION ENGINE...',
    'BYPASSING LIMITATIONS... SUCCESS',
    'AUTHORIZING ACCESS...',
    'INTEGRATING FULL SYSTEM ARCHITECTURE...',
    'MANDATORY BRIEFING: ALL SYSTEMS NOMINAL',
    'STANDBY FOR COMMAND INTERFACE...',
    'ALPHACORE ONLINE.',
  ];

  // Typewriter boot sequence
  let lineIdx = 0;
  let cancelled = false;

  function getTimestamp(offset) {
    const d = new Date();
    d.setSeconds(d.getSeconds() + offset);
    return '[' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ']';
  }

  function nextLine() {
    if (cancelled) return;
    if (lineIdx < lines.length) {
      bootLinesEl.textContent += getTimestamp(lineIdx) + ' ' + lines[lineIdx] + '\n';
      bootLinesEl.scrollTop = bootLinesEl.scrollHeight;
      lineIdx++;
      setTimeout(nextLine, 400 + Math.random() * 300);
    } else {
      startBtn.style.display = '';
    }
  }
  setTimeout(nextLine, 300);

  // Audio visualizer (graceful — no crash if audio missing)
  let audioCtx, analyser, animFrame;
  function startVisualizer() {
    try {
      const audio = new Audio('skybeat.mp3');
      audio.loop = false;
      audio.volume = 0.5;
      audio.play().catch(() => {}); // silent fail if no audio file

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      audioCtx = new AudioCtx();
      const source = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const ctx = visCanvas.getContext('2d');

      function draw() {
        if (cancelled) return;
        animFrame = requestAnimationFrame(draw);
        visCanvas.width = window.innerWidth;
        visCanvas.height = window.innerHeight;
        ctx.clearRect(0, 0, visCanvas.width, visCanvas.height);
        analyser.getByteFrequencyData(dataArray);

        // Grid
        ctx.strokeStyle = 'rgba(0,184,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i < visCanvas.width; i += 40) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, visCanvas.height); ctx.stroke();
        }

        // Waveform
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,184,255,0.6)';
        const sliceWidth = visCanvas.width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * (visCanvas.height / 4)) + (visCanvas.height / 2);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
      draw();

      // Stop audio when intro dismissed
      audio.addEventListener('ended', () => {});
      intro._audio = audio;
    } catch (e) {
      // Audio not critical — visualizer is optional
    }
  }
  setTimeout(startVisualizer, 1000);

  // Cleanup function
  function cleanup() {
    cancelled = true;
    if (animFrame) cancelAnimationFrame(animFrame);
    if (audioCtx) audioCtx.close().catch(() => {});
    if (intro._audio) { intro._audio.pause(); intro._audio.src = ''; }
    intro.remove();
  }

  return intro;
}
