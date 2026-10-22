import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import nodeFetch from 'node-fetch';
import app from '../../server.js';
import { buildMinimalApkBuffer } from '../lib/apk_helper.js';

let server;
let baseUrl;

beforeAll(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Alpha App Manager & Modal Volume RBAC Distribution', () => {
  it('generates a syntactically valid Android APK buffer with ZIP directory headers', () => {
    const apkBuf = buildMinimalApkBuffer({
      packageName: 'com.alphacore.test',
      appName: 'Test App',
      version: 'v1.0.0'
    });

    expect(apkBuf).toBeDefined();
    expect(apkBuf.length).toBeGreaterThan(100);
    // Standard ZIP signature (PK\x03\x04)
    expect(apkBuf.readUInt32LE(0)).toBe(0x04034b50);
  });

  it('lists apps and locks distribution to Modal profile josh627764 and volume alpha-apps', async () => {
    const res = await nodeFetch(`${baseUrl}/api/apps`, {
      headers: { 'x-user-pin': '672167566' }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lockedModalProfile).toBe('josh627764');
    expect(body.modalVolume).toBe('alpha-apps');
    expect(body.apps.length).toBeGreaterThanOrEqual(3);

    // Architect clearance authorizes download of all apps
    const allCanDownload = body.apps.every(a => a.canDownload === true);
    expect(allCanDownload).toBe(true);
  });

  it('restricts specific APKs for non-architect users based on allowedProfiles', async () => {
    // Fisherman has PIN 1990
    const res = await nodeFetch(`${baseUrl}/api/apps`, {
      headers: { 'x-user-pin': '1990' }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.callerProfile).toBe('Fisherman');

    const hudApp = body.apps.find(a => a.id === 'alphacore-hud-mobile');
    const sentinelApp = body.apps.find(a => a.id === 'alpha-sentinel-recon');
    const vaultApp = body.apps.find(a => a.id === 'crypt-vault-authenticator');

    // hudApp is Architect-only -> Fisherman must be denied
    expect(hudApp.canDownload).toBe(false);

    // sentinelApp is permitted for Fisherman -> Must be authorized
    expect(sentinelApp.canDownload).toBe(true);

    // vaultApp is public (*) -> Must be authorized
    expect(vaultApp.canDownload).toBe(true);
  });

  it('blocks unauthorized users from downloading restricted .apk files with 403 Forbidden', async () => {
    // Fisherman attempts to download the Architect-only HUD apk
    const res = await nodeFetch(`${baseUrl}/api/apps/alphacore-hud-mobile/download`, {
      headers: { 'x-user-pin': '1990' }
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('ACCESS_DENIED');
  });

  it('allows authorized users to download permitted .apk binaries with proper MIME headers', async () => {
    // Fisherman downloads the sentinel APK
    const res = await nodeFetch(`${baseUrl}/api/apps/alpha-sentinel-recon/download`, {
      headers: { 'x-user-pin': '1990' }
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/vnd.android.package-archive');
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="Alpha_Sentinel_v2.1.0.apk"');
    expect(res.headers.get('x-locked-modal-profile')).toBe('josh627764');
    expect(res.headers.get('x-modal-volume')).toBe('alpha-apps');

    const buf = await res.buffer();
    expect(buf.length).toBeGreaterThan(0);
  });

  it('allows Architect to download any APK', async () => {
    const res = await nodeFetch(`${baseUrl}/api/apps/alphacore-hud-mobile/download`, {
      headers: { 'x-user-pin': '672167566' }
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/vnd.android.package-archive');
    expect(res.headers.get('x-locked-modal-profile')).toBe('josh627764');
  });

  it('reports App Manager volume telemetry and profile status', async () => {
    const res = await nodeFetch(`${baseUrl}/api/apps/status/telemetry`);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.service).toBe('AlphaCore App Manager');
    expect(body.status).toBe('ONLINE');
    expect(body.lockedModalProfile).toBe('josh627764');
    expect(body.modalVolume).toBe('alpha-apps');
    expect(body.totalApps).toBeGreaterThanOrEqual(3);
  });
});
