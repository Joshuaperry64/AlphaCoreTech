import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SubroutinesPage from '../pages/subroutines.js';
import { validatePortContract } from '../ports/port-contract.js';
import alphaInventoryPort from '../ports/alphainventory/index.js';

// ============================================================================
// TIER 3: CROSS-FEATURE INTEGRATION TEST SUITE (12 TESTS)
// ============================================================================

// Rate Limiter
class SlidingWindowLimiter {
  constructor(windowMs, limit) {
    this.windowMs = windowMs;
    this.limit = limit;
    this.logs = new Map();
  }

  allowRequest(clientId, timestamp = Date.now()) {
    if (!this.logs.has(clientId)) {
      this.logs.set(clientId, []);
    }
    const timestamps = this.logs.get(clientId);
    const validWindowStart = timestamp - this.windowMs;
    const filtered = timestamps.filter(ts => ts > validWindowStart);

    if (filtered.length < this.limit) {
      filtered.push(timestamp);
      this.logs.set(clientId, filtered);
      return { allowed: true, remaining: this.limit - filtered.length };
    }

    this.logs.set(clientId, filtered);
    return { allowed: false, remaining: 0 };
  }
}

// Obfuscator
function xorCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encodeBase64(str) {
  return typeof btoa !== 'undefined' ? btoa(str) : Buffer.from(str).toString('base64');
}

// Requirements
function parseRequirementsText(text) {
  if (!text) return [];
  return text.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('-'))
    .map(l => l.split('#')[0].trim());
}

function detectModernization(specs) {
  const mappings = {
    'pkg-resources': { replacement: 'importlib.metadata' },
    'pylint': { replacement: 'ruff' }
  };
  return specs.map(s => s.split(/[<>=~!]/)[0].trim()).filter(p => mappings[p]).map(p => ({ package: p, replacement: mappings[p].replacement }));
}

