import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validatePin, addPin, getPins } from './pinpad';

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
    expect(pin.expiresAt).toBe(MOCK_TIME + durationSeconds * 1000);
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
    expect(pin.expiresAt).toBe(MOCK_TIME + durationSeconds * 1000);
    expect(pin.used).toBeUndefined();

    const pins = getPins();
    expect(pins).toContainEqual(pin);
  });
});
