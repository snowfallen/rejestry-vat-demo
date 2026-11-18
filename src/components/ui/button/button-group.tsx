import type { ReactNode } from 'react';
import g from './button-group.module.css';

/** Related actions as one control on desktop; on phones the buttons stand apart. */
export function ButtonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className={g.group}>
      {children}
    </div>
  );
}
