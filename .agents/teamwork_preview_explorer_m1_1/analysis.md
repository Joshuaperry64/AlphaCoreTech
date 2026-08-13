# Technical Analysis & Web Porting Design Recommendation: AlphaInventory

## Executive Summary
This document presents a comprehensive technical analysis of the Python-based `AlphaInventory` application (`C:\Users\josh6\workspace\AlphaInventory\main.py`) and specifies the detailed architectural design for porting it into a high-performance, modular Web Component (`src/ports/alphainventory/`) within the `AlphaCoreTech` single-page application framework.

---

## 1. Source Codebase Technical Investigation

### 1.1 Source File Structure
- **Primary Flask Server & API**: `C:\Users\josh6\workspace\AlphaInventory\main.py` (161 lines)
- **Component Library Schema**: `C:\Users\josh6\workspace\AlphaInventory\component_library.json` (44 lines)
- **Initial Setup JSON**: `C:\Users\josh6\workspace\AlphaInventory\setup.json` (19 lines)
- **Frontend Template**: `C:\Users\josh6\workspace\AlphaInventory\templates\index.html` (76 lines)
- **Client Script & Logic**: `C:\Users\josh6\workspace\AlphaInventory\static\main.js` (229 lines)
- **Styling**: `C:\Users\josh6\workspace\AlphaInventory\static\style.css` (6,155 bytes)

### 1.2 Python Core Logic Analysis (`main.py`)
1. **Hardware Pinout Model (`DEFAULT_PINS`)**:
   - `DEFAULT_PINS` defines 40 pins (1 to 40) mapped to key metadata: `name`, `mode`, and `type`.
   - **Modes**: `POWER`, `I2C`, `GROUND`, `GPIO`, `UART`, `SPI`.
   - **Pin Types**:
     - `POWER_OUT_3V3`: Pins 1, 17
     - `POWER_OUT_5V`: Pins 2, 4
     - `I2C_SDA`: Pins 3, 27
     - `I2C_SCL`: Pins 5, 28
     - `GROUND`: Pins 6, 9, 14, 20, 25, 30, 34, 39
     - `DIGITAL_IO`: Pins 7, 11, 13, 15, 16, 18, 22, 25 (GPIO 25), 29, 31, 36, 37, 38, 40
     - `UART_TXD`: Pin 8 (`GPIO 14`)
     - `UART_RXD`: Pin 10 (`GPIO 15`)
     - `PWM`: Pins 12 (`GPIO 18`), 32 (`GPIO 12`), 33 (`GPIO 13`), 35 (`GPIO 19`)
     - `SPI_MOSI`: Pin 19 (`GPIO 10`)
     - `SPI_MISO`: Pin 21 (`GPIO 9`)
     - `SPI_SCLK`: Pin 23 (`GPIO 11`)
     - `SPI_CE0`: Pin 24 (`GPIO 8`)
     - `SPI_CE1`: Pin 26 (`GPIO 7`)
2. **Device State Management**:
   - Manages multiple devices (defaulting to `"My First Pi"` / `"Raspi 5"` with board `"Raspberry Pi"`).
   - Each device stores its own `pins` map and `components` array.
3. **Component Data Schema**:
   - `id`: Unique integer (autoincremented starting from `max(ids) + 1`).
   - `name`: String (matches library entry, e.g., "DHT22").
   - `type`: String ("Sensor", "Actuator", etc.).
   - `description`: String.
   - `connections`: Array of `{ component_pin_name: string, gpio_pin: string }`.
   - `color`: Hex color string for visual identification (selected from a default 6-color palette: `["#FF6347", "#4682B4", "#32CD32", "#FFD700", "#6A5ACD", "#DA70D6"]`).

### 1.3 Pin Compatibility Logic (`static/main.js`)
The existing compatibility function `checkCompatibility(gpioPin, componentPin)` implements the following rules:
- Fails if either pin object is missing.
- Fails if `componentPin.pin_type === 'NOT_CONNECTED'`.
- Pass if `gpioPin.type === componentPin.pin_type`.
- Pass if `componentPin.pin_type === 'POWER_IN_3V3_5V'` and `gpioPin.type` is `POWER_OUT_3V3` or `POWER_OUT_5V`.
- Pass if `componentPin.pin_type === 'POWER_IN_5V'` and `gpioPin.type === 'POWER_OUT_5V'`.
- Pass if `componentPin.pin_type === 'POWER_IN_3V3'` and `gpioPin.type === 'POWER_OUT_3V3'`.
- Pass if `componentPin.pin_type === 'DIGITAL_IO'` and `gpioPin.type` starts with `GPIO`, `I2C`, `SPI`, `UART`, or equals `PWM` or `DIGITAL_IO`.
- Pass if `componentPin.pin_type === 'PWM'` and `gpioPin.type === 'PWM'`.

