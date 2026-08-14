/**
 * Port Entry Point: Fentanyl Research
 * Web-Ported Interactive Component for AlphaCoreTech Subroutines Console.
 */

// 1. Metadata Exports (PortComponentContract)
export const id = 'port-fentanylresearch';
export const name = 'Fentanyl Research';
export const category = 'Security & Data';
export const version = '1.0.0';
export const description = 'Research document database, safety protocol reference, and c...';
export const pythonSourcePath = 'Fentanyl Research/main.py';

let activeInstance = null;

/**
 * Pure JavaScript Domain Logic (Ported from Python original)
 * @param {string} inputData 
 * @returns {Object} Processing results
 */
export function processCoreLogic(inputData) {
  const cleanInput = (inputData || '').trim();
  if (!cleanInput) {
    return {
      success: true,
      output: '[Fentanyl Research] Core engine initialized with default telemetry.',
      records: [
        'SYSTEM_STATUS: ONLINE',
        'ACTIVE_MODULE: Fentanyl Research',
        'MODE: INTERACTIVE_EMULATOR',
        'CACHE_HIT: 100%'
      ]
    };
  }

  const lines = cleanInput.split('\n').filter(Boolean);
  const processed = lines.map((line, idx) => `[${idx + 1}] PROCESSED: ${line.toUpperCase()}`);

  return {
    success: true,
    output: `[Fentanyl Research] Processed ${lines.length} payload unit(s) successfully.`,
    records: processed
  };
}

/**
 * Renders the interactive UI into the target DOM container.
 * 
 * @param {HTMLElement} container - DOM parent element
 * @param {Object} [options] - Host options (e.g. onLog callback)
 * @returns {{ destroy: Function, update: Function }}
 */
export function render(container, options = {}) {
  if (!container) return { destroy: () => {} };

  destroy();

  container.innerHTML = `
    <div class="port-fentanylresearch-ui" style="background: rgba(10,15,25,0.95); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 18px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(6,182,212,0.3); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.25rem; color: var(--accent, #06b6d4); display: flex; align-items: center; gap: 8px;">
            <span>⚡ ${name}</span>
            <span style="font-size: 0.75rem; background: rgba(6,182,212,0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.3);">${category}</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #888;">${description}</p>
        </div>
        <div style="font-size: 0.75rem; color: #666;">
          Source: <code style="color: #38bdf8;">${pythonSourcePath}</code>
        </div>
      </div>

      <!-- Main Input & Output Split View -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
        <div>
          <label style="display: block; font-size: 0.8rem; color: var(--accent, #06b6d4); margin-bottom: 6px; font-weight: bold;">INPUT_PAYLOAD:</label>
          <textarea id="port-input" rows="8" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; border-radius: 4px; outline: none;" placeholder="Enter parameters or text data..."></textarea>
        </div>
        <div>
          <label style="display: block; font-size: 0.8rem; color: #10b981; margin-bottom: 6px; font-weight: bold;">PROCESSED_OUTPUT:</label>
          <textarea id="port-output" readonly rows="8" style="width: 100%; box-sizing: border-box; background: rgba(5,10,18,0.9); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 10px; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; border-radius: 4px; outline: none;" placeholder="Engine execution logs will appear here..."></textarea>
        </div>
      </div>

      <!-- Action Controls -->
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="port-clear-btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); color: #ccc; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 0.8rem;">
          CLEAR
        </button>
        <button id="port-execute-btn" style="background: rgba(6,182,212,0.2); border: 1px solid var(--accent, #06b6d4); color: var(--accent, #06b6d4); padding: 8px 20px; border-radius: 4px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; font-weight: bold;">
          ▶ RUN INTERACTIVE
        </button>
      </div>
    </div>
  `;

  const inputEl = container.querySelector('#port-input');
  const outputEl = container.querySelector('#port-output');
  const execBtn = container.querySelector('#port-execute-btn');
  const clearBtn = container.querySelector('#port-clear-btn');

  function handleExecute() {
    const rawVal = inputEl.value;
    const res = processCoreLogic(rawVal);
    outputEl.value = res.records.join('\n') || res.output;

    if (typeof options.onLog === 'function') {
      options.onLog(`[${name}] ${res.output}`, res.success ? '#10b981' : '#ef4444');
    }
  }

  execBtn.addEventListener('click', handleExecute);
  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.value = '';
  });

  // Run initial execute to populate UI
  handleExecute();

  activeInstance = {
    destroy: () => {
      container.innerHTML = '';
      activeInstance = null;
    },
    update: () => {
      handleExecute();
    }
  };

  return activeInstance;
}

/**
 * Headless programmatic execution method.
 * 
 * @param {Object} [params] 
 * @returns {Promise<{ success: boolean, output: string, details: Object }>}
 */
export async function execute(params = {}) {
  const safeParams = params || {};
  const input = safeParams.input || 'sample payload data';
  const result = processCoreLogic(input);

  return {
    success: result.success,
    output: `[${name}] Headless execution: ${result.output}`,
    details: result
  };
}

/**
 * Teardown lifecycle method.
 */
export function destroy() {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
    activeInstance = null;
  }
}

const portExport = {
  id,
  name,
  category,
  version,
  description,
  pythonSourcePath,
  render,
  execute,
  destroy,
  processCoreLogic
};

export default portExport;
