# Web-Porting Framework & Component Pattern Analysis Report

**Target Repository**: `C:\Users\josh6\workspace\AlphaCoreTech`  
**Agent**: Explorer 3 (Framework & Component Explorer)  
**Date**: 2026-08-12  
**Status**: Comprehensive Read-Only Analysis Complete  

---

## 1. Executive Summary

The AlphaCoreTech website utilizes a lightweight, modular **Web-Porting Framework** located under `src/ports/`. This framework enables standalone Python tools and scripts from the user's workspace to be rendered, executed, and inspected as interactive web subroutines inside the AlphaCoreTech single-page application (SPA).

This report documents the architectural specifications, component contracts, cyberpunk styling standards, and standard design templates established by the proof-of-concept phase (`AlphaInventory` and `AlphaRequirements`). It also details the registration and routing strategy required to scale the `subroutines` page directory from 2 proof-of-concept ports to 50+ bulk-ported Python projects while maintaining 100% build compatibility with Vite and Netlify.

---

## 2. Investigation of Proof-of-Concept Ported Components

An inspection of `src/ports/` reveals a highly structured, decoupled directory layout:

```
src/ports/
├── index.js                     # Central Web Porting Registry & Validator
├── port-contract.js             # Contract specification & validation rules
├── ports-registry.test.js       # Vitest verification suite for registry lookup
├── alphainventory/              # Hardware GPIO Visualizer & Conflict Engine (Proof of Concept 1)
│   ├── index.js                 # Contract wrapper & entry export
│   ├── inventory-core.js        # Pure JS domain logic (RPi 40-pin header map & conflict engine)
│   ├── inventory-ui.js          # Interactive DOM UI, 2x20 header grid, modal, inspector, localStorage
│   └── inventory.test.js        # Unit test suite for inventory core & contract
└── alpharequirements/           # Python requirements.txt Parser & Deduplicator (Proof of Concept 2)
    ├── index.js                 # Contract wrapper & entry export
    ├── requirements-core.js     # Pure JS requirements parser, spec normalizer & modernization scanner
    ├── requirements-ui.js       # Dual-pane raw/deduped text UI, metric cards, export handlers
    └── requirements.test.js     # Unit test suite for requirements scanner & contract
```

### Key Architectural Lessons from Existing Ports:
1. **Separation of Concerns**: Core domain logic (e.g. `inventory-core.js`, `requirements-core.js`) is completely isolated from DOM presentation (`inventory-ui.js`, `requirements-ui.js`). This allows `execute()` to run headless scans in automated tests or batch console modes without touching the DOM.
2. **Strict Contract Enforcement**: `port-contract.js` validates that every port exports mandatory metadata strings and lifecycle functions. Any component that fails contract validation is logged to console and filtered out during registry initialization.
3. **Reactivity & State Persistence**: Components maintain internal state synchronized with `localStorage` (e.g., `alphainventory_state`) to survive page reloads and tab navigation.
4. **Clean Mounting & Unmounting**: Ports return an object with a `destroy()` method from `render()`. When switching workspace tabs on the Subroutines page, `subroutines.js` calls `destroy()` to clear event listeners, reset timers, and prevent memory leaks.

---

## 3. Component Interface Contract Specification (`PortComponentContract`)

Every web-ported component—whether fully interactive or a UI placeholder—MUST conform strictly to the `PortComponentContract` interface defined in `src/ports/port-contract.js`.

### 3.1 Contract Definition (`JSDoc / Type Signature`)