---

## 2. Target Web Porting Architecture & Specifications

The web port will be contained entirely within `src/ports/alphainventory/` with 4 decoupled files adhering strictly to ES Module conventions.

```
src/ports/alphainventory/
├── inventory-core.js   # Pure JS logic, default pinout array, compatibility & conflict engine
├── inventory-ui.js     # DOM renderer: 2x20 GPIO grid, pin inspector, component manager, alerts, localStorage
├── index.js            # Port entry point implementing PortComponentContract (metadata, render, execute, destroy)
└── inventory.test.js   # Vitest unit test suite validating core logic and conflict detection
```

### 2.1 File 1: `src/ports/alphainventory/inventory-core.js`
**Role**: Pure Javascript logic module with zero DOM dependencies. Can run in both Browser and Node.js/Vitest environments.

**Key Exports & Data Structures**:
1. `DEFAULT_PINS`: Dictionary/Object mapping pin numbers `"1"` through `"40"` to `{ name, mode, type }`.
2. `DEFAULT_COMPONENT_LIBRARY`: Array of predefined electronic components (DHT22, VS1838B IR Receiver, IR Blaster LED, SG90 Servo Motor).
3. `COLOR_PALETTE`: Default array of 6 distinct hex color strings.
4. `createDefaultState()`: Utility to generate a fresh state object:
   ```js
   {
     activeDevice: "My First Pi",
     devices: {
       "My First Pi": {
         board: "Raspberry Pi 5",
         pins: DEFAULT_PINS,
         components: []
       }
     }
   }
   ```
5. `checkCompatibility(gpioPin, componentPin)`: Pure boolean compatibility validator.
6. `detectConflicts(components, pins)`: Advanced Pin Conflict Engine. Iterates through all attached components and performs:
   - **Over-allocation Check**: Detects multiple component signal pins attached to the exact same non-GROUND/POWER physical pin. Returns conflict objects: `{ type: 'OVER_ALLOCATION', severity: 'error', pinNumber: string, components: Array<{id, name, pinName}>, message: string }`.
   - **Pin Type Mismatch Check**: Validates each component pin against its assigned physical GPIO pin using `checkCompatibility`. Returns conflict objects: `{ type: 'TYPE_MISMATCH', severity: 'error', componentId, componentName, pinName, gpioPin, message: string }`.
   - **Unassigned Pin Warning**: Detects required component pins (e.g. power, ground, data) that remain unassigned. Returns warning objects: `{ type: 'UNASSIGNED_PIN', severity: 'warning', componentId, componentName, pinName, message: string }`.
7. State Mutators / Reducers:
   - `addComponent(state, componentData)`
   - `updateComponent(state, componentId, updatedData)`
   - `removeComponent(state, componentId)`
   - `setActiveDevice(state, deviceName)`
   - `addDevice(state, deviceName, boardType)`
   - `deleteDevice(state, deviceName)`

### 2.2 File 2: `src/ports/alphainventory/inventory-ui.js`
**Role**: Interactive UI Renderer & Event Controller.

**Key UI Features & Components**:
1. **Device Manager Header Bar**:
   - Device selector dropdown (`<select>`).
   - Action buttons: `+ New Device` (prompts for device name), `- Delete Device` (with confirmation modal).
2. **2x20 Color-Coded Pinout Header Grid**:
   - Renders 40 physical pin boxes arranged into 2 vertical columns (Odd pins 1-39 left column, Even pins 2-40 right column).
   - Mode-based color badges & CSS styling (Power = Red/Orange, GND = Black/Gray, I2C = Cyan, SPI = Purple, UART = Blue, PWM = Gold, GPIO = Green).
   - Highlight state: Active attached component connections render colored border halos using the component's assigned color.
   - Selection Mode: When assigning a pin for a component, compatible pins are highlighted in green glow, incompatible pins dimmed in red/translucent.
3. **Pin Inspector Sidebar / Panel**:
   - Displays real-time details of selected GPIO pin: Pin #, Pin Name, Mode, Type, and a list of attached component pins.
