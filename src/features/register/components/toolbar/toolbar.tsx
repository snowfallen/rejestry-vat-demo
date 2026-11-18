'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ArrowDownToLine, ListFilter, LoaderCircle, Search, X } from 'lucide-react';
import { Button, ButtonGroup } from '@/components/ui/button';
import { phoneQuery, prefersReducedMotion, useMediaQuery } from '@/hooks/use-media-query';
import { cx } from '@/lib/cx';
import type { FacetSuggestion } from '../../model/query';
import { filtersCopy, toolbarCopy } from '../../copy';

/** Room the filter popover needs under its button before it would have to open upward. */
const filtersRoom = 440;

/**
 * Brings the trigger up under the sticky header when the popover would not fit below
 * it, then calls `open`: the panel opens under its button instead of over the period.
 */
function scrollForRoom(trigger: HTMLElement, open: () => void) {
  const header =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  const distance = () => trigger.getBoundingClientRect().top - header - 16;
  const roomy = () => innerHeight - trigger.getBoundingClientRect().bottom >= filtersRoom;
  const by = distance();
  if (roomy() || by <= 0) return open();
  if (prefersReducedMotion()) {
    scrollBy({ top: by, behavior: 'instant' });
    return open();
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    removeEventListener('scrollend', finish);
    // Something else on the page may have cut the smooth scroll short (the entrance, a
    // late layout shift): cover the rest at once, so the panel always opens below.
    if (!roomy() && distance() > 1) scrollBy({ top: distance(), behavior: 'instant' });
    open();
  };
  addEventListener('scrollend', finish);
  // Browsers without `scrollend`, or a page too short to move, still open.
  setTimeout(finish, 800);
  scrollBy({ top: by, behavior: 'smooth' });
}

interface ToolbarProps {
  search: string;
  onSearch: (value: string) => void;
  /** Documents the search leaves out of those the period and filters list. */
  found: { shown: number; of: number };
  activeFilters: number;
  filterTriggerRef: RefObject<HTMLButtonElement | null>;
  /** Renders the filter panel for the given open state. */
  filters: (open: boolean, close: () => void) => ReactNode;
  canExport: boolean;
  exporting: boolean;
  onExport: () => void;
  menu: ReactNode;
  /** KSeF views, in the row itself on wide screens (from 1100px). */
  views?: ReactNode;
  /** Filters the search text points at; choosing one applies it and clears the search. */
  suggestions?: FacetSuggestion[];
  onSuggestion?: (suggestion: FacetSuggestion) => void;
}

