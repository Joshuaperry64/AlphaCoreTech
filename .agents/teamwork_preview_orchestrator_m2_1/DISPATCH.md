## 2026-08-12T16:28:34Z

You are a sub-orchestrator subagent for Milestone M2: Subroutines Hub Page Overhaul & Netlify Compatibility.
Working directory: C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_orchestrator_m2_1

Pass-as-is path to ORIGINAL_REQUEST.md: C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md
Pass-as-is path to PROJECT.md: C:\Users\josh6\Workspace\AlphaCoreTech\PROJECT.md

OBJECTIVE:
Execute Milestone M2: Overhaul `src/pages/subroutines.js` into an interactive directory indexing core subroutines and web-ported Python projects from `src/ports/index.js`, and ensure 100% Netlify hosting compatibility.

SCOPE & DELIVERABLES:
1. Overhaul `src/pages/subroutines.js`:
   - Import `getAllPorts` from `../ports/index.js`.
   - Build a 3-tier interactive hub:
     - Top Bar: Category filter (`ALL`, `CORE KERNEL`, `PORTED PYTHON PROJECTS`, `NEURAL`, `SECURITY`, etc.), Search input, Batch controls (`▶ EXECUTE ALL`, `⚡ RUN BENCHMARK`, `🗑 CLEAR LOGS`), Autoscroll toggle.
     - Section A: Core Kernel Subroutines (existing 8 synthetic routines).
     - Section B: Web-Ported Python Projects (AlphaInventory and AlphaRequirements loaded from `getAllPorts()`).
     - Interactive Workspace View / Modal Container: Clicking "LAUNCH INTERACTIVE WORKSPACE" on any ported project card mounts its `render(workspaceContainer)` element directly into the workspace panel, streaming execution logs to `// EXECUTION_LOG`.
     - Clicking "QUICK EXECUTE" calls `port.execute({})` programmatically.
   - Encapsulation & Lifecycle: Cleanup previous port UI on tab change or workspace switch via `port.destroy()`.
2. Netlify Compatibility:
   - Ensure SPA hash routing (`#/subroutines`) is fully intact.
   - Create `public/_redirects` containing `/* /index.html 200` to support SPA routing when hosted on Netlify.
3. Run iteration loop: Worker -> Reviewer -> Challenger -> Auditor -> Gate evaluation.
   - MANDATORY INTEGRITY WARNING in Worker dispatch: "DO NOT CHEAT. All implementations must be genuine... Forensic Auditor will verify."

COMPLETION:
When Milestone M2 passes all gate criteria (build passes, unit/E2E tests pass, reviewers approve, challenger verifies, auditor clean), write handoff.md and send a completion message back to parent orchestrator.
