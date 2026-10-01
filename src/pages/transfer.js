import { createElement } from '../components/utils.js';
import { playSFX } from '../components/audio.js';
import {
  getProfileWallet,
  creditWallet,
  debitWallet,
  renderLaundromatWallet,
  openWalletInspectorModal,
  canonicalProfileName
} from '../components/laundromat_wallet.js';

// ─── Procedural Laundromat Audio & Music Synthesizer Engine ──────────────────
class LaundromatAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMusicPlaying = false;
    this.musicTimer = null;
    this.musicVolume = 0.35;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentStep = 0;
    this.boundHashChange = null;
  }

  init() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      } catch (e) {
        console.warn('AudioContext init prevented:', e);
      }

      // Stop music if user navigates away from #/laundry or #/transfer
      if (!this.boundHashChange && typeof window !== 'undefined') {
        this.boundHashChange = () => {
          if (!window.location.hash.includes('laundry') && !window.location.hash.includes('transfer')) {
            this.stopMusic();
          }
        };
        window.addEventListener('hashchange', this.boundHashChange);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ─── Lo-Fi Laundromat Music Generator ─────────────────────────────────────
  startMusic() {
    this.init();
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;

    // 80 BPM Lo-Fi Beat: 1 beat = 0.75s, 16th note = 0.1875s
    const beatIntervalMs = 750;

    // Jazz Chords Progression (Dm9 -> G13 -> Cmaj9 -> A7alt)
    const chords = [
      [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9: D3, F3, A3, C4, E4
      [98.00, 174.61, 246.94, 329.63, 392.00],  // G13: G2, F3, B3, E4, G4
      [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9: C3, E3, G3, B3, D4
      [110.00, 196.00, 261.63, 311.13, 349.23]  // A7alt: A2, G3, C4, D#4, F4
    ];

    const bassRoots = [73.42, 98.00, 65.41, 110.00]; // D2, G2, C2, A2

    let beat = 0;
    const tick = () => {
      if (!this.isMusicPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      const bar = Math.floor(beat / 4) % 4;
      const beatInBar = beat % 4;

      // Chord Pad on beat 1 of each bar
      if (beatInBar === 0) {
        const chordNotes = chords[bar];
        chordNotes.forEach(freq => {
          this._playSoftPad(freq, t, 2.8);
        });
        // Sub Bass Note
        this._playSubBass(bassRoots[bar], t, 2.5);
      } else if (beatInBar === 2) {
        // Light chord re-trigger
        const chordNotes = chords[bar].slice(1, 4);
        chordNotes.forEach(freq => {
          this._playSoftPad(freq, t, 1.3, 0.05);
        });
      }

      // Chillhop Drum Patterns
      if (beatInBar === 0 || beatInBar === 2) {
        // Soft Lofi Kick on 1 and 3
        this._playLofiKick(t);
      }
      if (beatInBar === 1 || beatInBar === 3) {
        // Soft Lofi Snare / Rimshot on 2 and 4
        this._playLofiSnare(t);
      }

      // Hi-Hat on every beat + 8th note swing
      this._playLofiHiHat(t);
      this._playLofiHiHat(t + 0.38, 0.02);

      // Melodic Lo-Fi pentatonic floating notes
      if (beat % 2 === 1 && Math.random() > 0.4) {
        const melodyPool = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
        const pickNote = melodyPool[Math.floor(Math.random() * melodyPool.length)];
        this._playLofiMelody(pickNote, t + 0.15);
      }

      beat++;
      this.musicTimer = setTimeout(tick, beatIntervalMs);
    };

    tick();
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  toggleMusic() {
    if (this.isMusicPlaying) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMusicPlaying;
  }

  setVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  // ─── Sound FX Generators ──────────────────────────────────────────────────

  // 1. Door Chime (Entering laundromat)
  playDoorChime() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [659.25, 523.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.22);

      gain.gain.setValueAtTime(0, t + i * 0.22);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.22 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.22);
      osc.stop(t + i * 0.22 + 0.85);
    });
  }

  // 2. Metallic Coin Clink & Drop (Coin Changer payout)
  playCoinClink() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [2800, 3400, 4200, 3100, 3900];
    freqs.forEach((freq, idx) => {
      const delay = idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, t + delay);
      filter.Q.setValueAtTime(12, t + delay);

      gain.gain.setValueAtTime(0.3, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.1);
    });
  }

  // 3. Bill Validator Whir (Cash intake)
  playBillWhir() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  // 4. Mechanical Door Lock (Heavy latch clunk)
  playDoorLock() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Dual impact
    [0, 0.06].forEach((offset, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 160 : 90, t + offset);
      osc.frequency.exponentialRampToValueAtTime(45, t + offset + 0.08);

      gain.gain.setValueAtTime(0.4, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.12);
    });
  }

  // 5. Water Fill & Bubbling Suds
  playWaterFill() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.linearRampToValueAtTime(750, t + 0.7);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.82);
  }

  // 6. Chrono-Warp Time Travel (+1 Hour Warp)
  playTimeWarp() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Rising cosmic sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.65);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(3200, t + 0.65);
    filter.Q.setValueAtTime(6, t);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.85);

    // Concluding timeline bell chime
    setTimeout(() => {
      if (!this.ctx) return;
      const tBell = this.ctx.currentTime;
      const bell = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(880, tBell);
      bGain.gain.setValueAtTime(0.3, tBell);
      bGain.gain.exponentialRampToValueAtTime(0.001, tBell + 0.9);
      bell.connect(bGain);
      bGain.connect(this.sfxGain);
      bell.start(tBell);
      bell.stop(tBell + 0.95);
    }, 600);
  }

  // 7. Dryer Gas Burner Ignition & Tumble Hum
  playDryerStart() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.5);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  // 8. Authentic Vintage Commercial Dryer Buzzer (*BZZZZT!*)
  playDryerBuzzer() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Harsh 180Hz buzz with 60Hz harmonic edge
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.setValueAtTime(0.4, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.78);
  }

  // 9. Clean Sparkle Chimes (Pickup Golden Basket)
  playCleanSparkle() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 987.77, 1046.50]; // C5, E5, G5, B5, C6
    arpeggio.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.25, t + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.75);
    });
  }

  // 10. Thermal Receipt Printer Chatter
  playReceiptPrinter() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 9; i++) {
      const delay = i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1400 + Math.random() * 400, t + delay);

      gain.gain.setValueAtTime(0.08, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.025);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.03);
    }
  }

  // ─── Internal Synth Helpers ───────────────────────────────────────────────
  _playSoftPad(freq, t, dur = 2.5, maxVol = 0.07) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, t);
    filter.Q.setValueAtTime(1.2, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(maxVol, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  _playSubBass(freq, t, dur = 2.2) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  _playLofiKick(t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.16);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  _playLofiSnare(t) {
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + 0.14);
  }

  _playLofiHiHat(t, vol = 0.04) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
    noise.stop(t + 0.045);
  }

  _playLofiMelody(freq, t) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }
}

// Global Singleton for the Laundromat Session
const laundromatAudio = new LaundromatAudioEngine();
  // ─── Gamified Audio Methods ───────────────────────────────────────────────
  const playMachineStart = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='); // Dummy fast beep
      audio.volume = 0.5;
      audio.play().catch(e => console.warn(e));
    } catch(e) {}
  };
  
  const playTimeTravel = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='); // Dummy swoosh
      audio.volume = 0.5;
      audio.play().catch(e => console.warn(e));
    } catch(e) {}
  };
  
  const playCoinDrop = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='); // Dummy coin
      audio.volume = 0.5;
      audio.play().catch(e => console.warn(e));
    } catch(e) {}
  };

  laundromatAudio.playMachineStart = playMachineStart;
  laundromatAudio.playTimeTravel = playTimeTravel;
  laundromatAudio.playCoinDrop = playCoinDrop;


