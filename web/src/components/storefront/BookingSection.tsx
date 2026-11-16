import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, XIcon } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { consultationDays, consultationSlots, storeAddress, type LookbookDesign } from '../../data/storefront';
import { chipClass, inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
type Done = {
  name: string;
  visit: string;
  returning: boolean;
};

/** Shortlist + a short form. The booking reaches the Designer as a draft with the shortlist attached. */
export function BookingSection({
  shortlist,
  onRemove



}: {shortlist: LookbookDesign[];onRemove: (id: string) => void;}) {
  const {
    submitWebBooking
  } = useStore();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [day, setDay] = useState(consultationDays[1]);
  const [slot, setSlot] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const mobileOk = mobile.replace(/\D/g, '').length >= 10;
  const errors = {
    name: !name.trim(),
    mobile: !mobileOk,
    slot: !slot
  };
  const valid = !errors.name && !errors.mobile && !errors.slot;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    const visit = `${day} · ${slot}`;
    const garments = shortlist.map((d) => `${d.garment} (${d.name})`);
    const res = submitWebBooking({
      name,
      mobile,
      city: '',
      garments,
      visit,
      note
    });
    setDone({
      name: name.trim().split(' ')[0],
      visit,
      returning: res.returning
    });
  };
  return <section id="book" className="scroll-mt-20 border-t border-line bg-surface py-16 md:py-20" aria-labelledby="book-h">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div>
          <h2 id="book-h" className="font-display text-[32px] font-medium leading-tight md:text-[40px]">Book a free consultation</h2>
          <p className="mt-3 max-w-md text-[15px] text-ink-muted">An hour with a designer at our Khan Market studio. We take your measurements, show you fabrics and give you a price — no commitment.</p>

          <div className="mt-8">
            <p className="text-sm font-medium">Your shortlist</p>
            {shortlist.length === 0 ? <p className="mt-2 text-sm text-ink-subtle">Nothing yet — tap the heart on any look, or come with ideas of your own.</p> : <ul className="mt-3 space-y-2">
                {shortlist.map((d) => <li key={d.id} className="flex items-center gap-3">
                    <img src={d.image} alt="" className="h-14 w-11 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{d.name}</p>
                      <p className="text-sm text-ink-subtle">{d.garment}</p>
                    </div>
                    {!done && <button onClick={() => onRemove(d.id)} aria-label={`Remove ${d.name}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-subtle transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink">
                        <XIcon className="h-4 w-4" />
                      </button>}
                  </li>)}
              </ul>}
          </div>
          <p className="mt-8 text-sm text-ink-subtle">{storeAddress}</p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {done ? <motion.div key="done" initial={{
          opacity: 0,
          y: 8
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.25,
          ease: [0.23, 1, 0.32, 1]
        }} className="rounded-2xl border border-line bg-canvas p-8" role="status">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success"><CheckIcon className="h-5 w-5" /></span>
              <p className="mt-5 font-display text-[26px] font-medium leading-tight">See you {done.visit.split(' · ')[0]}, {done.name}.</p>
              <p className="mt-2 text-[15px] text-ink-muted">Your slot is {done.visit}. We’ve sent the details on WhatsApp{done.returning ? ' and your designer already has your measurements' : ''}.</p>
              <p className="mt-6 text-sm text-ink-subtle">Need to change it? Reply to the WhatsApp message.</p>
            </motion.div> : <motion.form key="form" onSubmit={submit} noValidate initial={false} exit={{
          opacity: 0
        }} transition={{
          duration: 0.15
        }} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" required>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass} aria-invalid={tried && errors.name} />
                  {tried && errors.name && <span className="mt-1 block text-sm text-critical">Add your name.</span>}
                </Field>
                <Field label="WhatsApp number" required>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="+91" className={inputClass} aria-invalid={tried && errors.mobile} />
                  {tried && errors.mobile && <span className="mt-1 block text-sm text-critical">Enter a 10-digit number.</span>}
                </Field>
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Day</legend>
                <div className="flex flex-wrap gap-2">
                  {consultationDays.map((d) => <button type="button" key={d} onClick={() => setDay(d)} aria-pressed={day === d} className={chipClass(day === d)}>{d}</button>)}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium">Time</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {consultationSlots.map((s) => <button type="button" key={s} onClick={() => setSlot(s)} aria-pressed={slot === s} className={chipClass(slot === s)}>{s}</button>)}
                </div>
                {tried && errors.slot && <span className="mt-1 block text-sm text-critical">Pick a time.</span>}
              </fieldset>

              <Field label="Anything we should know?" hint="Occasion, date, or bringing your own fabric.">
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputClass} />
              </Field>

              <Button type="submit" size="lg" fullWidth>Book my consultation</Button>
            </motion.form>}
        </AnimatePresence>
      </div>
    </section>;
}