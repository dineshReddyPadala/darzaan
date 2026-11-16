import React from 'react';
import { PrinterIcon } from 'lucide-react';
import type { PackageRecord } from '../../types/packaging';
import { fmtDate } from '../../utils/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Barcode, PackageQr } from './PackageCode';

/** The label stuck on the box — one QR per physical package. */
export function PackageLabelModal({
  p,
  onClose



}: {p: PackageRecord | null;onClose: () => void;}) {
  return <Modal open={!!p} onClose={onClose} title="Package label" footer={<>
      <Button variant="ghost" onClick={onClose}>Close</Button>
      <Button icon={<PrinterIcon className="h-4 w-4" />} onClick={() => window.print()}>Print label</Button>
    </>}>
      {p && <div className="mx-auto max-w-sm rounded-xl border-2 border-dashed border-line-strong p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xl font-bold">{p.id}</p>
              <p className="text-sm text-ink-muted">Order <span className="font-mono">{p.orderId}</span> · {p.items.length} item{p.items.length > 1 ? 's' : ''}</p>
            </div>
            <PackageQr value={p.id} size={88} />
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-xs text-ink-muted">{p.destination.kind === 'store' ? 'Deliver to store' : 'Home delivery'}</p>
            <p className="text-[15px] font-semibold">{p.destination.name}</p>
            <p className="text-sm text-ink-muted">{p.destination.detail}</p>
          </div>
          <p className="mt-3 text-sm"><span className="text-ink-muted">Deliver by </span><span className="font-medium">{fmtDate(p.deadline, 'EEE d MMM')}</span></p>
          <div className="mt-4"><Barcode value={p.id} height={44} /></div>
        </div>}
      <p className="mt-4 text-center text-xs text-ink-subtle">Demo — no label printer is connected. Print opens the browser print dialog.</p>
    </Modal>;
}