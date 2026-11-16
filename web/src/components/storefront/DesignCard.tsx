import React from 'react';
import { HeartIcon } from 'lucide-react';
import type { LookbookDesign } from '../../data/storefront';
import { cn } from '../../utils/cn';
import { inr } from '../../utils/format';

/** One look: photo first, then name and a "from" price. Shortlisting is one tap on the photo corner. */
export function DesignCard({
  design,
  saved,
  onOpen,
  onToggle





}: {design: LookbookDesign;saved: boolean;onOpen: () => void;onToggle: () => void;}) {
  return <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-2xl bg-sunken">
        <button onClick={onOpen} className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40" aria-label={`View ${design.name}`}>
          <img src={design.image} alt={`${design.name}, ${design.garment.toLowerCase()}`} className="aspect-[4/5] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
        </button>
        <button onClick={onToggle} aria-pressed={saved} aria-label={saved ? `Remove ${design.name} from shortlist` : `Shortlist ${design.name}`} className={cn('absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface/95 shadow-soft transition-transform duration-150 ease-out active:scale-95', saved ? 'text-critical' : 'text-ink-muted hover:text-ink')}>
          <HeartIcon className={cn('h-[18px] w-[18px]', saved && 'fill-current')} />
        </button>
      </div>
      <button onClick={onOpen} className="mt-3 text-left">
        <h3 className="text-[15px] font-semibold">{design.name}</h3>
        <p className="text-sm text-ink-muted">{design.garment} · from {inr(design.fromPrice)}</p>
      </button>
    </article>;
}