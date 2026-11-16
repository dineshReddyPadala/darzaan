import React, { useState } from 'react';
import { RotateCcwIcon } from 'lucide-react';
import type { QcGarmentState } from '../../hooks/useQcGarment';
import { cn } from '../../utils/cn';
import { fmtDateTime } from '../../utils/format';
import { garmentSpec } from '../../utils/qc';
import { panelClass } from '../../utils/styles';
import { GarmentPhoto } from './QcStatus';

/** Step 1 — one panel: photos on the left, instructions and details on the right on a shared grid. */
export function InspectGarmentStep({
  qc


}: {qc: QcGarmentState;}) {
  const g = qc.garment!;
  const spec = garmentSpec(g);
  const gallery = [...new Set([...g.photos, ...(spec.designImage ? [spec.designImage] : [])])];
  const [photo, setPhoto] = useState(0);
  const last = qc.openRework;
  const rows: [string, string][] = [['Garment', g.subCategory], ['Fabric', spec.fabric], ['Colour', spec.colour], ['Design', spec.design], ['Add-ons', spec.materials.join(', ') || 'None']];
  return <div className="space-y-5">
      <div>
        <h2 className="font-display text-[26px] font-medium leading-tight text-ink">Check the garment</h2>
      </div>

      {last && <div className="flex items-center gap-4 rounded-2xl bg-attention-soft px-5 py-4">
          <RotateCcwIcon className="h-5 w-5 shrink-0 text-attention" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-ink">Back from repair. Last problem: {last.defect.type.toLowerCase()}, {last.defect.location.toLowerCase()}.</p>
            <p className="text-sm text-ink-muted">Fixed by {last.assignee} · {fmtDateTime(last.events[last.events.length - 1].at)}. Check this area closely.</p>
          </div>
          {last.defect.photos[0] && <img src={last.defect.photos[0]} alt="Problem found last time" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
        </div>}

      <section className={cn(panelClass, 'grid overflow-hidden md:grid-cols-[300px_minmax(0,1fr)]')} aria-label="Garment">
        <div className="border-b border-line p-5 md:border-b-0 md:border-r">
          <GarmentPhoto src={gallery[photo]} alt={`${g.subCategory}, photo ${photo + 1}`} className="aspect-[4/5] w-full rounded-xl" />
          {gallery.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2">
              {gallery.map((src, i) => <button key={src} type="button" onClick={() => setPhoto(i)} aria-label={`Show photo ${i + 1}`} className={cn('aspect-square overflow-hidden rounded-lg ring-2 transition-shadow duration-150 ease-out', i === photo ? 'ring-brand' : 'ring-transparent')}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>)}
            </div>}
        </div>

        <div className="flex flex-col">
          <div className="border-b border-line p-5">
            <p className="text-sm font-medium text-ink-muted">Instructions</p>
            <p className="mt-1 text-[17px] leading-relaxed text-ink">{g.notes || 'No special instructions.'}</p>
          </div>
          <dl className="divide-y divide-line">
            {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[120px_minmax(0,1fr)] items-baseline gap-4 px-5 py-3.5 text-[15px]">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>)}
          </dl>
        </div>
      </section>
    </div>;
}