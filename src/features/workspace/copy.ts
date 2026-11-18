// Polish interface copy of the workspace around the register: the header, the map
// of areas and the demo account.

export const headerCopy = {
  greeting: 'Witaj,',
  backToTop: 'Wróć na górę strony',
  help: 'Jak to działa? Krótki przewodnik po ekranie',
  notifications: 'Powiadomienia',
  notificationsCount: (count: number) => `Powiadomienia: ${count}`,
  accountOf: (name: string) => `Konto ${name}`,
  areas: 'Obszary',
  home: 'onsaldo — strona główna',
  account: 'Konto użytkownika',
  theme: (dark: boolean) => (dark ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'),
} as const;

export const areasCopy = {
  title: 'Obszary księgowe',
  kicker: 'Ewidencje',
  description: 'Mapa dostępnych obszarów księgowych dla aktywnej organizacji.',
  ready: 'Dostępne w demo',
  needsSetup: 'Wymagają konfiguracji',
  accountingPeriod: 'Okres księgowy',
  availability: 'Dostępność obszarów',
  availabilityNote:
    'Status pokazuje gotowość warunków, ale nie uruchamia księgowania ani operacji zewnętrznych.',
  backToRegister: 'Wróć do rejestru',
  /** The tab bar's short names. */
  short: { vat: 'Rejestry', postings: 'Księgowania', assets: 'Majątek', controls: 'Kontrole' },
  preview: {
    needed: 'Co jest potrzebne',
    confirmYear: (year: number) => `Potwierdź okres księgowy ${year}`,
    openMap: 'Otwórz mapę obszarów',
    back: 'Wróć do Rejestrów i VAT',
  },
} as const;

export const profileCopy = {
  title: 'Konto użytkownika',
  account: 'konto demonstracyjne',
  note: 'Zmiany etykiet, notatek i serii są przechowywane wyłącznie do odświeżenia strony. Prototyp nie łączy się z systemem księgowym ani KSeF.',
  back: 'Wróć do rejestru',
  tour: 'Jak to działa? Krótki przewodnik',
  theme: 'Motyw',
  themes: { light: 'Jasny', dark: 'Ciemny' },
} as const;
