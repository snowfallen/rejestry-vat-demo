'use client';
import type { RefObject } from 'react';
import { cx } from '@/lib/cx';
import { withViewTransition as animate } from '@/lib/view-transition';
import { facetsFor, suggestFacets, type FacetKey } from '../../model/query';
import type { Register } from '../../state/use-register';
import { AppliedFilters, FilterPanel, KsefViews } from '../filters';
import { RegisterTotals } from '../register-totals';
import { Toolbar, ToolsMenu, type ToolAction } from '../toolbar';
import { registerCopy } from '../../copy';

/**
 * Everything between the register tabs and its documents: the balance line, the
 * toolbar (search, KSeF views, filters, export, more) and the applied filters.
 */
export function RegisterControls({
  register,
  exporting,
  onExport,
  onTool,
  onManageSeries,
  filterTriggerRef,
}: {
  register: Register;
  exporting: boolean;
  onExport: () => void;
  onTool: (action: ToolAction) => void;
  onManageSeries: () => void;
  filterTriggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const { state, dispatch } = register;
  const { kind, period, criteria, loading } = state;
  const facets = facetsFor(state.series, kind);
  const canExport = register.filtered.length > 0 && !loading && !register.broken && !exporting;
  const setFacet = (key: FacetKey, value: string) =>
    animate(() => dispatch({ type: 'criterion', key, value }));
  const clearFacets = () => animate(() => dispatch({ type: 'clearFacets' }));
  const setKsef = (value: string) => setFacet('ksef', value);
  const ksefViews = (compact: boolean) => (
    <KsefViews
      compact={compact}
      value={criteria.ksef}
      counts={register.ksefCounts}
      loading={loading}
      onChange={setKsef}
    />
  );

  return (
    <>
      <RegisterTotals
        loading={loading}
        broken={register.broken}
        filtered={register.searching}
        sum={register.sum}
        rates={register.rates}
        settlement={register.settlement}
        outputVat={register.figures.sales.periodVat}
        inputVat={register.figures.purchases.periodVat}
        monthly={period.mode === 'month'}
      />
      <h2 className="sr-only">{registerCopy.documents(register.filtered.length)}</h2>
      <Toolbar
        search={criteria.search}
        onSearch={(value) => dispatch({ type: 'criterion', key: 'search', value })}
        found={{ shown: register.filtered.length, of: register.figures[kind].periodCount }}
        activeFilters={register.facetCount}
        filterTriggerRef={filterTriggerRef}
        filters={(open, close) => (
          <FilterPanel
            open={open}
            onClose={close}
            triggerRef={filterTriggerRef}
            documents={register.available}
            kind={kind}
            period={period}
            criteria={criteria}
            facets={facets}
            resultCount={register.filtered.length}
            onChange={setFacet}
            sort={state.sort}
            onSort={(key) => animate(() => dispatch({ type: 'sort', key }))}
            onReset={clearFacets}
            onManageSeries={() => {
              close();
              onManageSeries();
            }}
          />
        )}
        canExport={canExport}
        exporting={exporting}
        onExport={onExport}
        menu={<ToolsMenu onAction={onTool} canExport={canExport} />}
        views={ksefViews(true)}
        suggestions={suggestFacets(
          criteria.search,
          register.available,
          facetsFor(state.series, kind, true),
          kind,
          period,
          criteria,
        )}
        onSuggestion={({ key, value }) =>
          animate(() => {
            dispatch({ type: 'criterion', key: 'search', value: '' });
            dispatch({ type: 'criterion', key, value });
          })
        }
      />
      <div
        className={cx(
          // Phones: the toolbar above is sticky with its own edge; the row sits midway
          // between that edge and the list.
          '-mt-1 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 px-[var(--inset)] empty:hidden phone:mt-2.5',
          register.facetCount === 0 && 'wide:hidden',
          // Nothing to show (an empty period, no filters): the row takes no room at all.
          register.facetCount === 0 && !register.ksefCounts[''] && !criteria.ksef && 'hidden',
        )}
      >
        <div className="contents wide:hidden">{ksefViews(false)}</div>
        <AppliedFilters
          facets={facets}
          criteria={criteria}
          onRemove={(key) => setFacet(key, '')}
          onClear={clearFacets}
        />
      </div>
    </>
  );
}
