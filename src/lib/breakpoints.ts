/**
 * The layout's widths, in one place. `tailwind.config.ts` turns them into the
 * `phone:`, `desk:` and `wide:` variants, plus `touch:` for coarse pointers; `useMediaQuery` reads the queries.
 *
 * CSS Modules repeat the phone query as `@media (max-width: 760px)`: plain CSS has no
 * variables in media queries, and Tailwind's `screen()` needs `theme.screens`, which
 * would switch off the arbitrary `min-[…]`/`max-[…]` variants used below.
 *
 * The remaining arbitrary widths follow content, not the layout: the header drops its
 * areas and greeting as the window narrows (900, 1149, 1279), the period card puts the
 * axis beside the summary from 900, the toolbar takes the KSeF views in from `wide`, and
 * the smallest phones tighten pagination, the toolbar and menus (480, 400, 350).
 */
export const breakpoints = { phone: 760, wide: 1100 } as const;

export const media = {
  phone: `(max-width: ${breakpoints.phone}px)`,
  desk: `(min-width: ${breakpoints.phone + 1}px)`,
  wide: `(min-width: ${breakpoints.wide}px)`,
  /** A finger, not a mouse: tablets get the phone's 44px targets in the desktop layout. */
  touch: '(pointer: coarse)',
} as const;
