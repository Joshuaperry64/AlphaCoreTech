## Task Assignment for teamwork_preview_worker_final_remediation
Working directory: C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_worker_final_remediation

Pass-as-is path to ORIGINAL_REQUEST.md: C:\Users\josh6\Workspace\AlphaCoreTech\ORIGINAL_REQUEST.md
Pass-as-is path to PROJECT.md: C:\Users\josh6\Workspace\AlphaCoreTech\PROJECT.md

OBJECTIVE:
Resolve the Forensic Audit Veto by physically writing ALL required deliverable files to BOTH `src/components/` and `tests/` paths, plus `TEST_INFRA.md` and `TEST_READY.md` at root.

MANDATORY FILES TO WRITE USING `write_to_file`:
1. `C:\Users\josh6\Workspace\AlphaCoreTech\TEST_INFRA.md`
2. `C:\Users\josh6\Workspace\AlphaCoreTech\TEST_READY.md`
3. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier1.test.js`
4. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier2.test.js`
5. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier3.test.js`
6. `C:\Users\josh6\Workspace\AlphaCoreTech\src\components\subroutines_tier4.test.js`
7. `C:\Users\josh6\Workspace\AlphaCoreTech\tests\tier1_feature_coverage.test.jsx`
8. `C:\Users\josh6\Workspace\AlphaCoreTech\tests\tier2_boundary_corner.test.jsx`
9. `C:\Users\josh6\Workspace\AlphaCoreTech\tests\tier3_cross_feature.test.jsx`
10. `C:\Users\josh6\Workspace\AlphaCoreTech\tests\tier4_realworld.test.jsx`

CONTENT REQUIREMENTS:
- `TEST_INFRA.md`: Full test infrastructure spec, runner command (`npm test`), JSDOM setup, coverage matrix.
- `TEST_READY.md`: Test ready indicator with total test count breakdown across Tiers 1-4, runner command, feature checklist.
- Tier 1 (>=30 tests): Feature coverage for Subroutines Dashboard, AlphaLimiter, AlphaInventory, AlphaObfuscate, AlphaRequirements, and Contract Compliance.
- Tier 2 (>=15 tests): Boundary & corner cases (empty inputs, invalid pin 99/pin -1, duplicate pins, corrupted requirements syntax, 100+ package lists).
- Tier 3 (>=10 tests): Cross-feature combinations (route/tab switching during active runs, status search/filter, batch controls, data pipelines).
- Tier 4 (>=5 tests): Real-world application scenarios (Raspberry Pi circuit in AlphaInventory, complex requirements.txt parsing in AlphaRequirements).

EXECUTION & VERIFICATION:
- Call `write_to_file` on ALL 10 paths!
- Run `npm test` (`vitest run`) and verify 100% of test suites pass without any errors.
- Document exact file creation and test results in handoff.md.
