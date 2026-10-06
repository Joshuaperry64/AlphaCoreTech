/**
 * AlphaCore Laundromat Operative Smartcard & Account Balance Wallet System — v1.0
 * Provides persistent multi-account balance tracking, laundry smartcards,
 * detergent pod allocations, token inventory, and profile switching.
 */

import { createElement } from './utils.js';
import { playSFX } from './audio.js';
import { openLoginModal } from './pinpad.js';

export const WALLET_STORAGE_KEY = 'alphacore_laundromat_wallets_v2';

export const DEFAULT_WALLETS = {
  'Architect': {
    profile: 'Architect',
    cardId: 'AC-CARD-9901',
    balance: 0.00,
    tokens: 0,
    detergentPods: 0,
    detergentSerial: 'AC-DET-9901 [VIP ALLOCATION]',
    dryerSheets: 0,
    cleanLoads: 0,
    roleTitle: 'CHIEF ARCHITECT // FULL ACCESS',
    accentColor: '#10b981',
    pin: '672167566',
    isExempt: true,
    avatar: null
  },
  'DoeBoy': {
    profile: 'DoeBoy',
    cardId: 'AC-CARD-6969',
    balance: 0.00,
    tokens: 0,
    detergentPods: 0,
    detergentSerial: 'AC-DET-6969 [NEON LAVENDER BURST]',
    dryerSheets: 0,
    cleanLoads: 0,
    roleTitle: 'SYSTEM OPERATOR // VAULT CLEARANCE',
    accentColor: '#a855f7',
    pin: '6969',
    isExempt: false,
    avatar: null
  },
  'Fisherman': {
    profile: 'Fisherman',
    cardId: 'AC-CARD-1990',
    balance: 0.00,
    tokens: 0,
    detergentPods: 0,
    detergentSerial: 'AC-DET-1990 [DEEP OCEAN SURGE]',
    dryerSheets: 0,
    cleanLoads: 0,
    roleTitle: 'HARBOR NAVIGATOR // PREFERRED TIER (7%)',
    accentColor: '#06b6d4',
    pin: '1990',
    isExempt: false,
    avatar: null
  },
  'J. P.': {
    profile: 'J. P.',
    cardId: 'AC-CARD-2002',
    balance: 0.00,
    tokens: 0,
    detergentPods: 0,
    detergentSerial: 'AC-DET-2002 [SPRING CYBER RAIN]',
    dryerSheets: 0,
    cleanLoads: 0,
    roleTitle: 'FIELD AGENT // CREATOR PRIVILEGES',
    accentColor: '#38bdf8',
    pin: '20022005',
    isExempt: false,
    avatar: null
  },
  'Guest': {
    profile: 'Guest',
    cardId: 'AC-CARD-GUEST-00',
    balance: 0.00,
    tokens: 0,
    detergentPods: 0,
    detergentSerial: 'AC-DET-GUEST [SINGLE-USE SAMPLE]',
    dryerSheets: 0,
    cleanLoads: 0,
    roleTitle: 'TEMPORARY ESCROW HOLD (24-HR AUTO REFUND)',
    accentColor: '#f59e0b',
    pin: null,
    isExempt: false,
    avatar: null
  }
};

/**
 * Standardize profile name matching to default wallet keys
 */
export function canonicalProfileName(rawName) {
  if (!rawName) return 'Guest';
  const trimmed = String(rawName).trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'architect') return 'Architect';
  if (lower === 'doeboy') return 'DoeBoy';
  if (lower === 'fisherman') return 'Fisherman';
  if (lower === 'j. p.' || lower === 'jp' || lower === 'j.p.') return 'J. P.';
  if (lower === 'guest') return 'Guest';
  return trimmed;
}

/**
 * Retrieve all persistent wallets from localStorage (or fallback to defaults)
 */
