import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';

/** A full-width choice row used by the label and area dialogs. */
export function ListOption({
  icon,
  trailing,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; trailing: ReactNode }) {
  return (
    <button
      type="button"
      className={cx(
        'flex min-h-[50px] w-full items-center gap-3 rounded-md border-0 border-b border-solid',
        'border-line bg-transparent px-2.5 py-3.5 text-left text-[13px] text-ink',
        'hover:enabled:bg-accent-soft',
        '[&>svg:first-child]:text-accent',
      )}
      {...props}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {trailing}
    </button>
  );
}
