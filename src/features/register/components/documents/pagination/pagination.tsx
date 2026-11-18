import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { cx } from '@/lib/cx';
import { PageSize } from './page-size';
import { ofDocuments, pagingCopy } from '../../../copy';

/** Page numbers to show: first, last and the neighbours of the current page, with gaps. */
export function pageWindow(current: number, count: number): (number | 'gap')[] {
  const pages = new Set([1, count, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= count - 2) [count - 1, count - 2, count - 3].forEach((page) => pages.add(page));
  const sorted = [...pages].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b);
  return sorted.flatMap((page, i) =>
    i > 0 && page - sorted[i - 1] > 1 ? (['gap', page] as const) : [page],
  );
}

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  /** Document numbers on this page; a folded month counts all of its documents. */
  range: { first: number; last: number };
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  range: { first, last },
  total,
  onPage,
  onPageSize,
  className,
}: PaginationProps) {
  return (
    <footer
      className={cx(
        'flex flex-wrap items-center justify-between gap-3 border-0 border-t border-solid',
        'border-line px-[var(--inset)] py-4 text-[13px] text-muted',
        className,
      )}
    >
      <span>
        <strong className="font-[550] text-ink tabular-nums">
          {first}–{last}
        </strong>{' '}
        {ofDocuments(total)}
      </span>
      <div className="flex items-center gap-4 phone:w-full phone:justify-between phone:gap-2">
        <PageSize value={pageSize} onChange={onPageSize} />
        <nav aria-label={pagingCopy.pages} className="flex items-center gap-1">
          <IconButton
            label={pagingCopy.previous}
            variant="plain"
            size="sm"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft size={17} />
          </IconButton>
          <span className="sr-only">{pagingCopy.pageOf(page, pageCount)}</span>
          <span
            className="hidden min-w-[56px] text-center tabular-nums text-ink max-[480px]:inline"
            aria-hidden="true"
          >
            {page} / {pageCount}
          </span>
          {pageWindow(page, pageCount).map((item, i) =>
            item === 'gap' ? (
              <span
                key={`gap-${i}`}
                className="px-1 text-faint max-[480px]:hidden"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={pagingCopy.page(item)}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPage(item)}
                className={cx(
                  'h-8 min-w-8 rounded-lg border-0 px-2 text-[13px] font-[550] tabular-nums transition-colors',
                  'max-[480px]:hidden',
                  item === page
                    ? 'bg-accent text-on-accent'
                    : 'bg-transparent text-muted hover:bg-surface-subtle hover:text-ink',
                )}
              >
                {item}
              </button>
            ),
          )}
          <IconButton
            label={pagingCopy.next}
            variant="plain"
            size="sm"
            disabled={page === pageCount}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight size={17} />
          </IconButton>
        </nav>
      </div>
    </footer>
  );
}
