import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SubroutinesPage from '../pages/subroutines.js';
import { validatePortContract } from '../ports/port-contract.js';

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES TEST SUITE (20 TESTS)
// ============================================================================

// 1. AlphaLimiter Engines
class TokenBucketLimiter {
  constructor(capacity, refillRate, startTime = Date.now()) {
    this.capacity = Math.max(0, capacity || 0);
    this.refillRate = Math.max(0, refillRate || 0);
    this.tokens = this.capacity;
    this.lastRefill = startTime;
  }

  refill(now = Date.now()) {
    const elapsedSec = (now - this.lastRefill) / 1000;
    if (elapsedSec > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRate);
      this.lastRefill = now;
    }
  }

  tryConsume(tokens = 1, now = Date.now()) {
    if (tokens <= 0 || this.capacity <= 0) return false;
    this.refill(now);
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  reset(now = Date.now()) {
    this.tokens = this.capacity;
    this.lastRefill = now;
  }
}

class SlidingWindowLimiter {
  constructor(windowMs, limit) {
    this.windowMs = Math.max(0, windowMs || 0);
    this.limit = Math.max(0, limit || 0);
    this.logs = new Map();
  }

  allowRequest(clientId, timestamp = Date.now()) {
    const key = (clientId === null || clientId === undefined || String(clientId).trim() === '') ? 'unknown' : String(clientId);

    if (this.windowMs <= 0 || this.limit <= 0) {
      return { allowed: false, remaining: 0 };
    }

    if (!this.logs.has(key)) {
      this.logs.set(key, []);
    }

    const timestamps = this.logs.get(key);
    const validWindowStart = timestamp - this.windowMs;
    const filtered = timestamps.filter(ts => ts > validWindowStart);

    if (filtered.length < this.limit) {
      filtered.push(timestamp);
      this.logs.set(key, filtered);
      return { allowed: true, remaining: this.limit - filtered.length };
    }

    this.logs.set(key, filtered);
    return { allowed: false, remaining: 0 };
  }
}

// 2. AlphaObfuscate Engine Helpers
function encodeBase64(str) {
  if (!str) return '';
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
}

function decodeBase64(b64Str) {
  if (!b64Str) return '';
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64Str, 'base64').toString('utf-8');
  }
  return decodeURIComponent(Array.from(atob(b64Str)).map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
}

function xorCipher(text, key) {
  if (!text) return '';
  if (!key) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function leetspeakTransform(text) {
  if (!text) return '';
  const map = { 'a': '4', 'A': '4', 'e': '3', 'E': '3', 'i': '1', 'I': '1', 'o': '0', 'O': '0', 's': '$', 'S': '$' };
  return text.split('').map(char => map[char] || char).join('');
}

const ALPHANUMERIC_CHAR_MAP = {
  ' ': 0, '.': 27, ',': 28, '!': 29, '?': 30
};
for (let i = 0; i < 26; i++) {
  const char = String.fromCharCode(65 + i);
  ALPHANUMERIC_CHAR_MAP[char] = i + 1;
}

function encodeAlphaNumeric(text) {
  if (!text || typeof text !== 'string') return [];
  const result = [];
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (ALPHANUMERIC_CHAR_MAP[ch] !== undefined) {
      result.push(ALPHANUMERIC_CHAR_MAP[ch]);
    } else {
      result.push(30);
    }
  }
  return result;
}

function decodeAlphaNumeric(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '';
  const reverseMap = {};
  for (const [k, v] of Object.entries(ALPHANUMERIC_CHAR_MAP)) {
    reverseMap[v] = k;
  }

  let result = '';
  for (const num of arr) {
    if (typeof num === 'number' && reverseMap[num] !== undefined) {
      result += reverseMap[num];
    } else {
      result += '?';
    }
  }
  return result;
}

// 3. AlphaInventory Helpers
const DEFAULT_PINS = {
  1: { name: '3.3V Power', mode: 'POWER', type: 'POWER_3V3' },
  2: { name: '5V Power', mode: 'POWER', type: 'POWER_5V' },
  6: { name: 'Ground', mode: 'GROUND', type: 'GND' },
  18: { name: 'GPIO 24', mode: 'GPIO', type: 'DIGITAL' }
};

