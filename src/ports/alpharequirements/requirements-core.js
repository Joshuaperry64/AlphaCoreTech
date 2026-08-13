/**
 * AlphaRequirements Core Logic: Requirements Parser, Deduplicator & Modernization Detector.
 * Ported from C:\Users\josh6\workspace\AlphaRequirements\app\scanner.py
 */

export const MODERNIZATION_PACKAGE_WARNINGS = {
  'pkg-resources': 'Replace pkg_resources usage with importlib.metadata / importlib.resources.'
};

export const MODERNIZATION_IMPORT_PATTERNS = {
  'import pkg_resources': 'Detected pkg_resources import; migrate to importlib.metadata APIs.',
  'from pkg_resources': 'Detected pkg_resources import; migrate to importlib.metadata APIs.'
};

/**
 * Normalizes a single line from a requirements.txt file.
 * Strips comments preceded by whitespace and removes empty lines / comment lines.
 * 
 * @param {string} line 
 * @returns {string|null} Normalized line string or null if ignorable
 */
export function normalizeLine(line) {
  if (typeof line !== 'string') return null;
  let raw = line.trim();
  if (!raw || raw.startsWith('#')) return null;

  for (const sep of [' #', '\t#']) {
    if (raw.includes(sep)) {
      raw = raw.split(sep)[0].trimEnd();
    }
  }

  if (!raw || raw.startsWith('#')) return null;
  return raw;
}

/**
 * Parses raw requirements.txt text into a list of requirement spec strings.
 * 
 * @param {string} text 
 * @returns {string[]} Array of requirement spec strings
 */
export function parseRequirementsText(text) {
  if (typeof text !== 'string') return [];
  const specs = [];
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    const norm = normalizeLine(line);
    if (!norm) continue;
    if (norm.startsWith('-r ') || norm.startsWith('--requirement ')) continue;
    if (norm.startsWith('-c ') || norm.startsWith('--constraint ')) continue;
    specs.push(norm);
  }
  return specs;
}

/**
 * Deduplicates requirement specifications while preserving order of first appearance.
 * 
 * @param {Iterable<string>} specs 
 * @returns {string[]} Deduplicated specs
 */
export function dedupeSpecs(specs) {
  if (!specs) return [];
  const seen = new Set();
  const out = [];

  for (const s of specs) {
    if (typeof s !== 'string') continue;
    const key = s.trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * Canonicalizes a Python package name according to PEP 503 rules.
 * Replaces sequences of [-_.] with a single hyphen and lowercases.
 * 
 * @param {string} name 
 * @returns {string} Canonical package name
 */
export function canonicalizePackageName(name) {
  if (typeof name !== 'string') return '';
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

/**
 * Extracts package name from a requirement spec string (e.g. "requests>=2.31.0" -> "requests").
 * 
 * @param {string} spec 
 * @returns {string} Package name
 */
export function extractPackageName(spec) {
  if (!spec || typeof spec !== 'string') return '';
  const match = spec.match(/^([a-zA-Z0-9_\-\.]+)/);
  return match ? match[1] : spec.trim();
}

/**
 * Checks whether setuptools requirement spec is pinned below threshold (< 81).
 * 
 * @param {string} spec 
 * @returns {boolean}
 */
export function isSetuptoolsPinned(spec) {
  if (!spec) return false;
  const pkgName = canonicalizePackageName(extractPackageName(spec));
  if (pkgName !== 'setuptools') return false;

  // Check for operators like < or <= with version numbers
  if (/<|<=/.test(spec)) {
    return true;
  }
  return false;
}

/**
 * Detects modernization warnings from requirement specs and optional source code map.
 * 
 * @param {string[]} specs - Array of requirement specs
 * @param {Object} [sourceCodeMap] - Object mapping relative file paths to python code strings
 * @returns {string[]} Array of unique, sorted warning messages
 */
export function detectModernization(specs = [], sourceCodeMap = null) {
  const findings = new Set();

  for (const spec of specs) {
    const rawPkg = extractPackageName(spec);
    const canonical = canonicalizePackageName(rawPkg);

    const warnMsg = MODERNIZATION_PACKAGE_WARNINGS[canonical];
    if (warnMsg) {
      findings.add(warnMsg);
    }

    if (canonical === 'setuptools' && isSetuptoolsPinned(spec)) {
      findings.add('Setuptools pinned below supported threshold; upgrade to >=81 to stay future-proof.');
    }
  }

  if (sourceCodeMap && typeof sourceCodeMap === 'object') {
    for (const [filePath, codeContent] of Object.entries(sourceCodeMap)) {
      if (!filePath.endsWith('.py') || typeof codeContent !== 'string') continue;
      const lowered = codeContent.toLowerCase();

      for (const [pattern, note] of Object.entries(MODERNIZATION_IMPORT_PATTERNS)) {
        if (lowered.includes(pattern.toLowerCase())) {
          findings.add(`${note} (found in ${filePath})`);
        }
      }
    }
  }

  return Array.from(findings).sort();
}

/**
 * Comprehensive scanner combining parsing, deduplication, and modernization analysis.
 * 
 * @param {string} text - Raw requirements.txt text
 * @param {Object} [sourceCodeMap] - Optional Python source files
 * @returns {Object} Scan results
 */
export function scanRequirementsText(text = '', sourceCodeMap = null) {
  const allSpecs = parseRequirementsText(text);
  const dedupedSpecs = dedupeSpecs(allSpecs);
  const modernizationNotes = detectModernization(allSpecs, sourceCodeMap);

  const lineCount = typeof text === 'string' ? text.split(/\r?\n/).length : 0;

  return {
    allSpecs,
    dedupedSpecs,
    modernizationNotes,
    lineCount,
    specCount: allSpecs.length,
    dedupedCount: dedupedSpecs.length,
    warningCount: modernizationNotes.length
  };
}
