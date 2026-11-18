'use client';
import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { FileInput, FileOutput } from 'lucide-react';
import { AnimatedMoney } from '@/components/ui/animated-money';
import { useScrollDepth, useScrollDirection } from '@/hooks/use-scroll-direction';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import { formatAmount } from '@/lib/format';
import { registers } from '../../model/labels';
import type { RegisterKind } from '../../model/types';
import r from './register-sheet.module.css';
import tb from './register-tabs.module.css';
import { documentCount, registerCopy } from '../../copy';

export interface RegisterFigures {
  /** VAT of every document in the period, whatever the search and filters. */
  periodVat: number;
  count: number;
  periodCount: number;
}

interface RegisterSheetProps {
  kind: RegisterKind;
  onKind: (kind: RegisterKind) => void;
  figures: Record<RegisterKind, RegisterFigures>;
  loading: boolean;
  broken: boolean;
  children: ReactNode;
}

const kinds: RegisterKind[] = ['sales', 'purchases'];

// One sheet holds both registers. Its header is a track with a tab per register,
// each showing that register's VAT; the white tab slides to the chosen register and
// continues into the documents below. What the period comes to is said once, in the
// period card above.
export function RegisterSheet({
  kind,
  onKind,
  figures,
  loading,
  broken,
  children,
}: RegisterSheetProps) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  // Phones: once the sheet has stuck under the header and the list scrolled on, the
  // tabs fold into one line, and the search row slides away while scrolling down.
  const sheet = useRef<HTMLDivElement>(null);
  const depth = useScrollDepth(sheet, 32, [120, 200]);
  const direction = useScrollDirection();
  const index = kinds.indexOf(kind);
  const unavailable = loading || broken;

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const target = { ArrowLeft: 0, Home: 0, ArrowRight: 1, End: 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    onKind(kinds[target]);
    tabs.current[target]?.focus();
  }

  return (
    <div
      ref={sheet}
      className={r.sheet}
      data-sheet=""
      data-intro-part="sheet"
      data-compact={depth >= 1 ? '' : undefined}
      data-tools-hidden={depth >= 2 && direction === 'down' ? '' : undefined}
    >
      <div className={r.header} data-tour="registers">
        <div
          role="tablist"
          aria-label={registerCopy.tabs}
          className={cx(tb.tabs, index === 0 ? tb.atStart : tb.atEnd)}
          style={cssVars({ '--index': index })}
        >
          <span className={tb.slider} aria-hidden="true" />
          {kinds.map((register, i) => {
            const selected = register === kind;
            // The tab is the register for the period: search and filters change the list
            // below (and its count here), never the register's VAT.
            const { periodVat, count, periodCount } = figures[register];
            const filtered = selected && count !== periodCount;
            return (
              <div key={register} className={cx(tb.tab, selected && tb.selected)}>
                <button
                  ref={(element) => {
                    tabs.current[i] = element;
                  }}
                  id={`tab-${register}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="register-panel"
                  aria-describedby={`tab-${register}-figures`}
                  tabIndex={selected ? 0 : -1}
                  className={tb.tabButton}
                  onClick={() => onKind(register)}
                  onKeyDown={onKeyDown}
                >
                  <TabIcon register={register} />
                  <span className={tb.fullTitle}>{registers[register].title}</span>
                  <span className={tb.shortTitle} aria-hidden="true">
                    {registerCopy.short[register]}
                  </span>
                </button>
                <span className={tb.count}>
                  {unavailable
                    ? '—'
                    : filtered
                      ? `${count} z ${periodCount}`
                      : documentCount(periodCount)}
                </span>
                <span id={`tab-${register}-figures`} className={tb.figures}>
                  <span className={tb.vatLabel}>
                    VAT
                    <span className={tb.vatKind}> {registers[register].vatKind}</span>
                  </span>
                  <span className={cx(tb.vat, loading && r.loading)}>
                    <AnimatedMoney value={periodVat} unavailable={broken} />
                  </span>
                  <span className={tb.vatShort} aria-hidden="true">
                    {broken ? '—' : formatAmount(periodVat)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <section
        id="register-panel"
        role="tabpanel"
        aria-labelledby={`tab-${kind}`}
        className={r.panel}
      >
        {children}
      </section>
    </div>
  );
}

/** The register's sign: the same outgoing and incoming invoice as on document rows. */
function TabIcon({ register }: { register: RegisterKind }) {
  const Icon = register === 'sales' ? FileOutput : FileInput;
  return <Icon size={16} strokeWidth={1.9} aria-hidden="true" className={tb.tabIcon} />;
}
