'use client';
import { useRef, useState } from 'react';
import { CalendarRange, ChevronDown, Info } from 'lucide-react';
import { useDetailsDismiss } from '@/hooks/use-dismiss';
import { accountingYear, organization } from '@/features/workspace';
import { contextCopy } from '../../copy';
import type { DemoState } from '../../model/types';
import { DemoStateMenu } from './demo-state-menu';
import c from './context-capsule.module.css';

interface ContextCapsuleProps {
  state: DemoState;
  disabled: boolean;
  onState: (state: DemoState) => void;
  onOpenMap: () => void;
}

/**
 * Everything the reference says about context, in one capsule: the accounting year
 * (opens the areas map), the VAT context (explains itself) and the demo data (switches
 * the register between its populated, empty and error states).
 */
export function ContextCapsule({ state, disabled, onState, onOpenMap }: ContextCapsuleProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const demoButton = useRef<HTMLButtonElement>(null);
  const [picking, setPicking] = useState(false);
  useDetailsDismiss(details);
  return (
    <div className={c.root}>
      <div className={c.capsule}>
        <button
          type="button"
          className={c.year}
          title={contextCopy.yearHint}
          onClick={(event) => {
            event.currentTarget.focus();
            onOpenMap();
          }}
        >
          <CalendarRange size={15} className={c.yearIcon} aria-hidden="true" />
          <span>
            {contextCopy.year} <strong>{accountingYear.year}</strong>
          </span>
          <span className={c.dot} aria-hidden="true" />
          <span className={c.status}>{accountingYear.status}</span>
        </button>
        <details ref={details} className={c.context} data-context="">
          <summary aria-label={contextCopy.vatLabel} title={contextCopy.vatHint}>
            <Info size={14} aria-hidden="true" />
            {contextCopy.vat}
          </summary>
          <div className={c.panel}>
            <p>{contextCopy.vatText(organization)}</p>
          </div>
        </details>
        <button
          ref={demoButton}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={picking}
          aria-label={contextCopy.demoLabel}
          className={c.demo}
          title={contextCopy.demoHint}
          onClick={() => setPicking(!picking)}
        >
          {contextCopy.demo}
          <ChevronDown size={13} aria-hidden="true" />
        </button>
      </div>
      {picking && (
        <DemoStateMenu
          state={state}
          disabled={disabled}
          triggerRef={demoButton}
          onState={(next) => {
            setPicking(false);
            if (next !== state) onState(next);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}
