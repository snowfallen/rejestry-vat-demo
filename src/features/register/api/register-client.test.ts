import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRegister } from './register-client';
import { RegisterLoadError } from './types';

const failure = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected a failure');
};

describe('register client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the snapshot the API serves', async () => {
    const snapshot = { documents: [], series: [] };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(snapshot)),
    );
    await expect(fetchRegister('empty')).resolves.toEqual(snapshot);
    expect(fetch).toHaveBeenCalledWith('/api/register?state=empty', expect.anything());
  });

  it('turns an HTTP error into a RegisterLoadError with its status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    );
    const error = await failure(fetchRegister('error'));
    expect(error).toBeInstanceOf(RegisterLoadError);
    expect((error as RegisterLoadError).status).toBe(503);
  });

  it('turns a network failure into a RegisterLoadError with status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    const error = await failure(fetchRegister('populated'));
    expect((error as RegisterLoadError).status).toBe(0);
  });
});
