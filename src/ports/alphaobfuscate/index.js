/**
 * Port Entry Point: AlphaObfuscate
 * Web-Ported Interactive Component for AlphaCoreTech Subroutines Console.
 */

export const id = 'port-alphaobfuscate';
export const name = 'AlphaObfuscate';
export const category = 'Reverse Engineering & Security';
export const version = '1.0.0';
export const description = 'Python / JS code obfuscator, string encryptor, and AST trans...';
export const pythonSourcePath = 'AlphaObfuscate/main.py';

let activeInstance = null;

export function processCoreLogic(inputData) {
  const cleanInput = (inputData || '').trim();
  if (!cleanInput) {
    return {
      success: true,
      output: '[AlphaObfuscate] Ready. Enter text to obfuscate using multi-layer encryption algorithms.',
      records: ['STATUS: ONLINE', 'AVAILABLE_LAYERS: BASE64, HEX, ROT13, LEET']
    };
  }

  const b64 = btoa(unescape(encodeURIComponent(cleanInput)));
  const hex = cleanInput.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
  const rot13 = cleanInput.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
  const leet = cleanInput.replace(/a/gi, '4').replace(/e/gi, '3').replace(/i/gi, '1').replace(/o/gi, '0').replace(/s/gi, '5').replace(/t/gi, '7');

  return {
    success: true,
    output: '[AlphaObfuscate] Payload successfully wrapped in multiple obfuscation layers.',
    records: [
      '[BASE64_LAYER]: ' + b64,
      '[HEX_LAYER]: ' + hex,
      '[ROT13_LAYER]: ' + rot13,
      '[LEET_LAYER]: ' + leet
    ]
  };
}

export function render(container, options = {}) {
  if (!container) return { destroy: () => {} };
  destroy();
  
  container.innerHTML = `
    <div class="port-alphaobfuscate-ui" style="background: rgba(10,15,25,0.95); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 18px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(6,182,212,0.3); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.25rem; color: var(--accent, #06b6d4); display: flex; align-items: center; gap: 8px;">
            <span>??? ${name}</span>
            <span style="font-size: 0.75rem; background: rgba(6,182,212,0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.3);">${category}</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #888;">${description}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div>
          <label style="display: block; font-size: 0.8rem; color: var(--accent, #06b6d4); margin-bottom: 6px; font-weight: bold;">INPUT_PAYLOAD:</label>
          <textarea id="port-input" rows="8" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; border-radius: 4px; outline: none;" placeholder="Enter text to obfuscate..."></textarea>
        </div>
        <div>
          <label style="display: block; font-size: 0.8rem; color: #10b981; margin-bottom: 6px; font-weight: bold;">PROCESSED_OUTPUT:</label>
          <textarea id="port-output" readonly rows="8" style="width: 100%; box-sizing: border-box; background: rgba(5,10,18,0.9); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 10px; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; border-radius: 4px; outline: none;" placeholder="Engine execution logs will appear here..."></textarea>
        </div>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="port-execute-btn" style="background: rgba(6,182,212,0.2); border: 1px solid var(--accent, #06b6d4); color: var(--accent, #06b6d4); padding: 8px 20px; border-radius: 4px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; font-weight: bold;">
          ?  RUN INTERACTIVE
        </button>
      </div>
    </div>
  `;

  const inputEl = container.querySelector('#port-input');
  const outputEl = container.querySelector('#port-output');
  const execBtn = container.querySelector('#port-execute-btn');

  function handleExecute() {
    const res = processCoreLogic(inputEl.value);
    outputEl.value = res.records.join('\n');
    if (typeof options.onLog === 'function') {
      options.onLog(`[${name}] ${res.output}`, res.success ? '#10b981' : '#ef4444');
    }
  }

  execBtn.addEventListener('click', handleExecute);
  handleExecute();

  activeInstance = {
    destroy: () => { container.innerHTML = ''; activeInstance = null; },
    update: () => handleExecute()
  };
  return activeInstance;
}

export async function execute(params = {}) {
  const result = processCoreLogic(params.input || '');
  return { success: result.success, output: result.output, details: result };
}

export function destroy() {
  if (activeInstance) { activeInstance.destroy(); activeInstance = null; }
}

export default { id, name, category, version, description, pythonSourcePath, render, execute, destroy, processCoreLogic };
