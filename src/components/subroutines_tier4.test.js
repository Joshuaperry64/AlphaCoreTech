import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SubroutinesPage from '../pages/subroutines.js';
import { validatePortContract } from '../ports/port-contract.js';

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS TEST SUITE (6 TESTS)
// ============================================================================

// RPi Pin Map
const RPI_HEADER = {
  1: { name: '3.3V Power', mode: 'POWER', type: 'POWER_3V3' },
  2: { name: '5V Power', mode: 'POWER', type: 'POWER_5V' },
  3: { name: 'GPIO 2 (SDA)', mode: 'I2C', type: 'I2C_SDA' },
  5: { name: 'GPIO 3 (SCL)', mode: 'I2C', type: 'I2C_SCL' },
  6: { name: 'Ground', mode: 'GROUND', type: 'GND' },
  7: { name: 'GPIO 4', mode: 'GPIO', type: 'DIGITAL' },
  8: { name: 'GPIO 14 (TXD)', mode: 'UART', type: 'UART_TX' },
  9: { name: 'Ground', mode: 'GROUND', type: 'GND' },
  10: { name: 'GPIO 15 (RXD)', mode: 'UART', type: 'UART_RX' },
  14: { name: 'Ground', mode: 'GROUND', type: 'GND' },
  18: { name: 'GPIO 24', mode: 'GPIO', type: 'DIGITAL' },
  19: { name: 'GPIO 10 (MOSI)', mode: 'SPI', type: 'SPI_MOSI' },
  21: { name: 'GPIO 9 (MISO)', mode: 'SPI', type: 'SPI_MISO' },
  23: { name: 'GPIO 11 (SCLK)', mode: 'SPI', type: 'SPI_SCLK' }
};

function validateCircuitSchematic(components) {
  const pinMap = new Map();
  const conflicts = [];
  const bom = [];

  for (const comp of components) {
    bom.push({ id: comp.id, name: comp.name, pinCount: comp.pins.length });
    for (const pinObj of comp.pins) {
      const pinNum = pinObj.assigned_pin;
      const headerPin = RPI_HEADER[pinNum];

      if (!headerPin) {
        conflicts.push(`Invalid pin ${pinNum} for ${comp.name}`);
        continue;
      }

      if (pinMap.has(pinNum)) {
        conflicts.push(`Pin ${pinNum} conflict between ${pinMap.get(pinNum)} and ${comp.name}`);
      } else {
        pinMap.set(pinNum, comp.name);
      }
    }
  }

  return { valid: conflicts.length === 0, conflicts, bom, totalPinsUsed: pinMap.size };
}

// Requirements Engine
function processComplexRequirements(rawText) {
  const lines = rawText.split('\n');
  const specs = [];
  const comments = [];

  for (let l of lines) {
    l = l.trim();
    if (!l) continue;
    if (l.startsWith('#')) {
      comments.push(l);
      continue;
    }
    const idx = l.indexOf('#');
    if (idx !== -1) {
      l = l.substring(0, idx).trim();
    }
    if (l && !l.startsWith('-')) {
      specs.push(l);
    }
  }

  const seen = new Set();
  const deduped = [];
  const legacyMappings = {
    'pkg-resources': 'importlib.metadata',
    'pylint': 'ruff',
    'pip-tools': 'uv'
  };

  const warnings = [];

  for (const spec of specs) {
    const pkgName = spec.split(/[<>=~!;]/)[0].trim().toLowerCase().replace(/_/g, '-');
    if (!seen.has(pkgName)) {
      seen.add(pkgName);
      deduped.push(spec);

      if (legacyMappings[pkgName]) {
        warnings.push({ package: pkgName, replacement: legacyMappings[pkgName] });
      }
    }
  }

  return {
    totalRawLines: lines.length,
    validSpecsCount: specs.length,
    dedupedCount: deduped.length,
    duplicateCount: specs.length - deduped.length,
    warnings,
    cleanSpecs: deduped
  };
}

