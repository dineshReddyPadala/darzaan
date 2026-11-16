import React from 'react';
import { useQc } from '../../contexts/QcContext';
import type { Order } from '../../types';
import { defectsByWorker, firstPassRate } from '../../utils/qc';
import { panelClass } from '../../utils/styles';

/** Quality numbers that come from the live QC log: first-time pass, per-worker defects, QC misses. */
export function QualityByWorker({
  orders


}: {orders: Order[];}) {
  const {
    issues
  } = useQc();
  const rows = defectsByWorker(issues);
  const missed = issues.filter((i) => i.defectType?.startsWith('Missed at QC'));
  const reworked = issues.filter((i) => i.reworkMins > 0);
  const avgRework = reworked.length ? Math.round(reworked.reduce((s, i) => s + i.reworkMins, 0) / reworked.length) : 0;
  const fixedHere = issues.filter((i) => i.fixedAtQc).length;
  const headline = [{
    label: 'First-time pass',
    value: `${firstPassRate(orders, issues)}%`
  }, {
    label: 'Average rework',
    value: avgRework ? `${avgRework} min` : '—'
  }, {
    label: 'Fixed at QC',
    value: String(fixedHere)
  }, {
    label: 'Missed by QC',
    value: String(missed.length)
  }];
  return <section className={`${panelClass} lg:col-span-2`}>
      <h3 className="border-b border-line px-5 py-4 text-[16px] font-semibold">Defects by worker</h3>
      <dl className="grid grid-cols-2 divide-line border-b border-line md:grid-cols-4 md:divide-x">
        {headline.map((h) => <div key={h.label} className="px-5 py-4">
            <dt className="text-sm text-ink-muted">{h.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular">{h.value}</dd>
          </div>)}
      </dl>
      <div className="hidden grid-cols-[minmax(0,1fr)_100px_110px_110px] gap-4 border-b border-line px-5 py-3 text-xs font-semibold text-ink-subtle md:grid">
        <span>Worker</span><span className="text-right">Defects</span><span className="text-right">Fixed at QC</span><span className="text-right">Rework time</span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => <li key={r.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 md:grid-cols-[minmax(0,1fr)_100px_110px_110px] md:gap-4">
            <div>
              <p className="text-[15px] font-medium">{r.name}</p>
              <p className="text-sm text-ink-subtle">{r.station}</p>
            </div>
            <p className="text-right text-[15px] font-semibold tabular">{r.defects}</p>
            <p className="hidden text-right text-[15px] tabular text-ink-muted md:block">{r.fixedAtQc}</p>
            <p className="hidden text-right text-[15px] tabular text-ink-muted md:block">{r.reworkMins ? `${r.reworkMins} min` : '—'}</p>
          </li>)}
      </ul>
      {missed.length > 0 && <p className="border-t border-line px-5 py-3 text-sm text-ink-muted">
          Missed by QC: {missed.map((m) => `${m.orderId} — ${m.issue}`).join('; ')}. Traced back to the QC check that passed it.
        </p>}
    </section>;
}