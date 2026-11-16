import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { useStore } from '../../contexts/StoreContext';
import { fabrics, trims } from '../../data/inventory';
import { isActive } from '../../utils/orders';
import { todayPlus } from '../../utils/format';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';
type Mode = 'swatch' | 'trim';

/** Lend a swatch to a customer, or issue a trim to an order — with a substitute when it's out of stock. */
export function StockIssueModal({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const {
    customers,
    orders,
    logActivity,
    notify,
    customerName
  } = useApp();
  const {
    lendSwatch
  } = useStore();
  const [mode, setMode] = useState<Mode>('swatch');
  const [fabricId, setFabricId] = useState(fabrics[0].id);
  const [cid, setCid] = useState('');
  const [days, setDays] = useState('3');
  const [trimId, setTrimId] = useState(trims[0].id);
  const [orderId, setOrderId] = useState('');
  const [qty, setQty] = useState('1');
  const trim = trims.find((t) => t.id === trimId)!;
  const short = trim.stock < (Number(qty) || 1);
  const substitute = short ? trims.find((t) => t.id !== trim.id && t.category === trim.category && t.stock >= (Number(qty) || 1)) : undefined;
  const active = orders.filter(isActive);
  const lend = () => {
    const f = fabrics.find((x) => x.id === fabricId)!;
    if (!cid) return;
    lendSwatch(f.id, `${f.type} — ${f.name}`, cid, todayPlus(Number(days) || 3));
    onClose();
  };
  const issue = (id: string) => {
    const t = trims.find((x) => x.id === id)!;
    if (!orderId) return;
    logActivity(orderId, `${qty} ${t.unit} of ${t.name} issued from store stock${id !== trimId ? ` (substitute for ${trim.name})` : ''}`, 'production');
    toast.success(`${t.name} issued to ${orderId}`);
    onClose();
  };
  const flagReorder = () => {
    notify({
      category: 'Action Required',
      severity: 'attention',
      title: `Reorder ${trim.name}`,
      body: `Out of stock when issuing to ${orderId || 'an order'} — no substitute in the same family.`
    });
    toast.success('Flagged to the manager to reorder');
    onClose();
  };
  return <Modal open={open} onClose={onClose} title="Issue from stock" footer={mode === 'swatch' ? <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!cid} onClick={lend}>Lend swatch</Button></> : short ? <><Button variant="ghost" onClick={flagReorder}>Flag to reorder</Button>{substitute && <Button disabled={!orderId} onClick={() => issue(substitute.id)}>Issue {substitute.name} instead</Button>}</> : <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!orderId} onClick={() => issue(trimId)}>Issue to order</Button></>}>
      <div className="space-y-4">
        <Segmented fullWidth value={mode} onChange={setMode} options={[{
        value: 'swatch',
        label: 'Lend a swatch'
      }, {
        value: 'trim',
        label: 'Issue a trim'
      }]} />
        {mode === 'swatch' ? <>
            <Field label="Fabric">
              <select value={fabricId} onChange={(e) => setFabricId(e.target.value)} className={inputClass}>
                {fabrics.map((f) => <option key={f.id} value={f.id}>{f.type} — {f.name}</option>)}
              </select>
            </Field>
            <Field label="Customer">
              <select value={cid} onChange={(e) => setCid(e.target.value)} className={inputClass}>
                <option value="">Choose…</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Back in (days)" hint="Overdue swatches show on Today with a reminder.">
              <input value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${inputClass} tabular`} />
            </Field>
          </> : <>
            <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
              <Field label="Trim">
                <select value={trimId} onChange={(e) => setTrimId(e.target.value)} className={inputClass}>
                  {trims.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.stock} {t.unit}</option>)}
                </select>
              </Field>
              <Field label="Qty"><input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${inputClass} tabular`} /></Field>
            </div>
            <Field label="Order">
              <select value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
                <option value="">Choose…</option>
                {active.map((o) => <option key={o.id} value={o.id}>{o.id} · {customerName(o.customerId)}</option>)}
              </select>
            </Field>
            {short && <p className="rounded-xl bg-attention-soft px-4 py-3 text-[15px] text-attention">
                Only {trim.stock} {trim.unit} left. {substitute ? `${substitute.name} is in the same family and in stock.` : 'No substitute in the same family — flag it to reorder.'}
              </p>}
          </>}
      </div>
    </Modal>;
}