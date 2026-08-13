# Original User Request

## 2026-08-10T23:29:52Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Delegate to teamwork_preview and monitor progress

Overhaul the 'subroutines' page in the AlphaCoreTech website to act as an evolving, interactive directory of web-ported Python projects from the user's workspace. The agent team will establish the foundational framework by selecting and porting 2 simple projects as an initial proof-of-concept.

Working directory: C:\Users\josh6\Workspace\AlphaCoreTech
Integrity mode: development

## Requirements

### R1. Overhaul Subroutines Page
Redesign the 'subroutines' page to serve as a hub/preview list for ported Python projects. It must be dynamically or statically linked to the newly ported components.

### R2. Web Porting Framework & Initial Batch
Establish a standard way for ported projects to be structured, rendered, and operated within the AlphaCoreTech website. To prove the framework, select 2 simple projects from `C:\Users\josh6\workspace`, port them into web-compatible components, and plug them into the page.

### R3. Safe File I/O
The agents must ensure they do not accidentally delete or modify the original Python projects in `C:\Users\josh6\workspace`. All new code must be written directly into the `AlphaCoreTech` website repository.

## Acceptance Criteria

### Verification Checks
- [ ] An automated script (e.g., `verify_subroutines.js` or equivalent test) is provided that validates the `subroutines` page successfully loads and contains links/references to the 2 newly ported projects.
- [ ] The `AlphaCoreTech` repository contains a structured directory (e.g., `src/ports/`) housing the newly generated web components.
- [ ] Running a local build/dev server for the website does not throw terminal errors due to missing or malformed components.

## 2026-08-10T23:30:44Z

The user has requested to know which two projects you have chosen to port. Please reply and let me know as soon as you have selected them so I can inform the user.

## 2026-08-10T23:38:12Z

The user is asking for an estimate of how long this task (porting AlphaInventory and AlphaRequirements and establishing the subroutines page framework) will take. Please provide an estimated timeframe.

## 2026-08-12T20:26:03Z

The server restarted due to usage limits, but we are back online now. Please resume execution exactly where you left off. The last update stated you had completed Milestone 1 (AlphaInventory and AlphaRequirements ports) and were actively overhauling Milestone 2 (src/pages/subroutines.js). Please resume M2 and proceed to M3.

## 2026-08-12T20:26:36Z

The user just informed us that the target hosting platform for AlphaCoreTech is switching back to Netlify. Please ensure any routing or framework decisions in Milestone 2 are compatible with Netlify (e.g. client-side routing rewrites).

## 2026-08-12T20:35:14Z

CRITICAL UPDATE: Do NOT execute any `git push` commands or attempt to push code to GitHub. The user's GitHub repository is linked to Netlify, so any push will trigger an auto-deployment and consume their hosting quota. Keep all generated code strictly local on the disk so the user can test it manually.

## 2026-08-12T20:53:24Z

# Bulk Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Delegate to teamwork_preview and monitor bulk port progress

Utilize the established web-porting framework on the 'subroutines' page of the AlphaCoreTech website to bulk-port the remaining ~54 Python projects from the workspace.

Working directory: C:\Users\josh6\Workspace\AlphaCoreTech
Integrity mode: development

## Requirements

### R1. Workspace Traversal & Bulk Ingestion
Traverse `C:\Users\josh6\workspace` to catalog all remaining project directories. For each project, generate a corresponding web component in `src/ports/` utilizing the framework patterns established during the proof-of-concept phase.

### R2. Subroutines Page Integration
Dynamically update or populate the 'subroutines' page so that all 50+ newly ingested components are listed, filterable, and accessible via the user interface.

### R3. Safe File I/O & Local-Only Testing
The agents must strictly read from `C:\Users\josh6\workspace`. No original Python files or directories should be modified or deleted. All generation happens within the `AlphaCoreTech` website repository. Note that the website will ultimately be deployed on Netlify, but the agents MUST NOT trigger any remote Netlify deployments OR run any `git push` commands, as the repo is linked to Netlify auto-deploys. All code must remain strictly local on the user's machine for them to test manually. Any heavy backend logic must be handled via serverless functions or gracefully fall back to a placeholder.

### R4. Fallback for Complex Projects
If a project is too complex to be fully ported to a web component in a single pass (e.g., heavy backend requirements), generate a styled UI placeholder for it (marked "Coming Soon" or "Requires Backend"). The orchestrator must keep a running log of these fallback projects and explicitly report them back to the user upon completion.

### R5. Design Aesthetic & UI Organization
The 'subroutines' page must employ a Cyberpunk / Terminal aesthetic (monospace fonts, neon accents on deep black, scanlines, and typing micro-animations). The 50+ projects must be organized using: 
1. Domain/Topic categorizations (e.g., Hardware, AI/ML, Security)
2. A robust search bar with alphabetical sorting
3. A timeline/recent view showing the newest ports at the top
Interaction Pattern: Clicking a project should trigger a smooth, full-screen takeover transition into that specific subroutine's interface. Every subroutine's interface MUST include a clearly visible 'return' button to seamlessly transition back to the main directory.

### R6. Authentication & Security
The 'subroutines' page and all loaded components must be protected behind basic auth. The agents must hook into the existing pincode and profile selection system to restrict access.

## Acceptance Criteria

### Verification Checks (Strictly Programmatic / Zero-Quota)
To conserve API quota, all testing during the bulk port must be strictly programmatic. Do NOT use LLM-as-judge agents for verification.
- [ ] An automated audit script (e.g., node script) cross-references the directory names in `C:\Users\josh6\workspace` against the registered components in the 'subroutines' page, ensuring 100% coverage (every project is accounted for as either a full port or a placeholder).
- [ ] A local script tests that `npm run build` (or the equivalent Netlify build command) executes successfully without throwing fatal errors caused by bulk-generated component boilerplate.
- [ ] The agent provides a finalized summary report explicitly listing any projects that were given placeholders.

