'use client';
import { CircleHelp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cx } from '@/lib/cx';
import { demoUser, organization } from '../../model/organization';
import { ThemeChoice } from './theme-choice';
import { profileCopy } from '../../copy';

/**
 * The demo account as a small card: who is signed in on a hero cover, the theme as two
 * pictured choices, and what the demo keeps. One full-width way back.
 */
export function ProfileDialog({
  onClose,
  onTour,
}: {
  onClose: () => void;
  /** Starts the guided tour; shown on phones, where the header has no room for it. */
  onTour?: () => void;
}) {
  return (
    <Dialog title={profileCopy.title} onClose={onClose}>
      <div
        className={cx(
          'mb-5 flex items-center gap-3.5 rounded-2xl bg-[image:var(--hero-bg)] p-4',
          'text-[var(--hero-ink)] shadow-[var(--shadow-hero)]',
          // Phones: a profile header, the avatar over the name, centred like the sheet's title.
          'phone:flex-col phone:gap-2.5 phone:px-4 phone:py-5 phone:text-center',
        )}
      >
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-white/15 text-[18px] font-[650] ring-1 ring-white/30"
        >
          PR
        </span>
        <div className="min-w-0 phone:max-w-full">
          <strong className="block text-[16px] font-semibold">{demoUser}</strong>
          <span className="mt-0.5 block truncate text-[13px] text-[var(--hero-muted)]">
            {organization}
          </span>
          <span className="mt-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em]">
            {profileCopy.account}
          </span>
        </div>
      </div>
      <ThemeChoice />
      <p className="m-0 mt-5 flex gap-2.5 rounded-xl bg-surface-subtle p-3 text-[13px] leading-relaxed text-muted">
        <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
        {profileCopy.note}
      </p>
      {onTour && (
        <Button className="mt-5 w-full desk:hidden" onClick={onTour}>
          <CircleHelp size={17} />
          {profileCopy.tour}
        </Button>
      )}
      <Button
        variant="primary"
        className={cx('mt-5 w-full', onTour && 'phone:mt-2.5')}
        onClick={onClose}
      >
        {profileCopy.back}
      </Button>
    </Dialog>
  );
}
