/**
 * Port Entry Point: ForbiddenArchive (Native Netlify Edge API)
 * Web-Ported Cyberpunk Component for AlphaCoreTech Subroutines Console.
 */

// 1. Metadata Exports (PortComponentContract)
export const id = 'port-forbiddenarchive';
export const name = 'ForbiddenArchive';
export const category = 'Security & Cyber';
export const version = '1.2.0';
export const description = 'Encrypted document archive and stealth vault system. (Powered by Netlify Serverless AES-256)';
export const pythonSourcePath = 'ForbiddenArchive/main.py';

// Import all local JSON archives using Vite's eager glob
const localArchives = import.meta.glob('./archives/*.json', { eager: true });
const archiveKeys = Object.keys(localArchives);

let activeInstance = null;

export function render(container, options = {}) {
  if (!container) return { destroy: () => {} };
  destroy();

  const userPin = localStorage.getItem('alphacore_pin') || '';

  // Generate Dropdown Options
  let dropdownOptions = '<option value="">-- SELECT LOCAL ARCHIVE --</option>';
  archiveKeys.forEach(path => {
    const filename = path.split('/').pop().replace('.json', '');
    const formattedName = filename.replace(/_/g, ' ').toUpperCase();
    dropdownOptions += `<option value="${path}">${formattedName}</option>`;
  });

  container.innerHTML = `
    <div class="port-forbiddenarchive-app" style="height: 100%; display: flex; flex-direction: column; background: rgba(5,5,10,0.95); border: 1px solid rgba(220,38,38,0.4); border-radius: 6px; padding: 20px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; box-shadow: inset 0 0 40px rgba(220,38,38,0.05);">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(220,38,38,0.3); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.4rem; color: #ef4444; text-shadow: 0 0 10px rgba(239,68,68,0.5); display: flex; align-items: center; gap: 8px;">
            <span>🛡️ ${name}</span>
            <span style="font-size: 0.75rem; background: rgba(220,38,38,0.15); color: #fca5a5; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(220,38,38,0.4);">AES-256 GCM</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #aaa;">${description}</p>
        </div>
      </div>

      <!-- Main Interface -->
      <div style="display: flex; flex-direction: column; gap: 12px; flex-grow: 1;">
        
        <div>
          <label style="display: block; color: #ef4444; font-size: 0.85rem; margin-bottom: 4px;">// LOCAL DATABASE INGESTION</label>
          <select id="fa-archive-select" style="width: 100%; background: rgba(0,0,0,0.6); border: 1px solid rgba(220,38,38,0.3); border-radius: 4px; padding: 8px; color: #fca5a5; font-family: 'Share Tech Mono', monospace; font-size: 0.9rem; outline: none; cursor: pointer;">
            ${dropdownOptions}
          </select>
        </div>

        <div>
          <label style="display: block; color: #ef4444; font-size: 0.85rem; margin-bottom: 4px;">// PAYLOAD (PLAINTEXT OR ENCRYPTED)</label>
          <textarea id="fa-text" placeholder="Select an archive above, enter secret data, or paste encrypted payload here..." style="width: 100%; height: 110px; background: rgba(0,0,0,0.6); border: 1px solid rgba(220,38,38,0.3); border-radius: 4px; padding: 12px; color: #f87171; font-family: 'Share Tech Mono', monospace; font-size: 0.9rem; resize: vertical; outline: none; box-sizing: border-box;"></textarea>
        </div>

        <div>
          <label style="display: block; color: #ef4444; font-size: 0.85rem; margin-bottom: 4px;">// ENCRYPTION KEY (PASSWORD)</label>
          <input type="password" id="fa-password" placeholder="Enter vault password..." style="width: 100%; background: rgba(0,0,0,0.6); border: 1px solid rgba(220,38,38,0.3); border-radius: 4px; padding: 10px 12px; color: #fff; font-family: 'Share Tech Mono', monospace; font-size: 1rem; outline: none; box-sizing: border-box;" />
        </div>

        <div style="display: flex; gap: 12px; margin-top: 4px;">
          <button id="fa-btn-encrypt" style="flex: 1; background: rgba(220,38,38,0.15); border: 1px solid #ef4444; color: #ef4444; padding: 12px; border-radius: 4px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 0.9rem; transition: all 0.2s;">
            ENCRYPT PAYLOAD
          </button>
          <button id="fa-btn-decrypt" style="flex: 1; background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #10b981; padding: 12px; border-radius: 4px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 0.9rem; transition: all 0.2s;">
            DECRYPT PAYLOAD
          </button>
        </div>

        <div style="margin-top: 12px; flex-grow: 1; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label style="color: #64748b; font-size: 0.85rem;">// TERMINAL OUTPUT</label>
            <button id="fa-btn-copy" style="background: transparent; border: 1px solid #64748b; color: #64748b; padding: 2px 8px; border-radius: 3px; font-size: 0.75rem; cursor: pointer;">COPY</button>
          </div>
          <div id="fa-output" style="flex-grow: 1; min-height: 80px; background: rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 12px; color: #38bdf8; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; word-break: break-all; overflow-y: auto;">
            > Awaiting command...
          </div>
        </div>

      </div>
    </div>
  `;

  const btnEncrypt = container.querySelector('#fa-btn-encrypt');
  const btnDecrypt = container.querySelector('#fa-btn-decrypt');
  const btnCopy = container.querySelector('#fa-btn-copy');
  const outputEl = container.querySelector('#fa-output');
  const txtInput = container.querySelector('#fa-text');
  const pwdInput = container.querySelector('#fa-password');
  const archiveSelect = container.querySelector('#fa-archive-select');

  // Archive Dropdown Handler
  archiveSelect.addEventListener('change', (e) => {
    const selectedPath = e.target.value;
    if (selectedPath && localArchives[selectedPath]) {
      // The eager glob imports JSON as a default export or an object
      const data = localArchives[selectedPath].default || localArchives[selectedPath];
      txtInput.value = JSON.stringify(data, null, 2);
      outputEl.innerHTML = `<span style="color: #10b981;">> Loaded local archive: ${selectedPath.split('/').pop()}</span>`;
      if (options.onLog) options.onLog(`[ForbiddenArchive] Loaded ${selectedPath}`, '#10b981');
    } else {
      txtInput.value = '';
    }
  });

  // Hover effects
  btnEncrypt.addEventListener('mouseenter', () => btnEncrypt.style.background = 'rgba(220,38,38,0.3)');
  btnEncrypt.addEventListener('mouseleave', () => btnEncrypt.style.background = 'rgba(220,38,38,0.15)');
  btnDecrypt.addEventListener('mouseenter', () => btnDecrypt.style.background = 'rgba(16,185,129,0.3)');
  btnDecrypt.addEventListener('mouseleave', () => btnDecrypt.style.background = 'rgba(16,185,129,0.15)');

  // Web Crypto helpers — AES-256-GCM with PBKDF2 key derivation (100k rounds)
  const _enc = new TextEncoder();
  const _dec = new TextDecoder();

  async function _deriveKey(password, salt) {
    const keyMat = await crypto.subtle.importKey('raw', _enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMat,
      { name: 'AES-GCM', length: 256 },
      false, ['encrypt', 'decrypt']
    );
  }

  async function processVault(action) {
    const text = txtInput.value.trim();
    const password = pwdInput.value;

    if (!text || !password) {
      outputEl.innerHTML = '<span style="color: #ef4444;">> ERROR: Payload and Password are required.</span>';
      return;
    }

    outputEl.innerHTML = '<span style="color: #a78bfa;">> Crunching AES-256-GCM locally...</span>';

    try {
      if (action === 'encrypt') {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv   = crypto.getRandomValues(new Uint8Array(12));
        const key  = await _deriveKey(password, salt);
        const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, _enc.encode(text));

        // Pack salt(16) + iv(12) + ciphertext into base64
        const packed = new Uint8Array(28 + cipherBuf.byteLength);
        packed.set(salt, 0); packed.set(iv, 16); packed.set(new Uint8Array(cipherBuf), 28);
        outputEl.textContent = btoa(String.fromCharCode(...packed));
        if (options.onLog) options.onLog('[ForbiddenArchive] Encrypted (AES-256-GCM, client-side).', '#10b981');

      } else {
        const raw = Uint8Array.from(atob(text), c => c.charCodeAt(0));
        if (raw.length < 29) throw new Error('Payload too short');
        const salt = raw.slice(0, 16), iv = raw.slice(16, 28), cipher = raw.slice(28);
        const key = await _deriveKey(password, salt);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        outputEl.textContent = _dec.decode(plain);
        if (options.onLog) options.onLog('[ForbiddenArchive] Decrypted successfully.', '#10b981');
      }
    } catch {
      outputEl.innerHTML = '<span style="color: #ef4444;">> FAILED: Wrong password or corrupted payload.</span>';
      if (options.onLog) options.onLog('[ForbiddenArchive] Crypto operation failed.', '#ef4444');
    }
  }

  btnEncrypt.addEventListener('click', () => processVault('encrypt'));
  btnDecrypt.addEventListener('click', () => processVault('decrypt'));

  btnCopy.addEventListener('click', () => {
    const outText = outputEl.textContent;
    if (outText && !outText.startsWith('>')) {
      navigator.clipboard.writeText(outText);
      btnCopy.textContent = 'COPIED!';
      setTimeout(() => btnCopy.textContent = 'COPY', 2000);
    }
  });

  activeInstance = {
    destroy: () => {
      container.innerHTML = '';
      activeInstance = null;
    }
  };

  return activeInstance;
}

export async function execute(params = {}) {
  return {
    success: false,
    output: `[${name}] Headless execution not supported. Manual password entry required for AES-256.`,
  };
}

export function destroy() {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
    activeInstance = null;
  }
}

export default { id, name, category, version, description, pythonSourcePath, render, execute, destroy };
