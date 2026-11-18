import type { DemoState } from '../model/types';
import { RegisterLoadError, type RegisterSnapshot } from './types';

/** Reads the register from `GET /api/register`; any failure becomes a `RegisterLoadError`. */
export async function fetchRegister(
  demo: DemoState,
  signal?: AbortSignal,
): Promise<RegisterSnapshot> {
  let response: Response;
  try {
    response = await fetch(`/api/register?state=${demo}`, { signal, cache: 'no-store' });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new RegisterLoadError(0);
  }
  if (!response.ok) throw new RegisterLoadError(response.status);
  return response.json();
}
