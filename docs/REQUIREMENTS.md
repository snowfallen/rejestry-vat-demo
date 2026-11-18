# Requirement coverage

Every field and action from both reference screenshots, and where it lives now.

## Register screen (second screenshot)

| Reference field or action                  | Implementation                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Organization                               | Above the page title on every width                                                                                                     |
| Subtitle (sales and purchases, demo data)  | Under the page title on every width                                                                                                     |
| Demo status, VAT context needs confirming  | One context capsule: "Okres 2026", "Wymaga potwierdzenia" (explains itself), "DEMO" (states)                                            |
| Rejestr VAT sprzedaży / zakupów            | Two tabs with icons, each with its VAT and document count; arrow-key navigation                                                         |
| Year and month                             | VAT axis of the year with ‹ › steps; month, quarter, year and range (exact dates in a dialog)                                           |
| Search                                     | Contractor, document number, identifier, KSeF number; "/" focuses it; matches are highlighted                                           |
| Operation, JPK V7 code, document series    | Filter dialog (bottom sheet on phones) with live result counts; applied filters become chips                                            |
| Clear filters                              | In the filter dialog and next to the chips                                                                                              |
| Labels (tags)                              | Set in an opened document; filter by label in the filters and in the "⋯" menu                                                           |
| Print                                      | "⋯" menu; A4 landscape print layout: period and print date, every filtered document with all columns, totals per VAT rate, page numbers |
| Download                                   | "Eksportuj CSV" (in "⋯" on phones): UTF-8 CSV of all filtered documents and fields                                                      |
| Sort by a column                           | Click a column header (arrow shows the direction); on phones «Sortuj według» in the Filtry sheet                                        |
| Column settings and grips                  | "⋯" → column dialog (show, order, reset); drag to reorder and resize in the table header                                                |
| Net, VAT, gross                            | "Netto + VAT = Brutto" line for the filtered list                                                                                       |
| Amounts by VAT rate, including `np`        | Rate legend on the same line; the full table and settlement open inside the sheet                                                       |
| Contractor, date, number, KSeF, identifier | Table columns; narrow tables fold identifier and date into second lines; phone rows show all                                            |
| Expand a document                          | Click the row: the document opens as an invoice sheet with a KSeF stamp and KSeF steps                                                  |
| Page range, previous/next, page size       | Pagination with page numbers and gaps, "1–10 z 14", a 10/20/50 menu                                                                     |

## Accounting-area context (first screenshot)

The first screenshot is the top of the same page; the register sits under its
"Rejestry i VAT" tab.

| Reference field or action                   | Implementation                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Witaj, Preview Reviewer!"                  | Header greeting on every width (two lines beside the logo on phones)                 |
| Theme toggle                                | Header button; account dialog on phones. Light and dark themes from the same palette |
| Notifications (4)                           | Bell: VAT context, unconfirmed KSeF, JPK deadline, accounting year to configure      |
| Account ("Konto użytkownika")               | Header account button and dialog                                                     |
| Obszary tabs (Rejestry i VAT, Księgowania…) | In the app bar from 1100px, above the title below it; a bottom tab bar on phones     |
| Okres księgowy · 2026, Wymaga konfiguracji  | First segment of the context capsule (opens the area map); full card in the map      |
| Ewidencje · Obszary księgowe, description   | Area map dialog title and description                                                |
| Scope notice                                | Amber notice in the area map                                                         |
| Dostępność obszarów (six areas)             | Accordions with readiness status in the area map                                     |

## Required states

| State     | Implementation                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Populated | October 2026 by default; sales totals match the reference (9700 / 2323 / 12023)                                                                                                                       |
| Empty     | "Brak danych" or any month of 2025: 0,00 zł in the summary, a way to the nearest month                                                                                                                |
| No result | Search or filters with no match; one action clears them                                                                                                                                               |
| Error     | "Błąd wczytywania", or any failed request to `GET /api/register` (HTTP error or no network): the axis breaks, the message and retry are on the first screen; retry keeps period, register and filters |
| Loading   | Skeleton rows and amount during a reload                                                                                                                                                              |

Every state is one choice away: «DEMO» opens "Stan danych demo" with three cards, and the address opens them directly (`/?state=empty`, `/?state=error`), from the server's first frame.

## Added for accounting work

- An opened document links to its contractor's documents of the year: the year view, searched by the contractor's name.
- KSeF status by exception: confirmed documents show their number quietly, unconfirmed ones are marked in amber.
- Beside the JPK deadline: the sales of that month still without a KSeF number («4 faktury bez numeru KSeF →»), one press away from the list of exactly those (since February 2026 JPK_V7 needs a KSeF number or an OFF, BFK or DI marking for every invoice).
- «Sprawdź status w KSeF» on an unconfirmed sale: a simulated check, marked as demo data, after which every count, the export and the print use the new number.
- Purchases carry the supplier's KSeF number and KSeF steps from the buyer's side; GTU codes appear on sales only, and the purchase register says why.
- The month's return amount in whole złoty in the rates breakdown («Kwota do wpłaty w JPK»), for a month only.
- JPK_V7M filing deadline for the selected month (in a quarter, the nearest one still ahead), moved past weekends and Polish public holidays.
- "VAT do zapłaty" or "Nadwyżka VAT naliczonego" in the period summary, said once: output minus input VAT, marked as an estimate, compared with the previous month.
- KSeF status views ("Brak potwierdzenia", "Potwierdzone") with counts in the toolbar; on phones a one-tap switch.
- Documents grouped by month, with month totals, in multi-month periods. A month heading folds its documents away; the next months move up into the page and the page range still counts documents.
- Phones get the same first frame from the server as after hydration: the phone list footer and the desktop pagination are both rendered and CSS picks one.

## Demo assumptions

- Hidden menus, document details and series settings were not supplied; their behavior is designed here.
- Labels, notes and series changes last for the session only.
- Purchase data, KSeF numbers and JPK options are illustrative. The demo company uses the placeholder NIP 1111111111; supplier NIPs fail the checksum on purpose.
- No backend, authentication, accounting integration or KSeF connection.
