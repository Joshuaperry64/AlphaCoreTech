# Milestone M1 Investigation Report: Web Porting Framework & Central Registry Requirements

**Explorer ID**: `teamwork_preview_explorer_m1_3`  
**Milestone**: M1 — Web Porting Framework & Initial Ports  
**Target Repository**: `C:\Users\josh6\Workspace\AlphaCoreTech\`  
**Date**: 2026-08-10  

---

## 1. Overview & Objective

This report provides a comprehensive technical analysis and specification for the **Web Porting Framework & Central Registry** required for Milestone M1 of the AlphaCoreTech subroutines overhaul. 

The objective of Explorer 3 is to investigate the framework specifications and project setup to define the contract and registry architecture:
1. `src/ports/port-contract.js`: Interface contract (`PortComponentContract`) and runtime validator function (`validatePortContract`).
2. `src/ports/index.js`: Central port registry exporting `REGISTERED_PORTS`, `getPortById(id)`, and `getAllPorts()`.
3. Existing project setup analysis: `package.json`, Vitest test runner configuration, JSDOM environment, ES Module structure, and layout rules.

---

## 2. Component Interface Contract (`src/ports/port-contract.js`)

### 2.1 Interface Specification: `PortComponentContract`

All web-ported Python projects (e.g., `alphainventory`, `alpharequirements`) must conform to the `PortComponentContract` standard. This guarantees that any ported subroutine can be loaded, rendered, executed, and cleaned up uniformly by the Subroutines Hub page (`src/pages/subroutines.js`) or verification test harnesses.

| Property / Method | Type | Description / Requirements |
|---|---|---|
| `id` | `string` | Unique identifier (e.g., `'alphainventory'`, `'alpharequirements'`). Must be a non-empty string. |
| `name` | `string` | Display title for the ported component (e.g., `'AlphaInventory GPIO Manager'`). |
| `category` | `string` | Category classification (e.g., `'HARDWARE'`, `'TOOL'`, `'SYSTEM'`). |
| `version` | `string` | Semantic version string (e.g., `'1.0.0'`). |
| `description` | `string` | Concise description of the ported functionality. |
| `pythonSourcePath` | `string` | Relative path to the original Python source file in `C:\Users\josh6\workspace\` (e.g., `'AlphaInventory/main.py'`). |
| `render(container, options)` | `Function` | Mounts the interactive DOM UI inside `container` (an `HTMLElement`). Accepts optional `options` object. Returns `HTMLElement` or `void` (or optional cleanup function). |
| `execute(params)` | `Async Function` | Programmatic / headless execution entry point. Accepts `params` object and returns a `Promise` resolving to `{ success: boolean, output: string, details?: object }`. |
| `destroy()` | `Function` | Cleanup teardown hook. Unbinds global event listeners, stops timers/intervals, and releases memory references when unmounting. |

---

### 2.2 Runtime Validator Function: `validatePortContract(portObj)`

`validatePortContract` validates an incoming object against the `PortComponentContract` specification at runtime before registering or mounting it.

#### Contract Validation Signature
```javascript
/**
 * Validates whether an object complies with PortComponentContract.
 * @param {Object} portObj - The candidate port module/object.
 * @returns {{ valid: boolean, errors: string[] }} Validation result object.
 */
export function validatePortContract(portObj)
```

#### Validation Rules
1. **Target Existence**: `portObj` must be a non-null object.
2. **Metadata Fields**:
   - `id`: Must be a non-empty string.
   - `name`: Must be a non-empty string.
   - `category`: Must be a non-empty string.
   - `version`: Must be a non-empty string.
   - `description`: Must be a non-empty string.
   - `pythonSourcePath`: Must be a non-empty string.
3. **Lifecycle Functions**:
   - `render`: Must be a function (`typeof portObj.render === 'function'`).
   - `execute`: Must be a function (`typeof portObj.execute === 'function'`).
   - `destroy`: Must be a function (`typeof portObj.destroy === 'function'`).

#### Output Behavior
- Returns `{ valid: true, errors: [] }` if all checks pass.
- Returns `{ valid: false, errors: ['Error message 1', ...] }` if any check fails, recording detailed error strings for missing or invalid properties.

---

### 2.3 Reference Implementation Draft (`src/ports/port-contract.js`)

```javascript
/**
 * src/ports/port-contract.js
 * Interface Contract Definition & Runtime Validator for Web-Ported Subroutines.
 */

/**
 * Validates a port object against the PortComponentContract specification.
 * 
 * @param {any} portObj - The port object to validate.
 * @returns {{ valid: boolean, errors: string[] }} Result containing boolean status and array of validation errors.
 */
