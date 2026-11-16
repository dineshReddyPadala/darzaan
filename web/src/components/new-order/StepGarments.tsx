import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import type { NewOrderState } from '../../hooks/useNewOrder';
import { GarmentCard } from './garment/GarmentCard';

/** One expandable card per garment, holding everything about that garment. One card open at a time. */
export function StepGarments({
  o


}: {o: NewOrderState;}) {
  const [openId, setOpenId] = useState<string | null>(o.activeId);
  const open = (id: string) => {
    setOpenId(id);
    o.setActiveId(id);
  };
  return <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Garments</h2>
        <button type="button" onClick={() => open(o.addGarment())} className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold text-brand ring-1 ring-inset ring-brand transition-colors duration-150 ease-out hover:bg-brand-soft">
          Add garment <PlusIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="space-y-4">
        {o.garments.map((g, i) => <GarmentCard key={g.id} o={o} g={g} index={i} open={openId === g.id} onToggle={() => openId === g.id ? setOpenId(null) : open(g.id)} onDuplicate={() => {
        const id = o.duplicateGarment(g.id);
        if (id) open(id);
      }} />)}
      </div>
    </div>;
}