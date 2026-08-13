/**
 * AlphaInventory Core Logic: GPIO Pinout Definitions, Component Library & Conflict Engine.
 * Ported from C:\Users\josh6\workspace\AlphaInventory\main.py
 */

export const DEFAULT_PINS = {
  "1": { name: "3.3V", mode: "POWER", type: "POWER_OUT_3V3" },
  "2": { name: "5V", mode: "POWER", type: "POWER_OUT_5V" },
  "3": { name: "GPIO 2 (SDA)", mode: "I2C", type: "I2C_SDA" },
  "4": { name: "5V", mode: "POWER", type: "POWER_OUT_5V" },
  "5": { name: "GPIO 3 (SCL)", mode: "I2C", type: "I2C_SCL" },
  "6": { name: "GND", mode: "GROUND", type: "GROUND" },
  "7": { name: "GPIO 4", mode: "GPIO", type: "DIGITAL_IO" },
  "8": { name: "GPIO 14 (TXD)", mode: "UART", type: "UART_TXD" },
  "9": { name: "GND", mode: "GROUND", type: "GROUND" },
  "10": { name: "GPIO 15 (RXD)", mode: "UART", type: "UART_RXD" },
  "11": { name: "GPIO 17", mode: "GPIO", type: "DIGITAL_IO" },
  "12": { name: "GPIO 18", mode: "GPIO", type: "PWM" },
  "13": { name: "GPIO 27", mode: "GPIO", type: "DIGITAL_IO" },
  "14": { name: "GND", mode: "GROUND", type: "GROUND" },
  "15": { name: "GPIO 22", mode: "GPIO", type: "DIGITAL_IO" },
  "16": { name: "GPIO 23", mode: "GPIO", type: "DIGITAL_IO" },
  "17": { name: "3.3V", mode: "POWER", type: "POWER_OUT_3V3" },
  "18": { name: "GPIO 24", mode: "GPIO", type: "DIGITAL_IO" },
  "19": { name: "GPIO 10 (MOSI)", mode: "SPI", type: "SPI_MOSI" },
  "20": { name: "GND", mode: "GROUND", type: "GROUND" },
  "21": { name: "GPIO 9 (MISO)", mode: "SPI", type: "SPI_MISO" },
  "22": { name: "GPIO 25", mode: "GPIO", type: "DIGITAL_IO" },
  "23": { name: "GPIO 11 (SCLK)", mode: "SPI", type: "SPI_SCLK" },
  "24": { name: "GPIO 8 (CE0)", mode: "SPI", type: "SPI_CE0" },
  "25": { name: "GND", mode: "GROUND", type: "GROUND" },
  "26": { name: "GPIO 7 (CE1)", mode: "SPI", type: "SPI_CE1" },
  "27": { name: "ID_SD", mode: "I2C", type: "I2C_SDA" },
  "28": { name: "ID_SC", mode: "I2C", type: "I2C_SCL" },
  "29": { name: "GPIO 5", mode: "GPIO", type: "DIGITAL_IO" },
  "30": { name: "GND", mode: "GROUND", type: "GROUND" },
  "31": { name: "GPIO 6", mode: "GPIO", type: "DIGITAL_IO" },
  "32": { name: "GPIO 12", mode: "GPIO", type: "PWM" },
  "33": { name: "GPIO 13", mode: "GPIO", type: "PWM" },
  "34": { name: "GND", mode: "GROUND", type: "GROUND" },
  "35": { name: "GPIO 19", mode: "GPIO", type: "PWM" },
  "36": { name: "GPIO 16", mode: "GPIO", type: "DIGITAL_IO" },
  "37": { name: "GPIO 26", mode: "GPIO", type: "DIGITAL_IO" },
  "38": { name: "GPIO 20", mode: "GPIO", type: "DIGITAL_IO" },
  "39": { name: "GND", mode: "GROUND", type: "GROUND" },
  "40": { name: "GPIO 21", mode: "GPIO", type: "DIGITAL_IO" }
};

