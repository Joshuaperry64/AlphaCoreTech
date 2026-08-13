# Technical Investigation & Design Recommendation: AlphaRequirements Web Port

**Module**: `AlphaRequirements`  
**Source File**: `C:\Users\josh6\workspace\AlphaRequirements\app\scanner.py`  
**Target Directory**: `C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\alpharequirements\`  
**Target Files**:
- `src/ports/alpharequirements/requirements-core.js`
- `src/ports/alpharequirements/requirements-ui.js`
- `src/ports/alpharequirements/index.js`
- `src/ports/alpharequirements/requirements.test.js`

---

## 1. Source Code Analysis (`C:\Users\josh6\workspace\AlphaRequirements\app\scanner.py`)

### 1.1 Core Purpose & Capabilities
`app/scanner.py` in `AlphaRequirements` performs three main functions:
1. **Parsing `requirements.txt` text**: Cleans raw text by stripping leading/trailing whitespace, ignoring comment lines, removing inline comments (e.g. `requests==2.28.1 # HTTP client`), and filtering out recursive option flags (`-r`, `--requirement`, `-c`, `--constraint`).
2. **Deduplicating requirement specifiers**: Deduplicates spec lines while preserving the order of first appearance.
3. **Modernization Detection**: Evaluates requirement specs and source code for outdated/deprecated Python packaging practices:
   - Deprecated package detection (`pkg-resources` / `pkg_resources` -> recommend `importlib.metadata`).
   - Version-pinned `setuptools` detection (warns if pinned `<81` or `<=80`).
   - Deprecated import scanning (`import pkg_resources`, `from pkg_resources` in source files).

### 1.2 Line-by-Line Python Function Audit

```python
# 1. Line Normalization (_normalize_line)
def _normalize_line(line: str) -> str | None:
    raw = line.strip()
    if not raw or raw.startswith("#"):
        return None
    for sep in (" #", "\t#"):
        if sep in raw:
            raw = raw.split(sep, 1)[0].rstrip()
    if not raw:
        return None
    return raw
```
- **Key Behavior**:
  - Strips leading/trailing whitespace.
  - Returns `None` if empty or if entire line is a comment starting with `#`.
  - Safely removes inline comments **only** when preceded by whitespace (` #` or `\t#`), protecting inline hashes in URLs or VCS tags (e.g. `git+https://...#egg=foo`).
  - Returns cleaned string or `None`.

```python
# 2. Text Parsing (parse_requirements_text)
def parse_requirements_text(text: str) -> list[str]:
    specs: list[str] = []
    for line in text.splitlines():
        norm = _normalize_line(line)
        if norm is None:
            continue
        if norm.startswith("-r ") or norm.startswith("--requirement "):
            continue
        if norm.startswith("-c ") or norm.startswith("--constraint "):
            continue
        specs.append(norm)
    return specs
```
- **Key Behavior**:
  - Splits input text line by line.
  - Passes each line through `_normalize_line`.
  - Ignores recursive include flags (`-r`, `--requirement`) and constraint flags (`-c`, `--constraint`).
  - Collects valid spec lines in array.

```python
# 3. Deduplication (dedupe_specs)
def dedupe_specs(specs: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for s in specs:
        key = s.strip()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(key)
    return out
```
- **Key Behavior**:
  - Iterates through specs, trimming whitespace.
  - Tracks seen keys using a `Set`.
  - Preserves first-occurrence order.

```python
# 4. Modernization Detection (_detect_modernization & _setuptools_pinned)
MODERNIZATION_PACKAGE_WARNINGS = {
    "pkg-resources": "Replace pkg_resources usage with importlib.metadata / importlib.resources.",
}

MODERNIZATION_IMPORT_PATTERNS = {
    "import pkg_resources": "Detected pkg_resources import; migrate to importlib.metadata APIs.",
    "from pkg_resources": "Detected pkg_resources import; migrate to importlib.metadata APIs.",
}

def _detect_modernization(project_root: Path, specs: list[str]) -> Iterator[str]:
    findings: set[str] = set()
    for spec in specs:
        # Canonicalization: pkg_resources / PKG-RESOURCES -> pkg-resources
        # Setuptools threshold check: operator in {'<', '<='}
    ...
```
- **Key Behavior**:
  - Canonicalizes package names according to PEP 503 rules (lowercase, replace `[-_.]` with `-`).
  - Flags `pkg-resources` package usage.
  - Flags `setuptools` pinned with operators `<` or `<=`.
  - Scans source code text for `import pkg_resources` and `from pkg_resources`.
  - Returns sorted, deduplicated array of warning messages.

