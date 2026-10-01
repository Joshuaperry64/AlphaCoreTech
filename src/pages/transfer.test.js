import { describe, it, expect, beforeEach, vi } from 'vitest';
import TransferPage from './transfer.js';

describe('TransferPage (Laundro-mat)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
    window.AudioContext = class MockAudioContext {
      constructor() {
        this.destination = {};
        this.currentTime = 0;
      }
      createOscillator() {
        return {
          type: '',
          frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn()
        };
      }
      createBiquadFilter() {
        return {
          type: '',
          frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
          Q: { setValueAtTime: vi.fn() },
          connect: vi.fn()
        };
      }
      createBuffer() {
        return { getChannelData: () => new Float32Array(100) };
      }
      createBufferSource() {
        return {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        };
      }
    };
  });

  it('renders the laundromat page container without crashing as Guest', () => {
    sessionStorage.setItem('current_profile', 'Guest');
    const el = TransferPage();
    expect(el).toBeTruthy();
    expect(el.classList.contains('laundry-page')).toBe(true);
    expect(el.innerHTML).toContain('LAUNDRO-MAT');
  });

  it('renders correctly as Architect profile without reference errors', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    const el = TransferPage();
    expect(el).toBeTruthy();
    expect(el.innerHTML).toContain('ARCHITECT');
  });

  it('renders operative laundry smartcard and account balance button in the header', () => {
    sessionStorage.setItem('current_profile', 'DoeBoy');
    sessionStorage.setItem('current_pin', '6969');
    const el = TransferPage();

    const btnHeaderWallet = el.querySelector('#btn-header-wallet');
    expect(btnHeaderWallet).toBeTruthy();
    expect(btnHeaderWallet.innerHTML).toContain('AC-CARD-6969');
    expect(btnHeaderWallet.innerHTML).toContain('$0.00');
    expect(btnHeaderWallet.innerHTML).toContain('🪙 0');
  });

  it('renders full smartcard with live balance and token sack in Stage 2 (laundromat_hub)', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    const el = TransferPage();

    // Stage 1 -> Stage 2
    const btnGotoLaundromat = el.querySelector('#btn-goto-laundromat');
    btnGotoLaundromat.click();

    // Stage 2 Hub
    expect(el.innerHTML).toContain('THE LAUNDRO-MAT MAIN FLOOR');
    const walletMount = el.querySelector('#laundromat-wallet-mount');
    expect(walletMount).toBeTruthy();
    expect(walletMount.innerHTML).toContain('AC-CARD-9901');
    expect(walletMount.innerHTML).toContain('$0.00');
    expect(walletMount.innerHTML).toContain('🪙 0');
    expect(walletMount.innerHTML).toContain('🫧 0');
  });

  it('displays docked smartcard and stored balance in Stage 3 (Cyber-ATM)', () => {
    sessionStorage.setItem('current_profile', 'Fisherman');
    sessionStorage.setItem('current_pin', '1990');
    const el = TransferPage();

    // Go to Stage 2 then Stage 3
    el.querySelector('#btn-goto-laundromat').click();
    el.querySelector('#btn-goto-changer').click();

    // Stage 3 ATM
    expect(el.innerHTML).toContain('DOCKED OPERATIVE LAUNDRY SMARTCARD');
    expect(el.innerHTML).toContain('AC-CARD-1990');
    expect(el.innerHTML).toContain('FISHERMAN');
    expect(el.innerHTML).toContain('$0.00');
    expect(el.innerHTML).toContain('🪙 0 Hard Tokens');
  });
});
