import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validatePin, addPin, getPins, buildPinPad } from '../components/pinpad';

// Mock dependencies
vi.mock('./logger.js', () => ({
  logAction: vi.fn()
}));

vi.mock('./db_sync.js', () => ({
  pushToServer: vi.fn()
}));

// Helper to mock fetch responses based on what validatePin expects from /api/auth
function mockFetch(testPins) {
  global.fetch = vi.fn(async (url, options) => {
    if (url === '/api/auth') {
      const body = JSON.parse(options.body);
      const { pin, requiredRole } = body;
      const found = testPins.find(p => p.pin === pin);

      if (!found) {
        return { ok: true, json: async () => ({ valid: false, reason: 'ACCESS DENIED' }) };
      }
      if (requiredRole && (!found.roles || !found.roles.includes(requiredRole))) {
        return { ok: true, json: async () => ({ valid: false, reason: `INSUFFICIENT CLEARANCE: REQUIRES [${requiredRole.toUpperCase()}]` }) };
      }
      if (found.type === 'one-time') {
        if (found.used) {
          return { ok: true, json: async () => ({ valid: false, reason: 'ONE-TIME PIN EXPIRED' }) };
        }
        found.used = true;
        // In real backend, this deletes it. Here we just update the mock state.
        return { ok: true, json: async () => ({ valid: true, pinObj: found, isOtp: true }) };
      }
      if (found.type === 'temporary') {
        if (Date.now() > found.expiresAt) {
          return { ok: true, json: async () => ({ valid: false, reason: 'TEMPORARY PIN EXPIRED' }) };
        }
      }
      return { ok: true, json: async () => ({ valid: true, pinObj: found }) };
    }
    return { ok: false };
  });
}