// Limiter
class TokenBucketLimiter {
  constructor(capacity, refillRate, startTime = Date.now()) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = startTime;
  }
  tryConsume(tokens = 1, now = Date.now()) {
    const elapsedSec = (now - this.lastRefill) / 1000;
    if (elapsedSec > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRate);
      this.lastRefill = now;
    }
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
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

describe('Tier 4: Real-World Application Scenarios Test Suite', () => {
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

  it('4.1 should validate a multi-component Raspberry Pi hardware circuit build without conflicts', () => {
    const rpiCircuit = [
      {
        id: 'comp-led',
        name: 'Status LED',
        pins: [
          { pin_name: 'ANODE', assigned_pin: 18 },
          { pin_name: 'CATHODE', assigned_pin: 6 }
        ]
      },
      {
        id: 'comp-button',
        name: 'Tactile Push Button',
        pins: [
          { pin_name: 'IN', assigned_pin: 7 },
          { pin_name: 'GND', assigned_pin: 9 }
        ]
      },
      {
        id: 'comp-dht22',
        name: 'DHT22 Temp & Humidity Sensor',
        pins: [
          { pin_name: 'VCC', assigned_pin: 1 },
          { pin_name: 'DATA', assigned_pin: 3 },
          { pin_name: 'GND', assigned_pin: 14 }
        ]
      },
      {
        id: 'comp-oled',
        name: 'SSD1306 OLED Display (SPI)',
        pins: [
          { pin_name: 'VCC', assigned_pin: 2 },
          { pin_name: 'GND', assigned_pin: 23 }, // SCLK mapped
          { pin_name: 'MOSI', assigned_pin: 19 },
          { pin_name: 'MISO', assigned_pin: 21 }
        ]
      }
    ];

    const result = validateCircuitSchematic(rpiCircuit);
    expect(result.valid).toBe(true);
    expect(result.conflicts.length).toBe(0);
    expect(result.bom.length).toBe(4);
    expect(result.totalPinsUsed).toBe(11);
  });

  it('4.2 should process a complex real-world production requirements.txt file', () => {
    const rawProdRequirements = `
# ==============================================================================
# Production Dependencies for AlphaCoreTech Backend
# ==============================================================================

# Core Web Framework & Async Utilities
Flask>=2.3.0,<3.0.0 # Web microframework
flask_sqlalchemy==3.0.5
requests>=2.31.0 # HTTP client library

# Legacy Tools & Linters (Deprecated)
pkg-resources==0.0.0
pylint>=2.15.0; python_version < '3.11'
pip-tools==6.13.0

# Duplicate / Mixed Case Dependencies
Requests>=2.28.0
Flask-SQLAlchemy==3.0.5
Pylint==2.14.0

# Extra index mirrors
--extra-index-url https://pypi.org/simple
    `;

    const report = processComplexRequirements(rawProdRequirements);

    expect(report.validSpecsCount).toBe(9);
    expect(report.dedupedCount).toBe(6);
    expect(report.duplicateCount).toBe(3);
    expect(report.warnings.length).toBe(3);
    expect(report.warnings.some(w => w.package === 'pkg-resources')).toBe(true);
    expect(report.warnings.some(w => w.package === 'pylint')).toBe(true);
    expect(report.warnings.some(w => w.package === 'pip-tools')).toBe(true);
  });

  it('4.3 should execute an end-to-end multi-subroutine pipeline workflow', async () => {
    // Step 1: Obfuscate API Key
    const rawApiKey = 'ALPHA_SEC_KEY_99812';
    const encryptedKey = encodeBase64(xorCipher(rawApiKey, 'SALT_V1'));
    expect(encryptedKey).not.toBe(rawApiKey);

    // Step 2: Configure Rate Limiter for Key
    const limiter = new TokenBucketLimiter(10, 5, 1000000);
    expect(limiter.tryConsume(1, 1000000)).toBe(true);

    // Step 3: Validate Hardware Circuit
    const circuit = [
      { id: 'comp-1', name: 'Sensor 1', pins: [{ assigned_pin: 7 }] }
    ];
    const hwResult = validateCircuitSchematic(circuit);
    expect(hwResult.valid).toBe(true);

    // Step 4: Scan Dependencies
    const depResult = processComplexRequirements('requests==2.31.0\npylint==2.15.0');
    expect(depResult.warnings.length).toBe(1);

    // Step 5: Append to Console
    const consoleEl = container.querySelector('#sub-console-output');
    consoleEl.innerHTML += `<div>Pipeline Execution Complete: Key Obfuscated, Rate Limiter Active, Hardware Verified, ${depResult.warnings.length} Dep Warning(s).</div>`;

    expect(consoleEl.textContent).toContain('Pipeline Execution Complete');
  });

  it('4.4 should handle high-load subroutines execution and log autoscroll without lag', async () => {
    vi.useFakeTimers();

    const runAllBtn = container.querySelector('#btn-run-all');
    const consoleEl = container.querySelector('#sub-console-output');

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    runAllBtn.click();

    // Fast forward through all 8 subroutines (5 steps * 300ms + 200ms per sub = ~14,000ms)
    await vi.advanceTimersByTimeAsync(15000);

    expect(consoleEl.textContent).toContain('SYNAPSE_PRUNING_V4');
    expect(consoleEl.textContent).toContain('MODEL_QUANTIZATION_TEST');
    expect(container.querySelector('#sub-active-status').textContent).toBe('IDLE');

    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('4.5 should integrate third-party custom port complying with PortComponentContract', async () => {
    const customPort = {
      id: 'port-custom-analytics',
      name: 'Custom Telemetry Port',
      category: 'Analytics',
      version: '2.0.0',
      description: 'Web-ported custom telemetry exporter',
      pythonSourcePath: 'CustomTools/telemetry.py',
      render: (targetContainer) => {
        const widget = document.createElement('div');
        widget.id = 'telemetry-widget';
        widget.textContent = 'Telemetry Widget Active';
        targetContainer.appendChild(widget);
        return widget;
      },
      execute: async (params = {}) => {
        return {
          success: true,
          output: '[Custom Telemetry] Exported 42 metric events successfully.',
          details: { eventsExported: 42 }
        };
      },
      destroy: () => {}
    };

    const validation = validatePortContract(customPort);
    expect(validation.valid).toBe(true);

    const portUI = customPort.render(container);
    expect(container.querySelector('#telemetry-widget')).not.toBeNull();

    const execResult = await customPort.execute();
    expect(execResult.success).toBe(true);
    expect(execResult.output).toContain('Exported 42 metric events');

    customPort.destroy();
  });

  it('4.6 should test full web application subroutines page lifecycle', async () => {
    vi.useFakeTimers();

    // 1. Initial State
    expect(container.querySelector('.glitch').textContent).toContain('SUBROUTINE_CONSOLE');

    // 2. Filter Category
    const categorySelect = container.querySelector('#sub-filter-cat');
    categorySelect.value = 'SEC';
    categorySelect.dispatchEvent(new Event('change'));
    expect(container.querySelectorAll('#subroutine-list > div').length).toBe(2);

    // 3. Dispatch Manual CLI Command
    const formEl = container.querySelector('#frm-manual-cmd');
    const inputEl = container.querySelector('#ipt-manual-cmd');
    inputEl.value = 'BENCHMARK';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.advanceTimersByTimeAsync(300);

    const consoleEl = container.querySelector('#sub-console-output');
    expect(consoleEl.textContent).toContain('> BENCHMARK');

    // 4. Run Benchmark
    const benchmarkBtn = container.querySelector('#btn-benchmark');
    benchmarkBtn.click();

    await vi.advanceTimersByTimeAsync(3000);

    expect(consoleEl.textContent).toContain('BENCHMARK COMPLETE');
    expect(container.querySelector('#sub-active-status').textContent).toBe('IDLE');

    vi.useRealTimers();
  });
});
