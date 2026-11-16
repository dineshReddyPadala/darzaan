import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { ClipboardListIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { scanHomeFor } from '../../utils/packages';
import { actsOnGarment, canAccess, canOpenOrder, orderLink, workPathFor } from '../../utils/roles';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
export function ScannerDialog({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const [code, setCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [preview, setPreview] = useState<HTMLVideoElement | null>(null);
  const resolveRef = useRef<(value: string) => void>(() => undefined);
  const {
    getOrder,
    orders,
    customerName,
    role,
    roleDef,
    user
  } = useApp();
  const navigate = useNavigate();
  /** A scan goes straight to where this role acts on the tag. */
  const targetFor = (v: string): string | null => {
    if (v.startsWith('FAB-') || v.startsWith('TRM-') || v.startsWith('SMP-')) {
      return canAccess(role, 'inventory') ? v.startsWith('SMP-') ? '/inventory?tab=embroidery' : `/inventory?q=${v}` : null;
    }
    // Package labels go to the screen where this persona acts on them.
    const scanHome = scanHomeFor(role);
    if (v.startsWith('PKG-')) {
      if (scanHome) return `${scanHome}?code=${v}`;
      const orderId = `DZ-${v.split('-')[1]}`;
      return getOrder(orderId) ? orderLink(role, orderId, 'workflow') : null;
    }
    // Bag tags are ORDER-GARMENT (DZ-10297-G1); plain tags are the order id, including numeric ids.
    const orderId = v.startsWith('DZ-') ? v.split('-').slice(0, 2).join('-') : v;
    const order = getOrder(orderId);
    if (order) {
      if (!canOpenOrder(role)) return scanHome ? `${scanHome}?code=${order.id}` : null;
      const mine = order.garments.find((g) => actsOnGarment(role, user.name, g));
      if (mine && roleDef.orderSheet) return workPathFor(mine.stage, order.id);
      return orderLink(role, order.id);
    }
    if (v.startsWith('DZ-') || /^\d+$/.test(v)) return null;
    return canAccess(role, 'orders') ? `/orders?q=${v}` : null;
  };
  const resolve = (value: string) => {
    const v = value.trim().toUpperCase();
    if (!v) return;
    const orderCode = v.startsWith('DZ-') ? v.split('-').slice(0, 2).join('-') : v;
    const order = v.startsWith('FAB-') || v.startsWith('TRM-') || v.startsWith('SMP-') || v.startsWith('PKG-') ? undefined : getOrder(orderCode);
    if (order) toast.success(order.status, { description: order.id });
    else if (v.startsWith('DZ-') || /^\d+$/.test(v)) {
      toast.error('No order for that code', { description: v });
      return;
    }
    const to = targetFor(v);
    if (!to) {
      toast.error('Not part of your role', {
        description: `${roleDef.label} can’t open ${v}.`
      });
      return;
    }
    onClose();
    navigate(to);
    setCode('');
  };
  resolveRef.current = resolve;

  useEffect(() => {
    if (!open) setCameraError(null);
  }, [open]);

  useEffect(() => {
    if (!open || !preview) return;
    let stopped = false;
    let controls: IScannerControls | undefined;
    const reader = new BrowserMultiFormatReader();
    const onResult = (result: { getText: () => string } | undefined, _error?: unknown, ctrl?: IScannerControls) => {
      if (ctrl) controls = ctrl;
      if (stopped || !result) return;
      stopped = true;
      ctrl?.stop();
      resolveRef.current(result.getText());
    };
    reader.decodeFromVideoDevice(undefined, preview, onResult).then((ctrl) => {
      controls = ctrl;
      if (stopped) ctrl.stop();
    }).catch(() => {
      if (!stopped) setCameraError('The camera is not available. Type the code instead.');
    });
    return () => {
      stopped = true;
      controls?.stop();
      const stream = preview.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
      preview.srcObject = null;
    };
  }, [open, preview]);

  useEffect(() => {
    if (!open) return;
    let buf = '';
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key === 'Enter' && (buf.length > 3 || /^\d+$/.test(buf))) {
        resolveRef.current(buf);
        buf = '';
      } else if (event.key.length === 1) buf += event.key;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  const visibleTags = orders.slice(0, 4).map((o) => ({
    code: o.id,
    label: `Order — ${customerName(o.customerId)}`,
    icon: ClipboardListIcon
  })).filter((t) => targetFor(t.code));
  return <Modal open={open} onClose={onClose} title="Scan QR or barcode" description="Point the camera at an order tag, fabric swatch or sampler.">
      <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink">
        <video ref={setPreview} className="h-full w-full object-cover" muted playsInline autoPlay />
        <p className="absolute inset-x-0 bottom-4 text-center text-sm text-white/80">{cameraError ?? 'Point the camera at the order barcode'}</p>
      </div>
      <form className="mt-5 flex gap-2" onSubmit={(e) => {
      e.preventDefault();
      resolve(code);
    }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Or type a code" className={inputClass} aria-label="Code" />
        <Button type="submit">Open</Button>
      </form>
      {visibleTags.length > 0 && <p className="mb-2 mt-6 text-sm font-medium text-ink-muted">Tap a tag to simulate a scan</p>}
      <div className={visibleTags.length ? 'divide-y divide-line rounded-xl border border-line' : 'hidden'}>
        {visibleTags.map((t) => <button key={t.code} onClick={() => resolve(t.code)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-canvas">
            <t.icon className="h-5 w-5 text-ink-subtle" />
            <span className="flex-1 text-[15px]">{t.label}</span>
            <span className="font-mono text-sm text-ink-muted">{t.code}</span>
          </button>)}
      </div>
    </Modal>;
}