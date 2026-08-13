# AlphaCoreTech Codebase & Authentication Analysis Report

**Date**: 2026-08-12  
**Target Repository**: `C:\Users\josh6\workspace\AlphaCoreTech`  
**Explorer**: Explorer 2 (Codebase & Auth Explorer)  
**Status**: Completed  

---

## 1. Directory Structure, Build Tools, Dependencies & Scripts

### 1.1 Repository Directory Structure
```
C:\Users\josh6\workspace\AlphaCoreTech/
├── .agents/                        # Agent metadata & working directories
├── .vscode/                        # VSCode workspace configurations
├── dist/                           # Production build output directory (Vite)
├── netlify/
│   └── functions/                  # Netlify serverless function endpoints (api.js)
├── public/
│   ├── _redirects                  # Netlify SPA routing rewrite rules
│   └── Images/                     # Public branding assets (ALPHA-MINIMAL.png, etc.)
├── src/
│   ├── components/                 # Shared UI & utility components
│   │   ├── audio.js                # Ambient audio stream player & controls
│   │   ├── command-palette.js      # Global quick action command palette
│   │   ├── db_sync.js              # Netlify Blob / server synchronization engine
│   │   ├── intro.js                # System boot & matrix intro sequence
│   │   ├── loading.js              # System boot overlay component
│   │   ├── logger.js               # Event logger & audit log emitter
│   │   ├── matrix-rain.js          # Canvas digital rain renderer & Eco mode
│   │   ├── modal.js                # Reusable dialog modal component
│   │   ├── neural-canvas.js        # Interactive visual canvas
│   │   ├── pinpad.js               # PIN pad authentication & profile selector
│   │   ├── sidebar.js              # Responsive Cyberpunk sidebar navigation
│   │   ├── telemetry.js            # System metrics & telemetry tracker
│   │   ├── theme-switcher.js       # Color accent & theme switcher
│   │   ├── toast.js                # Toast notification system
│   │   └── utils.js                # DOM creation & utility helpers
│   ├── pages/                      # SPA Page Views
│   │   ├── admin.js                # Admin panel & PIN management
│   │   ├── aimodals.js             # AI Modal execution interface
│   │   ├── analytics.js            # System analytics dashboard
│   │   ├── changelog.js            # Release notes & changelog
│   │   ├── cognitive.js            # Cognitive uplink core
│   │   ├── creator.js              # Creator auth profile view
│   │   ├── diagnostics.js          # Hardware & system diagnostics
│   │   ├── logs.js                 # System log event viewer
│   │   ├── lore.js                 # Narrative & system background
│   │   ├── mainframe.js            # Mainframe OS integration page
│   │   ├── network.js              # Network matrix status
│   │   ├── overview.js             # Command hub overview dashboard
│   │   ├── promptlab.js            # Prompt engineering laboratory
│   │   ├── research.js             # Research center & document bank
│   │   ├── subroutines.js          # Subroutines Console & Ported Projects Hub
│   │   ├── terminal.js             # Web CLI shell interface
│   │   ├── vault.js                # Encrypted classified vault
│   │   └── vision.js               # Neural vision processor
│   ├── ports/                      # Web-Ported Python Project Framework
│   │   ├── index.js                # Port registry & module export hub
│   │   ├── port-contract.js        # Contract validator & interface specs
│   │   ├── alphainventory/         # Ported AlphaInventory project module
│   │   └── alpharequirements/      # Ported AlphaRequirements project module
│   ├── main.js                     # SPA bootstrap, global auth wall, router
│   ├── router.js                   # Route mapping utilities
│   └── style.css                   # Consolidated Cyberpunk theme stylesheet (73KB)
├── tests/                          # Vitest test suites
├── index.html                      # Primary HTML entry point for Vite SPA
├── netlify.toml                    # Netlify deployment configuration
├── package.json                    # Package manifest & dependencies
├── server.js                       # Express / serverless-http local API proxy
├── verify_subroutines.js           # Automated Node verification script
└── vite.config.js                  # Vite bundler configuration
```

### 1.2 Build Toolchain & Configuration
* **Bundler**: Vite `^6.0.0` (version 6.4.3 active).
* **Configuration (`vite.config.js`)**:
  ```javascript
  import { defineConfig } from 'vite';

  export default defineConfig({
    plugins: [],
    root: '.',
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      host: true
    }
  });
  ```
