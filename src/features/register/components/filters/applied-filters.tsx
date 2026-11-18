import { X } from 'lucide-react';
import { cx } from '@/lib/cx';
import type { Criteria, Facet, FacetKey } from '../../model/query';
import { filtersCopy } from '../../copy';

/** Applied criteria as named chips; each removes only its own criterion. */
export function AppliedFilters({
  facets,
  criteria,
  onRemove,
  onClear,
}: {
  facets: Facet[];
  criteria: Criteria;
  onRemove: (key: FacetKey) => void;
  onClear: () => void;
}) {
  const applied = facets.flatMap((facet) => {
    const option = facet.options.find((item) => item.value === criteria[facet.key]);
    return option ? [{ facet, option }] : [];
  });
  if (!applied.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {applied.map(({ facet, option }) => (
        <button
          key={facet.key}
          type="button"
          style={{ viewTransitionName: `applied-${facet.key}` }}
          onClick={() => onRemove(facet.key)}
          aria-label={filtersCopy.remove(option.label)}
          className={cx(
            'inline-flex min-h-8 items-center gap-1 rounded-full border border-solid border-accent-line',
            'bg-accent-soft py-1 pl-3 pr-2 text-[12px] font-[550] text-accent transition-colors',
            'hover:bg-[var(--accent-soft-hover)]',
            'phone:min-h-9',
          )}
        >
          <span className="font-normal text-muted">{facet.short}:</span>
          {option.label}
          <X size={13} className="ml-0.5" />
        </button>
      ))}
      {applied.length >= 2 && (
        <button
          type="button"
          style={{ viewTransitionName: 'applied-clear' }}
          onClick={onClear}
          className="border-0 bg-transparent px-1 py-1 text-[12px] text-muted hover:text-ink hover:underline"
        >
          {filtersCopy.clearAll}
        </button>
      )}
    </div>
  );
}
