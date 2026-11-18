---
name: Rejestry i VAT
description: "Oś" — an accounting register built around one VAT axis, where things come from where you touched them.
colors:
  accent: '#167873'
  accent-hover: '#105e5b'
  accent-soft: '#eaf5f3'
  accent-line: '#b9d8d3'
  warning: '#79591c'
  warning-bg: '#fff9eb'
  warning-line: '#e7d9b8'
  pending: '#d4a64a'
  danger: '#b14442'
  danger-soft: '#fff2f0'
  canvas: '#f6f7fb'
  surface: '#ffffff'
  surface-subtle: '#f8fafb'
  track: '#eceff6'
  ink: '#17262e'
  muted: '#5d6e79'
  faint: '#697985'
  line: '#e2e8eb'
  control-line: '#cbd5db'
  bar: '#c6dfda'
  bar-other: '#bfcbd1'
  focus: '#0d7771'
typography:
  page-title:
    fontFamily: 'Geist Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    fontSize: 'clamp(24px, 0.9vw + 19px, 30px)'
    fontWeight: 620
    lineHeight: 1.15
    letterSpacing: '-0.035em'
  register-vat:
    fontFamily: 'Geist Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    fontSize: 'clamp(16px, 1.4vw + 11px, 26px)'
    fontWeight: 620
    lineHeight: 1.15
    letterSpacing: '-0.03em'
  body:
    fontFamily: 'Geist Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: 'Geist Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    fontSize: '13px'
    fontWeight: 550
    lineHeight: 1
rounded:
  chip: '5px'
  control: '9px'
  register-tab: '15px'
  register-sheet: '16px'
  bottom-sheet: '22px'
spacing:
  gutter: 'clamp(12px, 2.4vw + 6px, 40px)'
  inset: 'clamp(12px, 1.6vw + 8px, 24px)'
  header: '72px (56px on phones)'
elevation:
  shadow-1: '0 1px 2px rgb(23 38 46 / 0.06)'
  shadow-2: '0 12px 32px -12px rgb(23 38 46 / 0.18), 0 0 0 1px line'
  shadow-3: '0 -8px 40px -12px rgb(23 38 46 / 0.22)'
layers:
  raised: 1
  sticky: 20
  header: 30
  popover: 40
  sheet: 50
  toast: 60
motion:
  ease-out: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
  ease-sheet: 'cubic-bezier(0.32, 0.72, 0, 1)'
  dur-1: '160ms'
  dur-2: '240ms'
  dur-3: '320ms'
  dur-4: '460ms'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.surface}'
    typography: '{typography.control}'
    rounded: '{rounded.control}'
    height: '42px'
  register-tab-selected:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.accent}'
    rounded: '{rounded.register-tab}'
  register-track:
    backgroundColor: '{colors.track}'
    rounded: '{rounded.register-sheet}'
  document-row:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    height: '56px'
  bottom-sheet:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.bottom-sheet}'
---

# Design System: Oś

## The idea

A VAT register is two movements around one line: output VAT (należny) goes up, input VAT (naliczony) comes down, and what is left between them is what the company pays. The whole screen is built on that one axis instead of on panels and metric cards.

- The **period card** is «Oś rozliczenia», the settlement axis: twelve months, output VAT rising above the line and input VAT hanging below it, on one scale. Each output bar is split: the part input VAT covers is pale (`axis-offset`), the part left to pay is solid teal (`axis-due`); where input exceeds output, the overhang below is amber (`axis-surplus`). Inside the lens the selected register's half stays full and the other steps back; at rest the period's result is said once, in the summary beside the axis; while the lens is dragged or resized its sum rides on it in whole złoty and leaves when the gesture ends; a hover lists należny, naliczony and the result. The whole-złoty amount of a month's return («Kwota do wpłaty w JPK», art. 63 § 1 Ordynacji podatkowej) sits in the rates breakdown, for a month only: JPK_V7M is monthly and each month rounds on its own. The legend names the amber «nadwyżka» when the year has such a month. Beside the axis, the summary says the same in words: ‹ month ›, dates, JPK deadline and «VAT do zapłaty». On first show the bars rise solid and the covered part pales from the line up; the amount is right from the server's first frame and counts only when the period changes. You pick a month by touching its bars, drag to move or draw a range, and pull the handles of the lens to resize it; the handles show on hover or focus with a mouse, while dragging and always in a range, never resting on a touch screen.
- The **register sheet** hangs from the strip: two tabs (sales and purchases) with their VAT, and the selected tab flows into the documents below it through two concave corners.
- **Empty, no results and error** are drawn on the same axis: empty bars waiting with a pulse on the line, a lens passing over faded bars, a broken axis with the bars beside the break slumping. An error is said once: on desktop by the panel under the tabs (the period card shows «—» like the tabs), on a phone by the hero.

