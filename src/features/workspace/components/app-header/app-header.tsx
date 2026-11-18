'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronDown, CircleHelp, ReceiptText } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { cx } from '@/lib/cx';
import { Avatar } from '@/components/ui/avatar';
import { prefersReducedMotion } from '@/hooks/use-media-query';
import { NotificationsMenu, type Notice, type NoticeAction } from './notifications-menu';
import { ThemeToggle } from './theme-toggle';
import { demoUser } from '../../model/organization';
import { headerCopy } from '../../copy';

interface AppHeaderProps {
  notices: Notice[];
  /** Page title and period, shown once the large title has scrolled away; `extra` only on wide screens. */
  compact: { title: string; detail: string; extra?: string } | null;
  /** Accounting areas, shown in the bar on wide screens. */
  areas?: ReactNode;
  onNotice: (action: NoticeAction) => void;
  onProfile: () => void;
  /** Opens the guided tour; desktop only (phones start it from the account sheet). */
  onHelp?: () => void;
}

/** Product bar: brand, greeting or page title, areas, notifications and account. */
export function AppHeader({
  notices,
  compact,
  areas,
  onNotice,
  onProfile,
  onHelp,
}: AppHeaderProps) {
  const shown = Boolean(compact);
  return (
    <header
      className={cx(
        'sticky top-0 z-header h-[var(--header-h)] border-0 border-b border-solid border-line',
        'bg-surface',
        'print:hidden',
      )}
    >
      <div className="mx-auto flex h-full max-w-[1376px] items-center gap-6 px-[var(--gutter)] phone:gap-1.5">
        <Link
          href="/"
          // The logo leads to this very page: nothing to prefetch.
          prefetch={false}
          aria-label={headerCopy.home}
          className="flex shrink-0 items-center no-underline"
        >
          <span
            aria-hidden="true"
            className={cx(
              'grid h-[34px] w-8 place-items-center rounded-[9px] bg-accent text-on-accent',
              'phone:h-8 phone:w-[29px] phone:rounded-lg',
            )}
          >
            <ReceiptText size={20} />
          </span>
        </Link>
        <span className="h-6 w-px bg-line phone:hidden" />
        {/* The greeting and the compact page title share one place; once the page title
            scrolls away, it slides in and the greeting slides out. On phones the pair
            sits beside the logo, where the reference has its greeting. */}
        <div
          className={cx(
            'relative grid h-11 min-w-0 flex-1 items-center overflow-hidden',
            'phone:absolute phone:left-[calc(var(--gutter)+40px)] phone:right-[108px] phone:top-0',
            'phone:h-14 phone:flex-none',
          )}
        >
          <p
            aria-hidden={shown}
            className={cx(
              // Quieter than the page title it shares the screen with; phones keep the name strong.
              'col-start-1 row-start-1 m-0 truncate text-[18px] font-[550] tracking-[-0.02em] text-ink-soft',
              'phone:font-[620] phone:text-ink',
              'transition-transform duration-300 ease-out',
              'phone:text-[15px] phone:leading-tight',
              shown && '-translate-y-11',
            )}
          >
            {/* Phones split it the way apps greet: a small "Witaj," above the name. */}
            <span className="phone:block phone:text-[12px] phone:font-medium phone:tracking-normal phone:text-muted">
              {headerCopy.greeting}
            </span>{' '}
            {demoUser}!
          </p>
          {/* Like a tap on an iPhone's status bar: the compact title takes the page back up. */}
          <button
            type="button"
            aria-hidden={!shown}
            tabIndex={shown ? 0 : -1}
            title={headerCopy.backToTop}
            onClick={() =>
              scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
            }
            className={cx(
              'col-start-1 row-start-1 m-0 min-w-0 border-0 bg-transparent p-0 text-left font-[inherit]',
              'transition-[transform,visibility] duration-300 ease-out',
              shown ? 'visible' : 'invisible translate-y-11',
            )}
          >
            <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.015em] text-ink">
              {compact?.title}
            </span>
            <span className="block truncate text-[12px] leading-tight text-muted">
              {compact?.detail}
              {compact?.extra && <span className="hidden wide:inline"> · {compact.extra}</span>}
            </span>
          </button>
        </div>
        <span className="flex-1 desk:hidden" />
        {areas}
        {onHelp && (
          <IconButton
            label={headerCopy.help}
            variant="plain"
            className="phone:hidden"
            onClick={onHelp}
          >
            <CircleHelp size={19} />
          </IconButton>
        )}
        <ThemeToggle />
        <NotificationsMenu notices={notices} onAction={onNotice} />
        <button
          type="button"
          aria-label={headerCopy.accountOf(demoUser)}
          className={cx(
            'flex items-center gap-3 rounded-lg border-0 bg-transparent p-1.5',
            'hover:bg-surface-subtle',
            'phone:gap-1.5',
          )}
          onClick={(event) => {
            event.currentTarget.focus();
            onProfile();
          }}
        >
          <span
            className={cx(
              'whitespace-nowrap text-right text-[13px] font-semibold',
              'max-[900px]:hidden',
              'min-[1100px]:max-[1359px]:hidden',
            )}
          >
            {demoUser}
            <span className="mt-0.5 block text-[12px] font-normal text-muted">
              {headerCopy.account}
            </span>
          </span>
          <Avatar small />
          <ChevronDown size={14} className="text-muted phone:hidden" />
        </button>
      </div>
    </header>
  );
}
