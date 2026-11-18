// Polish interface copy of the register feature, in one place.

import { plural } from '@/lib/plural';

/** «1 dokument», «3 dokumenty», «14 dokumentów». */
export const documentCount = (count: number) =>
  plural(count, 'dokument', 'dokumenty', 'dokumentów');
/** «z 1 dokumentu», «z 14 dokumentów». */
export const ofDocuments = (count: number) =>
  `z ${count} ${count === 1 ? 'dokumentu' : 'dokumentów'}`;

/** One KSeF vocabulary for chips, views, the document and the bell. */
export const ksefCopy = {
  pending: 'Brak potwierdzenia',
  confirmed: 'Potwierdzony',
  confirmedMany: 'Potwierdzone',
  all: 'Wszystkie',
  seal: 'KSeF',
  steps: { issued: 'Wystawiony', sent: 'Wysłany do KSeF', confirmed: 'Potwierdzony' },
  /** A purchase comes from the supplier through KSeF: we receive it, we do not send it. */
  purchaseSteps: {
    issued: 'Wystawiony przez dostawcę',
    sent: 'Przyjęty w KSeF',
    confirmed: 'Pobrany z KSeF',
  },
} as const;

/** The context capsule beside the page title. */
export const contextCopy = {
  year: 'Okres księgowy',
  vat: 'Wymaga potwierdzenia',
  vatLabel: 'Kontekst VAT: wymaga potwierdzenia',
  vatText: (organization: string) =>
    `Kontekst VAT wymaga potwierdzenia. Poniżej wyłącznie dane demonstracyjne, nie ewidencja organizacji ${organization}`,
  demo: 'DEMO',
  demoLabel: 'Stan danych demo',
  demoHint: 'Pokaż ekran z danymi, bez danych albo z błędem wczytywania',
  yearHint: 'Rok rozliczeniowy organizacji. Otwiera mapę obszarów księgowych.',
  vatHint: 'Dlaczego kontekst VAT wymaga potwierdzenia',
} as const;

/** The demo-state picker: the three states the brief asks to see. */
export const demoStateCopy = {
  title: 'Stan danych demo',
  description: 'Zobacz, jak ekran zachowuje się w każdym stanie.',
  options: {
    populated: { label: 'Z danymi', hint: 'Październik: 14 dokumentów' },
    empty: { label: 'Brak danych', hint: 'Pusty rejestr' },
    error: { label: 'Błąd wczytywania', hint: 'Serwer nie odpowiada' },
  },
} as const;

/** The period card: summary, mode switch and the date range. */
export const periodCopy = {
  heading: 'Okres rozliczeniowy',
  previous: 'Poprzedni okres',
  next: 'Następny okres',
  due: 'VAT do zapłaty',
  surplus: 'Nadwyżka VAT naliczonego',
  estimate: 'szacunek',
  missingKsef: (count: number) =>
    `${plural(count, 'faktura', 'faktury', 'faktur')} bez numeru KSeF`,
  missingKsefTitle: 'W JPK_V7 każda faktura musi mieć numer KSeF albo oznaczenie OFF, BFK lub DI',
  deadline: (form: string, date: string) => `${form} do ${date}`,
  deadlineFor: (form: string, month: string, date: string) => `${form} za ${month} do ${date}`,
  modes: 'Rodzaj okresu',
  range: {
    edit: 'Zmień zakres dat',
    hint: 'Przeciągnij po osi albo kliknij początek i koniec.',
    start: (month: string) => `Początek: ${month}. Wybierz miesiąc końcowy.`,
    title: 'Wybierz zakres',
    from: 'Od',
    to: 'Do',
    cancel: 'Anuluj',
    apply: 'Zastosuj',
  },
} as const;

