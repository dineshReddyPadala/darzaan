import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, CheckIcon, PrinterIcon } from 'lucide-react';
import { OrderBarcode } from '../components/orders/OrderBarcode';
import { OrderCopy } from '../components/orders/OrderCopy';
import { Button, buttonClass } from '../components/ui/Button';
import { Segmented } from '../components/ui/Segmented';
import { useApp } from '../contexts/AppContext';
import { fmtDate, inr } from '../utils/format';
import { garmentsSummary } from '../utils/orders';
import { orderTotals } from '../utils/pricing';
import { pageClass } from '../utils/styles';
type Copy = 'customer' | 'sales' | 'production';
export function OrderConfirmation() {
  const {
    id = ''
  } = useParams();
  const {
    getOrder,
    customerName
  } = useApp();
  const [copy, setCopy] = useState<Copy>('customer');
  const order = getOrder(id);
  if (!order) return <div className={pageClass}>Order not found.</div>;
  const t = orderTotals(order);
  return <div className={pageClass}>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors duration-150 ease-out hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> Back to orders
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <section>
          <motion.span initial={{
          scale: 0.96,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          duration: 0.28,
          ease: [0.23, 1, 0.32, 1]
        }} className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
            <CheckIcon className="h-7 w-7" strokeWidth={2.5} />
          </motion.span>
          <p className="mt-5 text-[15px] text-ink-muted">Order confirmed</p>
          <h1 className="mt-1 font-display text-[44px] font-medium leading-none tracking-tight">{order.id}</h1>
          <div className="mt-4">
            <OrderBarcode value={order.id} />
          </div>
          <p className="mt-3 text-[17px]">{customerName(order.customerId)}</p>
          <p className="text-[15px] text-ink-muted">{garmentsSummary(order)}</p>

          <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
            {[['Delivery', fmtDate(order.deliveryDate, 'EEEE, d MMMM')], ...(t.urgency ? [['Urgency charges', inr(t.urgency)]] : []), ['Total', t.pending ? `${inr(t.total)} + design price` : inr(t.total)], ['Advance paid', inr(t.paid)], ['Balance at pickup', inr(t.balance)], ['Status', 'Sent to production review']].map(([k, v]) => <div key={k} className="flex items-center justify-between px-5 py-3.5">
                <dt className="text-[15px] text-ink-muted">{k}</dt>
                <dd className="text-[15px] font-semibold tabular">{v}</dd>
              </div>)}
          </dl>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link to={`/orders/${order.id}`} className={buttonClass('primary', 'lg')}>View order</Link>
            <Button size="lg" variant="secondary" icon={<PrinterIcon className="h-5 w-5" />} onClick={() => window.print()}>Print copy</Button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Order copies</h2>
            <Segmented value={copy} onChange={setCopy} options={[{
            value: 'customer',
            label: 'Customer'
          }, {
            value: 'sales',
            label: 'Sales'
          }, {
            value: 'production',
            label: 'Production'
          }]} />
          </div>
          <OrderCopy order={order} kind={copy} />
        </section>
      </div>
    </div>;
}