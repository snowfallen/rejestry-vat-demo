'use client';
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, GripVertical } from 'lucide-react';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import { formatDate } from '@/lib/format';
import { afterOpening } from '@/lib/reveal';
import type { Notify } from '@/components/ui/toast';
import type { Totals } from '../../../model/amounts';
import { columnLabels } from '../../../model/labels';
import type { Sort } from '../../../model/query';
import type { ColumnKey, DocumentPatch, VatDocument } from '../../../model/types';
import { RowActions } from './row-actions';
import { DocumentCell } from '../document-cells';
import { MonthHeading } from '../document-cells/month-heading';
import t from './documents-table.module.css';
import { documentCopy } from '../../../copy';

/** Row actions and the expand chevron. */
const toggleWidth = 96;

interface DocumentsTableProps {
  documents: VatDocument[];
  columns: ColumnKey[];
  widths: Record<ColumnKey, number>;
  sort: Sort;
  expanded: string[];
  query: string;
  caption: string;
  monthTotals: Map<string, Totals & { count: number }> | null;
  collapsedMonths: string[];
  onToggleMonth: (month: string) => void;
  onSort: (key: ColumnKey) => void;
  onToggle: (id: string) => void;
  onResize: (key: ColumnKey, width: number) => void;
  onMoveColumn: (key: ColumnKey, to: number) => void;
  details: (doc: VatDocument, open: boolean) => ReactNode;
  onUpdate: (id: string, patch: DocumentPatch) => void;
  onNotify: Notify;
}

