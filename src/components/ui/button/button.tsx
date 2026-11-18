import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

// One button vocabulary for the whole screen. Variants are Tailwind class sets, so a
// component never restyles a button locally.

const base = cx(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-solid',
  'font-[550] leading-none transition-[background-color,border-color,color] duration-150 ease-out',
);

const variants = {
  primary: cx(
    'border-accent bg-accent text-on-accent',
    'hover:enabled:border-accent-hover hover:enabled:bg-accent-hover',
  ),
  secondary: cx(
    'border-line-control bg-surface text-ink',
    'hover:enabled:border-[var(--control-hover)] hover:enabled:bg-surface-subtle',
  ),
  ghost:
    'border-transparent bg-transparent text-muted hover:enabled:bg-surface-subtle hover:enabled:text-ink',
  text: cx(
    'border-transparent bg-transparent text-accent underline-offset-[3px]',
    'hover:enabled:text-accent-hover hover:enabled:underline',
  ),
} as const;

const sizes = {
  md: 'min-h-[42px] px-3.5 text-[13px] phone:min-h-[44px] touch:min-h-[44px]',
  sm: 'min-h-[34px] px-3 text-[12px] touch:min-h-[40px]',
  none: 'p-0 text-[13px]',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

const iconVariants = {
  outlined:
    'border-line-control bg-surface text-muted hover:enabled:bg-surface-subtle hover:enabled:text-accent',
  plain:
    'border-transparent bg-transparent text-muted hover:enabled:bg-accent-soft hover:enabled:text-accent',
} as const;

const iconSizes = {
  md: 'size-10 phone:size-11 touch:size-11',
  sm: 'size-8 phone:size-11 touch:size-11',
} as const;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; icon buttons have no visible text. */
  label: string;
  variant?: keyof typeof iconVariants;
  size?: keyof typeof iconSizes;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'outlined', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-grid shrink-0 place-items-center rounded-[9px] border border-solid p-0',
        'transition-colors duration-150',
        iconSizes[size],
        iconVariants[variant],
        className,
      )}
      {...props}
    />
  );
});

/** Class set for a `<summary>` that should look like an outlined icon button. */
export const iconSummaryClass = cx(
  'inline-grid size-10 shrink-0 list-none place-items-center rounded-[9px] border',
  'border-solid border-line-control bg-surface text-muted transition-colors duration-150',
  'hover:bg-surface-subtle hover:text-accent',
  'phone:size-11',
  '[&::-webkit-details-marker]:hidden',
);
