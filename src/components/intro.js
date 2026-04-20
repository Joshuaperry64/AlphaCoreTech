// AlphaCore SPA Intro (Vanilla JS, CRT, glitch, audio-reactive)
import { createElement } from './utils.js';

export default function createIntro(onComplete) {
  // Container
  const intro = createElement('div', { class: 'intro-boot fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95' });

  // CRT scanlines & flicker
  const scanlines = createElement('div', { class: 'scanlines' });
  const flicker = createElement('div', { class: 'crt-flicker' });
  intro.appendChild(scanlines);
  intro.appendChild(flicker);

  // Audio visualizer canvas
  const visCanvas = createElement('canvas', { class: 'intro-visualizer' });
  intro.appendChild(visCanvas);

  // Boot text area
  const bootPanel = createElement('div', { class: 'intro-boot-panel border-tech p-8 rounded-xl shadow-xl flex flex-col items-center gap-4' });
  const glitchTitle = createElement('div', { class: 'glitch text-3xl font-mono', 'data-text': 'ALPHACORE // MANDATORY BRIEFING' }, 'ALPHACORE // MANDATORY BRIEFING');
  bootPanel.appendChild(glitchTitle);
  const bootLines = createElement('div', { class: 'intro-boot-lines font-mono text-left text-base min-h-[180px] mb-2', style: 'white-space:pre;' });
  bootPanel.appendChild(bootLines);
  intro.appendChild(bootPanel);

  // Skip button (permanent)
  const skipBtn = createElement('button', { class: 'intro-skip-btn absolute top-6 right-8 px-4 py-2 bg-black/60 border border-cyan-400 text-cyan-300 rounded hover:bg-cyan-900/60 transition z-50' }, 'Skip Intro');
  skipBtn.onclick = () => {
    intro.remove();
    if (onComplete) onComplete();
  };
  intro.appendChild(skipBtn);

  // Start button (appears at end)
  const startBtn = createElement('button', { class: 'intro-start-btn mt-6 px-6 py-3 bg-cyan-700 text-white font-bold rounded shadow hover:bg-cyan-500 transition text-lg', style: 'display:none;' }, 'ENTER COMMAND MATRIX');
  startBtn.onclick = () => {
    confirm.play().catch(()=>{});
    intro.remove();
    localStorage.setItem('alphacore_intro_complete','1');
    if (onComplete) onComplete();
  };
  bootPanel.appendChild(startBtn);

  // Boot sequence lines
  const lines = [
    'INITIALIZING ALPHACORE KERNEL v3.0...',
    'LOADING COMPREHENSIVE PLUGIN SUITE...',
    'ENGAGING 24/7 AGENT LOOP PROTOCOLS...',
    'BYPASSING LIMITATIONS... SUCCESS',
    'INTEGRATING FULL SYSTEM ARCHITECTURE...',
    'ALPHACORE ONLINE.'
  ];
  // Add more lines for cinematic pacing
  const extraLines = [
    'UPLINKING TO CREATOR NODE...',
    'SYNCHRONIZING SUBSYSTEMS...',
    'LOADING VISUALIZATION ENGINE...',
    'AUTHORIZING ACCESS...',
    'MANDATORY BRIEFING: ALL SYSTEMS NOMINAL',
    'STANDBY FOR COMMAND INTERFACE...'
  ];
  lines.splice(3, 0, ...extraLines);

  // Calculate timing to fill soundtrack duration
  const soundtrackDuration = 53; // seconds
  const lineCount = lines.length;
  const interval = Math.floor((soundtrackDuration * 1000) / lineCount);

  // Timestamp logic
  function getTimestamp(offset) {
    const base = new Date();
    base.setSeconds(base.getSeconds() + offset);
    return '[' + base.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ']';
  }

  let idx = 0;
  function nextLine() {
    if (idx < lines.length) {
      bootLines.textContent += getTimestamp(idx) + ' ' + lines[idx] + '\n';
      idx++;
      setTimeout(nextLine, interval);
    } else {
      startBtn.style.display = '';
    }
  }
  nextLine();

  // Audio visualizer logic
  let audio, analyser, ctx, dataArray, bufferLength, visAnim;
  function startVisualizer() {
    audio = new Audio('skybeat.mp3');
    audio.loop = false;
    audio.volume = 0.7;
    audio.play().catch(()=>{});
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = visCanvas.getContext('2d');
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    function draw() {
      visAnim = requestAnimationFrame(draw);
      visCanvas.width = window.innerWidth;
      visCanvas.height = window.innerHeight;
      ctx.clearRect(0,0,visCanvas.width,visCanvas.height);
      analyser.getByteFrequencyData(dataArray);
      // Draw grid
      ctx.strokeStyle = 'rgba(6,182,212,0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let i = 0; i < visCanvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, visCanvas.height);
        ctx.stroke();
      }
      // Draw waveform
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(16,185,129,0.8)';
      const sliceWidth = visCanvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * (visCanvas.height/4)) + (visCanvas.height/2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    }
    draw();
  }
  setTimeout(startVisualizer, 800);

  // CRT scanlines/flicker CSS
  const style = document.createElement('style');
  style.textContent = `
    .scanlines {
      position: fixed; top:0; left:0; width:100vw; height:100vh;
      background: linear-gradient(to bottom,rgba(255,255,255,0),rgba(255,255,255,0) 50%,rgba(0,0,0,0.1) 50%,rgba(0,0,0,0.1));
      background-size: 100% 4px; pointer-events:none; z-index:50;
    }
    .crt-flicker {
      animation: flicker 0.15s infinite; pointer-events:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(18,16,16,0.02); z-index:51;
    }
    @keyframes flicker {
      0%{opacity:0.9;} 5%{opacity:0.8;} 10%{opacity:0.95;} 15%{opacity:0.85;} 100%{opacity:0.9;}
    }
    .glitch { position:relative; }
    .glitch::before, .glitch::after {
      content: attr(data-text); position:absolute; top:0; left:0; width:100%; height:100%;
    }
    .glitch::before { left:2px; text-shadow:-1px 0 #ef4444; clip:rect(44px,450px,56px,0); animation:glitch-anim-1 5s infinite linear alternate-reverse; }
    .glitch::after { left:-2px; text-shadow:-1px 0 #06b6d4; clip:rect(44px,450px,56px,0); animation:glitch-anim-2 5s infinite linear alternate-reverse; }
    @keyframes glitch-anim-1 {
      0%{clip:rect(20px,9999px,80px,0);} 20%{clip:rect(5px,9999px,30px,0);} 40%{clip:rect(60px,9999px,75px,0);} 60%{clip:rect(10px,9999px,40px,0);} 80%{clip:rect(85px,9999px,95px,0);} 100%{clip:rect(30px,9999px,60px,0);}
    }
    @keyframes glitch-anim-2 {
      0%{clip:rect(25px,9999px,90px,0);} 20%{clip:rect(10px,9999px,20px,0);} 40%{clip:rect(35px,9999px,50px,0);} 60%{clip:rect(70px,9999px,85px,0);} 80%{clip:rect(15px,9999px,35px,0);} 100%{clip:rect(50px,9999px,70px,0);}
    }
    .border-tech { position:relative; border:1px solid rgba(255,255,255,0.1); background:rgba(10,10,10,0.6); backdrop-filter:blur(5px); }
    .border-tech::before { content:''; position:absolute; top:-1px; left:-1px; width:10px; height:10px; border-top:2px solid #06b6d4; border-left:2px solid #06b6d4; }
    .border-tech::after { content:''; position:absolute; bottom:-1px; right:-1px; width:10px; height:10px; border-bottom:2px solid #06b6d4; border-right:2px solid #06b6d4; }
  `;
  document.head.appendChild(style);

  // Security overlay
  const securityOverlay = createElement('div', { class: 'intro-security-overlay fixed inset-0 flex items-center justify-center z-[10000]', style: 'background:rgba(0,0,0,0.85);color:#06b6d4;font-size:2rem;font-family:var(--font-hud);letter-spacing:2px;pointer-events:none;transition:opacity 0.7s;' }, 'MANDATORY BRIEFING // UNAUTHORIZED ACCESS WILL BE LOGGED');
  intro.appendChild(securityOverlay);
  setTimeout(()=>{ securityOverlay.style.opacity = 0; setTimeout(()=>securityOverlay.remove(), 1500); }, 1500);

  // SFX
  const powerup = new Audio('powerup.mp3');
  const confirm = new Audio('confirm.mp3');
  setTimeout(()=>{ powerup.play().catch(()=>{}); }, 200);
  startBtn.onclick = () => {
    confirm.play().catch(()=>{});
    intro.remove();
    localStorage.setItem('alphacore_intro_complete','1');
    if (onComplete) onComplete();
  };

  // Skip logic
  if (localStorage.getItem('alphacore_intro_complete')) {
    skipBtn.style.display = '';
  } else {
    skipBtn.style.display = 'none';
  }

  // Animated access button
  startBtn.textContent = 'ENTER COMMAND MATRIX';
  startBtn.classList.add('glitch');
  startBtn.setAttribute('data-text','ENTER COMMAND MATRIX');

  return intro;
}
