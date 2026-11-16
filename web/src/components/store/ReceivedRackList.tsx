import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangleIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useStore } from '../../contexts/StoreContext';
import { RACK_SPOTS } from '../../data/store';
import { cn } from '../../utils/cn';
import { deriveStatus } from '../../utils/orders';
import { stageOwnerLabel } from '../../utils/roles';
import { inputClass, panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { PhotoCapture } from '../ui/PhotoCapture';
import { Segmented } from '../ui/Segmented';
type ProblemKind = 'Missed at QC' | 'Damaged in transit';

/** After a receipt: give every garment a rack spot, or flag one that came out of the bag wrong. */
export function ReceivedRackList({
  tags


}: {tags: string[];}) {
  const {
    getOrder,
    updateOrder,
    logActivity,
    notify
  } = useApp();
  const {
    rackFor,
    setRack,
    isFloor
  } = useStore();
  const [problemTag, setProblemTag] = useState<string | null>(null);
  const [kind, setKind] = useState<ProblemKind>('Missed at QC');
  const [photos, setPhotos] = useState<string[]>([]);
  const [flagged, setFlagged] = useState<string[]>([]);
  const rows = tags.map((tag) => {
    const [p, n, gid] = tag.split('-');
    const o = getOrder(`${p}-${n}`);
    const g = o?.garments.find((x) => x.id === gid);
    return o && g && g.stage === 'store' ? {
      tag,
      o,
      g
    } : null;
  }).filter((r): r is NonNullable<typeof r> => !!r);
  if (!rows.length || !isFloor) return null;
  const report = (tag: string) => {
    const row = rows.find((r) => r.tag === tag);
    if (!row || !photos.length) return;
    const ok = updateOrder(row.o.id, (x) => {
      const updated = {
        ...x,
        garments: x.garments.map((y) => y.id === row.g.id ? {
          ...y,
          stage: 'finishing' as const,
          assignee: undefined
        } : y),
        risk: {
          severity: 'warning' as const,
          message: `${row.g.subCategory} returned from store — ${kind.toLowerCase()}`,
          owner: x.productionOwner
        }
      };
      return {
        ...updated,
        status: deriveStatus(updated)
      };
    });
    if (!ok) return;
    logActivity(row.o.id, `${row.g.subCategory} flagged when unbagged (${kind}, photo) — returned to ${stageOwnerLabel('finishing')} with priority`, kind === 'Missed at QC' ? 'qc' : 'logistics');
    notify({
      category: 'Production',
      severity: 'warning',
      title: `${kind}: ${row.g.subCategory}`,
      body: `${row.o.id} · flagged at the store when unbagged. Back to finishing with priority.`,
      orderId: row.o.id
    });
    toast.success('Sent back with priority', {
      description: 'Workshop and Production Head told.'
    });
    setFlagged((f) => [...f, tag]);
    setProblemTag(null);
    setPhotos([]);
  };
  return <section className={cn(panelClass, 'mt-6 p-5')} aria-labelledby="rack-h">
      <h3 id="rack-h" className="text-[16px] font-semibold">Put each garment on the rack</h3>
      <ul className="divide-y divide-line">
        {rows.filter((r) => !flagged.includes(r.tag)).map(({
        tag,
        o,
        g
      }) => <li key={tag} className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">{g.subCategory}</p>
                <p className="font-mono text-xs text-ink-subtle">{o.id}</p>
              </div>
              <select aria-label={`Rack spot for ${g.subCategory}`} value={rackFor(o.id, g.id)} onChange={(e) => setRack(o.id, g.id, e.target.value)} className={cn(inputClass, 'h-10 w-32')}>
                {RACK_SPOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button size="sm" variant="ghost" icon={<AlertTriangleIcon className="h-4 w-4" />} onClick={() => setProblemTag(problemTag === tag ? null : tag)}>Problem</Button>
            </div>
            {problemTag === tag && <div className="mt-3 space-y-3 rounded-xl bg-canvas p-4">
                <Segmented fullWidth value={kind} onChange={setKind} options={[{
            value: 'Missed at QC',
            label: 'Wrong / defect'
          }, {
            value: 'Damaged in transit',
            label: 'Damaged in transit'
          }]} />
                <PhotoCapture photos={photos} onChange={setPhotos} label="Photo of the problem" />
                <Button fullWidth disabled={!photos.length} onClick={() => report(tag)}>{photos.length ? 'Send back with priority' : 'Add a photo to send back'}</Button>
              </div>}
          </li>)}
      </ul>
    </section>;
}