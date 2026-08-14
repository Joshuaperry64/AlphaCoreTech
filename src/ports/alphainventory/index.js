/**
 * Port Entry Point: AlphaInventory
 * Implements PortComponentContract for Raspberry Pi GPIO Pinout & Conflict Engine.
 */

import { DEFAULT_PINS, COMPONENT_LIBRARY, detectConflicts, checkCompatibility } from './inventory-core.js';
import { renderInventoryUI, loadInventoryState, saveInventoryState } from './inventory-ui.js';

export const id = 'port-alphainventory';
export const name = 'AlphaInventory';
export const category = 'Hardware';
export const version = '1.0.0';
export const description = 'Raspberry Pi GPIO Pinout Visualizer & Conflict Engine';
export const pythonSourcePath = 'AlphaInventory/main.py';

let activeInstance = null;

/**
 * Mounts interactive inventory visualizer into the target container.
 * 
 * @param {HTMLElement} container 
 * @param {Object} [options] 
 * @returns {Object} Interface with destroy and update methods
 */
export function render(container, options = {}) {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
  }
  activeInstance = renderInventoryUI(container, options);
  return activeInstance;
}

/**
 * Headless execution method for AlphaInventory port.
 * Runs conflict detection engine on provided components or stored state.
 * 
 * @param {Object} [params]
 * @param {Array<Object>} [params.components]
 * @param {Object} [params.pins]
 * @returns {Promise<{ success: boolean, output: string, details: Object }>}
 */
export async function execute(params = {}) {
  const safeParams = params || {};
  const components = safeParams.components || loadInventoryState().components || [];
  const pins = safeParams.pins || DEFAULT_PINS;

  const conflicts = detectConflicts(components, pins);
  const success = conflicts.length === 0;

  const outputSummary = conflicts.length === 0
    ? `[AlphaInventory] Scan complete. ${components.length} component(s) attached with 0 hardware conflicts.`
    : `[AlphaInventory] Scan complete. Found ${conflicts.length} conflict(s) across ${components.length} component(s).`;

  return {
    success,
    output: outputSummary,
    details: {
      components,
      conflicts,
      totalPins: Object.keys(pins).length
    }
  };
}

/**
 * Destroys active UI component instance.
 */
export function destroy() {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
    activeInstance = null;
  }
}

const alphaInventoryPort = {
  id,
  name,
  category,
  version,
  description,
  pythonSourcePath,
  render,
  execute,
  destroy,
  DEFAULT_PINS,
  COMPONENT_LIBRARY,
  checkCompatibility,
  detectConflicts
};

export default alphaInventoryPort;
