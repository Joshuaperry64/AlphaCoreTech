# Detailed Investigation Report: Web Porting Framework & Integration Interface (`src/ports/index.js`)

**Milestone**: M2 — Subroutines Hub Page Overhaul & Netlify Compatibility  
**Author**: Explorer Subagent (Explorer 2)  
**Date**: 2026-08-12  
**Target Module**: `src/ports/index.js`, `src/ports/port-contract.js`, `src/ports/alphainventory/`, `src/ports/alpharequirements/`, `src/pages/subroutines.js`

---

## Executive Summary

This report provides a comprehensive analysis of `src/ports/index.js` and the Web Porting Framework interface contract. It specifies how `src/pages/subroutines.js` must integrate registered Python web ports (`AlphaInventory` and `AlphaRequirements`) into the overhauled Subroutines Hub page. The findings cover export signatures, interface contracts, dynamic workspace mounting, programmatic headless execution streaming to `// EXECUTION_LOG`, and strict lifecycle cleanup (`port.destroy()`) to prevent DOM and timer leaks.

---

## 1. `src/ports/index.js` Registry Analysis & Exports

### Exports Summary
The central web porting registry file at `src/ports/index.js` acts as the single source of truth for all ported Python components in the website framework.

- **`REGISTERED_PORTS`** (`Array<PortComponentContract>`): An exported array containing validated port modules.
- **`getAllPorts()`** (`Function`): Returns `REGISTERED_PORTS` array containing all validated port objects.
- **`getPortById(id)`** (`Function`): Look up a port object by full ID (`'port-alphainventory'`), short ID (`'alphainventory'`), or name (`'AlphaInventory'`, case-insensitive).

### Source Code Analysis (`src/ports/index.js`)
```javascript
import { validatePortContract } from './port-contract.js';
import alphaInventoryPort from './alphainventory/index.js';
import alphaRequirementsPort from './alpharequirements/index.js';

const candidatePorts = [
  alphaInventoryPort,
  alphaRequirementsPort
];

const validPorts = [];

for (const port of candidatePorts) {
  const result = validatePortContract(port);
  if (result.valid) {
    validPorts.push(port);
  } else {
    console.error(`[Port Registry] Port '${port?.id || 'unknown'}' failed contract validation:`, result.errors);
  }
}

export const REGISTERED_PORTS = validPorts;

export function getAllPorts() {
  return REGISTERED_PORTS;
}

export function getPortById(id) { ... }
```

### Integration in `src/pages/subroutines.js`
In `src/pages/subroutines.js`, Section B ("Web-Ported Python Projects") must import `getAllPorts`:
```javascript
import { getAllPorts } from '../ports/index.js';

const portedProjects = getAllPorts();
```
This guarantees that Section B dynamically enumerates all registered ports without hardcoding specific component instances, allowing future Python ports to be auto-discovered upon registration in `src/ports/index.js`.

---

## 2. Exact Port Interface Contract (`PortComponentContract`)

Defined in `src/ports/port-contract.js`, validated via `validatePortContract(portObj)`.

### Interface Definition
| Property / Method | Type | Description | Example Value |
|---|---|---|---|
| `id` | `string` | Unique port identifier | `'port-alphainventory'`, `'port-alpharequirements'` |
| `name` | `string` | Display name | `'AlphaInventory'`, `'AlphaRequirements'` |
| `category` | `string` | Classification category | `'Hardware'`, `'Utilities'` |
| `version` | `string` | Version semver string | `'1.0.0'` |
| `description` | `string` | Functional summary | `'Raspberry Pi GPIO Pinout Visualizer & Conflict Engine'` |
| `pythonSourcePath` | `string` | Path to original Python source | `'AlphaInventory/main.py'`, `'AlphaRequirements/app/scanner.py'` |
| `render(container, options)` | `Function` | Mounts interactive DOM UI into `container` | Returns active UI instance object |
| `execute(params)` | `Function` | Headless execution returning Promise | `{ success: true, output: string, details: Object }` |
| `destroy()` | `Function` | Cleans up active DOM & timers | `void` |

---

## 3. Interactive Workspace View & Modal Container Mounting

### Requirements
When a user clicks **"LAUNCH INTERACTIVE WORKSPACE"** (or **"LAUNCH WORKSPACE"**) on a ported project card in Section B:
1. An interactive modal overlay or workspace drawer container (e.g. `#port-workspace-modal` with container `#port-workspace-body`) must open.
2. Any previously mounted port UI inside the workspace container must be cleanly destroyed via `port.destroy()`.
3. The target container must be cleared (`workspaceContainer.innerHTML = ''`).
4. `port.render(workspaceContainer)` must be invoked to mount the interactive UI.
5. The workspace modal title and metadata (e.g. original Python path, category, version) should display the active port details.