```javascript
/**
 * @typedef {Object} PortComponentContract
 * @property {string} id - Unique port identifier (e.g., 'port-alphainventory', 'port-myproject')
 * @property {string} name - Human readable port name (e.g., 'AlphaInventory', 'MyProject')
 * @property {string} category - Category string (e.g., 'Hardware', 'Utilities', 'AI/ML', 'Security', 'Data', 'Perf')
 * @property {string} version - Semver string (e.g., '1.0.0')
 * @property {string} description - Concise summary of project functionality
 * @property {string} pythonSourcePath - Relative path to original Python source code (e.g., 'MyProject/main.py')
 * @property {Function} render - (container: HTMLElement, options?: Object) => { destroy: Function, update?: Function }
 * @property {Function} execute - (params?: Object) => Promise<{ success: boolean, output: string, details?: Object }>
 * @property {Function} destroy - () => void
 */
```

### 3.2 Required Metadata Properties (`REQUIRED_STRING_PROPERTIES`)

| Property Name | Type | Validation Rule | Example |
|---|---|---|---|
| `id` | `string` | Non-empty string starting with `port-` | `'port-alphainventory'` |
| `name` | `string` | Non-empty string | `'AlphaInventory'` |
| `category` | `string` | Non-empty string (e.g., Hardware, Utilities, AI/ML, Security, Data, Perf, Neural, Crypto) | `'Hardware'` |
| `version` | `string` | Non-empty semver string | `'1.0.0'` |
| `description` | `string` | Non-empty string summary | `'Raspberry Pi GPIO Pinout Inspector & Hardware Conflict Engine'` |
| `pythonSourcePath` | `string` | Relative path to original source directory/file | `'AlphaInventory/main.py'` |

### 3.3 Required Method Properties (`REQUIRED_METHOD_PROPERTIES`)

#### 1. `render(container, options)`
- **Parameters**:
  - `container`: Target `HTMLElement` into which the port's DOM structure will be mounted.
  - `options` *(optional)*: Configuration object provided by host context. Supports:
    - `options.onLog`: Callback function `(message: string, color?: string) => void` to stream logs directly to the subroutines console.
    - `options.initialText` / `options.initialState`: Override default input values.
- **Return Value**: An object containing at minimum `{ destroy: Function }` (and optionally `{ update: Function, scan: Function }`).
- **Behavior**: Must clear or initialize the container inner HTML, bind event listeners, render UI widgets, and return the instance lifecycle handles.

#### 2. `execute(params)`
- **Parameters**:
  - `params` *(optional)*: Object containing input parameters or data.
- **Return Value**: `Promise<{ success: boolean, output: string, details?: Object }>`
- **Behavior**: Headless, asynchronous execution method. Performs pure data processing, headless calculations, or simulated API calls without requiring a visible DOM container.

#### 3. `destroy()`
- **Parameters**: None.
- **Return Value**: `void`
- **Behavior**: Idempotent teardown method. Dismounts active UI, cancels active timeouts/intervals, detaches event listeners, and sets active instance references to `null`.

### 3.4 Contract Validation Engine

`src/ports/port-contract.js` exports `validatePortContract(portObj)`:

```javascript
import { validatePortContract } from './port-contract.js';

const result = validatePortContract(candidatePort);
// result => { valid: true|false, errors: string[] }
```

The validation suite checks:
1. `portObj` is a non-null object.
2. All properties in `REQUIRED_STRING_PROPERTIES` are present, typeof `'string'`, and non-whitespace.
3. All methods in `REQUIRED_METHOD_PROPERTIES` are present and typeof `'function'`.

---

## 4. Header, Return Button, State & Cyberpunk Styling Standards

To ensure cohesive UI integration across the Subroutines page and workspace takeover, all ported components MUST follow standard styling guidelines.

### 4.1 Return Button & Workspace Header Integration Pattern
When a project is launched inside the Subroutines page interactive workspace container (`#workspace-panel` in `src/pages/subroutines.js`), the top workspace panel header displays:
- Title: `// WORKSPACE: <NAME>`
- Badge: `<CATEGORY> | v<VERSION> | <PYTHON_SOURCE_PATH>`
- Close/Return Button: `✕ CLOSE WORKSPACE` (styled in neon red: `background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid #ef4444`).