* **Build Target**: Compiles all ES modules and assets into single static HTML/CSS/JS bundles in `dist/`. Build completes in ~1.5 seconds.

### 1.3 `package.json` Dependencies & Scripts
```json
{
  "name": "alphacore-tech",
  "private": true,
  "version": "4.0.0",
  "type": "module",
  "scripts": {
    "dev": "node node_modules/vite/bin/vite.js",
    "build": "node node_modules/vite/bin/vite.js build",
    "preview": "node node_modules/vite/bin/vite.js preview",
    "start": "node server.js",
    "test": "vitest run"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^4.1.10",
    "jsdom": "^29.1.1",
    "vite": "^6.0.0",
    "vitest": "^4.1.10"
  },
  "dependencies": {
    "@netlify/blobs": "^10.7.9",
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "node-fetch": "^2.7.0",
    "serverless-http": "^4.0.0"
  }
}
```

---

## 2. Subroutines Page Architecture & Styling System

### 2.1 Current Implementation of `src/pages/subroutines.js`
`SubroutinesPage` serves as an interactive hub featuring two main project sections and full execution control:

1. **Header & Control Bar**:
   * Title with glitch animation: `// SUBROUTINE_CONSOLE`.
   * Real-time search bar (`#sub-search-ipt`) filtering across ID, name, description, category, and source path.
   * Category Dropdown (`#sub-filter-cat`): `ALL`, `CORE KERNEL`, `PORTED PYTHON PROJECTS`, `NEURAL`, `CRYPTO`, `PERF`, `SEC`, `DATA`, `HARDWARE`, `UTILITIES`.
   * Quick action buttons: `▶ EXECUTE ALL`, `⚡ RUN BENCHMARK`, `🗑 CLEAR LOGS`.
   * Autoscroll toggle for execution log console.

2. **Interactive Workspace Container (`#workspace-panel`)**:
   * Mounts rich, full-screen/interactive UI for selected ported Python projects.
   * Lifecycle management: Calls `port.render(workspaceContainer, options)` on mount, and `port.destroy()` when closed or switching projects.

3. **Directory Structure (Grid Layout)**:
   * **Section A (Core Kernel Subroutines)**: Houses internal JavaScript system functions (e.g. `SYNAPSE_PRUNING_V4`, `QUANTUM_ENTANGLEMENT_SYNC`, `HEURISTIC_OVERDRIVE`, `LOG_PURGE_AND_ROTATE`).
   * **Section B (Web-Ported Python Projects)**: Dynamically rendered from `getAllPorts()` in `src/ports/index.js`. Displays name, category badge, version tag, original Python source path, description, and three action controls (`🖥 LAUNCH WORKSPACE`, `▶ QUICK EXECUTE`, `🔍 TEST / VERIFY`).

4. **Execution Console & Manual CLI Input**:
   * Real-time autoscrolling terminal log (`#sub-console-output`).
   * Command dispatch input (`#ipt-manual-cmd`) for executing subroutines or utilities via command strings.

### 2.2 Web Porting Framework & Registry
* **Contract Specification (`src/ports/port-contract.js`)**:
  * Required string fields: `id`, `name`, `category`, `version`, `description`, `pythonSourcePath`.
  * Required method fields:
    * `render(container, options)`: Renders interactive UI into target element.
    * `execute(params)`: Headless execution returning `Promise<{ success: boolean, output: string, details?: Object }>`.
    * `destroy()`: Cleans up DOM event listeners, canvas loops, or timers.
* **Central Registry (`src/ports/index.js`)**:
  * Imports candidate ports, runs `validatePortContract(port)`, and exports `getAllPorts()` and `getPortById(id)`.

### 2.3 Cyberpunk UI & Styling System
* **Theme Tokens (`src/style.css`)**:
  ```css
  :root {
    --blue:               #00b8ff;
    --blue-dim:           #0077aa;
    --blue-dark:          #001a2e;
    --blue-glow:          rgba(0, 184, 255, 0.15);
    --accent:             #ff003c;
    --accent-dim:         #8b0020;
    --accent-glow:        rgba(255, 0, 60, 0.2);
    --node-green:         #00ff00;
    --node-glow:          rgba(0, 255, 0, 0.15);
    --bg:                 #030305;
    --panel-bg:           rgba(4,6,12,0.92);
    --border:             rgba(0, 184, 255, 0.12);
    --font-hud:           'Orbitron', sans-serif;
    --font-mono:          'Share Tech Mono', monospace;
  }
  ```
