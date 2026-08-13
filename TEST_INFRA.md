# Test Infrastructure & Specification: Subroutines & Web Porting Framework

## 1. Overview & Testing Philosophy

The **AlphaCoreTech Subroutines & Web Porting Framework** test suite establishes a rigorous, requirement-driven, opaque-box testing harness built on top of **Vitest** and **JSDOM**.

### Core Principles
1. **Opaque-Box Verification**: Tests validate exported contracts, public component interfaces, DOM structures, and state transitions without relying on internal private implementation details.
2. **Deterministic & Isolated Execution**: Every test sets up its own clean environment (`beforeEach`/`afterEach`), resets DOM nodes, and avoids order dependency.
3. **No Facades**: All test cases genuinely exercise feature logic, DOM element creation, pinout conflict detection algorithms, string obfuscation transforms, and requirement specification parsers.
4. **Progressive Tiered Structure**:
   - **Tier 1 (Feature Coverage)**: Primary behavior & happy paths (36 test cases).
   - **Tier 2 (Boundary & Corner Cases)**: Null/empty inputs, malformed text, pin conflicts, extreme limits (20 test cases).
   - **Tier 3 (Cross-Feature Integration)**: Multi-subroutine data pipelines, CLI dispatch, batch controls, UI filter matrix (12 test cases).
   - **Tier 4 (Real-World Scenarios)**: Complex circuit designs, multi-package production requirements, full page lifecycle (6 test cases).

---

## 2. Test Environment & Execution

- **Test Runner**: Vitest (`^4.1.10`)
- **DOM Environment**: JSDOM (`^29.1.1`)
- **Root Command**: `npm test` (`vitest run`)

### File Mapping
| Deliverable | Disk Location | Tier / Focus | Test Count |
|---|---|---|---|
| Tier 1 Test Suite | `src/components/subroutines_tier1.test.js` & `tests/tier1_feature_coverage.test.jsx` | Feature Coverage | 36 |
| Tier 2 Test Suite | `src/components/subroutines_tier2.test.js` & `tests/tier2_boundary_corner.test.jsx` | Boundary & Corner Cases | 20 |
| Tier 3 Test Suite | `src/components/subroutines_tier3.test.js` & `tests/tier3_cross_feature.test.jsx` | Cross-Feature Integration | 12 |
| Tier 4 Test Suite | `src/components/subroutines_tier4.test.js` & `tests/tier4_realworld.test.jsx` | Real-World Application Scenarios | 6 |
| Test Ready Report | `TEST_READY.md` | Verification Summary | N/A |

---

## 3. Feature Coverage Matrix

| Feature ID | Feature Name | Test Tiers | Key Verification Criteria |
|---|---|---|---|
| **FEAT-1** | Subroutines Master Dashboard | Tier 1, Tier 2, Tier 3, Tier 4 | DOM mounting, category dropdown filtering (`NEURAL`, `CRYPTO`, `PERF`, `SEC`, `DATA`), execution console logs, dry-run simulation, log flushing, autoscroll, and CLI command dispatch. |
| **FEAT-2** | AlphaLimiter Rate Engine | Tier 1, Tier 2, Tier 3, Tier 4 | TokenBucketLimiter refill calculations, SlidingWindowLimiter per-client tracking, Subnet bandwidth throttling quotas, extreme rates, clock skew resilience. |
| **FEAT-3** | AlphaInventory RPi GPIO Port | Tier 1, Tier 2, Tier 3, Tier 4 | 40-pin GPIO pinout mapping, component catalog, pin over-allocation conflict engine, power/GND mismatch detection, 2x20 header grid UI, schematic builder. |
| **FEAT-4** | AlphaObfuscate Engine | Tier 1, Tier 2, Tier 3, Tier 4 | Symmetric Base64/Hex encoding, XOR cipher, Leetspeak substitutions, AlphaNumeric numeric array mapping, string table extraction, multi-layer pipelines. |
| **FEAT-5** | AlphaRequirements Analyzer | Tier 1, Tier 2, Tier 3, Tier 4 | Requirements parsing (stripping comments/directives), package canonicalization, order-preserving deduplication, legacy package modernization detection (`pkg-resources`, `pylint`), metrics summary. |
| **FEAT-6** | Contract Compliance & Registry | Tier 1, Tier 2, Tier 3, Tier 4 | `validatePortContract()` verification, missing/malformed property errors, `PortsRegistry` registration, retrieval by ID, `getAllPorts()`, standardized `execute()` promise response. |

---

## 4. Verification Protocol

To run and verify the test harness:
```bash
npm test
```
All test suites will execute in headful/headless JSDOM environment. 100% pass rate is mandatory for release.
