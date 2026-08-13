/**
 * Interface specification for Port Component Contracts.
 * 
 * @typedef {Object} PortComponentContract
 * @property {string} id - Unique port identifier (e.g., 'port-alphainventory')
 * @property {string} name - Human readable port name (e.g., 'AlphaInventory')
 * @property {string} category - Category string (e.g., 'Hardware', 'Utilities')
 * @property {string} version - Version semver string (e.g., '1.0.0')
 * @property {string} description - Summary of port functionality
 * @property {string} pythonSourcePath - Relative path to original Python source code
 * @property {Function} render - (container: HTMLElement, options?: Object) => void | Object
 * @property {Function} execute - (params?: Object) => Promise<{ success: boolean, output: string, details?: Object }>
 * @property {Function} destroy - () => void
 */

export const REQUIRED_STRING_PROPERTIES = [
  'id',
  'name',
  'category',
  'version',
  'description',
  'pythonSourcePath'
];

export const REQUIRED_METHOD_PROPERTIES = [
  'render',
  'execute',
  'destroy'
];

/**
 * Validates whether an object conforms to the PortComponentContract interface.
 * 
 * @param {any} portObj - Object to validate against contract
 * @returns {{ valid: boolean, errors: string[] }} Validation result with list of errors if invalid
 */
export function validatePortContract(portObj) {
  const errors = [];

  if (!portObj || typeof portObj !== 'object') {
    return {
      valid: false,
      errors: ['Port object must be a valid non-null object.']
    };
  }

  for (const prop of REQUIRED_STRING_PROPERTIES) {
    if (typeof portObj[prop] !== 'string' || portObj[prop].trim() === '') {
      errors.push(`Property '${prop}' must be a non-empty string.`);
    }
  }

  for (const method of REQUIRED_METHOD_PROPERTIES) {
    if (typeof portObj[method] !== 'function') {
      errors.push(`Method '${method}' must be a function.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
