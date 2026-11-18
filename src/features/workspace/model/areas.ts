// The accounting areas of the product and the accounting year, as the reference's
// "Obszary księgowe" page lists them. Only the VAT register is part of this demo.

export type AreaStatus = 'ready' | 'setup';

export interface Area {
  id: string;
  name: string;
  /** Which tab of the area navigation the area belongs to. */
  tab: AreaTab;
  status: AreaStatus;
  summary: string;
}

export type AreaTab = 'vat' | 'postings' | 'assets' | 'controls';

export const areaTabs: { id: AreaTab; label: string }[] = [
  { id: 'vat', label: 'Rejestry i VAT' },
  { id: 'postings', label: 'Księgowania' },
  { id: 'assets', label: 'Majątek' },
  { id: 'controls', label: 'Kontrole' },
];

export const areas: Area[] = [
  {
    id: 'vat',
    name: 'Rejestr VAT',
    tab: 'vat',
    status: 'ready',
    summary: 'Rejestry sprzedaży i zakupów, terminy JPK_V7 i status dokumentów w KSeF.',
  },
  {
    id: 'kpir',
    name: 'KPiR',
    tab: 'postings',
    status: 'setup',
    summary: 'Księga przychodów i rozchodów dla rozliczeń na skali lub podatku liniowym.',
  },
  {
    id: 'revenue',
    name: 'Ewidencja przychodów',
    tab: 'postings',
    status: 'setup',
    summary: 'Ewidencja dla ryczałtu od przychodów ewidencjonowanych.',
  },
  {
    id: 'ledger',
    name: 'Pełne księgi',
    tab: 'postings',
    status: 'setup',
    summary: 'Plan kont, dziennik oraz zestawienie obrotów i sald.',
  },
  {
    id: 'assets',
    name: 'Majątek',
    tab: 'assets',
    status: 'setup',
    summary: 'Środki trwałe, wartości niematerialne i plan amortyzacji.',
  },
  {
    id: 'controls',
    name: 'Kontrole',
    tab: 'controls',
    status: 'setup',
    summary: 'Sprawdzenie spójności danych przed zamknięciem okresu.',
  },
];

export const areaStatusLabels: Record<AreaStatus, string> = {
  ready: 'Dostępny w demo',
  setup: 'Wymaga konfiguracji',
};

export const accountingYear = {
  year: 2026,
  status: 'Wymaga konfiguracji',
  description:
    'Orientacyjny rok rozliczeniowy aktywnej organizacji. Wymaga potwierdzenia przed uruchomieniem operacji księgowych.',
};

export const scopeNotice =
  'To jest mapa zakresu, a nie uruchomienie księgowania. Dane pozostają demonstracyjne.';
