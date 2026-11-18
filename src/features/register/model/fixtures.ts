import type { DocumentSeries, RegisterKind, VatDocument, VatRate } from './types';

// Demonstration data only. October 2026 reproduces the reference screen exactly
// (9700 / 2323 / 12 023 PLN); the rest of 2026 gives the year a realistic rhythm.

const octoberNet = [
  120000, 85000, -40000, 65000, 95000, 70000, 60000, 45000, 80000, 50000, 55000, 40000, 45000,
  200000,
];

const party = (kind: RegisterKind) => (kind === 'sales' ? 'Alfa' : 'Beta');
const letter = (kind: RegisterKind) => (kind === 'sales' ? 'S' : 'Z');
const pad = (value: number) => String(value).padStart(2, '0');

/** Our tax number in the demo: 1111111111, the well-known placeholder NIP. */
export const demoNip = '1111111111';

const nipWeights = [6, 5, 7, 2, 3, 4, 5, 6, 7];

/**
 * A supplier's tax number. Placeholder: it fails the NIP checksum on purpose (the last
 * digit is one past the check digit), so it can never belong to a real company.
 */
export function supplierNip(supplier: number): string {
  const digits = `52${String(supplier * 7919 + 1000003)
    .padStart(7, '0')
    .slice(-7)}`;
  const check = nipWeights.reduce((sum, weight, i) => sum + weight * Number(digits[i]), 0) % 11;
  return `${digits}${(check + 1) % 10}`;
}

/**
 * A KSeF number: the seller's NIP, the issue date, 12 hex and 2 hex. On a sale the
 * seller is us; on a purchase it is the supplier.
 */
export function ksefNumber(date: string, seed: number, nip = demoNip): string {
  const hex = (value: number, length: number) =>
    (value >>> 0).toString(16).toUpperCase().padStart(length, '0').slice(-length);
  const mixed = Math.imul(seed + 1, 2654435761);
  return `${nip}-${date.replaceAll('-', '')}-${hex(mixed, 8)}${hex(seed * 40503, 4)}-${hex(mixed >>> 3, 2)}`;
}

/**
 * Unconfirmed in KSeF: only the newest sales of a month, the way a real register looks.
 * Purchase invoices are received through KSeF, so they always carry its number; only
 * sales can wait for one.
 */
const pendingPerMonth: Record<RegisterKind, Record<number, number>> = {
  sales: { 8: 1, 9: 2, 10: 4, 11: 3 },
  purchases: {},
};
const isPending = (kind: RegisterKind, month: number, n: number, count: number) =>
  n > count - (pendingPerMonth[kind][month] ?? 0);

const jpkCode = (i: number) => (i % 3 === 0 ? 'GTU_12' : i % 3 === 1 ? 'GTU_06' : '');

function octoberSales(): VatDocument[] {
  return octoberNet.map((net, i): VatDocument => {
    const n = i + 1;
    const correction = i === 2;
    const series = correction ? 'KOR' : 'FV';
    const date = `2026-10-${pad(n)}`;
    return {
      id: `sales-${n}`,
      kind: 'sales',
      contractor: `Demo Alfa ${pad(n)}`,
      date,
      number: `${series}/${n}/10/2026/DEMO`,
      ksef: isPending('sales', 10, n, octoberNet.length) ? null : ksefNumber(date, n * 31),
      identifier: `DEMO-S-${n}`,
      operation: correction ? 'correction' : 'invoice',
      jpk: correction ? '' : jpkCode(i),
      series,
      net,
      vat: correction ? 0 : Math.round((net * 23) / 100),
      rate: correction ? 'np' : '23%',
      tag: '',
      note: '',
    };
  });
}

/** October purchases: fewer documents than sales, mostly 23%, one non-taxed correction. */
const octoberPurchaseLines: { net: number; rate: VatRate; day: number }[] = [
  { net: 180000, rate: '23%', day: 2 },
  { net: 95000, rate: '23%', day: 5 },
  { net: -20000, rate: 'np', day: 7 },
  { net: 120000, rate: '23%', day: 9 },
  { net: 42000, rate: '8%', day: 12 },
  { net: 60000, rate: '23%', day: 15 },
  { net: 35000, rate: '8%', day: 19 },
  { net: 70000, rate: '23%', day: 23 },
  { net: 30000, rate: '23%', day: 28 },
];

/**
 * A purchase carries its supplier's own number; each supplier numbers its way. The
 * internal series (FZ or KOR) is kept in `series`. `supplier` picks the format, `seq`
 * is the supplier's running number.
 */
export function supplierNumber(
  supplier: number,
  date: string,
  seq: number,
  correction: boolean,
): string {
  const [year, month] = date.split('-');
  const four = String(seq).padStart(4, '0');
  if (correction)
    return supplier % 2 ? `FK/${year}/${month}/${four}` : `KOR/${seq}/${month}/${year}`;
  switch (supplier % 4) {
    case 0:
      return `FS/${year}/${month}/${four}`;
    case 1:
      return `${seq}/${month}/${year}`;
    case 2:
      return `FV ${year}/${four}`;
    default:
      return `F/${four}/${year.slice(2)}`;
  }
}

