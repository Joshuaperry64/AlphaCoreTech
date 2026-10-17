import { describe, it, expect, beforeEach, vi } from 'vitest';
import TransferPage from '../pages/transfer.js';

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
    expect(el.innerHTML).toContain('🪙 0 Matrix Tokens');
  });

  it('renders development disclaimer modal on first entry and dismisses on accept', () => {
    sessionStorage.clear();
    const el = TransferPage();
    const disclaimer = el.querySelector('.laundry-disclaimer-wrap');
    expect(disclaimer).toBeTruthy();
    expect(disclaimer.innerHTML).toContain('// LAUNDROMAT_ADVISORY');
    expect(disclaimer.innerHTML).toContain('NOTICE // UNDER DEVELOPMENT');

    const btnAccept = disclaimer.querySelector('#laundry-disc-accept');
    expect(btnAccept).toBeTruthy();
    btnAccept.click();
    expect(sessionStorage.getItem('laundromat_disclaimer_accepted')).toBe('1');
    expect(el.querySelector('.laundry-disclaimer-wrap')).toBeNull();
  });

  it('renders ACCOUNTS dropdown in header only for Architect profile', () => {
    // Non-Architect (DoeBoy)
    sessionStorage.setItem('current_profile', 'DoeBoy');
    sessionStorage.setItem('current_pin', '6969');
    let el = TransferPage();
    let headerWallet = el.querySelector('#btn-header-wallet');
    expect(headerWallet.innerHTML).not.toContain('ACCOUNTS ▾');

    // Architect
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    el = TransferPage();
    headerWallet = el.querySelector('#btn-header-wallet');
    expect(headerWallet.innerHTML).toContain('ACCOUNTS ▾');
  });

  it('provides quick presets [10, 20, 25, 30, 50, 75] and allows voluntary donation on ATM', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    const el = TransferPage();

    el.querySelector('#btn-goto-laundromat').click();
    el.querySelector('#btn-goto-changer').click();

    // Check presets
    const presetBtns = Array.from(el.querySelectorAll('.btn-preset')).map(b => b.getAttribute('data-val'));
    expect(presetBtns).toEqual(['10', '20', '25', '30', '50', '75']);

    // Check voluntary donation toggle
    const btnDonate = el.querySelector('#btn-donate-toggle');
    expect(btnDonate).toBeTruthy();
    expect(btnDonate.textContent).toContain('Donate to AlphaCore (Optional)');
    btnDonate.click();

    // Donation modal appears
    const donationModal = el.querySelector('.laundry-donation-modal');
    expect(donationModal).toBeTruthy();
    expect(donationModal.innerHTML).toContain('This is a donation and you will not receive any of the funds.');
  });

  it('completes ATM card insertion and transitions to dedicated Coin Changer stage', async () => {
    vi.useFakeTimers();
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    const el = TransferPage();

    el.querySelector('#btn-goto-laundromat').click();
    el.querySelector('#btn-goto-changer').click();

    const btnInsert = el.querySelector('#btn-initiate-deposit');
    expect(btnInsert).toBeTruthy();
    expect(btnInsert.textContent).toContain('Insert card');

    btnInsert.click();
    vi.advanceTimersByTime(600);

    // ATM shows success and Continue button
    expect(el.innerHTML).toContain('CARD INSERTED SUCCESSFULLY');
    const btnContinue = el.querySelector('#btn-goto-coin-changer');
    expect(btnContinue).toBeTruthy();
    expect(btnContinue.textContent).toContain('CONTINUE TO THE COIN CHANGER');

    btnContinue.click();

    // Stage 4 Coin Changer
    expect(el.innerHTML).toContain('COIN CHANGER &amp; PAYOUT DISPENSER');
    expect(el.innerHTML).toContain('Depending on your bank, it may take 2 or so days for the funds to actually clear.');
    expect(el.innerHTML).toContain('MATRIX TOKEN DISPENSER TRAY');

    const btnProcess = el.querySelector('#btn-process-changer');
    expect(btnProcess).toBeTruthy();
    await btnProcess.onclick();

    expect(el.innerHTML).toContain('TRANSACTION COMPLETE');
    const btnCollect = el.querySelector('#btn-collect-proceed');
    expect(btnCollect).toBeTruthy();
    expect(btnCollect.textContent).toContain('COLLECT 100 MATRIX TOKENS');

    // Proceed to washers
    btnCollect.click();
    expect(el.innerHTML).toContain('WASHING MACHINE CYCLE');
    expect(el.innerHTML).toContain('MATRIX TOKENS');
    vi.useRealTimers();
  });

  it('allows sneaking into laundromat for freeplay simulation with 12 tokens', () => {
    sessionStorage.setItem('current_profile', 'Guest');
    const el = TransferPage();

    const btnSneak = el.querySelector('#btn-sneak-laundromat');
    expect(btnSneak).toBeTruthy();
    expect(btnSneak.textContent).toContain('SNEAK INTO LAUNDROMAT');

    btnSneak.click();

    // Immediately at washing machines with simulation tokens
    expect(el.innerHTML).toContain('WASHING MACHINE CYCLE');
    expect(el.innerHTML).toContain('12 Tokens');
  });
});
