import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, MoreHorizontalIcon, ZapIcon } from 'lucide-react';
import { AdditionalInfoTab } from '../components/order-detail/AdditionalInfoTab';
import { BookTrialModal } from '../components/order-detail/BookTrialModal';
import { CancelOrderModal } from '../components/order-detail/CancelOrderModal';
import { ChangeRequestModal } from '../components/order-detail/ChangeRequestModal';
import { OrderDetailsTab } from '../components/order-detail/OrderDetailsTab';
import { RecordPaymentModal } from '../components/order-detail/RecordPaymentModal';
import { WorkflowTab } from '../components/order-detail/WorkflowTab';
import { Badge } from '../components/ui/Badge';
import { Button, buttonClass } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import { cn } from '../utils/cn';
import { canAccess, normaliseOrderTab, type OrderTabKey } from '../utils/roles';
import { OrderBarcode } from '../components/orders/OrderBarcode';
import { orderStatusTone } from '../utils/status';
import { pageClass } from '../utils/styles';
type ModalKey = 'payment' | 'change' | 'cancel' | 'trial' | null;
const tabLabels: Record<OrderTabKey, string> = {
  details: 'Order details',
  workflow: 'Workflow',
  more: 'Additional information'
};
export function OrderDetail() {
  const {
    id = ''
  } = useParams();
  const [params, setParams] = useSearchParams();
  const {
    getOrder,
    customerName,
    role,
    roleDef,
    can
  } = useApp();
  const [modal, setModal] = useState<ModalKey>(null);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const scope = roleDef.scope;
  const allowedTabs = roleDef.orderTabs.filter((k) => k !== 'workflow' || scope.production);
  const requested = normaliseOrderTab(params.get('tab'));
  const tab: OrderTabKey = requested && allowedTabs.includes(requested) ? requested : allowedTabs[0];
  const trialOpen = params.get('trial') === 'start';
  const order = getOrder(id);
  const backTo = canAccess(role, 'orders') ? {
    to: '/orders',
    label: 'Orders'
  } : {
    to: roleDef.home,
    label: 'Back to my work'
  };
  useEffect(() => {
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  if (!order) {
    return <div className={pageClass}>
        <p className="text-ink-muted">Order {id} not found.</p>
        <Link to={backTo.to} className={buttonClass('secondary', 'md', 'mt-4')}>{backTo.label}</Link>
      </div>;
  }
  const setTab = (k: OrderTabKey) => setParams(k === allowedTabs[0] ? {} : {
    tab: k
  }, {
    replace: true
  });
  const startTrial = () => {
    setParams({
      trial: 'start'
    }, {
      replace: true
    });
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const closeTrial = () => setParams({}, {
    replace: true
  });
  const active = order.status !== 'Closed' && order.status !== 'Cancelled';
  const primary = (() => {
    if (!active) return null;
    if (order.status === 'Ready for Trial' && can('trial', 'update') && !trialOpen) return {
      label: 'Start trial',
      on: startTrial
    };
    if (scope.production && can('production_task', 'create') && tab !== 'workflow' && allowedTabs.includes('workflow')) return {
      label: 'Open workflow',
      on: () => setTab('workflow')
    };
    return null;
  })();
  const menuItems = [{
    label: 'Change request',
    on: () => setModal('change'),
    show: active && can('order', 'update')
  }, {
    label: order.trial ? 'Reschedule trial' : 'Book trial',
    on: () => setModal('trial'),
    show: active && can('trial', order.trial ? 'update' : 'create')
  }, {
    label: 'Cancel order',
    on: () => setModal('cancel'),
    show: active && can('order', 'delete'),
    danger: true
  }].filter((m) => m.show);
  return <div className={pageClass}>
      <Link to={backTo.to} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> {backTo.label}
      </Link>

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[30px] font-medium leading-none tracking-tight">{scope.contacts ? customerName(order.customerId) : customerName(order.customerId).split(' ')[0]}</h1>
            <Badge tone={orderStatusTone[order.status]} size="md" dot>{order.status}</Badge>
            {order.priority === 'Express' && <Badge tone="warning" size="md"><ZapIcon className="h-3.5 w-3.5" />Express</Badge>}
          </div>
          <p className="mt-2 text-[16px] text-ink-muted">
            <span className="font-mono">{order.id}</span> · {order.garments.length} garment{order.garments.length > 1 ? 's' : ''}
          </p>
          <div className="mt-4">
            <OrderBarcode value={order.id} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {primary && ('to' in primary && primary.to ? <Link to={primary.to} className={buttonClass('primary', 'lg')}>{primary.label} <ArrowRightIcon className="h-5 w-5" /></Link> : <Button size="lg" onClick={'on' in primary ? primary.on : undefined} iconRight={<ArrowRightIcon className="h-5 w-5" />}>{primary.label}</Button>)}
          <div className="relative" ref={menuRef}>
            <Button variant="secondary" size="lg" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="More actions" icon={<MoreHorizontalIcon className="h-5 w-5" />} />
            {menu && <div className="absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
                {menuItems.map((m) => <button key={m.label} onClick={() => {
              setMenu(false);
              m.on();
            }} className={cn('flex h-11 w-full items-center rounded-xl px-3 text-left text-[15px] hover:bg-sunken', m.danger && 'text-critical')}>
                    {m.label}
                  </button>)}
              </div>}
          </div>
        </div>
      </header>

      {allowedTabs.length > 1 && <Tabs<OrderTabKey> value={tab} onChange={setTab} tabs={allowedTabs.map((k) => ({
      key: k,
      label: tabLabels[k],
      count: k === 'workflow' ? order.tasks?.filter((t) => t.status !== 'Done').length : undefined
    }))} />}
      <div className="pt-5">
        {tab === 'details' && <OrderDetailsTab order={order} trialOpen={trialOpen} onStartTrial={startTrial} onCloseTrial={closeTrial} onBook={() => setModal('trial')} onRecordPayment={() => setModal('payment')} />}
        {tab === 'workflow' && <WorkflowTab order={order} />}
        {tab === 'more' && <AdditionalInfoTab order={order} onRecordPayment={() => setModal('payment')} />}
      </div>

      <RecordPaymentModal order={order} open={modal === 'payment'} onClose={() => setModal(null)} />
      <ChangeRequestModal order={order} open={modal === 'change'} onClose={() => setModal(null)} />
      <CancelOrderModal order={order} open={modal === 'cancel'} onClose={() => setModal(null)} />
      <BookTrialModal order={order} open={modal === 'trial'} onClose={() => setModal(null)} />
    </div>;
}