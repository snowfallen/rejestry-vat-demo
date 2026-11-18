'use client';
import type { RefObject } from 'react';
import { Collapsible } from '@/components/ui/collapsible';
import type { Notify } from '@/components/ui/toast';
import { withViewTransition as animate } from '@/lib/view-transition';
import { registers } from '../../model/labels';
import {
  monthGenitive,
  monthLocative,
  periodLabel,
  periodPhrase,
  periodSlug,
  periodYear,
} from '../../model/period';
import type { DocumentPatch, VatDocument } from '../../model/types';
import type { Register } from '../../state/use-register';
import {
  DocumentCards,
  DocumentDetails,
  DocumentsTable,
  EmptyPeriod,
  ErrorState,
  LoadingRows,
  NoResults,
  Pagination,
  ShowMore,
} from '../documents';
import { registerCopy, stateCopy } from '../../copy';

/**
 * The documents in whatever state the register is in: loading rows, the error, an
 * empty period or search, or the list (a table on desktop, rows on phones) with its
 * footer. A screen reader hears what was found.
 */
export function RegisterResults({
  register,
  resultsRef,
  activeDocument,
  onOpenDocument,
  onRetry,
  onNotify,
  onShowContractor,
}: {
  register: Register;
  resultsRef: RefObject<HTMLDivElement | null>;
  /** The document open in the phone sheet. */
  activeDocument: string | null;
  onOpenDocument: (id: string) => void;
  onRetry: () => void;
  onNotify: Notify;
  onShowContractor: (contractor: string, year: number) => void;
}) {
  const { state, dispatch, broken } = register;
  const { kind, period, criteria, loading } = state;
  const listed = !loading && !broken && register.filtered.length > 0;
  const update = (id: string, patch: DocumentPatch) =>
    dispatch({ type: 'updateDocument', id, patch });
  const toggleMonth = (month: string) => dispatch({ type: 'toggleMonth', month });

  function renderDetails(doc: VatDocument, open: boolean) {
    return (
      <Collapsible id={`details-${doc.id}-table`} open={open}>
        <DocumentDetails
          doc={doc}
          documents={register.available}
          layout="table"
          open={open}
          onUpdate={update}
          onNotify={onNotify}
          onShowContractor={onShowContractor}
        />
      </Collapsible>
    );
  }

  function content() {
    if (loading) return <LoadingRows />;
    if (broken)
      return (
        // Phones say it in the hero card above, with its own retry.
        <div className="phone:hidden">
          <ErrorState onRetry={onRetry} />
        </div>
      );
    if (!listed) {
      if (register.searching)
        return <NoResults onClear={() => dispatch({ type: 'clearCriteria' })} />;
      const { nearest } = register;
      return (
        <EmptyPeriod
          title={
            period.mode === 'month'
              ? stateCopy.emptyMonth(monthLocative[period.month - 1], period.year)
              : stateCopy.emptyRange(periodPhrase(period))
          }
          text={stateCopy.emptyText(registers[kind].genitive, periodPhrase(period))}
          nearest={
            nearest?.mode === 'month'
              ? stateCopy.nearest(
                  `${monthGenitive[nearest.month - 1]}${nearest.year !== periodYear(period) ? ` ${nearest.year}` : ''}`,
                  register.nearestCount,
                )
              : null
          }
          onNearest={() => nearest && dispatch({ type: 'period', period: nearest })}
          onExample={() => {
            dispatch({ type: 'showExample' });
            if (state.demo !== 'populated') register.reload();
          }}
        />
      );
    }
    return (
      <>
        <DocumentsTable
          documents={register.visible}
          columns={state.columns}
          widths={state.widths}
          sort={state.sort}
          expanded={state.expanded}
          query={criteria.search}
          caption={registerCopy.caption(registers[kind].title, periodLabel(period))}
          monthTotals={register.monthTotals}
          collapsedMonths={state.collapsedMonths}
          onToggleMonth={toggleMonth}
          onSort={(key) => animate(() => dispatch({ type: 'sort', key }))}
          onToggle={(id) => dispatch({ type: 'toggleRow', id })}
          onResize={(key, width) => dispatch({ type: 'resizeColumn', key, width })}
          onMoveColumn={(key, to) => dispatch({ type: 'moveColumn', key, to })}
          details={renderDetails}
          onUpdate={update}
          onNotify={onNotify}
        />
        <DocumentCards
          documents={register.shown}
          appendedFrom={
            register.currentPage > 1 ? (register.currentPage - 1) * state.pageSize : Infinity
          }
          active={activeDocument}
          query={criteria.search}
          monthTotals={register.monthTotals}
          collapsedMonths={state.collapsedMonths}
          onToggleMonth={toggleMonth}
          onOpen={onOpenDocument}
        />
      </>
    );
  }

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {loading
          ? stateCopy.loadingRegister
          : broken
            ? stateCopy.failedDocuments
            : stateCopy.found(register.filtered.length, register.currentPage, register.pageCount)}
      </div>
      <div
        ref={resultsRef}
        key={periodSlug(period)}
        aria-busy={loading}
        className="min-h-[200px] animate-[periodIn_280ms_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:animate-none"
      >
        {content()}
      </div>
      {/* Both footers render; CSS picks one, so a phone's server frame never shows
          desktop paging. */}
      {listed && (
        <ShowMore
          className="desk:hidden"
          shown={register.shownCount}
          next={register.moreCount}
          total={register.filtered.length}
          pageSize={state.pageSize}
          onMore={() => dispatch({ type: 'page', page: register.currentPage + 1 })}
          onPageSize={(size) => dispatch({ type: 'pageSize', size })}
        />
      )}
      {listed && (
        <Pagination
          className="phone:hidden"
          page={register.currentPage}
          pageCount={register.pageCount}
          pageSize={state.pageSize}
          range={register.range}
          total={register.filtered.length}
          onPage={(page) => dispatch({ type: 'page', page })}
          onPageSize={(size) => dispatch({ type: 'pageSize', size })}
        />
      )}
    </>
  );
}