export default function TransferPage() {
  const container = createElement('div', { className: 'page-container laundry-page' });
  container.style.cssText = 'padding: 20px; max-width: 650px; margin: 0 auto; color: #fff; font-family: "Share Tech Mono", monospace; min-height: 80vh;';

  // ─── Profile & Fee Configuration ──────────────────────────────────────────
  const getProfileFeeConfig = () => {
    const rawProfile = sessionStorage.getItem('current_profile') || 'Guest';
    const profile = rawProfile.toLowerCase();
    const currentPin = (sessionStorage.getItem('current_pin') || '').trim();
    const isArchitect = profile === 'architect' || currentPin === '672167566';
    const isFisherman = profile === 'fisherman';

    if (isArchitect) {
      return {
        rate: 0.0,
        profileName: 'Architect',
        label: 'AlphaCore Platform Fee (0% // ARCHITECT EXEMPT):',
        badge: 'ARCHITECT [0% SYSTEM FEE EXEMPT]',
        badgeColor: '#10b981',
        isExempt: true,
        detergentLabel: 'Architect VIP Voucher (100% Waived)'
      };
    } else if (isFisherman) {
      return {
        rate: 0.07,
        profileName: 'Fisherman',
        label: 'AlphaCore Platform Fee (7% // PREFERRED RATE):',
        badge: 'FISHERMAN [7% PREFERRED RATE]',
        badgeColor: '#06b6d4',
        isExempt: false,
        detergentLabel: 'Fisherman Harbor Rate (7% Commercial)'
      };
    } else {
      return {
        rate: 0.10,
        profileName: rawProfile,
        label: 'AlphaCore Platform Fee (10%):',
        badge: `${rawProfile.toUpperCase()} [10% STANDARD RATE]`,
        badgeColor: '#888888',
        isExempt: false,
        detergentLabel: 'Commercial Retention Pod (10% Standard)'
      };
    }
  };

  // ─── Fee Calculation Math ────────────────────────────────────────────────
  const calculateFees = (val, rate) => {
    const rawVal = parseFloat(val);
    if (isNaN(rawVal) || rawVal < 0.50) return null;

    const captureFee = (rawVal * 0.029) + 0.30;
    const platformFee = rawVal * rate;
    const remainder = rawVal - captureFee - platformFee;

    let payout = Math.max(0.01, remainder);
    let instantFee = 0.0;
    let connectFee = 0.0;

    if (rawVal >= 10) {
      payout = (remainder - 0.75) / 1.0025;
      instantFee = 0.50;
      connectFee = (payout * 0.0025) + 0.25;

      if (payout >= 33.33) {
        payout = (remainder - 0.25) / 1.0175;
        instantFee = payout * 0.015;
        connectFee = (payout * 0.0025) + 0.25;
      }
    }

    if (payout < 0) payout = 0;
    const totalFees = rawVal - payout;

    // Guaranteed penny-perfect balancing for simulated receipt items
    const utilityFee = Math.max(0, totalFees - (captureFee + platformFee + instantFee));

    return {
      rawVal,
      captureFee,
      platformFee,
      instantFee,
      connectFee: utilityFee, // ensures sum of 4 items equals totalFees exactly
      payout,
      totalFees,
      tokens: Math.max(1, Math.floor(rawVal * 4)) // minimum 1 token
    };
  };

  // ─── Temporary 7-Day Hold Target (Oct 6, 2026 First Payout Release) ────────
  const LAUNDROMAT_OPENING_TIME = new Date('2026-10-06T00:00:00-04:00').getTime();
  let countdownTimerId = null;

  // ─── Destination Constants & Directory Storage ───────────────────────────
  const DONATION_ACCOUNT_ID = 'acct_1UKrOjHx3NuZf8IK';
  const DONATION_ACCOUNT_NAME = '💝 AlphaCore Dev Fund (acct_1UKrOjHx3NuZf8IK) [DONATION]';

  const getSavedDestinations = () => {
    try {
      const all = JSON.parse(localStorage.getItem('alphacore_saved_destinations') || '[]');
      // Filter out donation ID so it only appears in the dedicated donation section
      return all.filter(d => d.id !== DONATION_ACCOUNT_ID);
    } catch {
      return [];
    }
  };

  const saveDestination = (id, name) => {
    try {
      if (id === DONATION_ACCOUNT_ID) return; // Do not save donation account as custom
      const existing = getSavedDestinations().filter(d => d.id !== id);
      existing.push({ id, name, addedAt: Date.now() });
      localStorage.setItem('alphacore_saved_destinations', JSON.stringify(existing));
    } catch {}
  };

  // Check for newly onboarded account in URL query
  try {
    const hashParts = (window.location.hash || '').split('?');
    const searchParams = new URLSearchParams(hashParts[1] || window.location.search);
    const onboardedAcct = searchParams.get('onboarded_acct');
    if (onboardedAcct && onboardedAcct.startsWith('acct_')) {
      saveDestination(onboardedAcct, `Onboarded Recipient (${onboardedAcct.slice(-6)})`);
    }
  } catch {}

  // ─── Minigame State ───────────────────────────────────────────────────────
  const initialSaved = getSavedDestinations();
  const initialDest = initialSaved.length > 0 ? initialSaved[0].id : '';
  const initialDestName = initialSaved.length > 0 ? `👤 ${initialSaved[0].name} [${initialSaved[0].id}]` : '';
  const activeProfile = canonicalProfileName(sessionStorage.getItem('current_profile') || 'Guest');
  const initialWallet = getProfileWallet(activeProfile);

  let state = {
    stage: 'wash_laundry', // 'wash_laundry' | 'laundromat_hub' | 'cash_to_coin' | 'washing_machines' | 'dryer_machines' | 'receive_laundry'
    amount: 25.00,
    paymentAuthorized: false,
    tokensHeld: 0,
    inventory: {
      coins: initialWallet.tokens || 0,
      laundry_load: 1,
      detergent: initialWallet.detergentPods || 1,
      dryer_sheets: initialWallet.dryerSheets || 1,
      clean_laundry: initialWallet.cleanLoads || 0
    },
    cleanCreditGiven: false,
    washerLoaded: false,
    washerTraveled: false,
    dryerLoaded: false,
    dryerTraveled: false,
    chronoOverlayText: '',
    activeModal: null,
    countdownOverlayActive: false, // 7-day feature countdown disabled for active operation
    selectedDestination: initialDest,
    selectedDestinationName: initialDestName,
    customDestinationId: '',
    verifiedCustomInfo: null,
    onboardingModalActive: false,
    donationConfirmModalActive: false, // Confirmation screen for voluntary donation to AlphaCore
    donationConfirmed: false // Explicit user confirmation that money goes to AlphaCore
  };

  let stripeInstance = null;
  let elementsInstance = null;

  // ─── Inject Scoped Styles ─────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .laundry-page {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      padding-bottom: 40px;
    }
    .laundry-stepper {
      display: flex;
      justify-content: flex-start;
      background: #060b13;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 8px 10px;
      margin-bottom: 14px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #06b6d4 #030712;
      gap: 6px;
      scroll-snap-type: x mandatory;
    }
    .laundry-stepper::-webkit-scrollbar {
      height: 4px;
    }
    .laundry-stepper::-webkit-scrollbar-track {
      background: #030712;
    }
    .laundry-stepper::-webkit-scrollbar-thumb {
      background: #06b6d4;
      border-radius: 2px;
    }
    .laundry-step-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: #6b7280;
      white-space: nowrap;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;
      scroll-snap-align: start;
      user-select: none;
      flex-shrink: 0;
      min-height: 36px;
    }
    .laundry-step-item.active {
      background: rgba(16, 185, 129, 0.16);
      color: #10b981;
      border: 1px solid #10b981;
      font-weight: bold;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
    }
    .laundry-step-item.completed {
      color: #06b6d4;
      background: rgba(6, 182, 212, 0.05);
    }
    .laundry-radio-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #030712;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 0.8rem;
    }
    .radio-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: radio-pulse 1.5s infinite alternate;
    }
    @keyframes radio-pulse {
      0% { opacity: 0.4; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 8px #10b981; }
    }
    .laundry-box {
      background: #070d17;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      position: relative;
    }
    .drum-viewport {
      width: 170px;
      height: 170px;
      border-radius: 50%;
      border: 8px solid #334155;
      margin: 20px auto;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #020617;
      box-shadow: inset 0 0 25px rgba(0,0,0,0.9);
    }
    .drum-inner-spinning {
      animation: spin-drum 2.5s linear infinite;
    }
    .drum-heat-glow {
      animation: heat-glow 2s ease-in-out infinite;
    }
    @keyframes spin-drum {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes heat-glow {
      0%, 100% {
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(245, 158, 11, 0.3);
        border-color: #f59e0b;
      }
      50% {
        box-shadow: 0 0 35px rgba(245, 158, 11, 0.8), inset 0 0 40px rgba(245, 158, 11, 0.6);
        border-color: #fbbf24;
      }
    }
    .chrono-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle, rgba(6,182,212,0.9) 0%, rgba(2,6,23,0.95) 80%);
      z-index: 50;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: warp-effect 0.8s ease-in-out forwards;
    }
    @keyframes warp-effect {
      0% { opacity: 0; transform: scale(0.9); filter: blur(10px); }
      50% { opacity: 1; transform: scale(1.02); filter: blur(0px); }
      100% { opacity: 0; transform: scale(1); pointer-events: none; }
    }
    .thermal-receipt {
      background: #0f172a;
      border: 1px dashed #38bdf8;
      border-radius: 6px;
      padding: 20px;
      color: #e2e8f0;
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.88rem;
      line-height: 1.4;
      position: relative;
    }
    .thermal-receipt::before, .thermal-receipt::after {
      content: '';
      position: absolute;
      left: 0; right: 0; height: 4px;
      background: repeating-linear-gradient(90deg, #38bdf8 0, #38bdf8 6px, transparent 6px, transparent 12px);
    }
    .thermal-receipt::before { top: 0; }
    .thermal-receipt::after { bottom: 0; }
    .laundry-distraction-modal {
      animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .laundry-countdown-modal {
      animation: modal-pop 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .countdown-card {
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .countdown-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3) !important;
    }
    @keyframes modal-pop {
      0% { opacity: 0; transform: scale(0.92); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* ─── High Immersion Mobile Responsive Overrides ─── */
    @media (max-width: 640px) {
      .laundry-page {
        padding-left: 0px !important;
        padding-right: 0px !important;
      }
      .laundry-box {
        padding: 16px 12px !important;
        border-radius: 6px !important;
      }
      .laundry-radio-bar {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
        padding: 10px 12px !important;
      }
      .laundry-radio-bar-left {
        justify-content: flex-start !important;
      }
      .laundry-radio-bar-right {
        justify-content: space-between !important;
        width: 100% !important;
      }
      .laundry-step-item {
        padding: 6px 10px !important;
        font-size: 0.72rem !important;
        min-height: 34px !important;
      }
      .drum-viewport {
        width: 140px !important;
        height: 140px !important;
        margin: 16px auto !important;
      }
      .thermal-receipt {
        padding: 16px 10px !important;
        font-size: 0.8rem !important;
      }
      .laundry-countdown-banner {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
      }
      .laundry-countdown-banner > button {
        width: 100% !important;
      }
      .mobile-stack-columns {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  container.appendChild(styleEl);

  // ─── Main Render Function ─────────────────────────────────────────────────
  const render = () => {
    const feeConfig = getProfileFeeConfig();

    container.innerHTML = '';
    container.appendChild(styleEl);

    const curProfile = canonicalProfileName(sessionStorage.getItem('current_profile') || 'Guest');
    const curWallet = getProfileWallet(curProfile);

    // ─── Top Header ─────────────────────────────────────────────────────────
    const headerEl = createElement('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #1e293b; padding-bottom:12px; flex-wrap:wrap; gap:8px;' });
    headerEl.innerHTML = `
      <div>
        <div style="font-size:0.75rem; color:#06b6d4; letter-spacing:2px; font-weight:bold;">// SECTOR 7 COIN-OP PROTOCOL</div>
        <h1 style="font-family:'Orbitron', sans-serif; font-size:clamp(1.15rem, 4vw, 1.45rem); color:#10b981; margin:4px 0 0 0; display:flex; align-items:center; gap:8px;">
          <span>🧺</span> THE LAUNDRO-MAT
        </h1>
      </div>
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
        <button id="btn-header-wallet" class="aim-btn" style="display:flex; align-items:center; gap:6px; background:#070d17; border:1px solid ${curWallet.accentColor}; padding:6px 12px; border-radius:4px; font-size:0.75rem; cursor:pointer;" title="Inspect Account Wallets">
          <span style="font-size:0.95rem;">💳</span>
          <span style="color:${curWallet.accentColor}; font-weight:bold; font-family:'Orbitron',sans-serif;">${curWallet.cardId}</span>
          <span style="color:#10b981; font-weight:bold;">$${curWallet.balance.toFixed(2)}</span>
          <span style="color:#f59e0b; font-weight:bold;">🪙 ${curWallet.tokens}</span>
          <span style="color:#06b6d4; font-size:0.68rem; margin-left:2px;">ACCOUNTS ▾</span>
        </button>
        <span style="display:inline-block; font-size:0.75rem; padding:4px 10px; border-radius:3px; font-weight:bold; border:1px solid ${feeConfig.badgeColor}; color:${feeConfig.badgeColor}; background:${feeConfig.badgeColor}15;">
          ${feeConfig.badge}
        </span>
      </div>
    `;

    const btnHdrWallet = headerEl.querySelector('#btn-header-wallet');
    if (btnHdrWallet) {
      btnHdrWallet.onclick = () => {
        playSFX('click');
        openWalletInspectorModal({ onProfileSwitched: () => render() });
      };
    }
    container.appendChild(headerEl);

    // ─── 7-Day Countdown Header Ribbon (When Overlay is Dismissed) ───────────
    if (!state.countdownOverlayActive) {
      const bannerEl = createElement('div', {
        className: 'laundry-countdown-banner',
        style: 'background: rgba(245, 158, 11, 0.12); border: 1px solid #f59e0b; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;'
      });
      bannerEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; color: #fbbf24; font-size: 0.82rem; flex: 1; min-width: 200px;">
          <span style="font-size: 1.2rem; filter: drop-shadow(0 0 6px #f59e0b);">☣️</span>
          <span><strong>7-DAY LAUNDRO-MAT SANITATION HOLD:</strong> "Gotta wear your clothes for 7 days until the laundro-mat is open for business!" (Grand Opening: Oct 6, 2026)</span>
        </div>
        <button id="btn-reopen-countdown" class="aim-btn" style="padding: 6px 14px; font-size: 0.75rem; border-color: #f59e0b; color: #fbbf24; cursor: pointer; white-space: nowrap; font-weight: bold; min-height: 36px;">
          VIEW COUNTDOWN ➔
        </button>
      `;
      bannerEl.querySelector('#btn-reopen-countdown').onclick = () => {
        playSFX('click');
        state.countdownOverlayActive = true;
        render();
      };
      container.appendChild(bannerEl);
    }

    // ─── Top Stepper Progress Bar ───────────────────────────────────────────
    const steps = [
      { id: 'wash_laundry', label: '1. Wash Laundry', icon: '🧺' },
      { id: 'laundromat_hub', label: '2. Laundro-mat', icon: '🏪' },
      { id: 'cash_to_coin', label: '3. Coin Changer', icon: '🪙' },
      { id: 'washing_machines', label: '4. Washer', icon: '🫧' },
      { id: 'dryer_machines', label: '5. Dryer', icon: '🔥' },
      { id: 'receive_laundry', label: '6. Clean Pickup', icon: '✨' }
    ];

    const stepperEl = createElement('div', { className: 'laundry-stepper' });
    const stageIdx = steps.findIndex(s => s.id === state.stage);

    steps.forEach((step, idx) => {
      const stepItem = createElement('div', {
        className: `laundry-step-item ${state.stage === step.id ? 'active' : ''} ${idx < stageIdx ? 'completed' : ''}`,
        innerHTML: `<span>${idx < stageIdx ? '✓' : step.icon}</span> ${step.label}`
      });
      stepItem.onclick = () => {
        laundromatAudio.init();
        playSFX('click');
        state.stage = step.id;
        render();
      };
      stepperEl.appendChild(stepItem);
    });
    container.appendChild(stepperEl);

    // Auto-scroll active stepper item into center view on mobile touch devices
    setTimeout(() => {
      const activeStep = stepperEl.querySelector('.laundry-step-item.active');
      if (activeStep && typeof activeStep.scrollIntoView === 'function') {
        activeStep.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 60);

    // ─── Laundro-mat Radio Bar (Cozy Lo-Fi Music In Background) ──────────────
    const radioBar = createElement('div', { className: 'laundry-radio-bar' });
    radioBar.innerHTML = `
      <div class="laundry-radio-bar-left" style="display:flex; align-items:center; gap:8px;">
        <span class="radio-dot" style="${!laundromatAudio.isMusicPlaying ? 'background:#64748b; animation:none;' : ''}"></span>
        <span style="color:#06b6d4; font-weight:bold;">📻 LAUNDRO-MAT RADIO:</span>
        <span style="color:${laundromatAudio.isMusicPlaying ? '#38bdf8' : '#64748b'}; font-size:0.78rem;">
          ${laundromatAudio.isMusicPlaying ? '24/7 Neon-Spin Lo-Fi Chillhop [80 BPM]' : 'Radio Paused'}
        </span>
      </div>
      <div class="laundry-radio-bar-right" style="display:flex; align-items:center; gap:8px;">
        <button id="radio-btn-toggle" class="aim-btn" style="padding:6px 12px; font-size:0.75rem; background:${laundromatAudio.isMusicPlaying ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; border-color:${laundromatAudio.isMusicPlaying ? '#ef4444' : '#10b981'}; color:${laundromatAudio.isMusicPlaying ? '#ef4444' : '#10b981'}; cursor:pointer; min-height:36px;">
          ${laundromatAudio.isMusicPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <span style="font-size:0.75rem; color:#64748b;">VOL</span>
        <input type="range" id="radio-vol-slider" min="0" max="1" step="0.05" value="${laundromatAudio.musicVolume}" style="width:65px; height:24px; accent-color:#06b6d4; cursor:pointer;" title="Laundro-mat Radio Volume">
      </div>
    `;

    radioBar.querySelector('#radio-btn-toggle').onclick = () => {
      laundromatAudio.toggleMusic();
      render();
    };

    radioBar.querySelector('#radio-vol-slider').oninput = (e) => {
      laundromatAudio.setVolume(parseFloat(e.target.value));
    };

    container.appendChild(radioBar);

    // ─── Stage Body Container ───────────────────────────────────────────────
    const bodyBox = createElement('div', { className: 'laundry-box' });
    container.appendChild(bodyBox);

    // ─── Temporal Warp Overlay (When Time Traveling) ─────────────────────────
    if (state.chronoOverlayText) {
      const overlay = createElement('div', { className: 'chrono-overlay' });
      overlay.innerHTML = `
        <div style="font-size:3rem; margin-bottom:10px;">⚡⏳⚡</div>
        <div style="font-family:'Orbitron', sans-serif; font-size:1.3rem; color:#fff; font-weight:bold; text-align:center;">
          ${state.chronoOverlayText}
        </div>
        <div style="color:#a5f3fc; font-size:0.85rem; margin-top:8px;">WARPING TIMELINE... +60 MINUTES ELAPSED</div>
      `;
      bodyBox.appendChild(overlay);
      setTimeout(() => {
        state.chronoOverlayText = '';
        const ov = bodyBox.querySelector('.chrono-overlay');
        if (ov) ov.remove();
      }, 800);
    }

    // ────────────────────────────────────────────────────────────────────────
    // STAGE 1: WASH LAUNDRY (Gather Soiled Cyberwear)
    // ────────────────────────────────────────────────────────────────────────
    if (state.stage === 'wash_laundry') {
      bodyBox.innerHTML = `
        <div style="text-align: center; padding: 20px 10px;">
          <div style="font-size: 4rem; filter: drop-shadow(0 0 15px rgba(16,185,129,0.3)); margin-bottom: 10px;">🧺</div>
          <div style="color: #ef4444; font-size: 0.85rem; letter-spacing: 1px; font-weight: bold; margin-bottom: 8px;">
            [!] SOIL DETECTED // STREET DATA RESIDUE CRITICAL
          </div>
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 12px 0; font-size: clamp(1.15rem, 3.5vw, 1.35rem);">
            WASH LAUNDRY: STEP 01
          </h2>
          <p style="color: #94a3b8; font-size: 0.95rem; max-width: 480px; margin: 0 auto 24px auto; line-height: 1.6;">
            Your cyber-threads, ledger tracks, and digital garments are heavily soiled. Grab your bulging dirty load firmly with both hands and head over to the 24/7 coin-op laundro-mat.
          </p>
          
          <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; padding: 15px; max-width: 450px; margin: 0 auto 24px auto; text-align: left; font-size: 0.85rem;">
            <div style="color: #10b981; font-weight: bold; margin-bottom: 6px;">📋 LAUNDRY HAMPER INVENTORY:</div>
            <div style="color: #cbd5e1; display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>• Soiled Operative Overcoat:</span> <span style="color:#ef4444;">BULGING LOAD (100%)</span>
            </div>
            <div style="color: #cbd5e1; display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>• Telemetry-Laced Jeans:</span> <span style="color:#ef4444;">SWEATY & STAINED</span>
            </div>
            <div style="color: #cbd5e1; display:flex; justify-content:space-between;">
              <span>• Untracked Digital Stash:</span> <span style="color:#f59e0b;">READY FOR PENETRATION</span>
            </div>
          </div>

          <button id="btn-goto-laundromat" class="aim-btn" style="width: 100%; max-width: 450px; padding: 16px; font-size: 1rem; background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer; min-height: 48px;">
            🧺 GRAB YOUR DIRTY LOAD FIRMLY & ENTER LAUNDRO-MAT ➔
          </button>
        </div>
      `;

      bodyBox.querySelector('#btn-goto-laundromat').onclick = () => {
        laundromatAudio.init();
        laundromatAudio.playDoorChime();
        laundromatAudio.startMusic();
        playSFX('navigate');
        state.stage = 'laundromat_hub';
        render();
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // STAGE 2: GOTO LAUNDROMAT (Arrive at Laundro-mat Hub)
    // ────────────────────────────────────────────────────────────────────────
    else if (state.stage === 'laundromat_hub') {
      bodyBox.innerHTML = `
        <div style="text-align: center; padding: 15px 10px;">
          <div style="display:inline-block; background:rgba(6,182,212,0.1); border:1px solid #06b6d4; padding:6px 14px; border-radius:20px; font-size:0.8rem; color:#06b6d4; margin-bottom:12px; font-weight:bold;">
            ⚡ 24/7 CYBER-SPIN COIN-OP // SECTOR 07 ⚡
          </div>
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 10px 0; font-size: clamp(1.15rem, 3.5vw, 1.35rem);">
            THE LAUNDRO-MAT MAIN FLOOR
          </h2>
          <p style="color: #94a3b8; font-size: 0.95rem; max-width: 480px; margin: 0 auto 20px auto; line-height: 1.5;">
            Look at all these vibrating machines humming in the neon glow. The commercial washers are tight and won't accept anything until you slide hard coin tokens in. Head over to the cash changer and slide your bills in.
          </p>

          <!-- Operative Smartcard & Account Balance Mount -->
          <div id="laundromat-wallet-mount" style="max-width: 520px; margin: 0 auto 16px auto;"></div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 480px; margin: 0 auto 20px auto; text-align: left;">
            <div style="background: #0b1322; border: 1px solid #1e293b; padding: 12px; border-radius: 6px;">
              <div style="font-size: 0.75rem; color: #888;">CURRENT STATUS</div>
              <div style="font-size: 1rem; color: #10b981; font-weight: bold; margin-top: 4px;">🧺 ${curWallet.cleanLoads} CLEAN / 1 DIRTY</div>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Waiting for coin lube</div>
            </div>
            <div style="background: #0b1322; border: 1px solid #1e293b; padding: 12px; border-radius: 6px;">
              <div style="font-size: 0.75rem; color: #888;">TOKEN SACK</div>
              <div style="font-size: 1rem; color: #f59e0b; font-weight: bold; margin-top: 4px;">🪙 ${curWallet.tokens} TOKENS</div>
              <div style="font-size: 0.75rem; color: ${curWallet.tokens > 0 ? '#10b981' : '#ef4444'}; margin-top: 2px;">${curWallet.tokens > 0 ? 'Ready for machine insertion' : 'Needs ATM deposit'}</div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; max-width: 480px; margin: 0 auto 10px auto;">
            <button id="btn-back-hamper" class="aim-btn" style="flex: 1; padding: 14px; background: transparent; border-color: #334155; color: #94a3b8; cursor: pointer;">
              ⬅ BACK
            </button>
            <button id="btn-goto-changer" class="aim-btn" style="flex: 2; padding: 14px; background: rgba(6, 182, 212, 0.15); border-color: #06b6d4; color: #06b6d4; font-weight: bold; cursor: pointer;">
              🪙 SLIDE OVER TO CASH CHANGER ➔
            </button>
          </div>

          <button id="btn-lost-found" class="aim-btn" style="max-width: 480px; width: 100%; padding: 10px; background: rgba(168, 85, 247, 0.12); border-color: #a855f7; color: #c084fc; font-size: 0.82rem; font-weight: bold; cursor: pointer;">
            👙 RUMMAGE THROUGH ABANDONED LOST & FOUND BASKET
          </button>
        </div>
      `;

      // Mount Operative Smartcard & Account Balance Component
      const walletMount = bodyBox.querySelector('#laundromat-wallet-mount');
      if (walletMount) {
        walletMount.appendChild(renderLaundromatWallet({
          currentProfile: feeConfig.profileName,
          onProfileSwitched: () => render(),
          onDepositClick: () => {
            laundromatAudio.playCoinClink();
            state.stage = 'cash_to_coin';
            render();
          }
        }));
      }

      bodyBox.querySelector('#btn-back-hamper').onclick = () => {
        playSFX('click');
        state.stage = 'wash_laundry';
        render();
      };
      bodyBox.querySelector('#btn-goto-changer').onclick = () => {
        laundromatAudio.playCoinClink();
        playSFX('transition');
        state.stage = 'cash_to_coin';
        render();
      };
      const btnLostFound = bodyBox.querySelector('#btn-lost-found');
      if (btnLostFound) {
        btnLostFound.onclick = () => {
          playSFX('glitch');
          state.activeModal = {
            icon: '👙🔍',
            title: '// ABANDONED GARMENT AUDIT',
            titleColor: '#c084fc',
            borderColor: '#a855f7',
            glowColor: 'rgba(168,85,247,0.3)',
            btnBg: 'rgba(168,85,247,0.25)',
            message: 'You discreetly peeked through the dusty plastic laundry basket labeled "LOST & FORGOTTEN". Underneath a singed cyber-hoodie, you spotted a neon lace thong and a handwritten pager number with coordinates to Sector 9. An attendant yelled "HEY!" from across the folding table.',
            subtext: '⚡ [SIMULATED SNOOPING // 0 DEDUCTION TO FUNDS]',
            buttonText: '😳 QUICKLY DROP IT & LOOK INNOCENT ➔'
          };
          render();
        };
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // STAGE 3: CASH-TO-COIN MACHINE (Custom Amount, Stripe & Optional Minigame)
    // ────────────────────────────────────────────────────────────────────────
    else if (state.stage === 'cash_to_coin') {
      const activeFeeData = calculateFees(state.amount, feeConfig.rate) || {
        rawVal: 0,
        captureFee: 0,
        platformFee: 0,
        instantFee: 0,
        connectFee: 0,
        payout: 0,
        totalFees: 0,
        tokens: 0
      };

      const rawProfile = sessionStorage.getItem('current_profile') || 'Guest';
      const isGuest = rawProfile.toLowerCase() === 'guest';

      bodyBox.innerHTML = `
        <!-- Cyber-ATM 9000 Hardware Cabinet -->
        <div class="atm-cabinet">
          <!-- ATM Marquee Header -->
          <div class="atm-marquee">
            <div>
              <span style="font-size: 0.75rem; color: #06b6d4; font-weight: bold; letter-spacing: 2px;">// SECTOR 07 HARDWARE CHANGER</span>
              <h3 style="font-family: 'Orbitron', sans-serif; margin: 4px 0 0 0; color: #fff; font-size: clamp(1.1rem, 3.5vw, 1.35rem); display: flex; align-items: center; gap: 8px;">
                <span>🏧</span> ALPHA-ATM 9000 & COIN TERMINAL
              </h3>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; font-size: 0.75rem; color: #10b981; font-weight: bold; background: rgba(16,185,129,0.15); border: 1px solid #10b981; padding: 3px 8px; border-radius: 4px;">
                ● DIRECT STRIPE UPLINK ONLINE
              </span>
            </div>
          </div>

          <!-- CRT Display Terminal Screen -->
          <div class="atm-crt-screen">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(6,182,212,0.3); padding-bottom: 8px; margin-bottom: 12px;">
              <span style="font-size: 0.8rem; color: #38bdf8; font-family: monospace;">[TERMINAL STATUS: READY FOR INSERTION]</span>
              <span style="font-size: 0.85rem; color: #f59e0b; font-weight: bold;">EXCHANGE RATE: $1.00 = 4 HARD TOKENS</span>
            </div>

            <!-- DOCKED OPERATIVE LAUNDRY SMARTCARD -->
            <div style="background: rgba(0,0,0,0.65); border: 1px solid ${curWallet.accentColor}; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; box-shadow: inset 0 0 15px ${curWallet.accentColor}15;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.4rem;">💳</span>
                <div>
                  <div style="font-size: 0.68rem; color: #94a3b8; letter-spacing: 1px;">DOCKED OPERATIVE LAUNDRY SMARTCARD:</div>
                  <div style="font-family: 'Orbitron', sans-serif; font-size: 0.95rem; color: ${curWallet.accentColor}; font-weight: bold;">
                    ${curWallet.cardId} &bull; ${curWallet.profile.toUpperCase()}
                  </div>
                  <div style="font-size: 0.68rem; color: #64748b;">${curWallet.roleTitle}</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.68rem; color: #94a3b8;">CURRENT STORED BALANCE:</div>
                <div style="font-family: 'Orbitron', sans-serif; font-size: 1.2rem; color: #10b981; font-weight: bold; text-shadow: 0 0 8px rgba(16,185,129,0.3);">
                  $${curWallet.balance.toFixed(2)} <span style="font-size: 0.72rem; color: #94a3b8;">USD</span>
                </div>
                <div style="font-size: 0.72rem; color: #f59e0b; margin-top: 1px;">🪙 ${curWallet.tokens} Hard Tokens</div>
              </div>
            </div>

            <!-- SOURCE & DESTINATION MATRIX (High Visibility) -->
            <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
              <div style="font-size: 0.8rem; color: #06b6d4; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">
                // SOURCE & DESTINATION ROUTING MATRIX
              </div>

              <!-- Source -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px;">
                <span style="color: #94a3b8;">SOURCE (FUNDING INSTRUMENT):</span>
                <span style="color: #fff; font-weight: bold;">💳 Card / Cash App (Instant Capture)</span>
              </div>

              <!-- Destination Routing Choice -->
              <div style="font-size: 0.85rem; margin-top: 10px;">
                <div style="color: #94a3b8; margin-bottom: 6px;">DESTINATION (PAYOUT RECIPIENT):</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                  <button id="dest-mode-vault" class="aim-btn" style="padding: 10px; font-size: 0.78rem; background: ${state.selectedDestination === DONATION_ACCOUNT_ID ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}; border-color: ${state.selectedDestination === DONATION_ACCOUNT_ID ? '#10b981' : '#334155'}; color: #fff; cursor: pointer; text-align: left;">
                    <div style="font-weight: bold; color: #10b981;">🏦 AlphaCore Sutton Vault</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">Bypasses 7-Day Platform Hold</div>
                  </button>
                  <button id="dest-mode-pushtocard" class="aim-btn" style="padding: 10px; font-size: 0.78rem; background: ${state.selectedDestination !== DONATION_ACCOUNT_ID ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)'}; border-color: ${state.selectedDestination !== DONATION_ACCOUNT_ID ? '#06b6d4' : '#334155'}; color: #fff; cursor: pointer; text-align: left;">
                    <div style="font-weight: bold; color: #06b6d4;">💳 Instant Push-to-Card</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">Direct Debit Card Payout (No Acct #)</div>
                  </button>
                </div>
              </div>
            </div>

            <!-- ATM Cash Deposit Input & Token Yield -->
            <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <label style="color: #94a3b8; font-size: 0.85rem; font-weight: bold;">ENTER CASH DEPOSIT AMOUNT (USD) [MIN $0.50]:</label>
                <span id="token-count-display" style="color: #f59e0b; font-weight: bold; font-size: 0.95rem;">
                  🪙 ${activeFeeData.tokens} HARD TOKENS
                </span>
              </div>
              <div style="position: relative; margin-bottom: 10px;">
                <span style="position: absolute; left: 14px; top: 11px; font-size: 1.5rem; color: #10b981;">$</span>
                <input type="number" id="cash-amount-input" value="${state.amount || ''}" placeholder="0.50" min="0.50" step="0.01"
                  style="width: 100%; min-height: 52px; background: #000; border: 1px solid #10b981; color: #10b981; padding: 12px 12px 12px 35px; font-size: 1.5rem; font-family: 'Share Tech Mono', monospace; outline: none; box-sizing: border-box; border-radius: 4px;">
              </div>
              <!-- Quick Presets -->
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${[1, 5, 10, 25, 50, 100].map(val => `
                  <button class="aim-btn btn-preset" data-val="${val}" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.05); border-color: #334155; color: #cbd5e1; cursor: pointer;">
                    $${val}.00
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Thematic Laundromat Fee Breakdown Table -->
            <div style="background: rgba(0,0,0,0.5); border: 1px solid #1e293b; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #1f293d; padding-bottom: 6px;">
                <span style="font-family: 'Orbitron', sans-serif; font-size: 0.82rem; color: #06b6d4; font-weight: bold;">
                  THEMATIC LAUNDRO-MAT FEES & VALUE LEDGER
                </span>
                <span style="font-size: 0.75rem; color: ${feeConfig.badgeColor};">${feeConfig.badge}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #888; font-size: 0.82rem;">
                <span>Water & Machine Capture (Stripe 2.9% + $0.30):</span>
                <span id="fee-capture" style="color:#cbd5e1;">-$${activeFeeData.captureFee.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.82rem; color: ${feeConfig.isExempt ? '#10b981' : '#888'};">
                <span id="fee-alpha-label">${feeConfig.detergentLabel || feeConfig.label}:</span>
                <span id="fee-alpha">${feeConfig.isExempt ? '$0.00 (VIP EXEMPT)' : `-$${activeFeeData.platformFee.toFixed(2)}`}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #888; font-size: 0.82rem; border-bottom: 1px dashed #1e293b; padding-bottom: 6px;">
                <span>Direct Express Wash Routing (Stripe Connect):</span>
                <span id="fee-connect" style="color:#cbd5e1;">-$${activeFeeData.connectFee.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 1rem; color: #fff;">
                <strong>NET CLEAN PAYOUT AVAILABLE:</strong>
                <strong id="final-payout" style="color: #10b981;">$${activeFeeData.payout.toFixed(2)}</strong>
              </div>
            </div>

            <!-- Animated Card Insertion Slot Area -->
            <div class="atm-card-slot-wrap">
              <div id="card-graphic" class="animated-credit-card ${state.cardInserting ? 'card-inserting' : ''}">
                <span>CHIP // VISA</span>
              </div>
              <div class="atm-card-slot"></div>
              <div style="font-size: 0.75rem; color: #06b6d4; font-weight: bold; margin-top: 6px;">
                ${state.cardInserting ? '⚡ READING CARD DATA & ENCRYPTING...' : '▼ CARD INSERTION SLOT ▼'}
              </div>
            </div>
          </div>

          <!-- Action Buttons Area -->
          <div style="margin-bottom: 16px;">
            <button id="btn-initiate-deposit" class="aim-btn" style="width: 100%; min-height: 52px; padding: 14px; font-size: 1.05rem; background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer; border-radius: 6px; box-shadow: 0 0 15px rgba(16,185,129,0.25);" ${(!activeFeeData || activeFeeData.rawVal < 0.50) ? 'disabled' : ''}>
              💳 INSERT CARD & DEPOSIT $${state.amount ? Number(state.amount).toFixed(2) : '0.00'}
            </button>

            <!-- Stripe Card Element Mount Container -->
            <div id="stripe-ui-container" style="display: none; margin-top: 14px; background: #020617; border: 1px solid #06b6d4; padding: 18px; border-radius: 8px;">
              <div style="color: #06b6d4; font-size: 0.85rem; font-weight: bold; margin-bottom: 12px;">// ENTER SOURCE PAYMENT CARD DETAILS:</div>
              <div id="payment-element"></div>
              <button id="submit-payment-btn" class="aim-btn" style="width: 100%; min-height: 48px; margin-top: 16px; padding: 14px; background: #06b6d4; border-color: #06b6d4; color: #000; font-weight: bold; cursor: pointer; border-radius: 4px;">
                CONFIRM DEPOSIT & DISPENSE TOKENS
              </button>
              <div id="payment-message" style="color: #ef4444; margin-top: 10px; font-family: sans-serif; display: none;"></div>
            </div>
          </div>

          <!-- Animated Coin Dispenser Tray -->
          <div class="atm-dispenser-tray">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: bold; margin-bottom: 6px; letter-spacing: 1px;">
              HARD COIN TOKEN DISPENSER TRAY
            </div>
            <div id="dispenser-coins" style="font-size: 2.2rem; min-height: 45px; display: flex; align-items: center; justify-content: center; gap: 8px;">
              ${state.tokensHeld > 0 ? '<span class="coin-dispensing">🪙</span><span class="coin-dispensing">🪙</span><span class="coin-dispensing">🪙</span>' : '<span style="font-size:0.85rem; color:#475569;">[TRAY EMPTY // AWAITING DEPOSIT]</span>'}
            </div>
            ${state.tokensHeld > 0 ? `
              <button id="btn-collect-proceed" class="aim-btn" style="margin-top: 10px; padding: 10px 20px; background: rgba(245,158,11,0.2); border-color: #f59e0b; color: #fbbf24; font-weight: bold; cursor: pointer; border-radius: 4px;">
                🪙 COLLECT ${state.tokensHeld} TOKENS & PROCEED TO WASHERS ➔
              </button>
            ` : ''}
          </div>

          <!-- Push-to-Card Instant Payout Direct Gateway (The Coin Changer Cash-Out) -->
          <div style="margin-top: 20px; background: #050912; border: 1px solid #1e293b; padding: 18px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
              <div>
                <span style="font-size: 0.75rem; color: #06b6d4; font-weight: bold;">// COIN CHANGER & CASH-OUT</span>
                <h4 style="font-family: 'Orbitron', sans-serif; margin: 2px 0 0 0; color: #fff; font-size: 1rem;">
                  INSTANT PUSH-TO-CARD DEBIT PAYOUT
                </h4>
              </div>
              <span style="font-size: 0.78rem; color: #10b981; font-weight: bold;">NO STRIPE ACCOUNT REQUIRED</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0; line-height: 1.4;">
              Ready to cash out clean laundry? Enter any Visa or Mastercard debit card (including Cash App Cash Card or Chime). Funds arrive in under 60 seconds.
            </p>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 12px;" class="mobile-stack-columns">
              <input type="text" id="payout-card-num" placeholder="Debit Card Number (16 Digits)" maxlength="19"
                style="background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; border-radius: 4px; outline: none;">
              <input type="text" id="payout-card-exp" placeholder="MM/YY" maxlength="5"
                style="background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; border-radius: 4px; outline: none;">
              <input type="text" id="payout-card-cvc" placeholder="CVC" maxlength="4"
                style="background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; border-radius: 4px; outline: none;">
            </div>

            <button id="btn-execute-push-payout" class="aim-btn" style="width: 100%; min-height: 48px; padding: 12px; background: rgba(6,182,212,0.2); border-color: #06b6d4; color: #06b6d4; font-weight: bold; cursor: pointer; border-radius: 4px;">
              ⚡ EXECUTE INSTANT PAYOUT ($${activeFeeData.payout.toFixed(2)}) TO DEBIT CARD
            </button>
            <div id="payout-status-msg" style="margin-top: 10px; font-size: 0.85rem; display: none;"></div>
          </div>
        </div>

        <!-- Guest Session Security Warning Intercept Modal -->
        ${state.guestWarningModalActive ? `
          <div class="laundry-modal-overlay">
            <div class="laundry-modal-box" style="border-color: #f59e0b; box-shadow: 0 0 40px rgba(245,158,11,0.3);">
              <div style="font-size: 3rem; margin-bottom: 8px;">⚠️</div>
              <h3 style="font-family: 'Orbitron', sans-serif; color: #fbbf24; margin: 0 0 10px 0; font-size: 1.2rem;">
                GUEST PROFILE ESCROW WARNING
              </h3>
              <p style="color: #cbd5e1; font-size: 0.88rem; line-height: 1.6; text-align: left; background: rgba(0,0,0,0.5); padding: 14px; border-radius: 6px; border: 1px solid #475569; margin-bottom: 14px;">
                You are currently depositing on an anonymous <strong>Guest Profile</strong>.
                <br><br>
                • <strong>Holding Tank:</strong> If you close or refresh this page before completing your payout at the Coin Changer, unclaimed funds will be held in temporary escrow for <strong>24 hours</strong>.
                <br><br>
                • <strong>Auto-Refund Safety:</strong> After 24 hours, the system will automatically refund your deposit back to the source card.
                <br><br>
                • <strong>Non-Refundable Fees:</strong> External network transaction processing fees ($0.30 + 2.9%) cannot be refunded.
                <br><br>
                • <strong>Recommended:</strong> Authenticate with your User PIN to permanently hold balances across visits.
              </p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="btn-guest-cancel" class="aim-btn" style="flex: 1; padding: 12px; border-color: #64748b; color: #94a3b8; cursor: pointer;">
                  CANCEL
                </button>
                <button id="btn-guest-proceed" class="aim-btn" style="flex: 2; padding: 12px; background: rgba(245,158,11,0.2); border-color: #f59e0b; color: #fbbf24; font-weight: bold; cursor: pointer;">
                  I UNDERSTAND // PROCEED AS GUEST
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      `;

      // Wire Up Destination Selection
      const btnDestVault = bodyBox.querySelector('#dest-mode-vault');
      const btnDestCard = bodyBox.querySelector('#dest-mode-pushtocard');
      if (btnDestVault) {
        btnDestVault.onclick = () => {
          playSFX('click');
          state.selectedDestination = DONATION_ACCOUNT_ID;
          render();
        };
      }
      if (btnDestCard) {
        btnDestCard.onclick = () => {
          playSFX('click');
          state.selectedDestination = 'pushtocard';
          render();
        };
      }

      // Wire Up Cash Input & Presets
      const cashInput = bodyBox.querySelector('#cash-amount-input');
      const tokenDisplay = bodyBox.querySelector('#token-count-display');
      const elCapture = bodyBox.querySelector('#fee-capture');
      const elAlpha = bodyBox.querySelector('#fee-alpha');
      const elConnect = bodyBox.querySelector('#fee-connect');
      const elPayout = bodyBox.querySelector('#final-payout');
      const btnDeposit = bodyBox.querySelector('#btn-initiate-deposit');

      bodyBox.querySelectorAll('.btn-preset').forEach(btn => {
        btn.onclick = () => {
          playSFX('click');
          state.amount = parseFloat(btn.getAttribute('data-val'));
          render();
        };
      });

      if (cashInput) {
        cashInput.oninput = (e) => {
          const val = e.target.value;
          state.amount = val;
          const calc = calculateFees(val, feeConfig.rate);
          if (!calc) {
            tokenDisplay.textContent = '🪙 0 TOKENS';
            elCapture.textContent = '-$0.00';
            elAlpha.textContent = feeConfig.isExempt ? '$0.00' : '-$0.00';
            elConnect.textContent = '-$0.00';
            elPayout.textContent = '$0.00';
            elPayout.style.color = '#ef4444';
            btnDeposit.disabled = true;
            return;
          }
          tokenDisplay.textContent = `🪙 ${calc.tokens} HARD TOKENS`;
          elCapture.textContent = `-$${calc.captureFee.toFixed(2)}`;
          elAlpha.textContent = feeConfig.isExempt ? '$0.00 (VIP EXEMPT)' : `-$${calc.platformFee.toFixed(2)}`;
          elConnect.textContent = `-$${calc.connectFee.toFixed(2)}`;
          elPayout.textContent = `$${calc.payout.toFixed(2)}`;
          elPayout.style.color = '#10b981';
          btnDeposit.disabled = false;
          btnDeposit.textContent = `💳 INSERT CARD & DEPOSIT $${Number(val).toFixed(2)}`;
        };
      }

      // Wire Up Deposit Initiation & Guest Intercept
      if (btnDeposit) {
        btnDeposit.onclick = () => {
          if (isGuest && !state.guestWarningModalActive) {
            playSFX('alert');
            state.guestWarningModalActive = true;
            render();
            return;
          }
          triggerCardInsertion();
        };
      }

      // Wire Up Guest Warning Modal Buttons
      const btnGuestCancel = bodyBox.querySelector('#btn-guest-cancel');
      const btnGuestProceed = bodyBox.querySelector('#btn-guest-proceed');
      if (btnGuestCancel) {
        btnGuestCancel.onclick = () => {
          playSFX('click');
          state.guestWarningModalActive = false;
          render();
        };
      }
      if (btnGuestProceed) {
        btnGuestProceed.onclick = () => {
          playSFX('click');
          state.guestWarningModalActive = false;
          triggerCardInsertion();
        };
      }

      // Card Insertion & Stripe Elements Execution
      async function triggerCardInsertion() {
        state.cardInserting = true;
        laundromatAudio.init();
        laundromatAudio.playBillWhir();
        playSFX('transition');
        const cardGfx = bodyBox.querySelector('#card-graphic');
        if (cardGfx) cardGfx.classList.add('card-inserting');

        const stripeBox = bodyBox.querySelector('#stripe-ui-container');
        if (stripeBox) stripeBox.style.display = 'block';

        btnDeposit.disabled = true;
        btnDeposit.textContent = '⚡ ESTABLISHING SECURE STRIPE UPLINK...';

        try {
          const resp = await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/atm-deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: state.amount,
              profile: rawProfile,
              is_guest: isGuest
            })
          });

          const data = await resp.json();
          if (!resp.ok) throw new Error(data.detail || 'ATM Deposit rejected by backend.');

          state.depositId = data.depositId;

          if (data.clientSecret && window.Stripe) {
            stripeInstance = window.Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd');
            elementsInstance = stripeInstance.elements({
              clientSecret: data.clientSecret,
              appearance: { theme: 'night' }
            });
            const paymentElement = elementsInstance.create('payment');
            paymentElement.mount('#payment-element');
            btnDeposit.textContent = '💳 PAYMENT CARD INSERTED // COMPLETE BELOW';
          }
        } catch (err) {
          btnDeposit.disabled = false;
          btnDeposit.textContent = `❌ ERROR: ${err.message}`;
          playSFX('incorrect');
        }
      }

      // Wire Up Payment Submission
      const submitPayBtn = bodyBox.querySelector('#submit-payment-btn');
      const payMsgEl = bodyBox.querySelector('#payment-message');
      if (submitPayBtn) {
        submitPayBtn.onclick = async () => {
          if (!stripeInstance || !elementsInstance) return;
          submitPayBtn.disabled = true;
          submitPayBtn.textContent = 'AUTHORIZING DIRECT TRANSACTION...';
          laundromatAudio.playBillWhir();

          const { error, paymentIntent } = await stripeInstance.confirmPayment({
            elements: elementsInstance,
            redirect: 'if_required'
          });

          if (error) {
            submitPayBtn.disabled = false;
            submitPayBtn.textContent = 'RETRY PAYMENT';
            if (payMsgEl) {
              payMsgEl.textContent = `[!] ${error.message}`;
              payMsgEl.style.display = 'block';
            }
            playSFX('incorrect');
          } else {
            // Confirm deposit on backend
            try {
              await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/confirm-atm-deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentIntentId: paymentIntent.id,
                  depositId: state.depositId,
                  profile: rawProfile,
                  is_guest: isGuest,
                  amount: state.amount
                })
              });
            } catch (e) {
              console.warn('Backend confirmation note:', e);
            }

            state.paymentAuthorized = true;
            const dispensedTokens = maxTokens(state.amount);
            state.tokensHeld += dispensedTokens;
            if (state.inventory) {
                state.inventory.coins += dispensedTokens;
            }
            creditWallet(feeConfig.profileName, {
              balanceDelta: state.amount,
              tokensDelta: dispensedTokens
            });
            laundromatAudio.playCoinClink();
            playSFX('success');
            render();
          }
        };
      }

      // Helper function for max tokens
      function maxTokens(amt) {
        return Math.max(1, Math.floor(Number(amt) * 4));
      }

      // Wire Up Collect Tokens Button
      const btnCollectProceed = bodyBox.querySelector('#btn-collect-proceed');
      if (btnCollectProceed) {
        btnCollectProceed.onclick = () => {
          laundromatAudio.playCoinClink();
          playSFX('navigate');
          state.stage = 'washing_machines';
          render();
        };
      }

      // Wire Up Push-to-Card Instant Payout
      const btnPushPayout = bodyBox.querySelector('#btn-execute-push-payout');
      const cardNumInput = bodyBox.querySelector('#payout-card-num');
      const cardExpInput = bodyBox.querySelector('#payout-card-exp');
      const cardCvcInput = bodyBox.querySelector('#payout-card-cvc');
      const payoutStatusMsg = bodyBox.querySelector('#payout-status-msg');

      if (btnPushPayout) {
        btnPushPayout.onclick = async () => {
          const cardNum = (cardNumInput?.value || '').replace(/\s+/g, '');
          const cardExp = (cardExpInput?.value || '').trim();
          const cardCvc = (cardCvcInput?.value || '').trim();

          if (cardNum.length < 15 || !cardExp.includes('/') || cardCvc.length < 3) {
            alert('Please enter a valid 16-digit debit card number, MM/YY expiration, and 3-digit CVC.');
            return;
          }

          const [expMonth, expYear] = cardExp.split('/');
          btnPushPayout.disabled = true;
          btnPushPayout.textContent = '⚡ TOKENIZING DEBIT CARD & PUSHING FUNDS...';
          laundromatAudio.playBillWhir();

          try {
            if (!window.Stripe) throw new Error('Stripe.js not loaded');
            const stripeTemp = window.Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd');

            const tokenResult = await stripeTemp.createToken('card', {
              number: cardNum,
              exp_month: parseInt(expMonth, 10),
              exp_year: parseInt(expYear.length === 2 ? `20${expYear}` : expYear, 10),
              cvc: cardCvc
            });

            if (tokenResult.error) throw new Error(tokenResult.error.message);

            const payoutResp = await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/changer-payout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: activeFeeData.payout,
                profile: rawProfile,
                depositId: state.depositId,
                cardToken: tokenResult.token.id
              })
            });

            const payoutData = await payoutResp.json();
            if (!payoutResp.ok) throw new Error(payoutData.detail || 'Push-to-card payout failed.');

            // Debit clean payout from active profile wallet
            debitWallet(feeConfig.profileName, {
              balanceDelta: activeFeeData.payout
            });

            laundromatAudio.playCleanSparkle();
            laundromatAudio.playReceiptPrinter();
            playSFX('login');

            if (payoutStatusMsg) {
              payoutStatusMsg.style.display = 'block';
              payoutStatusMsg.style.color = '#10b981';
              payoutStatusMsg.innerHTML = `✅ <strong>PAYOUT SUCCESSFUL:</strong> $${activeFeeData.payout.toFixed(2)} sent directly to card ending in ${cardNum.slice(-4)} (Payout ID: ${payoutData.payoutId || 'instant_card'}).`;
            }
            btnPushPayout.textContent = '✅ PAYOUT DISPATCHED TO DEBIT CARD';
          } catch (err) {
            btnPushPayout.disabled = false;
            btnPushPayout.textContent = '⚡ RETRY PUSH-TO-CARD PAYOUT';
            if (payoutStatusMsg) {
              payoutStatusMsg.style.display = 'block';
              payoutStatusMsg.style.color = '#ef4444';
              payoutStatusMsg.textContent = `❌ ${err.message}`;
            }
            playSFX('incorrect');
          }
        };
      }
    }

    else if (state.stage === 'washing_machines') {
      const activeCalc = calculateFees(state.amount, feeConfig.rate) || { tokens: 100 };
      const tokensNeeded = 12;

      bodyBox.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 0.8rem; color: #06b6d4; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">
            // HIGH-SPEED COMMERCIAL VORTEX UNIT #07
          </div>
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 8px 0; font-size: 1.25rem;">
            WASHING MACHINE CYCLE
          </h2>

          <!-- Smartcard Balance & Supplies Quick Strip -->
          <div style="background: rgba(15,23,42,0.7); border: 1px solid ${curWallet.accentColor}50; border-radius: 6px; padding: 8px 14px; max-width: 450px; margin: 0 auto 12px auto; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
            <div>
              <span style="color: ${curWallet.accentColor}; font-weight: bold;">💳 ${curWallet.cardId}</span>
              <span style="color: #64748b; margin-left: 4px;">[${curWallet.profile}]</span>
            </div>
            <div style="display: flex; gap: 12px;">
              <span style="color: #f59e0b; font-weight: bold;">🪙 ${curWallet.tokens} Tokens</span>
              <span style="color: #06b6d4; font-weight: bold;">🫧 ${curWallet.detergentPods} Pods</span>
            </div>
          </div>

          <!-- Animated Washer Drum Viewport -->
          <div class="drum-viewport ${state.washerLoaded && !state.washerTraveled ? 'drum-inner-spinning' : ''}">
            <div style="font-size: 3.5rem; filter: drop-shadow(0 0 10px ${state.washerLoaded ? '#06b6d4' : '#64748b'});">
              ${!state.washerLoaded ? '🧺' : (state.washerTraveled ? '🧼' : '🫧')}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 0.85rem; color: #94a3b8;">
              STATUS: <strong style="color: ${state.washerTraveled ? '#10b981' : (state.washerLoaded ? '#06b6d4' : '#f59e0b')};">
                ${!state.washerLoaded ? 'DRUM IS GAPING // AWAITING YOUR FULL LOAD & HARD TOKENS' : (state.washerTraveled ? 'INTENSE SPIN COMPLETE // EVERYTHING DRIPPING AT 1400 RPM' : 'VORTEX CHURN ACTIVE // SOAKING WET & FOAMING AT THE RIM')}
              </strong>
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">
              ${state.washerTraveled ? 'TIME ELAPSED: 60:00 (1 HOUR OF VIOLENT VIBRATIONS FINISHED)' : (state.washerLoaded ? 'TIME REMAINING: 59:58 (1 HOUR OF CHURNING)' : `NEEDS: ${tokensNeeded} HARD TOKENS TO UNLOCK`)}
            </div>
          </div>

          <!-- Interactive Actions -->
          <div style="max-width: 450px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px;">
            ${!state.washerLoaded ? `
              <button id="btn-load-washer" class="aim-btn" style="padding: 15px; background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer;">
                📥 STUFF YOUR ENTIRE LOAD INTO THE WASHER HOLE & PUMP THE POD
              </button>
            ` : (!state.washerTraveled ? `
              <button id="btn-time-travel-1" class="aim-btn" style="padding: 16px; background: rgba(6, 182, 212, 0.25); border-color: #06b6d4; color: #38bdf8; font-weight: bold; font-size: 1.05rem; cursor: pointer; box-shadow: 0 0 15px rgba(6,182,212,0.3);">
                ⏳ FAST-FORWARD 1 HOUR OF INTENSE VIBRATING ACTION ⚡
              </button>
            ` : `
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 12px; border-radius: 6px; color: #10b981; font-size: 0.9rem; margin-bottom: 6px;">
                ✓ 60 Minutes of violent churning finished! The load is dripping, soaked, and thoroughly cleansed.
              </div>
              <button id="btn-goto-dryer" class="aim-btn" style="padding: 15px; background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer;">
                🧺 PULL OUT YOUR DRIPPING WET LOAD & MOVE TO DRYER ➔
              </button>
            `)}
            
            <!-- Suggestive Simulated Side Steps -->
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <button id="btn-lean-washer" class="aim-btn" style="flex: 1; padding: 10px; background: rgba(6, 182, 212, 0.12); border-color: #06b6d4; color: #38bdf8; font-size: 0.8rem; font-weight: bold; cursor: pointer;">
                📳 PRESS BODY TO WASHER (HIGH SPIN)
              </button>
              <button id="btn-sniff-pods" class="aim-btn" style="flex: 1; padding: 10px; background: rgba(168, 85, 247, 0.12); border-color: #a855f7; color: #c084fc; font-size: 0.8rem; font-weight: bold; cursor: pointer;">
                👃 HUFF DETERGENT POD
              </button>
            </div>
            
            <button id="btn-back-changer" class="aim-btn" style="padding: 10px; background: transparent; border-color: #334155; color: #888; font-size: 0.85rem; cursor: pointer;">
              ⬅ Back to Coin Changer
            </button>
          </div>
        </div>
      `;

      const btnLoad = bodyBox.querySelector('#btn-load-washer');
      const btnTravel1 = bodyBox.querySelector('#btn-time-travel-1');
      const btnDryer = bodyBox.querySelector('#btn-goto-dryer');
      const btnBack = bodyBox.querySelector('#btn-back-changer');
      const btnLeanWasher = bodyBox.querySelector('#btn-lean-washer');
      const btnSniffPods = bodyBox.querySelector('#btn-sniff-pods');

      if (btnLoad) {
        btnLoad.onclick = () => {
          laundromatAudio.playCoinClink();
          laundromatAudio.playDoorLock();
          laundromatAudio.playWaterFill();
          debitWallet(feeConfig.profileName, {
            tokensDelta: Math.min(curWallet.tokens, 4),
            detergentDelta: Math.min(curWallet.detergentPods, 1)
          });
          state.washerLoaded = true;
          render();
        };
      }
      if (btnTravel1) {
        btnTravel1.onclick = () => {
          laundromatAudio.playTimeWarp();
          state.chronoOverlayText = '⏳ TIME TRAVELING 1 HOUR...';
          state.washerTraveled = true;
          render();
        };
      }
      if (btnDryer) {
        btnDryer.onclick = () => {
          laundromatAudio.playDoorLock();
          playSFX('navigate');
          state.stage = 'dryer_machines';
          render();
        };
      }
      if (btnBack) {
        btnBack.onclick = () => {
          playSFX('click');
          state.stage = 'cash_to_coin';
          render();
        };
      }
      if (btnLeanWasher) {
        btnLeanWasher.onclick = () => {
          playSFX('success');
          state.activeModal = {
            icon: '📳💦',
            title: '// 1400 RPM HARMONIC RESONANCE',
            titleColor: '#06b6d4',
            borderColor: '#06b6d4',
            glowColor: 'rgba(6,182,212,0.3)',
            btnBg: 'rgba(6,182,212,0.25)',
            message: 'You leaned your entire torso against the commercial front-loader during the 1400 RPM spin cycle. The violent vibrations pulsed straight through your chassis. An observer folding towels nearby glanced over with intense curiosity.',
            subtext: '⚡ [SIMULATED PHYSICAL SENSATION // NO REAL FEE DEDUCTED]',
            buttonText: '🥵 STEP BACK & STRAIGHTEN YOUR COLLAR ➔'
          };
          render();
        };
      }
      if (btnSniffPods) {
        btnSniffPods.onclick = () => {
          playSFX('glitch');
          state.activeModal = {
            icon: '👃🫧',
            title: '// CONCENTRATED POD INHALATION',
            titleColor: '#c084fc',
            borderColor: '#a855f7',
            glowColor: 'rgba(168,85,247,0.3)',
            btnBg: 'rgba(168,85,247,0.25)',
            message: 'You cracked open a fresh ultra-concentrated lavender neural-pod and took an aggressive, unfiltered inhale. Your eyes watered instantly and your brain cortex experienced 4 seconds of pure floral static.',
            subtext: '⚡ [SIMULATED INHALATION // FREE OF CHARGE]',
            buttonText: '🫧 BLINK RAPIDLY & RESUME WASH CYCLE ➔'
          };
          render();
        };
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // STAGE 5: DRYER MACHINES (Tumble, Heat, & Time Travel Another Hour)
    // ────────────────────────────────────────────────────────────────────────
    else if (state.stage === 'dryer_machines') {
      bodyBox.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 0.8rem; color: #f59e0b; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">
            // INDUSTRIAL GAS TUMBLER DRYER #04
          </div>
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 8px 0; font-size: 1.25rem;">
            DRYER TUMBLE CYCLE
          </h2>

          <!-- Smartcard Balance & Supplies Quick Strip -->
          <div style="background: rgba(15,23,42,0.7); border: 1px solid ${curWallet.accentColor}50; border-radius: 6px; padding: 8px 14px; max-width: 450px; margin: 0 auto 12px auto; display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
            <div>
              <span style="color: ${curWallet.accentColor}; font-weight: bold;">💳 ${curWallet.cardId}</span>
              <span style="color: #64748b; margin-left: 4px;">[${curWallet.profile}]</span>
            </div>
            <div style="display: flex; gap: 12px;">
              <span style="color: #f59e0b; font-weight: bold;">🪙 ${curWallet.tokens} Tokens</span>
              <span style="color: #a855f7; font-weight: bold;">🔥 ${curWallet.dryerSheets} Sheets</span>
            </div>
          </div>

          <!-- Animated Dryer Drum Viewport -->
          <div class="drum-viewport ${state.dryerLoaded && !state.dryerTraveled ? 'drum-inner-spinning drum-heat-glow' : ''}">
            <div style="font-size: 3.5rem; filter: drop-shadow(0 0 10px ${state.dryerLoaded ? '#f59e0b' : '#64748b'});">
              ${!state.dryerLoaded ? '💧' : (state.dryerTraveled ? '✨' : '🔥')}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-size: 0.85rem; color: #94a3b8;">
              STATUS: <strong style="color: ${state.dryerTraveled ? '#10b981' : (state.dryerLoaded ? '#f59e0b' : '#38bdf8')};">
                ${!state.dryerLoaded ? 'DRYER HOLE IS HOT & GAPING // READY FOR WET INSERTION' : (state.dryerTraveled ? 'TUMBLE COMPLETE // TOASTY, FLUFFED & TOTALLY BONE-DRY' : 'HOT GAS INJECTED // 160°F STEAM BLASTING EVERY CREVICE')}
              </strong>
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">
              ${state.dryerTraveled ? 'TOTAL TIME: 2 HOURS OF CONTINUOUS FRICTION COMPLETED' : (state.dryerLoaded ? 'TIME REMAINING: 59:59 (1 HOUR OF HOT TUMBLING)' : 'SLIP IN THE ANTI-STATIC SHEET TO PREVENT FRICTION')}
            </div>
          </div>

          <!-- Interactive Actions -->
          <div style="max-width: 450px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px;">
            ${!state.dryerLoaded ? `
              <button id="btn-load-dryer" class="aim-btn" style="padding: 15px; background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #f59e0b; font-weight: bold; cursor: pointer;">
                📥 INSERT WET LAUNDRY INTO THE DRYER HOLE & RUB IN DRYER SHEETS
              </button>
            ` : (!state.dryerTraveled ? `
              <button id="btn-time-travel-2" class="aim-btn" style="padding: 16px; background: rgba(245, 158, 11, 0.25); border-color: #f59e0b; color: #fbbf24; font-weight: bold; font-size: 1.05rem; cursor: pointer; box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);">
                ⏳ TIME TRAVEL ANOTHER HOUR OF HIGH-HEAT TUMBLING ⚡
              </button>
            ` : `
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; padding: 12px; border-radius: 6px; color: #10b981; font-size: 0.9rem; margin-bottom: 6px;">
                ✓ Another hour of hot tumbling finished! Your load is toasty warm, fully fluffed, and wrinkle-free.
              </div>
              <button id="btn-goto-receive" class="aim-btn" style="padding: 15px; background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer;">
                ✨ PULL OUT YOUR WARM, FLUFFY LOAD & VIEW RECEIPT ➔
              </button>
            `)}
            
            <!-- Suggestive Simulated Side Steps -->
            <div style="display: flex; gap: 8px; margin-top: 4px;">
              <button id="btn-peep-dryer" class="aim-btn" style="flex: 1; padding: 10px; background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #ef4444; font-size: 0.8rem; font-weight: bold; cursor: pointer;">
                👀 PEEP AT PANTIES IN NEXT DRYER
              </button>
              <button id="btn-lint-trap" class="aim-btn" style="flex: 1; padding: 10px; background: rgba(245, 158, 11, 0.12); border-color: #f59e0b; color: #fbbf24; font-size: 0.8rem; font-weight: bold; cursor: pointer;">
                🧤 PROBE LINT CAVITY
              </button>
            </div>
            
            <button id="btn-back-washer" class="aim-btn" style="padding: 10px; background: transparent; border-color: #334155; color: #888; font-size: 0.85rem; cursor: pointer;">
              ⬅ Back to Washer
            </button>
          </div>
        </div>
      `;

      const btnLoadDryer = bodyBox.querySelector('#btn-load-dryer');
      const btnTravel2 = bodyBox.querySelector('#btn-time-travel-2');
      const btnReceive = bodyBox.querySelector('#btn-goto-receive');
      const btnBackWasher = bodyBox.querySelector('#btn-back-washer');
      const btnPeepDryer = bodyBox.querySelector('#btn-peep-dryer');
      const btnLintTrap = bodyBox.querySelector('#btn-lint-trap');

      if (btnLoadDryer) {
        btnLoadDryer.onclick = () => {
          laundromatAudio.playDoorLock();
          laundromatAudio.playDryerStart();
          debitWallet(feeConfig.profileName, {
            tokensDelta: Math.min(curWallet.tokens, 4),
            dryerSheetsDelta: Math.min(curWallet.dryerSheets, 1)
          });
          state.dryerLoaded = true;
          render();
        };
      }
      if (btnTravel2) {
        btnTravel2.onclick = () => {
          laundromatAudio.playTimeWarp();
          setTimeout(() => {
            laundromatAudio.playDryerBuzzer();
          }, 700);
          state.chronoOverlayText = '⏳ TIME TRAVELING ANOTHER HOUR...';
          state.dryerTraveled = true;
          render();
        };
      }
      if (btnReceive) {
        btnReceive.onclick = () => {
          laundromatAudio.playCleanSparkle();
          playSFX('login');
          state.stage = 'receive_laundry';
          render();
        };
      }
      if (btnBackWasher) {
        btnBackWasher.onclick = () => {
          playSFX('click');
          state.stage = 'washing_machines';
          render();
        };
      }
      if (btnPeepDryer) {
        btnPeepDryer.onclick = () => {
          playSFX('incorrect');
          setTimeout(() => laundromatAudio.playCoinClink(), 250);
          state.activeModal = {
            icon: '👀💸',
            title: '// DISTRACTION PENALTY (SIMULATED)',
            titleColor: '#ef4444',
            borderColor: '#ef4444',
            glowColor: 'rgba(239,68,68,0.35)',
            btnBg: 'rgba(239,68,68,0.25)',
            message: 'the woman stole $0.50 from your coin stack while you were distracted looking in the dryer',
            subtext: '⚡ [SIMULATED FLAVOR ONLY — NO ACTUAL FEE CHARGED // YOUR PAYOUT IS 100% INTACT]',
            buttonText: '😅 ACT CASUAL & GUARD YOUR REMAINING COINS ➔'
          };
          render();
        };
      }
      if (btnLintTrap) {
        btnLintTrap.onclick = () => {
          playSFX('alert');
          state.activeModal = {
            icon: '🔥🧤',
            title: '// LINT CAVITY EXPLORATION',
            titleColor: '#f59e0b',
            borderColor: '#f59e0b',
            glowColor: 'rgba(245,158,11,0.3)',
            btnBg: 'rgba(245,158,11,0.25)',
            message: 'You shoved your entire forearm deep into the hot, fuzzy lint cavern. You pulled out a massive clump of pink neon fluff, an expired cyber-contraceptive packet, and a thumb drive labeled "DO NOT OPEN (UNFILTERED)".',
            subtext: '⚡ [SIMULATED CAVITY SEARCH // 0 FEE DEDUCTION]',
            buttonText: '🧤 WIPE YOUR HANDS & RETURN TO DRYER ➔'
          };
          render();
        };
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // STAGE 6: RECEIVE LAUNDRY & SIMULATED ITEMIZED RECEIPT
    // ────────────────────────────────────────────────────────────────────────
    else if (state.stage === 'receive_laundry') {
      const receiptData = calculateFees(state.amount, feeConfig.rate) || {
        rawVal: 25.00,
        captureFee: 1.03,
        platformFee: 2.50,
        instantFee: 0.50,
        connectFee: 0.31,
        payout: 20.66,
        totalFees: 4.34,
        tokens: 100
      };

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

      // Credit clean laundry load once upon reaching pickup stage
      if (!state.cleanCreditGiven) {
        state.cleanCreditGiven = true;
        creditWallet(feeConfig.profileName, { cleanLaundryDelta: 1 });
      }

      // Trigger printer effect once on entry
      setTimeout(() => {
        laundromatAudio.playReceiptPrinter();
      }, 200);

      bodyBox.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 3.5rem; filter: drop-shadow(0 0 15px #10b981); margin-bottom: 8px;">
            ✨🧺✨
          </div>
          <div style="display:inline-block; background:rgba(16,185,129,0.15); border:1px solid #10b981; padding:4px 12px; border-radius:12px; font-size:0.8rem; color:#10b981; font-weight:bold; margin-bottom:8px;">
            CLEAN LAUNDRY HANDOUT COMPLETE
          </div>
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 8px 0; font-size: 1.3rem;">
            RECEIVE LAUNDRY
          </h2>
          <p style="color: #94a3b8; font-size: 0.9rem; margin: 0;">
            Look at that fresh, satisfied load. Cleaned down to the bare fibers, completely wrinkle-free and delivered warm to your hands.
          </p>
        </div>

        <!-- Simulated Laundromat Thermal Receipt Card -->
        <div class="thermal-receipt" style="margin-bottom: 20px;">
          <div style="text-align: center; border-bottom: 1px dashed #334155; padding-bottom: 10px; margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 1rem; color: #38bdf8; font-family: 'Orbitron', sans-serif;">
              24/7 CYBER-SPIN COMMERCIAL LAUNDROMAT
            </div>
            <div style="font-size: 0.75rem; color: #94a3b8;">
              BRANCH #07 // REGISTER T-99 // SECTOR 07
            </div>
            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
              TIMESTAMP: ${dateStr} ${timeStr}
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom: 6px; font-size: 0.85rem;">
            <span style="color:#94a3b8;">OPERATOR PROFILE:</span>
            <span style="font-weight:bold; color:${feeConfig.badgeColor};">${feeConfig.profileName.toUpperCase()}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 12px; font-size: 0.85rem; border-bottom: 1px dashed #334155; padding-bottom: 8px;">
            <span style="color:#94a3b8;">GROSS SOILED LOAD VALUE:</span>
            <span style="font-weight:bold; color:#fff;">$${receiptData.rawVal.toFixed(2)} USD</span>
          </div>

          <!-- Account Smartcard Ledger Update -->
          <div style="background: rgba(0,0,0,0.5); border: 1px dashed rgba(56,189,248,0.4); border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; font-size: 0.78rem;">
            <div style="color: #38bdf8; font-weight: bold; margin-bottom: 6px; letter-spacing: 1px;">// UPDATED LAUNDRY SMARTCARD LEDGER:</div>
            <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 2px;">
              <span>Smartcard Serial:</span> <span style="font-family:'Orbitron',sans-serif; color:${curWallet.accentColor}; font-weight:bold;">${curWallet.cardId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 2px;">
              <span>Available Balance:</span> <span style="color:#10b981; font-weight:bold;">$${curWallet.balance.toFixed(2)} USD</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #cbd5e1; margin-bottom: 2px;">
              <span>Tokens Remaining:</span> <span style="color:#f59e0b; font-weight:bold;">🪙 ${curWallet.tokens} Hard Tokens</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #cbd5e1;">
              <span>Lifetime Clean Loads:</span> <span style="color:#10b981; font-weight:bold;">✨ ${curWallet.cleanLoads} Loads Completed</span>
            </div>
          </div>

          <div style="font-size: 0.75rem; color: #38bdf8; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">
            // ITEMIZED LAUNDRY FACILITY EXPENSES:
          </div>

          <!-- 1. Washer & Dryer Fee (Stripe Capture) -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <div>
              <div style="color: #cbd5e1;">Washer & Dryer Runtime Fee:</div>
              <div style="font-size: 0.75rem; color: #64748b;">• 60m Vortex Wash + 60m Gas Dry (2.9% + $0.30)</div>
            </div>
            <div style="color: #cbd5e1; font-weight: bold;">
              -$${receiptData.captureFee.toFixed(2)}
            </div>
          </div>

          <!-- 2. Detergent Fee (AlphaCore Platform Fee) -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <div>
              <div style="color: ${feeConfig.isExempt ? '#10b981' : (feeConfig.rate === 0.07 ? '#06b6d4' : '#cbd5e1')};">
                Laundry Detergent Pod Fee:
              </div>
              <div style="font-size: 0.75rem; color: #64748b;">
                • ${feeConfig.detergentLabel}
              </div>
            </div>
            <div style="font-weight: bold; color: ${feeConfig.isExempt ? '#10b981' : '#cbd5e1'};">
              ${feeConfig.isExempt ? '$0.00 (WAIVED)' : `-$${receiptData.platformFee.toFixed(2)}`}
            </div>
          </div>

          <!-- 3. Dryer Sheets Fee (Instant Payout) -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <div>
              <div style="color: #cbd5e1;">Dryer Sheets & Anti-Static Vapor:</div>
              <div style="font-size: 0.75rem; color: #64748b;">• Fast-acting heat diffusion sheet (1.5% / $0.50 Min)</div>
            </div>
            <div style="color: #cbd5e1; font-weight: bold;">
              -$${receiptData.instantFee.toFixed(2)}
            </div>
          </div>

          <!-- 4. Water Utility & Drainage (Connect Routing) -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #334155; padding-bottom: 10px;">
            <div>
              <div style="color: #cbd5e1;">Water Utility & Drainage Routing:</div>
              <div style="font-size: 0.75rem; color: #64748b;">• Municipal filtration & instant power link (0.25% + $0.25)</div>
            </div>
            <div style="color: #cbd5e1; font-weight: bold;">
              -$${receiptData.connectFee.toFixed(2)}
            </div>
          </div>

          <!-- Multi-Account Destination Routing Summary -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem;">
            <span style="color: #94a3b8;">PERRY-IT SYSTEM RETENTION:</span>
            <span style="color: ${feeConfig.isExempt ? '#10b981' : '#f59e0b'}; font-weight: bold;">
              ${feeConfig.isExempt ? '$0.00 (WAIVED)' : `+$${receiptData.platformFee.toFixed(2)} (${feeConfig.label.split(':')[0]})`}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.85rem; border-bottom: 1px dashed #334155; padding-bottom: 8px;">
            <span style="color: #94a3b8;">DISPATCHED TO DESTINATION:</span>
            <span style="color: #38bdf8; font-weight: bold; text-align: right; max-width: 60%; word-break: break-all;">
              ${state.selectedDestinationName || (state.selectedDestination === DONATION_ACCOUNT_ID ? DONATION_ACCOUNT_NAME : 'Personal Recipient Vault')}
            </span>
          </div>

          <!-- Totals -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
            <span style="color: #94a3b8; font-weight: bold;">TOTAL LAUNDRY OPERATING FEES:</span>
            <span style="color: #ef4444; font-weight: bold;">-$${receiptData.totalFees.toFixed(2)}</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #38bdf8; font-size: 1.15rem;">
            <strong style="color: #fff;">NET CLEAN ASSETS EXTRACTED:</strong>
            <strong style="color: #10b981;">+$${receiptData.payout.toFixed(2)}</strong>
          </div>

          <div style="text-align: center; margin-top: 14px; font-size: 0.75rem; color: #64748b; letter-spacing: 2px;">
            ||||| ||||||| |||| |||||||||||| |||||| |||||||
          </div>
        </div>

        <!-- Controls -->
        <div style="display: flex; flex-direction: column; gap: 10px; max-width: 450px; margin: 0 auto;">
          <button id="btn-copy-receipt" class="aim-btn" style="padding: 14px; background: rgba(56, 189, 248, 0.15); border-color: #38bdf8; color: #38bdf8; font-weight: bold; cursor: pointer;">
            📋 COPY RECEIPT AUDIT TO CLIPBOARD
          </button>
          <button id="btn-wash-another" class="aim-btn" style="padding: 14px; background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer;">
            🔄 DROP ANOTHER DIRTY LOAD (START OVER)
          </button>
          <button id="btn-changer-return" class="aim-btn" style="padding: 10px; background: transparent; border-color: #334155; color: #94a3b8; font-size: 0.85rem; cursor: pointer;">
            🪙 Return to Cash-to-Coin Changer
          </button>
        </div>
      `;

      // Copy Receipt
      bodyBox.querySelector('#btn-copy-receipt').onclick = () => {
        laundromatAudio.playCleanSparkle();
        const text = `
========================================
24/7 CYBER-SPIN COMMERCIAL LAUNDROMAT
BRANCH #07 // REGISTER T-99 // SECTOR 07
TIMESTAMP: ${dateStr} ${timeStr}
OPERATOR PROFILE: ${feeConfig.profileName.toUpperCase()}
GROSS DEPOSIT: $${receiptData.rawVal.toFixed(2)} USD
----------------------------------------
ITEMIZED LAUNDRY FACILITY EXPENSES:
1. Washer & Dryer Runtime Fee:       -$${receiptData.captureFee.toFixed(2)}
2. Laundry Detergent Pod Fee:        ${feeConfig.isExempt ? '$0.00 (WAIVED)' : `-$${receiptData.platformFee.toFixed(2)}`}
3. Dryer Sheets & Anti-Static:       -$${receiptData.instantFee.toFixed(2)}
4. Water Utility & Drainage:         -$${receiptData.connectFee.toFixed(2)}
----------------------------------------
TOTAL LAUNDRY OPERATING FEES:        -$${receiptData.totalFees.toFixed(2)}
NET CLEAN ASSETS EXTRACTED:          +$${receiptData.payout.toFixed(2)}
DISPATCHED RECIPIENT:                ${state.selectedDestinationName || 'Personal Recipient Vault'}
========================================
        `.trim();
        navigator.clipboard.writeText(text).then(() => {
          const btn = bodyBox.querySelector('#btn-copy-receipt');
          btn.textContent = '✓ RECEIPT COPIED!';
          setTimeout(() => { btn.textContent = '📋 COPY RECEIPT AUDIT TO CLIPBOARD'; }, 2000);
        });
      };

      // Restart Minigame
      bodyBox.querySelector('#btn-wash-another').onclick = () => {
        laundromatAudio.playDoorChime();
        state.stage = 'wash_laundry';
        state.washerLoaded = false;
        state.washerTraveled = false;
        state.dryerLoaded = false;
        state.dryerTraveled = false;
        render();
      };

      // Return to Cash-to-Coin
      bodyBox.querySelector('#btn-changer-return').onclick = () => {
        laundromatAudio.playCoinClink();
        state.stage = 'cash_to_coin';
        render();
      };
    }

    // ─── Interactive Distraction / Simulated Flavor Modal ───────────────────
    if (state.activeModal) {
      const modalOverlay = createElement('div', {
        className: 'laundry-distraction-modal',
        style: `
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.88);
          backdrop-filter: blur(8px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `
      });

      modalOverlay.innerHTML = `
        <div style="background: #090e17; border: 2px solid ${state.activeModal.borderColor || '#ef4444'}; border-radius: 10px; max-width: 480px; width: 100%; padding: 24px; box-shadow: 0 15px 45px rgba(0,0,0,0.9), 0 0 30px ${state.activeModal.glowColor || 'rgba(239,68,68,0.3)'}; text-align: center; position: relative;">
          <div style="font-size: 3.2rem; margin-bottom: 12px; filter: drop-shadow(0 0 12px rgba(255,255,255,0.4));">
            ${state.activeModal.icon || '👀💸'}
          </div>
          <div style="font-family: 'Orbitron', sans-serif; font-size: 1.15rem; color: ${state.activeModal.titleColor || '#ef4444'}; font-weight: bold; margin-bottom: 10px; letter-spacing: 1px;">
            ${state.activeModal.title || '// SIMULATED ENCOUNTER'}
          </div>
          <div style="color: #f1f5f9; font-size: 0.95rem; line-height: 1.6; margin-bottom: 16px; background: rgba(0,0,0,0.45); padding: 14px 18px; border-radius: 6px; border-left: 4px solid ${state.activeModal.borderColor || '#ef4444'}; text-align: left; font-family: 'Share Tech Mono', monospace;">
            ${state.activeModal.message}
          </div>
          <div style="font-size: 0.75rem; color: #10b981; font-weight: bold; margin-bottom: 20px; letter-spacing: 0.5px;">
            ${state.activeModal.subtext || '✓ [SIMULATED FLAVOR ONLY — NO ACTUAL FEE CHARGED // PAYOUT IS 100% INTACT]'}
          </div>
          <button id="modal-dismiss-btn" class="aim-btn" style="width: 100%; padding: 14px; background: ${state.activeModal.btnBg || 'rgba(239,68,68,0.2)'}; border-color: ${state.activeModal.borderColor || '#ef4444'}; color: #fff; font-weight: bold; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease;">
            ${state.activeModal.buttonText || 'CLOSE & RESUME LAUNDRY ➔'}
          </button>
        </div>
      `;

      modalOverlay.querySelector('#modal-dismiss-btn').onclick = () => {
        playSFX('click');
        state.activeModal = null;
        render();
      };

      container.appendChild(modalOverlay);
    }

    // ─── Stripe Connect Recipient Onboarding Modal ──────────────────────────
    if (state.onboardingModalActive) {
      const onboardModal = createElement('div', {
        className: 'laundry-distraction-modal',
        style: `
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.92);
          backdrop-filter: blur(8px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `
      });

      onboardModal.innerHTML = `
        <div style="background: #090e17; border: 2px solid #06b6d4; border-radius: 10px; max-width: 480px; width: 100%; padding: 24px; box-shadow: 0 15px 45px rgba(0,0,0,0.9), 0 0 30px rgba(6,182,212,0.3); text-align: center; position: relative;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🌐💳</div>
          <h3 style="font-family: 'Orbitron', sans-serif; color: #38bdf8; font-size: 1.15rem; margin: 0 0 8px 0;">
            ONBOARD RECIPIENT ACCOUNT
          </h3>
          <p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.5; margin: 0 0 16px 0;">
            Generate a secure Stripe Express onboarding link for a recipient. They will enter their bank account or debit card directly on Stripe's secure portal to receive transfers.
          </p>

          <div style="text-align: left; margin-bottom: 12px;">
            <label style="color: #cbd5e1; font-size: 0.8rem; font-weight: bold;">RECIPIENT NAME / BUSINESS:</label>
            <input type="text" id="onboard-name-input" placeholder="e.g. John Doe / Apex Labs" style="width: 100%; background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; font-size: 0.9rem; border-radius: 4px; box-sizing: border-box; margin-top: 4px;">
          </div>

          <div style="text-align: left; margin-bottom: 16px;">
            <label style="color: #cbd5e1; font-size: 0.8rem; font-weight: bold;">RECIPIENT EMAIL (OPTIONAL):</label>
            <input type="email" id="onboard-email-input" placeholder="recipient@example.com" style="width: 100%; background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; font-size: 0.9rem; border-radius: 4px; box-sizing: border-box; margin-top: 4px;">
          </div>

          <div id="onboard-status-msg" style="color: #ef4444; font-size: 0.8rem; margin-bottom: 12px; display: none;"></div>

          <div style="display: flex; gap: 10px;">
            <button id="btn-submit-onboard" class="aim-btn" style="flex: 1; padding: 12px; background: rgba(6,182,212,0.25); border-color: #06b6d4; color: #38bdf8; font-weight: bold; cursor: pointer;">
              CREATE ONBOARDING LINK ➔
            </button>
            <button id="btn-close-onboard" class="aim-btn" style="padding: 12px 16px; background: transparent; border-color: #334155; color: #94a3b8; cursor: pointer;">
              CANCEL
            </button>
          </div>
        </div>
      `;

      const nameInput = onboardModal.querySelector('#onboard-name-input');
      const emailInput = onboardModal.querySelector('#onboard-email-input');
      const btnSubmit = onboardModal.querySelector('#btn-submit-onboard');
      const btnClose = onboardModal.querySelector('#btn-close-onboard');
      const statusMsg = onboardModal.querySelector('#onboard-status-msg');

      btnClose.onclick = () => {
        playSFX('click');
        state.onboardingModalActive = false;
        render();
      };

      btnSubmit.onclick = async () => {
        const nameVal = nameInput.value.trim();
        const emailVal = emailInput.value.trim();
        if (!nameVal) {
          statusMsg.textContent = 'Please enter a recipient name or business entity.';
          statusMsg.style.display = 'block';
          return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'GENERATING STRIPE LINK...';
        statusMsg.style.display = 'none';

        try {
          const resp = await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/create-connect-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nameVal,
              email: emailVal,
              return_url: window.location.href.split('?')[0],
              refresh_url: window.location.href.split('?')[0]
            })
          });

          const data = await resp.json();
          if (!resp.ok) throw new Error(data.detail || 'Failed to create connect onboarding link');

          saveDestination(data.accountId, nameVal);
          state.selectedDestination = data.accountId;
          state.selectedDestinationName = `${nameVal} [${data.accountId}]`;
          state.onboardingModalActive = false;

          playSFX('success');
          // Open onboarding URL in a new window/tab
          window.open(data.onboardingUrl, '_blank');
          render();
        } catch (err) {
          statusMsg.textContent = err.message;
          statusMsg.style.display = 'block';
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'CREATE ONBOARDING LINK ➔';
          playSFX('incorrect');
        }
      };

      container.appendChild(onboardModal);
    }

    // ─── Voluntary Donation Confirmation Screen Modal ───────────────────────
    if (state.donationConfirmModalActive) {
      const donationModal = createElement('div', {
        className: 'laundry-donation-modal',
        style: `
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.94);
          backdrop-filter: blur(12px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `
      });

      donationModal.innerHTML = `
        <div style="background: #090e1a; border: 2px solid #f59e0b; border-radius: 12px; max-width: 540px; width: 100%; padding: 26px 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.95), 0 0 35px rgba(245, 158, 11, 0.35); text-align: center; position: relative;">
          
          <!-- Hazard Warning Tape -->
          <div style="height: 8px; border-radius: 4px; margin-bottom: 16px; background: repeating-linear-gradient(45deg, #f59e0b, #f59e0b 12px, #0f172a 12px, #0f172a 24px); box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);"></div>

          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px #f59e0b);">⚠️</span>
            <span style="font-size: 2.6rem; filter: drop-shadow(0 0 12px #ec4899);">💝</span>
            <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px #f59e0b);">⚠️</span>
          </div>

          <div style="font-size: 0.78rem; color: #f59e0b; font-weight: bold; letter-spacing: 2px; margin-bottom: 8px;">
            // RECIPIENT AUDIT &bull; VOLUNTARY DONATION GATEWAY
          </div>

          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; font-size: 1.25rem; margin: 0 0 14px 0;">
            CONFIRM DONATION ROUTING
          </h2>

          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 18px; margin-bottom: 20px; text-align: left;">
            <div style="color: #f8fafc; font-size: 0.95rem; line-height: 1.6; margin-bottom: 12px;">
              You have selected the <strong>AlphaCore Voluntary Donation</strong> recipient option.
            </div>

            <div style="background: #020617; border-left: 3px solid #f59e0b; padding: 10px 14px; margin-bottom: 14px; font-family: monospace; font-size: 0.85rem; color: #38bdf8; border-radius: 0 4px 4px 0;">
              <div>RECIPIENT: AlphaCore / PerryIT Development Vault</div>
              <div>ACCOUNT ID: ${DONATION_ACCOUNT_ID}</div>
            </div>

            <div style="color: #fbbf24; font-size: 1.05rem; font-weight: bold; line-height: 1.5; border-top: 1px dashed rgba(245, 158, 11, 0.4); padding-top: 12px;">
              ⚠️ The money goes to AlphaCore. Are you sure this is your expected function?
            </div>
          </div>

          <div style="color: #94a3b8; font-size: 0.82rem; margin-bottom: 22px; line-height: 1.5; text-align: left;">
            • If you are making a voluntary donation to support AlphaCore development, click <strong>CONFIRM DONATION</strong>.<br>
            • If you meant to transfer funds to yourself or a customer, click <strong>CANCEL</strong> to select your own connected account or enter a custom recipient ID.
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btn-confirm-donation-yes" class="aim-btn" style="width: 100%; padding: 14px; background: rgba(245, 158, 11, 0.25); border-color: #f59e0b; color: #fbbf24; font-weight: bold; font-size: 0.95rem; cursor: pointer;">
              ✓ YES, THIS IS MY EXPECTED FUNCTION (PROCEED WITH DONATION)
            </button>
            <button id="btn-confirm-donation-no" class="aim-btn" style="width: 100%; padding: 12px; background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #f87171; font-weight: bold; font-size: 0.9rem; cursor: pointer;">
              🛑 NO / CANCEL (RETURN TO RECIPIENT SELECTION)
            </button>
          </div>
        </div>
      `;

      const btnYes = donationModal.querySelector('#btn-confirm-donation-yes');
      const btnNo = donationModal.querySelector('#btn-confirm-donation-no');

      btnYes.onclick = () => {
        playSFX('success');
        state.selectedDestination = DONATION_ACCOUNT_ID;
        state.selectedDestinationName = DONATION_ACCOUNT_NAME;
        state.donationConfirmed = true;
        state.donationConfirmModalActive = false;
        render();
      };

      btnNo.onclick = () => {
        playSFX('click');
        state.selectedDestination = '';
        state.selectedDestinationName = '';
        state.donationConfirmed = false;
        state.donationConfirmModalActive = false;
        render();
      };

      container.appendChild(donationModal);
    }

    // ─── 7-Day Temporary Feature Countdown Overlay ─────────────────────────
    if (state.countdownOverlayActive) {
      if (countdownTimerId) clearInterval(countdownTimerId);

      const getRemaining = () => {
        const now = Date.now();
        const diff = Math.max(0, LAUNDROMAT_OPENING_TIME - now);
        return {
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000),
          diff
        };
      };

      const rem = getRemaining();

      const cdOverlay = createElement('div', {
        className: 'laundry-countdown-modal',
        style: `
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.94);
          backdrop-filter: blur(12px);
          z-index: 99998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
        `
      });

      cdOverlay.innerHTML = `
        <div style="background: #080e18; border: 2px solid #f59e0b; border-radius: 12px; max-width: 580px; width: 100%; padding: 26px 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.95), 0 0 35px rgba(245, 158, 11, 0.35); text-align: center; position: relative; margin: auto;">
          
          <!-- Hazard Tape Header Bar -->
          <div style="height: 10px; border-radius: 4px; margin-bottom: 18px; background: repeating-linear-gradient(45deg, #f59e0b, #f59e0b 12px, #0f172a 12px, #0f172a 24px); box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);"></div>

          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px #f59e0b);">☣️</span>
            <span style="font-size: 2.6rem; filter: drop-shadow(0 0 12px #38bdf8);">🧺</span>
            <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px #f59e0b);">🔒</span>
          </div>

          <div style="font-size: 0.78rem; color: #f59e0b; font-weight: bold; letter-spacing: 2px; margin-bottom: 8px;">
            // TEMPORARY FACILITY LOCKOUT &bull; SANITATION HOLD IN EFFECT
          </div>

          <!-- User's Requested Headline -->
          <h2 style="font-family: 'Orbitron', sans-serif; font-size: clamp(1.05rem, 3.5vw, 1.25rem); color: #fbbf24; margin: 0 0 14px 0; line-height: 1.45; text-transform: uppercase; text-shadow: 0 0 15px rgba(245, 158, 11, 0.5);">
            "GOTTA WEAR YOUR CLOTHES FOR 7 DAYS UNTIL THE LAUNDRO-MAT IS OPEN FOR BUSINESS!"
          </h2>

          <div style="color: #94a3b8; font-size: 0.88rem; line-height: 1.55; margin-bottom: 22px;">
            Stripe First-Time Operator 7-Day Settlement Hold in effect. All commercial vortex spin drums, detergent pumps, and coin chutes are locked until our initial payout clears on <strong style="color: #38bdf8;">Tuesday, October 6, 2026</strong>.
          </div>

          <!-- Digital Countdown Display -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
            <div class="countdown-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid #f59e0b; border-radius: 8px; padding: 10px 4px; box-shadow: inset 0 0 15px rgba(245, 158, 11, 0.15);">
              <div id="cd-days" style="font-family: 'Orbitron', sans-serif; font-size: clamp(1.3rem, 4vw, 1.85rem); font-weight: bold; color: #fbbf24; text-shadow: 0 0 10px #f59e0b;">
                ${String(rem.days).padStart(2, '0')}
              </div>
              <div style="font-size: 0.68rem; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-top: 2px;">DAYS</div>
            </div>

            <div class="countdown-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid #06b6d4; border-radius: 8px; padding: 10px 4px; box-shadow: inset 0 0 15px rgba(6, 182, 212, 0.15);">
              <div id="cd-hours" style="font-family: 'Orbitron', sans-serif; font-size: clamp(1.3rem, 4vw, 1.85rem); font-weight: bold; color: #38bdf8; text-shadow: 0 0 10px #06b6d4;">
                ${String(rem.hours).padStart(2, '0')}
              </div>
              <div style="font-size: 0.68rem; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-top: 2px;">HOURS</div>
            </div>

            <div class="countdown-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid #10b981; border-radius: 8px; padding: 10px 4px; box-shadow: inset 0 0 15px rgba(16, 185, 129, 0.15);">
              <div id="cd-mins" style="font-family: 'Orbitron', sans-serif; font-size: clamp(1.3rem, 4vw, 1.85rem); font-weight: bold; color: #34d399; text-shadow: 0 0 10px #10b981;">
                ${String(rem.mins).padStart(2, '0')}
              </div>
              <div style="font-size: 0.68rem; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-top: 2px;">MINS</div>
            </div>

            <div class="countdown-card" style="background: rgba(15, 23, 42, 0.85); border: 1px solid #ef4444; border-radius: 8px; padding: 10px 4px; box-shadow: inset 0 0 15px rgba(239, 68, 68, 0.15);">
              <div id="cd-secs" style="font-family: 'Orbitron', sans-serif; font-size: clamp(1.3rem, 4vw, 1.85rem); font-weight: bold; color: #f87171; text-shadow: 0 0 10px #ef4444;">
                ${String(rem.secs).padStart(2, '0')}
              </div>
              <div style="font-size: 0.68rem; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-top: 2px;">SECS</div>
            </div>
          </div>

          <!-- Humorous Street Survival Guidelines -->
          <div style="background: rgba(0, 0, 0, 0.5); border-left: 3px solid #f59e0b; border-radius: 4px; padding: 12px 16px; text-align: left; margin-bottom: 22px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.6;">
            <div style="color: #fbbf24; font-weight: bold; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>🩲</span> STREET SURVIVAL PROTOCOL WHILE SHIRTS ROT:
            </div>
            <div>&bull; Turn cyber-garments inside out on Day 4 to reset street stench by 50%.</div>
            <div>&bull; Avoid 1400 RPM spin temptations; the facility chain-link gate is padlocked.</div>
            <div>&bull; Free neon dryer sheet sniff samples available outside the front glass.</div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btn-bypass-countdown" class="aim-btn" style="padding: 14px; min-height: 48px; background: rgba(245, 158, 11, 0.2); border-color: #f59e0b; color: #fbbf24; font-weight: bold; font-size: 0.94rem; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 0 15px rgba(245, 158, 11, 0.2);">
              🦹 SNEAK INTO LAUNDRO-MAT ANYWAY // DEV BYPASS ➔
            </button>
            <button id="btn-notify-opening" class="aim-btn" style="padding: 11px; min-height: 42px; background: transparent; border-color: #334155; color: #94a3b8; font-size: 0.82rem; cursor: pointer;">
              🔔 REMIND ME ON OCTOBER 6 GRAND OPENING
            </button>
          </div>
        </div>
      `;

      countdownTimerId = setInterval(() => {
        const r = getRemaining();
        const dEl = cdOverlay.querySelector('#cd-days');
        const hEl = cdOverlay.querySelector('#cd-hours');
        const mEl = cdOverlay.querySelector('#cd-mins');
        const sEl = cdOverlay.querySelector('#cd-secs');
        if (dEl) dEl.textContent = String(r.days).padStart(2, '0');
        if (hEl) hEl.textContent = String(r.hours).padStart(2, '0');
        if (mEl) mEl.textContent = String(r.mins).padStart(2, '0');
        if (sEl) sEl.textContent = String(r.secs).padStart(2, '0');
      }, 1000);

      cdOverlay.querySelector('#btn-bypass-countdown').onclick = () => {
        if (countdownTimerId) clearInterval(countdownTimerId);
        playSFX('click');
        state.countdownOverlayActive = false;
        render();
      };

      cdOverlay.querySelector('#btn-notify-opening').onclick = (e) => {
        playSFX('success');
        e.target.textContent = '✓ REMINDER REGISTERED FOR OCT 6 (WASH BUCKET RESERVED)';
        e.target.style.color = '#10b981';
        e.target.style.borderColor = '#10b981';
      };

      container.appendChild(cdOverlay);
    }
  };

  // Initial Render
  render();

  return container;
}