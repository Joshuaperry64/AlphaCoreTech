/**
 * AlphaInventory UI Component.
 * Renders 2x20 color-coded RPi GPIO header pinout, pin inspector sidebar,
 * component manager modal, conflict detection alerts, and localStorage persistence.
 */

import { DEFAULT_PINS, COMPONENT_LIBRARY, detectConflicts } from './inventory-core.js';

const STORAGE_KEY = 'alphainventory_state';

/**
 * Loads inventory state from localStorage or initial defaults.
 * @returns {Object}
 */
export function loadInventoryState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.components)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load alphainventory_state from localStorage:', e);
  }

  // Initial default state with one default sensor
  return {
    deviceName: 'Raspberry Pi 5',
    selectedPin: 1,
    components: [
      {
        id: 1,
        name: 'DHT22',
        type: 'Sensor',
        pins: [
          { pin_name: 'VCC', pin_type: 'POWER_IN_3V3_5V', assigned_pin: 1 },
          { pin_name: 'DATA', pin_type: 'DIGITAL_IO', assigned_pin: 7 },
          { pin_name: 'NC', pin_type: 'NOT_CONNECTED', assigned_pin: null },
          { pin_name: 'GND', pin_type: 'GROUND', assigned_pin: 6 }
        ]
      }
    ]
  };
}

/**
 * Saves inventory state to localStorage.
 * @param {Object} state 
 */
export function saveInventoryState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save alphainventory_state to localStorage:', e);
  }
}

/**
 * Returns color style code according to pin mode/type.
 * @param {Object} pinDef 
 * @returns {{ bg: string, text: string }}
 */
export function getPinColorStyle(pinDef) {
  if (!pinDef) return { bg: '#e2e8f0', text: '#2d3748' };
  const mode = pinDef.mode?.toUpperCase();
  const type = pinDef.type?.toUpperCase();

  if (mode === 'POWER') return { bg: '#feb2b2', text: '#9b2c2c', border: '#fc8181' };
  if (mode === 'GROUND') return { bg: '#cbd5e0', text: '#1a202c', border: '#a0aec0' };
  if (mode === 'I2C') return { bg: '#bee3f8', text: '#2b6cb0', border: '#90cdf4' };
  if (mode === 'SPI') return { bg: '#e9d8fd', text: '#6b46c1', border: '#d6bcfa' };
  if (mode === 'UART') return { bg: '#fefcbf', text: '#975a16', border: '#faf089' };
  if (type === 'PWM') return { bg: '#c6f6d5', text: '#22543d', border: '#9ae6b4' };
  return { bg: '#e6fffa', text: '#234e52', border: '#b2f5ea' };
}

/**
 * Main render function for AlphaInventory UI.
 * 
 * @param {HTMLElement} container - Target DOM element
 * @param {Object} [options]
 * @returns {{ destroy: Function, update: Function }}
 */
