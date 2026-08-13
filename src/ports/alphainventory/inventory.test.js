import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import alphaInventoryPort, {
  id, name, category, version, description, pythonSourcePath, render, execute, destroy
} from './index.js';
import { DEFAULT_PINS, COMPONENT_LIBRARY, checkCompatibility, detectConflicts } from './inventory-core.js';
import { validatePortContract } from '../port-contract.js';

describe('AlphaInventory Core Logic & Conflict Engine', () => {
  it('should define a valid 40-pin GPIO pinout map', () => {
    expect(Object.keys(DEFAULT_PINS).length).toBe(40);
    expect(DEFAULT_PINS['1']).toEqual({ name: '3.3V', mode: 'POWER', type: 'POWER_OUT_3V3' });
    expect(DEFAULT_PINS['2']).toEqual({ name: '5V', mode: 'POWER', type: 'POWER_OUT_5V' });
    expect(DEFAULT_PINS['6']).toEqual({ name: 'GND', mode: 'GROUND', type: 'GROUND' });
    expect(DEFAULT_PINS['3']).toEqual({ name: 'GPIO 2 (SDA)', mode: 'I2C', type: 'I2C_SDA' });
    expect(DEFAULT_PINS['12']).toEqual({ name: 'GPIO 18', mode: 'GPIO', type: 'PWM' });
  });

  it('should accurately verify pin compatibility', () => {
    expect(checkCompatibility('POWER_IN_3V3_5V', 'POWER_OUT_3V3')).toBe(true);
    expect(checkCompatibility('POWER_IN_3V3_5V', 'POWER_OUT_5V')).toBe(true);
    expect(checkCompatibility('POWER_IN_5V', 'POWER_OUT_5V')).toBe(true);
    expect(checkCompatibility('POWER_IN_5V', 'POWER_OUT_3V3')).toBe(false);

    expect(checkCompatibility('GROUND', 'GROUND')).toBe(true);
    expect(checkCompatibility('GND', 'GROUND')).toBe(true);

    expect(checkCompatibility('DIGITAL_IO', 'DIGITAL_IO')).toBe(true);
    expect(checkCompatibility('DIGITAL_IO', 'PWM')).toBe(true);
    expect(checkCompatibility('DIGITAL_IO', 'I2C_SDA')).toBe(true);

    expect(checkCompatibility('PWM', 'PWM')).toBe(true);
    expect(checkCompatibility('PWM', 'DIGITAL_IO')).toBe(true);
    expect(checkCompatibility('PWM', 'GROUND')).toBe(false);
  });

  it('should detect zero conflicts for valid component pin mapping', () => {
    const components = [
      {
        id: 1,
        name: 'DHT22',
        pins: [
          { pin_name: 'VCC', pin_type: 'POWER_IN_3V3_5V', assigned_pin: 1 },
          { pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: 7 },
          { pin_name: 'GND', pin_type: 'GROUND', assigned_pin: 6 }
        ]
      }
    ];

    const conflicts = detectConflicts(components);
    expect(conflicts.length).toBe(0);
  });

  it('should detect pin over-allocation when multiple components use same physical pin', () => {
    const components = [
      {
        id: 1,
        name: 'Sensor A',
        pins: [{ pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: 7 }]
      },
      {
        id: 2,
        name: 'Sensor B',
        pins: [{ pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: 7 }]
      }
    ];

    const conflicts = detectConflicts(components);
    expect(conflicts.some(c => c.type === 'OVER_ALLOCATION' && c.pin === 7)).toBe(true);
  });

  it('should detect type mismatch when component pin is assigned incompatible physical pin', () => {
    const components = [
      {
        id: 1,
        name: 'SG90 Servo',
        pins: [{ pin_name: 'VCC', pin_type: 'POWER_IN_5V', assigned_pin: 1 }] // Pin 1 is 3.3V
      }
    ];

    const conflicts = detectConflicts(components);
    expect(conflicts.some(c => c.type === 'TYPE_MISMATCH' && c.pin === 1)).toBe(true);
  });

  it('should detect unassigned required pins', () => {
    const components = [
      {
        id: 1,
        name: 'DHT22',
        pins: [
          { pin_name: 'VCC', pin_type: 'POWER_IN_3V3_5V', assigned_pin: null },
          { pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: 7 }
        ]
      }
    ];

    const conflicts = detectConflicts(components);
    expect(conflicts.some(c => c.type === 'UNASSIGNED_PIN' && c.pinName === 'VCC')).toBe(true);
  });
});

describe('AlphaInventory Port Contract & Execution', () => {
  it('should satisfy PortComponentContract validation', () => {
    const result = validatePortContract(alphaInventoryPort);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should execute headlessly and return scan results', async () => {
    const res = await execute({
      components: [
        {
          id: 101,
          name: 'Test Sensor',
          pins: [{ pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: 11 }]
        }
      ]
    });

    expect(res.success).toBe(true);
    expect(res.output).toContain('[AlphaInventory] Scan complete.');
    expect(res.details.components.length).toBe(1);
    expect(res.details.conflicts.length).toBe(0);
  });
});

describe('AlphaInventory DOM UI Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    destroy();
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    localStorage.clear();
  });

  it('should render the 2x20 pin header grid and components UI', () => {
    render(container);
    expect(container.querySelector('.alphainventory-ui')).not.toBeNull();

    const pinoutGrid = container.querySelector('#ai-pinout-grid');
    expect(pinoutGrid).not.toBeNull();
    const pinCards = pinoutGrid.querySelectorAll('.ai-pin-card');
    expect(pinCards.length).toBe(40);

    const conflictsContainer = container.querySelector('#ai-conflicts-container');
    expect(conflictsContainer.textContent).toContain('No pin conflicts detected');
  });

  it('should select pin and display in inspector sidebar on pin click', () => {
    render(container);
    const pin7Card = container.querySelector('[data-pin="7"]');
    expect(pin7Card).not.toBeNull();

    pin7Card.click();

    const inspector = container.querySelector('#ai-pin-inspector');
    expect(inspector.textContent).toContain('Pin Inspector (Pin #7)');
    expect(inspector.textContent).toContain('GPIO 4');
  });
});
