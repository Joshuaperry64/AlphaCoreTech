# Project: AlphaCoreTech Subroutines Overhaul & Web Porting Framework
# Scope: Full Project

## Architecture
- **Framework**: Single Page Application (SPA) using vanilla JavaScript (ES Modules), HTML5, CSS3, built with Vite (`vite ^6.0.0`).
- **Routing**: Client-side hash routing (`window.addEventListener('hashchange', renderRoute)`). Route `#/subroutines` mounts `SubroutinesPage()` in `src/pages/subroutines.js`.
- **Web Porting Framework (`src/ports/`)**:
  - `src/ports/port-contract.js`: Interface specification (`PortComponentContract`: `id`, `name`, `category`, `version`, `description`, `pythonSourcePath`, `render(container, options)`, `execute(params)`, `destroy()`)
  - `src/ports/index.js`: Central registry exporting `REGISTERED_PORTS`, `getPortById`, `getAllPorts`
  - `src/ports/alphainventory/`: Web-ported Python project 1 (Raspberry Pi 40-Pin GPIO Pinout & Component Manager)
  - `src/ports/alpharequirements/`: Web-ported Python project 2 (Requirements.txt Parser, Deduplicator & Modernization Analyzer)
- **Subroutines Hub Page (`src/pages/subroutines.js`)**:
  - Overhauled SPA page featuring category filter bar, search input, batch execution controls, dual-section view (Core Kernel Subroutines vs. Ported Python Subroutines), interactive workspace mounting, and execution log console.
- **Automated Verification (`verify_subroutines.js`)**:
  - Root node verification script asserting directory structure, registry integrity, module contract compliance, JSDOM Subroutines DOM rendering, headless execution, and non-mutation safety of `C:\Users\josh6\workspace\`.

- **Hosting & Deployment**: Target hosting platform is Netlify. SPA client-side hash routing (`#/subroutines`) ensures 100% Netlify compatibility. Netlify redirect configuration (`public/_redirects`) routes `/* /index.html 200` to support fallback SPA routing.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Component Interface Contract | Define `PortComponentContract` in `src/ports/port-contract.js` and central registry in `src/ports/index.js` | M1 | survey |
| 2 | AlphaInventory Web Port | Port `AlphaInventory` logic (`main.py`) into `src/ports/alphainventory/` with interactive GPIO pinout UI, component inspector, conflict engine, and unit tests | M1 | survey |
| 3 | AlphaRequirements Web Port | Port `AlphaRequirements` logic (`scanner.py`) into `src/ports/alpharequirements/` with spec parser, deduplicator, modernization engine, interactive UI, and unit tests | M1 | survey |
| 4 | Subroutines Page Overhaul | Overhaul `src/pages/subroutines.js` to render interactive hub indexing core routines & ported projects with filter bar, launch workspaces, and execution logs | M2 | survey |
| 5 | Automated Verification Script | Implement root `verify_subroutines.js` verifying project structure, contract compliance, JSDOM DOM rendering, headless execution, and workspace non-mutation | M3 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Web Porting Framework & Initial Ports | Implement `src/ports/port-contract.js`, `src/ports/index.js`, `src/ports/alphainventory/`, and `src/ports/alpharequirements/` | none | DONE |
| 2 | Subroutines Hub Page Overhaul | Redesign `src/pages/subroutines.js` into interactive directory linking to ported projects with filtering, modals/workspaces, execution console, and Netlify compatibility (`public/_redirects`) | M1 | DONE |
| 3 | Verification Harness & Quality Hardening | Implement `verify_subroutines.js` and pass 100% of unit/E2E verification tests | M2 | DONE |


## Interface Contracts
### `src/ports/port-contract.js` ↔ `src/ports/index.js`
- Export contract validator `validatePortContract(portModule)`
- `REGISTERED_PORTS` array containing all validated port objects.

### `src/ports/` ↔ `src/pages/subroutines.js`
- `getAllPorts()` returning array of port objects.
- `port.render(containerElement, options)` mounting interactive UI.
- `port.execute(params)` returning Promise resolves `{ success: boolean, output: string, details: Object }`.
- `port.destroy()` tearing down listeners/timers.

## Code Layout
- `src/ports/port-contract.js`
- `src/ports/index.js`
- `src/ports/alphainventory/index.js`
- `src/ports/alphainventory/inventory-core.js`
- `src/ports/alphainventory/inventory-ui.js`
- `src/ports/alphainventory/inventory.test.js`
- `src/ports/alpharequirements/index.js`
- `src/ports/alpharequirements/requirements-core.js`
- `src/ports/alpharequirements/requirements-ui.js`
- `src/ports/alpharequirements/requirements.test.js`
- `src/pages/subroutines.js`
- `verify_subroutines.js`
