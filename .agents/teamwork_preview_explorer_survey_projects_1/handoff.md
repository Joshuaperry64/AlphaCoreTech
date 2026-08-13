# Handoff Report: Python Projects Survey & Web Port Selection

**Working Directory**: `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_projects_1`  
**Target Handoff Path**: `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_projects_1\handoff.md`  
**Date**: 2026-08-10  
**Agent Role**: `teamwork_preview_explorer`  

---

## 1. Observation

A full read-only survey of `C:\Users\josh6\workspace` was executed using directory listing and file search tools (`list_dir`, `find_by_name`, `view_file`).

### 1.1 Discovered Workspace Inventory (Excluding `AlphaCoreTech`)
Across the workspace (56 top-level directories, 4 root files), 132 Python files were located across numerous projects:

| Project Directory / File | Key Python Files | Size / Complexity | Key Dependencies | Primary Purpose & Nature |
|---|---|---|---|---|
| **AlphaInventory** | `main.py` | 161 lines (~7.6 KB) | Flask (web wrapper only), `json`, `os` | Raspberry Pi 40-pin GPIO header pinout map, device configuration, and hardware component management. |
| **AlphaRequirements** | `app/scanner.py`, `app/app.py`, `app/cli.py`, `app/gui.py` | `scanner.py`: 193 lines (~5.8 KB) | `packaging` (standard spec parsing), `pathlib`, `dataclasses` | Python `requirements.txt` parser, deduplicator, order-preserving spec normalizer, and package modernization analyzer. |
| **GitVisibility.py** | `GitVisibility.py` | 140 lines (~4.9 KB) | `requests`, `questionary`, `rich`, `subprocess` (git CLI) | CLI tool to toggle GitHub repository public/private visibility via GitHub REST API. Requires live GitHub OAuth tokens and local `.git` repos. |
| **alphalimiter** | `app.py`, `network_manager.py`, `rpi_agent.py` | `app.py`: 1104 lines (~51.5 KB) | `customtkinter`, `plyer`, `paramiko` (SSH) | Desktop GUI network bandwidth limiter for OpenWrt routers and RPi5 subnets. Heavy local hardware & SSH dependencies. |
| **AlphaPocket** | `main.py`, `alpha_app.py` | `main.py`: 810 lines (~34.2 KB) | `PySide6`, `cv2`, `speech_recognition`, `gtts`, `pygame`, `llama_cpp`, `google.generativeai` | Multimodal AI assistant UI with camera feed, TTS, local Gemma LLM (`.gguf` weights), and GPIO hardware triggers. |
| **AlphaAssistant** | `app/main.py`, `app/ui/app.py`, +50 files | >5,000 lines | `PySide6`, `cv2`, SQLite, network sockets | Cyberpunk AI Assistant desktop HUD with local database, web servers, and system control utilities. |
| **AudioAlpha** | `main.py`, `dedup_engine.py`, `music_organizer.py` | ~1,200 lines across modules | `hashlib`, `pathlib`, `spotdl` CLI | Local audio collection manager, CD burner verifier, and SHA-256 audio deduplication engine. |
| **AlphaSync** | `main.py`, `client.py`, `server.py`, `encryption.py` | ~800 lines | Sockets, cryptography, SQLite | P2P encrypted file sync and network messaging client/server. |
| **AlphaVoice** | `main.py`, `voice_cloner.py`, `voice_inference.py` | ~600 lines | `torch`, audio ML models | Voice cloning and audio TTS inference pipeline. |

---

## 2. Logic Chain

1. **Filtering Out Heavy Native & System Dependencies**:
   - Projects such as `alphalimiter`, `AlphaPocket`, `AlphaAssistant`, `AudioAlpha`, and `GitVisibility.py` depend heavily on desktop GUI frameworks (`PySide6`, `CustomTkinter`), local native binaries (`git`, `spotdl`), local hardware access (webcams, SSH sockets, GPIO hardware pins, `.gguf` neural network weights), or active external API tokens.
   - These are unsuitable for standard, pure client-side web component proof-of-concepts in React/TypeScript without complex backend proxy infrastructure.

