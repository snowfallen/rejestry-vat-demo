import { cx } from '@/lib/cx';

/** Initials in the accent circle used for the signed-in account. */
export function Avatar({ initials = 'PR', small = false }: { initials?: string; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid shrink-0 place-items-center rounded-full border border-solid border-accent-line',
        'bg-accent-soft font-[650] text-accent',
        small ? 'size-9 text-[11px] phone:size-8' : 'size-11 text-[13px]',
      )}
    >
      {initials}
    </span>
  );
}