export const COMPONENT_LIBRARY = [
  {
    name: "DHT22",
    type: "Sensor",
    description: "Digital Temperature and Humidity Sensor",
    pins: [
      { pin_name: "VCC", pin_type: "POWER_IN_3V3_5V" },
      { pin_name: "DATA", pin_type: "DIGITAL_IO" },
      { pin_name: "NC", pin_type: "NOT_CONNECTED" },
      { pin_name: "GND", pin_type: "GROUND" }
    ]
  },
  {
    name: "Generic IR Receiver (VS1838B)",
    type: "Sensor",
    description: "Infrared signal receiver",
    pins: [
      { pin_name: "DATA", pin_type: "DIGITAL_IO" },
      { pin_name: "GND", pin_type: "GROUND" },
      { pin_name: "VCC", pin_type: "POWER_IN_3V3_5V" }
    ]
  },
  {
    name: "Generic IR Blaster (LED)",
    type: "Actuator",
    description: "Infrared signal emitter LED",
    pins: [
      { pin_name: "DATA", pin_type: "DIGITAL_IO" },
      { pin_name: "GND", pin_type: "GROUND" }
    ]
  },
  {
    name: "Servo Motor (SG90)",
    type: "Actuator",
    description: "Micro servo motor for position control",
    pins: [
      { pin_name: "PWM", pin_type: "PWM" },
      { pin_name: "VCC", pin_type: "POWER_IN_5V" },
      { pin_name: "GND", pin_type: "GROUND" }
    ]
  }
];

/**
 * Verifies pin type compatibility.
 * 
 * @param {string} requiredType - Pin type required by component pin
 * @param {string} pinType - Actual physical pin type on Raspberry Pi header
 * @returns {boolean} True if compatible
 */
export function checkCompatibility(requiredType, pinType) {
  if (!requiredType || requiredType === 'NOT_CONNECTED') return true;
  if (!pinType) return false;
  if (requiredType === pinType) return true;

  if (requiredType === 'POWER_IN_3V3_5V' && (pinType === 'POWER_OUT_3V3' || pinType === 'POWER_OUT_5V')) return true;
  if (requiredType === 'POWER_IN_5V' && pinType === 'POWER_OUT_5V') return true;
  if (requiredType === 'POWER_IN_3V3' && pinType === 'POWER_OUT_3V3') return true;
  if ((requiredType === 'GND' || requiredType === 'GROUND') && (pinType === 'GND' || pinType === 'GROUND')) return true;

  if (requiredType === 'DIGITAL_IO') {
    const gpioTypes = [
      'DIGITAL_IO', 'PWM', 'I2C_SDA', 'I2C_SCL',
      'SPI_MOSI', 'SPI_MISO', 'SPI_SCLK', 'SPI_CE0', 'SPI_CE1',
      'UART_TXD', 'UART_RXD'
    ];
    if (gpioTypes.includes(pinType)) return true;
  }

  if (requiredType === 'PWM') {
    if (pinType === 'PWM' || pinType === 'DIGITAL_IO') return true;
  }

  return false;
}

/**
 * Detects pin hardware conflicts (over-allocation, type mismatches, unassigned required pins).
 * 
 * @param {Array<Object>} components - Array of attached component instances
 * @param {Object} [pins=DEFAULT_PINS] - Dictionary of physical header pin definitions
 * @returns {Array<Object>} List of conflict objects detected
 */
