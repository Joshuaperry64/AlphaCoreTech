# ARCHITECTURE EXPLORATION & DESIGN HANDOFF REPORT

**Agent**: `teamwork_preview_explorer_survey_architecture_1`  
**Date**: 2026-08-10  
**Working Directory**: `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_architecture_1`  
**Target Repository**: `C:\Users\josh6\Workspace\AlphaCoreTech`  

---

## 1. Observation

### System & Repository Layout
1. **Frontend Architecture**: AlphaCoreTech is a Vite 6.0 + ES Modules single-page web application (`package.json`, `vite.config.js`). It utilizes vanilla DOM construction via a `createElement` utility (`src/components/utils.js`).
2. **Subroutines Page**:
   - `subroutines.html`: Legacy standalone preview page with matrix rain background and visual artifact synthesis UI.
   - `src/pages/subroutines.js`: The active SPA page mounted by `src/main.js:49` under route `#/subroutines`.
   - Existing `subroutines.js` (lines 9-18) hardcodes an array `SUBROUTINES` containing 8 synthetic kernel routines (`SYNAPSE_PRUNING_V4`, `QUANTUM_ENTANGLEMENT_SYNC`, `HEURISTIC_OVERDRIVE`, etc.) with batch controls and an execution log.
3. **Routing Mechanism**: `src/router.js` & `src/main.js:37-56` manage hash-based route changes (`window.location.hash`). Navigation to `#/subroutines` dynamically instantiates and mounts `SubroutinesPage()`.
4. **Testing Infrastructure**: `vitest` and `jsdom` are installed as devDependencies (`package.json:14-17`), with `vitest.config.js` configured for `jsdom` environment.
5. **Source Python Projects (`C:\Users\josh6\workspace`)**:
   - `alphalimiter` (`C:\Users\josh6\workspace\alphalimiter`): Python rate limiter & network management tool (`app.py`, `network_manager.py`). Ideal candidate for Port 1 (interactive Token Bucket & Sliding Window API Rate Limiter).
   - `AlphaObfuscate` (`C:\Users\josh6\workspace\AlphaObfuscate`): Code and string obfuscation tool (`Obfuscator.html`, Python utilities). Ideal candidate for Port 2 (interactive multi-mode string/code obfuscator & encoder).

---

## 2. Logic Chain

### Requirements Analysis & Mapping
- **R1 (Subroutines Page Overhaul)**: Must transition `src/pages/subroutines.js` from a static dummy list into an interactive hub that indexes, previews, and runs both core subroutines and web-ported Python projects.
- **R2 (Web Porting Framework & Initial Batch)**: Must establish a standard directory layout `src/ports/` with modular exports, and port 2 projects (`alphalimiter` and `AlphaObfuscate`) into full web-compatible ES module components.
- **R3 (Safe File I/O & Repository Isolation)**: The original Python projects in `C:\Users\josh6\workspace\` must be treated as **read-only source material**. All ported code must be written strictly inside `C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\`.
- **Acceptance Criteria**:
  1. `verify_subroutines.js` automated script validating that the `subroutines` page loads and references both ported projects.
  2. Structured `src/ports/` directory housing web components.
  3. Clean dev/build server execution without errors.

---

### Component Architecture Specification (`src/ports/`)

#### 1. Directory Structure
```
src/ports/
├── index.js                      # Registry & hub loader for all ported projects
├── port-contract.js              # Interface definition & runtime validator
├── alphalimiter/                 # Ported Project 1: AlphaLimiter (Rate Limiter Engine)
│   ├── index.js                  # Port entry point (metadata + component export)
│   ├── limiter-core.js           # Pure JS port of rate limiting algorithms
│   ├── limiter-ui.js             # Interactive UI component
│   └── limiter.test.js           # Vitest unit tests for core logic
└── alphaobfuscate/               # Ported Project 2: AlphaObfuscate (Obfuscator Engine)
    ├── index.js                  # Port entry point (metadata + component export)
    ├── obfuscate-core.js         # Pure JS port of obfuscation & encoding algorithms
    ├── obfuscate-ui.js           # Interactive UI component
    └── obfuscate.test.js         # Vitest unit tests for core logic
```

#### 2. Component Interface Contract (`port-contract.js`)
Every ported project MUST export a default object matching the `PortComponentContract`:

```javascript
/**
 * @typedef {Object} PortComponentContract
 * @property {string} id - Unique identifier (e.g. 'port-alphalimiter')
 * @property {string} name - Display title (e.g. 'AlphaLimiter Engine')
 * @property {string} category - Classification (e.g. 'NETWORK / SECURITY')
 * @property {string} version - Version string (e.g. '1.0.0')
 * @property {string} description - Brief summary of original Python tool and functionality
 * @property {string} pythonSourcePath - Path reference to original Python project
 * @property {function(HTMLElement, Object): function} render - Renders interactive UI into container
 * @property {function(Object): Promise<Object>} execute - Programmatic/headless execution method
 * @property {function(): void} [destroy] - Cleanup function for timers/listeners
 */
```

#### 3. Central Ports Registry (`src/ports/index.js`)
```javascript
import alphaLimiterPort from './alphalimiter/index.js';
import alphaObfuscatePort from './alphaobfuscate/index.js';