export function getAllWallets() {
  // Purge legacy mock data if present
  try {
    if (localStorage.getItem('alphacore_laundromat_wallets')) {
      localStorage.removeItem('alphacore_laundromat_wallets');
    }
  } catch {}

  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all default profiles exist in the saved state
      let updated = false;
      Object.keys(DEFAULT_WALLETS).forEach(k => {
        if (!parsed[k]) {
          parsed[k] = { ...DEFAULT_WALLETS[k] };
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored wallets, using defaults:', e);
  }

  // First-time initialization
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(DEFAULT_WALLETS));
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_WALLETS));
}

/**
 * Get the wallet for a specific profile
 */
export function getProfileWallet(profileName) {
  const cName = canonicalProfileName(profileName);
  const wallets = getAllWallets();
  if (wallets[cName]) {
    return wallets[cName];
  }

  // Create on-the-fly wallet for custom registered profile
  const newWallet = {
    profile: cName,
    cardId: `AC-CARD-${Math.floor(1000 + Math.random() * 9000)}`,
    balance: 0.00,
    tokens: 0,
    detergentPods: 1,
    detergentSerial: `AC-DET-${Math.floor(1000 + Math.random() * 9000)} [COMMERCIAL POD]`,
    dryerSheets: 1,
    cleanLoads: 0,
    roleTitle: 'REGISTERED OPERATIVE',
    accentColor: '#38bdf8',
    pin: null,
    isExempt: false,
    avatar: null
  };
  wallets[cName] = newWallet;
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
  } catch {}
  return newWallet;
}

/**
 * Save / update a wallet for a specific profile
 */
export function saveProfileWallet(profileName, walletData) {
  const cName = canonicalProfileName(profileName);
  const wallets = getAllWallets();
  wallets[cName] = { ...wallets[cName], ...walletData, profile: cName };
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
  } catch (e) {
    console.warn('Failed to persist wallet:', e);
  }
  return wallets[cName];
}

/**
 * Credit funds, tokens, or supplies to a profile wallet
 */
export function creditWallet(profileName, {
  balanceDelta = 0,
  tokensDelta = 0,
  detergentDelta = 0,
  dryerSheetsDelta = 0,
  cleanLaundryDelta = 0
} = {}) {
  const wallet = getProfileWallet(profileName);
  wallet.balance = Math.max(0, Math.round((wallet.balance + Number(balanceDelta || 0)) * 100) / 100);
  wallet.tokens = Math.max(0, wallet.tokens + Math.floor(Number(tokensDelta || 0)));
  wallet.detergentPods = Math.max(0, wallet.detergentPods + Math.floor(Number(detergentDelta || 0)));
  wallet.dryerSheets = Math.max(0, wallet.dryerSheets + Math.floor(Number(dryerSheetsDelta || 0)));
  wallet.cleanLoads = Math.max(0, wallet.cleanLoads + Math.floor(Number(cleanLaundryDelta || 0)));
  return saveProfileWallet(profileName, wallet);
}

/**
 * Debit funds, tokens, or supplies from a profile wallet
 */
export function debitWallet(profileName, {
  balanceDelta = 0,
  tokensDelta = 0,
  detergentDelta = 0,
  dryerSheetsDelta = 0,
  cleanLaundryDelta = 0
} = {}) {
  const wallet = getProfileWallet(profileName);
  wallet.balance = Math.max(0, Math.round((wallet.balance - Number(balanceDelta || 0)) * 100) / 100);
  wallet.tokens = Math.max(0, wallet.tokens - Math.floor(Number(tokensDelta || 0)));
  wallet.detergentPods = Math.max(0, wallet.detergentPods - Math.floor(Number(detergentDelta || 0)));
  wallet.dryerSheets = Math.max(0, wallet.dryerSheets - Math.floor(Number(dryerSheetsDelta || 0)));
  wallet.cleanLoads = Math.max(0, wallet.cleanLoads - Math.floor(Number(cleanLaundryDelta || 0)));
  return saveProfileWallet(profileName, wallet);
}

/**
 * Renders an embossed Cyber-Laundry Smartcard & Account Wallet component.
 * Supports compact mode (header badge) or full operational card view.
 */
