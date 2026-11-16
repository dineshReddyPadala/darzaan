import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon } from 'lucide-react';
import { samplers } from '../../../data/catalog';
import type { NewOrderState } from '../../../hooks/useNewOrder';
import type { EmbroiderySelection, Garment, SketchVersion } from '../../../types';
import { inr, nowIso, uid } from '../../../utils/format';
import { inputClass } from '../../../utils/styles';
import { Button } from '../../ui/Button';
import { PhotoCapture } from '../../ui/PhotoCapture';
import { Segmented } from '../../ui/Segmented';
import { DesignPriceStatus } from '../DesignPriceStatus';
import { ScanQrPanel } from '../ScanQrPanel';

/** Embroidery for one garment: none, scanned from the sampler, or a custom design priced by the workshop. */
export function DesignSection({
  o,
  g



}: {o: NewOrderState;g: Garment;}) {
  const setEmb = (patch: Partial<EmbroiderySelection>) => o.updateGarment(g.id, (x) => ({
    ...x,
    embroidery: {
      ...x.embroidery,
      ...patch
    }
  }));
  const setMode = (mode: EmbroiderySelection['mode']) => {
    setEmb({
      mode
    });
    if (mode !== 'Custom' && g.customQuote) o.cancelCustomPrice(g.id);
  };
  const picked = samplers.find((s) => s.id === g.embroidery.samplerId);
  const scan = () => {
    const s = samplers.find((x) => x.id !== g.embroidery.samplerId) ?? samplers[0];
    setEmb({
      samplerId: s.id
    });
    toast.success(`Scanned ${s.id} — ${s.name}`);
  };
  return <div className="space-y-4">
      <Segmented value={g.embroidery.mode} onChange={setMode} options={[{
      value: 'None',
      label: 'No embroidery'
    }, {
      value: 'Sampler',
      label: 'From sampler'
    }, {
      value: 'Custom',
      label: 'Custom design'
    }]} />
      {g.embroidery.mode === 'Sampler' && <ScanQrPanel title="Scan sampler QR" hint="Scan the tag on the sampler." onScan={scan} picked={picked && {
      id: picked.id,
      name: picked.name,
      detail: inr(picked.price),
      color: picked.color
    }} />}
      {g.embroidery.mode === 'Custom' && <CustomDesign o={o} g={g} setEmb={setEmb} />}
      {g.embroidery.mode !== 'None' && <input value={g.embroidery.placement ?? ''} onChange={(e) => setEmb({
      placement: e.target.value
    })} placeholder="Placement, e.g. yoke and sleeve hem" className={inputClass} aria-label="Placement" />}
    </div>;
}
function CustomDesign({
  o,
  g,
  setEmb




}: {o: NewOrderState;g: Garment;setEmb: (p: Partial<EmbroiderySelection>) => void;}) {
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const design = g.embroidery.versions[g.embroidery.versions.length - 1];
  const save = () => {
    const v: SketchVersion = {
      id: uid('SK'),
      label: 'Custom design',
      note: note.trim() || 'Designer sketch',
      at: nowIso(),
      status: 'Approved',
      image: photos[0]
    };
    setEmb({
      versions: [v],
      approvedVersionId: v.id
    });
    setNote('');
    setPhotos([]);
  };
  return <div className="space-y-3">
      {design ? <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sunken text-xs text-ink-subtle">
            {design.image ? <img src={design.image} alt="Custom design sketch" className="h-full w-full object-cover" /> : 'Sketch'}
          </span>
          <p className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[15px] font-semibold"><CheckIcon className="h-4 w-4 text-success" strokeWidth={3} />Design saved</span>
            <span className="block truncate text-sm text-ink-muted">{design.note}</span>
          </p>
          <Button variant="ghost" onClick={() => {
        if (g.customQuote) o.cancelCustomPrice(g.id);
        setEmb({
          versions: [],
          approvedVersionId: undefined
        });
      }}>Replace</Button>
        </div> : <div className="flex flex-col gap-3 rounded-xl bg-canvas p-4 md:flex-row md:items-start">
          <PhotoCapture photos={photos} onChange={setPhotos} label="Sketch or reference" />
          <div className="flex flex-1 flex-col gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motif, colours, where it goes" className={inputClass} aria-label="Design description" />
            <Button onClick={save} className="self-start" disabled={!photos.length && !note.trim()}>Save design</Button>
          </div>
        </div>}
      <DesignPriceStatus g={g} hasDesign={!!design} canEdit={o.canEditPrice} onAsk={() => o.requestCustomPrice(g.id)} onReconfirm={() => o.requestCustomPrice(g.id, true)} onEdit={(n) => o.editCustomPrice(g.id, n)} onDiscount={(p) => o.setDesignDiscount(g.id, p)} />
    </div>;
}