import React from 'react';
import type { QcGarmentState } from '../../hooks/useQcGarment';
import { cn } from '../../utils/cn';
import type { MeasureFinding } from '../../utils/qc';
import { panelClass } from '../../utils/styles';
import { Badge } from '../ui/Badge';
import { MeasureGrid, PhotoButton, PhotoStrip } from './QcInputs';

/** Step 2 — type what you measure. The result works itself out from the numbers. */
export function InspectMeasureStep({
  qc,
  findings,
  verdict,
  tolerance





}: {qc: QcGarmentState;findings: MeasureFinding[];verdict: 'pass' | 'fail' | null;tolerance: number;}) {
  const photos = qc.draft.photos.measurements ?? [];
  const done = findings.filter((f) => f.state !== 'empty').length;
  const setActual = (name: string, v: string) => qc.setDraft((d) => ({
    ...d,
    actuals: {
      ...d.actuals,
      [name]: v
    }
  }));
  const setPhotos = (p: string[]) => qc.setDraft((d) => ({
    ...d,
    photos: {
      ...d.photos,
      measurements: p
    }
  }));
  return <div className="space-y-5">
      <div>
        <h2 className="font-display text-[26px] font-medium leading-tight text-ink">Check the measurements</h2>
        <p className="mt-1 text-[16px] text-ink-muted">Measure the garment and type each size in inches. A difference of up to {tolerance}″ is OK.</p>
      </div>

      {findings.length === 0 ? <p className={cn(panelClass, 'px-5 py-8 text-center text-ink-muted')}>This garment has no sizes to check. Continue to the next step.</p> : <section className={cn(panelClass, 'p-5')} aria-label="Measurements">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="flex-1 text-[15px] text-ink-muted"><span className="tabular font-semibold text-ink">{done} of {findings.length}</span> measured</p>
            {verdict === 'pass' && <Badge tone="success" size="md" dot>All sizes OK</Badge>}
            {verdict === 'fail' && <Badge tone="critical" size="md" dot>Some sizes are off</Badge>}
            <PhotoButton photos={photos} onChange={setPhotos} label="Measurements" />
          </div>
          <MeasureGrid findings={findings} actuals={qc.draft.actuals ?? {}} onChange={setActual} />
          {photos.length > 0 && <div className="mt-4"><PhotoStrip photos={photos} onChange={setPhotos} label="Measurements" /></div>}
        </section>}
    </div>;
}