/** Loading, empty and error, wherever they show. */
export const stateCopy = {
  failed: 'Nie udało się wczytać rejestru',
  retry: 'Spróbuj ponownie',
  emptyPeriod: 'Brak dokumentów w tym okresie',
  loading: 'Wczytywanie',
  loaded: (documents: string) => `Wczytano ${documents}`,
  loadingDocuments: 'Wczytywanie dokumentów',
  loadingRegister: 'Wczytywanie rejestru',
  failedDocuments: 'Nie udało się wczytać dokumentów',
  failedShort: 'Nie udało się wczytać',
  failedText: 'Wystąpił problem z pobraniem dokumentów.',
  failedKept: 'Wybrany okres i filtry zostały zachowane.',
  noResults: 'Nie znaleziono dokumentów',
  noResultsText: 'Zmień wyszukiwaną frazę lub usuń filtry, aby zobaczyć dokumenty.',
  clearAll: 'Wyczyść wyszukiwanie i filtry',
  example: 'Pokaż przykładowy okres',
  noDocuments: 'Brak dokumentów',
  emptyMonth: (locative: string, year: number) => `Brak dokumentów ${locative} ${year}`,
  emptyRange: (phrase: string) => `Brak dokumentów za ${phrase}`,
  emptyText: (registerGenitive: string, phrase: string) =>
    `Rejestr ${registerGenitive} za ${phrase} jest pusty.`,
  nearest: (genitive: string, count: number) => `Przejdź do ${genitive} · ${documentCount(count)}`,
  found: (count: number, page: number, pages: number) =>
    `Znaleziono ${documentCount(count)}. Strona ${page} z ${pages}.`,
} as const;

/** The page around the register: title, skip link, the compact title's result. */
export const registerCopy = {
  title: 'Rejestry i VAT',
  subtitle: 'Sprzedaż i zakupy w wybranym okresie — podgląd danych demonstracyjnych.',
  skipLink: 'Przejdź do rejestru',
  tabs: 'Rejestr VAT',
  short: { sales: 'Sprzedaż', purchases: 'Zakupy' },
  documents: (count: number) => `Dokumenty ${count}`,
  caption: (title: string, period: string) => `${title}, ${period}. Kwoty w PLN.`,
  settlement: (amount: string, payable: boolean) =>
    `${amount} ${payable ? 'do zapłaty' : 'nadwyżki'}`,
} as const;

/** The balance line and the VAT rates under it. */
export const totalsCopy = {
  summary: 'Podsumowanie rejestru',
  rates: 'Kwoty według stawek VAT',
  /** The phone sheet's short title. */
  ratesShort: 'Stawki VAT',
  ratesList: 'VAT według stawek',
  collapse: 'Zwiń stawki',
  close: 'Zamknij kwoty według stawek',
  ratesUnavailable: 'Stawki będą dostępne po ponownym wczytaniu rejestru.',
  share: 'Udział stawek w podstawie opodatkowania',
  output: 'VAT należny',
  input: '− VAT naliczony',
  due: 'VAT do zapłaty',
  surplus: 'Nadwyżka naliczonego',
  /** JPK_V7M is a monthly return and rounds to whole złoty (Ordynacja podatkowa, art. 63 § 1). */
  declared: 'Kwota do wpłaty w JPK (w pełnych złotych)',
  declaredSurplus: 'Nadwyżka w JPK (w pełnych złotych)',
  noAmounts: 'Brak kwot dla wybranego okresu.',
  settlementList: 'Rozliczenie VAT okresu',
  filteredNote: 'Stawki dla wybranych filtrów, rozliczenie dla całego okresu. ',
  estimateNote: 'Szacunek bez nadwyżki z poprzednich okresów, na danych demonstracyjnych.',
} as const;

