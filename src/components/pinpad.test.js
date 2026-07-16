import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addPin, getPins } from './pinpad.js';

vi.mock('./db_sync.js', () => ({
  pushToServer: vi.fn()
}));

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
