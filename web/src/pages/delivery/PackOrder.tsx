import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PackageSearchIcon, PrinterIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { DeliveryStateBadge } from '../../components/delivery/DeliveryStateBadge';
import { DestinationBanner } from '../../components/delivery/DestinationBanner';
import { DriverPicker } from '../../components/delivery/DriverPicker';
import { PackChecklist } from '../../components/delivery/PackChecklist';
import { ReportMissingModal } from '../../components/delivery/ReportMissingModal';
import { OrderStepRail } from '../../components/new-order/OrderStepRail';
import { PackageLabelModal } from '../../components/packages/PackageLabelModal';
import { PackageQr } from '../../components/packages/PackageCode';
import { Button, buttonClass } from '../../components/ui/Button';
import { ContextHeader } from '../../components/ui/ContextHeader';
import { InfoCard, InfoLine } from '../../components/ui/InfoCard';
import { useApp } from '../../contexts/AppContext';
import { usePackages } from '../../contexts/PackagesContext';
import { RUNNERS } from '../../data/packages';
import { cn } from '../../utils/cn';
import { fmtDate, fmtDateTime } from '../../utils/format';
import { atPacking, garmentNames, pieceCount } from '../../utils/packages';
import { pageClass } from '../../utils/styles';
const STEPS = [{
  key: 'items',
  label: 'Check items'
}, {
  key: 'label',
  label: 'Print label'
}, {
  key: 'driver',
  label: 'Assign driver'
}] as const;