export function renderLaundromatWallet({
  currentProfile = null,
  compact = false,
  onProfileSwitched = null,
  onDepositClick = null
} = {}) {
  const profile = canonicalProfileName(currentProfile || sessionStorage.getItem('current_profile') || 'Guest');
  const wallet = getProfileWallet(profile);
  const allWallets = getAllWallets();

  const wrap = createElement('div', {
    className: `laundromat-wallet-wrap ${compact ? 'wallet-compact' : 'wallet-full'}`
  });

  if (compact) {
    wrap.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; background: #070e1b; border: 1px solid ${wallet.accentColor}; border-radius: 6px; padding: 6px 12px; font-size: 0.8rem; box-shadow: 0 0 10px ${wallet.accentColor}25; cursor: pointer;" id="wallet-compact-trigger" title="Click to view Account Wallet">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">💳</span>
          <span style="color: ${wallet.accentColor}; font-weight: bold; font-family: 'Orbitron', sans-serif;">${wallet.cardId}</span>
          <span style="color: #64748b;">[${wallet.profile}]</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="color: #10b981; font-weight: bold;">$${wallet.balance.toFixed(2)}</span>
          <span style="color: #f59e0b; font-weight: bold;">🪙 ${wallet.tokens}</span>
          <span style="font-size: 0.72rem; color: #06b6d4; border: 1px solid #06b6d4; padding: 2px 6px; border-radius: 3px;">SWITCH ▾</span>
        </div>
      </div>
    `;

    wrap.querySelector('#wallet-compact-trigger').onclick = () => {
      openWalletInspectorModal({ onProfileSwitched });
    };

    return wrap;
  }

  // ─── Full Embossed Cyber-Laundry Smartcard ─────────────────────────────────
  wrap.innerHTML = `
    <div class="laundry-smartcard" style="
      position: relative;
      background: linear-gradient(135deg, #090f1d 0%, #0d192e 50%, #0a1120 100%);
      border: 2px solid ${wallet.accentColor};
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 20px ${wallet.accentColor}20;
      color: #fff;
      overflow: hidden;
      font-family: 'Share Tech Mono', monospace;
    ">
      <!-- Metallic Card Shimmer Strip -->
      <div style="
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 4px;
        background: linear-gradient(90deg, transparent, ${wallet.accentColor}, #fff, ${wallet.accentColor}, transparent);
        opacity: 0.8;
      "></div>

      <!-- Card Header: Sector Brand & Contactless Icon -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.3rem;">🧺</span>
          <div>
            <div style="font-size: 0.7rem; color: #06b6d4; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">SECTOR 7 LAUNDRY SMARTCARD</div>
            <div style="font-family: 'Orbitron', sans-serif; font-size: 0.88rem; color: #f8fafc; font-weight: bold;">ALPHA-CARD NFC &bull; SECURE CHIP</div>
          </div>
        </div>
        <div style="text-align: right; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem; color: ${wallet.accentColor}; letter-spacing: 2px;" title="Contactless Active">(((•)))</span>
          <button id="btn-inspect-wallets" class="aim-btn" style="padding: 4px 10px; font-size: 0.72rem; border-color: ${wallet.accentColor}; color: ${wallet.accentColor}; background: ${wallet.accentColor}15; cursor: pointer; border-radius: 4px;">
            ACCOUNT DIRECTORY ▾
          </button>
        </div>
      </div>

      <!-- Chip Graphic & Account Owner Identity -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
        <!-- EMV Smart Chip Graphic -->
        <div style="
          width: 48px;
          height: 38px;
          background: linear-gradient(135deg, #d4af37 0%, #ffd700 50%, #aa8822 100%);
          border-radius: 6px;
          box-shadow: inset 0 0 6px rgba(0,0,0,0.6), 0 0 8px rgba(255,215,0,0.4);
          position: relative;
          border: 1px solid #ffee88;
        ">
          <div style="position: absolute; top: 12px; left: 0; right: 0; height: 1px; background: rgba(0,0,0,0.5);"></div>
          <div style="position: absolute; top: 25px; left: 0; right: 0; height: 1px; background: rgba(0,0,0,0.5);"></div>
          <div style="position: absolute; top: 0; bottom: 0; left: 24px; width: 1px; background: rgba(0,0,0,0.5);"></div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.7rem; color: #94a3b8; letter-spacing: 1px;">OPERATIVE PROFILE</div>
          <div style="font-family: 'Orbitron', sans-serif; font-size: 1.15rem; color: ${wallet.accentColor}; font-weight: bold;">
            ${wallet.profile.toUpperCase()}
          </div>
          <div style="font-size: 0.68rem; color: #64748b;">${wallet.roleTitle}</div>
        </div>
      </div>

      <!-- Card Number & Stored USD Balance -->
      <div style="
        background: rgba(0,0,0,0.5);
        border: 1px dashed rgba(255,255,255,0.15);
        border-radius: 6px;
        padding: 10px 14px;
        margin-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      ">
        <div>
          <div style="font-size: 0.68rem; color: #64748b; letter-spacing: 1px;">SMARTCARD SERIAL:</div>
          <div style="font-family: 'Orbitron', sans-serif; font-size: 1rem; color: #e2e8f0; letter-spacing: 2px;">
            ${wallet.cardId}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.68rem; color: #94a3b8;">AVAILABLE CARD BALANCE:</div>
          <div style="font-family: 'Orbitron', sans-serif; font-size: 1.4rem; color: #10b981; font-weight: bold; text-shadow: 0 0 10px rgba(16,185,129,0.4);">
            $${wallet.balance.toFixed(2)} <span style="font-size: 0.75rem; color: #94a3b8;">USD</span>
          </div>
        </div>
      </div>

      <!-- Inventory Metrics Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-bottom: 14px;">
        <div style="background: rgba(15,23,42,0.6); border: 1px solid #1e293b; border-radius: 6px; padding: 6px 10px; text-align: center;">
          <div style="font-size: 0.68rem; color: #94a3b8;">HARD TOKENS</div>
          <div style="font-size: 1.05rem; font-weight: bold; color: #f59e0b; margin-top: 2px;">
            🪙 ${wallet.tokens}
          </div>
        </div>

        <div style="background: rgba(15,23,42,0.6); border: 1px solid #1e293b; border-radius: 6px; padding: 6px 10px; text-align: center;">
          <div style="font-size: 0.68rem; color: #94a3b8;">DETERGENT PODS</div>
          <div style="font-size: 1.05rem; font-weight: bold; color: #06b6d4; margin-top: 2px;">
            🫧 ${wallet.detergentPods}
          </div>
        </div>

        <div style="background: rgba(15,23,42,0.6); border: 1px solid #1e293b; border-radius: 6px; padding: 6px 10px; text-align: center;">
          <div style="font-size: 0.68rem; color: #94a3b8;">DRYER SHEETS</div>
          <div style="font-size: 1.05rem; font-weight: bold; color: #a855f7; margin-top: 2px;">
            🔥 ${wallet.dryerSheets}
          </div>
        </div>

        <div style="background: rgba(15,23,42,0.6); border: 1px solid #1e293b; border-radius: 6px; padding: 6px 10px; text-align: center;">
          <div style="font-size: 0.68rem; color: #94a3b8;">CLEAN LOADS</div>
          <div style="font-size: 1.05rem; font-weight: bold; color: #10b981; margin-top: 2px;">
            ✨ ${wallet.cleanLoads}
          </div>
        </div>
      </div>

      <!-- Detergent Pod Serial Batch Info -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #64748b; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
        <div>
          <span style="color: #94a3b8;">DETERGENT ALLOCATION:</span>
          <span style="color: #38bdf8;">${wallet.detergentSerial}</span>
        </div>
        <div style="color: ${wallet.isExempt ? '#10b981' : '#64748b'}; font-weight: bold;">
          ${wallet.isExempt ? '● 0% FEE VIP PASS' : '● ACTIVE'}
        </div>
      </div>

      <!-- Quick Action Controls -->
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button id="btn-quick-atm" class="aim-btn" style="flex: 2; padding: 8px 12px; background: rgba(16,185,129,0.15); border-color: #10b981; color: #10b981; font-weight: bold; font-size: 0.8rem; cursor: pointer; border-radius: 4px;">
          🏧 RELOAD CARD AT ATM
        </button>
        <button id="btn-switch-account" class="aim-btn" style="flex: 1; padding: 8px 12px; background: rgba(6,182,212,0.15); border-color: #06b6d4; color: #38bdf8; font-size: 0.8rem; cursor: pointer; border-radius: 4px;">
          🔑 SWITCH PROFILE
        </button>
      </div>
    </div>
  `;

  // Wire events
  const btnInspect = wrap.querySelector('#btn-inspect-wallets');
  if (btnInspect) {
    btnInspect.onclick = () => {
      playSFX('click');
      openWalletInspectorModal({ onProfileSwitched });
    };
  }

  const btnSwitch = wrap.querySelector('#btn-switch-account');
  if (btnSwitch) {
    btnSwitch.onclick = () => {
      playSFX('click');
      openLoginModal({
        title: '// LAUNDROMAT PROFILE AUTH',
        subtitle: 'AUTHENTICATE TO ACCESS SECURE CARD WALLET',
        onSuccess: () => {
          if (onProfileSwitched) onProfileSwitched();
        }
      });
    };
  }

  const btnAtm = wrap.querySelector('#btn-quick-atm');
  if (btnAtm) {
    btnAtm.onclick = () => {
      playSFX('click');
      if (onDepositClick) onDepositClick();
    };
  }

  return wrap;
}

/**
 * Opens an interactive modal to inspect all profile balances, card serials,
 * detergent allocations, and switch accounts with 1 click.
 */
export function openWalletInspectorModal({ onProfileSwitched = null } = {}) {
  const allWallets = getAllWallets();
  const currentProfile = canonicalProfileName(sessionStorage.getItem('current_profile') || 'Guest');

  const overlay = createElement('div', {
    className: 'laundry-wallet-modal-overlay',
    style: `
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.92);
      backdrop-filter: blur(10px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
    `
  });

  const modalBox = createElement('div', {
    style: `
      background: #080e1a;
      border: 2px solid #06b6d4;
      border-radius: 12px;
      max-width: 620px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.95), 0 0 35px rgba(6,182,212,0.3);
      color: #fff;
      font-family: 'Share Tech Mono', monospace;
      position: relative;
      margin: auto;
    `
  });

  modalBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
      <div>
        <div style="font-size: 0.72rem; color: #06b6d4; letter-spacing: 2px; font-weight: bold;">// ALPHA-CARD WALLET VAULT DIRECTORY</div>
        <h3 style="font-family: 'Orbitron', sans-serif; margin: 4px 0 0 0; color: #fff; font-size: 1.2rem; display: flex; align-items: center; gap: 8px;">
          <span>💳</span> OPERATIVE ACCOUNT BALANCES
        </h3>
      </div>
      <button id="btn-close-wallet-modal" class="aim-btn" style="padding: 6px 12px; border-color: #64748b; color: #94a3b8; cursor: pointer;">
        ✕ CLOSE
      </button>
    </div>

    <p style="color: #94a3b8; font-size: 0.85rem; margin: 0 0 16px 0; line-height: 1.5;">
      Each registered operative possesses a cryptographic smartcard linked to their Sector 7 Laundromat ledger. Inspect balances below or switch active profile.
    </p>

    <!-- Profiles List -->
    <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
      ${Object.keys(allWallets).map(pKey => {
        const w = allWallets[pKey];
        const isActive = w.profile === currentProfile;
        return `
          <div class="wallet-account-row" style="
            background: ${isActive ? 'rgba(6,182,212,0.1)' : 'rgba(15,23,42,0.6)'};
            border: 1px solid ${isActive ? w.accentColor : '#1e293b'};
            border-radius: 8px;
            padding: 12px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            box-shadow: ${isActive ? `0 0 15px ${w.accentColor}25` : 'none'};
          ">
            <div style="flex: 1; min-width: 180px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.2em; margin-right: 5px;">${w.avatar || '👤'}</span>
                <span style="font-family: 'Orbitron', sans-serif; font-size: 1rem; color: ${w.accentColor}; font-weight: bold;">
                  ${w.profile}
                </span>
                ${isActive ? '<span style="font-size: 0.68rem; background: #10b981; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 3px;">ACTIVE NOW</span>' : ''}
              </div>
              <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">
                CARD: <strong style="color: #cbd5e1;">${w.cardId}</strong> &bull; ${w.roleTitle.split('//')[0].trim()}
              </div>
              <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">
                Detergent: <span style="color: #38bdf8;">${w.detergentSerial.split('[')[0].trim()}</span> (${w.detergentPods} Pods)
              </div>
            </div>

            <div style="text-align: right; min-width: 120px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 1.15rem; color: #10b981; font-weight: bold;">
                $${w.balance.toFixed(2)}
              </div>
              <div style="font-size: 0.75rem; color: #f59e0b; margin-top: 2px;">
                🪙 ${w.tokens} Hard Tokens
              </div>
            </div>

            <div style="display: flex; gap: 6px;">
              ${!isActive ? `
                <button class="aim-btn btn-select-wallet" data-profile="${w.profile}" style="padding: 8px 14px; background: rgba(6,182,212,0.15); border-color: #06b6d4; color: #38bdf8; font-size: 0.78rem; font-weight: bold; cursor: pointer; border-radius: 4px;">
                  LOAD WALLET ➔
                </button>
              ` : `
                <button disabled style="padding: 8px 14px; background: rgba(16,185,129,0.1); border: 1px solid #10b981; color: #10b981; font-size: 0.78rem; font-weight: bold; border-radius: 4px;">
                  ✓ CURRENT
                </button>
              `}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Modal Footer Actions -->
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="btn-login-pin-gateway" class="aim-btn" style="padding: 10px 16px; background: rgba(168,85,247,0.15); border-color: #a855f7; color: #c084fc; font-size: 0.82rem; font-weight: bold; cursor: pointer;">
        🔑 PIN LOGIN GATEWAY
      </button>
      <button id="btn-close-modal-bottom" class="aim-btn" style="padding: 10px 16px; border-color: #64748b; color: #94a3b8; font-size: 0.82rem; cursor: pointer;">
        DONE
      </button>
    </div>
  `;

  overlay.appendChild(modalBox);
  document.body.appendChild(overlay);

  // Close handlers
  const closeModal = () => {
    playSFX('click');
    overlay.remove();
  };

  modalBox.querySelector('#btn-close-wallet-modal').onclick = closeModal;
  modalBox.querySelector('#btn-close-modal-bottom').onclick = closeModal;

  // Profile selection buttons
  modalBox.querySelectorAll('.btn-select-wallet').forEach(btn => {
    btn.onclick = () => {
      const targetProf = btn.getAttribute('data-profile');
      const targetWallet = allWallets[targetProf];
      playSFX('login');

      // Update sessionStorage
      sessionStorage.setItem('current_profile', targetProf);
      if (targetWallet && targetWallet.pin) {
        sessionStorage.setItem('current_pin', targetWallet.pin);
      } else {
        sessionStorage.removeItem('current_pin');
      }

      overlay.remove();
      if (onProfileSwitched) {
        onProfileSwitched(targetProf);
      } else {
        window.location.reload();
      }
    };
  });

  // PIN Gateway button
  modalBox.querySelector('#btn-login-pin-gateway').onclick = () => {
    overlay.remove();
    openLoginModal({
      title: '// SECURE PROFILE AUTHENTICATION',
      subtitle: 'VERIFY IDENTITY PIN TO SWITCH ACTIVE WALLET',
      onSuccess: () => {
        if (onProfileSwitched) onProfileSwitched();
        else window.location.reload();
      }
    });
  };
}


export function saveWalletAvatar(profileName, emoji) {
  const profile = canonicalProfileName(profileName);
  const wallets = getAllWallets();
  if (wallets[profile]) {
    wallets[profile].avatar = emoji;
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
    return true;
  }
  return false;
}
