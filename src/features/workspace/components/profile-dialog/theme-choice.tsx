'use client';
import { Check } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cx } from '@/lib/cx';
import { profileCopy } from '../../copy';

const themes = ['light', 'dark'] as const;
const preview = (theme: (typeof themes)[number], part: 'canvas' | 'paper' | 'ink') =>
  `var(--preview-${theme}-${part})`;

/**
 * Light or dark as two tiles, each a small picture of the screen in that theme, so the
 * choice shows what it does. The tiles keep their own colours in either theme.
 */
export function ThemeChoice() {
  const { theme, toggle } = useTheme();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-[13px] font-semibold text-ink">{profileCopy.theme}</legend>
      <div role="radiogroup" aria-label={profileCopy.theme} className="grid grid-cols-2 gap-2.5">
        {themes.map((value) => {
          const selected = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => !selected && toggle()}
              className={cx(
                'group relative grid gap-2 rounded-xl border border-solid bg-surface p-2 text-left',
                'text-[13px] font-semibold text-ink transition-colors duration-150',
                selected ? 'border-accent shadow-[0_0_0_1px_var(--accent)]' : 'border-line',
                !selected && 'hover:border-[var(--control-hover)]',
              )}
            >
              <span
                aria-hidden="true"
                className="grid h-[54px] grid-cols-[30%_1fr] gap-1.5 overflow-hidden rounded-lg p-1.5"
                style={{ background: preview(value, 'canvas') }}
              >
                <span className="rounded" style={{ background: preview(value, 'paper') }} />
                <span
                  className="grid content-start gap-1 rounded p-1.5"
                  style={{ background: preview(value, 'paper') }}
                >
                  <span
                    className="h-1.5 w-3/5 rounded-full"
                    style={{ background: preview(value, 'ink') }}
                  />
                  <span className="h-1.5 w-2/5 rounded-full bg-accent" />
                </span>
              </span>
              <span className="flex items-center justify-between px-1 pb-0.5">
                {profileCopy.themes[value]}
                {selected && (
                  <span className="grid size-[18px] place-items-center rounded-full bg-accent text-on-accent">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