/** Logistics packs an order in three steps, laid out like the order form. Presence check only — not QC. */
export function PackOrder() {
  const {
    id = ''
  } = useParams();
  const navigate = useNavigate();
  const {
    getOrder,
    customerName
  } = useApp();
  const {
    getPackage,
    isLogistics,
    toggleItem,
    markPacked,
    reportMissingAtPacking,
    resolveProblem
  } = usePackages();
  const [step, setStep] = useState(0);
  const [printed, setPrinted] = useState(false);
  const [attached, setAttached] = useState(false);
  const [driver, setDriver] = useState<string>(RUNNERS[0]);
  const [labelOpen, setLabelOpen] = useState(false);
  const [missingOpen, setMissingOpen] = useState(false);
  const p = getPackage(id);
  useEffect(() => {
    setStep(0);
    setPrinted(false);
    setAttached(false);
  }, [id]);
  if (!p) {
    return <div className={pageClass}>
        <div className="mx-auto mt-16 max-w-sm text-center">
          <PackageSearchIcon className="mx-auto h-10 w-10 text-ink-subtle" strokeWidth={1.5} />
          <h1 className="mt-4 text-xl font-semibold">Shipment not found</h1>
          <Link to="/packing" className={buttonClass('primary', 'lg', 'mt-6')}>Back to Shipments</Link>
        </div>
      </div>;
  }
  if (!atPacking(p)) return <Navigate to={`/shipments/${p.id}`} replace />;
  const o = getOrder(p.orderId);
  const customer = o ? customerName(o.customerId) : '';
  const onHold = p.status === 'Problem';
  const editable = !onHold && isLogistics;
  const checked = p.checked?.length ?? 0;
  const allChecked = checked === p.items.length;
  const isLast = step === STEPS.length - 1;
  const maxStep = !allChecked || onHold ? 0 : !attached ? 1 : 2;
  const pct = (step + 1) / STEPS.length * 100;
  const issue = (i: number) => i === 0 ? onHold ? 'Packing is on hold — resolve the missing item first.' : !allChecked ? `Tick every item first · ${checked} of ${p.items.length} checked.` : null : i === 1 && !attached ? 'Print the label and confirm it’s attached.' : null;
  const next = () => {
    const err = issue(step);
    if (err) {
      toast.error(err);
      return;
    }
    if (isLast) {
      markPacked(p.id, driver || undefined);
      navigate(`/shipments/${p.id}`);
      return;
    }
    setStep(step + 1);
  };
  const toggle = (itemId: string) => {
    if ((p.checked ?? []).includes(itemId)) {
      setPrinted(false);
      setAttached(false);
    }
    toggleItem(p.id, itemId);
  };
  const content = () => {
    if (step === 0) return <div className="space-y-5">
        <h2 className="text-[22px] font-semibold">Check items</h2>
        {onHold && p.problem && <div role="alert" className="flex items-start gap-3 rounded-2xl bg-critical-soft p-5 ring-1 ring-inset ring-critical/30">
            <TriangleAlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-critical" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-critical">Packing on hold · {p.problem.note} missing</p>
              <p className="mt-0.5 text-sm text-ink-muted">{p.problem.by} · {fmtDateTime(p.problem.at)}</p>
              {isLogistics && <Button variant="secondary" className="mt-3" onClick={() => resolveProblem(p.id)}>Item found — resume packing</Button>}
            </div>
          </div>}
        {p.instructions && <p className="rounded-xl bg-surface px-4 py-3 text-[15px] ring-1 ring-inset ring-line"><span className="font-medium">Instructions · </span><span className="text-ink-muted">{p.instructions}</span></p>}
        <PackChecklist p={p} editable={editable} onToggle={toggle} />
        {editable && !allChecked && <button type="button" onClick={() => setMissingOpen(true)} className="h-10 rounded-lg text-[15px] font-medium text-critical hover:underline">Something missing?</button>}
      </div>;
    if (step === 1) return <div className="space-y-5">
        <h2 className="text-[22px] font-semibold">Print label</h2>
        <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-soft sm:flex-row sm:items-center">
          <PackageQr value={p.id} size={112} />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xl font-semibold">{p.id}</p>
            <p className="text-[15px] text-ink-muted">{p.destination.name} · {p.items.length} item{p.items.length > 1 ? 's' : ''}</p>
            <Button className="mt-4" variant={printed ? 'secondary' : 'primary'} icon={<PrinterIcon className="h-4 w-4" />} onClick={() => {
            setPrinted(true);
            setLabelOpen(true);
          }}>{printed ? 'Reprint label' : 'Print package QR label'}</Button>
          </div>
        </div>
        <button type="button" role="checkbox" aria-checked={attached} disabled={!printed} onClick={() => setAttached((v) => !v)} className={cn('flex min-h-[64px] w-full items-center gap-4 rounded-xl px-4 py-3 text-left ring-1 ring-inset transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50', attached ? 'bg-success-soft ring-success/30' : 'bg-surface ring-line hover:bg-canvas')}>
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2', attached ? 'border-success bg-success text-white' : 'border-line-strong bg-surface')} aria-hidden>
            {attached && <CheckIcon className="h-5 w-5" strokeWidth={3} />}
          </span>
          <span className="text-[17px] font-semibold">Label attached to the package</span>
        </button>
      </div>;
    return <div className="space-y-5">
        <h2 className="text-[22px] font-semibold">Assign driver</h2>
        <DriverPicker value={driver} onChange={setDriver} allowLater />
      </div>;
  };
  return <div className="flex min-h-full bg-canvas">
      <aside className="hidden w-[232px] shrink-0 border-r border-line md:block">
        <div className="sticky top-0">
          <div className="px-3 pt-4">
            <Link to="/packing" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-ink-muted hover:bg-sunken hover:text-ink"><XIcon className="h-4 w-4" /> Close</Link>
          </div>
          <OrderStepRail title="Pack order" subtitle={p.orderId} step={step} maxStep={maxStep} onStep={setStep} steps={STEPS} ariaLabel="Packing steps" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur">
          <div className="mx-auto w-full max-w-[1200px] px-4 pt-5 md:px-8">
            <div className="mb-2 flex items-center gap-3 md:hidden">
              <Link to="/packing" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-sunken" aria-label="Close"><XIcon className="h-5 w-5" /></Link>
              <p className="flex-1 truncate text-[15px] font-semibold">Pack order</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="tabular text-ink-muted">Step {step + 1} of {STEPS.length}</span>
              {!isLast && <span className="text-ink-muted">Next: {STEPS[step + 1].label}</span>}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Packing progress">
              <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out" style={{
              width: `${pct}%`
            }} />
            </div>
            <div className="mt-4 border-b border-line pb-4">
              <ContextHeader title={customer || p.orderId} meta={<><span className="font-mono">{p.orderId}</span> · {garmentNames(p)}</>} due={p.deadline} badges={<DeliveryStateBadge p={p} />} />
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1200px] flex-1 gap-8 px-4 pb-8 pt-6 md:px-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="mb-4 xl:hidden"><DestinationBanner destination={p.destination} label={p.destination.kind === 'store' ? 'Pack for' : 'Home delivery to'} /></div>
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
              ease: [0.23, 1, 0.32, 1]
            }}>
                {content()}
              </motion.div>
            </AnimatePresence>
          </div>
          <aside className="hidden xl:block">
            <div className="sticky top-[150px] space-y-4">
              <DestinationBanner destination={p.destination} label={p.destination.kind === 'store' ? 'Pack for' : 'Home delivery to'} />
              <InfoCard title="Summary">
                <dl className="space-y-1.5 text-[15px]">
                  <InfoLine k="Items checked" v={`${checked} of ${p.items.length}`} tone={allChecked ? 'text-success font-medium' : undefined} />
                  <InfoLine k="Pieces" v={pieceCount(p)} />
                  <InfoLine k="Label" v={attached ? 'Attached' : printed ? 'Printed' : '—'} />
                  <InfoLine k="Driver" v={step === 2 ? driver || 'Later' : '—'} />
                  <InfoLine k="Deliver by" v={fmtDate(p.deadline, 'EEE d MMM')} />
                </dl>
              </InfoCard>
            </div>
          </aside>
        </div>

        {isLogistics && <div className="sticky bottom-0 z-20 border-t border-line bg-surface">
            <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 py-3 md:px-8">
              <Button variant="ghost" size="lg" icon={<ArrowLeftIcon className="h-5 w-5" />} onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Back</Button>
              <span className="flex-1" />
              <Button size="lg" onClick={next} disabled={onHold} iconRight={isLast ? <CheckIcon className="h-5 w-5" /> : <ArrowRightIcon className="h-5 w-5" />}>
                {isLast ? driver ? 'Mark packed & send out' : 'Mark packed' : 'Continue'}
              </Button>
            </div>
          </div>}
      </div>

      <ReportMissingModal p={p} open={missingOpen} onClose={() => setMissingOpen(false)} onSubmit={(ids, note) => {
      reportMissingAtPacking(p.id, ids, note);
      setMissingOpen(false);
      setPrinted(false);
      setAttached(false);
    }} />
      <PackageLabelModal p={labelOpen ? p : null} onClose={() => setLabelOpen(false)} />
    </div>;
}