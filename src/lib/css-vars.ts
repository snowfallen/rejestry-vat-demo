import type { CSSProperties } from 'react';

/** Custom properties for an inline style, typed at the call site: `cssVars({ '--i': 3 })`. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}
