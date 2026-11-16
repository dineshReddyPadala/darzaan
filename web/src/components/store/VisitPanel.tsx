import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { useLogistics } from '../../contexts/LogisticsContext';
import { useStore } from '../../contexts/StoreContext';
import { messageTemplates, TRIAL_ROOMS, type MessageKey } from '../../data/store';
import type { Order } from '../../types';
import { fmtDate, nowIso, TODAY_ISO } from '../../utils/format';
import { isActive } from '../../utils/orders';
import { orderTotals } from '../../utils/pricing';
import { BookTrialModal } from '../order-detail/BookTrialModal';
import { Button, buttonClass } from '../ui/Button';
const quietLink = 'text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink';
const AT_STORE = ['store', 'trial', 'delivery'];
function reasonFor(o: Order): string {
  if (o.trial?.date === TODAY_ISO && o.trial.status === 'Scheduled') return `Trial at ${o.trial.time}`;
  if (o.status === 'Ready for Pickup') return 'Here to collect';
  if (o.status === 'Ready for Trial') return 'Ready for a trial';
  if (o.status === 'Alteration') return 'Alteration in progress';
  return 'Still being made';
}

/**
 * One customer's visit, cut to three things: who, why they're here, and the one thing to do.
 * Everything else is one tap away (Open order).
 */