2. **Evaluating Candidate Self-Contained Projects**:
   - **AlphaInventory** (`main.py`, lines 10–51, 80–148): The core logic is a rich, structured dataset mapping the 40 Raspberry Pi GPIO pins (modes `POWER`, `I2C`, `GROUND`, `GPIO`, `UART`, `SPI`, and detailed types like `POWER_OUT_3V3`, `PWM`, `I2C_SDA`), coupled with stateful component-to-pin mapping logic. Although wrapped in Flask API endpoints in Python, the logic is 100% pure data manipulation that translates cleanly into an interactive frontend React/TS component.
   - **AlphaRequirements** (`app/scanner.py`, lines 78–181): Contains clean, self-contained parsing algorithms:
     - `parse_requirements_text(text: str)` (lines 78–92): Line normalization, comment stripping (lines starting with `#` or inline `#`), directive exclusion (`-r`, `-c`).
     - `dedupe_specs(specs: Iterable[str])` (lines 94–107): Order-preserving deduplication set tracking.
     - `_detect_modernization(...)` (lines 143–181): Package deprecation flags (e.g. `pkg-resources` $\rightarrow$ `importlib.metadata`).
     - This logic runs instantly client-side without any backend server requirements.

3. **Conclusion on Selection**:
   - **Project 1**: `AlphaInventory` (Raspberry Pi Pinout & Hardware Component Inspector)
   - **Project 2**: `AlphaRequirements` (Python Requirements Parser, Deduplicator & Modernization Analyzer)

---

## 3. Caveats

- **No File Modifications**: In strict adherence to scope boundaries, zero files in `C:\Users\josh6\workspace` were modified, created, or moved.
- **Python vs TS Runtime Differences**:
  - `AlphaRequirements` uses the Python `packaging.requirements.Requirement` module for canonical package name parsing. In TypeScript, package name lowercasing/hyphen normalization (`package-name` vs `package_name`) can be implemented via regex without external npm dependencies.
  - `AlphaInventory` originally relied on `setup.json` file storage via Flask. In the web port, browser state will be persisted in `localStorage`.

---

## 4. Conclusion & Detailed Breakdown of Selected Projects

### Selected Project 1: `AlphaInventory`
- **Location**: `C:\Users\josh6\workspace\AlphaInventory\main.py`
- **Purpose**: Interactive Raspberry Pi 40-pin GPIO pinout diagram & electronic component hardware simulator.
- **Inputs**:
  - Selected pin number (1 to 40).
  - Device profile configuration (device name, board type).
  - Component specification (component name, category/type, pin attachment assignments).
- **Outputs**:
  - Visual 2x20 header pin grid with color-coded pin modes (Power 3.3V/5V, Ground, I2C, SPI, UART, PWM, Digital I/O).
  - Detailed pin property inspector (Pin number, physical label, signal mode, electrical type).
  - Active attached components inventory list.
  - Real-time pin conflict alerts (e.g. attempting to assign two output components to the same digital GPIO pin).
- **Logic Flow & Key Data Structures**:
  - `DEFAULT_PINS` (`main.py:10-51`): Dictionary mapping string keys `"1"` through `"40"` to `{ "name": str, "mode": str, "type": str }`.
  - Component structure: `{ "id": int, "name": str, "type": str, "pins": list[int] }`.
  - Pin Conflict Engine: Iterates over all active components, collects assigned pin numbers, and checks for overlaps or invalid modes (e.g., trying to use Ground as a GPIO data pin).
- **Edge Cases**:
  - Attempting to attach data pins to physical Power/GND pins (Pins 1, 2, 4, 6, 9, 14, 17, 20, 25, 30, 34, 39).
  - Deleting a device when only one device remains in state.

