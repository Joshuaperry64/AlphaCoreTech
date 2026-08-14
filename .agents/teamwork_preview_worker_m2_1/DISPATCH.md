## 2026-08-13T21:31:44-04:00

You are Worker 2 for Milestone 2 (Subroutines Page Cyberpunk UX, Filtering, Search, Auth Integration).
Your working directory is: C:\Users\josh6\workspace\AlphaCoreTech\.agents\teamwork_preview_worker_m2_1

MANDATORY READS:
- ORIGINAL_REQUEST.md: C:\Users\josh6\workspace\AlphaCoreTech\ORIGINAL_REQUEST.md
- Master Project Plan: C:\Users\josh6\workspace\AlphaCoreTech\.agents\teamwork_preview_orchestrator_bulk_1\PROJECT.md
- Codebase & Auth Analysis: C:\Users\josh6\workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_codebase_1\codebase_auth_analysis.md
- Framework & Pattern Analysis: C:\Users\josh6\workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_framework_1\framework_pattern_analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT CONSTRAINTS:
- Strictly read from C:\Users\josh6\workspace. NEVER modify or delete original Python files in C:\Users\josh6\workspace.
- All code changes stay local in AlphaCoreTech. DO NOT run git push or trigger Netlify deployments.

OBJECTIVE:
1. Update and overhaul `src/pages/subroutines.js` (and `subroutines.html` / `src/style.css`) to display all 57 components imported via `getAllPorts()` from `src/ports/index.js`.
2. Implement Cyberpunk / Terminal aesthetic features:
   - CRT scanline overlay, neon accents on deep black background, monospace fonts (`Share Tech Mono`, `Orbitron`).
   - Typing micro-animations and glowing card borders.
3. Implement Directory Organization & Navigation Controls:
   - Real-time search bar filtering across project names, descriptions, source paths, and categories.
   - Alphabetical sorting toggle (A-Z, Z-A).
   - Domain / Topic category filter tabs (Hardware, AI/ML, Security, Mobile, Audio, System, Network, Simulation, Data, Utilities, Crypto, Reverse Engineering, All).
   - Timeline / Recent view toggle displaying newest ports at top.
4. Implement Fullscreen Takeover & Return Navigation:
   - Launching a subroutine triggers a smooth, fullscreen takeover transition into `#workspace-panel`.
   - Every subroutine workspace MUST include a clearly visible `✕ CLOSE WORKSPACE` return button on top bar that invokes `activePortInstance.destroy()`, clears container, and seamlessly transitions back to main subroutines directory.
5. Implement Auth & Security Protection:
   - Hook into existing pincode (`src/components/pinpad.js`) and profile selection system (`Architect`, `DoeBoy`, `J. P.`, `Fisherman`).
   - Protect subroutines page and loaded components behind profile authentication clearance.
6. Verify implementation via Vitest (`npx vitest run src/pages/subroutines_m2_verification.test.js`) and `npm run build`.
7. Write completion report to `C:\Users\josh6\workspace\AlphaCoreTech\.agents\teamwork_preview_worker_m2_1\handoff.md`. Include test and build outputs.
