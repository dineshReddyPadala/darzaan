import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, FileTextIcon, XIcon } from 'lucide-react';
import { OrderStepRail } from '../components/new-order/OrderStepRail';
import { OrderSummaryPanel } from '../components/new-order/OrderSummaryPanel';
import { StepCustomer } from '../components/new-order/StepCustomer';
import { StepGarments } from '../components/new-order/StepGarments';
import { StepPayment } from '../components/new-order/StepPayment';
import { StepPricing } from '../components/new-order/StepPricing';
import { StepReview } from '../components/new-order/StepReview';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ContextHeader } from '../components/ui/ContextHeader';
import { STEPS, useNewOrder } from '../hooks/useNewOrder';
import { cn } from '../utils/cn';
import { inr } from '../utils/format';
export function NewOrder() {
  const o = useNewOrder();
  const navigate = useNavigate();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const current = STEPS[o.step];
  const isLast = o.step === STEPS.length - 1;
  const title = o.quote ? `Resume quote` : o.quoteMode ? 'New draft quote' : 'New order';
  const subtitle = o.quote ? o.quote.id : o.customer?.name;
  const pct = (o.step + 1) / STEPS.length * 100;
  const scrollTop = () => document.getElementById('main-scroll')?.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  const next = async () => {
    const issue = o.stepIssue(current.key);
    if (issue) {
      o.setBlocked(current.key);
      toast.error(issue);
      return;
    }
    o.setBlocked(null);
    if (o.returnToReview && o.step < o.reviewIndex) {
      o.setReturnToReview(false);
      o.setStep(o.reviewIndex);
      scrollTop();
      return;
    }
    if (isLast) {
      for (const s of STEPS) {
        const i = o.stepIssue(s.key);
        if (i) {
          toast.error(i);
          o.setStep(STEPS.indexOf(s));
          return;
        }
      }
      const id = await o.confirm();
      if (!id) return;
      navigate(`/orders/${id}/confirmed`);
      return;
    }
    o.goTo(o.step + 1);
    scrollTop();
  };
  const saveQuote = () => {
    const id = o.saveAsQuote();
    if (!id) {
      toast.error('Select a customer before saving a quote.');
      o.setStep(0);
      return;
    }
    toast.success(`Draft quote ${id} saved`, {
      description: 'Resume any time from Orders → Draft quotes.'
    });
    navigate('/orders?tab=quotes');
  };
  const stepContent = () => {
    switch (current.key) {
      case 'customer':
        return <StepCustomer o={o} />;
      case 'garments':
        return <StepGarments o={o} />;
      case 'pricing':
        return <StepPricing o={o} />;
      case 'payment':
        return <StepPayment o={o} />;
      default:
        return <StepReview o={o} />;
    }
  };
  return <div className="flex min-h-full bg-canvas">
      {/* Left rail — vertical stepper (tablet landscape and up) */}
      <aside className="hidden w-[232px] shrink-0 border-r border-line md:block">
        <div className="sticky top-0">
          <div className="px-3 pt-4">
            <Link to="/orders" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-ink-muted hover:bg-sunken hover:text-ink">
              <XIcon className="h-4 w-4" /> Close
            </Link>
          </div>
          <OrderStepRail title={title} subtitle={subtitle} step={o.step} maxStep={o.maxStep} onStep={(i) => {
          o.setReturnToReview(false);
          o.setStep(i);
          scrollTop();
        }} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Progress header */}
        <div className="sticky top-0 z-20 bg-canvas/95 backdrop-blur">
          <div className="mx-auto w-full max-w-[1200px] px-4 pt-5 md:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <Link to="/orders" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-sunken" aria-label="Close">
                <XIcon className="h-5 w-5" />
              </Link>
              <p className="flex-1 truncate text-[15px] font-semibold">{title}</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted tabular">Step {o.step + 1} of {STEPS.length}</span>
              {!isLast && <span className="text-ink-muted">Next: {o.returnToReview && o.step < o.reviewIndex ? 'Review' : STEPS[o.step + 1].label}</span>}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={o.step + 1} aria-valuemin={1} aria-valuemax={STEPS.length} aria-label="Order progress">
              <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out" style={{
              width: `${pct}%`
            }} />
            </div>
            <div className="mt-4 border-b border-line pb-4">
              <ContextHeader title={o.customer?.name ?? 'No customer yet'} meta={<>
                  {o.quote && <><span className="font-mono">{o.quote.id}</span> · </>}
                  {o.garments.some((g) => g.subCategory) ? o.garments.map((g) => g.subCategory).filter(Boolean).join(', ') : `${o.garments.length} garment${o.garments.length > 1 ? 's' : ''}`} · {inr(o.totals.total)}
                </>} due={o.customer ? o.deliveryDate : undefined} badges={o.garments.some((g) => g.urgency !== 'Regular') ? <Badge tone="critical" dot>Express</Badge> : undefined} />
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1200px] flex-1 gap-8 px-4 pb-8 pt-6 md:px-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-xs text-ink-subtle tabular">{String(o.step + 1).padStart(2, '0')}</p>
            <div className="mb-4 xl:hidden">
              <button onClick={() => setSummaryOpen(!summaryOpen)} className="mt-2 flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-5 py-3.5" aria-expanded={summaryOpen}>
                <span className="text-[15px] font-medium">{o.garments.length} garment{o.garments.length > 1 ? 's' : ''} · {o.customer?.name ?? 'No customer'}</span>
                <span className="flex items-center gap-2 text-[15px] font-semibold tabular">
                  {inr(o.totals.total)} <ChevronDownIcon className={cn('h-4 w-4 transition-transform duration-150 ease-out', summaryOpen && 'rotate-180')} />
                </span>
              </button>
              {summaryOpen && <div className="mt-2"><OrderSummaryPanel o={o} /></div>}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={current.key} initial={{
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
                {stepContent()}
              </motion.div>
            </AnimatePresence>
          </div>
          <aside className="hidden xl:block">
            <div className="sticky top-[84px]">
              <OrderSummaryPanel o={o} />
            </div>
          </aside>
        </div>

        <div className="sticky bottom-0 z-20 border-t border-line bg-surface">
          <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 px-4 py-3 md:px-8">
            <Button variant="ghost" size="lg" icon={<ArrowLeftIcon className="h-5 w-5" />} onClick={() => {
            o.setReturnToReview(false);
            o.setStep(Math.max(0, o.step - 1));
          }} disabled={o.step === 0}>
              Back
            </Button>
            <span className="flex-1" />
            <Button variant="secondary" size="lg" icon={<FileTextIcon className="h-5 w-5" />} onClick={saveQuote}>
              Save as draft
            </Button>
            <Button size="lg" onClick={next} iconRight={isLast ? <CheckIcon className="h-5 w-5" /> : <ArrowRightIcon className="h-5 w-5" />}>
              {isLast ? `Confirm order · ${inr(o.totals.total)}` : o.returnToReview && o.step < o.reviewIndex ? 'Save & back to review' : `Continue`}
            </Button>
          </div>
        </div>
      </div>
    </div>;
}