/** «Oś rozliczenia», the settlement axis in the period card. */
export const axisCopy = {
  strip: {
    month: 'Miesiąc',
    quarter: 'Kwartał',
    year: 'Miesiące roku',
    range: 'Zakres miesięcy',
  },
  output: 'należny',
  input: 'naliczony',
  due: (amount: string) => `do zapłaty ${amount}`,
  surplus: (amount: string) => `nadwyżka ${amount}`,
  noDocuments: 'brak dokumentów',
  surplusKey: 'nadwyżka',
  describe: (count: number, output: string, input: string, result: string) =>
    `${documentCount(count)}, VAT należny ${output}, VAT naliczony ${input}, ${result}`,
  quarter: (name: string, year: number, description: string) =>
    `${name} kwartał ${year}: ${description}`,
  showMonth: (month: string, year: number, description: string) =>
    `Pokaż ${month} ${year}: ${description}`,
  dragHint:
    'Przeciągnij po osi, aby zaznaczyć kilka miesięcy, albo przesuń zaznaczenie. Shift i strzałki zmieniają długość okresu.',
  resize: 'Przeciągnij, aby zmienić zakres',
} as const;

/** Search, KSeF views, filters and the «more» menu. */
export const toolbarCopy = {
  listActions: 'Działania na liście',
  search: 'Szukaj dokumentów',
  searchHint: 'Szukaj kontrahenta lub dokumentu…',
  /** A phone's search field is narrow: one word fits. */
  searchHintShort: 'Szukaj',
  clearSearch: 'Wyczyść wyszukiwanie',
  /** Matches of the search among the documents the period and filters list: «3 z 14». */
  found: (shown: number, of: number) => `${shown} z ${of}`,
  suggestPrefix: 'Filtruj:',
  suggestions: 'Podpowiedzi filtrów',
  ksefStatus: 'Status KSeF',
  more: 'Więcej działań',
  moreMenu: 'Dodatkowe działania',
  tags: 'Etykiety dokumentów',
  export: 'Eksportuj CSV',
  print: 'Drukuj rejestr',
  columns: 'Ustawienia kolumn',
  exported: (count: number) => `Wyeksportowano ${documentCount(count)} do CSV.`,
  exportFailed: 'Nie udało się pobrać pliku. Spróbuj ponownie.',
} as const;

export const filtersCopy = {
  title: 'Filtry',
  close: 'Zamknij filtry',
  manageSeries: 'Zarządzaj seriami',
  pressAgain: 'Kliknij ponownie, aby usunąć',
  clear: 'Wyczyść filtry',
  clearAll: 'Wyczyść wszystkie',
  remove: (label: string) => `Usuń filtr ${label}`,
  show: (count: number) => `Pokaż ${documentCount(count)}`,
  gtuSalesOnly: 'Kody GTU dotyczą tylko sprzedaży',
  any: 'Wszystkie',
  /** Phones have no table header to sort by, so the filter sheet sorts. */
  sortBy: 'Sortuj według',
  ascending: 'rosnąco',
  descending: 'malejąco',
} as const;

/** Series, columns and labels dialogs. */
export const dialogsCopy = {
  series: {
    title: 'Serie dokumentów',
    description:
      'Nazwy i numeracja serii w tej sesji demonstracyjnej. Zmiany nie modyfikują istniejących dokumentów.',
    prefixRule: 'Od 1 do 12 liter, cyfr lub łączników',
    code: 'Seria',
    name: 'Nazwa serii',
    prefix: 'Prefiks',
    nextNumber: 'Następny numer',
    cancel: 'Anuluj',
    save: 'Zapisz ustawienia',
    saved: 'Zapisano ustawienia serii w tej sesji demo.',
  },
  columns: {
    title: 'Ustawienia kolumn',
    description:
      'Wybierz kolumny widoczne w tabeli i ich kolejność. Dane z ukrytej kolumny pozostają w szczegółach dokumentu.',
    left: (column: string) => `Przesuń ${column} w lewo`,
    right: (column: string) => `Przesuń ${column} w prawo`,
    phoneNote:
      'Na telefonie dokumenty mają układ kart. Kolejność kolumn dotyczy tabeli na większych ekranach.',
    reset: 'Przywróć domyślne',
    done: 'Gotowe',
    restored: 'Przywrócono domyślny układ kolumn.',
  },
  tags: {
    title: 'Etykiety dokumentów',
    description:
      'Oznacz dokument w jego szczegółach. Wybierz etykietę poniżej, aby przefiltrować rejestr.',
  },
} as const;

