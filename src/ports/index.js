/**
 * Central Web Porting Framework Registry.
 * Automatically discovers, validates, and registers all 57 ported modules.
 * Supports both Vite bundler (import.meta.glob) and Node ESM runtime.
 */

import { validatePortContract } from './port-contract.js';

let candidatePorts = [];

try {
  try {
    // Vite Eager Glob Import (discovers all src/ports/*/index.js automatically)
    // We must use it directly so Vite's static analyzer catches it.
    const portModules = import.meta.glob('./*/index.js', { eager: true });
    candidatePorts = Object.values(portModules).map(mod => mod.default || mod);
  } catch(e) {
    // ignore
  }
} catch (e) {
  console.warn('[Port Registry] Vite glob scan notice:', e.message);
}

// Fallback for Node ESM or environment where import.meta.glob wasn't evaluated
if (!candidatePorts.length && typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    const fsName = 'fs';
    const pathName = 'path';
    const urlName = 'url';
    const fs = await import(/* @vite-ignore */ fsName);
    const path = await import(/* @vite-ignore */ pathName);
    const { fileURLToPath } = await import(/* @vite-ignore */ urlName);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const entries = fs.readdirSync(__dirname, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const indexPath = path.join(__dirname, entry.name, 'index.js');
        if (fs.existsSync(indexPath)) {
          const fileUri = `file:///${indexPath.replace(/\\/g, '/')}`;
          const mod = await import(fileUri);
          candidatePorts.push(mod.default || mod);
        }
      }
    }
  } catch (err) {
    console.warn('[Port Registry] Node ESM fallback scan notice:', err.message);
  }
}

const validPorts = [];

for (const rawPort of candidatePorts) {
  const port = (rawPort && rawPort.id) ? rawPort : (rawPort.default || rawPort);
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
