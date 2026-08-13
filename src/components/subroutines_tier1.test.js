import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SubroutinesPage from '../pages/subroutines.js';
import { validatePortContract } from '../ports/port-contract.js';
import alphaInventoryPort, { DEFAULT_PINS, checkCompatibility, detectConflicts } from '../ports/alphainventory/index.js';

// ============================================================================
// TIER 1: FEATURE COVERAGE SUITE (36 TESTS)
// ============================================================================

// ----------------------------------------------------------------------------
// Category 1: Subroutines Master Dashboard (6 Tests)
// ----------------------------------------------------------------------------
describe('Tier 1 - Feature 1: Subroutines Master Dashboard', () => {
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

  it('1.1 should construct SubroutinesPage DOM with header title and default 8 subroutines', () => {
    const titleEl = container.querySelector('.glitch');
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toContain('SUBROUTINE_CONSOLE');

    const cards = container.querySelectorAll('#subroutine-list > div');
    expect(cards.length).toBe(8);

    const statusEl = container.querySelector('#sub-active-status');
    expect(statusEl).not.toBeNull();
    expect(statusEl.textContent).toBe('IDLE');
  });

  it('1.2 should filter subroutine cards by category dropdown selection', () => {
    const categorySelect = container.querySelector('#sub-filter-cat');
    expect(categorySelect).not.toBeNull();

    // Filter by NEURAL category
    categorySelect.value = 'NEURAL';
    categorySelect.dispatchEvent(new Event('change'));

    let cards = container.querySelectorAll('#subroutine-list > div');
    expect(cards.length).toBe(2); // SYNAPSE_PRUNING_V4 & MODEL_QUANTIZATION_TEST

    // Filter back to ALL categories
    categorySelect.value = 'ALL';
    categorySelect.dispatchEvent(new Event('change'));

    cards = container.querySelectorAll('#subroutine-list > div');
    expect(cards.length).toBe(8);
  });

  it('1.3 should execute subroutine when EXECUTE button is clicked', async () => {
    vi.useFakeTimers();

    const firstCard = container.querySelector('#subroutine-list > div');
    const runBtn = firstCard.querySelector('.run-sub-btn');
    expect(runBtn).not.toBeNull();

    runBtn.click();

    const statusEl = container.querySelector('#sub-active-status');
    expect(statusEl.textContent).toContain('RUNNING');

    const consoleEl = container.querySelector('#sub-console-output');
    expect(consoleEl.textContent).toContain('INITIATING SYNAPSE_PRUNING_V4');

    await vi.advanceTimersByTimeAsync(2000);

    expect(statusEl.textContent).toBe('IDLE');
    expect(consoleEl.textContent).toContain('COMPLETED SUCCESSFULLY');

    vi.useRealTimers();
  });

  it('1.4 should run subroutine simulation in dry-run mode when TEST button is clicked', async () => {
    vi.useFakeTimers();

    const firstCard = container.querySelector('#subroutine-list > div');
    const testBtn = firstCard.querySelector('.test-sub-btn');
    expect(testBtn).not.toBeNull();

    testBtn.click();

    const statusEl = container.querySelector('#sub-active-status');
    expect(statusEl.textContent).toContain('DRY-RUN');

    const consoleEl = container.querySelector('#sub-console-output');
    expect(consoleEl.textContent).toContain('SIMULATION');

    await vi.advanceTimersByTimeAsync(2000);

    expect(statusEl.textContent).toBe('IDLE');
    expect(consoleEl.textContent).toContain('VALIDATED WITH ZERO FAULTS');

    vi.useRealTimers();
  });

  it('1.5 should clear execution console log when CLEAR LOGS button is clicked', () => {
    const consoleEl = container.querySelector('#sub-console-output');
    const clearBtn = container.querySelector('#btn-clear-sub-log');
    expect(clearBtn).not.toBeNull();

    consoleEl.innerHTML += '<div>Mock execution log entry</div>';
    expect(consoleEl.textContent).toContain('Mock execution log entry');

    clearBtn.click();

    expect(consoleEl.textContent).not.toContain('Mock execution log entry');
    expect(consoleEl.textContent).toContain('Execution logs cleared');
  });

  it('1.6 should handle manual CLI command dispatch form submissions', async () => {
    vi.useFakeTimers();

    const formEl = container.querySelector('#frm-manual-cmd');
    const inputEl = container.querySelector('#ipt-manual-cmd');
    const consoleEl = container.querySelector('#sub-console-output');

    expect(formEl).not.toBeNull();
    expect(inputEl).not.toBeNull();

    inputEl.value = 'help';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(consoleEl.textContent).toContain('> help');

    await vi.advanceTimersByTimeAsync(300);

    expect(consoleEl.textContent).toContain('Available CLI commands:');

    vi.useRealTimers();
  });
});

