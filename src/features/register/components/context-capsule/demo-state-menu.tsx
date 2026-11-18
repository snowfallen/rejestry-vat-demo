'use client';
import { useEffect, useRef, type RefObject } from 'react';
import { useAnchoredPlacement } from '@/hooks/use-anchored-placement';
import { useDismiss } from '@/hooks/use-dismiss';
import { cx } from '@/lib/cx';
import { demoStateCopy } from '../../copy';
import type { DemoState } from '../../model/types';
import { AxisArt } from '../documents';
import c from './context-capsule.module.css';

interface DemoStateMenuProps {
  state: DemoState;
  disabled: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  onState: (state: DemoState) => void;
  onClose: () => void;
}

const states: DemoState[] = ['populated', 'empty', 'error'];

/**
 * The three demo states as a small menu that opens right under the «DEMO» button, so
 * the choice is where the finger already is; each row shows the state's own picture of
 * the VAT axis, and choosing one closes the menu.
 */
export function DemoStateMenu({
  state,
  disabled,
  triggerRef,
  onState,
  onClose,
}: DemoStateMenuProps) {
  const panel = useRef<HTMLDivElement>(null);
  const place = useAnchoredPlacement(triggerRef, true, { width: 320, minHeight: 280 });
  useDismiss(true, onClose, [panel, triggerRef], triggerRef);
  useEffect(() => {
    panel.current?.querySelector<HTMLInputElement>('input:checked')?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={panel}
      role="dialog"
      aria-label={demoStateCopy.title}
      style={place}
      className={cx(
        'fixed z-popover w-[min(320px,calc(100vw-32px))] animate-[panelIn_160ms_ease-out]',
        'overflow-y-auto rounded-[14px] bg-surface p-3 shadow-2',
      )}
    >
      <p className="m-0 px-1 text-[14px] font-semibold text-ink phone:mb-2">
        {demoStateCopy.title}
      </p>
      <p className="m-0 mb-2.5 mt-0.5 px-1 text-[12px] text-muted phone:hidden">
        {demoStateCopy.description}
      </p>
      <fieldset className={c.states} disabled={disabled}>
        <legend className="sr-only">{demoStateCopy.title}</legend>
        {states.map((value) => {
          const option = demoStateCopy.options[value];
          return (
            <label key={value} className={cx(c.state, value === state && c.chosen)}>
              <input
                type="radio"
                name="demo-state"
                value={value}
                checked={value === state}
                onChange={() => onState(value)}
                className={c.radio}
              />
              <AxisArt variant={value === 'populated' ? 'populated' : value} small />
              <span className={c.stateLabel}>{option.label}</span>
              <span className={c.stateHint}>{option.hint}</span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