/** A document: its row, its card, its paper and its sheet. */
export const documentCopy = {
  open: (number: string) => `Otwórz dokument ${number}`,
  toggle: (open: boolean, number: string) => `${open ? 'Zwiń' : 'Rozwiń'} dokument ${number}`,
  details: 'Szczegóły',
  detailsTitle: 'Szczegóły dokumentu',
  series: (series: string) => `Seria dokumentów ${series}`,
  share: (percent: string, sales: boolean, month: string) =>
    `${percent}% VAT ${sales ? 'należnego' : 'naliczonego'} za ${month}`,
  /** A non-taxed (np) correction changes the value, never the VAT. */
  correctionNote: ({
    nonTaxed,
    sales,
    lower,
  }: {
    nonTaxed: boolean;
    sales: boolean;
    lower: boolean;
  }) =>
    nonTaxed
      ? `Korekta transakcji niepodlegającej opodatkowaniu (np): zmienia wartość ${sales ? 'sprzedaży' : 'zakupu'}, nie VAT.`
      : `Korekta ${lower ? 'zmniejsza' : 'zwiększa'} podstawę opodatkowania i VAT.`,
  tagSet: (label: string) => `Ustawiono etykietę: ${label}`,
  tag: (label: string) => `Etykieta: ${label}`,
  tagOf: (number: string) => `Etykieta dokumentu ${number}`,
  tagRestored: (label: string) => `Przywrócono etykietę: ${label}`,
  notePlaceholder: 'Dodaj notatkę do dokumentu',
  note: 'Notatka',
  noteOptional: 'opcjonalnie',
  noteSaved: 'Zapisano',
  paper: (number: string) => `Dokument ${number}`,
  // No break before the count: «· 13» never ends up alone on a line.
  /** «13 dokumentów dla Demo Alfa 01 w 2026»; a purchase comes «od» its supplier. */
  contractorHistory: (count: number, name: string, year: number, sales: boolean) =>
    `${documentCount(count)} ${sales ? 'dla' : 'od'} ${name} w\u00a0${year}`,
  contractorHistoryLabel: (name: string, year: number, count: number) =>
    `Pokaż wszystkie dokumenty kontrahenta ${name} w ${year} (${count})`,
  copyNumber: (number: string) => `Kopiuj numer ${number}`,
  // The demo never pretends to reach KSeF: the check is simulated and says so.
  checkKsef: 'Sprawdź status w KSeF',
  checkKsefDemo: 'W demo status jest symulowany — prototyp nie łączy się z KSeF',
  checkingKsef: 'Sprawdzanie…',
  ksefAssigned: (number: string) => `KSeF nadał numer ${number} (dane demo)`,
  numberName: 'numer dokumentu',
  resizeColumn: (column: string) => `Zmień szerokość kolumny ${column}`,
  resizeHint: 'Przeciągnij, aby zmienić szerokość. Na klawiaturze użyj strzałek.',
  next: 'Następny',
  previous: 'Poprzedni',
  steps: 'Kolejne dokumenty',
  amounts: 'Kwoty dokumentu',
  notes: 'Etykieta i notatka',
  copyIdentifier: 'Kopiuj identyfikator',
  copyKsef: 'Kopiuj numer KSeF',
  ksefNumberName: 'numer KSeF',
  noJpk: 'Brak oznaczenia',
  ksefWay: 'Obieg dokumentu w KSeF',
} as const;

export const pagingCopy = {
  next: 'Następna strona',
  previous: 'Poprzednia strona',
  pageSize: 'Dokumenty na stronie',
  pages: 'Strony rejestru',
  page: (page: number) => `Strona ${page}`,
  pageOf: (page: number, count: number) => `Strona ${page} z ${count}`,
  more: (count: number) => `Pokaż kolejne ${count}`,
} as const;

