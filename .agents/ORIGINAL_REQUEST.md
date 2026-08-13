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
