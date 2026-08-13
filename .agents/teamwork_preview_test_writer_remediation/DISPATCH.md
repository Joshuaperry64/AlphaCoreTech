## Task Assignment for teamwork_preview_test_writer_remediation
Working directory: C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_test_writer_remediation

Pass-as-is path to ORIGINAL_REQUEST.md: C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md
Pass-as-is path to PROJECT.md: C:\Users\josh6\Workspace\AlphaCoreTech\PROJECT.md

OBJECTIVE:
Genuinely create all required E2E testing track artifacts on disk in `C:\Users\josh6\Workspace\AlphaCoreTech`:
1. `C:\Users\josh6\Workspace\AlphaCoreTech\TEST_INFRA.md`
2. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier1.test.js`
3. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier2.test.js`
4. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier3.test.js`
5. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier4.test.js`
6. `C:\Users\josh6\Workspace\AlphaCoreTech\TEST_READY.md`

AUDITOR EVIDENCE & REMEDIATION MANDATE:
- Full Auditor Evidence Report: `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_auditor_m1_1\handoff.md`
- Previous attempt failed auditor check because target files were NOT physically created on disk.
- YOU MUST USE `write_to_file` to write actual content to each of the 6 files listed above!
- DO NOT HARDCODE OR CHEAT. Tests must genuinely import components (`src/components/subroutines.js` or `src/subroutines/...`), set up JSDOM DOM elements/mocks, execute actions, assert real behaviors, and run `npm test` successfully.

FILE CONTENT SPECIFICATIONS:

1. `C:\Users\josh6\Workspace\AlphaCoreTech\TEST_INFRA.md`:
   - Philosophy: Opaque-box, requirement-driven E2E testing for subroutines overhaul.
   - Runner command: `npm test` (Vitest + JSDOM).
   - Test directory structure: `src/components/subroutines_tier*.test.js`.
   - Feature coverage matrix across Subroutines Master, AlphaLimiter, AlphaInventory, AlphaObfuscate, AlphaRequirements, and Contract Compliance.

2. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier1.test.js` (Tier 1: Feature Coverage, >=30 tests):
   - Subroutines Dashboard (tabs, routing, status bar, search filter, batch buttons) (>=5 tests)
   - AlphaLimiter Port (rate limit evaluation, window reset, token bucket, key inputs, status reporting) (>=5 tests)
   - AlphaInventory Port (component catalog, Raspberry Pi pin assignment, circuit validation, inventory counts, schematic generation) (>=5 tests)
   - AlphaObfuscate Port (XOR, Leetspeak, AlphaNumeric array, Base64 modes, restoration, copy) (>=5 tests)
   - AlphaRequirements Port (parsing, specifiers >= == ~=, dependency tree, error detection, export JSON) (>=5 tests)
   - Contract Compliance (standardized onStatusChange, onMetricsUpdate, error propagation) (>=5 tests)

3. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier2.test.js` (Tier 2: Boundary & Corner Cases, >=15 tests):
   - Empty input key/window/text/requirements processing
   - Invalid GPIO pin assignments (e.g. pin 99, pin -1, duplicate pin assignments)
   - Corrupted requirements.txt syntax (invalid specifiers like `===`, bad syntax)
   - Large package lists (100+ items)
   - Rapid double-clicking batch controls & empty search results

4. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier3.test.js` (Tier 3: Cross-Feature Combinations, >=10 tests):
   - Tab switching during active subroutine execution while preserving state
   - Toggling search & filter controls while running ported projects
   - Batch controls (start/pause/reset) affecting multiple subroutines simultaneously
   - Data flow pipeline: Obfuscate output used as Limiter key
   - Data flow pipeline: Inventory BOM exported to Requirements package checker

5. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier4.test.js` (Tier 4: Real-World Application Scenarios, >=5 tests):
   - Multi-component Raspberry Pi circuit build in AlphaInventory (LED + Resistor + Push Button + GPIO header) with complete schematic validation
   - Complex real-world requirements.txt processing in AlphaRequirements (specifiers, environment markers, inline comments, corrupt lines, whitespace)
   - End-to-end multi-subroutine pipeline workflow

6. `C:\Users\josh6\Workspace\AlphaCoreTech\TEST_READY.md`:
   - Details test runner command (`npm test`), full coverage table across all 4 tiers (60+ total tests), and feature checklist.

INSTRUCTIONS:
- Call `write_to_file` for all 6 target files.
- Run `npm test` to verify Vitest executes and passes ALL test files.
- Document exact file paths, test count, and test execution output in handoff.md.
