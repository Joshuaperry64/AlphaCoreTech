/**
 * Global Audio Manager & Web Audio API Visualizer Engine
 */
let globalAudio = null;
let audioCtx = null;
let analyser = null;
let isPlaying = false;

export function initGlobalAudio() {
  if (globalAudio) return globalAudio;

  globalAudio = new Audio('/skybeat.mp3');
  globalAudio.loop = true;
  globalAudio.volume = 0.5;

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