export function renderInventoryUI(container, options = {}) {
  if (!container) return { destroy: () => {}, update: () => {} };

  let state = loadInventoryState();

  // Root wrapper
  container.innerHTML = `
    <div class="alphainventory-ui" style="font-family: system-ui, -apple-system, sans-serif; color: #2d3748; background: #f7fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
        <div>
          <h2 style="margin: 0; font-size: 1.5rem; color: #1a202c; display: flex; align-items: center; gap: 8px;">
            <span>⚡ AlphaInventory</span>
            <span style="font-size: 0.8rem; background: #edf2f7; color: #4a5568; padding: 2px 8px; border-radius: 12px; font-weight: normal;">40-Pin GPIO Visualizer</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.875rem; color: #718096;">Raspberry Pi GPIO Pinout Inspector & Hardware Conflict Engine</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="ai-add-component-btn" style="background: #3182ce; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>+ Add Component</span>
          </button>
          <button id="ai-reset-state-btn" style="background: #edf2f7; color: #4a5568; border: 1px solid #cbd5e0; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Reset
          </button>
        </div>
      </div>

      <!-- Conflicts Alert Box -->
      <div id="ai-conflicts-container" style="margin-bottom: 20px;"></div>

      <!-- Main Layout (Grid & Inspector) -->
      <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px;">
        <!-- Left Column: 2x20 Header Grid -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 1.1rem; color: #2d3748;">40-Pin GPIO Header (J8)</h3>
            <span style="font-size: 0.8rem; color: #718096;">Odd pins on Left (1-39) | Even pins on Right (2-40)</span>
          </div>

          <!-- 2x20 Header Pin Table -->
          <div id="ai-pinout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Right Column: Inspector & Component Manager -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Pin Inspector Panel -->
          <div id="ai-pin-inspector" style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <!-- Rendered dynamically -->
          </div>

          <!-- Attached Components List Panel -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="margin: 0; font-size: 1rem; color: #2d3748;">Attached Components</h3>
              <span id="ai-component-count" style="font-size: 0.85rem; font-weight: bold; background: #e2e8f0; color: #4a5568; padding: 2px 8px; border-radius: 10px;">0</span>
            </div>
            <div id="ai-components-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 320px; overflow-y: auto;">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>
      </div>

      <!-- Add Component Modal -->
      <div id="ai-modal-overlay" style="display: none; position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); z-index: 9999; justify-content: center; align-items: center;">
        <div style="background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 1.2rem;" id="ai-modal-title">Attach New Component</h3>
            <button id="ai-modal-close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #a0aec0;">&times;</button>
          </div>
          <form id="ai-component-form">
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 4px;">Preset Library Component:</label>
              <select id="ai-preset-select" style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; background: white;">
                <option value="">-- Custom Component --</option>
                ${COMPONENT_LIBRARY.map(c => `<option value="${c.name}">${c.name} (${c.type})</option>`).join('')}
              </select>
            </div>
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 4px;">Component Name:</label>
              <input type="text" id="ai-comp-name-input" required placeholder="e.g. DHT22 Sensor" style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; box-sizing: border-box;" />
            </div>
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 4px;">Component Category:</label>
              <select id="ai-comp-type-input" style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 4px; background: white;">
                <option value="Sensor">Sensor</option>
                <option value="Actuator">Actuator</option>
                <option value="Display">Display</option>
                <option value="Communication">Communication</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; color: #4a5568;">Pin Mapping Assignments:</h4>
              <div id="ai-pin-mappings-container" style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Pin mapping inputs dynamically inserted -->
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button type="button" id="ai-modal-cancel-btn" style="background: #edf2f7; color: #4a5568; border: 1px solid #cbd5e0; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
              <button type="submit" style="background: #3182ce; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;">Save Component</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Render sub-components
  function updateUI() {
    saveInventoryState(state);

    const conflicts = detectConflicts(state.components, DEFAULT_PINS);

    // 1. Render Conflicts Alert Box
    const conflictsContainer = container.querySelector('#ai-conflicts-container');
    if (conflicts.length === 0) {
      conflictsContainer.innerHTML = `
        <div style="background: #f0fff4; border: 1px solid #9ae6b4; color: #276749; padding: 12px 16px; border-radius: 6px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
          <span>✅</span>
          <span><strong>No pin conflicts detected.</strong> All attached components have valid, compatible GPIO mappings.</span>
        </div>
      `;
    } else {
      const items = conflicts.map(c => `<li style="margin-bottom: 4px;">${c.message}</li>`).join('');
      conflictsContainer.innerHTML = `
        <div style="background: #fff5f5; border: 1px solid #feb2b2; color: #9b2c2c; padding: 12px 16px; border-radius: 6px; font-size: 0.9rem;">
          <div style="font-weight: bold; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span>
            <span>Conflict Alert: ${conflicts.length} issue(s) detected in GPIO setup</span>
          </div>
          <ul style="margin: 0; padding-left: 20px;">${items}</ul>
        </div>
      `;
    }

    // 2. Map of assigned pins for easy rendering
    const pinAssignmentsMap = {};
    for (const comp of state.components) {
      if (Array.isArray(comp.pins)) {
        for (const p of comp.pins) {
          if (p.assigned_pin) {
            const pKey = String(p.assigned_pin);
            if (!pinAssignmentsMap[pKey]) pinAssignmentsMap[pKey] = [];
            pinAssignmentsMap[pKey].push({ compName: comp.name, pinName: p.pin_name });
          }
        }
      }
    }

    // 3. Render 2x20 Header Grid (Odd 1..39 on left, Even 2..40 on right)
    const gridContainer = container.querySelector('#ai-pinout-grid');
    let gridHTML = '';

    for (let row = 1; row <= 20; row++) {
      const oddPinNum = (row * 2) - 1;
      const evenPinNum = row * 2;

      const oddDef = DEFAULT_PINS[String(oddPinNum)];
      const evenDef = DEFAULT_PINS[String(evenPinNum)];

      const oddStyle = getPinColorStyle(oddDef);
      const evenStyle = getPinColorStyle(evenDef);

      const isOddSelected = state.selectedPin === oddPinNum;
      const isEvenSelected = state.selectedPin === evenPinNum;

      const oddAssigned = pinAssignmentsMap[String(oddPinNum)] || [];
      const evenAssigned = pinAssignmentsMap[String(evenPinNum)] || [];

      gridHTML += `
        <!-- Odd Pin (${oddPinNum}) -->
        <div class="ai-pin-card" data-pin="${oddPinNum}" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: ${oddStyle.bg}; color: ${oddStyle.text}; border: 2px solid ${isOddSelected ? '#3182ce' : oddStyle.border}; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: white; font-weight: bold; font-size: 0.75rem; color: #2d3748; border: 1px solid #cbd5e0;">${oddPinNum}</span>
            <span style="font-weight: 600; font-size: 0.85rem;">${oddDef.name}</span>
          </div>
          <div style="font-size: 0.75rem; opacity: 0.9;">
            ${oddAssigned.length > 0 ? `<span style="background: rgba(0,0,0,0.15); padding: 2px 6px; border-radius: 4px;">${oddAssigned[0].compName}</span>` : `<span style="opacity: 0.6;">${oddDef.mode}</span>`}
          </div>
        </div>

        <!-- Even Pin (${evenPinNum}) -->
        <div class="ai-pin-card" data-pin="${evenPinNum}" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: ${evenStyle.bg}; color: ${evenStyle.text}; border: 2px solid ${isEvenSelected ? '#3182ce' : evenStyle.border}; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: white; font-weight: bold; font-size: 0.75rem; color: #2d3748; border: 1px solid #cbd5e0;">${evenPinNum}</span>
            <span style="font-weight: 600; font-size: 0.85rem;">${evenDef.name}</span>
          </div>
          <div style="font-size: 0.75rem; opacity: 0.9;">
            ${evenAssigned.length > 0 ? `<span style="background: rgba(0,0,0,0.15); padding: 2px 6px; border-radius: 4px;">${evenAssigned[0].compName}</span>` : `<span style="opacity: 0.6;">${evenDef.mode}</span>`}
          </div>
        </div>
      `;
    }

    gridContainer.innerHTML = gridHTML;

    // Attach click handlers to pin cards
    gridContainer.querySelectorAll('.ai-pin-card').forEach(card => {
      card.addEventListener('click', () => {
        state.selectedPin = parseInt(card.dataset.pin, 10);
        updateUI();
      });
    });

    // 4. Render Pin Inspector Panel
    const inspectorContainer = container.querySelector('#ai-pin-inspector');
    const selPinNum = state.selectedPin || 1;
    const selPinDef = DEFAULT_PINS[String(selPinNum)];
    const selPinAssigned = pinAssignmentsMap[String(selPinNum)] || [];

    inspectorContainer.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 1rem; color: #2d3748; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">
        Pin Inspector (Pin #${selPinNum})
      </h3>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem;">
        <div><strong>Name:</strong> ${selPinDef.name}</div>
        <div><strong>Primary Mode:</strong> ${selPinDef.mode}</div>
        <div><strong>Signal Type:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${selPinDef.type}</code></div>
        <div><strong>Status:</strong> ${selPinAssigned.length > 0 ? `<span style="color: #c53030; font-weight: 600;">Assigned (${selPinAssigned.length})</span>` : '<span style="color: #2f855a; font-weight: 600;">Available</span>'}</div>
        ${selPinAssigned.length > 0 ? `
          <div style="margin-top: 8px; background: #edf2f7; padding: 8px; border-radius: 4px;">
            <strong>Connected Components:</strong>
            <ul style="margin: 4px 0 0 0; padding-left: 18px;">
              ${selPinAssigned.map(a => `<li>${a.compName} &rarr; ${a.pinName}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    // 5. Render Attached Components List
    const compCountEl = container.querySelector('#ai-component-count');
    const compListEl = container.querySelector('#ai-components-list');
    compCountEl.textContent = String(state.components.length);

    if (state.components.length === 0) {
      compListEl.innerHTML = `<div style="text-align: center; color: #a0aec0; padding: 20px; font-size: 0.875rem;">No components attached. Click "+ Add Component" to configure hardware.</div>`;
    } else {
      compListEl.innerHTML = state.components.map(comp => {
        const pinSummary = (comp.pins || []).map(p => `${p.pin_name}: Pin ${p.assigned_pin ?? 'Unassigned'}`).join(', ');
        return `
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 0.9rem; color: #2d3748;">${comp.name}</strong>
              <div>
                <button class="ai-delete-comp-btn" data-id="${comp.id}" style="background: none; border: none; color: #e53e3e; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Delete</button>
              </div>
            </div>
            <div style="font-size: 0.75rem; color: #718096; margin-bottom: 4px;">Category: ${comp.type}</div>
            <div style="font-size: 0.75rem; color: #4a5568; background: white; padding: 4px 6px; border-radius: 4px; border: 1px solid #edf2f7;">
              ${pinSummary || 'No pins specified'}
            </div>
          </div>
        `;
      }).join('');

      compListEl.querySelectorAll('.ai-delete-comp-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const compId = parseInt(e.target.dataset.id, 10);
          state.components = state.components.filter(c => c.id !== compId);
          updateUI();
        });
      });
    }
  }

  // Modal Setup & Dynamic Form Handling
  const modalOverlay = container.querySelector('#ai-modal-overlay');
  const addCompBtn = container.querySelector('#ai-add-component-btn');
  const modalCloseBtn = container.querySelector('#ai-modal-close-btn');
  const modalCancelBtn = container.querySelector('#ai-modal-cancel-btn');
  const resetBtn = container.querySelector('#ai-reset-state-btn');
  const presetSelect = container.querySelector('#ai-preset-select');
  const compNameInput = container.querySelector('#ai-comp-name-input');
  const compTypeInput = container.querySelector('#ai-comp-type-input');
  const mappingsContainer = container.querySelector('#ai-pin-mappings-container');
  const compForm = container.querySelector('#ai-component-form');

  function openModal() {
    modalOverlay.style.display = 'flex';
    populatePinMappings(COMPONENT_LIBRARY[0]); // default preset
    compNameInput.value = COMPONENT_LIBRARY[0].name;
    compTypeInput.value = COMPONENT_LIBRARY[0].type;
    presetSelect.value = COMPONENT_LIBRARY[0].name;
  }

  function closeModal() {
    modalOverlay.style.display = 'none';
  }

  function populatePinMappings(preset) {
    const pins = preset?.pins || [
      { pin_name: 'VCC', pin_type: 'POWER_IN_3V3_5V' },
      { pin_name: 'DATA', pin_type: 'DIGITAL_IO' },
      { pin_name: 'GND', pin_type: 'GROUND' }
    ];

    mappingsContainer.innerHTML = pins.map(p => `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; align-items: center;" class="ai-pin-map-row" data-pin-name="${p.pin_name}" data-pin-type="${p.pin_type}">
        <span style="font-size: 0.85rem; font-weight: 600;">${p.pin_name}</span>
        <span style="font-size: 0.75rem; color: #718096;">(${p.pin_type})</span>
        <select class="ai-pin-select" style="padding: 4px; border: 1px solid #cbd5e0; border-radius: 4px; font-size: 0.85rem;">
          <option value="">-- Unassigned --</option>
          ${Object.entries(DEFAULT_PINS).map(([num, def]) => `<option value="${num}">Pin ${num} (${def.name})</option>`).join('')}
        </select>
      </div>
    `).join('');
  }

  presetSelect.addEventListener('change', () => {
    const selectedName = presetSelect.value;
    const found = COMPONENT_LIBRARY.find(c => c.name === selectedName);
    if (found) {
      compNameInput.value = found.name;
      compTypeInput.value = found.type;
      populatePinMappings(found);
    } else {
      populatePinMappings(null);
    }
  });

  addCompBtn.addEventListener('click', openModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state = loadInventoryState();
    updateUI();
  });

  compForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = compNameInput.value.trim();
    const type = compTypeInput.value;
    if (!name) return;

    const pinRows = mappingsContainer.querySelectorAll('.ai-pin-map-row');
    const pins = [];
    pinRows.forEach(row => {
      const pin_name = row.dataset.pinName;
      const pin_type = row.dataset.pinType;
      const selectVal = row.querySelector('.ai-pin-select').value;
      const assigned_pin = selectVal ? parseInt(selectVal, 10) : null;
      pins.push({ pin_name, pin_type, assigned_pin });
    });

    const newId = state.components.length > 0 ? Math.max(...state.components.map(c => c.id || 0)) + 1 : 1;
    state.components.push({
      id: newId,
      name,
      type,
      pins
    });

    updateUI();
    closeModal();
  });

  // Initial render
  updateUI();

  return {
    destroy: () => {
      container.innerHTML = '';
    },
    update: () => {
      updateUI();
    }
  };
}
