# Verification

Local production verification, 2026-11-18.

| Check                        | Result                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript strict and build  | Passed                                                                                                                                                                                                                                                                                                                                              |
| ESLint (Next 16 flat config) | 0 errors, 0 warnings                                                                                                                                                                                                                                                                                                                                |
| Prettier                     | Passed                                                                                                                                                                                                                                                                                                                                              |
| Domain tests (Vitest)        | 82 passed: periods, JPK deadlines, filters, totals, settlement, tax rounding, the address format and demo state, demo data, supplier numbering and NIP checksums, KSeF numbers, GTU on sales only, correction notes, axis scale, reducer scenarios, selectors, the register API (store and client), contractor history, the content security policy |
| Browser suite (Playwright)   | 163 tests, none skipped: desktop-only and phone-only ones are tagged `@desktop` / `@phone` and run only in their projects                                                                                                                                                                                                                           |
| Engines                      | Desktop Chromium; iPhone SE-sized WebKit at 375×667 and 320×568. Desktop Firefox by hand: layout and overflow at 1440 to 320 px, and the browser suite apart from its axe and clipboard checks, which Playwright's Firefox build does not run reliably                                                                                              |
| Resize matrix                | 1600 to 320 px in steps, no horizontal page scroll; the table fits its card from 761 px at default column widths                                                                                                                                                                                                                                    |
| Visual inspection            | 1440, 1178, 1024, 900, 768, 375, 320; light and dark; every state and dialog                                                                                                                                                                                                                                                                        |
| Accessibility (axe)          | 0 violations, light and dark, populated / opened document / empty / error                                                                                                                                                                                                                                                                           |
| Dependencies                 | `pnpm audit --prod`: no known vulnerabilities on 2026-11-18. One dev-only advisory in the ESLint toolchain (picomatch, no patched release), not shipped. A weekly audit workflow and monthly grouped Dependabot updates keep watch                                                                                                                  |
| Print                        | A4 landscape PDF from Chrome: heading, 11 columns, totals per rate, page numbers                                                                                                                                                                                                                                                                    |
| First load JavaScript        | 187 kB transferred, 9 scripts (production build, compressed)                                                                                                                                                                                                                                                                                        |

The browser suite covers the populated, empty, no-result, error and retry
states; period modes, step buttons, drag to move and drag to draw a range, and
Shift + arrow keys; both registers; search, filters, chips and KSeF status
views; the opened document and its KSeF stamp; series validation and focus
return; labels and notes; CSV content; print output and its totals; folding month groups; months that have not begun
stay unavailable; the guided tour (steps, back, skip, Escape, focus, axe); arrow keys and the
touch swipe on the period; the header title back to the top; the address keeping the
period, register and KSeF view across a reload; the register API (`/api/register`: populated, empty, 503, 400) and a lost connection showing the error state; the server's first frame stating the VAT to pay; the KSeF status shown once on phones; a contractor's documents of the year; Escape closing an opened document; the tour in a failed register; column settings, ordering
and resizing; sorting from the filter sheet on phones; pagination; the area tabs, area map and theme persistence;
automated WCAG A/AA checks in the initial and expanded views; viewport geometry; the empty and error states opened from the address; the invoices without a KSeF number beside the JPK deadline and the simulated KSeF check (counts, list and CSV follow); purchase KSeF steps; the content security policy (no violation while the screen is used in Chromium and WebKit, a fresh nonce per request, security headers) and the read-only API (405, 400 without echo, no CORS).

Motion checks sample real animation-frame heights while documents open and
close, and confirm reduced-motion timing and that closed content is inert. They
show that transitions run, not how smooth they feel on every device.

Not tested: a physical iPhone, a live accounting integration or KSeF, a
Kubernetes deployment. The hosted demo and GitHub CI need their own checks after
publishing; local results do not establish those.