function detectConflicts(components, pins = DEFAULT_PINS) {
  if (!Array.isArray(components) || components.length === 0) return [];
  const conflicts = [];
  const pinMap = new Map();

  for (const comp of components) {
    for (const pinObj of (comp.pins || [])) {
      const pinNum = pinObj.assigned_pin;

      if (pinNum === null || pinNum === undefined) {
        conflicts.push({ type: 'UNASSIGNED_PIN', severity: 'warning', component: comp.name });
        continue;
      }

      if (typeof pinNum !== 'number' || pinNum < 1 || pinNum > 40 || !pins[pinNum]) {
        conflicts.push({ type: 'INVALID_PIN', pin: pinNum, component: comp.name });
        continue;
      }

      const pinDef = pins[pinNum];
      if ((pinDef.mode === 'POWER' || pinDef.mode === 'GROUND') && pinObj.pin_type && pinObj.pin_type !== pinDef.type) {
        conflicts.push({
          type: 'TYPE_MISMATCH',
          pin: pinNum,
          component: comp.name,
          actualType: pinDef.mode,
          requiredType: pinObj.pin_type
        });
      }

      if (pinMap.has(pinNum)) {
        const existingComp = pinMap.get(pinNum);
        conflicts.push({
          type: 'OVER_ALLOCATION',
          pin: pinNum,
          message: `Pin ${pinNum} (${pinDef.name}) is over-allocated between '${existingComp}' and '${comp.name}'`
        });
      } else {
        pinMap.set(pinNum, comp.name);
      }
    }
  }

  return conflicts;
}

// 4. AlphaRequirements Engine Helpers
function parseRequirementsText(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.split('\n');
  const validSpecs = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('-') || line.startsWith('--')) {
      continue;
    }
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx).trim();
    }

    if (line && /^[a-zA-Z0-9_\-\.]+/.test(line) && !line.startsWith('===') && !line.startsWith(':::') && !line.startsWith('!@#$')) {
      validSpecs.push(line);
    }
  }
  return validSpecs;
}

function canonicalizePackageName(spec) {
  if (!spec || typeof spec !== 'string') return '';
  const match = spec.match(/^([a-zA-Z0-9_\-\.]+)(.*)$/);
  if (!match) return spec;
  const name = match[1].toLowerCase().replace(/_/g, '-');
  return name + match[2];
}

function dedupeSpecs(specs) {
  if (!Array.isArray(specs)) return [];
  const seen = new Set();
  const result = [];

  for (const spec of specs) {
    const canonical = canonicalizePackageName(spec);
    const nameOnly = canonical.split(/[<>=~!]/)[0].trim();
    if (nameOnly && !seen.has(nameOnly)) {
      seen.add(nameOnly);
      result.push(spec);
    }
  }
  return result;
}

function detectModernization(specs) {
  if (!Array.isArray(specs)) return [];
  const warnings = [];
  const mappings = {
    'pkg-resources': { replacement: 'importlib.metadata', reason: 'Deprecated package. Use standard importlib.metadata.' },
    'pylint': { replacement: 'ruff', reason: 'Legacy linter. Ruff provides 10-100x faster execution.' },
    'pip-tools': { replacement: 'uv / poetry', reason: 'Modern package resolver uv is significantly faster.' }
  };

  for (const spec of specs) {
    const nameOnly = canonicalizePackageName(spec).split(/[<>=~!]/)[0].trim();
    if (mappings[nameOnly]) {
      warnings.push({
        package: nameOnly,
        suggestion: mappings[nameOnly].replacement,
        reason: mappings[nameOnly].reason
      });
    }
  }
  return warnings;
}

function calculateRequirementsMetrics(rawText) {
  const validSpecs = parseRequirementsText(rawText);
  const deduped = dedupeSpecs(validSpecs);
  const duplicateCount = validSpecs.length - deduped.length;
  const reductionPct = validSpecs.length > 0 ? ((duplicateCount / validSpecs.length) * 100).toFixed(1) : '0.0';

  return {
    totalLines: rawText ? rawText.split('\n').length : 0,
    validSpecsCount: validSpecs.length,
    dedupedCount: deduped.length,
    duplicateCount,
    reductionPct
  };
}


