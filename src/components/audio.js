/**
 * Global Audio Manager & Sound FX Engine for AlphaCore
 * Manages background ambient stream (skybeat.mp3) and full UI sound effects.
 */

let globalAudio = null;
let audioCtx = null;
let analyser = null;
let isPlaying = false;
let unlockBound = false;

// ─── SFX Cache ─────────────────────────────────────────────────────────────

const sfxFiles = {
  click: '/digital-click.mp3',
  navigate: '/navigate.mp3',
  transition: '/transition.mp3',
  modal: '/modals.mp3',
  response: '/response.mp3',
  bypass: '/bypass.mp3',
  incorrect: '/incorrect.mp3'
};

const sfxAudioCache = {};

function getSfxAudio(type) {
  if (!sfxFiles[type]) return null;
  if (!sfxAudioCache[type]) {
    sfxAudioCache[type] = new Audio(sfxFiles[type]);
  }
  return sfxAudioCache[type];
}

/**
 * Plays a UI sound effect with optional volume scaling.
 * 
 * @param {'click'|'navigate'|'transition'|'modal'|'response'|'bypass'} type 
 * @param {number} [volume=0.5] 
 */
export function playSFX(type, volume = 0.5) {
  try {
    const baseAudio = getSfxAudio(type);
    if (!baseAudio) return;
    const sound = baseAudio.cloneNode();
    sound.volume = Math.max(0, Math.min(1, volume));
    sound.play().catch(() => {});
  } catch (e) {
    // Non-critical audio failure
  }
}

// ─── Main Ambient Audio Stream (skybeat.mp3) ─────────────────────────────

export function initGlobalAudio() {
  if (globalAudio) return globalAudio;

  globalAudio = new Audio('/skybeat.mp3');
  globalAudio.loop = true;
  globalAudio.volume = 0.5;

  // Seamless MP3 Loop Hack - clips encoder padding gap
  globalAudio.addEventListener('timeupdate', () => {
    const gapBuffer = 0.35; 
    if (globalAudio.duration && globalAudio.currentTime > globalAudio.duration - gapBuffer) {
      globalAudio.currentTime = 0;
      globalAudio.play().catch(() => {});
    }
  });

  globalAudio.addEventListener('play', () => {
    isPlaying = true;
    const playBtn = document.getElementById('play-audio-btn');
    if (playBtn) {
      playBtn.innerHTML = '&#10074;&#10074;';
      playBtn.title = "Pause Music";
    }
  });

  globalAudio.addEventListener('pause', () => {
    isPlaying = false;
    const playBtn = document.getElementById('play-audio-btn');
    if (playBtn) {
      playBtn.innerHTML = '&#9658;';
      playBtn.title = "Play Music";
    }
  });

  if (!unlockBound && typeof window !== 'undefined') {
    unlockBound = true;
    const unlockAudio = () => {
      if (globalAudio && globalAudio.paused) {
        // Force load on mobile gesture to ensure buffer is ready
        if (globalAudio.readyState === 0) {
          globalAudio.load();
        }
        globalAudio.play().then(() => {
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
        }).catch((e) => {
          console.warn("Autoplay block (iOS/Safari) handled:", e);
        });
      }
      // Clean up all possible interaction vectors
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('pointerdown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    document.addEventListener('touchend', unlockAudio, { once: true, passive: true });
    document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  }

  return globalAudio;
}

export function getAudioContext() {
  if (!globalAudio) initGlobalAudio();
  if (audioCtx) return { audioCtx, analyser };

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    audioCtx = new AudioCtx();
    const source = audioCtx.createMediaElementSource(globalAudio);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
  } catch (e) {
    console.warn("AudioContext setup notice:", e);
    return null;
  }

  return { audioCtx, analyser };
}

export function toggleAudio() {
  if (!globalAudio) {
    initGlobalAudio();
  }

  if (!globalAudio.paused) {
    globalAudio.pause();
  } else {
    if (globalAudio.readyState === 0) {
      globalAudio.load();
    }
    globalAudio.play().then(() => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }).catch((e) => {
      console.warn("Audio play prevented:", e);
    });
  }

  return !globalAudio.paused;
}

export function setAudioPlaying(playing) {
  isPlaying = playing;
}

export function getGlobalAudio() {
  return globalAudio;
}

export function initAudioVisualizer() {
  const visCanvas = document.getElementById('audio-vis-canvas');
  if (!visCanvas) return;
  const canvasCtx = visCanvas.getContext('2d');
  if (!canvasCtx) return;

  let tick = 0;
  function drawVis() {
    requestAnimationFrame(drawVis);
    
    if (document.hidden || localStorage.getItem('alphacore_eco_mode') === 'true') {
      canvasCtx.clearRect(0, 0, visCanvas.width, visCanvas.height);
      return;
    }

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
    
    const logoImg = document.querySelector('.intro-logo-img');
    if (logoImg) {
      const avgBass = bassSum / 8;
      const scale = 1 + (avgBass / 255) * 0.08;
      logoImg.style.transform = `scale(${scale})`;
    }
  }

  drawVis();
}
