import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/cx';
import { Button } from '@/components/ui/button';
import { PageSize } from './page-size';
import { ofDocuments, pagingCopy } from '../../../copy';

interface ShowMoreProps {
  shown: number;
  total: number;
  /** Documents (or folded months) one press adds. */
  next: number;
  pageSize: number;
  onMore: () => void;
  onPageSize: (size: number) => void;
  className?: string;
}

/**
 * Phones grow the list instead of paging, the way native lists do: the next documents
 * join the end of the list. The page size stays, as the step of one press.
 */
export function ShowMore({
  shown,
  total,
  next,
  pageSize,
  onMore,
  onPageSize,
  className,
}: ShowMoreProps) {
  return (
    <footer
      className={cx(
        'grid gap-3 border-0 border-t border-solid border-line px-[var(--inset)] py-3.5 text-[13px]',
        'text-muted',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span>
          <strong className="font-[550] text-ink tabular-nums">{shown}</strong> {ofDocuments(total)}
        </span>
        <PageSize value={pageSize} onChange={onPageSize} format={(n) => `${n} naraz`} />
      </div>
      {next > 0 && (
        <Button className="w-full" onClick={onMore}>
          <ChevronDown size={17} />
          {pagingCopy.more(next)}
        </Button>
      )}
    </footer>
  );
}
