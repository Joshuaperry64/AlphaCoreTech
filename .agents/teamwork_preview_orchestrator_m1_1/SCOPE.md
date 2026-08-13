# Scope: Milestone M1 — Web Porting Framework & Initial Ports

## Architecture
- Framework: Port Component Contract (`src/ports/port-contract.js`) & Central Registry (`src/ports/index.js`).
- Port 1: `alphainventory` (`src/ports/alphainventory/`) - core logic, UI component, vitest unit tests.
- Port 2: `alpharequirements` (`src/ports/alpharequirements/`) - core logic, UI component, vitest unit tests.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Port Contract | `PortComponentContract` interface spec & `validatePortContract` runtime validator | M1 | Dispatch |
| 2 | Port Registry | Central registry with `REGISTERED_PORTS`, `getPortById`, `getAllPorts` | M1 | Dispatch |
| 3 | AlphaInventory Core | Ported logic from `AlphaInventory\main.py` (RPi 40-pin GPIO default pins array, component pin assignment, pin conflict engine) | M1 | `C:\Users\josh6\workspace\AlphaInventory\main.py` |
| 4 | AlphaInventory UI | Interactive UI component rendering 2x20 header grid, pin inspector, component manager, conflict alerts, localStorage persistence | M1 | Dispatch |
| 5 | AlphaInventory Port Entry | `src/ports/alphainventory/index.js` exporting metadata, `render`, `execute`, `destroy` | M1 | Dispatch |
| 6 | AlphaInventory Tests | `inventory.test.js` vitest unit tests | M1 | Dispatch |
| 7 | AlphaRequirements Core | Ported logic from `AlphaRequirements\app\scanner.py` (`parse_requirements_text`, `dedupe_specs`, `_detect_modernization`) | M1 | `C:\Users\josh6\workspace\AlphaRequirements\app\scanner.py` |
| 8 | AlphaRequirements UI | Interactive UI component rendering dual-pane text area, sample presets, deduplicated output, metric cards, modernization warnings, clipboard export | M1 | Dispatch |
| 9 | AlphaRequirements Port Entry | `src/ports/alpharequirements/index.js` exporting metadata, `render`, `execute`, `destroy` | M1 | Dispatch |
| 10 | AlphaRequirements Tests | `requirements.test.js` vitest unit tests | M1 | Dispatch |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Web Porting Framework & Initial Ports | Contract, Registry, AlphaInventory port, AlphaRequirements port | none | IN_PROGRESS |

## Interface Contracts
### PortComponentContract Interface
- `id`: string (e.g. `'port-alphainventory'`)
- `name`: string
- `description`: string
- `version`: string
- `render(containerElement)`: HTMLElement / void
- `execute(options)`: Promise<any> / any
- `destroy()`: void
- `validatePortContract(portObj)`: returns `{ valid: boolean, errors: string[] }`