#### Return Action Protocol:
Clicking `✕ CLOSE WORKSPACE` invokes `cleanupActivePort()`, which:
1. Triggers `activePortInstance.destroy()`.
2. Clears `#workspace-container` inner HTML.
3. Hides `#workspace-panel` (`display: none`).
4. Logs workspace closure to execution log.

Every component UI must also incorporate an internal top title bar with an icon, component badge, and optional component-level reset or return action button.

### 4.2 Cyberpunk Theme & Palette Guidelines

Components mounted within AlphaCoreTech must seamlessly integrate with the site's dark CRT cyberpunk design language defined in `src/style.css`.

| Design Token | CSS Variable / Value | Usage |
|---|---|---|
| **Background Dark Base** | `#030305` / `rgba(10,15,25,0.95)` | Main card, panel, and modal containers |
| **Panel Surface** | `rgba(4,6,12,0.92)` / `#0a0f19` | Inner input fields, code boxes, list items |
| **Primary Cyan Accent** | `var(--accent, #06b6d4)` / `#00b8ff` | Primary headers, borders, key action buttons, search bars |
| **Success Emerald Accent** | `#10b981` / `#38a169` | Active project indicators, success alerts, test verify buttons |
| **Warning Amber Accent** | `#dd6b20` / `#f59e0b` | Modernization warnings, legacy flags, backend placeholder notices |
| **Danger Red Accent** | `#ef4444` / `#e53e3e` | Delete buttons, close handles, conflict alerts |
| **Typography - HUD** | `'Orbitron', sans-serif` | Page section titles, modal headers, major badges |
| **Typography - Mono** | `'Share Tech Mono', monospace` | Code input, console lines, metrics, source paths, buttons |

#### Essential CSS Styling Snippet for Components:
```html
<div class="cyber-card" style="background: rgba(10,15,25,0.95); border: 1px solid rgba(6,182,212,0.3); border-radius: 4px; padding: 16px; font-family: 'Share Tech Mono', monospace;">
  <div style="font-family: 'Orbitron', sans-serif; color: var(--accent, #06b6d4); font-weight: bold;">
    // COMPONENT_HEADER
  </div>
</div>
```

---

## 5. Standard Component Design Templates

Below are the official standard templates for generating both **Active Interactive** components and **Cyberpunk UI Placeholder** components.

### 5.1 Pattern A: Active Interactive Web-Ported Component Template

Use this pattern when Python business logic can be completely executed in client-side JavaScript (e.g., algorithms, string formatting, calculators, data structure tools, visualizers).

For simpler projects, a single `index.js` file contains the complete port. For larger projects, use the 3-file structure (`index.js`, `<name>-core.js`, `<name>-ui.js`).

#### Complete Single-File Active Component Template (`src/ports/<projectname>/index.js`):

