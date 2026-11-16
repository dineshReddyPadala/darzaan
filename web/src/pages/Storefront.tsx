import React, { useState } from 'react';
import { BookingSection } from '../components/storefront/BookingSection';
import { DesignCard } from '../components/storefront/DesignCard';
import { DesignDetailModal } from '../components/storefront/DesignDetailModal';
import { StorefrontHeader } from '../components/storefront/StorefrontHeader';
import { buttonClass } from '../components/ui/Button';
import { lookbook, occasions, shelfFabrics, storeAddress, storeHours, type Occasion } from '../data/storefront';
import { inr } from '../utils/format';
import { chipClass } from '../utils/styles';
const HERO = "/55f851ce-e8c9-44f1-bfae-e114d8b53cd9.jpg";
const steps = [{
  title: 'Shortlist',
  body: 'Save the looks you like. Prices are a starting point.'
}, {
  title: 'Visit the studio',
  body: 'A designer measures you, shows fabrics and confirms the price.'
}, {
  title: 'Fittings & pickup',
  body: 'Track progress on WhatsApp. Two alterations are free.'
}];

/**
 * Public storefront. One goal: get a visitor from "I like that" to a booked consultation.
 * Made-to-measure can't be bought in one click, so there is no cart — the shortlist travels with the booking.
 */
export function Storefront() {
  const [filter, setFilter] = useState<Occasion | 'All'>('All');
  const [saved, setSaved] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setSaved((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const shown = filter === 'All' ? lookbook : lookbook.filter((d) => d.occasion === filter);
  const open = lookbook.find((d) => d.id === openId) ?? null;
  return <div id="top" className="min-h-screen w-full bg-canvas text-ink">
      <StorefrontHeader shortlistCount={saved.length} />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div>
            <h1 className="font-display text-[40px] font-medium leading-[1.05] tracking-tight md:text-[56px]">Made to measure,<br />in Khan Market.</h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-muted">Wedding, festive and everyday wear, cut for you by our own tailors. Start with a free consultation.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#book" className={buttonClass('primary', 'lg')}>Book a free consultation</a>
              <a href="#lookbook" className="text-[15px] font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink">See the lookbook</a>
            </div>
            <p className="mt-10 text-sm text-ink-subtle">{storeHours}</p>
          </div>
          <img src={HERO} alt="A customer in an ivory anarkali at the Darzaan studio" className="aspect-[4/5] w-full rounded-2xl object-cover" />
        </section>

        <section id="lookbook" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12 md:px-8" aria-labelledby="lb-h">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="lb-h" className="font-display text-[32px] font-medium leading-tight">Lookbook</h2>
              <p className="mt-1 text-[15px] text-ink-muted">Tap the heart to shortlist. Every piece is made for you.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by occasion">
              {(['All', ...occasions] as const).map((o) => <button key={o} onClick={() => setFilter(o)} aria-pressed={filter === o} className={chipClass(filter === o)}>{o}</button>)}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:gap-y-10">
            {shown.map((d) => <DesignCard key={d.id} design={d} saved={saved.includes(d.id)} onOpen={() => setOpenId(d.id)} onToggle={() => toggle(d.id)} />)}
          </div>
        </section>

        <section id="fabrics" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12 md:px-8" aria-labelledby="fab-h">
          <h2 id="fab-h" className="font-display text-[32px] font-medium leading-tight">On the shelf</h2>
          <p className="mt-1 text-[15px] text-ink-muted">A few of the fabrics in the studio this month. Or bring your own.</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {shelfFabrics.map((f) => <li key={f.id}>
                <span className="block aspect-square w-full rounded-xl border border-line" style={{
              backgroundColor: f.color
            }} aria-hidden />
                <p className="mt-2 text-[15px] font-medium">{f.name}</p>
                <p className="text-sm text-ink-subtle">{f.composition} · {inr(f.pricePerMetre)}/m</p>
              </li>)}
          </ul>
        </section>

        <section id="how" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12 md:px-8 md:pb-20" aria-labelledby="how-h">
          <h2 id="how-h" className="font-display text-[32px] font-medium leading-tight">How it works</h2>
          <ol className="mt-8 grid gap-8 border-t border-line pt-8 md:grid-cols-3">
            {steps.map((s, i) => <li key={s.title}>
                <p className="text-sm tabular text-ink-subtle">{i + 1}</p>
                <p className="mt-1 text-[17px] font-semibold">{s.title}</p>
                <p className="mt-1 text-[15px] text-ink-muted">{s.body}</p>
              </li>)}
          </ol>
        </section>

        <BookingSection shortlist={lookbook.filter((d) => saved.includes(d.id))} onRemove={toggle} />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-subtle md:flex-row md:justify-between md:px-8">
          <span>{storeAddress}</span>
          <span>{storeHours}</span>
        </div>
      </footer>

      <DesignDetailModal design={open} saved={!!open && saved.includes(open.id)} onClose={() => setOpenId(null)} onToggle={() => open && toggle(open.id)} />
    </div>;
}