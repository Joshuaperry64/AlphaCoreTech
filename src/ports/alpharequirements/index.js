/**
 * Port Entry Point: AlphaRequirements
 * Implements PortComponentContract for Python requirements.txt Scanner, Deduplicator & Modernization Detector.
 */

import {
  normalizeLine,
  parseRequirementsText,
  dedupeSpecs,
  canonicalizePackageName,
  detectModernization,
  scanRequirementsText
} from './requirements-core.js';

import { renderRequirementsUI, SAMPLE_PRESETS } from './requirements-ui.js';

export const id = 'port-alpharequirements';
export const name = 'AlphaRequirements';
export const category = 'Utilities';
export const version = '1.0.0';
export const description = 'Python requirements.txt Scanner, Deduplicator & Modernization Detector';
export const pythonSourcePath = 'AlphaRequirements/app/scanner.py';

let activeInstance = null;

/**
 * Mounts interactive requirements scanner UI.
 * 
 * @param {HTMLElement} container 
 * @param {Object} [options] 
 * @returns {Object} Active UI instance
 */
export function render(container, options = {}) {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
  }
  activeInstance = renderRequirementsUI(container, options);
  return activeInstance;
}

/**
 * Headless execution method for AlphaRequirements port.
 * Parses, deduplicates, and scans requirement specifications text.
 * 
 * @param {Object} [params]
 * @param {string} [params.text] - Raw requirements text to parse
 * @param {Object} [params.sourceCodeMap] - Map of Python files for modernization import scanning
 * @returns {Promise<{ success: boolean, output: string, details: Object }>}
 */
export async function execute(params = {}) {
  const text = params.text || SAMPLE_PRESETS.standard;
  const sourceCodeMap = params.sourceCodeMap || null;

  const scanResult = scanRequirementsText(text, sourceCodeMap);

  const outputSummary = `[AlphaRequirements] Parsed ${scanResult.specCount} spec(s), deduplicated to ${scanResult.dedupedCount} unique requirement(s). Modernization warnings: ${scanResult.warningCount}.`;

  return {
    success: true,
    output: outputSummary,
    details: scanResult
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

const alphaRequirementsPort = {
  id,
  name,
  category,
  version,
  description,
  pythonSourcePath,
  render,
  execute,
  destroy,
  normalizeLine,
  parseRequirementsText,
  dedupeSpecs,
  canonicalizePackageName,
  detectModernization,
  scanRequirementsText
};

export default alphaRequirementsPort;