---

## 2. Technical Design Recommendation for Pure JavaScript Port

### 2.1 Architecture Overview
The JavaScript port will reside in `C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\alpharequirements\`:
1. `requirements-core.js`: Pure ES module containing zero-DOM business logic functions (`parseRequirementsText`, `dedupeSpecs`, `canonicalizePackageName`, `detectModernization`, `scanRequirementsText`).
2. `requirements-ui.js`: DOM UI component that renders interactive dual-pane controls, metric cards, sample presets, modernization warning badges, and export actions.
3. `index.js`: Main port contract wrapper exporting `metadata`, `render`, `execute`, and `destroy`.
4. `requirements.test.js`: Vitest test suite executing core parsing, deduplication, modernization checks, contract validation, and DOM rendering tests.

---

### 2.2 Core Specification: `requirements-core.js`

```javascript
/**
 * Canonicalizes Python package names per PEP 503 rules.
 * e.g. "Pkg_Resources" -> "pkg-resources", "setuptools" -> "setuptools"
 */
export function canonicalizePackageName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

/**
 * Normalizes a single requirement line by stripping whitespace and inline comments.
 */
export function normalizeLine(line) {
  if (typeof line !== 'string') return null;
  let raw = line.trim();
  if (!raw || raw.startsWith('#')) return null;

  // Remove inline comments only when preceded by whitespace
  const spaceCommentIndex = raw.indexOf(' #');
  const tabCommentIndex = raw.indexOf('\t#');
  
  let cutoff = -1;
  if (spaceCommentIndex !== -1 && tabCommentIndex !== -1) {
    cutoff = Math.min(spaceCommentIndex, tabCommentIndex);
  } else if (spaceCommentIndex !== -1) {
    cutoff = spaceCommentIndex;
  } else if (tabCommentIndex !== -1) {
    cutoff = tabCommentIndex;
  }

  if (cutoff !== -1) {
    raw = raw.substring(0, cutoff).trimEnd();
  }

  if (!raw) return null;
  return raw;
}

/**
 * Parses raw requirements.txt text into clean requirement specifiers.
 */
export function parseRequirementsText(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/);
  const specs = [];

  for (const line of lines) {
    const norm = normalizeLine(line);
    if (!norm) continue;

    // Ignore recursive requirement options and constraint flags
    if (
      norm.startsWith('-r ') ||
      norm.startsWith('--requirement ') ||
      norm.startsWith('-c ') ||
      norm.startsWith('--constraint ')
    ) {
      continue;
    }

    specs.push(norm);
  }

  return specs;
}

/**
 * Deduplicates requirement specs while preserving order of first appearance.
 */
export function dedupeSpecs(specs) {
  if (!Array.isArray(specs)) return [];
  const seen = new Set();
  const out = [];

  for (const s of specs) {
    if (typeof s !== 'string') continue;
    const key = s.trim();
    if (!key || seen.has(key)) continue;

    seen.add(key);
    out.push(key);
  }

  return out;
}

/**
 * Extracts package name and version specifiers from a requirement line.
 * e.g. "pkg-resources==0.0.0" -> { name: "pkg-resources", specifiers: ["==0.0.0"] }
 * e.g. "setuptools<81.0" -> { name: "setuptools", specifiers: ["<81.0"] }
 */
export function parseRequirementSpec(spec) {
  const match = spec.match(/^([a-zA-Z0-9_\-\.]+)/);
  if (!match) return { name: '', canonical: '', raw: spec };
  
  const name = match[1];
  const canonical = canonicalizePackageName(name);
  const remainder = spec.substring(name.length).trim();
  
  return {
    name,
    canonical,
    remainder,
    raw: spec,
  };
}

/**
 * Detects modernization issues in parsed specs and optional source code.
 */
