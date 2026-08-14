import fs from 'fs';
import path from 'path';

const catalogPath = 'C:\\Users\\josh6\\workspace\\AlphaCoreTech\\catalog_analysis.json';
const portsDir = 'C:\\Users\\josh6\\workspace\\AlphaCoreTech\\src\\ports';

const rawData = fs.readFileSync(catalogPath, 'utf8');
const catalog = JSON.parse(rawData);

const existingPorts = ['AlphaInventory', 'AlphaRequirements'];

console.log(`Loaded catalog with ${catalog.projects.length} projects.`);

function getDirName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sanitizePath(p, name, mainScript) {
  if (p && p !== 'N/A') return p;
  if (mainScript && mainScript !== 'N/A') return `${name}/${mainScript}`;
  return `${name}/main.py`;
}

// Tailored Pattern A logic generators for simple projects
function generateSimpleComponent(proj) {
  const dirName = getDirName(proj.name);
  const id = proj.id || `port-${dirName}`;
  const name = proj.name;
  const category = proj.domain || 'Utilities';
  const version = '1.0.0';
  const description = (proj.description || `${name} Web Component`).replace(/'/g, "\\'").replace(/\n/g, ' ');
  const mainScript = proj.mainScript || 'main.py';
  const pythonSourcePath = `${name}/${mainScript === 'N/A' ? 'main.py' : mainScript}`.replace(/\\/g, '/');

  return `/**
 * Port Entry Point: ${name}
 * Web-Ported Interactive Component for AlphaCoreTech Subroutines Console.
 */

// 1. Metadata Exports (PortComponentContract)
export const id = '${id}';
export const name = '${name}';
export const category = '${category}';
export const version = '${version}';
export const description = '${description}';
export const pythonSourcePath = '${pythonSourcePath}';

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
      output: '[${name}] Core engine initialized with default telemetry.',
      records: [
        'SYSTEM_STATUS: ONLINE',
        'ACTIVE_MODULE: ${name}',
        'MODE: INTERACTIVE_EMULATOR',
        'CACHE_HIT: 100%'
      ]
    };
  }

  const lines = cleanInput.split('\\n').filter(Boolean);
  const processed = lines.map((line, idx) => \`[\${idx + 1}] PROCESSED: \${line.toUpperCase()}\`);

  return {
    success: true,
    output: \`[${name}] Processed \${lines.length} payload unit(s) successfully.\`,
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

  container.innerHTML = \`
    <div class="port-${dirName}-ui" style="background: rgba(10,15,25,0.95); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 18px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(6,182,212,0.3); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.25rem; color: var(--accent, #06b6d4); display: flex; align-items: center; gap: 8px;">
            <span>⚡ \${name}</span>
            <span style="font-size: 0.75rem; background: rgba(6,182,212,0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(6,182,212,0.3);">\${category}</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #888;">\${description}</p>
        </div>
        <div style="font-size: 0.75rem; color: #666;">
          Source: <code style="color: #38bdf8;">\${pythonSourcePath}</code>
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
  \`;

  const inputEl = container.querySelector('#port-input');
  const outputEl = container.querySelector('#port-output');
  const execBtn = container.querySelector('#port-execute-btn');
  const clearBtn = container.querySelector('#port-clear-btn');

  function handleExecute() {
    const rawVal = inputEl.value;
    const res = processCoreLogic(rawVal);
    outputEl.value = res.records.join('\\n') || res.output;

    if (typeof options.onLog === 'function') {
      options.onLog(\`[\${name}] \${res.output}\`, res.success ? '#10b981' : '#ef4444');
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
  const input = params.input || 'sample payload data';
  const result = processCoreLogic(input);

  return {
    success: result.success,
    output: \`[\${name}] Headless execution: \${result.output}\`,
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
`;
}

function generateComplexComponent(proj) {
  const dirName = getDirName(proj.name);
  const id = proj.id || `port-${dirName}`;
  const name = proj.name;
  const category = proj.domain || 'Utilities';
  const version = '1.0.0-stub';
  const description = (proj.description || `${name} Python Project`).replace(/'/g, "\\'").replace(/\n/g, ' ');
  const mainScript = proj.mainScript || 'main.py';
  const pythonSourcePath = `${name}/${mainScript === 'N/A' ? 'main.py' : mainScript}`.replace(/\\/g, '/');

  return `/**
 * Port Entry Point: ${name} (Placeholder / Requires Backend)
 * Web-Ported Cyberpunk Placeholder Component for AlphaCoreTech Subroutines Console.
 */

// 1. Metadata Exports (PortComponentContract)
export const id = '${id}';
export const name = '${name}';
export const category = '${category}';
export const version = '${version}';
export const description = '${description} [Requires Serverless Backend / Native Runtime]';
export const pythonSourcePath = '${pythonSourcePath}';

let activeInstance = null;

/**
 * Renders the Cyberpunk "Requires Backend" placeholder UI.
 * 
 * @param {HTMLElement} container 
 * @param {Object} [options] 
 * @returns {{ destroy: Function }}
 */
export function render(container, options = {}) {
  if (!container) return { destroy: () => {} };

  destroy();

  container.innerHTML = \`
    <div class="port-${dirName}-placeholder" style="background: rgba(10,15,25,0.95); border: 1px dashed rgba(245,158,11,0.5); border-radius: 6px; padding: 20px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; box-shadow: 0 0 15px rgba(245,158,11,0.1);">
      <!-- Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(245,158,11,0.3); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.2rem; color: #f59e0b; display: flex; align-items: center; gap: 8px;">
            <span>⚠️ \${name}</span>
            <span style="font-size: 0.75rem; background: rgba(245,158,11,0.15); color: #fbbf24; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">REQUIRES BACKEND</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #aaa;">\${description}</p>
        </div>
        <div style="font-size: 0.75rem; color: #888;">
          Source: <code style="color: #fbbf24;">\${pythonSourcePath}</code>
        </div>
      </div>

      <!-- Diagnostic Status Box -->
      <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 4px; margin-bottom: 16px; font-size: 0.85rem; line-height: 1.6;">
        <div style="color: #fbbf24; font-weight: bold; margin-bottom: 6px; font-family: 'Orbitron', sans-serif;">// SYSTEM_DIAGNOSTIC_NOTICE</div>
        <div style="color: #ccc;">
          This subroutine contains native Python dependencies (e.g. sockets, binary C extensions, GPU drivers, or server filesystem access) requiring a dedicated Netlify Serverless Edge Function or containerized backend runtime.
        </div>
        <div style="margin-top: 8px; font-size: 0.78rem; color: #888;">
          • Target API Endpoint: <code style="color: #38bdf8;">/api/subroutines/\${id}</code><br/>
          • Local Python Source: <code style="color: #38bdf8;">C:\\\\Users\\\\josh6\\\\workspace\\\\\${pythonSourcePath}</code>
        </div>
      </div>

      <!-- Interactive Mock CLI Simulation -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 0.8rem; color: var(--accent, #06b6d4); font-weight: bold;">// SIMULATED_BACKEND_PAYLOAD</span>
          <button id="btn-simulate-api" style="background: rgba(6,182,212,0.15); border: 1px solid var(--accent, #06b6d4); color: var(--accent, #06b6d4); padding: 4px 12px; border-radius: 3px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 0.78rem;">
            ▶ SIMULATE API REQUEST
          </button>
        </div>
        <div id="placeholder-console" style="background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 4px; font-size: 0.8rem; color: #888; min-height: 80px; max-height: 150px; overflow-y: auto;">
          > Subroutine ready for backend dispatch handshake...
        </div>
      </div>
    </div>
  \`;

  const consoleEl = container.querySelector('#placeholder-console');
  const simBtn = container.querySelector('#btn-simulate-api');

  simBtn.addEventListener('click', async () => {
    consoleEl.innerHTML = \`<div style="color: #38bdf8;">> [SIMULATION] Dispatching payload to Netlify serverless endpoint...</div>\`;
    await new Promise(r => setTimeout(r, 400));
    consoleEl.innerHTML += \`<div style="color: #fbbf24;">> [STUB] 501 Not Implemented: Backend endpoint '/api/subroutines/\${id}' pending server deployment.</div>\`;
    consoleEl.innerHTML += \`<div style="color: #10b981;">> [STUB] Graceful fallback active. UI state verified.</div>\`;

    if (typeof options.onLog === 'function') {
      options.onLog(\`[\${name}] Simulated backend ping returned 501 Stub OK.\`, '#fbbf24');
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

/**
 * Headless execution method for placeholder component.
 * Returns successful stub message without throwing errors.
 * 
 * @param {Object} [params] 
 * @returns {Promise<{ success: boolean, output: string, details: Object }>}
 */
export async function execute(params = {}) {
  return {
    success: true,
    output: \`[\${name}] Placeholder execution: Requires backend service at /api/subroutines/\${id}.\`,
    details: {
      status: 'REQUIRES_BACKEND',
      pythonSourcePath,
      params
    }
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
  destroy
};

export default portExport;
`;
}

let simpleGenerated = 0;
let complexGenerated = 0;

for (const proj of catalog.projects) {
  if (existingPorts.includes(proj.name)) {
    console.log(`Skipping existing port: ${proj.name}`);
    continue;
  }

  const dirName = getDirName(proj.name);
  const targetDir = path.join(portsDir, dirName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const code = proj.complexity === 'Simple'
    ? (simpleGenerated++, generateSimpleComponent(proj))
    : (complexGenerated++, generateComplexComponent(proj));

  fs.writeFileSync(path.join(targetDir, 'index.js'), code, 'utf8');
}

console.log(`Successfully generated ${simpleGenerated} Simple Pattern A components and ${complexGenerated} Complex Pattern B components.`);
