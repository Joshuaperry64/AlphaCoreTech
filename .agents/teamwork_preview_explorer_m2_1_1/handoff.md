# Handoff Report: Milestone M2 Subroutines Hub Page Overhaul & Netlify Compatibility

## 1. Observation

Direct code observations from codebase inspection:
- **`src/pages/subroutines.js`**:
  - `lines 9-18`: Synthetic subroutines array `SUBROUTINES` containing 8 items (`SUB-01` to `SUB-08`) across categories `NEURAL`, `CRYPTO`, `PERF`, `SEC`, `DATA`.
  - `lines 30-45`: Quick Action Control Bar containing `#btn-run-all`, `#btn-benchmark`, `#btn-clear-sub-log`, and `#chk-autoscroll`.
  - `lines 54-61`: Category filter dropdown `#sub-filter-cat` hardcoded to options: `ALL`, `NEURAL`, `CRYPTO`, `PERF`, `SEC`, `DATA`.
  - `lines 66-93`: Panel layout containing `// EXECUTION_LOG` (`#sub-console-output`) and manual command form `#frm-manual-cmd`.
  - `lines 102-140`: `renderSubroutines(cat)` function rendering only synthetic kernel routines.
  - **No import** of `src/ports/index.js` or `getAllPorts()`. No search input field (`#sub-search-ipt`). No workspace mounting panel for interactive web ports.
- **`src/ports/index.js`**:
  - `line 29`: `REGISTERED_PORTS` array containing validated port objects.
  - `line 36`: `getAllPorts()` returns `REGISTERED_PORTS`.
  - `line 47`: `getPortById(id)` looks up port by full ID or short name.
- **`src/ports/port-contract.js`**:
  - `lines 16-29`: `REQUIRED_STRING_PROPERTIES` (`id`, `name`, `category`, `version`, `description`, `pythonSourcePath`) and `REQUIRED_METHOD_PROPERTIES` (`render`, `execute`, `destroy`).
- **`src/ports/alphainventory/index.js`**:
  - `lines 9-14`: Port contract properties: `id: 'port-alphainventory'`, `name: 'AlphaInventory'`, `category: 'Hardware'`, `pythonSourcePath: 'AlphaInventory/main.py'`.
  - `lines 25-30`: `render(container, options)` mounts interactive GPIO pinout UI.
  - `lines 42-62`: `execute(params)` runs headless conflict detection.
  - `lines 68-72`: `destroy()` destroys active instance.
- **`src/ports/alpharequirements/index.js`**:
  - `lines 17-22`: Port contract properties: `id: 'port-alpharequirements'`, `name: 'AlphaRequirements'`, `category: 'Utilities'`, `pythonSourcePath: 'AlphaRequirements/app/scanner.py'`.
  - `lines 33-38`: `render(container, options)` mounts interactive scanner UI.
  - `lines 50-63`: `execute(params)` runs headless spec parsing & deduplication.
  - `lines 68-72`: `destroy()` cleans up active UI instance.
- **`public/` directory**:
  - `find_by_name` search for `*redirects*` returned 0 results. `public/_redirects` is currently missing.

---

## 2. Logic Chain

1. **Missing Port Integration (Ref: Obs `src/pages/subroutines.js` lines 9-18 vs `src/ports/index.js` line 36)**:
   - `src/pages/subroutines.js` currently only knows about the 8 synthetic subroutines.
   - Requirement R1/M2 mandates that `subroutines.js` serves as an interactive directory for web-ported Python projects.
   - Therefore, `subroutines.js` must import `getAllPorts()` from `../ports/index.js` and combine synthetic subroutines (Section A) with registered web ports (Section B).

2. **Top Bar & Search/Filter Gaps (Ref: Obs `src/pages/subroutines.js` lines 30-61)**:
   - The current category filter dropdown `#sub-filter-cat` only contains 5 synthetic categories (`NEURAL`, `CRYPTO`, `PERF`, `SEC`, `DATA`).
   - It does not contain `CORE KERNEL`, `PORTED PYTHON PROJECTS`, `HARDWARE`, or `UTILITIES`.
   - Furthermore, there is no text search input field.
   - Adding a search input (`#sub-search-ipt`) and expanding `#sub-filter-cat` dropdown options enables comprehensive filtering across both synthetic routines and web-ported projects.

3. **Workspace Mounting & Lifecycle Management (Ref: Obs `src/ports/alphainventory/index.js` & `src/ports/alpharequirements/index.js`)**:
   - Both ported projects implement contract functions `render(container)`, `execute(params)`, and `destroy()`.
   - Currently, `subroutines.js` has no workspace panel to display the interactive DOM rendered by `port.render(container)`.
   - Adding a `🖥 LAUNCH WORKSPACE` button on each port card will mount `port.render()` into a dedicated `#workspace-panel` container.
   - To prevent memory leaks and event listener accumulation, `subroutines.js` must maintain reference to the active port instance and call `port.destroy()` whenever switching active ports or closing the workspace panel.
   - Adding a `▶ QUICK EXECUTE` button will call `await port.execute({})` headlessly and stream output to `// EXECUTION_LOG`.

4. **Netlify SPA Routing Compatibility (Ref: Obs `public/` missing `_redirects`)**:
   - Netlify requires SPA routing fallback configuration so direct URL requests or hash reloads render `index.html`.
   - Creating `public/_redirects` with `/* /index.html 200` ensures 100% Netlify compatibility.

---

## 3. Caveats

No caveats.

---

## 4. Conclusion

`src/pages/subroutines.js` must be updated with the following architectural modifications:
1. **Import Framework Ports**: Import `getAllPorts` and `getPortById` from `../ports/index.js`.
2. **Top Bar Controls**: Add search input (`#sub-search-ipt`), expanded category dropdown (`ALL`, `CORE KERNEL`, `PORTED PYTHON PROJECTS`, `HARDWARE`, `UTILITIES`, `NEURAL`, `CRYPTO`, `PERF`, `SEC`, `DATA`), batch controls (`▶ EXECUTE ALL`, `⚡ RUN BENCHMARK`, `🗑 CLEAR LOGS`), and autoscroll toggle.
3. **Dual Section Hub Layout**:
   - **Section A**: Core Kernel Subroutines (8 synthetic routines with `▶ EXECUTE` and `🔍 TEST`).
   - **Section B**: Web-Ported Python Projects (`AlphaInventory` and `AlphaRequirements` cards with metadata badges, `🖥 LAUNCH WORKSPACE`, `▶ QUICK EXECUTE`, `🔍 TEST / VERIFY`).
4. **Interactive Workspace Panel**: Dedicated container mounting `port.render(container)` when launched, complete with header bar, close action, and proper `port.destroy()` lifecycle cleanup.
5. **Netlify Redirects**: Create `public/_redirects` containing `/* /index.html 200`.

---

## 5. Verification Method

1. **File Inspection**:
   - Verify `src/pages/subroutines.js` imports `getAllPorts()` from `../ports/index.js`.
   - Verify `public/_redirects` exists and contains `/* /index.html 200`.
2. **DOM & Lifecycle Verification**:
   - Inspect `#workspace-panel` rendering when clicking `🖥 LAUNCH WORKSPACE` on `AlphaInventory` or `AlphaRequirements`.
   - Verify `port.destroy()` is called when switching or closing workspace.
3. **Execution Verification**:
   - Verify `▶ QUICK EXECUTE` streams headless execution output to `// EXECUTION_LOG`.
   - Run verification suite once implemented in M3 (`node verify_subroutines.js`).

