import React, { useMemo, useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { useStore } from '../../contexts/StoreContext';
import { cn } from '../../utils/cn';
import { inr, TODAY_ISO } from '../../utils/format';
import { inputClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';

/** Totals for the day, a cash count and the handover to the manager. */
export function EndOfDayModal({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const {
    orders
  } = useApp();
  const {
    submitClose,
    managerName,
    closes
  } = useStore();
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const day = useMemo(() => {
    const pays = orders.flatMap((o) => o.payments).filter((p) => p.at.slice(0, 10) === TODAY_ISO && p.kind !== 'Refund');
    const sum = (m: string[]) => pays.filter((p) => m.includes(p.method)).reduce((s, p) => s + p.amount, 0);
    const trials = orders.filter((o) => o.trial?.date === TODAY_ISO);
    const onRack = orders.flatMap((o) => o.garments).filter((g) => g.stage === 'store' || g.stage === 'trial').length;
    return {
      upi: sum(['UPI']),
      cardBank: sum(['Card', 'Bank transfer']),
      cash: sum(['Cash']),
      trialsDone: trials.filter((o) => o.trial!.status === 'Completed').length,
      noShows: trials.filter((o) => o.trial!.status === 'Missed').length,
      onRack
    };
  }, [orders]);
  const done = closes.find((c) => c.date === TODAY_ISO);
  const countedNum = counted === '' ? null : Number(counted);
  const diff = countedNum === null ? 0 : countedNum - day.cash;
  const total = day.upi + day.cardBank + day.cash;
  const submit = () => {
    if (countedNum === null || diff !== 0 && note.trim().length < 4) return;
    submitClose({
      upi: day.upi,
      cardBank: day.cardBank,
      cashRecorded: day.cash,
      cashCounted: countedNum,
      note: note.trim()
    });
    setCounted('');
    setNote('');
    onClose();
  };
  return <Modal open={open} onClose={onClose} title="Close the day" description={`Count the cash, then hand it to ${managerName}. They confirm it.`} footer={done ? <Button onClick={onClose}>Done</Button> : <><Button variant="ghost" onClick={onClose}>Not yet</Button><Button disabled={countedNum === null || diff !== 0 && note.trim().length < 4} onClick={submit}>Submit count</Button></>}>
      {done ? <p className="text-[15px]">Closed by {done.by} — {inr(done.cashCounted)} cash counted. <span className="text-ink-muted">{done.status === 'Confirmed' ? `Confirmed by ${done.confirmedBy}.` : `Waiting for ${managerName} to confirm.`}</span></p> : <div className="space-y-5">
          <div>
            <p className="text-sm text-ink-muted">Collected today</p>
            <p className="text-[32px] font-semibold leading-tight tabular">{inr(total)}</p>
            <p className="text-sm text-ink-muted">UPI {inr(day.upi)} · Card & bank {inr(day.cardBank)} · Cash {inr(day.cash)}</p>
          </div>
          <p className="border-y border-line py-3 text-sm text-ink-muted">
            {day.trialsDone} trial{day.trialsDone === 1 ? '' : 's'} done · {day.noShows} no-show{day.noShows === 1 ? '' : 's'} · {day.onRack} garment{day.onRack === 1 ? '' : 's'} on the rack
          </p>
          <Field label="Cash in the drawer (₹)" required>
            <input value={counted} onChange={(e) => setCounted(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${inputClass} h-14 text-xl tabular`} placeholder={String(day.cash)} />
          </Field>
          {countedNum !== null && <p className={cn('text-[15px] font-medium', diff === 0 ? 'text-success' : 'text-critical')}>
              {diff === 0 ? 'Matches the recorded cash.' : `${diff < 0 ? 'Short' : 'Over'} by ${inr(Math.abs(diff))} — add a note for ${managerName}.`}
            </p>}
          {diff !== 0 && <Field label="Note" required>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={textareaClass} placeholder="What might explain the difference?" />
            </Field>}
        </div>}
    </Modal>;
}