export const REGISTERED_PORTS = [
  alphaLimiterPort,
  alphaObfuscatePort
];

export function getPortById(id) {
  return REGISTERED_PORTS.find(p => p.id === id);
}

export function getAllPorts() {
  return REGISTERED_PORTS;
}
```

---

### Subroutines Hub Page Layout & Integration Design

#### 1. Page Sectioning (`src/pages/subroutines.js`)
The overhauled `SubroutinesPage` will feature a 3-tier view layout:

1. **Header & Category Filter Bar**:
   - Filter buttons: `[ALL SUBROUTINES]` | `[CORE KERNEL]` | `[PORTED PYTHON PROJECTS]`
   - Search input for real-time filtering.
   - Global batch control buttons: `[▶ EXECUTE ALL]` | `[⚡ RUN BENCHMARK]` | `[🗑 CLEAR LOGS]`.

2. **Dual-Section Card View**:
   - **Section A: Core Kernel Subroutines**: Maintains existing system routines (`SYNAPSE_PRUNING_V4`, etc.) with quick execute buttons.
   - **Section B: Ported Python Subroutines**: Interactive cards for `AlphaLimiter` and `AlphaObfuscate`.
     - Card details: Badges (`PYTHON PORT`, category, version), description, original source path reference.
     - Controls: `[▶ LAUNCH INTERACTIVE WORKSPACE]` and `[⚡ QUICK EXECUTE]`.

3. **Interactive Workspace View / Modal Container**:
   - Clicking `LAUNCH INTERACTIVE WORKSPACE` mounts the selected port's `render(container, options)` into a dedicated viewport panel or modal within the page.
   - Includes full execution log stream integrated into the main `// EXECUTION_LOG` panel.

#### 2. State Isolation & Encapsulation
- **CSS Isolation**: Styled using BEM / scoped class names (`.port-limiter-*`, `.port-obfuscate-*`) and CSS variables inherited from AlphaCore global theme.
- **Instance Isolation**: Every invocation of `render()` generates a fresh instance context.
- **Lifecycle Cleanup**: Navigating away from `#/subroutines` or switching active ports calls `port.destroy()` to ensure no lingering timers, intervals, or event listeners remain.

---

### Verification Script Specification (`verify_subroutines.js`)

`verify_subroutines.js` will serve as an automated node test script run via `node verify_subroutines.js` (or `npm test`).

#### Verification Flow & Assertion Steps:
1. **Directory & File Structure Verification**:
   - Asserts existence of `src/ports/index.js`.
   - Asserts existence of `src/ports/alphalimiter/index.js` and `src/ports/alphaobfuscate/index.js`.
2. **Module Contract Validation**:
   - Dynamically imports `src/ports/index.js`.
   - Validates that `REGISTERED_PORTS` contains at least 2 exported ports.
   - Validates each port exports required fields: `id`, `name`, `category`, `description`, `render`, `execute`.
3. **Subroutines Page Integration Assertions (JSDOM)**:
   - Sets up JSDOM environment (`window`, `document`).
   - Imports `SubroutinesPage` from `src/pages/subroutines.js`.
   - Instantiates page DOM: `const el = SubroutinesPage()`.
   - Asserts that DOM contains elements matching `port-alphalimiter` and `port-alphaobfuscate`.
   - Asserts that interactive controls (launch/execute buttons) are present for both ports.
4. **Headless Execution Verification**:
   - Calls `execute()` on both `alphaLimiterPort` and `alphaObfuscatePort` programmatically.
   - Asserts valid return objects with success status.
5. **Non-Mutation Safety Verification**:
   - Verifies that Python source files in `C:\Users\josh6\workspace\alphalimiter` and `C:\Users\josh6\workspace\AlphaObfuscate` are untouched.
6. **Exit Code & Output**:
   - Success: Logs detailed pass report with `[✓] PASS` icons and exits with code `0`.
   - Failure: Logs failure details with `[✗] FAIL` and exits with code `1`.

---

## 3. Caveats

1. **Read-Only Scope**: This subagent has operated purely in read-only exploration mode. No code changes or test executions were performed.
2. **JSDOM Node Dependencies**: Running `verify_subroutines.js` via Node requires `jsdom` (already present in `package.json:15`).
3. **Browser Compatibility**: Ported JS files must strictly use web-standard APIs (no Node native modules like `fs` or `child_process`).

---

## 4. Conclusion

The web porting architecture (`src/ports/`), overhauled `SubroutinesPage` design, and `verify_subroutines.js` harness design provide a complete, robust blueprint for fulfilling all requirements of R1, R2, and R3.

---

## 5. Verification Method

To verify the design once implemented by downstream agents:

1. **File Hierarchy Check**:
   ```powershell
   Test-Path C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\index.js
   Test-Path C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\alphalimiter\index.js
   Test-Path C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\alphaobfuscate\index.js
   Test-Path C:\Users\josh6\Workspace\AlphaCoreTech\verify_subroutines.js
   ```

2. **Automated Test Execution**:
   ```powershell
   node C:\Users\josh6\Workspace\AlphaCoreTech\verify_subroutines.js
   npm test
   ```

3. **Dev Server & UI Verification**:
   ```powershell
   npm run dev
   # Open browser at http://localhost:3000/#/subroutines
   ```
