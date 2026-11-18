import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import c from './collapsible.module.css';

/**
 * Height-animated disclosure region (grid-rows 0fr → 1fr). Closed content stays in
 * the DOM for the closing animation but is inert and hidden from assistive tech.
 */
export function Collapsible({
  id,
  open,
  children,
}: {
  id: string;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      className={cx(c.collapsible, open && c.open)}
      data-state={open ? 'open' : 'closed'}
      aria-hidden={!open}
      inert={!open}
    >
      <div className={c.inner}>{children}</div>
    </div>
  );
}