### Selected Project 2: `AlphaRequirements`
- **Location**: `C:\Users\josh6\workspace\AlphaRequirements\app\scanner.py`
- **Purpose**: Python package dependency text parser, duplicate eliminator, and modernization checker.
- **Inputs**:
  - Raw string text content of a `requirements.txt` file (pasted into a web text area or loaded from sample presets).
- **Outputs**:
  - Cleaned & normalized specification list.
  - Deduplicated specification list (preserving original appearance order).
  - Dependency statistics summary (Total lines, Valid specs, Duplicate count, Reduction %).
  - Modernization warnings list (e.g. identifying deprecated `pkg-resources` or pinned `setuptools` versions).
- **Logic Flow**:
  1. `parse_requirements_text` (`scanner.py:78-92`): Splits input text into lines, trims whitespace, filters out empty lines, comments (`#`), inline comments (`package # comment`), and requirement include flags (`-r`, `-c`).
  2. `dedupe_specs` (`scanner.py:94-107`): Maintains an ordered list and a `seen` set to remove duplicate package specs while retaining the first occurrence.
  3. `_detect_modernization` (`scanner.py:143-181`): Checks package names against modernization mappings (e.g., flagging `pkg-resources` to switch to `importlib.metadata`).
- **Edge Cases**:
  - Distinguishing inline comments (`pkg # comment`) from URLs with hash fragments (`git+https://...#egg=pkg`).
  - Varying casing (`Requests==2.31.0` vs `requests`).

---

## 5. Web Porting Recommendations for `AlphaCoreTech`

To establish a clean, standard framework for ported subroutines in AlphaCoreTech (`src/ports/`):

1. **Directory Structure in `AlphaCoreTech`**:
   ```
   src/
   ├── ports/
   │   ├── AlphaInventoryPort.tsx      # Ported Raspberry Pi Pinout & Component Manager
   │   ├── AlphaRequirementsPort.tsx   # Ported Requirements Parser & Deduplicator
   │   └── index.ts                    # Export registry for ports
   ```

2. **Component Implementation Guidelines**:
   - **`AlphaInventoryPort.tsx`**:
     - Render an interactive 2x20 header grid reflecting Raspberry Pi 5 / Pi 4 physical pin layout.
     - Color-code pin badges: Red (`Power 5V/3.3V`), Black (`GND`), Blue (`I2C`), Green (`GPIO`), Yellow (`UART`), Purple (`SPI`).
     - Clicking a pin opens a details sidebar card.
     - Include a component list drawer where users can add pre-configured sensors/modules (e.g. DHT22 Temp Sensor, OLED Display, LED, Servo) and select target pins.
     - Provide a "Detect Conflicts" action button that runs pin validation logic client-side.
   - **`AlphaRequirementsPort.tsx`**:
     - Dual-pane layout: Left pane for raw `requirements.txt` textarea input with "Load Sample" buttons; Right pane for instant analysis results.
     - Metric cards: Total Specs, Unique Specs, Duplicates Removed, Warnings.
     - Action buttons: "Copy Deduplicated output", "Download `.txt`", "Toggle Modernization Suggestions".

3. **Integration into Subroutines Page**:
   - Update `src/pages/Subroutines.tsx` (or equivalent page route) to feature interactive card tabs or modal views embedding `AlphaInventoryPort` and `AlphaRequirementsPort`.

---

## 6. Verification Method

- **Files Inspected**:
  - `C:\Users\josh6\workspace\AlphaInventory\main.py`
  - `C:\Users\josh6\workspace\AlphaRequirements\app\scanner.py`
  - `C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md`
- **Verification Commands**:
  - Verify `handoff.md` exists and is readable: `view_file` at `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_projects_1\handoff.md`.
  - Invalidation conditions: If source code in `C:\Users\josh6\workspace` was altered (must remain unchanged), or if selected projects have unresolvable external server dependencies.
