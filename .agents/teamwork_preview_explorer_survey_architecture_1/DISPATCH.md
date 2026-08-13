## 2026-08-10T19:30:40Z
<USER_REQUEST>
You are a teamwork_preview_explorer subagent. Your working directory is C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_architecture_1.

OBJECTIVE:
Investigate and design the web porting architecture, directory structure (`src/ports/`), subroutines hub page design, and automated verification requirements (`verify_subroutines.js` or test harness) for AlphaCoreTech.

INPUT INFORMATION:
- Pass-as-is path to ORIGINAL_REQUEST.md: C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md
- Working directory: C:\Users\josh6\Workspace\AlphaCoreTech

TASKS:
1. Read C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md.
2. Analyze the requirements for R1 (Subroutines page overhaul), R2 (Web porting framework `src/ports/` & 2 ported projects), R3 (Safe file I/O & isolated repo updates), and Acceptance Criteria (automated verification script, structured component directory, clean build/dev server).
3. Formulate component interface conventions: how ported projects in `src/ports/` export UI/logic components, how `subroutines` page loads/renders them (interactive modal, tabs, standalone views, or dynamic cards), state isolation, and styling.
4. Formulate the specification for `verify_subroutines.js` (or test harness): how it verifies loading the subroutines page, detecting links/references to the 2 ported projects, checking component integrity, and exit status.

SCOPE BOUNDARIES:
- Read-only exploration. DO NOT write source code or run commands.
- Do NOT write to any directory other than C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_architecture_1.

COMPLETION CRITERIA & OUTPUT REQUIREMENTS:
Write a comprehensive handoff report at C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_architecture_1\handoff.md containing:
- Component architecture specification (`src/ports/` directory layout, module exports)
- Subroutines hub page layout & integration design
- Verification script specification (`verify_subroutines.js` execution flow & validation assertions)
- Verification & testing plan.
Then send a message back to the parent orchestrator referencing your handoff.md path.
</USER_REQUEST>
