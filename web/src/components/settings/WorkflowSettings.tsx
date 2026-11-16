import React, { useEffect } from 'react';
import { useQc } from '../../contexts/QcContext';
import { stages } from '../../data/production';
import type { StoreWorkflow } from '../../data/store-settings';
import { inputClass, panelClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';

export function WorkflowSettings({ value, onChange, onSave }: { value: StoreWorkflow; onChange: (next: StoreWorkflow) => void; onSave: () => void }) {
  const { setTolerance } = useQc();
  useEffect(() => {
    if (value.tolerance > 0 && value.tolerance <= 2) setTolerance(value.tolerance);
  }, [setTolerance, value.tolerance]);
  const set = (patch: Partial<StoreWorkflow>) => onChange({ ...value, ...patch });
  return <div className="space-y-6">
    <section className={panelClass}>
      <h3 className="border-b border-line px-5 py-4 text-[16px] font-semibold">Production stages & SLA</h3>
      <ol className="divide-y divide-line">
        {stages.slice(0, stages.findIndex((st) => st.key === 'logistics') + 1).map((s, i) => <li key={s.key} className="flex items-center gap-4 px-5 py-3">
          <span className="w-6 font-mono text-sm text-ink-subtle">{i + 1}</span>
          <div className="flex-1">
            <p className="text-[15px] font-medium">{s.label}</p>
            <p className="text-sm text-ink-subtle">{s.station}</p>
          </div>
          <div className="relative w-28">
            <input value={value.slaHours[s.key] ?? ''} inputMode="numeric" className={`${inputClass} h-10 pr-8 tabular`} aria-label={`${s.label} SLA hours`} onChange={(e) => set({ slaHours: { ...value.slaHours, [s.key]: Number(e.target.value) } })} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">h</span>
          </div>
        </li>)}
      </ol>
    </section>
    <section className={`${panelClass} grid gap-4 p-5 md:grid-cols-2`}>
      <Field label="Escalate after SLA + grace (hours)"><input value={value.graceHours} className={inputClass} onChange={(e) => set({ graceHours: Number(e.target.value) })} /></Field>
      <Field label="Regular lead time (days)"><input value={value.leadTimeDays} className={inputClass} onChange={(e) => set({ leadTimeDays: Number(e.target.value) })} /></Field>
      <Field label="QC measurement tolerance (± inches)" hint="Applies immediately. Values within 0.25 in of the limit are marked borderline but pass. Converted for cm orders.">
        <input type="number" min={0.125} max={2} step={0.125} value={value.tolerance} onChange={(e) => {
          const next = Number(e.target.value);
          if (next > 0 && next <= 2) set({ tolerance: next });
        }} className={inputClass} />
      </Field>
      <Field label="Alteration policy" className="md:col-span-2"><textarea rows={2} value={value.alterationPolicy} onChange={(e) => set({ alterationPolicy: e.target.value })} className={textareaClass} /></Field>
      <Field label="Cancellation policy" className="md:col-span-2"><textarea rows={2} value={value.cancellationPolicy} onChange={(e) => set({ cancellationPolicy: e.target.value })} className={textareaClass} /></Field>
    </section>
    <Button onClick={onSave}>Save workflow</Button>
  </div>;
}