// Desktop and tablet register. Every column of the original stays; contractor and
// gross stay pinned while the middle scrolls on narrower screens. A whole row opens
// the document, the chevron is its keyboard handle.
export function DocumentsTable({
  documents,
  columns,
  widths,
  sort,
  expanded,
  query,
  caption,
  monthTotals,
  collapsedMonths,
  onToggleMonth,
  onSort,
  onToggle,
  onResize,
  onMoveColumn,
  details,
  onUpdate,
  onNotify,
}: DocumentsTableProps) {
  // While the table fits its width, nothing scrolls sideways and the column headings
  // can stay under the page header as the list scrolls.
  const scroller = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(false);
  const [space, setSpace] = useState(Infinity);
  useEffect(() => {
    const element = scroller.current;
    const table = element?.firstElementChild;
    if (!element || !table) return;
    // The pinned columns shade only the side where columns are hidden under them.
    const edges = () => {
      const hidden = element.scrollWidth - element.clientWidth;
      element.toggleAttribute('data-hidden-start', element.scrollLeft > 1);
      element.toggleAttribute('data-hidden-end', hidden - element.scrollLeft > 1);
    };
    const measure = () => {
      setSpace(element.clientWidth);
      setFits(table.getBoundingClientRect().width <= element.clientWidth + 1);
      edges();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(table);
    element.addEventListener('scroll', edges, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', edges);
    };
  }, []);
  const dragged = useRef<ColumnKey | null>(null);
  // Narrow tables fold the identifier, then the date, into second lines instead of
  // scrolling sideways.
  const folded = new Set<ColumnKey>(
    (['identifier', 'date'] as const).filter(
      (key, i) => columns.includes(key) && space < (i === 0 ? 1000 : 880),
    ),
  );
  const shown = columns.filter((key) => !folded.has(key));

  function startResize(event: PointerEvent<HTMLButtonElement>, key: ColumnKey) {
    event.preventDefault();
    const handle = event.currentTarget;
    const startX = event.clientX;
    const initial = widths[key];
    handle.setPointerCapture(event.pointerId);
    const move = (next: globalThis.PointerEvent) => onResize(key, initial + next.clientX - startX);
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  // An opened document is brought into view as it opens: no scrolling after a click.
  function toggle(id: string) {
    const opening = !expanded.includes(id);
    onToggle(id);
    if (!opening) return;
    // While the table fits, its headings stick under the page header: keep the row below them.
    const head = fits ? (scroller.current?.querySelector('thead')?.offsetHeight ?? 0) : 0;
    afterOpening(
      () => [
        scroller.current?.querySelector<HTMLElement>(`tr[data-doc-id="${id}"]`) ?? null,
        document.getElementById(`details-${id}-table`),
      ],
      head,
    );
  }

  // Escape closes the opened document the keyboard is in and hands focus to its chevron.
  function onBodyKeyDown(event: KeyboardEvent<HTMLTableSectionElement>) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    const at = (event.target as HTMLElement).closest('tr');
    const row = at?.dataset.docId ? at : at?.previousElementSibling;
    const id = row instanceof HTMLElement ? row.dataset.docId : undefined;
    if (!id || !expanded.includes(id)) return;
    event.preventDefault();
    onToggle(id);
    row?.querySelector<HTMLElement>('button[aria-controls]')?.focus();
  }

  function onRowClick(event: MouseEvent<HTMLTableRowElement>, id: string) {
    const target = event.target as HTMLElement;
    if (target.closest('button, summary, [role="menu"], a, input, select, textarea, label')) return;
    if (window.getSelection()?.toString()) return;
    toggle(id);
  }

  return (
    <div ref={scroller} className={cx(t.scroller, fits && t.fits)}>
      <table
        className={t.table}
        style={{ minWidth: shown.reduce((sum, key) => sum + widths[key], toggleWidth) }}
      >
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          {shown.map((key) => (
            <col key={key} style={{ width: widths[key] }} />
          ))}
          <col style={{ width: toggleWidth }} />
        </colgroup>
        <thead>
          <tr style={{ viewTransitionName: 'register-head' }}>
            {shown.map((key) => (
              <th
                key={key}
                scope="col"
                data-col={key}
                aria-sort={
                  sort.key === key
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                draggable
                onDragStart={() => {
                  dragged.current = key;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragged.current && dragged.current !== key)
                    onMoveColumn(dragged.current, columns.indexOf(key));
                  dragged.current = null;
                }}
              >
                <button type="button" className={t.sort} onClick={() => onSort(key)}>
                  {columnLabels[key]}
                  {sort.key !== key ? (
                    <ArrowUpDown size={12} />
                  ) : sort.direction === 'asc' ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                </button>
                <button
                  type="button"
                  className={t.resize}
                  onPointerDown={(event) => startResize(event, key)}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                    event.preventDefault();
                    onResize(key, widths[key] + (event.key === 'ArrowRight' ? 16 : -16));
                  }}
                  aria-label={documentCopy.resizeColumn(columnLabels[key])}
                  title={documentCopy.resizeHint}
                >
                  <GripVertical size={12} />
                </button>
              </th>
            ))}
            <th scope="col">
              <span className="sr-only">{documentCopy.details}</span>
            </th>
          </tr>
        </thead>
        <tbody onKeyDown={onBodyKeyDown}>
          {documents.map((doc, index) => {
            const open = expanded.includes(doc.id);
            const month = doc.date.slice(0, 7);
            const previousMonth = documents[index - 1]?.date.slice(0, 7);
            const heading = monthTotals && month !== previousMonth ? monthTotals.get(month) : null;
            const monthFolded = monthTotals !== null && collapsedMonths.includes(month);
            return (
              <Fragment key={doc.id}>
                {heading && (
                  <tr className={t.group} style={{ viewTransitionName: `month-${month}` }}>
                    <th scope="rowgroup" colSpan={shown.length + 1}>
                      <MonthHeading
                        month={month}
                        totals={heading}
                        open={!monthFolded}
                        onToggle={() => onToggleMonth(month)}
                      />
                    </th>
                  </tr>
                )}
                {!monthFolded && (
                  <>
                    <tr
                      className={cx(t.row, open && t.open)}
                      data-doc-id={doc.id}
                      data-intro-row={index < 8 ? '' : undefined}
                      data-pending={doc.ksef ? undefined : ''}
                      style={cssVars({ '--row': index })}
                      onClick={(event) => onRowClick(event, doc.id)}
                    >
                      {shown.map((key) => (
                        <td key={key} data-col={key}>
                          <DocumentCell doc={doc} column={key} query={query} />
                          {key === 'number' && folded.has('identifier') && (
                            <span className={t.inlineIdentifier}>{doc.identifier}</span>
                          )}
                          {key === 'contractor' && folded.has('date') && (
                            <time className={t.inlineDate} dateTime={doc.date}>
                              {formatDate(doc.date)}
                            </time>
                          )}
                        </td>
                      ))}
                      <td>
                        <span className={t.end}>
                          <RowActions doc={doc} onUpdate={onUpdate} onNotify={onNotify} />
                          <button
                            type="button"
                            className={t.toggle}
                            onClick={() => toggle(doc.id)}
                            aria-label={documentCopy.toggle(open, doc.number)}
                            aria-expanded={open}
                            aria-controls={`details-${doc.id}-table`}
                          >
                            <ChevronDown size={17} />
                          </button>
                        </span>
                      </td>
                    </tr>
                    <tr className={cx(t.detailRow, open && t.detailOpen)}>
                      <td colSpan={shown.length + 1}>{details(doc, open)}</td>
                    </tr>
                  </>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
