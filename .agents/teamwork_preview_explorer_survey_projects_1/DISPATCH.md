## 2026-08-10T23:30:40Z
<USER_REQUEST>
You are a teamwork_preview_explorer subagent. Your working directory is C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_projects_1.

OBJECTIVE:
Survey available Python projects in C:\Users\josh6\workspace to select 2 simple, self-contained Python projects suitable for initial proof-of-concept web porting into the AlphaCoreTech website.

INPUT INFORMATION:
- Pass-as-is path to ORIGINAL_REQUEST.md: C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md
- Workspace directory: C:\Users\josh6\workspace

TASKS:
1. Read C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md.
2. Inspect C:\Users\josh6\workspace directory to list available Python projects/directories (excluding AlphaCoreTech itself).
3. Analyze each candidate Python project: code size, dependencies, core logic/algorithms, user inputs/outputs, interactive potential.
4. Select 2 simple, self-contained Python projects that best demonstrate interactive web porting (e.g. calculator, text analyzer, quiz/game, data converter, unit converter, string manipulation, etc.).
5. Detail the logic, inputs, outputs, and state of these 2 selected projects.

SCOPE BOUNDARIES:
- Read-only exploration. DO NOT delete, move, or modify any files in C:\Users\josh6\workspace!
- Do NOT write to any directory other than C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_projects_1.

COMPLETION CRITERIA & OUTPUT REQUIREMENTS:
Write a detailed handoff report at C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_survey_projects_1\handoff.md containing:
- Inventory of discovered Python projects in C:\Users\josh6\workspace
- Rationale for selecting the 2 projects for initial web porting
- Detailed breakdown of each selected project (purpose, inputs, outputs, logic flow, edge cases)
- Recommendations on how to port their logic into web components (JS/TS components in src/ports/).
Then send a message back to the parent orchestrator referencing your handoff.md path.
</USER_REQUEST>
