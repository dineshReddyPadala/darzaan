import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { TRIAL_ROOMS, TRIAL_SLOTS } from '../../data/store';
import type { Order } from '../../types';
import { cn } from '../../utils/cn';
import { fmtDate, nowIso, todayPlus, uid } from '../../utils/format';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
export function BookTrialModal({
  order,
  open,
  onClose




}: {order: Order;open: boolean;onClose: () => void;}) {
  const {
    orders,
    updateOrder,
    logActivity
  } = useApp();
  const [date, setDate] = useState(order.trial?.date ?? todayPlus(2));
  const [time, setTime] = useState(order.trial?.time ?? '12:30');
  // Each slot holds one booking per trial room at this store — no double bookings.
  const booked = (slot: string) => orders.filter((o) => o.id !== order.id && o.store === order.store && o.trial?.status === 'Scheduled' && o.trial.date === date && o.trial.time === slot).length;
  const full = (slot: string) => booked(slot) >= TRIAL_ROOMS;
  const save = () => {
    if (full(time)) {
      toast.error('That slot is full', {
        description: 'Pick another time — both trial rooms are booked.'
      });
      return;
    }
    if (!updateOrder(order.id, (o) => ({
      ...o,
      trial: {
        date,
        time,
        status: 'Scheduled'
      },
      messages: [...o.messages, {
        id: uid('M'),
        channel: 'WhatsApp',
        template: `Trial ${o.trial ? 'rescheduled' : 'booked'} — ${fmtDate(date, 'd MMM')} ${time}`,
        at: nowIso(),
        status: 'Delivered'
      }]
    }), {
      entity: 'trial',
      action: order.trial ? 'update' : 'create'
    })) return;
    logActivity(order.id, `Trial ${order.trial ? 'rescheduled' : 'booked'} for ${fmtDate(date, 'd MMM')} at ${time} — WhatsApp confirmation sent`, 'trial');
    toast.success('Trial booked', {
      description: 'Confirmation sent on WhatsApp; a reminder goes out the day before.'
    });
    onClose();
  };
  return <Modal open={open} onClose={onClose} title={order.trial ? 'Reschedule trial' : 'Book trial'} description={`${TRIAL_ROOMS} trial rooms — full slots can’t be picked.`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={full(time)} onClick={save}>Confirm {fmtDate(date, 'd MMM')} · {time}</Button></>}>
      <div className="space-y-4">
        <Field label="Date"><input type="date" value={date} min={todayPlus(0)} onChange={(e) => setDate(e.target.value)} className={inputClass} /></Field>
        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">Time</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {TRIAL_SLOTS.map((s) => {
            const isFull = full(s);
            const left = TRIAL_ROOMS - booked(s);
            const on = time === s && !isFull;
            const limited = !isFull && left < TRIAL_ROOMS;
            // Fixed-height tiles; the second line only appears when a slot is filling up or full.
            return <button key={s} type="button" disabled={isFull} onClick={() => setTime(s)} aria-pressed={on} className={cn('flex h-14 flex-col items-center justify-center rounded-xl text-[16px] font-semibold tabular transition-[background-color,box-shadow,color] duration-150 ease-out', on ? 'bg-brand text-white ring-2 ring-inset ring-brand' : 'bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-canvas', isFull && 'cursor-not-allowed bg-sunken text-ink-subtle ring-line hover:bg-sunken')} aria-label={`${s}${isFull ? ', full' : `, ${left} room${left > 1 ? 's' : ''} free`}`}>
                  <span className={cn(isFull && 'line-through')}>{s}</span>
                  {(limited || isFull) && <span className={cn('text-[12px] font-medium', on ? 'text-white/85' : isFull ? 'text-ink-subtle' : 'text-attention')}>{isFull ? 'Full' : `${left} room left`}</span>}
                </button>;
          })}
          </div>
        </div>
      </div>
    </Modal>;
}