describe('Tier 3: Cross-Feature Integration Test Suite', () => {
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

  it('3.1 should maintain execution console state when switching category filters during execution', async () => {
    vi.useFakeTimers();

    const firstCard = container.querySelector('#subroutine-list > div');
    const runBtn = firstCard.querySelector('.run-sub-btn');
    const categorySelect = container.querySelector('#sub-filter-cat');
    const consoleEl = container.querySelector('#sub-console-output');

    runBtn.click();
    expect(consoleEl.textContent).toContain('INITIATING SYNAPSE_PRUNING_V4');

    // Switch category while running
    categorySelect.value = 'NEURAL';
    categorySelect.dispatchEvent(new Event('change'));

    // Console output should persist
    expect(consoleEl.textContent).toContain('INITIATING SYNAPSE_PRUNING_V4');

    await vi.advanceTimersByTimeAsync(2000);
    expect(consoleEl.textContent).toContain('COMPLETED SUCCESSFULLY');

    vi.useRealTimers();
  });

  it('3.2 should allow toggling search & filter controls while benchmark is executing', async () => {
    vi.useFakeTimers();

    const benchmarkBtn = container.querySelector('#btn-benchmark');
    const categorySelect = container.querySelector('#sub-filter-cat');
    const consoleEl = container.querySelector('#sub-console-output');

    benchmarkBtn.click();
    expect(consoleEl.textContent).toContain('STARTING COGNITIVE MATRIX BENCHMARK');

    categorySelect.value = 'PERF';
    categorySelect.dispatchEvent(new Event('change'));

    await vi.advanceTimersByTimeAsync(3000);
    expect(consoleEl.textContent).toContain('BENCHMARK COMPLETE');

    vi.useRealTimers();
  });

  it('3.3 should handle interaction between CLEAR LOGS and active autoscroll setting', () => {
    const consoleEl = container.querySelector('#sub-console-output');
    const clearBtn = container.querySelector('#btn-clear-sub-log');
    const autoscrollChk = container.querySelector('#chk-autoscroll');

    expect(autoscrollChk.checked).toBe(true);

    for (let i = 0; i < 20; i++) {
      consoleEl.innerHTML += `<div>Log Line ${i}</div>`;
    }

    clearBtn.click();
    expect(consoleEl.children.length).toBe(1);
    expect(consoleEl.textContent).toContain('Execution logs cleared');
  });

  it('3.4 should pipeline AlphaObfuscate output directly into AlphaLimiter as client identifier', () => {
    const rawClientIp = '10.0.4.155';
    const secretKey = 'OBF_SALT';

    const obfuscatedKey = encodeBase64(xorCipher(rawClientIp, secretKey));
    expect(obfuscatedKey).not.toBe(rawClientIp);

    const limiter = new SlidingWindowLimiter(60000, 2);
    expect(limiter.allowRequest(obfuscatedKey, 1000).allowed).toBe(true);
    expect(limiter.allowRequest(obfuscatedKey, 2000).allowed).toBe(true);
    expect(limiter.allowRequest(obfuscatedKey, 3000).allowed).toBe(false);
  });

  it('3.5 should pipeline AlphaInventory BOM into AlphaRequirements package analyzer', () => {
    const inventoryBOM = [
      { name: 'RPi GPIO Controller', requirements: ['pkg-resources==0.0.0', 'requests>=2.28.0'] },
      { name: 'OLED Display Driver', requirements: ['pylint>=2.15.0', 'pillow>=9.0.0'] }
    ];

    const allReqs = inventoryBOM.flatMap(item => item.requirements);
    const parsedSpecs = parseRequirementsText(allReqs.join('\n'));
    const warnings = detectModernization(parsedSpecs);

    expect(warnings.length).toBe(2);
    expect(warnings.some(w => w.package === 'pkg-resources')).toBe(true);
    expect(warnings.some(w => w.package === 'pylint')).toBe(true);
  });

  it('3.6 should execute headless port contracts dynamically from central registry', async () => {
    const registeredPorts = [alphaInventoryPort];

    for (const port of registeredPorts) {
      const validation = validatePortContract(port);
      expect(validation.valid).toBe(true);

      const result = await port.execute();
      expect(result.success).toBe(true);
      expect(result.output).toContain('[AlphaInventory]');
    }
  });

  it('3.7 should support DOM container teardown and re-mounting without state leaks', () => {
    expect(container.querySelector('#subroutine-list')).not.toBeNull();

    // Unmount
    container.remove();

    // Re-mount
    const newContainer = SubroutinesPage();
    document.body.appendChild(newContainer);

    expect(newContainer.querySelector('#subroutine-list')).not.toBeNull();
    expect(newContainer.querySelectorAll('#subroutine-list > div').length).toBe(8);

    newContainer.remove();
  });

  it('3.8 should run concurrent rate limit evaluation and dependency modernization checks', async () => {
    const limiter = new SlidingWindowLimiter(60000, 5);
    const reqText = 'pkg-resources==0.0.0\nrequests==2.31.0';

    const [limitResult, modernWarnings] = await Promise.all([
      Promise.resolve(limiter.allowRequest('user-1')),
      Promise.resolve(detectModernization(parseRequirementsText(reqText)))
    ]);

    expect(limitResult.allowed).toBe(true);
    expect(modernWarnings.length).toBe(1);
    expect(modernWarnings[0].package).toBe('pkg-resources');
  });

  it('3.9 should log port execution summary into Subroutines console output', async () => {
    const consoleEl = container.querySelector('#sub-console-output');

    const execResult = await alphaInventoryPort.execute({ components: [] });
    
    // Append port execution summary to console log
    consoleEl.innerHTML += `<div class="log-port">${execResult.output}</div>`;

    expect(consoleEl.textContent).toContain('[AlphaInventory] Scan complete.');
  });

  it('3.10 should handle CLI command dispatch for obfuscated command strings', async () => {
    vi.useFakeTimers();

    const formEl = container.querySelector('#frm-manual-cmd');
    const inputEl = container.querySelector('#ipt-manual-cmd');
    const consoleEl = container.querySelector('#sub-console-output');

    const obfuscatedCmd = 'EXECUTE SUB-01 --force';
    inputEl.value = obfuscatedCmd;
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(consoleEl.textContent).toContain(`> ${obfuscatedCmd}`);

    await vi.advanceTimersByTimeAsync(300);

    expect(consoleEl.textContent).toContain("[ACK] Command 'EXECUTE SUB-01 --force' processed");

    vi.useRealTimers();
  });

  it('3.11 should preserve category filter selection during benchmark run', async () => {
    vi.useFakeTimers();

    const categorySelect = container.querySelector('#sub-filter-cat');
    const benchmarkBtn = container.querySelector('#btn-benchmark');

    categorySelect.value = 'NEURAL';
    categorySelect.dispatchEvent(new Event('change'));

    benchmarkBtn.click();

    expect(categorySelect.value).toBe('NEURAL');

    await vi.advanceTimersByTimeAsync(3000);

    expect(categorySelect.value).toBe('NEURAL');

    vi.useRealTimers();
  });

  it('3.12 should throttle multiple obfuscated client sessions independently', () => {
    const limiter = new SlidingWindowLimiter(60000, 1);
    const keyA = encodeBase64('clientA');
    const keyB = encodeBase64('clientB');

    expect(limiter.allowRequest(keyA).allowed).toBe(true);
    expect(limiter.allowRequest(keyB).allowed).toBe(true);

    expect(limiter.allowRequest(keyA).allowed).toBe(false);
    expect(limiter.allowRequest(keyB).allowed).toBe(false);
  });
});
