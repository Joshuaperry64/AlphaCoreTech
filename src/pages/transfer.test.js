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

  it('navigates through to the coin changer stage with $0.50 min input', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    const el = TransferPage();

    // Stage 1 -> Stage 2
    const btnGotoLaundromat = el.querySelector('#btn-goto-laundromat');
    expect(btnGotoLaundromat).toBeTruthy();
    btnGotoLaundromat.click();

    // Stage 2 -> Stage 3
    const btnGotoChanger = el.querySelector('#btn-goto-changer');
    expect(btnGotoChanger).toBeTruthy();
    btnGotoChanger.click();

    // Stage 3: verify cash-to-coin elements
    const cashInput = el.querySelector('#cash-amount-input');
    expect(cashInput).toBeTruthy();
    expect(cashInput.getAttribute('min')).toBe('0.50');
    expect(cashInput.getAttribute('placeholder')).toBe('0.50');

    const btnPay = el.querySelector('#btn-initiate-deposit');
    expect(btnPay).toBeTruthy();
    expect(btnPay.disabled).toBe(false);
  });
});
