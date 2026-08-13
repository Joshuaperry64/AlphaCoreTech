# Handoff Report: AlphaInventory Web Port Investigation & Design Specification

## 1. Observation
- **Source Python Application**: Inspected `C:\Users\josh6\workspace\AlphaInventory\main.py` (lines 10–51 `DEFAULT_PINS` map, lines 54–66 config helpers, lines 71–148 REST endpoints for devices & components).
- **Library Data**: Inspected `C:\Users\josh6\workspace\AlphaInventory\component_library.json` containing 4 component definitions (`DHT22`, `Generic IR Receiver (VS1838B)`, `Generic IR Blaster (LED)`, `Servo Motor (SG90)`).
- **Client Implementation**: Inspected `C:\Users\josh6\workspace\AlphaInventory\static\main.js` (lines 31–43 `checkCompatibility` pin validator, lines 57–80 `renderGPIO`, lines 161–170 pin selection mode).
- **Target Repository & Contract**: Inspected `C:\Users\josh6\Workspace\AlphaCoreTech\PROJECT.md` and `.agents\teamwork_preview_orchestrator_m1_1\SCOPE.md` defining `PortComponentContract` requirements (`id`, `name`, `description`, `version`, `render`, `execute`, `destroy`).

## 2. Logic Chain
1. **Source Analysis**: `main.py` defines a Flask backend that persists pin configuration and attached components to `setup.json`.
2. **Web Port Translation**: Since the target framework (`AlphaCoreTech`) is a client-side SPA built with Vite ES Modules, server-side REST API calls can be completely refactored into pure JavaScript state mutators (`inventory-core.js`) backed by browser `localStorage` persistence (`inventory-ui.js`).
3. **Core Pinout Engine (`inventory-core.js`)**:
   - Port `DEFAULT_PINS` (40 pins) directly from `main.py`.
   - Implement `checkCompatibility()` to validate pin type matching.
   - Design `detectConflicts(components, pins)` to check for pin over-allocation (multiple signal pins assigned to same GPIO pin), pin type mismatches, and unassigned required component pins.
4. **UI Renderer (`inventory-ui.js`)**:
   - Render a 2x20 header pin grid (odd pins 1-39 left column, even pins 2-40 right column).
   - Provide color-coded modes (Power, Ground, I2C, SPI, UART, PWM, GPIO) with visual highlight halos for component pin assignments.
   - Implement pin inspector sidebar, component library search & pin assignment modal, conflict alert summary panel, and `localStorage` state persistence under key `'alphainventory_state'`.
5. **Contract Entry Point (`index.js`)**:
   - Export `metadata` (`id: 'port-alphainventory'`), `render(container, options)`, `execute(params)`, and `destroy()`.
6. **Unit Verification (`inventory.test.js`)**:
   - Create Vitest test suite testing pin array completeness, pin compatibility, conflict engine detection, state mutations, and headless execution.

## 3. Caveats
- The original Flask backend in `main.py` included dummy routes for `/api/chat` and `/api/ask-ai` returning static string echoes. In the client-side web port, these AI placeholder endpoints are omitted or handled gracefully via mock UI messages, keeping the core focus on hardware pinout visualization and conflict management.
- Source path `C:\Users\josh6\workspace\AlphaInventory\main.py` must remain completely unmodified and read-only.

## 4. Conclusion
A clear, fully specified 4-file JavaScript implementation plan has been established for `src/ports/alphainventory/`:
- `src/ports/alphainventory/inventory-core.js`
- `src/ports/alphainventory/inventory-ui.js`
- `src/ports/alphainventory/index.js`
- `src/ports/alphainventory/inventory.test.js`

The specification guarantees zero mutation of source files, full adherence to `PortComponentContract`, and 100% testability via Vitest.

## 5. Verification Method
1. **Inspection Verification**:
   - Verify design document `analysis.md` exists at `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_m1_1\analysis.md`.
   - Verify `handoff.md` exists at `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_m1_1\handoff.md`.
2. **Implementation & Test Command Verification**:
   - Upon implementation by coding agents, verify with: `npx vitest run src/ports/alphainventory/inventory.test.js`.
