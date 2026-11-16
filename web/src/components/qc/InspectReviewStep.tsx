import React, { useEffect, useState } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { qcChecklist, qcDefectTypes, qcLocations, qcTeams } from '../../data/production';
import { qcPriority, type QcGarmentState } from '../../hooks/useQcGarment';
import type { DefectSeverity, QcDefect, ReworkPriority } from '../../types';
import { cn } from '../../utils/cn';
import { TODAY_ISO, todayPlus } from '../../utils/format';
import { garmentDue } from '../../utils/orders';
import { measurementDefect, suggestSeverity, type MeasureFinding } from '../../utils/qc';
import { inputClass, panelClass, textareaClass } from '../../utils/styles';
import { Badge } from '../ui/Badge';
import { Field } from '../ui/Field';
import { Segmented } from '../ui/Segmented';
const sizeLabels: Record<DefectSeverity, string> = {
  Minor: 'Small fix',
  Major: 'Needs repair',
  Critical: 'Serious'
};
const sizeHelp: Record<DefectSeverity, string> = {
  Minor: 'Quick fix, under an hour.',
  Major: 'Needs to go back to a team to be redone.',
  Critical: 'Fabric damaged or may need to be made again.'
};
export interface RepairForm {
  category: string;
  type: string;
  location: string;
  severity: DefectSeverity;
  note: string;
  team: string;
  assignee: string;
  due: string;
}

