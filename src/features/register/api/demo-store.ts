import { createDocuments, defaultSeries } from '../model/fixtures';
import type { DemoState } from '../model/types';
import { RegisterLoadError, type RegisterSnapshot } from './types';

/** The data states the demo can serve, chosen in the «DEMO» menu or by `?state=`. */
export const demoStates = ['populated', 'empty', 'error'] as const satisfies readonly DemoState[];

/** The `?state=` of a request: none means populated, anything unknown is refused. */
export function parseDemoState(value: string | null): DemoState | null {
  if (value === null) return 'populated';
  return demoStates.find((state) => state === value) ?? null;
}

/**
 * The demo's stand-in for the accounting backend. A real implementation reads the
 * organisation's register here; the route, the page and the screen stay as they are.
 */
export function readRegister(demo: DemoState): RegisterSnapshot {
  if (demo === 'error') throw new RegisterLoadError(503);
  return {
    documents: demo === 'populated' ? createDocuments() : [],
    series: defaultSeries,
  };
}
