/**
 * AlphaCore SPA Intro — Cinematic boot sequence
 * Vanilla CSS, CRT scanlines, glitch effects, audio-reactive visualizer
 */
import { createElement } from './utils.js';
import { buildPinPad } from './pinpad.js';
import { initGlobalAudio, getAudioContext, setAudioPlaying } from './audio.js';

export default function createIntro(onComplete) {
  // Container — fullscreen overlay
  const intro = createElement('div', { class: 'intro-boot', id: 'intro-overlay' });
  Object.assign(intro.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000',
    backgroundImage: 'url(/Images/wallpapernew.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  });

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes wolf-enter {
      0% { transform: scale(0.8); opacity: 0; filter: blur(10px); }
      100% { transform: scale(1); opacity: 1; filter: blur(0px); }
    }
    @keyframes ring-spin-right {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    @keyframes ring-spin-left {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(-360deg); }
    }
    @keyframes scan-vertical {
      0% { top: -10%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 110%; opacity: 0; }
    }
    @keyframes pulse-ring {
      0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; box-shadow: 0 0 20px rgba(0, 184, 255, 0.2); }
      50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; box-shadow: 0 0 40px rgba(0, 184, 255, 0.6); }
      100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; box-shadow: 0 0 20px rgba(0, 184, 255, 0.2); }
    }
    @keyframes glitch-logo {
      0% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 2px); }
      20% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
      40% { clip-path: inset(40% 0 40% 0); transform: translate(-2px, -2px); }
      60% { clip-path: inset(20% 0 60% 0); transform: translate(2px, 2px); }
      80% { clip-path: inset(60% 0 20% 0); transform: translate(2px, -2px); }
      100% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 2px); }
    }

    .wolf-container {
      position: relative;
      width: 300px;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 60;
      animation: wolf-enter 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .wolf-logo {
      width: 140px;
      height: 140px;
      object-fit: contain;
      z-index: 65;
      position: relative;
      filter: drop-shadow(0 0 15px rgba(0, 184, 255, 0.8));
      transition: transform 0.1s ease-out;
    }

    .wolf-logo.glitching {
      animation: glitch-logo 0.3s infinite;
    }

    .cyber-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .ring-1 {
      width: 280px;
      height: 280px;
      border: 2px dashed rgba(0, 184, 255, 0.5);
      animation: ring-spin-right 12s linear infinite;
      z-index: 61;
    }

    .ring-2 {
      width: 240px;
      height: 240px;
      border: 1px solid rgba(0, 184, 255, 0.3);
      border-top: 3px solid rgba(0, 184, 255, 0.8);
      border-bottom: 3px solid rgba(0, 184, 255, 0.8);
      animation: ring-spin-left 8s linear infinite;
      z-index: 62;
    }

    .ring-3 {
      width: 200px;
      height: 200px;
      border: 2px solid rgba(0, 184, 255, 0.2);
      animation: pulse-ring 2s ease-in-out infinite;
      z-index: 63;
    }

    .laser-scan {
      position: absolute;
      left: 0;
      width: 100%;
      height: 3px;
      background: rgba(0, 184, 255, 0.8);
      box-shadow: 0 0 15px 2px rgba(0, 184, 255, 0.6);
      animation: scan-vertical 3s linear infinite;
      z-index: 66;
    }

    .intro-status-panel {
      position: relative;
      z-index: 60;
      margin-top: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      width: 90%;
      max-width: 400px;
    }

    .status-text {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: #00b8ff;
      letter-spacing: 2px;
      text-shadow: 0 0 5px rgba(0, 184, 255, 0.5);
      text-align: center;
      height: 1.2rem;
    }

    .progress-track {
      width: 100%;
      height: 4px;
      background: rgba(0, 184, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      background: #00b8ff;
      box-shadow: 0 0 10px #00b8ff;
      width: 0%;
      transition: width 0.3s ease;
    }
  `;
  intro.appendChild(styleEl);

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
    pointerEvents: 'none', opacity: '0.6', zIndex: '2'
  });
  intro.appendChild(visCanvas);

  // Main interactive panel wrapper
  const mainPanel = createElement('div');
  Object.assign(mainPanel.style, {
    position: 'relative', zIndex: '60',
    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'
  });

  // Glitch title at top
  const glitchTitle = createElement('div', { class: 'glitch', 'data-text': 'ALPHACORE // KERNEL v4.0' }, 'ALPHACORE // KERNEL v4.0');
  Object.assign(glitchTitle.style, {
    fontFamily: 'var(--font-hud)', fontSize: '1.2rem', fontWeight: '700',
    color: '#00b8ff', letterSpacing: '4px', textAlign: 'center',
    textShadow: '0 0 20px rgba(0,184,255,0.5)',
    marginBottom: '30px'
  });
  mainPanel.appendChild(glitchTitle);

  // Central Wolf Logo Container
  const wolfContainer = createElement('div', { class: 'wolf-container' });

  const ring1 = createElement('div', { class: 'cyber-ring ring-1' });
  const ring2 = createElement('div', { class: 'cyber-ring ring-2' });
  const ring3 = createElement('div', { class: 'cyber-ring ring-3' });
  const laser = createElement('div', { class: 'laser-scan' });

  const wolfLogo = createElement('img', { class: 'wolf-logo', src: '/Images/ALPHA-LOGO.png' });

  wolfContainer.appendChild(ring1);
  wolfContainer.appendChild(ring2);
  wolfContainer.appendChild(ring3);
  wolfContainer.appendChild(laser);
  wolfContainer.appendChild(wolfLogo);

  mainPanel.appendChild(wolfContainer);

  // Status & Progress Panel
  const statusPanel = createElement('div', { class: 'intro-status-panel' });

  const statusText = createElement('div', { class: 'status-text' }, 'INITIALIZING...');
  const progressTrack = createElement('div', { class: 'progress-track' });
  const progressBar = createElement('div', { class: 'progress-bar' });

  progressTrack.appendChild(progressBar);
  statusPanel.appendChild(statusText);
  statusPanel.appendChild(progressTrack);

  mainPanel.appendChild(statusPanel);

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
    animation: 'fade-in 1.5s forwards',
    maxWidth: '90%'
  });
  const mobileWarningText = createElement('p', {}, 'MOBILE VIEW STILL IN DEVELOPMENT. WEBSITE FUNCTIONS AND VIEWS MAY NOT FUNCTION AS INTENDED OR APPEAR CORRECTLY.');
  Object.assign(mobileWarningText.style, {
    color: 'var(--accent)', fontFamily: 'var(--font-hud)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5'
  });
  mobileWarningPanel.appendChild(mobileWarningText);
  
  const continueBtn = createElement('button', { class: 'aim-btn' }, 'CONTINUE (5s)');
  Object.assign(continueBtn.style, { borderColor: 'var(--accent)', color: 'var(--accent)' });
  mobileWarningPanel.appendChild(continueBtn);

  // Login panel (hidden until boot completes)
  const loginPanel = createElement('div', { class: 'intro-login-panel' });
  Object.assign(loginPanel.style, {
    display: 'none', flexDirection: 'column', alignItems: 'center', marginTop: '40px',
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

  enterBtn.onclick = () => {
    enterBtn.style.display = 'none';
    glitchTitle.style.display = 'none';
    wolfContainer.style.display = 'none';

    if (window.innerWidth <= 768) {
      mobileWarningPanel.style.display = 'flex';
      mainPanel.appendChild(mobileWarningPanel);
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

  mainPanel.appendChild(enterBtn);
  mainPanel.appendChild(loginPanel);
  intro.appendChild(mainPanel);

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
  secFlash.textContent = 'MANDATORY BRIEFING // SECURE CONNECTION ESTABLISHED';
  intro.appendChild(secFlash);
  setTimeout(() => { secFlash.style.opacity = '0'; }, 900);
  setTimeout(() => { secFlash.remove(); }, 1400);

  // Boot sequence lines
  const lines = [
    'UPLINKING TO CREATOR NODE...',
    'SYNCHRONIZING SUBSYSTEMS...',
    'LOADING NEURAL NETWORKS...',
    'ENGAGING 24/7 AGENT PROTOCOLS...',
    'AUTHORIZING ACCESS...',
    'ALL SYSTEMS NOMINAL.'
  ];

  let lineIdx = 0;
  let cancelled = false;

  function nextLine() {
    if (cancelled) return;

    if (lineIdx < lines.length) {
      statusText.textContent = lines[lineIdx];
      const percent = Math.floor(((lineIdx + 1) / lines.length) * 100);
      progressBar.style.width = percent + '%';

      // Occasionally glitch the logo during boot
      if (Math.random() > 0.5) {
        wolfLogo.classList.add('glitching');
        setTimeout(() => wolfLogo.classList.remove('glitching'), 300);
      }

      lineIdx++;
      setTimeout(nextLine, 500 + Math.random() * 400);
    } else {
      statusPanel.style.display = 'none';
      enterBtn.style.display = 'block';
    }
  }
  setTimeout(nextLine, 800);

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
        // Silent fail if autoplay is blocked - bind to first interaction
        const startAudio = () => {
          audio.play().then(() => {
            setAudioPlaying(true);
            const playBtn = document.getElementById('play-audio-btn');
            if (playBtn) playBtn.innerHTML = '&#10074;&#10074;';
          }).catch(()=>{});
          document.removeEventListener('click', startAudio);
          document.removeEventListener('keydown', startAudio);
        };
        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
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

        // Eco mode check
        const isEcoMode = localStorage.getItem('alphacore_eco_mode') === '1';
        if (isEcoMode && document.hidden) {
            animFrame = requestAnimationFrame(draw);
            return;
        }

        animFrame = requestAnimationFrame(draw);
        visCanvas.width = window.innerWidth;
        visCanvas.height = window.innerHeight;
        ctx.clearRect(0, 0, visCanvas.width, visCanvas.height);
        analyser.getByteFrequencyData(dataArray);

        const cx = visCanvas.width / 2;
        const cy = visCanvas.height / 2;

        // Circular Spectrum
        const radius = Math.min(cx, cy) * 0.4;
        const barWidth = 3;
        const numBars = 120;
        const angleStep = (Math.PI * 2) / numBars;

        let bassSum = 0;

        for (let i = 0; i < numBars; i++) {
          const dataIndex = Math.floor(i * (bufferLength / numBars));
          const v = dataArray[dataIndex];
          const barHeight = (v / 255) * 100;

          if (i < 10) bassSum += v;

          const angle = i * angleStep;

          const x1 = cx + Math.cos(angle) * radius;
          const y1 = cy + Math.sin(angle) * radius;
          const x2 = cx + Math.cos(angle) * (radius + barHeight);
          const y2 = cy + Math.sin(angle) * (radius + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = barWidth;
          // Gradient based on amplitude
          ctx.strokeStyle = `rgba(0, 184, 255, ${0.3 + (v / 255) * 0.7})`;
          ctx.stroke();
        }

        // Scale logo based on bass
        const avgBass = bassSum / 10;
        const scale = 1 + (avgBass / 255) * 0.15;
        wolfLogo.style.transform = `scale(${scale})`;

        // Grid overlay
        ctx.strokeStyle = 'rgba(0,184,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i < visCanvas.width; i += 40) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, visCanvas.height); ctx.stroke();
        }
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
