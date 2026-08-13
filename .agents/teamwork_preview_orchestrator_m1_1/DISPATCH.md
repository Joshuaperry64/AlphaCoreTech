## 2026-08-10T19:36:32Z

Execute Milestone M1: Web Porting Framework & Initial Ports for the AlphaCoreTech codebase.

SCOPE & DELIVERABLES:
1. Create `src/ports/port-contract.js`: Define `PortComponentContract` interface specification and runtime validator function (`validatePortContract`).
2. Create `src/ports/index.js`: Central registry exporting `REGISTERED_PORTS` array containing validated port objects for `alphainventory` and `alpharequirements`, plus `getPortById(id)` and `getAllPorts()`.
3. Create `src/ports/alphainventory/`:
   - `inventory-core.js`: Pure JS logic ported from `C:\Users\josh6\workspace\AlphaInventory\main.py` (Raspberry Pi 40-pin GPIO default pins array, component pin assignment, pin conflict engine).
   - `inventory-ui.js`: Interactive UI component rendering 2x20 color-coded pinout header grid, pin inspector sidebar, attached component manager, conflict detection alerts, and localStorage state persistence.
   - `index.js`: Port entry point exporting metadata (`id: 'port-alphainventory'`), `render`, `execute`, `destroy`.
   - `inventory.test.js`: Vitest unit tests verifying core logic and pin conflict detection.
4. Create `src/ports/alpharequirements/`:
   - `requirements-core.js`: Pure JS logic ported from `C:\Users\josh6\workspace\AlphaRequirements\app\scanner.py` (`parse_requirements_text`, `dedupe_specs`, `_detect_modernization`).
   - `requirements-ui.js`: Interactive UI component rendering dual-pane text area, sample presets, deduplicated output, metric cards, modernization warnings, and clipboard export.
   - `index.js`: Port entry point exporting metadata (`id: 'port-alphainventory'`), `render`, `execute`, `destroy`.
   - `requirements.test.js`: Vitest unit tests verifying spec parsing, deduplication, and modernization detection.

KEY CONSTRAINTS:
- DO NOT alter or delete any source files in `C:\Users\josh6\workspace\`.
- All new files MUST be written directly into `C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\`.
- Run your milestone iteration loop: Explorer -> Worker -> Reviewer -> Challenger -> Auditor -> Gate check.
- Include MANDATORY INTEGRITY WARNING in Worker dispatch.
