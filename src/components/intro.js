/**
 * AlphaCore SPA Intro — Cinematic boot sequence
 * Vanilla CSS, CRT scanlines, glitch effects, audio-reactive visualizer
 */
import { createElement } from './utils.js';
import { buildPinPad, getPins } from './pinpad.js';
import { initGlobalAudio, getAudioContext, setAudioPlaying } from './audio.js';

export default function createIntro(onComplete) {
  // Container — fullscreen overlay
  const intro = createElement('div', { class: 'intro-boot', id: 'intro-overlay' });
  Object.assign(intro.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundImage: 'url(/alpha-tech.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  });

  // Dark overlay so text stays readable over the background image
  const bgOverlay = document.createElement('div');
  Object.assign(bgOverlay.style, {
    position: 'absolute', inset: '0', background: 'rgba(0,0,0,0.72)', zIndex: '1',
    pointerEvents: 'none',
  });
  intro.appendChild(bgOverlay);


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

  const enterBtn = createElement('button', { class: 'aim-btn aim-btn-accept' }, 'ENTER COMMAND MATRIX');
  Object.assign(enterBtn.style, {
    display: 'none', margin: '30px auto 0 auto', width: 'fit-content', fontSize: '1.2rem', padding: '15px 30px', letterSpacing: '2px'
  });
  
  // Mobile Warning Panel (hidden initially)
  const mobileWarningPanel = createElement('div', { class: 'intro-mobile-warning' });
  Object.assign(mobileWarningPanel.style, {
    display: 'none', flexDirection: 'column', alignItems: 'center', marginTop: '20px',
    textAlign: 'center', background: 'rgba(255, 0, 0, 0.1)', padding: '20px', 
    border: '1px solid var(--accent)', borderRadius: '8px',
    animation: 'fade-in 1.5s forwards'
  });
  const mobileWarningText = createElement('p', {}, 'MOBILE VIEW STILL IN DEVELOPMENT. WEBSITE FUNCTIONS AND VIEWS MAY NOT FUNCTION AS INTENDED OR APPEAR CORRECTLY.');
  Object.assign(mobileWarningText.style, {
    color: 'var(--accent)', fontFamily: 'var(--font-hud)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5'
  });
  mobileWarningPanel.appendChild(mobileWarningText);
  
  const continueBtn = createElement('button', { class: 'aim-btn' }, 'CONTINUE (5s)');
  Object.assign(continueBtn.style, { borderColor: 'var(--accent)', color: 'var(--accent)' });
  mobileWarningPanel.appendChild(continueBtn);
  bootPanel.appendChild(mobileWarningPanel);

  enterBtn.onclick = () => {
    bootLinesEl.style.display = 'none';
    enterBtn.style.display = 'none';
    glitchTitle.style.display = 'none';
    
    if (window.innerWidth <= 768) {
      mobileWarningPanel.style.display = 'flex';
      let countdown = 5;
      const interval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(interval);
          mobileWarningPanel.style.display = 'none';
          loginPanel.style.display = 'flex';
        } else {
          continueBtn.textContent = `CONTINUE (${countdown}s)`;
        }
      }, 1000);
      continueBtn.onclick = () => {
        clearInterval(interval);
        mobileWarningPanel.style.display = 'none';
        loginPanel.style.display = 'flex';
      };
    } else {
      loginPanel.style.display = 'flex';
    }
  };
  bootPanel.appendChild(enterBtn);

  // Login panel (hidden until boot completes)
  const loginPanel = createElement('div', { class: 'intro-login-panel' });
  Object.assign(loginPanel.style, {
    display: 'none', flexDirection: 'column', alignItems: 'center', marginTop: '20px',
    animation: 'fade-in 1.5s forwards'
  });

  const titleEl = createElement('h2', {}, 'IDENTIFY USER');
  Object.assign(titleEl.style, {
    fontFamily: 'var(--font-hud)', color: 'var(--blue)', fontSize: '1.2rem',
    letterSpacing: '4px', marginBottom: '15px', textShadow: '0 0 8px rgba(0,184,255,0.5)'
  });
  loginPanel.appendChild(titleEl);

  const pinPadContainer = createElement('div');
  Object.assign(pinPadContainer.style, {
    transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-40px'
  });
  
  const pinPad = buildPinPad({
    onSuccess: (res) => {
      cleanup();
      localStorage.setItem('alphacore_intro_complete', '1');
      if (onComplete) onComplete();
    },
    title: '// USER_AUTHENTICATION',
    subtitle: 'PLEASE ENTER YOUR PIN'
  });
  pinPadContainer.appendChild(pinPad);
  loginPanel.appendChild(pinPadContainer);

  const guestBtn = createElement('button', { class: 'aim-btn' }, 'SKIP LOGIN');
  Object.assign(guestBtn.style, {
    marginTop: '35px', padding: '10px 24px', background: 'transparent',
    borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem',
    letterSpacing: '2px'
  });
  guestBtn.onmouseenter = () => { guestBtn.style.color = '#fff'; guestBtn.style.borderColor = '#fff'; };
  guestBtn.onmouseleave = () => { guestBtn.style.color = 'rgba(255,255,255,0.7)'; guestBtn.style.borderColor = 'rgba(255,255,255,0.3)'; };
  guestBtn.onclick = () => {
    sessionStorage.setItem('current_profile', 'Guest');
    cleanup();
    localStorage.setItem('alphacore_intro_complete', '1');
    if (onComplete) onComplete();
  };
  loginPanel.appendChild(guestBtn);

  bootPanel.appendChild(loginPanel);

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
      enterBtn.style.display = 'block';
    }
  }
  setTimeout(nextLine, 300);

  // Audio visualizer (graceful — no crash if audio missing)
  let animFrame;

  function startVisualizer() {
    try {
      const audio = initGlobalAudio();

      // Let the toggle button manage state, but we attempt autoplay for the intro
      audio.play().then(() => {
        setAudioPlaying(true);
        const playBtn = document.getElementById('play-audio-btn');
        if (playBtn) playBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
      }).catch(() => {
        // Silent fail if autoplay is blocked
      });

      const audioSetup = getAudioContext();
      if (!audioSetup) return;

      const { audioCtx, analyser } = audioSetup;
      if (!analyser) return;

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

    } catch (e) {
      // Audio not critical — visualizer is optional
    }
  }
  setTimeout(startVisualizer, 1000);

  // Cleanup function
  function cleanup() {
    cancelled = true;
    if (animFrame) cancelAnimationFrame(animFrame);
    // Do NOT stop audio or destroy audioCtx so it persists globally
    intro.remove();
  }

  return intro;
}