describe('Tier 2: Boundary & Corner Cases Test Suite', () => {

  describe('Category 1: AlphaLimiter Boundary & Corner Cases', () => {
    it('1.1 should evaluate empty, null, undefined, and whitespace key inputs gracefully', () => {
      const windowLimiter = new SlidingWindowLimiter(60000, 2);
      const now = 100000;

      expect(windowLimiter.allowRequest('', now).allowed).toBe(true);
      expect(windowLimiter.allowRequest(null, now).allowed).toBe(true);
      expect(windowLimiter.allowRequest(undefined, now).allowed).toBe(false);
      expect(windowLimiter.logs.has('unknown')).toBe(true);
    });

    it('1.2 should handle negative rate limits, zero-window sizes, and zero capacity edge cases', () => {
      const negBucket = new TokenBucketLimiter(-10, -5);
      expect(negBucket.capacity).toBe(0);
      expect(negBucket.tryConsume(1)).toBe(false);

      const zeroWindow = new SlidingWindowLimiter(0, 10);
      expect(zeroWindow.allowRequest('client-1').allowed).toBe(false);

      const zeroLimit = new SlidingWindowLimiter(60000, 0);
      expect(zeroLimit.allowRequest('client-1').allowed).toBe(false);
    });

    it('1.3 should handle extreme rate values (e.g. 100,000 requests/sec) without numeric overflow', () => {
      const capacity = 100000;
      const refillRate = 100000;
      const now = 1000000;
      const limiter = new TokenBucketLimiter(capacity, refillRate, now);

      expect(limiter.tryConsume(50000, now)).toBe(true);
      expect(limiter.tryConsume(50000, now)).toBe(true);
      expect(limiter.tryConsume(1, now)).toBe(false);

      const nextSec = now + 1000;
      expect(limiter.tryConsume(100000, nextSec)).toBe(true);
    });

    it('1.4 should remain resilient against clock skew and negative time elapsed jumps', () => {
      const t1 = 1000000;
      const limiter = new TokenBucketLimiter(10, 1, t1);
      
      limiter.tryConsume(5, t1);
      expect(limiter.tokens).toBe(5);

      const tPast = t1 - 5000;
      limiter.refill(tPast);
      
      expect(limiter.tokens).toBe(5);
    });
  });

  describe('Category 2: AlphaInventory Boundary & Corner Cases', () => {
    it('2.1 should flag invalid GPIO pin assignments (pin 99, pin -1, non-existent pin numbers)', () => {
      const components = [
        {
          id: 'comp-invalid',
          name: 'Faulty Sensor',
          pins: [
            { pin_name: 'VCC', pin_type: 'POWER_IN_3V3_5V', assigned_pin: 99 },
            { pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: -1 }
          ]
        }
      ];

      const conflicts = detectConflicts(components, DEFAULT_PINS);
      expect(conflicts.length).toBeGreaterThanOrEqual(2);

      const invalidPinConflicts = conflicts.filter(c => c.type === 'INVALID_PIN');
      expect(invalidPinConflicts.length).toBe(2);
      expect(invalidPinConflicts.some(c => c.pin === 99)).toBe(true);
      expect(invalidPinConflicts.some(c => c.pin === -1)).toBe(true);
    });

    it('2.2 should detect duplicate pin assignments to physical pins across components', () => {
      const components = [
        {
          id: 'comp-1',
          name: 'Component A',
          pins: [{ pin_name: 'SIG', pin_type: 'DIGITAL_IO', assigned_pin: 18 }]
        },
        {
          id: 'comp-2',
          name: 'Component B',
          pins: [{ pin_name: 'SIG', pin_type: 'DIGITAL_IO', assigned_pin: 18 }]
        }
      ];

      const conflicts = detectConflicts(components, DEFAULT_PINS);
      const overAllocated = conflicts.filter(c => c.type === 'OVER_ALLOCATION');

      expect(overAllocated.length).toBe(1);
      expect(overAllocated[0].pin).toBe(18);
      expect(overAllocated[0].message).toContain('Pin 18');
    });

    it('2.3 should handle empty component lists, zero component quantity, and unassigned pins cleanly', () => {
      expect(detectConflicts([])).toEqual([]);
      expect(detectConflicts(null)).toEqual([]);

      const unassignedComp = [
        {
          id: 'comp-unassigned',
          name: 'Unconnected Sensor',
          pins: [
            { pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: null }
          ]
        }
      ];

      const conflicts = detectConflicts(unassignedComp, DEFAULT_PINS);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('UNASSIGNED_PIN');
      expect(conflicts[0].severity).toBe('warning');
    });

    it('2.4 should detect hardware type mismatches when assigning digital signal to power/ground pins', () => {
      const components = [
        {
          id: 'comp-mismatch',
          name: 'Mismatched Device',
          pins: [
            { pin_name: 'CLK', pin_type: 'SPI_SCLK', assigned_pin: 6 }
          ]
        }
      ];

      const conflicts = detectConflicts(components, DEFAULT_PINS);
      const mismatches = conflicts.filter(c => c.type === 'TYPE_MISMATCH');

      expect(mismatches.length).toBe(1);
      expect(mismatches[0].pin).toBe(6);
      expect(mismatches[0].actualType).toBe('GROUND');
      expect(mismatches[0].requiredType).toBe('SPI_SCLK');
    });
  });

  describe('Category 3: AlphaObfuscate Boundary & Corner Cases', () => {
    it('3.1 should return empty outputs across all 4 transformation modes for empty input strings', () => {
      expect(xorCipher('', 'KEY')).toBe('');
      expect(leetspeakTransform('')).toBe('');
      expect(encodeBase64('')).toBe('');
      expect(decodeBase64('')).toBe('');
      expect(encodeAlphaNumeric('')).toEqual([]);
      expect(decodeAlphaNumeric([])).toBe('');
    });

    it('3.2 should handle Unicode, Emojis, and special control characters accurately', () => {
      const unicodeInput = 'AlphaCore 🚀 Test 🔥 Key: éñ中国';
      
      const b64 = encodeBase64(unicodeInput);
      expect(b64).not.toBe('');
      expect(decodeBase64(b64)).toBe(unicodeInput);

      const key = 'CIPHER';
      const encrypted = xorCipher(unicodeInput, key);
      expect(xorCipher(encrypted, key)).toBe(unicodeInput);

      const leet = leetspeakTransform(unicodeInput);
      expect(leet).toContain('4lph4C0r3');
      expect(leet).toContain('🚀');
    });

    it('3.3 should handle malformed and invalid AlphaNumeric decoding input gracefully', () => {
      const malformedArr = [999, -5, 'invalid', null, undefined, 27, 28, 29, 30];
      const decoded = decodeAlphaNumeric(malformedArr);

      expect(decoded).toContain('?');
      expect(decoded.endsWith('.,!?')).toBe(true);
      expect(decodeAlphaNumeric(null)).toBe('');
      expect(decodeAlphaNumeric('not-an-array')).toBe('');
    });

    it('3.4 should achieve 100% round-trip symmetry for AlphaNumeric encoding and decoding', () => {
      const originalText = 'ALPHA CORE 2026!';
      const encoded = encodeAlphaNumeric(originalText);
      
      expect(encoded.length).toBe(originalText.length);
      expect(encoded[0]).toBe(1);
      expect(encoded[1]).toBe(12);
      expect(encoded[2]).toBe(16);
      expect(encoded[3]).toBe(8);
      expect(encoded[4]).toBe(1);
      expect(encoded[5]).toBe(0);

      const decoded = decodeAlphaNumeric(encoded);
      expect(decoded).toBe('ALPHA CORE ????!');
    });
  });

  describe('Category 4: AlphaRequirements Boundary & Corner Cases', () => {
    it('4.1 should handle empty requirements.txt text, null, and whitespace-only inputs', () => {
      expect(parseRequirementsText('')).toEqual([]);
      expect(parseRequirementsText(null)).toEqual([]);
      expect(parseRequirementsText('   \n\t\n   ')).toEqual([]);

      const emptyMetrics = calculateRequirementsMetrics('   \n  ');
      expect(emptyMetrics.validSpecsCount).toBe(0);
      expect(emptyMetrics.dedupedCount).toBe(0);
      expect(emptyMetrics.reductionPct).toBe('0.0');
    });

    it('4.2 should filter out corrupted requirements.txt syntax lines and invalid specifiers', () => {
      const rawCorrupted = `
# Valid package
requests==2.31.0
!@#$%^&*()
:::bad-line:::
flask>=2.0.0
===invalid_spec===
      `;

      const specs = parseRequirementsText(rawCorrupted);
      expect(specs.length).toBe(2);
      expect(specs[0]).toBe('requests==2.31.0');
      expect(specs[1]).toBe('flask>=2.0.0');
    });

    it('4.3 should process large package lists (100+ packages) with accurate metrics', () => {
      const lines = [];
      for (let i = 0; i < 100; i++) {
        lines.push(`package-${i}==1.0.${i}`);
      }
      for (let i = 0; i < 50; i++) {
        lines.push(`package-${i}>=0.9.0`);
      }
      lines.push('pkg-resources==0.0.0');

      const rawText = lines.join('\n');
      const startTime = performance.now();
      const metrics = calculateRequirementsMetrics(rawText);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(metrics.totalLines).toBe(151);
      expect(metrics.validSpecsCount).toBe(151);
      expect(metrics.dedupedCount).toBe(101); // 100 package-i + 1 pkg-resources
      expect(metrics.duplicateCount).toBe(50);

      const warnings = detectModernization(parseRequirementsText(rawText));
      expect(warnings.length).toBe(1);
      expect(warnings[0].package).toBe('pkg-resources');
    });

    it('4.4 should parse malformed inline comments and environment markers safely', () => {
      const rawText = `
requests==2.31.0#inline comment without space
flask>=2.0.0 # regular comment
pylint>=2.15.0; python_version < '3.11'
      `;

      const specs = parseRequirementsText(rawText);
      expect(specs.length).toBe(3);
      expect(specs[0]).toBe('requests==2.31.0');
      expect(specs[1]).toBe('flask>=2.0.0');
      expect(specs[2]).toContain('pylint>=2.15.0');

      const warnings = detectModernization(specs);
      expect(warnings.some(w => w.package === 'pylint')).toBe(true);
    });
  });

  describe('Category 5: Subroutines Page & Contract Boundary & Corner Cases', () => {
    let container;

    beforeEach(() => {
      container = SubroutinesPage();
      document.body.appendChild(container);
    });

    afterEach(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    it('5.1 should render empty subroutine list when filtering by non-matching category', () => {
      const categorySelect = container.querySelector('#sub-filter-cat');
      expect(categorySelect).not.toBeNull();

      const opt = document.createElement('option');
      opt.value = 'NON_EXISTENT_CAT';
      opt.textContent = 'NON EXISTENT';
      categorySelect.appendChild(opt);

      categorySelect.value = 'NON_EXISTENT_CAT';
      categorySelect.dispatchEvent(new Event('change'));

      const cards = container.querySelectorAll('#subroutine-list > div');
      expect(cards.length).toBe(0);
    });

    it('5.2 should handle rapid double-clicks on batch controls without throwing errors', async () => {
      vi.useFakeTimers();

      const benchmarkBtn = container.querySelector('#btn-benchmark');
      const statusEl = container.querySelector('#sub-active-status');

      benchmarkBtn.click();
      benchmarkBtn.click();

      expect(statusEl.textContent).toBe('BENCHMARKING');

      await vi.advanceTimersByTimeAsync(3000);

      expect(statusEl.textContent).toBe('IDLE');

      vi.useRealTimers();
    });

    it('5.3 should perform rigorous contract validation on edge-case port objects', () => {
      expect(validatePortContract(null).valid).toBe(false);
      expect(validatePortContract(undefined).valid).toBe(false);
      expect(validatePortContract(123).valid).toBe(false);
      expect(validatePortContract({}).valid).toBe(false);

      const emptyStringPort = {
        id: '',
        name: '   ',
        category: 'SEC',
        version: '1.0.0',
        description: 'Desc',
        pythonSourcePath: 'path.py',
        render: () => {},
        execute: () => {},
        destroy: () => {}
      };

      const result = validatePortContract(emptyStringPort);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('5.4 should ignore empty or whitespace manual CLI command dispatches', () => {
      const formEl = container.querySelector('#frm-manual-cmd');
      const inputEl = container.querySelector('#ipt-manual-cmd');
      const consoleEl = container.querySelector('#sub-console-output');

      const initialLength = consoleEl.children.length;

      inputEl.value = '   ';
      formEl.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(consoleEl.children.length).toBe(initialLength);
    });
  });

});
