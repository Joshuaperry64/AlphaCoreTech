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
  bypass: '/bypass.mp3'
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

  if (!unlockBound && typeof window !== 'undefined') {
    unlockBound = true;
    const unlockAudio = () => {
      if (globalAudio && globalAudio.paused) {
        globalAudio.play().then(() => {
          isPlaying = true;
          const playBtn = document.getElementById('play-audio-btn');
          if (playBtn) playBtn.innerHTML = '&#10074;&#10074;';
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
        }).catch(() => {});
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
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

  if (isPlaying) {
    globalAudio.pause();
    isPlaying = false;
  } else {
    isPlaying = true;
    globalAudio.play().then(() => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }).catch((e) => {
      console.warn("Audio play prevented:", e);
      isPlaying = false;
    });
  }

  return isPlaying;
}

export function setAudioPlaying(playing) {
  isPlaying = playing;
}

export function getGlobalAudio() {
  return globalAudio;
}