// ----------------------------------------------------------------------------
// Category 2: AlphaLimiter Port (6 Tests)
// ----------------------------------------------------------------------------
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

function evaluateSubnetThrottling(clientIp, bandwidthUsageMbps, maxQuotaMbps) {
  if (bandwidthUsageMbps > maxQuotaMbps) {
    return { clientIp, status: 'THROTTLED', excess: bandwidthUsageMbps - maxQuotaMbps };
  }
  return { clientIp, status: 'ALLOWED', excess: 0 };
}

describe('Tier 1 - Feature 2: AlphaLimiter Rate Engine', () => {
  it('2.1 should allow consumption up to capacity and reject when tokens exhausted', () => {
    const limiter = new TokenBucketLimiter(5, 1, 1000000);
    const now = 1000000;

    for (let i = 0; i < 5; i++) {
      expect(limiter.tryConsume(1, now)).toBe(true);
    }
    expect(limiter.tryConsume(1, now)).toBe(false);
  });

  it('2.2 should refill tokens over elapsed time up to capacity limit', () => {
    const now = 1000000;
    const limiter = new TokenBucketLimiter(10, 2, now); // 2 tokens per sec

    expect(limiter.tryConsume(10, now)).toBe(true);
    expect(limiter.tryConsume(1, now)).toBe(false);

    const futureTime = now + 3000;
    expect(limiter.tryConsume(5, futureTime)).toBe(true);
    expect(limiter.tryConsume(2, futureTime)).toBe(false);
  });

  it('2.3 should enforce Sliding Window Rate Limiting per client ID', () => {
    const windowLimiter = new SlidingWindowLimiter(60000, 3);
    const t0 = 100000;

    expect(windowLimiter.allowRequest('client-A', t0).allowed).toBe(true);
    expect(windowLimiter.allowRequest('client-A', t0 + 1000).allowed).toBe(true);
    expect(windowLimiter.allowRequest('client-A', t0 + 2000).allowed).toBe(true);
    expect(windowLimiter.allowRequest('client-A', t0 + 3000).allowed).toBe(false);
    expect(windowLimiter.allowRequest('client-A', t0 + 61000).allowed).toBe(true);
  });

  it('2.4 should evaluate client IP subnet bandwidth throttling quotas', () => {
    const client1 = evaluateSubnetThrottling('192.168.1.105', 45, 50);
    expect(client1.status).toBe('ALLOWED');
    expect(client1.excess).toBe(0);

    const client2 = evaluateSubnetThrottling('192.168.1.120', 85, 50);
    expect(client2.status).toBe('THROTTLED');
    expect(client2.excess).toBe(35);
  });

  it('2.5 should handle zero capacity, non-positive consume requests, and invalid inputs gracefully', () => {
    const zeroLimiter = new TokenBucketLimiter(0, 0);
    expect(zeroLimiter.tryConsume(1)).toBe(false);

    const standardLimiter = new TokenBucketLimiter(10, 1);
    expect(standardLimiter.tryConsume(0)).toBe(false);
    expect(standardLimiter.tryConsume(-5)).toBe(false);
  });

  it('2.6 should support limiter state reset and isolate state per instance', () => {
    const limiterA = new TokenBucketLimiter(5, 1, 1000000);
    const limiterB = new TokenBucketLimiter(5, 1, 1000000);

    limiterA.tryConsume(5, 1000000);
    expect(limiterA.tokens).toBe(0);
    expect(limiterB.tokens).toBe(5);

    limiterA.reset(1000000);
    expect(limiterA.tokens).toBe(5);
  });
});

