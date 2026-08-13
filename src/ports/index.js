/**
 * Central Web Porting Framework Registry.
 * Imports, validates, and registers all ported modules.
 */

import { validatePortContract } from './port-contract.js';
import alphaInventoryPort from './alphainventory/index.js';
import alphaRequirementsPort from './alpharequirements/index.js';

const candidatePorts = [
  alphaInventoryPort,
  alphaRequirementsPort
];

const validPorts = [];

for (const port of candidatePorts) {
  const result = validatePortContract(port);
  if (result.valid) {
    validPorts.push(port);
  } else {
    console.error(`[Port Registry] Port '${port?.id || 'unknown'}' failed contract validation:`, result.errors);
  }
}

/**
 * Array of all validated, registered port components.
 */
export const REGISTERED_PORTS = validPorts;

/**
 * Retrieves all registered port components.
 * 
 * @returns {Array<Object>}
 */
export function getAllPorts() {
  return REGISTERED_PORTS;
}

/**
 * Finds a registered port component by its unique ID or short name.
 * Accepts full IDs (e.g., 'port-alphainventory') or short IDs (e.g., 'alphainventory').
 * 
 * @param {string} id - Port identifier or short name
 * @returns {Object|null} Matching port object or null if not found
 */
export function getPortById(id) {
  if (!id || typeof id !== 'string') return null;
  const cleanId = id.trim().toLowerCase();
  const shortId = cleanId.replace(/^port-/, '');

  return REGISTERED_PORTS.find(port => {
    const portId = (port.id || '').toLowerCase();
    const portShortId = portId.replace(/^port-/, '');
    const portName = (port.name || '').toLowerCase();

    return (
      portId === cleanId ||
      portShortId === shortId ||
      portName === cleanId ||
      portName === shortId
    );
  }) || null;
}
