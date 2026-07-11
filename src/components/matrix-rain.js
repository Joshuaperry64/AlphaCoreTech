/**
 * Matrix Rain — Shared canvas background
 * Initialized once globally. Never duplicated.
 */

let isEcoMode = localStorage.getItem('alphacore_eco_mode') === 'true';

export function toggleEcoMode() {
  isEcoMode = !isEcoMode;
  localStorage.setItem('alphacore_eco_mode', isEcoMode);
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
  const fontSize = 24; // Increased font size to drastically reduce column count
  let cols = Math.floor(canvas.width / fontSize);
  let drops = Array(cols).fill(1);

  window.addEventListener('resize', () => {
    const newCols = Math.floor(canvas.width / fontSize);
    if (newCols !== cols) {
      const newDrops = Array(newCols).fill(1);
      for (let i = 0; i < Math.min(cols, newCols); i++) {
        newDrops[i] = drops[i];
      }
      drops = newDrops;
      cols = newCols;
    }
  });

  let lastDrawTime = 0;
  const fps = 12; // Throttle down to 12 FPS for massive performance gain
  const interval = 1000 / fps;

  function draw(timestamp) {
    requestAnimationFrame(draw);

    if (document.hidden || isEcoMode) return; // Pause when tab is inactive or in eco mode

    const delta = timestamp - lastDrawTime;
    if (delta < interval) return;

    lastDrawTime = timestamp - (delta % interval);

    ctx.fillStyle = 'rgba(3, 3, 5, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00b8ff';
    ctx.font = fontSize + 'px Share Tech Mono';
    
    for (let i = 0; i < drops.length; i++) {
      // Add randomness so not all columns drop every frame (cuts render load)
      if (Math.random() > 0.5) continue; 
      
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) drops[i] = 0;
      drops[i]++;
    }
  }

  requestAnimationFrame(draw);
}
