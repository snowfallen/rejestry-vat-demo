'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastRegion, useToast } from '@/components/ui/toast';
import { prefersReducedMotion } from '@/hooks/use-media-query';
import { useScrolledPast } from '@/hooks/use-scrolled-past';
import { formatMoney } from '@/lib/format';
import { withViewTransition } from '@/lib/view-transition';
import { AppHeader, AreaNav, AreaPreview, AreaTabBar, useArea } from '@/features/workspace';
import { cx } from '@/lib/cx';
import { filingDeadline, periodBounds, periodLabel } from '../../model/period';
import type { RegisterSnapshot } from '../../api/types';
import { registerSearch, type RegisterUrlState } from '../../model/url';
import { unconfirmedInMonth } from '../../state/selectors';
import { useRegister } from '../../state/use-register';
import { GuidedTour } from '../guided-tour';
import { PeriodPicker } from '../period-picker';
import { PrintRegister } from '../print-register';
import { RegisterSheet } from '../register-sheet';
import type { ToolAction } from '../toolbar';
import { RegisterControls } from './register-controls';
import { RegisterDialogs } from './register-dialogs';
import { registerNotices } from './register-notices';
import { RegisterResults } from './register-results';
import { registerHeadingId } from './register-heading';
import { RegisterTitle } from './register-title';
import { useCsvExport } from './use-csv-export';
import { useDemoState } from './use-demo-state';
import { useNoticeActions } from './use-notice-actions';
import { useRegisterDialogs } from './use-register-dialogs';
import { registerCopy } from '../../copy';

/** The period's result for the compact title: amount and whether it is due or surplus. */
function settlementText({ kind, amount }: { kind: 'payable' | 'surplus'; amount: number }) {
  return registerCopy.settlement(formatMoney(amount), kind === 'payable');
}

