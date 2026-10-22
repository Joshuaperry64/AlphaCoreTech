import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import nodeFetch from 'node-fetch';
import app from '../../server.js';

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

describe('Vault Classified URL Links RBAC Directory', () => {
  it('lists vault links with universal access for Architect profile', async () => {
    const res = await nodeFetch(`${baseUrl}/api/vault/links`, {
      headers: { 'x-user-pin': '672167566' }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.callerProfile).toBe('Architect');
    expect(body.isArchitect).toBe(true);
    expect(body.links.length).toBeGreaterThanOrEqual(4);

    // All links must be accessible to Architect
    const allCanAccess = body.links.every(l => l.canAccess === true);
    expect(allCanAccess).toBe(true);
  });

  it('enforces RBAC permissions and redacts secret URLs for non-architect users', async () => {
    // Fisherman has PIN 1990
    const res = await nodeFetch(`${baseUrl}/api/vault/links`, {
      headers: { 'x-user-pin': '1990' }
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.callerProfile).toBe('Fisherman');

    const orchestratorLink = body.links.find(l => l.id === 'link_modal_orchestrator');
    const telemetryLink = body.links.find(l => l.id === 'link_b300_telemetry');
    const civitaiLink = body.links.find(l => l.id === 'link_civitai_registry');

    // orchestratorLink is Architect-only -> Fisherman must be denied and URL redacted
    expect(orchestratorLink.canAccess).toBe(false);
    expect(orchestratorLink.url).toContain('••••');

    // telemetryLink permits Fisherman -> Accessible with full URL
    expect(telemetryLink.canAccess).toBe(true);
    expect(telemetryLink.url).toContain('https://');

    // civitaiLink is public (*) -> Accessible to all active users
    expect(civitaiLink.canAccess).toBe(true);
  });

  it('rejects unauthorized users from creating new vault links with 403 Forbidden', async () => {
    const res = await nodeFetch(`${baseUrl}/api/vault/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-pin': '1990' // Fisherman
      },
      body: JSON.stringify({
        title: 'Unauthorized Node',
        url: 'https://evil.corp'
      })
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Architect clearance required');
  });

  it('allows Architect to add, update permissions, track clicks, and delete vault links', async () => {
    // 1. Add link
    const addRes = await nodeFetch(`${baseUrl}/api/vault/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-pin': '672167566'
      },
      body: JSON.stringify({
        title: 'Autonomous Swarm Node',
        url: 'modal.com/apps/swarm',
        category: 'INFRASTRUCTURE',
        description: 'Multi-agent orchestration channel',
        allowedProfiles: ['Architect', 'Fisherman'],
        accessLevel: 'ROLE_LOCKED'
      })
    });

    expect(addRes.status).toBe(200);
    const addBody = await addRes.json();
    expect(addBody.success).toBe(true);
    const createdLink = addBody.link;
    expect(createdLink.id).toBeDefined();
    expect(createdLink.url).toBe('https://modal.com/apps/swarm');

    // 2. Track click telemetry
    const clickRes = await nodeFetch(`${baseUrl}/api/vault/links/${encodeURIComponent(createdLink.id)}/click`, {
      method: 'POST'
    });
    expect(clickRes.status).toBe(200);
    const clickBody = await clickRes.json();
    expect(clickBody.clicksCount).toBe(1);

    // 3. Update permissions
    const permRes = await nodeFetch(`${baseUrl}/api/vault/links/${encodeURIComponent(createdLink.id)}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-pin': '672167566'
      },
      body: JSON.stringify({
        allowedProfiles: ['Architect', 'J. P.'],
        accessLevel: 'RESTRICTED'
      })
    });
    expect(permRes.status).toBe(200);
    const permBody = await permRes.json();
    expect(permBody.link.allowedProfiles).toContain('J. P.');

    // 4. Delete link
    const delRes = await nodeFetch(`${baseUrl}/api/vault/links/${encodeURIComponent(createdLink.id)}`, {
      method: 'DELETE',
      headers: {
        'x-user-pin': '672167566'
      }
    });
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.success).toBe(true);
  });
});