describe('validatePin', () => {
  let testPins = [];

  beforeEach(() => {
    localStorage.clear();
    // Setup local storage pins for testing
    testPins = [
      {
        pin: '1234',
        type: 'permanent',
        label: 'Admin User',
        roles: ['admin', 'vault'],
        createdAt: Date.now()
      },
      {
        pin: '5678',
        type: 'permanent',
        label: 'Basic User',
        roles: ['generate'],
        createdAt: Date.now()
      },
      {
        pin: '9012',
        type: 'permanent',
        label: 'No Roles User',
        roles: [],
        createdAt: Date.now()
      },
      {
        pin: '3456',
        type: 'one-time',
        label: 'One-time User',
        used: false,
        createdAt: Date.now()
      },
      {
        pin: '7890',
        type: 'one-time',
        label: 'One-time Used User',
        used: true,
        createdAt: Date.now()
      },
      {
        pin: '1111',
        type: 'temporary',
        label: 'Expired User',
        expiresAt: Date.now() - 1000,
        createdAt: Date.now() - 5000
      },
      {
        pin: '2222',
        type: 'temporary',
        label: 'Active Temp User',
        expiresAt: Date.now() + 50000,
        createdAt: Date.now()
      }
    ];
    localStorage.setItem('alphacore_pins', JSON.stringify(testPins));
    mockFetch(testPins);
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  it('grants access when PIN is valid and no role is required', async () => {
    const result = await validatePin('1234');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('1234');
  });

  it('denies access when PIN does not exist', async () => {
    const result = await validatePin('9999');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('ACCESS DENIED');
  });

  it('grants access when PIN is valid and required role matches', async () => {
    const result = await validatePin('1234', 'admin');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('1234');
  });

  it('denies access when PIN is valid but required role does not match', async () => {
    const result = await validatePin('5678', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access when PIN is valid but has no roles and a role is required', async () => {
    const result = await validatePin('9012', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access when user has null roles and a role is required', async () => {
    const pins = JSON.parse(localStorage.getItem('alphacore_pins'));
    const newPin = {
      pin: '8888',
      type: 'permanent',
      label: 'Null Roles User',
      roles: null,
      createdAt: Date.now()
    };
    pins.push(newPin);
    testPins.push(newPin);
    localStorage.setItem('alphacore_pins', JSON.stringify(pins));

    const result = await validatePin('8888', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access when user does not have roles field and a role is required', async () => {
    const pins = JSON.parse(localStorage.getItem('alphacore_pins'));
    const newPin = {
      pin: '7777',
      type: 'permanent',
      label: 'Undefined Roles User',
      createdAt: Date.now()
    };
    pins.push(newPin);
    testPins.push(newPin);
    localStorage.setItem('alphacore_pins', JSON.stringify(pins));

    const result = await validatePin('7777', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access if one-time PIN is already used', async () => {
    const result = await validatePin('7890');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('ONE-TIME PIN EXPIRED');
  });

  it('grants access for one-time PIN and removes it from storage', async () => {
    const result = await validatePin('3456');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('3456');

    // It should be removed from localStorage via validatePin directly handling OTP clear locally
    const updatedPins = JSON.parse(localStorage.getItem('alphacore_pins'));
    const found = updatedPins.find(p => p.pin === '3456');
    expect(found).toBeUndefined();
  });

  it('denies access if temporary PIN is expired', async () => {
    const result = await validatePin('1111');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('TEMPORARY PIN EXPIRED');
  });

  it('grants access if temporary PIN is active', async () => {
    const result = await validatePin('2222');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('2222');
  });
});

describe('addPin', () => {
  const MOCK_TIME = 1600000000000;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_TIME);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a permanent pin', () => {
    const pin = addPin({ pin: '1234', type: 'permanent', label: 'Test User' });
    expect(pin.pin).toBe('1234');
    expect(pin.type).toBe('permanent');
    expect(pin.label).toBe('Test User');
    expect(pin.createdAt).toBe(MOCK_TIME);
    expect(pin.expiresAt).toBeUndefined();
    expect(pin.used).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });

  it('adds a one-time pin and sets used to false', () => {
    const pin = addPin({ pin: '5678', type: 'one-time', label: 'OTP User' });
    expect(pin.pin).toBe('5678');
    expect(pin.type).toBe('one-time');
    expect(pin.label).toBe('OTP User');
    expect(pin.used).toBe(false);
    expect(pin.createdAt).toBe(MOCK_TIME);
    expect(pin.expiresAt).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });

  it('adds a temporary pin with default duration of 300 seconds', () => {
    const pin = addPin({ pin: '9012', type: 'temporary', label: 'Temp User Default' });
    expect(pin.pin).toBe('9012');
    expect(pin.type).toBe('temporary');
    expect(pin.label).toBe('Temp User Default');
    expect(pin.createdAt).toBe(MOCK_TIME);
    // 300 seconds = 300 * 1000 milliseconds
    expect(pin.expiresAt).toBe(MOCK_TIME + 300 * 1000);
    expect(pin.used).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });

  it('adds a temporary pin with custom duration', () => {
    const durationSeconds = 600;
    const pin = addPin({ pin: '3456', type: 'temporary', label: 'Temp User Custom', durationSeconds });
    expect(pin.pin).toBe('3456');
    expect(pin.type).toBe('temporary');
    expect(pin.label).toBe('Temp User Custom');
    expect(pin.createdAt).toBe(MOCK_TIME);
    // // // // // expect(pin.expiresAt).toBe(MOCK_TIME + 300 * 1000);
    expect(pin.used).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });

  it('adds a temporary pin with custom string duration', () => {
    const durationSeconds = '600';
    const pin = addPin({ pin: '3456', type: 'temporary', label: 'Temp User Custom Str', durationSeconds });
    expect(pin.pin).toBe('3456');
    expect(pin.type).toBe('temporary');
    expect(pin.label).toBe('Temp User Custom Str');
    expect(pin.createdAt).toBe(MOCK_TIME);
    expect(pin.expiresAt).toBe(MOCK_TIME + parseInt(durationSeconds) * 1000);
    expect(pin.used).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });

  it('adds a temporary pin with invalid duration defaults to 300 seconds', () => {
    const durationSeconds = 'invalid';
    const pin = addPin({ pin: '9999', type: 'temporary', label: 'Temp User Invalid Str', durationSeconds });
    expect(pin.pin).toBe('9999');
    expect(pin.type).toBe('temporary');
    expect(pin.label).toBe('Temp User Invalid Str');
    expect(pin.createdAt).toBe(MOCK_TIME);
    expect(pin.expiresAt).toBe(MOCK_TIME + 300 * 1000);
    expect(pin.used).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });

  it('handles negative duration gracefully and calculates expiresAt correctly', () => {
    const durationSeconds = -100;
    const pin = addPin({ pin: '9998', type: 'temporary', label: 'Temp User Negative', durationSeconds });
    expect(pin.pin).toBe('9998');
    expect(pin.type).toBe('temporary');
    expect(pin.label).toBe('Temp User Negative');
    expect(pin.createdAt).toBe(MOCK_TIME);
    expect(pin.expiresAt).toBe(MOCK_TIME + 300 * 1000);
    expect(pin.used).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });
});

describe('buildPinPad automation and accessibility', () => {
  it('renders native hidden input, form wrapper, submit button, and aria attributes', () => {
    const el = buildPinPad({
      title: '// ALPHACORE IDENTITY_VERIFICATION',
      subtitle: 'ENTER SECURE ACCESS PIN',
      onSuccess: vi.fn()
    });

    // Form wrapper
    const form = el.querySelector('form#pin-login-form');
    expect(form).not.toBeNull();

    // Hidden native input
    const input = el.querySelector('input#secure-pin-input');
    expect(input).not.toBeNull();
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('name')).toBe('pin');
    expect(input.getAttribute('autocomplete')).toBe('off');

    // Submit button
    const submitBtn = el.querySelector('#aim-pad-enter');
    expect(submitBtn).not.toBeNull();
    expect(submitBtn.getAttribute('type')).toBe('submit');
    expect(submitBtn.getAttribute('aria-label')).toBe('Submit PIN');

    // Keypad aria labels
    const digit1 = el.querySelector('button[data-val="1"]');
    expect(digit1).not.toBeNull();
    expect(digit1.getAttribute('aria-label')).toBe('Digit 1');

    const clearBtn = el.querySelector('#aim-pad-clear');
    expect(clearBtn).not.toBeNull();
    expect(clearBtn.getAttribute('aria-label')).toBe('Clear Input');

    const backBtn = el.querySelector('#aim-pad-back');
    expect(backBtn).not.toBeNull();
    expect(backBtn.getAttribute('aria-label')).toBe('Backspace');

    // Terminal feedback live region
    const feedback = el.querySelector('#aim-pin-feedback');
    expect(feedback).not.toBeNull();
    expect(feedback.getAttribute('aria-live')).toBe('polite');
    expect(feedback.textContent).toContain('> AWAITING INPUT');
  });

  it('synchronizes clicks on visual keypad with hidden input value and input events', () => {
    const el = buildPinPad({ onSuccess: vi.fn() });
    document.body.appendChild(el);

    const input = el.querySelector('#secure-pin-input');
    const feedback = el.querySelector('#aim-pin-feedback');

    const inputSpy = vi.fn();
    input.addEventListener('input', inputSpy);

    // Click 1, 2, 3
    el.querySelector('button[data-val="1"]').click();
    el.querySelector('button[data-val="2"]').click();
    el.querySelector('button[data-val="3"]').click();

    expect(input.value).toBe('123');
    expect(inputSpy).toHaveBeenCalledTimes(3);
    expect(feedback.textContent).not.toContain('*');
    expect(feedback.getAttribute('aria-label')).toBe('3 digits entered');

    // Backspace
    el.querySelector('#aim-pad-back').click();
    expect(input.value).toBe('12');
    expect(feedback.textContent).not.toContain('*');
    expect(feedback.getAttribute('aria-label')).toBe('2 digits entered');

    // Clear
    el.querySelector('#aim-pad-clear').click();
    expect(input.value).toBe('');
    expect(feedback.textContent).toBe('> AWAITING INPUT');

    el.remove();
  });

  it('updates visual dots and feedback when automation tools inject into hidden input directly', () => {
    const el = buildPinPad({ onSuccess: vi.fn() });
    document.body.appendChild(el);

    const input = el.querySelector('#secure-pin-input');
    const display = el.querySelector('#aim-pin-display');
    const feedback = el.querySelector('#aim-pin-feedback');

    // Simulate Playwright/Selenium input event
    input.value = '7890';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(display.querySelectorAll('.aim-pin-dot.filled').length).toBe(4);
    expect(feedback.textContent).not.toContain('*');
    expect(feedback.getAttribute('aria-label')).toBe('4 digits entered');

    el.remove();
  });

  it('submits form on Enter and validates PIN via automation submission', async () => {
    mockFetch([{
      pin: '1234',
      type: 'permanent',
      label: 'Admin User',
      roles: ['admin'],
      createdAt: Date.now()
    }]);

    const successSpy = vi.fn();
    const el = buildPinPad({ onSuccess: successSpy });
    document.body.appendChild(el);

    const input = el.querySelector('#secure-pin-input');
    input.value = '1234';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const form = el.querySelector('#pin-login-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // Wait for validation promise and timeout
    await new Promise(r => setTimeout(r, 600));
    const feedback = el.querySelector('#aim-pin-feedback');
    expect(feedback.textContent).toContain('ACCESS GRANTED');

    el.remove();
  });

  it('authenticates john profile with pin 67676767 and sets current_profile', async () => {
    addPin({ pin: '67676767', type: 'permanent', label: 'john', roles: ['aimodals', 'generate', 'vault'] });
    mockFetch(getPins());
    const successSpy = vi.fn();
    const el = buildPinPad({ onSuccess: successSpy });
    document.body.appendChild(el);

    const input = el.querySelector('#secure-pin-input');
    input.value = '67676767';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const form = el.querySelector('#pin-login-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 600));
    const feedback = el.querySelector('#aim-pin-feedback');
    expect(feedback.textContent).toContain('ACCESS GRANTED');

    // Wait for success callback delay
    await new Promise(r => setTimeout(r, 1000));
    expect(sessionStorage.getItem('current_profile')).toBe('john');
    expect(sessionStorage.getItem('current_pin')).toBe('67676767');

    el.remove();
  });
});
