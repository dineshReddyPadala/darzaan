import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, QrCodeIcon, ScanLineIcon } from 'lucide-react';
import { workshopWorkers, type OrderWorkflow } from '../../hooks/useOrderWorkflow';
import type { Employee } from '../../types';
import { cn } from '../../utils/cn';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { initials } from './WorkflowStepRow';

/** Scan a worker's badge, then tap the task to give them. */
export function ScanWorkerModal({
  wf,
  open,
  onClose




}: {wf: OrderWorkflow;open: boolean;onClose: () => void;}) {
  const [worker, setWorker] = useState<Employee | null>(null);
  const [scanning, setScanning] = useState(false);
  const [taskId, setTaskId] = useState('');
  const turn = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!open) {
      setWorker(null);
      setTaskId('');
      setScanning(false);
    }
    return () => window.clearTimeout(timer.current);
  }, [open]);
  const onShift = workshopWorkers().filter((w) => w.status !== 'Off today');
  const scan = () => {
    setScanning(true);
    timer.current = window.setTimeout(() => {
      setWorker(onShift[turn.current % onShift.length]);
      turn.current += 1;
      setScanning(false);
    }, 650);
  };
  const open_ = wf.tasks.filter((t) => t.status !== 'Done');
  const assign = () => {
    if (!worker || !taskId) return;
    wf.assign(taskId, worker.name);
    onClose();
  };
  return <Modal open={open} onClose={onClose} title="Assign by badge" size="lg" footer={worker ? <>
            <Button variant="secondary" onClick={() => {
      setWorker(null);
      setTaskId('');
    }}>Scan someone else</Button>
            <Button onClick={assign} disabled={!taskId}>Assign to {worker.name.split(' ')[0]}</Button>
          </> : undefined}>
      {!worker ? <div className="space-y-5">
          <button type="button" onClick={scan} disabled={scanning} className="flex w-full flex-col items-center gap-4 rounded-2xl bg-brand px-6 py-10 text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-hover active:scale-[0.99] disabled:opacity-90">
            <span className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15">
              <QrCodeIcon className="h-12 w-12" />
              {scanning && <motion.span className="absolute inset-x-2 h-0.5 rounded-full bg-white" initial={{
            top: '15%'
          }} animate={{
            top: '85%'
          }} transition={{
            duration: 0.6,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'reverse'
          }} />}
            </span>
            <span className="text-xl font-semibold">{scanning ? 'Reading badge…' : 'Scan worker badge'}</span>
            <span className="text-sm text-white/80">Hold the badge QR up to the camera</span>
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink-subtle">Badge missing?</span>
            <select defaultValue="" onChange={(e) => setWorker(workshopWorkers().find((w) => w.id === e.target.value) ?? null)} className={cn(inputClass, 'min-w-[240px] flex-1')} aria-label="Choose worker">
              <option value="" disabled>Choose a worker…</option>
              {onShift.map((w) => <option key={w.id} value={w.id}>{w.name} · {w.role}</option>)}
            </select>
          </div>
        </div> : <AnimatePresence initial={false}>
          <motion.div initial={{
        opacity: 0,
        y: 6
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1]
      }} className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl bg-success-soft px-5 py-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface text-lg font-semibold text-success ring-1 ring-success/20">{initials(worker.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{worker.name}</p>
                <p className="text-sm text-ink-muted">{worker.id} · {worker.role} · {worker.activeTasks} of {worker.capacity} tasks</p>
              </div>
              <ScanLineIcon className="h-6 w-6 text-success" aria-hidden />
            </div>
            <div>
              <p className="mb-2 text-[15px] font-semibold">Which task?</p>
              {open_.length === 0 ? <p className="text-ink-muted">Every task on this order is done.</p> : <ul className="max-h-[320px] space-y-2 overflow-y-auto" role="radiogroup" aria-label="Task to assign">
                  {open_.map((t) => {
              const on = taskId === t.id;
              return <li key={t.id}>
                        <button type="button" role="radio" aria-checked={on} onClick={() => setTaskId(t.id)} className={cn('flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-[background-color,box-shadow] duration-150 ease-out', on ? 'bg-brand-soft ring-2 ring-inset ring-brand' : 'ring-1 ring-inset ring-line-strong hover:bg-canvas')}>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium">{t.name}</span>
                            <span className="block text-sm text-ink-subtle">{t.status} · {t.assignee ? `now with ${t.assignee}` : 'unassigned'}</span>
                          </span>
                          {on && <CheckIcon className="h-5 w-5 text-brand" />}
                        </button>
                      </li>;
            })}
                </ul>}
            </div>
          </motion.div>
        </AnimatePresence>}
    </Modal>;
}