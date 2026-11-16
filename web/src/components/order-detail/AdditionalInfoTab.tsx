import React from 'react';
import { useApp } from '../../contexts/AppContext';
import type { Order } from '../../types';
import { panelClass } from '../../utils/styles';
import { OrderTimeline } from './OrderTimeline';
import { PaymentsTab } from './PaymentsTab';

/** Supporting information: payment history and the full activity log. */
export function AdditionalInfoTab({
  order,
  onRecordPayment



}: {order: Order;onRecordPayment: () => void;}) {
  const {
    roleDef
  } = useApp();
  return <div className="space-y-8">
      {roleDef.scope.payments && <section aria-labelledby="pay-h">
          <h2 id="pay-h" className="mb-3 text-[16px] font-semibold">Payments</h2>
          <PaymentsTab order={order} onRecord={onRecordPayment} />
        </section>}
      <section aria-labelledby="act-h">
        <h2 id="act-h" className="mb-3 text-[16px] font-semibold">Activity</h2>
        <div className={`${panelClass} p-5`}>
          <OrderTimeline events={order.activity} />
        </div>
      </section>
    </div>;
}