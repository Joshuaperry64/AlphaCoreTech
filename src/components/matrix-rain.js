import { getAudioContext } from './audio.js';

let isEcoMode = localStorage.getItem('alphacore_eco_mode') === 'true';

export function toggleEcoMode() {
  isEcoMode = !isEcoMode;
  localStorage.setItem('alphacore_eco_mode', isEcoMode ? 'true' : 'false');
  return isEcoMode;
}

export function getEcoMode() {
  return isEcoMode;
}

export function initMatrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';
  const fontSize = 16;
  let cols = Math.floor(canvas.width / fontSize);
  let drops = Array.from({ length: cols }, () => Math.floor(Math.random() * -50));
  let freqArray = null;

  window.addEventListener('resize', () => {
    const newCols = Math.floor(canvas.width / fontSize);
    if (newCols !== cols) {
      const newDrops = Array.from({ length: newCols }, (_, i) => i < drops.length ? drops[i] : Math.floor(Math.random() * -50));
      drops = newDrops;
      cols = newCols;
    }
  });

  let lastDrawTime = 0;
  const fps = 10;
  const interval = 1000 / fps;

  function draw(timestamp) {
    requestAnimationFrame(draw);

    if (document.hidden || isEcoMode) {
      if (isEcoMode) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const delta = timestamp - lastDrawTime;
    if (delta < interval) return;

    lastDrawTime = timestamp - (delta % interval);

    // Audio reactivity sampling
    let audioEnergy = 0;
    try {
      const audioData = getAudioContext();
      if (audioData && audioData.analyser && audioData.audioCtx && audioData.audioCtx.state === 'running') {
        if (!freqArray || freqArray.length !== audioData.analyser.frequencyBinCount) {
          freqArray = new Uint8Array(audioData.analyser.frequencyBinCount);
        }
        audioData.analyser.getByteFrequencyData(freqArray);
        let sum = 0;
        const sampleBins = Math.min(16, freqArray.length);
        for (let i = 0; i < sampleBins; i++) {
          sum += freqArray[i];
        }
        audioEnergy = (sum / sampleBins) / 255;
      }
    } catch {}

    // Subtle fade for trails (higher alpha = shorter trails and dimmer text)
    ctx.fillStyle = `rgba(3, 4, 8, ${0.15 + (audioEnergy * 0.05)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = `bold ${fontSize}px 'Share Tech Mono', monospace`;
    
    for (let i = 0; i < drops.length; i++) {
      // Add randomness so not all columns drop every frame (slows it down more naturally)
      if (Math.random() > 0.7) continue;

      const char = chars[Math.floor(Math.random() * chars.length)];
      
      let x = i * fontSize;
      let y = drops[i] * fontSize;
      
      // --- GLITCH EFFECT LOGIC ---
      const isGlitching = Math.random() < 0.01 + (audioEnergy * 0.05);
      
      if (isGlitching) {
        // Randomly displace X and Y slightly for a jitter effect
        x += (Math.random() - 0.5) * 8;
        // Occasional color shift (Dimmer Cyan / Magenta)
        const colors = ['rgba(180,0,50,0.9)', 'rgba(0,140,160,0.9)'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = audioEnergy > 0.4 ? 'rgba(0, 160, 180, 0.9)' : 'rgba(0, 90, 110, 0.9)';
        ctx.shadowColor = audioEnergy > 0.4 ? 'rgba(0,180,200,0.5)' : 'rgba(0,100,120,0.5)';
        ctx.shadowBlur = Math.floor(audioEnergy * 5);
      }

      ctx.fillText(char, x, y);
      
      // Reset drop to top randomly to vary column lengths
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  requestAnimationFrame(draw);
}