export function detectConflicts(components = [], pins = DEFAULT_PINS) {
  const conflicts = [];
  if (!Array.isArray(components) || components.length === 0) {
    return conflicts;
  }

  // Map of physical pin number -> list of component pin assignments
  const pinAllocations = {};

  for (const comp of components) {
    const compId = comp.id ?? comp.name;
    const compName = comp.name || `Component #${compId}`;
    
    // Support component.pins array or component.assignments object
    const pinList = Array.isArray(comp.pins) ? comp.pins : [];
    const assignments = comp.assignments || {};

    if (pinList.length > 0) {
      for (const p of pinList) {
        const pinName = p.pin_name || p.name || 'pin';
        const requiredType = p.pin_type || p.type || 'DIGITAL_IO';
        const assigned = p.assigned_pin ?? p.assignedPin ?? assignments[pinName];

        if (requiredType === 'NOT_CONNECTED') continue;

        if (assigned === undefined || assigned === null || assigned === '') {
          conflicts.push({
            type: 'UNASSIGNED_PIN',
            severity: 'warning',
            componentId: compId,
            componentName: compName,
            pinName: pinName,
            requiredType: requiredType,
            message: `Component '${compName}' requires pin '${pinName}' (${requiredType}) but it is unassigned.`
          });
        } else {
          const pinNumStr = String(assigned);
          if (!pinAllocations[pinNumStr]) {
            pinAllocations[pinNumStr] = [];
          }
          pinAllocations[pinNumStr].push({
            componentId: compId,
            componentName: compName,
            pinName: pinName,
            requiredType: requiredType
          });
        }
      }
    } else if (Object.keys(assignments).length > 0) {
      for (const [pinName, assigned] of Object.entries(assignments)) {
        if (assigned === undefined || assigned === null || assigned === '') {
          conflicts.push({
            type: 'UNASSIGNED_PIN',
            severity: 'warning',
            componentId: compId,
            componentName: compName,
            pinName: pinName,
            requiredType: 'DIGITAL_IO',
            message: `Component '${compName}' requires pin '${pinName}' but it is unassigned.`
          });
        } else {
          const pinNumStr = String(assigned);
          if (!pinAllocations[pinNumStr]) {
            pinAllocations[pinNumStr] = [];
          }
          pinAllocations[pinNumStr].push({
            componentId: compId,
            componentName: compName,
            pinName: pinName,
            requiredType: 'DIGITAL_IO'
          });
        }
      }
    }
  }

  // Evaluate physical pin assignments
  for (const [pinNumStr, allocations] of Object.entries(pinAllocations)) {
    const pinNum = parseInt(pinNumStr, 10);
    const pinDef = pins[pinNumStr];

    // Check for invalid pin numbers
    if (!pinDef) {
      for (const alloc of allocations) {
        conflicts.push({
          type: 'INVALID_PIN',
          severity: 'error',
          pin: pinNum,
          componentId: alloc.componentId,
          componentName: alloc.componentName,
          pinName: alloc.pinName,
          message: `Pin ${pinNum} assigned to '${alloc.componentName}' (${alloc.pinName}) does not exist on 40-pin header.`
        });
      }
      continue;
    }

    // Check for pin over-allocation (multiple assignments to same pin)
    if (allocations.length > 1) {
      const details = allocations.map(a => `${a.componentName} (${a.pinName})`).join(', ');
      conflicts.push({
        type: 'OVER_ALLOCATION',
        severity: 'error',
        pin: pinNum,
        allocations: allocations,
        message: `Pin ${pinNum} (${pinDef.name}) is over-allocated to multiple components: ${details}.`
      });
    }

    // Check for type mismatches
    for (const alloc of allocations) {
      const compatible = checkCompatibility(alloc.requiredType, pinDef.type);
      if (!compatible) {
        conflicts.push({
          type: 'TYPE_MISMATCH',
          severity: 'error',
          pin: pinNum,
          componentId: alloc.componentId,
          componentName: alloc.componentName,
          pinName: alloc.pinName,
          requiredType: alloc.requiredType,
          actualType: pinDef.type,
          message: `Pin ${pinNum} (${pinDef.name}, type: ${pinDef.type}) is incompatible with '${alloc.componentName}' pin '${alloc.pinName}' (requires: ${alloc.requiredType}).`
        });
      }
    }
  }

  return conflicts;
}
