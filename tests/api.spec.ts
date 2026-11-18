import { test, expect } from '@playwright/test';
import { createDocuments } from '../src/features/register/model/fixtures';

// The register's API: the screen's reloads, empty and error states are real requests.
test.describe('GET /api/register', { tag: '@desktop' }, () => {
  test('serves the demo register', async ({ request }) => {
    const response = await request.get('/api/register');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');
    const { documents, series } = await response.json();
    expect(documents).toHaveLength(createDocuments().length);
    expect(series.length).toBeGreaterThan(0);
  });

  test('reproduces the empty and failing states', async ({ request }) => {
    const empty = await request.get('/api/register?state=empty');
    expect((await empty.json()).documents).toEqual([]);
    expect((await request.get('/api/register?state=error')).status()).toBe(503);
    expect((await request.get('/api/register?state=nope')).status()).toBe(400);
  });

  test('only reads, and says nothing back about a bad request', async ({ request }) => {
    expect((await request.post('/api/register')).status()).toBe(405);
    expect((await request.delete('/api/register')).status()).toBe(405);
    const junk = 'x'.repeat(2000);
    const bad = await request.get(`/api/register?state=${junk}`);
    expect(bad.status()).toBe(400);
    expect(await bad.text()).toBe('{"error":"unknown_state"}');
    const served = await request.get('/api/register');
    const headers = served.headers();
    expect(headers['content-type']).toContain('application/json');
    expect(headers['x-robots-tag']).toBe('noindex, nofollow');
    // Not readable from other sites.
    expect(headers['access-control-allow-origin']).toBeUndefined();
  });
});