export function VisitPanel({
  customerId,
  focusOrderId,
  onDraft




}: {customerId: string;focusOrderId?: string;onDraft: (customerId: string) => void;}) {
  const {
    getCustomer,
    orders,
    updateOrder,
    logActivity
  } = useApp();
  const {
    movements
  } = useLogistics();
  const {
    rackFor,
    reportNotOnRack,
    sendMessage
  } = useStore();
  const [booking, setBooking] = useState<Order | null>(null);
  const [focus, setFocus] = useState<string | undefined>(focusOrderId);
  const c = getCustomer(customerId);
  if (!c) return null;
  const mine = orders.filter((o) => o.customerId === c.id && isActive(o));
  const o = mine.find((x) => x.id === focus) ?? mine[0];
  const others = mine.filter((x) => x !== o);
  const startNow = (order: Order) => {
    const slot = nowIso().slice(11, 16);
    const busy = orders.filter((x) => x.id !== order.id && x.trial?.status === 'Scheduled' && x.trial.date === TODAY_ISO && x.trial.time.slice(0, 2) === slot.slice(0, 2)).length;
    if (busy >= TRIAL_ROOMS) {
      toast.error('Both trial rooms are busy', {
        description: 'Book the next free slot instead.'
      });
      setBooking(order);
      return false;
    }
    if (!updateOrder(order.id, (x) => ({
      ...x,
      trial: {
        date: TODAY_ISO,
        time: slot,
        status: 'Scheduled'
      }
    }), {
      entity: 'trial',
      action: order.trial ? 'update' : 'create'
    })) return false;
    logActivity(order.id, 'Walk-in trial started without a booking', 'trial');
    return true;
  };
  return <div>
      <div className="flex items-baseline justify-between gap-3 px-6 pb-1 pt-6">
        <p className="truncate text-xl font-semibold leading-tight">{c.name}</p>
        <Link to={`/customers/${c.id}`} className={quietLink}>Profile</Link>
      </div>
      <p className="px-6 text-sm text-ink-subtle">{c.mobile}</p>

      {!o ? <div className="px-6 pb-6 pt-6">
          <p className="text-[17px] font-semibold">No open orders</p>
          <p className="mb-5 mt-1 text-sm text-ink-muted">Here for something new?</p>
          <Button size="lg" fullWidth onClick={() => onDraft(c.id)}>Start a draft order</Button>
        </div> : <OrderBlock key={o.id} o={o} rack={(gid) => rackFor(o.id, gid)} eta={(gid) => {
      const m = movements.find((x) => x.bags.some((b) => b.tag === `${o.id}-${gid}` && b.state !== 'Received'));
      return m?.eta;
    }} onBook={() => setBooking(o)} onStartNow={() => startNow(o)} onNotOnRack={() => {
      const g = o.garments.find((x) => AT_STORE.includes(x.stage));
      if (g) reportNotOnRack(o.id, g.id, g.subCategory);
    }} onMessage={(k) => sendMessage(o.id, k)} />}

      {others.length > 0 && <div className="border-t border-line px-6 py-3">
          {others.map((x) => <button key={x.id} onClick={() => setFocus(x.id)} className="flex w-full items-baseline justify-between gap-3 py-1 text-left text-sm text-ink-muted hover:text-ink">
              <span>Also: {reasonFor(x).toLowerCase()}</span>
              <span className="font-mono text-xs text-ink-subtle">{x.id}</span>
            </button>)}
        </div>}

      {booking && <BookTrialModal order={booking} open onClose={() => setBooking(null)} />}
    </div>;
}
function OrderBlock({
  o,
  rack,
  eta,
  onBook,
  onStartNow,
  onNotOnRack,
  onMessage








}: {o: Order;rack: (garmentId: string) => string;eta: (garmentId: string) => string | undefined;onBook: () => void;onStartNow: () => boolean;onNotOnRack: () => void;onMessage: (k: MessageKey) => void;}) {
  const trialToday = o.trial?.date === TODAY_ISO && o.trial.status === 'Scheduled';
  const bal = orderTotals(o).balance;
  const here = o.garments.filter((g) => AT_STORE.includes(g.stage));
  const missing = o.garments.filter((g) => !AT_STORE.includes(g.stage));
  const spots = [...new Set(here.map((g) => rack(g.id)))].join(', ');
  const needsGarments = trialToday || o.status === 'Ready for Trial' || o.status === 'Ready for Pickup';

  // One line on where things are. Only the missing pieces get named.
  let where: React.ReactNode = null;
  if (needsGarments && missing.length === 0) {
    where = <p className="text-[15px]">
        <span className="font-medium">Rack {spots}</span>
        <button onClick={onNotOnRack} className="ml-3 text-xs text-ink-subtle hover:text-critical">Not there?</button>
      </p>;
  } else if (needsGarments) {
    const first = missing[0];
    const arriving = eta(first.id);
    where = <p className="text-[15px] text-attention">
        {missing.length === o.garments.length ? 'Not at the store yet' : `${first.subCategory}${missing.length > 1 ? ` +${missing.length - 1}` : ''} not here yet`}
        {arriving ? ` · arrives ${arriving}` : first.stage === 'logistics' ? ' · on the way' : ` · due ${fmtDate(o.deliveryDate, 'd MMM')}`}
      </p>;
  } else {
    where = <p className="text-[15px] text-ink-muted">At the workshop · due {fmtDate(o.deliveryDate, 'd MMM')}</p>;
  }
  let primary: React.ReactNode;
  if (o.status === 'Ready for Pickup') {
    primary = <Link to={`/orders/${o.id}`} className={buttonClass('primary', 'lg', 'w-full')}>Open order</Link>;
  } else if (trialToday && missing.length === 0) {
    primary = <Link to={`/orders/${o.id}?trial=start`} className={buttonClass('primary', 'lg', 'w-full')}>Start trial</Link>;
  } else if (o.status === 'Ready for Trial' && missing.length === 0) {
    primary = <Link to={`/orders/${o.id}?trial=start`} onClick={(e) => {
      if (!onStartNow()) e.preventDefault();
    }} className={buttonClass('primary', 'lg', 'w-full')}>Start trial now</Link>;
  } else {
    primary = <Button size="lg" fullWidth variant={trialToday ? 'primary' : 'secondary'} onClick={onBook}>{o.trial ? 'Move the trial' : 'Book a trial'}</Button>;
  }
  return <section className="px-6 pb-6 pt-6" aria-label={`Order ${o.id}`}>
      <p className="text-[17px] font-semibold">
        {reasonFor(o)}
        {o.priority === 'Express' && <span className="ml-2 text-sm font-medium text-critical">Express</span>}
      </p>
      <div className="mt-1">{where}</div>

      <div className="mt-6">{primary}</div>

      <div className="mt-3 flex items-center justify-center gap-6">
        <Link to={`/orders/${o.id}`} className={quietLink}>Open order</Link>
        <label className="relative">
          <span className={quietLink}>Message</span>
          <select aria-label="Send a WhatsApp message" value="" onChange={(e) => e.target.value && onMessage(e.target.value as MessageKey)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="">Send a WhatsApp message…</option>
            {messageTemplates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
      </div>
    </section>;
}