export const printCopy = {
  period: (from: string, to: string, company: string) => `Okres: ${from} – ${to} · ${company}`,
  unavailable: 'Rejestr niedostępny. Wczytaj dane przed drukowaniem.',
  summary: 'Podsumowanie według stawek',
  printed: (date: string) => `Dane demonstracyjne · wydrukowano ${date}`,
} as const;

/** The guided tour, started on request only («Jak to działa?»). */
export const tourCopy = {
  label: 'Przewodnik po ekranie',
  step: (index: number, total: number) => `${index} z ${total}`,
  next: 'Dalej',
  back: 'Wstecz',
  skip: 'Pomiń',
  done: 'Gotowe',
  steps: {
    period: {
      title: 'Okres',
      desk: 'Kliknij miesiąc na osi albo przeciągnij po niej, aby zaznaczyć kilka. Obok osi: VAT do zapłaty i termin JPK. Strzałki ← → zmieniają miesiąc.',
      phone:
        'Dotknij miesiąca na osi albo przeciągnij po niej palcem, aby zaznaczyć kilka. Kwotę nad osią przesuń w bok, aby zmienić miesiąc. Pod osią: kwartał, rok, zakres.',
    },
    registers: {
      title: 'Dwa rejestry',
      desk: 'Sprzedaż i zakupy z VAT obok siebie. Pod nimi Netto + VAT = Brutto i kwoty według stawek.',
      phone:
        'Sprzedaż i zakupy z VAT obok siebie. Pod nimi Netto + VAT = Brutto i kwoty według stawek.',
    },
    tools: {
      title: 'Szukaj i filtruj',
      desk: 'Szukaj po kontrahencie lub numerze (klawisz /). Wybrane filtry zostają jako etykiety, które usuniesz jednym kliknięciem. Rzadsze działania są pod „⋯”.',
      phone:
        'Szukaj po kontrahencie lub numerze. Wybrane filtry zostają jako etykiety, które usuniesz jednym dotknięciem. Rzadsze działania są pod „⋯”.',
    },
    document: {
      title: 'Dokument',
      desk: 'Kliknij wiersz, aby rozwinąć dokument: strony, kwoty, drogę przez KSeF, etykietę i notatkę.',
      phone:
        'Dotknij dokumentu, aby otworzyć szczegóły. Przesunięcie w bok przechodzi do następnego.',
    },
    demo: {
      title: 'Dane demo',
      desk: 'Tu przełączysz stan danych: pełny rejestr, pusty albo błąd wczytywania z ponowieniem.',
      phone:
        'Tu przełączysz stan danych: pełny rejestr, pusty albo błąd wczytywania z ponowieniem.',
    },
  },
} as const;

/** The bell: VAT context, KSeF, the JPK deadline and the accounting year. */
export const noticesCopy = {
  contextTitle: 'Kontekst VAT wymaga potwierdzenia',
  contextText: 'Dane w rejestrach są demonstracyjne.',
  ksefTitle: (documents: string) => `${ksefCopy.pending} KSeF: ${documents}`,
  // A register with nothing waiting is left out: «zakupy 0» says nothing.
  ksefText: (period: string, sales: number, purchases: number) =>
    `${period} · ${[sales && `sprzedaż ${sales}`, purchases && `zakupy ${purchases}`].filter(Boolean).join(', ')}`,
  jpkTitle: (form: string, month: string) => `${form} za ${month}`,
  jpkText: (date: string) => `Termin złożenia: ${date}`,
  yearTitle: (year: number, status: string) => `Okres księgowy ${year}: ${status}`,
  yearText: 'Potwierdź rok rozliczeniowy przed operacjami księgowymi.',
} as const;

/** How the period's VAT compares with the month before. */
export const changeCopy = {
  same: (when: string) => `Tyle samo co ${when}`,
  moved: (percent: string, less: boolean, when: string) =>
    `o ${percent}% ${less ? 'mniej' : 'więcej'} niż ${when}`,
} as const;
