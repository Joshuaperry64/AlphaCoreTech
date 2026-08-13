## 2026-08-12T20:34:20Z

Task dispatch received for Milestone M2: Subroutines Hub Page Overhaul & Netlify Compatibility.

OBJECTIVE & DELIVERABLES:
1. Overhaul `src/pages/subroutines.js`:
   - Import `getAllPorts` from `../ports/index.js`.
   - Build a 3-tier interactive hub:
     - Top Bar:
       - Category filter dropdown `#sub-filter-cat` with options: `ALL`, `CORE KERNEL`, `PORTED PYTHON PROJECTS`, `NEURAL`, `CRYPTO`, `PERF`, `SEC`, `DATA`, `HARDWARE`, `UTILITIES`.
       - Search input field `#sub-search-ipt` (filtering both kernel routines and ported projects by ID, name, description, category).
       - Batch control buttons: `#btn-run-all` (`▶ EXECUTE ALL`), `#btn-benchmark` (`⚡ RUN BENCHMARK`), `#btn-clear-sub-log` (`🗑 CLEAR LOGS`).
       - Autoscroll toggle: `#chk-autoscroll`.
     - Section A: Core Kernel Subroutines (existing 8 synthetic routines `SUB-01` to `SUB-08`).
     - Section B: Web-Ported Python Projects:
       - Load ports dynamically via `getAllPorts()`.
       - Render cards for `AlphaInventory` and `AlphaRequirements` showing metadata (ID, category, pythonSourcePath, version, description).
       - Action buttons on port cards:
         - `🖥 LAUNCH WORKSPACE` (or `LAUNCH INTERACTIVE WORKSPACE`): Mounts `port.render(workspaceContainer)` directly into the interactive workspace panel (`#workspace-panel` or modal container), streaming execution/UI logs to `// EXECUTION_LOG` (`#sub-console-output`).
         - `▶ QUICK EXECUTE`: Calls `port.execute({})` programmatically and logs results to `// EXECUTION_LOG`.
         - `🔍 TEST / VERIFY`: Runs headless execution / verification.
     - Interactive Workspace View / Modal Container:
       - Dedicated workspace panel container mounting the active port's UI when "LAUNCH WORKSPACE" is clicked.
       - Include header bar with port title and close button.
     - Encapsulation & Lifecycle:
       - Maintain active port instance variable (e.g. `activePortInstance`).
       - When switching tabs, closing workspace panel, or mounting a new port workspace, invoke `activePortInstance.destroy()` to clean up DOM event listeners and active state.
2. Netlify Compatibility:
   - Verify SPA hash routing (`#/subroutines`) is fully intact.
   - Create `public/_redirects` containing `/* /index.html 200` to support SPA routing when hosted on Netlify.
3. Verification:
   - Run `npm run build` to confirm Vite build succeeds and generates `dist/_redirects`.
   - Run `npm test` to confirm all Vitest unit test suites pass.
