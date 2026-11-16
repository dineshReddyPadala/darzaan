import React from 'react';
import { BrandMark } from '../layout/BrandMark';
import { buttonClass } from '../ui/Button';

/** Sticky top bar: brand, three anchors, and the one thing we want visitors to do. */
export function StorefrontHeader({
  shortlistCount


}: {shortlistCount: number;}) {
  return <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <BrandMark size={32} />
          <span className="font-display text-xl font-medium">Darzaan</span>
        </a>
        <nav aria-label="Storefront" className="hidden flex-1 items-center gap-6 text-sm text-ink-muted md:flex">
          <a href="#lookbook" className="transition-colors duration-150 ease-out hover:text-ink">Lookbook</a>
          <a href="#fabrics" className="transition-colors duration-150 ease-out hover:text-ink">Fabrics</a>
          <a href="#how" className="transition-colors duration-150 ease-out hover:text-ink">How it works</a>
        </nav>
        <a href="#book" className={buttonClass('primary', 'md', 'ml-auto whitespace-nowrap md:ml-0')}>
          Book a visit{shortlistCount > 0 && <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs tabular">{shortlistCount}</span>}
        </a>
      </div>
    </header>;
}