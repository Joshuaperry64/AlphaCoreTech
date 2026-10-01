import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  canonicalProfileName,
  getAllWallets,
  getProfileWallet,
  saveProfileWallet,
  creditWallet,
  debitWallet,
  renderLaundromatWallet,
  openWalletInspectorModal,
  DEFAULT_WALLETS,
  WALLET_STORAGE_KEY
} from './laundromat_wallet.js';

describe('Laundromat Wallet & Account Balance System', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
  });

  describe('canonicalProfileName', () => {
    it('normalizes common profile name variations correctly', () => {
      expect(canonicalProfileName('architect')).toBe('Architect');
      expect(canonicalProfileName('ARCHITECT')).toBe('Architect');
      expect(canonicalProfileName('doeboy')).toBe('DoeBoy');
      expect(canonicalProfileName('DOEBOY')).toBe('DoeBoy');
      expect(canonicalProfileName('fisherman')).toBe('Fisherman');
      expect(canonicalProfileName('j. p.')).toBe('J. P.');
      expect(canonicalProfileName('jp')).toBe('J. P.');
      expect(canonicalProfileName('guest')).toBe('Guest');
      expect(canonicalProfileName(null)).toBe('Guest');
      expect(canonicalProfileName('CustomUser')).toBe('CustomUser');
    });
  });

  describe('Wallet Retrieval & Defaults', () => {
    it('returns $0.00 real money default balances for all predefined AlphaCore profiles', () => {
      const wallets = getAllWallets();
      expect(wallets['Architect']).toBeDefined();
      expect(wallets['Architect'].balance).toBe(0.00);
      expect(wallets['Architect'].cardId).toBe('AC-CARD-9901');
      expect(wallets['Architect'].tokens).toBe(0);
      expect(wallets['Architect'].detergentPods).toBe(0);

      expect(wallets['DoeBoy']).toBeDefined();
      expect(wallets['DoeBoy'].balance).toBe(0.00);
      expect(wallets['DoeBoy'].cardId).toBe('AC-CARD-6969');
      expect(wallets['DoeBoy'].tokens).toBe(0);

      expect(wallets['Fisherman']).toBeDefined();
      expect(wallets['Fisherman'].balance).toBe(0.00);
      expect(wallets['Fisherman'].cardId).toBe('AC-CARD-1990');
      expect(wallets['Fisherman'].tokens).toBe(0);

      expect(wallets['J. P.']).toBeDefined();
      expect(wallets['J. P.'].balance).toBe(0.00);
      expect(wallets['J. P.'].cardId).toBe('AC-CARD-2002');
      expect(wallets['J. P.'].tokens).toBe(0);

      expect(wallets['Guest']).toBeDefined();
      expect(wallets['Guest'].balance).toBe(0.00);
      expect(wallets['Guest'].tokens).toBe(0);
    });

    it('persists initial default wallets to localStorage on first access', () => {
      expect(localStorage.getItem(WALLET_STORAGE_KEY)).toBeNull();
      getProfileWallet('DoeBoy');
      expect(localStorage.getItem(WALLET_STORAGE_KEY)).not.toBeNull();
      const stored = JSON.parse(localStorage.getItem(WALLET_STORAGE_KEY));
      expect(stored['DoeBoy'].balance).toBe(0.00);
    });

    it('creates an on-the-fly wallet for custom profiles with generated card ID', () => {
      const customWallet = getProfileWallet('SovereignOperative');
      expect(customWallet.profile).toBe('SovereignOperative');
      expect(customWallet.cardId).toMatch(/^AC-CARD-\d{4}$/);
      expect(customWallet.balance).toBe(0.00);
      expect(customWallet.tokens).toBe(0);
    });
  });

  describe('creditWallet & debitWallet', () => {
    it('credits balance, tokens, detergent, and clean loads correctly from $0.00 base', () => {
      const updated = creditWallet('DoeBoy', {
        balanceDelta: 25.50,
        tokensDelta: 10,
        detergentDelta: 2,
        cleanLaundryDelta: 1
      });

      expect(updated.balance).toBe(25.50); // 0.00 + 25.50
      expect(updated.tokens).toBe(10);     // 0 + 10
      expect(updated.detergentPods).toBe(2); // 0 + 2
      expect(updated.cleanLoads).toBe(1);   // 0 + 1

      // Verify persistence in localStorage
      const reloaded = getProfileWallet('DoeBoy');
      expect(reloaded.balance).toBe(25.50);
      expect(reloaded.tokens).toBe(10);
    });

    it('debits balance and supplies without going below zero', () => {
      // First credit some funds
      creditWallet('Fisherman', {
        balanceDelta: 20.00,
        tokensDelta: 4,
        detergentDelta: 2,
        dryerSheetsDelta: 2
      });

      const debited = debitWallet('Fisherman', {
        balanceDelta: 15.00,
        tokensDelta: 2,
        detergentDelta: 1,
        dryerSheetsDelta: 1
      });

      expect(debited.balance).toBe(5.00); // 20.00 - 15.00
      expect(debited.tokens).toBe(2);     // 4 - 2
      expect(debited.detergentPods).toBe(1); // 2 - 1
      expect(debited.dryerSheets).toBe(1);   // 2 - 1

      // Clamping to zero
      const overdebited = debitWallet('Fisherman', {
        balanceDelta: 100.00,
        tokensDelta: 100
      });
      expect(overdebited.balance).toBe(0.00);
      expect(overdebited.tokens).toBe(0);
    });
  });

  describe('UI Component Rendering', () => {
    it('renders the embossed Smartcard with chip graphic and metrics', () => {
      const el = renderLaundromatWallet({ currentProfile: 'Architect' });
      expect(el).toBeTruthy();
      expect(el.innerHTML).toContain('AC-CARD-9901');
      expect(el.innerHTML).toContain('ARCHITECT');
      expect(el.innerHTML).toContain('$0.00');
      expect(el.innerHTML).toContain('🪙 0');
      expect(el.innerHTML).toContain('🫧 0');
      expect(el.innerHTML).toContain('RELOAD CARD AT ATM');
      expect(el.innerHTML).toContain('SWITCH PROFILE');
    });

    it('renders compact mode with quick switcher badge', () => {
      const el = renderLaundromatWallet({ currentProfile: 'DoeBoy', compact: true });
      expect(el.classList.contains('wallet-compact')).toBe(true);
      expect(el.innerHTML).toContain('AC-CARD-6969');
      expect(el.innerHTML).toContain('$0.00');
      expect(el.innerHTML).toContain('SWITCH ▾');
    });

    it('opens the wallet inspector modal listing all account balances and allows switching', () => {
      const onSwitched = vi.fn();
      openWalletInspectorModal({ onProfileSwitched: onSwitched });

      const modal = document.querySelector('.laundry-wallet-modal-overlay');
      expect(modal).toBeTruthy();
      expect(modal.innerHTML).toContain('OPERATIVE ACCOUNT BALANCES');
      expect(modal.innerHTML).toContain('Architect');
      expect(modal.innerHTML).toContain('$0.00');
      expect(modal.innerHTML).toContain('DoeBoy');
      expect(modal.innerHTML).toContain('Fisherman');
      expect(modal.innerHTML).toContain('J. P.');

      // Click to switch to DoeBoy
      const selectDoeBoyBtn = modal.querySelector('.btn-select-wallet[data-profile="DoeBoy"]');
      expect(selectDoeBoyBtn).toBeTruthy();
      selectDoeBoyBtn.click();

      expect(sessionStorage.getItem('current_profile')).toBe('DoeBoy');
      expect(sessionStorage.getItem('current_pin')).toBe('6969');
      expect(onSwitched).toHaveBeenCalledWith('DoeBoy');
      expect(document.querySelector('.laundry-wallet-modal-overlay')).toBeNull();
    });
  });
});
