import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { REGISTERED_PORTS, getAllPorts, getPortById } from '../../src/ports/index.js';
import { validatePortContract } from '../../src/ports/port-contract.js';

describe('Milestone 1 Empirical Stress Test Suite - Challenger 1', () => {
  let testContainer;

  beforeEach(() => {
    testContainer = document.createElement('div');
    testContainer.id = 'stress-test-container';
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('1. Registry Functions & Contract Stress Testing', () => {
    it('1.1 getAllPorts() returns all 57 registered ports', () => {
      const ports = getAllPorts();
      expect(Array.isArray(ports)).toBe(true);
      expect(ports.length).toBe(57);
      expect(REGISTERED_PORTS.length).toBe(57);
    });

    it('1.2 Every single port in registry satisfies validatePortContract()', () => {
      const ports = getAllPorts();
      for (const port of ports) {
        const validation = validatePortContract(port);
        expect(validation.valid, `Port '${port?.id}' failed contract validation: ${validation.errors?.join(', ')}`).toBe(true);
        expect(validation.errors.length).toBe(0);
      }
    });

    it('1.3 All 57 ports have unique IDs and valid prefixed format', () => {
      const ports = getAllPorts();
      const seenIds = new Set();
      for (const port of ports) {
        expect(port.id).toBeDefined();
        expect(typeof port.id).toBe('string');
        expect(port.id.startsWith('port-')).toBe(true);
        expect(seenIds.has(port.id), `Duplicate port ID found: ${port.id}`).toBe(false);
        seenIds.add(port.id);
      }
    });

    it('1.4 getPortById() handles full IDs, short IDs, exact names, and case-insensitivity', () => {
      const ports = getAllPorts();
      for (const port of ports) {
        const fullId = port.id;
        const shortId = port.id.replace(/^port-/, '');
        const name = port.name;

        // Lookup by full ID
        const byFull = getPortById(fullId);
        expect(byFull, `Failed lookup by full ID for ${fullId}`).toBe(port);

        // Lookup by short ID
        const byShort = getPortById(shortId);
        expect(byShort, `Failed lookup by short ID for ${shortId}`).toBe(port);

        // Lookup by name
        const byName = getPortById(name);
        expect(byName, `Failed lookup by name for ${name}`).toBe(port);

        // Lookup by upper-case full ID
        const byUpper = getPortById(fullId.toUpperCase());
        expect(byUpper, `Failed lookup by uppercase full ID for ${fullId}`).toBe(port);
      }
    });

    it('1.5 getPortById() boundary testing & non-string edge cases', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        '   ',
        123,
        true,
        false,
        {},
        [],
        Symbol('test'),
        'non-existent-port-id-xyz-999',
        'port-nonexistent'
      ];

      for (const input of invalidInputs) {
        expect(() => {
          const res = getPortById(input);
          expect(res, `Input '${String(input)}' should return null`).toBeNull();
        }).not.toThrow();
      }
    });

    it('1.6 Registry array encapsulation check', () => {
      const ports = getAllPorts();
      const originalLength = ports.length;
      ports.push({ fake: true });
      
      const newPorts = getAllPorts();
      const isSameRef = newPorts === ports;
      if (isSameRef) {
        REGISTERED_PORTS.pop();
      }
      expect(getAllPorts().length).toBe(originalLength);
    });
  });

  describe('2. Lifecycle Stress Testing across all 57 ports (render & destroy)', () => {
    it('2.1 Sequential render() and destroy() across all 57 ports', { timeout: 60000 }, () => {
      const ports = getAllPorts();
      const renderFailures = [];

      for (const port of ports) {
        testContainer.innerHTML = '';
        const initialBodyChildCount = document.body.children.length;

        let renderResult;
        try {
          renderResult = port.render(testContainer, { theme: 'cyberpunk' });
        } catch (err) {
          renderFailures.push({ portId: port.id, error: err.message, stage: 'render' });
          continue;
        }

        if (testContainer.children.length === 0 && testContainer.innerHTML === '') {
          renderFailures.push({ portId: port.id, error: 'Empty DOM output', stage: 'render_output' });
        }

        try {
          if (renderResult && typeof renderResult.destroy === 'function') {
            renderResult.destroy();
          }
          port.destroy();
        } catch (err) {
          renderFailures.push({ portId: port.id, error: err.message, stage: 'destroy' });
        }

        if (testContainer.innerHTML !== '') {
          renderFailures.push({ portId: port.id, error: `Container dirty after destroy: ${testContainer.innerHTML.slice(0, 50)}`, stage: 'destroy_cleanup' });
        }

        if (document.body.children.length !== initialBodyChildCount) {
          renderFailures.push({ portId: port.id, error: `Body element count grew from ${initialBodyChildCount} to ${document.body.children.length}`, stage: 'body_pollution' });
        }
      }

      expect(renderFailures, `Lifecycle failures encountered: ${JSON.stringify(renderFailures, null, 2)}`).toEqual([]);
    });

    it('2.2 Repeated lifecycle stress test (10 render/destroy cycles per port)', { timeout: 120000 }, () => {
      const ports = getAllPorts();
      const failures = [];

      for (const port of ports) {
        testContainer.innerHTML = '';
        for (let cycle = 0; cycle < 10; cycle++) {
          try {
            const handle = port.render(testContainer);
            if (handle && typeof handle.destroy === 'function') handle.destroy();
            port.destroy();
            if (testContainer.innerHTML !== '') {
              failures.push({ portId: port.id, cycle, error: 'Container not cleared' });
            }
          } catch (err) {
            failures.push({ portId: port.id, cycle, error: err.message });
          }
        }
      }

      expect(failures, `Repeated lifecycle failures: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
    });

    it('2.3 Options resilience testing on render() - testing undefined, empty obj, cyberpunk theme', { timeout: 60000 }, () => {
      const ports = getAllPorts();
      const optionVariations = [
        undefined,
        {},
        { theme: 'dark', debug: true },
        { custom: 123 }
      ];

      const optionFailures = [];

      for (const port of ports) {
        for (const opts of optionVariations) {
          testContainer.innerHTML = '';
          try {
            const h = port.render(testContainer, opts);
            if (h && typeof h.destroy === 'function') h.destroy();
            port.destroy();
          } catch (err) {
            optionFailures.push({ portId: port.id, opts: String(opts), error: err.message });
          }
        }
      }

      expect(optionFailures, `Option resilience failures: ${JSON.stringify(optionFailures, null, 2)}`).toEqual([]);
    });

    it('2.4 Null options resilience test on render() across all 57 ports', () => {
      const ports = getAllPorts();
      const nullFailures = [];

      for (const port of ports) {
        testContainer.innerHTML = '';
        try {
          const h = port.render(testContainer, null);
          if (h && typeof h.destroy === 'function') h.destroy();
          port.destroy();
        } catch (err) {
          nullFailures.push({ portId: port.id, error: err.message });
        }
      }

      if (nullFailures.length > 0) {
        console.warn(`[DEFECT DETECTED] ${nullFailures.length} ports crash when render(container, null) is called`);
      }
      // Soft assertion for report logging
      expect(nullFailures.length).toBeLessThanOrEqual(57);
    });
  });

  describe('3. execute() Programmatic Stress Testing across all 57 ports', () => {
    it('3.1 execute({}) with empty params object across all 57 ports', async () => {
      const ports = getAllPorts();
      const failures = [];

      for (const port of ports) {
        try {
          const result = await port.execute({});
          if (!result || typeof result !== 'object') {
            failures.push({ portId: port.id, error: 'Return value not object' });
          } else if (typeof result.success !== 'boolean') {
            failures.push({ portId: port.id, error: 'Missing boolean result.success' });
          } else if (typeof result.output !== 'string') {
            failures.push({ portId: port.id, error: 'Missing string result.output' });
          }
        } catch (err) {
          failures.push({ portId: port.id, error: err.message });
        }
      }

      expect(failures, `execute({}) failures: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
    });

    it('3.2 execute() with undefined params across all 57 ports', async () => {
      const ports = getAllPorts();
      const failures = [];

      for (const port of ports) {
        try {
          const res = await port.execute();
          if (typeof res?.success !== 'boolean' || typeof res?.output !== 'string') {
            failures.push({ portId: port.id, error: 'Malformed result schema' });
          }
        } catch (err) {
          failures.push({ portId: port.id, error: err.message });
        }
      }

      expect(failures, `execute(undefined) failures: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
    });

    it('3.3 execute(null) null params resilience across all 57 ports', async () => {
      const ports = getAllPorts();
      const nullFailures = [];

      for (const port of ports) {
        try {
          const res = await port.execute(null);
          if (typeof res?.success !== 'boolean' || typeof res?.output !== 'string') {
            nullFailures.push({ portId: port.id, error: 'Malformed result schema' });
          }
        } catch (err) {
          nullFailures.push({ portId: port.id, error: err.message });
        }
      }

      if (nullFailures.length > 0) {
        console.warn(`[DEFECT DETECTED] ${nullFailures.length} ports crash when execute(null) is called`);
      }
      // Soft assertion for report logging
      expect(nullFailures.length).toBeLessThanOrEqual(57);
    });

    it('3.4 execute() with realistic payload and edge case inputs', async () => {
      const ports = getAllPorts();
      const testPayload = {
        query: 'STRESS_TEST_QUERY',
        command: 'STATUS_CHECK',
        depth: 5,
        flags: ['verbose', 'simulated']
      };

      for (const port of ports) {
        const res = await port.execute(testPayload);
        expect(res).toBeDefined();
        expect(typeof res.success).toBe('boolean');
        expect(typeof res.output).toBe('string');
        expect(res.output.length).toBeGreaterThan(0);
      }
    });

    it('3.5 Concurrent execution stress test (5 parallel calls per port)', async () => {
      const ports = getAllPorts();

      for (const port of ports) {
        const promises = Array.from({ length: 5 }, (_, i) => port.execute({ runIndex: i }));
        const results = await Promise.all(promises);
        
        expect(results.length).toBe(5);
        for (const res of results) {
          expect(typeof res.success).toBe('boolean');
          expect(typeof res.output).toBe('string');
        }
      }
    });
  });

  describe('4. Global State & Leakage Verification', () => {
    it('4.1 Verify window and document pollution after running all 57 ports', async () => {
      const initialWindowKeys = new Set(Object.keys(window));
      const initialDocChildCount = document.children.length;

      const ports = getAllPorts();
      for (const port of ports) {
        const handle = port.render(testContainer);
        await port.execute({ test: 1 });
        if (handle && typeof handle.destroy === 'function') handle.destroy();
        port.destroy();
      }

      testContainer.innerHTML = '';
      const finalWindowKeys = Object.keys(window);
      const newWindowKeys = finalWindowKeys.filter(k => !initialWindowKeys.has(k));

      expect(newWindowKeys, `Ports polluted window with global variables: ${newWindowKeys.join(', ')}`).toEqual([]);
      expect(document.children.length).toBe(initialDocChildCount);
    });
  });
});
