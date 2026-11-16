import React from 'react';
import type { LookbookDesign } from '../../data/storefront';
import { inr } from '../../utils/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/** The full look: what it is, what it costs to start, how long it takes, and one action. */
export function DesignDetailModal({
  design,
  saved,
  onClose,
  onToggle





}: {design: LookbookDesign | null;saved: boolean;onClose: () => void;onToggle: () => void;}) {
  return <Modal open={!!design} onClose={onClose} title={design?.name ?? ''} size="lg">
      {design && <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <img src={design.image} alt={`${design.name}, ${design.garment.toLowerCase()}`} className="aspect-[4/5] w-full rounded-xl object-cover" />
          <div className="flex flex-col">
            <p className="text-sm text-ink-muted">{design.garment} · {design.occasion}</p>
            <p className="mt-2 font-display text-[28px] font-medium leading-tight">from {inr(design.fromPrice)}</p>
            <p className="mt-1 text-sm text-ink-muted">Ready in about {design.leadDays} days. Final price depends on fabric and work.</p>
            <p className="mt-5 text-[15px] leading-relaxed">{design.description}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-ink-muted">
              {design.details.map((d) => <li key={d}>— {d}</li>)}
            </ul>
            <div className="mt-auto pt-6">
              <Button size="lg" fullWidth variant={saved ? 'secondary' : 'primary'} onClick={onToggle}>
                {saved ? 'Remove from shortlist' : 'Add to shortlist'}
              </Button>
              <p className="mt-2 text-center text-xs text-ink-subtle">Bring your shortlist to a free consultation.</p>
            </div>
          </div>
        </div>}
    </Modal>;
}