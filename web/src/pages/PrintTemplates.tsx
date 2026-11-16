import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react';
import { WorkerDesignCopy } from '../components/print/WorkerDesignCopy';
import { Button } from '../components/ui/Button';

/** /printtemplates — blank A4 print templates, filled in by hand. The toolbar is hidden when printing. */
export function PrintTemplates() {
  return <div className="min-h-full w-full bg-[#e9e6de] pb-12 print:bg-white print:pb-0">
      <div className="print-hidden sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink" aria-label="Back to app">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-[17px] font-semibold leading-tight">Worker design copy</h1>
              <p className="text-sm text-ink-muted">A4 · portrait · blank, fill in by hand</p>
            </div>
          </div>
          <Button size="lg" icon={<PrinterIcon className="h-5 w-5" />} onClick={() => window.print()}>Print</Button>
        </div>
      </div>
      <div className="mt-8 print:mt-0">
        <WorkerDesignCopy />
      </div>
    </div>;
}