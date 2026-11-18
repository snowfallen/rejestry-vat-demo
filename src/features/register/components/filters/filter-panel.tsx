'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { ArrowDown, ArrowUp, Check, Settings2, X } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { useAnchoredPlacement } from '@/hooks/use-anchored-placement';
import { phoneQuery, useMediaQuery } from '@/hooks/use-media-query';
import { cx } from '@/lib/cx';
import type { Period } from '../../model/period';
import { columnKeys, columnLabels } from '../../model/labels';
import { facetCount, type Criteria, type Facet, type FacetKey, type Sort } from '../../model/query';
import type { ColumnKey, RegisterKind, VatDocument } from '../../model/types';
import f from './filter-panel.module.css';
import c from './filter-chips.module.css';
import { filtersCopy } from '../../copy';

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  documents: VatDocument[];
  kind: RegisterKind;
  period: Period;
  criteria: Criteria;
  facets: Facet[];
  resultCount: number;
  onChange: (key: FacetKey, value: string) => void;
  sort: Sort;
  onSort: (key: ColumnKey) => void;
  onReset: () => void;
  onManageSeries: () => void;
}

export function FilterPanel(props: FilterPanelProps) {
  const phone = useMediaQuery(phoneQuery);
  const { open, onClose } = props;
  // The panel switches between popover and sheet with the layout; close it instead of
  // carrying an anchored popover into a phone-width viewport.
  const wasPhone = useRef(phone);
  useEffect(() => {
    if (wasPhone.current !== phone && open) onClose();
    wasPhone.current = phone;
  }, [phone, open, onClose]);

  if (phone)
    return open ? (
      <Dialog
        title={filtersCopy.title}
        variant="sheet"
        onClose={onClose}
        returnFocusRef={props.triggerRef}
      >
        <FilterBody {...props} idPrefix="sheet" onDone={onClose} sortable />
      </Dialog>
    ) : null;
  return <FilterPopover {...props} />;
}

function FilterPopover(props: FilterPanelProps) {
  const { open, onClose, triggerRef } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  // Inside the viewport at any scroll: opens upward when there is no room below; the
  // criteria scroll inside, the actions stay visible.
  const place = useAnchoredPlacement(triggerRef, open, { width: 600 });

  useEffect(() => {
    if (open) {
      const popover = ref.current;
      (
        popover?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
        popover?.querySelector<HTMLElement>('[aria-pressed]:not(:disabled)')
      )?.focus();
      return;
    }
    const timer = setTimeout(() => setPresent(false), 140);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!ref.current?.contains(target) && !triggerRef.current?.contains(target)) onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, onClose, triggerRef]);

  if (!present) return null;
  return (
    <div
      ref={ref}
      id="advanced-filters"
      role="dialog"
      aria-labelledby="filters-title"
      className={cx(f.popover, !open && f.popoverLeaving)}
      style={{ ...place, viewTransitionName: 'filter-popover' }}
      inert={!open}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && !ref.current?.contains(next) && !triggerRef.current?.contains(next)) onClose();
      }}
    >
      <header className={f.popoverHeader}>
        <h2 id="filters-title">{filtersCopy.title}</h2>
        <button
          className={f.close}
          onClick={() => {
            onClose();
            triggerRef.current?.focus();
          }}
          aria-label={filtersCopy.close}
        >
          <X size={17} />
        </button>
      </header>
      <FilterBody
        {...props}
        idPrefix="popover"
        onDone={() => {
          onClose();
          triggerRef.current?.focus();
        }}
      />
    </div>
  );
}

function FilterBody({
  documents,
  kind,
  period,
  criteria,
  facets,
  resultCount,
  onChange,
  sort,
  onSort,
  onReset,
  onManageSeries,
  idPrefix,
  onDone,
  sortable = false,
}: FilterPanelProps & { idPrefix: string; onDone: () => void; sortable?: boolean }) {
  const active = facets.some((facet) => criteria[facet.key]);
  return (
    <>
      <div className={f.groups}>
        {facets.map((facet) => (
          <div
            key={facet.key}
            className={f.group}
            role="group"
            aria-labelledby={`${idPrefix}-${facet.key}-label`}
          >
            <div className={f.groupHeading}>
              <span id={`${idPrefix}-${facet.key}-label`} className={f.groupLabel}>
                {facet.label}
                {!criteria[facet.key] && <span className={f.groupState}>{filtersCopy.any}</span>}
              </span>
              {facet.key === 'series' && (
                <button className={f.groupAction} onClick={onManageSeries}>
                  <Settings2 size={13} />
                  {filtersCopy.manageSeries}
                </button>
              )}
              {/* Why the purchase register offers only «Bez oznaczenia». */}
              {facet.key === 'jpk' && kind === 'purchases' && (
                <span className={f.groupNote}>{filtersCopy.gtuSalesOnly}</span>
              )}
            </div>
            <div className={c.chips}>
              {facet.options.map((option) => {
                const pressed = criteria[facet.key] === option.value;
                const count = facetCount(
                  documents,
                  kind,
                  period,
                  criteria,
                  facet.key,
                  option.value,
                );
                return (
                  <button
                    key={option.value}
                    className={cx(c.chip, pressed && c.chipOn)}
                    aria-pressed={pressed}
                    disabled={!count && !pressed}
                    title={pressed ? filtersCopy.pressAgain : option.hint}
                    onClick={() => onChange(facet.key, pressed ? '' : option.value)}
                  >
                    <Check size={14} className={c.check} aria-hidden="true" />
                    <span className={c.chipLabel}>
                      {option.label}
                      {option.hint && <span className={c.hint}>{option.hint}</span>}
                    </span>
                    <span className={c.count}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {/* Phones list cards without a header to click, so sorting lives here. */}
        {sortable && <SortGroup sort={sort} onSort={onSort} />}
      </div>
      <footer className={f.footer}>
        <button className={f.reset} onClick={onReset} disabled={!active}>
          {filtersCopy.clear}
        </button>
        <button className={f.show} onClick={onDone}>
          {filtersCopy.show(resultCount)}
        </button>
      </footer>
    </>
  );
}

function SortGroup({ sort, onSort }: { sort: Sort; onSort: (key: ColumnKey) => void }) {
  const direction = sort.direction === 'asc' ? filtersCopy.ascending : filtersCopy.descending;
  const Arrow = sort.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <div className={f.group} role="group" aria-labelledby="sheet-sort-label">
      <div className={f.groupHeading}>
        <span id="sheet-sort-label" className={f.groupLabel}>
          {filtersCopy.sortBy}
          <span className={f.groupState}>{direction}</span>
        </span>
      </div>
      <div className={c.chips}>
        {columnKeys.map((key) => {
          const on = sort.key === key;
          return (
            <button
              key={key}
              className={cx(c.chip, f.sortChip, on && c.chipOn)}
              aria-pressed={on}
              onClick={() => onSort(key)}
            >
              {columnLabels[key]}
              {on && (
                <>
                  <Arrow size={14} aria-hidden="true" />
                  <span className="sr-only">{direction}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