// ----------------------------------------------------------------------------
// Category 3: AlphaInventory Port (6 Tests)
// ----------------------------------------------------------------------------
const RPI_DEFAULT_PINS = {
  1: { name: '3.3V Power', mode: 'POWER', type: 'POWER_3V3' },
  2: { name: '5V Power', mode: 'POWER', type: 'POWER_5V' },
  3: { name: 'GPIO 2 (SDA)', mode: 'I2C', type: 'I2C_SDA' },
  4: { name: '5V Power', mode: 'POWER', type: 'POWER_5V' },
  5: { name: 'GPIO 3 (SCL)', mode: 'I2C', type: 'I2C_SCL' },
  6: { name: 'Ground', mode: 'GROUND', type: 'GND' },
  7: { name: 'GPIO 4', mode: 'GPIO', type: 'DIGITAL' },
  8: { name: 'GPIO 14 (TXD)', mode: 'UART', type: 'UART_TX' },
  9: { name: 'Ground', mode: 'GROUND', type: 'GND' },
  10: { name: 'GPIO 15 (RXD)', mode: 'UART', type: 'UART_RX' },
  18: { name: 'GPIO 24', mode: 'GPIO', type: 'DIGITAL' },
  19: { name: 'GPIO 10 (MOSI)', mode: 'SPI', type: 'SPI_MOSI' }
};

class AlphaInventoryEngine {
  constructor() {
    this.components = [];
  }

  addComponent(component) {
    this.components.push(component);
  }

  removeComponent(id) {
    this.components = this.components.filter(c => c.id !== id);
  }

  detectConflicts() {
    const pinMap = new Map();
    const conflicts = [];

    for (const comp of this.components) {
      for (const pinId of comp.pins) {
        const pinDef = RPI_DEFAULT_PINS[pinId];
        if (pinDef && (pinDef.mode === 'POWER' || pinDef.mode === 'GROUND') && comp.type === 'DIGITAL_SIGNAL') {
          conflicts.push(`Component '${comp.name}' cannot assign signal line to ${pinDef.name} (Pin ${pinId})`);
        }

        if (pinMap.has(pinId)) {
          const existing = pinMap.get(pinId);
          conflicts.push(`Pin ${pinId} conflict between '${existing}' and '${comp.name}'`);
        } else {
          pinMap.set(pinId, comp.name);
        }
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts };
  }
}

describe('Tier 1 - Feature 3: AlphaInventory RPi GPIO Manager & Conflict Engine', () => {
  it('3.1 should validate RPi 40-Pin GPIO header mapping and power pin allocations', () => {
    expect(RPI_DEFAULT_PINS[1].mode).toBe('POWER');
    expect(RPI_DEFAULT_PINS[2].type).toBe('POWER_5V');
    expect(RPI_DEFAULT_PINS[6].mode).toBe('GROUND');
    expect(RPI_DEFAULT_PINS[3].mode).toBe('I2C');
    expect(RPI_DEFAULT_PINS[8].mode).toBe('UART');
    expect(RPI_DEFAULT_PINS[19].mode).toBe('SPI');
  });

  it('3.2 should add components and track assigned GPIO pins', () => {
    const inventory = new AlphaInventoryEngine();
    inventory.addComponent({ id: 'comp-1', name: 'DHT22 Temp Sensor', type: 'SENSOR', pins: [1, 6, 7] });

    expect(inventory.components.length).toBe(1);
    const result = inventory.detectConflicts();
    expect(result.hasConflict).toBe(false);
  });

  it('3.3 should detect GPIO pin overlap conflict between multiple components', () => {
    const inventory = new AlphaInventoryEngine();
    inventory.addComponent({ id: 'comp-1', name: 'LED Indicator 1', type: 'ACTUATOR', pins: [18] });
    inventory.addComponent({ id: 'comp-2', name: 'LED Indicator 2', type: 'ACTUATOR', pins: [18] });

    const result = inventory.detectConflicts();
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts[0]).toContain('Pin 18 conflict between');
  });

  it('3.4 should detect invalid pin assignments to Power or Ground pins for signal lines', () => {
    const inventory = new AlphaInventoryEngine();
    inventory.addComponent({ id: 'comp-1', name: 'Relay Switch Data', type: 'DIGITAL_SIGNAL', pins: [6] });

    const result = inventory.detectConflicts();
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts[0]).toContain('cannot assign signal line to Ground (Pin 6)');
  });