/** Report + send-for-repair form, prefilled from what the checks found. Lives on the page so it survives Back. */
export function useRepairForm(qc: QcGarmentState, findings: MeasureFinding[], tolerance: number) {
  const failedKeys = qc.failed.map((c) => c.key);
  const [form, setForm] = useState<RepairForm | null>(null);
  const build = (category: string): RepairForm => {
    const m = category === 'measurements' ? measurementDefect(findings) : null;
    const type = m?.type ?? '';
    const team = qc.defaultTeam(category);
    const due = qc.order && qc.garment && garmentDue(qc.order, qc.garment) < todayPlus(1) ? TODAY_ISO : todayPlus(1);
    return {
      category,
      type,
      location: m?.location ?? '',
      severity: type ? suggestSeverity(type, category === 'measurements' ? findings : [], tolerance) : 'Major',
      note: m?.description ?? qc.draft.notes?.[category] ?? '',
      team: team.team,
      assignee: team.lead,
      due
    };
  };

  // Start (or restart) the form whenever the failed items change.
  const sig = failedKeys.join(',');
  useEffect(() => {
    if (!failedKeys.length) setForm(null);else if (!form || !failedKeys.includes(form.category)) setForm(build(failedKeys[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  const ready = !!form && !!form.type && !!form.location && !!form.note.trim() && !!form.assignee;
  const send = () => {
    if (!form || !ready) return;
    const photos = failedKeys.flatMap((k) => qc.draft.photos[k] ?? []);
    const defect: QcDefect = {
      category: form.category,
      type: form.type,
      severity: form.severity,
      location: form.location,
      description: form.note.trim(),
      photos
    };
    const urgent = qc.order && qc.garment && qcPriority(qc.order, qc.garment) === 'High';
    const priority: ReworkPriority = form.severity === 'Critical' || urgent ? 'High' : form.severity === 'Minor' ? 'Low' : 'Medium';
    qc.assignRework({
      team: form.team,
      assignee: form.assignee,
      priority,
      due: form.due,
      instructions: form.note.trim()
    }, defect);
  };
  return {
    form,
    setForm,
    build,
    ready,
    send
  };
}

/** Step 4 — summary of every check, then either Pass or report the problem. */
export function InspectReviewStep({
  qc,
  repair,
  nextStage




}: {qc: QcGarmentState;repair: ReturnType<typeof useRepairForm>;nextStage: string;}) {
  const {
    draft
  } = qc;
  const failed = qc.failed;
  const passed = qcChecklist.filter((c) => draft.results[c.key] === 'pass').length;
  const {
    form,
    setForm,
    build
  } = repair;
  const update = (patch: Partial<RepairForm>) => form && setForm({
    ...form,
    ...patch
  });
  const members = qcTeams.find((t) => t.team === form?.team)?.members ?? [];
  return <div className="space-y-5">
      <div>
        <h2 className="font-display text-[26px] font-medium leading-tight text-ink">Review the result</h2>
        <p className="mt-1 text-[16px] text-ink-muted">
          {failed.length ? `${failed.length} item${failed.length > 1 ? 's' : ''} failed. Tell us what’s wrong and who should fix it.` : `Everything passed. It will go to ${nextStage}.`}
        </p>
      </div>

      <div className={cn('flex items-center gap-4 rounded-2xl px-5 py-4', failed.length ? 'bg-critical-soft' : 'bg-success-soft')}>
        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white', failed.length ? 'bg-critical' : 'bg-success')}>
          {failed.length ? <XIcon className="h-5 w-5" /> : <CheckIcon className="h-5 w-5" />}
        </span>
        <div>
          <p className="text-[18px] font-semibold text-ink">{failed.length ? 'Failed' : 'Passed'}</p>
          <p className="text-[15px] text-ink-muted tabular">{passed} passed · {failed.length} failed</p>
        </div>
      </div>

      <section className={panelClass} aria-labelledby="sum-h">
        <h3 id="sum-h" className="px-5 pt-4 text-[15px] font-semibold">Checks</h3>
        <ul className="mt-1 divide-y divide-line">
          {qcChecklist.map((c) => {
          const r = draft.results[c.key];
          return <li key={c.key} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink">{c.label}</p>
                  {r === 'fail' && draft.notes?.[c.key] && <p className="truncate text-sm text-critical">{draft.notes[c.key]}</p>}
                </div>
                <Badge tone={r === 'pass' ? 'success' : r === 'fail' ? 'critical' : 'neutral'} dot>{r === 'pass' ? 'Pass' : r === 'fail' ? 'Fail' : 'N/A'}</Badge>
              </li>;
        })}
        </ul>
      </section>

      {form && <section className={cn(panelClass, 'space-y-5 p-5')} aria-labelledby="rep-h">
          <h3 id="rep-h" className="text-lg font-semibold">Report the problem</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {failed.length > 1 && <Field label="Main problem" required>
                <select value={form.category} onChange={(e) => setForm(build(e.target.value))} className={inputClass}>
                  {failed.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </Field>}
            <Field label="What’s wrong" required>
              <select value={form.type} onChange={(e) => update({
            type: e.target.value,
            severity: suggestSeverity(e.target.value)
          })} className={inputClass}>
                <option value="">Choose…</option>
                {(qcDefectTypes[form.category] ?? []).map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Where" required>
              <select value={form.location} onChange={(e) => update({
            location: e.target.value
          })} className={inputClass}>
                <option value="">Choose…</option>
                {qcLocations.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-muted">How big is the problem?</span>
            <Segmented<DefectSeverity> size="lg" fullWidth ariaLabel="How big is the problem" value={form.severity} onChange={(v) => update({
          severity: v
        })} options={(['Minor', 'Major', 'Critical'] as DefectSeverity[]).map((s) => ({
          value: s,
          label: sizeLabels[s]
        }))} />
            <p className={cn('mt-1.5 text-sm', form.severity === 'Critical' ? 'text-critical' : 'text-ink-subtle')}>{sizeHelp[form.severity]}</p>
          </div>
          <Field label="Note for the team" required>
            <textarea rows={2} value={form.note} onChange={(e) => update({
          note: e.target.value
        })} className={textareaClass} />
          </Field>

          <div className="border-t border-line pt-5">
            <h3 className="mb-4 text-lg font-semibold">Send for repair</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Team" required>
                <select value={form.team} onChange={(e) => update({
              team: e.target.value,
              assignee: qcTeams.find((t) => t.team === e.target.value)?.lead ?? ''
            })} className={inputClass}>
                  {qcTeams.map((t) => <option key={t.team}>{t.team}</option>)}
                </select>
              </Field>
              <Field label="Who will fix it" required>
                <select value={form.assignee} onChange={(e) => update({
              assignee: e.target.value
            })} className={inputClass}>
                  {members.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Fix by" required>
                <input type="date" value={form.due} min={TODAY_ISO} onChange={(e) => update({
              due: e.target.value
            })} className={inputClass} />
              </Field>
            </div>
          </div>
        </section>}
    </div>;
}