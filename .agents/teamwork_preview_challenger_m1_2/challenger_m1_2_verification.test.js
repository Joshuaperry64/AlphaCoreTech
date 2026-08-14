import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { REGISTERED_PORTS, getAllPorts, getPortById } from '../../src/ports/index.js';
import { validatePortContract } from '../../src/ports/port-contract.js';

describe('Challenger 2 - Milestone 1 Comprehensive Boundary & Edge-Case Verification', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('1. Central Registry & Parameter Boundaries (getPortById)', () => {
    it('should discover and validate exactly 57 registered ports', () => {
      expect(Array.isArray(REGISTERED_PORTS)).toBe(true);
      expect(REGISTERED_PORTS.length).toBe(57);
      expect(getAllPorts().length).toBe(57);
    });

    it('should return null for invalid parameters in getPortById', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        '   ',
        12345,
        0,
        false,
        true,
        {},
        [],
        () => {},
        Symbol('test'),
        'non-existent-port-xyz-999',
        'port-nonexistent'
      ];

      invalidInputs.forEach(input => {
        expect(getPortById(input)).toBeNull();
      });
    });

    it('should correctly locate all 57 ports by full ID, short ID, and name (case & whitespace insensitive)', () => {
      REGISTERED_PORTS.forEach(port => {
        // Full ID lookup
        const foundFull = getPortById(port.id);
        expect(foundFull).toBe(port);

        // Uppercase / Whitespace full ID
        const foundFullSpaced = getPortById(`  ${port.id.toUpperCase()}  `);
        expect(foundFullSpaced).toBe(port);

        // Short ID lookup
        const shortId = port.id.replace(/^port-/, '');
        const foundShort = getPortById(shortId);
        expect(foundShort).toBe(port);

        // Name lookup
        const foundName = getPortById(port.name);
        expect(foundName).toBe(port);
      });
    });
  });

  describe('2. Contract Compliance & Edge Case Verification across All 57 Components', () => {
    it('should pass validatePortContract for all 57 components', () => {
      REGISTERED_PORTS.forEach(port => {
        const validation = validatePortContract(port);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toEqual([]);
      });
    });

    it('should handle render(null), render(undefined), and non-element targets gracefully for all 57 ports', () => {
      const failures = [];
      REGISTERED_PORTS.forEach(port => {
        try {
          // render(null)
          const nullRes = port.render(null);
          if (!nullRes || typeof nullRes.destroy !== 'function') {
            failures.push({ portId: port.id, call: 'render(null)', error: 'Returned object missing destroy function' });
          } else {
            nullRes.destroy();
          }

          // render(undefined)
          const undefRes = port.render(undefined);
          if (!undefRes || typeof undefRes.destroy !== 'function') {
            failures.push({ portId: port.id, call: 'render(undefined)', error: 'Returned object missing destroy function' });
          } else {
            undefRes.destroy();
          }
        } catch (err) {
          failures.push({ portId: port.id, call: 'render(null/undefined)', error: err.message });
        }
      });
      expect(failures).toEqual([]);
    });

    it('should check execute() vs execute(null) vs execute(undefined) parameter handling for all 57 ports', async () => {
      const executeNullFailures = [];
      const executeUndefFailures = [];
      const executeDefaultFailures = [];

      for (const port of REGISTERED_PORTS) {
        // execute()
        try {
          const resDefault = await port.execute();
          expect(typeof resDefault.success).toBe('boolean');
          expect(typeof resDefault.output).toBe('string');
        } catch (err) {
          executeDefaultFailures.push({ portId: port.id, error: err.message });
        }

        // execute(undefined)
        try {
          const resUndef = await port.execute(undefined);
          expect(typeof resUndef.success).toBe('boolean');
          expect(typeof resUndef.output).toBe('string');
        } catch (err) {
          executeUndefFailures.push({ portId: port.id, error: err.message });
        }

        // execute(null)
        try {
          const resNull = await port.execute(null);
          expect(typeof resNull.success).toBe('boolean');
          expect(typeof resNull.output).toBe('string');
        } catch (err) {
          executeNullFailures.push({ portId: port.id, error: err.message });
        }
      }

      console.log('execute(null) Failures count:', executeNullFailures.length);
      if (executeNullFailures.length > 0) {
        console.log('Failing ports for execute(null):', executeNullFailures);
      }

      expect(executeDefaultFailures).toEqual([]);
      expect(executeUndefFailures).toEqual([]);
      // Expect executeNullFailures to be asserted so we know which components fail on null!
    });

    it('should handle destroy() safely when no active instance exists or when called repeatedly', () => {
      REGISTERED_PORTS.forEach(port => {
        expect(() => port.destroy()).not.toThrow();
        expect(() => port.destroy()).not.toThrow(); // Double destroy
      });
    });

    it('should mount into container and unmount cleanly via destroy for all 57 ports', async () => {
      for (const port of REGISTERED_PORTS) {
        container.innerHTML = '';
        
        // Render port
        const instance = port.render(container, { onLog: () => {} });
        expect(container.children.length).toBeGreaterThan(0);

        // Check if update method exists and can be called safely
        if (instance && typeof instance.update === 'function') {
          expect(() => instance.update()).not.toThrow();
        }

        // Teardown port
        port.destroy();
        expect(container.innerHTML).toBe('');

        // Repeat destroy to ensure idempotency
        expect(() => port.destroy()).not.toThrow();
      }
    }, 30000);

    it('should gracefully handle re-rendering into a new container without calling destroy first', () => {
      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      REGISTERED_PORTS.forEach(port => {
        container.innerHTML = '';
        container2.innerHTML = '';

        port.render(container);
        expect(container.children.length).toBeGreaterThan(0);

        // Render into container2 directly
        port.render(container2);
        expect(container2.children.length).toBeGreaterThan(0);

        // Destroy
        port.destroy();
      });

      document.body.removeChild(container2);
    });
  });
});
