# Register screen

The visual world is pinned by the supplied screenshots: pale
lavender canvas, white surfaces, deep ink, muted slate, teal selection, amber
context, thin borders, compact sans-serif type. The dark theme carries the same
identity: deep slate canvas, lifted surfaces, a brighter teal.

## Structure

The page reads top to bottom in the order an accountant works:

1. **Area** — header greeting, theme, notifications and account; area tabs with
   "Rejestry i VAT" selected and the accounting year's status. The full area map
   (year card, area readiness) opens on demand.
2. **Period** — a year of months as a strip of VAT bars. The highlight stretches
   over a month, a quarter, the year or a range; drag it to move the period, or
   drag across months to draw a range. The JPK deadline sits under the period name.
3. **Register** — one sheet. Its header holds both registers as tabs with their
   VAT, and the VAT to pay. Below: "Netto + VAT = Brutto" with the rate legend.
4. **Documents** — search, filters, export and "⋯"; KSeF status views; the table
   with every original column. A document opens as an invoice sheet.

Extras stay out of sight until asked for: filters, rate breakdown, area map,
column settings, print, labels and series all open from a single control each.

## Motion

Motion explains change: the highlight slides between periods, bars grow, the
register tab slides, the opened document rises with its amounts arriving line by
line and the KSeF stamp landing last, KSeF steps fill in order, area accordions
unfold, the new theme spreads from its button. Reduced motion removes all of it.
Period changes avoid view transitions, which block pointer input while running.

## Responsive

Desktop shows the table; phones (≤760px) show cards with every field, a
scrollable month strip, short register names, a bottom-sheet filter that also sorts,
and the KSeF views as a sideways row of chips. On a 320×568 screen the first screen is
the period with the VAT to pay; one swipe brings the search and the first document.
Checked at 1440, 1178, 1024, 900, 768, 375×667 and 320×568.

## Data

October 2026 sales reproduce the reference: 9700 PLN net, 2323 PLN VAT,
12023 PLN gross (10100 PLN taxable plus a -400 PLN correction). Other months are
generated; December is empty on purpose. Fixtures only, not tax advice.
