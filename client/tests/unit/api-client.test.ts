import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, query, request } from '../../src/api/client.ts';

function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response>) {
  const spy = vi.fn(impl);
  vi.stubGlobal('fetch', spy);
  return spy;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('prefixes /api, sends JSON and parses the response', async () => {
    const spy = stubFetch(() => Promise.resolve(json(201, { id: 'p1', name: 'Web' })));
    await expect(request('/projects', { method: 'POST', body: { name: 'Web' } })).resolves.toEqual({
      id: 'p1',
      name: 'Web',
    });
    const [url, init] = spy.mock.calls[0] ?? [];
    expect(url).toBe('/api/projects');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"name":"Web"}');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('resolves 204 responses with undefined', async () => {
    stubFetch(() => Promise.resolve(new Response(null, { status: 204 })));
    await expect(request('/projects/p1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws the API error code and message verbatim', async () => {
    stubFetch(() =>
      Promise.resolve(
        json(409, { error: { code: 'CONFLICT', message: 'A project named "Web" already exists' } }),
      ),
    );
    const error = await request('/projects').catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'CONFLICT',
      status: 409,
      message: 'A project named "Web" already exists',
    });
  });

  it('reports a non-JSON failure with its status', async () => {
    stubFetch(() => Promise.resolve(new Response('Bad gateway', { status: 502 })));
    await expect(request('/projects')).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      status: 502,
      message: 'The server answered 502 without an explanation.',
    });
  });

  it('turns a failed connection into a NETWORK_ERROR', async () => {
    stubFetch(() => Promise.reject(new TypeError('fetch failed')));
    await expect(request('/projects')).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('rethrows aborts untouched', async () => {
    stubFetch(() => Promise.reject(new DOMException('aborted', 'AbortError')));
    await expect(request('/projects')).rejects.toBeInstanceOf(DOMException);
  });
});

describe('query', () => {
  it('skips undefined values', () => {
    expect(query({ limit: 1, status: undefined, q: 'a b' })).toBe('?limit=1&q=a+b');
    expect(query({ status: undefined })).toBe('');
  });
});