Everything else follows two rules.

**Things come from where you touched them.** The compact title slides into the header from where the page title left. The theme spreads in a circle from its button. On a phone, a document grows out of its own row (its title lands where the row was) and folds back into it on close. Cards added by «Pokaż kolejne» rise into the list one after another. Nothing appears from nowhere.

**A document looks like a document.** An opened document is paper: both parties, the amounts adding up line by line (Netto + VAT = Brutto) with the VAT share drawn under them, and a KSeF seal that draws its tick or turns its clock hand once. Beside the paper, its way through KSeF is a short vertical path that fills step by step.

## Colors

The reference palette is kept: pale lavender canvas, white working surfaces, deep ink, teal for action and selection, amber for context. Both themes are full token sets in `globals.css` (`:root` and `:root[data-theme='dark']`); nothing in components is a raw hex value.

- **Teal** (`accent`) means "this is active or yours": the selected month and register, the primary action, an opened row's left edge.
- **Amber** (`warning`, `pending`) explains: demo context, corrections, documents waiting for a KSeF number (a dashed ring, never a filled warning). KSeF status is shown by exception: a confirmed document is the norm and stays quiet (its number and a small grey check), only an unconfirmed one is marked: in its row, on its card on phones, and beside the JPK deadline that it holds back.
- **Red** (`danger`): failure and the notification count (kept from the reference).
- **Hero** (`hero-from`, `hero-to`, `hero-glow`, composed into `hero-bg`): the deep teal gradient of the phone's period card and the accounting-year card; text on it is white or `hero-muted`, never below 4.5:1.
- **Axis** (`axis-due`, `axis-offset`, `axis-input`, `axis-surplus`): solid teal is what is due, pale teal what input VAT covers, cool grey the input VAT, amber a surplus. The colours do not depend on the selected register; the selected register's half of the selected months gets a 2px teal outline. Each part keeps 3:1 against the surface in the dark theme.

Elevation has three steps: `shadow-1` for resting surfaces, `shadow-2` for every popover and menu (all with a 14px radius), `shadow-3` for sheets rising from the bottom. Layers are named (`--z-raised`, `--z-sticky`, `--z-header`, `--z-popover`, `--z-sheet`, `--z-toast`, `--z-skip`) and exposed to Tailwind as `z-sticky` and so on: pinned table cells are raised, the table head sticks above them, the skip link covers everything. The page header is `--header-h` (72px, 56px on phones) and every sticky offset is counted from it.

Three layout widths come from one place (`src/lib/breakpoints.ts`): `phone` up to 760px, `desk` above it and `wide` from 1100px, used as Tailwind variants (`phone:`, `desk:`, `wide:`) and by `useMediaQuery`. A fourth variant, `touch:` (coarse pointer), gives tablets the phone's 44px targets inside the desktop layout. A few widths follow content rather than the layout and stay as written: the header gives up its areas and greeting as the window narrows, the period card sets the axis beside the summary from 900px, the toolbar takes the KSeF views in from `wide`, and the smallest phones tighten pagination and menus.

## Type

Geist Variable, self-hosted. Sizes that matter (page title, register VAT, figures) are fluid with `clamp()`, so the page narrows smoothly instead of jumping at breakpoints. All money, dates and identifiers use tabular numerals and never break inside an amount.

## Layout

One column, `gutter` around and `inset` inside surfaces; both are fluid tokens.

Order from top: header (greeting, areas from 1100px, theme, notifications, account) → organisation and title with the context capsule (Okres księgowy 2026 · Wymaga potwierdzenia · DEMO) → period card (summary and axis) → register sheet (tabs with VAT, Netto + VAT = Brutto, one toolbar row: search, KSeF views, filters, export, ⋯; documents). At 1440×900 the first document row starts at 640px. A failed register keeps only its tabs, with the error right under them.

- **Desktop:** the header is 72px and sticky; once the title scrolls away, «Rejestry i VAT · period» replaces the greeting. While the table fits its width, its column headings stick under the header.
- **Phone (≤760px):** built like an app. The deep teal hero is the one large colour surface in the product, a deliberate phone choice: it comes from the palette's accent, and desktop keeps the reference's white surfaces. The header is 56px and the title replaces the wordmark once the page scrolls. The accounting areas move to a frosted tab bar at the bottom (the last item opens the map). The period becomes the hero: a deep teal card with the VAT to pay in large type, the whole year's axis across its width and the mode switch on the dark. The page title and its context capsule sit centred, on the hero's axis. The register is a sheet from edge to edge with square corners, running down to the page's end like the opened document's sheet: tabs stick under the header with only their count line tucked away, the search row sticks under them, and every row starts with the document's sign (sale, purchase or correction, with KSeF in its corner). Every dialog is a bottom sheet with a grip and its title centred under it, the close button at the right (content stays left-aligned, like an iOS navigation bar); an opened document grows out of its row and steps to the previous or next one from its footer. The list grows with «Pokaż kolejne N» instead of pages; the page size remains as the step.
- **560–760px:** document rows run in two columns.
- No page-wide horizontal scroll at any width from 320px.

