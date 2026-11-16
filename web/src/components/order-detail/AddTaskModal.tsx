import React, { useEffect, useState } from 'react';
import { taskTypes, workshopWorkers, taskTypeLabel, type OrderWorkflow } from '../../hooks/useOrderWorkflow';
import type { Order, StageKey } from '../../types';
import { inputClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
interface Props {
  order: Order;
  wf: OrderWorkflow;
  open: boolean;
  onClose: () => void;
  initialGarmentId?: string;
  initialStage?: StageKey;
}
export function AddTaskModal({
  order,
  wf,
  open,
  onClose,
  initialGarmentId,
  initialStage
}: Props) {
  const [garmentId, setGarmentId] = useState(order.garments[0]?.id ?? '');
  const [stage, setStage] = useState<StageKey>('stitching');
  const [name, setName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [instructions, setInstructions] = useState('');
  useEffect(() => {
    if (!open) return;
    if (initialGarmentId) setGarmentId(initialGarmentId);
    if (initialStage && taskTypes.some((t) => t.stage === initialStage)) setStage(initialStage);
    setName('');
    setAssignee('');
    setInstructions('');
  }, [open, initialGarmentId, initialStage]);
  const placeholder = `${taskTypeLabel(stage)} — ${wf.garmentName(garmentId)}`;
  const submit = () => {
    if (wf.addTask({
      garmentId,
      stage,
      name,
      assignee,
      instructions
    })) onClose();
  };
  return <Modal open={open} onClose={onClose} title="Add a task" description="Tasks belong to one garment. Add as many as the garment needs." footer={<>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!garmentId}>Add task</Button>
        </>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Garment">
            <select value={garmentId} onChange={(e) => setGarmentId(e.target.value)} className={inputClass}>
              {order.garments.map((g, i) => <option key={g.id} value={g.id}>{i + 1}. {g.subCategory}</option>)}
            </select>
          </Field>
          <Field label="Task type">
            <select value={stage} onChange={(e) => setStage(e.target.value as StageKey)} className={inputClass}>
              {taskTypes.map((t) => <option key={t.stage} value={t.stage}>{t.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Task name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} className={inputClass} />
        </Field>
        <Field label="Assign to">
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
            <option value="">Assign later (or scan a badge)</option>
            {workshopWorkers().map((w) => <option key={w.id} value={w.name} disabled={w.status === 'Off today'}>
                {w.name} · {w.role} · {w.activeTasks}/{w.capacity}{w.status === 'Off today' ? ' · off today' : ''}
              </option>)}
          </select>
        </Field>
        <Field label="Instructions">
          <textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Take in side seams ½ inch, keep the border level" className={textareaClass} />
        </Field>
      </div>
    </Modal>;
}