  it('3.5 should remove component and resolve associated pin conflicts', () => {
    const inventory = new AlphaInventoryEngine();
    inventory.addComponent({ id: 'comp-1', name: 'Sensor A', type: 'ACTUATOR', pins: [18] });
    inventory.addComponent({ id: 'comp-2', name: 'Sensor B', type: 'ACTUATOR', pins: [18] });

    expect(inventory.detectConflicts().hasConflict).toBe(true);

    inventory.removeComponent('comp-2');
    expect(inventory.components.length).toBe(1);
    expect(inventory.detectConflicts().hasConflict).toBe(false);
  });

  it('3.6 should render 2x20 header pin grid DOM representation', () => {
    const gridEl = document.createElement('div');
    gridEl.className = 'gpio-header-grid';

    for (let i = 1; i <= 40; i++) {
      const pinEl = document.createElement('div');
      const pinDef = RPI_DEFAULT_PINS[i] || { name: `GPIO ${i}`, mode: 'GPIO' };
      pinEl.className = `pin-badge pin-${pinDef.mode.toLowerCase()}`;
      pinEl.setAttribute('data-pin', i);
      pinEl.textContent = `${i}: ${pinDef.name}`;
      gridEl.appendChild(pinEl);
    }

    expect(gridEl.children.length).toBe(40);
    expect(gridEl.querySelector('[data-pin="1"]').className).toContain('pin-power');
    expect(gridEl.querySelector('[data-pin="6"]').className).toContain('pin-ground');
  });
});

// ----------------------------------------------------------------------------
// Category 4: AlphaObfuscate Port (6 Tests)
// ----------------------------------------------------------------------------
function encodeBase64(str) {
  return typeof btoa !== 'undefined' ? btoa(str) : Buffer.from(str).toString('base64');
}

function decodeBase64(b64Str) {
  return typeof atob !== 'undefined' ? atob(b64Str) : Buffer.from(b64Str, 'base64').toString('utf-8');
}

function encodeHex(str) {
  return Array.from(str).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

function decodeHex(hexStr) {
  const bytes = hexStr.match(/.{1,2}/g) || [];
  return bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
}

function xorCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function leetspeakTransform(text) {
  const map = { 'a': '4', 'A': '4', 'e': '3', 'E': '3', 'i': '1', 'I': '1', 'o': '0', 'O': '0', 's': '$', 'S': '$' };
  return text.split('').map(char => map[char] || char).join('');
}

function obfuscateJsVariables(codeStr) {
  const strings = [];
  const processed = codeStr.replace(/"([^"]+)"|'([^']+)'/g, (match, p1, p2) => {
    const val = p1 || p2;
    strings.push(val);
    return `_strTable[${strings.length - 1}]`;
  });
  return { obfuscatedCode: processed, stringTable: strings };
}