4. **Attached Component Manager Panel**:
   - List of attached components with color tag, component name, type, assigned pin counts, and `Edit`/`Delete` buttons.
   - `+ Add Component` modal launcher.
5. **Interactive Component Modal**:
   - Integrated library search filter (`<input id="comp-search">`).
   - Pin assignment row picker: Allows user to click "Assign" / "Change" which enters Pin Selection mode on the 2x20 header grid.
6. **Conflict Alert Panel**:
   - Badge header showing total conflict count (e.g., `0 Conflicts`, `2 Warnings`, `1 Error`).
   - Detailed warning/error cards with specific instructions on how to resolve pin assignment issues.
7. **localStorage Persistence Engine**:
   - Key: `'alphainventory_state'`.
   - Automatically loads saved state on mount; persists on every mutation; provides a `Reset to Default` utility button.

### 2.3 File 3: `src/ports/alphainventory/index.js`
**Role**: Standard Port Contract Entry Point complying with `PortComponentContract`.

**Export Specifications**:
- `metadata`:
  - `id`: `'port-alphainventory'`
  - `name`: `'AlphaInventory'`
  - `category`: `'Hardware & IoT'`
  - `version`: `'1.0.0'`
  - `description`: `'Raspberry Pi 40-Pin GPIO Pinout Visualizer, Component Connection Manager, & Conflict Engine.'`
  - `pythonSourcePath`: `'C:\\Users\\josh6\\workspace\\AlphaInventory\\main.py'`
- `render(container, options)`: Clears target DOM element, initializes UI state, mounts `inventory-ui.js` markup, attaches event handlers, returns destroy handler or metadata.
- `execute(params)`: Headless diagnostic execution method. Loads current state, runs `detectConflicts`, computes statistics (total pins used, free pins, component count, conflict list), and returns a Promise resolving `{ success: boolean, output: string, details: Object }`.
- `destroy()`: Unmounts DOM handlers, clears active selection timers/listeners, ensures clean memory release.

### 2.4 File 4: `src/ports/alphainventory/inventory.test.js`
**Role**: Comprehensive Vitest Unit Test Suite.

**Test Coverage Requirements**:
1. **Pin Registry & Schema Tests**:
   - Verify `DEFAULT_PINS` contains exactly 40 pins with keys `"1"` through `"40"`.
   - Verify pin modes and types match Raspberry Pi specification (e.g. Pin 1 is 3.3V, Pin 6 is GND, Pin 3 is I2C_SDA).
2. **Compatibility Validator Tests**:
   - Verify `checkCompatibility()` returns `true` for exact type match (e.g., `POWER_OUT_5V` vs `POWER_IN_5V`).
   - Verify `checkCompatibility()` handles `POWER_IN_3V3_5V` with both 3.3V and 5V power output pins.
   - Verify `checkCompatibility()` matches `DIGITAL_IO` component pins with `GPIO`, `I2C`, `SPI`, `UART`, `PWM` pins.
   - Verify `checkCompatibility()` returns `false` for `NOT_CONNECTED` or incompatible type pairs (e.g., `PWM` component pin on `GROUND` GPIO pin).
3. **Pin Conflict Detection Tests**:
   - Over-allocation test: Two components assigned to Pin 7 (`GPIO 4`) triggers `OVER_ALLOCATION` error.
   - Type mismatch test: `PWM` component pin assigned to Pin 6 (`GND`) triggers `TYPE_MISMATCH` error.
   - Unassigned pin test: Component with unassigned required pins triggers `UNASSIGNED_PIN` warning.
4. **State Reducer / Mutator Tests**:
   - Test adding, editing, and removing components.
   - Test creating and deleting devices.
5. **Headless Execution Test**:
   - Call `execute()` and assert `{ success: true, output, details }` structure.

---

## 3. Risk Assessment & Verification Plan

1. **Non-Mutation Safety**: `C:\Users\josh6\workspace\AlphaInventory\` must remain completely untouched (read-only). All code will be placed inside `AlphaCoreTech\src\ports\alphainventory\`.
2. **Framework Alignment**: The JS module exports must strictly match `PortComponentContract` defined in `PROJECT.md` and `SCOPE.md`.
3. **Automated Verification**: Run `npx vitest run src/ports/alphainventory/inventory.test.js` to ensure 100% test pass rate upon implementation.