// Okres → Rejestr → Dokumenty. The screen lays the sections out and wires them to the
// register's state; filtering, sums and periods live in the model, each section in
// its own file.
export function RegisterScreen({
  heading,
  initial,
  snapshot,
}: {
  heading: ReactNode;
  /** The register as the server read it for the first frame. */
  snapshot: RegisterSnapshot;
  /** What the address chose: period, register, KSeF view, search. */
  initial?: RegisterUrlState;
}) {
  const register = useRegister(snapshot, initial);
  const { state, dispatch, broken } = register;
  const { kind, period, loading } = state;
  const { ksef, search } = state.criteria;

  // The address follows the register, so a reload keeps it and a link shares it. It is
  // replaced, not pushed: stepping through months must not fill the back button. The
  // demo state written is the one asked for, so a chance failure never sticks to a link.
  const { requested } = state;
  useEffect(() => {
    const next = registerSearch({ kind, period, ksef, search, demo: requested });
    if (next === location.search) return;
    history.replaceState(history.state, '', `${location.pathname}${next}${location.hash}`);
  }, [kind, period, ksef, search, requested]);
  const { area, goTo } = useArea();
  const toast = useToast();
  const dialogs = useRegisterDialogs();
  const demo = useDemoState(register, toast.notify);
  const { resultsRef, onNotice, onMissingKsef } = useNoticeActions(dispatch, () =>
    dialogs.openMap(),
  );
  // Beside the JPK deadline: the sales of the month it is for that still lack a KSeF number.
  const deadline = filingDeadline(period);
  const missingKsef = deadline
    ? unconfirmedInMonth(register.available, deadline.year, deadline.month)
    : 0;
  const csv = useCsvExport(register.sorted, kind, period, toast.notify);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  // The guided tour opens only on request: the header's «?» or the account sheet.
  const [touring, setTouring] = useState(false);
  // Once the large title scrolls under the sticky header, the header shows it.
  const titleHidden = useScrolledPast(registerHeadingId);
  const label = periodLabel(period);

  function print() {
    const open = state.expanded;
    dispatch({ type: 'collapseAll' });
    requestAnimationFrame(() => {
      window.print();
      dispatch({ type: 'restoreExpanded', ids: open });
    });
  }
  // A contractor's history from an opened document: the year, searched by their name,
  // with the list brought into view (the phone sheet closes first).
  function showContractor(contractor: string, year: number) {
    dialogs.closeSheet();
    dispatch({ type: 'contractor', contractor, year });
    requestAnimationFrame(() =>
      document.getElementById('register-panel')?.scrollIntoView({
        block: 'start',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      }),
    );
  }
  function onTool(action: ToolAction) {
    if (action === 'export') csv.download();
    else if (action === 'print') print();
    else dialogs.open(action);
  }

  return (
    <div className="min-h-svh">
      <a className="skip-link" href="#main">
        {registerCopy.skipLink}
      </a>
      <AppHeader
        notices={registerNotices(register.unconfirmedByKind, period)}
        compact={
          titleHidden
            ? {
                title: registerCopy.title,
                detail: label,
                extra: loading || broken ? undefined : settlementText(register.settlement),
              }
            : null
        }
        areas={<AreaNav placement="header" current={area} onSelect={goTo} />}
        onNotice={onNotice}
        onProfile={() => dialogs.open('profile')}
        onHelp={area === 'vat' ? () => setTouring(true) : undefined}
      />

      <main
        id="main"
        className={cx(
          'mx-auto max-w-[1360px] px-[var(--gutter)] pb-10 pt-5',
          'print:hidden',
          'phone:pb-[var(--tab-bar-room)] phone:pt-4',
        )}
      >
        <AreaNav placement="page" current={area} onSelect={goTo} />
        <div style={{ viewTransitionName: 'area' }}>
          {area !== 'vat' ? (
            <AreaPreview
              tab={area}
              onOpenMap={() => dialogs.openMap(area)}
              onBack={() => goTo('vat')}
            />
          ) : (
            <>
              <RegisterTitle
                heading={heading}
                demo={state.demo}
                loading={loading}
                onDemo={demo.choose}
                onOpenMap={() => dialogs.openMap()}
              />
              {/* Period changes skip the view transition: while one runs the browser
                  drops pointer input, and people scan months quickly. */}
              <PeriodPicker
                period={period}
                anchor={state.anchor}
                summaries={register.yearSummary}
                kind={kind}
                state={broken ? 'error' : loading ? 'loading' : 'ready'}
                settlement={register.settlement}
                change={register.settlementChange}
                empty={
                  register.figures.sales.periodCount + register.figures.purchases.periodCount === 0
                }
                onRetry={demo.retry}
                onChange={(next) => dispatch({ type: 'period', period: next })}
                missingKsef={missingKsef}
                onMissingKsef={() => deadline && onMissingKsef(deadline.year, deadline.month)}
              />
              <RegisterSheet
                kind={kind}
                onKind={(next) => withViewTransition(() => dispatch({ type: 'kind', kind: next }))}
                figures={register.figures}
                loading={loading}
                broken={broken}
              >
                {/* A failed register keeps only its tabs: the error comes right under them. */}
                {!broken && (
                  <RegisterControls
                    register={register}
                    exporting={csv.exporting}
                    onExport={csv.download}
                    onTool={onTool}
                    onManageSeries={() => dialogs.open('series')}
                    filterTriggerRef={filterTrigger}
                  />
                )}
                <RegisterResults
                  register={register}
                  resultsRef={resultsRef}
                  activeDocument={dialogs.sheetId}
                  onOpenDocument={dialogs.openSheet}
                  onRetry={demo.retry}
                  onNotify={toast.notify}
                  onShowContractor={showContractor}
                />
              </RegisterSheet>
            </>
          )}
        </div>
      </main>

      <AreaTabBar current={area} onSelect={goTo} onOpenMap={() => dialogs.openMap()} />
      <ToastRegion toast={toast.toast} duration={toast.duration} onDismiss={toast.dismiss} />
      <RegisterDialogs
        register={register}
        dialogs={dialogs}
        filterTriggerRef={filterTrigger}
        onNotify={toast.notify}
        onShowContractor={showContractor}
        onTour={() => {
          goTo('vat');
          setTouring(true);
        }}
      />
      {touring && <GuidedTour onClose={() => setTouring(false)} />}
      <PrintRegister
        kind={kind}
        bounds={periodBounds(period)}
        documents={register.sorted}
        sum={register.sum}
        rates={register.rates}
        available={!broken && !loading}
      />
    </div>
  );
}
