import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Order } from '../../types';
import { cn } from '../../utils/cn';
import { usePackages } from '../../contexts/PackagesContext';
import { dueLabel, fmtDate, fmtDateTime, inr } from '../../utils/format';
import { latestUpdate } from '../../utils/packages';
import { orderTotals } from '../../utils/pricing';
import { canAccess, orderLink } from '../../utils/roles';
import { PackageStatusBadge } from '../packages/PackageStatusBadge';
import { panelClass } from '../../utils/styles';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SeverityIcon } from '../ui/SeverityIcon';
import { TrialSession } from '../trials/TrialSession';
import { GarmentDetailsCard } from './GarmentDetailsCard';
import { TrialsAlterationsCard } from './TrialsAlterationsCard';
interface Props {
  order: Order;
  trialOpen: boolean;
  onStartTrial: () => void;
  onCloseTrial: () => void;
  onBook: () => void;
  onRecordPayment: () => void;
}

/** Everything about the order on one page: garments and trials on the left, who / when / how much on the right. */
export function OrderDetailsTab({
  order,
  trialOpen,
  onStartTrial,
  onCloseTrial,
  onBook,
  onRecordPayment
}: Props) {
  const {
    getCustomer,
    roleDef,
    role,
    can
  } = useApp();
  const {
    forOrder
  } = usePackages();
  const c = getCustomer(order.customerId);
  const t = orderTotals(order);
  const scope = roleDef.scope;
  const active = order.status !== 'Closed' && order.status !== 'Cancelled';
  const openRequests = order.changeRequests.filter((r) => r.status === 'Awaiting approval');
  const altCharges = order.alterations.reduce((s, a) => s + a.charge, 0);
  const pkgs = forOrder(order.id);
  const trackLink = roleDef.orderTabs.includes('workflow') && scope.production ? orderLink(role, order.id, 'workflow') : null;
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <GarmentDetailsCard order={order} />
        <TrialsAlterationsCard order={order} onBook={onBook} onStartTrial={onStartTrial} />
        <Modal open={trialOpen} onClose={onCloseTrial} title={`Trial · ${c?.name ?? ''}`} description={order.garments.map((g) => g.subCategory).join(' · ')} size="lg">
          <TrialSession order={order} onDone={onCloseTrial} bare />
        </Modal>
      </div>

      <aside className="space-y-5">
        <Card title="Status">
          {active && <div className="flex items-start gap-3">
              {order.risk && <SeverityIcon severity={order.risk.severity} />}
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{order.risk ? order.risk.message : order.nextAction.label}</p>
                <p className="text-sm text-ink-muted">{order.risk ? `Next: ${order.nextAction.label} · ` : ''}{order.risk?.owner ?? order.nextAction.owner}</p>
              </div>
            </div>}
          {!active && <p className="text-[15px] text-ink-muted">{order.status}</p>}
        </Card>

        <Card title="Customer">
          <p className="text-[16px] font-semibold">
            {scope.contacts && canAccess(role, 'customers') ? <Link to={`/customers/${c?.id}`} className="hover:underline">{c?.name}</Link> : scope.contacts ? c?.name : c?.name.split(' ')[0]}
          </p>
          {scope.contacts && c?.mobile && <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><PhoneIcon className="h-3.5 w-3.5" />{c.mobile}</p>}
          <p className="mt-1 text-sm text-ink-subtle">Designer {order.designer}</p>
        </Card>

        <Card title="Delivery">
          <p className="text-[16px] font-semibold">{fmtDate(order.deliveryDate, 'EEE, d MMMM')}</p>
          <p className={cn('text-sm', active && dueLabel(order.deliveryDate).toLowerCase().includes('overdue') ? 'font-medium text-critical' : 'text-ink-muted')}>
            {active ? dueLabel(order.deliveryDate) : order.deliveryMode} · {order.deliveryMode}
          </p>
          {order.priority === 'Express' && <Badge tone="warning" className="mt-2">Express</Badge>}
          {pkgs.length > 0 && <ul className="mt-3 space-y-2.5 border-t border-line pt-3">
              {pkgs.map((p) => {
            const last = latestUpdate(p);
            return <li key={p.id} className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold">{p.id}</span>
                      <PackageStatusBadge status={p.status} />
                    </div>
                    <p className="truncate text-sm text-ink-muted">
                      {p.status === 'Delivered' ? `OTP confirmed${p.proofPhoto ? ' · photo' : ''} · ${fmtDateTime(p.deliveredAt ?? last.at)}` : `${fmtDateTime(last.at)} · ${last.by}`}
                    </p>
                  </li>;
          })}
              {trackLink && <li><Link to={trackLink} className="text-sm font-medium text-brand hover:underline">Track packages</Link></li>}
            </ul>}
        </Card>

        {scope.payments && <Card title="Payment">
            <dl className="space-y-1.5 text-[15px]">
              <Line k="Total" v={inr(t.total)} />
              {t.urgency > 0 && <Line k="incl. urgency" v={inr(t.urgency)} muted />}
              {altCharges > 0 && <Line k="incl. paid alterations" v={inr(altCharges)} muted />}
              <Line k="Paid" v={`${inr(t.paid)} · ${t.paidPct}%`} muted />
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <dt className="font-semibold">Balance</dt>
                <dd className={cn('text-lg font-semibold tabular', t.balance > 0 ? 'text-ink' : 'text-success')}>{t.balance > 0 ? inr(t.balance) : 'Paid'}</dd>
              </div>
            </dl>
            {t.pending > 0 && <p className="mt-2 text-sm text-attention">Custom design price still with production</p>}
            {active && t.balance > 0 && can('payment', 'create') && <Button className="mt-3" fullWidth variant="secondary" onClick={onRecordPayment}>Record payment</Button>}
          </Card>}

        {openRequests.length > 0 && <Card title="Requests">
            <ul className="space-y-3">
              {openRequests.map((r) => <li key={r.id}>
                  <p className="text-[15px] font-medium">{r.field}: {r.after}</p>
                  <p className="text-sm text-ink-muted">Waiting for approval · {r.requestedBy}</p>
                </li>)}
            </ul>
          </Card>}
      </aside>
    </div>;
}
function Card({
  title,
  children



}: {title: string;children: React.ReactNode;}) {
  return <section className={`${panelClass} p-5`}>
      <h2 className="mb-2 text-xs font-medium text-ink-subtle">{title}</h2>
      {children}
    </section>;
}
function Line({
  k,
  v,
  muted




}: {k: string;v: string;muted?: boolean;}) {
  return <div className={cn('flex justify-between gap-3', muted && 'text-sm text-ink-muted')}>
      <dt>{k}</dt>
      <dd className="tabular">{v}</dd>
    </div>;
}