### Recommended Implementation Pattern in `src/pages/subroutines.js`
```javascript
let activeWorkspacePort = null;

function closeWorkspaceModal() {
  if (activeWorkspacePort) {
    if (typeof activeWorkspacePort.destroy === 'function') {
      activeWorkspacePort.destroy();
    }
    activeWorkspacePort = null;
  }
  const modal = container.querySelector('#port-workspace-modal');
  const body = container.querySelector('#port-workspace-body');
  if (body) body.innerHTML = '';
  if (modal) modal.style.display = 'none';
}

function launchWorkspaceModal(port) {
  // Ensure previous port instance is destroyed before mounting new one
  closeWorkspaceModal();

  activeWorkspacePort = port;
  const modal = container.querySelector('#port-workspace-modal');
  const modalTitle = container.querySelector('#port-workspace-title');
  const modalSource = container.querySelector('#port-workspace-source');
  const body = container.querySelector('#port-workspace-body');

  if (modalTitle) modalTitle.textContent = `// WORKSPACE: ${port.name.toUpperCase()} (v${port.version})`;
  if (modalSource) modalSource.textContent = `SOURCE: ${port.pythonSourcePath}`;

  if (modal) modal.style.display = 'flex';
  if (body) {
    body.innerHTML = '';
    port.render(body);
  }
}
```

---

## 4. "QUICK EXECUTE" & Execution Console (`// EXECUTION_LOG`) Streaming

### Requirements
When a user clicks **"QUICK EXECUTE"** on a ported project card in Section B (or triggers a batch execution):
1. Headless execution should call `port.execute({})` programmatically.
2. Execution activity must stream logs to the existing `// EXECUTION_LOG` console (`#sub-console-output`).
3. Top status indicator `#sub-active-status` should update to `RUNNING: [PORT_NAME]` and revert to `IDLE` upon completion.
4. Toast notifications should be emitted on completion (`showToast('SUCCESS', ...)` or `showToast('WARN', ...)`).

### Execution Flow & Log Output Format
```javascript
async function runPortQuickExecute(port) {
  const statusEl = container.querySelector('#sub-active-status');
  if (statusEl) {
    statusEl.textContent = `RUNNING: ${port.name}`;
    statusEl.style.color = 'var(--accent, #06b6d4)';
  }

  appendConsoleLine(`[${new Date().toLocaleTimeString()}] INITIATING HEADLESS EXECUTION: ${port.name} (${port.id})...`, 'var(--accent, #06b6d4)');
  appendConsoleLine(`> Python Source Reference: ${port.pythonSourcePath}`, '#888');
  showToast('INFO', `Executing ${port.name}...`);

  try {
    const startTime = performance.now();
    const result = await port.execute({});
    const elapsed = (performance.now() - startTime).toFixed(2);

    appendConsoleLine(`> Execution runtime: ${elapsed} ms`, '#aaa');
    appendConsoleLine(`> ${result.output}`, result.success ? '#10b981' : '#f59e0b');

    if (result.details) {
      appendConsoleLine(`> Detailed Output: ${JSON.stringify(result.details)}`, '#666');
    }

    if (result.success) {
      appendConsoleLine(`[✓] PORT EXECUTION COMPLETED: ${port.name} PASS`, '#10b981');
      showToast('SUCCESS', `Port ${port.name} executed successfully!`);
    } else {
      appendConsoleLine(`[⚠] PORT EXECUTION WARN: ${port.name} reported warnings/conflicts.`, '#f59e0b');
      showToast('WARN', `Port ${port.name} executed with issues.`);
    }
  } catch (err) {
    appendConsoleLine(`[❌] ERROR EXECUTING PORT ${port.name}: ${err.message}`, '#ef4444');
    showToast('ERROR', `Failed to execute ${port.name}`);
  } finally {
    if (statusEl) {
      statusEl.textContent = 'IDLE';
      statusEl.style.color = '#888';
    }
  }
}
```

---

## 5. Encapsulation & Lifecycle Requirement (`port.destroy()`)

### Leak Vector Analysis
- Port UIs like `AlphaInventory` attach event listeners to GPIO pin cards (`.ai-pin-card`), modal triggers, and form submits, and maintain active state in `activeInstance`.
- If `subroutines.js` replaces workspace container content (`container.innerHTML = ''`) without calling `port.destroy()`, DOM nodes removed from document may still be referenced by event handlers or module closure variables.
- Navigating away from `#/subroutines` via SPA router replaces `#app` root element without invoking child page cleanup unless explicit teardown logic is implemented.

### Protection Protocol
1. **Single Active Workspace Enforcement**: Before mounting any new port UI in the modal container, `subroutines.js` MUST call `activeWorkspacePort.destroy()`.
2. **Modal Close Cleanup**: Closing the workspace modal via close button, escape key, or backdrop click MUST call `activeWorkspacePort.destroy()`.
3. **Route Teardown Listener**: In `SubroutinesPage()`, returned container element or custom teardown hook should clean up `activeWorkspacePort` when unmounted.

---

## 6. Synthesis & Implementation Checklist for Milestone M2

- [x] Survey `src/ports/index.js` exports: `REGISTERED_PORTS`, `getAllPorts()`, `getPortById(id)`.
- [x] Verify compliance of `AlphaInventory` (`src/ports/alphainventory/index.js`) and `AlphaRequirements` (`src/ports/alpharequirements/index.js`) with `PortComponentContract`.
- [x] Define exact structure for Section B in `src/pages/subroutines.js`:
  - Card layout displaying port `name`, `category`, `version`, `pythonSourcePath`, and `description`.
  - Buttons: `▶ QUICK EXECUTE` and `⚡ LAUNCH WORKSPACE`.
- [x] Define interactive modal workspace container (`#port-workspace-modal`) and lifecycle management functions (`closeWorkspaceModal`, `launchWorkspaceModal`).
- [x] Define programmatic execution streaming function (`runPortQuickExecute`) targeting `#sub-console-output`.

---
*Report end.*