export function validatePortContract(portObj) {
  const errors = [];

  if (!portObj || typeof portObj !== 'object') {
    return { valid: false, errors: ['Port object must be a non-null object.'] };
  }

  const stringFields = ['id', 'name', 'category', 'version', 'description', 'pythonSourcePath'];
  for (const field of stringFields) {
    if (typeof portObj[field] !== 'string' || portObj[field].trim() === '') {
      errors.push(`Missing or invalid required string property '${field}'.`);
    }
  }

  const functionFields = ['render', 'execute', 'destroy'];
  for (const field of functionFields) {
    if (typeof portObj[field] !== 'function') {
      errors.push(`Missing or invalid required method '${field}'.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 3. Central Port Registry (`src/ports/index.js`)

### 3.1 Registry Specifications & Functions

`src/ports/index.js` acts as the single source of truth for all ported web subroutines in the AlphaCoreTech platform.

#### Key Exports
1. `REGISTERED_PORTS`: An immutable/read-only array containing all successfully validated port objects (`alphainventory`, `alpharequirements`).
2. `getPortById(id)`: Returns the port object matching `id` from `REGISTERED_PORTS`, or `undefined` if non-existent.
3. `getAllPorts()`: Returns array of all registered port objects (`[...REGISTERED_PORTS]`).

---

### 3.2 Reference Implementation Draft (`src/ports/index.js`)

```javascript
/**
 * src/ports/index.js
 * Central Port Registry for Web-Ported Subroutines.
 */

import { validatePortContract } from './port-contract.js';
import alphainventoryPort from './alphainventory/index.js';
import alpharequirementsPort from './alpharequirements/index.js';

const rawPorts = [
  alphainventoryPort,
  alpharequirementsPort
];

const validatedPorts = [];

for (const port of rawPorts) {
  if (port) {
    const { valid, errors } = validatePortContract(port);
    if (valid) {
      validatedPorts.push(port);
    } else {
      console.error(`[PORT REGISTRY] Port validation failed for '${port?.id || 'unknown'}':`, errors);
    }
  }
}

export const REGISTERED_PORTS = Object.freeze(validatedPorts);

/**
 * Retrieves a registered port object by ID.
 * @param {string} id - Port unique identifier.
 * @returns {Object|undefined} The matching port object or undefined.
 */
export function getPortById(id) {
  return REGISTERED_PORTS.find(port => port.id === id);
}

/**
 * Retrieves all registered port objects.
 * @returns {Array<Object>} Copy of all registered port objects.
 */
export function getAllPorts() {
  return [...REGISTERED_PORTS];
}

export { validatePortContract };
```

---

## 4. Existing Setup & Tooling Analysis

### 4.1 `package.json` Configuration
- `"type": "module"`: The project uses native ES module syntax (`import`/`export`) across all files.
- `scripts`:
  - `"dev"`: Runs Vite dev server.
  - `"build"`: Runs Vite production build.
  - `"test"`: Runs `vitest run` unit test execution.
- `devDependencies`:
  - `vite`: `^6.0.0`
  - `vitest`: `^4.1.10`
  - `jsdom`: `^29.1.1`
  - `@vitest/coverage-v8`: `^4.1.10`

---

### 4.2 Test Runner & DOM Environment
- `vitest.config.js` sets `environment: 'jsdom'`, `globals: true`.
- Verification of test harness: Execution of `npx vitest run` verified 31 passing unit tests across existing test files (`src/components/utils.test.js` and `src/components/pinpad.test.js`).
- JSDOM is active, allowing direct testing of DOM manipulation (`document.createElement`, `innerHTML`, event handling, `localStorage`) without a full browser instance.

---

### 4.3 Directory Structure & Layout Compliance
- **Rule**: All source code, modular ports, and unit tests MUST reside in `src/ports/`.
- **Target Directories**:
  - `src/ports/port-contract.js`
  - `src/ports/index.js`
  - `src/ports/alphainventory/` (`index.js`, `inventory-core.js`, `inventory-ui.js`, `inventory.test.js`)
  - `src/ports/alpharequirements/` (`index.js`, `requirements-core.js`, `requirements-ui.js`, `requirements.test.js`)
- **Metadata Separation**: `.agents/` contains ONLY agent operational metadata (`plan.md`, `progress.md`, `BRIEFING.md`, `DISPATCH.md`, `handoff.md`, `analysis.md`).

---

## 5. Summary & Actionable Recommendations

1. `src/ports/port-contract.js`: Implement `validatePortContract(portObj)` returning `{ valid: boolean, errors: string[] }` checking all 6 metadata string properties and 3 lifecycle functions.
2. `src/ports/index.js`: Import port modules, validate each port upon startup, populate `REGISTERED_PORTS`, and export helper functions `getPortById` and `getAllPorts`.
3. Implementers for `alphainventory` and `alpharequirements` must export an object conforming to `PortComponentContract` with `id: 'alphainventory'` and `id: 'alpharequirements'`.
4. Ensure co-located Vitest test files (`inventory.test.js`, `requirements.test.js`, `port-contract.test.js`) test contract compliance, headless `execute()`, interactive `render()`, and state cleanup in `destroy()`.