```javascript
/**
 * Port Entry Point: <ProjectName>
 * Web-Ported Interactive Component for AlphaCoreTech Subroutines Console.
 */

// 1. Metadata Exports (PortComponentContract)
export const id = 'port-<projectname>';
export const name = '<ProjectName>';
export const category = '<Category>'; // e.g. 'Utilities', 'Hardware', 'AI/ML', 'Security', 'Data'
export const version = '1.0.0';
export const description = '<Project Description>';
export const pythonSourcePath = '<ProjectName>/main.py';

// Active Instance Tracking
let activeInstance = null;

/**
 * Pure JavaScript Domain Logic (Ported from Python original)
 * @param {string} inputData 
 * @returns {Object} Processing results
 */
export function processCoreLogic(inputData) {
  const cleanInput = (inputData || '').trim();
  if (!cleanInput) {
    return { success: false, output: 'No input data provided.', records: [] };
  }

  // Simulated processing logic
  const lines = cleanInput.split('\n').filter(Boolean);
  const processed = lines.map((line, idx) => `[${idx + 1}] PROCESSED: ${line.toUpperCase()}`);

  return {
    success: true,
    output: `Processed ${lines.length} line(s) successfully.`,
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

  // Teardown any existing active instance
  destroy();

  // Inject Cyberpunk UI Markup
  container.innerHTML = `
    <div class="port-<projectname>-ui" style="background: rgba(10,15,25,0.95); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 18px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace;">
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
          <label style="display: block; font-size: 0.8rem; color: var(--accent, #06b6d4); margin-bottom: 6px; font-weight: bold;">INPUT_DATA:</label>
          <textarea id="port-input" rows="8" style="width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); color: #fff; padding: 10px; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; border-radius: 4px; outline: none;" placeholder="Enter input data here..."></textarea>
        </div>
        <div>
          <label style="display: block; font-size: 0.8rem; color: #10b981; margin-bottom: 6px; font-weight: bold;">PROCESSED_OUTPUT:</label>
          <textarea id="port-output" readonly rows="8" style="width: 100%; box-sizing: border-box; background: rgba(5,10,18,0.9); border: 1px solid rgba(16,185,129,0.3); color: #10b981; padding: 10px; font-family: 'Share Tech Mono', monospace; font-size: 0.85rem; border-radius: 4px; outline: none;" placeholder="Results will appear here..."></textarea>
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
    output: `[${name}] Headless execution: ${result.output}`,
    details: result
  };
}

/**
 * Destroys active instance.
 */
export function destroy() {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
    activeInstance = null;
  }
}

// Default Export Object conforming to PortComponentContract
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
```

---

### 5.2 Pattern B: Styled Cyberpunk "Coming Soon" / "Requires Backend" UI Placeholder Component Template

Use this pattern when a project cannot be fully ported to pure client-side JS during bulk ingestion (e.g., requires native C extensions, raw TCP sockets, heavy PyTorch/TensorFlow models, or server-side file system access).

**Key Requirement**: Placeholder ports MUST STILL fully pass `validatePortContract(portObj)`.

#### Complete Placeholder Component Template (`src/ports/<projectname>/index.js`):

```javascript
/**
 * Port Entry Point: <ProjectName> (Placeholder / Requires Backend)
 * Web-Ported Cyberpunk Placeholder Component for AlphaCoreTech Subroutines Console.
 */