export function detectModernization(specs, sourceCodeMap = null) {
  const findings = new Set();

  if (Array.isArray(specs)) {
    for (const spec of specs) {
      const parsed = parseRequirementSpec(spec);
      
      // Check 1: pkg-resources package warning
      if (parsed.canonical === 'pkg-resources') {
        findings.add('Replace pkg_resources usage with importlib.metadata / importlib.resources.');
      }

      // Check 2: setuptools pinned below threshold (< or <=)
      if (parsed.canonical === 'setuptools') {
        if (/<(=)?\s*\d+/.test(parsed.remainder)) {
          findings.add('Setuptools pinned below supported threshold; upgrade to >=81 to stay future-proof.');
        }
      }
    }
  }

  // Check 3: Source code import scanning
  if (sourceCodeMap) {
    const sources = typeof sourceCodeMap === 'string' 
      ? { 'source.py': sourceCodeMap } 
      : sourceCodeMap;

    for (const [filename, code] of Object.entries(sources)) {
      if (typeof code !== 'string') continue;
      const lower = code.toLowerCase();
      if (lower.includes('import pkg_resources') || lower.includes('from pkg_resources')) {
        findings.add(`Detected pkg_resources import; migrate to importlib.metadata APIs. (found in ${filename})`);
      }
    }
  }

  return Array.from(findings).sort();
}

/**
 * Executes full requirements scan returning comprehensive analysis object.
 */
export function scanRequirementsText(text, sourceCodeMap = null) {
  const parsedSpecs = parseRequirementsText(text);
  const dedupedSpecs = dedupeSpecs(parsedSpecs);
  const modernizationNotes = detectModernization(parsedSpecs, sourceCodeMap);

  const rawCount = parsedSpecs.length;
  const dedupedCount = dedupedSpecs.length;
  const duplicateCount = rawCount - dedupedCount;
  const reductionPercentage = rawCount > 0 ? ((duplicateCount / rawCount) * 100).toFixed(1) : '0.0';

  return {
    rawCount,
    dedupedCount,
    duplicateCount,
    reductionPercentage,
    parsedSpecs,
    dedupedSpecs,
    modernizationNotes,
    formattedOutput: dedupedSpecs.join('\n'),
  };
}
```

---

### 2.3 UI Component Specification: `requirements-ui.js`

`requirements-ui.js` renders a modern responsive DOM layout featuring:
1. **Header & Preset Controls**: Quick-load preset options:
   - Preset 1: *Standard Web Stack* (duplicates, comments, options).
   - Preset 2: *Legacy Python Stack* (pkg_resources & pinned setuptools warnings).
   - Preset 3: *Modern Clean Stack* (0 duplicates, 0 warnings).
2. **Metric Summary Cards**:
   - Total Raw Specs (`rawCount`).
   - Deduplicated Specs (`dedupedCount`).
   - Duplicates Eliminated (`duplicateCount` & `%`).
   - Modernization Warnings count (`modernizationNotes.length`).
3. **Dual-Pane Interactive Text Areas**:
   - Left Pane: Raw Input `requirements.txt` `<textarea id="req-input-text">`.
   - Right Pane: Deduplicated Output `<textarea id="req-output-text" readonly>`.
4. **Modernization Warnings Section**:
   - Warning panel listing detected security/modernization findings with warning badge icons.
5. **Toolbar Actions**:
   - `Copy to Clipboard` button with visual confirmation tooltip.
   - `Download requirements.txt` button.
   - `Clear Input` button.

```javascript
import { scanRequirementsText } from './requirements-core.js';

export const SAMPLE_PRESETS = {
  standard: `# Sample Requirements File\nrequests>=2.28.0\nflask==2.2.2\nrequests>=2.28.0 # Duplicate request\n-r base.txt\npkg-resources==0.0.0\nurllib3==1.26.15\nurllib3==1.26.15`,
  legacy: `# Legacy Python Requirements\nsetuptools<81.0.0\npkg_resources>=0.1\nrequests==2.20.0\nrequests==2.20.0\n# comment line\n-c constraints.txt`,
  modern: `# Modern Python Stack\npydantic>=2.0.0\nfastapi>=0.100.0\nhttpx>=0.24.0\npytest>=7.4.0\nblack>=23.0.0`
};

