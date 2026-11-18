'use client';
import { useRef, useState, type ComponentType } from 'react';
import {
  Bell,
  CalendarClock,
  CalendarCog,
  ChevronRight,
  CircleAlert,
  FileClock,
} from 'lucide-react';
import { useAnchoredPlacement } from '@/hooks/use-anchored-placement';
import { closeDetails, useDetailsDismiss } from '@/hooks/use-dismiss';
import { phoneQuery, useMediaQuery } from '@/hooks/use-media-query';
import { cx } from '@/lib/cx';
import { headerCopy } from '../../copy';

export type NoticeAction = 'ksef' | 'jpk' | 'context' | 'year';

export interface Notice {
  icon: 'context' | 'ksef' | 'deadline' | 'year';
  title: string;
  text: string;
  /** Where the notice leads: each one is a shortcut to the thing it is about. */
  action: NoticeAction;
}

const noticeIcons: Record<Notice['icon'], ComponentType<{ size?: number }>> = {
  context: CircleAlert,
  ksef: FileClock,
  deadline: CalendarClock,
  year: CalendarCog,
};

/** The bell: what needs attention in the selected period. */
interface NotificationsMenuProps {
  notices: Notice[];
  onAction: (action: NoticeAction) => void;
}

export function NotificationsMenu({ notices, onAction }: NotificationsMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  useDetailsDismiss(ref);
  // Phones pin the panel under the header instead.
  const phone = useMediaQuery(phoneQuery);
  const place = useAnchoredPlacement(summary, open && !phone, { width: 330, minHeight: 240 });
  return (
    <details
      ref={ref}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="relative [&[open]>summary]:bg-accent-soft [&[open]>summary]:text-accent"
    >
      <summary
        ref={summary}
        role="button"
        aria-label={headerCopy.notificationsCount(notices.length)}
        className={cx(
          'relative grid size-10 list-none place-items-center rounded-full text-muted',
          'transition-colors',
          'hover:bg-accent-soft hover:text-accent',
          'phone:size-11',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <Bell size={19} />
        {notices.length > 0 && (
          <span
            aria-hidden="true"
            className={cx(
              'absolute right-[3px] top-1 grid h-[17px] min-w-[17px] place-items-center rounded-full',
              'border-2 border-solid border-surface bg-danger px-[3px] text-[9px] font-bold leading-none',
              'text-white',
            )}
          >
            {notices.length}
          </span>
        )}
      </summary>
      <div
        style={!open ? { visibility: 'hidden' } : phone ? undefined : place}
        className={cx(
          'fixed z-popover w-[min(330px,calc(100vw-24px))] animate-[panelIn_160ms_ease-out]',
          'overflow-y-auto rounded-[14px] bg-surface px-3.5 pb-2 pt-3.5 shadow-2',
          'phone:left-3 phone:right-3 phone:top-[62px] phone:w-auto',
        )}
      >
        <h2 className="m-0 mb-1.5 text-[14px] font-semibold">{headerCopy.notifications}</h2>
        <ul className="m-0 list-none p-0">
          {notices.map(({ icon, title, text, action }) => {
            const Icon = noticeIcons[icon];
            return (
              <li
                key={title}
                className="border-0 border-t border-solid border-line first:border-t-0"
              >
                <button
                  type="button"
                  className={cx(
                    '-mx-2 flex w-[calc(100%+16px)] items-center gap-2.5 rounded-lg border-0 bg-transparent',
                    'px-2 py-2.5 text-left',
                    'hover:bg-surface-subtle',
                  )}
                  onClick={() => {
                    closeDetails(ref.current);
                    onAction(action);
                  }}
                >
                  <span
                    className={`grid size-[30px] shrink-0 place-items-center rounded-lg ${icon === 'deadline' ? 'bg-accent-soft text-accent' : 'bg-warning-bg text-warning'}`}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[13px] font-[550]">{title}</strong>
                    <small className="text-[12px] text-muted">{text}</small>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-faint" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
