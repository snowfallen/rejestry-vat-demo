// Polish copy of the app frame: metadata, the skip link and the fallback pages.

export const appCopy = {
  description: 'Interaktywny prototyp rejestrów VAT. Wyłącznie dane demonstracyjne.',
  shortName: 'Rejestry',
  ogAlt: 'Rejestry i VAT — prototyp ekranu',
  // The share card's font may lack Polish letters: its text has none.
  ogTitle: 'Rejestry i VAT',
  ogLine: 'Okres · Rejestr · Dokumenty',
  ogNote: 'Prototyp na danych demonstracyjnych',
  notFound: {
    title: 'Nie znaleziono strony',
    text: 'Rejestr VAT jest dostępny na stronie głównej.',
    back: 'Przejdź do rejestru',
  },
  error: {
    title: 'Nie udało się otworzyć rejestru',
    text: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
    retry: 'Spróbuj ponownie',
  },
} as const;