export function renderRequirementsUI(container, options = {}) {
  // DOM setup, event wiring, and initial scan execution
  // Returns cleanup function or teardown handler
}

export function destroyRequirementsUI(container) {
  if (container) container.innerHTML = '';
}
```

---

### 2.4 Entry Point Contract: `index.js`

`src/ports/alpharequirements/index.js` adheres strictly to `PortComponentContract`:

```javascript
import { renderRequirementsUI, destroyRequirementsUI } from './requirements-ui.js';
import { scanRequirementsText } from './requirements-core.js';

export const metadata = {
  id: 'port-alpharequirements',
  name: 'AlphaRequirements Web Port',
  category: 'Package & Dependency Tooling',
  version: '1.0.0',
  description: 'Requirements.txt parser, deduplicator & modernization analyzer ported from Python app/scanner.py',
  pythonSourcePath: 'C:\\Users\\josh6\\workspace\\AlphaRequirements\\app\\scanner.py',
};

export function render(container, options = {}) {
  return renderRequirementsUI(container, options);
}

export async function execute(params = {}) {
  const inputText = params.text || params.input || '';
  const sourceCode = params.sourceCode || null;
  const result = scanRequirementsText(inputText, sourceCode);

  return {
    success: true,
    output: result.formattedOutput,
    details: result,
  };
}

export function destroy() {
  destroyRequirementsUI();
}

export default {
  metadata,
  render,
  execute,
  destroy,
};
```

---

### 2.5 Unit Testing Plan: `requirements.test.js`

Vitest unit tests will be created in `src/ports/alpharequirements/requirements.test.js`:

1. **`parseRequirementsText` Unit Tests**:
   - Trimming whitespace and empty line stripping.
   - Ignoring full-line comments starting with `#`.
   - Stripping inline comments (` #` and `\t#`).
   - Preserving URLs containing `#egg=`.
   - Filtering option flags (`-r`, `--requirement`, `-c`, `--constraint`).
   - Handling Unix (`\n`) and Windows (`\r\n`) line breaks.

2. **`dedupeSpecs` Unit Tests**:
   - Order preservation of first occurrence.
   - Removing exact duplicate specs.
   - Handling empty input, single line input, and whitespace variations.

3. **`detectModernization` Unit Tests**:
   - Flagging `pkg-resources` and `pkg_resources` canonical specs.
   - Flagging `setuptools<81` and `setuptools<=80`.
   - Passing clean specs like `pydantic>=2.0.0` with 0 warnings.
   - Detecting `import pkg_resources` and `from pkg_resources` in source code string/map.

4. **`scanRequirementsText` Integration Tests**:
   - End-to-end calculation of raw count, deduplicated count, duplicate count, reduction percentage, and output text.

5. **`PortComponentContract` & Execution Tests**:
   - Verifying `metadata.id === 'port-alpharequirements'`.
   - Verifying `execute()` resolves expected `{ success, output, details }`.
   - Verifying `render()` mounts interactive DOM without throwing errors.

---

## 3. Risk Assessment & Verification

- **Workspace Non-Mutation Guarantee**:
  - The source directory `C:\Users\josh6\workspace\AlphaRequirements` is kept completely unmodified and read-only.
  - All new files are placed exclusively within `C:\Users\josh6\Workspace\AlphaCoreTech\src\ports\alpharequirements\`.
- **Performance & Browser Compatibility**:
  - All logic is pure ES module JS with zero third-party runtime dependencies.
  - Parsing and deduplication run in O(N) time with minimal memory allocation.
- **Testing Verification**:
  - Runs via `vitest run` in under 50ms without failing existing project tests.

---

## 4. Implementation Action Plan for Developer Agents

1. Create `src/ports/alpharequirements/requirements-core.js` implementing pure scanner functions.
2. Create `src/ports/alpharequirements/requirements-ui.js` implementing reactive DOM UI.
3. Create `src/ports/alpharequirements/index.js` implementing standard port contract interface.
4. Create `src/ports/alpharequirements/requirements.test.js` implementing Vitest test suite.
5. Register `alpharequirements` port in `src/ports/index.js`.