const ratePercent = { '23%': 23, '8%': 8, np: 0 } satisfies Record<VatRate, number>;

function octoberPurchases(): VatDocument[] {
  return octoberPurchaseLines.map(({ net, rate, day }, i): VatDocument => {
    const n = i + 1;
    const correction = rate === 'np';
    const series = correction ? 'KOR' : 'FZ';
    const date = `2026-10-${pad(day)}`;
    return {
      id: `purchases-${n}`,
      kind: 'purchases',
      contractor: `Demo Beta ${pad(n)}`,
      date,
      number: supplierNumber(n, date, 140 + n * 13, correction),
      ksef: isPending('purchases', 10, n, octoberPurchaseLines.length)
        ? null
        : ksefNumber(date, n * 31 + 17, supplierNip(n)),
      identifier: `DEMO-Z-${n}`,
      operation: correction ? 'correction' : 'invoice',
      // GTU codes mark sales only; the purchase register has none.
      jpk: '',
      series,
      net,
      // `|| 0`: a non-taxed correction has no VAT, not minus zero.
      vat: Math.round((net * ratePercent[rate]) / 100) || 0,
      rate,
      tag: '',
      note: '',
    };
  });
}

// Documents per month. November is the current month and still filling up;
// December has no documents yet, which is the register's genuine empty state.
const documentsPerMonth: Record<RegisterKind, Record<number, number>> = {
  sales: { 1: 11, 2: 12, 3: 12, 4: 15, 5: 13, 6: 16, 7: 10, 8: 9, 9: 13, 11: 6 },
  purchases: { 1: 7, 2: 8, 3: 9, 4: 9, 5: 8, 6: 11, 7: 6, 8: 6, 9: 8, 11: 4 },
};

/** Purchases are smaller than sales, so input VAT stays a realistic share of output VAT. */
const purchaseScale = 0.75;

function yearDocuments(kind: RegisterKind): VatDocument[] {
  return Object.entries(documentsPerMonth[kind]).flatMap(([key, count]) => {
    const month = Number(key);
    return Array.from({ length: count }, (_, i): VatDocument => {
      const n = i + 1;
      const sales = kind === 'sales';
      const seed = (month * 104729 + n * 7919 + (sales ? 0 : 3571)) % 997;
      const correction = n === 3 && month % 3 === 0;
      const reduced = !correction && (sales ? seed % 5 === 0 : n % 4 === 0);
      const base = (25000 + (seed % 160) * 1250) * (sales ? 1 : purchaseScale);
      // June: one large purchase (equipment) leaves a surplus of input VAT.
      const large = !sales && month === 6 && n === 1 ? 7 : 1;
      const net = Math.round(correction ? -base / 4 : base * large);
      const percent = correction ? 0 : reduced ? 8 : 23;
      const series = correction ? 'KOR' : sales ? 'FV' : 'FZ';
      const days = month === 11 ? 14 : 28;
      const day = 1 + Math.floor((i * days) / count);
      const date = `2026-${pad(month)}-${pad(day)}`;
      return {
        id: `${kind}-${pad(month)}-${n}`,
        kind,
        contractor: `Demo ${party(kind)} ${pad((i % 14) + 1)}`,
        date,
        number: sales
          ? `${series}/${n}/${pad(month)}/2026/DEMO`
          : supplierNumber((i % 14) + 1, date, 100 + ((seed * 7) % 900), correction),
        ksef: isPending(kind, month, n, count)
          ? null
          : ksefNumber(date, seed * 31 + n, sales ? demoNip : supplierNip((i % 14) + 1)),
        identifier: `DEMO-${letter(kind)}-${pad(month)}${pad(n)}`,
        operation: correction ? 'correction' : 'invoice',
        jpk: correction || !sales ? '' : jpkCode(seed),
        series,
        net,
        vat: Math.round((net * percent) / 100) || 0,
        rate: correction ? 'np' : percent === 8 ? '8%' : '23%',
        tag: '',
        note: '',
      };
    });
  });
}

export function createDocuments(): VatDocument[] {
  return [
    ...octoberSales(),
    ...octoberPurchases(),
    ...yearDocuments('sales'),
    ...yearDocuments('purchases'),
  ];
}

export const defaultSeries: DocumentSeries[] = [
  { id: 'FV', name: 'Faktury sprzedaży', prefix: 'FV', next: '15' },
  { id: 'FZ', name: 'Faktury zakupu', prefix: 'FZ', next: '10' },
  { id: 'KOR', name: 'Korekty', prefix: 'KOR', next: '4' },
];
