import { createElement } from '../components/utils.js';
import { playSFX } from '../components/audio.js';

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

export default function TransferPage() {
  const container = createElement('div', { className: 'page-container laundry-page' });
  container.style.cssText = 'padding: 20px; max-width: 650px; margin: 0 auto; color: #fff; font-family: "Share Tech Mono", monospace; min-height: 80vh;';

  // ─── Profile & Fee Configuration ──────────────────────────────────────────
  const getProfileFeeConfig = () => {
    const rawProfile = sessionStorage.getItem('current_profile') || 'Guest';
    const profile = rawProfile.trim().toLowerCase();
    const isArchitect = profile === 'architect' || sessionStorage.getItem('admin_authenticated') === '1';
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
    if (isNaN(rawVal) || rawVal < 10) return null;

    const captureFee = (rawVal * 0.029) + 0.30;
    const platformFee = rawVal * rate;
    const remainder = rawVal - captureFee - platformFee;

    let payout = (remainder - 0.75) / 1.0025;
    let instantFee = 0.50;
    let connectFee = (payout * 0.0025) + 0.25;

    if (payout >= 33.33) {
      payout = (remainder - 0.25) / 1.0175;
      instantFee = payout * 0.015;
      connectFee = (payout * 0.0025) + 0.25;
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
      tokens: Math.floor(rawVal * 4) // 4 tokens per $1.00
    };
  };

  // ─── Minigame State ───────────────────────────────────────────────────────
  let state = {
    stage: 'wash_laundry', // 'wash_laundry' | 'laundromat_hub' | 'cash_to_coin' | 'washing_machines' | 'dryer_machines' | 'receive_laundry'
    amount: 25.00,
    paymentAuthorized: false,
    washerLoaded: false,
    washerTraveled: false,
    dryerLoaded: false,
    dryerTraveled: false,
    chronoOverlayText: '',
    activeModal: null
  };

  let stripeInstance = null;
  let elementsInstance = null;

  // ─── Inject Scoped Styles ─────────────────────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .laundry-stepper {
      display: flex;
      justify-content: space-between;
      background: #060b13;
      border: 1px solid #1f2937;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      overflow-x: auto;
      gap: 6px;
    }
    .laundry-step-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #6b7280;
      white-space: nowrap;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    .laundry-step-item.active {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid #10b981;
      font-weight: bold;
    }
    .laundry-step-item.completed {
      color: #06b6d4;
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
    @keyframes modal-pop {
      0% { opacity: 0; transform: scale(0.92); }
      100% { opacity: 1; transform: scale(1); }
    }
  `;
  container.appendChild(styleEl);

  // ─── Main Render Function ─────────────────────────────────────────────────
  const render = () => {
    const feeConfig = getProfileFeeConfig();

    container.innerHTML = '';
    container.appendChild(styleEl);

    // ─── Top Header ─────────────────────────────────────────────────────────
    const headerEl = createElement('div', { style: 'display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; border-bottom:1px solid #1e293b; padding-bottom:12px;' });
    headerEl.innerHTML = `
      <div>
        <div style="font-size:0.75rem; color:#06b6d4; letter-spacing:2px; font-weight:bold;">// SECTOR 7 COIN-OP PROTOCOL</div>
        <h1 style="font-family:'Orbitron', sans-serif; font-size:1.4rem; color:#10b981; margin:4px 0 0 0; display:flex; align-items:center; gap:8px;">
          <span>🧺</span> THE LAUNDRY MACHINE
        </h1>
      </div>
      <div style="text-align:right;">
        <span style="display:inline-block; font-size:0.75rem; padding:3px 8px; border-radius:3px; font-weight:bold; border:1px solid ${feeConfig.badgeColor}; color:${feeConfig.badgeColor}; background:${feeConfig.badgeColor}15;">
          ${feeConfig.badge}
        </span>
      </div>
    `;
    container.appendChild(headerEl);

    // ─── Top Stepper Progress Bar ───────────────────────────────────────────
    const steps = [
      { id: 'wash_laundry', label: '1. Wash Laundry', icon: '🧺' },
      { id: 'laundromat_hub', label: '2. Laundromat', icon: '🏪' },
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

    // ─── Laundromat Radio Bar (Cozy Lo-Fi Music In Background) ──────────────
    const radioBar = createElement('div', { className: 'laundry-radio-bar' });
    radioBar.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="radio-dot" style="${!laundromatAudio.isMusicPlaying ? 'background:#64748b; animation:none;' : ''}"></span>
        <span style="color:#06b6d4; font-weight:bold;">📻 LAUNDROMAT RADIO:</span>
        <span style="color:${laundromatAudio.isMusicPlaying ? '#38bdf8' : '#64748b'}; font-size:0.78rem;">
          ${laundromatAudio.isMusicPlaying ? '24/7 Neon-Spin Lo-Fi Chillhop [80 BPM]' : 'Radio Paused'}
        </span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button id="radio-btn-toggle" class="aim-btn" style="padding:4px 10px; font-size:0.75rem; background:${laundromatAudio.isMusicPlaying ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; border-color:${laundromatAudio.isMusicPlaying ? '#ef4444' : '#10b981'}; color:${laundromatAudio.isMusicPlaying ? '#ef4444' : '#10b981'}; cursor:pointer;">
          ${laundromatAudio.isMusicPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>
        <span style="font-size:0.75rem; color:#64748b;">VOL</span>
        <input type="range" id="radio-vol-slider" min="0" max="1" step="0.05" value="${laundromatAudio.musicVolume}" style="width:55px; accent-color:#06b6d4; cursor:pointer;" title="Laundromat Radio Volume">
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
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 12px 0; font-size: 1.3rem;">
            WASH LAUNDRY: STEP 01
          </h2>
          <p style="color: #94a3b8; font-size: 0.95rem; max-width: 480px; margin: 0 auto 24px auto; line-height: 1.6;">
            Your cyber-threads, ledger tracks, and digital garments are heavily soiled. Grab your bulging dirty load firmly with both hands and head over to the 24/7 coin-op laundromat.
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

          <button id="btn-goto-laundromat" class="aim-btn" style="width: 100%; max-width: 450px; padding: 16px; font-size: 1.05rem; background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer;">
            🧺 GRAB YOUR DIRTY LOAD FIRMLY & ENTER LAUNDROMAT ➔
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
    // STAGE 2: GOTO LAUNDROMAT (Arrive at Laundromat Hub)
    // ────────────────────────────────────────────────────────────────────────
    else if (state.stage === 'laundromat_hub') {
      bodyBox.innerHTML = `
        <div style="text-align: center; padding: 15px 10px;">
          <div style="display:inline-block; background:rgba(6,182,212,0.1); border:1px solid #06b6d4; padding:6px 14px; border-radius:20px; font-size:0.8rem; color:#06b6d4; margin-bottom:12px; font-weight:bold;">
            ⚡ 24/7 CYBER-SPIN COIN-OP // SECTOR 07 ⚡
          </div>
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 10px 0; font-size: 1.3rem;">
            THE LAUNDROMAT MAIN FLOOR
          </h2>
          <p style="color: #94a3b8; font-size: 0.95rem; max-width: 480px; margin: 0 auto 20px auto; line-height: 1.5;">
            Look at all these vibrating machines humming in the neon glow. The commercial washers are tight and won't accept anything until you slide hard coin tokens in. Head over to the cash changer and slide your bills in.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 480px; margin: 0 auto 20px auto; text-align: left;">
            <div style="background: #0b1322; border: 1px solid #1e293b; padding: 12px; border-radius: 6px;">
              <div style="font-size: 0.75rem; color: #888;">CURRENT STATUS</div>
              <div style="font-size: 1rem; color: #10b981; font-weight: bold; margin-top: 4px;">🧺 1 BULGING LOAD</div>
              <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">Waiting for coin lube</div>
            </div>
            <div style="background: #0b1322; border: 1px solid #1e293b; padding: 12px; border-radius: 6px;">
              <div style="font-size: 0.75rem; color: #888;">TOKEN SACK</div>
              <div style="font-size: 1rem; color: #f59e0b; font-weight: bold; margin-top: 4px;">🪙 0 TOKENS</div>
              <div style="font-size: 0.75rem; color: #ef4444; margin-top: 2px;">Needs insertion</div>
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

      bodyBox.innerHTML = `
        <div style="border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 0.75rem; color: #06b6d4; font-weight: bold;">// HARDWARE CHANGER #C-9000</span>
            <h3 style="font-family: 'Orbitron', sans-serif; margin: 4px 0 0 0; color: #fff; font-size: 1.15rem;">
              CASH-TO-COIN MACHINE
            </h3>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 0.8rem; color: #f59e0b; font-weight: bold;">RATE: $1.00 = 4 TOKENS</span>
          </div>
        </div>

        <!-- Cash Input Form -->
        <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); padding: 16px; border-radius: 6px; margin-bottom: 18px;">
          <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
            <label style="color: #94a3b8; font-size: 0.85rem;">SLIDE CASH INTO THE ACCEPTOR SLOT (USD) [MIN $10.00]:</label>
            <span id="token-count-display" style="color: #f59e0b; font-weight: bold; font-size: 0.9rem;">
              🪙 ${activeFeeData.tokens} HARD TOKENS
            </span>
          </div>
          <div style="position: relative;">
            <span style="position: absolute; left: 14px; top: 10px; font-size: 1.5rem; color: #10b981;">$</span>
            <input type="number" id="cash-amount-input" value="${state.amount || ''}" placeholder="25.00" min="10" step="0.01"
              style="width: 100%; background: #000; border: 1px solid #10b981; color: #10b981; padding: 12px 12px 12px 35px; font-size: 1.5rem; font-family: 'Share Tech Mono', monospace; outline: none; box-sizing: border-box; border-radius: 4px;">
          </div>
        </div>

        <!-- Live Network Fee Breakdown -->
        <div style="background: #050912; border: 1px solid #1e293b; padding: 16px; border-radius: 6px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #1f293d; padding-bottom: 8px;">
            <span style="font-family: 'Orbitron', sans-serif; font-size: 0.85rem; color: #06b6d4; font-weight: bold;">
              NETWORK ROUTING & CYCLE FEES
            </span>
            <span style="font-size: 0.75rem; color: ${feeConfig.badgeColor};">${feeConfig.badge}</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #888; font-size: 0.85rem;">
            <span>Stripe Capture (2.9% + $0.30):</span>
            <span id="fee-capture" style="color:#cbd5e1;">-$${activeFeeData.captureFee.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.85rem; color: ${feeConfig.isExempt ? '#10b981' : (feeConfig.rate === 0.07 ? '#06b6d4' : '#888')};">
            <span id="fee-alpha-label">${feeConfig.label}</span>
            <span id="fee-alpha">${feeConfig.isExempt ? '$0.00 (WAIVED)' : `-$${activeFeeData.platformFee.toFixed(2)}`}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #888; font-size: 0.85rem;">
            <span>Connect Routing (0.25% + $0.25):</span>
            <span id="fee-connect" style="color:#cbd5e1;">-$${activeFeeData.connectFee.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #888; border-bottom: 1px dashed #1e293b; padding-bottom: 10px; font-size: 0.85rem;">
            <span>Instant Payout (1.5% / $0.50 Min):</span>
            <span id="fee-instant" style="color:#cbd5e1;">-$${activeFeeData.instantFee.toFixed(2)}</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 1.1rem; color: #fff;">
            <strong>DESTINATION RECEIVES (CLEAN ASSETS):</strong>
            <strong id="final-payout" style="color: #10b981;">$${activeFeeData.payout.toFixed(2)}</strong>
          </div>
        </div>

        <!-- Stripe Payment Authorization Section -->
        <div style="margin-bottom: 20px;">
          <button id="btn-initiate-payment" class="aim-btn" style="width: 100%; padding: 14px; font-size: 1.05rem; background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer;" ${activeFeeData.rawVal < 10 ? 'disabled' : ''}>
            💳 SLIDE IT ALL THE WAY IN // AUTHORIZE VIA STRIPE
          </button>

          <!-- Stripe Card Element Mount Container -->
          <div id="stripe-ui-container" style="display: none; margin-top: 15px; background: #020617; border: 1px solid #06b6d4; padding: 18px; border-radius: 6px;">
            <div style="color: #06b6d4; font-size: 0.85rem; font-weight: bold; margin-bottom: 12px;">// AUTHORIZE PAYMENT TO DISPENSE TOKENS:</div>
            <div id="payment-element"></div>
            <button id="submit-payment-btn" class="aim-btn" style="width: 100%; margin-top: 16px; padding: 14px; background: #06b6d4; border-color: #06b6d4; color: #000; font-weight: bold; cursor: pointer;">
              AUTHORIZE & DISPENSE HARD TOKENS
            </button>
            <div id="payment-message" style="color: #ef4444; margin-top: 10px; font-family: sans-serif; display: none;"></div>
          </div>
        </div>

        <!-- Optional Minigame Continuation Pathway -->
        <div style="background: rgba(6, 182, 212, 0.05); border: 1px dashed rgba(6, 182, 212, 0.4); padding: 16px; border-radius: 6px; text-align: center;">
          <div style="font-size: 0.8rem; color: #06b6d4; font-weight: bold; margin-bottom: 6px;">
            OPTIONAL: CONTINUE LAUNDROMAT MINIGAME
          </div>
          <div style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 14px;">
            Grab your heavy sack of ${activeFeeData.tokens} tokens and proceed to the gaping washer hole for deep decontamination.
          </div>
          <button id="btn-continue-minigame" class="aim-btn" style="width: 100%; padding: 14px; background: rgba(6, 182, 212, 0.2); border-color: #06b6d4; color: #06b6d4; font-weight: bold; font-size: 1rem; cursor: pointer;" ${activeFeeData.rawVal < 10 ? 'disabled' : ''}>
            🫧 TAKE TOKENS & PROCEED TO THE WASHER HOLE ➔
          </button>
        </div>
      `;

      const cashInput = bodyBox.querySelector('#cash-amount-input');
      const tokenDisplay = bodyBox.querySelector('#token-count-display');
      const elCapture = bodyBox.querySelector('#fee-capture');
      const elAlpha = bodyBox.querySelector('#fee-alpha');
      const elConnect = bodyBox.querySelector('#fee-connect');
      const elInstant = bodyBox.querySelector('#fee-instant');
      const elPayout = bodyBox.querySelector('#final-payout');
      const btnPay = bodyBox.querySelector('#btn-initiate-payment');
      const btnContinue = bodyBox.querySelector('#btn-continue-minigame');
      const stripeBox = bodyBox.querySelector('#stripe-ui-container');
      const submitPayBtn = bodyBox.querySelector('#submit-payment-btn');
      const payMsgEl = bodyBox.querySelector('#payment-message');

      cashInput.oninput = (e) => {
        const val = parseFloat(e.target.value);
        state.amount = isNaN(val) ? 0 : val;
        stripeBox.style.display = 'none';
        btnPay.style.display = 'block';
        btnPay.textContent = '💳 INSERT BILLS // PROCESS PAYMENT WITH STRIPE';

        const calc = calculateFees(val, feeConfig.rate);
        if (!calc) {
          tokenDisplay.textContent = '🪙 0 TOKENS';
          elCapture.textContent = '-$0.00';
          elAlpha.textContent = feeConfig.isExempt ? '$0.00' : '-$0.00';
          elConnect.textContent = '-$0.00';
          elInstant.textContent = '-$0.00';
          elPayout.textContent = '$0.00';
          elPayout.style.color = '#ef4444';
          btnPay.disabled = true;
          btnContinue.disabled = true;
          return;
        }

        tokenDisplay.textContent = `🪙 ${calc.tokens} TOKENS`;
        elCapture.textContent = `-$${calc.captureFee.toFixed(2)}`;
        elAlpha.textContent = feeConfig.isExempt ? '$0.00 (WAIVED)' : `-$${calc.platformFee.toFixed(2)}`;
        elConnect.textContent = `-$${calc.connectFee.toFixed(2)}`;
        elInstant.textContent = `-$${calc.instantFee.toFixed(2)}`;
        elPayout.textContent = `$${calc.payout.toFixed(2)}`;
        elPayout.style.color = '#10b981';
        btnPay.disabled = false;
        btnContinue.disabled = false;
      };

      // Proceed to washing machines
      btnContinue.onclick = () => {
        laundromatAudio.playCoinClink();
        playSFX('navigate');
        state.stage = 'washing_machines';
        render();
      };

      // Initiate Stripe payment
      btnPay.onclick = async () => {
        const val = parseFloat(cashInput.value);
        if (!val || val < 10) return;

        btnPay.textContent = 'ESTABLISHING SECURE STRIPE UPLINK...';
        btnPay.disabled = true;
        laundromatAudio.playBillWhir();

        try {
          const response = await fetch('https://josh627764--alphacore-stripe-fastapi-app.modal.run/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: val,
              profile: feeConfig.profileName,
              fee_rate: feeConfig.rate
            })
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail || 'Transfer API rejected request');
          }

          if (data.clientSecret && window.Stripe) {
            stripeInstance = window.Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd');
            elementsInstance = stripeInstance.elements({
              appearance: { theme: 'night' },
              clientSecret: data.clientSecret
            });

            const paymentElement = elementsInstance.create('payment');
            paymentElement.mount('#payment-element');

            btnPay.style.display = 'none';
            stripeBox.style.display = 'block';
            playSFX('modal');
          }
        } catch (err) {
          console.error('Stripe Uplink Error:', err);
          btnPay.textContent = 'CONNECTION FAILED // RETRY';
          btnPay.style.color = '#ef4444';
          btnPay.style.borderColor = '#ef4444';
          btnPay.disabled = false;
          playSFX('incorrect');
        }
      };

      // Submit payment
      submitPayBtn.onclick = async () => {
        if (!stripeInstance || !elementsInstance) return;
        submitPayBtn.disabled = true;
        submitPayBtn.textContent = 'PROCESSING DISPENSER...';
        payMsgEl.style.display = 'none';
        laundromatAudio.playBillWhir();

        const { error } = await stripeInstance.confirmPayment({
          elements: elementsInstance,
          redirect: 'if_required'
        });

        if (error) {
          payMsgEl.textContent = error.message;
          payMsgEl.style.display = 'block';
          submitPayBtn.disabled = false;
          submitPayBtn.textContent = 'AUTHORIZE & DISPENSE TOKENS';
          playSFX('incorrect');
        } else {
          state.paymentAuthorized = true;
          laundromatAudio.playCoinClink();
          playSFX('response');
          state.stage = 'washing_machines';
          render();
        }
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // STAGE 4: WASHING MACHINES (Load, Spin, & Time Travel 1 Hour)
    // ────────────────────────────────────────────────────────────────────────
    else if (state.stage === 'washing_machines') {
      const activeCalc = calculateFees(state.amount, feeConfig.rate) || { tokens: 100 };
      const tokensNeeded = 12;

      bodyBox.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 0.8rem; color: #06b6d4; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;">
            // HIGH-SPEED COMMERCIAL VORTEX UNIT #07
          </div>
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 12px 0; font-size: 1.25rem;">
            WASHING MACHINE CYCLE
          </h2>

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
          <h2 style="font-family: 'Orbitron', sans-serif; color: #fff; margin: 0 0 12px 0; font-size: 1.25rem;">
            DRYER TUMBLE CYCLE
          </h2>

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
  };

  // Initial Render
  render();

  return container;
}