import type { ReactNode } from 'react';
import { CalendarDays, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cx } from '@/lib/cx';
import { AxisArt } from './axis-art';
import a from './register-states.module.css';
import { stateCopy } from '../../../copy';

/** Placeholder rows shaped like a document row while the register loads. */
export function LoadingRows() {
  return (
    <div
      role="status"
      aria-label={stateCopy.loadingDocuments}
      className="border-0 border-t border-solid border-line px-[var(--inset)]"
    >
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="flex h-[52px] items-center gap-3 border-0 border-b border-solid border-line last:border-b-0"
        >
          <span className={cx(a.skeleton, 'size-9 shrink-0 rounded-full')} />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={cx(a.skeleton, 'h-2.5 w-[60%] rounded')} />
            <span className={cx(a.skeleton, 'h-2.5 w-[40%] rounded')} />
          </span>
          <span className={cx(a.skeleton, 'h-3 w-20 shrink-0 rounded')} />
        </div>
      ))}
    </div>
  );
}

function StatePanel({
  variant,
  title,
  text,
  role,
  children,
}: {
  variant: 'empty' | 'search' | 'error';
  title: string;
  text: ReactNode;
  role?: 'alert';
  children: ReactNode;
}) {
  return (
    <div
      id="register-state"
      data-register-state=""
      role={role}
      className={cx(
        'flex min-h-[340px] animate-[stateIn_220ms_ease-out] motion-reduce:animate-none flex-col items-center border-0',
        'border-t border-solid border-line px-[var(--inset)] py-14 text-center',
        'phone:min-h-[300px] phone:py-10',
      )}
    >
      <AxisArt variant={variant} />
      <h3 className="m-0 mb-2.5 text-[18px] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="m-0 mb-6 max-w-[44ch] text-[13px] text-muted">{text}</p>
      <div className="flex flex-wrap justify-center gap-2.5">{children}</div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <StatePanel
      variant="error"
      role="alert"
      title={stateCopy.failed}
      text={
        <>
          {stateCopy.failedText}
          <br />
          {stateCopy.failedKept}
        </>
      }
    >
      <Button variant="primary" onClick={onRetry}>
        <RefreshCw size={16} />
        {stateCopy.retry}
      </Button>
    </StatePanel>
  );
}

export function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <StatePanel variant="search" title={stateCopy.noResults} text={stateCopy.noResultsText}>
      <Button onClick={onClear}>
        <X size={16} />
        {stateCopy.clearAll}
      </Button>
    </StatePanel>
  );
}

/** An empty period, with a way to the nearest period that has documents. */
export function EmptyPeriod({
  title,
  text,
  nearest,
  onNearest,
  onExample,
}: {
  title: string;
  text: string;
  /** The way to a nearby month with documents (`stateCopy.nearest`), if any. */
  nearest: string | null;
  onNearest: () => void;
  onExample: () => void;
}) {
  return (
    <StatePanel variant="empty" title={title} text={text}>
      {nearest ? (
        <Button variant="primary" onClick={onNearest}>
          <CalendarDays size={16} />
          {nearest}
        </Button>
      ) : (
        <Button onClick={onExample}>
          <CalendarDays size={16} />
          {stateCopy.example}
        </Button>
      )}
    </StatePanel>
  );
}
