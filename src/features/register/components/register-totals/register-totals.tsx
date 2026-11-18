'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatedMoney } from '@/components/ui/animated-money';
import { Collapsible } from '@/components/ui/collapsible';
import { Dialog } from '@/components/ui/dialog';
import { phoneQuery, useMediaQuery } from '@/hooks/use-media-query';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import { formatMoney, formatMoneyWhole } from '@/lib/format';
import { afterOpening } from '@/lib/reveal';
import type { RateTotals, Totals } from '../../model/amounts';
import t from './register-totals.module.css';
import v from './vat-rates.module.css';
import { totalsCopy } from '../../copy';
import { fieldLabels } from '../../model/labels';

interface RegisterTotalsProps {
  loading: boolean;
  broken: boolean;
  filtered: boolean;
  sum: Totals;
  rates: RateTotals[];
  settlement: { kind: 'payable' | 'surplus'; amount: number };
  outputVat: number;
  inputVat: number;
  /** A single month: the one period a JPK_V7M return, and so its whole-złoty amount, covers. */
  monthly: boolean;
}

const rateTone: Record<string, string> = { '23%': v.rate23, '8%': v.rate8, np: v.rateNp };

// The selected register's balance read as one equation, netto + VAT = brutto, with
// the VAT-rate split beside it. The per-rate table and the period's VAT settlement
// open on request: in the sheet itself on desktop, as a bottom sheet on phones.
export function RegisterTotals({
  loading,
  broken,
  filtered,
  sum,
  rates,
  settlement,
  outputVat,
  inputVat,
  monthly,
}: RegisterTotalsProps) {
  const taxedRates = rates.filter((rate) => rate.vat !== 0).length;
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const phone = useMediaQuery(phoneQuery);
  // On desktop the breakdown is part of the sheet and stays until collapsed (or Escape);
  // on phones it is a native sheet, which closes itself.
  useEffect(() => {
    if (!open || phone) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      close();
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open, phone, close]);
  const base = rates.reduce((total, rate) => total + Math.abs(rate.net), 0) || 1;
  const rateLegend = (rate: RateTotals) => (
    <>
      {rate.vat !== 0 && <span className={cx(v.dot, rateTone[rate.rate])} />}
      <strong>{rate.rate}</strong>
      {/* One taxed rate carries the whole VAT already shown beside it: no repeat. */}
      {taxedRates > 1 && rate.vat !== 0 && formatMoney(rate.vat)}
    </>
  );

  const breakdown = (
    <>
      {broken ? (
        <p>{totalsCopy.ratesUnavailable}</p>
      ) : rates.length ? (
        <>
          <div className={v.share} role="img" aria-label={totalsCopy.share}>
            {rates.map((rate) => (
              <span
                key={rate.rate}
                className={rateTone[rate.rate]}
                style={cssVars({ '--w': `${(Math.abs(rate.net) / base) * 100}%` })}
              />
            ))}
          </div>
          <table>
            <caption className="sr-only">{totalsCopy.rates}</caption>
            <thead>
              <tr>
                <th scope="col">{fieldLabels.rate}</th>
                <th scope="col">{fieldLabels.count}</th>
                <th scope="col">{fieldLabels.net}</th>
                <th scope="col">{fieldLabels.vat}</th>
                <th scope="col">{fieldLabels.gross}</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, index) => (
                <tr key={rate.rate} style={cssVars({ '--i': index })}>
                  <th scope="row">
                    <span className={cx(v.dot, rateTone[rate.rate])} />
                    {rate.rate}
                  </th>
                  <td>{rate.count}</td>
                  <td>{formatMoney(rate.net)}</td>
                  <td>{formatMoney(rate.vat)}</td>
                  <td>{formatMoney(rate.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p>{totalsCopy.noAmounts}</p>
      )}
      {!broken && (
        <dl className={v.settlement} aria-label={totalsCopy.settlementList}>
          <div style={cssVars({ '--i': rates.length })}>
            <dt>{totalsCopy.output}</dt>
            <dd>{formatMoney(outputVat)}</dd>
          </div>
          <div style={cssVars({ '--i': rates.length + 1 })}>
            <dt>{totalsCopy.input}</dt>
            <dd>{formatMoney(inputVat)}</dd>
          </div>
          <div className={v.result} style={cssVars({ '--i': rates.length + 2 })}>
            <dt>{settlement.kind === 'payable' ? totalsCopy.due : totalsCopy.surplus}</dt>
            <dd>{formatMoney(settlement.amount)}</dd>
          </div>
          {/* Only a month has its own return; in a quarter each month rounds separately. */}
          {monthly && (
            <div style={cssVars({ '--i': rates.length + 3 })}>
              <dt>
                {settlement.kind === 'payable' ? totalsCopy.declared : totalsCopy.declaredSurplus}
              </dt>
              <dd>{formatMoneyWhole(settlement.amount)}</dd>
            </div>
          )}
        </dl>
      )}
      <p className={v.note}>
        {filtered ? totalsCopy.filteredNote : ''}
        {totalsCopy.estimateNote}
      </p>
    </>
  );

  return (
    <>
      <section
        className={cx(t.totals, loading && t.loading)}
        aria-label={totalsCopy.summary}
        aria-busy={loading}
      >
        <div className={t.row}>
          <dl className={t.equation}>
            <div>
              <dt>{fieldLabels.net}</dt>
              <dd>
                <AnimatedMoney value={sum.net} unavailable={broken} />
              </dd>
            </div>
            <span className={t.operator} aria-hidden="true">
              +
            </span>
            <div className={t.vat}>
              <dt>VAT</dt>
              <dd>
                <AnimatedMoney value={sum.vat} unavailable={broken} />
              </dd>
            </div>
            <span className={t.operator} aria-hidden="true">
              =
            </span>
            <div>
              <dt>{fieldLabels.gross}</dt>
              <dd>
                <AnimatedMoney value={sum.gross} unavailable={broken} />
              </dd>
            </div>
          </dl>

          <div className={t.rates} data-empty={broken || rates.length === 0 ? '' : undefined}>
            {!broken && rates.length > 0 && (
              // Read out as a list; on desktop it is drawn inside the toggle instead.
              <ul aria-label={totalsCopy.ratesList} className={t.ratesList}>
                {rates.map((rate) => (
                  <li key={rate.rate} className={cx(rate.vat === 0 && t.zero)}>
                    {rateLegend(rate)}
                  </li>
                ))}
              </ul>
            )}
            <button
              ref={toggle}
              type="button"
              className={t.toggle}
              aria-label={open && !phone ? totalsCopy.collapse : totalsCopy.rates}
              aria-expanded={open}
              aria-controls="vat-rates"
              onClick={() => {
                setOpen(!open);
                // Desktop opens the breakdown in place: bring it into view as it opens.
                if (!open && !phone)
                  afterOpening(() => [toggle.current, document.getElementById('vat-rates-region')]);
              }}
            >
              {/* Desktop: the rates and the control that opens them are one thing. */}
              {!broken && rates.length > 0 && (
                <span className={t.legend} aria-hidden="true">
                  {rates.map((rate) => (
                    <span key={rate.rate} className={cx(rate.vat === 0 && t.zero)}>
                      {rateLegend(rate)}
                    </span>
                  ))}
                </span>
              )}
              <span className={t.toggleText}>{open ? totalsCopy.collapse : totalsCopy.rates}</span>
              <ChevronDown size={14} className={cx(open && t.rotated)} />
            </button>
          </div>
        </div>
        <Collapsible id="vat-rates-region" open={open && !phone}>
          <div
            id={phone ? undefined : 'vat-rates'}
            className={cx(v.panel, open && v.panelOpen)}
            role="group"
            aria-label={totalsCopy.rates}
          >
            {phone ? null : breakdown}
          </div>
        </Collapsible>
      </section>
      {open && phone && (
        <Dialog
          variant="sheet"
          title={totalsCopy.ratesShort}
          onClose={close}
          returnFocusRef={toggle}
        >
          <div id="vat-rates" className={cx(v.panel, v.panelOpen)}>
            {breakdown}
          </div>
        </Dialog>
      )}
    </>
  );
}