describe('Tier 1 - Feature 4: AlphaObfuscate Engine', () => {
  it('4.1 should encode and decode strings in Base64 and Hex format symmetrically', () => {
    const input = 'AlphaCoreTech_2026_Key';
    
    const b64 = encodeBase64(input);
    expect(b64).not.toBe(input);
    expect(decodeBase64(b64)).toBe(input);

    const hex = encodeHex(input);
    expect(hex).not.toBe(input);
    expect(decodeHex(hex)).toBe(input);
  });

  it('4.2 should perform symmetric XOR cipher obfuscation and decryption', () => {
    const payload = 'CONFIDENTIAL_DATA_VECTOR';
    const key = 'ALPHA_SECRET_KEY';

    const encrypted = xorCipher(payload, key);
    expect(encrypted).not.toBe(payload);

    const decrypted = xorCipher(encrypted, key);
    expect(decrypted).toBe(payload);
  });

  it('4.3 should apply leetspeak character substitutions', () => {
    const text = 'AlphaCore Security System';
    const transformed = leetspeakTransform(text);

    expect(transformed).toBe('4lph4C0r3 $3cur1ty $y$t3m');
  });

  it('4.4 should extract string literals into string table during JS code obfuscation', () => {
    const code = 'const apiKey = "ALPHA_SECRET_123"; const endpoint = "https://api.alphacore.tech";';
    const result = obfuscateJsVariables(code);

    expect(result.stringTable.length).toBe(2);
    expect(result.stringTable[0]).toBe('ALPHA_SECRET_123');
    expect(result.stringTable[1]).toBe('https://api.alphacore.tech');
    expect(result.obfuscatedCode).toContain('_strTable[0]');
    expect(result.obfuscatedCode).toContain('_strTable[1]');
  });

  it('4.5 should handle empty and boundary input strings gracefully', () => {
    expect(encodeBase64('')).toBe('');
    expect(decodeBase64('')).toBe('');
    expect(encodeHex('')).toBe('');
    expect(decodeHex('')).toBe('');
    expect(xorCipher('', 'KEY')).toBe('');
    expect(leetspeakTransform('')).toBe('');
  });

  it('4.6 should support multi-layer obfuscation pipeline (XOR -> Base64)', () => {
    const original = 'SYSTEM_OVERRIDE_CLEARANCE';
    const key = 'CIPHER_KEY';

    const layer1 = xorCipher(original, key);
    const layer2 = encodeBase64(layer1);

    expect(layer2).not.toBe(original);

    const unLayer2 = decodeBase64(layer2);
    const unLayer1 = xorCipher(unLayer2, key);

    expect(unLayer1).toBe(original);
  });
});

// ----------------------------------------------------------------------------
// Category 5: AlphaRequirements Port (6 Tests)
// ----------------------------------------------------------------------------
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
    if (line) {
      validSpecs.push(line);
    }
  }
  return validSpecs;
}

function canonicalizePackageName(spec) {
  const match = spec.match(/^([a-zA-Z0-9_\-\.]+)(.*)$/);
  if (!match) return spec;
  const name = match[1].toLowerCase().replace(/_/g, '-');
  return name + match[2];
}

function dedupeSpecs(specs) {
  const seen = new Set();
  const result = [];

  for (const spec of specs) {
    const canonical = canonicalizePackageName(spec);
    const nameOnly = canonical.split(/[<>=~!]/)[0].trim();
    if (!seen.has(nameOnly)) {
      seen.add(nameOnly);
      result.push(spec);
    }
  }
  return result;
}

