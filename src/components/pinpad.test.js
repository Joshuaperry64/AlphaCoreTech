import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validatePin } from './pinpad';

// Mock dependencies
vi.mock('./logger.js', () => ({
  logAction: vi.fn()
}));

vi.mock('./db_sync.js', () => ({
  pushToServer: vi.fn()
}));

describe('validatePin', () => {
  beforeEach(() => {
    localStorage.clear();
    // Setup local storage pins for testing
    const testPins = [
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('grants access when PIN is valid and no role is required', () => {
    const result = validatePin('1234');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('1234');
  });

  it('denies access when PIN does not exist', () => {
    const result = validatePin('9999');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('ACCESS DENIED');
  });

  it('grants access when PIN is valid and required role matches', () => {
    const result = validatePin('1234', 'admin');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('1234');
  });

  it('denies access when PIN is valid but required role does not match', () => {
    const result = validatePin('5678', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access when PIN is valid but has no roles and a role is required', () => {
    const result = validatePin('9012', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access when user has null roles and a role is required', () => {
    const pins = JSON.parse(localStorage.getItem('alphacore_pins'));
    pins.push({
      pin: '8888',
      type: 'permanent',
      label: 'Null Roles User',
      roles: null,
      createdAt: Date.now()
    });
    localStorage.setItem('alphacore_pins', JSON.stringify(pins));

    const result = validatePin('8888', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access when user does not have roles field and a role is required', () => {
    const pins = JSON.parse(localStorage.getItem('alphacore_pins'));
    pins.push({
      pin: '7777',
      type: 'permanent',
      label: 'Undefined Roles User',
      createdAt: Date.now()
    });
    localStorage.setItem('alphacore_pins', JSON.stringify(pins));

    const result = validatePin('7777', 'admin');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT CLEARANCE: REQUIRES [ADMIN]');
  });

  it('denies access if one-time PIN is already used', () => {
    const result = validatePin('7890');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('ONE-TIME PIN EXPIRED');
  });

  it('grants access for one-time PIN and removes it from storage', () => {
    const result = validatePin('3456');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('3456');

    // It should be removed from localStorage via savePins inside validatePin
    const updatedPins = JSON.parse(localStorage.getItem('alphacore_pins'));
    const found = updatedPins.find(p => p.pin === '3456');
    expect(found).toBeUndefined();
  });

  it('denies access if temporary PIN is expired', () => {
    const result = validatePin('1111');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('TEMPORARY PIN EXPIRED');
  });

  it('grants access if temporary PIN is active', () => {
    const result = validatePin('2222');
    expect(result.valid).toBe(true);
    expect(result.pinObj.pin).toBe('2222');
  });
});
