import { describe, it, expect } from 'vitest';
import { REGISTERED_PORTS, getAllPorts, getPortById } from './index.js';

describe('Central Web Ports Registry', () => {
  it('should export valid REGISTERED_PORTS array containing all initial ports', () => {
    expect(Array.isArray(REGISTERED_PORTS)).toBe(true);
    expect(REGISTERED_PORTS.length).toBe(2);

    const portIds = REGISTERED_PORTS.map(p => p.id);
    expect(portIds).toContain('port-alphainventory');
    expect(portIds).toContain('port-alpharequirements');
  });

  it('should return all ports from getAllPorts()', () => {
    const ports = getAllPorts();
    expect(ports).toBe(REGISTERED_PORTS);
  });

  it('should lookup ports by full ID, short ID, or name via getPortById()', () => {
    const invByFullId = getPortById('port-alphainventory');
    expect(invByFullId).not.toBeNull();
    expect(invByFullId.name).toBe('AlphaInventory');

    const invByShortId = getPortById('alphainventory');
    expect(invByShortId).toBe(invByFullId);

    const reqByFullId = getPortById('port-alpharequirements');
    expect(reqByFullId).not.toBeNull();
    expect(reqByFullId.name).toBe('AlphaRequirements');

    const reqByShortId = getPortById('alpharequirements');
    expect(reqByShortId).toBe(reqByFullId);

    const nonExistent = getPortById('non-existent-port');
    expect(nonExistent).toBeNull();
  });
});
