import { formatDate, formatMoney } from '@/lib/format';
import { organization } from '@/features/workspace';
import type { RateTotals, Totals } from '../../model/amounts';
import { ksefCopy, printCopy } from '../../copy';
import {
  columnLabels,
  fieldLabels,
  operationLabels,
  registers,
  tagLabels,
} from '../../model/labels';
import { demoToday } from '../../model/period';
import type { RegisterKind, VatDocument } from '../../model/types';
import p from './print-register.module.css';

/**
 * Print-only register on A4 landscape: a heading that says what and when, one row per
 * filtered document with every column of the screen, then the totals per VAT rate.
 * The application chrome is hidden for print; page numbers come from `@page`.
 */
export function PrintRegister({
  kind,
  bounds,
  documents,
  sum,
  rates,
  available,
}: {
  kind: RegisterKind;
  bounds: { from: string; to: string };
  documents: VatDocument[];
  sum: Totals;
  rates: RateTotals[];
  available: boolean;
}) {
  return (
    <div className={p.printContent}>
      <header className={p.head}>
        <h1>{registers[kind].title}</h1>
        <p>{printCopy.period(formatDate(bounds.from), formatDate(bounds.to), organization)}</p>
        <p className={p.meta}>{printCopy.printed(formatDate(demoToday))}</p>
      </header>
      {!available ? (
        <p>{printCopy.unavailable}</p>
      ) : (
        <>
          <table className={p.register}>
            <thead>
              <tr>
                <th>{fieldLabels.ordinal}</th>
                <th>{columnLabels.date}</th>
                <th>{columnLabels.number}</th>
                <th>{columnLabels.contractor}</th>
                <th>{columnLabels.identifier}</th>
                <th>{columnLabels.ksef}</th>
                <th>{fieldLabels.jpkShort}</th>
                <th>{fieldLabels.rate}</th>
                <th className={p.amount}>{fieldLabels.net}</th>
                <th className={p.amount}>{fieldLabels.vat}</th>
                <th className={p.amount}>{fieldLabels.gross}</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={doc.id}>
                  <td>{index + 1}</td>
                  <td>{formatDate(doc.date)}</td>
                  <td>
                    {doc.number}
                    <small>
                      {fieldLabels.series} {doc.series}
                    </small>
                  </td>
                  <td>
                    {doc.contractor}
                    <small>
                      {operationLabels[doc.operation]}
                      {doc.tag ? ` · ${tagLabels[doc.tag]}` : ''}
                      {doc.note ? ` · ${doc.note}` : ''}
                    </small>
                  </td>
                  <td>{doc.identifier}</td>
                  <td className={p.ksef}>{doc.ksef ?? ksefCopy.pending}</td>
                  <td>{doc.jpk || '—'}</td>
                  <td>{doc.rate}</td>
                  <td className={p.amount}>{formatMoney(doc.net)}</td>
                  <td className={p.amount}>{formatMoney(doc.vat)}</td>
                  <td className={p.amount}>{formatMoney(doc.net + doc.vat)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section className={p.summary} aria-label={printCopy.summary}>
            <h2>{printCopy.summary}</h2>
            <table>
              <thead>
                <tr>
                  <th>{fieldLabels.rate}</th>
                  <th className={p.amount}>{fieldLabels.countFull}</th>
                  <th className={p.amount}>{fieldLabels.net}</th>
                  <th className={p.amount}>{fieldLabels.vat}</th>
                  <th className={p.amount}>{fieldLabels.gross}</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((row) => (
                  <tr key={row.rate}>
                    <td>{row.rate}</td>
                    <td className={p.amount}>{row.count}</td>
                    <td className={p.amount}>{formatMoney(row.net)}</td>
                    <td className={p.amount}>{formatMoney(row.vat)}</td>
                    <td className={p.amount}>{formatMoney(row.gross)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{fieldLabels.total}</th>
                  <td className={p.amount}>{documents.length}</td>
                  <td className={p.amount}>{formatMoney(sum.net)}</td>
                  <td className={p.amount}>{formatMoney(sum.vat)}</td>
                  <td className={p.amount}>{formatMoney(sum.gross)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
