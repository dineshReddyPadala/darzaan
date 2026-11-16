import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import type { Garment, Order } from '../../types';
import { cn } from '../../utils/cn';
import { fmtDate, isoPlusDays, TODAY_ISO } from '../../utils/format';
import { garmentDue } from '../../utils/orders';
import { orderLink } from '../../utils/roles';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';

const DEFAULT_MAKE_DAYS = 10;

interface Props {
  order: Order | null;
  garment: Garment | null;
  onClose: () => void;
}

/** How long it takes and when making starts, counted back from the due date. */
export function PlanGarmentModal({ order, garment, onClose }: Props) {
  const { updateOrder, logActivity, customerName, role } = useApp();
  const open = !!order && !!garment;
  const due = order && garment ? garmentDue(order, garment) : TODAY_ISO;
  const [makeDays, setMakeDays] = useState(String(DEFAULT_MAKE_DAYS));
  const [start, setStart] = useState(TODAY_ISO);

  useEffect(() => {
    if (!order || !garment) return;
    const days = garment.makeDays ?? DEFAULT_MAKE_DAYS;
    setMakeDays(String(days));
    setStart(garment.plannedStart ?? isoPlusDays(due, -days));
  }, [order?.id, garment?.id]);

  const days = Math.max(1, Number(makeDays) || 0);
  const finish = isoPlusDays(start, days);
  const late = finish > due;
  const startPassed = start < TODAY_ISO;
  const workflowPath = order ? orderLink(role, order.id, 'workflow') : null;

  const changeDays = (v: string) => {
    const clean = v.replace(/[^0-9]/g, '').slice(0, 3);
    setMakeDays(clean);
    if (Number(clean) > 0) setStart(isoPlusDays(due, -Number(clean)));
  };

  const save = () => {
    if (!order || !garment) return;
    const ok = updateOrder(order.id, (o) => ({
      ...o,
      garments: o.garments.map((g) => g.id === garment.id ? { ...g, plannedStart: start, makeDays: days } : g)
    }), { entity: 'production_task', action: 'update' });
    if (!ok) return;
    logActivity(order.id, `${garment.subCategory}: starts ${fmtDate(start, 'd MMM')} · ${days} days to make`, 'production');
    toast.success(`Starts ${fmtDate(start, 'd MMM')}`, { description: start > TODAY_ISO ? 'It appears on the board on that day.' : undefined });
    onClose();
  };

  return <Modal open={open} onClose={onClose} title={garment?.subCategory ?? 'Plan'} description={order ? `${customerName(order.customerId)} · ${order.id} · Due ${fmtDate(due, 'd MMM')}` : undefined} footer={<div className="flex items-center gap-2">
        {workflowPath && <Link to={workflowPath} className="mr-auto text-sm font-medium text-brand hover:underline">Open workflow</Link>}
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </div>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Days to make">
            <input inputMode="numeric" value={makeDays} onChange={(e) => changeDays(e.target.value)} className={cn(inputClass, 'tabular')} />
          </Field>
          <Field label="Start on">
            <input type="date" value={start} max={due} onChange={(e) => e.target.value && setStart(e.target.value)} className={cn(inputClass, 'tabular')} />
          </Field>
        </div>
        <p role={late || startPassed ? 'alert' : undefined} className={cn('rounded-xl px-4 py-3 text-[15px]', late || startPassed ? 'bg-critical-soft font-medium text-critical' : 'bg-canvas text-ink-muted')}>
          {late ? `Ready ${fmtDate(finish, 'd MMM')} — after the due date. Start earlier.` : startPassed ? `Start date has passed — start today or shorten the days to make.` : <>Ready by <span className="font-semibold text-ink">{fmtDate(finish, 'd MMM')}</span></>}
        </p>
      </div>
    </Modal>;
}