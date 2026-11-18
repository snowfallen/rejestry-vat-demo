'use client';
import { cx } from '@/lib/cx';
import { areaTabIcons } from '../../model/area-icons';
import { areaTabs, type AreaTab } from '../../model/areas';
import { headerCopy } from '../../copy';

interface AreaNavProps {
  /** `header`: inside the app bar on wide screens; `page`: its own line above the title. */
  placement: 'header' | 'page';
  current: AreaTab;
  onSelect: (tab: AreaTab) => void;
}

/**
 * The accounting areas as tabs, with this register selected. From 1100px they sit in
 * the app bar, which frees a whole line above the title; between phone and 1100px they
 * keep their own line. The reference spends a whole page on this map; the full map
 * opens on demand.
 */
export function AreaNav({ placement, current: open, onSelect }: AreaNavProps) {
  const header = placement === 'header';
  return (
    <nav
      aria-label={headerCopy.areas}
      className={cx(header ? 'hidden shrink-0 wide:block' : 'mb-3 phone:hidden wide:hidden')}
    >
      <ul
        className={cx(
          'm-0 flex w-max list-none items-center gap-1 rounded-full p-1',
          !header && 'border border-solid border-line bg-surface',
        )}
      >
        {areaTabs.map(({ id, label }) => {
          const Icon = areaTabIcons[id];
          const current = id === open;
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={current ? 'page' : undefined}
                onClick={() => !current && onSelect(id)}
                className={cx(
                  'inline-flex min-h-[34px] items-center gap-2 whitespace-nowrap rounded-full border-0 px-3.5',
                  'text-[13px] font-[550] transition-colors duration-200',
                  'max-[900px]:px-3',
                  current
                    ? 'cursor-default bg-accent-soft text-accent shadow-[inset_0_0_0_1px_var(--accent-line)]'
                    : 'bg-transparent text-muted hover:bg-track hover:text-ink',
                )}
              >
                <Icon
                  size={15}
                  className={cx(
                    current ? 'text-accent' : 'text-faint',
                    header ? 'max-[1279px]:hidden' : 'max-[900px]:hidden',
                  )}
                />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