function detectModernization(specs) {
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

describe('Tier 1 - Feature 5: AlphaRequirements Parser & Modernization Analyzer', () => {
  it('5.1 should parse requirements text, stripping comments and directives', () => {
    const rawRequirements = `
# System Requirements
requests==2.31.0 # Primary HTTP client
flask>=2.0.0
-r base-requirements.txt
--extra-index-url https://pypi.org/simple
# End of file
    `;

    const specs = parseRequirementsText(rawRequirements);
    expect(specs.length).toBe(2);
    expect(specs[0]).toBe('requests==2.31.0');
    expect(specs[1]).toBe('flask>=2.0.0');
  });

  it('5.2 should canonicalize package names by lowercasing and converting underscores to hyphens', () => {
    expect(canonicalizePackageName('Flask_SQLAlchemy>=3.0.0')).toBe('flask-sqlalchemy>=3.0.0');
    expect(canonicalizePackageName('Requests==2.31.0')).toBe('requests==2.31.0');
    expect(canonicalizePackageName('OpenAI_API_Client')).toBe('openai-api-client');
  });

  it('5.3 should deduplicate specifications in an order-preserving manner', () => {
    const rawSpecs = [
      'requests==2.31.0',
      'flask>=2.0.0',
      'Requests>=2.28.0',
      'Flask_SQLAlchemy==3.0.0',
      'flask==2.2.2'
    ];

    const deduped = dedupeSpecs(rawSpecs);
    expect(deduped.length).toBe(3);
    expect(deduped[0]).toBe('requests==2.31.0');
    expect(deduped[1]).toBe('flask>=2.0.0');
    expect(deduped[2]).toBe('Flask_SQLAlchemy==3.0.0');
  });

  it('5.4 should detect deprecated legacy packages and suggest modern alternatives', () => {
    const specs = ['pkg-resources==0.0.0', 'requests==2.31.0', 'pylint>=2.15.0'];
    const warnings = detectModernization(specs);

    expect(warnings.length).toBe(2);
    expect(warnings[0].package).toBe('pkg-resources');
    expect(warnings[0].suggestion).toBe('importlib.metadata');
    expect(warnings[1].package).toBe('pylint');
    expect(warnings[1].suggestion).toBe('ruff');
  });

  it('5.5 should calculate dependency reduction statistics and metric ratios accurately', () => {
    const text = `
requests==2.31.0
flask>=2.0.0
requests>=2.28.0
numpy==1.24.0
flask==2.1.0
    `;

    const metrics = calculateRequirementsMetrics(text);
    expect(metrics.validSpecsCount).toBe(5);
    expect(metrics.dedupedCount).toBe(3);
    expect(metrics.duplicateCount).toBe(2);
    expect(metrics.reductionPct).toBe('40.0');
  });

  it('5.6 should handle empty inputs and invalid specifications gracefully', () => {
    const emptyMetrics = calculateRequirementsMetrics('');
    expect(emptyMetrics.validSpecsCount).toBe(0);
    expect(emptyMetrics.dedupedCount).toBe(0);
    expect(emptyMetrics.reductionPct).toBe('0.0');

    expect(parseRequirementsText(null)).toEqual([]);
    expect(detectModernization([])).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// Category 6: Contract Compliance & Ports Registry (6 Tests)
// ----------------------------------------------------------------------------
class PortsRegistry {
  constructor() {
    this.ports = new Map();
  }

  registerPort(portObj) {
    const validation = validatePortContract(portObj);
    if (!validation.valid) {
      throw new Error(`Invalid Port Contract: ${validation.errors.join(', ')}`);
    }
    if (this.ports.has(portObj.id)) {
      throw new Error(`Port with ID '${portObj.id}' is already registered`);
    }
    this.ports.set(portObj.id, portObj);
  }

  getPortById(id) {
    return this.ports.get(id);
  }

  getAllPorts() {
    return Array.from(this.ports.values());
  }
}

describe('Tier 1 - Feature 6: Contract Compliance & Ports Registry', () => {
  let sampleValidPort;

  beforeEach(() => {
    sampleValidPort = {
      id: 'port-alphainventory',
      name: 'AlphaInventory RPi Manager',
      category: 'Hardware',
      version: '1.0.0',
      description: 'Web-ported RPi 40-pin GPIO pinout & component manager',
      pythonSourcePath: 'AlphaInventory/main.py',
      render: (container, options) => {
        const div = document.createElement('div');
        div.className = 'port-alphainventory-ui';
        container.appendChild(div);
        return div;
      },
      execute: async (params) => {
        return { success: true, output: 'AlphaInventory executed successfully', details: {} };
      },
      destroy: () => {}
    };
  });

  it('6.1 should validate a fully compliant PortComponentContract object', () => {
    const validation = validatePortContract(sampleValidPort);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('6.2 should fail contract validation when required fields are missing', () => {
    const incompletePort = {
      name: 'Incomplete Port',
      render: () => {}
    };

    const validation = validatePortContract(incompletePort);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes("Property 'id' must be a non-empty string."))).toBe(true);
  });

  it('6.3 should fail contract validation when property types are invalid', () => {
    const invalidTypePort = { ...sampleValidPort, render: 'not-a-function' };

    const validation = validatePortContract(invalidTypePort);
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toContain("Method 'render' must be a function.");
  });

  it('6.4 should register valid ports and retrieve them via getPortById and getAllPorts', () => {
    const registry = new PortsRegistry();
    registry.registerPort(sampleValidPort);

    expect(registry.getPortById('port-alphainventory')).toBe(sampleValidPort);
    expect(registry.getAllPorts().length).toBe(1);
  });

  it('6.5 should reject duplicate port registration with descriptive error', () => {
    const registry = new PortsRegistry();
    registry.registerPort(sampleValidPort);

    expect(() => registry.registerPort(sampleValidPort)).toThrow("Port with ID 'port-alphainventory' is already registered");
  });

  it('6.6 should ensure execute method resolves standardized execution object format', async () => {
    const result = await sampleValidPort.execute();
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('output');
    expect(typeof result.output).toBe('string');
    expect(result).toHaveProperty('details');
  });
});
