'use client';
import { useState, type ComponentType } from 'react';
import {
  Archive,
  ArrowRight,
  Banknote,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  FileText,
  Landmark,
  ListChecks,
  ReceiptText,
} from 'lucide-react';
import { Collapsible } from '@/components/ui/collapsible';
import { cx } from '@/lib/cx';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  accountingYear,
  areaStatusLabels,
  areas,
  scopeNotice,
  type AreaTab,
} from '../../model/areas';
import { areasCopy } from '../../copy';

const areaIcons: Record<string, ComponentType<{ size?: number }>> = {
  vat: ReceiptText,
  kpir: Landmark,
  revenue: Banknote,
  ledger: FileText,
  assets: Archive,
  controls: ListChecks,
};

/**
 * The map of accounting areas: the accounting year, then each area with its readiness.
 * Opened from the area tabs; a tab opens with its own areas unfolded.
 */
export function AreasDialog({ focus, onClose }: { focus?: AreaTab; onClose: () => void }) {
  const [open, setOpen] = useState<string[]>(() =>
    areas.filter((area) => area.tab === focus).map((area) => area.id),
  );
  const groups = [
    { title: areasCopy.ready, areas: areas.filter((area) => area.status === 'ready') },
    { title: areasCopy.needsSetup, areas: areas.filter((area) => area.status !== 'ready') },
  ];
  const toggle = (id: string) =>
    setOpen((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  return (
    <Dialog
      title={areasCopy.title}
      description={
        <>
          <span className="font-semibold text-accent">{areasCopy.kicker}</span> ·{' '}
          {areasCopy.description}
        </>
      }
      onClose={onClose}
    >
      <p
        className={cx(
          'm-0 mb-4 flex items-start gap-2 rounded-lg border border-solid border-warning-line',
          'bg-warning-bg px-3 py-2.5 text-[13px] leading-snug text-warning',
        )}
      >
        <CircleAlert size={15} className="mt-px" />
        {scopeNotice}
      </p>

      <section
        aria-labelledby="year-heading"
        className={cx(
          'relative mb-5 overflow-hidden rounded-[18px]',
          'bg-[image:var(--hero-bg)]',
          'p-4 text-[var(--hero-ink)] shadow-[var(--shadow-hero)]',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="year-heading"
              className="m-0 flex items-center gap-2 text-[13px] font-semibold text-[var(--hero-muted)]"
            >
              <CalendarDays size={16} aria-hidden="true" />
              {areasCopy.accountingPeriod}
            </h3>
            <p className="m-0 mt-0.5 text-[34px] font-[650] leading-none tracking-[-0.04em] tabular-nums">
              {accountingYear.year}
            </p>
          </div>
          <span
            className={cx(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1',
              'text-[12px] font-semibold',
            )}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--pending)]" />
            {accountingYear.status}
          </span>
        </div>
        <p className="m-0 mt-3 text-[13px] leading-relaxed text-[var(--hero-muted)]">
          {accountingYear.description}
        </p>
      </section>

      <section aria-labelledby="areas-heading">
        <h3 id="areas-heading" className="m-0 text-[15px] font-semibold">
          {areasCopy.availability}
        </h3>
        <p className="m-0 mb-2.5 mt-1 text-[13px] leading-relaxed text-muted">
          {areasCopy.availabilityNote}
        </p>
        {groups.map((group) => (
          <div key={group.title} className="mt-3 first:mt-0">
            <h4 className="m-0 mb-1 px-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-muted">
              {group.title} · {group.areas.length}
            </h4>
            <ul className="m-0 list-none p-0">
              {group.areas.map((area) => {
                const Icon = areaIcons[area.id];
                const expanded = open.includes(area.id);
                const ready = area.status === 'ready';
                return (
                  <li
                    key={area.id}
                    className="border-0 border-b border-solid border-line last:border-b-0"
                  >
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`area-${area.id}`}
                      onClick={() => toggle(area.id)}
                      className={cx(
                        'flex min-h-[60px] w-full items-center gap-3 rounded-xl border-0 bg-transparent px-2 py-2',
                        'text-left text-[14px] font-[550] text-ink',
                        'hover:bg-surface-subtle',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          'grid size-9 shrink-0 place-items-center rounded-[11px]',
                          ready ? 'bg-accent-soft text-accent' : 'bg-track text-muted',
                        )}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        {ready ? (
                          <>
                            {area.name}
                            <span className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent">
                              <span
                                aria-hidden="true"
                                className="size-1.5 rounded-full bg-accent"
                              />
                              {areaStatusLabels[area.status]}
                            </span>
                          </>
                        ) : (
                          // Their group already says it; each row keeps only the amber dot.
                          <span className="inline-flex items-center gap-2">
                            {area.name}
                            <span
                              aria-hidden="true"
                              className="size-1.5 rounded-full bg-[var(--pending)]"
                            />
                            <span className="sr-only">{areaStatusLabels[area.status]}</span>
                          </span>
                        )}
                      </span>
                      <ChevronDown
                        size={16}
                        className={cx(
                          'text-muted transition-transform duration-300',
                          expanded && 'rotate-180',
                        )}
                      />
                    </button>
                    <Collapsible id={`area-${area.id}`} open={expanded}>
                      <div className="pb-3.5 pl-[56px] pr-2 text-[13px] leading-relaxed text-muted">
                        <p className="m-0">{area.summary}</p>
                        {ready && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="mt-2.5"
                            onClick={onClose}
                          >
                            {areasCopy.backToRegister}
                            <ArrowRight size={15} />
                          </Button>
                        )}
                      </div>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </Dialog>
  );
}