## Motion

Motion explains where something came from and where it went. Durations stay between 160 and 460ms; entering uses a fast-out curve (`cubic-bezier(0.2, 0.8, 0.2, 1)` or the iOS sheet curve `cubic-bezier(0.32, 0.72, 0, 1)`), leaving uses an even one. Text is moved with transforms, never faded through low contrast. Every animation has a reduced-motion fallback: a static end state or the plain slide.

## Small helps

Things that save a look or a step without adding a control: the JPK deadline says how soon it falls («za 8 dni»), the search field says how many documents it kept («3 z 14»), unconfirmed KSeF counts are amber, and the period's result is said once, beside the axis, with the lens carrying a live sum only while it is dragged. The rate legend sits inside the control that opens the rates, so the legend and its action read as one; it repeats an amount only when more than one rate carries VAT. An opened document links to its contractor's documents of the year in plain words («13 dokumentów dla Demo Alfa 01 w 2026 →»).

## Table and toolbar

The table ranks by tone, not by boxes: the contractor and the gross amount lead (ink, heavier), the document number steps back (ink-soft), the date and identifier step back further (muted), all figures in tabular numerals. Rows carry no type icons: «Korekta» names the odd document out and the KSeF column carries the status. Cards on phones keep their icon, where a row is a card. «Filtry», «Eksportuj CSV» and «⋯» act on the same list, so on desktop they are one shape with shared edges (`ButtonGroup`); on phones they stand apart. The greeting in the header is quieter than the page title it shares the screen with.

## KSeF in the demo

Beside the JPK deadline the period names what holds that return back: «4 faktury bez numeru KSeF →», counting the month the shown deadline is for, and one press lists exactly those sales. An unconfirmed sale offers «Sprawdź status w KSeF» in its KSeF step: a short wait, the seal draws its tick again, the number arrives, and only then does the register take it, so a «Brak potwierdzenia» list does not whisk the document away mid-motion. The check is simulated and says so in its title and toast («dane demo»). Purchases arrive through KSeF with the supplier's number and their steps say so («Wystawiony przez dostawcę → Przyjęty w KSeF → Pobrany z KSeF»). On phones the KSeF steps run down, one per line, so a number is never cut.

## Disclosure

The first screen shows the period, both registers' VAT, the three totals and the documents. Everything else waits for a request: filters in a compact dialog (a bottom sheet on phones) with result counts on each option; applied filters stay as named chips that remove one criterion each; rates, columns, series, labels and the areas map live behind their own buttons and the «Więcej działań» menu. On phones every such panel is the same native bottom sheet: filters, the rates (as «Stawki VAT»), the «Więcej działań» tools, the document. The KSeF views sit under the phone's search as pills that scroll sideways, the same three words as on desktop. A label change can be undone from its toast; the toast moves into an open sheet so «Cofnij» stays reachable.

## Do and don't

- **Do** put new information on the axis or on the paper before adding a new panel.
- **Do** start a motion at the element the user touched.
- **Do** keep every original field and action reachable at every width.
- **Don't** add metric cards, dashboard widgets or decorative colour.
- **Don't** fade text through low contrast during motion.
- **Don't** let a filter block push the documents down; filters live in a dialog and as chips.

## Guided tour

Nothing explains itself on arrival: the screen has to read on its own. A short tour exists for whoever asks — the «?» in the desktop header, «Jak to działa?» in the phone's account sheet. A clear window moves over the dimmed screen from the period to the registers, the search row, a document and the demo switch; a card beside it says what each part does. «Dalej», «Wstecz», «Pomiń», Escape and ← → work; focus stays in the card and returns where it was. It shows only the parts on screen (a failed register has no search or documents to point at), and the page behind it is inert.

## Small conveniences

- ← and → step the month when the page itself has focus (fields, tabs and the axis keep their arrows); the arrow buttons show the keys in their tooltips.
- On touch screens a sideways swipe over the period's summary steps the month; the summary follows the finger a little and springs back.
- The compact title in the sticky header takes the page back to the top, like a tap on an iPhone's status bar.
- The address keeps the period, register, KSeF view and search, so a reload or a shared link opens the same view.
- The browser bar takes the colour of the theme chosen in the app; added to a phone's home screen, the register opens as an app with its own icon.
