import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalNotification,
  promptNotificationPermissionIfNeeded,
  handleIncomingBroadcast,
  dispatchBroadcast
} from '../components/notifications.js';

describe('Notification & Broadcast Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('detects notification support and permissions correctly', () => {
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    };

    expect(isNotificationSupported()).toBe(true);
    expect(getNotificationPermission()).toBe('default');
  });

  it('prompts user with cyber HUD when permission is default', () => {
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    };

    promptNotificationPermissionIfNeeded();
    const hud = document.getElementById('alphacore-notif-prompt-hud');
    expect(hud).toBeTruthy();
    expect(hud.textContent).toContain('SYSTEM COMM LINK // NOTIFICATIONS');

    // Dismissal test
    const dismissBtn = hud.querySelector('#notif-prompt-dismiss-btn');
    expect(dismissBtn).toBeTruthy();
    dismissBtn.click();

    expect(document.getElementById('alphacore-notif-prompt-hud')).toBeNull();
    expect(sessionStorage.getItem('alphacore_notif_prompt_dismissed')).toBe('1');
  });

  it('does not re-prompt if already dismissed in session', () => {
    global.Notification = { permission: 'default' };
    sessionStorage.setItem('alphacore_notif_prompt_dismissed', '1');

    promptNotificationPermissionIfNeeded();
    expect(document.getElementById('alphacore-notif-prompt-hud')).toBeNull();
  });

  it('requests permission and triggers welcome notification when enabled', async () => {
    const mockRequest = vi.fn().mockResolvedValue('granted');
    const mockNotification = vi.fn();
    global.Notification = mockNotification;
    global.Notification.permission = 'default';
    global.Notification.requestPermission = mockRequest;

    const res = await requestNotificationPermission();
    expect(res).toBe('granted');
    expect(localStorage.getItem('alphacore_notifs_enabled')).toBe('true');
  });

  it('handles incoming broadcasts and respects target audience filtering', () => {
    sessionStorage.setItem('current_profile', 'john');

    const showSpy = vi.fn();
    global.Notification = showSpy;
    global.Notification.permission = 'granted';

    // Broadcast targeted to DoeBoy only -> should ignore
    handleIncomingBroadcast({
      id: 'test-1',
      title: 'Targeted transmission',
      message: 'For DoeBoy only',
      target: 'DoeBoy'
    });
    expect(showSpy).not.toHaveBeenCalled();

    // Broadcast targeted to ALL -> should deliver
    handleIncomingBroadcast({
      id: 'test-2',
      title: 'All Operator Transmission',
      message: 'Notice to everyone',
      target: 'ALL'
    });
  });

  it('dispatches broadcast payload successfully', async () => {
    const res = await dispatchBroadcast({
      title: 'System Alert',
      message: 'Matrix overload test',
      target: 'ALL',
      urgency: 'HIGH'
    });

    expect(res.success).toBe(true);
    expect(res.payload.title).toBe('System Alert');
    expect(res.payload.message).toBe('Matrix overload test');
  });
});
