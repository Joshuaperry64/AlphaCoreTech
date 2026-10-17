// Audio Service for ReelDeep

/**
 * Convert base64 to ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} - The decoded ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Convert PCM data to WAV format
 * @param {Int16Array} pcm16 - PCM data
 * @param {number} sampleRate - Sample rate
 * @returns {Blob} - WAV blob
 */
const pcmToWav = (pcm16, sampleRate) => {
  const dataLength = pcm16.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  let offset = 0;

  const writeString = (str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };

  writeString('RIFF');
  view.setUint32(offset, 36 + dataLength, true);
  offset += 4;
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * 2, true);
  offset += 4;
  view.setUint16(offset, 2, true);
  offset += 2;
  view.setUint16(offset, 16, true);
  offset += 2;
  writeString('data');
  view.setUint32(offset, dataLength, true);
  offset += 4;

  for (let i = 0; i < pcm16.length; i++) {
    view.setInt16(offset, pcm16[i], true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
};

/**
 * Play text as audio
 * @param {string} textToSpeak - Text to convert to speech
 * @returns {Promise<void>} - Resolves when audio playback is complete
 */
const playTextAsAudio = async (textToSpeak) => {
  try {
    const { generateTextToSpeech } = await import('./api-service.js');
    const { audioData, mimeType } = await generateTextToSpeech(textToSpeak);
    
    const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
    const pcmData = base64ToArrayBuffer(audioData);
    const pcm16 = new Int16Array(pcmData);
    const wavBlob = pcmToWav(pcm16, sampleRate);
    const audioUrl = URL.createObjectURL(wavBlob);

    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', resolve);
      audio.addEventListener('error', reject);
      audio.play().catch(reject);
    });
  } catch (error) {
    console.error('Error playing audio:', error);
    throw error;
  }
};

/**
 * Stop all audio playback
 * @param {HTMLAudioElement} audioElement - The audio element to stop
 */
const stopAudio = (audioElement) => {
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }
};

// Export audio functions
export {
  base64ToArrayBuffer,
  pcmToWav,
  playTextAsAudio,
  stopAudio
};