// 1. Metadata Exports (PortComponentContract)
export const id = 'port-<projectname>';
export const name = '<ProjectName>';
export const category = '<Category>'; // e.g. 'Security', 'AI/ML', 'Hardware', 'Data'
export const version = '1.0.0-stub';
export const description = '<Project Description> [Requires Serverless Backend / Native Runtime]';
export const pythonSourcePath = '<ProjectName>/main.py';

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

  container.innerHTML = `
    <div class="port-<projectname>-placeholder" style="background: rgba(10,15,25,0.95); border: 1px dashed rgba(245,158,11,0.5); border-radius: 6px; padding: 20px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; box-shadow: 0 0 15px rgba(245,158,11,0.1);">
      <!-- Header Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(245,158,11,0.3); padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.2rem; color: #f59e0b; display: flex; align-items: center; gap: 8px;">
            <span>⚠️ ${name}</span>
            <span style="font-size: 0.75rem; background: rgba(245,158,11,0.15); color: #fbbf24; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4);">REQUIRES BACKEND</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: #aaa;">${description}</p>
        </div>
        <div style="font-size: 0.75rem; color: #888;">
          Source: <code style="color: #fbbf24;">${pythonSourcePath}</code>
        </div>
      </div>

      <!-- Diagnostic Status Box -->
      <div style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 4px; margin-bottom: 16px; font-size: 0.85rem; line-height: 1.6;">
        <div style="color: #fbbf24; font-weight: bold; margin-bottom: 6px; font-family: 'Orbitron', sans-serif;">// SYSTEM_DIAGNOSTIC_NOTICE</div>
        <div style="color: #ccc;">
          This subroutine contains native Python dependencies (e.g. sockets, binary C extensions, or server filesystem access) requiring a dedicated Netlify Serverless Edge Function or containerized backend runtime.
        </div>
        <div style="margin-top: 8px; font-size: 0.78rem; color: #888;">
          • Target API Endpoint: <code style="color: #38bdf8;">/api/subroutines/${id}</code><br/>
          • Local Python Source: <code style="color: #38bdf8;">C:\\Users\\josh6\\workspace\\${pythonSourcePath}</code>
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
  `;

  const consoleEl = container.querySelector('#placeholder-console');
  const simBtn = container.querySelector('#btn-simulate-api');

  simBtn.addEventListener('click', async () => {
    consoleEl.innerHTML = `<div style="color: #38bdf8;">> [SIMULATION] Dispatching payload to Netlify serverless endpoint...</div>`;
    await new Promise(r => setTimeout(r, 400));
    consoleEl.innerHTML += `<div style="color: #fbbf24;">> [STUB] 501 Not Implemented: Backend endpoint '/api/subroutines/${id}' pending server deployment.</div>`;
    consoleEl.innerHTML += `<div style="color: #10b981;">> [STUB] Graceful fallback active. UI state verified.</div>`;

    if (typeof options.onLog === 'function') {
      options.onLog(`[${name}] Simulated backend ping returned 501 Stub OK.`, '#fbbf24');
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
    output: `[${name}] Placeholder execution: Requires backend service at /api/subroutines/${id}.`,
    details: {
      status: 'REQUIRES_BACKEND',
      pythonSourcePath,
      params
    }
  };
}

/**
 * Destroys active instance.
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
```

---

## 6. Subroutines Directory & Dynamic/Static Registration Architecture

During the proof-of-concept phase, `src/ports/index.js` statically imports every port:

```javascript
import alphaInventoryPort from './alphainventory/index.js';
import alphaRequirementsPort from './alpharequirements/index.js';
```

When scaling to **50+ bulk-ported projects**, we must evaluate registration strategies to avoid excessive initial bundle sizes, slow page loads, or module resolution errors on Netlify/Vite.

### 6.1 Evaluation of Registration Strategies

| Strategy | Implementation Details | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **Strategy A: Pure Static Import Index** | Import all 50+ ports statically in `src/ports/index.js` | • Simple<br/>• Instant search & categorization<br/>• Zero async load latency | • Larger bundle size (~1.5MB - 3MB)<br/>• All ports parsed at app startup | **Recommended Primary Approach** for local Vite build given lightweight vanilla JS components |
| **Strategy B: Pure Dynamic Import (`import()`)** | Use `import.meta.glob('./*/index.js')` or async getters | • Code splitting<br/>• Smaller initial bundle | • Search/filter requires fetching metadata async or loading all modules on page init anyway | Secondary fallback if bundle size exceeds threshold |
| **Strategy C: Hybrid Manifest Index** | Static metadata manifest array + dynamic `import()` for `render()` | • Best of both worlds: Instant directory rendering + lazy UI code load | • Slightly more complex registry wrapper | Ideal for long-term scalability |

### 6.2 Recommended Scalable Registry Architecture (`src/ports/index.js`)

Using Vite's native `import.meta.glob`, `src/ports/index.js` can automatically discover, import, and validate all ports in `src/ports/*/index.js` automatically without requiring manual edit of `index.js` for every new port!

#### Recommended `src/ports/index.js` Implementation:

```javascript
/**
 * Central Web Porting Framework Registry.
 * Automatically discovers, validates, and registers all ported modules.
 */

import { validatePortContract } from './port-contract.js';

// Option A: Vite Eager Glob Import (discovers all src/ports/*/index.js automatically)
const portModules = import.meta.glob('./*/index.js', { eager: true });

const candidatePorts = Object.values(portModules).map(mod => mod.default || mod);

const validPorts = [];

for (const port of candidatePorts) {
  const result = validatePortContract(port);
  if (result.valid) {
    validPorts.push(port);
  } else {
    console.error(`[Port Registry] Port '${port?.id || 'unknown'}' failed contract validation:`, result.errors);
  }
}

/**
 * Array of all validated, registered port components.
 */
export const REGISTERED_PORTS = validPorts;

/**
 * Retrieves all registered port components.
 * @returns {Array<Object>}
 */
export function getAllPorts() {
  return REGISTERED_PORTS;
}

/**
 * Finds a registered port component by its unique ID or short name.
 * @param {string} id - Port identifier or short name
 * @returns {Object|null}
 */
export function getPortById(id) {
  if (!id || typeof id !== 'string') return null;
  const cleanId = id.trim().toLowerCase();
  const shortId = cleanId.replace(/^port-/, '');

  return REGISTERED_PORTS.find(port => {
    const portId = (port.id || '').toLowerCase();
    const portShortId = portId.replace(/^port-/, '');
    const portName = (port.name || '').toLowerCase();

    return (
      portId === cleanId ||
      portShortId === shortId ||
      portName === cleanId ||
      portName === shortId
    );
  }) || null;
}
```

#### Why `import.meta.glob('./*/index.js', { eager: true })` is Superior:
1. **Zero Manual Registry Edits**: As bulk porting agents add subdirectories to `src/ports/<projectname>/index.js`, Vite automatically includes them in `REGISTERED_PORTS`.
2. **Instant Directory Search**: `getAllPorts()` immediately returns all 50+ ports for searching, filtering, and counting on `SubroutinesPage`.
3. **Build Compatibility**: Fully compatible with Vite dev server, Vite production bundle, Vitest test suites, and Netlify static hosting (`public/_redirects` SPA rewrite `/* /index.html 200`).

---

## 7. Verification & Audit Protocol

To verify that the framework and bulk ports are valid without consuming API quota or causing build failures:

### 7.1 Programmatic Unit Verification (`Vitest`)
Run local unit test commands:
```bash
npm run test
```
The test suite validates:
- `ports-registry.test.js`: Checks `REGISTERED_PORTS` array, `getAllPorts()`, and `getPortById()`.
- `subroutines_m2_verification.test.js`: Validates search filtering, category filtering, workspace mounting, `destroy()` lifecycle on switch, quick execution console output, and Netlify SPA `_redirects` file existence.

### 7.2 Directory Audit Script Standard
An automated Node audit script can cross-reference the directory names in `C:\Users\josh6\workspace` against `REGISTERED_PORTS`:
1. Traverse `C:\Users\josh6\workspace` for Python projects.
2. Verify that every project has a corresponding `src/ports/<projectname>/index.js` file.
3. Validate that `validatePortContract` returns `valid: true` for 100% of generated ports.
4. Execute `npm run build` to confirm zero Vite compilation errors.

---

## 8. Summary Matrix of Requirements & Design Specs

| Requirement | Implementation Mechanism | Location |
|---|---|---|
| **Contract Verification** | `validatePortContract(portObj)` | `src/ports/port-contract.js` |
| **Central Registry** | Eager Glob Auto-Discovery & Lookup | `src/ports/index.js` |
| **Active Port Pattern** | 3-File / Single-File Modular Port | `src/ports/<name>/index.js` |
| **Placeholder Pattern** | Cyberpunk 501 Stub UI Component | `src/ports/<name>/index.js` |
| **Workspace Mount & Teardown** | `render()` & `destroy()` handles | `src/pages/subroutines.js` |
| **Return Button Pattern** | `✕ CLOSE WORKSPACE` + `cleanupActivePort()` | `src/pages/subroutines.js` top bar |
| **Cyberpunk Aesthetics** | CRT scanlines, Orbitron HUD, Share Tech Mono, Cyan/Emerald palette | `src/style.css` & component styling |
| **Netlify Compatibility** | SPA rewrite rule (`/* /index.html 200`) | `public/_redirects` |
