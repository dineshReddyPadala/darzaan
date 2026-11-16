import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';

const events = [{
  name: 'Order confirmation',
  sample: 'Hi {name}, your Darzaan order {order} is confirmed for {date}. Track it here: {link}',
}, {
  name: 'Payment confirmation',
  sample: 'We received ₹{amount} for {order}. Balance: ₹{balance}.',
}, {
  name: 'Production started',
  sample: 'Good news — work on your {garment} has begun.',
}, {
  name: 'Delay / at risk',
  sample: 'Your {garment} needs a little more time. New date: {date}. We’re sorry for the wait.',
}, {
  name: 'Trial reminder',
  sample: 'Reminder: your trial is today at {time} at Khan Market.',
}, {
  name: 'Alteration update',
  sample: 'Your alteration is done. Come in for a quick re-trial any time.',
}, {
  name: 'Ready for pickup',
  sample: '{order} is ready! Balance due: ₹{balance}.',
}, {
  name: 'Final invoice & feedback',
  sample: 'Thank you, {name}. Your invoice is attached. How did we do?',
}];
const channels = ['WhatsApp', 'SMS', 'Email'] as const;

export function NotificationSettings({ value, onChange, onSave }: { value: Record<string, boolean>; onChange: (next: Record<string, boolean>) => void; onSave: () => void }) {
  const [sel, setSel] = useState(events[0].name);
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
    <section className={panelClass}>
      <div className="grid grid-cols-[1fr_repeat(3,72px)] border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        <span>Event</span>{channels.map((c) => <span key={c} className="text-center">{c}</span>)}
      </div>
      <ul className="divide-y divide-line">
        {events.map((e) => <li key={e.name} className={cn('grid grid-cols-[1fr_repeat(3,72px)] items-center px-5 py-2.5', sel === e.name && 'bg-canvas')}>
          <button type="button" onClick={() => setSel(e.name)} className="text-left text-[15px] font-medium hover:underline">{e.name}</button>
          {channels.map((c) => {
            const key = `${e.name}-${c}`;
            return <span key={c} className="flex justify-center">
              <input type="checkbox" checked={!!value[key]} onChange={() => onChange({ ...value, [key]: !value[key] })} className="h-5 w-5 accent-brand" aria-label={`${e.name} via ${c}`} />
            </span>;
          })}
        </li>)}
      </ul>
    </section>
    <aside className={`${panelClass} h-fit p-5`}>
      <h3 className="mb-3 text-[16px] font-semibold">Template · {sel}</h3>
      <div className="rounded-2xl rounded-tl-sm bg-success-soft p-4 text-[15px] leading-relaxed">{events.find((e) => e.name === sel)?.sample}</div>
      <p className="mt-3 text-xs text-ink-subtle">Messages are recorded in the log. No WhatsApp, SMS, or email is sent.</p>
      <Button className="mt-4" onClick={onSave}>Save</Button>
    </aside>
  </div>;
}
