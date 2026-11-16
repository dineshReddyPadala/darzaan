import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SendIcon, XIcon } from 'lucide-react';
import { OrderStepRail } from '../../components/new-order/OrderStepRail';
import { InspectGarmentStep } from '../../components/qc/InspectGarmentStep';
import { InspectMeasureStep } from '../../components/qc/InspectMeasureStep';
import { InspectQualityStep } from '../../components/qc/InspectQualityStep';
import { InspectReviewStep, useRepairForm } from '../../components/qc/InspectReviewStep';
import { QcMissing } from '../../components/qc/QcScreen';
import { PriorityBadge } from '../../components/qc/QcStatus';
import { Button } from '../../components/ui/Button';
import { useQc } from '../../contexts/QcContext';
import { qcChecklist } from '../../data/production';
import { NEXT_AFTER_QC, qcPriority, useQcGarment } from '../../hooks/useQcGarment';
import { cn } from '../../utils/cn';
import { dueLabel, fmtDate } from '../../utils/format';
import { ContextHeader } from '../../components/ui/ContextHeader';
import { garmentDue, stageLabel } from '../../utils/orders';
import { measurementFindings, measurementVerdict } from '../../utils/qc';
const STEPS = [{
  key: 'garment',
  label: 'Check garment'
}, {
  key: 'measure',
  label: 'Check measurements'
}, {
  key: 'quality',
  label: 'Check quality'
}, {
  key: 'result',
  label: 'Review result'
}] as const;
const ease = [0.23, 1, 0.32, 1] as const;

/** One inspection flow — first checks and checks after repair use the same four steps. */
export function QcInspectionPage() {
  const {
    orderId,
    garmentId
  } = useParams();
  const [params] = useSearchParams();
  const {
    tolerance
  } = useQc();
  const qc = useQcGarment(orderId, garmentId);
  const initial = Math.min(STEPS.length - 1, Math.max(0, Number(params.get('step') ?? 0)));
  const [step, setStep] = useState(initial);
  const [maxStep, setMaxStep] = useState(initial);
  const findings = qc.garment ? measurementFindings(qc.garment.measurements, qc.draft.actuals, tolerance) : [];
  const verdict = measurementVerdict(findings);
  const repair = useRepairForm(qc, findings, tolerance);

  // Measurements decide themselves from the numbers; no sizes means N/A.
  const target = !findings.length ? 'na' : verdict ?? undefined;
  useEffect(() => {
    if (!qc.garment || qc.draft.results.measurements === target) return;
    qc.setDraft((d) => {
      const results = {
        ...d.results
      };
      if (target) results.measurements = target;else delete results.measurements;
      return {
        ...d,
        results
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, qc.garment?.id]);
  if (!qc.order || !qc.garment) return <QcMissing />;
  const {
    order: o,
    garment: g,
    customer
  } = qc;
  const isLast = step === STEPS.length - 1;
  const next = stageLabel(NEXT_AFTER_QC);
  const qualityLeft = qcChecklist.filter((c) => c.key !== 'measurements' && !qc.draft.results[c.key]).length;
  const failedNoNote = qc.failed.filter((c) => c.key !== 'measurements' && !qc.draft.notes?.[c.key]?.trim());
  const go = (i: number) => {
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
    document.getElementById('main-scroll')?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const forward = () => {
    if (step === 1 && findings.length && !verdict) return toast.error('Measure every size first.');
    if (step === 2 && qualityLeft) return toast.error(`${qualityLeft} item${qualityLeft > 1 ? 's' : ''} still to check.`);
    if (step === 2 && failedNoNote.length) return toast.error(`Add a short note for ${failedNoNote[0].label}.`);
    go(step + 1);
  };
  const primary = !isLast ? <Button size="lg" onClick={forward} iconRight={<ArrowRightIcon className="h-5 w-5" />}>{step === 0 ? qc.round > 1 ? 'Start check again' : 'Start inspection' : 'Continue'}</Button> : qc.failed.length ? <Button size="lg" variant="danger" disabled={!repair.ready} onClick={repair.send} icon={<SendIcon className="h-5 w-5" />}>Send for repair</Button> : <Button size="lg" disabled={!qc.complete} onClick={qc.pass} icon={<CheckIcon className="h-5 w-5" />}>Pass · send to {next}</Button>;
  return <div className="flex min-h-full bg-canvas">
      <aside className="hidden w-[232px] shrink-0 border-r border-line md:block">
        <div className="sticky top-0">
          <div className="px-3 pt-4">
            <Link to="/qc" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-ink-muted hover:bg-sunken hover:text-ink">
              <XIcon className="h-4 w-4" /> Close
            </Link>
          </div>
          <OrderStepRail title={qc.round > 1 ? 'Check after repair' : 'Inspection'} subtitle={o.id} step={step} maxStep={maxStep} onStep={go} steps={STEPS} ariaLabel="Inspection steps" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur">
          <div className="mx-auto w-full max-w-[1100px] px-4 pt-5 md:px-8">
            <div className="mb-3 flex items-center gap-3 md:hidden">
              <Link to="/qc" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-sunken" aria-label="Close"><XIcon className="h-5 w-5" /></Link>
              <p className="flex-1 truncate text-[15px] font-semibold">{STEPS[step].label}</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted tabular">Step {step + 1} of {STEPS.length}</span>
              {!isLast && <span className="text-ink-muted">Next: {STEPS[step + 1].label}</span>}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Inspection progress">
              <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out" style={{
              width: `${(step + 1) / STEPS.length * 100}%`
            }} />
            </div>
            {/* Order and garment — visible on every step */}
            <div className="mt-4 border-b border-line pb-4">
              <ContextHeader title={g.subCategory} meta={<><span className="font-mono">{o.id}</span> · {customer?.name ?? '—'}</>} due={garmentDue(o, g)} badges={<PriorityBadge p={qcPriority(o, g)} />} />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 pb-8 pt-6 md:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{
            opacity: 0,
            y: 6
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -6
          }} transition={{
            duration: 0.18,
            ease
          }}>
              {step === 0 && <InspectGarmentStep qc={qc} />}
              {step === 1 && <InspectMeasureStep qc={qc} findings={findings} verdict={verdict} tolerance={tolerance} />}
              {step === 2 && <InspectQualityStep qc={qc} />}
              {step === 3 && <InspectReviewStep qc={qc} repair={repair} nextStage={next} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-line bg-surface">
          <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3 px-4 py-3 md:px-8">
            <Button variant="ghost" size="lg" icon={<ArrowLeftIcon className="h-5 w-5" />} onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
            <span className="flex-1" />
            {primary}
          </div>
        </div>
      </div>
    </div>;
}