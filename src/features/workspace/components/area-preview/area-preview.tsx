import { ArrowLeft, CalendarRange, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cx } from '@/lib/cx';
import { areaTabIcons } from '../../model/area-icons';
import { accountingYear, areaStatusLabels, areaTabs, areas, type AreaTab } from '../../model/areas';
import { areasCopy } from '../../copy';

interface AreaPreviewProps {
  tab: Exclude<AreaTab, 'vat'>;
  onOpenMap: () => void;
  onBack: () => void;
}

/**
 * An area outside the demo, said honestly: what it holds and what it needs before it
 * can open. The register keeps its state behind it.
 */
export function AreaPreview({ tab, onOpenMap, onBack }: AreaPreviewProps) {
  const Icon = areaTabIcons[tab];
  const label = areaTabs.find((item) => item.id === tab)!.label;
  const parts = areas.filter((area) => area.tab === tab);
  return (
    <section
      aria-labelledby="area-title"
      className={cx(
        'mx-auto my-6 max-w-[560px] rounded-2xl border border-solid border-line bg-surface p-6',
        'phone:my-2 phone:p-5',
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-2xl bg-track text-muted"
      >
        <Icon size={26} />
      </span>
      <h1 id="area-title" className="m-0 mt-4 text-[26px] font-[650] tracking-[-0.03em]">
        {label}
      </h1>
      <p className="m-0 mt-1 inline-flex items-center gap-1.5 text-[13px] font-[550] text-warning">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--pending)]" />
        {areaStatusLabels.setup}
      </p>
      {parts.length === 1 ? (
        <p className="m-0 mt-4 text-[14px] leading-relaxed text-muted">{parts[0].summary}</p>
      ) : (
        <ul className="m-0 mt-4 list-none p-0">
          {parts.map((area) => (
            <li
              key={area.id}
              className="border-0 border-t border-solid border-line py-3 first:border-t-0"
            >
              <strong className="block text-[14px] font-[600]">{area.name}</strong>
              <span className="text-[13px] leading-relaxed text-muted">{area.summary}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 rounded-xl bg-surface-subtle p-4">
        <h2 className="m-0 text-[13px] font-semibold">{areasCopy.preview.needed}</h2>
        <p className="m-0 mt-2 flex items-center gap-2 text-[13px] text-ink">
          <CalendarRange size={16} aria-hidden="true" className="text-accent" />
          {areasCopy.preview.confirmYear(accountingYear.year)}
        </p>
        <Button size="sm" className="mt-3" onClick={onOpenMap}>
          <LayoutGrid size={15} />
          {areasCopy.preview.openMap}
        </Button>
      </div>
      <Button variant="text" size="none" className="mt-5" onClick={onBack}>
        <ArrowLeft size={15} />
        {areasCopy.preview.back}
      </Button>
    </section>
  );
}
