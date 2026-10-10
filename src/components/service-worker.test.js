import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const workerSource = readFileSync('public/sw.js', 'utf8');

describe('Service worker cache recovery', () => {
  let handlers;
  let cache;
  let cacheStorage;
  let networkFetch;
  let worker;

  beforeEach(() => {
    handlers = {};
    cache = {
      addAll: vi.fn().mockResolvedValue(undefined),
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined)
    };
    cacheStorage = {
      open: vi.fn().mockResolvedValue(cache),
      keys: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(true)
    };
    networkFetch = vi.fn();
    worker = {
      location: { origin: 'https://alphacore.test' },
      skipWaiting: vi.fn().mockResolvedValue(undefined),
      clients: { claim: vi.fn().mockResolvedValue(undefined) },
      addEventListener: (name, handler) => { handlers[name] = handler; }
    };
    runInNewContext(workerSource, { self: worker, caches: cacheStorage, fetch: networkFetch, URL });
  });

  function fetchEvent(path = '/', overrides = {}) {
    return {
      request: { url: `https://alphacore.test${path}`, method: 'GET', mode: 'navigate', ...overrides },
      respondWith: vi.fn()
    };
  }

  it('activates the updated worker after precaching succeeds', async () => {
    const event = { waitUntil: vi.fn() };
    handlers.install(event);
    await event.waitUntil.mock.calls[0][0];
    expect(cacheStorage.open).toHaveBeenCalledWith('alphacore-cache-v2');
    expect(cache.addAll).toHaveBeenCalledWith(expect.arrayContaining(['/index.html']));
    expect(worker.skipWaiting).toHaveBeenCalledOnce();
  });

  it('uses fresh HTML instead of a cached shell pointing at obsolete JavaScript', async () => {
    cache.match.mockResolvedValue(new Response('<script src="/assets/obsolete.js"></script>'));
    networkFetch.mockResolvedValue(new Response('<script src="/assets/current.js"></script>', {
      headers: { 'content-type': 'text/html' }
    }));
    const event = fetchEvent();
    handlers.fetch(event);
    const response = await event.respondWith.mock.calls[0][0];
    expect(await response.text()).toContain('/assets/current.js');
    expect(cache.match).not.toHaveBeenCalled();
    expect(cache.put).toHaveBeenCalledWith('/index.html', expect.any(Response));
  });

  it('uses the cached shell for offline navigation, including deep links', async () => {
    networkFetch.mockRejectedValue(new TypeError('Offline'));
    cache.match.mockResolvedValue(new Response('Offline shell'));
    const event = fetchEvent('/overview?tab=core');
    handlers.fetch(event);
    const response = await event.respondWith.mock.calls[0][0];
    expect(await response.text()).toBe('Offline shell');
    expect(cache.match).toHaveBeenCalledWith('/index.html');
  });

  it('does not replace HTTP failures with stale HTML', async () => {
    networkFetch.mockResolvedValue(new Response('Unavailable', { status: 503 }));
    const event = fetchEvent();
    handlers.fetch(event);
    const response = await event.respondWith.mock.calls[0][0];
    expect(response.status).toBe(503);
    expect(cache.put).not.toHaveBeenCalled();
    expect(cache.match).not.toHaveBeenCalled();
  });

  it('returns fresh HTML even when browser cache writes fail', async () => {
    networkFetch.mockResolvedValue(new Response('Fresh shell', { headers: { 'content-type': 'text/html' } }));
    cache.put.mockRejectedValue(new Error('Storage quota exceeded'));
    const event = fetchEvent();
    handlers.fetch(event);
    const response = await event.respondWith.mock.calls[0][0];
    expect(await response.text()).toBe('Fresh shell');
  });

  it('propagates network failure when there is no offline shell', async () => {
    networkFetch.mockRejectedValue(new TypeError('Offline'));
    const event = fetchEvent();
    handlers.fetch(event);
    await expect(event.respondWith.mock.calls[0][0]).rejects.toThrow('Offline');
  });

  it.each([
    ['/api/settings', {}],
    ['/api', {}],
    ['/.netlify/functions/api', {}],
    ['/', { method: 'POST' }],
    ['/', { url: 'https://other.test/index.html' }]
  ])('leaves dynamic or external requests untouched: %s %j', (path, overrides) => {
    const event = fetchEvent(path, overrides);
    handlers.fetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
    expect(networkFetch).not.toHaveBeenCalled();
  });

  it('keeps static assets available from the current cache', async () => {
    cache.match.mockResolvedValue(new Response('Cached logo'));
    const event = fetchEvent('/Images/ALPHA-LOGO.png', { mode: 'cors' });
    handlers.fetch(event);
    const response = await event.respondWith.mock.calls[0][0];
    expect(await response.text()).toBe('Cached logo');
    expect(cacheStorage.open).toHaveBeenCalledWith('alphacore-cache-v2');
    expect(networkFetch).not.toHaveBeenCalled();
  });

  it('requests uncached JavaScript from the network', async () => {
    networkFetch.mockResolvedValue(new Response('Current script'));
    const event = fetchEvent('/assets/current.js', { mode: 'cors' });
    handlers.fetch(event);
    const response = await event.respondWith.mock.calls[0][0];
    expect(await response.text()).toBe('Current script');
    expect(networkFetch).toHaveBeenCalledWith(event.request);
  });

  it('removes legacy AlphaCore caches without deleting unrelated storage', async () => {
    cacheStorage.keys.mockResolvedValue(['alphacore-cache-v1', 'alphacore-cache-v2', 'other-app']);
    const event = { waitUntil: vi.fn() };
    handlers.activate(event);
    await event.waitUntil.mock.calls[0][0];
    expect(cacheStorage.delete).toHaveBeenCalledExactlyOnceWith('alphacore-cache-v1');
    expect(worker.clients.claim).toHaveBeenCalledOnce();
  });
});
