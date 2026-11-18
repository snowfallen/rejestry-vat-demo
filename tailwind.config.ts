import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { media } from './src/lib/breakpoints';

// Colours come from the CSS custom properties in globals.css, so Tailwind utilities
// and CSS Modules share one palette (the employer's reference identity).
export default {
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: { DEFAULT: 'var(--surface)', subtle: 'var(--surface-subtle)' },
        ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)' },
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: { DEFAULT: 'var(--line)', control: 'var(--control-line)' },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          line: 'var(--accent-line)',
        },
        'on-accent': 'var(--on-accent)',
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
          line: 'var(--warning-line)',
        },
        danger: { DEFAULT: 'var(--danger)', soft: 'var(--danger-soft)' },
        track: 'var(--track)',
      },
      fontFamily: { sans: 'var(--font)' },
      transitionTimingFunction: { out: 'var(--ease-out)', sheet: 'var(--ease-sheet)' },
      boxShadow: { 1: 'var(--shadow-1)', 2: 'var(--shadow-2)', 3: 'var(--shadow-3)' },
      zIndex: {
        raised: 'var(--z-raised)',
        sticky: 'var(--z-sticky)',
        header: 'var(--z-header)',
        popover: 'var(--z-popover)',
        sheet: 'var(--z-sheet)',
        toast: 'var(--z-toast)',
      },
    },
  },
  plugins: [
    // The layout's three widths: phone, desk (anything wider) and wide (areas in the
    // header). Variants rather than `screens`, which would switch off `min-[…]`/`max-[…]`.
    plugin(({ addVariant }) => {
      for (const [name, query] of Object.entries(media)) addVariant(name, `@media ${query}`);
    }),
  ],
} satisfies Config;