// The register's working row: search first, then filters, the main export action and
// the overflow menu with the rarer tools. "/" focuses the search from anywhere.
export function Toolbar({
  search,
  onSearch,
  found,
  activeFilters,
  filterTriggerRef,
  filters,
  canExport,
  exporting,
  onExport,
  menu,
  views,
  suggestions = [],
  onSuggestion,
}: ToolbarProps) {
  const phone = useMediaQuery(phoneQuery);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const suggesting = focused && suggestions.length > 0 && Boolean(onSuggestion);
  const current = Math.min(active, suggestions.length - 1);
  function choose(suggestion: FacetSuggestion) {
    onSuggestion?.(suggestion);
    setActive(0);
  }
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== '/' || target.closest('input, textarea, select, [contenteditable]')) return;
      if (document.querySelector('dialog[open]')) return;
      event.preventDefault();
      input.current?.focus();
    };
    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, []);

  return (
    <div
      data-toolbar=""
      className={cx(
        'flex items-center gap-2.5 px-[var(--inset)] pb-3 pt-3',
        'phone:sticky phone:top-[calc(var(--header-h)+var(--tabs-visible,0px))] phone:z-sticky',
        // An open menu inside must cover the register tabs that stick above this row.
        'phone:has-[details[open]]:z-popover',
        'phone:shadow-[0_1px_0_var(--line)] phone:gap-2 phone:bg-surface phone:pb-3 phone:pt-3',
      )}
    >
      <div
        className={cx(
          'group relative flex min-h-[42px] min-w-0 flex-1 items-center gap-2 rounded-[9px] border',
          'border-solid border-line-control bg-surface px-3 transition-colors',
          'wide:min-w-[240px]',
          'focus-within:border-accent focus-within:outline focus-within:outline-2',
          'focus-within:outline-offset-2 focus-within:outline-[var(--focus)]',
          'phone:min-h-[44px]',
        )}
      >
        <Search size={18} aria-hidden="true" className="text-muted" />
        <label className="sr-only" htmlFor="search">
          {toolbarCopy.search}
        </label>
        <input
          ref={input}
          id="search"
          type="search"
          placeholder={phone ? toolbarCopy.searchHintShort : toolbarCopy.searchHint}
          value={search}
          onChange={(event) => {
            onSearch(event.target.value);
            setActive(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-controls={suggesting ? 'search-suggestions' : undefined}
          aria-activedescendant={suggesting ? `suggestion-${current}` : undefined}
          onKeyDown={(event) => {
            if (!suggesting) return;
            const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
            if (step) {
              event.preventDefault();
              setActive((current + step + suggestions.length) % suggestions.length);
            } else if (event.key === 'Enter') {
              event.preventDefault();
              choose(suggestions[current]);
            }
          }}
          autoComplete="off"
          className={cx(
            'min-h-0 w-full !border-0 bg-transparent px-0 py-2 text-[13px] !outline-none',
            'phone:text-[16px] phone:placeholder:text-[13px]',
          )}
        />
        {search && (
          <span
            aria-hidden="true"
            className={cx(
              'shrink-0 whitespace-nowrap rounded-md bg-accent-soft px-1.5 py-0.5 text-[12px]',
              'font-semibold tabular-nums text-accent',
            )}
          >
            {toolbarCopy.found(found.shown, found.of)}
          </span>
        )}
        {search ? (
          <button
            type="button"
            onClick={() => {
              onSearch('');
              input.current?.focus();
            }}
            aria-label={toolbarCopy.clearSearch}
            className={cx(
              'grid size-7 shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-muted',
              'hover:bg-surface-subtle hover:text-ink',
            )}
          >
            <X size={15} />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className={cx(
              'hidden rounded-[5px] border border-solid border-line px-1.5 font-sans text-[11px]',
              'leading-[18px] text-muted',
              'desk:inline-block',
            )}
          >
            /
          </kbd>
        )}
        {suggesting && (
          <div
            id="search-suggestions"
            role="listbox"
            aria-label={toolbarCopy.suggestions}
            className={cx(
              'absolute left-0 top-[calc(100%+6px)] z-popover flex max-w-full flex-wrap gap-1.5',
              'rounded-[14px] bg-surface p-1.5 shadow-2',
            )}
          >
            {suggestions.map((suggestion, i) => (
              <div
                key={`${suggestion.key}-${suggestion.value}`}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={i === current}
                // Keep focus in the field while choosing with the mouse.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                className={cx(
                  'inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-full border',
                  'border-solid px-3 text-[12px] font-[550]',
                  i === current
                    ? 'border-accent-line bg-accent-soft text-accent'
                    : 'border-line bg-surface text-ink',
                )}
              >
                <span className="font-normal text-muted">{toolbarCopy.suggestPrefix}</span>
                {suggestion.facet} · {suggestion.label}
                <span className="tabular-nums text-muted">({suggestion.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {views && <div className="hidden shrink-0 wide:flex">{views}</div>}

      <ButtonGroup label={toolbarCopy.listActions}>
        <div className="relative">
          <Button
            ref={filterTriggerRef}
            className={cx(
              'phone:min-w-[44px] phone:px-3',
              (filtersOpen || activeFilters > 0) && 'border-accent-line bg-accent-soft text-accent',
              'hover:enabled:border-accent-line hover:enabled:bg-[var(--accent-soft-hover)]',
            )}
            onClick={(event) => {
              const trigger = event.currentTarget;
              trigger.focus();
              if (filtersOpen || phone) setFiltersOpen(!filtersOpen);
              else scrollForRoom(trigger, () => setFiltersOpen(true));
            }}
            aria-expanded={filtersOpen}
            aria-controls="advanced-filters"
          >
            <ListFilter size={17} />
            <span className="max-[400px]:sr-only">{filtersCopy.title}</span>
            {activeFilters > 0 && (
              <span className="grid size-[18px] place-items-center rounded-[5px] bg-accent text-[11px] text-on-accent">
                {activeFilters}
              </span>
            )}
          </Button>
          {filters(filtersOpen, closeFilters)}
        </div>

        <Button
          variant="secondary"
          className="phone:hidden"
          onClick={onExport}
          disabled={!canExport || exporting}
        >
          {exporting ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <ArrowDownToLine size={17} />
          )}
          {toolbarCopy.export}
        </Button>
        {menu}
      </ButtonGroup>
    </div>
  );
}