* **Visual Effects**:
  * **Matrix Rain**: Background canvas animation (`#matrix-canvas`) running green/cyan katakana and hex code drops.
  * **CRT Scanline Overlay**: Fixed `.crt-overlay` with repeating linear gradients and scanline flicker animations.
  * **Page Transitions**: Glitch-fade animation (`.page-transition`) with contrast/brightness distortion during route changes.

---

## 3. Existing Authentication & Security System

### 3.1 Architecture Overview (`src/components/pinpad.js`)
AlphaCoreTech relies on a profile-based PIN authentication system:

1. **User Profiles & Role Clearances**:
   Default profiles stored in `localStorage` (`alphacore_pins`):
   * `Architect` (PIN: `672167566`, Roles: `['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics']`)
   * `DoeBoy` (PIN: `6969`, Roles: `['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics']`)
   * `J. P.` (PIN: `20022005`, Roles: `['aimodals', 'generate']`)
   * `Fisherman` (PIN: `1990`, Roles: `['aimodals', 'generate']`)

2. **Session Storage Authentication State**:
   Upon successful PIN validation via `validatePin()`:
   * `sessionStorage.setItem('current_profile', profileLabel)`
   * `sessionStorage.setItem('current_pin', pinVal)`
   * `sessionStorage.setItem('<authKey>', '1')` (e.g. `global_authenticated`, `admin_authenticated`, `vault_authenticated`)
   * `sessionStorage.setItem('<role>_authenticated', '1')`

3. **Global Login Wall (`src/main.js`)**:
   `main.js` checks `sessionStorage.getItem('current_profile')` inside `renderRoute()`. If missing, navigation sidebar/topbar are hidden and `buildPinPad()` is rendered to force login before accessing any page.

4. **Protected Route Wrapper (`requireAuth`)**:
   Pages use `requireAuth(container, options)` to restrict entry:
   ```javascript
   requireAuth(container, {
     authKey: 'subroutines_authenticated',
     requiredRole: 'generate', // or 'subroutines'
     onSuccess: () => renderPageUI(),
     title: 'ALPHACORE // SUBROUTINES_LOCKOUT',
     subtitle: 'SECURITY CLEARANCE PIN REQUIRED',
     icon: '⚡'
   });
   ```

### 3.2 How Subroutines Page & Components Can Hook Into Auth
1. **Page-Level Protection**:
   `SubroutinesPage` can invoke `requireAuth` checking `subroutines_authenticated` or profile role (e.g. `generate` or `admin`).
2. **Subroutine / Component-Level Protection**:
   When launching specific workspaces or executing sensitive actions (e.g., executing high-privilege hardware subroutines), components can inspect `sessionStorage.getItem('current_profile')` or trigger a `buildPinPad` popup modal if higher authorization is required.

---

## 4. Netlify Deployment, Client-Side Routing & Operating Constraints

### 4.1 Client-Side Routing Architecture
* **Router mechanism**: Hash-based single page application routing (`window.location.hash`).
* **Route changes**: Managed via `window.addEventListener('hashchange', renderRoute)` in `src/main.js`.
* **SPA Direct-URL Redirects**: `public/_redirects` contains:
  ```
  /* /index.html 200
  ```
  This ensures deep linking or refreshing URLs on Netlify serves `index.html` with a 200 status code rather than 404.

### 4.2 Netlify Build Configuration (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200
```

### 4.3 Key Development & Deployment Constraints
1. **CRITICAL: ZERO GIT PUSH**:
   The GitHub repository is connected to Netlify automated deployments. Executing `git push` triggers automatic production builds on Netlify and consumes hosting quota. **No `git push` commands may be run under any circumstances.**
2. **Local-Only Testing**:
   All builds and verification tests must be conducted locally using:
   * Build test: `npm run build` (outputs to `dist/`)
   * Verification script: `node verify_subroutines.js`
   * Dev server: `npm run dev`
3. **Safe File I/O**:
   Original Python files in `C:\Users\josh6\workspace\<project>` are strictly read-only. All web components are created inside `C:\Users\josh6\workspace\AlphaCoreTech\src\ports\`.

---

## 5. Verification Summary

* **Build Test (`npm run build`)**: Passed cleanly (1.53s, 46 modules transformed).
* **Automated Verification (`node verify_subroutines.js`)**: 34/34 checks passed (100% success rate).
* **DOM & Script Integration**: Confirmed full functionality across JSDOM and local Node runtime.
